/*
 * Unit tests for the query-index row normalisation (SKODA-610).
 * Run: node --test scripts/query-index.test.mjs
 */

/* global globalThis */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SITE_SUFFIX, cleanTitle, normalizeRow, loadQueryIndex, clearQueryIndexCache,
} from './query-index.js';

test('cleanTitle strips the SEO site suffix (hyphen, en dash, pipe, extra whitespace)', () => {
  assert.equal(cleanTitle('Elroq - Škoda Storyboard'), 'Elroq');
  assert.equal(cleanTitle('Elroq – Škoda Storyboard'), 'Elroq');
  assert.equal(cleanTitle('Elroq | Škoda Storyboard'), 'Elroq');
  assert.equal(cleanTitle('Elroq  -  Škoda Storyboard  '), 'Elroq');
  assert.ok(SITE_SUFFIX.test(' - Škoda Storyboard'));
});

test('cleanTitle keeps mid-title dashes and the bare site name; idempotent', () => {
  assert.equal(cleanTitle('Peaq - the new flagship - Škoda Storyboard'), 'Peaq - the new flagship');
  assert.equal(cleanTitle('Škoda Storyboard'), 'Škoda Storyboard');
  assert.equal(cleanTitle('Škoda Epiq has arrived'), 'Škoda Epiq has arrived');
  assert.equal(cleanTitle(cleanTitle('Elroq - Škoda Storyboard')), 'Elroq');
  assert.equal(cleanTitle(undefined), '');
});

test('normalizeRow returns a cleaned copy, leaves clean rows and odd input untouched', () => {
  const row = { path: '/en/a', title: 'A - Škoda Storyboard', tags: 'x' };
  const out = normalizeRow(row);
  assert.deepEqual(out, { path: '/en/a', title: 'A', tags: 'x' });
  assert.equal(row.title, 'A - Škoda Storyboard'); // input not mutated
  const clean = { path: '/en/b', title: 'B' };
  assert.equal(normalizeRow(clean), clean);
  assert.equal(normalizeRow(null), null);
  const noTitle = { path: '/en/c' };
  assert.equal(normalizeRow(noTitle), noTitle);
});

test('loadQueryIndex serves cleaned titles across chunks', async () => {
  const chunks = {
    0: {
      total: 3, offset: 0, limit: 2, data: [{ path: '/en/a', title: 'A - Škoda Storyboard' }, { path: '/en', title: 'Škoda Storyboard' }],
    },
    2: {
      total: 3, offset: 2, limit: 2, data: [{ path: '/en/c', title: 'C – Škoda Storyboard' }],
    },
  };
  const realFetch = globalThis.fetch;
  const realWindow = globalThis.window;
  globalThis.window = { location: { href: 'https://example.test/en/x', pathname: '/en/x' } };
  globalThis.fetch = async (u) => {
    const offset = Number(new URL(u).searchParams.get('offset') || 0);
    return { ok: true, json: async () => chunks[offset] };
  };
  try {
    clearQueryIndexCache();
    const rows = await loadQueryIndex('/en/query-index.json');
    assert.deepEqual(rows.map((r) => r.title), ['A', 'Škoda Storyboard', 'C']);
  } finally {
    globalThis.fetch = realFetch;
    globalThis.window = realWindow;
    clearQueryIndexCache();
  }
});
