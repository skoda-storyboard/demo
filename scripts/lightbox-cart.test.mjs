/*
 * The lightbox's add button and the media cart (SKODA-505a): one button per overlay,
 * re-pointed at each item's original (`cartHref`); items without one (gallery images)
 * disable it; a slower bind for an earlier item never wins.
 * Run: node --test scripts/lightbox-cart.test.mjs
 */
/* global globalThis */
/* eslint-disable import/no-extraneous-dependencies */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<main></main>', { url: 'https://example.com/en/images', pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
window.hlx = { codeBasePath: '' };
window.matchMedia = () => ({ matches: false, addEventListener() {} });

const ORIGINAL = 'https://cdn.skoda-storyboard.com/2026/08/elroq.jpg';
const INDEX = {
  v: 1,
  base: '/content/dam/storyboard/',
  mimes: ['image/jpeg'],
  assets: [['en/elroq_1a2b3c4d.jpg', 1234, 0]],
  keys: { '2026/08/elroq.jpg': 0 },
};
globalThis.fetch = async (url) => {
  if (!String(url).endsWith('/scripts/media-cart-index.json')) return { ok: false, status: 404 };
  return { ok: true, status: 200, json: async () => INDEX };
};

const { buildLightbox } = await import('./lightbox.js');
const { getCart, clear } = await import('./media-cart.js');

const settle = () => new Promise((r) => { setTimeout(r, 20); });
const caption = (text) => {
  const div = document.createElement('div');
  div.innerHTML = `<p>${text}</p>`;
  return div;
};
const items = [
  {
    src: 'https://example.com/a.jpg', alt: 'Elroq', caption: caption('Elroq'), cartId: '1', cartHref: ORIGINAL,
    thumb: 'https://example.com/a-768.jpg',
  },
  { src: 'https://example.com/b.jpg', alt: 'Gallery image', caption: caption('Gallery') },
  {
    src: 'https://example.com/c.jpg', alt: 'Content image', caption: caption('Content'), cartHref: ORIGINAL, actions: false,
  },
];

function lightbox() {
  const host = document.createElement('div');
  document.querySelector('main').replaceChildren(host);
  const { open, overlay } = buildLightbox(host, items);
  // the actions row is placed into the detail panel on render
  open(0);
  return { open, add: overlay.querySelector('.gallery-lightbox-action.add') };
}

test('an item with an original gets an enabled cart toggle; one without disables it', async () => {
  const { open, add } = lightbox();
  assert.equal(add.getAttribute('aria-disabled'), 'true', 'disabled until the cart module binds it');
  await settle();
  assert.deepEqual(
    [add.hasAttribute('aria-disabled'), add.getAttribute('aria-pressed'), add.dataset.href, add.dataset.title],
    [false, 'false', ORIGINAL, 'Elroq'],
  );
  assert.equal(add.dataset.thumb, 'https://example.com/a-768.jpg', 'the card image, for the cart page (505b)');
  open(1);
  await settle();
  assert.deepEqual(
    [add.getAttribute('aria-disabled'), add.hasAttribute('aria-pressed'), add.dataset.href],
    ['true', false, undefined],
  );
  open(0);
  await settle();
  assert.equal(add.hasAttribute('aria-disabled'), false, 're-enabled for the original');
});

test('an item without actions (content images) never binds its hidden add button', async () => {
  const { open, add } = lightbox();
  await settle();
  open(2);
  await settle();
  assert.deepEqual([add.getAttribute('aria-disabled'), add.dataset.href], ['true', undefined]);
});

test('clicking the add button toggles the item in the cart', async () => {
  clear();
  const { add } = lightbox();
  await settle();
  add.click();
  await settle();
  assert.deepEqual(getCart().items.map((it) => it.id), ['/content/dam/storyboard/en/elroq_1a2b3c4d.jpg']);
  assert.equal(add.getAttribute('aria-pressed'), 'true');
  add.click();
  await settle();
  assert.equal(getCart().items.length, 0);
  assert.equal(add.getAttribute('aria-pressed'), 'false');
});

test('a slower bind for an earlier item never wins over the current one', async () => {
  const { open, add } = lightbox();
  open(1);
  await settle();
  assert.equal(add.getAttribute('aria-disabled'), 'true');
  assert.equal(add.dataset.href, undefined);
});
