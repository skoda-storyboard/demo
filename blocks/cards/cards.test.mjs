/* global globalThis */
/* eslint-disable import/no-extraneous-dependencies */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

const boot = new JSDOM('', { url: 'https://example.com/en/' });
globalThis.window = boot.window;
globalThis.document = boot.window.document;
const { default: decorate, parseTileRows } = await import('./cards.js');

function makeBlock(tokens, { tiles = true } = {}) {
  const markup = tokens.map((token, i) => (/^press-banner-/.test(token) ? `
    <div>
      <div>${token}</div>
      <div><a href="/en/banner-${i + 1}"><picture><img src="data:image/png;base64,a" alt="Banner ${i + 1}"></picture></a></div>
    </div>` : `
    <div>
      <div>${token}</div>
      <div><picture><img src="data:image/png;base64,a" alt="Tile ${i + 1}"></picture></div>
      <div><a href="/en/item-${i + 1}">Tile ${i + 1}</a></div>
    </div>
  `)).join('');
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

test('tile images retain authored img nodes and use size-aware responsive sources', async () => {
  const block = makeBlock(['sq', 'sq-small', 'sq-small', 'third', 'third', 'third', 'banner']);
  const images = [...block.querySelectorAll('img')];
  images.forEach((img) => { img.src = 'https://example.com/media.jpg?width=750'; });
  await decorate(block);
  const cards = [...block.querySelectorAll('li')];
  const widthAt = (li, media) => {
    const source = [...li.querySelectorAll('source[type="image/webp"]')]
      .find((el) => el.getAttribute('media') === media);
    return new URL(source.getAttribute('srcset')).searchParams.get('width');
  };
  cards.forEach((li, i) => assert.equal(li.querySelector('img'), images[i]));
  assert.equal(widthAt(cards[0], '(min-width: 781px)'), '1250');
  assert.equal(widthAt(cards[1], '(min-width: 781px)'), '750');
  assert.equal(widthAt(cards[3], '(min-width: 781px)'), '850');
  assert.equal(widthAt(cards[6], '(min-width: 781px)'), '2500');
  assert.equal(widthAt(cards[0], '(min-width: 500px)'), '1600');
  assert.equal(widthAt(cards[0], '(min-width: 395px)'), '1000');
  assert.equal(widthAt(cards[0], null), '750');
});

test('press kits use a distinct 20-column track for features, fifths and quarters', async () => {
  const block = makeBlock([
    'feature', 'feature', 'press-square',
    'press-square', 'press-square', 'press-square', 'press-square', 'press-square',
    'press-quarter', 'press-quarter', 'press-quarter', 'press-quarter',
  ]);
  [...block.querySelectorAll('img')].forEach((img) => {
    img.src = 'https://example.com/media.jpg?width=750';
  });
  assert.equal(parseTileRows(block).mode, 'press');
  await decorate(block);
  assert.equal(block.querySelector('ul').classList.contains('tiles-press'), true);
  assert.deepEqual(
    [...block.querySelectorAll('.tile-row-start')].map((li) => li.textContent.trim()),
    ['Tile 1', 'Tile 4', 'Tile 9'],
  );
  [1000, 500, 750].forEach((width, i) => {
    const card = block.querySelectorAll('li')[[0, 2, 8][i]];
    const source = card.querySelector('source[media="(min-width: 781px)"]');
    assert.equal(new URL(source.srcset).searchParams.get('width'), String(width));
  });
});

// Classic Days 2026, in source rows: banners 3/5 + 2/5, four rows of fifths, three fifths +
// a 2/5 banner, banners 2/5 + 3/5, three thirds, two half banners.
const MOSAIC = [
  'press-banner-wide', 'press-banner-narrow',
  ...Array(20).fill('press-square'),
  'press-square', 'press-square', 'press-square', 'press-banner-narrow',
  'press-banner-narrow', 'press-banner-wide',
  'press-third', 'press-third', 'press-third',
  'press-banner-half', 'press-banner-half',
];

test('a press mosaic with thirds and banners runs on 30 columns, one row per source row', async () => {
  const block = makeBlock(MOSAIC);
  block.querySelectorAll('img').forEach((img) => { img.src = 'https://example.com/media.jpg?width=750'; });
  await decorate(block);
  const ul = block.querySelector('ul');
  assert.deepEqual([...ul.classList], ['tiles-press', 'tiles-press-mosaic']);
  assert.equal(block.querySelectorAll('.tile-row-start').length, 9);
  const banners = [...block.querySelectorAll('li.tile-image-only')];
  assert.equal(banners.length, 7);
  banners.forEach((li) => {
    assert.equal(li.querySelector(':scope > a.tile-image-link > picture > img')?.alt.startsWith('Banner'), true);
    assert.equal(li.querySelector('h2, .card-teaser-body'), null, 'no title overlay on a banner');
    assert.equal(li.classList.contains('card-teaser'), false);
  });
  assert.equal(banners[0].querySelector('a').getAttribute('href'), '/en/banner-1');
  // SKODA-221: requests at least 2x the 1440 widths (wide 728.8, narrow 479.2, half 604,
  // third 396px on the 1228px track)
  const desktopWidth = (li) => new URL(li.querySelector('source[media="(min-width: 781px)"]').srcset)
    .searchParams.get('width');
  const byToken = (token) => block.querySelector(`li.tile-${token}`);
  assert.deepEqual(
    ['press-banner-wide', 'press-banner-narrow', 'press-banner-half', 'press-third'].map((t) => desktopWidth(byToken(t))),
    ['1500', '1000', '1250', '850'],
  );
  assert.equal(block.querySelectorAll('li.tile-press-third.card-teaser h2 a').length, 3);
});

test('mosaic rules: no quarters beside thirds or banners; banner rows and banner sizes go together', async () => {
  await assert.rejects(
    decorate(makeBlock(['press-quarter', 'press-quarter', 'press-quarter', 'press-quarter', 'press-third', 'press-third', 'press-third'])),
    /cannot share a mosaic with thirds or banners/,
  );
  const titled = makeBlock(['press-third', 'press-third', 'press-third']);
  titled.firstElementChild.firstElementChild.textContent = 'press-banner-wide';
  await assert.rejects(decorate(titled), /is a banner size/);
  const unsized = makeBlock(['press-banner-half', 'press-banner-half']);
  unsized.firstElementChild.firstElementChild.textContent = 'press-half';
  await assert.rejects(decorate(unsized), /a banner needs a banner size/);
  const unnamed = makeBlock(['press-banner-half', 'press-banner-half']);
  unnamed.querySelector('img').setAttribute('alt', '');
  await assert.rejects(decorate(unnamed), /needs alt text/);
  const plain = makeBlock(Array(5).fill('press-square'));
  await decorate(plain);
  assert.equal(plain.querySelector('ul').classList.contains('tiles-press-mosaic'), false, 'other kits keep 20 columns');
});

test('older press kits use half rows: 2 wide, or 1 wide + 2 quarters in either order', async () => {
  const block = makeBlock([
    'press-half', 'press-half',
    'press-half', 'press-quarter', 'press-quarter',
    'press-quarter', 'press-quarter', 'press-half',
  ]);
  [...block.querySelectorAll('img')].forEach((img) => {
    img.src = 'https://example.com/media.jpg?width=750';
  });
  await decorate(block);
  assert.equal(block.querySelector('ul').classList.contains('tiles-press'), true);
  assert.deepEqual(
    [...block.querySelectorAll('.tile-row-start')].map((li) => li.textContent.trim()),
    ['Tile 1', 'Tile 3', 'Tile 6'],
  );
  const source = block.querySelector('li.tile-press-half source[media="(min-width: 781px)"]');
  assert.equal(new URL(source.srcset).searchParams.get('width'), '1250');
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
  const extraTitle = makeBlock(['sq', 'sq']);
  extraTitle.firstElementChild.lastElementChild.append('Extra');
  await assert.rejects(decorate(extraTitle), /linked title/);
  const twoLinks = makeBlock(['sq', 'sq']);
  twoLinks.firstElementChild.lastElementChild.append(twoLinks.querySelector('a').cloneNode(true));
  await assert.rejects(decorate(twoLinks), /linked title/);
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
  block.querySelector('img').src = 'https://example.com/media.jpg?width=750';
  await decorate(block);
  assert.equal(block.querySelector('li').classList.contains('tile-sq'), false);
  assert.equal(block.querySelector('.card-teaser-body').textContent.trim(), 'sq');
  const sources = [...block.querySelectorAll('source[type="image/webp"]')];
  assert.deepEqual(sources.map((source) => new URL(source.srcset).searchParams.get('width')), ['750', '500']);
});

test('series directory cards do not zoom on hover or keyboard focus; other cards keep the zoom (SKODA-229)', async () => {
  const strip = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
  const cards = strip(await readFile(new URL('./cards.css', import.meta.url), 'utf8'));
  const teaser = strip(await readFile(new URL('../../styles/card-teaser.css', import.meta.url), 'utf8'));
  const rule = cards.match(/([^{}]*\.cards\.series-directory \.card-teaser:hover[^{}]*)\{([^}]*)\}/);
  assert.ok(rule, 'the series directory has its own hover rule');
  assert.match(rule[1], /\.cards\.series-directory \.card-teaser:has\(:focus-visible\) \.card-teaser-image img/);
  assert.match(rule[2], /scale:\s*none/);
  // the shared zoom is untouched
  assert.match(teaser, /\.card-teaser:hover \.card-teaser-image img,\s*\.card-teaser:has\(:focus-visible\) \.card-teaser-image img\s*\{\s*scale:\s*1\.02/);
});
