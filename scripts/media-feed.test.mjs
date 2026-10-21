/*
 * Unit tests for the media feed reader and its shards (SKODA-517): the registry contract,
 * the shard choice per reader, and the whole-feed fallback without a registry.
 * Run: node --test scripts/media-feed.test.mjs
 */

/* global globalThis */

import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { clearQueryIndexCache } from './query-index.js';
import {
  isMediaFeed, registryUrl, fileKey, keyShard, parseRegistry, loadRegistry, loadAllRows,
  loadRailRows, findRowsByFile, openListingFeed, clearMediaFeedCache,
} from './media-feed.js';

globalThis.window = { location: { href: 'https://example.test/en/images', pathname: '/en/images' } };

const row = (id, extra = {}) => ({
  id: String(id),
  template: 'image',
  date: `2026-09-${String((id % 28) + 1).padStart(2, '0')}`,
  original: `https://cdn.example.test/2026/09/file-${id}.jpg`,
  title: `t${id}`,
  ...extra,
});
const sheet = (data) => ({
  total: data.length, offset: 0, limit: data.length, data,
});

// path → sheet rows; anything else is a 404. Every request is recorded.
let files = {};
let requests = [];
globalThis.fetch = async (url) => {
  const { pathname } = new URL(url);
  requests.push(pathname);
  if (!Object.hasOwn(files, pathname)) return { ok: false, status: 404, json: async () => ({}) };
  return { ok: true, status: 200, json: async () => sheet(files[pathname]) };
};

beforeEach(() => {
  files = {};
  requests = [];
  clearQueryIndexCache();
  clearMediaFeedCache();
});

const reg = (kind, key, url, rows = '', extra = {}) => ({
  kind, key, url, rows: String(rows), total: '', build: 'b1', ...extra,
});

test('only a locale media feed has a registry', () => {
  assert.equal(isMediaFeed('/en/media-feed.json'), true);
  assert.equal(isMediaFeed('https://example.test/de/media-feed.json'), true);
  assert.equal(isMediaFeed('/en/query-index.json'), false);
  assert.equal(isMediaFeed('/en/media-feed/model-fabia.json'), false);
  assert.equal(isMediaFeed(''), false);
  assert.equal(registryUrl('/en/media-feed.json'), '/en/media-feed/index.json');
  assert.equal(registryUrl('/en/query-index.json'), '');
});

test('fileKey and keyShard: lower-case file name, a stable shard in range', () => {
  assert.equal(fileKey('https://cdn.example.test/a/B-1.JPG?x=1'), 'b-1.jpg');
  assert.equal(fileKey(''), '');
  // FNV-1a 32: '' → offset basis; the generator relies on these exact values
  assert.equal(keyShard('', 64), 0x811c9dc5 % 64);
  assert.equal(keyShard('a', 2 ** 32 - 1), 0xe40c292c % (2 ** 32 - 1));
  ['file-1.jpg', 'file-2.jpg', 'Žlutý.png'].forEach((k) => {
    const n = keyShard(k, 64);
    assert.ok(Number.isInteger(n) && n >= 0 && n < 64);
    assert.equal(keyShard(k, 64), n);
  });
});

test('parseRegistry: kinds, counts, skipped rows', () => {
  const r = parseRegistry([
    reg('head', 'Image', '/en/media-feed/head-image.json', 2, { total: '5' }),
    reg('facets', '', '/en/media-feed/facets.json', 5),
    reg('detail', 'image:2026', '/en/media-feed/image-2026.json', '5'),
    reg('slice', 'model:fabia', '/en/media-feed/model-fabia.json', '12a'),
    reg('slice', 'model:evil', '//evil.test/x.json'),
    reg('slice', 'model:abs', 'https://evil.test/x.json'),
    reg('slice', 'model:js', ['javascript', 'alert(1)'].join(':')),
    reg('slice', 'model:qs', '/en/x.json?y=1'),
    reg('slice', '', '/en/media-feed/nokey.json'),
    reg('bogus', 'x', '/en/media-feed/x.json'),
    null,
  ]);
  assert.equal(r.build, 'b1');
  assert.deepEqual([...r.heads.keys()], ['image']);
  assert.equal(r.heads.get('image').total, 5);
  assert.equal(r.facets.url, '/en/media-feed/facets.json');
  assert.equal(r.details.get('image:2026').rows, 5);
  assert.deepEqual([...r.slices.keys()], ['model:fabia']);
  assert.equal(r.slices.get('model:fabia').rows, null, 'a malformed count is unknown, not 12');
  assert.deepEqual(r.keyed, []);
});

