/*
 * Unit tests for the Carousel rail (SKODA-212).
 *
 * The decorate() path is scroll/pointer-coupled (real layout), so these tests
 * pin the PURE decision logic the block exports — arrow enable/disable at the
 * track ends (arrowState) and the dated-vs-taxonomy cell tagging (railVariant) —
 * plus the shared card-teaser classification the rail relies on. The SKODA-212a
 * pointer gesture (dragStep / swallowClick) and its event wiring (bindDrag, on a
 * fake EventTarget track) are covered too. Real scrolling, snap and navigation
 * are confirmed in-browser with trusted input (the ticket's notes).
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

const {
  arrowState, railVariant, dotState, dragStep, swallowClick, bindDrag, DRAG_THRESHOLD,
} = await import('./carousel.js');

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

// ---- SKODA-212a: threshold drag (capture only once the press is a real drag) ----
function run(steps) {
  return steps.reduce((acc, ev) => {
    const next = dragStep(acc.state, ev);
    acc.log.push(next);
    return { state: next, log: acc.log };
  }, { state: null, log: [] });
}

test('dragStep: a click below the threshold never starts a drag (the link navigates)', () => {
  const { state, log } = run([
    { type: 'down', x: 100, scrollLeft: 0 },
    { type: 'move', x: 100 + DRAG_THRESHOLD },
    { type: 'move', x: 100 - DRAG_THRESHOLD },
    { type: 'up' },
  ]);
  assert.ok(log.every((s) => !s.startDrag && !s.dragging), 'no capture, no scroll');
  assert.equal(state.moved, false, 'the click is not swallowed');
});

test('dragStep: drag-then-release scrolls 1:1, captures once and swallows the click', () => {
  const { state, log } = run([
    { type: 'down', x: 600, scrollLeft: 40 },
    { type: 'move', x: 590 },
    { type: 'move', x: 450 },
    { type: 'move', x: 300 },
    { type: 'up' },
  ]);
  assert.equal(log.filter((s) => s.startDrag).length, 1, 'capture on the threshold-crossing move only');
  assert.equal(log[1].startDrag, true);
  assert.equal(log[3].scrollLeft, 340, 'a 300px drag scrolls 300px');
  assert.equal(state.dragging, false);
  assert.equal(state.moved, true, 'the post-drag click is suppressed');
});

test('dragStep: a new press resets moved, so the next plain click navigates', () => {
  const dragged = run([
    { type: 'down', x: 0, scrollLeft: 0 }, { type: 'move', x: -50 }, { type: 'up' },
  ]).state;
  const next = dragStep(dragged, { type: 'down', x: 10, scrollLeft: 50 });
  assert.equal(next.moved, false);
});

test('dragStep: moves without a press, and pointercancel, never drag', () => {
  assert.equal(dragStep(null, { type: 'move', x: 500 }).dragging, false);
  const s = run([
    { type: 'down', x: 0, scrollLeft: 0 }, { type: 'move', x: -40 }, { type: 'cancel' },
  ]).state;
  assert.equal(s.pressed, false);
  assert.equal(s.dragging, false);
  assert.equal(s.moved, false, 'a cancelled swipe leaves no click to swallow (keyboard Enter still works)');
});

test('dragStep: a second pointer (another finger) neither restarts nor moves the drag', () => {
  let s = dragStep(null, {
    type: 'down', id: 1, x: 300, scrollLeft: 0,
  });
  s = dragStep(s, { type: 'move', id: 1, x: 250 });
  s = dragStep(s, {
    type: 'down', id: 2, x: 900, scrollLeft: 50,
  });
  assert.equal(s.startX, 300, 'the first finger keeps the gesture');
  s = dragStep(s, { type: 'move', id: 2, x: 100 });
  assert.equal(s.scrollLeft, 50, 'moves from the second finger are ignored');
  s = dragStep(s, { type: 'up', id: 2 });
  assert.equal(s.dragging, true, 'lifting the second finger does not end the drag');
  s = dragStep(s, { type: 'up', id: 1 });
  assert.equal(s.dragging, false);
});

test('dragStep: leaving the track before the threshold drops the press (no stale jump later)', () => {
  let s = dragStep(null, { type: 'down', x: 300, scrollLeft: 0 });
  s = dragStep(s, { type: 'move', x: 302, buttons: 1 });
  s = dragStep(s, { type: 'leave' });
  assert.equal(s.pressed, false);
  // coming back with the button held (text selection from elsewhere) must not scroll
  s = dragStep(s, { type: 'move', x: 100, buttons: 1 });
  assert.equal(s.dragging, false);
  assert.equal(s.scrollLeft, undefined);
});

test('dragStep: leave during a captured drag is ignored; lost capture ends it like up', () => {
  let s = dragStep(null, { type: 'down', x: 300, scrollLeft: 0 });
  s = dragStep(s, { type: 'move', x: 200, buttons: 1 });
  s = dragStep(s, { type: 'leave' });
  assert.equal(s.dragging, true);
  s = dragStep(s, { type: 'lost' });
  assert.equal(s.dragging, false);
  assert.equal(s.moved, true, 'the click that follows is still swallowed');
});

test('dragStep: a move with no button held drops a press released outside the track', () => {
  let s = dragStep(null, { type: 'down', x: 300, scrollLeft: 0 });
  s = dragStep(s, { type: 'move', x: 100, buttons: 0 });
  assert.equal(s.pressed, false);
  assert.equal(s.dragging, false);
});

test('swallowClick: only the pointer click after a real drag, never a keyboard click', () => {
  assert.equal(swallowClick({ moved: true }, 1), true);
  assert.equal(swallowClick({ moved: true }, 0), false, 'Enter / Space (detail 0)');
  assert.equal(swallowClick({ moved: false }, 1), false);
  assert.equal(swallowClick(null, 1), false);
});

// ---- bindDrag: the real event wiring on a fake track ----------------------
function fakeTrack() {
  const track = new EventTarget();
  const classes = new Set();
  const captured = new Set();
  Object.assign(track, {
    scrollLeft: 0,
    classList: { add: (c) => classes.add(c), remove: (c) => classes.delete(c), contains: (c) => classes.has(c) },
    captureCalls: 0,
    setPointerCapture: (id) => { track.captureCalls += 1; captured.add(id); },
    hasPointerCapture: (id) => captured.has(id),
    releasePointerCapture: (id) => captured.delete(id),
    captured,
  });
  bindDrag(track);
  return track;
}

function fire(target, type, props = {}) {
  const e = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(e, {
    button: 0, buttons: 1, pointerId: 1, clientX: 0, detail: 1,
  }, props);
  target.dispatchEvent(e);
  return e;
}

test('bindDrag: a plain click is not captured and is not prevented', () => {
  const track = fakeTrack();
  fire(track, 'pointerdown', { clientX: 100 });
  fire(track, 'pointermove', { clientX: 103 });
  assert.equal(track.captureCalls, 0, 'no capture below the threshold');
  fire(track, 'pointerup', { clientX: 103, buttons: 0 });
  assert.equal(fire(track, 'click').defaultPrevented, false);
});

test('bindDrag: a drag captures once past the threshold, scrolls, and swallows only its click', () => {
  const track = fakeTrack();
  fire(track, 'pointerdown', { clientX: 600 });
  fire(track, 'pointermove', { clientX: 590 });
  assert.ok(track.captured.has(1));
  fire(track, 'pointermove', { clientX: 500 });
  assert.equal(track.captureCalls, 1, 'captured once, on the threshold-crossing move');
  assert.ok(track.classList.contains('is-dragging'));
  fire(track, 'pointermove', { clientX: 300 });
  assert.equal(track.scrollLeft, 300);
  fire(track, 'pointerup', { clientX: 300, buttons: 0 });
  assert.equal(track.captured.size, 0, 'capture released');
  assert.equal(track.classList.contains('is-dragging'), false);
  assert.equal(fire(track, 'click').defaultPrevented, true, 'the drag click is swallowed');
  assert.equal(fire(track, 'click').defaultPrevented, false, 'the next click passes');
});

test('bindDrag: a card losing touch implicit capture does not end the drag', () => {
  const track = fakeTrack();
  fire(track, 'pointerdown', { clientX: 600 });
  fire(track, 'pointermove', { clientX: 580 });
  // bubbled up from the card: its target is the card, not the track
  const e = new Event('lostpointercapture');
  Object.assign(e, { pointerId: 1 });
  Object.defineProperty(e, 'target', { value: new EventTarget() });
  track.dispatchEvent(e);
  assert.ok(track.classList.contains('is-dragging'), 'still dragging');
  fire(track, 'pointermove', { clientX: 400 });
  assert.equal(track.scrollLeft, 200);
});

test('bindDrag: keyboard click after a touch swipe is never swallowed; dragstart is prevented', () => {
  const track = fakeTrack();
  fire(track, 'pointerdown', { clientX: 600 });
  fire(track, 'pointermove', { clientX: 400 });
  fire(track, 'pointerup', { clientX: 400, buttons: 0 }); // touch: no click follows
  assert.equal(fire(track, 'click', { detail: 0 }).defaultPrevented, false);
  assert.equal(fire(track, 'dragstart').defaultPrevented, true);
});

test('bindDrag: right-click never starts a gesture', () => {
  const track = fakeTrack();
  fire(track, 'pointerdown', { clientX: 600, button: 2 });
  fire(track, 'pointermove', { clientX: 300, buttons: 2 });
  assert.equal(track.scrollLeft, 0);
  assert.equal(track.captured.size, 0);
});
