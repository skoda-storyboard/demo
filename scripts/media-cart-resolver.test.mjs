/*
 * Unit tests for the media cart resolver (SKODA-505a): page link → published DAM original.
 * Run: node --test scripts/media-cart-resolver.test.mjs
 */
/* global globalThis */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

globalThis.window = globalThis.window || {};
const {
  normalizeSource, stripDerivative, damPath, decodeIndex, createResolver, kindOf, filenameOf,
  DAM_HOST,
} = await import('./media-cart-resolver.js');

const INDEX = {
  v: 1,
  base: '/content/dam/storyboard/',
  mimes: ['application/pdf', 'image/jpeg', 'video/mp4'],
  assets: [
    ['en/a/hero_ab12.jpg', 3000000, 1],
    ['en/a/kit_cd34.pdf', 90000, 0],
    ['en/v/clip_ef56.mp4', 300000000, 2],
    ['en/b/JUBIL%2525C3%2525A9_77.jpg', 1234, 1],
  ],
  keys: {
    '2026/08/hero_ab12.jpg': 0,
    '2026/05/kit_cd34.pdf': 1,
    '2026/06/clip_ef56.mp4': 2,
    '2025/01/JUBIL%25C3%25A9_77.jpg': 3,
  },
};

const json = (body, init = {}) => ({
  ok: true, status: 200, json: async () => body, ...init,
});

function resolver(extra = {}) {
  const calls = [];
  const fetchImpl = async (url, opts = {}) => {
    calls.push([url, opts.method || 'GET']);
    if (extra.head && opts.method === 'HEAD') return extra.head(url);
    if (extra.index) return extra.index(url);
    return json(INDEX);
  };
  return { ...createResolver({ fetchImpl, indexUrl: '/scripts/media-cart-index.json' }), calls };
}

test('normalizeSource: first-party source links → host-less key, the rest null', () => {
  assert.equal(normalizeSource('https://www.skoda-storyboard.com/direct-download/2026/08/a.jpg'), '2026/08/a.jpg');
  assert.equal(normalizeSource('https://cdn.skoda-storyboard.com/2026/08/a.jpg?x=1#y'), '2026/08/a.jpg');
  assert.equal(normalizeSource('https://www.skoda-storyboard.com/wp-content/uploads/2026/08/a.jpg'), '2026/08/a.jpg');
  assert.equal(normalizeSource('http://skoda-storyboard.com/2026/08/a.jpg'), '2026/08/a.jpg');
  // percent-encoding stays as-is (the DAM holds double-encoded names)
  assert.equal(normalizeSource('https://cdn.skoda-storyboard.com/2025/01/JUBIL%25C3%25A9_77.jpg'), '2025/01/JUBIL%25C3%25A9_77.jpg');
  assert.equal(normalizeSource('https://evil.example.com/2026/08/a.jpg'), null);
  assert.equal(normalizeSource('https://notskoda-storyboard.com/2026/08/a.jpg'), null);
  assert.equal(normalizeSource('javascript:alert(1)'), null); // eslint-disable-line no-script-url
  assert.equal(normalizeSource('https://www.skoda-storyboard.com/'), null);
  assert.equal(normalizeSource('not a url'), null);
  assert.equal(normalizeSource(''), null);
});

test('stripDerivative drops WordPress scaled sizes and the -scaled copy', () => {
  assert.equal(stripDerivative('2026/08/a-1920x1280.jpg'), '2026/08/a.jpg');
  assert.equal(stripDerivative('2026/08/a-scaled.jpg'), '2026/08/a.jpg');
  assert.equal(stripDerivative('2026/08/a-scaled-1920x1280.jpg'), '2026/08/a.jpg');
  assert.equal(stripDerivative('2026/08/clip-1080p_ab.mp4'), '2026/08/clip-1080p_ab.mp4');
  assert.equal(stripDerivative('2026/08/a.jpg'), '2026/08/a.jpg');
});

test('damPath only accepts the publish host under /content/dam/', () => {
  assert.equal(damPath(`${DAM_HOST}/content/dam/storyboard/en/a.jpg`), '/content/dam/storyboard/en/a.jpg');
  assert.equal(damPath('https://author-p1.adobeaemcloud.com/content/dam/a.jpg'), null);
  assert.equal(damPath(`${DAM_HOST}/etc/a.jpg`), null);
  assert.equal(damPath(`${DAM_HOST}/content/dam/folder/`), null);
});

test('helpers: kind from mime, decoded filename', () => {
  assert.deepEqual(['image/png', 'video/mp4', 'application/pdf', ''].map((m) => kindOf(m)), ['image', 'video', 'document', 'document']);
  assert.equal(filenameOf('/content/dam/x/Skoda%20Elroq.jpg'), 'Skoda Elroq.jpg');
  assert.equal(filenameOf('/content/dam/x/bad%E0.jpg'), 'bad%E0.jpg');
});

