import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { logicalId } from './media-lib.mjs';
import {
  binaryErrors, binaryKind, publicBinaryUrl, rewriteBinaryLinks, verifyPublicBinary,
} from './binary-media.mjs';

const exec = promisify(execFile);
const cli = fileURLToPath(new URL('./validate-binary-media.mjs', import.meta.url));
const pdf = 'https://www.skoda-storyboard.com/direct-download/report.pdf?tracking=1';
const mp4 = 'https://www.skoda-storyboard.com/direct-download/clip.mp4';
const hostedPdf = 'https://publish-p123.adobeaemcloud.com/content/dam/report.pdf';
const hostedMp4 = 'https://publish-p123.adobeaemcloud.com/content/dam/clip.mp4';
const row = (url, hosted, kind) => ({
  logical_id: logicalId(url),
  source_url: url.split('?')[0],
  seen_urls: [url],
  dam_asset_path: `/content/dam/${kind}.${kind === 'video' ? 'mp4' : 'pdf'}`,
  public_url: hosted,
  public_verified: {
    url: hosted, mime: kind === 'video' ? 'video/mp4' : 'application/pdf', bytes: 42,
  },
  page_refs: ['en/press-releases/example'],
  bytes: 42,
  status: 'done',
  steps: {
    deliver: 'n/a', dam: 'done', publish: 'done', da: 'n/a',
  },
  kind,
});
const manifest = {
  rows: {
    [logicalId(pdf)]: row(pdf, hostedPdf, 'document'),
    [logicalId(mp4)]: row(mp4, hostedMp4, 'video'),
  },
};

test('PDF/MP4 links rewrite without touching text, embeds or image references', () => {
  const html = `<div><a title="Annual report" href="${pdf}">Annual report</a>`
    + `<a href="${mp4}">MP4</a>`
    + '<a href="https://player.vimeo.com/video/123">Watch video</a>'
    + '<img src="https://cdn.example.test/poster.jpg" alt="Video poster"></div>';
  const result = rewriteBinaryLinks(html, manifest);
  assert.equal(result.rewrites, 2);
  assert.deepEqual(result.errors, []);
  assert.match(result.html, new RegExp(`href="${hostedPdf}"`));
  assert.match(result.html, new RegExp(`href="${hostedMp4}"`));
  assert.match(result.html, /title="Annual report"[^>]*>Annual report/);
  assert.match(result.html, /player\.vimeo\.com\/video\/123/);
  assert.match(result.html, /poster\.jpg/);
  assert.equal(binaryKind('https://player.vimeo.com/video/123'), null);
  assert.equal(rewriteBinaryLinks(result.html, manifest).rewrites, 0);
});

test('a declared MIME identifies a binary when the source URL has no extension', () => {
  const source = 'https://www.skoda-storyboard.com/reports/annual';
  const rows = structuredClone(manifest);
  rows.rows[logicalId(source)] = {
    ...row(source, hostedPdf, 'document'),
    source_url: source,
  };
  const html = `<a type="application/pdf" href="${source}">Annual report</a>`;
  assert.equal(binaryKind(source, 'application/pdf'), 'document');
  assert.equal(rewriteBinaryLinks(html, rows).errors.length, 0);
  assert.match(rewriteBinaryLinks(html, rows).html, new RegExp(`href="${hostedPdf}"`));
});

test('single-quoted and unquoted binary anchors rewrite without modifying labels', () => {
  const source = 'https://www.skoda-storyboard.com/direct-download/clip.mp4';
  const html = `<a href='${source}'>MP4</a><a type='video/mp4' href=${source}>Second MP4</a>`;
  const result = rewriteBinaryLinks(html, manifest);
  assert.equal(result.rewrites, 2);
  assert.deepEqual(result.errors, []);
  assert.match(result.html, new RegExp(`href='${hostedMp4}'>MP4`));
  assert.match(result.html, /Second MP4/);
  assert.match(binaryErrors('<source type="video/mp4" src="/videos/download">', manifest).join(' '), /source src points at a PDF\/MP4/);
});

