/*
 * Unit tests for the media cart's shared presentation (SKODA-505b): labels from placeholders,
 * text formatting, the cart link, the package-limit banner and the refusal notice.
 * Run: node --test scripts/media-cart-ui.test.mjs
 */
/* global globalThis */
/* eslint-disable import/no-extraneous-dependencies */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<head></head><body></body>', { url: 'https://example.com/cs/images' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.fetch = async (url) => ({
  ok: String(url) === '/cs/placeholders.json',
  json: async () => ({ data: [{ Key: 'media-cart-limit-items', Text: 'Plno: {max}' }] }),
});
const ui = await import('./media-cart-ui.js');

test('cartLabels: placeholders (mediaCart*) win per key; English fills the rest', () => {
  const labels = ui.cartLabels({ mediaCartBadge: 'Košík', mediaCartEmptyMessage: '' });
  assert.equal(labels.badge, 'Košík');
  assert.equal(labels.emptyMessage, 'No downloads', 'an empty cell falls back');
  assert.deepEqual(Object.keys(labels), Object.keys(ui.DEFAULT_LABELS));
});

test('cartLabels: a translated counted text without its singular is used for one too', () => {
  const labels = ui.cartLabels({ mediaCartCountChanged: '{n} položek v košíku', mediaCartBadgeCount: 'Košík, {n}' });
  assert.equal(labels.countChangedOne, '');
  assert.equal(ui.plural(labels, 'countChanged', 1), '1 položek v košíku');
  assert.equal(ui.plural(labels, 'badgeCount', 1), 'Košík, 1');
  assert.equal(ui.plural(ui.cartLabels({}), 'badgeCount', 1), 'Media cart, 1 item', 'English keeps its singular');
  const both = ui.cartLabels({ mediaCartBadgeCount: 'Košík, {n} položek', mediaCartBadgeCountOne: 'Košík, 1 položka' });
  assert.equal(ui.plural(both, 'badgeCount', 1), 'Košík, 1 položka');
});

test('format replaces known tokens and keeps unknown ones', () => {
  assert.equal(ui.format('{n} / {max} files · {size}', { n: 3, max: 80, size: '2 MB' }), '3 / 80 files · 2 MB');
  assert.equal(ui.format('{n} of {total}', { n: 0 }), '0 of {total}');
});

test('plural: the singular for one when the sheet has it', () => {
  const labels = { ...ui.DEFAULT_LABELS, countChangedOne: '' };
  assert.equal(ui.plural(ui.DEFAULT_LABELS, 'badgeCount', 1), 'Media cart, 1 item');
  assert.equal(ui.plural(ui.DEFAULT_LABELS, 'badgeCount', 2), 'Media cart, 2 items');
  assert.equal(ui.plural(labels, 'countChanged', 1), '1 items in the media cart');
  assert.equal(ui.plural(ui.DEFAULT_LABELS, 'addedSome', 1, { added: 1, total: 3 }), 'Added 1 of 3 files to the media cart.');
});

test('formatBytes', () => {
  assert.deepEqual(
    [0, 850, 2048, 1536 * 1024, 2078863, 15 * 1024 ** 2, 1024 ** 3, -5, 'x'].map(ui.formatBytes),
    ['0 B', '850 B', '2 KB', '1.5 MB', '2 MB', '15 MB', '1 GB', '0 B', '0 B'],
  );
});

test('cartHref follows the locale of the page', () => {
  assert.equal(ui.cartHref('/de/press-releases/x'), '/de/media-cart');
  assert.equal(ui.cartHref('/'), '/en/media-cart');
  assert.equal(ui.cartHref(), '/cs/media-cart');
});

test('limitBanner states both caps and loads the shared styles', () => {
  const banner = ui.limitBanner(ui.DEFAULT_LABELS, { items: 80, bytes: 1024 ** 3 });
  assert.equal(banner.className, 'media-cart-limit');
  assert.match(banner.textContent, /up to 80 files \(1 GB in total\)/);
  assert.ok(document.head.querySelector('link[href$="/styles/media-cart.css"]'));
});

