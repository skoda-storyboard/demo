#!/usr/bin/env node
/*
 * build-media-items.mjs - SKODA-608: generate the media feed (en/media-feed.json).
 *
 *   npm run media-items:build -- [--out <dir>] [--cache <dir>] [--offline] [--dry-run] [--push]
 *   npm run media-items:build -- --feed <sheet.json> --push [--out <dir>]
 *
 * AEM Assets is the source of truth for images/videos (docs/architecture/
 * SKODA-MEDIA-ITEMS-OPTIONS.md, option B): no page per item. This M1 generator builds the
 * feed from the server-rendered source listings (`ajax_search_results_<type>=N` renders N
 * cards; many attachment pages 404, the cards don't), resolves `years-<termId>` classes by
 * probing each year filter, takes Vimeo posters from oEmbed and skips domain-restricted
 * videos. The M2 sync job writes the same rows from published AEM Assets. Writes:
 *   <out>/en/media-feed.json                 the DA sheet (query-index shape, `:type: sheet`)
 *   tools/importer/media-items/items.json    committed record (id, template, title, date, source)
 * `--push` puts the card thumbnails on the Media Bus (carrier documents under /en/fragments/,
 * previewed + published: a sheet's images are not ingested), rewrites `image` to their
 * `media_<hash>` paths, then uploads the sheet to DA and previews + publishes it. Without
 * `--push` the written sheet keeps the source thumbnail URLs. `--feed` skips the source build
 * and re-publishes an existing sheet (e.g. the DA source) with Media Bus thumbnails. The
 * listing and story-rail blocks read it via their `index: /en/media-feed.json` config row.
 * Download URLs are stable CDN URLs (/direct-download/ redirects to a presigned S3 URL).
 */

import {
  readFileSync, writeFileSync, mkdirSync, existsSync,
} from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import {
  SOURCE_ORIGIN, facetOptions, parseCards, mergeItems, feedSheet, yearIds, vimeoPoster,
  detailRequest, ajaxNonce, parseDetailPanel, parseAssetLinks, assetItem, requiredDetails,
  detailGaps, unknownGaps, feedCoverageGaps,
  feedThumbnails, carrierDocs, parseCarrier, withMediaBus,
} from './media-items-lib.mjs';
import { uploadToDA } from '../media/media-lib.mjs';
import { readLists } from '../build-link-allowlist.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128 Safari/537.36';
const ORG = 'skoda-storyboard';
const REPO = 'demo';
const FEED_PATH = 'en/media-feed.json';

export function loadJSDOM() {
  const tries = ['/home/node/.excat-marketplaces/excat-marketplace/excat/hooks/import-validator/', import.meta.url];
  for (const base of tries) {
    try {
      // eslint-disable-next-line import/no-unresolved
      return createRequire(base)('jsdom').JSDOM;
    } catch (e) { /* next */ }
  }
  throw new Error('jsdom not found (resolved from the import-validator toolchain, like the importer tests)');
}

function parseArgs(argv) {
  const a = {
    out: path.join(ROOT, 'content'),
    cache: path.join(ROOT, '.migration/work/608/cache'),
    offline: false,
    dryRun: false,
    push: false,
    allowIncomplete: false,
    feed: '',
  };
  for (let i = 0; i < argv.length; i += 1) {
    const k = argv[i];
    const v = () => { i += 1; return argv[i]; };
    if (k === '--out') a.out = path.resolve(v());
    else if (k === '--cache') a.cache = path.resolve(v());
    else if (k === '--offline') a.offline = true;
    else if (k === '--dry-run') a.dryRun = true;
    else if (k === '--push') a.push = true;
    else if (k === '--allow-incomplete') a.allowIncomplete = true;
    else if (k === '--feed') a.feed = path.resolve(v());
    else throw new Error(`unknown flag ${k}`);
  }
  if (a.feed && !a.push) throw new Error('--feed re-publishes an existing sheet: it needs --push');
  return a;
}

