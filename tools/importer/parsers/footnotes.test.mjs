/* global globalThis */
/*
 * Unit tests for the SKODA-805d small-print parser (contract footnotes v1: `Footnotes`, one row
 * per paragraph). Markup mirrors the live press kits scanned on 2026-10-05.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

let JSDOM = null;
try {
  const req = createRequire(import.meta.url);
  // eslint-disable-next-line import/no-unresolved
  ({ JSDOM } = req('jsdom'));
} catch { /* jsdom unavailable — DOM tests skip */ }
const skip = JSDOM ? false : 'jsdom not installed — DOM tests skip';

globalThis.WebImporter = {
  DOMUtils: {
    createTable(cells, document) {
      const table = document.createElement('table');
      cells.forEach((row) => {
        const tr = document.createElement('tr');
        row.forEach((col) => {
          const td = document.createElement('td');
          (Array.isArray(col) ? col : [col]).forEach((v) => { if (v != null && v !== '') td.append(v); });
          tr.append(td);
        });
        table.append(tr);
      });
      return table;
    },
  },
};

const { default: parse, isFootnote, markFootnotes } = await import('./footnotes.js');

const txt = (n) => (n?.textContent || '').replace(/\s+/g, ' ').trim();
const doc = (html) => new JSDOM(`<div class="entry-content">${html}</div>`).window.document;
/**
 * The pipeline: mark in `preprocess`, then parse. helix-importer keeps styled spans today
 * (`removeSpans` skips them), which is `unwrap: false`; `unwrap: true` checks the rule would
 * survive an importer that strips them.
 */
function run(html, { unwrap = false } = {}) {
  const document = doc(html);
  const root = document.querySelector('.entry-content');
  const marked = markFootnotes(root);
  if (unwrap) root.querySelectorAll('span:not([class])').forEach((s) => s.replaceWith(...s.childNodes));
  root.querySelectorAll('p[data-skoda-footnote]').forEach((p) => parse(p, { document }));
  return { root, marked };
}
const tables = (root) => [...root.querySelectorAll('table')]
  .filter((t) => txt(t.querySelector('tr > td')) === 'Footnotes');

// first-glimpse, live 2026-10-05
const FIRST_GLIMPSE = '<p><span style="font-size: 10pt;">¹ The availability of MOON&nbsp;POWER services on selected markets can be found <a href="https://www.moon-power.com/business/products/charging-stations/bidirectional-charging/skoda">HERE</a></span><br>\n'
  + '<span style="font-size: 10pt;">² All 85, 85x, or RS&nbsp;electric models made by Škoda&nbsp;Auto are eligible.</span></p>';

test('first-glimpse: the two 10pt lines become one Footnotes row, link and line break kept', { skip }, () => {
  const { root, marked } = run(`<p>Body copy.</p>${FIRST_GLIMPSE}<p>After.</p>`);
  assert.equal(marked, 1);
  const [table] = tables(root);
  const rows = [...table.querySelectorAll('tr')];
  assert.equal(rows.length, 2, 'header + one row');
  const cell = rows[1].children[0];
  assert.equal(cell.querySelectorAll('p').length, 1);
  assert.equal(cell.querySelector('a').getAttribute('href'), 'https://www.moon-power.com/business/products/charging-stations/bidirectional-charging/skoda');
  assert.equal(cell.querySelectorAll('br').length, 1, 'the line break between ¹ and ² stays');
  assert.match(txt(cell), /^¹ The availability of MOON POWER services .* HERE ² All 85, 85x, or RS electric models made by Škoda Auto are eligible\.$/);
  assert.equal(root.querySelectorAll('span, [style], [data-skoda-footnote]').length, 0, 'no span, size or marker reaches DA');
  assert.deepEqual([...root.children].map((n) => n.tagName), ['P', 'TABLE', 'P'], 'in place, in source order');
});

test('the marks survive an importer that unwraps the spans before transform', { skip }, () => {
  const { root } = run(FIRST_GLIMPSE, { unwrap: true });
  const cell = tables(root)[0].querySelectorAll('tr')[1].children[0];
  assert.equal(cell.querySelectorAll('span, [style]').length, 0);
  assert.match(txt(cell), /^¹ The availability/);
});

