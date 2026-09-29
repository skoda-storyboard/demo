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
  feedRow, feedSheet, itemSlug, sourceOrder, FACETS, DETAIL_FIELDS, parseDetailPanel, ajaxNonce,
  detailRequest, parseAssetLinks, assetItem, requiredDetails, detailGaps, unknownGaps,
  feedMediaRefs, feedCoverageGaps,
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

test('detail panel (shape 4): file metadata, tag labels and the related article', { skip }, () => {
  const panel = parseDetailPanel(doc('detail-450812'));
  assert.deepEqual(panel, {
    filetype: 'JPG',
    filesize: '10 MB',
    length: '',
    bitrate: '',
    audioformat: '',
    dimensions: '8256 × 5504 px',
    labels: '2026, Octavia',
    related: 'https://www.skoda-storyboard.com/en/press-releases/skoda-octavia-turns-30-three-decades-of-a-brand-icon/',
    'related-title': 'Škoda Octavia turns 30: Three decades of a brand icon',
  });
  const empty = parseDetailPanel(new JSDOM('<div><ol class="entry-tags tag-list"></ol></div>').window.document);
  assert.ok(DETAIL_FIELDS.every((f) => empty[f] === ''), 'an empty source panel gives empty fields');
  const row = feedRow({
    id: '1', type: 'image', title: 'T', date: '2026-08-27', terms: {}, original: '/o.jpg', ...panel,
  });
  DETAIL_FIELDS.forEach((f) => assert.equal(row[f], panel[f]));
});

test('detail request: the source ajax loader call with the page nonce', () => {
  assert.equal(ajaxNonce('<script>var skoda_ajax_loader = {"ajax_url":"https:\\/\\/x","nonce":"8d4ff79608"};</script>'), '8d4ff79608');
  assert.equal(ajaxNonce('<p>none</p>'), '');
  const { url, body } = detailRequest(450812, 'abc');
  assert.equal(url, 'https://www.skoda-storyboard.com/wp/wp-admin/admin-ajax.php');
  const q = new URLSearchParams(body);
  assert.equal(q.get('template'), 'templates/image-overlay-meta-data');
  assert.equal(q.get('query_vars[p]'), '450812');
  assert.equal(q.get('nonce'), 'abc');
});

test('assets (shape 5): images the page copy links to, not listing cards; titled from the panel', { skip }, () => {
  const page = new JSDOM(`<article class="skoda_model media-cart-item"><div class="textwidget">
    <p><a href="https://cdn.skoda-storyboard.com/2024/03/OCT_FL_149_limo_7299ddc7.jpg"><img class="aligncenter wp-image-361053 size-full" alt="Technical drawings limo"></a></p>
    <p><a href="https://cdn.skoda-storyboard.com/2024/03/OCT_FL_149_limo_7299ddc7.jpg"><img class="wp-image-361053" alt="again"></a></p>
    <p><a href="https://www.skoda-storyboard.com/en/x/"><img class="wp-image-9" alt="not an image link"></a></p>
  </div></article>
  <article class="article-teaser media-cart-item image"><a href="https://cdn.skoda-storyboard.com/2026/08/card.jpg"><img class="wp-image-1" alt="card"></a></article>`).window.document;
  const links = parseAssetLinks(page);
  assert.deepEqual(links, [{ id: '361053', original: 'https://cdn.skoda-storyboard.com/2024/03/OCT_FL_149_limo_7299ddc7.jpg', alt: 'Technical drawings limo' }]);
  const panel = new JSDOM(`<p>Technical drawings limo</p><div class="media-meta"><div class="meta-filetype">File type: <strong>JPG</strong></div>
    <div class="meta-filesize">File size: <strong>599 KB</strong></div><div class="meta-dimensions">Dimensions: <strong>3151&nbsp;×&nbsp;1847 px</strong></div>
    <div class="meta-published">Published: <strong>22. 3. 2024</strong></div></div>`).window.document;
  const row = feedRow(assetItem(links[0], panel));
  assert.equal(row.template, 'asset');
  assert.equal(row.category, 'assets');
  assert.equal(row.title, 'Technical drawings limo');
  assert.equal(row.date, '2024-03-22');
  assert.equal(row.path, links[0].original);
  assert.equal(row.filesize, '599 KB');
  assert.equal(row.dimensions, '3151 × 1847 px');
  assert.equal(row.tags, '', 'no facets: never in a listing or rail');
});

