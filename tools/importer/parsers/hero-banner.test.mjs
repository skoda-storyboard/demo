/* global globalThis */
/*
 * Unit tests for parsers/hero-banner.js (SKODA-813): the generic page's band as
 * `Hero Image (page)`, the picture row (or an empty one) and the h1.
 * Run: node --test tools/importer/parsers/hero-banner.test.mjs
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

globalThis.WebImporter = {
  DOMUtils: {
    createTable(rows, doc) {
      const table = doc.createElement('table');
      rows.forEach((cells) => {
        const tr = table.insertRow();
        cells.forEach((c) => {
          const td = tr.insertCell();
          (Array.isArray(c) ? c : [c]).forEach((n) => { if (n) td.append(typeof n === 'string' ? n : n); });
        });
      });
      return table;
    },
  },
};
const parse = JSDOM ? (await import('./hero-banner.js')).default : null;

function run(html) {
  const { document } = new JSDOM(`<main>${html}</main>`).window;
  parse(document.querySelector('.hero'), { document });
  const table = document.querySelector('table');
  return { table, rows: [...table.rows].map((r) => r.cells[0]) };
}

test('the copyright band: Hero Image (page), an empty image row, the h1', { skip }, () => {
  const { rows } = run(`<div class="hero"><div class="hero-image" style="height: 240px"><div class="image-wrapper ratio-16x9 no-image"></div></div>
    <div class="hero-caption hero-caption--page"><div class="container"><h1 class="heading">Copyright</h1></div></div></div>`);
  assert.equal(rows[0].textContent, 'Hero Image (page)');
  assert.equal(rows[1].innerHTML, '');
  assert.equal(rows[2].querySelector('h1').textContent, 'Copyright');
});

test('the contacts band keeps its image; a title in another element becomes the h1 (code review)', { skip }, () => {
  const { rows } = run(`<div class="hero"><div class="hero-image"><div class="image-wrapper"><img src="https://cdn.example.test/head.png" alt="Contacts"></div></div>
    <div class="hero-caption"><h2 class="entry-title">Contacts</h2></div></div>`);
  assert.equal(rows[1].querySelector('img').getAttribute('src'), 'https://cdn.example.test/head.png');
  assert.equal(rows[2].querySelector('h2'), null);
  assert.equal(rows[2].querySelector('h1').textContent, 'Contacts');
});
