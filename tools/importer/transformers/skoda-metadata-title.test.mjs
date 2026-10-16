/* global globalThis */
/*
 * The metadata Title takes the H1's spacing when the source SEO title dropped the space at the
 * H1's line break (the Epiq Sportline release, 2026-10-14). Runs the production transformer on
 * jsdom; skips if jsdom is unavailable.
 * Run: node --test tools/importer/transformers/skoda-metadata-title.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

let JSDOM = null;
try {
  // eslint-disable-next-line import/no-unresolved
  ({ JSDOM } = createRequire(import.meta.url)('jsdom'));
} catch { /* jsdom unavailable — skip */ }
const skip = JSDOM ? false : 'jsdom not installed — DOM tests skip';

let captured = null;
globalThis.WebImporter = {
  Blocks: {
    getMetadataBlock: (doc, meta) => {
      captured = meta;
      return doc.createElement('table');
    },
  },
};
const { default: metadata } = await import('./skoda-metadata.js');

const URL = 'https://www.skoda-storyboard.com/en/press-releases/x/';
function titleOf(ogTitle, h1) {
  const { document } = new JSDOM(`<html><head><meta property="og:title" content="${ogTitle} - Škoda Storyboard"></head>
    <body class="single single-press_release"><h1>${h1}</h1></body></html>`).window;
  captured = null;
  metadata('afterTransform', document.body, { document, url: URL, params: { originalURL: URL } });
  return captured.Title;
}

test('a title that lost the space at the H1 line break takes the H1 spacing', { skip }, () => {
  assert.equal(
    titleOf(
      'Škoda expands electric portfolio: the new Epiq Sportlinedebuts with dynamic exterior styling',
      'Škoda expands electric portfolio: the new Epiq Sportline<br>debuts with dynamic exterior styling',
    ),
    'Škoda expands electric portfolio: the new Epiq Sportline debuts with dynamic exterior styling',
  );
  // a non-breaking space (or skoda-nbsp's placeholder) in the H1 counts as the break too
  assert.equal(titleOf('Epiq Sportlinedebuts', 'Epiq Sportline debuts'), 'Epiq Sportline debuts');
  assert.equal(titleOf('Epiq Sportlinedebuts', 'Epiq Sportline\u{F00A0}debuts'), 'Epiq Sportline debuts');
});

test('an SEO title that differs from the H1 is kept as it is', { skip }, () => {
  assert.equal(titleOf('Short SEO title', 'A longer<br>headline'), 'Short SEO title');
  assert.equal(titleOf('Epiq Sportline debuts', 'Epiq Sportline<br>debuts'), 'Epiq Sportline debuts');
  // same characters but the title already has more word breaks than the H1: untouched
  assert.equal(titleOf('Skoda Auto', 'SkodaAuto'), 'Skoda Auto');
});
