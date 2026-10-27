/*
 * SKODA-841: the tag vocabulary builder (build-tag-vocabulary.mjs), pure parts.
 * Run: node --test tools/importer/build-tag-vocabulary.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { linkTerm, authoredPills, buildVocabulary } from './build-tag-vocabulary.mjs';

test('linkTerm reads an archive or a listing filter link, encoded or not', () => {
  assert.deepEqual(linkTerm('/en/tag/model/peaq'), { kind: 'archive', taxonomy: 'model', slug: 'peaq' });
  assert.deepEqual(linkTerm('https://www.skoda-storyboard.com/en/tag/crew/emobility/'), { kind: 'archive', taxonomy: 'crew', slug: 'emobility' });
  assert.deepEqual(linkTerm('https://www.skoda-storyboard.com/en/news/?filter%5Bvip%5D%5B%5D=graf-en'), { kind: 'filter', taxonomy: 'vip', slug: 'graf-en' });
  assert.deepEqual(linkTerm('/en/press-kits?filter[years][]=2026'), { kind: 'filter', taxonomy: 'years', slug: '2026' });
  assert.equal(linkTerm('#'), null);
});

test('authoredPills: the Tags block links in order, entities decoded; other blocks ignored', () => {
  const html = '<div><div class="tags"><div><div><a href="/en/tag/years/2026">2026</a><a href="https://x/en/news/?filter%5Bderivative%5D%5B%5D=lk">L&#x26;K</a></div></div></div>'
    + '<div class="story-rail press"><div><div><a href="/en/press-releases/a">Not a tag</a></div></div></div></div>';
  assert.deepEqual(authoredPills(html), [
    { href: '/en/tag/years/2026', text: '2026' },
    { href: 'https://x/en/news/?filter%5Bderivative%5D%5B%5D=lk', text: 'L&K' },
  ]);
});

test('buildVocabulary: sheet rows kept, page pills and index values added; the release archive exceptions recorded', () => {
  const pages = [
    // a story: archive links, the crew term only in `tags`
    { template: 'story', facets: { model: 'peaq', years: '2026' }, tags: ['2026', 'peaq', 'emobility'], pills: [
      { href: '/en/tag/years/2026', text: '2026' }, { href: '/en/tag/crew/emobility', text: 'eMobility' }, { href: '/en/tag/model/peaq', text: 'Peaq' },
    ] },
    // a release: a model linked to its archive (an exception), a vip linked to the News filter (the rule),
    // a technology value linked to the source's crew archive (an exception)
    { template: 'press_release', facets: { model: 'peaq', vip: 'graf-en', technology: 'electromobility' }, tags: [], pills: [
      { href: '/en/tag/model/peaq', text: 'Peaq' },
      { href: 'https://www.skoda-storyboard.com/en/news/?filter%5Bvip%5D%5B%5D=graf-en', text: 'Gräf' },
      { href: 'https://www.skoda-storyboard.com/en/tag/crew/electromobility/', text: 'electromobility' },
      { href: '#', text: '+2' },
    ] },
  ];
  const index = [{ model: 'peaq, kodiaq', bodywork: 'suv' }, { model: 'new-one' }];
  const sheet = [{ taxonomy: 'model', slug: 'peaq', label: 'Peaq' }];
  const facetLabels = { model: [['kodiaq', 'Kodiaq']], bodywork: [['suv', 'SUV']], _pages: {} };
  const { data, terms, conflicts, guesses, added } = buildVocabulary({ pages, index, sheet, facetLabels });
  assert.deepEqual(data.map((r) => `${r.taxonomy}:${r.slug}:${r.label}`), [
    'model:kodiaq:Kodiaq', 'model:new-one:New One', 'model:peaq:Peaq', 'bodywork:suv:SUV', 'years:2026:2026',
    'vip:graf-en:Gräf', 'technology:electromobility:electromobility', 'crew:emobility:eMobility',
  ]);
  assert.equal(added, 7);
  assert.deepEqual(terms, { press_release: { 'model/peaq': 'model', 'technology/electromobility': 'crew' } });
  assert.deepEqual(conflicts, []);
  assert.deepEqual(guesses, ['model|new-one'], 'an index value with no source name is listed to review');
});

test('buildVocabulary reports a label that differs from the sheet and keeps the sheet\'s', () => {
  const pages = [{ template: 'story', facets: { model: 'peaq' }, tags: [], pills: [{ href: '/en/tag/model/peaq', text: 'PEAQ' }] }];
  const { data, conflicts } = buildVocabulary({ pages, index: [], sheet: [{ taxonomy: 'model', slug: 'peaq', label: 'Peaq' }], facetLabels: {} });
  assert.equal(data[0].label, 'Peaq');
  assert.equal(conflicts.length, 1);
});