test('decodeIndex expands the compact format and rejects others', () => {
  const idx = decodeIndex(INDEX);
  assert.equal(idx.assets[2].path, '/content/dam/storyboard/en/v/clip_ef56.mp4');
  assert.equal(idx.assets[2].mime, 'video/mp4');
  assert.equal(idx.keys.get('2026/05/kit_cd34.pdf'), 1);
  assert.equal(idx.byPath.get('/content/dam/storyboard/en/a/hero_ab12.jpg'), 0);
  assert.throws(() => decodeIndex({ v: 2, assets: [], keys: {} }), /unsupported/);
  assert.throws(() => decodeIndex(null), /unsupported/);
});

test('resolve: source link → DAM original via the index (exact, direct-download, derivative)', async () => {
  const { resolve, calls } = resolver();
  const want = {
    id: '/content/dam/storyboard/en/a/hero_ab12.jpg',
    url: `${DAM_HOST}/content/dam/storyboard/en/a/hero_ab12.jpg`,
    filename: 'hero_ab12.jpg',
    bytes: 3000000,
    mime: 'image/jpeg',
    kind: 'image',
  };
  assert.deepEqual(await resolve('https://cdn.skoda-storyboard.com/2026/08/hero_ab12.jpg'), { ...want, sourceKey: '2026/08/hero_ab12.jpg' });
  assert.equal((await resolve('https://www.skoda-storyboard.com/direct-download/2026/08/hero_ab12.jpg')).id, want.id);
  assert.equal((await resolve('https://cdn.skoda-storyboard.com/2026/08/hero_ab12-1920x1280.jpg')).id, want.id);
  const pdf = await resolve('https://www.skoda-storyboard.com/direct-download/2026/05/kit_cd34.pdf');
  assert.deepEqual([pdf.kind, pdf.mime, pdf.bytes], ['document', 'application/pdf', 90000]);
  assert.equal((await resolve('https://cdn.skoda-storyboard.com/2026/06/clip_ef56.mp4')).kind, 'video');
  // the index is fetched once
  assert.equal(calls.length, 1);
});

test('resolve: percent-encoded names match exactly, DAM filename decoded once', async () => {
  const { resolve } = resolver();
  const it = await resolve('https://cdn.skoda-storyboard.com/2025/01/JUBIL%25C3%25A9_77.jpg');
  assert.equal(it.id, '/content/dam/storyboard/en/b/JUBIL%2525C3%2525A9_77.jpg');
  assert.equal(it.filename, 'JUBIL%25C3%25A9_77.jpg');
});

test('resolve: unknown, foreign and malformed links → null (never the source site)', async () => {
  const { resolve } = resolver();
  assert.equal(await resolve('https://cdn.skoda-storyboard.com/2026/08/unknown.jpg'), null);
  assert.equal(await resolve('https://example.com/2026/08/hero_ab12.jpg'), null);
  assert.equal(await resolve(''), null);
  assert.equal(await resolve(undefined), null);
});

test('resolve: DAM links pass through (indexed → index data, else a HEAD)', async () => {
  const head = (url) => ({
    ok: url.endsWith('new.png'),
    headers: new Map([['content-length', '4321'], ['content-type', 'image/png; charset=binary']]),
  });
  const { resolve, calls } = resolver({ head });
  const indexed = await resolve(`${DAM_HOST}/content/dam/storyboard/en/a/kit_cd34.pdf`);
  assert.deepEqual([indexed.bytes, indexed.mime, indexed.sourceKey], [90000, 'application/pdf', null]);
  const fresh = await resolve(`${DAM_HOST}/content/dam/storyboard/en/new.png`);
  assert.deepEqual([fresh.id, fresh.bytes, fresh.mime, fresh.kind], ['/content/dam/storyboard/en/new.png', 4321, 'image/png', 'image']);
  assert.equal(await resolve(`${DAM_HOST}/content/dam/storyboard/en/gone.png`), null);
  assert.deepEqual(calls.filter(([, m]) => m === 'HEAD').length, 2);
});

test('resolve: a failed index load resolves null and is retried next time', async () => {
  let fail = true;
  const { resolve, calls } = resolver({
    index: () => (fail ? { ok: false, status: 503 } : json(INDEX)),
  });
  assert.equal(await resolve('https://cdn.skoda-storyboard.com/2026/08/hero_ab12.jpg'), null);
  fail = false;
  assert.ok(await resolve('https://cdn.skoda-storyboard.com/2026/08/hero_ab12.jpg'));
  assert.equal(calls.length, 2);
});

test('the committed index decodes and every key points at an asset', () => {
  const committed = JSON.parse(readFileSync(new URL('./media-cart-index.json', import.meta.url), 'utf8'));
  const idx = decodeIndex(committed);
  assert.ok(idx.assets.length > 0);
  idx.keys.forEach((i, key) => assert.ok(idx.assets[i], `key ${key} → asset ${i}`));
  idx.assets.forEach((a) => {
    assert.ok(a.path.startsWith('/content/dam/storyboard/'), a.path);
    assert.ok(a.bytes > 0 && a.mime, a.path);
  });
});
