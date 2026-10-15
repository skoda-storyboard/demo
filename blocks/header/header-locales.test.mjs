/*
 * Language switcher tests (SKODA-303, SKODA-303a): the pure helper (current locale, authored
 * entries, declared translations, the list markup) and the header wiring on jsdom (topbar list
 * + drawer copy from the nav fragment and the page's native hreflang links, #299 review).
 * Run: node --test blocks/header/header-locales.test.mjs
 */
/* global globalThis */
/* eslint-disable import/no-extraneous-dependencies */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import {
  LOCALES, currentLocale, localeOf, localeEntries, isLocaleGroup, buildLocaleList,
  pageHreflangs, permittedTranslation,
} from './header-locales.js';

const BASE = 'https://main--demo--skoda-storyboard.aem.page/en/emobility/x';
const LIVE = 'https://www.skoda-storyboard.com';
// the nav as authored for EDS: locale URLs without a trailing slash (the EN home is /en)
const AUTHORED = '<strong>EN</strong> <a href="/cs">CZ</a> <a href="/de">DE</a> <a href="/sk">SK</a> <a href="/sr">SR</a> <a href="/sl">SL</a>';
// the Media Room nav: /{locale}/media-room, DE on the external skoda-media.de (as the source)
const AUTHORED_MR = '<strong>EN</strong> <a href="/cs/media-room">CZ</a> <a href="https://www.skoda-media.de/">DE</a> <a href="/sk/media-room">SK</a> <a href="/sr/media-room">SR</a> <a href="/sl/media-room">SL</a>';
const para = (html) => {
  const { document } = new JSDOM(`<p>${html}</p>`, { url: BASE }).window;
  return document.querySelector('p');
};
const rows = (ul) => [...ul.children].map((li) => li.firstElementChild).map((el) => [
  el.textContent, el.tagName, el.getAttribute('href'), el.getAttribute('target'), el.getAttribute('aria-label'),
]);
// the hreflang URLs are absolute on the site's live host (build-locale-alternates.mjs --origin)
const DEMO = 'https://main--demo--skoda-storyboard.aem.live';
// the Epiq story's hreflang set as EDS renders it (self included; no SL translation)
const EPIQ = [
  ['en', `${DEMO}/en/emobility/skoda-epiq-will-win-you-over-in-just-a-few-seconds`],
  ['cs', `${DEMO}/cs/e-mobilita-cs/skoda-epiq-si-vas-ziska-za-par-sekund`],
  ['de', `${DEMO}/de/emobilitat-de/skoda-epiq-will-win-you-over-in-just-a-few-seconds`],
  ['sk', `${DEMO}/sk/emobilita-sk/skoda-epiq-si-vas-ziska-za-par-sekund`],
  ['sr', `${DEMO}/sr/emobilnost-sr/skoda-epiq-will-win-you-over-in-just-a-few-seconds`],
];
const MEDIA_ROOM = ['en', 'cs', 'de', 'sk', 'sr', 'sl'].map((c) => [c, `${DEMO}/${c}/media-room`]);
// a page whose head carries these `<link rel="alternate" hreflang href>` (plus any extra markup)
const pageWith = (pairs, extra = '') => {
  const head = pairs.map(([lang, href]) => `<link rel="alternate" hreflang="${lang}" href="${href}">`).join('');
  return new JSDOM(`<html><head>${head}${extra}</head><body></body></html>`, { url: BASE }).window.document;
};
const declared = (pairs, extra) => pageHreflangs(pageWith(pairs, extra));

test('currentLocale: the first path segment when it is a locale, else en', () => {
  assert.equal(currentLocale('/en/emobility/x'), 'en');
  assert.equal(currentLocale('/cs/e-mobilita-cs/y'), 'cs');
  assert.equal(currentLocale('/SL/'), 'sl');
  assert.equal(currentLocale('/sr'), 'sr');
  assert.equal(currentLocale('/'), 'en');
  assert.equal(currentLocale('/drafts/test'), 'en');
  assert.equal(currentLocale('/fr/x'), 'en');
  assert.equal(currentLocale(), 'en');
});

