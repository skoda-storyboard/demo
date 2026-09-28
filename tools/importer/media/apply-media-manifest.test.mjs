import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { logicalId } from './media-lib.mjs';

const exec = promisify(execFile);
const script = fileURLToPath(new URL('./apply-media-manifest.mjs', import.meta.url));
const source = 'https://cdn.example.test/2025/hero-768x512.jpg';
const master = 'https://cdn.example.test/2025/hero.jpg';
const delivery = 'https://cdn.example.test/2025/hero-1920x1280.jpg';

function fixture(dir) {
  const manifest = path.join(dir, 'manifest.json');
  const index = path.join(dir, 'media-index.json');
  writeFileSync(manifest, JSON.stringify({
    rows: {
      [logicalId(source)]: {
        logical_id: logicalId(source),
        source_url: source,
        seen_urls: [source],
        master_url: master,
        delivery_url: delivery,
        original_download_url: '/media-da/original.jpg',
        dam_asset_path: '/content/dam/storyboard/original.jpg',
        bytes: 800_000,
        steps: { deliver: 'done', dam: 'done' },
        status: 'done',
        alt: 'A',
      },
    },
  }));
  return { manifest, index };
}

async function run(dir, manifest, index, pages, extra = []) {
  return exec(process.execPath, [script, '--manifest', manifest, '--media-index', index,
    '--pages', ...pages, ...extra], { cwd: dir });
}

test('apply rewrites image src, drops the old derivative ladder and preserves non-image references', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'skoda-media-apply-'));
  try {
    const { manifest, index } = fixture(dir);
    const page = path.join(dir, 'page.plain.html');
    writeFileSync(page, `<div><img alt="A" src="${source}" srcset="${source} 768w, ${master} 1920w"></div>`
      + `<script src="${source}"></script><a href="${source}">Source</a>`);
    await run(dir, manifest, index, [page]);
    const result = readFileSync(page, 'utf8');
    assert.match(result, new RegExp(`<img alt="A" src="${delivery}"`));
    assert.doesNotMatch(result, /srcset=/);
    assert.match(result, new RegExp(`<script src="${source}"`));
    const { items } = JSON.parse(readFileSync(index, 'utf8'));
    assert.equal(items[logicalId(source)].original_download_url, '/media-da/original.jpg');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('apply fails atomically when a requested page is missing or an image is unresolved', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'skoda-media-apply-'));
  try {
    const { manifest, index } = fixture(dir);
    const page = path.join(dir, 'page.plain.html');
    const original = `<img src="${source}"><img src="https://cdn.example.test/unknown.jpg">`;
    writeFileSync(page, original);
    await assert.rejects(run(dir, manifest, index, [page, path.join(dir, 'absent.html')]), /Media apply blocked/);
    assert.equal(readFileSync(page, 'utf8'), original);
    assert.equal(existsSync(index), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('apply dry-run reports rewrites without touching pages or writing the cart index', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'skoda-media-apply-'));
  try {
    const { manifest, index } = fixture(dir);
    const page = path.join(dir, 'page.plain.html');
    const original = `<img src="${source}">`;
    writeFileSync(page, original);
    await run(dir, manifest, index, [page], ['--dry-run']);
    assert.equal(readFileSync(page, 'utf8'), original);
    assert.equal(existsSync(index), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('known oversized partial media is deferred to the mandatory push gate, unknown media still fails', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'skoda-media-deferred-'));
  try {
    const { manifest, index } = fixture(dir);
    const page = path.join(dir, 'page.plain.html');
    const oversized = 'https://cdn.example.test/2025/too-big.jpg';
    const doc = `<figure><img src="${oversized}" alt="Large" data-caption="Keep"></figure>`;
    const record = JSON.parse(readFileSync(manifest, 'utf8'));
    record.rows[logicalId(oversized)] = {
      logical_id: logicalId(oversized),
      source_url: oversized,
      status: 'partial',
      steps: { deliver: 'skipped', dam: 'done' },
      note: 'no safe delivery rendition: oversize-no-derivative-under-threshold',
    };
    writeFileSync(manifest, JSON.stringify(record));
    writeFileSync(page, doc);
    const result = await run(dir, manifest, index, [page]);
    assert.match(result.stdout, /1 image\(s\) deferred to mandatory import:push gate/);
    assert.equal(readFileSync(page, 'utf8'), doc);

    const unknown = '<img src="https://cdn.example.test/unknown.jpg">';
    writeFileSync(page, doc + unknown);
    await assert.rejects(run(dir, manifest, index, [page]), /Media apply blocked/);
    assert.equal(readFileSync(page, 'utf8'), doc + unknown);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('apply rewrites public PDF/MP4 links by page-relative source path, atomically', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'skoda-binary-apply-'));
  try {
    const { manifest, index } = fixture(dir);
    const content = path.join(dir, 'content', 'en', 'press-releases');
    mkdirSync(content, { recursive: true });
    const page = path.join(content, 'example.plain.html');
    const pdf = 'https://www.skoda-storyboard.com/en/press-releases/assets/release.pdf';
    const mp4 = 'https://www.skoda-storyboard.com/direct-download/clip.mp4';
    const publicPdf = 'https://publish-p123.adobeaemcloud.com/content/dam/release.pdf';
    const publicMp4 = 'https://publish-p123.adobeaemcloud.com/content/dam/clip.mp4';
    const record = JSON.parse(readFileSync(manifest, 'utf8'));
    [
      [pdf, publicPdf, 'document', 'application/pdf'],
      [mp4, publicMp4, 'video', 'video/mp4'],
    ].forEach(([sourceUrl, publicUrl, kind, mime]) => {
      const id = logicalId(sourceUrl);
      record.rows[id] = {
        logical_id: id,
        kind,
        source_url: sourceUrl,
        public_url: publicUrl,
        bytes: 42,
        status: 'done',
        steps: { dam: 'done', publish: 'done' },
        dam_asset_path: `/content/dam/storyboard/${kind}`,
        public_verified: { url: publicUrl, mime, bytes: 42 },
        page_refs: ['en/press-releases/example'],
      };
    });
    writeFileSync(manifest, JSON.stringify(record));
    const original = '<p><a href="../assets/release.pdf" title="Release">Read PDF</a></p>'
      + '<p><a href="/direct-download/clip.mp4">Watch MP4</a></p>';
    writeFileSync(page, original);
    await run(dir, manifest, index, [page]);
    const result = readFileSync(page, 'utf8');
    assert.match(result, new RegExp(`href="${publicPdf}" title="Release">Read PDF`));
    assert.match(result, new RegExp(`href="${publicMp4}">Watch MP4`));
    await run(dir, manifest, index, [page]);
    assert.equal(readFileSync(page, 'utf8'), result);

    writeFileSync(page, `${original}<a href="/direct-download/missing.mp4">Missing</a>`);
    await assert.rejects(run(dir, manifest, index, [page]), /Media apply blocked/);
    assert.equal(readFileSync(page, 'utf8'), `${original}<a href="/direct-download/missing.mp4">Missing</a>`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
