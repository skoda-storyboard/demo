import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { logicalId } from './media-lib.mjs';

const exec = promisify(execFile);
const script = fileURLToPath(new URL('./audit-m1-media.mjs', import.meta.url));

test('M1 audit excludes the annotated alias, reports missing pages and checks image contracts', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'skoda-media-audit-'));
  try {
    const urls = path.join(dir, 'urls.txt');
    const manifest = path.join(dir, 'manifest.json');
    const output = path.join(dir, 'audit.json');
    const content = path.join(dir, 'content');
    mkdirSync(path.join(content, 'en'), { recursive: true });
    const image = 'https://cdn.example.test/2025/photo.jpg';
    writeFileSync(urls, [
      'https://www.skoda-storyboard.com/en/story/',
      '# ALIAS of next URL:',
      'https://www.skoda-storyboard.com/en/old-story/',
      'https://www.skoda-storyboard.com/en/other-story/',
      '',
    ].join('\n'));
    writeFileSync(
      path.join(content, 'en/story.plain.html'),
      `<figure><div><img src="${image}" alt="Photo" data-caption="Caption"></div>`
      + '<figcaption>Caption</figcaption></figure>',
    );
    writeFileSync(manifest, JSON.stringify({
      rows: {
        [logicalId(image)]: {
          logical_id: logicalId(image),
          dam_page_path: 'en/story',
          delivery_url: image,
          steps: { deliver: 'done', dam: 'done' },
          bytes: 100,
          dam_asset_path: '/content/dam/storyboard/photo.jpg',
        },
      },
    }));
    await assert.rejects(exec(process.execPath, [script, '--urls', urls, '--contentRoot', content,
      '--manifest', manifest, '--out', output], { cwd: dir }), /Command failed/);
    const report = JSON.parse(readFileSync(output, 'utf8'));
    assert.deepEqual(report.summary, {
      expectedPages: 2,
      presentPages: 1,
      missingPages: 1,
      images: 1,
      missingOrEmptyAlt: 0,
      misplaced: 0,
      missingCaption: 0,
      missingFromPage: 0,
      unresolvedDelivery: 0,
      pendingDamOriginal: 0,
    });

    assert.deepEqual(report.pages.map(({ path: p }) => p), ['en/story', 'en/other-story']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('M1 audit matches applied delivery URLs to originals and blocks missing DAM masters', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'skoda-media-audit-'));
  try {
    const urls = path.join(dir, 'urls.txt');
    const manifest = path.join(dir, 'manifest.json');
    const output = path.join(dir, 'audit.json');
    const content = path.join(dir, 'content');
    const source = 'https://cdn.example.test/2025/photo.jpg';
    const delivery = 'https://cdn.example.test/2025/photo-768x512.jpg';
    mkdirSync(path.join(content, 'en'), { recursive: true });
    writeFileSync(urls, 'https://www.skoda-storyboard.com/en/story/\n');
    writeFileSync(
      path.join(content, 'en/story.plain.html'),
      `<div><img src="${delivery}" alt="Photo"></div>`,
    );
    writeFileSync(manifest, JSON.stringify({
      rows: {
        [logicalId(source)]: {
          logical_id: logicalId(source),
          page_refs: ['en/story'],
          delivery_url: delivery,
          steps: { deliver: 'done', dam: 'pending' },
          bytes: 100,
        },
      },
    }));
    const command = [script, '--urls', urls, '--contentRoot', content,
      '--manifest', manifest, '--out', output];
    await assert.rejects(exec(process.execPath, command, { cwd: dir }), /Command failed/);
    let report = JSON.parse(readFileSync(output, 'utf8'));
    assert.equal(report.summary.missingFromPage, 0);
    assert.equal(report.summary.pendingDamOriginal, 1);
    assert.equal(report.pages[0].images[0].delivery, 'prepared');

    const rows = JSON.parse(readFileSync(manifest, 'utf8'));
    rows.rows[logicalId(source)].steps.dam = 'done';
    rows.rows[logicalId(source)].dam_asset_path = '/content/dam/storyboard/photo.jpg';
    writeFileSync(manifest, JSON.stringify(rows));
    await exec(process.execPath, command, { cwd: dir });
    report = JSON.parse(readFileSync(output, 'utf8'));
    assert.equal(report.summary.pendingDamOriginal, 0);
    assert.equal(report.summary.missingFromPage, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('M1 audit fails when an image-bearing page loses all its images', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'skoda-media-audit-'));
  try {
    const urls = path.join(dir, 'urls.txt');
    const manifest = path.join(dir, 'manifest.json');
    const content = path.join(dir, 'content');
    const output = path.join(dir, 'audit.json');
    mkdirSync(path.join(content, 'en'), { recursive: true });
    writeFileSync(urls, 'https://www.skoda-storyboard.com/en/story/\n');
    writeFileSync(path.join(content, 'en/story.plain.html'), '<p>Text survived; image did not.</p>');
    const image = 'https://cdn.example.test/2025/photo.jpg';
    writeFileSync(manifest, JSON.stringify({
      rows: {
        [logicalId(image)]: {
          logical_id: logicalId(image),
          page_refs: ['en/story'],
          steps: { deliver: 'done' },
          bytes: 100,
        },
      },
    }));
    await assert.rejects(exec(process.execPath, [script, '--urls', urls, '--contentRoot', content,
      '--manifest', manifest, '--out', output], { cwd: dir }), /Command failed/);
    const report = JSON.parse(readFileSync(output, 'utf8'));
    assert.equal(report.summary.missingFromPage, 1);
    assert.deepEqual(report.pages[0].missingImages, [logicalId(image)]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