test('localeOf: from the href segment, else the label (CZ means cs)', () => {
  assert.equal(localeOf('/cs/', 'CZ', BASE), 'cs');
  assert.equal(localeOf('https://www.skoda-storyboard.com/de/media-room', 'x', BASE), 'de');
  assert.equal(localeOf(null, 'EN', BASE), 'en');
  assert.equal(localeOf(null, ' cz ', BASE), 'cs');
  assert.equal(localeOf(null, 'sk', BASE), 'sk');
  assert.equal(localeOf('#subscribe', 'Subscribe to our stories', BASE), null, 'a fragment link is not the page locale');
  assert.equal(localeOf('sub/page', 'x', BASE), null, 'nor a relative one');
  assert.equal(localeOf('/en/media-room', 'Media Room', BASE), 'en', 'a link into a locale tree counts');
});

test('localeEntries: source order, bold without href, junk and duplicates dropped', () => {
  assert.deepEqual(localeEntries(para(AUTHORED), BASE).map((e) => [e.code, e.href]), [
    ['en', null], ['cs', '/cs'], ['de', '/de'], ['sk', '/sk'], ['sr', '/sr'], ['sl', '/sl'],
  ]);
  const messy = localeEntries(para('<a href="/de/">DE</a> <em>or</em> <a href="#x">Help</a> <b>EN</b> <a href="/de/">DE</a>'), BASE);
  assert.deepEqual(messy.map((e) => e.code), ['de', 'en']);
  // bold wrapping a link counts once, as the link
  assert.deepEqual(localeEntries(para('<strong><a href="/sk/">SK</a></strong> <a href="/cs/">CZ</a>'), BASE)
    .map((e) => [e.code, e.href]), [['sk', '/sk/'], ['cs', '/cs/']]);
});

test('isLocaleGroup: needs two known locales (Subscribe is not a locale group)', () => {
  assert.equal(isLocaleGroup(para(AUTHORED), BASE), true);
  assert.equal(isLocaleGroup(para('<a href="#subscribe">Subscribe to our stories</a>'), BASE), false);
  assert.equal(isLocaleGroup(para('<strong>EN</strong>'), BASE), false);
});

test('pageHreflangs: the head\'s native hreflang links; region, x-default, unknown and repeats handled', () => {
  assert.deepEqual([...declared(EPIQ).keys()], ['en', 'cs', 'de', 'sk', 'sr']);
  assert.equal(declared(EPIQ).get('cs'), `${DEMO}/cs/e-mobilita-cs/skoda-epiq-si-vas-ziska-za-par-sekund`);
  const messy = declared([
    ['x-default', `${DEMO}/en`], ['de-AT', `${DEMO}/de/a`], ['fr', `${DEMO}/fr/b`], ['de', `${DEMO}/de/second`], ['SL', `${DEMO}/sl/d`],
  ], '<link rel="alternate" hreflang="sk" href=""><link rel="alternate stylesheet" hreflang="sr" href="/sr/s"><link rel="canonical" hreflang="cs" href="/cs/c"><link rel="alternate" href="/cs/no-lang">');
  assert.deepEqual([...messy], [['de', `${DEMO}/de/a`], ['sl', `${DEMO}/sl/d`]],
    'x-default, unknown codes, empty hrefs, stylesheets, non-alternate links and repeats are skipped');
  assert.equal(declared([]).size, 0);
  // the old custom `alternates` meta is not a source any more (#299 review)
  assert.equal(declared([], '<meta name="alternates" content="cs: /cs/x">').size, 0);
});

