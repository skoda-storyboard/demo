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
  uploadToDAM, ensureDamFolder, resolveDamToken,
  needsMediaBuild, OVERSIZE_BYTES,
} from './media-lib.mjs';

test('delivery-only rows resume when DAM ingest is requested, without a blanket force', () => {
  const row = {
    status: 'done',
    bytes: 2048,
    delivery_url: 'https://cdn.example.test/a.jpg',
    steps: { deliver: 'done', dam: 'n/a', da: 'n/a' },
  };
  assert.equal(needsMediaBuild(row), false);
  assert.equal(needsMediaBuild(row, { dam: true }), true);
  assert.equal(needsMediaBuild(row, { da: true }), true);
  assert.equal(needsMediaBuild({ ...row, bytes: OVERSIZE_BYTES + 1 }), true);
  assert.equal(needsMediaBuild({ ...row, steps: { ...row.steps, dam: 'done' }, dam_asset_path: '/dam/a.jpg' }, { dam: true }), false);
});

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
  assert.throws(() => splitBuffer(buf, ['u1'], 5), /cannot hold/);
  assert.throws(() => splitBuffer(buf, ['u1', 'u2'], 4), /cannot hold/);
  assert.throws(() => splitBuffer(Buffer.from('ab'), ['u1', 'u2', 'u3'], 5), /URI count/);
});

test('uploadToDAM rejects insufficient part capacity before sending any bytes', async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push(options.method || 'GET');
    if (url.endsWith('.initiateUpload.json')) {
      return {
        ok: true,
        json: async () => ({
          files: [{ uploadToken: 'mock', uploadURIs: ['https://blob.example.test/part'], maxPartSize: 5 }],
        }),
      };
    }
    if (options.method === 'PUT') throw new Error('incomplete upload attempted');
    return { ok: true, status: 200 };
  };
  const result = await uploadToDAM({
    damConfig: { baseUrl: 'https://dam.example.test', folder: '/content/dam/storyboard' },
    damPath: '/content/dam/storyboard/en/story/hero.jpg',
    buffer: Buffer.from('abcdefghij'),
    contentType: 'image/jpeg',
    token: 'mock',
    fetchImpl,
  });
  assert.equal(result.ok, false);
  assert.match(result.body, /cannot hold the complete original/);
  assert.deepEqual(calls, ['GET', 'POST']);
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
  // searchDefaults:false so a real ambient token file (.migration/secrets/aem-token,
  // ~/.aem-dev-token) can't leak into this negative assertion.
  assert.equal(resolveDamToken({ tokenFile: '/nonexistent-xyz', searchDefaults: false }), null);
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
      if (req.method === 'GET' && req.url.endsWith('.json')) {
        // folder existence check — report "missing" so ensureDamFolder creates it.
        res.writeHead(404); res.end('not found'); return;
      }
      if (req.url.startsWith('/api/assets/')) {
        if (!auth.startsWith('Bearer ')) { res.writeHead(401); res.end('no bearer'); return; }
        res.writeHead(201); res.end('{}'); return; // folder created
      }
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
    // ordered: leaf existence check, create en/skoda-model/elroq, initiate, 2 PUTs, complete
    const label = (c) => {
      if (c.method === 'GET' && c.url.endsWith('.json')) return 'check';
      if (c.url.startsWith('/api/assets/')) return 'mkdir';
      if (c.url.includes('initiateUpload')) return 'init';
      if (c.url.startsWith('/blob/')) return 'put';
      if (c.url.includes('completeUpload')) return 'complete';
      return '?';
    };
    assert.deepEqual(
      calls.map(label),
      ['check', 'mkdir', 'mkdir', 'mkdir', 'init', 'put', 'put', 'complete'],
    );
    // only the page-mirrored tail is created; the base folder is left untouched
    assert.deepEqual(
      calls.filter((c) => c.url.startsWith('/api/assets/')).map((c) => c.url),
      ['/api/assets/storyboard/en', '/api/assets/storyboard/en/skoda-model', '/api/assets/storyboard/en/skoda-model/elroq'],
    );
    // bearer present on every AEM call (mkdir + init + complete)
    assert.ok(calls.filter((c) => label(c) !== 'put').every((c) => c.auth.startsWith('Bearer ')));
    // parts covered all 10 bytes
    const puts = calls.filter((c) => label(c) === 'put');
    assert.equal(puts.reduce((n, c) => n + c.len, 0), 10);
  } finally {
    server.close();
  }
});

