import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createServer } from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { logicalId } from './media-lib.mjs';
import build from './build-media-manifest.mjs';

const exec = promisify(execFile);
const script = fileURLToPath(new URL('./build-media-manifest.mjs', import.meta.url));

async function mockDam() {
  const uploads = [];
  let originalAvailable = true;
  const server = createServer((req, res) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      if (req.url === '/master.jpg') {
        if (!originalAvailable) { res.writeHead(404); res.end(); return; }
        res.writeHead(200, { 'content-type': 'image/jpeg', 'content-length': '8' });
        res.end(req.method === 'HEAD' ? undefined : 'ORIGINAL');
      } else if (req.url === '/TD-Kodiaq-en.pdf') {
        res.writeHead(200, { 'content-type': 'application/pdf', 'content-length': '9' });
        res.end(req.method === 'HEAD' ? undefined : '%PDF-TECH');
      } else if (req.url === '/reports/annual') {
        res.writeHead(200, { 'content-type': 'application/pdf', 'content-length': '9' });
        res.end(req.method === 'HEAD' ? undefined : '%PDF-YEAR');
      } else if (req.url === '/direct-download/clip.mp4') {
        if (req.method === 'HEAD') { res.writeHead(403); res.end(); return; }
        res.writeHead(302, { location: '/clip.mp4' }); res.end();
      } else if (req.url === '/clip.mp4') {
        if (req.headers.range) {
          res.writeHead(206, {
            'content-type': 'application/octet-stream',
            'content-range': 'bytes 0-0/12',
          });
          res.end('\0');
          return;
        }
        res.writeHead(200, { 'content-type': 'application/octet-stream', 'content-length': '12' });
        res.end(req.method === 'HEAD' ? undefined : '\0\0\0\0ftypmock');
      } else if (req.method === 'GET' && req.url.endsWith('.json')) {
        res.writeHead(200); res.end('{}');
      } else if (req.url.endsWith('.initiateUpload.json')) {
        const { port } = server.address();
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({
          completeURI: `http://127.0.0.1:${port}/completeUpload.json`,
          files: [{ uploadToken: 'mock', uploadURIs: [`http://127.0.0.1:${port}/blob`] }],
        }));
      } else if (req.url === '/blob') {
        uploads.push(Buffer.concat(chunks).toString());
        res.writeHead(201); res.end();
      } else if (req.url === '/completeUpload.json' || req.url.startsWith('/api/assets/')) {
        res.writeHead(200); res.end('{}');
      } else {
        res.writeHead(404); res.end();
      }
    });
  });
  await new Promise((resolve) => { server.listen(0, '127.0.0.1', resolve); });
  return {
    base: `http://127.0.0.1:${server.address().port}`,
    uploads,
    setOriginalAvailable(value) { originalAvailable = value; },
    async close() { await new Promise((resolve) => { server.close(resolve); }); },
  };
}