test('permittedTranslation: a page of this site in its own locale tree; never the live site', () => {
  assert.equal(permittedTranslation('cs', '/cs/x', BASE), '/cs/x', 'a migrated EDS variant');
  assert.equal(permittedTranslation('cs', 'https://main--demo--skoda-storyboard.aem.page/cs/x?a=1#b', BASE), '/cs/x?a=1#b', 'same host, absolute');
  assert.equal(permittedTranslation('cs', `${DEMO}/cs/x`, BASE), '/cs/x', 'the site\'s live host: opened on this host');
  assert.equal(permittedTranslation('cs', 'https://skoda-303a-locale-links--demo--skoda-storyboard.aem.page/cs/x', BASE), '/cs/x', 'another branch of the site');
  assert.equal(permittedTranslation('cs', 'https://main--other--skoda-storyboard.aem.live/cs/x', BASE), null, 'another EDS site');
  assert.equal(permittedTranslation('cs', 'https://main--demo--skoda-storyboard.aem.live.evil.example/cs/x', BASE), null, 'a look-alike host');
  assert.equal(permittedTranslation('cs', `${DEMO}/cs/x`, 'https://www.example.com/en/x'), null, 'a custom domain accepts only itself');
  // the host the page's own hreflang link names counts as this site (local dev, a new domain)
  assert.equal(permittedTranslation('cs', `${DEMO}/cs/x`, 'http://localhost:3000/en/x', 'main--demo--skoda-storyboard.aem.live'), '/cs/x');
  assert.equal(permittedTranslation('cs', 'https://evil.example/cs/x', 'http://localhost:3000/en/x', 'main--demo--skoda-storyboard.aem.live'), null);
  assert.equal(permittedTranslation('cs', `${LIVE}/cs/x/`, BASE), null, 'the live site is not a target');
  assert.equal(permittedTranslation('cs', '/de/x', BASE), null, 'another locale\'s tree');
  assert.equal(permittedTranslation('cs', '/', BASE), null, 'the bare root');
  assert.equal(permittedTranslation('cs', 'https://evil.example/cs/x', BASE), null, 'another host');
  assert.equal(permittedTranslation('cs', '//evil.example/cs/x', BASE), null);
  // eslint-disable-next-line no-script-url
  assert.equal(permittedTranslation('cs', 'javascript:alert(1)', BASE), null);
  assert.equal(permittedTranslation('cs', 'http://[bad', BASE), null, 'an unparsable URL');
});

test('Epiq story: only the declared translations, same tab, named by their language; SL left out', () => {
  const p = para(AUTHORED);
  const ul = buildLocaleList(localeEntries(p, BASE), 'en', p.ownerDocument, declared(EPIQ));
  assert.equal(ul.className, 'nav-locales-list');
  assert.equal(ul.getAttribute('aria-label'), 'Language');
  assert.equal(ul.dataset.linkPolicy, 'resolved', 'the site link pass leaves it alone');
  assert.deepEqual(rows(ul), [
    ['EN', 'SPAN', null, null, null],
    ['CZ', 'A', '/cs/e-mobilita-cs/skoda-epiq-si-vas-ziska-za-par-sekund', null, 'CZ – Čeština'],
    ['DE', 'A', '/de/emobilitat-de/skoda-epiq-will-win-you-over-in-just-a-few-seconds', null, 'DE – Deutsch'],
    ['SK', 'A', '/sk/emobilita-sk/skoda-epiq-si-vas-ziska-za-par-sekund', null, 'SK – Slovenčina'],
    ['SR', 'A', '/sr/emobilnost-sr/skoda-epiq-will-win-you-over-in-just-a-few-seconds', null, 'SR – Srpski'],
  ]);
  const en = ul.querySelector('span');
  assert.deepEqual([en.getAttribute('aria-current'), en.getAttribute('lang')], ['true', 'en']);
  const langs = [...ul.querySelectorAll('a')].map((a) => [a.getAttribute('hreflang'), a.getAttribute('lang')]);
  assert.deepEqual(langs, [['cs', 'cs'], ['de', 'de'], ['sk', 'sk'], ['sr', 'sr']]);
});

