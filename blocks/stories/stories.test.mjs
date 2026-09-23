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
// Mirror of the block's isFeatured predicate: keep the feed free of the
// promo-box hero posts so it never duplicates the featured items.

const isFeatured = (row) => {
  const v = row.featured ?? row.promo ?? row.carousel;
  return v === true || v === 'true' || v === '1' || v === 1;
};

test('featured/promo entries are excluded from the feed', () => {
  const withPromo = [
    { path: '/en/hero', title: 'Hero', template: 'story', featured: 'true' },
    { path: '/en/x', title: 'X', template: 'story' },
    { path: '/en/y', title: 'Y', template: 'story', promo: true },
  ];
  const kept = withPromo.filter((r) => !isFeatured(r));
  assert.deepEqual(kept.map((r) => r.title), ['X']);
});
