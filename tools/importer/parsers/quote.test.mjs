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

const { default: parse, markQuotes, parseFigure } = await import('./quote.js');

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

/* The press-kit chapters' WordPress figure quote → `Quote (left)` (Peaq / Epiq press kit 2,
   2026-10-01). */
const FIGURES = {
  zellmer: '<figure class="quote">\n<blockquote><p><em>The Peaq represents a&nbsp;new reference point.</em></p></blockquote>\n'
    + '<figcaption><em><strong>Klaus Zellmer</strong>, CEO of Škoda Auto<br />\n&nbsp;</em></figcaption></figure>',
  jahn: '<figure class="quote">\n<blockquote><p><em>The Peaq, with its long range.</em></p></blockquote>\n'
    + '<figcaption><em><strong>Martin Jahn</strong>, Škoda Auto Board Member for Sales and Marketing</em>&nbsp;</figcaption></figure>',
  neft: '<figure class="quote">\n<blockquote><p><em>“With the new Peaq.”</em></p></blockquote>\n'
    + '<figcaption><em></em><em><strong>Johannes Neft</strong>, Škoda Auto Chief Development Officer</em>&nbsp;</figcaption></figure>',
};
function runFigures(body) {
  const { document } = new JSDOM(`<div class="entry-content">${body}</div>`).window;
  const root = document.querySelector('.entry-content');
  root.querySelectorAll('figure').forEach((figure) => parseFigure(figure, { document }));
  return root;
}
const leftQuotes = (root) => [...root.querySelectorAll('table')]
  .filter((t) => txt(t.querySelector('tr > td')) === 'Quote (left)');
const rowsOf = (table) => [...table.querySelectorAll('tr')].slice(1);

test('a figure quote → Quote (left) [quote, attribution], without the italics or the edge <br>/&nbsp;', { skip }, () => {
  const root = runFigures(`<p>Before.</p>${FIGURES.zellmer}<p>After.</p>`);
  const [table] = leftQuotes(root);
  const [row] = rowsOf(table);
  const [q, by] = row.children;
  assert.equal(q.innerHTML, '<p>The Peaq represents a&nbsp;new reference point.</p>', 'inner no-break spaces stay');
  assert.equal(by.innerHTML, '<p><strong>Klaus Zellmer</strong>, CEO of Škoda Auto</p>');
  assert.deepEqual([...root.children].map((n) => n.tagName), ['P', 'TABLE', 'P'], 'in place, in source order');
  assert.equal(root.querySelectorAll('figure, blockquote, em').length, 0);
});

test('consecutive figure quotes share one block, one row each; a paragraph between starts a new one', { skip }, () => {
  const root = runFigures(`${FIGURES.zellmer}\n${FIGURES.jahn}\n${FIGURES.neft}<p>Body.</p>${FIGURES.zellmer}`);
  const tables = leftQuotes(root);
  assert.equal(tables.length, 2);
  assert.deepEqual(rowsOf(tables[0]).map((r) => txt(r.children[1])), [
    'Klaus Zellmer, CEO of Škoda Auto',
    'Martin Jahn, Škoda Auto Board Member for Sales and Marketing',
    'Johannes Neft, Škoda Auto Chief Development Officer']);
  assert.equal(rowsOf(tables[1]).length, 1);
  assert.ok(rowsOf(tables[0]).every((r) => r.children.length === 2));
  assert.equal(rowsOf(tables[0])[2].children[0].innerHTML, '<p>“With the new Peaq.”</p>', 'the source’s own marks are kept');
});

test('figure quote edge cases: no caption, plain-text caption, several paragraphs, a <cite>', { skip }, () => {
  const root = runFigures('<figure><blockquote><p>One.</p></blockquote></figure><p>x</p>'
    + '<figure><blockquote><p><em>Two.</em></p></blockquote><figcaption> Jane Doe, role </figcaption></figure><p>x</p>'
    + '<figure><blockquote><p><em>First.</em></p><p></p><p><em>Second.</em></p></blockquote></figure><p>x</p>'
    + '<figure class="wp-block-pullquote"><blockquote><p>Pulled.</p><cite>Cited Name</cite></blockquote></figure>');
  const [none, plain, multi, cited] = leftQuotes(root).map((t) => rowsOf(t)[0].children);
  assert.equal(none[1].innerHTML, '', 'no caption keeps the empty attribution cell');
  assert.equal(plain[1].innerHTML, '<p><strong>Jane Doe, role</strong></p>', 'a plain caption is bold, like the source names');
  assert.equal(multi[0].innerHTML, '<p>First.</p><p>Second.</p>', 'empty paragraphs are dropped');
  assert.equal(cited[0].innerHTML, '<p>Pulled.</p>');
  assert.equal(cited[1].innerHTML, '<p><strong>Cited Name</strong></p>', 'the cite is the attribution, not quote text');
});

