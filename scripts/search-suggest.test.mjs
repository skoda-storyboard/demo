/*
 * search-suggest.js: accent-insensitive matching and the localized type labels (SKODA-1003).
 * Run: node --test scripts/search-suggest.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

const { foldText, matchRows, SUGGEST_LABELS } = await import('./search-suggest.js');

test('foldText: lower case, combining marks removed, đ as d', () => {
  assert.equal(foldText('Škoda Pogačar'), 'skoda pogacar');
  assert.equal(foldText('Đoković ŽIVOT'), 'dokovic zivot');
  assert.equal(foldText('Straße'), 'straße', 'ß is a letter, not a mark');
  assert.equal(foldText(null), '');
});

test('matchRows: every term, with or without accents, either way round', () => {
  const rows = [
    { title: 'Tadej Pogačar v cíli', description: '', tags: '' },
    { title: 'Škoda Elroq', description: 'kompaktní SUV', tags: 'elektromobilita' },
    { title: 'Other', description: '', tags: '' },
  ];
  assert.deepEqual(matchRows(rows, 'pogacar').map((r) => r.title), ['Tadej Pogačar v cíli']);
  assert.deepEqual(matchRows(rows, 'POGAČAR cili').map((r) => r.title), ['Tadej Pogačar v cíli']);
  assert.deepEqual(matchRows(rows, 'skoda kompaktni').map((r) => r.title), ['Škoda Elroq']);
  assert.deepEqual(matchRows(rows, '   '), []);
});

test('SUGGEST_LABELS: the source\'s three type names and its padded date', () => {
  assert.deepEqual(SUGGEST_LABELS, {
    story: 'Stories', pressRelease: 'News', pressKit: 'Press Kits', dateFormat: '{dd}. {mm}. {yyyy}',
  });
});