test('no declared translations: only the current language, never a locale-home fallback', () => {
  const p = para(AUTHORED);
  [new Map(), undefined, declared([['x-default', `${DEMO}/cs/x`]]), declared([['en', `${DEMO}/en/x`]])].forEach((translations) => {
    const ul = buildLocaleList(localeEntries(p, BASE), 'en', p.ownerDocument, translations);
    assert.deepEqual(rows(ul), [['EN', 'SPAN', null, null, null]]);
  });
});

test('a declared translation that is not permitted is left out (no fallback)', () => {
  const p = para(AUTHORED);
  const translations = declared([['cs', 'https://evil.example/cs/x'], ['de', `${DEMO}/sk/wrong-tree`], ['sk', `${DEMO}/sk/ok`], ['sr', `${LIVE}/sr/live-only/`]]);
  const ul = buildLocaleList(localeEntries(p, BASE), 'en', p.ownerDocument, translations);
  assert.deepEqual(rows(ul).map((r) => [r[0], r[2]]), [['EN', null], ['SK', '/sk/ok']], 'a live-site URL never shows');
});

test('Media Room: the declared Media Rooms in the tab; DE takes the authored skoda-media.de in a new tab', () => {
  const p = para(AUTHORED_MR);
  const ul = buildLocaleList(localeEntries(p, BASE), 'en', p.ownerDocument, declared(MEDIA_ROOM));
  assert.deepEqual(rows(ul), [
    ['EN', 'SPAN', null, null, null],
    ['CZ', 'A', '/cs/media-room', null, 'CZ – Čeština'],
    ['DE', 'A', 'https://www.skoda-media.de/', '_blank', 'DE – Deutsch (opens in a new tab)'],
    ['SK', 'A', '/sk/media-room', null, 'SK – Slovenčina'],
    ['SR', 'A', '/sr/media-room', null, 'SR – Srpski'],
    ['SL', 'A', '/sl/media-room', null, 'SL – Slovenščina'],
  ]);
  assert.equal(ul.querySelector('a[target]').getAttribute('rel'), 'noopener');
});

test('Media Room nav on a press release without a DE translation: no DE (as the source)', () => {
  const p = para(AUTHORED_MR);
  const zellmer = [
    ['cs', `${DEMO}/cs/tiskove-zpravy-archiv/klaus-zellmer-odchazi-ze-spolecnosti-skoda-auto`],
    ['sk', `${DEMO}/sk/tlacova-sprava/klaus-zellmer-odchadza-zo-spolocnosti-skoda-auto`],
    ['sr', `${DEMO}/sr/press_release/skoda-auto-klaus-zellmer-napusta-kompaniju`],
  ];
  const ul = buildLocaleList(localeEntries(p, BASE), 'en', p.ownerDocument, declared(zellmer));
  assert.deepEqual(rows(ul).map((r) => r[0]), ['EN', 'CZ', 'SK', 'SR']);
  assert.equal(ul.querySelector('a[target]'), null);
});

test('a CZ page: CZ is current in place, EN links its declared translation', () => {
  const p = para(AUTHORED);
  const ul = buildLocaleList(localeEntries(p, BASE), 'cs', p.ownerDocument, declared([['en', `${DEMO}/en/x`], ['cs', `${DEMO}/cs/x`], ['de', `${DEMO}/de/y`]]));
  assert.deepEqual(rows(ul).map((r) => [r[0], r[1], r[2]]), [
    ['EN', 'A', '/en/x'], ['CZ', 'SPAN', null], ['DE', 'A', '/de/y'],
  ]);
});

