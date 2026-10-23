/* global globalThis */
/*
 * Brand Asset (SKODA-810b): one tile per row, its image and download links kept as authored
 * and marked; a one-paragraph cell gets its paragraph back; empty rows drop. Geometry is
 * measured in the browser against the source (docs/ui-specs/company-pages.md §11).
 * Run: node --test blocks/brand-asset/brand-asset.test.mjs
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

const decorate = JSDOM ? (await import('./brand-asset.js')).default : null;

const TILE = `<p><picture><img src="/media_wordmark.png" alt="Wordmark"></picture></p>
  <p><strong><a href="https://www.skoda-storyboard.com/direct-download/2023/07/wordmark.pdf">PDF download</a><br>
  <a href="https://www.skoda-storyboard.com/direct-download/2023/07/wordmark.png">PNG download</a></strong></p>`;

function block(...cells) {
  const dom = new JSDOM(`<main><div class="brand-asset">${cells.map((c) => `<div><div>${c}</div></div>`).join('')}</div></main>`);
  globalThis.document = dom.window.document;
  return dom.window.document.querySelector('.brand-asset');
}

test('a tile per row: the authored image and links kept, marked as image and links', { skip }, () => {
  const el = block(TILE, TILE, TILE);
  const img = el.querySelector('img');
  decorate(el);
  const tiles = [...el.querySelectorAll(':scope > ul.brand-asset-list > li.brand-asset-tile')];
  assert.equal(tiles.length, 3);
  assert.equal(tiles[0].querySelector('.brand-asset-image img'), img);
  const links = [...tiles[0].querySelectorAll('.brand-asset-links a')].map((a) => a.textContent);
  assert.deepEqual(links, ['PDF download', 'PNG download']);
});

test('a linked image is an image line; a one-paragraph cell gets its paragraph', { skip }, () => {
  const el = block('<p><a href="https://cdn.example.com/w.png"><picture><img src="/w.png" alt=""></picture></a></p><p><a href="/x.pdf">PDF download</a></p>', '<a href="/y.pdf">PDF download</a>');
  decorate(el);
  const [first, second] = el.querySelectorAll('li');
  assert.ok(first.querySelector('.brand-asset-image a img'));
  assert.equal(second.querySelector('p.brand-asset-links a').textContent, 'PDF download');
});

test('empty rows drop', { skip }, () => {
  const el = block('', TILE, ' ');
  decorate(el);
  assert.equal(el.querySelectorAll('li').length, 1);
});
