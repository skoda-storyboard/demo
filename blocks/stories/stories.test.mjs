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
  scopeRows, sortRows, paginate, decodeState, encodeState,
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
