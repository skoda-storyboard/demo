/* global globalThis */
/*
 * The generic page's content transformers (SKODA-843): skoda-page-tables (body tables → Table
 * blocks), skoda-page-offset (spacer widgets, blank editor lines, &nbsp; indents) and
 * skoda-page-buttons (the source's pill → a secondary button), on trimmed source markup,
 * malformed input included. Run: node --test tools/importer/transformers/skoda-page-blocks.test.mjs
 */
/* eslint-disable import/no-extraneous-dependencies */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import tables from './skoda-page-tables.js';
import offset from './skoda-page-offset.js';
import buttons from './skoda-page-buttons.js';

// WebImporter.DOMUtils.createTable: a <table>, the first row the block name
globalThis.WebImporter = {
  DOMUtils: {
    createTable: (rows, doc) => {
      const t = doc.createElement('table');
      rows.forEach((cells) => {
        const tr = t.insertRow();
        cells.forEach((c) => {
          const td = tr.insertCell();
          [c].flat().forEach((n) => td.append(typeof n === 'string' ? doc.createTextNode(n) : n));
        });
      });
      return t;
    },
  },
};

const page = (body) => new JSDOM(`<body><main><article class="page"><div class="entry-content">${body}</div></article></main></body>`).window.document;
const run = (doc, transformers, hooks = ['preprocess', 'beforeTransform']) => hooks.forEach((hook) => {
  transformers.forEach((t) => t(hook, doc.body, { document: doc }));
});
const cellTexts = (r) => [...r.cells].map((c) => c.textContent.trim());
const blocks = (doc) => [...doc.querySelectorAll('table')].filter((t) => !t.parentElement.closest('table'))
  .map((t) => ({
    name: t.rows[0].cells[0].textContent,
    rows: [...t.rows].slice(1).map(cellTexts),
  }));
const NBSP_PLACEHOLDER = '\u{F00A0}';

// ---- skoda-page-tables ----------------------------------------------------------------------

test('tables: a label / value table becomes a Table block, its cells kept', () => {
  const doc = page('<table><tr><td><strong>Purpose:</strong></td><td>Press <a href="/x">releases</a></td></tr><tr><td>Period:</td><td>5 years</td></tr></table>');
  run(doc, [tables], ['beforeTransform']);
  assert.deepEqual(blocks(doc), [{ name: 'Table', rows: [['Purpose:', 'Press releases'], ['Period:', '5 years']] }]);
  assert.ok(doc.querySelector('td strong') && doc.querySelector('td a[href="/x"]'), 'inline markup kept');
});

test('tables: an all-th first row is Table (header); empty layout tables go; colspan keeps the columns', () => {
  const doc = page(`<table><tr><th>Cookie</th><th>Purpose</th><th>Expiry</th></tr>
    <tr><td colspan="2">_ga (analytics)</td><td>2 years</td></tr><tr><td>x</td></tr></table>
    <table><tr><td> </td><td>&nbsp;</td></tr></table>`);
  run(doc, [tables], ['beforeTransform']);
  assert.deepEqual(blocks(doc), [{
    name: 'Table (header)',
    rows: [['Cookie', 'Purpose', 'Expiry'], ['_ga (analytics)', '', '2 years'], ['x', '', '']],
  }], 'the spanning cell takes two columns; a short row is padded');
});

// ---- skoda-page-offset ----------------------------------------------------------------------

test('offset: a spacer widget becomes Spacer (24px per em, or px); one without padding goes', () => {
  const widget = (style) => `<div class="so-panel widget widget_skoda-offset"><div><div style="${style}"></div></div></div>`;
  const doc = page(`<p>a</p>${widget('padding-top:1em;')}${widget('padding-top: 30px')}${widget('')}<p>b</p>`);
  run(doc, [offset]);
  assert.deepEqual(blocks(doc), [{ name: 'Spacer', rows: [['24px']] }, { name: 'Spacer', rows: [['30px']] }]);
  assert.equal(doc.querySelectorAll('.widget_skoda-offset').length, 0);
});

