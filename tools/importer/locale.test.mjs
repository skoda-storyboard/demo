/* global globalThis */
/*
 * Unit tests for the importers' locale handling (SKODA-1001): tools/importer/locale.js, and the
 * settings the home and rail parsers write for a page in another locale.
 * Run: node --test tools/importer/locale.test.mjs
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

const {
  sourceLocale, indexUrl, mediaFeedUrl, contentPath, homePath,
} = await import('./locale.js');
const { default: homeStories } = await import('./parsers/home-stories.js');
const { default: promoBox } = await import('./parsers/promo-box.js');
const { default: storyRail } = await import('./parsers/story-rail.js');

const SRC = 'https://www.skoda-storyboard.com';
const rowsOf = (document) => Object.fromEntries([...document.querySelectorAll('tr')].slice(1)
  .map((tr) => [...tr.children].map((td) => td.textContent)));

test('sourceLocale: the first path segment of one of the six locales, else en', () => {
  assert.equal(sourceLocale(`${SRC}/cs/foto/`), 'cs');
  assert.equal(sourceLocale('/de/fotos'), 'de');
  assert.equal(sourceLocale(`${SRC}/en/`), 'en');
  assert.equal(sourceLocale(`${SRC}/`), 'en');
  assert.equal(sourceLocale(`${SRC}/xx/page/`), 'en', 'not one of the six');
  assert.equal(sourceLocale(''), 'en');
  assert.equal(sourceLocale(undefined), 'en');
});

test('the per-locale settings: index, feed (English until built), content path, home', () => {
  assert.equal(indexUrl('sk'), '/sk/query-index.json');
  assert.equal(mediaFeedUrl('cs'), '/en/media-feed.json');
  assert.equal(mediaFeedUrl('en'), '/en/media-feed.json');
  assert.equal(contentPath('press_release', 'de'), '/de/pressemitteilungen-archive/');
  assert.equal(contentPath('press_kit', 'sl'), '/en/press-kits/', 'Slovenian has no kits: English');
  assert.equal(homePath('sr'), '/sr/');
});

test('the Czech home rails scope to the Czech home', { skip }, () => {
  const url = `${SRC}/cs/`;
  let { document } = new JSDOM('<div class="search-results"><h3 class="search-results-heading">Nejnovější</h3></div>').window;
  homeStories(document.querySelector('.search-results'), { document, url, params: { originalURL: url } });
  assert.equal(rowsOf(document).path, '/cs/');
  ({ document } = new JSDOM('<div class="promo-box"></div>').window);
  promoBox(document.querySelector('.promo-box'), {
    document, url, params: { originalURL: url }, indexDriven: true,
  });
  assert.equal(rowsOf(document).path, '/cs/');
});

test('a Czech model page: the family path and the media rails in that locale', { skip }, () => {
  const url = `${SRC}/cs/skoda-model/nova-fabia/`;
  let { document } = new JSDOM('<div id="derivatives"><div class="search-results-container"><h3 class="search-results-heading">Karoserie</h3></div></div>').window;
  storyRail(document.querySelector('.search-results-container'), { document, url, params: { originalURL: url } });
  assert.equal(rowsOf(document).path, '/cs/skoda-model/nova-fabia/');
  ({ document } = new JSDOM(`<div id="images"><div class="search-results-container"><h3 class="search-results-heading">Foto</h3>
    <a class="search-results-header-link" href="${SRC}/cs/foto/?filter%5Bmodel%5D%5B0%5D=fabia-cs">Vše</a></div></div>`).window);
  storyRail(document.querySelector('.search-results-container'), { document, url, params: { originalURL: url } });
  assert.equal(rowsOf(document).index, '/en/media-feed.json', 'no Czech feed built yet');
});
