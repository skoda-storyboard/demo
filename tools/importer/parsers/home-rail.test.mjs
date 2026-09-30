/* global globalThis */
/*
 * Unit tests for the homepage rail parser (home-rail).
 * Run: node --test tools/importer/parsers/home-rail.test.mjs
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

const { default: homeRail } = await import('./home-rail.js');

// One Media Room rail band as the source serves it.
function run(type, heading, href = '') {
  const { document } = new JSDOM(`<div class="cover-box"><div class="search-results type-${type}">
    <h2 class="search-results-heading">${heading}</h2>
    ${href ? `<a class="search-results-header-link" href="${href}">All</a>` : ''}</div></div>`).window;
  homeRail(document.querySelector('.search-results'), { document });
  return Object.fromEntries([...document.querySelectorAll('tr')].slice(1)
    .map((tr) => [...tr.children].map((td) => td.textContent)));
}

test('Images and Videos rails read the media feed, where their rows are', { skip }, () => {
  assert.deepEqual(run('attachment', 'Images', '/en/images/'), {
    heading: 'Images', template: 'image', viewall: 'All', index: '/en/media-feed.json',
  });
  assert.equal(run('attachment', 'Videos').index, '/en/media-feed.json');
  assert.equal(run('attachment', 'Videos').template, 'video');
});

test('page rails keep the default page index', { skip }, () => {
  assert.deepEqual(run('press_release', 'News', '/en/news/'), { heading: 'News', template: 'press_release', viewall: 'All' });
  assert.equal(run('press_kit', 'Press Kits').index, undefined);
  assert.equal(run('post', 'Latest Stories').template, 'story');
});

test('the source "All" header link is kept as a viewall link; rails without one get none', { skip }, () => {
  const { document } = new JSDOM(`<div class="cover-box"><div class="search-results type-post">
    <h3 class="search-results-heading">eMobility</h3>
    <a class="btn-ghost-compact search-results-header-link" href="https://www.skoda-storyboard.com/en/category/emobility/">All</a>
  </div></div>`).window;
  homeRail(document.querySelector('.search-results'), { document });
  const rows = [...document.querySelectorAll('tr')].slice(1).map((tr) => [...tr.children]);
  const [, cell] = rows.find(([k]) => k.textContent === 'viewall');
  const a = cell.querySelector('a');
  assert.equal(a.getAttribute('href'), 'https://www.skoda-storyboard.com/en/category/emobility/');
  assert.equal(a.textContent, 'All');
  assert.equal(rows.find(([k]) => k.textContent === 'category')[1].textContent, 'emobility');
  // the Models rail has no header link on the source, so no viewall row
  assert.equal(run('skoda_model', 'Models').viewall, undefined);
});
