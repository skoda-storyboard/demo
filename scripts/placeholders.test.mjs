/*
 * placeholders.js helpers (SKODA-1003): sheet keys, localized module labels, the token filler.
 * Run: node --test scripts/placeholders.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  sheetKey, localize, fillText, fetchPlaceholders, clearPlaceholdersCache,
} from './placeholders.js';

const LABELS = { previous: 'Previous image', next: 'Next image', counter: '{current} of {total}' };

test('sheetKey: the prefix and the key in camelCase, or the key alone', () => {
  assert.equal(sheetKey('gallery', 'previous'), 'galleryPrevious');
  assert.equal(sheetKey('', 'loadMore'), 'loadMore');
  assert.equal(sheetKey('mediaCart', 'badgeCountOne'), 'mediaCartBadgeCountOne');
});

test('localize: the sheet text per key, else the English default; the defaults are not changed', () => {
  const copy = { ...LABELS };
  const out = localize(LABELS, { galleryPrevious: 'Předchozí obrázek' }, 'gallery');
  assert.deepEqual(out, { ...LABELS, previous: 'Předchozí obrázek' });
  assert.deepEqual(LABELS, copy, 'input untouched');
  assert.notEqual(out, LABELS, 'a new object');
});

test('localize: blank, non-string or missing sheet values keep English; no sheet at all too', () => {
  const ph = { galleryPrevious: '   ', galleryNext: 0, galleryCounter: null };
  assert.deepEqual(localize(LABELS, ph, 'gallery'), LABELS);
  assert.deepEqual(localize(LABELS, undefined, 'gallery'), LABELS);
  assert.deepEqual(localize(LABELS, null, 'gallery'), LABELS);
  assert.deepEqual(localize(LABELS, { previous: 'x' }, 'gallery'), LABELS, 'an unprefixed key is not this module\'s');
});

test('fillText: named tokens filled, unknown ones kept, values stringified', () => {
  assert.equal(fillText('{current} of {total}', { current: 2, total: 9 }), '2 of 9');
  assert.equal(fillText('{a} {b}', { a: 0 }), '0 {b}');
  assert.equal(fillText('{toString}', {}), '{toString}', 'no prototype keys');
  assert.equal(fillText(42), '42');
});

test('fetchPlaceholders: the sheet as camelCase keys; a failing or missing sheet gives {}', async (t) => {
  const realFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = realFetch; clearPlaceholdersCache(); });
  globalThis.fetch = async (url) => {
    if (String(url) === '/cs/placeholders.json') {
      return { ok: true, json: async () => ({ data: [{ Key: 'Gallery Previous', Text: 'Předchozí' }, { Key: '', Text: 'x' }] }) };
    }
    if (String(url) === '/de/placeholders.json') throw new Error('offline');
    return { ok: false, json: async () => ({}) };
  };
  assert.deepEqual(await fetchPlaceholders('/cs'), { galleryPrevious: 'Předchozí' });
  assert.deepEqual(await fetchPlaceholders('/sl'), {});
  const warn = console.warn;
  console.warn = () => {};
  try {
    assert.deepEqual(await fetchPlaceholders('/de'), {});
  } finally { console.warn = warn; }
});

test('pluralText: the locale\'s plural form when the labels have it, else the general text', async () => {
  const { pluralText } = await import('./placeholders.js');
  const en = { more: 'Show {n} more images', moreOne: 'Show {n} more image' };
  assert.equal(pluralText(en, 'more', 1, {}, 'en'), 'Show 1 more image');
  assert.equal(pluralText(en, 'more', 3, {}, 'en'), 'Show 3 more images');
  // Czech: one / few (2–4) / other (5+)
  const cs = { more: 'Zobrazit {n} dalších obrázků', moreOne: 'Zobrazit {n} další obrázek', moreFew: 'Zobrazit {n} další obrázky' };
  assert.deepEqual([1, 3, 7].map((n) => pluralText(cs, 'more', n, {}, 'cs')), [
    'Zobrazit 1 další obrázek', 'Zobrazit 3 další obrázky', 'Zobrazit 7 dalších obrázků']);
  // a form the sheet lacks, or an unknown locale: the general text
  assert.equal(pluralText({ more: 'x {n}' }, 'more', 3, {}, 'cs'), 'x 3');
  assert.equal(pluralText(en, 'more', 3, {}, 'not a locale!'), 'Show 3 more images');
  assert.equal(pluralText({ t: '{n} of {total}' }, 't', 2, { total: 9 }, 'en'), '2 of 9');
});

test('localize + pluralText: a translated general text without its plural form never shows the English form', async () => {
  const { pluralText } = await import('./placeholders.js');
  const EN = { moreLabel: 'Show {n} more images', moreLabelOne: 'Show {n} more image' };
  const cs = localize(EN, { galleryMoreLabel: 'Zobrazit dalších obrázků: {n}' }, 'gallery');
  assert.equal(cs.moreLabelOne, '', 'no English singular under a Czech plural');
  assert.equal(pluralText(cs, 'moreLabel', 1, {}, 'cs'), 'Zobrazit dalších obrázků: 1');
  // no sheet at all: the English forms
  assert.equal(pluralText(localize(EN, {}, 'gallery'), 'moreLabel', 1, {}, 'en'), 'Show 1 more image');
});

test('placeholdersNow: the map once loaded, {} before (never waits, never fetches)', async (t) => {
  const { placeholdersNow } = await import('./placeholders.js');
  const realFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = realFetch; clearPlaceholdersCache(); });
  clearPlaceholdersCache();
  let calls = 0;
  let release;
  globalThis.fetch = () => { calls += 1; return new Promise((r) => { release = () => r({ ok: true, json: async () => ({ data: [{ Key: 'loadMore', Text: 'Načíst další' }] }) }); }); };
  assert.deepEqual(placeholdersNow('/cs'), {}, 'nothing loading yet');
  const loading = fetchPlaceholders('/cs');
  assert.deepEqual(placeholdersNow('/cs'), {}, 'still loading');
  release();
  await loading;
  assert.deepEqual(placeholdersNow('/cs'), { loadMore: 'Načíst další' });
  assert.equal(calls, 1, 'placeholdersNow fetched nothing');
  assert.deepEqual(placeholdersNow(), {}, 'no page: {}');
});

test('formatDate: day / month plain or padded, UTC; an unparseable date is empty', async () => {
  const { formatDate } = await import('./placeholders.js');
  assert.equal(formatDate('2026-09-10', '{d}. {m}. {yyyy}'), '10. 9. 2026');
  assert.equal(formatDate('2026-09-01', '{dd}. {mm}. {yyyy}'), '01. 09. 2026');
  assert.equal(formatDate('2026-12-31T23:30:00Z', '{d}.{m}.{yyyy}'), '31.12.2026', 'UTC, no timezone shift');
  assert.equal(formatDate('not a date', '{d}'), '');
  assert.equal(formatDate(undefined, '{d}'), '');
});

test('localize: a sheet\'s extra plural forms of a counted text come through for pluralText', async () => {
  const { pluralText } = await import('./placeholders.js');
  const EN = { moreLabel: 'Show {n} more images', moreLabelOne: 'Show {n} more image' };
  const cs = localize(EN, {
    galleryMoreLabel: 'Zobrazit dalších {n} obrázků', galleryMoreLabelOne: 'Zobrazit další {n} obrázek', galleryMoreLabelFew: 'Zobrazit další {n} obrázky', galleryOther: 'x',
  }, 'gallery');
  assert.equal(cs.moreLabelFew, 'Zobrazit další {n} obrázky');
  assert.equal(Object.keys(cs).includes('other'), false, 'no unrelated keys');
  assert.equal(pluralText(cs, 'moreLabel', 3, {}, 'cs'), 'Zobrazit další 3 obrázky');
});
