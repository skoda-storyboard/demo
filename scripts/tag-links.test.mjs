/*
 * SKODA-841: tag pills derived from a page's facet metadata (scripts/tag-links.js).
 * Every expectation below is an authored pill of a migrated page (Phase 0 census, 2026-10-27).
 * Run: node --test scripts/tag-links.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = { hlx: { codeBasePath: '' } };
const {
  linkFamily, vocabularyMap, tagEntries, tagHref, archiveHref, filterHref, byLabel, derivedTags,
  archivePaths, SOURCE_ORIGIN,
} = await import('./tag-links.js');

const vocabulary = vocabularyMap({
  data: [
    { taxonomy: 'model', slug: 'peaq', label: 'Peaq' },
    { taxonomy: 'years', slug: '2026', label: '2026' },
    { taxonomy: 'vip', slug: 'graf-en', label: 'Gräf' },
    { taxonomy: 'equipment', slug: '4x4', label: '4x4 – all wheel drive' },
    { taxonomy: 'derivative', slug: 'lk', label: 'L&K' },
    { taxonomy: 'technology', slug: 'electromobility', label: 'electromobility' },
    { taxonomy: 'crew', slug: 'emobility', label: 'eMobility' },
    { taxonomy: 'people', slug: 'stefani', label: 'Stefani' },
    { taxonomy: '', slug: 'broken', label: 'no taxonomy' },
  ],
});
const terms = { press_release: { 'technology/electromobility': 'crew', 'model/peaq': 'model' } };
const archives = new Set(['/en/tag/years/2026', '/en/tag/model/peaq', '/en/tag/crew/emobility']);

test('the page family follows the template', () => {
  assert.equal(linkFamily('story'), 'story');
  assert.equal(linkFamily('press_release'), 'press_release');
  assert.equal(linkFamily('press_kit'), 'press_kit');
  assert.equal(linkFamily('press_kit_chapter'), 'press_kit');
  assert.equal(linkFamily(''), 'story', 'any other page links archives, as a story');
});

test('the vocabulary sheet: labels by taxonomy + slug, non-facet taxonomies by slug; rows without a taxonomy are skipped', () => {
  assert.equal(vocabulary.labels.get('vip|graf-en'), 'Gräf');
  assert.deepEqual(vocabulary.otherTaxonomies.get('emobility'), ['crew']);
  assert.equal(vocabulary.otherTaxonomies.has('peaq'), false, 'a facet value is no other taxonomy');
  assert.equal([...vocabulary.labels.keys()].some((k) => k.endsWith('|broken')), false);
  assert.equal(vocabularyMap(null).labels.size, 0, 'an unreachable sheet is an empty vocabulary');
});

test('entries: every facet value, then the `tags` values of a non-facet taxonomy; bare `tags` slugs are not guessed', () => {
  const entries = tagEntries({
    facets: { model: 'peaq', years: ['2026'], view: '' },
    tags: '2026, peaq, emobility, unknown-term',
  }, vocabulary);
  assert.deepEqual(entries.map((e) => `${e.taxonomy}:${e.slug}:${e.label}`), [
    'model:peaq:Peaq', 'years:2026:2026', 'crew:emobility:eMobility',
  ]);
  const unlisted = tagEntries({ facets: { model: 'new-model' } }, vocabulary);
  assert.equal(unlisted[0].label, 'New Model', 'a value the sheet lacks shows its title-cased slug');
});

test('a story links the tag archive: on the site when it is a page here, else the source archive', () => {
  assert.equal(tagHref({ taxonomy: 'model', slug: 'peaq' }, 'story', { archives }), '/en/tag/model/peaq');
  assert.equal(tagHref({ taxonomy: 'bodywork', slug: 'coupe-en' }, 'story', { archives }),
    'https://www.skoda-storyboard.com/en/tag/bodywork/coupe-en/');
  assert.equal(tagHref({ taxonomy: 'crew', slug: 'emobility' }, 'story', { archives }), '/en/tag/crew/emobility');
});

test('a press release links the News filter, except the terms the source links to an archive', () => {
  assert.equal(tagHref({ taxonomy: 'vip', slug: 'graf-en' }, 'press_release', { terms, archives }),
    'https://www.skoda-storyboard.com/en/news/?filter%5Bvip%5D%5B%5D=graf-en');
  assert.equal(tagHref({ taxonomy: 'model', slug: 'peaq' }, 'press_release', { terms, archives }), '/en/tag/model/peaq');
  // the source's `crew` archive for a technology value
  assert.equal(tagHref({ taxonomy: 'technology', slug: 'electromobility' }, 'press_release', { terms, archives }),
    'https://www.skoda-storyboard.com/en/tag/crew/electromobility/');
  // a non-facet term has no filter: its archive
  assert.equal(tagHref({ taxonomy: 'people', slug: 'stefani' }, 'press_release', { terms, archives }),
    'https://www.skoda-storyboard.com/en/tag/people/stefani/');
});

test('a press kit links the Press Kits filter', () => {
  assert.equal(tagHref({ taxonomy: 'years', slug: '2026' }, 'press_kit', { terms, archives }),
    'https://www.skoda-storyboard.com/en/press-kits/?filter%5Byears%5D%5B%5D=2026');
  assert.equal(filterHref('press-kits', 'history', 'lk motorcycle'), `${SOURCE_ORIGIN}/en/press-kits/?filter%5Bhistory%5D%5B%5D=lk%20motorcycle`);
  assert.equal(archiveHref('years', '2025'), `${SOURCE_ORIGIN}/en/tag/years/2025/`);
});

test('pills sort by label as plain text without case: "2026" before "4x4", "electromobility" before "eMobility" by letters', () => {
  const sorted = ['Peaq', '4x4 – all wheel drive', '2026', 'eMobility', 'electro vehicle'].map((label) => ({ label })).sort(byLabel);
  assert.deepEqual(sorted.map((x) => x.label), ['2026', '4x4 – all wheel drive', 'electro vehicle', 'eMobility', 'Peaq']);
});

test('a story: Peaq enters production (2 pills, as authored)', () => {
  const pills = derivedTags({ template: 'story', facets: { model: 'peaq', years: '2026' }, tags: '2026, peaq' }, { vocabulary, terms, archives });
  assert.deepEqual(pills, [
    { label: '2026', href: '/en/tag/years/2026' },
    { label: 'Peaq', href: '/en/tag/model/peaq' },
  ]);
});

test('a press release mixes archive and filter links, as the source', () => {
  const pills = derivedTags({ template: 'press_release', facets: { model: 'peaq', vip: 'graf-en', derivative: 'lk' } }, { vocabulary, terms, archives });
  assert.deepEqual(pills, [
    { label: 'Gräf', href: 'https://www.skoda-storyboard.com/en/news/?filter%5Bvip%5D%5B%5D=graf-en' },
    { label: 'L&K', href: 'https://www.skoda-storyboard.com/en/news/?filter%5Bderivative%5D%5B%5D=lk' },
    { label: 'Peaq', href: '/en/tag/model/peaq' },
  ]);
});

test('archive paths are the index rows under /en/tag/<taxonomy>/<slug>', () => {
  const set = archivePaths([{ path: '/en/tag/model/peaq' }, { path: '/en/tag/model' }, { path: '/en/category/emobility' }, {}, { path: '/en/tag/years/2026/' }]);
  assert.deepEqual([...set], ['/en/tag/model/peaq', '/en/tag/years/2026']);
});
