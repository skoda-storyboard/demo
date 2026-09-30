import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

/* global globalThis */

const { JSDOM } = createRequire(import.meta.url)('jsdom');

globalThis.WebImporter = {
  DOMUtils: {
    createTable(rows, document) {
      const table = document.createElement('table');
      rows.forEach((cells) => {
        const tr = document.createElement('tr');
        cells.forEach((cell) => {
          const td = document.createElement('td');
          (Array.isArray(cell) ? cell : [cell]).forEach((node) => {
            if (node) td.append(typeof node === 'string' ? document.createTextNode(node) : node);
          });
          tr.append(td);
        });
        table.append(tr);
      });
      return table;
    },
  },
};

const { default: parse } = await import('./parsers/promo-box.js');

test('homepage promo imports three articles once, not their three parent items as well', () => {
  const { document } = new JSDOM(`<section class="promo-box"><div class="items">${
    [1, 2, 3].map((i) => `<div class="item"><article class="promo-box-item">
      <a href="/en/story-${i}"><img src="/media-${i}.jpg" alt="Story ${i}"></a>
      <h3>Story ${i}</h3></article></div>`).join('')
  }</div></section>`).window;
  parse(document.querySelector('.promo-box'), { document });
  const rows = [...document.querySelectorAll('table tr')];
  assert.equal(rows[0].textContent.trim(), 'Promo Box');
  assert.equal(rows.length, 4);
  assert.deepEqual(rows.slice(1).map((row) => row.querySelector('a')?.getAttribute('href')), [
    '/en/story-1', '/en/story-2', '/en/story-3',
  ]);
  assert.equal(document.querySelectorAll('table img').length, 3);
});

test('promo without nested articles still imports each item once', () => {
  const { document } = new JSDOM(`<section class="promo-box"><div class="items">
    <div class="item"><h3><a href="/en/a">A</a></h3></div>
    <div class="item"><h3><a href="/en/b">B</a></h3></div>
    <div class="item"><h3><a href="/en/c">C</a></h3></div>
  </div></section>`).window;
  parse(document.querySelector('.promo-box'), { document });
  assert.equal(document.querySelectorAll('table tr').length, 4);
});

test('Storyboard home emits only index settings, never imported teaser content', () => {
  const { document } = new JSDOM(`<section class="promo-box">
    <div class="item"><article class="promo-box-item">
      <img src="/peaq.jpg" alt="Peaq"><a href="/en/peaq">Peaq</a>
    </article></div></section>`).window;
  parse(document.querySelector('.promo-box'), { document, indexDriven: true });
  const rows = [...document.querySelectorAll('table tr')];
  assert.deepEqual(rows.map((row) => [...row.querySelectorAll('td')]
    .map((cell) => cell.textContent.trim())), [
    ['Promo Box'], ['template', 'story'], ['path', '/en/'], ['limit', '3'],
  ]);
  assert.equal(document.querySelectorAll('table img, table a').length, 0);
});
