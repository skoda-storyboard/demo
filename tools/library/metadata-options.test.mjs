/*
 * SKODA-841: the page panel's metadata pick lists (the Blocks sheet's `options` tab, Experience
 * Workspace "block options": key | blocks | values | type | label).
 * Run: node --test tools/library/metadata-options.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { metadataOptions, librarySheet, TEMPLATE_VALUES } from './build-library.mjs';

const vocabulary = [
  { taxonomy: 'model', slug: 'peaq', label: 'Peaq' },
  { taxonomy: 'model', slug: 'epiq', label: 'Epiq' },
  { taxonomy: 'years', slug: '2026', label: '2026' },
  { taxonomy: 'technology', slug: 'emobility', label: 'eMobility' },
  { taxonomy: 'crew', slug: 'emobility', label: 'eMobility' },
  { taxonomy: 'people', slug: 'stefani', label: 'Stefani' },
  { taxonomy: 'crew', slug: 'stefani', label: 'Stefani' },
];

test('every facet is a multi pick list of Label=value pairs; the page type a single choice', () => {
  const rows = metadataOptions(vocabulary);
  const by = Object.fromEntries(rows.map((r) => [r.key, r]));
  assert.ok(rows.every((r) => r.blocks === 'metadata'));
  assert.deepEqual(by.model, {
    key: 'model', blocks: 'metadata', values: 'Peaq=peaq | Epiq=epiq', type: 'multi', label: 'Model',
  });
  assert.equal(by.years.label, 'Year', 'the listing\'s facet names');
  assert.equal(by.vip.values, '', 'a facet with no vocabulary yet stays a free multi field');
  assert.equal(by.template.values, TEMPLATE_VALUES.join(' | '));
  assert.equal(by.template.type, '', 'single choice');
  assert.equal(by.title.values, '', 'title and description stay text fields');
});

test('`tags` offers the non-facet terms only, each slug once, with its taxonomy', () => {
  const tags = metadataOptions(vocabulary).find((r) => r.key === 'tags');
  assert.equal(tags.type, 'multi');
  assert.equal(tags.values, 'eMobility (crew)=emobility | Stefani (crew)=stefani');
});

test('the Blocks sheet gets two tabs, data (the blocks) and options', () => {
  const sheet = librarySheet(['tags', 'cards'], vocabulary);
  assert.deepEqual(sheet[':names'], ['data', 'options']);
  assert.equal(sheet[':type'], 'multi-sheet');
  assert.deepEqual(sheet.data.data.map((r) => r.name), ['Cards', 'Tags']);
  assert.equal(sheet.options.total, sheet.options.data.length);
});
