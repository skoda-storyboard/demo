/* global globalThis */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

let JSDOM = null;
try {
  // eslint-disable-next-line import/no-unresolved
  ({ JSDOM } = createRequire(import.meta.url)('jsdom'));
} catch { /* jsdom unavailable — DOM tests skip */ }

let decorate = null;
if (JSDOM) {
  const dom = new JSDOM('<main></main>', { url: 'https://example.com/en/press-kits/kit' });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.Node = dom.window.Node;
  window.hlx = { codeBasePath: '' };
  ({ default: decorate } = await import('./cards.js'));
}

function tiles(rows) {
  const block = document.createElement('div');
  block.className = 'cards overlay tiles';
  block.innerHTML = rows.map((cells) => `<div>${cells.map((c) => `<div>${c}</div>`).join('')}</div>`).join('');
  document.querySelector('main').replaceChildren(block);
  return block;
}

const img = (alt) => `<picture><img src="https://example.com/${alt}.jpg" alt="${alt}"></picture>`;
const link = (label) => `<a href="/en/${label.toLowerCase()}">${label}</a>`;

test('tiles: the size token becomes data-tile-size and never prints', { skip: !JSDOM }, async () => {
  const block = tiles([
    ['<p>feature</p>', img('Intro'), link('Intro')],
    ['sq', img('Exterior'), link('Exterior')],
    ['<p>wide end</p>', img('Interior'), link('Interior')],
    ['', img('Battery'), link('Battery')],
  ]);
  await decorate(block);
  const cards = [...block.querySelectorAll('li.card-teaser')];
  assert.deepEqual(cards.map((li) => li.dataset.tileSize), ['feature', 'sq', 'wide end', 'sq-small']);
  assert.doesNotMatch(block.textContent, /\b(feature|sq|wide|end)\b/);
  cards.forEach((li) => assert.equal(li.querySelectorAll('.card-teaser-body a.card-teaser-link').length, 1));
});

test('tiles: an omitted token or an unknown first cell keeps the tile and its link', { skip: !JSDOM }, async () => {
  const block = tiles([
    [img('Exterior'), link('Exterior')],
    [link('Only link')],
    ['<p>Introduction text</p>', link('Intro')],
  ]);
  await decorate(block);
  const cards = [...block.querySelectorAll('li.card-teaser')];
  assert.ok(cards.every((li) => !('tileSize' in li.dataset)));
  assert.deepEqual(cards.map((li) => li.querySelector('a')?.textContent), ['Exterior', 'Only link', 'Intro']);
  assert.match(block.textContent, /Introduction text/);
});

test('non-tile cards keep a leading text cell', { skip: !JSDOM }, async () => {
  const block = tiles([['sq', img('A'), link('A')]]);
  block.classList.remove('tiles');
  await decorate(block);
  assert.match(block.textContent, /sq/);
  assert.equal(block.querySelector('li').dataset.tileSize, undefined);
});