test('a locale the nav row does not list is not shown, even when declared', () => {
  const p = para('<strong>EN</strong> <a href="/cs">CZ</a> <a href="/de">DE</a>');
  const ul = buildLocaleList(localeEntries(p, BASE), 'en', p.ownerDocument, declared([['cs', `${DEMO}/cs/a`], ['sl', `${DEMO}/sl/b`]]));
  assert.deepEqual(rows(ul).map((r) => r[0]), ['EN', 'CZ']);
});

test('buildLocaleList: nothing to build returns null; every LOCALES code has a label and name', () => {
  assert.equal(buildLocaleList([], 'en', new JSDOM('').window.document), null);
  assert.deepEqual(LOCALES.map((l) => l.code), ['en', 'cs', 'de', 'sk', 'sr', 'sl']);
  assert.ok(LOCALES.every((l) => l.label && l.name));
});

// --- header wiring (real decorate on jsdom, nav fragment served by a fetch stub) -----------
const NAV = `<div><ul><li><a href="/en/">Stories</a></li><li><a href="/en/media-room">Media Room</a></li></ul>
<p><a href="#subscribe">Subscribe to our stories</a></p><p>${AUTHORED}</p></div>
<div><p><a href="/en/" title="Škoda Storyboard, home">Škoda Storyboard</a></p></div>
<div><ul><li><a href="/en/category/models">Models</a></li></ul></div>
<div><p>Search</p></div>`;

// one document, as header.test.mjs: importing header.js runs scripts.js' page load once, so
// the page path is switched with history.replaceState rather than a new document
const dom = new JSDOM('<!DOCTYPE html><html><head></head><body><header><div class="header block"></div></header><main><div><p>page</p></div></main><footer><div class="footer block"></div></footer></body></html>', { url: BASE });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Event = dom.window.Event;
globalThis.CustomEvent = dom.window.CustomEvent;
window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
window.hlx = { codeBasePath: '' };
globalThis.fetch = async (url) => (String(url).includes('/nav.plain.html')
  ? { ok: true, status: 200, text: async () => NAV }
  : {
    ok: false, status: 404, text: async () => '', json: async () => ({}),
  });
const { default: decorateHeader } = await import('./header.js');

// the page's native hreflang links (and any other head markup), as EDS renders them
function setHead(pairs = [], extra = '') {
  document.head.querySelectorAll('link[rel~="alternate"], meta[name="alternates"]').forEach((el) => el.remove());
  document.head.insertAdjacentHTML('beforeend', pairs.map(([lang, href]) => `<link rel="alternate" hreflang="${lang}" href="${href}">`).join('') + extra);
}

async function renderHeader(path, pairs = [], extra = '') {
  window.history.replaceState({}, '', path);
  setHead(pairs, extra);
  const block = document.querySelector('.header');
  await decorateHeader(block);
  return block;
}

test('header: the topbar group becomes a <div> list and the drawer gets an identical copy', async () => {
  const block = await renderHeader('/en/emobility/x', EPIQ);
  const topbar = block.querySelector('.nav-topbar .nav-topbar-locales');
  assert.ok(topbar, 'topbar locale group');
  assert.equal(topbar.tagName, 'DIV');
  assert.ok(topbar.classList.contains('nav-topbar-utility'));
  assert.equal(topbar.querySelector('p, strong'), null, 'no authored markup left');
  const drawer = block.querySelector('nav .nav-locales .nav-locales-list');
  assert.ok(drawer, 'drawer copy');
  assert.equal(drawer.outerHTML, topbar.querySelector('.nav-locales-list').outerHTML, 'desktop and mobile use the same mapping');
  assert.equal(topbar.querySelector('[aria-current]').textContent, 'EN');
  // SKODA-303a: the page's declared translation, in the same tab; no SL (none declared)
  const cz = topbar.querySelector('a[hreflang="cs"]');
  const czState = [cz.getAttribute('href'), cz.getAttribute('target'), cz.getAttribute('aria-label')];
  assert.deepEqual(czState, ['/cs/e-mobilita-cs/skoda-epiq-si-vas-ziska-za-par-sekund', null, 'CZ – Čeština']);
  assert.equal(topbar.querySelector('a[hreflang="sl"]'), null);
  // Subscribe is untouched
  assert.ok(block.querySelector('.nav-topbar p.nav-topbar-utility a.nav-subscribe'));
});

