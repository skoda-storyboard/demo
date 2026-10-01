/*
 * Unit tests for the media-cart block, the cart page (SKODA-505b): grouping, cards, remove
 * with focus kept, empty package, the empty state and the package download (progress, cancel,
 * files that failed). The store is a fake; the real one is covered in scripts/media-cart.test.mjs.
 * Run: node --test blocks/media-cart/media-cart.test.mjs
 */
/* global globalThis */
/* eslint-disable import/no-extraneous-dependencies */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<head></head><body><main></main></body>', { url: 'https://example.com/en/media-cart' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const { renderCart, fileType } = await import('./media-cart.js');

const item = (name, kind, extra = {}) => ({
  id: `/content/dam/storyboard/en/${name}`,
  url: `https://dam.example/content/dam/storyboard/en/${name}`,
  filename: name,
  title: `Title ${name}`,
  bytes: 2048,
  kind,
  ...extra,
});

function fakeCart(initial) {
  let items = [...initial];
  const listeners = new Set();
  const emit = () => listeners.forEach((cb) => cb());
  const cart = {
    downloads: [],
    getCart: () => ({
      items,
      count: items.length,
      bytes: items.reduce((sum, it) => sum + it.bytes, 0),
      limits: { items: 80, bytes: 1024 ** 3 },
    }),
    remove(id) {
      items = items.filter((it) => it.id !== id);
      emit();
    },
    clear() {
      items = [];
      emit();
    },
    onChange(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    download: async (opts) => {
      cart.downloads.push(opts);
      return cart.result(opts);
    },
    result: async () => ({ mode: 'zip', filename: 'x.zip', failed: [] }),
  };
  return cart;
}

const pictures = [];
const picture = (src) => {
  pictures.push(src);
  const p = document.createElement('picture');
  p.dataset.src = src;
  return p;
};

function mount(items) {
  const block = document.createElement('div');
  block.className = 'media-cart block';
  block.innerHTML = '<div><div>authored</div></div>';
  document.querySelector('main').replaceChildren(block);
  const cart = fakeCart(items);
  renderCart(block, { cart, picture });
  const $ = (sel) => block.querySelector(sel);
  const $$ = (sel) => [...block.querySelectorAll(sel)];
  return {
    block, cart, $, $$,
  };
}

const tick = () => new Promise((r) => { setTimeout(r, 0); });

test('fileType', () => {
  assert.deepEqual(['a.jpg', 'b.final.PDF', 'noext', '.hidden', 'trail.', ''].map((n) => fileType(n)), ['JPG', 'PDF', '', '', '', '']);
});

test('groups by kind (images, videos, documents, other) with a heading, count and cards', () => {
  const { $, $$ } = mount([
    item('clip.mp4', 'video', { thumb: 'https://cdn.example/poster.jpg' }),
    item('a.jpg', 'image', { thumb: '/en/press/media_1.jpg?width=750' }),
    item('spec.pdf', 'document'),
    item('b.jpg', 'image'),
    item('odd.bin', 'weird'),
  ]);
  assert.equal($('.media-cart-actions').children.length, 3);
  assert.deepEqual($$('.media-cart-group-title').map((h) => [h.tagName, h.textContent]), [
    ['H2', 'Images'], ['H2', 'Videos'], ['H2', 'Documents'], ['H2', 'Other files'],
  ]);
  assert.equal($('.media-cart-group-image').getAttribute('aria-labelledby'), 'media-cart-image');
  assert.deepEqual($$('.media-cart-group-image .media-cart-title').map((p) => p.textContent), ['Title a.jpg', 'Title b.jpg']);
  assert.equal($('.media-cart-count').textContent, '5 / 80 files · 10 KB');
  assert.ok($('.media-cart-limit'), 'the package limit is stated');
  assert.equal($('.media-cart-empty').hidden, true);
  assert.equal($('.media-cart-download').disabled, false);

  const [imgA, imgB] = $$('.media-cart-group-image .media-cart-thumb');
  assert.equal(imgA.querySelector('picture').dataset.src, '/en/press/media_1.jpg?width=750');
  assert.equal(imgB.classList.contains('media-cart-thumb-empty'), true);
  assert.equal(imgB.textContent, 'JPG');
  const poster = $('.media-cart-group-video img');
  assert.deepEqual([poster.src, poster.alt, poster.loading], ['https://cdn.example/poster.jpg', '', 'lazy']);
  assert.equal($('.media-cart-group-image .media-cart-meta').textContent, 'JPG · 2 KB');
  assert.equal($('.authored'), null);
});

test('remove: the visible "Original" leads its name; focus moves to the next card, then the empty message', () => {
  const { $, $$, cart } = mount([item('a.jpg', 'image'), item('b.jpg', 'image'), item('c.pdf', 'document')]);
  const [first] = $$('.media-cart-remove');
  assert.equal(first.type, 'button');
  assert.equal(first.textContent, 'Original, Remove Title a.jpg from the media cart');
  const cardB = $$('.media-cart-item')[1];

  first.click();
  assert.equal(cart.getCart().count, 2);
  assert.equal(document.activeElement, $$('.media-cart-remove')[0]);
  assert.equal($$('.media-cart-item')[0], cardB, 'cards are reused, not rebuilt');

  $$('.media-cart-remove')[1].click();
  assert.equal($('.media-cart-group-document'), null, 'an emptied group goes away');
  assert.equal(document.activeElement, $$('.media-cart-remove')[0], 'the last one: focus goes back');

  $$('.media-cart-remove')[0].click();
  assert.equal($('.media-cart-empty').hidden, false);
  assert.equal(document.activeElement, $('.media-cart-empty'));
  assert.equal($('.media-cart-count').textContent, '0 / 80 files · 0 B');
  assert.equal($('.media-cart-download').disabled, true);
  assert.equal($('.media-cart-clear').disabled, true);
});

test('an empty cart says so and offers nothing to press', () => {
  const { $ } = mount([]);
  assert.equal($('.media-cart-empty').hidden, false);
  assert.equal($('.media-cart-empty').textContent, 'No downloads');
  assert.equal($('.media-cart-groups').children.length, 0);
  assert.equal($('.media-cart-download').disabled, true);
  assert.equal($('.media-cart-clear').disabled, true);
});

test('empty package clears the cart and focuses the empty message', () => {
  const { $, cart } = mount([item('a.jpg', 'image'), item('b.jpg', 'image')]);
  $('.media-cart-clear').click();
  assert.equal(cart.getCart().count, 0);
  assert.equal($('.media-cart-empty').hidden, false);
  assert.equal(document.activeElement, $('.media-cart-empty'));
});

test('changes from elsewhere (another tab, the badge) re-render the page', () => {
  const { $, $$, cart } = mount([item('a.jpg', 'image'), item('b.jpg', 'image')]);
  cart.remove(item('a.jpg').id);
  assert.equal($$('.media-cart-item').length, 1);
  assert.equal($('.media-cart-count').textContent, '1 / 80 files · 2 KB');
});

test('re-rendering keeps the focus on a card that stays (another tab, a finished download)', async () => {
  const { $, $$, cart } = mount([item('a.jpg', 'image'), item('b.mp4', 'video'), item('c.jpg', 'image')]);
  const keep = $$('.media-cart-remove')[1];
  keep.focus();
  cart.remove(item('a.jpg').id);
  assert.equal(document.activeElement, keep);
  $('.media-cart-download').click();
  keep.focus();
  await tick();
  await tick();
  assert.equal(document.activeElement, keep, 'the end of the download leaves the focus alone');
});

test('download package: progress per file, then ready; files that failed are listed', async () => {
  const { $, $$, cart } = mount([item('a.jpg', 'image'), item('b.jpg', 'image'), item('c.jpg', 'image')]);
  let finish;
  cart.result = (opts) => new Promise((resolve) => {
    opts.onProgress({
      done: 0, total: 3, loaded: 100, totalBytes: 6144,
    });
    opts.onProgress({
      done: 0, total: 3, loaded: 500, totalBytes: 6144,
    });
    finish = () => resolve({ mode: 'zip', filename: 'x.zip', failed: [{ item: item('c.jpg'), reason: 'HTTP 500' }] });
  });
  $('.media-cart-download').click();
  await tick();
  assert.equal($('.media-cart-download').textContent, 'Cancel');
  assert.equal($('.media-cart-clear').disabled, true, 'no emptying while zipping');
  assert.equal($('.media-cart-status').getAttribute('role'), 'status');
  assert.equal($('.media-cart-status').textContent, 'Preparing your package: 0 of 3 files');
  assert.equal($('.media-cart-bar').hidden, false);
  finish();
  await tick();
  assert.equal($('.media-cart-download').textContent, 'Download package');
  assert.equal($('.media-cart-bar').hidden, true);
  assert.equal($('.media-cart-status').textContent, 'Your package is ready. 1 file couldn\'t be added to the package:');
  assert.deepEqual($$('.media-cart-failed li').map((li) => li.textContent), ['Title c.jpg']);
  assert.equal($('.media-cart-failed').hidden, false);
  assert.equal($('.media-cart-clear').disabled, false);
});

test('download package: the same button cancels; a failure says so', async () => {
  const { $, cart } = mount([item('a.jpg', 'image'), item('b.jpg', 'image')]);
  cart.result = ({ signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
  });
  $('.media-cart-download').click();
  await tick();
  $('.media-cart-download').click();
  await tick();
  assert.equal(cart.downloads[0].signal.aborted, true);
  assert.equal($('.media-cart-status').textContent, 'The download was cancelled.');
  assert.equal($('.media-cart-download').textContent, 'Download package');

  cart.result = async () => { throw new Error('zip'); };
  $('.media-cart-download').click();
  await tick();
  assert.equal($('.media-cart-status').textContent, 'The package couldn\'t be prepared. Please try again.');

  cart.result = async () => ({ mode: 'zip', filename: null, failed: [{ item: item('a.jpg') }, { item: item('b.jpg') }] });
  $('.media-cart-download').click();
  await tick();
  assert.match($('.media-cart-status').textContent, /^The package couldn't be prepared\. .* 2 files/);
});
