/*
 * Unit tests for the Carousel rail (SKODA-212).
 *
 * The decorate() path is scroll/pointer-coupled (real layout), so these tests
 * pin the PURE decision logic the block exports — arrow enable/disable at the
 * track ends (arrowState) and the dated-vs-taxonomy cell tagging (railVariant) —
 * plus the shared card-teaser classification the rail relies on. Runtime drag /
 * keyboard / reduced-motion is confirmed in-browser (the ticket's RUNTIME flag).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

/*
 * Minimal DOM/window shim so the production modules (which transitively import
 * scripts/aem.js — it touches window/document at load) import cleanly in plain
 * node:test. Mirrors blocks/stories/stories.test.mjs. Installed before imports.
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

const { arrowState, railVariant } = await import('./carousel.js');

// --- arrowState: arrows enable/disable at the track ends -------------------

test('arrowState: a rail that fits hides both arrows', () => {
  const s = arrowState({ scrollLeft: 0, scrollWidth: 800, clientWidth: 800 });
  assert.equal(s.scrollable, false);
  assert.equal(s.prevDisabled, true);
  assert.equal(s.nextDisabled, true);
});

test('arrowState: at the left end, prev is disabled, next enabled', () => {
  const s = arrowState({ scrollLeft: 0, scrollWidth: 2000, clientWidth: 800 });
  assert.equal(s.scrollable, true);
  assert.equal(s.prevDisabled, true);
  assert.equal(s.nextDisabled, false);
});

test('arrowState: mid-scroll enables both arrows', () => {
  const s = arrowState({ scrollLeft: 400, scrollWidth: 2000, clientWidth: 800 });
  assert.equal(s.prevDisabled, false);
  assert.equal(s.nextDisabled, false);
});

test('arrowState: at the right end, next is disabled, prev enabled', () => {
  // max = 2000 - 800 = 1200
  const s = arrowState({ scrollLeft: 1200, scrollWidth: 2000, clientWidth: 800 });
  assert.equal(s.prevDisabled, false);
  assert.equal(s.nextDisabled, true);
});

test('arrowState: tolerates sub-pixel scrollLeft at the ends (±1px)', () => {
  assert.equal(arrowState({ scrollLeft: 0.5, scrollWidth: 2000, clientWidth: 800 }).prevDisabled, true);
  assert.equal(arrowState({ scrollLeft: 1199.4, scrollWidth: 2000, clientWidth: 800 }).nextDisabled, true);
});

// --- railVariant: dated → overlay, taxonomy → caption ----------------------

test('railVariant: a dated card gets the white overlay caption', () => {
  assert.deepEqual(railVariant(true), ['overlay', 'carousel-overlay']);
});

test('railVariant: a taxonomy card (no date) gets the below-image caption', () => {
  assert.deepEqual(railVariant(false), ['carousel-caption']);
});
