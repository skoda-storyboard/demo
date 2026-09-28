#!/usr/bin/env node
/*
 * build-media-items.mjs - SKODA-608: generate the media feed (en/media-feed.json).
 *
 *   npm run media-items:build -- [--out <dir>] [--cache <dir>] [--offline] [--dry-run] [--push]
 *
 * AEM Assets is the source of truth for images/videos (docs/architecture/
 * SKODA-MEDIA-ITEMS-OPTIONS.md, option B): no page per item. This M1 generator builds the
 * feed from the server-rendered source listings (`ajax_search_results_<type>=N` renders N
 * cards; many attachment pages 404, the cards don't), resolves `years-<termId>` classes by
 * probing each year filter, takes Vimeo posters from oEmbed and skips domain-restricted
 * videos. The M2 sync job writes the same rows from published AEM Assets. Writes:
 *   <out>/en/media-feed.json                 the DA sheet (query-index shape, `:type: sheet`)
 *   tools/importer/media-items/items.json    committed record (id, template, title, date, source)
 * `--push` uploads the sheet to DA and previews + publishes it. The listing and story-rail
 * blocks read it via their `index: /en/media-feed.json` config row.
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
  detailRequest, ajaxNonce, parseDetailPanel,
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
    out: path.join(ROOT, 'content'), cache: path.join(ROOT, '.migration/work/608/cache'), offline: false, dryRun: false, push: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const k = argv[i];
    const v = () => { i += 1; return argv[i]; };
    if (k === '--out') a.out = path.resolve(v());
    else if (k === '--cache') a.cache = path.resolve(v());
    else if (k === '--offline') a.offline = true;
    else if (k === '--dry-run') a.dryRun = true;
    else if (k === '--push') a.push = true;
    else throw new Error(`unknown flag ${k}`);
  }
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

/** POST with the same file cache as fetchText (keyed by `key`, not the URL). */
async function fetchPost(url, body, key, cacheDir, offline) {
  const file = path.join(cacheDir, `${key}.json`);
  if (existsSync(file)) return readFileSync(file, 'utf8');
  if (offline) throw new Error(`offline and not cached: ${key}`);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'user-agent': UA, 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    body,
  });
  if (!res.ok) throw new Error(`${res.status} ${url} (${key})`);
  const out = await res.text();
  mkdirSync(cacheDir, { recursive: true });
  writeFileSync(file, out);
  return out;
}

/**
 * The lightbox detail panel of every item (media-item shape 4): the source colorbox loads it
 * per item (`image-overlay-meta-data`). A related article that is a demo page links there.
 */
async function addDetails(JSDOM, items, nonce, cacheDir, offline) {
  const demo = new Set(readLists().paths);
  let missing = 0;
  for (const item of items) {
    const { url, body } = detailRequest(item.id, nonce);
    try {
      // eslint-disable-next-line no-await-in-loop
      const json = JSON.parse(await fetchPost(url, body, `detail_${item.id}`, cacheDir, offline));
      Object.assign(item, parseDetailPanel(new JSDOM(json.html || '').window.document));
      if (item.related) {
        const rel = new URL(item.related, SOURCE_ORIGIN);
        const local = rel.pathname.toLowerCase().replace(/\/+$/, '');
        if (demo.has(local)) item.related = local;
      }
    } catch (e) {
      missing += 1;
    }
  }
  if (missing) console.warn(`[media-items] no detail panel for ${missing} item(s)`);
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

/** Upload the sheet to DA, then preview + publish it (credentials are injected for DA/admin). */
async function pushFeed(file) {
  const res = await uploadToDA({
    org: ORG, repo: REPO, daPath: `/${FEED_PATH}`, buffer: readFileSync(file), contentType: 'application/json',
  });
  if (!res.ok) throw new Error(`DA upload ${res.status}: ${res.body.slice(0, 200)}`);
  for (const stage of ['preview', 'live']) {
    // eslint-disable-next-line no-await-in-loop
    const r = await fetch(`https://admin.hlx.page/${stage}/${ORG}/${REPO}/main/${FEED_PATH}`, { method: 'POST' });
    // eslint-disable-next-line no-await-in-loop
    if (!r.ok) throw new Error(`${stage} ${r.status} ${await r.text()}`);
  }
  console.log(`[media-items] pushed, previewed and published /${FEED_PATH}`);
}

export async function main(argv = process.argv.slice(2)) {
  const a = parseArgs(argv);
  const JSDOM = loadJSDOM();
  const { queries } = JSON.parse(readFileSync(path.join(HERE, 'sources.json'), 'utf8'));
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
  await addDetails(JSDOM, items, nonce, a.cache, a.offline);

  const summary = {
    images: items.filter((i) => i.type === 'image').length,
    videos: items.filter((i) => i.type === 'video').length,
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
  const feedFile = path.join(a.out, FEED_PATH);
  mkdirSync(path.dirname(feedFile), { recursive: true });
  writeFileSync(feedFile, `${JSON.stringify(sheet, null, 2)}\n`);
  const record = sheet.data.map((r) => ({
    id: r.id, template: r.template, title: r.title, date: r.date, source: r.source,
  }));
  const generated = new Date().toISOString().slice(0, 10);
  writeFileSync(path.join(HERE, 'items.json'), `${JSON.stringify({ generated, feed: `/${FEED_PATH}`, items: record }, null, 2)}\n`);
  console.log(`[media-items] wrote ${sheet.total} rows -> ${feedFile}`);
  if (a.push) await pushFeed(feedFile);
  return summary;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(`[media-items] ${e.message}`); process.exit(1); });
}
