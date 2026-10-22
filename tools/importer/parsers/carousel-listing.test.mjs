/* global globalThis */
/*
 * Unit tests for parsers/carousel-listing.js (SKODA-845): a Newsletter plant carousel as a
 * section break, its h3 and an index-driven Story Rail filtered by what every teaser shares.
 * Run: node --test tools/importer/parsers/carousel-listing.test.mjs
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

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

function table(rows, doc, name) {
  const t = doc.createElement('table');
  if (name) t.dataset.block = name;
  rows.forEach((cells) => {
    const tr = t.insertRow();
    cells.forEach((c) => { tr.insertCell().append(c); });
  });
  return t;
}

globalThis.WebImporter = {
  DOMUtils: { createTable: (rows, doc) => table(rows, doc) },
  Blocks: {
    createBlock: (doc, { name, cells }) => table([[name], ...Object.entries(cells)], doc, name),
  },
};
const parse = JSDOM ? (await import('./carousel-listing.js')).default : null;

// the live /en/newsletter/ markup, trimmed: the heading, the Flickity row, the teasers' classes
const teaser = (id, classes, title) => `<div class="search-results-item"><article class="article-teaser post-${id} press_release type-press_release hentry ${classes}">
  <div class="article-teaser-overlay"><div class="entry-meta"><span class="entry-published">25. 9. 2026</span></div>
  <h3 class="entry-title"><a href="https://www.skoda-storyboard.com/en/press-releases/${title}/">${title}</a></h3></div></article></div>`;
const container = (heading, teasers) => `<div class="search-results type-press_release"><div class="search-results-container">
  <header class="search-results-header"><h3 class="search-results-heading">${heading} </h3></header>
  <div class="search-results-items">${teasers.join('')}</div></div></div>`;

function run(html) {
  const { document } = new JSDOM(`<main>${html}</main>`).window;
  [...document.querySelectorAll('.search-results .search-results-container')].forEach((el) => parse(el, { document }));
  return document.querySelector('main');
}

const rowsOf = (t) => [...t.rows].map((r) => [...r.cells].map((c) => c.textContent));

test('a plant carousel: a section break, its h3, the rail by categories + company, the section style', { skip }, () => {
  const main = run(container('Kvasiny', [
    teaser(455554, 'category-newsletter company-kvasiny years-61572', 'kvasiny-3-2026'),
    teaser(445274, 'category-newsletter company-kvasiny years-61572', 'kvasiny-2-2026'),
  ]));
  const out = [...main.querySelector('.search-results').children];
  assert.deepEqual(out.map((n) => n.tagName), ['HR', 'H3', 'TABLE', 'TABLE']);
  assert.equal(out[1].textContent, 'Kvasiny');
  assert.deepEqual(rowsOf(out[2]), [
    ['Story Rail'], ['template', 'press_release'], ['categories', 'newsletter'], ['company', 'kvasiny'],
  ]);
  assert.deepEqual(rowsOf(out[3]), [['Section Metadata'], ['style', 'carousel-listing']]);
  // the source cards are not reproduced (the rail reads the index)
  assert.equal(main.querySelector('article'), null);
});

test('only terms every teaser shares; term ids skipped; two plants, two rails', { skip }, () => {
  const main = run([
    container('Kvasiny', [
      teaser(1, 'category-newsletter company-kvasiny company-production years-61572', 'a'),
      teaser(2, 'category-newsletter company-kvasiny company-61999 years-61572', 'b'),
    ]),
    container('Vrchlabí', [teaser(3, 'category-newsletter company-vrchlabi', 'c')]),
  ].join(''));
  const rails = [...main.querySelectorAll('table')].filter((t) => t.rows[0].textContent === 'Story Rail');
  assert.equal(rails.length, 2);
  assert.deepEqual(rowsOf(rails[0]).slice(2), [['categories', 'newsletter'], ['company', 'kvasiny']]);
  assert.deepEqual(rowsOf(rails[1]).slice(2), [['categories', 'newsletter'], ['company', 'vrchlabi']]);
  assert.deepEqual([...main.querySelectorAll('h3')].map((h) => h.textContent), ['Kvasiny', 'Vrchlabí']);
  assert.ok(!main.innerHTML.includes('years'), 'a term-id class is not a filter');
});

test('no shared term, no teasers or no heading: the carousel is dropped, not a rail of every release', { skip }, () => {
  const main = run([
    container('Mixed', [teaser(1, 'company-kvasiny', 'a'), teaser(2, 'company-vrchlabi', 'b')]),
    container('Empty', []),
    container('', [teaser(3, 'category-newsletter company-kvasiny', 'c')]),
  ].join(''));
  assert.equal(main.querySelectorAll('table').length, 0);
  assert.equal(main.querySelectorAll('h3').length, 0);
});

test('two shared terms of one key, or a term id only: dropped, never an OR of plants (code review)', { skip }, () => {
  const main = run([
    // `company: kvasiny, production` would list every production release
    container('Two', [
      teaser(1, 'category-newsletter company-kvasiny company-production', 'a'),
      teaser(2, 'category-newsletter company-kvasiny company-production', 'b'),
    ]),
    // every teaser has a company, but only as a term id: `categories` alone would mix the plants
    container('Ids', [teaser(3, 'category-newsletter company-61572', 'c')]),
    // `categories: newsletter, press-releases` would list every release
    container('Cats', [teaser(4, 'category-newsletter category-press-releases company-kvasiny', 'd')]),
  ].join(''));
  assert.equal(main.querySelectorAll('table').length, 0);
});

test('a slug with an underscore is kept; the heading is the header\'s, never a card title', { skip }, () => {
  const { document } = new JSDOM(`<main><div class="search-results"><div class="search-results-container">
    <div class="search-results-items">${teaser(1, 'category-newsletter company-mlada_boleslav', 'a')}</div></div></div></main>`).window;
  parse(document.querySelector('.search-results-container'), { document });
  // no header: the card's h3.entry-title is not taken as the plant heading
  assert.equal(document.querySelectorAll('table').length, 0);
  const main = run(container('Mladá Boleslav', [teaser(2, 'category-newsletter company-mlada_boleslav', 'b')]));
  assert.deepEqual(rowsOf(main.querySelector('table')).slice(2), [['categories', 'newsletter'], ['company', 'mlada_boleslav']]);
});