/** Source listing URL for a query `{ type, filter: {tax: value}, n }`. */
export function listingUrl({ type, filter = {}, n = 12 }) {
  const u = new URL(`${SOURCE_ORIGIN}/en/${type === 'image' ? 'images' : 'videos'}/`);
  Object.entries(filter).forEach(([tax, value]) => u.searchParams.append(`filter[${tax}][]`, value));
  u.searchParams.set(`ajax_search_results_${type}`, String(n));
  return u.toString();
}

async function fetchText(url, cacheDir, offline) {
  const key = url.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '_').slice(0, 180);
  const file = path.join(cacheDir, `${key}.html`);
  if (existsSync(file)) return readFileSync(file, 'utf8');
  if (offline) throw new Error(`offline and not cached: ${url}`);
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    // eslint-disable-next-line no-await-in-loop
    const res = await fetch(url, { headers: { 'user-agent': UA } });
    if (res.ok) {
      // eslint-disable-next-line no-await-in-loop
      const body = await res.text();
      mkdirSync(cacheDir, { recursive: true });
      writeFileSync(file, body);
      return body;
    }
    if (res.status < 500 && res.status !== 429) throw new Error(`${res.status} ${url}`);
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => { setTimeout(r, 1000 * attempt); });
  }
  throw new Error(`failed ${url}`);
}

/** POST a form to the source (no cache: callers decide what is worth caching). */
async function postForm(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'user-agent': UA, 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    body,
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

/** A fresh ajax nonce from a live listing page (the cached one may have expired). */
async function freshNonce() {
  const res = await fetch(listingUrl({ type: 'image', n: 1 }), { headers: { 'user-agent': UA } });
  return res.ok ? ajaxNonce(await res.text()) : '';
}

/**
 * One item's source detail panel, validated: a cached panel is used only when it carries the
 * item's required fields; otherwise it is fetched again (3 attempts, a fresh nonce after the
 * first). Only a complete panel is cached, so an empty 200 (the source sometimes answers with
 * `items_current: 0`) never sticks. Returns the parsed panel document, or null.
 */
async function fetchDetail(JSDOM, item, ctx) {
  const file = path.join(ctx.cacheDir, `detail_${item.id}.json`);
  const required = requiredDetails(item);
  const parse = (text) => {
    const doc = new JSDOM(JSON.parse(text).html || '').window.document;
    const panel = parseDetailPanel(doc);
    return { doc, complete: required.every((f) => panel[f]) };
  };
  let last = null;
  if (existsSync(file)) {
    try {
      last = parse(readFileSync(file, 'utf8'));
      if (last.complete) return last.doc;
    } catch (e) { /* unreadable cache: fetch again */ }
  }
  if (ctx.offline) return last ? last.doc : null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      if (attempt > 1) ctx.nonce = (await freshNonce()) || ctx.nonce;
      const { url, body } = detailRequest(item.id, ctx.nonce);
      // eslint-disable-next-line no-await-in-loop
      const text = await postForm(url, body);
      last = parse(text);
      if (last.complete) {
        mkdirSync(ctx.cacheDir, { recursive: true });
        writeFileSync(file, text);
        return last.doc;
      }
    } catch (e) { /* retry */ }
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => { setTimeout(r, 750 * attempt); });
  }
  return last ? last.doc : null;
}

/**
 * The lightbox detail panel of every item (media-item shape 4): the source colorbox loads it
 * per item (`image-overlay-meta-data`). A related article that is a demo page links there.
 */
async function addDetails(JSDOM, items, ctx) {
  const demo = new Set(readLists().paths);
  for (const item of items) {
    // eslint-disable-next-line no-await-in-loop
    const doc = await fetchDetail(JSDOM, item, ctx);
    if (doc) Object.assign(item, parseDetailPanel(doc));
    if (item.related) {
      const rel = new URL(item.related, SOURCE_ORIGIN);
      const local = rel.pathname.toLowerCase().replace(/\/+$/, '');
      if (demo.has(local)) item.related = local;
    }
  }
}

/**
 * Images the source pages link from their copy (model-page Liftback / Combi drawings), as
 * `asset` rows (media-item shape 5): the lightbox detail panel only, no listing or rail.
 * Pages come from the URL lists in sources.json `assetPages`.
 */
