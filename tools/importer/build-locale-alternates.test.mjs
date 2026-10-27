/*
 * build-locale-alternates.mjs (SKODA-303a): the pure parts. No network.
 * Run: node --test tools/importer/build-locale-alternates.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  hreflangLinks, sourceUrl, mergeSheet, edsPathOf, migratedHreflang, chromeRows, HREFLANG_COLUMNS,
} from './build-locale-alternates.mjs';

const LIVE = 'https://www.skoda-storyboard.com';
const DEMO = 'https://main--demo--skoda-storyboard.aem.live';

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

test('mergeSheet: curated rows untouched, earlier generated rows replaced, native hreflang columns (#299)', () => {
  const sheet = {
    total: 4,
    offset: 0,
    limit: 4,
    ':type': 'sheet',
    data: [
      {
        URL: '/en/press-releases/**', nav: '/media-room/nav', footer: '/media-room/footer', section: 'media-room', alternates: '',
      },
      // an earlier generated row in the old custom format: replaced
      {
        URL: '/en/old', nav: '', footer: '', section: '', alternates: 'cs: /cs/old',
      },
      // an earlier generated row in the native format: replaced
      { URL: '/en/z', 'hreflang:en': `${DEMO}/en/z`, 'hreflang:sk': `${DEMO}/sk/old-z` },
      {
        URL: '/en/media-room', nav: '/media-room/nav', footer: '', section: 'media-room', alternates: '',
      },
    ],
  };
  const merged = mergeSheet(sheet, [
    { URL: '/en/z', 'hreflang:en': `${DEMO}/en/z`, 'hreflang:sk': `${DEMO}/sk/z` },
    { URL: '/en/media-room', 'hreflang:cs': `${DEMO}/cs/media-room`, 'hreflang:en': `${DEMO}/en/media-room` },
  ]);
  assert.equal(merged[':type'], 'sheet');
  assert.equal(merged.total, 4);
  assert.deepEqual(merged.data.map((r) => [r.URL, r.nav, r['hreflang:en'], r['hreflang:cs'], r['hreflang:sk']]), [
    ['/en/press-releases/**', '/media-room/nav', '', '', ''],
    ['/en/media-room', '/media-room/nav', '', '', ''],
    ['/en/media-room', '', `${DEMO}/en/media-room`, `${DEMO}/cs/media-room`, ''],
    ['/en/z', '', `${DEMO}/en/z`, '', `${DEMO}/sk/z`],
  ]);
  // every row has every column (empty cells never overwrite in bulk metadata); no `alternates`
  const keys = Object.keys(merged.data[0]);
  assert.ok(merged.data.every((r) => JSON.stringify(Object.keys(r)) === JSON.stringify(keys)));
  assert.deepEqual(
    keys,
    ['URL', 'nav', 'footer', 'section', 'hreflang:en', 'hreflang:cs', 'hreflang:sk'],
    'the used hreflang columns, last, in the switcher order',
  );
  // a curated row is never treated as generated, even with an hreflang value
  const curated = mergeSheet({ data: [{ URL: '/en/x', nav: '/nav', 'hreflang:cs': `${DEMO}/cs/x` }] }, []);
  assert.deepEqual(curated.data, [{ URL: '/en/x', nav: '/nav', 'hreflang:cs': `${DEMO}/cs/x` }]);
  assert.equal(mergeSheet(undefined, []).data.length, 0);
  assert.equal(HREFLANG_COLUMNS.at(-1), 'hreflang:x-default');
});

test('edsPathOf: a live URL → its EDS path; other hosts and junk → null', () => {
  assert.equal(edsPathOf(`${LIVE}/cs/e-mobilita-cs/x/`), '/cs/e-mobilita-cs/x');
  assert.equal(edsPathOf(`${LIVE}/cs/`), '/cs');
  assert.equal(edsPathOf('https://evil.example/cs/x/'), null);
  assert.equal(edsPathOf('not a url'), null);
  assert.equal(edsPathOf(`${LIVE}/`), null);
});

test('migratedHreflang: the migrated entries as absolute URLs on the origin, self kept; the rest reported', () => {
  const declared = [
    ['en', `${LIVE}/en/a/`], ['cs', `${LIVE}/cs/a/`], ['de', `${LIVE}/de/b/`], ['sk', `${LIVE}/sk/c/`],
    ['x-default', `${LIVE}/en/a/`],
  ];
  const onEds = new Set(['/en/a', '/cs/a', '/sk/c']);
  assert.deepEqual(migratedHreflang(declared, (p) => onEds.has(p), `${DEMO}/`), {
    columns: {
      'hreflang:en': `${DEMO}/en/a`,
      'hreflang:cs': `${DEMO}/cs/a`,
      'hreflang:sk': `${DEMO}/sk/c`,
      'hreflang:x-default': `${DEMO}/en/a`,
    },
    kept: ['en', 'cs', 'sk', 'x-default'],
    missing: ['de'],
  });
  // only the page itself migrated: its self-hreflang and the authored x-default (its target is
  // that page) are still written (#299 review); the switcher shows EN alone, no x-default
  assert.deepEqual(migratedHreflang(declared, (p) => p === '/en/a', DEMO), {
    columns: { 'hreflang:en': `${DEMO}/en/a`, 'hreflang:x-default': `${DEMO}/en/a` },
    kept: ['en', 'x-default'],
    missing: ['cs', 'de', 'sk'],
  });
  // Lars's case: EN + CZ + x-default → EN declared, only EN migrated
  const enOnly = [['en', `${LIVE}/en/p/`], ['cs', `${LIVE}/cs/p/`], ['x-default', `${LIVE}/en/p/`]];
  assert.deepEqual(migratedHreflang(enOnly, (p) => p === '/en/p', DEMO), {
    columns: { 'hreflang:en': `${DEMO}/en/p`, 'hreflang:x-default': `${DEMO}/en/p` },
    kept: ['en', 'x-default'],
    missing: ['cs'],
  });
  // an x-default whose target is not migrated is dropped; self stays
  const xElsewhere = [['en', `${LIVE}/en/p/`], ['x-default', `${LIVE}/en/q/`]];
  assert.deepEqual(migratedHreflang(xElsewhere, (p) => p === '/en/p', DEMO).columns, { 'hreflang:en': `${DEMO}/en/p` });
  // the home's x-default is the site root, which is not a page: dropped
  const home = [['en', `${LIVE}/en/`], ['cs', `${LIVE}/cs/`], ['x-default', `${LIVE}/`]];
  assert.deepEqual(migratedHreflang(home, () => true, DEMO).columns, {
    'hreflang:en': `${DEMO}/en`, 'hreflang:cs': `${DEMO}/cs`,
  });
  assert.deepEqual(migratedHreflang([], () => true, DEMO), { columns: {}, kept: [], missing: [] });
  assert.deepEqual(migratedHreflang(undefined, () => true, DEMO).columns, {});
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
  const row = { URL: '/en/a', 'hreflang:en': `${DEMO}/en/a`, 'hreflang:cs': `${DEMO}/cs/a` };
  const first = mergeSheet({ data: [{ URL: '/en/x/**', nav: '/media-room/nav', footer: '' }] }, [row], extra);
  const second = mergeSheet(first, [row], extra);
  assert.deepEqual(second.data.map((r) => [r.URL, r.nav, r['hreflang:cs']]), [
    ['/en/x/**', '/media-room/nav', ''],
    ['/cs/**', '/cs/nav', ''],
    ['/en/a', '', `${DEMO}/cs/a`],
  ]);
  assert.equal(second.total, 3);
});

test('mergeSheet: a run without chrome rows (no --chrome) keeps the existing ones', () => {
  const sheet = {
    data: [
      { URL: '/cs/**', nav: '/cs/nav', footer: '/cs/footer' },
      { URL: '/de/**', nav: '/de/nav', footer: '' },
      {
        URL: '/en/a', nav: '', footer: '', 'hreflang:en': `${DEMO}/en/old`,
      },
    ],
  };
  const merged = mergeSheet(sheet, [{ URL: '/en/a', 'hreflang:en': `${DEMO}/en/a` }]);
  assert.deepEqual(merged.data.map((r) => [r.URL, r.nav, r.footer, r['hreflang:en']]), [
    ['/cs/**', '/cs/nav', '/cs/footer', ''],
    ['/de/**', '/de/nav', '', ''],
    ['/en/a', '', '', `${DEMO}/en/a`],
  ]);
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

// --- SKODA-1001: the Media Room chrome rows per locale -----------------------------------

test('mediaRoomRows: each Media Room section and content prefix of a locale, with its /**', async () => {
  const { mediaRoomRows } = await import('./build-locale-alternates.mjs');
  const rows = mediaRoomRows(['cs']);
  const urls = rows.map((r) => r.URL);
  ['/cs/media-room', '/cs/tiskove-zpravy', '/cs/tiskove-zpravy-archiv/**', '/cs/foto', '/cs/kontakty/kosik', '/cs/skoda-model/**']
    .forEach((u) => assert.ok(urls.includes(u), u));
  assert.ok(rows.every((r) => r.nav === '/cs/media-room/nav' && r.footer === '/cs/media-room/footer' && r.section === 'media-room'));
  // a section the locale lacks (Slovenian has no press kits) gets no row, never an English path
  assert.ok(mediaRoomRows(['sl']).every((r) => r.URL.startsWith('/sl/')));
  assert.deepEqual(mediaRoomRows(['en', 'xx']), []);
});

test('mergeSheet: the Media Room rows follow /{locale}/**, and a re-run replaces both in place', async () => {
  const { mergeSheet, chromeRows, mediaRoomRows } = await import('./build-locale-alternates.mjs');
  const extra = [...chromeRows(['cs']), ...mediaRoomRows(['cs'])];
  const curated = { URL: '/en/press-releases/**', nav: '/media-room/nav', footer: '/media-room/footer', section: 'media-room' };
  const first = mergeSheet({ data: [curated] }, [], extra);
  const at = (sheet, url) => sheet.data.findIndex((r) => r.URL === url);
  assert.ok(at(first, '/cs/**') < at(first, '/cs/tiskove-zpravy-archiv/**'), 'the specific rows come later, so they win');
  assert.equal(at(first, '/en/press-releases/**'), 0, 'the curated English rows stay first, unchanged');
  // a second run: the tool's own rows are replaced, not kept as curated before the new /cs/**
  const second = mergeSheet(first, [], extra);
  assert.equal(second.data.length, first.data.length);
  assert.ok(at(second, '/cs/**') < at(second, '/cs/tiskove-zpravy-archiv/**'));
  assert.equal(second.data.filter((r) => r.URL === '/cs/foto').length, 1, 'no duplicate rows');
});

// #485 review: a refresh replaces only the locales and families it brings
test('mergeSheet: a Media Room refresh of one locale keeps every other locale and the Storyboard rows', async () => {
  const { mediaRoomRows } = await import('./build-locale-alternates.mjs');
  const installed = mergeSheet({ data: [] }, [], [...chromeRows(['cs', 'de']), ...mediaRoomRows(['cs', 'de'])]);
  assert.equal(installed.data.length, 46);
  const key = (r) => [r.URL, r.nav, r.footer, r.section].join(' ');
  const refreshed = mergeSheet(installed, [], mediaRoomRows(['cs']));
  assert.equal(refreshed.data.length, 46, 'no row lost (was 22)');
  assert.deepEqual(new Set(refreshed.data.map(key)), new Set(installed.data.map(key)), 'the same rows');
  assert.equal(refreshed.data.filter((r) => r.URL.startsWith('/de/')).length, 23, '/de/** and its 22 Media Room rows');
});

test('mergeSheet: a Storyboard refresh keeps the locale\'s Media Room rows after its /{locale}/** row', async () => {
  const { mediaRoomRows } = await import('./build-locale-alternates.mjs');
  const installed = mergeSheet({ data: [] }, [], [...chromeRows(['cs']), ...mediaRoomRows(['cs'])]);
  const refreshed = mergeSheet(installed, [], chromeRows(['cs'], []));
  const at = (url) => refreshed.data.findIndex((r) => r.URL === url);
  assert.equal(refreshed.data.length, installed.data.length);
  assert.equal(refreshed.data[at('/cs/**')].footer, '', 'the refreshed row');
  assert.ok(at('/cs/**') < at('/cs/tiskove-zpravy-archiv/**'), 'the Media Room rows still come later, so they win');
});

test('mergeSheet: a refreshed family drops its stale rows; other locales keep theirs', async () => {
  const { mediaRoomRows } = await import('./build-locale-alternates.mjs');
  const stale = (code) => ({
    URL: `/${code}/old-section/**`, nav: `/${code}/media-room/nav`, footer: `/${code}/media-room/footer`, section: 'media-room',
  });
  const installed = mergeSheet({ data: [stale('cs'), stale('de')] }, [], []);
  const refreshed = mergeSheet(installed, [], mediaRoomRows(['cs']));
  const urls = refreshed.data.map((r) => r.URL);
  assert.equal(urls.includes('/cs/old-section/**'), false, 'the refreshed locale\'s stale row goes');
  assert.ok(urls.includes('/de/old-section/**'), 'another locale\'s row stays');
});
