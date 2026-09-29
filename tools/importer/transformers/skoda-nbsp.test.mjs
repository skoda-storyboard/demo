/*
 * skoda-nbsp.js: the source's glued non-breaking spaces survive the import as a placeholder
 * (helix html2md would turn them into plain spaces); push-lib wrapPage restores them.
 * Run: node --test tools/importer/transformers/skoda-nbsp.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { NBSP_PLACEHOLDER, wrapPage } from '../push/push-lib.mjs';

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

const { default: transform } = await import('./skoda-nbsp.js');

function run(html, hook = 'preprocess') {
  const { document } = new JSDOM(`<body><main>${html}</main></body>`).window;
  const main = document.querySelector('main');
  transform(hook, main, { document });
  return main;
}

test('glued non-breaking spaces become the placeholder; spacers and plain spaces stay', { skip }, () => {
  const main = run('<p>plays to the&nbsp;strengths, a&nbsp;roomy boot</p><p>&nbsp;</p><p>tail&nbsp; end</p>');
  const [glued, spacer, loose] = [...main.querySelectorAll('p')].map((p) => p.textContent);
  assert.equal(glued, `plays to the${NBSP_PLACEHOLDER}strengths, a${NBSP_PLACEHOLDER}roomy boot`);
  assert.equal(spacer, '\u00a0', 'a spacer paragraph is left for html2md to drop, as before');
  assert.equal(loose, 'tail\u00a0 end', 'not between two visible characters');
});

test('only runs on the preprocess hook (before html2md normalises the page)', { skip }, () => {
  assert.equal(run('<p>a&nbsp;b</p>', 'afterTransform').textContent, 'a\u00a0b');
});

test('round trip: the pushed document carries U+00A0 again', { skip }, () => {
  const main = run('<p>the&nbsp;strengths</p>');
  assert.match(wrapPage(main.innerHTML), /<p>the\u00a0strengths<\/p>/);
});

test('transformer and push-lib use the same placeholder', () => {
  const src = readFileSync(new URL('./skoda-nbsp.js', import.meta.url), 'utf8');
  assert.match(src, /const NBSP_PLACEHOLDER = '\\u\{F00A0\}';/);
  assert.equal(NBSP_PLACEHOLDER, '\u{F00A0}');
});
