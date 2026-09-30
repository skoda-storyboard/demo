/* global globalThis */
/*
 * Gallery (story) — SKODA-216: the story in-body gallery (source .sb-gallery).
 * storyStrip() pins which images the strip shows without a DOM; the jsdom tests
 * run decorate() for the rendered shape and the lightbox wiring (lead opens image
 * 1, thumb k opens k + 1, wrap-around, one set per block, focus trap with caption
 * links, no media-cart chrome). Geometry is measured in the browser against the
 * source.
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

if (JSDOM) {
  const { window } = new JSDOM('<!doctype html><main><h1>Story title</h1></main>', { url: 'http://localhost/' });
  window.hlx = { codeBasePath: '' };
  window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
  window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  globalThis.window = window;
  globalThis.document = window.document;
} else {
  // minimal shim so the module (scripts/aem.js touches window/document) imports
  globalThis.window = {
    location: { search: '', pathname: '/', href: 'http://localhost/' },
    origin: 'http://localhost',
    hlx: { codeBasePath: '' },
    matchMedia: () => ({ matches: false }),
    addEventListener: () => {},
  };
  globalThis.document = {
    currentScript: { src: 'http://localhost/scripts/scripts.js' },
    querySelector: () => null,
    addEventListener: () => {},
  };
}

const { default: decorate, storyStrip } = await import('./gallery.js');

// --- storyStrip: the images after the lead, at most 4 --------------------------

test('storyStrip: the lead is never repeated; 5 images → images 2-5', () => {
  assert.deepEqual(storyStrip(5), [1, 2, 3, 4]);
  assert.deepEqual(storyStrip(3), [1, 2]);
});

test('storyStrip: 1 or 0 images → no strip; more than 5 → still 4 thumbs', () => {
  assert.deepEqual(storyStrip(1), []);
  assert.deepEqual(storyStrip(0), []);
  assert.deepEqual(storyStrip(9), [1, 2, 3, 4]);
  assert.deepEqual(storyStrip(9, 2), [1, 2]);
});

// --- decorate(): rendered shape + lightbox wiring -------------------------------

const row = (i, caption = '') => `<div><div><picture><img src="/media_${i}.jpg" alt="Image ${i}"></picture></div><div>${caption}</div></div>`;
const story = (count, caption = () => '') => {
  const block = document.createElement('div');
  block.className = 'gallery story';
  block.innerHTML = Array.from({ length: count }, (_, i) => row(i + 1, caption(i + 1))).join('');
  document.querySelector('main').append(block);
  decorate(block);
  return block;
};
const lead = (block) => block.querySelector('.gallery-story-lead');
const thumbs = (block) => [...block.querySelectorAll('.gallery-story-thumb')];
const overlay = (block) => block.querySelector('.gallery-overlay');
const count = (block) => block.querySelector('.gallery-lightbox-count').textContent;
const key = (k, shiftKey = false) => document.dispatchEvent(
  new window.KeyboardEvent('keydown', { key: k, shiftKey, cancelable: true }),
);

test('5 rows render the lead + a badge and a strip of images 2-5', { skip }, () => {
  const block = story(5);
  assert.equal(lead(block).tagName, 'BUTTON');
  assert.equal(lead(block).getAttribute('aria-label'), 'Open gallery, 5 images');
  assert.equal(lead(block).querySelector('img').alt, 'Image 1');
  const badge = lead(block).querySelector('.gallery-story-count');
  assert.equal(badge.getAttribute('aria-hidden'), 'true');
  assert.equal(badge.textContent, '5');
  assert.deepEqual(thumbs(block).map((t) => t.querySelector('img').alt), ['Image 2', 'Image 3', 'Image 4', 'Image 5']);
  assert.equal(thumbs(block)[0].getAttribute('aria-label'), 'Open image 2: Image 2');
  assert.equal(block.querySelector('.gallery-main, .gallery-thumbs, .gallery-preview-grid'), null);
});

test('the lead opens image 1, thumb k opens image k + 1; next wraps 5/5 → 1/5', { skip }, () => {
  const block = story(5);
  lead(block).focus();
  lead(block).click();
  assert.equal(overlay(block).hidden, false);
  assert.equal(count(block), '1/5');
  assert.equal(block.querySelector('.gallery-lightbox-controls').hidden, false, 'navigable set');
  key('Escape');
  assert.equal(overlay(block).hidden, true, 'Escape closes');
  assert.equal(document.activeElement, lead(block), 'focus returns to the lead');

  thumbs(block)[2].click();
  assert.equal(count(block), '4/5');
  block.querySelector('.gallery-lightbox-next').click();
  assert.equal(count(block), '5/5');
  block.querySelector('.gallery-lightbox-next').click();
  assert.equal(count(block), '1/5', 'wraps to the first image');
  key('ArrowLeft');
  assert.equal(count(block), '5/5', 'ArrowLeft wraps back');
  assert.equal(block.querySelector('.gallery-lightbox-count').getAttribute('aria-label'), 'Image 5 of 5');
  key('Escape');
  assert.equal(document.activeElement, thumbs(block)[2]);
});

test('the dialog is labelled by the story title; no media-cart actions or tag chips', { skip }, () => {
  const block = story(3, (i) => (i === 1 ? '<p>2026 · Favorit</p>' : ''));
  lead(block).click();
  const dialog = overlay(block);
  assert.equal(dialog.getAttribute('role'), 'dialog');
  assert.equal(dialog.getAttribute('aria-modal'), 'true');
  const title = document.getElementById(dialog.getAttribute('aria-labelledby'));
  assert.equal(title.textContent, 'Story title');
  assert.equal(block.querySelector('.gallery-lightbox-caption').textContent, '2026 · Favorit');
  assert.equal(block.querySelector('.gallery-lightbox-actions, .gallery-lightbox-tag'), null);
  key('Escape');
});

test('two galleries on a page: separate sets and no shared ids', { skip }, () => {
  const a = story(5);
  const b = story(3);
  thumbs(b)[1].click();
  assert.equal(overlay(a).hidden, true, 'the other gallery stays closed');
  assert.equal(count(b), '3/3');
  key('ArrowRight');
  assert.equal(count(b), '1/3', 'wraps within its own set');
  key('Escape');
  const ids = [...document.querySelectorAll('[id]')].map((el) => el.id);
  assert.equal(new Set(ids).size, ids.length, 'ids are unique');
});

test('the focus trap includes an authored caption link', { skip }, () => {
  const block = story(2, (i) => (i === 1 ? '<p>See <a href="/en/emobility">more</a></p>' : ''));
  const link = () => block.querySelector('.gallery-lightbox-caption a');
  const arrows = () => [...block.querySelectorAll('.gallery-lightbox-prev, .gallery-lightbox-next')];
  // jsdom has no layout: report every control as rendered except the two arrows, so
  // the caption link is the last focusable and Tab from it must wrap to the close
  const { getClientRects } = window.Element.prototype;
  window.Element.prototype.getClientRects = function rects() {
    return arrows().includes(this) ? [] : [{}];
  };
  try {
    lead(block).click();
    const close = block.querySelector('.gallery-lightbox-close');
    assert.equal(document.activeElement, close, 'focus moves into the dialog');
    link().focus();
    key('Tab');
    assert.equal(document.activeElement, close, 'Tab from the link wraps to the close');
    key('Tab', true);
    assert.equal(document.activeElement, link(), 'Shift+Tab from the close wraps to the link');
    key('Escape');
  } finally {
    window.Element.prototype.getClientRects = getClientRects;
  }
});

test('changing image from a focused caption link keeps focus inside the dialog', { skip }, () => {
  const block = story(3, (i) => (i === 1 ? '<p>See <a href="/en/emobility">more</a></p>' : ''));
  lead(block).click();
  const link = block.querySelector('.gallery-lightbox-caption a');
  link.focus();
  assert.equal(document.activeElement, link);
  key('ArrowRight');
  assert.equal(count(block), '2/3');
  assert.equal(document.activeElement, block.querySelector('.gallery-lightbox-next'), 'forward → next arrow');
  // back to image 1 (caption link again), then backwards from the link → prev arrow
  key('ArrowLeft');
  block.querySelector('.gallery-lightbox-caption a').focus();
  key('ArrowLeft');
  assert.equal(count(block), '3/3');
  assert.equal(document.activeElement, block.querySelector('.gallery-lightbox-prev'), 'back → prev arrow');
  assert.ok(overlay(block).contains(document.activeElement));
  key('Escape');
});

test('a single image: no strip, opens without prev/next; no rows leave it empty', { skip }, () => {
  const one = story(1);
  assert.equal(one.querySelector('.gallery-story-strip'), null);
  lead(one).click();
  assert.equal(one.querySelector('.gallery-lightbox-controls').hidden, true);
  key('Escape');
  const none = story(0);
  assert.equal(none.children.length, 0);
});
