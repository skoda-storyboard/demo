/* global globalThis */
/*
 * Unit tests for the faceted-listing parser (listing): the variant comes from the source
 * <body> class token.
 * Run: node --test tools/importer/parsers/listing.test.mjs
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
      td.append(doc.createTextNode(c));
      tr.append(td);
    });
    table.append(tr);
  });
  return table;
}
globalThis.WebImporter = { DOMUtils: { createTable } };

const { default: listing } = await import('./listing.js');

// The engine page as the source serves it: every variant carries the shared
// `page-template-template-search-results` class plus one standalone type token.
function run(token) {
  const { document } = new JSDOM(`<html><body class="page-template page-template-template-search-results media-room lang-en ${token}">
    <div id="search-filter-results"><form class="search-filter"></form><div class="search-results-items"></div></div>
    </body></html>`).window;
  listing(document.querySelector('#search-filter-results'), { document });
  return Object.fromEntries([...document.querySelectorAll('tr')].slice(1)
    .map((tr) => [...tr.children].map((td) => td.textContent)));
}

test('Press Kits lists the kit hubs only, with the News facets and paging', { skip }, () => {
  const cfg = run('press-kits');
  assert.equal(cfg.path, '/en/press-kits/');
  assert.equal(cfg.template, 'press_kit', 'exact match keeps press_kit_chapter rows out');
  assert.equal(cfg.index, '/en/query-index.json');
  assert.deepEqual([cfg.facets, cfg.perpage, cfg.columns], [run('news').facets, '6', '3']);
});

test('News stays the press-release listing, and the default', { skip }, () => {
  assert.equal(run('news').template, 'press_release');
  assert.equal(run('news').path, '/en/press-releases/');
  assert.equal(run('').template, 'press_release');
});

test('media and search variants are unchanged', { skip }, () => {
  assert.equal(run('images').index, '/en/media-feed.json');
  assert.equal(run('videos').template, 'video');
  assert.equal(run('search').search, 'true');
});