test('parseRegistry: no trusted rows, mixed builds or gappy keyed shards', () => {
  assert.equal(parseRegistry([]), null);
  assert.equal(parseRegistry({ data: [] }), null);
  assert.equal(parseRegistry([{ path: '/x', title: 'not a registry' }]), null);
  assert.equal(parseRegistry([
    reg('facets', '', '/en/f.json'), reg('detail', 'image:2026', '/en/d.json', 1, { build: 'b2' }),
  ]), null, 'a half-published run');
  const gappy = parseRegistry([reg('keyed', '0', '/en/k0.json'), reg('keyed', '2', '/en/k2.json')]);
  assert.deepEqual(gappy.keyed, []);
  const ok = parseRegistry([reg('keyed', '1', '/en/k1.json'), reg('keyed', '0', '/en/k0.json')]);
  assert.deepEqual(ok.keyed.map((e) => e.url), ['/en/k0.json', '/en/k1.json']);
});

test('no registry: one 404, remembered; any other index is never asked for one', async () => {
  files['/en/media-feed.json'] = [row(1), row(2)];
  assert.equal(await loadRegistry('/en/media-feed.json'), null);
  assert.equal(await loadRegistry('/en/media-feed.json'), null);
  assert.deepEqual(await loadRegistry('/en/query-index.json'), null);
  assert.deepEqual(requests, ['/en/media-feed/index.json']);
  const all = await loadAllRows('/en/media-feed.json');
  assert.deepEqual(all.map((r) => r.id), ['1', '2'], 'the whole feed, as today');
});

test('loadAllRows: the detail shards in registry order, not the whole feed', async () => {
  files['/en/media-feed/index.json'] = [
    reg('detail', 'image:2026', '/en/media-feed/image-2026.json'),
    reg('detail', 'video:2025', '/en/media-feed/video-2025.json'),
  ];
  files['/en/media-feed/image-2026.json'] = [row(1), row(2)];
  files['/en/media-feed/video-2025.json'] = [row(3, { template: 'video' })];
  const all = await loadAllRows('/en/media-feed.json');
  assert.deepEqual(all.map((r) => r.id), ['1', '2', '3']);
  assert.equal(requests.includes('/en/media-feed.json'), false);
});

test('loadRailRows: the smallest facet whose slices cover the rail, values unioned', async () => {
  files['/en/media-feed/index.json'] = [
    reg('slice', 'model:fabia', '/en/media-feed/model-fabia.json', 2),
    reg('slice', 'model:scala', '/en/media-feed/model-scala.json', 2),
    reg('slice', 'bodywork:combi', '/en/media-feed/bodywork-combi.json', 900),
    reg('detail', 'image:2026', '/en/media-feed/image-2026.json'),
  ];
  files['/en/media-feed/model-fabia.json'] = [row(1), row(2)];
  files['/en/media-feed/model-scala.json'] = [row(2), row(3)];
  files['/en/media-feed/image-2026.json'] = [row(1), row(2), row(3), row(4)];
  const rows = await loadRailRows('/en/media-feed.json', { bodywork: ['combi'], model: ['Fabia', 'scala'] });
  assert.deepEqual(rows.map((r) => r.id), ['1', '2', '3'], 'row 2 once');
  assert.equal(requests.includes('/en/media-feed/bodywork-combi.json'), false);
  assert.equal(requests.includes('/en/media-feed/image-2026.json'), false);

  // a facet value without a slice: every row (the rail filters them)
  const wide = await loadRailRows('/en/media-feed.json', { model: ['fabia', 'kodiaq'] });
  assert.deepEqual(wide.map((r) => r.id), ['1', '2', '3', '4']);
});

test('loadRailRows: a story rail on the query index reads it whole, no registry request', async () => {
  files['/en/query-index.json'] = [{ path: '/en/a', title: 'A' }];
  const rows = await loadRailRows('/en/query-index.json', { model: ['fabia'] });
  assert.deepEqual(rows.map((r) => r.path), ['/en/a']);
  assert.deepEqual(requests, ['/en/query-index.json']);
});

test('findRowsByFile: only the keyed shards of the asked files; else the whole feed', async () => {
  const a = row(1);
  const b = row(2);
  const key = (r) => keyShard(fileKey(r.original), 4);
  files['/en/media-feed/index.json'] = [0, 1, 2, 3].map((n) => reg('keyed', String(n), `/en/media-feed/key-${n}.json`));
  [0, 1, 2, 3].forEach((n) => { files[`/en/media-feed/key-${n}.json`] = [a, b].filter((r) => key(r) === n); });
  const found = await findRowsByFile('/en/media-feed.json', [a.original, 'https://cdn.example.test/none.jpg']);
  assert.deepEqual([...found.keys()], ['file-1.jpg']);
  assert.equal(found.get('file-1.jpg').id, '1');
  const keyedRequests = requests.filter((p) => p.includes('/key-'));
  assert.deepEqual(keyedRequests, [...new Set([`/en/media-feed/key-${key(a)}.json`, `/en/media-feed/key-${keyShard('none.jpg', 4)}.json`])]);

  clearQueryIndexCache();
  clearMediaFeedCache();
  files = { '/en/media-feed.json': [a, { ...a, id: '9' }] };
  const whole = await findRowsByFile('/en/media-feed.json', [a.original.toUpperCase()]);
  assert.equal(whole.get('file-1.jpg').id, '9', 'the later row wins, as before');
});

