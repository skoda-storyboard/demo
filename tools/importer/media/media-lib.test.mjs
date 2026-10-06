/*
 * Tests for the media-import helpers + the AEMaaCS 3-step uploader.
 * Zero-dependency: node:test + node:assert + node:http (no live DAM needed).
 * Run: node --test tools/importer/media/
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import {
  closeSync, mkdtempSync, openSync, readFileSync, readSync, rmSync, truncateSync, writeFileSync,
} from 'node:fs';
import nodePath from 'node:path';
import {
  logicalId, masterUrl, normalizeExtension, isAspectCrop, derivativeSuffix,
  damPathFor, pagePathFromFile, splitBuffer, imageSize, ratiosDiffer,
  uploadToDAM, publishDamBinary, publishDamImage, ensureDamFolder, resolveDamToken,
  fetchBinaryToFile,
  needsMediaBuild, OVERSIZE_BYTES, belowMinEdge, stepDownTooSmall, pickIngestUrl, renditionEdge,
  renditionCandidates, remoteImageSize,
} from './media-lib.mjs';

// SOI + one APP2 segment of `padding` bytes (≤ 65533) + SOF0 for w×h.
const jpegHead = (w, h, padding) => {
  const app2 = Buffer.alloc(padding + 4);
  app2.set([0xff, 0xe2]);
  app2.writeUInt16BE(padding + 2, 2);
  const sof = Buffer.from([0xff, 0xc0, 0, 17, 8, 0, 0, 0, 0,
    3, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1]);
  sof.writeUInt16BE(h, 5);
  sof.writeUInt16BE(w, 7);
  return Buffer.concat([Buffer.from([0xff, 0xd8]), app2, sof]);
};

test('renditionCandidates keeps a non-3:2 master at its own ratio', () => {
  const url = 'https://cdn.x.com/2026/03/wide.jpg';
  assert.deepEqual(renditionCandidates(url, { w: 8000, h: 4500 }).map((u) => u.split('-').pop()), [
    '2560x1440.jpg', '2048x1152.jpg', '1920x1080.jpg', '1536x864.jpg', '1440x810.jpg', '768x432.jpg',
  ]);
  // Near-3:2 masters round like WordPress (the source's -1920x1281);
  // exact 3:2 keeps the named ladder.
  assert.ok(renditionCandidates(url, { w: 6000, h: 4003 }).some((u) => u.endsWith('-1920x1281.jpg')));
  assert.equal(renditionCandidates(url, { w: 6000, h: 4000 }).filter((u) => u.endsWith('-1920x1280.jpg')).length, 1);
  // Portrait: the long edge is the height. Never upscale.
  assert.ok(renditionCandidates(url, { w: 3000, h: 4000 }).some((u) => u.endsWith('-1440x1920.jpg')));
  assert.ok(!renditionCandidates(url, { w: 2000, h: 1125 }).some((u) => /-(2560|2048)x/.test(u)));
  // Unknown size: the 3:2 ladder, unchanged.
  assert.ok(renditionCandidates(url).some((u) => u.endsWith('-272x182.jpg')));
});

test('remoteImageSize streams past a large ICC profile and never throws', async () => {
  const head = jpegHead(8000, 4500, 60000);
  const body = Buffer.concat([head, Buffer.alloc(50000)]);
  const serve = (bytes) => async () => new Response(new ReadableStream({
    start(controller) {
      for (let i = 0; i < bytes.length; i += 4096) controller.enqueue(bytes.subarray(i, i + 4096));
      controller.close();
    },
  }), { status: 206 });
  assert.deepEqual(await remoteImageSize('https://cdn.x.com/a.jpg', { fetchImpl: serve(body) }), { w: 8000, h: 4500 });
  assert.equal(await remoteImageSize('https://cdn.x.com/a.jpg', { fetchImpl: serve(body), maxBytes: 30000 }), null);
  assert.equal(await remoteImageSize('https://cdn.x.com/a.jpg', { fetchImpl: serve(Buffer.alloc(9000, 1)) }), null);
  assert.equal(await remoteImageSize('https://cdn.x.com/a.jpg', { fetchImpl: async () => new Response(null, { status: 403 }) }), null);
  assert.equal(await remoteImageSize('https://cdn.x.com/a.jpg', { fetchImpl: async () => { throw new Error('offline'); } }), null);
});

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

test('a verified binary still resumes when its required publish step is missing', () => {
  const row = {
    kind: 'document',
    status: 'done',
    dam_asset_path: '/content/dam/storyboard/en/spec.pdf',
    public_url: 'https://assets.example.test/spec.pdf',
    public_verified: { url: 'https://assets.example.test/spec.pdf' },
    steps: { dam: 'done' },
  };
  assert.equal(needsMediaBuild(row, { dam: true }), true);
  assert.equal(needsMediaBuild({
    ...row, steps: { dam: 'done', publish: 'done' },
  }, { dam: true }), false);
});

// ---- SKODA-506: minimum rendition edge ---------------------------------------
test('min edge measures the long side, so portrait renditions are not "narrow"', () => {
  assert.equal(belowMinEdge('https://cdn.x.com/a-272x182.jpg'), true);
  assert.equal(belowMinEdge('https://cdn.x.com/a-384x256.jpg'), true);
  assert.equal(belowMinEdge('https://cdn.x.com/a-768x512.jpg'), false);
  assert.equal(belowMinEdge('https://cdn.x.com/a.JPG-631x768.jpg'), false);
  assert.equal(belowMinEdge('https://cdn.x.com/a.jpg'), false);
  assert.equal(belowMinEdge('https://cdn.x.com/a-272x182.jpg', 200), false);
  for (const value of [0, -1, 1.5, 'bogus']) assert.throws(() => renditionEdge(value));
  assert.equal(renditionEdge('1440'), 1440);
});

test('a stepped-down thumbnail delivery is rebuilt; a page-authored small src is not', () => {
  // Real row: 6b386aae__skoda_all-electric_family… delivered its -272x182 thumbnail.
  const row = {
    status: 'done',
    bytes: 681412,
    preconditioned: true,
    source_url: 'https://cdn.x.com/2026/03/family.jpg',
    delivery_url: 'https://cdn.x.com/2026/03/family-272x182.jpg',
    steps: { deliver: 'done', dam: 'n/a', da: 'n/a' },
  };
  assert.equal(stepDownTooSmall(row), true);
  assert.equal(needsMediaBuild(row), true);
  assert.equal(needsMediaBuild(row, { minEdge: 272 }), false);
  assert.equal(needsMediaBuild({ ...row, source_url: row.delivery_url }), false);
});

test('pickIngestUrl never steps an oversized master down to a thumbnail', async () => {
  const sizes = {
    'https://cdn.x.com/big.jpg': 19129112,
    'https://cdn.x.com/big-384x256.jpg': 90000,
    'https://cdn.x.com/big-272x182.jpg': 681412,
    'https://cdn.x.com/ok.jpg': 19129112,
    'https://cdn.x.com/ok-768x512.jpg': 150000,
  };
  const heads = [];
  const previous = global.fetch;
  // The source CDN answers 403 for a rendition that does not exist.
  global.fetch = async (url) => {
    heads.push(String(url));
    const bytes = sizes[String(url)];
    return bytes
      ? new Response(null, { status: 200, headers: { 'content-length': String(bytes) } })
      : new Response(null, { status: 403 });
  };
  try {
    const declined = await pickIngestUrl('https://cdn.x.com/big.jpg');
    assert.equal(declined.ok, false);
    assert.match(declined.reason, /min 768px/);
    assert.ok(!heads.includes('https://cdn.x.com/big-384x256.jpg'));
    assert.ok(!heads.includes('https://cdn.x.com/big-272x182.jpg'));
    const lowered = await pickIngestUrl('https://cdn.x.com/big.jpg', { minEdge: 200 });
    assert.equal(lowered.url, 'https://cdn.x.com/big-384x256.jpg');
    const kept = await pickIngestUrl('https://cdn.x.com/ok.jpg');
    assert.equal(kept.url, 'https://cdn.x.com/ok-768x512.jpg');
  } finally {
    global.fetch = previous;
  }
});

test('pickIngestUrl steps a 16:9 master down to its own -WxH copy', async () => {
  // Real case: Skoda_Epiq_Battery_versions (17.5 MB, 8000x4500) only has 16:9 copies.
  const sizes = {
    'https://cdn.x.com/wide.jpg': 17541381,
    'https://cdn.x.com/wide-2560x1440.jpg': 557944,
  };
  const previous = global.fetch;
  global.fetch = async (url, init = {}) => {
    if (init.method !== 'HEAD' && String(url) === 'https://cdn.x.com/wide.jpg') {
      return new Response(jpegHead(8000, 4500, 1000), { status: 206 });
    }
    const bytes = sizes[String(url)];
    return bytes
      ? new Response(null, { status: 200, headers: { 'content-length': String(bytes) } })
      : new Response(null, { status: 403 });
  };
  try {
    const pick = await pickIngestUrl('https://cdn.x.com/wide.jpg');
    assert.equal(pick.ok, true);
    assert.equal(pick.url, 'https://cdn.x.com/wide-2560x1440.jpg');
  } finally {
    global.fetch = previous;
  }
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
test('splitBuffer: uses the required ordered URIs, not every offered URI', () => {
  const buf = Buffer.from('abcdefghij'); // 10 bytes
  assert.equal(splitBuffer(buf, ['u1']).length, 1);
  const parts = splitBuffer(buf, ['u1', 'u2', 'u3', 'u4'], 5, 4);
  assert.equal(parts.length, 2);
  assert.equal(Buffer.concat(parts).toString(), 'abcdefghij');
  assert.throws(() => splitBuffer(buf, ['u1'], 5), /cannot hold/);
  assert.throws(() => splitBuffer(buf, ['u1', 'u2'], 4), /cannot hold/);
  assert.equal(splitBuffer(Buffer.from('ab'), ['u1', 'u2', 'u3'], 5, 4).length, 1);
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

test('file download retries a stalled transfer from byte zero and checks the final size', async () => {
  const dir = mkdtempSync(nodePath.join(process.cwd(), '.media-stream-test-'));
  const filePath = nodePath.join(dir, 'original');
  let requests = 0;
  const server = createServer((req, res) => {
    requests += 1;
    res.writeHead(200, { 'content-type': 'video/mp4', 'content-length': '12' });
    if (requests === 1) res.write('bad');
    else res.end('\0\0\0\0ftypmock');
  });
  await new Promise((resolve) => { server.listen(0, '127.0.0.1', resolve); });
  try {
    const got = await fetchBinaryToFile(`http://127.0.0.1:${server.address().port}/clip.mp4`, {
      filePath, idleTimeoutMs: 50, timeoutMs: 2000, retries: 1,
    });
    assert.equal(requests, 2);
    assert.equal(got.bytes, 12);
    assert.equal(got.header.subarray(4, 8).toString(), 'ftyp');
    assert.equal(got.header.subarray(8, 12).toString(), 'mock');
    assert.equal(readFileSync(filePath).toString(), '\0\0\0\0ftypmock');
  } finally {
    await new Promise((resolve) => { server.close(resolve); });
    rmSync(dir, { recursive: true, force: true });
  }
});

test('file download rejects truncated bodies rather than uploading incomplete originals', async () => {
  const dir = mkdtempSync(nodePath.join(process.cwd(), '.media-stream-test-'));
  const server = createServer((req, res) => {
    res.writeHead(200, { 'content-length': '30' });
    res.end('%PDF-short');
  });
  await new Promise((resolve) => { server.listen(0, '127.0.0.1', resolve); });
  try {
    await assert.rejects(fetchBinaryToFile(`http://127.0.0.1:${server.address().port}/a.pdf`, {
      filePath: nodePath.join(dir, 'original'), retries: 0, idleTimeoutMs: 100,
    }));
  } finally {
    await new Promise((resolve) => { server.close(resolve); });
    rmSync(dir, { recursive: true, force: true });
  }
});

test('file-backed upload streams bounded parts, retries one transient PUT, and completes', async () => {
  const dir = mkdtempSync(nodePath.join(process.cwd(), '.media-stream-test-'));
  const filePath = nodePath.join(dir, 'original');
  writeFileSync(filePath, 'abcdefghij');
  const calls = [];
  let firstPut = true;
  const fetchImpl = async (url, options = {}) => {
    if (url.endsWith('.initiateUpload.json')) {
      assert.equal(new URLSearchParams(options.body).get('fileSize'), '10');
      return {
        ok: true,
        json: async () => ({
          completeURI: '/completeUpload.json',
          files: [{
            uploadToken: 'token',
            minPartSize: 4,
            maxPartSize: 6,
            uploadURIs: [
              'http://blob/part0', 'http://blob/part1', 'http://blob/unused2',
              'http://blob/unused3', 'http://blob/unused4',
            ],
          }],
        }),
      };
    }
    if (options.method === 'PUT') {
      assert.equal(options.duplex, 'half');
      assert.equal(options.headers.authorization, undefined);
      const chunks = [];
      for await (const chunk of options.body) chunks.push(chunk);
      calls.push([url, Buffer.concat(chunks).toString(), options.headers['content-length']]);
      if (firstPut) { firstPut = false; return { ok: false, status: 503, text: async () => 'transient' }; }
      return { ok: true, status: 201 };
    }
    if (url.endsWith('completeUpload.json')) {
      assert.equal(new URLSearchParams(options.body).get('mimeType'), 'video/mp4');
      return { ok: true, status: 200, text: async () => 'ok' };
    }
    return { ok: true, status: 200 };
  };
  try {
    const result = await uploadToDAM({
      damConfig: { baseUrl: 'http://dam', folder: '/content/dam/storyboard' },
      damPath: '/content/dam/storyboard/clip.mp4',
      filePath,
      token: 'mock',
      contentType: 'video/mp4',
      fetchImpl,
    });
    assert.equal(result.ok, true);
    assert.deepEqual(calls, [
      ['http://blob/part0', 'abcdef', '6'],
      ['http://blob/part0', 'abcdef', '6'],
      ['http://blob/part1', 'ghij', '4'],
    ]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('3.4GB sparse original advertises its exact size and rejects insufficient URI capacity', async () => {
  const dir = mkdtempSync(nodePath.join(process.cwd(), '.media-stream-test-'));
  const filePath = nodePath.join(dir, 'original');
  try {
    writeFileSync(filePath, '');
    truncateSync(filePath, 3_445_520_486);
    let puts = 0;
    const result = await uploadToDAM({
      damConfig: { baseUrl: 'http://dam', folder: '/content/dam/storyboard' },
      damPath: '/content/dam/storyboard/clip.mp4',
      filePath,
      contentType: 'video/mp4',
      token: 'mock',
      fetchImpl: async (url, options = {}) => {
        if (url.endsWith('.initiateUpload.json')) {
          assert.equal(new URLSearchParams(options.body).get('fileSize'), '3445520486');
          return {
            ok: true,
            json: async () => ({
              files: [{ uploadURIs: ['http://blob/only'], maxPartSize: 2_000_000_000 }],
            }),
          };
        }
        if (options.method === 'PUT') puts += 1;
        return { ok: true, status: 200 };
      },
    });
    assert.equal(result.ok, false);
    assert.match(result.body, /cannot hold/);
    assert.equal(puts, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

for (const [size, offeredURIs] of [[23_667_215, 3], [58_000_000, 6]]) {
  test(`AEM ${size}-byte original uses one of ${offeredURIs} offered URIs`, async () => {
    const dir = mkdtempSync(nodePath.join(process.cwd(), '.media-stream-test-'));
    const filePath = nodePath.join(dir, 'original');
    try {
      writeFileSync(filePath, '');
      truncateSync(filePath, size);
      const puts = [];
      let completed = 0;
      const result = await uploadToDAM({
        damConfig: { baseUrl: 'http://dam', folder: '/content/dam/storyboard' },
        damPath: '/content/dam/storyboard/clip.mp4',
        filePath,
        contentType: 'video/mp4',
        token: 'mock',
        fetchImpl: async (url, options = {}) => {
          if (url.endsWith('.initiateUpload.json')) {
            assert.equal(new URLSearchParams(options.body).get('fileSize'), String(size));
            return {
              ok: true,
              json: async () => ({
                completeURI: '/completeUpload.json',
                files: [{
                  uploadToken: 'token-for-whole-original',
                  minPartSize: 10_485_760,
                  maxPartSize: 104_857_600,
                  uploadURIs: Array.from({ length: offeredURIs }, (_, i) => `http://blob/part${i}`),
                }],
              }),
            };
          }
          if (options.method === 'PUT') {
            puts.push([url, options.body.start, options.body.end,
              Number(options.headers['content-length'])]);
            return { ok: true, status: 201 };
          }
          if (url.endsWith('/completeUpload.json')) {
            const form = new URLSearchParams(options.body);
            assert.deepEqual([...form.keys()], ['fileName', 'mimeType', 'uploadToken']);
            assert.equal(form.get('fileName'), 'clip.mp4');
            assert.equal(form.get('mimeType'), 'video/mp4');
            assert.equal(form.get('uploadToken'), 'token-for-whole-original');
            completed += 1;
            return { ok: true, status: 200, text: async () => 'ok' };
          }
          return { ok: true, status: 200 };
        },
      });
      assert.equal(result.ok, true);
      assert.deepEqual(puts, [['http://blob/part0', 0, size - 1, size]]);
      assert.equal(completed, 1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
}

test('4.94GB MP4 uses safe offsets and bounded streams across every signed DAM part', async () => {
  const dir = mkdtempSync(nodePath.join(process.cwd(), '.media-stream-test-'));
  const filePath = nodePath.join(dir, 'original');
  const size = 4_941_784_081;
  try {
    writeFileSync(filePath, Buffer.from('\0\0\0\0ftyp'));
    truncateSync(filePath, size);
    const header = Buffer.alloc(8);
    const fd = openSync(filePath, 'r');
    try {
      assert.equal(readSync(fd, header, 0, 8, 0), 8);
    } finally {
      closeSync(fd);
    }
    assert.equal(header.subarray(4, 8).toString(), 'ftyp');
    const parts = [];
    let complete = 0;
    const result = await uploadToDAM({
      damConfig: { baseUrl: 'http://dam', folder: '/content/dam/storyboard' },
      damPath: '/content/dam/storyboard/footage.mp4',
      filePath,
      contentType: 'video/mp4',
      token: 'mock',
      fetchImpl: async (url, options = {}) => {
        if (url.endsWith('.initiateUpload.json')) {
          assert.equal(new URLSearchParams(options.body).get('fileSize'), String(size));
          return {
            ok: true,
            json: async () => ({
              completeURI: '/completeUpload.json',
              files: [{
                uploadToken: 'signed',
                minPartSize: 1_000_000_000,
                maxPartSize: 2_000_000_000,
                uploadURIs: [
                  'http://blob/part0', 'http://blob/part1', 'http://blob/part2',
                  'http://blob/unused3', 'http://blob/unused4',
                ],
              }],
            }),
          };
        }
        if (options.method === 'PUT') {
          assert.equal(options.headers.authorization, undefined);
          assert.equal(options.headers['content-type'], 'video/mp4');
          assert.equal(options.body.readableHighWaterMark, 1024 * 1024);
          assert.equal(options.duplex, 'half');
          const length = Number(options.headers['content-length']);
          assert.equal(options.body.end - options.body.start + 1, length);
          parts.push([options.body.start, options.body.end, length]);
          return { ok: true, status: 201 };
        }
        if (url.endsWith('/completeUpload.json')) {
          complete += 1;
          assert.equal(new URLSearchParams(options.body).get('mimeType'), 'video/mp4');
          assert.equal(new URLSearchParams(options.body).get('uploadToken'), 'signed');
          return { ok: true, status: 200, text: async () => 'ok' };
        }
        return { ok: true, status: 200 };
      },
    });
    assert.equal(result.ok, true);
    assert.deepEqual(parts, [
      [0, 1_999_999_999, 2_000_000_000],
      [2_000_000_000, 3_999_999_999, 2_000_000_000],
      [4_000_000_000, 4_941_784_080, 941_784_081],
    ]);
    assert.equal(parts.reduce((sum, part) => sum + part[2], 0), size);
    assert.equal(complete, 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('real Peaq initiation shape uses 48 of 472 offered URLs with exact byte coverage', async () => {
  const dir = mkdtempSync(nodePath.join(process.cwd(), '.media-stream-test-'));
  const filePath = nodePath.join(dir, 'original');
  const size = 4_941_784_081;
  const minPartSize = 10_485_760;
  const maxPartSize = 104_857_600;
  try {
    writeFileSync(filePath, '');
    truncateSync(filePath, size);
    const parts = [];
    let complete = 0;
    const result = await uploadToDAM({
      damConfig: { baseUrl: 'http://dam', folder: '/content/dam/storyboard' },
      damPath: '/content/dam/storyboard/peaq.mp4',
      filePath,
      contentType: 'video/mp4',
      token: 'mock',
      fetchImpl: async (url, options = {}) => {
        if (url.endsWith('.initiateUpload.json')) {
          assert.equal(new URLSearchParams(options.body).get('fileSize'), String(size));
          return {
            ok: true,
            json: async () => ({
              completeURI: '/completeUpload.json',
              files: [{
                uploadToken: 'token',
                minPartSize,
                maxPartSize,
                uploadURIs: Array.from({ length: 472 }, (_, i) => `http://blob/part${i}`),
              }],
            }),
          };
        }
        if (options.method === 'PUT') {
          assert.equal(options.body.readableHighWaterMark, 1024 * 1024);
          parts.push({
            url,
            start: options.body.start,
            end: options.body.end,
            bytes: Number(options.headers['content-length']),
          });
          return { ok: true, status: 201 };
        }
        if (url.endsWith('/completeUpload.json')) {
          const form = new URLSearchParams(options.body);
          assert.equal(form.get('uploadToken'), 'token');
          assert.equal(form.get('mimeType'), 'video/mp4');
          assert.deepEqual([...form.keys()], ['fileName', 'mimeType', 'uploadToken']);
          complete += 1;
          return { ok: true, status: 200, text: async () => 'ok' };
        }
        return { ok: true, status: 200 };
      },
    });
    assert.equal(result.ok, true);
    assert.equal(parts.length, 48);
    parts.forEach((part, i) => {
      assert.equal(part.url, `http://blob/part${i}`);
      assert.equal(part.start, i * maxPartSize);
      assert.equal(part.end, part.start + part.bytes - 1);
      assert.equal(part.bytes, i === 47 ? 13_476_881 : maxPartSize);
      assert.ok(i === 47 || part.bytes >= minPartSize);
    });
    assert.equal(parts.reduce((total, part) => total + part.bytes, 0), size);
    assert.equal(parts.at(-1).end, size - 1);
    assert.equal(complete, 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
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

test('file-backed multipart PUT works over real HTTP with the exact bytes and no blob bearer', async () => {
  const dir = mkdtempSync(nodePath.join(process.cwd(), '.media-stream-test-'));
  const filePath = nodePath.join(dir, 'original');
  writeFileSync(filePath, 'abcdefghij');
  const { server, calls, port } = await startMockDam();
  try {
    const result = await uploadToDAM({
      damConfig: { baseUrl: `http://127.0.0.1:${port}`, folder: '/content/dam/storyboard' },
      damPath: '/content/dam/storyboard/en/skoda-model/elroq/clip.mp4',
      filePath,
      contentType: 'video/mp4',
      token: 'mock',
    });
    assert.equal(result.ok, true);
    const puts = calls.filter((call) => call.url.startsWith('/blob/'));
    assert.deepEqual(puts.map((call) => call.len), [5, 5]);
    assert.ok(puts.every((call) => !call.auth));
  } finally {
    await new Promise((resolve) => { server.close(resolve); });
    rmSync(dir, { recursive: true, force: true });
  }
});

test('file-backed PUT retries when its deadline expires and never completes on failure', async () => {
  const dir = mkdtempSync(nodePath.join(process.cwd(), '.media-stream-test-'));
  const filePath = nodePath.join(dir, 'original');
  writeFileSync(filePath, 'abcdefghij');
  let puts = 0;
  let completes = 0;
  try {
    const result = await uploadToDAM({
      damConfig: { baseUrl: 'http://dam', folder: '/content/dam/storyboard' },
      damPath: '/content/dam/storyboard/clip.mp4',
      filePath,
      token: 'mock',
      partRetries: 1,
      partTimeoutMs: 20,
      fetchImpl: async (url, options = {}) => {
        if (url.endsWith('.initiateUpload.json')) {
          return { ok: true, json: async () => ({ files: [{ uploadURIs: ['http://blob/part'] }] }) };
        }
        if (options.method === 'PUT') {
          puts += 1;
          return new Promise((resolve, reject) => {
            options.signal.addEventListener('abort', () => reject(options.signal.reason), { once: true });
          });
        }
        if (url.includes('completeUpload')) completes += 1;
        return { ok: true, status: 200 };
      },
    });
    assert.equal(result.ok, false);
    assert.equal(puts, 2);
    assert.equal(completes, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('author folder lookup and create have hard deadlines even if fetch ignores abort', async () => {
  const damConfig = { baseUrl: 'http://dam', folder: '/content/dam/storyboard' };
  await assert.rejects(ensureDamFolder({
    damConfig,
    folderPath: '/content/dam/storyboard/en',
    token: 'mock',
    requestTimeoutMs: 10,
    fetchImpl: async () => new Promise(() => {}),
  }), /DAM folder lookup timed out/);

  let creates = 0;
  await assert.rejects(ensureDamFolder({
    damConfig,
    folderPath: '/content/dam/storyboard/en',
    token: 'mock',
    requestTimeoutMs: 10,
    fetchImpl: async (url, options = {}) => {
      if (!options.method) return { ok: false, status: 404 };
      creates += 1;
      return new Promise(() => {});
    },
  }), /DAM folder create storyboard\/en timed out/);
  assert.equal(creates, 2, 'folder creation may be retried because 409 is idempotent');
});

test('author initiate retries a stalled JSON body, then fails before uploading any part', async () => {
  let initiates = 0;
  let puts = 0;
  const result = await uploadToDAM({
    damConfig: { baseUrl: 'http://dam', folder: '/content/dam/storyboard' },
    damPath: '/content/dam/storyboard/clip.mp4',
    buffer: Buffer.from('ftyp'),
    token: 'mock',
    requestTimeoutMs: 10,
    fetchImpl: async (url, options = {}) => {
      if (url.endsWith('.initiateUpload.json')) {
        initiates += 1;
        return { ok: true, status: 200, json: async () => new Promise(() => {}) };
      }
      if (options.method === 'PUT') puts += 1;
      return { ok: true, status: 200 };
    },
  });
  assert.equal(result.ok, false);
  assert.equal(result.uncertain, false);
  assert.match(result.body, /initiate.*timed out/);
  assert.equal(initiates, 3);
  assert.equal(puts, 0);
});

test('author initiate retries an eventual-consistency 404 before any part is sent', async () => {
  let initiates = 0;
  let puts = 0;
  const result = await uploadToDAM({
    damConfig: { baseUrl: 'http://dam', folder: '/content/dam/storyboard' },
    damPath: '/content/dam/storyboard/clip.mp4',
    buffer: Buffer.from('ftyp'),
    token: 'mock',
    fetchImpl: async (url, options = {}) => {
      if (url.endsWith('.initiateUpload.json')) {
        initiates += 1;
        if (initiates === 1) return { ok: false, status: 404 };
        return {
          ok: true,
          status: 200,
          json: async () => ({
            completeURI: '/completeUpload.json',
            files: [{ uploadToken: 'mock', uploadURIs: ['http://blob/part'] }],
          }),
        };
      }
      if (options.method === 'PUT') puts += 1;
      return { ok: true, status: 200, text: async () => '' };
    },
  });
  assert.equal(result.ok, true);
  assert.equal(initiates, 2);
  assert.equal(puts, 1);
});

test('author complete timeout is uncertain and is never automatically retried', async () => {
  const stages = [];
  let completes = 0;
  const result = await uploadToDAM({
    damConfig: { baseUrl: 'http://dam', folder: '/content/dam/storyboard' },
    damPath: '/content/dam/storyboard/clip.mp4',
    buffer: Buffer.from('ftyp'),
    token: 'mock',
    requestTimeoutMs: 10,
    onStage: (stage) => stages.push(stage),
    fetchImpl: async (url, options = {}) => {
      if (url.endsWith('.initiateUpload.json')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            completeURI: '/completeUpload.json',
            files: [{ uploadToken: 'private', uploadURIs: ['http://blob/part'] }],
          }),
        };
      }
      if (url.endsWith('/completeUpload.json')) {
        completes += 1;
        return new Promise(() => {});
      }
      if (options.method === 'PUT') return { ok: true, status: 201 };
      return { ok: true, status: 200 };
    },
  });
  assert.equal(result.ok, false);
  assert.equal(result.uncertain, true);
  assert.match(result.body, /complete.*timed out/);
  assert.doesNotMatch(result.body, /private|blob/);
  assert.equal(completes, 1);
  assert.deepEqual(stages, ['folder', 'initiate', 'part 1/1', 'complete']);
});

test('author complete HTTP failure is uncertain and does not retry or publish a duplicate', async () => {
  let completes = 0;
  const result = await uploadToDAM({
    damConfig: { baseUrl: 'http://dam', folder: '/content/dam/storyboard' },
    damPath: '/content/dam/storyboard/clip.mp4',
    buffer: Buffer.from('ftyp'),
    token: 'mock',
    fetchImpl: async (url) => {
      if (url.endsWith('.initiateUpload.json')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            completeURI: '/completeUpload.json',
            files: [{ uploadToken: 'mock', uploadURIs: ['http://blob/part'] }],
          }),
        };
      }
      if (url.endsWith('/completeUpload.json')) {
        completes += 1;
        return { ok: false, status: 503 };
      }
      return { ok: true, status: 201 };
    },
  });
  assert.equal(result.ok, false);
  assert.equal(result.uncertain, true);
  assert.equal(result.status, 503);
  assert.equal(completes, 1);
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

test('publishDamBinary activates only a single binary under the configured DAM folder', async () => {
  const path = '/content/dam/storyboard/en/model/spec.pdf';
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { 'content-type': 'application/json' },
    });
  };
  assert.equal(await publishDamBinary({
    damConfig: damCfg, damPath: path, token: 'mock', fetchImpl,
  }), 200);
  assert.equal(calls.length, 1);
  assert.equal(new URL(calls[0].url).pathname, '/bin/replicate.json');
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(calls[0].options.headers.authorization, 'Bearer mock');
  assert.deepEqual(Object.fromEntries(new URLSearchParams(calls[0].options.body)), {
    cmd: 'Activate', path,
  });
  await assert.rejects(publishDamBinary({
    damConfig: damCfg, damPath: '/content/dam/storyboard/en/model', token: 'mock', fetchImpl,
  }), /out-of-scope/);
  await assert.rejects(publishDamBinary({
    damConfig: damCfg, damPath: '/content/dam/other/en/spec.pdf', token: 'mock', fetchImpl,
  }), /out-of-scope/);
  await assert.rejects(publishDamBinary({
    damConfig: damCfg, damPath: '/content/dam/storyboard/../other/spec.pdf', token: 'mock', fetchImpl,
  }), /out-of-scope/);
  assert.equal(calls.length, 1);
  await assert.rejects(publishDamBinary({
    damConfig: damCfg,
    damPath: path,
    token: 'mock',
    fetchImpl: async () => new Response(JSON.stringify({ success: false }), {
      status: 200, headers: { 'content-type': 'application/json' },
    }),
  }), /reported failure/);
});

test('publishDamImage activates only image originals under the configured DAM folder', async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { 'content-type': 'application/json' },
    });
  };
  const path = '/content/dam/storyboard/en/model/image.jpg';
  assert.equal(await publishDamImage({
    damConfig: damCfg, damPath: path, token: 'mock', fetchImpl,
  }), 200);
  assert.deepEqual(Object.fromEntries(new URLSearchParams(calls[0].options.body)), {
    cmd: 'Activate', path,
  });
  for (const invalid of [
    '/content/dam/other/en/image.jpg',
    '/content/dam/storyboard/../other/image.jpg',
    '/content/dam/storyboard/en/model/spec.pdf',
  ]) {
    // eslint-disable-next-line no-await-in-loop
    await assert.rejects(publishDamImage({
      damConfig: damCfg, damPath: invalid, token: 'mock', fetchImpl,
    }), /out-of-scope/);
  }
  assert.equal(calls.length, 1);
});
