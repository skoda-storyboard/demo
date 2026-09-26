import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createServer } from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { logicalId } from './media-lib.mjs';

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

test('a linked PDF is tracked as a document row, then ingested to the DAM as the original (SKODA-208)', async () => {
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

    await exec(process.execPath, [script, '--pages', page, '--manifest', manifest], options);
    let row = JSON.parse(readFileSync(manifest, 'utf8')).rows[id];
    assert.equal(row.kind, 'document');
    assert.equal(row.title, 'Download PDF');
    assert.deepEqual(row.steps, { deliver: 'n/a', dam: 'n/a', da: 'n/a' });
    assert.equal(row.status, 'done');
    assert.equal(row.delivery_url, '', 'the page keeps its source link');
    assert.deepEqual(row.page_refs, ['en/skoda-model/new-kodiaq']);
    assert.equal(dam.uploads.length, 0, 'delivery-only never uploads');

    const damArgs = [script, '--from-manifest', '--manifest', manifest, '--dam-base', dam.base];
    await exec(process.execPath, damArgs, options);
    row = JSON.parse(readFileSync(manifest, 'utf8')).rows[id];
    assert.deepEqual(dam.uploads, ['%PDF-TECH']);
    assert.equal(row.steps.dam, 'done');
    assert.match(row.dam_asset_path, /\/content\/dam\/storyboard\/en\/skoda-model\/new-kodiaq\/TD-Kodiaq-en\.pdf$/);
    assert.equal(row.dam_original_url, pdf);

    await exec(process.execPath, damArgs, options);
    assert.equal(dam.uploads.length, 1, 're-run does not upload twice');
  } finally {
    await dam.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