test('what counts as small print: whole lines in spans below 16px, px or pt, sup markers neutral', { skip }, () => {
  const document = doc('');
  const p = (html) => Object.assign(document.createElement('p'), { innerHTML: html });
  assert.equal(isFootnote(p('<span style="font-size: 10pt">One line.</span>')), true);
  assert.equal(isFootnote(p('<span style="font-size:12px">A</span> <span style="font-size: 9pt">B</span>')), true, 'several spans, px and pt');
  assert.equal(isFootnote(p('<sup>7</sup><span style="font-size: 10pt"> The maximum power is determined…</span>')), true, 'Epiq First Edition marker');
  assert.equal(isFootnote(p('<span style="font-size: 10pt"><a href="/x">Link</a> and <strong>bold</strong></span>')), true, 'nested inline content');
  assert.equal(isFootnote(p('<span style="color: red"><span style="font-size: 10pt">Deep</span></span>')), true, 'inside an unsized span');
});

test('what does not: mid-sentence fragments, whole-paragraph 12px, body-size or larger spans, no text', { skip }, () => {
  const document = doc('');
  const p = (html, style) => {
    const el = document.createElement('p');
    if (style) el.setAttribute('style', style);
    el.innerHTML = html;
    return el;
  };
  assert.equal(isFootnote(p('Škoda returned at the 1<span style="font-size: 10pt">st</span> rally of the year.')), false, 'Motorsport ordinal');
  assert.equal(isFootnote(p('The Škoda Epiq 85<span style="font-size: 10pt">x</span> is the first…')), false, 'Epiq preview fragment');
  assert.equal(isFootnote(p('⁶ Maximum charging power.', 'font-size: 12px;')), false, 'the 12/18 paragraph style is not handled yet');
  assert.equal(isFootnote(p('<span style="font-size: 12px">⁶ Inside a sized paragraph.</span>', 'font-size: 12px;')), false);
  assert.equal(isFootnote(p('<span style="font-size: 16px">Explore the channel</span>')), false, 'the WhatsApp row is body size');
  assert.equal(isFootnote(p('<span style="font-size: 18pt">Škoda Peaq | Footage</span>')), false, 'video titles are larger');
  assert.equal(isFootnote(p('<span style="font-size: 10pt"> &nbsp; </span>')), false, 'no words');
  assert.equal(isFootnote(p('<sup>1</sup>')), false, 'a marker alone');
  assert.equal(isFootnote(p('<span style="font-size: small">Keyword size</span>')), false, 'only px/pt sizes are read');
  assert.equal(isFootnote(p('<span style="font-size: 10pt">Small</span> and normal')), false, 'mixed');
  assert.equal(isFootnote(document.createElement('div')), false);
  assert.equal(isFootnote(null), false);
});

test('the nearest size wins, sizes are read as CSS reads them, and media is never small print', { skip }, () => {
  const document = doc('');
  const p = (html) => Object.assign(document.createElement('p'), { innerHTML: html });
  assert.equal(isFootnote(p('<span style="font-size: 10pt"><span style="font-size: 18pt">Škoda Peaq | Footage</span></span>')), false, 'a large title inside a small span');
  assert.equal(isFootnote(p('<span style="font-size: 18pt"><span style="font-size: 10pt">¹ Small inside large</span></span>')), true);
  assert.equal(isFootnote(p('<span style="font-size: 10pt">¹ Note <span style="font-size: 16px">body size</span></span>')), false, 'one body-size word');
  assert.equal(isFootnote(p('<span style="font-size: 10PT !important">¹ Upper case, important</span>')), true);
  assert.equal(isFootnote(p('<span style="font-size: 10.5pt">¹ Decimal</span>')), true);
  assert.equal(isFootnote(p('<span style="--font-size: 10pt">Custom property</span>')), false, 'not the font-size property');
  assert.equal(isFootnote(p('<span style="mso-font-size: 10pt">Word paste</span>')), false);
  assert.equal(isFootnote(p('<span style="font-size: 10pt; font-size: 18pt">Last declaration wins</span>')), false);
  // PR #251 review: the CSSOM's winning declaration, as Chrome applies it
  assert.equal(isFootnote(p('<span style="font-size:10pt !important; font-size:18pt">¹ Important wins</span>')), true, '!important beats a later declaration');
  assert.equal(isFootnote(p('<span style="font-size:10pt; font-size:invalid">¹ Invalid ignored</span>')), true, 'an invalid later value is ignored');
  assert.equal(isFootnote(p('<span style="font-size:18pt; font-size:10pt nonsense">Ordinary large text</span>')), false, 'a malformed value is not small print');
  assert.equal(isFootnote(p('<span style="font-size: calc(10pt + 1px)">Computed</span>')), false, 'only plain px/pt lengths count');
  assert.equal(isFootnote(p('<span style="font-size: 0px">Hidden</span>')), false, 'hidden text is not small print');
  assert.equal(isFootnote(p('<span style="font-size: 0.8em">Relative</span>')), false, 'only px/pt lengths count');
  assert.equal(isFootnote(p('<img src="a.jpg" alt="A"><span style="font-size: 10pt">Photo: Škoda</span>')), false, 'an image caption line');
  assert.equal(isFootnote(p('<iframe src="https://player.vimeo.com/video/1"></iframe><span style="font-size: 10pt">Clip</span>')), false);
});

