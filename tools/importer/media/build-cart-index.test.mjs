/*
 * Unit tests for the media cart index generator (SKODA-505a).
 * Run: node --test tools/importer/media/build-cart-index.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCartIndex, serialize, BASE } from './build-cart-index.mjs';

const HOST = 'https://publish-p220607-e2281243.adobeaemcloud.com';

let n = 0;
function row(damRel, {
  bytes = 100, mime = 'image/jpeg', urls = [], publish = 'done',
} = {}) {
  n += 1;
  const url = `${HOST}${BASE}${damRel}`;
  return [`r${n}`, {
    logical_id: `r${n}`,
    source_url: urls[0] || '',
    seen_urls: urls.slice(1),
    steps: { publish },
    public_url: publish === 'done' ? url : '',
    public_verified: publish === 'done' ? { url, bytes, mime } : null,
  }];
}
const manifest = (...rows) => ({ rows: Object.fromEntries(rows) });
const cdn = (p) => `https://cdn.skoda-storyboard.com/${p}`;
const dd = (p) => `https://www.skoda-storyboard.com/direct-download/${p}`;

test('only verified published rows become assets, sorted by path, mimes indexed', () => {
  const { index, stats } = buildCartIndex(manifest(
    row('en/b.png', { mime: 'image/png', urls: [cdn('2026/08/b.png')] }),
    row('en/a.jpg', { urls: [cdn('2026/08/a.jpg')] }),
    row('en/c.mp4', { publish: 'pending', urls: [cdn('2026/08/c.mp4')] }),
  ));
  assert.deepEqual(index.mimes, ['image/jpeg', 'image/png']);
  assert.deepEqual(index.assets, [['en/a.jpg', 100, 0], ['en/b.png', 100, 1]]);
  assert.deepEqual(index.keys, { '2026/08/a.jpg': 0, '2026/08/b.png': 1 });
  assert.equal(stats.assets, 2);
});

test('keys from every first-party link of the row; foreign hosts ignored', () => {
  const { index } = buildCartIndex(manifest(
    row('en/a.jpg', { urls: [dd('2026/08/a.jpg'), cdn('2026/08/a-copy.jpg'), 'https://i.ytimg.com/vi/x/a.jpg'] }),
  ));
  assert.deepEqual(Object.keys(index.keys), ['2026/08/a-copy.jpg', '2026/08/a.jpg']);
});

test('derivative keys are left out when stripping lands on the same asset', () => {
  const { index } = buildCartIndex(manifest(
    row('en/a.jpg', { urls: [cdn('2026/08/a.jpg'), cdn('2026/08/a-1920x1280.jpg')] }),
    // the derivative is the only key of its asset: kept
    row('en/d.jpg', { urls: [cdn('2026/08/d-768x512.jpg')] }),
  ));
  assert.deepEqual(index.keys, { '2026/08/a.jpg': 0, '2026/08/d-768x512.jpg': 1 });
});

test('a key on the same file filed twice maps to the first path; different files drop it', () => {
  const { index, stats } = buildCartIndex(manifest(
    row('en/kit/texts/k.pdf', { bytes: 9, mime: 'application/pdf', urls: [dd('2026/05/k.pdf')] }),
    row('en/kit/story/k.pdf', { bytes: 9, mime: 'application/pdf', urls: [dd('2026/05/k.pdf')] }),
    row('en/x/one.jpg', { bytes: 1, urls: [cdn('2026/05/clash.jpg')] }),
    row('en/y/two.jpg', { bytes: 2, urls: [cdn('2026/05/clash.jpg')] }),
  ));
  const kit = index.assets.findIndex(([p]) => p === 'en/kit/story/k.pdf');
  assert.equal(index.keys['2026/05/k.pdf'], kit, 'first path in sort order');
  assert.equal(index.keys['2026/05/clash.jpg'], undefined);
  assert.equal(stats.duplicates, 1);
  assert.deepEqual(stats.dropped, ['2026/05/clash.jpg']);
});

test('rows published outside the DAM host or base are an error', () => {
  const [id, bad] = row('en/a.jpg');
  bad.public_url = bad.public_url.replace(HOST, 'https://example.com');
  bad.public_verified.url = bad.public_url;
  assert.throws(() => buildCartIndex(manifest([id, bad])), /publish origin/);
  const [id2, out] = row('en/a.jpg');
  out.public_url = `${HOST}/content/dam/other/a.jpg`;
  out.public_verified.url = out.public_url;
  assert.throws(() => buildCartIndex(manifest([id2, out])), /outside/);
});

test('serialize: deterministic, one entry per line, valid JSON of the index', () => {
  const m = manifest(
    row('en/a.jpg', { urls: [cdn('2026/08/a.jpg')] }),
    row('en/b.jpg', { urls: [cdn('2026/08/b.jpg')] }),
  );
  const text = serialize(buildCartIndex(m).index);
  assert.equal(text, serialize(buildCartIndex(m).index));
  assert.deepEqual(JSON.parse(text), buildCartIndex(m).index);
  assert.ok(text.includes('\n["en/a.jpg",100,0],\n'));
  assert.ok(text.endsWith('}}\n'));
});
