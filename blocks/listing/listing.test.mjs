/*
 * Unit tests for the Listing block's media card (SKODA-406): the card anatomy for image /
 * video feed rows, the lightbox wiring (open index, rebuild on new rows, actions excluded,
 * inert cart), and the full decorate path (media template switch; story rows unchanged).
 * Run: node --test blocks/listing/listing.test.mjs
 */
/* global globalThis */
/* eslint-disable import/no-extraneous-dependencies */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<main></main>', { url: 'https://example.com/en/images', pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
window.hlx = { codeBasePath: '' };
window.matchMedia = () => ({ matches: false, addEventListener() {} });

const imageRow = (n, extra = {}) => ({
  path: `https://cdn.example.com/img-${n}.jpg`,
  title: `img-${n}`,
  description: 'never shown',
  image: `https://cdn.example.com/img-${n}-768x512.jpg`,
  template: 'image',
  date: `2026-09-${String(10 + n).padStart(2, '0')}`,
  original: `https://cdn.example.com/img-${n}.jpg`,
  'rendition-1920': `https://cdn.example.com/img-${n}-1920x1280.jpg`,
  id: String(1000 + n),
  ...extra,
});
const videoRow = {
  path: 'https://vimeo.com/1223262231',
  title: 'Video | Peaq range record',
  image: 'https://i.vimeocdn.com/video/2196437413-d_1280x720.jpg',
  template: 'video',
  date: '2026-09-02',
  mp4: 'https://cdn.example.com/v.mp4',
  'vimeo-id': '1223262231',
  poster: 'https://i.vimeocdn.com/video/2196437413-d_1280x720.jpg',
  id: '452721',
};

// the index + placeholders the block fetches
let feed = [];
globalThis.fetch = async (url) => {
  const u = String(url);
  const body = u.includes('placeholders') ? { data: [] } : {
    total: feed.length, offset: 0, limit: feed.length, data: feed,
  };
  return { ok: true, status: 200, json: async () => body };
};

const {
  default: decorate, mediaCell, isMediaTemplate, wireMediaLightbox,
} = await import('./listing.js');

const click = (el, init = {}) => el.dispatchEvent(new window.MouseEvent('click', {
  bubbles: true, cancelable: true, button: 0, ...init,
}));
const openOverlay = () => [...document.querySelectorAll('.gallery-overlay')].find((o) => !o.hidden);
const settle = () => new Promise((r) => { setTimeout(r, 50); });

test('isMediaTemplate: only image and video listings get the media card', () => {
  assert.equal(isMediaTemplate('image'), true);
  assert.equal(isMediaTemplate('video'), true);
  assert.equal(isMediaTemplate('story'), false);
  assert.equal(isMediaTemplate(''), false);
});

test('image card: thumbnail link, date, title / filename, add + download menus, no description', () => {
  const li = mediaCell(imageRow(1), true);
  assert.equal(li.className, 'listing-item media-asset');
  const thumb = li.querySelector('a.media-asset-thumb');
  assert.equal(thumb.href, 'https://cdn.example.com/img-1.jpg');
  const img = thumb.querySelector('.listing-item-image picture img');
  assert.equal(img.alt, 'img-1');
  assert.equal(img.getAttribute('loading'), 'eager');
  assert.equal(img.getAttribute('fetchpriority'), 'high');
  assert.equal(li.querySelector('.media-card-play'), null);
  const time = li.querySelector('time.media-asset-date');
  assert.deepEqual([time.textContent, time.getAttribute('datetime')], ['11. 9. 2026', '2026-09-11']);
  assert.equal(li.querySelector('h3.media-asset-title').textContent, 'img-1');
  assert.equal(li.querySelector('.listing-item-body p'), null);
  assert.equal(li.textContent.includes('never shown'), false);
  assert.equal(li.querySelectorAll('.media-card-actions button.media-card-button').length, 2);
});

test('video card: play badge, lazy image, MP4 download, cart key', () => {
  const li = mediaCell(videoRow, false);
  assert.equal(li.className, 'listing-item media-asset video');
  assert.ok(li.querySelector('.listing-item-image .media-card-play'));
  assert.equal(li.querySelector('img').getAttribute('loading'), 'lazy');
  assert.equal(li.querySelector('.media-card-button.download').href, videoRow.mp4);
  assert.equal(li.querySelector('.media-card-button.add').dataset.id, '452721');
});