test('only a top-level paragraph becomes a block: not inside a list, quote or figure', { skip }, () => {
  const line = '<p><span style="font-size: 10pt">¹ In a container.</span></p>';
  const { root } = run(`<ul><li>${line}</li></ul><blockquote>${line}</blockquote><figure>${line}</figure>`);
  assert.equal(tables(root).length, 0);
  assert.equal(root.querySelectorAll('[data-skoda-footnote]').length, 0, 'every mark is removed');
  assert.equal(root.querySelectorAll('p').length, 3, 'the text stays where it was');
});

test('consecutive footnote paragraphs share one table; text or a paragraph between starts another', { skip }, () => {
  const line = (t) => `<p><span style="font-size: 10pt">${t}</span></p>`;
  const { root } = run(`${line('⁷ One.')}\n${line('⁸ Two.')}<p>Body.</p>${line('⁹ Three.')}loose${line('¹⁰ Four.')}`);
  const found = tables(root);
  assert.equal(found.length, 3);
  assert.deepEqual(found.map((t) => [...t.querySelectorAll('tr')].slice(1).map(txt)), [['⁷ One.', '⁸ Two.'], ['⁹ Three.'], ['¹⁰ Four.']]);
});

test('a footnote after a Footnotes table whose cell holds a table adds an outer row', { skip }, () => {
  const document = doc('');
  const root = document.querySelector('.entry-content');
  const prev = globalThis.WebImporter.DOMUtils.createTable([['Footnotes'], [document.createElement('p')]], document);
  prev.rows[1].cells[0].innerHTML = '<p>¹ First.</p><table><tr><td>Inner</td></tr></table>';
  const p = Object.assign(document.createElement('p'), { innerHTML: '<span style="font-size: 10pt">² Second.</span>' });
  root.append(prev, p);
  markFootnotes(root);
  parse(p, { document });
  assert.equal(prev.rows.length, 3, 'header + two outer rows');
  assert.equal(txt(prev.rows[2]), '² Second.');
  assert.equal(txt(prev.querySelector('table table')), 'Inner', 'the nested table is untouched');
});

test('a marked paragraph inside a table (accordion answer, Columns cell) stays ordinary text', { skip }, () => {
  const document = doc(`<table><tr><td>Accordion</td></tr><tr><td>Q</td><td>${FIRST_GLIMPSE}</td></tr></table>`);
  const root = document.querySelector('.entry-content');
  assert.equal(markFootnotes(root), 1);
  root.querySelectorAll('p[data-skoda-footnote]').forEach((p) => parse(p, { document }));
  assert.equal(tables(root).length, 0, 'blocks cannot nest');
  assert.equal(root.querySelectorAll('[data-skoda-footnote]').length, 0, 'the marker never reaches DA');
  assert.match(txt(root), /MOON POWER/);
});

test('edge line breaks and spaces are trimmed; inner styles dropped; empty paragraphs skipped', { skip }, () => {
  const { root } = run('<p><br><span style="font-size: 10pt"> <em style="color:#000">³</em> Liquid volume.&nbsp;</span><br></p>'
    + '<p><span style="font-size: 10pt"></span></p>');
  const [table] = tables(root);
  const cell = table.querySelectorAll('tr')[1].children[0];
  assert.equal(cell.innerHTML, '<p><em>³</em> Liquid volume.</p>');
});