// ---- ensureDamFolder (page-mirrored folder auto-create) --------------------
const damCfg = { baseUrl: 'http://dam', folder: '/content/dam/storyboard' };
const okRes = (status = 201, body = '{}') => ({ ok: status < 400, status, text: async () => body });

test('ensureDamFolder: creates only the tail below the base, top-down', async () => {
  const calls = [];
  const fetchImpl = async (url, opts = {}) => {
    calls.push({ url, method: opts.method || 'GET' });
    if ((opts.method || 'GET') === 'GET') return okRes(404, 'nf'); // leaf missing
    return okRes(201);
  };
  const r = await ensureDamFolder({
    damConfig: damCfg, folderPath: '/content/dam/storyboard/en/skoda-model/elroq', token: 't', fetchImpl,
  });
  assert.equal(r.ok, true);
  assert.deepEqual(
    calls.filter((c) => c.method === 'POST').map((c) => c.url),
    ['http://dam/api/assets/storyboard/en', 'http://dam/api/assets/storyboard/en/skoda-model', 'http://dam/api/assets/storyboard/en/skoda-model/elroq'],
  );
});

test('ensureDamFolder: leaf already exists → single GET, no creates', async () => {
  const calls = [];
  const fetchImpl = async (url, opts = {}) => {
    calls.push({ method: opts.method || 'GET' });
    return okRes(200, '{}'); // leaf present
  };
  const r = await ensureDamFolder({
    damConfig: damCfg, folderPath: '/content/dam/storyboard/en/foo', token: 't', fetchImpl,
  });
  assert.equal(r.ok, true);
  assert.deepEqual(calls, [{ method: 'GET' }]);
});

test('ensureDamFolder: base folder itself needs no creation', async () => {
  let called = false;
  const fetchImpl = async () => { called = true; return okRes(404); };
  const r = await ensureDamFolder({
    damConfig: damCfg, folderPath: '/content/dam/storyboard', token: 't', fetchImpl,
  });
  assert.equal(r.ok, true);
  assert.equal(called, false);
});

test('ensureDamFolder: 409 on create is tolerated (idempotent / concurrent)', async () => {
  const fetchImpl = async (url, opts = {}) => ((opts.method || 'GET') === 'GET' ? okRes(404) : okRes(409, 'exists'));
  const r = await ensureDamFolder({
    damConfig: damCfg, folderPath: '/content/dam/storyboard/en', token: 't', fetchImpl,
  });
  assert.equal(r.ok, true);
});

test('ensureDamFolder: a hard create failure (403) surfaces', async () => {
  const fetchImpl = async (url, opts = {}) => ((opts.method || 'GET') === 'GET' ? okRes(404) : okRes(403, 'denied'));
  const r = await ensureDamFolder({
    damConfig: damCfg, folderPath: '/content/dam/storyboard/en', token: 't', fetchImpl,
  });
  assert.equal(r.ok, false);
  assert.equal(r.status, 403);
  assert.match(r.body, /mkdir storyboard\/en 403/);
});

test('E/H: uploadToDAM surfaces a folder-create failure before initiate', async () => {
  const fetchImpl = async (url, opts = {}) => {
    if ((opts.method || 'GET') === 'GET') return okRes(404);
    if (url.includes('/api/assets/')) return okRes(403, 'denied');
    throw new Error('should not reach initiate when folder creation fails');
  };
  const res = await uploadToDAM({
    damConfig: damCfg,
    damPath: '/content/dam/storyboard/en/skoda-model/elroq/hero.jpg',
    buffer: Buffer.from('x'),
    contentType: 'image/jpeg',
    token: 't',
    fetchImpl,
  });
  assert.equal(res.ok, false);
  assert.equal(res.status, 403);
  assert.match(res.body, /^folder mkdir/);
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
