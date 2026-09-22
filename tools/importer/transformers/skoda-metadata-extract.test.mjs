/*
 * Unit tests for the pure metadata-derivation helpers (SKODA-401).
 * Zero-dependency: node:test + node:assert. No DOM, no live network.
 * Run: node --test tools/importer/transformers/skoda-metadata-extract.test.mjs
 *
 * These test the DERIVATION RULES the transformer (skoda-metadata.js) relies on.
 * The DOM glue in the transformer is separately validated live by the
 * import-validator PostToolUse hook.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  pickDate, normalizeDate, templateFromBodyClass, categoryFromUrl,
  parseTagHref, groupTags, splitList, buildMetaFields, FACETS,
} from './skoda-metadata-extract.mjs';

// ---- date: 4-way fallback + normalization --------------------------------
test('pickDate prefers article:published_time, normalizes to YYYY-MM-DD', () => {
  assert.equal(pickDate({ articlePublishedTime: '2026-09-15T08:05:00+00:00' }), '2026-09-15');
});

test('pickDate falls through to JSON-LD then entry-published', () => {
  assert.equal(pickDate({ jsonLdDatePublished: '2024-10-15T09:00:02+00:00' }), '2024-10-15');
  assert.equal(pickDate({ entryPublished: 'Published 2023-02-01' }), '2023-02-01');
  assert.equal(pickDate({}), '');
});

test('normalizeDate ignores non-date text', () => {
  assert.equal(normalizeDate('not a date'), '');
  assert.equal(normalizeDate('2026-01-02T00:00:00Z'), '2026-01-02');
});

// ---- template from body class --------------------------------------------
test('templateFromBodyClass maps CPT signals (model, story, press_release)', () => {
  assert.equal(templateFromBodyClass('wp-singular skoda_model-template-default single single-skoda_model media-room'), 'skoda_model');
  assert.equal(templateFromBodyClass('post-template post-template-template-layout-article single single-post'), 'story');
  assert.equal(templateFromBodyClass('single single-press_release press_release-template-default'), 'press_release');
  assert.equal(templateFromBodyClass('single single-press_kit'), 'press_kit');
  assert.equal(templateFromBodyClass('page-template-default'), 'page');
  assert.equal(templateFromBodyClass('nothing-special'), '');
});

// ---- category from url path segment --------------------------------------
test('categoryFromUrl takes the family segment after the locale', () => {
  assert.equal(categoryFromUrl('https://x/en/emobility/some-story/'), 'emobility');
  assert.equal(categoryFromUrl('https://x/en/press-releases/foo/'), 'press-releases');
  assert.equal(categoryFromUrl('https://x/en/skoda-model/elroq/'), 'skoda-model');
  assert.equal(categoryFromUrl('not a url'), '');
});

// ---- tag href parsing (both measured shapes) -----------------------------
test('parseTagHref handles /tag/<taxonomy>/<slug>/ and ?filter[..][]=', () => {
  assert.deepEqual(parseTagHref('https://x/en/tag/model/epiq/'), { taxonomy: 'model', slug: 'epiq' });
  assert.deepEqual(parseTagHref('/en/tag/years/2026/'), { taxonomy: 'years', slug: '2026' });
  assert.deepEqual(parseTagHref('/en/news/?filter[years][]=2026'), { taxonomy: 'years', slug: '2026' });
  assert.equal(parseTagHref('/en/about/'), null);
});

test('groupTags dedupes and groups by taxonomy (story: years+model)', () => {
  const { tags, byFacet } = groupTags([
    '/en/tag/years/2026/', '/en/tag/model/epiq/', '/en/tag/model/epiq/', // dup
    '/en/news/?filter[model][]=elroq',
  ]);
  assert.deepEqual(tags, ['2026', 'epiq', 'elroq']);
  assert.deepEqual(byFacet.years, ['2026']);
  assert.deepEqual(byFacet.model, ['epiq', 'elroq']);
});

// ---- assembly: contract shape --------------------------------------------
test('buildMetaFields comma-joins tags + per-facet columns; merges overrides', () => {
  const derived = groupTags(['/en/tag/model/epiq/', '/en/tag/years/2026/']);
  const { meta, tags } = buildMetaFields({
    title: 'Epiq story',
    publisheddate: '2026-09-15',
    template: 'story',
    category: 'emobility',
    derived,
    overrides: { model: 'elroq', tags: 'facelift' }, // override adds model+tag
  });
  assert.equal(meta.Title, 'Epiq story');
  assert.equal(meta.template, 'story');
  assert.equal(meta.category, 'emobility');
  // tags = derived (epiq,2026) ∪ override (facelift), comma-joined
  assert.equal(meta.tags, 'epiq, 2026, facelift');
  assert.deepEqual(tags, ['epiq', '2026', 'facelift']);
  // model facet = derived(epiq) ∪ override(elroq)
  assert.equal(meta.model, 'epiq, elroq');
  assert.equal(meta.years, '2026');
});

test('buildMetaFields omits empty fields and unused facets', () => {
  const { meta } = buildMetaFields({ title: 'x', derived: { tags: [], byFacet: {} } });
  assert.equal(meta.Title, 'x');
  assert.equal('tags' in meta, false);
  assert.equal('model' in meta, false);
  assert.equal('publisheddate' in meta, false);
});

test('FACETS is exactly the documented 15', () => {
  assert.equal(FACETS.length, 15);
  assert.ok(FACETS.includes('model') && FACETS.includes('vip') && FACETS.includes('sponsorship'));
});

test('splitList trims and drops empties', () => {
  assert.deepEqual(splitList('a, b ,, c'), ['a', 'b', 'c']);
  assert.deepEqual(splitList(''), []);
});
