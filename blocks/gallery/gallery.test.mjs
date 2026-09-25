/*
 * Unit tests for the Gallery slider variant (SKODA-819).
 *
 * decorate() is scroll/pointer-coupled (real layout), so these tests pin the
 * PURE decisions the slider relies on: which slide a scroll offset shows,
 * including the two wrap-around clones (slidePosition), and where a mouse drag
 * lands (dragTarget). Autoplay, wrap, drag and reduced motion are confirmed
 * in the browser against the live Epiq story.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

/*
 * Minimal DOM/window shim so the block (which imports scripts/aem.js — it
 * touches window/document at load) imports cleanly in plain node:test.
 * Mirrors blocks/carousel/carousel.test.mjs. Installed before imports.
 */
globalThis.window = {
  location: { search: '', pathname: '/', href: 'http://localhost/' },
  origin: 'http://localhost',
  performance: { now: () => 0 },
  hlx: { codeBasePath: '' },
  matchMedia: () => ({ matches: false }),
  addEventListener: () => {},
};
globalThis.document = {
  currentScript: { src: 'http://localhost/scripts/scripts.js' },
  createElement: () => ({
    className: '', children: [], attributes: {},
    classList: { add() {}, contains() { return false; } },
    setAttribute() {}, append() {},
  }),
  querySelector: () => null,
  addEventListener: () => {},
};

const { slidePosition, dragTarget } = await import('./gallery.js');

const W = 839; // one slide = the track's client width (1440 box)

// --- slidePosition: looped track = [clone of last, 1..N, clone of first] ----

test('slidePosition: resting on the first real slide (physical 1) is index 0', () => {
  assert.deepEqual(slidePosition(W, W, 5), { pos: 1, index: 0, onClone: false });
});

test('slidePosition: each real slide maps to index pos - 1', () => {
  for (let i = 0; i < 5; i += 1) {
    assert.equal(slidePosition((i + 1) * W, W, 5).index, i);
  }
});

test('slidePosition: the leading clone shows the LAST slide and is flagged', () => {
  assert.deepEqual(slidePosition(0, W, 5), { pos: 0, index: 4, onClone: true });
});

test('slidePosition: the trailing clone shows the FIRST slide and is flagged', () => {
  assert.deepEqual(slidePosition(6 * W, W, 5), { pos: 6, index: 0, onClone: true });
});

test('slidePosition: mid-scroll rounds to the nearest slide (dots track the swipe)', () => {
  assert.equal(slidePosition(2.4 * W, W, 5).index, 1); // nearer physical 2
  assert.equal(slidePosition(2.6 * W, W, 5).index, 2); // nearer physical 3
});

test('slidePosition: offsets past either end clamp to the clones', () => {
  assert.equal(slidePosition(-100, W, 5).pos, 0);
  assert.equal(slidePosition(99 * W, W, 5).pos, 6);
});

test('slidePosition: sub-pixel widths still land exactly (518.7px @768)', () => {
  assert.deepEqual(slidePosition(3 * 518.7, 518.7, 8), { pos: 3, index: 2, onClone: false });
});

test('slidePosition: an unlooped track (single image) has no clones', () => {
  assert.deepEqual(slidePosition(0, W, 1, false), { pos: 0, index: 0, onClone: false });
});

test('slidePosition: zero width (not laid out yet) is a safe default', () => {
  assert.deepEqual(slidePosition(0, 0, 5), { pos: 1, index: 0, onClone: false });
});

// --- dragTarget: one step per drag past the threshold ----------------------

test('dragTarget: dragging left past the threshold goes to the next slide', () => {
  assert.equal(dragTarget(2, -60), 3);
});

test('dragTarget: dragging right past the threshold goes to the previous slide', () => {
  assert.equal(dragTarget(2, 60), 1);
});

test('dragTarget: a short drag snaps back to where it started', () => {
  assert.equal(dragTarget(2, -20), 2);
  assert.equal(dragTarget(2, 20), 2);
});

test('dragTarget: from either end it steps onto a clone (wrap happens on settle)', () => {
  assert.equal(dragTarget(0, 80), -1);
  assert.equal(dragTarget(4, -80), 5);
});
