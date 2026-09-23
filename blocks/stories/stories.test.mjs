/*
 * Unit tests for the Stories feed (SKODA-214).
 *
 * The block's decorate() is DOM-coupled, so these tests pin the FACET-LESS logic
 * contract the block relies on from the shared listing-logic.mjs (SKODA-402):
 * scope → sort → paginate, and the offset-only URL codec with an empty facet-key
 * list (which must leave unrelated params untouched). If 402's engine drifts in a
 * way that breaks the feed, these fail — that is the "no fork, real reuse" gate.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  scopeRows, filterRows, sortRows, paginate, decodeState, encodeState,
} from '../listing/listing-logic.mjs';

/*
 * Minimal DOM/window shim so the production modules (which transitively import
 * scripts/aem.js — it touches window/document at load) can be imported and
 * exercised in plain node:test. Enough for card-teaser's element building +
 * aem.js's RUM IIFE; NOT a full DOM. Installed before the dynamic imports below.
 */
function el() {
  // className is the source of truth; classList reads/writes it (two-way), so
  // both `.className = ...` (buildCardTeaser) and `.classList.add(...)` agree.
  const node = {
    tagName: '', className: '', children: [], attributes: {}, _text: '',
    classList: {
      add: (...c) => {
        const s = new Set(node.className.split(/\s+/).filter(Boolean));
        c.forEach((x) => s.add(x));
        node.className = [...s].join(' ');
      },
      contains: (c) => node.className.split(/\s+/).includes(c),
    },
    setAttribute(k, v) { this.attributes[k] = String(v); },
    getAttribute(k) { return this.attributes[k] ?? null; },
    append(...kids) { this.children.push(...kids); },
    querySelector() { return null; },
    set textContent(v) { this._text = String(v); },
    get textContent() { return this._text; },
  };
  return node;
}
globalThis.window = {
  location: { search: '', pathname: '/', href: 'http://localhost/' },
  origin: 'http://localhost',
  performance: { now: () => 0 },
  hlx: { codeBasePath: '' },
  addEventListener: () => {},
};
globalThis.document = {
  currentScript: { src: 'http://localhost/scripts/scripts.js' },
  createElement: (tag) => { const n = el(); n.tagName = String(tag).toUpperCase(); return n; },
  querySelector: () => null,
  addEventListener: () => {},
};
// `navigator` is a read-only getter in modern node; aem.js only calls
// navigator.sendBeacon inside a RUM handler (never at import), so we don't stub it.

// Production modules under test (not copies): the feed's exported predicate and
// the shared card-teaser primitive the block renders with. Dynamic import so the
// shim above is in place first. createOptimizedPicture (aem.js) needs richer DOM,
// so buildCardTeaser tests use image-less rows (the #3 regression path).
const { isFeatured } = await import('./stories.js');
const { buildCardTeaser, formatCardDate } = await import('../../scripts/card-teaser.js');

const NO_FACETS = [];

const rows = [
  { path: '/en/a', title: 'A', template: 'story', date: '2026-01-01' },
  { path: '/en/b', title: 'B', template: 'story', date: '2026-03-01' },
  { path: '/en/c', title: 'C', template: 'press_release', date: '2026-02-01' },
  { path: '/en/d', title: 'D', template: 'story', date: '2026-05-01' },
  { path: '/en/e', title: 'E', template: 'story', date: '2026-04-01' },
];

test('scopeRows filters the feed by template', () => {
  const scoped = scopeRows(rows, { template: 'story' });
  assert.equal(scoped.length, 4);
  assert.ok(scoped.every((r) => r.template === 'story'));
});

test('scopeRows filters by path prefix', () => {
  const mixed = [...rows, { path: '/de/x', title: 'X', template: 'story', date: '2026-06-01' }];
  const scoped = scopeRows(mixed, { path: '/en/' });
  assert.ok(scoped.every((r) => r.path.startsWith('/en/')));
  assert.equal(scoped.length, 5);
});

test('sortRows defaults to newest-first', () => {
  const sorted = sortRows(scopeRows(rows, { template: 'story' }), 'newest');
  assert.deepEqual(sorted.map((r) => r.title), ['D', 'E', 'B', 'A']);
});