async function collectAssets(JSDOM, lists, ctx, known) {
  const { cacheDir, offline } = ctx;
  const pages = lists.flatMap((file) => readFileSync(path.join(ROOT, file), 'utf8').split(/\r?\n/))
    .map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  const out = [];
  for (const url of pages) {
    let links = [];
    try {
      // eslint-disable-next-line no-await-in-loop
      links = parseAssetLinks(new JSDOM(await fetchText(url, cacheDir, offline)).window.document);
    } catch (e) {
      console.warn(`[media-items] asset page skipped: ${url} (${e.message})`);
    }
    for (const link of links.filter((l) => !known.has(l.id))) {
      known.add(link.id);
      // eslint-disable-next-line no-await-in-loop
      const doc = await fetchDetail(JSDOM, { id: link.id, type: 'asset' }, ctx);
      out.push(assetItem(link, doc || new JSDOM('').window.document));
    }
  }
  return out;
}

/** Map `years-<termId>` → year name: filter by each offered year and intersect card classes. */
async function probeYears(JSDOM, options, type, cacheDir, offline) {
  const byId = {};
  const years = [...options.keys()].filter((k) => k.startsWith('years:')).map((k) => k.slice(6));
  for (const year of years) {
    const url = listingUrl({ type, filter: { years: year }, n: 3 });
    // eslint-disable-next-line no-await-in-loop
    const html = await fetchText(url, cacheDir, offline);
    const cards = [...new JSDOM(html).window.document.querySelectorAll('article.media-cart-item')];
    const common = cards.map((c) => yearIds([c]))
      .reduce((acc, ids) => (acc ? new Set([...acc].filter((x) => ids.has(x))) : ids), null);
    if (common && common.size === 1) byId[[...common][0]] = year;
  }
  return byId;
}

/**
 * Vimeo oEmbed: the poster, and whether the video is domain-restricted. A restricted video
 * (`domain_status_code: 403`) only plays when embedded on skoda-storyboard.com, so it can't
 * play on the demo and has no public poster — such items are dropped, not published broken.
 */
async function oembed(vimeoId, cacheDir, offline) {
  const url = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(`https://vimeo.com/${vimeoId}`)}`;
  try {
    const data = JSON.parse(await fetchText(url, cacheDir, offline));
    return { poster: vimeoPoster(data.thumbnail_url || ''), restricted: data.domain_status_code === 403 };
  } catch (e) {
    return { poster: '', restricted: false };
  }
}

const MEDIA_MANIFEST = path.join(ROOT, 'tools/importer/media/media-manifest.json');

/**
 * Publication gate (SKODA-501/504 traceability): every binary the feed serves (thumbnail,
 * 1920 rendition, original, poster, MP4) needs a media-manifest row, recorded with
 * `npm run media:build -- --feed <feed file>`. Throws with the uncovered URLs.
 */
function assertManifestCoverage(file) {
  const rows = existsSync(MEDIA_MANIFEST) ? JSON.parse(readFileSync(MEDIA_MANIFEST, 'utf8')).rows : {};
  const gaps = feedCoverageGaps(JSON.parse(readFileSync(file, 'utf8')), rows);
  if (!gaps.length) return;
  gaps.slice(0, 20).forEach((g) => console.warn(`  unrecorded ${g.field} (${g.id}): ${g.url}`));
  throw new Error(`${gaps.length} feed media URL(s) have no media-manifest row; run \`npm run media:build -- --feed ${path.relative(ROOT, file)}\` before --push`);
}

/** Preview + publish a DA document (credentials are injected for DA/admin). */
async function previewAndPublish(docPath) {
  for (const stage of ['preview', 'live']) {
    // eslint-disable-next-line no-await-in-loop
    const r = await fetch(`https://admin.hlx.page/${stage}/${ORG}/${REPO}/main/${docPath}`, { method: 'POST' });
    // eslint-disable-next-line no-await-in-loop
    if (!r.ok) throw new Error(`${stage} ${docPath} ${r.status} ${await r.text()}`);
  }
}

