/*
 * Tests for the post-import metadata gate (SKODA-401 WS3).
 * Zero-dependency: node:test + node:assert. Run:
 *   node --test tools/importer/validate-metadata.test.mjs
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseMetadata, validateMetadata } from './validate-metadata.mjs';

const goodBlock = `
<div class="metadata">
  <div><div>Title</div><div>Elroq</div></div>
  <div><div>template</div><div>skoda_model</div></div>
  <div><div>category</div><div>skoda-model</div></div>
  <div><div>publisheddate</div><div>2024-10-15</div></div>
  <div><div>tags</div><div>elroq, 2026</div></div>
</div>`;

test('parseMetadata extracts key/value rows', () => {
  const m = parseMetadata(goodBlock);
  assert.equal(m.template, 'skoda_model');
  assert.equal(m.tags, 'elroq, 2026');
  assert.equal(m.publisheddate, '2024-10-15');
});

test('validateMetadata passes a well-formed block', () => {
  const res = validateMetadata(parseMetadata(goodBlock));
  assert.equal(res.ok, true);
  assert.deepEqual(res.issues, []);
  assert.equal(res.template, 'skoda_model');
});

test('validateMetadata flags a missing Metadata block', () => {
  const res = validateMetadata(parseMetadata('<div>no meta here</div>'));
  assert.equal(res.ok, false);
  assert.match(res.issues[0], /no Metadata block/);
});

test('validateMetadata flags missing tags/date/category (rail templates)', () => {
  const block = '<div class="metadata"><div><div>template</div><div>story</div></div></div>';
  const res = validateMetadata(parseMetadata(block));
  assert.equal(res.ok, false);
  assert.ok(res.issues.some((i) => /tags missing/.test(i)));
  assert.ok(res.issues.some((i) => /category missing/.test(i)));
  assert.ok(res.issues.some((i) => /publisheddate missing/.test(i)));
});

test('validateMetadata flags a bad template enum value', () => {
  const block = '<div class="metadata"><div><div>template</div><div>bogus</div></div>'
    + '<div><div>tags</div><div>x</div></div><div><div>category</div><div>c</div></div>'
    + '<div><div>publisheddate</div><div>2024-10-15</div></div></div>';
  const res = validateMetadata(parseMetadata(block));
  assert.ok(res.issues.some((i) => /not in enum/.test(i)));
});

test('validateMetadata flags a non-ISO date and empty tag tokens', () => {
  const block = '<div class="metadata"><div><div>template</div><div>story</div></div>'
    + '<div><div>category</div><div>c</div></div>'
    + '<div><div>publisheddate</div><div>15/10/2024</div></div>'
    + '<div><div>tags</div><div>a,,b</div></div></div>';
  const res = validateMetadata(parseMetadata(block));
  assert.ok(res.issues.some((i) => /not YYYY-MM-DD/.test(i)));
  assert.ok(res.issues.some((i) => /empty comma tokens/.test(i)));
});

test('validateMetadata relaxes rail facets for template=page', () => {
  const block = '<div class="metadata"><div><div>template</div><div>page</div></div></div>';
  const res = validateMetadata(parseMetadata(block));
  assert.equal(res.ok, true); // page is nav/utility → tags/date/category not required
});
