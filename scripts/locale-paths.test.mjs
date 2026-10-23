/*
 * Unit tests for scripts/locale-paths.js (SKODA-1001): per-locale section paths from the
 * source's hreflang map, with an English fallback; and the locale of the content this site
 * builds itself (media feed, 404 fragments).
 * Run: node --test scripts/locale-paths.test.mjs
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = { location: { pathname: '/cs/foto' } };

const {
  LOCALE_PATHS, BUILT, localePath, builtLocale,
} = await import('./locale-paths.js');

test('localePath: the section in the page locale, with the source slugs', () => {
  assert.equal(localePath('images', '/cs/e-mobilita-cs/a-story'), '/cs/foto');
  assert.equal(localePath('search', '/de/fotos'), '/de/suche');
  assert.equal(localePath('mediaCart', '/sk/kosik'), '/sk/kosik');
  assert.equal(localePath('news', '/sr/x'), '/sr/news');
  assert.equal(localePath('videos', '/sl/x'), '/sl/videoposnetki');
  assert.equal(localePath('images'), '/cs/foto', 'the current page by default');
});

test('localePath: English for the English site, the root and unknown locales', () => {
  assert.equal(localePath('news', '/en/press-releases/x'), '/en/news');
  assert.equal(localePath('news', '/'), '/en/news');
  assert.equal(localePath('news', '/xx/whatever'), '/en/news', 'not one of the six');
});

test('localePath: a section the locale lacks falls back to the English path', () => {
  // the source has no Slovenian press-release listing, no German series directory
  assert.equal(localePath('news', '/sl/x'), '/en/news');
  assert.equal(localePath('series', '/de/x'), '/en/series-2');
  assert.equal(localePath('nope', '/cs/x'), undefined, 'an unknown section stays undefined');
});

test('LOCALE_PATHS: EDS paths (no trailing slash), each under its own locale', () => {
  Object.entries(LOCALE_PATHS).forEach(([locale, paths]) => {
    Object.entries(paths).forEach(([key, path]) => {
      assert.match(path, new RegExp(`^/${locale}(?:/[a-z0-9-]+)*$`), `${locale}.${key}`);
    });
  });
  // every locale has the sections every page reaches (home, media room, images, videos, search, cart)
  ['home', 'mediaRoom', 'images', 'videos', 'search', 'mediaCart'].forEach((key) => {
    Object.keys(LOCALE_PATHS).forEach((locale) => assert.ok(LOCALE_PATHS[locale][key], `${locale}.${key}`));
  });
});

test('builtLocale: the page locale only when that content is built, else English', () => {
  assert.deepEqual(BUILT.mediaFeed, ['en']);
  assert.equal(builtLocale('mediaFeed', '/en/images'), 'en');
  assert.equal(builtLocale('mediaFeed', '/cs/foto'), 'en', 'no Czech feed yet');
  assert.equal(builtLocale('fragments404', '/de/missing'), 'en');
  assert.equal(builtLocale('mediaCart', '/cs/tiskove-zpravy-archiv/x'), 'en', 'one cart page, English');
  assert.equal(builtLocale('unknown', '/cs/x'), 'en');
  // odd paths: upper case, a bare locale, an unknown two-letter segment, the root
  assert.equal(localePath('news', '/CS/foto'), '/cs/tiskove-zpravy');
  assert.equal(localePath('news', '/cs'), '/cs/tiskove-zpravy');
  assert.equal(localePath('news', '/xx/page'), '/en/news', 'an unknown locale reads English');
  assert.equal(localePath('news', '/'), '/en/news');
  assert.equal(localePath('nosuchkey', '/cs/x'), undefined);
});
