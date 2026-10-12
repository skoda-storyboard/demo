/*
 * build-facet-labels (#273): the source's filter option names, per facet, in its order.
 * Run: node --test tools/importer/build-facet-labels.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { filterOptions, mergeOptions, render } from './build-facet-labels.mjs';

const FORM = `<form class="search-filter" method="get"><div class="filter-options">
  <ul class="filter-input-options"><li class=""><input class="checkbox" id="a" name="filter[model][]" type="checkbox" value="citigoe"><label for="a">Citigo&#7497; iV</label></li>
  <li><input name="filter[model][]" value="epiq" type="checkbox"><label for="b">Epiq</label></li></ul>
  <ul><li><input name="filter[company][]" value="india-2-0" type="checkbox"><label>India 2.0</label></li>
  <li><input name="filter[derivative][]" value="lk" type="checkbox"><label>L&amp;K</label></li>
  <li><input name="q" value="x"><label>not a facet</label></li></ul></div></form>
  <ul><li><input name="filter[model][]" value="outside"><label>Outside the form</label></li></ul>`;

test('filterOptions: facet, slug and decoded name of every option inside form.search-filter', () => {
  assert.deepEqual(filterOptions(FORM), [
    ['model', 'citigoe', 'Citigoᵉ iV'],
    ['model', 'epiq', 'Epiq'],
    ['company', 'india-2-0', 'India 2.0'],
    ['derivative', 'lk', 'L&K'],
  ]);
  assert.deepEqual(filterOptions('<p>no form</p>'), []);
});

test('mergeOptions: first-seen order across pages, no repeats', () => {
  const merged = mergeOptions([
    [['model', 'epiq', 'Epiq'], ['model', 'peaq', 'Peaq']],
    [['model', 'citigoe', 'Citigoᵉ iV'], ['model', 'epiq', 'Epiq (other)'], ['years', '2024', '2024']],
  ]);
  assert.deepEqual(merged, {
    model: [['epiq', 'Epiq'], ['peaq', 'Peaq'], ['citigoe', 'Citigoᵉ iV']],
    years: [['2024', '2024']],
  });
});

test('the committed facet-labels.json is well-formed: every facet a list of [slug, name]', () => {
  const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../blocks/listing/facet-labels.json');
  const text = fs.readFileSync(file, 'utf8');
  const json = JSON.parse(text);
  assert.equal(render(json), text, 'generator format');
  Object.entries(json).forEach(([facet, pairs]) => {
    assert.ok(Array.isArray(pairs) && pairs.length, facet);
    pairs.forEach(([slug, name]) => assert.ok(slug && name, `${facet}: ${slug}`));
  });
  ['model', 'derivative', 'bodywork', 'years', 'company'].forEach((f) => assert.ok(json[f], f));
});
