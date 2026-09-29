/* global globalThis */
/*
 * Gallery (preview) — SKODA-223: the press-release sidebar "Images" preview.
 * previewPlan() pins the "+N" decision without a DOM; the jsdom tests run
 * decorate() for the rendered shape and the lightbox wiring (open from every
 * thumb and the pill, Escape closes, focus returns). Geometry is measured in
 * the browser against the source.
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
  const { window } = new JSDOM('<!doctype html><main></main>', { url: 'http://localhost/' });
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

const { default: decorate, previewPlan } = await import('./gallery.js');

// --- previewPlan: at most 4 thumbs, "+N" for the hidden rest -------------------

test('previewPlan: up to 4 images show them all, no pill', () => {
  [0, 1, 2, 3, 4].forEach((n) => {
    assert.deepEqual(previewPlan(n), { shown: n, more: 0, moreIndex: -1 });
  });
});

test('previewPlan: 6 images show 4 thumbs and "+2", the pill opens the 5th', () => {
  assert.deepEqual(previewPlan(6), { shown: 4, more: 2, moreIndex: 4 });
});

test('previewPlan: 5 images → "+1"; the cap is configurable', () => {
  assert.deepEqual(previewPlan(5), { shown: 4, more: 1, moreIndex: 4 });
  assert.deepEqual(previewPlan(5, 2), { shown: 2, more: 3, moreIndex: 2 });
});

// --- decorate(): rendered shape + lightbox wiring -------------------------------

const row = (i, caption = '') => `<div><div><picture><img src="/media_${i}.jpg" alt="Image ${i}"></picture></div><div>${caption}</div></div>`;
const preview = (count, caption = (i) => `Caption ${i}`) => {
  const block = document.createElement('div');
  block.className = 'gallery preview';
  block.innerHTML = Array.from({ length: count }, (_, i) => row(i + 1, caption(i + 1))).join('');
  document.querySelector('main').append(block);
  decorate(block);
  return block;
};
const thumbs = (block) => [...block.querySelectorAll('.gallery-preview-thumb')];
const pill = (block) => block.querySelector('.gallery-preview-more');
const overlay = (block) => block.querySelector('.gallery-overlay');
const esc = () => document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' }));

test('6 rows render 4 thumbs and a "+2" pill on the 4th, no main stage', { skip }, () => {
  const block = preview(6);
  assert.equal(thumbs(block).length, 4);
  assert.equal(block.querySelector('.gallery-main, .gallery-thumbs, .gallery-thumbs-heading'), null);
  assert.equal(pill(block).textContent, '+2');
  assert.equal(pill(block).getAttribute('aria-label'), 'Show 2 more images');
  assert.equal(pill(block).closest('li'), thumbs(block)[3].closest('li'));
});

test('4 rows (the M1 maximum) render 4 thumbs and no pill', { skip }, () => {
  const block = preview(4);
  assert.equal(thumbs(block).length, 4);
  assert.equal(pill(block), null);
});

test('thumbs are labelled buttons; captions are not rendered on the page', { skip }, () => {
  const block = preview(3);
  thumbs(block).forEach((btn, i) => {
    assert.equal(btn.tagName, 'BUTTON');
    assert.equal(btn.type, 'button');
    assert.equal(btn.getAttribute('aria-label'), `Open image ${i + 1}: Image ${i + 1}`);
  });
  assert.equal(block.querySelector('.gallery-preview-grid').textContent.includes('Caption'), false);
});

test('every thumb opens the lightbox at its image; Escape closes and returns focus', { skip }, () => {
  const block = preview(6);
  thumbs(block).forEach((btn, i) => {
    btn.focus();
    btn.click();
    assert.equal(overlay(block).hidden, false, `thumb ${i + 1} opens`);
    assert.equal(block.querySelector('.gallery-lightbox-count').textContent, `${i + 1} / 6`);
    assert.equal(block.querySelector('.gallery-lightbox-caption').textContent, `Caption ${i + 1}`);
    esc();
    assert.equal(overlay(block).hidden, true, 'Escape closes');
    assert.equal(document.activeElement, btn, 'focus returns to the thumb');
  });
});

test('the pill opens the lightbox at the 5th image, navigable to the 6th', { skip }, () => {
  const block = preview(6);
  pill(block).click();
  assert.equal(overlay(block).hidden, false);
  assert.equal(block.querySelector('.gallery-lightbox-count').textContent, '5 / 6');
  block.querySelector('.gallery-lightbox-next').click();
  assert.equal(block.querySelector('.gallery-lightbox-count').textContent, '6 / 6');
  esc();
  assert.equal(document.activeElement, pill(block));
});

test('a single image opens without prev/next; no rows leave the block empty', { skip }, () => {
  const one = preview(1);
  thumbs(one)[0].click();
  assert.equal(one.querySelector('.gallery-lightbox-controls').hidden, true);
  esc();
  const none = preview(0);
  assert.equal(none.children.length, 0);
});

test('phones: the details toggle opens the caption panel; Escape closes it before the lightbox', { skip }, () => {
  const block = preview(3);
  thumbs(block)[0].click();
  const btn = block.querySelector('.gallery-lightbox-details');
  const caption = block.querySelector('.gallery-lightbox-caption');
  assert.equal(btn.hidden, false, 'shown when the item has a caption');
  assert.equal(btn.getAttribute('aria-controls'), caption.id);
  assert.equal(btn.getAttribute('aria-expanded'), 'false', 'image first');
  assert.equal(btn.getAttribute('aria-label'), 'Show image details');
  btn.click();
  assert.equal(overlay(block).classList.contains('is-details-open'), true);
  assert.equal(btn.getAttribute('aria-expanded'), 'true');
  assert.equal(btn.getAttribute('aria-label'), 'Hide image details');
  esc();
  assert.equal(overlay(block).hidden, false, 'the first Escape closes only the panel');
  assert.equal(btn.getAttribute('aria-expanded'), 'false');
  esc();
  assert.equal(overlay(block).hidden, true, 'the second closes the lightbox');
  btn.click();
  thumbs(block)[1].click();
  assert.equal(btn.getAttribute('aria-expanded'), 'false', 'every open starts image first');
});

test('the toggle is hidden for an image without a caption; overlays get unique ids', { skip }, () => {
  const a = preview(2, () => '');
  const b = preview(2);
  thumbs(a)[0].click();
  assert.equal(a.querySelector('.gallery-lightbox-details').hidden, true);
  esc();
  const ids = [a, b].map((blk) => blk.querySelector('.gallery-lightbox-caption').id);
  assert.notEqual(ids[0], ids[1]);
});
