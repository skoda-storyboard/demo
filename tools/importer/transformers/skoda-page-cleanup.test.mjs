/* global globalThis */
/*
 * Unit tests for skoda-page-cleanup's URL-hygiene pass (SKODA-801 review D4).
 * Run: node --test tools/importer/transformers/skoda-page-cleanup.test.mjs
 *
 * Focus: the afterTransform href normalisation — strip #s_aid/#s_cid tracking
 * fragments (idempotency, SKODA-602) and collapse multiply-encoded hrefs to a
 * single valid encoding (D4). jsdom is resolved from the import-validator toolchain
 * (repo has no DOM lib); tests skip cleanly if it is unavailable so `npm test` stays
 * green everywhere. The transformer reads `document` + `WebImporter` as globals.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

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

// The transformer only uses WebImporter.DOMUtils.remove in beforeTransform; the D4
// path uses plain DOM. A no-op stub is enough for these afterTransform tests.
globalThis.WebImporter = { DOMUtils: { remove() {} } };

const { default: transform } = await import('./skoda-page-cleanup.js');

// Run the afterTransform hook with `document` bound to the test DOM (the transformer
// references a global `document`, which JSDOM exposes on its window — assign it).
function runAfter(html) {
  const dom = new JSDOM(`<body>${html}</body>`);
  globalThis.document = dom.window.document;
  const el = dom.window.document.body;
  transform('afterTransform', el, {});
  return el;
}

test('collapses a multiply-encoded href to single valid encoding (D4)', { skip }, () => {
  const el = runAfter('<main><a href="https://apps.apple.com/us/app/%2525252525C5%2525252525A1koda-magic-book/id1">x</a></main>');
  const href = el.querySelector('a').getAttribute('href');
  assert.equal(href, 'https://apps.apple.com/us/app/%C5%A1koda-magic-book/id1');
  assert.equal(decodeURIComponent(href), 'https://apps.apple.com/us/app/škoda-magic-book/id1', 'decodes once cleanly');
});

test('leaves a correctly single-encoded href untouched', { skip }, () => {
  const url = 'https://example.com/%C5%A1koda';
  const el = runAfter(`<main><a href="${url}">x</a></main>`);
  assert.equal(el.querySelector('a').getAttribute('href'), url);
});

test('leaves a plain href untouched', { skip }, () => {
  const url = 'https://www.skoda-storyboard.com/en/models/octavia/';
  const el = runAfter(`<main><a href="${url}">Octavia</a></main>`);
  assert.equal(el.querySelector('a').getAttribute('href'), url);
});

test('still strips #s_aid / #s_cid tracking fragments (unchanged)', { skip }, () => {
  const el = runAfter('<main><a href="https://cdn.example.com/x.jpg#s_aid=ABC123">img</a></main>');
  assert.equal(el.querySelector('a').getAttribute('href'), 'https://cdn.example.com/x.jpg');
});

test('malformed percent-encoding does not throw (left as-is)', { skip }, () => {
  const url = 'https://example.com/%E0%A4%A'; // truncated → decodeURIComponent throws
  const el = runAfter(`<main><a href="${url}">x</a></main>`);
  assert.equal(el.querySelector('a').getAttribute('href'), url);
});
