/*
 * SKODA-608: image/video item pages from the source listing cards.
 * Fixtures: test/fixtures/media-items/{images,videos}-peaq.html (source listings filtered by
 * model=peaq, trimmed to 12 cards; test/* is .hlxignore'd).
 * Run: node --test tools/importer/media-items/media-items.test.mjs
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  slugify, isoDate, cdnUrl, vimeoPoster, facetOptions, cardTerms, parseCards, mergeItems,
  feedRow, feedSheet, itemSlug, sourceOrder, FACETS,
} from './media-items-lib.mjs';
import { listingUrl } from './build-media-items.mjs';

let JSDOM = null;
try {
  const req = createRequire('/home/node/.excat-marketplaces/excat-marketplace/excat/hooks/import-validator/');
  // eslint-disable-next-line import/no-unresolved
  ({ JSDOM } = req('jsdom'));
} catch {
  try {
    const req = createRequire(import.meta.url);
    // eslint-disable-next-line import/no-unresolved
    ({ JSDOM } = req('jsdom'));
  } catch { /* jsdom unavailable — skip */ }
}
const skip = JSDOM ? false : 'jsdom not installed — DOM tests skip';

const FIXTURES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../test/fixtures/media-items');
const doc = (name) => new JSDOM(readFileSync(path.join(FIXTURES, `${name}.html`), 'utf8')).window.document;
const YEARS = { 61572: '2026' };

test('pure helpers: slug, date, CDN URL, Vimeo poster, listing URL', () => {
  assert.equal(slugify('013_Skoda_Peaq_Sportline__Skoda_Epiq_d0017674'), '013-skoda-peaq-sportline-skoda-epiq-d0017674');
  assert.equal(isoDate('21. 9. 2026'), '2026-09-21');
  assert.equal(isoDate(''), '');
  assert.equal(cdnUrl('/direct-download/2026/08/a_b-1920x1280.jpg'), 'https://cdn.skoda-storyboard.com/2026/08/a_b-1920x1280.jpg');
  assert.equal(cdnUrl('https://www.skoda-storyboard.com/direct-download/2026/08/x.mp4/'), 'https://cdn.skoda-storyboard.com/2026/08/x.mp4');
  assert.equal(cdnUrl('#'), '');
  assert.equal(vimeoPoster('https://i.vimeocdn.com/video/2196437413-81d8-d_295x166?region=us'), 'https://i.vimeocdn.com/video/2196437413-81d8-d_1280x720.jpg');
  assert.equal(vimeoPoster('https://example.com/x.jpg'), '');
  assert.equal(itemSlug('https://www.skoda-storyboard.com/?attachment_id=451237', 'https://cdn.skoda-storyboard.com/2026/08/013_Skoda_Peaq.jpg'), '013-skoda-peaq');
  assert.equal(itemSlug('https://www.skoda-storyboard.com/en/press-kits/x/videos/attachment/klip_epiq_peaq_uhd_201c18c6/', ''), 'klip-epiq-peaq-uhd-201c18c6');
  assert.equal(
    listingUrl({ type: 'image', filter: { model: 'peaq' }, n: 30 }),
    'https://www.skoda-storyboard.com/en/images/?filter%5Bmodel%5D%5B%5D=peaq&ajax_search_results_image=30',
  );
});

test('facet options come from the listing form, with labels', { skip }, () => {
  const opts = facetOptions(doc('images-peaq'));
  assert.equal(opts.get('model:peaq'), 'Peaq');
  assert.ok(opts.has('years:2026'));
  assert.ok(opts.has('view:interior'));
  assert.ok(!opts.has('view:exter'), 'stray terms are not offered');
});

test('card terms: only offered values, years resolved by term id', { skip }, () => {
  const d = new JSDOM('<article class="media-cart-item image model-peaq model-peaq-sk view-exter view-exterior years-61572 category-peaq-en"></article>').window.document;
  const opts = new Map([['model:peaq', 'Peaq'], ['view:exterior', 'Exterior'], ['years:2026', '2026']]);
  assert.deepEqual(cardTerms(d.querySelector('article'), opts, YEARS), { model: ['peaq'], view: ['exterior'], years: ['2026'] });
});