test('header: a page without hreflang links shows only the current language', async () => {
  const block = await renderHeader('/en/emobility/untranslated');
  const list = block.querySelector('.nav-topbar .nav-locales-list');
  assert.deepEqual([...list.children].map((li) => li.textContent), ['EN']);
});

test('header on a /cs/ page marks CZ current; EN links its declared translation', async () => {
  const block = await renderHeader('/cs/e-mobilita-cs/y', [['en', `${DEMO}/en/emobility/y`], ['cs', `${DEMO}/cs/e-mobilita-cs/y`]]);
  const list = block.querySelector('.nav-topbar .nav-locales-list');
  assert.equal(list.querySelector('[aria-current]').textContent, 'CZ');
  assert.equal(list.querySelector('a[hreflang="en"]').getAttribute('href'), '/en/emobility/y');
});

test('header: a Czech hreflang link alone gives CZ; a conflicting custom alternates meta is ignored (#299)', async () => {
  // the reviewer's reproduction: native cs hreflang only → CZ shows; the old meta must not win
  const block = await renderHeader('/en/emobility/x', [['cs', `${DEMO}/cs/e-mobilita-cs/native`]], '<meta name="alternates" content="cs: /cs/from-the-meta, de: /de/from-the-meta">');
  const list = block.querySelector('.nav-topbar .nav-locales-list');
  assert.deepEqual([...list.querySelectorAll('a')].map((a) => [a.getAttribute('hreflang'), a.getAttribute('href')]), [
    ['cs', '/cs/e-mobilita-cs/native'],
  ]);
});

test('header: x-default is not a language; the current language stays plain text', async () => {
  const block = await renderHeader('/en/emobility/x', [['en', `${DEMO}/en/emobility/x`], ['x-default', `${DEMO}/en/emobility/x`], ['de', `${DEMO}/de/x`]]);
  const list = block.querySelector('.nav-topbar .nav-locales-list');
  assert.deepEqual([...list.children].map((li) => [li.textContent, li.firstElementChild.tagName]), [['EN', 'SPAN'], ['DE', 'A']]);
});

test('locally (no EDS host): the page\'s own hreflang host makes its translations this site', () => {
  const doc = new JSDOM(`<html><head>${EPIQ.map(([l, h]) => `<link rel="alternate" hreflang="${l}" href="${h}">`).join('')}</head><body><p>${AUTHORED}</p></body></html>`, { url: 'http://localhost:3000/en/emobility/skoda-epiq-will-win-you-over-in-just-a-few-seconds' }).window.document;
  const p = doc.querySelector('p');
  const ul = buildLocaleList(localeEntries(p, doc.baseURI), 'en', doc, pageHreflangs(doc));
  assert.deepEqual(rows(ul).map((r) => [r[0], r[2]]), [
    ['EN', null],
    ['CZ', '/cs/e-mobilita-cs/skoda-epiq-si-vas-ziska-za-par-sekund'],
    ['DE', '/de/emobilitat-de/skoda-epiq-will-win-you-over-in-just-a-few-seconds'],
    ['SK', '/sk/emobilita-sk/skoda-epiq-si-vas-ziska-za-par-sekund'],
    ['SR', '/sr/emobilnost-sr/skoda-epiq-will-win-you-over-in-just-a-few-seconds'],
  ]);
  // without the self link, another host's translations are not trusted
  const noSelf = new Map([...pageHreflangs(doc)].filter(([c]) => c !== 'en'));
  assert.deepEqual(rows(buildLocaleList(localeEntries(p, doc.baseURI), 'en', doc, noSelf)).map((r) => r[0]), ['EN']);
});
