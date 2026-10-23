/* global globalThis */
/*
 * App Promo (SKODA-810b): each block row's part read from its shape (intro, image, split,
 * heading, store), bare cell content given its paragraph, the heading and store rows grouped
 * in the download panel, empty rows dropped. Geometry is measured in the browser against the
 * source (docs/ui-specs/company-pages.md §11).
 * Run: node --test blocks/app-promo/app-promo.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

let JSDOM = null;
try {
  // eslint-disable-next-line import/no-unresolved
  ({ JSDOM } = createRequire(import.meta.url)('jsdom'));
} catch { /* jsdom unavailable — DOM tests skip */ }
const skip = JSDOM ? false : 'jsdom not installed — DOM tests skip';

const mod = JSDOM ? await import('./app-promo.js') : null;

const pic = (name) => `<picture><img src="/media_${name}.png" alt="${name}"></picture>`;
const ROWS = [
  [pic('icon'), '<strong>Škoda Media Room, the app …</strong>'],
  [pic('mockup')],
  [`<p>Text one.</p><p>${pic('shot2')}</p>`, `<p>${pic('shot1')}</p><p>Text two.</p>`],
  [' <br> Download the Škoda Media Room app here'],
  [pic('qr'), `<a href="https://apps.apple.com/x">${pic('appstore')}</a>`, `<a href="https://play.google.com/x">${pic('play')}</a>`],
];

function block(rows) {
  const dom = new JSDOM(`<main><div class="app-promo">${rows.map((cells) => `<div>${cells.map((c) => `<div>${c}</div>`).join('')}</div>`).join('')}</div></main>`);
  globalThis.document = dom.window.document;
  return dom.window.document.querySelector('.app-promo');
}

test('each row becomes its part; the heading and the store strip share the download panel', { skip }, () => {
  const el = block(ROWS);
  const badge = el.querySelector('a[href*="apple"]');
  mod.default(el);
  const parts = [...el.children].map((c) => c.className);
  assert.deepEqual(parts, ['app-promo-row app-promo-intro', 'app-promo-row app-promo-image', 'app-promo-row app-promo-split', 'app-promo-panel']);
  const panel = el.querySelector('.app-promo-panel');
  assert.deepEqual([...panel.children].map((c) => c.className), ['app-promo-row app-promo-heading', 'app-promo-row app-promo-store']);
  assert.equal(el.querySelectorAll('.app-promo-store .app-promo-cell').length, 3);
  assert.equal(el.querySelector('.app-promo-store a[href*="apple"]'), badge, 'the authored link is kept');
});

test('bare cell content gets its paragraph; picture paragraphs are marked', { skip }, () => {
  const el = block(ROWS);
  mod.default(el);
  const intro = el.querySelectorAll('.app-promo-intro .app-promo-cell');
  assert.ok(intro[0].querySelector(':scope > p.app-promo-picture img'));
  assert.equal(intro[1].querySelector(':scope > p > strong').textContent, 'Škoda Media Room, the app …');
  const split = el.querySelectorAll('.app-promo-split .app-promo-cell');
  assert.deepEqual([...split[0].children].map((p) => p.className), ['', 'app-promo-picture']);
  assert.deepEqual([...split[1].children].map((p) => p.className), ['app-promo-picture', '']);
  assert.match(el.querySelector('.app-promo-heading p').textContent, /Download the Škoda Media Room app here/);
});

test('partOf: the shapes', { skip }, () => {
  const cells = (...html) => html.map((h) => { const d = document.createElement('div'); d.innerHTML = h; return d; });
  assert.equal(mod.partOf(cells(pic('a'))), 'image');
  assert.equal(mod.partOf(cells('<p>Text</p>')), 'heading');
  assert.equal(mod.partOf(cells(pic('a'), '<p>Text</p>')), 'intro');
  assert.equal(mod.partOf(cells('<p>Text</p>', pic('a'))), 'split');
  assert.equal(mod.partOf(cells(pic('a'), pic('b'), pic('c'))), 'store');
  assert.equal(mod.partOf(cells(pic('a'), '<p>x</p>', pic('c'))), 'split');
});

test('empty rows drop; a store row without a heading stands alone', { skip }, () => {
  const el = block([[''], ROWS[4]]);
  mod.default(el);
  assert.deepEqual([...el.children].map((c) => c.className), ['app-promo-row app-promo-store']);
});