test('a delivery-only row resumes DAM ingest with the ORIGINAL, then becomes idempotent', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'skoda-media-build-'));
  const dam = await mockDam();
  try {
    const source = `${dam.base}/master-768x512.jpg`;
    const id = logicalId(source);
    const manifest = path.join(dir, 'manifest.json');
    writeFileSync(manifest, JSON.stringify({
      rows: {
        [id]: {
          logical_id: id,
          source_url: source,
          master_url: `${dam.base}/master.jpg`,
          delivery_url: source,
          bytes: 4,
          preconditioned: true,
          status: 'done',
          seen_urls: [source],
          dam_page_path: 'en/story',
          steps: { deliver: 'done', dam: 'n/a', da: 'n/a' },
        },
      },
    }));
    const args = [script, '--from-manifest', '--manifest', manifest, '--dam-base', dam.base];
    const options = { cwd: dir, env: { ...process.env, AEM_DAM_TOKEN: 'mock' } };
    await exec(process.execPath, args, options);
    const { rows } = JSON.parse(readFileSync(manifest, 'utf8'));
    assert.deepEqual(dam.uploads, ['ORIGINAL']);
    assert.equal(rows[id].dam_original_url, `${dam.base}/master.jpg`);
    assert.match(rows[id].dam_asset_path, /\/content\/dam\/storyboard\/en\/story\/master\.jpg$/);
    assert.equal(rows[id].delivery_url, source);
    assert.equal(rows[id].status, 'done');

    await exec(process.execPath, args, options);
    assert.equal(dam.uploads.length, 1, 're-run does not upload twice');

    rows[id].steps.da = 'done';
    rows[id].original_download_url = '/media-da/original.jpg';
    writeFileSync(manifest, JSON.stringify({ rows }));
    await exec(
      process.execPath,
      [script, '--from-manifest', '--manifest', manifest, '--force'],
      options,
    );
    const rebuilt = JSON.parse(readFileSync(manifest, 'utf8')).rows[id];
    assert.equal(rebuilt.dam_asset_path, rows[id].dam_asset_path);
    assert.equal(rebuilt.original_download_url, '/media-da/original.jpg');
    assert.equal(rebuilt.steps.dam, 'done');
    assert.equal(rebuilt.steps.da, 'done');
    assert.equal(dam.uploads.length, 1, 'delivery-only rebuild does not touch DAM');

    const content = path.join(dir, 'content', 'en');
    mkdirSync(content, { recursive: true });
    const secondPage = path.join(content, 'other.plain.html');
    writeFileSync(secondPage, `<div><img src="${source}" alt="Shared"></div>`);
    await exec(
      process.execPath,
      [script, '--pages', secondPage, '--manifest', manifest],
      options,
    );
    const shared = JSON.parse(readFileSync(manifest, 'utf8')).rows[id];
    assert.deepEqual(shared.page_refs, ['en/story', 'en/other']);
    assert.equal(dam.uploads.length, 1, 'another page reuses the same original');
  } finally {
    await dam.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('an unavailable master cannot be replaced by the resized delivery file in DAM', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'skoda-media-build-'));
  const dam = await mockDam();
  try {
    dam.setOriginalAvailable(false);
    const source = `${dam.base}/master-768x512.jpg`;
    const id = logicalId(source);
    const manifest = path.join(dir, 'manifest.json');
    writeFileSync(manifest, JSON.stringify({
      rows: {
        [id]: {
          logical_id: id,
          source_url: source,
          master_url: `${dam.base}/master.jpg`,
          delivery_url: source,
          bytes: 4,
          preconditioned: true,
          status: 'done',
          seen_urls: [source],
          dam_page_path: 'en/story',
          steps: { deliver: 'done', dam: 'n/a', da: 'n/a' },
        },
      },
    }));
    const originalManifest = readFileSync(manifest, 'utf8');
    await assert.rejects(
      exec(
        process.execPath,
        [script, '--from-manifest', '--manifest', manifest, '--dam-base', dam.base, '--dry-run'],
        { cwd: dir, env: { ...process.env, AEM_DAM_TOKEN: 'mock' } },
      ),
      (error) => {
        assert.match(error.stdout, /original unavailable/);
        return true;
      },
    );
    assert.equal(readFileSync(manifest, 'utf8'), originalManifest);
    await assert.rejects(
      exec(
        process.execPath,
        [script, '--from-manifest', '--manifest', manifest, '--dam-base', dam.base],
        { cwd: dir, env: { ...process.env, AEM_DAM_TOKEN: 'mock' } },
      ),
      /Command failed/,
    );
    const { rows } = JSON.parse(readFileSync(manifest, 'utf8'));
    assert.equal(rows[id].status, 'partial');
    assert.equal(rows[id].steps.dam, 'error');
    assert.equal(rows[id].dam_asset_path, '');
    assert.deepEqual(dam.uploads, []);
  } finally {
    await dam.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('an approved ID list scopes re-ingest and rejects unknown or repeated entries', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'skoda-media-scope-'));
  const dam = await mockDam();
  try {
    const source = `${dam.base}/master-768x512.jpg`;
    const other = `${dam.base}/other-768x512.jpg`;
    const id = logicalId(source);
    const otherId = logicalId(other);
    const manifest = path.join(dir, 'manifest.json');
    const idsFile = path.join(dir, 'approved.txt');
    const row = (url) => ({
      logical_id: logicalId(url),
      source_url: url,
      delivery_url: url,
      bytes: 4,
      status: 'done',
      dam_page_path: 'en/story',
      steps: { deliver: 'done', dam: 'n/a', da: 'n/a' },
    });
    writeFileSync(manifest, JSON.stringify({ rows: { [id]: row(source), [otherId]: row(other) } }));
    writeFileSync(idsFile, `# approved originals\n${id}\n`);
    const args = [script, '--from-manifest', '--manifest', manifest, '--ids-file', idsFile,
      '--dam-base', dam.base];
    const options = { cwd: dir, env: { ...process.env, AEM_DAM_TOKEN: 'mock' } };
    await exec(process.execPath, args, options);
    const result = JSON.parse(readFileSync(manifest, 'utf8')).rows;
    assert.deepEqual(dam.uploads, ['ORIGINAL']);
    assert.equal(result[id].steps.dam, 'done');
    assert.equal(result[otherId].steps.dam, 'n/a');

    writeFileSync(idsFile, `${id}\nunknown\n`);
    await assert.rejects(exec(process.execPath, args, options), /Media ID not in manifest/);
    writeFileSync(idsFile, `${id}\n${id}\n`);
    await assert.rejects(exec(process.execPath, args, options), /Duplicate media ID/);
    assert.equal(dam.uploads.length, 1);
  } finally {
    await dam.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('PDF and MP4 links require proven public Assets delivery before DAM ingestion', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'skoda-media-doc-'));
  const dam = await mockDam();
  try {
    const pdf = `${dam.base}/TD-Kodiaq-en.pdf`;
    const id = logicalId(pdf);
    const manifest = path.join(dir, 'manifest.json');
    const content = path.join(dir, 'content', 'en', 'skoda-model');
    mkdirSync(content, { recursive: true });
    const page = path.join(content, 'new-kodiaq.plain.html');
    writeFileSync(page, `<div><h2>Technical Data</h2><p><a href="${pdf}">Download PDF</a></p></div>`);
    const options = { cwd: dir, env: { ...process.env, AEM_DAM_TOKEN: 'mock' } };

    await assert.rejects(exec(process.execPath, [script, '--pages', page, '--manifest', manifest], options));
    const row = JSON.parse(readFileSync(manifest, 'utf8')).rows[id];
    assert.equal(row.kind, 'document');
    assert.equal(row.title, 'Download PDF');
    assert.deepEqual(row.steps, { deliver: 'n/a', dam: 'n/a', da: 'n/a' });
    assert.equal(row.status, 'partial');
    assert.equal(row.delivery_url, '', 'the page keeps its source link');
    assert.deepEqual(row.page_refs, ['en/skoda-model/new-kodiaq']);
    assert.equal(dam.uploads.length, 0, 'delivery-only never uploads');

    const damArgs = [script, '--from-manifest', '--manifest', manifest, '--dam-base', dam.base];
    await assert.rejects(exec(process.execPath, damArgs, options), /missing or invalid public Assets URL/);
    assert.deepEqual(dam.uploads, []);
  } finally {
    await dam.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('query-dependent binary links block ingest rather than losing their identity', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'skoda-binary-query-'));
  try {
    const manifest = path.join(dir, 'manifest.json');
    const page = path.join(dir, 'content', 'en', 'story.plain.html');
    mkdirSync(path.dirname(page), { recursive: true });
    writeFileSync(page, '<a href="https://cdn.example.test/report.pdf?id=2">Report</a>');
    await assert.rejects(exec(
      process.execPath,
      [script, '--pages', page, '--manifest', manifest],
      { cwd: dir },
    ), /Query-bearing binary needs a stable source URL/);
    assert.equal(existsSync(manifest), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('approved PDF and redirecting MP4 originals upload once and verify public delivery', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'skoda-binary-build-'));
  const dam = await mockDam();
  const previousFetch = global.fetch;
  const previousExitCode = process.exitCode;
  const previousToken = process.env.AEM_DAM_TOKEN;
  try {
    const pdf = `${dam.base}/TD-Kodiaq-en.pdf`;
    const typedPdf = `${dam.base}/reports/annual`;
    const mp4 = `${dam.base}/direct-download/clip.mp4`;
    const id = logicalId(pdf);
    const videoId = logicalId(mp4);
    const manifest = path.join(dir, 'manifest.json');
    const urls = path.join(dir, 'public-urls.json');
    const content = path.join(dir, 'content', 'en', 'press-releases');
    mkdirSync(content, { recursive: true });
    const page = path.join(content, 'test.plain.html');
    writeFileSync(page, `<p><a href="${pdf}">Download PDF</a></p>`
      + `<p><a type="application/pdf" href="${typedPdf}">Annual report</a></p>`
      + `<p><a href="${mp4}">Download MP4</a></p>`);
    const assetPath = '/content/dam/storyboard/en/press-releases/test/';
    const publicPdf = `https://assets.example.test${assetPath}TD-Kodiaq-en.pdf`;
    const publicAnnual = `https://assets.example.test${assetPath}annual.pdf`;
    const publicMp4 = `https://assets.example.test${assetPath}clip.mp4`;
    writeFileSync(urls, JSON.stringify({
      [`${assetPath}TD-Kodiaq-en.pdf`]: publicPdf,
      [`${assetPath}annual.pdf`]: publicAnnual,
      [`${assetPath}clip.mp4`]: publicMp4,
    }));
    process.env.AEM_DAM_TOKEN = 'mock';
    let publicAccessible = true;
    global.fetch = (url, options) => {
      if (String(url).startsWith('https://assets.example.test/')) {
        if (!publicAccessible) return Promise.resolve(new Response(null, { status: 403 }));
        const pdfAsset = String(url) === publicPdf || String(url) === publicAnnual;
        return Promise.resolve(new Response(null, {
          status: 200,
          headers: {
            'content-type': pdfAsset ? 'application/pdf' : 'video/mp4',
            'content-length': pdfAsset ? '9' : '12',
          },
        }));
      }
      return previousFetch(url, options);
    };
    const args = ['--pages', page, '--manifest', manifest, '--dam-base', dam.base, '--public-urls', urls];
    await build([...args, '--dry-run']);
    assert.deepEqual(dam.uploads, [], 'binary dry-run does not upload');
    await build(args);
    const row = JSON.parse(readFileSync(manifest, 'utf8')).rows[id];
    assert.deepEqual(dam.uploads, ['%PDF-TECH', '%PDF-YEAR', '\0\0\0\0ftypmock']);
    assert.equal(row.steps.dam, 'done');
    assert.equal(row.dam_asset_path, `${assetPath}TD-Kodiaq-en.pdf`);
    assert.equal(row.dam_original_url, pdf);
    assert.equal(row.public_url, publicPdf);
    assert.equal(row.public_verified.mime, 'application/pdf');
    assert.equal(row.status, 'done');
    assert.equal(JSON.parse(readFileSync(manifest, 'utf8')).rows[videoId].public_url, publicMp4);
    assert.equal(
      JSON.parse(readFileSync(manifest, 'utf8')).rows[videoId].source_content_type,
      'application/octet-stream',
    );
    await build(args);
    assert.equal(dam.uploads.length, 3, 're-run does not upload twice');

    const pending = JSON.parse(readFileSync(manifest, 'utf8'));
    pending.rows[id].status = 'partial';
    pending.rows[id].public_verified = null;
    writeFileSync(manifest, JSON.stringify(pending));
    publicAccessible = false;
    await build(args);
    const blocked = JSON.parse(readFileSync(manifest, 'utf8')).rows[id];
    assert.equal(blocked.status, 'partial');
    assert.equal(blocked.steps.dam, 'done', 'public failure does not invalidate the DAM original');
    assert.equal(dam.uploads.length, 3, 'public failure does not re-upload the original');
    assert.equal(process.exitCode, 1);
    publicAccessible = true;
    process.exitCode = 0;
    await build(args);
    assert.equal(JSON.parse(readFileSync(manifest, 'utf8')).rows[id].status, 'done');
    assert.equal(dam.uploads.length, 3, 'public retry only verifies delivery');
  } finally {
    global.fetch = previousFetch;
    process.exitCode = previousExitCode;
    if (previousToken === undefined) delete process.env.AEM_DAM_TOKEN;
    else process.env.AEM_DAM_TOKEN = previousToken;
    await dam.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
