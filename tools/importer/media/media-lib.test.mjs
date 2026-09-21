/*
 * Tests for the media-import helpers + the AEMaaCS 3-step uploader.
 * Zero-dependency: node:test + node:assert + node:http (no live DAM needed).
 * Run: node --test tools/importer/media/
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import {
  logicalId, masterUrl, normalizeExtension, isAspectCrop, derivativeSuffix,
  damPathFor, pagePathFromFile, splitBuffer, imageSize, ratiosDiffer,
  uploadToDAM, resolveDamToken,
} from './media-lib.mjs';

// ---- F3: path-qualified logical id -----------------------------------------
test('F3: same basename in different folders → distinct logical ids', () => {
  const a = logicalId('https://cdn.x.com/2018/08/hero.jpg');
  const b = logicalId('https://cdn.x.com/2021/03/hero.jpg');
  assert.notEqual(a, b);
  assert.match(a, /^[0-9a-f]{8}__hero\.jpg$/);
});

test('F3: derivative + master + query variants share one logical id', () => {
  const base = 'https://cdn.x.com/2024/10/elroq_header_fede6794';
  const id1 = logicalId(`${base}-1920x750.jpg`);
  const id2 = logicalId(`${base}.jpg`);
  const id3 = logicalId(`${base}-1920x750.jpg?width=750`);
  assert.equal(id1, id2);
  assert.equal(id1, id3);
});

// ---- masterUrl / scaled ladder ---------------------------------------------
test('masterUrl strips scaled -WxH to the WordPress original', () => {
  assert.equal(
    masterUrl('https://cdn.x.com/2024/10/elroq_header_fede6794-1920x1280.jpg'),
    'https://cdn.x.com/2024/10/elroq_header_fede6794.jpg',
  );
});

test('masterUrl strips a non-ladder -WxH too (the no-suffix file is the master)', () => {
  assert.equal(
    masterUrl('https://cdn.x.com/2024/10/elroq_header_fede6794-1920x750.jpg'),
    'https://cdn.x.com/2024/10/elroq_header_fede6794.jpg',
  );
});

// ---- F7: aspect-crop detection ---------------------------------------------
test('F7: ladder size is not a crop; non-ladder size is flagged', () => {
  assert.equal(isAspectCrop('https://cdn.x.com/a/x-1920x1280.jpg'), false);
  assert.equal(isAspectCrop('https://cdn.x.com/a/x-1920x1082.jpg'), true);
  assert.equal(derivativeSuffix('https://cdn.x.com/a/x-1920x1082.jpg'), '1920x1082');
});

// ---- F8: extension normalization / double-extension ------------------------
test('F8: double-extension .JPG-384x256.jpg collapses to inner ext, lowercased', () => {
  assert.equal(
    normalizeExtension('https://cdn.x.com/a/DSC04445_fe287597.JPG-384x256.jpg'),
    'https://cdn.x.com/a/DSC04445_fe287597.jpg',
  );
});

test('F8: single uppercase extension is lowercased', () => {
  assert.equal(normalizeExtension('https://cdn.x.com/a/PHOTO.PNG'), 'https://cdn.x.com/a/PHOTO.png');
});

// ---- C: page-mirrored DAM path + page-path derivation ----------------------
test('C: pagePathFromFile strips content/ prefix and .plain.html', () => {
  assert.equal(pagePathFromFile('content/en/skoda-model/elroq.plain.html'), 'en/skoda-model/elroq');
  assert.equal(pagePathFromFile('/abs/repo/content/en/news/foo.html'), 'en/news/foo');
});

test('C: damPathFor mirrors the page path under the base folder', () => {
  assert.equal(
    damPathFor('https://cdn.x.com/2024/10/elroq_header_fede6794-1920x750.jpg', { pagePath: 'en/skoda-model/elroq' }),
    '/content/dam/storyboard/en/skoda-model/elroq/elroq_header_fede6794.jpg',
  );
});

// ---- splitBuffer (multi-part upload) ---------------------------------------
test('splitBuffer: single URI → one part; N URIs → N ordered parts covering all bytes', () => {
  const buf = Buffer.from('abcdefghij'); // 10 bytes
  assert.equal(splitBuffer(buf, ['u1'], 0).length, 1);
  const parts = splitBuffer(buf, ['u1', 'u2'], 5);
  assert.equal(parts.length, 2);
  assert.equal(Buffer.concat(parts).toString(), 'abcdefghij');
});

// ---- imageSize / ratiosDiffer ----------------------------------------------
test('imageSize reads PNG IHDR dimensions', () => {
  const png = Buffer.alloc(24);
  png[0] = 0x89; png[1] = 0x50;
  png.writeUInt32BE(800, 16); png.writeUInt32BE(600, 20);
  assert.deepEqual(imageSize(png), { w: 800, h: 600 });
});

test('ratiosDiffer flags a different aspect ratio', () => {
  assert.equal(ratiosDiffer({ w: 1920, h: 1280 }, { w: 1920, h: 1082 }), true);
  assert.equal(ratiosDiffer({ w: 1920, h: 1280 }, { w: 960, h: 640 }), false);
});

// ---- D: token resolution ---------------------------------------------------
test('D: resolveDamToken reads AEM_DAM_TOKEN env, else returns null', () => {
  const prev = process.env.AEM_DAM_TOKEN;
  process.env.AEM_DAM_TOKEN = '  tok-123  ';
  assert.equal(resolveDamToken({ tokenFile: '/nonexistent' }), 'tok-123');
  delete process.env.AEM_DAM_TOKEN;
  const prevDev = process.env.AEM_DEV_TOKEN;
  delete process.env.AEM_DEV_TOKEN;
  assert.equal(resolveDamToken({ tokenFile: '/nonexistent-xyz' }), null);
  if (prev !== undefined) process.env.AEM_DAM_TOKEN = prev;
  if (prevDev !== undefined) process.env.AEM_DEV_TOKEN = prevDev;
});

// ---- E/H: mock AEMaaCS 3-step direct-binary-upload -------------------------
function startMockDam() {
  const calls = [];
  const server = createServer((req, res) => {
    const auth = req.headers.authorization || '';
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      calls.push({
        method: req.method, url: req.url, auth, len: body.length,
      });
      // Bearer required on the AEM endpoints (not the blob PUT).
      if (req.url.includes('.initiateUpload.json')) {
        if (!auth.startsWith('Bearer ')) { res.writeHead(401); res.end('no bearer'); return; }
        const { port } = server.address();
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({
          completeURI: '/content/dam/storyboard/en/skoda-model/elroq.completeUpload.json',
          files: [{
            uploadToken: 'tok-abc',
            uploadURIs: [`http://127.0.0.1:${port}/blob/part0`, `http://127.0.0.1:${port}/blob/part1`],
            minPartSize: 1,
            maxPartSize: 5,
          }],
        }));
      } else if (req.url.startsWith('/blob/')) {
        res.writeHead(201); res.end('ok'); // blob store PUT, no auth
      } else if (req.url.includes('.completeUpload.json')) {
        if (!auth.startsWith('Bearer ')) { res.writeHead(401); res.end('no bearer'); return; }
        res.writeHead(200); res.end('{"ok":true}');
      } else {
        res.writeHead(404); res.end('nope');
      }
    });
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, calls, port: server.address().port }));
  });
}

test('E/H: uploadToDAM drives initiate → PUT parts (ordered) → complete with bearer', async () => {
  const { server, calls, port } = await startMockDam();
  try {
    const damConfig = { baseUrl: `http://127.0.0.1:${port}`, folder: '/content/dam/storyboard' };
    const res = await uploadToDAM({
      damConfig,
      damPath: '/content/dam/storyboard/en/skoda-model/elroq/hero.jpg',
      buffer: Buffer.from('abcdefghij'),
      contentType: 'image/jpeg',
      token: 'tok-123',
    });
    assert.equal(res.ok, true);
    assert.equal(res.status, 200);
    // ordered: initiate, then 2 blob PUTs, then complete
    const label = (c) => {
      if (c.url.includes('initiateUpload')) return 'init';
      if (c.url.startsWith('/blob/')) return 'put';
      if (c.url.includes('completeUpload')) return 'complete';
      return '?';
    };
    assert.deepEqual(calls.map(label), ['init', 'put', 'put', 'complete']);
    // bearer present on init + complete
    assert.ok(calls[0].auth.startsWith('Bearer '));
    assert.ok(calls[3].auth.startsWith('Bearer '));
    // parts covered all 10 bytes
    assert.equal(calls[1].len + calls[2].len, 10);
  } finally {
    server.close();
  }
});

test('E/H: uploadToDAM without a token declines gracefully (reference-in-place)', async () => {
  const res = await uploadToDAM({
    damConfig: { baseUrl: 'http://127.0.0.1:1', folder: '/content/dam/storyboard' },
    damPath: '/content/dam/storyboard/x/hero.jpg',
    buffer: Buffer.from('x'),
    contentType: 'image/jpeg',
    token: null,
  });
  assert.equal(res.ok, false);
  assert.match(res.body, /no DAM token/);
});
