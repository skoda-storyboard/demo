/* global globalThis */
/*
 * Gallery (slider) captions (SKODA-819 review, PR #156): an authored description
 * renders under the slide's 16:9 frame; an empty cell adds nothing (no gap).
 * Runs decorate() on a jsdom block; layout-coupled behaviour (scroll, autoplay)
 * is covered in the browser.
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

let decorate = null;
if (JSDOM) {
  const { window } = new JSDOM('<!doctype html><main></main>', { url: 'http://localhost/' });
  window.hlx = { codeBasePath: '' };
  window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
  window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  ['window', 'document', 'IntersectionObserver', 'ResizeObserver', 'matchMedia', 'HTMLElement', 'Node', 'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame']
    .forEach((k) => { if (window[k] !== undefined && globalThis[k] === undefined) globalThis[k] = window[k] === window ? window : window[k]; });
  globalThis.window = window;
  globalThis.document = window.document;
  if (!globalThis.requestAnimationFrame) globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  ({ default: decorate } = await import('./gallery.js'));
}

const row = (src, caption = '') => `<div><div><picture><img src="${src}" alt="Alt ${src}"></picture></div><div>${caption}</div></div>`;
const slider = (rows) => {
  const block = document.createElement('div');
  block.className = 'gallery slider';
  block.innerHTML = rows.join('');
  document.querySelector('main').append(block);
  decorate(block);
  return block;
};
const realSlides = (block) => [...block.querySelectorAll('.gallery-slide:not(.is-clone)')];

test('an authored description renders under the image, inside its slide', { skip }, () => {
  const block = slider([
    row('a.jpg', '<p>Škoda Octavia Combi Laurin &amp; Klement</p>'),
    row('b.jpg', '<p>Škoda Octavia Long</p>'),
  ]);
  const slides = realSlides(block);
  assert.equal(slides.length, 2);
  slides.forEach((slide) => {
    const [pic, caption] = slide.children;
    assert.equal(pic.tagName, 'PICTURE', 'the image frame comes first');
    assert.ok(caption?.classList.contains('gallery-slide-caption'), 'caption follows the frame');
  });
  assert.deepEqual(slides.map((s) => s.querySelector('.gallery-slide-caption').textContent.trim()), [
    'Škoda Octavia Combi Laurin & Klement', 'Škoda Octavia Long',
  ]);
});

test('an empty caption cell adds no caption element (no gap on Epiq)', { skip }, () => {
  const block = slider([row('a.jpg'), row('b.jpg', '   '), row('c.jpg', '<p>Only this one</p>')]);
  const captions = realSlides(block).map((s) => s.querySelector('.gallery-slide-caption'));
  assert.equal(captions[0], null);
  assert.equal(captions[1], null);
  assert.equal(captions[2].textContent.trim(), 'Only this one');
});

test('the wrap-around clones carry the same caption as their slide', { skip }, () => {
  const block = slider([row('a.jpg', '<p>First</p>'), row('b.jpg', '<p>Last</p>')]);
  const clones = [...block.querySelectorAll('.gallery-slide.is-clone')];
  assert.equal(clones.length, 2);
  assert.deepEqual(clones.map((c) => c.querySelector('.gallery-slide-caption')?.textContent.trim()), ['Last', 'First']);
});