test('offset: a blank editor line is Spacer (line) 44px; a trailing <br>&nbsp; a 24px line after its text', () => {
  const doc = page('<p>first</p><p>&nbsp;</p><p>rights<br>\n&nbsp;</p><p></p><p>last</p>');
  run(doc, [offset]);
  const kinds = [...doc.querySelector('.entry-content').children].map((el) => (el.tagName === 'TABLE'
    ? `${el.rows[0].cells[0].textContent} ${el.rows[1].cells[0].textContent}` : `${el.tagName}:${el.textContent}`));
  assert.deepEqual(
    kinds,
    ['P:first', 'Spacer (line) 44px', 'P:rights', 'Spacer (line) 24px', 'P:', 'P:last'],
    'an empty <p> (no &nbsp;) is only a margin: left alone',
  );
  assert.equal(doc.body.textContent.includes('blank line'), false, 'no placeholder text left');
});

test('offset: a blank line inside a table cell stays in the cell, never a Spacer inside the Table block', () => {
  const doc = page('<table><tr><td><p>&nbsp;</p><p>value</p></td><td>x</td></tr></table>');
  run(doc, [tables, offset]);
  const [table] = blocks(doc);
  assert.equal(table.name, 'Table');
  assert.equal(doc.querySelectorAll('table table').length, 0, 'no block nested in the Table block');
  assert.equal(doc.body.textContent.includes('blank line'), false);
});

test('offset: &nbsp; indent runs are kept (placeholder) in paragraphs, headings and list items; blank lines are not', () => {
  const doc = page('<p>28.&nbsp;&nbsp;&nbsp; The Promoter</p><h3>3.&nbsp;&nbsp; Prize&nbsp;</h3><ul><li>i.&nbsp;&nbsp; one</li></ul><p>&nbsp;</p>');
  run(doc, [offset], ['preprocess']);
  const [p, h3, li] = [doc.querySelector('p'), doc.querySelector('h3'), doc.querySelector('li')];
  assert.equal(p.textContent, `28.${NBSP_PLACEHOLDER.repeat(3)} The Promoter`);
  assert.equal(h3.textContent, `3.${NBSP_PLACEHOLDER.repeat(2)} Prize${NBSP_PLACEHOLDER}`);
  assert.equal(li.textContent, `i.${NBSP_PLACEHOLDER.repeat(2)} one`);
  assert.equal(doc.querySelectorAll('p')[1].textContent, 'blank line', 'the blank paragraph is marked, not indented');
});

// ---- skoda-page-buttons ---------------------------------------------------------------------

test('buttons: a pill alone in its <center> or <p> becomes a paragraph with the link in emphasis', () => {
  const doc = page('<p>Text</p><center><a class="ajax-loader-button" href="/en/"> Back to homepage </a></center><p><a class="ajax-loader-button" href="/b">B</a></p>');
  run(doc, [buttons], ['beforeTransform']);
  const out = [...doc.querySelector('.entry-content').children].map((el) => el.outerHTML);
  assert.deepEqual(out, ['<p>Text</p>', '<p><em><a href="/en/">Back to homepage</a></em></p>', '<p><em><a href="/b">B</a></em></p>']);
});

test('buttons: a pill inside a sentence stays inline (no paragraph in a paragraph); an empty one is left', () => {
  const doc = page('<p>Read the <a class="ajax-loader-button" href="/t">terms</a> first.</p><p><a class="ajax-loader-button" href="/e"> </a></p>');
  run(doc, [buttons], ['beforeTransform']);
  const [first, second] = doc.querySelectorAll('.entry-content > p');
  assert.equal(first.innerHTML, 'Read the <em><a href="/t">terms</a></em> first.');
  assert.equal(first.querySelector('p'), null);
  assert.ok(second.querySelector('a.ajax-loader-button'), 'nothing to show: unchanged');
});
