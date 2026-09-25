import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync,
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