test('paginate reveals the first perpage slice', () => {
  const sorted = sortRows(scopeRows(rows, { template: 'story' }), 'newest');
  assert.deepEqual(paginate(sorted, 2).map((r) => r.title), ['D', 'E']);
  // load-more grows the slice
  assert.deepEqual(paginate(sorted, 4).map((r) => r.title), ['D', 'E', 'B', 'A']);
});

test('paginate never overruns the row count', () => {
  const sorted = sortRows(scopeRows(rows, { template: 'story' }), 'newest');
  assert.equal(paginate(sorted, 99).length, 4);
});

test('empty scope yields an empty feed (no-results path)', () => {
  assert.equal(scopeRows(rows, { template: 'nonexistent' }).length, 0);
});

test('decodeState (facet-less) reads only the offset as revealed count', () => {
  const st = decodeState('?offset=12', NO_FACETS, 6);
  assert.equal(st.revealed, 12);
  assert.deepEqual(st.active, {}); // no facets ever parsed
  // first page (offset === perpage or absent) → revealed defaults to perpage
  assert.equal(decodeState('', NO_FACETS, 6).revealed, 6);
});

test('encodeState (facet-less) writes only offset and preserves unrelated params', () => {
  const qs = encodeState(
    { active: {}, sort: 'newest', revealed: 12 },
    6,
    '?utm_source=news&ref=home',
    NO_FACETS,
  );
  const params = new URLSearchParams(qs);
  assert.equal(params.get('offset'), '12');
  assert.equal(params.get('utm_source'), 'news'); // unrelated param survived
  assert.equal(params.get('ref'), 'home');
});

test('encodeState omits offset on the first page', () => {
  const qs = encodeState({ active: {}, sort: 'newest', revealed: 6 }, 6, '', NO_FACETS);
  assert.equal(new URLSearchParams(qs).get('offset'), null);
});

test('encodeState round-trips through decodeState', () => {
  const qs = encodeState({ active: {}, sort: 'oldest', revealed: 18 }, 6, '', NO_FACETS);
  const st = decodeState(qs, NO_FACETS, 6);
  assert.equal(st.revealed, 18);
  assert.equal(st.sort, 'oldest');
});

// --- pager: initial 5, then +6 (stories.md §2/§8) --------------------------
// The block passes `initial` (5) as the codec baseline; load-more grows by
// `perpage` (6). These pin that the codec floors to the initial slice and omits
// the offset param while the feed is on its first page.

test('pager baseline is `initial` (5): first page omits offset', () => {
  const INITIAL = 5;
  // no offset in URL → revealed floors to initial (5), not perpage
  assert.equal(decodeState('', NO_FACETS, INITIAL).revealed, 5);
  // encoding the first page (revealed === initial) writes no offset
  const qs = encodeState({ active: {}, sort: 'newest', revealed: 5 }, INITIAL, '', NO_FACETS);
  assert.equal(new URLSearchParams(qs).get('offset'), null);
});

test('pager: after one Load more, revealed = initial + perpage = 11 and deep-links', () => {
  const INITIAL = 5;
  const revealed = INITIAL + 6; // one load-more batch
  const qs = encodeState({ active: {}, sort: 'newest', revealed }, INITIAL, '', NO_FACETS);
  assert.equal(new URLSearchParams(qs).get('offset'), '11');
  // and restores to 11
  assert.equal(decodeState(qs, NO_FACETS, INITIAL).revealed, 11);
});

test('pager: initial slice shows exactly `initial` cards, load-more appends `perpage`', () => {
  const many = Array.from({ length: 20 }, (_, i) => ({
    path: `/en/p${i}`, title: `P${i}`, template: 'story', date: `2026-01-${String(i + 1).padStart(2, '0')}`,
  }));
  const sorted = sortRows(scopeRows(many, { template: 'story' }), 'newest');
  assert.equal(paginate(sorted, 5).length, 5); // initial render
  assert.equal(paginate(sorted, 5 + 6).length, 11); // after one Load more
  assert.equal(paginate(sorted, 5 + 6 + 6).length, 17); // after two
});

