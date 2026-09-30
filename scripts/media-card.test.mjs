/*
 * Unit tests for the media card actions (SKODA-406): which controls a feed row gets, their
 * links / cart keys / names, the size menu's keyboard + one-open-at-a-time behaviour, and
 * which add actions the media cart binds (SKODA-505a).
 * Run: node --test scripts/media-card.test.mjs
 */
/* global globalThis */
/* eslint-disable import/no-extraneous-dependencies */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

// one document for the whole file: the module wires its outside-click listener once
const dom = new JSDOM('<main></main>', { url: 'https://example.com/en/images' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const {
  mediaActions, mediaLabels, playBadge, DEFAULT_LABELS,
} = await import('./media-card.js');

const image = {
  template: 'image',
  id: '455756',
  original: 'https://cdn.example.com/a.jpg',
  'rendition-1920': 'https://cdn.example.com/a-1920x1280.jpg',
};
const video = { template: 'video', id: '452721', mp4: 'https://cdn.example.com/v.mp4' };

const mount = (el) => { document.querySelector('main').replaceChildren(el); return el; };
// the media cart is imported lazily by the add controls; wait for it to bind them
const bound = async () => {
  await import('./media-cart.js');
  await new Promise((r) => { setTimeout(r, 0); });
};
const key = (el, k) => el.dispatchEvent(new window.KeyboardEvent('keydown', { key: k, bubbles: true }));

test('image with both sizes: an add menu and a download menu, Original + 1920px', () => {
  const actions = mediaActions(image, 'hudebni-leto');
  const toggles = [...actions.querySelectorAll('button.media-card-button')];
  assert.deepEqual(toggles.map((b) => (b.classList.contains('add') ? 'add' : 'download')), ['add', 'download']);
  assert.equal(toggles[0].getAttribute('aria-label'), 'Add to media cart: hudebni-leto');
  assert.equal(toggles[1].getAttribute('aria-label'), 'Download: hudebni-leto');
  const [addMenu, dlMenu] = actions.querySelectorAll('.media-card-menu');
  assert.equal(addMenu.getAttribute('role'), 'menu');
  assert.equal(toggles[0].getAttribute('aria-controls'), addMenu.id);
  assert.ok(addMenu.hidden && dlMenu.hidden);

  const adds = [...addMenu.querySelectorAll('a')];
  assert.deepEqual(adds.map((a) => [a.textContent, a.dataset.id, a.dataset.size, a.getAttribute('aria-disabled'), a.title]), [
    ['Original', '455756', '', 'true', 'Add/remove Original version'],
    ['1920px', '455756', 'giant', 'true', 'Add/remove 1920px version'],
  ]);
  assert.ok(adds.every((a) => a.getAttribute('role') === 'menuitem'));
  const downloads = [...dlMenu.querySelectorAll('a')];
  assert.deepEqual(downloads.map((a) => [a.textContent, a.href, a.hasAttribute('download'), a.title]), [
    ['Original', image.original, true, 'Download Original version'],
    ['1920px', image['rendition-1920'], true, 'Download 1920px version'],
  ]);
});

test('image with one size: a direct download link instead of a menu', () => {
  const actions = mediaActions({ ...image, 'rendition-1920': '' }, 'x');
  const dl = actions.querySelector('.media-card-button.download');
  assert.equal(dl.tagName, 'A');
  assert.equal(dl.href, image.original);
  assert.ok(dl.hasAttribute('download'));
  assert.equal(dl.title, 'Download Original version');
  // the cart still offers the one size, as a menu row
  assert.equal(actions.querySelectorAll('.media-card-action.add a').length, 1);
});

test('video: one inert add button and one MP4 download link, no menus', () => {
  const actions = mediaActions(video, 'Footage');
  assert.equal(actions.querySelectorAll('.media-card-menu').length, 0);
  const add = actions.querySelector('.media-card-button.add');
  assert.deepEqual(
    [add.tagName, add.dataset.id, add.getAttribute('role'), add.getAttribute('aria-disabled'), add.title],
    ['A', '452721', 'button', 'true', 'Add/remove this'],
  );
  const dl = actions.querySelector('.media-card-button.download');
  assert.deepEqual([dl.href, dl.hasAttribute('download'), dl.target, dl.title], [video.mp4, true, '_blank', 'Download this']);
  assert.equal(dl.getAttribute('aria-label'), 'Download: Footage');
});

test('non-media rows and rows with nothing to offer get no action row', () => {
  assert.equal(mediaActions({ template: 'story', id: '1', original: 'a.jpg' }), null);
  assert.equal(mediaActions({ template: 'image' }), null);
  assert.equal(mediaActions({ template: 'video' }), null);
  // no cart key: only the download
  const actions = mediaActions({ ...video, id: '' });
  assert.equal(actions.querySelectorAll('.media-card-button').length, 1);
});

test('size menu: toggle opens it, ArrowDown moves through the rows, Escape closes to the toggle', () => {
  const actions = mount(mediaActions(image, 'a'));
  const toggle = actions.querySelector('button.download');
  const menu = actions.querySelector('.media-card-action.download .media-card-menu');
  toggle.click();
  assert.equal(menu.hidden, false);
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  assert.ok(toggle.parentElement.classList.contains('is-active'));
  toggle.focus();
  key(toggle, 'ArrowDown');
  assert.equal(document.activeElement.textContent, 'Original');
  key(document.activeElement, 'ArrowDown');
  assert.equal(document.activeElement.textContent, '1920px');
  key(document.activeElement, 'ArrowDown');
  assert.equal(document.activeElement.textContent, 'Original', 'wraps around');
  key(document.activeElement, 'Escape');
  assert.equal(menu.hidden, true);
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(document.activeElement, toggle);
  toggle.click();
  toggle.click();
  assert.equal(menu.hidden, true, 'a second click closes it');
});

test('one menu open at a time; a click outside closes it', () => {
  const actions = mount(mediaActions(image, 'a'));
  const [add, dl] = actions.querySelectorAll('button.media-card-button');
  add.click();
  dl.click();
  const open = [...actions.querySelectorAll('.media-card-menu')].filter((m) => !m.hidden);
  assert.equal(open.length, 1);
  assert.ok(open[0].closest('.media-card-action.download'));
  document.querySelector('main').click();
  assert.equal([...actions.querySelectorAll('.media-card-menu')].filter((m) => !m.hidden).length, 0);
  assert.equal(dl.getAttribute('aria-expanded'), 'false');
});

test('play badge is decorative', () => {
  const badge = playBadge();
  assert.equal(badge.className, 'media-card-play');
  assert.equal(badge.getAttribute('aria-hidden'), 'true');
});

test('the inert cart actions cancel their own click (no jump to the top in any consumer)', async () => {
  // no listing around it: the helper alone must stop the `#` link. These fixtures link a
  // foreign host, so the media cart can't take them: they stay disabled.
  const image2 = mount(mediaActions(image, 'a'));
  const click = (el) => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
  const rows = [...image2.querySelectorAll('.media-card-action.add a')];
  assert.ok(rows.length && rows.every((a) => click(a) === false), 'size-menu rows are cancelled');
  const videoAdd = mount(mediaActions(video, 'v')).querySelector('.media-card-button.add');
  assert.equal(click(videoAdd), false, 'the video add button is cancelled');
  await bound();
  assert.ok(rows.every((a) => a.getAttribute('aria-disabled') === 'true'), 'still disabled once bound');
  assert.ok([...rows, videoAdd].every((a) => click(a) === false), 'still cancelled once bound');
  // downloads are never cancelled
  assert.equal(click(mount(mediaActions(video, 'v')).querySelector('.media-card-button.download')), true);
});

test('media cart (SKODA-505a): the original\'s add is a cart toggle, the 1920px row stays inert', async () => {
  const original = 'https://cdn.skoda-storyboard.com/2026/08/a.jpg';
  const actions = mediaActions({
    ...image, original, 'rendition-1920': 'https://cdn.skoda-storyboard.com/2026/08/a-1920x1280.jpg',
  }, 'Elroq');
  const [orig, big] = actions.querySelectorAll('.media-card-action.add a');
  assert.equal(orig.getAttribute('aria-disabled'), 'true', 'disabled until the cart module binds it');
  const mp4 = 'https://cdn.skoda-storyboard.com/2026/06/v.mp4';
  const add = mediaActions({ ...video, mp4 }, 'Footage').querySelector('.media-card-button.add');
  await bound();
  assert.deepEqual(
    [orig.hasAttribute('aria-disabled'), orig.getAttribute('role'), orig.getAttribute('aria-checked'), orig.dataset.href, orig.dataset.title],
    [false, 'menuitemcheckbox', 'false', original, 'Elroq'],
  );
  assert.ok(orig.hasAttribute('data-cart-control'));
  assert.deepEqual(
    [big.getAttribute('aria-disabled'), big.getAttribute('role'), big.dataset.href, big.hasAttribute('data-cart-control')],
    ['true', 'menuitem', undefined, false],
  );
  assert.deepEqual(
    [add.hasAttribute('aria-disabled'), add.getAttribute('aria-pressed'), add.dataset.href, add.dataset.title],
    [false, 'false', mp4, 'Footage'],
  );
});

test('labels: placeholders translate every control, missing keys fall back to English', () => {
  const cz = mediaLabels({
    mediaAddToCart: 'Přidat do košíku',
    mediaDownload: 'Stáhnout',
    mediaAddSize: 'Přidat/odebrat verzi {size}',
    mediaDownloadSize: 'Stáhnout verzi {size}',
    mediaSizeOriginal: 'Originál',
  });
  assert.equal(cz.size1920, '1920px', 'untranslated key keeps the English default');
  assert.equal(cz.addVideo, DEFAULT_LABELS.addVideo);
  const actions = mediaActions(image, 'hudebni-leto', cz);
  const [add, dl] = actions.querySelectorAll('button.media-card-button');
  assert.equal(add.getAttribute('aria-label'), 'Přidat do košíku: hudebni-leto');
  assert.equal(dl.getAttribute('aria-label'), 'Stáhnout: hudebni-leto');
  const rows = [...actions.querySelectorAll('.media-card-action.download a')];
  assert.deepEqual(rows.map((a) => [a.textContent, a.title]), [
    ['Originál', 'Stáhnout verzi Originál'],
    ['1920px', 'Stáhnout verzi 1920px'],
  ]);
  assert.equal(actions.querySelector('.media-card-action.add a').title, 'Přidat/odebrat verzi Originál');
  // no labels passed: English
  assert.equal(mediaActions(image, 'x').querySelector('button').getAttribute('aria-label'), 'Add to media cart: x');
  assert.deepEqual(mediaLabels(), DEFAULT_LABELS);
});
