/* global globalThis */
/*
 * Table block (SKODA-843): block rows → a real <table>; `Table (header)` makes the first row the
 * head. Authors omit cells and add empty rows.
 * Run: node --test blocks/table/table.test.mjs
 */
/* eslint-disable import/no-extraneous-dependencies */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const { window } = new JSDOM('<main></main>');
globalThis.document = window.document;
const { default: decorate } = await import('./table.js');

const block = (html, variant = '') => {
  const el = document.createElement('div');
  el.className = `table ${variant}`.trim();
  el.innerHTML = html;
  decorate(el);
  return el;
};
const row = (...cells) => `<div>${cells.map((c) => `<div>${c}</div>`).join('')}</div>`;
const grid = (el) => [...el.querySelectorAll('tr')].map((tr) => [...tr.children].map((c) => `${c.tagName}:${c.textContent}`));

test('each block row is a table row, each cell a cell, their content kept', () => {
  const el = block(row('<strong>Purpose:</strong>', 'Sending <a href="/x">press releases</a>') + row('Period:', '5 years'));
  const table = el.querySelector(':scope > table');
  assert.ok(table, 'the block holds one table');
  assert.equal(table.querySelector('thead'), null);
  assert.deepEqual(grid(el), [['TD:Purpose:', 'TD:Sending press releases'], ['TD:Period:', 'TD:5 years']]);
  assert.ok(el.querySelector('td strong') && el.querySelector('td a[href="/x"]'), 'inline markup kept');
});

test('`header`: the first row is the head, its cells column headers', () => {
  const el = block(row('Cookie', 'Purpose') + row('_ga', 'Analytics'), 'header');
  const heads = [...el.querySelectorAll('thead th')];
  assert.deepEqual(heads.map((th) => [th.textContent, th.getAttribute('scope')]), [['Cookie', 'col'], ['Purpose', 'col']]);
  assert.deepEqual(grid(el.querySelector('tbody')), [['TD:_ga', 'TD:Analytics']]);
  assert.equal(el.querySelector('table').firstElementChild.tagName, 'THEAD', 'the head comes first');
});

test('a header table with only one row has no head (nothing to head)', () => {
  const el = block(row('Only', 'row'), 'header');
  assert.equal(el.querySelector('thead'), null);
  assert.deepEqual(grid(el), [['TD:Only', 'TD:row']]);
});

test('uneven rows keep the cells they have; empty rows are skipped; an empty block is emptied', () => {
  const el = block(`${row('a', 'b', 'c')}<div></div>${row('d')}`);
  assert.deepEqual(grid(el), [['TD:a', 'TD:b', 'TD:c'], ['TD:d']]);
  const empty = block('<div></div>');
  assert.equal(empty.children.length, 0);
});
