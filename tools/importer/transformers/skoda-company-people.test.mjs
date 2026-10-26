/* global globalThis */
/*
 * Unit tests for skoda-company-people (SKODA-810a): the Contacts and Board of Management rows
 * of person cards as `Contact Directory` / `Exec Bio` blocks, the spacer rows as `Spacer` +
 * `Spacer (line)` sections, the `pull-up` rows and the kept blank line.
 * Fixtures: test/fixtures/company-pages/{contacts,board-of-management}.html, the live
 * `article .entry-content` (test/* is .hlxignore'd).
 * Run: node --test tools/importer/transformers/skoda-company-people.test.mjs
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

const table = (doc, rows) => {
  const t = doc.createElement('table');
  rows.forEach((cols) => {
    const tr = t.insertRow();
    cols.forEach((c) => {
      const td = tr.insertCell();
      [c].flat().forEach((n) => td.append(n));
    });
  });
  return t;
};
globalThis.WebImporter = {
  Blocks: { createBlock: (doc, { name, cells }) => table(doc, [[name], ...Object.entries(cells)]) },
  DOMUtils: { createTable: (rows, doc) => table(doc, rows) },
};
const pageRows = JSDOM ? (await import('./skoda-page-rows.js')).default : null;
const people = JSDOM ? (await import('./skoda-company-people.js')).default : null;

const fixture = (name) => readFileSync(new URL(`../../../test/fixtures/company-pages/${name}.html`, import.meta.url), 'utf8');

// the importer's order: preprocess (nbsp, rows, people), then beforeTransform (rows, people),
// then afterTransform (rows: the Section Metadata)
function run(html) {
  const { document } = new JSDOM(`<html><body><main><article class="page">${html}</article></main></body></html>`).window;
  pageRows('preprocess', document.body, { document });
  people('preprocess', document.body, { document });
  pageRows('beforeTransform', document.body, { document });
  people('beforeTransform', document.body, { document });
  pageRows('afterTransform', document.body, { document });
  return document;
}
const blocks = (doc, name) => [...doc.querySelectorAll('table')].filter((t) => t.rows[0].cells[0].textContent === name);
const styles = (doc) => blocks(doc, 'Section Metadata').map((t) => t.rows[1].cells[1].textContent);

test('contacts: one Contact Directory per row, a row per card, the group headings as text', { skip }, () => {
  const doc = run(fixture('contacts'));
  const dirs = blocks(doc, 'Contact Directory');
  assert.deepEqual(dirs.map((t) => t.rows.length - 1), [1, 1, 2, 2, 1, 2, 2, 1]);
  const cards = dirs.flatMap((t) => [...t.rows].slice(1)).map((tr) => tr.cells[0]);
  assert.equal(cards.length, 12);
  cards.forEach((card) => {
    assert.equal(card.querySelector('p strong')?.textContent.trim().length > 0, true, 'the name, bold');
    assert.ok(card.querySelector('img[src^="https://cdn.skoda-storyboard.com/"]'), 'the portrait');
    assert.ok(card.querySelector('a[href^="mailto:"]'), 'the e-mail');
    assert.equal(card.querySelector('span, div, [style], [class]'), null, 'clean markup');
  });
  // phones stay plain text, as on the source
  assert.equal(doc.querySelectorAll('a[href^="tel:"]').length, 0);
  assert.match(cards[2].textContent, /t: \+420 730 863 027/);
  assert.deepEqual([...doc.querySelectorAll('h2')].map((h) => h.textContent.replace(/\s+/g, ' ').trim()), [
    'Škoda Corporate Communications', 'Škoda Product Communications',
  ]);
});

test('contacts: the rows under a group heading keep the source\'s pull-up', { skip }, () => {
  const doc = run(fixture('contacts'));
  const pulled = styles(doc).filter((s) => s.split(', ').includes('pull-up'));
  assert.equal(pulled.length, 2);
  assert.equal(doc.querySelectorAll('[data-skoda-page-body]').length, 0, 'no marks left');
});

test('board: Exec Bio rows [card, panel]: the toggle label, one image per photo, then the links', { skip }, () => {
  const doc = run(fixture('board-of-management'));
  const bios = blocks(doc, 'Exec Bio');
  assert.equal(bios.length, 4);
  const rows = bios.flatMap((t) => [...t.rows].slice(1));
  assert.equal(rows.length, 6);
  rows.forEach((tr) => {
    const [card, panel] = tr.cells;
    assert.equal(card.querySelectorAll('img').length, 1, 'one portrait');
    const paragraphs = [...panel.querySelectorAll(':scope > p')];
    assert.equal(paragraphs[0].textContent, 'show more');
    const photos = paragraphs.filter((p) => p.querySelector('img') && !p.textContent.trim());
    assert.ok(photos.length > 0, 'the photo set');
    // one image per photo: the gallery's linked thumbnails are not repeated
    assert.equal(panel.querySelectorAll('a img').length, 0);
    photos.forEach((p) => assert.doesNotMatch(p.querySelector('img').getAttribute('src'), /-\d+x\d+\.(jpe?g|png)$/, 'the full photo'));
    // every member links the press release; the CV and photo set only where the source has them
    assert.ok([...panel.querySelectorAll('a')].some((a) => /press release/.test(a.textContent)));
  });
  // the CV link keeps its bold (the source renders it at 600)
  assert.ok([...doc.querySelectorAll('strong a, a strong')].some((el) => /Download cv/.test(el.textContent)));
});

test('board: a spacer row is its own section, Spacer 24px + Spacer (line) 10px', { skip }, () => {
  const doc = run(fixture('board-of-management'));
  const spacers = blocks(doc, 'Spacer');
  const lines = blocks(doc, 'Spacer (line)');
  assert.ok(spacers.length >= 3);
  assert.equal(spacers.length, lines.length);
  spacers.forEach((t) => assert.equal(t.rows[1].cells[0].textContent, '24px'));
  lines.forEach((t) => assert.equal(t.rows[1].cells[0].textContent, '10px'));
  assert.ok(styles(doc).every((s) => s.startsWith('page-body')));
});

test('preprocess: a paragraph ending on a blank line keeps it (the nbsp placeholder); others are untouched', { skip }, () => {
  const { document } = new JSDOM(`<main><article class="page"><div class="so-panel widget_sow-editor">
    <p><strong>Name</strong><br> <strong>Role</strong><br> &nbsp;</p>
    <p>Glued&nbsp;text<br>more</p></div></article></main>`).window;
  people('preprocess', document.body, { document });
  const [blank, other] = document.querySelectorAll('p');
  // the placeholder, then a word joiner: the delivery pipeline trims a trailing nbsp alone
  assert.equal(blank.lastChild.nodeValue, '\u{F00A0}\u2060');
  assert.equal(other.textContent, 'Glued\u00a0textmore');
});
