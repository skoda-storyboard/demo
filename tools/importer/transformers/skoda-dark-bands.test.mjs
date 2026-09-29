/* global globalThis */
/*
 * Unit tests for skoda-dark-bands (SKODA-218): source `.cover-box.dark` bands on
 * the two homes become their own `Style: cover-box, dark` sections. Fixtures mirror
 * the live /en/ (Series) and /en/media-room/ (Models + Press Kits) markup.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

let JSDOM = null;
try {
  // eslint-disable-next-line import/no-unresolved
  ({ JSDOM } = createRequire(import.meta.url)('jsdom'));
} catch { /* jsdom unavailable — DOM tests skip */ }
const skip = JSDOM ? false : 'jsdom not installed — DOM tests skip';

// Minimal WebImporter stub: Blocks.createBlock → a <table> whose first row is the name.
globalThis.WebImporter = {
  Blocks: {
    createBlock(doc, { name, cells }) {
      const table = doc.createElement('table');
      [[name], ...Object.entries(cells)].forEach((row) => {
        const tr = doc.createElement('tr');
        row.forEach((v) => { const td = doc.createElement('td'); td.textContent = v; tr.append(td); });
        table.append(tr);
      });
      return table;
    },
  },
};

const { default: darkBands } = await import('./skoda-dark-bands.js');

const rail = (heading) => `<div class="search-results type-post"><header class="search-results-header">
  <h3 class="search-results-heading">${heading}</h3></header><div class="search-results-items">
  <div class="search-results-item"><article><h3 class="entry-title">${heading} story</h3></article></div></div></div>`;
const coverBox = (cls, ...headings) => `<div class="cover-box ${cls}">${headings.map(rail).join('')}</div>`;

const run = (html, template = {}) => {
  const { document } = new JSDOM(`<body>${html}</body>`).window;
  darkBands('beforeTransform', document.body, { template });
  return document.body;
};
// the body as a flat list: hr / cover-box(dark?) with its trailing Section Metadata style
const outline = (body) => [...body.children].map((el) => {
  if (el.tagName === 'HR') return 'hr';
  const meta = [...el.querySelectorAll(':scope > table')].map((t) => t.rows[1].cells[1].textContent);
  const heads = [...el.querySelectorAll('.search-results-heading')].map((h) => h.textContent).join('+');
  return `${el.className.trim()}(${heads})${meta.length ? `[${meta.join(';')}]` : ''}`;
});

test('Storyboard home: the dark Series band becomes its own cover-box, dark section', { skip }, () => {
  const body = run([
    coverBox('', 'Škoda World'),
    coverBox('dark', 'Series'),
    coverBox('', 'Latest News'),
  ].join(''));
  assert.deepEqual(outline(body), [
    'cover-box(Škoda World)',
    'hr',
    'cover-box dark(Series)[cover-box, dark]',
    'hr',
    'cover-box(Latest News)',
  ]);
});

test('Media Room home: the importer\'s darkBandStyle adds compact; both rails stay in the band', { skip }, () => {
  const body = run([
    coverBox('', 'News'),
    coverBox('dark', 'Models', 'Press Kits'),
    coverBox('', 'Latest Stories'),
  ].join(''), { darkBandStyle: 'cover-box, dark, compact' });
  assert.deepEqual(outline(body), [
    'cover-box(News)',
    'hr',
    'cover-box dark(Models+Press Kits)[cover-box, dark, compact]',
    'hr',
    'cover-box(Latest Stories)',
  ]);
});

test('the Social media band (.socials-static) is left to its own parser', { skip }, () => {
  const body = run([coverBox('', 'Latest'), coverBox('dark socials-static', 'Social media'), coverBox('', 'Models')].join(''));
  assert.equal(body.querySelectorAll('hr, table').length, 0);
});

test('no empty sections: no break before a leading band or after a trailing one; empty bands skipped', { skip }, () => {
  const edge = run([coverBox('dark', 'Series'), coverBox('', 'News'), coverBox('dark', 'Models')].join(''));
  assert.deepEqual(outline(edge), [
    'cover-box dark(Series)[cover-box, dark]',
    'hr',
    'cover-box(News)',
    'hr',
    'cover-box dark(Models)[cover-box, dark]',
  ]);
  const empty = run(`${coverBox('', 'News')}<div class="cover-box dark">  </div>`);
  assert.equal(empty.querySelectorAll('hr, table').length, 0);
});

test('a band first in its wrapper still gets a break when content comes before it elsewhere', { skip }, () => {
  // promo in one container, the dark band first inside the next one
  const body = run(`<section class="promo-box"><p>Featured</p></section>
    <div class="container">${coverBox('dark', 'Series')}${coverBox('', 'Latest News')}</div>`);
  const band = body.querySelector('.cover-box.dark');
  assert.equal(band.previousElementSibling?.tagName, 'HR', 'break before the band (content precedes it in page order)');
  assert.equal(band.nextElementSibling?.tagName, 'HR', 'break after the band');
  // and a band last in its wrapper, with content after it in the next container
  const tail = run(`<div class="container">${coverBox('', 'News')}${coverBox('dark', 'Models')}</div>
    <div class="container">${coverBox('', 'Latest Stories')}</div>`);
  assert.equal(tail.querySelector('.cover-box.dark').nextElementSibling?.tagName, 'HR', 'break after the band');
});

test('only beforeTransform acts (afterTransform is a no-op); pages without dark bands are untouched', { skip }, () => {
  const { document } = new JSDOM(`<body>${coverBox('dark', 'Series')}${coverBox('', 'News')}</body>`).window;
  darkBands('afterTransform', document.body, {});
  assert.equal(document.querySelectorAll('hr, table').length, 0);
  const plain = run(coverBox('', 'News') + coverBox('', 'Models'));
  assert.equal(plain.querySelectorAll('hr, table').length, 0);
});

test('Storyboard home (lightBandStyle): every band is its own section, one break between neighbours', { skip }, () => {
  const body = run([
    '<section class="promo-box"><p>Featured</p></section>',
    coverBox('', 'Latest Stories'),
    coverBox('', 'Models'),
    coverBox('', 'eMobility'),
    coverBox('dark', 'Series'),
    coverBox('', 'Latest News'),
  ].join(''), { lightBandStyle: 'cover-box' });
  assert.deepEqual(outline(body), [
    'promo-box()',
    'hr',
    'cover-box(Latest Stories)[cover-box]',
    'hr',
    'cover-box(Models)[cover-box]',
    'hr',
    'cover-box(eMobility)[cover-box]',
    'hr',
    'cover-box dark(Series)[cover-box, dark]',
    'hr',
    'cover-box(Latest News)[cover-box]',
  ]);
});

test('lightBandStyle: the social parser\'s own breaks are reused, never doubled', { skip }, () => {
  // social-cards has already replaced the band with <hr> h2 table table <hr>
  const body = run([
    coverBox('', 'Latest Stories'),
    '<hr><h2>Social media</h2><table><tr><td>Cards (social)</td></tr></table><hr>',
    coverBox('', 'Models'),
  ].join(''), { lightBandStyle: 'cover-box' });
  const tags = [...body.children].map((el) => el.tagName.toLowerCase());
  assert.deepEqual(tags, ['div', 'hr', 'h2', 'table', 'hr', 'div']);
});