// --- category / tag filtering (stories.md §8) ------------------------------
// The block builds an `active` map { category:[...], tags:[...] } and reuses
// listing-logic filterRows (within-value OR, across-key AND).

const tagged = [
  { path: '/en/a', title: 'A', template: 'story', category: 'models', tags: 'octavia, 2026' },
  { path: '/en/b', title: 'B', template: 'story', category: 'emobility', tags: 'enyaq, 2026' },
  { path: '/en/c', title: 'C', template: 'story', category: 'models', tags: 'kodiaq' },
];

test('category filter narrows the feed', () => {
  const out = filterRows(tagged, { category: ['models'] });
  assert.deepEqual(out.map((r) => r.title), ['A', 'C']);
});

test('tag filter narrows the feed (comma-token match)', () => {
  const out = filterRows(tagged, { tags: ['2026'] });
  assert.deepEqual(out.map((r) => r.title), ['A', 'B']);
});

test('category AND tag combine across keys', () => {
  const out = filterRows(tagged, { category: ['models'], tags: ['octavia'] });
  assert.deepEqual(out.map((r) => r.title), ['A']);
});

// --- exclude promo/featured (stories.md §8 exclude_carousel_posts) ---------
// Exercises the PRODUCTION predicate imported from stories.js (not a copy), so
// the suite fails if the block's exclusion logic breaks.

test('production isFeatured recognises featured/promo/carousel signals', () => {
  assert.equal(isFeatured({ featured: 'true' }), true);
  assert.equal(isFeatured({ promo: true }), true);
  assert.equal(isFeatured({ carousel: '1' }), true);
  assert.equal(isFeatured({ featured: 1 }), true);
  assert.equal(isFeatured({}), false);
  assert.equal(isFeatured({ featured: 'false' }), false);
});

test('featured/promo entries are excluded from the feed (production predicate)', () => {
  const withPromo = [
    { path: '/en/hero', title: 'Hero', template: 'story', featured: 'true' },
    { path: '/en/x', title: 'X', template: 'story' },
    { path: '/en/y', title: 'Y', template: 'story', promo: true },
  ];
  const kept = withPromo.filter((r) => !isFeatured(r));
  assert.deepEqual(kept.map((r) => r.title), ['X']);
});

// --- shared card-teaser primitive (scripts/card-teaser.js) -----------------

test('formatCardDate renders the source D. M. YYYY form', () => {
  assert.equal(formatCardDate('2026-09-10'), '10. 9. 2026');
  assert.equal(formatCardDate('not-a-date'), '');
  assert.equal(formatCardDate(''), '');
});

test('buildCardTeaser renders an overlay card with date + title', () => {
  const li = buildCardTeaser(
    { path: '/en/a', title: 'Story A', date: '2026-09-10' },
    { eager: false, overlay: true },
  );
  assert.ok(li.classList.contains('card-teaser'));
  assert.ok(li.classList.contains('overlay'));
  const link = li.children[0];
  assert.equal(link.className, 'card-teaser-link');
  assert.equal(link.href, '/en/a'); // set as a property by buildCardTeaser
  // body carries a classified date + title
  const body = link.children.find((c) => c.className === 'card-teaser-body');
  assert.ok(body, 'has a card-teaser-body');
  const date = body.children.find((c) => c.className === 'card-teaser-date');
  const title = body.children.find((c) => c.className === 'card-teaser-title');
  assert.equal(date.textContent, '10. 9. 2026');
  assert.equal(title.textContent, 'Story A');
});

test('buildCardTeaser: image-less row renders a full card, not a zero-height media element (#3)', () => {
  const li = buildCardTeaser(
    { path: '/en/b', title: 'No image story', date: '2026-08-01' },
    { overlay: true },
  );
  // no empty media element created …
  const link = li.children[0];
  const media = link.children.find((c) => c.className === 'card-teaser-image');
  assert.equal(media, undefined, 'no empty media layer when the row has no image');
  // … and the card is marked so CSS gives the body intrinsic height
  assert.ok(li.classList.contains('card-teaser-no-image'), 'flagged for in-flow height');
  // the body (with title) is still present
  const body = link.children.find((c) => c.className === 'card-teaser-body');
  assert.ok(body && body.children.some((c) => c.className === 'card-teaser-title'));
});
