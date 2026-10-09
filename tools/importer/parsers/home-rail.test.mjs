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

// a script-URL scheme, assembled so no literal javascript: URL sits in the source
const JS = ['java', 'script:'].join('');

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

test('only a real source "All" link becomes a viewall row (not #, javascript:, relative or empty)', { skip }, () => {
  ['#', `${JS}void(0)`, 'category/emobility/', ' '].forEach((href) => {
    assert.equal(run('post', 'eMobility', href).viewall, undefined, `skipped: "${href}"`);
  });
  assert.equal(run('post', 'eMobility', '/en/category/emobility/').viewall, 'All');
  assert.equal(run('post', 'eMobility', '  https://www.skoda-storyboard.com/en/category/emobility/  ').viewall, 'All', 'padded href');
});

// The Storyboard home's Models band (#272): the source cards' tag-page links, in source order.
function models(options) {
  const { document } = new JSDOM(`<div class="cover-box"><div class="search-results type-skoda_model">
    <h3 class="search-results-heading">Models</h3><div class="search-results-items">
    ${['elroq', 'kodiaq', 'peaq'].map((m) => `<div class="search-results-item"><article>
      <h3 class="entry-title"><a href="https://www.skoda-storyboard.com/en/tag/model/${m}/">${m}</a></h3>
    </article></div>`).join('')}</div></div></div>`).window;
  homeRail(document.querySelector('.search-results'), { document, ...options });
  return Object.fromEntries([...document.querySelectorAll('tr')].slice(1)
    .map((tr) => [...tr.children].map((td) => td.textContent)));
}

test('the Storyboard home Models band keeps the source order as an order row (#272)', { skip }, () => {
  assert.deepEqual(models({ orderModels: true }), {
    heading: 'Models',
    template: 'skoda_model',
    order: '/en/tag/model/elroq, /en/tag/model/kodiaq, /en/tag/model/peaq',
  });
});

test('without orderModels (the Media Room home) the Models band stays index-sorted', { skip }, () => {
  assert.deepEqual(models(), { heading: 'Models', template: 'skoda_model' });
  // and a non-model rail never gets an order, even on the Storyboard home
  const { document } = new JSDOM(`<div class="search-results type-post">
    <h3 class="search-results-heading">eMobility</h3>
    <a class="search-results-header-link" href="/en/category/emobility/">All</a>
    <div class="search-results-item"><h3 class="entry-title"><a href="/en/emobility/a/">A</a></h3></div></div>`).window;
  homeRail(document.querySelector('.search-results'), { document, orderModels: true });
  assert.equal(document.body.textContent.includes('order'), false);
});
