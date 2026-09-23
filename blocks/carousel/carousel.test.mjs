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

const { arrowState, railVariant, dotState } = await import('./carousel.js');

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

// --- dotState: active dot from reachable scroll (SKODA-212 review P2) -------

test('dotState: left edge selects the first dot', () => {
  const s = dotState({ scrollLeft: 0, scrollWidth: 2000, clientWidth: 800 });
  assert.equal(s.active, 0);
});

test('dotState: right edge selects the LAST dot on a partial final page', () => {
  // The reported regression: 6-card desktop rail, scrollWidth 1374, viewport 944.
  // max scroll = 430 (< a full page-width), so round(430/944)=0 would wrongly
  // keep dot 0 active. dotState maps the right edge to pages-1.
  const s = dotState({ scrollLeft: 430, scrollWidth: 1374, clientWidth: 944 });
  assert.equal(s.pages, 2); // ceil(1374/944)
  assert.equal(s.active, 1); // last dot, not 0
});

test('dotState: a rail that fits is a single page, dot 0', () => {
  const s = dotState({ scrollLeft: 0, scrollWidth: 800, clientWidth: 800 });
  assert.equal(s.pages, 1);
  assert.equal(s.active, 0);
});

test('dotState: mid-scroll on a 3-page rail selects the middle dot', () => {
  // pages = ceil(2400/800)=3; clicking dot 1 targets 1*800=800 → round(800/800)=1
  const s = dotState({ scrollLeft: 800, scrollWidth: 2400, clientWidth: 800 });
  assert.equal(s.pages, 3);
  assert.equal(s.active, 1);
});

test('dotState: interior dot uses the SAME coordinate system as its click target (9-card rail)', () => {
  // Reported P2 mismatch: 9-card desktop rail, scrollWidth 2072, viewport 944.
  // Clicking middle dot 1 scrolls to 1*944=944. Active state must read that back
  // as dot 1 — an even interpolation across max (1128) gives round(944/1128*2)=2.
  const s = dotState({ scrollLeft: 944, scrollWidth: 2072, clientWidth: 944 });
  assert.equal(s.pages, 3); // ceil(2072/944)
  assert.equal(s.active, 1); // matches the click target, not 2
});

test('dotState: the 9-card rail right edge still selects the last dot', () => {
  // max = 2072 - 944 = 1128 (the last dot's clamped target)
  const s = dotState({ scrollLeft: 1128, scrollWidth: 2072, clientWidth: 944 });
  assert.equal(s.active, 2);
});

test('dotState: active never exceeds pages-1', () => {
  const s = dotState({ scrollLeft: 99999, scrollWidth: 1374, clientWidth: 944 });
  assert.equal(s.active, s.pages - 1);
});
