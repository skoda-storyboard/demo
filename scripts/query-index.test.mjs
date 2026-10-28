/*
 * Unit tests for the query-index row normalisation (SKODA-610).
 * Run: node --test scripts/query-index.test.mjs
 */

/* global globalThis */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SITE_SUFFIX, cleanTitle, normalizeRow, loadQueryIndex, clearQueryIndexCache, isChromeFragment,
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

// SKODA-1001 QA: a locale index covers its whole tree, fragments included
test('isChromeFragment: the nav / footer and shared fragments, never a page', () => {
  ['/cs/nav', '/cs/footer', '/de/media-room/nav', '/sk/media-room/footer', '/nav', '/footer',
    '/media-room/nav', '/sustainability/footer', '/cs/fragments/newsletter-card', '/en/fragments/x']
    .forEach((p) => assert.equal(isChromeFragment(p), true, p));
  ['/cs', '/cs/e-mobilita-cs/navigace', '/en/newsletter', '/en/category/nav-tips', '/cs/navody',
    '/en/media-room', '/en/media-room/news', '/sk/footer-story', '', undefined]
    .forEach((p) => assert.equal(isChromeFragment(p), false, String(p)));
});

test('loadQueryIndex leaves the fragment rows out, across chunks', async () => {
  const chunks = {
    0: {
      total: 4, offset: 0, limit: 2, data: [{ path: '/cs/nav', title: 'Stories' }, { path: '/cs/a', title: 'A' }],
    },
    2: {
      total: 4, offset: 2, limit: 2, data: [{ path: '/cs/media-room/footer', title: ':appstore:' }, { path: '/cs/b', title: 'B' }],
    },
  };
  const realFetch = globalThis.fetch;
  const realWindow = globalThis.window;
  globalThis.window = { location: { href: 'https://example.test/cs/x', pathname: '/cs/x' } };
  globalThis.fetch = async (u) => {
    const offset = Number(new URL(u).searchParams.get('offset') || 0);
    return { ok: true, json: async () => chunks[offset] };
  };
  try {
    clearQueryIndexCache();
    const rows = await loadQueryIndex('/cs/query-index.json');
    assert.deepEqual(rows.map((r) => r.path), ['/cs/a', '/cs/b'], 'both chunks read, the fragments gone');
  } finally {
    globalThis.fetch = realFetch;
    globalThis.window = realWindow;
    clearQueryIndexCache();
  }
});