test('image cards: CDN master + 1920, date, caption, path, terms', { skip }, () => {
  const items = parseCards(doc('images-peaq'), { yearsById: YEARS });
  assert.equal(items.length, 12);
  items.forEach((i) => {
    assert.equal(i.type, 'image');
    assert.match(i.path, /^\/en\/images\/[a-z0-9-]+$/);
    assert.match(i.original, /^https:\/\/cdn\.skoda-storyboard\.com\/\d{4}\/\d{2}\//);
    assert.equal(i.image, i.original);
    assert.match(i.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(i.terms.model.includes('peaq'));
    assert.ok((i.terms.years || []).includes('2026'));
  });
  assert.ok(items.some((i) => /-1920x\d+\.jpg$/.test(i['rendition-1920'])));
});

test('video cards: Vimeo id, CDN MP4, poster as .jpg', { skip }, () => {
  const items = parseCards(doc('videos-peaq'), { yearsById: YEARS });
  assert.equal(items.length, 12);
  items.forEach((i) => {
    assert.equal(i.type, 'video');
    assert.match(i.path, /^\/en\/videos\//);
    assert.match(i['vimeo-id'], /^\d+$/);
    assert.match(i.mp4, /^https:\/\/cdn\.skoda-storyboard\.com\/.+\.mp4$/i);
    if (i.poster) assert.match(i.poster, /-d_1280x720\.jpg$/);
  });
});

test('merge: dedupe by source id, union terms, resolve slug collisions', () => {
  const a = {
    id: '1', path: '/en/images/x', slug: 'x', terms: { model: ['peaq'] },
  };
  const b = {
    id: '1', path: '/en/images/x', slug: 'x', terms: { model: ['epiq'] },
  };
  const c = {
    id: '2', path: '/en/images/x', slug: 'x', terms: {},
  };
  const out = mergeItems([[a], [b, c]]);
  assert.equal(out.length, 2);
  assert.deepEqual(out[0].terms.model, ['peaq', 'epiq']);
  assert.equal(out[1].path, '/en/images/x-2');
});

test('merge keeps the source listing order across listings; same-day feed rows keep it', () => {
  const item = (id, date) => ({
    id, date, type: 'image', title: id, path: `/en/images/${id}`, slug: id, original: `/${id}.jpg`, terms: {},
  });
  // two filtered slices of one source order: 4 3 1 2 5 (4, 3, 1, 2 share a day)
  const octavia = [item('4', '2025-06-23'), item('1', '2025-06-23'), item('5', '2025-06-01')];
  const peaq = [item('3', '2025-06-23'), item('1', '2025-06-23'), item('2', '2025-06-23')];
  const all = [item('4', '2025-06-23'), item('3', '2025-06-23')];
  assert.deepEqual(sourceOrder([octavia, peaq, all]), ['4', '3', '1', '2', '5']);
  const sheet = feedSheet(mergeItems([octavia, peaq, all]));
  assert.deepEqual(sheet.data.map((r) => r.id), ['4', '3', '1', '2', '5'], 'not re-sorted by path');
});

test('image feed row: listing/rail columns, facets, download fields, thumbnail', { skip }, () => {
  const d = doc('images-peaq');
  const [item] = parseCards(d, { yearsById: YEARS });
  const row = feedRow(item);
  assert.equal(row.template, 'image');
  assert.equal(row.category, 'images');
  assert.equal(row.path, item.original, 'card links to the image until the SKODA-406 lightbox');
  assert.match(row.image, /^https:\/\/cdn\.skoda-storyboard\.com\/.+-\d+x\d+\.[a-z]+$/i, 'small source rendition as the thumbnail');
  assert.match(row.date, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(row.model.split(', ').includes('peaq'));
  assert.equal(row.original, item.original);
  assert.equal(row.mp4, '');
  FACETS.forEach((f) => { assert.equal(typeof row[f], 'string'); if (row[f]) assert.ok(row.tags.includes(row[f].split(', ')[0])); });
  Object.values(row).forEach((v) => assert.equal(typeof v, 'string', 'every cell is a string'));
});

test('video feed row: Vimeo link, MP4 + poster fields', { skip }, () => {
  const item = parseCards(doc('videos-peaq'), { yearsById: YEARS }).find((i) => i.poster);
  const row = feedRow(item);
  assert.equal(row.template, 'video');
  assert.equal(row.path, `https://vimeo.com/${item['vimeo-id']}`);
  assert.equal(row.image, item.poster);
  assert.equal(row['vimeo-id'], item['vimeo-id']);
  assert.equal(row.mp4, item.mp4);
});

test('feed sheet: DA sheet shape, newest first, query-index compatible', { skip }, () => {
  const items = mergeItems([parseCards(doc('images-peaq'), { yearsById: YEARS }), parseCards(doc('videos-peaq'), { yearsById: YEARS })]);
  const sheet = feedSheet(items);
  assert.equal(sheet[':type'], 'sheet');
  assert.equal(sheet.total, sheet.data.length);
  assert.equal(sheet.limit, sheet.data.length);
  assert.equal(sheet.offset, 0);
  assert.equal(sheet.data.length, 24);
  const dates = sheet.data.map((r) => r.date);
  assert.deepEqual(dates, [...dates].sort().reverse());
  assert.deepEqual(new Set(sheet.data.map((r) => r.template)), new Set(['image', 'video']));
});