test('openListingFeed without shards: whole rows, nothing to hydrate', async () => {
  files['/en/media-feed.json'] = [row(1), row(2)];
  const feed = await openListingFeed('/en/media-feed.json', { template: 'image' });
  assert.equal(feed.lazy, false);
  assert.equal(feed.head, null);
  const rows = await feed.rows();
  assert.equal(feed.hydrated(rows), rows);
  assert.equal(await feed.hydrate(rows), rows);
});

test('openListingFeed with shards: head first, facet index, then only the needed detail shards', async () => {
  files['/en/media-feed/index.json'] = [
    reg('head', 'image', '/en/media-feed/head-image.json', 1, { total: '3' }),
    reg('facets', '', '/en/media-feed/facets.json', 3),
    reg('detail', 'image:2026', '/en/media-feed/image-2026.json', 2),
    reg('detail', 'image:2024', '/en/media-feed/image-2024.json', 1),
  ];
  const full = [row(1), row(2), row(3)];
  files['/en/media-feed/head-image.json'] = [full[0]];
  files['/en/media-feed/facets.json'] = [
    { id: '1', template: 'image', detail: 'image:2026' },
    { id: '2', template: 'image', detail: 'image:2026' },
    { id: '3', template: 'image', detail: 'image:2024' },
    { id: '4', template: 'image', detail: 'image:2026' },
  ];
  files['/en/media-feed/image-2026.json'] = [full[0], full[1]];
  files['/en/media-feed/image-2024.json'] = [full[2]];

  const feed = await openListingFeed('/en/media-feed.json', { template: 'image' });
  assert.equal(feed.lazy, true);
  const head = await feed.head();
  assert.deepEqual([head.rows.length, head.total], [1, 3]);
  const index = await feed.rows();
  assert.equal(requests.some((p) => p.includes('/image-20')), false, 'no detail shard yet');

  assert.deepEqual(feed.hydrated(index.slice(0, 1)).map((r) => r.title), ['t1'], 'the head row is at hand');
  assert.equal(feed.hydrated(index.slice(0, 2)), null);
  const page = await feed.hydrate(index.slice(0, 2));
  assert.deepEqual(page.map((r) => r.title), ['t1', 't2']);
  assert.equal(requests.includes('/en/media-feed/image-2024.json'), false);
  // a row its detail shard doesn't have: the whole feed is read; not there either, it is left out
  files['/en/media-feed.json'] = full;
  const rest = await feed.hydrate([index[3], index[2]]);
  assert.deepEqual(rest.map((r) => r.id), ['3']);
  assert.ok(requests.includes('/en/media-feed.json'), 'the whole feed as the fallback');

  // a path-scoped listing needs the rows' paths: full rows
  const scoped = await openListingFeed('/en/media-feed.json', { template: 'image', path: '/x' });
  assert.equal(scoped.lazy, false);
});

test('openListingFeed: a failed detail shard falls back to the whole feed; both failing rejects', async () => {
  files['/en/media-feed/index.json'] = [
    reg('facets', '', '/en/media-feed/facets.json'),
    reg('detail', 'image:2026', '/en/media-feed/missing.json'),
  ];
  files['/en/media-feed/facets.json'] = [{ id: '1', detail: 'image:2026' }];
  files['/en/media-feed.json'] = [row(1)];
  const feed = await openListingFeed('/en/media-feed.json');
  const page = await feed.hydrate(await feed.rows());
  assert.deepEqual(page.map((r) => r.title), ['t1']);

  clearQueryIndexCache();
  clearMediaFeedCache();
  delete files['/en/media-feed.json'];
  const broken = await openListingFeed('/en/media-feed.json');
  await assert.rejects(broken.hydrate(await broken.rows()), /404/);
});

test('openListingFeed: a facet index that fails to load gives full rows (detail shards, else the whole feed)', async () => {
  files['/en/media-feed/index.json'] = [
    reg('facets', '', '/en/media-feed/missing-facets.json'),
    reg('detail', 'image:2026', '/en/media-feed/image-2026.json'),
  ];
  files['/en/media-feed/image-2026.json'] = [row(1), row(2)];
  const feed = await openListingFeed('/en/media-feed.json');
  assert.equal(feed.lazy, true);
  const rows = await feed.rows();
  assert.deepEqual(rows.map((r) => r.title), ['t1', 't2'], 'full rows');
  assert.equal(feed.lazy, false);
  assert.equal(feed.hydrated(rows), rows, 'nothing to fill in');
});
