#!/usr/bin/env node
/*
 * build-media-items.mjs — SKODA-608: generate one EDS page per source image/video item.
 *
 *   npm run media-items:build -- [--out <content dir>] [--cache <dir>] [--offline] [--dry-run]
 *
 * Reads tools/importer/media-items/sources.json (source listing queries), fetches the
 * server-rendered source listings (`ajax_search_results_<type>=N` renders N cards), parses
 * the cards (media-items-lib.mjs), resolves `years-<termId>` classes to year names by
 * probing each year filter, and fills missing Vimeo posters from Vimeo oEmbed. Writes:
 *   <out>/en/images/<slug>.plain.html, <out>/en/videos/<slug>.plain.html
 *   tools/importer/media-items/items.json           (committed record: id, source, path, fields)
 *   tools/importer/media-items/paths-media-items.txt (push list: import:push -- --paths …)
 *   docs/planning/skoda-rail-feed-corpus.txt          IMAGES / VIDEOS sections (generated block)
 *
 * Why not the bulk runner: one source listing page yields many item pages, and the runner
 * writes one page per URL. Items whose attachment page 404s exist only as listing cards.
 * Store CDN URLs only (/direct-download/ answers with a presigned, expiring S3 redirect).
 */

import {
  readFileSync, writeFileSync, mkdirSync, existsSync,
} from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import {
  SOURCE_ORIGIN, facetOptions, parseCards, mergeItems, itemPageHtml, yearIds, vimeoPoster,
} from './media-items-lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128 Safari/537.36';
const CORPUS = path.join(ROOT, 'docs/planning/skoda-rail-feed-corpus.txt');
const BEGIN = '# BEGIN GENERATED MEDIA ITEMS (npm run media-items:build; do not edit by hand)';
const END = '# END GENERATED MEDIA ITEMS';

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
    out: path.join(ROOT, 'content'), cache: path.join(ROOT, '.migration/work/608/cache'), offline: false, dryRun: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const k = argv[i];
    const v = () => { i += 1; return argv[i]; };
    if (k === '--out') a.out = path.resolve(v());
    else if (k === '--cache') a.cache = path.resolve(v());
    else if (k === '--offline') a.offline = true;
    else if (k === '--dry-run') a.dryRun = true;
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

function writeCorpus(items) {
  const block = (type, title) => {
    const list = items.filter((i) => i.type === type).map((i) => i.path).sort();
    return [`# ===== ${title} (${list.length}) — SKODA-608 item pages at their EDS paths; feed the listing + model rails =====`, ...list];
  };
  const generated = [BEGIN, ...block('image', 'IMAGES'), '', ...block('video', 'VIDEOS'), END].join('\n');
  let corpus = readFileSync(CORPUS, 'utf8');
  if (corpus.includes(BEGIN)) {
    corpus = corpus.replace(new RegExp(`${BEGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${END}`), generated);
  } else {
    // First run: replace the hand-written IMAGES/VIDEOS sections (attachment URLs) with the block.
    const start = corpus.search(/^# ===== IMAGES/m);
    const after = corpus.slice(start).search(/^# ===== (?!IMAGES|VIDEOS)/m);
    const end = after === -1 ? corpus.length : start + after;
    corpus = `${corpus.slice(0, start)}${generated}\n\n${corpus.slice(end).replace(/^\n+/, '')}`;
  }
  writeFileSync(CORPUS, corpus.endsWith('\n') ? corpus : `${corpus}\n`);
}

export async function main(argv = process.argv.slice(2)) {
  const a = parseArgs(argv);
  const JSDOM = loadJSDOM();
  const { queries } = JSON.parse(readFileSync(path.join(HERE, 'sources.json'), 'utf8'));
  const lists = [];
  const labels = new Map();
  const yearsById = {};

  for (const type of ['image', 'video']) {
    // The unfiltered listing's form offers every facet value (and all year names).
    // eslint-disable-next-line no-await-in-loop
    const baseHtml = await fetchText(listingUrl({ type, n: 1 }), a.cache, a.offline);
    const base = new JSDOM(baseHtml).window.document;
    const options = facetOptions(base);
    options.forEach((label, key) => labels.set(key, label));
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

  items.forEach((item) => {
    const file = path.join(a.out, `${item.path}.plain.html`);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, itemPageHtml(item, labels));
  });
  const record = items.map(({
    id, type, path: p, source, title, date, terms, ...rest
  }) => ({
    id, type, path: p, source, title, date, terms, fields: Object.fromEntries(['original', 'rendition-1920', 'mp4', 'vimeo-id', 'poster'].filter((f) => rest[f]).map((f) => [f, rest[f]])),
  })).sort((x, y) => x.path.localeCompare(y.path));
  writeFileSync(path.join(HERE, 'items.json'), `${JSON.stringify({ generated: new Date().toISOString().slice(0, 10), items: record }, null, 2)}\n`);
  writeFileSync(path.join(HERE, 'paths-media-items.txt'), `# SKODA-608 item pages (generated by build-media-items.mjs)\n${record.map((r) => r.path).join('\n')}\n`);
  writeCorpus(items);
  console.log(`[media-items] wrote ${items.length} pages → ${a.out}`);
  return summary;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(`[media-items] ${e.message}`); process.exit(1); });
}