/** Upload the sheet to DA, then preview + publish it. */
async function pushFeed(file) {
  assertManifestCoverage(file);
  const res = await uploadToDA({
    org: ORG, repo: REPO, daPath: `/${FEED_PATH}`, buffer: readFileSync(file), contentType: 'application/json',
  });
  if (!res.ok) throw new Error(`DA upload ${res.status}: ${res.body.slice(0, 200)}`);
  await previewAndPublish(FEED_PATH);
  console.log(`[media-items] pushed, previewed and published /${FEED_PATH}`);
}

/**
 * Put the feed thumbnails on the Media Bus: upload, preview + publish the carrier documents,
 * then read each carrier's previewed `.plain.html` for the `media_<hash>` paths.
 * @returns {Promise<Map<string, string>>} source URL → Media Bus path
 */
async function pushCarriers(JSDOM, sheet) {
  const map = new Map();
  for (const doc of carrierDocs(feedThumbnails(sheet))) {
    // eslint-disable-next-line no-await-in-loop
    const res = await uploadToDA({
      org: ORG, repo: REPO, daPath: `/${doc.path}.html`, buffer: Buffer.from(doc.html), contentType: 'text/html',
    });
    if (!res.ok) throw new Error(`DA upload ${doc.path} ${res.status}: ${res.body.slice(0, 200)}`);
    // eslint-disable-next-line no-await-in-loop
    await previewAndPublish(doc.path);
    // eslint-disable-next-line no-await-in-loop
    const plain = await fetch(`https://main--${REPO}--${ORG}.aem.page/${doc.path}.plain.html?ck=${Date.now()}`, { cache: 'no-store' });
    if (!plain.ok) throw new Error(`${doc.path}.plain.html ${plain.status}`);
    // eslint-disable-next-line no-await-in-loop
    const found = parseCarrier(new JSDOM(await plain.text()).window.document, doc.path);
    found.forEach((bus, url) => map.set(url, bus));
    console.log(`[media-items] carrier /${doc.path}: ${found.size}/${doc.urls.length} thumbnails on the Media Bus`);
  }
  return map;
}

/**
 * Publish the sheet: gate it, put its thumbnails on the Media Bus, rewrite `image`, write it
 * to `feedFile` and push it.
 */
async function publishFeed(JSDOM, sheet, feedFile) {
  // the gate runs on the source URLs: the Media Bus copies are of the recorded binaries
  assertManifestCoverage(feedFile);
  const thumbs = feedThumbnails(sheet);
  const bus = withMediaBus(sheet, await pushCarriers(JSDOM, sheet));
  if (bus.missing.length === thumbs.length && thumbs.length) {
    throw new Error('the Media Bus ingested no thumbnail; not publishing the feed');
  }
  bus.missing.forEach((u) => console.warn(`  not on the Media Bus, kept: ${u}`));
  writeFileSync(feedFile, `${JSON.stringify(bus.sheet, null, 2)}\n`);
  await pushFeed(feedFile);
  return { thumbnails: thumbs.length, kept: bus.missing.length };
}

