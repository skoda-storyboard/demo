/*
 * media-feed.js — the shared reader of the media feed (contract media-item) and its shards
 * (SKODA-517). The whole feed (`/{locale}/media-feed.json`) is one sheet that every reader
 * downloads in full; the shards split it by how it is read. A registry sheet next to the
 * feed, `/{locale}/media-feed/index.json`, lists them, one row per shard file:
 *
 *   | kind   | key         | url                             | rows | total | build |
 *   | head   | image       | /en/media-feed/head-image.json  | 48   | 1990  | b1    |
 *   | facets |             | /en/media-feed/facets.json      | 2475 |       | b1    |
 *   | detail | image:2024  | /en/media-feed/image-2024.json  | 310  |       | b1    |
 *   | slice  | model:fabia | /en/media-feed/model-fabia.json | 395  |       | b1    |
 *   | keyed  | 17          | /en/media-feed/key-17.json      | 40   |       | b1    |
 *
 * - head: the newest rows of one template (`total` = all its rows), a listing's first page;
 * - facets: every row, in the whole feed's order, with only `id`, `template`, `date`, the
 *   facet columns and `detail` (the key of the detail shard that has the full row); the facet
 *   columns may come compact as one `f` column, `key:value|key:value` (expandFacets());
 * - detail: the full rows of one template and year;
 * - slice: the full rows that carry one facet value (rails);
 * - keyed: the full rows whose file name (`original`) hashes to that shard (keyShard()).
 *
 * Blocks keep their `index` config: only a media feed URL looks for a registry. Without one
 * (or with a malformed one) every reader gets today's whole-feed read, and a shard that fails
 * to load falls back to it in every reader. The generator (tools/importer/media-items) writes
 * the shards and publishes the registry last.
 */

import { loadQueryIndex } from './query-index.js';

export const REGISTRY_KINDS = ['head', 'facets', 'detail', 'slice', 'keyed'];

