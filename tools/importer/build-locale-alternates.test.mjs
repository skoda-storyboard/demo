/*
 * build-locale-alternates.mjs (SKODA-303a): the pure parts. No network.
 * Run: node --test tools/importer/build-locale-alternates.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  hreflangLinks, sourceUrl, mergeSheet, edsPathOf, migratedAlternates, chromeRows,
} from './build-locale-alternates.mjs';

const LIVE = 'https://www.skoda-storyboard.com';

test('hreflangLinks: alternate links in any attribute order; others ignored', () => {
  const html = `<head>
    <link rel="alternate" href="${LIVE}/cs/a/" hreflang="cs" />
    <link hreflang='de' rel='alternate' href='${LIVE}/de/b/?x=1&amp;y=2'>
    <link rel="alternate" type="application/rss+xml" href="${LIVE}/en/feed/">
    <link rel="canonical" href="${LIVE}/en/x/" hreflang="en">
    <link rel="alternate" href="${LIVE}/" hreflang="x-default" />
  </head>`;
  assert.deepEqual(hreflangLinks(html), [
    ['cs', `${LIVE}/cs/a/`], ['de', `${LIVE}/de/b/?x=1&y=2`], ['x-default', `${LIVE}/`],
  ]);
  assert.deepEqual(hreflangLinks(''), []);
  assert.deepEqual(hreflangLinks(null), []);
});

test('sourceUrl: the same path on the live site, with its trailing slash', () => {
  assert.equal(sourceUrl('/en'), `${LIVE}/en/`);
  assert.equal(sourceUrl('/en/media-room'), `${LIVE}/en/media-room/`);
  assert.equal(sourceUrl('/en/media-room/'), `${LIVE}/en/media-room/`);
});

test('mergeSheet: curated rows untouched, earlier generated rows replaced, new rows sorted', () => {
  const sheet = {
    total: 3,
    offset: 0,
    limit: 3,
    ':type': 'sheet',
    data: [
      {
        URL: '/en/press-releases/**', nav: '/media-room/nav', footer: '/media-room/footer', section: 'media-room',
      },
      {
        URL: '/en/old', nav: '', footer: '', section: '', alternates: `cs: ${LIVE}/cs/old/`,
      },
      {
        URL: '/en/media-room', nav: '/media-room/nav', footer: '', section: 'media-room',
      },
    ],
  };
  const merged = mergeSheet(sheet, [
    { URL: '/en/z', alternates: `sk: ${LIVE}/sk/z/` },
    { URL: '/en/media-room', alternates: `cs: ${LIVE}/cs/media-room/` },
  ]);
  assert.equal(merged[':type'], 'sheet');
  assert.equal(merged.total, 4);
  assert.deepEqual(merged.data.map((r) => [r.URL, r.nav, r.alternates]), [
    ['/en/press-releases/**', '/media-room/nav', ''],
    ['/en/media-room', '/media-room/nav', ''],
    ['/en/media-room', '', `cs: ${LIVE}/cs/media-room/`],
    ['/en/z', '', `sk: ${LIVE}/sk/z/`],
  ]);
  // every row has every column (empty cells never overwrite in bulk metadata)
  const keys = Object.keys(merged.data[0]).sort();
  const sameColumns = (r) => JSON.stringify(Object.keys(r).sort()) === JSON.stringify(keys);
  assert.ok(merged.data.every(sameColumns));
  assert.deepEqual(keys, ['URL', 'alternates', 'footer', 'nav', 'section']);
  // a curated row is never treated as generated, even with an alternates value
  const curatedWithAlt = mergeSheet({ data: [{ URL: '/en/x', nav: '/nav', alternates: 'cs: x' }] }, []);
  assert.equal(curatedWithAlt.data.length, 1);
  assert.equal(mergeSheet(undefined, []).data.length, 0);
});

test('edsPathOf: a live URL → its EDS path; other hosts and junk → null', () => {
  assert.equal(edsPathOf(`${LIVE}/cs/e-mobilita-cs/x/`), '/cs/e-mobilita-cs/x');
  assert.equal(edsPathOf(`${LIVE}/cs/`), '/cs');
  assert.equal(edsPathOf('https://evil.example/cs/x/'), null);
  assert.equal(edsPathOf('not a url'), null);
  assert.equal(edsPathOf(`${LIVE}/`), null);
});

test('migratedAlternates: only translations migrated to EDS, as site paths; the rest reported', () => {
  const declared = `cs: ${LIVE}/cs/a/, de: ${LIVE}/de/b/, sk: ${LIVE}/sk/c/`;
  const onEds = new Set(['/cs/a', '/sk/c']);
  assert.deepEqual(migratedAlternates(declared, (p) => onEds.has(p)), {
    alternates: 'cs: /cs/a, sk: /sk/c', kept: ['cs: /cs/a', 'sk: /sk/c'], missing: ['de'],
  });
  assert.equal(migratedAlternates(declared, () => false).alternates, '', 'nothing migrated: no row');
  assert.equal(migratedAlternates('', () => true).alternates, '');
});

test('chromeRows: one /{locale}/** row per translated locale; en and unknown codes skipped', () => {
  assert.deepEqual(chromeRows(['cs', 'en', 'fr', 'de']), [
    { URL: '/cs/**', nav: '/cs/nav', footer: '/cs/footer' },
    { URL: '/de/**', nav: '/de/nav', footer: '/de/footer' },
  ]);
  assert.deepEqual(chromeRows(), []);
});

test('mergeSheet: chrome rows are added once (idempotent) and kept as curated rows', () => {
  const extra = chromeRows(['cs']);
  const first = mergeSheet({ data: [{ URL: '/en/x/**', nav: '/media-room/nav', footer: '' }] }, [{ URL: '/en/a', alternates: 'cs: /cs/a' }], extra);
  const second = mergeSheet(first, [{ URL: '/en/a', alternates: 'cs: /cs/a' }], extra);
  assert.deepEqual(second.data.map((r) => [r.URL, r.nav, r.alternates]), [
    ['/en/x/**', '/media-room/nav', ''],
    ['/cs/**', '/cs/nav', ''],
    ['/en/a', '', 'cs: /cs/a'],
  ]);
  assert.equal(second.total, 3);
});

test('chromeRows with --chrome-footer: locales without a translated footer keep the English /footer', () => {
  assert.deepEqual(chromeRows(['cs', 'de'], ['cs']), [
    { URL: '/cs/**', nav: '/cs/nav', footer: '/cs/footer' },
    { URL: '/de/**', nav: '/de/nav', footer: '' },
  ]);
  // an earlier chrome row (with /de/footer) is replaced, not kept next to the new one
  const old = { data: [{ URL: '/de/**', nav: '/de/nav', footer: '/de/footer' }, { URL: '/de/x/**', nav: '/other', footer: '' }] };
  const merged = mergeSheet(old, [], chromeRows(['de'], []));
  assert.deepEqual(merged.data.map((r) => [r.URL, r.nav, r.footer]), [
    ['/de/x/**', '/other', ''],
    ['/de/**', '/de/nav', ''],
  ]);
});
