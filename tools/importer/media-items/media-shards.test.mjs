/* global globalThis */
/*
 * Unit tests for media-shards.mjs (SKODA-517 part 2): the shards built from a feed, read back
 * through the real reader (scripts/media-feed.js) over a fetch stub: the same rows, the same
 * order and the same facet values as the whole feed.
 * Run: node --test tools/importer/media-items/media-shards.test.mjs
 */

import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildShards, buildId, compactFacets, cells, REGISTRY,
} from './media-shards.mjs';
import { clearQueryIndexCache } from '../../../scripts/query-index.js';
import {
  clearMediaFeedCache, openListingFeed, loadRailRows, findRowsByFile, loadAllRows, expandFacets,
} from '../../../scripts/media-feed.js';
import { filterRows, sortRows, scopeRows } from '../../../blocks/listing/listing-logic.mjs';

globalThis.window = { location: { href: 'https://example.test/en/images', pathname: '/en/images' } };

// a small feed: images and videos over three years, two models, one asset row
const feedRows = [];
for (let i = 1; i <= 30; i += 1) {
  feedRows.push({
    id: String(1000 + i),
    template: i % 5 === 0 ? 'video' : 'image',
    date: `${2026 - (i % 3)}-0${(i % 9) + 1}-1${i % 10}`,
    title: `t${i}`,
    original: `https://cdn.example.test/f/file-${i}.jpg`,
    model: i % 2 ? 'fabia' : 'scala',
    bodywork: i % 3 ? 'hatchback' : 'hatchback, combi',
    years: String(2026 - (i % 3)),
    tags: '',
  });
}
feedRows.push({
  id: '9', template: 'asset', date: '2024-01-01', title: 'drawing', original: 'https://cdn.example.test/d.jpg', model: '',
});
const FEED = { data: sortRows(feedRows, 'newest') };

let files = {};
globalThis.fetch = async (url) => {
  const { pathname } = new URL(url);
  const body = files[pathname];
  if (!body) return { ok: false, status: 404, json: async () => ({}) };
  return { ok: true, status: 200, json: async () => body };
};
beforeEach(() => {
  clearQueryIndexCache();
  clearMediaFeedCache();
});
const publish = (built) => {
  files = { [REGISTRY]: built.registry, '/en/media-feed.json': { ...FEED, total: FEED.data.length } };
  built.files.forEach((sheet, url) => { files[url] = sheet; });
};

test('the build id is stable for the same rows and changes with them', () => {
  assert.equal(buildId(FEED.data), buildId(FEED.data));
  assert.notEqual(buildId(FEED.data), buildId(FEED.data.slice(1)));
  assert.match(buildId(FEED.data), /^b-[0-9a-f]{10}$/);
});

test('compactFacets: every facet value as key:value, lower case; none for a row without facets', () => {
  assert.equal(compactFacets({ model: 'Fabia', bodywork: 'hatchback, combi' }), 'model:fabia|bodywork:hatchback|bodywork:combi');
  assert.equal(compactFacets({}), '');
  assert.deepEqual(expandFacets({ id: '1', f: 'model:fabia|bodywork:hatchback|bodywork:combi' }), { id: '1', model: 'fabia', bodywork: 'hatchback, combi' });
});

test('the registry: one build, every shard under its folder, heads with their totals', () => {
  const { build, registry, files: shards } = buildShards(FEED, { detailMax: 6, keyed: 4 });
  const rows = registry.data;
  assert.ok(rows.every((r) => r.build === build && r.url.startsWith(`/en/media-feed/${build}/`)));
  assert.equal(new Set(rows.map((r) => r.url)).size, rows.length, 'one file per shard');
  assert.equal(shards.size, rows.length);
  const head = rows.find((r) => r.kind === 'head' && r.key === 'image');
  assert.equal(head.total, String(FEED.data.filter((r) => r.template === 'image').length));
  assert.ok(!rows.some((r) => r.kind === 'head' && r.key === 'asset'), 'no head for lightbox-only rows');
  // a year over detailMax is cut in parts, each at most detailMax rows, newest first
  const parts = rows.filter((r) => r.kind === 'detail' && /^image:2026-\d$/.test(r.key));
  assert.ok(parts.length > 1);
  assert.ok(parts.every((r) => Number(r.rows) <= 6));
  assert.equal(rows.filter((r) => r.kind === 'keyed').length, 4);
  // every row is in exactly one detail shard
  const inDetail = rows.filter((r) => r.kind === 'detail').reduce((n, r) => n + Number(r.rows), 0);
  assert.equal(inDetail, FEED.data.length);
});

test('read back: the listing sees the same rows, order and facets as the whole feed', async () => {
  publish(buildShards(FEED, { detailMax: 6, keyed: 4 }));
  const feed = await openListingFeed('/en/media-feed.json', { template: 'image' });
  assert.equal(feed.lazy, true);
  const index = await feed.rows();
  const whole = FEED.data;
  const view = (rows, active) => sortRows(filterRows(scopeRows(rows, { template: 'image' }), active), 'newest');
  for (const active of [{}, { model: ['fabia'] }, { bodywork: ['combi'] }, { model: ['scala'], bodywork: ['combi'] }]) {
    const fromIndex = view(index, active).map((r) => r.id);
    const fromWhole = view(whole, active).map((r) => r.id);
    assert.deepEqual(fromIndex, fromWhole, JSON.stringify(active));
    // the shown page fills in to the full rows
    // eslint-disable-next-line no-await-in-loop
    const page = await feed.hydrate(view(index, active).slice(0, 12));
    assert.deepEqual(page, view(whole, active).slice(0, 12));
  }
  const head = await feed.head();
  assert.deepEqual(head.rows.map((r) => r.id), view(whole, {}).slice(0, 48).map((r) => r.id));
});

test('read back: rails from their slice, image links from their keyed shard, all rows from the details', async () => {
  publish(buildShards(FEED, { detailMax: 6, keyed: 4 }));
  const rail = await loadRailRows('/en/media-feed.json', { model: ['fabia'], bodywork: ['hatchback'] });
  assert.deepEqual(new Set(rail.map((r) => r.id)), new Set(FEED.data.filter((r) => /fabia/.test(r.model || '')).map((r) => r.id)));
  const found = await findRowsByFile('/en/media-feed.json', [FEED.data[3].original, 'https://cdn.example.test/d.jpg']);
  assert.equal(found.get(`file-${FEED.data[3].original.split('file-')[1]}`).id, FEED.data[3].id);
  assert.equal(found.get('d.jpg').id, '9');
  const all = await loadAllRows('/en/media-feed.json');
  assert.deepEqual(new Set(all.map((r) => r.id)), new Set(FEED.data.map((r) => r.id)));
});

test('the cell gate: a sheet over the limit fails the build; no rows, no shards', () => {
  assert.equal(cells([{ a: 1 }, { a: 1, b: 2 }]), 4);
  // 31 rows × 9 columns in the one detail shard of a year: over a 200-cell limit
  assert.throws(() => buildShards(FEED, { maxCells: 200, detailMax: 1000 }), /over the 200 limit/);
  assert.ok(buildShards(FEED).files.size > 0, 'the real limit passes');
  assert.throws(() => buildShards({ data: [] }), /no rows/);
});
