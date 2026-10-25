/*
 * SKODA-842: the DA page templates carry valid Metadata once an author fills the prompts, and an
 * unfilled template fails the metadata gate. Run: node --test tools/library/templates.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { TEMPLATES } from './templates-spec.mjs';
import { SPEC } from './library-spec.mjs';
import { buildDocuments, instances, rows } from './build-library.mjs';
import { parseMetadata, validateMetadata } from '../importer/validate-metadata.mjs';
import { layoutTileRows } from '../../scripts/cards-tiles.js';

const html = (t) => t.sections.join('\n');
// what an author does: real date, slugs and words instead of the [prompts]
const fill = (s) => s
  .replace(/\[yyyy-mm-dd\]/g, '2026-10-10')
  .replace(/\[yyyy\]/g, '2026')
  .replace(/\[comma list[^\]]*\]/g, '2026, elroq')
  .replace(/\[optional[^\]]*\]/g, '')
  .replace(/\[[^\]]+\]/g, 'elroq');

const EXPECTED = {
  story: 'story',
  'press-release': 'press_release',
  'press-kit': 'press_kit',
  'press-kit-chapter': 'press_kit_chapter',
  'model-page': 'skoda_model',
};

test('the five templates the ticket lists', () => {
  assert.deepEqual(Object.keys(TEMPLATES).sort(), Object.keys(EXPECTED).sort());
});

Object.entries(TEMPLATES).forEach(([key, t]) => {
  test(`${key}: one Metadata table with the fixed template value`, () => {
    assert.equal((html(t).match(/<div class="metadata">/g) || []).length, 1);
    assert.equal(parseMetadata(html(t)).template, EXPECTED[key]);
  });

  test(`${key}: unfilled it fails the metadata gate, filled it passes`, () => {
    assert.equal(validateMetadata(parseMetadata(html(t))).ok, false);
    assert.deepEqual(validateMetadata(parseMetadata(fill(html(t)))).issues, []);
  });

  test(`${key}: only blocks the library offers`, () => {
    const used = [...html(t).matchAll(/<div class="([a-z][a-z0-9-]*)[ "]/g)].map((m) => m[1]);
    const known = new Set([...Object.keys(SPEC), 'section-metadata', 'metadata']);
    assert.deepEqual(used.filter((b) => !known.has(b)), []);
  });
});

test('press-kit hub: the tile rows fill the press grid', () => {
  const [tiles] = instances(html(TEMPLATES['press-kit']), 'cards');
  const tokens = rows(tiles.html).map((r) => r.match(/^<div><div>([a-z-]+)<\/div>/)[1]);
  assert.doesNotThrow(() => layoutTileRows(tokens, { pressPage: true }));
});

test('timeline: every variant has an insertable library example without a published source', () => {
  const { html: sample, report } = buildDocuments([]).timeline;
  const document = new JSDOM(sample).window.document;
  const blocks = [...document.querySelectorAll('.timeline')];
  assert.deepEqual(
    blocks.map((block) => [...block.classList].slice(1).join(' ')),
    ['', ...SPEC.timeline.variants.map((variant) => variant.class)],
  );
  assert.equal(document.querySelectorAll('.library-metadata').length, blocks.length);
  assert.equal(report.some((line) => line.includes('skipped')), false);
  blocks.forEach((block) => {
    const entries = [...block.children];
    assert.equal(entries.length, 2);
    entries.forEach((entry, index) => {
      assert.equal(entry.children.length, 5, 'year | title | image | description | optional space');
      const [year, title, image, description, space] = entry.children;
      assert.match(year.textContent, /^\d{4}$/);
      assert.equal(title.querySelectorAll(':scope > p').length, 3, 'maker, model and display note');
      assert.ok(title.querySelector('strong'));
      assert.ok(image.querySelector('picture > img[alt]'));
      assert.ok(description.querySelector('p').textContent.trim());
      assert.equal(space.textContent, index === 0 ? '15' : '');
    });
  });
});
