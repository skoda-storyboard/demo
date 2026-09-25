/* global globalThis */
/*
 * Unit tests for skoda-links (SKODA-605): source-host links to demo pages become
 * site-relative; everything else keeps its href. Plus a drift guard for the generated
 * allow-list block.
 * Run: node --test tools/importer/transformers/skoda-links.test.mjs
 *
 * jsdom is resolved like skoda-page-cleanup.test.mjs; the DOM tests skip cleanly if it
 * is unavailable. The drift test needs no DOM.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readLists, renderInto, TARGET } from '../build-link-allowlist.mjs';

let JSDOM = null;
try {
  const req = createRequire('/home/node/.excat-marketplaces/excat-marketplace/excat/hooks/import-validator/');
  // eslint-disable-next-line import/no-unresolved
  ({ JSDOM } = req('jsdom'));
} catch {
  try {
    const req = createRequire(import.meta.url);
    // eslint-disable-next-line import/no-unresolved
    ({ JSDOM } = req('jsdom'));
  } catch { /* jsdom unavailable — skip */ }
}
const skip = JSDOM ? false : 'jsdom not installed — DOM tests skip';

globalThis.WebImporter = { DOMUtils: { remove() {} } };

const { default: transform } = await import('./skoda-links.js');

const SRC = 'https://www.skoda-storyboard.com';
const STORY = '/en/emobility/skoda-epiq-will-win-you-over-in-just-a-few-seconds';

function run(html, hook = 'afterTransform') {
  const dom = new JSDOM(`<body>${html}</body>`);
  globalThis.document = dom.window.document;
  const el = dom.window.document.body;
  transform(hook, el, {});
  return el;
}
const hrefs = (el) => [...el.querySelectorAll('a')].map((a) => a.getAttribute('href'));
const one = (href) => hrefs(run(`<a href="${href}">x</a>`))[0];

test('demo-page link becomes site-relative without the trailing slash', { skip }, () => {
  assert.equal(one(`${SRC}${STORY}/`), STORY);
  assert.equal(one(`${SRC}/en/`), '/en');
  assert.equal(one(`${SRC}/en/videos/`), '/en/videos');
  assert.equal(one(`${SRC}/en/skoda-model/peaq/`), '/en/skoda-model/peaq');
});

test('query and hash are kept byte-for-byte', { skip }, () => {
  assert.equal(one(`${SRC}/en/images/?filter%5Bmodel%5D%5B%5D=peaq#grid`), '/en/images?filter%5Bmodel%5D%5B%5D=peaq#grid');
  assert.equal(one(`${SRC}${STORY}#comments`), `${STORY}#comments`);
});

test('http, apex, protocol-relative and uppercase host variants are rewritten', { skip }, () => {
  assert.equal(one(`http://www.skoda-storyboard.com${STORY}/`), STORY);
  assert.equal(one(`https://skoda-storyboard.com${STORY}/`), STORY);
  assert.equal(one(`//www.skoda-storyboard.com${STORY}/`), STORY);
  assert.equal(one(`HTTPS://WWW.SKODA-STORYBOARD.COM${STORY.toUpperCase()}/`), STORY);
});

test('the mixed-reality alias goes straight to its canonical', { skip }, () => {
  assert.equal(
    one(`${SRC}/en/skoda-world/innovation-and-technology/explore-the-new-skoda-models-in-mixed-reality/`),
    '/en/skoda-world/explore-the-new-skoda-models-in-mixed-reality',
  );
});

test('source-host links outside the demo stay absolute (D-3 (b))', { skip }, () => {
  [
    `${SRC}/en/tag/model/epiq/`,
    `${SRC}/en/news/?filter%5Byears%5D%5B%5D=2026`,
    `${SRC}/en/category/emobility/`,
    `${SRC}/en/emobility/whats-behind-epiq-design/`,
    `${SRC}/?attachment_id=454117`,
    `${SRC}/`,
    `${SRC}/cs/`,
  ].forEach((href) => assert.equal(one(href), href));
});

test('cdn, external, mailto, tel, anchors and relative links are untouched', { skip }, () => {
  [
    'https://cdn.skoda-storyboard.com/2026/08/release_fd432da8.pdf',
    'https://www.skoda-storyboard.com.example.org/en/',
    'https://www.youtube.com/watch?v=1Y3QHmZeLxk',
    'mailto:press@skoda-auto.cz',
    'tel:+420326811111',
    '#subscribe',
    '/en/tag/model/fabia',
    '',
  ].forEach((href) => assert.equal(one(href), href));
});

test('/direct-download/ links point at the live source', { skip }, () => {
  assert.equal(one('/direct-download/2026/08/zellmer_1a2b3c4d.jpg'), `${SRC}/direct-download/2026/08/zellmer_1a2b3c4d.jpg`);
});

test('#s_aid / #s_cid fragments are stripped, then the link is rewritten', { skip }, () => {
  assert.equal(one('https://cdn.skoda-storyboard.com/2024/10/TD-Elroq-en_new_7a3c9a44.pdf#s_aid=AbC123'), 'https://cdn.skoda-storyboard.com/2024/10/TD-Elroq-en_new_7a3c9a44.pdf');
  assert.equal(one(`${SRC}${STORY}/#s_cid=xyz`), STORY);
});

test('links inside block tables are rewritten too', { skip }, () => {
  const el = run(`<table><tr><th>Tags</th></tr><tr><td><a href="${SRC}/en/tag/years/2026/">2026</a></td></tr>
    <tr><td><a href="${SRC}${STORY}/">Epiq</a></td></tr></table>`);
  assert.deepEqual(hrefs(el), [`${SRC}/en/tag/years/2026/`, STORY]);
});

test('beforeTransform is a no-op', { skip }, () => {
  const el = run(`<a href="${SRC}${STORY}/">x</a>`, 'beforeTransform');
  assert.equal(hrefs(el)[0], `${SRC}${STORY}/`);
});

test('idempotent: a second run changes nothing', { skip }, () => {
  const html = [
    `<a href="${SRC}${STORY}/">a</a>`,
    `<a href="${SRC}/en/tag/model/epiq/">b</a>`,
    '<a href="/direct-download/2026/08/x.jpg">c</a>',
    '<a href="https://cdn.skoda-storyboard.com/x.pdf#s_aid=1">d</a>',
  ].join('');
  const first = run(html);
  const once = first.innerHTML;
  transform('afterTransform', first, {});
  assert.equal(first.innerHTML, once);
});

test('every URL-set page and corpus page (non-attachment) is on the allow-list', { skip }, () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
  const lines = ['skoda-m1-url-set.txt', 'skoda-rail-feed-corpus.txt']
    .flatMap((f) => readFileSync(path.join(root, 'docs/planning', f), 'utf8').split(/\r?\n/))
    .map((l) => l.trim())
    .filter((l) => l.startsWith('https://www.skoda-storyboard.com/') && !l.includes('attachment_id='));
  assert.ok(lines.length > 100);
  lines.forEach((url) => assert.ok(one(url).startsWith('/'), `not rewritten: ${url}`));
});

test('the generated allow-list block matches the URL set + corpus (run npm run import:allowlist)', () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
  const source = readFileSync(path.join(root, TARGET), 'utf8');
  assert.equal(renderInto(source, readLists(root)), source);
});