test('offline gate fails closed for missing refs, wrong tags and unverified destinations', () => {
  assert.deepEqual(binaryErrors(
    `<p><a href="${hostedPdf}">PDF</a><a href="${hostedMp4}">MP4</a></p>`,
    manifest,
    'en/press-releases/example',
  ), []);
  assert.match(binaryErrors(
    `<a href="${hostedPdf}">PDF</a>`,
    manifest,
    'en/press-releases/example',
  ).join(' '), /imported binary link missing/);
  assert.match(binaryErrors(
    `<img src="${hostedPdf}"><a href="${pdf}"></a>`,
    manifest,
  ).join(' '), /img src points at a PDF\/MP4/);
  assert.match(
    binaryErrors(`<video src="${hostedMp4}"></video>`, manifest).join(' '),
    /video src points at a PDF\/MP4/,
  );
  assert.deepEqual(binaryErrors(`<a href="${hostedPdf}" aria-label="Download PDF"></a>`, manifest), []);
  assert.match(
    binaryErrors(`<a href="${pdf}"></a>`, manifest).join(' '),
    /not re-hosted.*no accessible label/s,
  );
  assert.match(
    rewriteBinaryLinks(`<a href="${pdf}">PDF</a>`, { rows: {} }).errors.join(' '),
    /unverified document link/,
  );
  const wrong = structuredClone(manifest);
  wrong.rows[logicalId(pdf)].public_verified.mime = 'image/jpeg';
  assert.match(
    binaryErrors(`<a href="${hostedPdf}">PDF</a>`, wrong).join(' '),
    /unverified document link/,
  );
  wrong.rows[logicalId(pdf)].public_verified.mime = 'application/pdf';
  wrong.rows[logicalId(pdf)].public_verified.bytes = 41;
  assert.match(
    binaryErrors(`<a href="${hostedPdf}">PDF</a>`, wrong).join(' '),
    /unverified document link/,
  );
  wrong.rows[logicalId(pdf)].public_verified.bytes = 42;
  wrong.rows[logicalId(pdf)].steps.publish = 'error';
  assert.match(
    binaryErrors(`<a href="${hostedPdf}">PDF</a>`, wrong).join(' '),
    /unverified document link/,
  );
});

test('public proof refuses redirects and mismatched MIME/size', async () => {
  assert.equal(publicBinaryUrl('https://[::1]/report.pdf'), false);
  assert.equal(publicBinaryUrl('https://author-p123.adobeaemcloud.com/report.pdf'), false);
  const previousFetch = global.fetch;
  try {
    global.fetch = async () => new Response(null, {
      status: 200,
      headers: { 'content-type': 'video/mp4', 'content-length': '42' },
    });
    await assert.rejects(verifyPublicBinary(hostedPdf, 'document', 42), /type\/size mismatch/);
    assert.deepEqual(
      await verifyPublicBinary(hostedMp4, 'video', 42),
      { url: hostedMp4, mime: 'video/mp4', bytes: 42 },
    );
    global.fetch = async () => new Response(null, { status: 302, headers: { location: 'https://signed.example.test/' } });
    await assert.rejects(verifyPublicBinary(hostedMp4, 'video', 42), /HEAD returned 302/);
    global.fetch = async () => new Response(null, { status: 403 });
    await assert.rejects(verifyPublicBinary(hostedMp4, 'video', 42), /HEAD returned 403/);
  } finally {
    global.fetch = previousFetch;
  }
});

test('public proof waits for a newly activated original but does not retry forbidden access', async () => {
  const previousFetch = global.fetch;
  let calls = 0;
  try {
    global.fetch = async () => {
      calls += 1;
      return calls < 3 ? new Response(null, { status: 404 }) : new Response(null, {
        status: 200,
        headers: { 'content-type': 'application/pdf', 'content-length': '42' },
      });
    };
    assert.deepEqual(await verifyPublicBinary(hostedPdf, 'document', 42, {
      attempts: 3, intervalMs: 0,
    }), { url: hostedPdf, mime: 'application/pdf', bytes: 42 });
    assert.equal(calls, 3);
    calls = 0;
    global.fetch = async () => {
      calls += 1;
      return new Response(null, { status: 403 });
    };
    await assert.rejects(verifyPublicBinary(hostedPdf, 'document', 42, {
      attempts: 3, intervalMs: 0,
    }), /returned 403/);
    assert.equal(calls, 1);
  } finally {
    global.fetch = previousFetch;
  }
});

test('standalone validator exits nonzero and reports page-specific failures', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'skoda-binary-gate-'));
  try {
    const file = path.join(dir, 'example.plain.html');
    const mapping = path.join(dir, 'manifest.json');
    writeFileSync(mapping, JSON.stringify(manifest));
    writeFileSync(file, `<a href="${pdf}">PDF</a>`);
    await assert.rejects(
      exec(process.execPath, [cli, '--manifest', mapping, '--pages', file]),
      (error) => {
        assert.match(error.stdout, /binary link not re-hosted/);
        return true;
      },
    );
    writeFileSync(file, `<a href="${hostedPdf}">PDF</a><a href="${hostedMp4}">MP4</a>`);
    const { stdout } = await exec(process.execPath, [cli, '--manifest', mapping, '--pages', file]);
    assert.equal(JSON.parse(stdout).results[0].errors.length, 0);
    assert.match(readFileSync(file, 'utf8'), /MP4/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
