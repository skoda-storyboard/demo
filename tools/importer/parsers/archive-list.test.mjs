/* global globalThis */
/*
 * Unit tests for the archive-list scope (SKODA-831): category archives scope the Stories
 * feed by the index `categories` column (the term slug), tag archives by `tags`.
 * Run: node --test tools/importer/parsers/archive-list.test.mjs
 * jsdom is resolved like archive.test.mjs; tests skip cleanly if unavailable.
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

const { default: archiveList } = await import('./archive-list.js');

const GRID = `<div class="container"><div class="search-results archive-results">
  <div class="search-results-items"><div class="search-results-item"><article class="article-teaser post-1 category-design">Card</article></div></div>
  <div class="search-results-pagination"><span class="current">6</span> <span class="total">198</span></div>
</div></div>`;

// The Stories config rows the parser emits for an archive canonical URL.
function configFor(canonical) {
  const { document } = new JSDOM(`<html><head><link rel="canonical" href="${canonical}"></head><body>${GRID}</body></html>`).window;
  archiveList(document.querySelector('.search-results-items'), { document });
  const table = document.querySelector('table');
  return table && [...table.querySelectorAll('tr')].map((tr) => [...tr.children].map((td) => td.textContent.trim()));
}
const BASE = 'https://www.skoda-storyboard.com';
const tail = [['columns', '3'], ['initial', '6'], ['perpage', '6'], ['excludefeatured', 'false']];

test('a top-level category archive scopes by categories = its slug, with no path row', { skip }, () => {
  assert.deepEqual(configFor(`${BASE}/en/category/emobility/`), [
    ['Stories'], ['index', '/en/query-index.json'], ['template', 'story'], ['categories', 'emobility'], ...tail,
  ]);
});

test('sub-category archives scope by the term slug (the last segment), never the URL folder', { skip }, () => {
  [
    ['/en/category/skoda-world/design/', 'design'],
    ['/en/category/skoda-world/innovation-and-technology/', 'innovation-and-technology'],
    ['/en/category/lifestyle/people/', 'people'],
    ['/en/category/lifestyle/sports/cycling/', 'cycling'], // three levels
    ['/en/category/models/peaq-en', 'peaq-en'], // no trailing slash
  ].forEach(([p, slug]) => {
    const rows = configFor(`${BASE}${p}`);
    assert.deepEqual(rows[3], ['categories', slug], p);
    assert.ok(!rows.some(([k]) => k === 'path' || k === 'category' || k === 'tag'), `${p}: only the categories scope`);
    assert.deepEqual(rows[2], ['template', 'story'], p);
  });
});

test('parent archives use the same key, so they match their descendants\' stories (ancestor roll-up)', { skip }, () => {
  ['skoda-world', 'lifestyle', 'models', 'classic-cars', 'design-eng'].forEach((slug) => {
    assert.deepEqual(configFor(`${BASE}/en/category/${slug}/`)[3], ['categories', slug]);
  });
});

test('tag archives are unchanged: tag = the term slug', { skip }, () => {
  assert.deepEqual(configFor(`${BASE}/en/tag/model/peaq/`)[3], ['tag', 'peaq']);
  assert.deepEqual(configFor(`${BASE}/en/tag/company/design/`)[3], ['tag', 'design']);
});

test('the locale picks the index; a bare /en/category/ is not an archive', { skip }, () => {
  assert.deepEqual(configFor(`${BASE}/de/category/emobility/`)[1], ['index', '/de/query-index.json']);
  const { warn } = console;
  console.warn = () => {};
  try {
    assert.equal(configFor(`${BASE}/en/category/`), null);
  } finally { console.warn = warn; }
});
