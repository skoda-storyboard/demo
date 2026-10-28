/* global globalThis */
/*
 * Unit tests for skoda-page-rows (SKODA-813): the generic page body as one section per
 * SiteOrigin row, `page-body`, with the copyright's half-width rows as `page-body, half`.
 * Fixture: test/fixtures/page-base/copyright.html, the live /en/copyright trimmed to its
 * layout CSS, hero and article (test/* is .hlxignore'd).
 * Run: node --test tools/importer/transformers/skoda-page-rows.test.mjs
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

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

globalThis.WebImporter = {
  Blocks: {
    createBlock(doc, { name, cells }) {
      const table = doc.createElement('table');
      [[name], ...Object.entries(cells)].forEach((cols) => {
        const tr = table.insertRow();
        cols.forEach((c) => { tr.insertCell().textContent = c; });
      });
      return table;
    },
  },
};
const transform = JSDOM ? (await import('./skoda-page-rows.js')).default : null;

const FIXTURE = new URL('../../../test/fixtures/page-base/copyright.html', import.meta.url);

// the three hooks, the importer's order (the importer drops <style> between preprocess and
// transform)
function run(html, template = {}) {
  const { document } = new JSDOM(html).window;
  transform('preprocess', document.body, { document, template });
  document.querySelectorAll('style').forEach((s) => s.remove());
  transform('beforeTransform', document.body, { document, template });
  transform('afterTransform', document.body, { document, template });
  return document;
}
const styles = (doc) => [...doc.querySelectorAll('table')].map((t) => t.rows[1].cells[1].textContent);

test('copyright: one section per row; the four left-half rows are `half`, the first with its empty widget', { skip }, () => {
  const doc = run(readFileSync(FIXTURE, 'utf8'));
  assert.deepEqual(styles(doc), [
    'page-body', 'page-body, half, empty-cell', 'page-body, half', 'page-body, half', 'page-body, half',
  ]);
  assert.equal(doc.querySelectorAll('article hr').length, 4, 'a break before every row but the first');
  // each row's metadata opens its section: right after the break (or at the body's start)
  doc.querySelectorAll('article hr').forEach((hr) => assert.equal(hr.nextElementSibling.tagName, 'TABLE'));
  assert.equal(doc.querySelectorAll('[data-skoda-page-body], [data-skoda-half-row]').length, 0, 'no marks left');
});

const page = (css, rows) => `<html><head><style>${css}</style></head><body><main>
  <article class="page"><div class="entry-content"><div class="panel-layout">${rows}</div></div></article></main></body></html>`;
const cell = (id, text, extra = '') => `<div id="${id}" class="panel-grid-cell${extra}">${text}</div>`;

test('only a 50% left cell beside an empty one is half; full, filled-twice and 60/40 rows stay page-body', { skip }, () => {
  const doc = run(page(
    '#pgc-1-0-0 { width:100% } #pgc-1-1-0, #pgc-1-1-1, #pgc-1-2-0, #pgc-1-2-1 { width:50% } #pgc-1-3-0 { width:60% } #pgc-1-3-1 { width:40% } @media (max-width:780px){ #pgc-1-1-0 { width:100% } }',
    `<div id="pg-1-0" class="panel-grid">${cell('pgc-1-0-0', '<p>full</p>')}</div>
     <div id="pg-1-1" class="panel-grid">${cell('pgc-1-1-0', '<p>left</p>')}${cell('pgc-1-1-1', '<p>right</p>')}</div>
     <div id="pg-1-2" class="panel-grid">${cell('pgc-1-2-0', '<p>half</p>')}${cell('pgc-1-2-1', '', ' panel-grid-cell-empty')}</div>
     <div id="pg-1-3" class="panel-grid">${cell('pgc-1-3-0', '<p>sixty</p>')}${cell('pgc-1-3-1', ' &nbsp; ')}</div>`,
  ));
  assert.deepEqual(styles(doc), ['page-body', 'page-body', 'page-body, half', 'page-body']);
});

test('a row wrapped in .panel-row-style still counts; a page with no rows is one page-body section', { skip }, () => {
  const styled = run(page(
    '#pgc-2-0-0, #pgc-2-0-1 { width:50% }',
    `<div id="pg-2-0" class="panel-grid"><div class="panel-row-style">${cell('pgc-2-0-0', '<h3>T</h3>')}${cell('pgc-2-0-1', '')}</div></div>`,
  ));
  assert.deepEqual(styles(styled), ['page-body, half']);

  const { document } = new JSDOM('<main><article class="page"><div class="entry-content"><p>plain</p></div></article></main>').window;
  ['preprocess', 'beforeTransform', 'afterTransform'].forEach((hook) => transform(hook, document.body, { document }));
  // no rows, no widget: no widget's 10px above the first line (SKODA-843)
  assert.deepEqual(styles(document), ['page-body, plain']);
  assert.equal(document.querySelector('.entry-content').previousElementSibling.tagName, 'TABLE', 'it opens the body');
});

test('an empty body (a title-only page such as /en/impressum) gets no page-body section (SKODA-843)', { skip }, () => {
  const { document } = new JSDOM('<main><article class="page"><div class="entry-content"> \u00a0 </div></article></main>').window;
  ['preprocess', 'beforeTransform', 'afterTransform'].forEach((hook) => transform(hook, document.body, { document }));
  assert.deepEqual(styles(document), []);
});

test('no article: nothing happens', { skip }, () => {
  const { document } = new JSDOM('<main><div class="x"><p>other page</p></div></main>').window;
  const before = document.body.innerHTML;
  ['preprocess', 'beforeTransform', 'afterTransform'].forEach((hook) => transform(hook, document.body, { document }));
  assert.equal(document.body.innerHTML, before);
});

test('two layouts in one style (a nested builder first): the article\'s widths still count (code review)', { skip }, () => {
  const css = '/* Layout 9 */ #pgc-9-0-0 { width:100% } @media (max-width:780px){ #pg-9-0 { flex-direction:column } #pgc-9-0-0 { width:100% } } '
    + '/* Layout 3 */ #pgc-3-0-0, #pgc-3-0-1 { width:50% } @media (max-width:780px){ #pgc-3-0-0 { width:100% } }';
  const doc = run(page(css, `<div id="pg-3-0" class="panel-grid">${cell('pgc-3-0-0', '<p>half</p>')}${cell('pgc-3-0-1', '')}</div>`));
  assert.deepEqual(styles(doc), ['page-body, half']);
});

test('each further widget of a one-cell row is its own section, as each source widget starts 10px down (SKODA-843)', { skip }, () => {
  const widget = (html) => `<div class="so-panel widget"><div class="textwidget">${html}</div></div>`;
  const html = page('', `<div id="pg-1-0" class="panel-grid">${cell('pgc-1-0-0', widget('<p>first</p>') + widget('<h4>Second</h4>') + widget(' '))}</div>`);
  const doc = run(html, { splitWidgets: true });
  assert.deepEqual(styles(doc), ['page-body', 'page-body']);
  assert.ok(doc.querySelector('hr'), 'a section break before the second widget');
  // opt-in (import-page-base): the company importer places its widgets itself (#843 review)
  const company = run(html, { name: 'company-page' });
  assert.deepEqual(styles(company), ['page-body'], 'one section per row without the opt-in');
  assert.equal(company.querySelector('hr'), null);
});