// shard files are this site's JSON: a root-relative path, never another origin
const SHARD_PATH = /^\/(?![/\\])[^\s?#\\]*\.json$/;
const MEDIA_FEED_PATH = /^\/[a-z]{2}\/media-feed\.json$/i;
// shards fetched at once when a reader needs several
const FETCH_CONCURRENCY = 6;

/** Is this index URL a locale's media feed (the only index that can have shards)? */
export function isMediaFeed(url) {
  try {
    return MEDIA_FEED_PATH.test(new URL(url, 'https://x.invalid').pathname);
  } catch (e) {
    return false;
  }
}

/** The registry of a media feed: `/en/media-feed.json` → `/en/media-feed/index.json`. */
export function registryUrl(feedUrl) {
  return isMediaFeed(feedUrl) ? feedUrl.replace(/\.json(?=$|[?#])/i, '/index.json') : '';
}

/** The lower-case file name of a URL (the keyed shards' lookup key), or ''. */
export function fileKey(url) {
  try {
    return new URL(url, 'https://x.invalid').pathname.split('/').pop().toLowerCase();
  } catch (e) {
    return '';
  }
}

/**
 * The keyed shard of a file key: 32-bit FNV-1a of its UTF-16 code units, modulo the shard
 * count. The generator uses this same function, so keep it stable.
 * @param {string} key fileKey() of the row's `original`
 * @param {number} count the number of keyed shards
 */
export function keyShard(key, count) {
  let hash = 0x811c9dc5;
  const text = String(key);
  // a hash is bit arithmetic: xor the code unit, multiply by the FNV prime, keep 32 bits
  /* eslint-disable no-bitwise */
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  /* eslint-enable no-bitwise */
  return hash % count;
}

const toCount = (value) => {
  const text = String(value ?? '').trim();
  const n = Number(text);
  return text && Number.isSafeInteger(n) && n >= 0 ? n : null;
};

/**
 * The registry from its sheet rows, or null when it can't be trusted: no valid row, or rows
 * of different builds (a half-published run). Rows with an unknown kind, a missing key or a
 * URL that isn't a root-relative `.json` path are skipped. Keyed shards count only when their
 * keys are exactly 0 … n-1, so keyShard() can address them.
 * @param {object[]} rows the registry sheet's rows
 */
export function parseRegistry(rows) {
  if (!Array.isArray(rows)) return null;
  const entries = rows.filter((row) => row && typeof row === 'object').map((row) => ({
    kind: String(row.kind ?? '').trim().toLowerCase(),
    key: String(row.key ?? '').trim().toLowerCase(),
    url: String(row.url ?? '').trim(),
    rows: toCount(row.rows),
    total: toCount(row.total),
    build: String(row.build ?? '').trim(),
  })).filter((e) => REGISTRY_KINDS.includes(e.kind) && SHARD_PATH.test(e.url)
    && (e.kind === 'facets' || e.key));
  if (!entries.length) return null;
  const builds = new Set(entries.map((e) => e.build));
  if (builds.size > 1) return null;

  const byKey = (kind) => new Map(entries.filter((e) => e.kind === kind).map((e) => [e.key, e]));
  const keyed = byKey('keyed');
  const keyedList = [...keyed.keys()].every((k) => /^\d+$/.test(k))
    ? Array.from({ length: keyed.size }, (_, i) => keyed.get(String(i))) : [];
  return {
    build: [...builds][0],
    heads: byKey('head'),
    facets: entries.find((e) => e.kind === 'facets') || null,
    details: byKey('detail'),
    slices: byKey('slice'),
    keyed: keyedList.every(Boolean) ? keyedList : [],
  };
}

const registries = new Map();

/**
 * The registry of a media feed (memoized per URL), or null: not a media feed, no registry
 * published (404), or a malformed one. Never throws.
 * @param {string} feedUrl the block's `index` URL
 */
export function loadRegistry(feedUrl) {
  const url = registryUrl(feedUrl);
  if (!url) return Promise.resolve(null);
  if (!registries.has(url)) {
    registries.set(url, loadQueryIndex(url).then(parseRegistry, () => null));
  }
  return registries.get(url);
}

/** Map with a bounded number of promises in flight; results keep the input order. */
async function mapLimited(items, fn, limit = FETCH_CONCURRENCY) {
  const out = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next;
      next += 1;
      // eslint-disable-next-line no-await-in-loop
      out[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

const loadShards = (entries) => mapLimited(entries, (e) => loadQueryIndex(e.url))
  .then((lists) => lists.flat());

/** Rows of several shards, each row once (a row can sit in two slices). */
function uniqueRows(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    const id = String(row?.id ?? '');
    if (!id) return true;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

/**
 * Every full row of the feed: the detail shards when the registry has them, else the whole
 * feed (today's read). Any other index URL is read as it is.
 * @param {string} url the block's `index` URL
 */
export async function loadAllRows(url) {
  const registry = await loadRegistry(url);
  if (!registry?.details.size) return loadQueryIndex(url);
  // a shard that fails: the whole feed, still published beside them (SKODA-517 review)
  return loadShards([...registry.details.values()]).catch(() => loadQueryIndex(url));
}

/**
 * The rows a rail can pick from. With a registry it reads the slices of one facet the rail
 * filters on, the one whose slices cover all its values with the fewest rows (values of one
 * facet OR, so their slices are unioned); the rail still filters the rows itself. A rail on a
 * facet without slices, or no registry, gets every row.
 * @param {string} url the block's `index` URL
 * @param {Record<string, string[]>} facets the rail's facet key → values
 */
export async function loadRailRows(url, facets = {}) {
  const registry = await loadRegistry(url);
  if (!registry?.slices.size) return loadAllRows(url);
  const options = Object.entries(facets).map(([key, values]) => {
    const entries = [...new Set((values || []).map((v) => `${key}:${String(v).trim().toLowerCase()}`))]
      .map((k) => registry.slices.get(k));
    if (!entries.length || !entries.every(Boolean)) return null;
    // a slice without a row count sorts last: it may be large
    return { entries, size: entries.reduce((n, e) => n + (e.rows ?? Infinity), 0) };
  }).filter(Boolean).sort((a, b) => a.size - b.size);
  if (!options.length) return loadAllRows(url);
  // a slice that fails: every row (the detail shards, else the whole feed)
  return loadShards(options[0].entries).then(uniqueRows, () => loadAllRows(url));
}

/**
 * Feed rows by file, for image links and the lightbox: a Map of fileKey() → row. With keyed
 * shards only the shards of the asked files load, else every row.
 * @param {string} url the media feed URL
 * @param {string[]} files the file URLs (or names) to look up
 */
export async function findRowsByFile(url, files) {
  const keys = [...new Set(files.map(fileKey).filter(Boolean))];
  const registry = await loadRegistry(url);
  const shards = registry?.keyed || [];
  // a keyed shard that fails: every row (the detail shards, else the whole feed)
  const rows = shards.length
    ? await loadShards([...new Set(keys.map((k) => shards[keyShard(k, shards.length)]))])
      .catch(() => loadAllRows(url))
    : await loadAllRows(url);
  // a file in two rows: the later row wins, as the whole-feed lookup always did
  const byFile = new Map(rows.map((row) => [fileKey(row.original), row]));
  return new Map(keys.filter((k) => byFile.has(k)).map((k) => [k, byFile.get(k)]));
}

/**
 * A facet-index row with its facet values in one compact `f` column
 * (`model:fabia|bodywork:combi|bodywork:hatchback`, the generator's form) as the facet columns
 * the listing filters on (`model: 'fabia'`, `bodywork: 'combi, hatchback'`). A row without
 * `f` is returned as it is. The input row is not changed.
 * @param {object} row a facet-index row
 */
export function expandFacets(row) {
  const compact = row && typeof row.f === 'string' ? row.f : null;
  if (compact === null) return row;
  const { f, ...out } = row;
  compact.split('|').forEach((pair) => {
    const at = pair.indexOf(':');
    if (at < 1) return;
    const key = pair.slice(0, at).trim();
    const value = pair.slice(at + 1).trim();
    if (!key || !value || key === 'id' || key === 'detail' || key === 'template' || key === 'date') return;
    out[key] = out[key] ? `${out[key]}, ${value}` : value;
  });
  return out;
}

/**
 * A listing's view of the feed. `head()` is the template's head shard for the first paint
 * ({ rows, total }) or null; `rows()` the rows the listing scopes, filters, sorts and pages:
 * the facet index when the registry has one with its detail shards (and the listing isn't
 * path-scoped: index rows carry no path), else every full row. `hydrated(rows)` returns
 * the full rows for a page of them when they are all at hand (synchronously, or null);
 * `hydrate(rows)` loads the detail shards they need first. Full rows are returned as they are.
 * A facet index that fails to load, or detail shards that fail or lack a row, fall back to the
 * whole feed (today's read): a half-published build never empties a listing.
 * @param {string} url the block's `index` URL
 * @param {{ template?: string, path?: string }} [scope] the listing's scope
 */
export async function openListingFeed(url, { template = '', path = '' } = {}) {
  const registry = await loadRegistry(url);
  let lazy = Boolean(registry?.facets && registry.details.size && !path);
  const headEntry = registry?.heads.get(String(template).trim().toLowerCase()) || null;
  const known = new Map(); // id → full row, from the head and the loaded detail shards
  const remember = (rows) => rows.forEach((row) => {
    const id = String(row?.id ?? '');
    if (id && !known.has(id)) known.set(id, row);
  });
  const hydrated = (rows) => {
    if (!lazy) return rows;
    const full = rows.map((row) => known.get(String(row?.id ?? '')));
    return full.every(Boolean) ? full : null;
  };
  const wholeFeed = () => loadQueryIndex(url);
  return {
    get lazy() { return lazy; },
    head: headEntry && (async () => {
      const rows = await loadQueryIndex(headEntry.url);
      remember(rows);
      return { rows, total: headEntry.total ?? rows.length };
    }),
    rows: () => {
      if (!lazy) return loadAllRows(url);
      return loadQueryIndex(registry.facets.url).then((index) => index.map(expandFacets), () => {
        lazy = false; // full rows from here on
        return loadAllRows(url).catch(wholeFeed);
      });
    },
    hydrated,
    async hydrate(rows) {
      const ready = hydrated(rows);
      if (ready) return ready;
      const needed = [...new Set(rows.map((r) => String(r?.detail ?? '').trim().toLowerCase()))]
        .map((k) => registry.details.get(k)).filter(Boolean);
      const fill = () => rows.map((row) => known.get(String(row?.id ?? '')));
      try {
        remember(await loadShards(needed));
      } catch (e) { /* the whole feed below */ }
      if (!fill().every(Boolean)) remember(await wholeFeed());
      // a row not even the whole feed has is left out (the listing then drops it from its rows)
      return fill().filter(Boolean);
    },
  };
}

/** Test helper: forget the registries (the shards live in the query-index cache). */
export function clearMediaFeedCache() {
  registries.clear();
}
