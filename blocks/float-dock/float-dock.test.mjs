/*
 * Unit tests for the float-dock: the media-cart badge (SKODA-505b): link to the locale's cart
 * page, count bubble (hidden when empty), accessible name with the count, polite
 * announcements on change and aria-current on the cart page itself; and the dock's
 * interactions (SKODA-215): share disclosure, Escape dismissal with focus restoration,
 * and the scroll-to-top threshold.
 * Run: node --test blocks/float-dock/float-dock.test.mjs
 */
/* global globalThis */
/* eslint-disable import/no-extraneous-dependencies */
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const GLOBALS = ['window', 'document', 'fetch'];
const snapshotGlobals = () => new Map(GLOBALS.map((key) => [
  key,
  Object.getOwnPropertyDescriptor(globalThis, key),
]));
const restoreGlobals = (snapshot) => {
  snapshot.forEach((descriptor, key) => {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else delete globalThis[key];
  });
};

const originalGlobals = snapshotGlobals();
const dom = new JSDOM('<head></head><body></body>', { url: 'https://example.com/de/images' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
// what decorate() reads: placeholders (fetch + hlx) and the reduced-motion query
globalThis.fetch = async () => ({ ok: false });
window.hlx = { codeBasePath: '' };
window.matchMedia = () => ({ matches: false, addEventListener() {} });
const { default: decorate, buildCartBadge } = await import('./float-dock.js');
const ui = await import('../../scripts/media-cart-ui.js');

after(() => {
  dom.window.close();
  restoreGlobals(originalGlobals);
});

function fakeCart(count) {
  let listener;
  return {
    getCart: () => ({ count }),
    onChange(cb) { listener = cb; },
    set(n) { listener({ count: n }); },
  };
}

const load = (cart) => async () => [cart, ui];

test('badge: the cart link with a count bubble, hidden when the cart is empty', async () => {
  const slot = document.createElement('div');
  const cart = fakeCart(0);
  const link = await buildCartBadge(slot, {}, load(cart));
  assert.equal(slot.firstElementChild, link);
  assert.equal(link.getAttribute('href'), '/de/media-cart');
  assert.equal(link.className, 'float-dock-button float-dock-cart');
  assert.ok(link.querySelector('.icon.icon-media-cart'));
  const count = link.querySelector('.float-dock-cart-count');
  assert.deepEqual([count.hidden, count.textContent, count.getAttribute('aria-hidden')], [true, '', 'true']);
  assert.equal(link.getAttribute('aria-label'), 'Media cart');
  assert.equal(slot.querySelector('[role="status"], [aria-live]'), null, 'announced by the cart, not the dock');
  assert.equal(link.hasAttribute('aria-current'), false);

  cart.set(1);
  assert.deepEqual([count.hidden, count.textContent], [false, '1']);
  assert.equal(link.getAttribute('aria-label'), 'Media cart, 1 item');
  cart.set(12);
  assert.equal(link.getAttribute('aria-label'), 'Media cart, 12 items');
  cart.set(0);
  assert.equal(count.hidden, true);
});

test('badge: flagged empty (no badge shown, as on the source) until something is added', async () => {
  const slot = document.createElement('div');
  const cart = fakeCart(0);
  const link = await buildCartBadge(slot, {}, load(cart));
  assert.equal(link.hasAttribute('data-empty'), true);
  cart.set(2);
  assert.equal(link.hasAttribute('data-empty'), false);
  cart.set(0);
  assert.equal(link.hasAttribute('data-empty'), true);
});

test('badge: labels from the placeholders sheet; aria-current on the cart page', async () => {
  window.history.replaceState({}, '', '/de/media-cart/');
  const slot = document.createElement('div');
  const link = await buildCartBadge(slot, {
    mediaCartBadge: 'Medienkorb', mediaCartBadgeCount: 'Medienkorb, {n} Dateien',
  }, load(fakeCart(3)));
  assert.equal(link.getAttribute('aria-label'), 'Medienkorb, 3 Dateien');
  assert.equal(link.getAttribute('aria-current'), 'page');
});

/** A page with an undecorated dock, its own window and a controllable scrollY. */
function setup(t) {
  const previousGlobals = snapshotGlobals();
  const page = new JSDOM('<main><div class="float-dock block"></div></main>', {
    url: 'https://demo.example/en/story',
    pretendToBeVisual: true,
  });
  let scrollY = 0;
  Object.defineProperty(page.window, 'scrollY', { configurable: true, get: () => scrollY });
  page.window.hlx = { codeBasePath: '' };
  page.window.matchMedia = () => ({ matches: false, addEventListener() {} });
  page.window.requestAnimationFrame = (callback) => callback();
  page.window.scrollTo = () => {};
  globalThis.window = page.window;
  globalThis.document = page.window.document;
  globalThis.fetch = async () => ({ ok: false });
  t.after(() => {
    page.window.close();
    restoreGlobals(previousGlobals);
  });

  return {
    block: document.querySelector('.float-dock'),
    setScrollY(value) { scrollY = value; },
  };
}

test('share disclosure is labelled, keyboard dismissible, and restores focus', async (t) => {
  const { block } = setup(t);
  await decorate(block);

  const trigger = block.querySelector('.float-dock-trigger');
  const list = block.querySelector('.float-dock-share-list');
  assert.equal(trigger.getAttribute('aria-label'), 'Share this page');
  assert.equal(trigger.getAttribute('aria-controls'), list.id);
  assert.equal(trigger.getAttribute('aria-expanded'), 'false');
  assert.equal(list.inert, true);

  trigger.click();
  assert.equal(trigger.getAttribute('aria-expanded'), 'true');
  assert.equal(list.inert, false);
  list.querySelector('a').focus();
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' }));

  assert.equal(trigger.getAttribute('aria-expanded'), 'false');
  assert.equal(list.inert, true);
  assert.equal(document.activeElement, trigger);
});

test('scroll-to-top appears past the threshold and returns focus before hiding', async (t) => {
  const { block, setScrollY } = setup(t);
  await decorate(block);

  const top = block.querySelector('.float-dock-top');
  const trigger = block.querySelector('.float-dock-trigger');
  assert.equal(top.inert, true);

  setScrollY(300);
  window.dispatchEvent(new window.Event('scroll'));
  assert.equal(block.classList.contains('scrolled'), false);

  setScrollY(301);
  window.dispatchEvent(new window.Event('scroll'));
  assert.equal(block.classList.contains('scrolled'), true);
  assert.equal(top.inert, false);

  top.focus();
  setScrollY(0);
  window.dispatchEvent(new window.Event('scroll'));
  assert.equal(block.classList.contains('scrolled'), false);
  assert.equal(top.inert, true);
  assert.equal(document.activeElement, trigger);
});
