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

// SKODA-402d (#333): the filter groups the source SHOWS on /en/news/ and /en/press-kits/, in its
// order (measured 2026-10-14). Its form also holds equipment + motorsport, with hidden pills.
const SOURCE_SHOWN = ['model', 'derivative', 'concept', 'bodywork', 'years', 'company', 'happening',
  'history', 'sponsorship', 'vip', 'view', 'technology', 'environment'];

test('News and Press Kits offer the source\'s 13 shown filter groups, in its order (SKODA-402d)', { skip }, async () => {
  const split = (v) => v.split(',').map((k) => k.trim());
  ['news', 'press-kits'].forEach((token) => assert.deepEqual(split(run(token).facets), SOURCE_SHOWN, token));
  // every key is an index facet column with option names (blocks/listing/facet-labels.json)
  const { INDEX_FACETS } = await import('../../../blocks/listing/listing-logic.mjs');
  const { readFile } = await import('node:fs/promises');
  const names = JSON.parse(await readFile(new URL('../../../blocks/listing/facet-labels.json', import.meta.url), 'utf8'));
  SOURCE_SHOWN.forEach((k) => {
    assert.ok(INDEX_FACETS.includes(k), `${k} is an index facet`);
    assert.ok(names[k], `${k} has option names`);
  });
});

test('Images and Videos offer the same 13 filter groups the source shows, in its order (#273)', { skip }, () => {
  ['images', 'videos'].forEach((token) => assert.deepEqual(run(token).facets.split(',').map((k) => k.trim()), SOURCE_SHOWN, token));
});

// --- SKODA-1001: a listing in another locale ----------------------------------------------

// a translated listing: its body class token is the page slug (`foto`), and the source URL says
// which locale and which listing it is
function runAt(url, token) {
  const { document } = new JSDOM(`<html><body class="page-template page-template-template-search-results media-room lang-cs ${token}">
    <div id="search-filter-results"><form class="search-filter"></form><div class="search-results-items"></div></div>
    </body></html>`).window;
  listing(document.querySelector('#search-filter-results'), { document, url, params: { originalURL: url } });
  return Object.fromEntries([...document.querySelectorAll('tr')].slice(1)
    .map((tr) => [...tr.children].map((td) => td.textContent)));
}

test('a Czech listing is recognised from its path, not its slug class, and reads Czech content', { skip }, () => {
  const images = runAt('https://www.skoda-storyboard.com/cs/foto/', 'foto');
  assert.equal(images.template, 'image', '/cs/foto is Images, not the News default');
  assert.equal(images.index, '/en/media-feed.json', 'no Czech feed built yet: the English one');
  const news = runAt('https://www.skoda-storyboard.com/cs/tiskove-zpravy/', 'tiskove-zpravy');
  assert.deepEqual([news.template, news.index, news.path],
    ['press_release', '/cs/query-index.json', '/cs/tiskove-zpravy-archiv/']);
  const kits = runAt('https://www.skoda-storyboard.com/cs/tiskove-mapy/', 'tiskove-mapy');
  assert.deepEqual([kits.template, kits.path], ['press_kit', '/cs/tiskove-mapy/']);
  const search = runAt('https://www.skoda-storyboard.com/cs/hledat/', 'hledat');
  assert.deepEqual([search.search, search.index], ['true', '/cs/query-index.json']);
  assert.equal(runAt('https://www.skoda-storyboard.com/cs/video/', 'video').template, 'video');
});

test('a Serbian listing scopes to the EDS form of its source prefix (`_` → `-`)', { skip }, () => {
  assert.equal(runAt('https://www.skoda-storyboard.com/sr/news/', 'news').path, '/sr/press-release/');
  assert.equal(runAt('https://www.skoda-storyboard.com/de/pressemappen/', 'pressemappen').path, '/de/pressemappe/');
});

test('an English listing with a source URL is unchanged', { skip }, () => {
  const images = runAt('https://www.skoda-storyboard.com/en/images/', 'images');
  assert.deepEqual([images.template, images.index], ['image', '/en/media-feed.json']);
  assert.equal(runAt('https://www.skoda-storyboard.com/en/news/', 'news').path, '/en/press-releases/');
});
