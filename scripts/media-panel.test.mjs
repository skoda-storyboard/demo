/*
 * The media detail panel's labels (SKODA-1003, PR #496 review): a panel built before the page
 * locale's placeholders sheet has loaded relabels itself when the sheet arrives, and so does the
 * copy an open lightbox shows; one built after it is localized at once; fixed labels are left
 * alone. Image links in page copy (the model drawings, press-kit images: wireImageLinks) build
 * their lightbox only once the sheet has settled.
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
    { Key: 'lightboxClose', Text: 'Zavřít galerii' },
  ],
};
const IMAGE = 'https://cdn.example.com/2026/08/epiq-drawing.jpg';
const ROW = {
  template: 'image', id: '1', title: 'Epiq', filetype: 'JPG', related: '/cs/x', 'related-title': 'Epiq', original: IMAGE,
};
let arrive = null;
globalThis.fetch = (url) => {
  const u = String(url);
  if (u.endsWith('/cs/media-feed.json')) {
    return Promise.resolve({ ok: true, json: async () => ({ data: [ROW] }) });
  }
  if (u !== '/cs/placeholders.json') return Promise.resolve({ ok: false, status: 404 });
  return new Promise((resolve) => {
    arrive = () => resolve({ ok: true, json: async () => SHEET });
  });
};

const { fetchPlaceholders, clearPlaceholdersCache } = await import('./placeholders.js');
const { buildMediaPanel, relabelMediaPanel } = await import('./media-panel.js');
const { feedLightboxItem, wireImageLinks } = await import('./media-lightbox.js');
const { buildLightbox } = await import('./lightbox.js');

const labels = (root) => [
  root.querySelector('.lightbox-meta')?.firstChild?.textContent,
  root.querySelector('.lightbox-related')?.firstChild?.textContent,
];
const settle = (ms = 0) => new Promise((r) => { setTimeout(r, ms); });

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
  assert.equal(fixed.querySelector('.lightbox-meta').firstChild.textContent, 'Kind: ');
  assert.equal(missing.querySelector('.lightbox-meta').firstChild.textContent, 'Dimensions: ');
  // a copy of a fixed-label panel: still not a sheet label
  const copy = document.createElement('div');
  copy.append(fixed.cloneNode(true));
  relabelMediaPanel(copy, { mediaPanelFileType: 'Typ souboru' });
  assert.equal(copy.querySelector('.lightbox-meta').firstChild.textContent, 'Kind: ');
});

test('an open lightbox relabels the caption it shows when the sheet arrives, in place', async () => {
  clearPlaceholdersCache();
  const loading = fetchPlaceholders();
  const host = document.createElement('div');
  document.querySelector('main').replaceChildren(host);
  const { open, overlay } = buildLightbox(host, [feedLightboxItem(ROW)]);
  open(0);
  const shown = overlay.querySelector('.gallery-lightbox-caption');
  assert.deepEqual(labels(shown), ['File type: ', 'Related article: '], 'English while loading');
  const link = shown.querySelector('.lightbox-related a');
  link.focus();
  const meta = shown.querySelector('.lightbox-meta');
  arrive();
  await loading;
  await settle();
  assert.equal(overlay.hidden, false, 'still open');
  assert.deepEqual(labels(shown), ['Typ souboru: ', 'Související článek: '], 'the shown copy relabels');
  assert.equal(shown.querySelector('.lightbox-meta'), meta, 'the same nodes: not re-rendered');
  assert.equal(document.activeElement, link, 'focus stays on the related link');
  assert.equal(meta.querySelector('strong').textContent, 'JPG', 'values untouched');
  overlay.remove();
});

test('image links build their lightbox once the sheet settles: Czech at once, one overlay', async () => {
  clearPlaceholdersCache();
  fetchPlaceholders(); // the page starts the sheet early; it is still pending at the click
  document.body.querySelectorAll('.gallery-overlay').forEach((o) => o.remove());
  const a = document.createElement('a');
  a.href = IMAGE;
  a.innerHTML = `<img src="${IMAGE}" alt="Epiq drawing">`;
  document.querySelector('main').replaceChildren(a);
  wireImageLinks([a]);
  const click = () => a.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
  click();
  click(); // a second click while the first still waits
  await settle(20);
  assert.equal(document.querySelectorAll('.gallery-overlay').length, 0, 'nothing built while the sheet is pending');
  arrive();
  await settle(20);
  const overlays = document.querySelectorAll('.gallery-overlay');
  assert.equal(overlays.length, 1, 'one overlay for both clicks');
  assert.equal(overlays[0].hidden, false, 'open');
  assert.deepEqual(labels(overlays[0].querySelector('.gallery-lightbox-caption')), ['Typ souboru: ', 'Související článek: ']);
  assert.equal(overlays[0].querySelector('.gallery-lightbox-close').getAttribute('aria-label'), 'Zavřít galerii');
  overlays[0].remove();
});
