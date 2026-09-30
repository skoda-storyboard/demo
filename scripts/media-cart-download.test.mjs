/*
 * Unit tests for the media cart download (SKODA-505a): single link vs one zip of the
 * originals, verified against an independent reader (fflate's unzip from npm) and node's
 * CRC-32; failed items skipped, abort, names, progress. Also pins the vendored fflate.
 * Run: node --test scripts/media-cart-download.test.mjs
 */
/* eslint-disable import/no-extraneous-dependencies */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { crc32 } from 'node:zlib';
import { createRequire } from 'node:module';
import { unzipSync } from 'fflate';
import { downloadItems, uniqueNames, zipName } from './media-cart-download.js';

const DAM = 'https://publish-p220607-e2281243.adobeaemcloud.com/content/dam/storyboard/en';
const bytes = (len, seed) => Uint8Array.from({ length: len }, (_, i) => (i * 31 + seed) % 256);
const item = (name, data, extra = {}) => ({
  id: `/content/dam/storyboard/en/${name}`, url: `${DAM}/${name}`, filename: name, bytes: data.length, ...extra,
});

// a Response whose body arrives in chunks
function streamed(data, chunk = 1000) {
  return new Response(new ReadableStream({
    start(c) {
      for (let i = 0; i < data.length; i += chunk) c.enqueue(data.slice(i, i + chunk));
      c.close();
    },
  }));
}

function harness(files, extra = {}) {
  const saved = [];
  const blobs = new Map();
  const fetched = [];
  const doc = {
    body: { append() {} },
    createElement: () => {
      const a = { remove() {} };
      a.click = () => saved.push({ href: a.href, download: a.download });
      return a;
    },
  };
  const opts = {
    doc,
    now: () => new Date(2026, 8, 30, 11, 0, 0),
    fetchImpl: async (url, init) => {
      fetched.push([url, init.mode, init.credentials]);
      const data = files[url];
      if (data instanceof Error) throw data;
      if (!data) return new Response('nope', { status: 404 });
      return streamed(data);
    },
    createObjectURL: (blob) => {
      const href = `blob:test/${blobs.size}`;
      blobs.set(href, blob);
      return href;
    },
    revokeObjectURL: () => {},
    later: () => {},
    ...extra,
  };
  const unzip = async (href) => unzipSync(new Uint8Array(await blobs.get(href).arrayBuffer()));
  return {
    opts, saved, fetched, unzip, blobs,
  };
}

test('zipName is skoda-storyboard-media-YYYY-MM-DD.zip', () => {
  assert.equal(zipName(new Date(2026, 0, 5)), 'skoda-storyboard-media-2026-01-05.zip');
});

test('uniqueNames: separators out, repeats numbered before the extension', () => {
  assert.deepEqual(
    uniqueNames(['a.jpg', 'A.jpg', 'a.jpg', 'b/c.pdf', '..hidden', '', 'noext', 'noext']),
    ['a.jpg', 'A (2).jpg', 'a (3).jpg', 'b_c.pdf', 'hidden', 'file', 'noext', 'noext (2)'],
  );
});

test('one item: a direct download of the DAM original, no fetch, no zip', async () => {
  const one = item('hero.jpg', bytes(10, 1));
  const h = harness({});
  let zipLoaded = false;
  const res = await downloadItems([one], { ...h.opts, loadZip: async () => { zipLoaded = true; } });
  assert.deepEqual(res, { mode: 'single', filename: 'hero.jpg', failed: [] });
  assert.deepEqual(h.saved, [{ href: one.url, download: 'hero.jpg' }]);
  assert.equal(h.fetched.length, 0);
  assert.equal(zipLoaded, false, 'fflate is only loaded for a zip');
});

