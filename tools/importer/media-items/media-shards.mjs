/*
 * media-shards.mjs — SKODA-517: the media feed split by how it is read (pure, no I/O).
 *
 * From the published feed sheet (`/en/media-feed.json`, contract media-item) it builds the
 * shard sheets and their registry, the contract the reader (`scripts/media-feed.js`) reads:
 *   - head, key = template: the newest HEAD_ROWS rows of each listing template (image, video);
 *   - facets: every row in the feed's order, compact: `id`, `template`, `date`, `detail` (the
 *     key of the detail shard holding the full row) and `f`, the facet values as
 *     `key:value|key:value` (the reader expands it into the facet columns);
 *   - detail, key `<template>:<year>`, or `<template>:<year>-<n>` when a year holds more than
 *     DETAIL_MAX rows (chunks in the feed's newest-first order): full rows;
 *   - slice, key `<facet>:<value>` for the rails' facets (model, bodywork): full rows;
 *   - keyed, key 0 … KEYED-1: full rows by `keyShard(fileKey(original))`.
 * Every shard lives under the build folder (`/en/media-feed/<build>/…`), so a new build never
 * overwrites the live one; the registry (`/en/media-feed/index.json`) is published last.
 */

import { createHash } from 'node:crypto';
import { keyShard, fileKey } from '../../../scripts/media-feed.js';
import { INDEX_FACETS, facetTokens } from '../../../blocks/listing/listing-logic.mjs';

export const HEAD_ROWS = 48; // four 12-card pages of a listing
export const DETAIL_MAX = 400;
export const KEYED = 64;
export const SLICE_FACETS = ['model', 'bodywork'];
export const LISTING_TEMPLATES = ['image', 'video'];
export const MAX_CELLS = 500000; // a sheet's limit on aem.live
export const BASE = '/en/media-feed';
export const REGISTRY = `${BASE}/index.json`;

const sheet = (data) => ({
  total: data.length, offset: 0, limit: data.length, data, ':type': 'sheet',
});
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const year = (row) => (String(row.date || '').match(/^\d{4}/) || ['undated'])[0];

/** A short, stable id of the feed's rows: the same feed always gives the same build. */
export function buildId(rows) {
  return `b-${createHash('sha256').update(JSON.stringify(rows)).digest('hex').slice(0, 10)}`;
}

/** The facet values of a row, compact: `model:fabia|bodywork:combi|bodywork:hatchback`. */
export function compactFacets(row) {
  return INDEX_FACETS.flatMap((key) => facetTokens(row[key]).map((v) => `${key}:${v.toLowerCase()}`))
    .join('|');
}

/** A sheet's cell count: its rows × the columns any row has. */
export function cells(data) {
  const columns = new Set(data.flatMap((row) => Object.keys(row)));
  return data.length * columns.size;
}

/**
 * The shards of a feed and their registry.
 * @param {{ data: object[] }} feed the published feed sheet
 * @param {object} [opts] { headRows, detailMax, keyed, sliceFacets, build, maxCells }
 * @returns {{ build: string, registry: object, files: Map<string, object> }} path → sheet
 */
export function buildShards(feed, {
  headRows = HEAD_ROWS, detailMax = DETAIL_MAX, keyed = KEYED, sliceFacets = SLICE_FACETS,
  build = buildId(feed?.data || []), maxCells = MAX_CELLS,
} = {}) {
  const rows = Array.isArray(feed?.data) ? feed.data : [];
  if (!rows.length) throw new Error('the feed has no rows: no shards');
  const files = new Map();
  const registry = [];
  const add = (kind, key, name, data, total = '') => {
    const url = `${BASE}/${build}/${name}.json`;
    files.set(url, sheet(data));
    registry.push({
      kind, key, url, rows: String(data.length), total: String(total), build,
    });
  };

  // detail shards first: the facet index names the shard of each row
  const newestFirst = rows.map((row, i) => ({ row, i }))
    .sort((a, b) => String(b.row.date || '').localeCompare(String(a.row.date || '')) || a.i - b.i)
    .map(({ row }) => row);
  const byYear = new Map();
  newestFirst.forEach((row) => {
    const k = `${String(row.template || 'item').toLowerCase()}:${year(row)}`;
    if (!byYear.has(k)) byYear.set(k, []);
    byYear.get(k).push(row);
  });
  const detailOf = new Map(); // row → detail key
  [...byYear.entries()].sort(([a], [b]) => a.localeCompare(b)).forEach(([k, list]) => {
    const chunks = Math.ceil(list.length / detailMax);
    for (let c = 0; c < chunks; c += 1) {
      const part = list.slice(c * detailMax, (c + 1) * detailMax);
      const key = chunks > 1 ? `${k}-${c + 1}` : k;
      part.forEach((row) => detailOf.set(row, key));
      add('detail', key, slug(key), part);
    }
  });

  LISTING_TEMPLATES.forEach((t) => {
    const all = newestFirst.filter((r) => String(r.template).toLowerCase() === t);
    if (all.length) add('head', t, `head-${t}`, all.slice(0, headRows), all.length);
  });

  add('facets', '', 'facets', rows.map((row) => ({
    id: String(row.id ?? ''),
    template: row.template || '',
    date: row.date || '',
    detail: detailOf.get(row),
    f: compactFacets(row),
  })));

  sliceFacets.forEach((facet) => {
    const groups = new Map();
    rows.forEach((row) => facetTokens(row[facet]).forEach((v) => {
      const k = `${facet}:${v.toLowerCase()}`;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(row);
    }));
    [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))
      .forEach(([k, list]) => add('slice', k, `slice-${slug(k)}`, list));
  });

  const buckets = Array.from({ length: keyed }, () => []);
  rows.forEach((row) => {
    const k = fileKey(row.original);
    if (k) buckets[keyShard(k, keyed)].push(row);
  });
  buckets.forEach((list, n) => add('keyed', String(n), `key-${n}`, list));

  // the gate: every sheet fits aem.live's cell limit
  [...files.entries()].forEach(([url, s]) => {
    const n = cells(s.data);
    if (n > maxCells) throw new Error(`${url}: ${n} cells, over the ${maxCells} limit`);
  });
  return { build, registry: sheet(registry), files };
}
