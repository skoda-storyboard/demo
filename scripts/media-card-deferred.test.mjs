/*
 * The media card's cart binding stays off the first render (SKODA-505a review, item 1):
 * a media listing is the first section of /en/images and /en/videos, so its add controls bind
 * to the cart only after the page has loaded, or at once on a first hover / focus / click.
 * A click before then is replayed; Space works before and after binding, once.
 * Its own file: the "page loaded" wait is module state, and this needs a page still loading.
 * Run: node --test scripts/media-card-deferred.test.mjs
 */
/* global globalThis */
/* eslint-disable import/no-extraneous-dependencies */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<main></main>', { url: 'https://example.com/en/images' });
let readyState = 'loading';
Object.defineProperty(dom.window.document, 'readyState', { configurable: true, get: () => readyState });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
// the store keeps its state in localStorage; a fresh one per run
dom.window.localStorage.clear();

const { mediaActions } = await import('./media-card.js');
const cart = await import('./media-cart.js');

const tick = (ms = 0) => new Promise((r) => { setTimeout(r, ms); });
const original = (name) => `https://cdn.skoda-storyboard.com/2026/08/${name}`;
const card = (name) => {
  const el = mediaActions({
    template: 'video', id: name, mp4: original(`${name}.mp4`), poster: `/en/${name}.jpg`,
  }, name);
  document.querySelector('main').append(el);
  return el.querySelector('.media-card-button.add');
};
const click = (el) => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
const space = (el) => {
  const e = new window.KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
  el.dispatchEvent(e);
  return e;
};

test('while the page loads, a rendered control is not bound, even with the cart module loaded', async () => {
  const add = card('a');
  await tick(20);
  assert.equal(add.hasAttribute('data-cart-control'), false);
  assert.equal(add.getAttribute('aria-disabled'), 'true');
});

test('a hover before the page has loaded binds that control at once', async () => {
  const add = card('b');
  add.dispatchEvent(new window.Event('pointerenter'));
  await tick(20);
  assert.equal(add.hasAttribute('data-cart-control'), true);
  assert.equal(add.hasAttribute('aria-disabled'), false);
});

// Each activation the store handles is an add attempt; here (no index to resolve the link in
// jsdom) every attempt ends in one `media-cart:refused`, so they count the store's handling.
const attempts = (el) => {
  const seen = [];
  el.addEventListener('media-cart:refused', (e) => seen.push(e.detail.reason));
  return seen;
};

test('a hover that binds a control also starts the cart\'s link check, as at render', async () => {
  const warned = [];
  const { warn } = console; // eslint-disable-line no-console
  console.warn = (...args) => warned.push(String(args[0])); // eslint-disable-line no-console
  try {
    const add = card('w');
    add.dispatchEvent(new window.Event('pointerenter'));
    await tick(50);
    // no index in jsdom: the check runs and reports it couldn't load the index
    assert.ok(warned.some((w) => w.includes('links not checked')), 'the link check ran on that first hover');
  } finally {
    console.warn = warn; // eslint-disable-line no-console
  }
});

test('a click before binding is not lost: the cart loads and the click is replayed', async () => {
  const add = card('c');
  const seen = attempts(add);
  assert.equal(click(add), false, 'the # link never navigates');
  await tick(50);
  assert.equal(add.hasAttribute('data-cart-control'), true);
  assert.equal(seen.length, 1, 'the replayed click reached the cart once');
});

test('Space before binding scrolls nothing and is handled once; Space once bound, once', async () => {
  const add = card('d');
  const seen = attempts(add);
  assert.equal(space(add).defaultPrevented, true, 'no page scroll before the cart binds');
  await tick(50);
  assert.equal(seen.length, 1, 'the Space before binding reached the cart once');
  assert.equal(space(add).defaultPrevented, true, 'no page scroll once bound');
  await tick(50);
  assert.equal(seen.length, 2, 'one more attempt, not two (media-card + cart both listen)');
  assert.equal(cart.getCart().count, 0);
});

test('once the page has loaded, the remaining controls bind on their own', async () => {
  const add = card('e');
  await tick(20);
  assert.equal(add.hasAttribute('data-cart-control'), false, 'still waiting for the load');
  readyState = 'complete';
  window.dispatchEvent(new window.Event('load'));
  await tick(30);
  assert.equal(add.hasAttribute('data-cart-control'), true);
  assert.equal(add.hasAttribute('aria-disabled'), false);
});
