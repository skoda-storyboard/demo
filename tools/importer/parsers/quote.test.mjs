/* global globalThis */
/*
 * Unit tests for the SKODA-220 pull-quote parser (contract quote v1: `Quote` [quote, attribution]).
 * Markup mirrors the source press releases and the first-glimpse press kit (2026-09-28).
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

const { default: parse, markQuotes } = await import('./quote.js');

const RULE = '<hr style="width: 10%; height: 2px; display: block; margin: 0 auto; border: none; background-color: #000000; margin-bottom: 10px;">';
const quote = (q, by) => `<p style="text-align: center;"><em>${q}</em></p>${RULE}${by === undefined ? ''
  : `<p style="text-align: center;"><strong>${by}</strong></p>`}`;
const txt = (n) => (n?.textContent || '').replace(/\s+/g, ' ').trim();

/** The real pipeline: mark in `preprocess`, helix preProcess drops every <hr>, then parse. */
function run(body) {
  const { document } = new JSDOM(`<div class="entry-content">${body}</div>`).window;
  const root = document.querySelector('.entry-content');
  const marked = markQuotes(root);
  root.querySelectorAll('hr').forEach((hr) => hr.remove());
  root.querySelectorAll('p[data-skoda-quote]').forEach((p) => parse(p, { document }));
  return { root, marked };
}
const quotes = (root) => [...root.querySelectorAll('table')]
  .filter((t) => txt(t.querySelector('tr > td')) === 'Quote');

test('Zellmer shape → one Quote row [quote, attribution], no rule, no italics wrapper', { skip }, () => {
  const { root, marked } = run(`<p>Before.</p>${quote(
    '“Klaus Zellmer has played an important role.”<br>\n',
    ' Klaus Zellmer, Chairman of the Board of Management of Škoda Auto',
  )}<p>After.</p>`);
  assert.equal(marked, 1);
  const [table] = quotes(root);
  const rows = [...table.querySelectorAll('tr')];
  assert.equal(rows.length, 2, 'header + one row');
  const [q, by] = rows[1].children;
  assert.equal(q.innerHTML, '<p>“Klaus Zellmer has played an important role.”</p>', 'trailing <br> trimmed');
  assert.equal(by.innerHTML, '<p><strong>Klaus Zellmer, Chairman of the Board of Management of Škoda Auto</strong></p>');
  assert.equal(root.querySelectorAll('hr, [data-skoda-quote], [data-skoda-quote-by], [style]').length, 0);
  assert.deepEqual([...root.children].map((n) => n.tagName), ['P', 'TABLE', 'P'], 'in place, in source order');
});

test('two consecutive quotes (National Theatre) → two tables, each with its own attribution', { skip }, () => {
  const { root } = run(quote('“One.”', 'Klaus Zellmer, CEO of Škoda Auto')
    + quote('“Two.”', 'Jan Burian, Director General of the National Theatre'));
  const tables = quotes(root);
  assert.equal(tables.length, 2);
  assert.deepEqual(tables.map((t) => txt(t.querySelectorAll('tr')[1].children[1])), [
    'Klaus Zellmer, CEO of Škoda Auto', 'Jan Burian, Director General of the National Theatre']);
});

test('a quote without an attribution keeps the empty second cell', { skip }, () => {
  const { root } = run(`${quote('“Alone.”')}<p>Body copy.</p>`);
  const row = quotes(root)[0].querySelectorAll('tr')[1];
  assert.equal(row.children.length, 2);
  assert.equal(row.children[1].innerHTML, '');
  assert.equal(txt(root.querySelector(':scope > p')), 'Body copy.', 'the next paragraph is not an attribution');
});

test('a centred italic line without the rule is not a quote; a lone rule is left alone', { skip }, () => {
  const html = '<p style="text-align: center;"><em>Photo: Škoda Auto</em></p><p>Body.</p><hr><p>More.</p>';
  const { document } = new JSDOM(`<div class="entry-content">${html}</div>`).window;
  const root = document.querySelector('.entry-content');
  assert.equal(markQuotes(root), 0);
  assert.equal(root.querySelectorAll('hr').length, 1, 'stray rules are for the layouts to drop');
  assert.equal(root.querySelectorAll('[data-skoda-quote]').length, 0);
});

test('mixed or left-aligned paragraphs before a rule are not quotes', { skip }, () => {
  const { marked } = run(`<p style="text-align: center;"><em>Half</em> plain</p>${RULE}`
    + `<p><em>Left</em></p>${RULE}<h3 style="text-align: center;"><em>Heading</em></h3>${RULE}`);
  assert.equal(marked, 0);
});

test('the parser also reads the raw source DOM (rule still present)', { skip }, () => {
  const { document } = new JSDOM(`<div>${quote('“Raw.”', 'Oliver Stefani, Head of Škoda Design')}</div>`).window;
  const root = document.querySelector('div');
  parse(root.querySelector('p'), { document });
  assert.equal(root.querySelectorAll('hr').length, 0);
  assert.equal(txt(quotes(root)[0].querySelectorAll('tr')[1].children[1]), 'Oliver Stefani, Head of Škoda Design');
});
