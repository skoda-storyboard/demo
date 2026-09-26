/* global globalThis */
/*
 * Unit tests for the category / tag archive parsers (archive-hero, archive-list).
 * Run: node --test tools/importer/parsers/archive.test.mjs
 * jsdom is resolved like skoda-story-importer.test.mjs; tests skip cleanly if unavailable.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

let JSDOM = null;
try {
  // eslint-disable-next-line import/no-unresolved
  ({ JSDOM } = createRequire(import.meta.url)('jsdom'));
} catch { /* jsdom unavailable — skip */ }
const skip = JSDOM ? false : 'jsdom not installed — DOM tests skip';

function createTable(rows, doc) {
  const table = doc.createElement('table');
  rows.forEach((cells) => {
    const tr = doc.createElement('tr');
    cells.forEach((c) => {
      const td = doc.createElement('td');
      td.append(typeof c === 'string' ? doc.createTextNode(c) : c);
      tr.append(td);
    });
    table.append(tr);
  });
  return table;
}
globalThis.WebImporter = { DOMUtils: { createTable } };

const { default: archiveHero } = await import('./archive-hero.js');
const { default: archiveList } = await import('./archive-list.js');

function page(canonical, body, title = 'Peaq - Škoda Storyboard') {
  const d = new JSDOM(`<html><head><title>${title}</title>${canonical ? `<link rel="canonical" href="${canonical}">` : ''}</head><body>${body}</body></html>`);
  return d.window.document;
}
const rows = (table) => [...table.querySelectorAll('tr')].map((tr) => [...tr.children].map((td) => td.textContent.trim()));

const GRID = `<div class="container"><div class="search-results">
  <div class="search-results-items"><div class="search-results-item"><article class="article-teaser">Card</article></div></div>
  <div class="search-results-pagination"><span class="current">4</span> <span class="total">19</span></div>
  <div class="ajax-loader-button-wrapper"><button class="ajax-loader-button">Load more</button></div>
</div></div>`;

test('tag archive → Stories scoped by the term slug; source pager removed', { skip }, () => {
  const doc = page('https://www.skoda-storyboard.com/en/tag/model/peaq/', GRID);
  archiveList(doc.querySelector('.search-results-items'), { document: doc });
  const table = doc.querySelector('table');
  assert.deepEqual(rows(table), [
    ['Stories'], ['index', '/en/query-index.json'], ['template', 'story'], ['tag', 'peaq'],
    ['columns', '3'], ['initial', '6'], ['perpage', '6'], ['excludefeatured', 'false'],
  ]);
  assert.ok(!doc.querySelector('.search-results-pagination, .ajax-loader-button-wrapper'));
  assert.doesNotMatch(doc.body.textContent, /Load more|Card/);
});

test('category and sub-category archives → Stories scoped by the story path prefix', { skip }, () => {
  [['https://www.skoda-storyboard.com/en/category/emobility/', '/en/emobility/'],
    ['https://www.skoda-storyboard.com/en/category/lifestyle/people/', '/en/lifestyle/people/']].forEach(([url, path]) => {
    const doc = page(url, GRID);
    archiveList(doc.querySelector('.search-results-items'), { document: doc });
    assert.deepEqual(rows(doc.querySelector('table'))[3], ['path', path]);
  });
});

test('no archive canonical → grid dropped (never an unscoped feed of every story)', { skip }, () => {
  const doc = page('https://www.skoda-storyboard.com/en/emobility/some-story/', GRID);
  const { warn } = console;
  console.warn = () => {};
  try { archiveList(doc.querySelector('.search-results-items'), { document: doc }); } finally { console.warn = warn; }
  assert.equal(doc.querySelector('table'), null);
  assert.equal(doc.querySelector('.search-results-items'), null);
});

test('archive hero → banner picture + h1 from parent + term labels', { skip }, () => {
  const doc = page('', `<div class="hero"><div class="hero-image"><img src="https://cdn.x/peaq-1920x375.jpg" srcset="a 1x" sizes="100vw" alt="Peaq"></div>
    <div class="hero-caption"><div class="container"><span class="category"><span class="label">Models</span> <span class="label">Peaq</span></span></div></div></div>`);
  archiveHero(doc.querySelector('.hero'), { document: doc });
  assert.equal(doc.querySelector('h1').textContent, 'Models Peaq');
  const img = doc.querySelector('p > img');
  assert.equal(img.getAttribute('src'), 'https://cdn.x/peaq-1920x375.jpg');
  assert.equal(img.hasAttribute('srcset'), false);
  assert.equal(doc.querySelector('.hero'), null);
});

test('archive hero without labels falls back to the <title> term (site suffix trimmed)', { skip }, () => {
  const doc = page('', '<div class="hero"><div class="hero-caption"></div></div>', 'Heritage - Škoda Storyboard');
  archiveHero(doc.querySelector('.hero'), { document: doc });
  assert.equal(doc.querySelector('h1').textContent, 'Heritage');
  assert.equal(doc.querySelector('img'), null);
});