const BLOCK_IN_P = 'p p, p ul, p ol, p div, p table, p pre, p blockquote, p figure, p dl';

test('malformed figure quotes keep every word and stay valid markup', { skip }, () => {
  const root = runFigures('<figure><blockquote>Loose <em>text</em><p>Para.</p><ul><li><em>Item</em></li></ul>tail'
    + '<pre>Code</pre><blockquote><p>Inner</p></blockquote></blockquote>'
    + '<blockquote><p>Second quote</p></blockquote><p>Sibling para</p>loose'
    + '<figcaption></figcaption></figure>');
  const [q, by] = rowsOf(leftQuotes(root)[0])[0].children;
  assert.equal(q.innerHTML, '<p>Loose text</p><p>Para.</p><ul><li>Item</li></ul><p>tail</p><pre>Code</pre>'
    + '<blockquote><p>Inner</p></blockquote><p>Second quote</p><p>Sibling para</p><p>loose</p>');
  assert.equal(by.innerHTML, '', 'an empty figcaption is no attribution');
  assert.equal(q.querySelectorAll(BLOCK_IN_P).length, 0);
});

test('a caption with blocks or a stray </p> (the Peaq Neft source) stays flat and trimmed', { skip }, () => {
  const { document } = new JSDOM('<div class="entry-content"></div>').window;
  const root = document.querySelector('.entry-content');
  // the HTML parser turns the source's stray </p> into an empty <p> inside the figcaption
  const neftSource = FIGURES.neft.replace('&nbsp;</figcaption>', '&nbsp;</p>\n</figcaption>');
  root.innerHTML = `${neftSource}<p>x</p><figure><blockquote><p>Q</p></blockquote>`
    + '<figcaption><p><strong>Name</strong></p><p>Role</p></figcaption></figure>';
  root.querySelectorAll('figure').forEach((figure) => parseFigure(figure, { document }));
  const [neft, blocks] = leftQuotes(root).map((t) => rowsOf(t)[0].children[1]);
  assert.equal(neft.innerHTML, '<p><strong>Johannes Neft</strong>, Škoda Auto Chief Development Officer</p>');
  assert.equal(blocks.innerHTML, '<p><strong>Name</strong></p><p>Role</p>');
  assert.equal(root.querySelectorAll(BLOCK_IN_P).length, 0);
});

test('only edge spaces are trimmed: a mid-sentence <strong> keeps its spaces', { skip }, () => {
  const root = runFigures('<figure><blockquote><p><em>The car is<strong> fast </strong>and good </em></p></blockquote>'
    + '<figcaption><em>Role:<strong> Name</strong>&nbsp;</em></figcaption></figure>');
  const [q, by] = rowsOf(leftQuotes(root)[0])[0].children;
  assert.equal(q.innerHTML, '<p>The car is<strong> fast </strong>and good</p>');
  assert.equal(by.innerHTML, '<p>Role:<strong> Name</strong></p>');
});

test('a <cite> beside a figcaption stays quote text; loose text between figures stops the merge', { skip }, () => {
  const root = runFigures('<figure><blockquote><p>Q</p><cite>Source text</cite></blockquote><figcaption>Name</figcaption></figure>'
    + 'Loose words between<figure><blockquote><p>B</p></blockquote></figure>');
  const tables = leftQuotes(root);
  assert.equal(tables.length, 2, 'not merged across text');
  const [q, by] = rowsOf(tables[0])[0].children;
  assert.equal(q.innerHTML, '<p>Q</p><p>Source text</p>');
  assert.equal(by.innerHTML, '<p><strong>Name</strong></p>');
  assert.deepEqual([...root.childNodes].map((n) => n.nodeName), ['TABLE', '#text', 'TABLE'], 'source order kept');
});

test('figures that are not quotes are left as authored', { skip }, () => {
  const html = '<figure><img src="a.jpg" alt="A"><figcaption>Photo</figcaption></figure>'
    + '<figure><blockquote> &nbsp; </blockquote><figcaption>Name</figcaption></figure>'
    + '<figure><blockquote><p>Quote</p></blockquote><img src="b.jpg" alt="B"></figure>'
    + '<figure><blockquote><cite>Only a cite</cite></blockquote></figure>'
    + '<figure><div><blockquote><p>Nested deeper</p></blockquote></div></figure>'
    + '<figure><blockquote><p>Chart</p></blockquote><svg><title>c</title></svg></figure>';
  const root = runFigures(html);
  assert.equal(leftQuotes(root).length, 0);
  assert.equal(root.querySelectorAll('figure').length, 6);
  assert.equal(root.querySelectorAll('svg').length, 1);
  assert.equal(root.querySelectorAll('img').length, 2, 'media is never dropped');
});
