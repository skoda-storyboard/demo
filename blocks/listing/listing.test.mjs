/*
 * Unit tests for the Listing block:
 * - the media card (SKODA-406): the card anatomy for image / video feed rows, the lightbox
 *   wiring (open index, rebuild on new rows, actions excluded, inert cart), and the decorate
 *   path (media template switch; story rows unchanged);
 * - the filter panel and its flows (SKODA-402a): structure, "Advanced filter (n)", Esc, deep
 *   links, and the settle → veil → update → collapse flow of picks, chip removal and sort,
 *   plus the Load more loader (mock timers).
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
  default: decorate, mediaCell, isMediaTemplate, wireMediaLightbox, valueLabel,
  FILTER_SETTLE_MS, VEIL_MS, LOAD_MORE_MS,
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

test('lightbox load failure: the click falls back to the thumbnail link', async () => {
  const grid = document.createElement('ul');
  document.querySelector('main').replaceChildren(grid);
  const rows = [imageRow(7)];
  grid.append(mediaCell(rows[0], false));
  const went = [];
  const errors = [];
  const { error } = console;
  // eslint-disable-next-line no-console
  console.error = (...args) => errors.push(args.join(' '));
  wireMediaLightbox(grid, () => rows, {
    load: async () => { throw new Error('chunk failed'); },
    navigate: (url) => went.push(url),
  });
  click(grid.querySelector('.media-asset-title'));
  await settle();
  // eslint-disable-next-line no-console
  console.error = error;
  assert.deepEqual(went, ['https://cdn.example.com/img-7.jpg']);
  assert.ok(errors.some((m) => m.includes('lightbox load failed')));
});

test('mediaCell passes its labels to the actions', () => {
  const li = mediaCell(imageRow(8), false, { add: 'Přidat do košíku', download: 'Stáhnout' });
  const [add, dl] = li.querySelectorAll('button.media-card-button');
  assert.equal(add.getAttribute('aria-label'), 'Přidat do košíku: img-8');
  assert.equal(dl.getAttribute('aria-label'), 'Stáhnout: img-8');
});

// ---- SKODA-402a: facets collapsed behind "Advanced filter (n)" ------------------------
const storyRow = (n, model, bodywork = n % 2 ? 'SUV' : 'Combi') => ({
  path: `/en/s-${n}`, title: `Story ${n}`, image: '/media_1.jpg', template: 'story', date: `2026-09-${String(10 + n).padStart(2, '0')}`, model, bodywork,
});
const key = (el, k) => el.dispatchEvent(new window.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
async function facetListing(index, search = '', rows = null) {
  window.history.replaceState(null, '', `/en/news${search}`);
  feed = rows || [storyRow(1, 'Peaq'), storyRow(2, 'Epiq'), storyRow(3, 'Peaq, Elroq')];
  const block = listingBlock('story', index);
  await decorate(block);
  return {
    block,
    toggle: block.querySelector('.listing-filter-toggle'),
    panel: block.querySelector('.listing-facets'),
  };
}

test('402a: source order — facet panel (pills, options, chips), sort row (with the toggle), grid, count, load more', async () => {
  const { block } = await facetListing('/en/order-index.json');
  assert.deepEqual([...block.children].map((c) => c.className.split(' ')[0]), [
    'listing-facets', 'listing-sort', 'listing-status', 'listing-items', 'listing-count', 'listing-loadmore',
  ]);
  assert.deepEqual([...block.querySelector('.facet-inner').children].map((c) => c.className), [
    'facet-pills', 'facet-options', 'listing-chips',
  ], 'the chips hide and show with the panel, as on live');
  assert.ok(block.querySelector('.listing-sort > .listing-filter-toggle'));
});

test('402a: collapsed by default; the toggle always shows the count, "(0)" included', async () => {
  const { block, toggle, panel } = await facetListing('/en/collapsed-index.json');
  assert.equal(toggle.tagName, 'BUTTON');
  assert.equal(toggle.getAttribute('aria-controls'), panel.id);
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(block.classList.contains('facets-open'), false);
  assert.equal(toggle.textContent, 'Advanced filter (0)');
  click(toggle);
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  assert.ok(block.classList.contains('facets-open'));
});

test('402a: a selection settles, veils the listing, updates and collapses the panel (like live)', async (t) => {
  const { block, toggle } = await facetListing('/en/filter-index.json');
  t.mock.timers.enable({ apis: ['setTimeout'] });
  click(toggle);
  click(block.querySelector('.facet-pill[data-facet="model"]'));
  const change = (value) => {
    const cb = block.querySelector(`.facet-panel[data-facet="model"] input[value="${value}"]`);
    cb.checked = true;
    cb.focus();
    cb.dispatchEvent(new window.Event('change', { bubbles: true }));
  };
  change('Peaq');
  // the checkbox ticks at once; results wait for the settle time
  assert.equal(toggle.textContent, 'Advanced filter (0)');
  t.mock.timers.tick(FILTER_SETTLE_MS - 100);
  change('Epiq'); // a second quick pick restarts the settle (batched)
  t.mock.timers.tick(FILTER_SETTLE_MS - 1);
  assert.equal(block.classList.contains('is-loading'), false);
  t.mock.timers.tick(1);
  assert.ok(block.classList.contains('is-loading'), 'veil fades in');
  assert.equal(block.getAttribute('aria-busy'), 'true');
  assert.ok(block.classList.contains('facets-open'), 'still open under the veil');
  t.mock.timers.tick(VEIL_MS);
  assert.equal(block.classList.contains('is-loading'), false, 'veil fades out');
  assert.equal(block.hasAttribute('aria-busy'), false);
  assert.equal(toggle.textContent, 'Advanced filter (2)');
  assert.equal(block.querySelectorAll('.listing-chip').length, 2);
  assert.equal(block.classList.contains('facets-open'), false, 'panel collapsed');
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(document.activeElement, toggle, 'focus moves from the hidden checkbox to the toggle');
  // the list collapses inside the panel and is still open when the panel is expanded again
  click(toggle);
  assert.equal(block.querySelector('.facet-pill[aria-expanded="true"]')?.dataset.facet, 'model', 'Model list open again');
  assert.ok(block.querySelector('.listing-facets .listing-chips .listing-chip'), 'chips are inside the panel');
});

const pick = (block, value) => {
  const cb = block.querySelector(`.facet-panel[data-facet="model"] input[value="${value}"]`);
  cb.checked = true;
  cb.dispatchEvent(new window.Event('change', { bubbles: true }));
};

test('402a: a sort change veils at once, switches the active sort with the results, collapses (like live)', async (t) => {
  const { block, toggle } = await facetListing('/en/sort-index.json');
  t.mock.timers.enable({ apis: ['setTimeout'] });
  click(toggle);
  const oldest = block.querySelector('.listing-sort-btn[data-sort="oldest"]');
  const newest = block.querySelector('.listing-sort-btn[data-sort="newest"]');
  const first = () => block.querySelector('.listing-item h3').textContent;
  assert.equal(first(), 'Story 3', 'newest first');
  click(oldest);
  t.mock.timers.tick(0);
  assert.ok(block.classList.contains('is-loading'), 'veil at once');
  assert.equal(newest.getAttribute('aria-pressed'), 'true', 'the active sort switches with the results, not on click');
  t.mock.timers.tick(VEIL_MS);
  assert.equal(oldest.getAttribute('aria-pressed'), 'true');
  assert.equal(first(), 'Story 1', 'oldest first');
  assert.equal(block.classList.contains('facets-open'), false, 'an open panel collapses');
  assert.equal(block.classList.contains('is-loading'), false);
  click(oldest); // the active sort is inert (plain text on the source)
  t.mock.timers.tick(0);
  assert.equal(block.classList.contains('is-loading'), false);
});

test('402a: a sort change during the settle runs one flow; back/forward drops a settling pick', async (t) => {
  const { block, toggle } = await facetListing('/en/cancel-index.json');
  t.mock.timers.enable({ apis: ['setTimeout'] });
  click(toggle);
  pick(block, 'Peaq');
  click(block.querySelector('.listing-sort-btn[data-sort="oldest"]'));
  t.mock.timers.tick(0);
  t.mock.timers.tick(VEIL_MS);
  assert.equal(toggle.textContent, 'Advanced filter (1)', 'the sort render includes the pick');
  t.mock.timers.tick(FILTER_SETTLE_MS + VEIL_MS);
  assert.equal(block.classList.contains('is-loading'), false, 'no late second veil');
  click(toggle);
  pick(block, 'Epiq');
  window.dispatchEvent(new window.PopStateEvent('popstate'));
  t.mock.timers.tick(FILTER_SETTLE_MS + VEIL_MS);
  assert.equal(block.classList.contains('is-loading'), false);
  assert.ok(block.classList.contains('facets-open'));
});

test('402a: removing a chip veils at once (no settle), updates and collapses the panel, like live', async (t) => {
  const { block, toggle } = await facetListing('/en/chip-index.json', '?filter[model][]=Peaq&filter[model][]=Epiq');
  t.mock.timers.enable({ apis: ['setTimeout'] });
  assert.ok(block.classList.contains('facets-open'), 'deep link opens the panel');
  const chip = block.querySelector('.listing-chip');
  chip.focus();
  click(chip);
  t.mock.timers.tick(0);
  assert.ok(block.classList.contains('is-loading'), 'veil at once');
  assert.equal(block.querySelectorAll('.listing-chip').length, 2, 'chips stay until the update, as on live');
  t.mock.timers.tick(VEIL_MS);
  assert.equal(block.classList.contains('is-loading'), false);
  assert.equal(block.querySelectorAll('.listing-chip').length, 1);
  assert.equal(toggle.textContent, 'Advanced filter (1)');
  assert.equal(block.classList.contains('facets-open'), false, 'panel collapsed');
  assert.equal(document.activeElement, toggle, 'focus leaves the removed chip for the toggle');
});

test('402a: removing a chip while a pick is settling runs one flow (no double veil or collapse)', async (t) => {
  const { block, toggle } = await facetListing('/en/chip-settle-index.json', '?filter[model][]=Peaq');
  t.mock.timers.enable({ apis: ['setTimeout'] });
  pick(block, 'Epiq'); // settling…
  click(block.querySelector('.listing-chip')); // …then remove "Model: Peaq"
  t.mock.timers.tick(0);
  assert.ok(block.classList.contains('is-loading'), 'one veil, at once');
  t.mock.timers.tick(VEIL_MS);
  assert.equal(block.classList.contains('is-loading'), false);
  assert.equal(toggle.textContent, 'Advanced filter (1)', 'Epiq kept, Peaq removed');
  assert.equal(block.classList.contains('facets-open'), false);
  t.mock.timers.tick(FILTER_SETTLE_MS + VEIL_MS);
  assert.equal(block.classList.contains('is-loading'), false, 'no late second veil');
});

test('402a: removing a chip keeps the open pill list for the next expand', async (t) => {
  const { block, toggle } = await facetListing('/en/chip-list-index.json', '?filter[model][]=Peaq');
  t.mock.timers.enable({ apis: ['setTimeout'] });
  assert.equal(block.querySelector('.facet-pill[aria-expanded="true"]')?.dataset.facet, 'model');
  click(block.querySelector('.listing-chip'));
  t.mock.timers.tick(0);
  t.mock.timers.tick(VEIL_MS);
  click(toggle);
  assert.equal(block.querySelector('.facet-pill[aria-expanded="true"]')?.dataset.facet, 'model');
});

test('402a: Esc on the toggle closes the panel and keeps focus there, even with a list open', async () => {
  const { block, toggle } = await facetListing('/en/esc-toggle-index.json', '?filter[model][]=Peaq');
  toggle.focus();
  key(toggle, 'Escape');
  assert.equal(block.classList.contains('facets-open'), false);
  assert.equal(document.activeElement, toggle);
  assert.equal(block.querySelector('.facet-pill[aria-expanded="true"]')?.dataset.facet, 'model', 'the list persists');
});

test('402a: opening the panel moves focus into it (first pill), closing from the toggle keeps it there', async () => {
  // the panel precedes the toggle in the DOM, so Tab from the toggle would skip every filter (PR #227)
  const { block, toggle } = await facetListing('/en/focus-open-index.json');
  toggle.focus();
  click(toggle);
  assert.equal(block.classList.contains('facets-open'), true);
  const first = block.querySelector('.facet-pill');
  assert.equal(document.activeElement, first, 'the first filter is the focused stop');
  // Esc from there closes the panel and returns focus to the toggle
  key(first, 'Escape');
  assert.equal(block.classList.contains('facets-open'), false);
  assert.equal(document.activeElement, toggle);
  // closing from the toggle itself keeps focus on the toggle
  click(toggle);
  toggle.focus();
  click(toggle);
  assert.equal(block.classList.contains('facets-open'), false);
  assert.equal(document.activeElement, toggle);
});

test('402a: opening a pill\'s list moves focus to its first option; Esc hands it back to the pill', async () => {
  // the lists follow the whole pill row in the DOM, so Tab from the pill would reach the next pill first
  const { block, toggle } = await facetListing('/en/focus-pill-index.json');
  click(toggle);
  const pill = block.querySelector('.facet-pill[data-facet="model"]');
  click(pill);
  const firstOption = block.querySelector('.facet-panel[data-facet="model"] input');
  assert.equal(document.activeElement, firstOption);
  key(firstOption, 'Escape');
  assert.equal(pill.getAttribute('aria-expanded'), 'false');
  assert.equal(document.activeElement, pill);
  // closing the list from its pill keeps focus on the pill
  click(pill);
  pill.focus();
  click(pill);
  assert.equal(document.activeElement, pill);
});

test('402a: reopening with an option list still open focuses that list\'s pill', async () => {
  const { block, toggle } = await facetListing('/en/focus-reopen-index.json', '', [
    storyRow(1, 'Peaq'), storyRow(2, 'Epiq'), storyRow(3, 'Elroq'),
  ]);
  click(toggle);
  const pills = [...block.querySelectorAll('.facet-pill')];
  assert.ok(pills.length > 1, 'two facets, so "the open one" differs from "the first"');
  click(pills[1]);
  toggle.focus();
  click(toggle); // collapse: the list persists
  click(toggle); // reopen
  assert.equal(document.activeElement, pills[1]);
});

test('402a: a filtered deep link opens the panel without moving focus on load', async () => {
  document.activeElement?.blur();
  const { block } = await facetListing('/en/focus-deeplink-index.json', '?filter[model][]=Peaq');
  assert.equal(block.classList.contains('facets-open'), true);
  assert.equal(document.activeElement, document.body, 'the page load does not steal focus');
});

test('402a: Load more shows the loader, then appends the next page and focuses its first card', async (t) => {
  const { block } = await facetListing('/en/more-index.json');
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const more = block.querySelector('.listing-loadmore-btn');
  assert.equal(block.querySelectorAll('.listing-item').length, 2);
  assert.equal(more.querySelectorAll('.listing-loader .listing-loader-dot').length, 4);
  click(more);
  assert.ok(more.classList.contains('is-loading'), 'loader shows');
  assert.equal(more.getAttribute('aria-busy'), 'true');
  click(more); // a second click while loading does nothing
  assert.equal(block.querySelectorAll('.listing-item').length, 2, 'still loading');
  t.mock.timers.tick(LOAD_MORE_MS);
  assert.equal(block.querySelectorAll('.listing-item').length, 3, 'one page appended');
  assert.equal(document.activeElement, block.querySelectorAll('.listing-item a')[2]);
});

test('402a: Load more during the settle shows the pick first, with no late veil', async (t) => {
  const { block, toggle } = await facetListing('/en/loadmore-index.json');
  t.mock.timers.enable({ apis: ['setTimeout'] });
  click(toggle);
  pick(block, 'Peaq');
  const more = block.querySelector('.listing-loadmore-btn');
  assert.ok(more, '3 rows, 2 per page');
  more.focus();
  click(more);
  assert.equal(toggle.textContent, 'Advanced filter (1)', 'rendered at once');
  assert.ok([...block.querySelectorAll('.listing-item h3')].every((h) => h.textContent !== 'Story 2'), 'only Peaq stories');
  assert.equal(block.querySelector('.listing-loadmore-btn'), null, 'the 2 Peaq rows fill one page');
  assert.equal(document.activeElement, block.querySelector('.listing-item a'), 'focus stays in the results');
  t.mock.timers.tick(FILTER_SETTLE_MS + VEIL_MS);
  assert.equal(block.classList.contains('is-loading'), false);
});

test('402a: Load more during the settle with rows left: loader on the new button, then append', async (t) => {
  const rows = [storyRow(1, 'Peaq'), storyRow(2, 'Epiq'), storyRow(3, 'Peaq'), storyRow(4, 'Peaq'), storyRow(5, 'Epiq')];
  const { block } = await facetListing('/en/loadmore-rows-index.json', '', rows);
  t.mock.timers.enable({ apis: ['setTimeout'] });
  pick(block, 'Peaq'); // 3 Peaq rows: page 1 + 1 more
  const old = block.querySelector('.listing-loadmore-btn');
  old.focus();
  click(old);
  const btn = block.querySelector('.listing-loadmore-btn');
  assert.notEqual(btn, old, 'the flush re-rendered the button');
  assert.ok(btn.classList.contains('is-loading'));
  assert.equal(document.activeElement, btn, 'focus follows to the new button');
  t.mock.timers.tick(LOAD_MORE_MS);
  assert.equal(block.querySelectorAll('.listing-item').length, 3);
  assert.equal(document.activeElement, block.querySelectorAll('.listing-item a')[2]);
});

test('402a: a sort change during a pending Load more cancels it (no old page appended, loader stops)', async (t) => {
  const rows = [1, 2, 3, 4, 5].map((n) => storyRow(n, 'Peaq'));
  const { block } = await facetListing('/en/sort-during-more-index.json', '', rows);
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const btn = block.querySelector('.listing-loadmore-btn');
  click(btn);
  click(block.querySelector('.listing-sort-btn[data-sort="oldest"]'));
  assert.equal(btn.classList.contains('is-loading'), false, 'the loader stops at once');
  t.mock.timers.tick(LOAD_MORE_MS);
  assert.equal(block.querySelectorAll('.listing-item').length, 2, 'nothing appended');
  t.mock.timers.tick(VEIL_MS);
  assert.equal(block.querySelector('.listing-item h3').textContent, 'Story 1', 'the sort shows, page 1');
});

test('402a: reduced motion — no veil wait and no Load more wait', async (t) => {
  const rows = [1, 2, 3].map((n) => storyRow(n, n === 2 ? 'Epiq' : 'Peaq'));
  const { block, toggle } = await facetListing('/en/reduced-index.json', '', rows);
  const { matchMedia } = window;
  window.matchMedia = (q) => ({ matches: q.includes('reduced-motion'), addEventListener() {} });
  try {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    click(toggle);
    pick(block, 'Epiq');
    t.mock.timers.tick(FILTER_SETTLE_MS);
    t.mock.timers.tick(0);
    assert.equal(toggle.textContent, 'Advanced filter (1)', 'updated with no veil time');
    click(block.querySelector('.listing-sort-btn[data-sort="oldest"]'));
    t.mock.timers.tick(0);
    t.mock.timers.tick(0);
    assert.equal(block.querySelector('.listing-sort-btn[data-sort="oldest"]').getAttribute('aria-pressed'), 'true');
  } finally {
    window.matchMedia = matchMedia;
  }
});

test('402a: a second pick under the veil restarts once — a single collapse, no double veil', async (t) => {
  const { block, toggle } = await facetListing('/en/veil-index.json');
  t.mock.timers.enable({ apis: ['setTimeout'] });
  click(toggle);
  pick(block, 'Peaq');
  t.mock.timers.tick(FILTER_SETTLE_MS);
  assert.ok(block.classList.contains('is-loading'));
  pick(block, 'Epiq'); // keyboard Space under the veil
  assert.equal(block.classList.contains('is-loading'), false, 'the first veil is dropped');
  t.mock.timers.tick(VEIL_MS);
  assert.ok(block.classList.contains('facets-open'), 'no collapse from the first pick');
  t.mock.timers.tick(FILTER_SETTLE_MS - VEIL_MS); // the restarted settle ends
  assert.ok(block.classList.contains('is-loading'), 'one veil, for both picks');
  t.mock.timers.tick(VEIL_MS);
  assert.equal(toggle.textContent, 'Advanced filter (2)');
  assert.equal(block.classList.contains('facets-open'), false);
});

test('402a: collapse + expand keeps the open pill list, like live (only Esc or its pill closes it)', async (t) => {
  const { block, toggle } = await facetListing('/en/closelist-index.json');
  t.mock.timers.enable({ apis: ['setTimeout'] });
  click(toggle);
  const pill = block.querySelector('.facet-pill[data-facet="model"]');
  click(pill);
  click(toggle);
  assert.equal(block.classList.contains('facets-open'), false);
  t.mock.timers.tick(1000);
  assert.equal(pill.getAttribute('aria-expanded'), 'true', 'the list collapses with the panel, not before');
  click(toggle);
  assert.equal(pill.getAttribute('aria-expanded'), 'true', 'still open after expanding again');
  assert.equal(block.querySelector(`#${pill.getAttribute('aria-controls')}`).hidden, false);
  // a different pill switches the list, and that one survives a collapse too
  const other = block.querySelectorAll('.facet-pill')[1];
  assert.equal(other.dataset.facet, 'bodywork');
  click(other);
  click(toggle);
  click(toggle);
  assert.equal(other.getAttribute('aria-expanded'), 'true');
  assert.equal(pill.getAttribute('aria-expanded'), 'false');
});

test('402a: a deep link matches index values case-insensitively (Peaq → peaq, ticked, no duplicate)', async () => {
  window.history.replaceState(null, '', '/en/news?filter[model][]=Peaq');
  feed = [storyRow(1, 'peaq'), storyRow(2, 'epiq')];
  const block = listingBlock('story', '/en/case-index.json');
  await decorate(block);
  const cb = block.querySelector('.facet-panel[data-facet="model"] input[value="peaq"]');
  assert.equal(cb.checked, true);
  assert.equal(block.querySelectorAll('.listing-chip').length, 1);
  assert.equal(block.querySelector('.listing-chip').textContent, 'Model: Peaq');
});

test('402a: a filtered deep link opens the panel showing "(1)"', async () => {
  const { block, toggle } = await facetListing('/en/deeplink-index.json', '?filter[model][]=Peaq');
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  assert.ok(block.classList.contains('facets-open'));
  assert.equal(toggle.textContent, 'Advanced filter (1)');
});

test('402a: Esc closes an option list, then the panel; Esc elsewhere in the block is ignored', async () => {
  const { block, toggle } = await facetListing('/en/esc-index.json');
  click(toggle);
  const pill = block.querySelector('.facet-pill');
  click(pill);
  assert.equal(pill.getAttribute('aria-expanded'), 'true');
  // Esc on a result card: nothing closes, focus stays
  const card = block.querySelector('.listing-item a');
  card.focus();
  key(card, 'Escape');
  assert.equal(pill.getAttribute('aria-expanded'), 'true');
  assert.equal(document.activeElement, card);
  // Esc in the panel: the option list first (focus → its pill), then the panel (focus → toggle)
  const option = block.querySelector('.facet-panel:not([hidden]) input');
  option.focus();
  key(option, 'Escape');
  assert.equal(pill.getAttribute('aria-expanded'), 'false');
  assert.equal(document.activeElement, pill);
  assert.ok(block.classList.contains('facets-open'));
  key(pill, 'Escape');
  assert.equal(block.classList.contains('facets-open'), false);
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(document.activeElement, toggle);
});

test('402a: an Esc an inner control already handled does not close the panel', async () => {
  const { block, toggle } = await facetListing('/en/handled-index.json');
  click(toggle);
  const pill = block.querySelector('.facet-pill');
  pill.addEventListener('keydown', (e) => e.preventDefault(), { once: true });
  key(pill, 'Escape');
  assert.ok(block.classList.contains('facets-open'));
});

test('402a: pills in one row, the open pill\'s options full width in the area under it (source form.search-filter)', async () => {
  const { block, toggle } = await facetListing('/en/rows-index.json');
  click(toggle);
  const bar = block.querySelector('.listing-facets');
  assert.deepEqual([...bar.querySelector('.facet-inner').children].map((c) => c.className), ['facet-pills', 'facet-options', 'listing-chips']);
  const pill = bar.querySelector('.facet-pills > .facet-pill[data-facet="model"]');
  const panel = bar.querySelector(`.facet-options > #${pill.getAttribute('aria-controls')}`);
  assert.ok(panel.hidden);
  click(pill);
  assert.equal(pill.getAttribute('aria-expanded'), 'true');
  assert.equal(panel.hidden, false);
  // one list at a time: opening another pill closes the first
  const other = bar.querySelectorAll('.facet-pill')[1];
  assert.ok(other, 'a second facet (bodywork) has a pill');
  click(other);
  assert.equal(pill.getAttribute('aria-expanded'), 'false');
  assert.ok(panel.hidden);
});

test('402a: options show the name only ("Peaq"), no count; chips use the name too', async () => {
  const { block, toggle } = await facetListing('/en/names-index.json');
  click(toggle);
  const labels = [...block.querySelectorAll('.facet-panel[data-facet="model"] .facet-option-label')].map((l) => l.textContent);
  assert.ok(labels.length > 0);
  assert.ok(labels.every((l) => !l.includes('(')), 'no "(n)" counts');
  assert.ok(labels.every((l) => l[0] === l[0].toUpperCase()), 'title-cased names');
  assert.equal(valueLabel('enyaq-coupe'), 'Enyaq Coupe');
  assert.equal(valueLabel('peaq'), 'Peaq');
});

test('402a: a filtered deep link opens that facet\'s option list, like the source', async () => {
  const { block } = await facetListing('/en/deeplink-options-index.json', '?filter[model][]=Peaq');
  const pill = block.querySelector('.facet-pill[data-facet="model"]');
  assert.equal(pill.getAttribute('aria-expanded'), 'true');
  assert.equal(block.querySelector(`#${pill.getAttribute('aria-controls')}`).hidden, false);
  assert.ok(pill.classList.contains('active'), 'has a selection → count badge');
  assert.equal(pill.querySelector('.facet-count').textContent, '1');
});

test('toolbar parity (SKODA-402b, CSS guard): collapsed sort row 12px under the header, active sort black', async () => {
  const { readFile } = await import('node:fs/promises');
  const css = await readFile(new URL('./listing.css', import.meta.url), 'utf8');
  assert.match(css, /\.listing \.listing-sort \{[^}]*margin-block: var\(--spacing-s\) 0;/, 'source .cover-box 12px top padding');
  assert.match(css, /\.listing\.facets-open \.listing-sort \{\s*margin-block-start: 0;/, 'the open panel keeps its zero start margin');
  assert.match(css, /\.listing-sort-btn\[aria-pressed="true"\] \{\s*color: var\(--skoda-black\);/, 'source span.active #000');
});