test('defensive: no image, no date, no files → a titled card with no empty controls', () => {
  const li = mediaCell({ template: 'image', title: 'bare', path: 'https://cdn.example.com/bare.jpg' }, false);
  assert.equal(li.querySelector('img'), null);
  assert.equal(li.querySelector('.media-asset-thumb').getAttribute('aria-label'), 'bare');
  assert.equal(li.querySelector('time'), null);
  assert.equal(li.querySelector('.media-card-actions'), null);
});

test('lightbox: a card click opens it at that card, actions and modifier clicks do not', async () => {
  const grid = document.createElement('ul');
  document.querySelector('main').replaceChildren(grid);
  let rows = [imageRow(1), imageRow(2), imageRow(3)];
  rows.forEach((r) => grid.append(mediaCell(r, false)));
  wireMediaLightbox(grid, () => rows);

  click(grid.children[1].querySelector('.media-asset-thumb'), { metaKey: true });
  await settle();
  assert.equal(openOverlay(), undefined, 'modifier click keeps the link');

  click(grid.children[1].querySelector('.media-card-button.download'));
  await settle();
  assert.equal(openOverlay(), undefined, 'the actions never open the lightbox');

  const title = grid.children[1].querySelector('.media-asset-title');
  assert.equal(click(title), false, 'the click is taken over (preventDefault)');
  await settle();
  const overlay = openOverlay();
  assert.ok(overlay, 'opened');
  assert.match(overlay.querySelector('.gallery-lightbox-count').textContent.replace(/\s+/g, ''), /^2\/3/);

  // new rows (load more / filter): the next open rebuilds and drops the old overlay
  overlay.hidden = true;
  rows = [...rows, imageRow(4)];
  grid.append(mediaCell(rows[3], false));
  click(grid.children[3].querySelector('.media-asset-thumb'));
  await settle();
  assert.equal(document.querySelectorAll('.gallery-overlay').length, 1);
  assert.match(openOverlay().querySelector('.gallery-lightbox-count').textContent.replace(/\s+/g, ''), /^4\/4/);
});

test('the inert cart button does not navigate', () => {
  const grid = document.createElement('ul');
  document.querySelector('main').replaceChildren(grid);
  grid.append(mediaCell(videoRow, false));
  wireMediaLightbox(grid, () => [videoRow]);
  const add = grid.querySelector('.media-card-button.add');
  assert.equal(add.getAttribute('aria-disabled'), 'true');
  assert.equal(click(add), false, 'default prevented');
});

// each test uses its own index URL: loadQueryIndex memoizes per URL
function listingBlock(template, index) {
  const block = document.createElement('div');
  block.className = 'listing';
  [['index', index], ['template', template], ['perpage', '2'], ['columns', '4']].forEach(([k, v]) => {
    const row = document.createElement('div');
    row.innerHTML = `<div>${k}</div><div>${v}</div>`;
    block.append(row);
  });
  document.querySelector('main').replaceChildren(block);
  return block;
}

test('decorate: an image listing renders media cards and the media classes', async () => {
  feed = [imageRow(1), imageRow(2), imageRow(3), { ...imageRow(4), template: 'story' }];
  const block = listingBlock('image', '/en/media-feed.json');
  await decorate(block);
  assert.ok(block.classList.contains('listing-media'));
  assert.ok(block.classList.contains('listing-image'));
  const cards = [...block.querySelectorAll('.listing-items > li')];
  assert.equal(cards.length, 2);
  assert.ok(cards.every((c) => c.classList.contains('media-asset')));
  // newest first
  assert.deepEqual(cards.map((c) => c.querySelector('h3').textContent), ['img-3', 'img-2']);
});

test('decorate: a story listing keeps the story card (picture, title, description)', async () => {
  feed = [{
    path: '/en/story-a', title: 'Story A', description: 'Summary A', image: '/media_1.jpg', template: 'story', date: '2026-09-01',
  }];
  const block = listingBlock('story', '/en/query-index.json');
  await decorate(block);
  assert.equal(block.classList.contains('listing-media'), false);
  const li = block.querySelector('.listing-items > li');
  assert.equal(li.className, 'listing-item');
  assert.equal(li.querySelector('a.listing-item-link').getAttribute('href'), '/en/story-a');
  assert.equal(li.querySelector('.listing-item-body h3').textContent, 'Story A');
  assert.equal(li.querySelector('.listing-item-body p').textContent, 'Summary A');
  assert.equal(li.querySelector('.media-card-actions, time'), null);
});