export async function main(argv = process.argv.slice(2)) {
  const a = parseArgs(argv);
  const JSDOM = loadJSDOM();
  const feedFile = path.join(a.out, FEED_PATH);
  if (a.feed) {
    const sheet = JSON.parse(readFileSync(a.feed, 'utf8'));
    mkdirSync(path.dirname(feedFile), { recursive: true });
    writeFileSync(feedFile, `${JSON.stringify(sheet, null, 2)}\n`);
    const mediaBus = await publishFeed(JSDOM, sheet, feedFile);
    console.log(JSON.stringify({ rows: sheet.data.length, mediaBus }));
    return { mediaBus };
  }
  const sources = JSON.parse(readFileSync(path.join(HERE, 'sources.json'), 'utf8'));
  const { queries, assetPages = [], knownDetailGaps = {} } = sources;
  const lists = [];
  const yearsById = {};
  let nonce = '';

  for (const type of ['image', 'video']) {
    // The unfiltered listing's form offers every facet value (and all year names).
    // eslint-disable-next-line no-await-in-loop
    const baseHtml = await fetchText(listingUrl({ type, n: 1 }), a.cache, a.offline);
    const base = new JSDOM(baseHtml).window.document;
    nonce = nonce || ajaxNonce(baseHtml);
    const options = facetOptions(base);
    // eslint-disable-next-line no-await-in-loop
    Object.assign(yearsById, await probeYears(JSDOM, options, type, a.cache, a.offline));
    for (const q of queries.filter((x) => x.type === type)) {
      // eslint-disable-next-line no-await-in-loop
      const doc = new JSDOM(await fetchText(listingUrl(q), a.cache, a.offline)).window.document;
      lists.push(parseCards(doc, { options, yearsById }));
    }
  }

  let items = mergeItems(lists);
  for (const item of items.filter((i) => i.type === 'video' && i['vimeo-id'])) {
    // eslint-disable-next-line no-await-in-loop
    const info = await oembed(item['vimeo-id'], a.cache, a.offline);
    item.restricted = info.restricted;
    if (!item.poster) item.poster = info.poster;
    item.image = item.poster;
  }
  const reason = (i) => {
    if (i.restricted) return 'Vimeo domain-restricted (plays only on skoda-storyboard.com)';
    if (!i.image) return 'no thumbnail';
    if (!i.date) return 'no date';
    if (i.type === 'video' && !i.mp4 && !i['vimeo-id']) return 'no video source';
    return '';
  };
  const dropped = items.filter((i) => reason(i));
  items = items.filter((i) => !reason(i));
  const ctx = { cacheDir: a.cache, offline: a.offline, nonce };
  await addDetails(JSDOM, items, ctx);
  const known = new Set(items.map((i) => i.id));
  const assets = await collectAssets(JSDOM, assetPages, ctx, known);
  items = [...items, ...assets];

  // gate: a row the lightbox offers as a file must carry its details (reported by id)
  const gaps = detailGaps(items);
  const gapReport = path.join(a.cache, 'detail-gaps.json');
  mkdirSync(a.cache, { recursive: true });
  writeFileSync(gapReport, `${JSON.stringify(gaps, null, 2)}\n`);
  const unknown = unknownGaps(gaps, knownDetailGaps);
  if (gaps.length) {
    console.warn(`[media-items] ${gaps.length} row(s) without their detail fields, ${unknown.length} not a known source gap (${gapReport}):`);
    gaps.forEach((g) => console.warn(`  ${unknown.includes(g) ? 'NEW  ' : 'known'} ${g.type} ${g.id} ${g.title}: ${g.missing.join(', ')}`));
  }
  if (unknown.length && !a.allowIncomplete) {
    throw new Error(`${unknown.length} incomplete detail panel(s); not writing the feed (record verified source gaps in sources.json knownDetailGaps, or --allow-incomplete)`);
  }

  const summary = {
    images: items.filter((i) => i.type === 'image').length,
    videos: items.filter((i) => i.type === 'video').length,
    assets: items.filter((i) => i.type === 'asset').length,
    dropped: dropped.map((i) => `${i.type} ${i.id} ${i.title} (${reason(i)})`),
    yearsById,
  };
  const count = (type, tax, value) => items
    .filter((i) => i.type === type && (i.terms[tax] || []).includes(value)).length;
  summary.rails = {
    'images model=peaq': count('image', 'model', 'peaq'),
    'images model=epiq': count('image', 'model', 'epiq'),
    'videos model=peaq': count('video', 'model', 'peaq'),
    'videos model=epiq': count('video', 'model', 'epiq'),
  };
  console.log(JSON.stringify(summary, null, 1));
  if (a.dryRun) return summary;

  const sheet = feedSheet(items);
  mkdirSync(path.dirname(feedFile), { recursive: true });
  writeFileSync(feedFile, `${JSON.stringify(sheet, null, 2)}\n`);
  const record = sheet.data.map((r) => ({
    id: r.id, template: r.template, title: r.title, date: r.date, source: r.source,
  }));
  const generated = new Date().toISOString().slice(0, 10);
  writeFileSync(path.join(HERE, 'items.json'), `${JSON.stringify({ generated, feed: `/${FEED_PATH}`, items: record }, null, 2)}\n`);
  console.log(`[media-items] wrote ${sheet.total} rows -> ${feedFile}`);
  if (a.push) summary.mediaBus = await publishFeed(JSDOM, sheet, feedFile);
  return summary;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(`[media-items] ${e.message}`); process.exit(1); });
}
