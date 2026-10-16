/*
 * build-facet-labels (#273): the source's filter option names, per facet, in its order.
 * Run: node --test tools/importer/build-facet-labels.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  filterOptions, hiddenOptions, mergeOptions, pageOptions, render,
} from './build-facet-labels.mjs';

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
  // each entity decoded once; a numeric apostrophe stays straight
  const once = filterOptions('<form class="search-filter"><ul><li><input name="filter[model][]" value="a"><label>R&amp;lt;S &#39;x&#39; L&amp;K</label></li></ul></form>');
  assert.deepEqual(once, [['model', 'a', "R&lt;S 'x' L&K"]]);
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
  const { _hidden: hidden, _pages: perPage, ...facets } = json;
  // the source's CSS hides Model "Citigoᵉ iV" on every listing (#273 review)
  assert.deepEqual(hidden, ['citigoe'], '_hidden: value parts, not [slug, name] pairs');
  Object.entries(facets).forEach(([facet, pairs]) => {
    assert.ok(Array.isArray(pairs) && pairs.length, facet);
    pairs.forEach(([slug, name]) => assert.ok(slug && name, `${facet}: ${slug}`));
  });
  ['model', 'derivative', 'bodywork', 'years', 'company'].forEach((f) => assert.ok(json[f], f));
  // SKODA-402d: every listing page's own option lists, each slug a named option
  assert.deepEqual(Object.keys(perPage), ['/en/images', '/en/videos', '/en/news', '/en/press-kits']);
  Object.entries(perPage).forEach(([page, byFacet]) => Object.entries(byFacet).forEach(([facet, slugs]) => {
    const named = new Set((facets[facet] || []).map(([slug]) => slug));
    slugs.forEach((slug) => assert.ok(named.has(slug), `${page} ${facet}: ${slug} has a name`));
  }));
});

test('pageOptions: each page\'s own options per facet, in its order, keyed by path (SKODA-402d)', () => {
  const pages = pageOptions([
    [['bodywork', 'combi', 'Combi'], ['bodywork', 'spaceback', 'Spaceback'], ['bodywork', 'suv', 'SUV']],
    [['bodywork', 'combi', 'Combi'], ['bodywork', 'saloon', 'Saloon'], ['bodywork', 'spaceback', 'Spaceback'], ['happening', 'other', 'other']],
  ], ['/en/images/', '/en/news/']);
  assert.deepEqual(pages, {
    '/en/images': { bodywork: ['combi', 'spaceback', 'suv'] },
    '/en/news': { bodywork: ['combi', 'saloon', 'spaceback'], happening: ['other'] },
  });
});

test('hiddenOptions (#273 review): the value parts the source\'s CSS hides from its filter', () => {
  const html = `<style>
.search-results-item:has( .type-attachment .entry-title > a[href=""] ) { display: none; }
.search-filter li:has([value*="citigoe"]) {
\tdisplay: none;
}
/* .search-filter li:has([value*="commented"]) { display: none; } */
.search-filter li:has([value*="shown"]) { color: red; }
.x, .search-filter li:has([value*="Kamiq-GT"]) { display:none !important }
.search-filter li:has([value*="citigoe"]) { display: none; }
</style>`;
  // display:none rules only (not comments or other properties), once each, lower case
  assert.deepEqual(hiddenOptions(html), ['citigoe', 'kamiq-gt']);
  assert.deepEqual(hiddenOptions('<p>no style</p>'), []);
  assert.deepEqual(hiddenOptions('<style>.search-filter li:has([value*=""]) { display: none; }</style>'), [], 'no blank part');
});
