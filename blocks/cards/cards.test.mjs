/* global globalThis */
/* eslint-disable import/no-extraneous-dependencies */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const boot = new JSDOM('', { url: 'https://example.com/en/' });
globalThis.window = boot.window;
globalThis.document = boot.window.document;
const { default: decorate, parseTileRows } = await import('./cards.js');

function makeBlock(tokens, { tiles = true } = {}) {
  const markup = tokens.map((token, i) => `
    <div>
      <div>${token}</div>
      <div><picture><img src="data:image/png;base64,a" alt="Tile ${i + 1}"></picture></div>
      <div><a href="/en/item-${i + 1}">Tile ${i + 1}</a></div>
    </div>
  `).join('');
  const dom = new JSDOM(`<div class="cards overlay ${tiles ? 'tiles' : ''}">${markup}</div>`, {
    url: 'https://example.com/en/',
  });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  return dom.window.document.querySelector('.cards');
}

test('series mosaic consumes size cells and keeps linked headings, images and row breaks', async () => {
  const tokens = ['sq', 'sq', 'sq-small', 'wide', 'sq-small', 'third', 'third', 'third'];
  const block = makeBlock(tokens);
  const image = block.querySelector('img');
  await decorate(block);
  const cards = [...block.querySelectorAll('li')];
  assert.equal(cards.length, 8);
  assert.deepEqual(cards.map((card) => card.classList.contains('tile-row-start')), [
    true, false, true, false, false, true, false, false,
  ]);
  assert.deepEqual(
    cards.map((card) => card.querySelector('h2 a')?.getAttribute('href')),
    tokens.map((_, i) => `/en/item-${i + 1}`),
  );
  assert.equal(cards[0].querySelector('img'), image);
  assert.equal(cards[0].querySelectorAll('a').length, 1);
  assert.equal(cards[0].querySelector('.card-teaser-body').textContent.trim(), 'Tile 1');
  assert.equal(block.textContent.includes('sq-small'), false);
});

test('short rows marked end start a new row without stretching the preceding tile', async () => {
  const block = makeBlock(['wide end', 'sq', 'sq']);
  await decorate(block);
  const cards = block.querySelectorAll('li');
  assert.equal(cards[0].classList.contains('tile-wide'), true);
  assert.equal(cards[1].classList.contains('tile-row-start'), true);
});

test('all shape-2 series sizes fit authored rows', async () => {
  const block = makeBlock([
    'quarter', 'quarter', 'quarter', 'quarter', 'third-sq', 'two-thirds', 'banner', 'banner-tall',
  ]);
  await decorate(block);
  assert.equal(block.querySelectorAll('li').length, 8);
  assert.equal(block.querySelectorAll('.tile-row-start').length, 4);
});

test('press kits use a distinct 20-column track for features, fifths and quarters', async () => {
  const block = makeBlock([
    'feature', 'feature', 'press-square',
    'press-square', 'press-square', 'press-square', 'press-square', 'press-square',
    'press-quarter', 'press-quarter', 'press-quarter', 'press-quarter',
  ]);
  assert.equal(parseTileRows(block).mode, 'press');
  await decorate(block);
  assert.equal(block.querySelector('ul').classList.contains('tiles-press'), true);
  assert.deepEqual(
    [...block.querySelectorAll('.tile-row-start')].map((li) => li.textContent.trim()),
    ['Tile 1', 'Tile 4', 'Tile 9'],
  );
});

test('empty or omitted series token uses the documented small-square default', async () => {
  const block = makeBlock(['', 'sq-small', 'sq-small', 'sq-small']);
  await decorate(block);
  assert.equal(block.querySelectorAll('.tile-sq-small').length, 4);

  const omitted = makeBlock(['sq-small', 'sq-small', 'sq-small', 'sq-small']);
  omitted.firstElementChild.firstElementChild.remove();
  await decorate(omitted);
  assert.equal(omitted.querySelectorAll('.tile-sq-small').length, 4);
  assert.equal(omitted.querySelectorAll('img').length, 4);
});

test('invalid rows fail explicitly before modifying the authored DOM', async () => {
  [
    ['unknown'], ['sq', 'third', 'third'], ['wide', 'press-square'],
    ['wide', 'wide end', 'wide'], ['wide'], ['feature', 'sq-small'],
  ].forEach((tokens) => {
    const block = makeBlock(tokens);
    const original = block.innerHTML;
    assert.throws(() => parseTileRows(block), /Cards tiles/);
    assert.equal(block.innerHTML, original);
  });
  const empty = makeBlock([]);
  await assert.rejects(decorate(empty), /at least one/);
  const missingTitle = makeBlock(['sq', 'sq']);
  missingTitle.querySelector('a').textContent = '';
  await assert.rejects(decorate(missingTitle), /linked title/);
  const missingCells = makeBlock(['sq', 'sq']);
  missingCells.firstElementChild.replaceChildren();
  await assert.rejects(decorate(missingCells), /missing cells/);
  const missingImage = makeBlock(['sq', 'sq']);
  missingImage.firstElementChild.children[1].replaceChildren();
  await assert.rejects(decorate(missingImage), /picture/);
  const noOverlay = makeBlock(['sq', 'sq']);
  noOverlay.classList.remove('overlay');
  await assert.rejects(decorate(noOverlay), /overlay variant/);
  const legacyPress = makeBlock(['sq', 'sq']);
  legacyPress.ownerDocument.body.classList.add('press-kit');
  await assert.rejects(decorate(legacyPress), /re-import press-kit tiles/);
});

test('ordinary overlay cards still use the shared card-teaser decorator', async () => {
  const block = makeBlock(['sq'], { tiles: false });
  await decorate(block);
  assert.equal(block.querySelector('li').classList.contains('tile-sq'), false);
  assert.equal(block.querySelector('.card-teaser-body').textContent.trim(), 'sq');
});
