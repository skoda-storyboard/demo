/*
 * The package-limit banner without the cart (SKODA-505a review, item 1): the limits module,
 * the store and UI sharing it, the listing and the UI staying free of the store, and the
 * banner's two block stylesheets (listing, media-cart) in step.
 * Run: node --test scripts/media-cart-limits.test.mjs
 */
/* global globalThis */
/* eslint-disable import/no-extraneous-dependencies */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<main></main>', { url: 'https://example.com/en/images' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;

const limits = await import('./media-cart-limits.js');
const store = await import('./media-cart.js');
const ui = await import('./media-cart-ui.js');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => readFileSync(path.join(ROOT, f), 'utf8');

test('the banner says the limits, from the placeholders text or the English default', () => {
  const banner = limits.buildLimitBanner();
  assert.equal(banner.className, 'media-cart-limit');
  assert.equal(banner.textContent, 'A download package can contain up to 80 files (1 GB in total). Larger selections need to be downloaded as several packages.');
  assert.equal(limits.buildLimitBanner('Bis {max} Dateien ({size}).').textContent, 'Bis 80 Dateien (1 GB).');
  assert.equal(ui.limitBanner(ui.cartLabels({})).textContent, banner.textContent, 'the UI builds the same banner');
});

test('one source for the limits and helpers: the store and the UI re-export them', () => {
  assert.equal(store.LIMITS, limits.LIMITS);
  assert.equal(ui.format, limits.format);
  assert.equal(ui.formatBytes, limits.formatBytes);
  assert.equal(ui.DEFAULT_LABELS.limitBanner, limits.LIMIT_BANNER_TEXT);
});

test('nothing of the cart is on the listing\'s eager path', () => {
  const imports = (src) => [...src.matchAll(/(?:import\s[^;]*?from\s*|import\()\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
  const listing = imports(read('blocks/listing/listing.js'));
  assert.ok(listing.includes('../../scripts/media-cart-limits.js'));
  assert.deepEqual(listing.filter((s) => /media-cart(?:-ui|-resolver)?\.js$/.test(s)), [], 'no store, UI or resolver');
  assert.equal(/loadCartStyles|media-cart\.css/.test(read('blocks/listing/listing.js')), false, 'no cart stylesheet awaited');
  assert.deepEqual(imports(read('scripts/media-cart-limits.js')), [], 'the limits module imports nothing');
  assert.equal(imports(read('scripts/media-cart-ui.js')).includes('./media-cart.js'), false, 'the UI no longer pulls in the store');
});

test('the banner box is the same in the listing and on the cart page (only the margins differ)', () => {
  const rules = (css, selector) => {
    const at = css.indexOf(`${selector} {`);
    assert.ok(at >= 0, `${selector} is styled`);
    const body = css.slice(css.indexOf('{', at) + 1, css.indexOf('}', at));
    return body.split(';').map((d) => d.trim()).filter((d) => d && !d.startsWith('margin'));
  };
  const listing = read('blocks/listing/listing.css');
  const cartPage = read('blocks/media-cart/media-cart.css');
  ['', '::before'].forEach((pseudo) => {
    assert.deepEqual(
      rules(listing, `.listing.listing-media .media-cart-limit${pseudo}`),
      rules(cartPage, `.media-cart .media-cart-limit${pseudo}`),
      `.media-cart-limit${pseudo}`,
    );
  });
  assert.equal(read('styles/media-cart.css').includes('.media-cart-limit {'), false, 'not in the lazy sheet any more');
});