test('video detail panel (shape 6): length, bitrate and audio format', { skip }, () => {
  const d = new JSDOM(`<div class="media-meta"><div class="meta-filetype">File type: <strong>MP4</strong></div>
    <div class="meta-length">Length: <strong>14:05</strong></div><div class="meta-bitrate">Bitrate: <strong>29994kb/s</strong></div>
    <div class="meta-dataformat">Audio format: <strong>quicktime</strong></div></div>`).window.document;
  const panel = parseDetailPanel(d);
  assert.equal(panel.length, '14:05');
  assert.equal(panel.bitrate, '29994kb/s');
  assert.equal(panel.audioformat, 'quicktime');
});

test('detail gate: files need type, size and dimensions; Vimeo-only videos need none', () => {
  assert.deepEqual(requiredDetails({ type: 'image' }), ['filetype', 'filesize', 'dimensions']);
  assert.deepEqual(requiredDetails({ type: 'asset' }), ['filetype', 'filesize', 'dimensions']);
  assert.deepEqual(requiredDetails({ type: 'video', mp4: 'https://cdn.example/v.mp4' }), ['filetype', 'filesize', 'dimensions']);
  assert.deepEqual(requiredDetails({ type: 'video', mp4: '' }), []);
  const gaps = detailGaps([
    { id: '451237', type: 'image', title: 'Empty panel' },
    {
      id: '1', type: 'image', title: 'OK', filetype: 'JPG', filesize: '6 MB', dimensions: '5000 × 7496 px',
    },
    { id: '2', type: 'video', title: 'Vimeo only' },
  ]);
  assert.deepEqual(gaps, [{
    id: '451237', type: 'image', title: 'Empty panel', missing: ['filetype', 'filesize', 'dimensions'],
  }]);
});

test('detail gate: only a recorded source gap, for the fields it lists, lets a row through', () => {
  const gaps = [
    { id: '445970', missing: ['filetype', 'filesize', 'dimensions'] },
    { id: '396289', missing: ['dimensions'] },
    { id: '396289b', missing: ['filesize'] },
    { id: '451237', missing: ['filetype'] },
  ];
  const known = {
    445970: { missing: ['filetype', 'filesize', 'dimensions'] },
    396289: { missing: ['dimensions'] },
    '396289b': { missing: ['dimensions'] },
  };
  assert.deepEqual(unknownGaps(gaps, known).map((g) => g.id), ['396289b', '451237']);
});

test('feed media refs: every binary a row serves, with its home folder (manifest traceability)', () => {
  const sheet = {
    data: [
      {
        id: '409837',
        template: 'image',
        title: 'Infographic',
        image: 'https://cdn.skoda-storyboard.com/2025/06/i-768x432.jpg',
        'rendition-1920': 'https://cdn.skoda-storyboard.com/2025/06/i-1920x1080.jpg',
        original: 'https://cdn.skoda-storyboard.com/2025/06/i.jpg',
      },
      {
        id: '410179',
        template: 'video',
        title: 'Footage',
        poster: 'https://i.vimeocdn.com/video/1-d_1280x720.jpg',
        image: 'https://i.vimeocdn.com/video/1-d_1280x720.jpg',
        mp4: 'https://cdn.skoda-storyboard.com/2025/06/f.mp4',
      },
      {
        id: '361053', template: 'asset', title: 'Drawing', original: 'https://cdn.skoda-storyboard.com/2024/03/d.jpg', image: 'https://cdn.skoda-storyboard.com/2024/03/d.jpg',
      },
      { id: 'x', template: 'story', image: 'https://cdn.skoda-storyboard.com/s.jpg' },
    ],
  };
  const refs = feedMediaRefs(sheet);
  assert.deepEqual(refs.map((r) => `${r.id} ${r.field} ${r.kind} ${r.home}`), [
    '409837 image image en/images', '409837 rendition-1920 image en/images', '409837 original image en/images',
    '410179 poster image en/videos', '410179 mp4 video en/videos',
    '361053 image image en/assets', '361053 original image en/assets',
  ]);
  // a manifest row by logical id (the master) covers every rendition of that image
  const rows = { 'x__i.jpg': {} };
  const covered = { 'row-a': { seen_urls: ['https://i.vimeocdn.com/video/1-d_1280x720.jpg'] } };
  assert.equal(feedCoverageGaps(sheet, { ...covered }).length, 6, 'only the poster is recorded');
  assert.ok(feedCoverageGaps(sheet, rows).length > 0);
});