test('several items: one STORE zip, byte-exact entries, valid CRCs, UTF-8 + deduped names', async () => {
  const a = bytes(5000, 1);
  const b = bytes(2345, 2);
  const c = bytes(0, 3);
  const d = bytes(777, 4);
  const items = [item('a.jpg', a), item('Škoda Elroq.png', b), item('empty.pdf', c), item('x/a.jpg', d, { filename: 'a.jpg' })];
  const files = Object.fromEntries(items.map((it, i) => [it.url, [a, b, c, d][i]]));
  const h = harness(files);
  const progress = [];
  const res = await downloadItems(items, { ...h.opts, onProgress: (p) => progress.push(p) });

  assert.equal(res.mode, 'zip');
  assert.equal(res.filename, 'skoda-storyboard-media-2026-09-30.zip');
  assert.deepEqual(res.failed, []);
  assert.equal(h.saved.length, 1);
  assert.equal(h.saved[0].download, res.filename);
  assert.ok(h.fetched.every(([, mode, cred]) => mode === 'cors' && cred === 'omit'));

  const entries = await h.unzip(h.saved[0].href);
  assert.deepEqual(Object.keys(entries), ['a.jpg', 'Škoda Elroq.png', 'empty.pdf', 'a (2).jpg']);
  assert.deepEqual(entries['a.jpg'], a);
  assert.deepEqual(entries['Škoda Elroq.png'], b);
  assert.deepEqual(entries['empty.pdf'], c);
  assert.deepEqual(entries['a (2).jpg'], d);

  // central directory: STORE (method 0), CRC-32 = node's, UTF-8 flag on the Czech name
  const zip = new Uint8Array(await h.blobs.get(h.saved[0].href).arrayBuffer());
  const view = new DataView(zip.buffer);
  const eocd = zip.length - 22;
  assert.equal(view.getUint32(eocd, true), 0x06054b50);
  assert.equal(view.getUint16(eocd + 10, true), 4);
  let at = view.getUint32(eocd + 16, true);
  const central = [];
  for (let i = 0; i < 4; i += 1) {
    assert.equal(view.getUint32(at, true), 0x02014b50);
    const nameLen = view.getUint16(at + 28, true);
    central.push({
      flags: view.getUint16(at + 8, true),
      method: view.getUint16(at + 10, true),
      crc: view.getUint32(at + 16, true),
      size: view.getUint32(at + 24, true),
      name: new TextDecoder().decode(zip.subarray(at + 46, at + 46 + nameLen)),
    });
    at += 46 + nameLen + view.getUint16(at + 30, true) + view.getUint16(at + 32, true);
  }
  [a, b, c, d].forEach((data, i) => {
    assert.equal(central[i].method, 0, 'stored, not deflated');
    assert.equal(central[i].size, data.length);
    assert.equal(central[i].crc, crc32(data) >>> 0); // eslint-disable-line no-bitwise
  });
  assert.ok(central[1].flags & 0x800, 'UTF-8 name flag'); // eslint-disable-line no-bitwise

  const last = progress.at(-1);
  assert.deepEqual([last.done, last.total, last.loaded, last.totalBytes], [4, 4, 8122, 8122]);
  assert.ok(progress.some((p) => p.done === 0 && p.loaded > 0 && p.loaded < 5000), 'reports within a file');
});

test('failed items are skipped and reported; the rest is still zipped', async () => {
  const a = bytes(300, 1);
  const short = bytes(10, 2);
  const items = [
    item('a.jpg', a), item('missing.jpg', bytes(5, 0)), item('short.jpg', short, { bytes: 99 }),
    item('neterr.jpg', bytes(5, 0)),
  ];
  const h = harness({
    [items[0].url]: a, [items[2].url]: short, [items[3].url]: new TypeError('Failed to fetch'),
  });
  const res = await downloadItems(items, h.opts);
  assert.deepEqual(res.failed.map((f) => [f.item.filename, f.reason]), [
    ['missing.jpg', 'HTTP 404'], ['short.jpg', 'size 10, expected 99'], ['neterr.jpg', 'Failed to fetch'],
  ]);
  assert.deepEqual(Object.keys(await h.unzip(h.saved[0].href)), ['a.jpg']);
});

test('nothing fetched: no zip is saved', async () => {
  const h = harness({});
  const res = await downloadItems([item('a.jpg', bytes(3, 0)), item('b.jpg', bytes(3, 0))], h.opts);
  assert.deepEqual([res.mode, res.filename, res.failed.length], ['zip', null, 2]);
  assert.equal(h.saved.length, 0);
});

test('abort: rejects with AbortError and saves nothing', async () => {
  const items = [item('a.jpg', bytes(3000, 1)), item('b.jpg', bytes(3000, 2))];
  const ctrl = new AbortController();
  const h = harness(Object.fromEntries(items.map((it, i) => [it.url, bytes(3000, i + 1)])));
  const run = downloadItems(items, {
    ...h.opts,
    signal: ctrl.signal,
    onProgress: (p) => { if (p.loaded >= 1000) ctrl.abort(); },
  });
  await assert.rejects(run, { name: 'AbortError' });
  assert.equal(h.saved.length, 0);
  await assert.rejects(downloadItems(items, { ...h.opts, signal: AbortSignal.abort() }), { name: 'AbortError' });
});

test('no items: nothing happens', async () => {
  const h = harness({});
  assert.deepEqual(await downloadItems([], h.opts), { mode: 'none', filename: null, failed: [] });
  assert.equal(h.saved.length, 0);
});

test('vendored fflate is the pinned npm build, byte for byte', () => {
  const require = createRequire(import.meta.url);
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const installed = require('fflate/package.json').version; // eslint-disable-line import/extensions
  assert.equal(pkg.devDependencies.fflate, installed, 'exact pin = installed version');
  const read = (p) => readFileSync(new URL(p, import.meta.url));
  const npmDir = new URL(`file://${require.resolve('fflate/package.json').replace(/package\.json$/, '')}`);
  assert.ok(read('./vendor/fflate.js').equals(readFileSync(new URL('esm/browser.js', npmDir))), 'run npm run vendor:fflate');
  assert.ok(read('./vendor/fflate.LICENSE.txt').equals(readFileSync(new URL('LICENSE', npmDir))));
});