test('refusalMessage: one text per reason; duplicates and unknown reasons say nothing', () => {
  const limits = { items: 80, bytes: 1024 ** 3 };
  assert.match(ui.refusalMessage('limit-items', ui.DEFAULT_LABELS, limits), /up to 80 files/);
  assert.match(ui.refusalMessage('limit-bytes', ui.DEFAULT_LABELS, limits), /up to 1 GB/);
  ['network', 'unresolved', 'storage'].forEach((reason) => {
    assert.ok(ui.refusalMessage(reason).length > 10, reason);
  });
  assert.equal(ui.refusalMessage('duplicate'), '');
  assert.equal(ui.refusalMessage('nope'), '');
});

test('refusalMessage: a group add counts per-file reasons; package-wide ones stay as they are', () => {
  const limits = { items: 80, bytes: 1024 ** 3 };
  assert.equal(ui.refusalMessage('unresolved', ui.DEFAULT_LABELS, limits, 2), '2 files can\'t be added to the media cart.');
  assert.equal(ui.refusalMessage('unresolved', ui.DEFAULT_LABELS, limits, 1), '1 file can\'t be added to the media cart.');
  assert.match(ui.refusalMessage('limit-bytes', ui.DEFAULT_LABELS, limits, 3), /^3 files don't fit: .* up to 1 GB\.$/);
  assert.match(ui.refusalMessage('network', ui.DEFAULT_LABELS, limits, 2), /^2 files couldn't be added/);
  assert.equal(ui.refusalMessage('limit-items', ui.DEFAULT_LABELS, limits, 4), ui.refusalMessage('limit-items', ui.DEFAULT_LABELS, limits));
});

test('showNotice: one reused, non-modal alert; Escape and the close button hide it', () => {
  assert.equal(ui.showNotice(''), null);
  const notice = ui.showNotice('First');
  assert.equal(document.querySelectorAll('.media-cart-notice').length, 1);
  assert.equal(notice.hidden, false);
  assert.equal(notice.querySelector('[role="alert"]').textContent, 'First');
  assert.notEqual(document.activeElement, notice.querySelector('button'), 'focus stays put');
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' }));
  assert.equal(notice.hidden, true);
  assert.equal(ui.showNotice('Second', { ...ui.DEFAULT_LABELS, close: 'Zavřít' }), notice);
  const close = notice.querySelector('.media-cart-notice-close');
  assert.equal(close.getAttribute('aria-label'), 'Zavřít');
  close.click();
  assert.equal(notice.hidden, true);
  assert.equal(document.querySelectorAll('.media-cart-notice').length, 1);
});

test('showNotice: over an open lightbox it shows inside the dialog, and Escape closes it first', () => {
  const overlay = document.createElement('div');
  overlay.className = 'gallery-overlay';
  overlay.setAttribute('role', 'dialog');
  document.body.append(overlay);
  const closedByLightbox = [];
  const onKey = (e) => { if (e.key === 'Escape') closedByLightbox.push(e.key); };
  document.addEventListener('keydown', onKey);
  const notice = ui.showNotice('Full');
  assert.equal(notice.parentElement, overlay, 'in the modal dialog, so it is seen and heard');
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(notice.hidden, true);
  assert.deepEqual(closedByLightbox, [], 'the lightbox stays open');
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.deepEqual(closedByLightbox, ['Escape'], 'the next Escape is the lightbox\'s');
  overlay.hidden = true;
  assert.equal(ui.showNotice('Again').parentElement, document.body, 'back on the page once it closed');
  document.removeEventListener('keydown', onKey);
  overlay.remove();
  ui.showNotice('x').querySelector('.media-cart-notice-close').click();
});

test('onRefused: says why in the page language; duplicates stay silent', async () => {
  const notice = document.querySelector('.media-cart-notice');
  await ui.onRefused({ detail: { reason: 'duplicate' } });
  assert.equal(notice.hidden, true);
  await ui.onRefused({ detail: { reason: 'limit-items' } });
  assert.equal(notice.hidden, false);
  assert.equal(notice.querySelector('[role="alert"]').textContent, 'Plno: 80');
  notice.querySelector('button').click();
});
