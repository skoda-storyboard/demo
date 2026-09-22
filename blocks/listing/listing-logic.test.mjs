/*
 * Unit tests for the faceted-listing pure logic (SKODA-402).
 * Zero-dependency: node:test + node:assert. No DOM, no network.
 * Run: node --test blocks/listing/listing-logic.test.mjs
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  facetTokens, scopeRows, filterRows, sortRows, paginate,
  distinctFacetValues, decodeState, encodeState, selectedCount,
} from './listing-logic.mjs';

const rows = [
  {
    path: '/en/press-releases/a', title: 'A', template: 'press_release', date: '2026-09-15', model: 'elroq, enyaq', years: '2026',
  },
  {
    path: '/en/press-releases/b', title: 'B', template: 'press_release', date: '2026-01-02', model: 'octavia', years: '2026',
  },
  {
    path: '/en/press-releases/c', title: 'C', template: 'press_release', date: '2025-06-01', model: 'elroq', years: '2025',
  },
  {
    path: '/en/stories/d', title: 'D', template: 'story', date: '2026-03-03', model: 'elroq',
  },
];

test('facetTokens splits comma-joined cells', () => {
  assert.deepEqual(facetTokens('elroq, enyaq'), ['elroq', 'enyaq']);
  assert.deepEqual(facetTokens(''), []);
});

test('scopeRows filters by template and path prefix', () => {
  assert.equal(scopeRows(rows, { template: 'press_release' }).length, 3);
  assert.equal(scopeRows(rows, { path: '/en/stories/' }).length, 1);
  assert.equal(scopeRows(rows, { template: 'press_release', path: '/en/press-releases/' }).length, 3);
});

test('filterRows: within-facet OR, across-facet AND', () => {
  const scoped = scopeRows(rows, { template: 'press_release' });
  // model=elroq → rows a (elroq,enyaq) + c
  assert.deepEqual(filterRows(scoped, { model: ['elroq'] }).map((r) => r.title), ['A', 'C']);
  // model=elroq OR octavia → a, b, c
  assert.equal(filterRows(scoped, { model: ['elroq', 'octavia'] }).length, 3);
  // model=elroq AND years=2025 → only c
  assert.deepEqual(filterRows(scoped, { model: ['elroq'], years: ['2025'] }).map((r) => r.title), ['C']);
  // no active facets → all
  assert.equal(filterRows(scoped, {}).length, 3);
});

test('filterRows matches a value among comma tokens (multi-value cell)', () => {
  assert.deepEqual(filterRows(rows, { model: ['enyaq'] }).map((r) => r.title), ['A']);
});

test('sortRows newest (default) desc, oldest asc, non-mutating', () => {
  const scoped = scopeRows(rows, { template: 'press_release' });
  assert.deepEqual(sortRows(scoped, 'newest').map((r) => r.title), ['A', 'B', 'C']);
  assert.deepEqual(sortRows(scoped, 'oldest').map((r) => r.title), ['C', 'B', 'A']);
  assert.equal(scoped[0].title, 'A'); // original order untouched
});

test('paginate returns the first N (load-more slice)', () => {
  assert.equal(paginate(rows, 2).length, 2);
  assert.equal(paginate(rows, 99).length, rows.length);
  assert.equal(paginate(rows, 0).length, 0);
});

test('distinctFacetValues counts across comma tokens', () => {
  const vals = distinctFacetValues(rows, 'model');
  const model = Object.fromEntries(vals.map((v) => [v.value, v.count]));
  assert.equal(model.elroq, 3); // a, c, d
  assert.equal(model.enyaq, 1);
  assert.equal(model.octavia, 1);
});

test('decodeState reads the SOURCE scheme (filter[facet][] array + sortby + offset)', () => {
  const s = decodeState('?filter[model][]=elroq&filter[model][]=octavia&sortby=oldest&offset=12', ['model', 'years'], 6);
  assert.deepEqual(s.active, { model: ['elroq', 'octavia'] });
  assert.equal(s.sort, 'oldest');
  assert.equal(s.revealed, 12);
});

test('decodeState also accepts a comma-joined single facet value', () => {
  const s = decodeState('?filter[model][]=elroq,octavia', ['model'], 6);
  assert.deepEqual(s.active, { model: ['elroq', 'octavia'] });
});

test('decodeState defaults: no params → newest, revealed=perpage', () => {
  const s = decodeState('', ['model'], 6);
  assert.deepEqual(s.active, {});
  assert.equal(s.sort, 'newest');
  assert.equal(s.revealed, 6);
});

test('encodeState emits the source scheme + round-trips with decodeState', () => {
  assert.equal(encodeState({ active: {}, sort: 'newest', revealed: 6 }, 6), '');
  const qs = encodeState({ active: { model: ['elroq', 'octavia'] }, sort: 'oldest', revealed: 12 }, 6, '', ['model']);
  // readable, source-matching brackets (not %5B/%5D)
  assert.match(qs, /filter\[model\]\[\]=elroq/);
  assert.match(qs, /filter\[model\]\[\]=octavia/);
  assert.match(qs, /sortby=oldest/);
  assert.match(qs, /offset=12/);
  const back = decodeState(qs, ['model'], 6);
  assert.deepEqual(back.active, { model: ['elroq', 'octavia'] });
  assert.equal(back.sort, 'oldest');
  assert.equal(back.revealed, 12);
});

test('encodeState PRESERVES unrelated params (utm_*, other block) on facet change', () => {
  const base = '?utm_source=newsletter&utm_medium=email&other[foo][]=x';
  const qs = encodeState({ active: { model: ['octavia'] }, sort: 'newest', revealed: 6 }, 6, base, ['model', 'years']);
  const p = new URLSearchParams(qs);
  assert.equal(p.get('utm_source'), 'newsletter');
  assert.equal(p.get('utm_medium'), 'email');
  assert.equal(p.get('other[foo][]'), 'x'); // a different block's param survives
  assert.equal(p.get('filter[model][]'), 'octavia');
});

test('encodeState clears a removed facet but keeps unrelated params', () => {
  // was filtered by model=elroq + had utm; now model cleared → filter[model][] gone, utm stays
  const base = 'filter[model][]=elroq&utm_source=x';
  const qs = encodeState({ active: {}, sort: 'newest', revealed: 6 }, 6, base, ['model']);
  const p = new URLSearchParams(qs);
  assert.equal(p.has('filter[model][]'), false);
  assert.equal(p.get('utm_source'), 'x');
});

test('selectedCount reports selections per facet', () => {
  assert.equal(selectedCount({ model: ['a', 'b'] }, 'model'), 2);
  assert.equal(selectedCount({}, 'model'), 0);
});
