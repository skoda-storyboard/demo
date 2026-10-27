/*
 * The media detail panel's labels (SKODA-1003, PR #496 review): a panel built before the page
 * locale's placeholders sheet has loaded (a lightbox item built early and cached, the model
 * drawings' and press-kit images' wireImageLinks) relabels itself when the sheet arrives; one
 * built after it is localized at once; fixed labels are left alone.
 * Run: node --test scripts/media-panel.test.mjs
 */
/* global globalThis */
/* eslint-disable import/no-extraneous-dependencies */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<main></main>', { url: 'https://example.com/cs/e-mobilita-cs/epiq', pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
window.hlx = { codeBasePath: '' };
window.matchMedia = () => ({ matches: false, addEventListener() {} });

const SHEET = {
  data: [
    { Key: 'mediaPanelFileType', Text: 'Typ souboru' },
    { Key: 'mediaPanelRelatedArticle', Text: 'Související článek' },
  ],
};
let arrive = null;
globalThis.fetch = (url) => {
  if (String(url) !== '/cs/placeholders.json') return Promise.resolve({ ok: false, status: 404 });
  return new Promise((resolve) => {
    arrive = () => resolve({ ok: true, json: async () => SHEET });
  });
};

const { fetchPlaceholders, clearPlaceholdersCache } = await import('./placeholders.js');
const { buildMediaPanel } = await import('./media-panel.js');
const { feedLightboxItem } = await import('./media-lightbox.js');

const ROW = {
  template: 'image', id: '1', title: 'Epiq', filetype: 'JPG', related: '/cs/x', 'related-title': 'Epiq',
};
const labels = (caption) => [
  caption.querySelector('.lightbox-meta')?.firstChild?.nodeValue,
  caption.querySelector('.lightbox-related')?.firstChild?.nodeValue,
];
const settle = () => new Promise((r) => { setTimeout(r, 0); });

test('an item built while the sheet loads shows English, then the locale labels when it arrives', async () => {
  clearPlaceholdersCache();
  const loading = fetchPlaceholders(); // the page starts the sheet early
  const early = feedLightboxItem(ROW);
  assert.deepEqual(labels(early.caption), ['File type: ', 'Related article: '], 'English while loading');
  arrive();
  await loading;
  await settle();
  assert.deepEqual(labels(early.caption), ['Typ souboru: ', 'Související článek: '], 'the cached item relabels');
  assert.equal(early.caption.querySelector('.lightbox-meta strong').textContent, 'JPG', 'values untouched');
  // built after the sheet: Czech at once
  assert.deepEqual(labels(feedLightboxItem(ROW).caption), ['Typ souboru: ', 'Související článek: ']);
});

test('fixed labels are never replaced; a key the sheet lacks stays English', async () => {
  clearPlaceholdersCache();
  const loading = fetchPlaceholders();
  const fixed = buildMediaPanel({ meta: [['fileType', 'PDF']] }, { fileType: 'Kind' });
  const missing = buildMediaPanel({ meta: [['dimensions', '1920×1080']] });
  arrive();
  await loading;
  await settle();
  assert.equal(fixed.querySelector('.lightbox-meta').firstChild.nodeValue, 'Kind: ');
  assert.equal(missing.querySelector('.lightbox-meta').firstChild.nodeValue, 'Dimensions: ');
});
