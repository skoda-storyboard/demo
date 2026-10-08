/*
 * Language switcher tests (SKODA-303, SKODA-303a): the pure helper (current locale, authored
 * entries, declared translations, the list markup) and the header wiring on jsdom (topbar list
 * + drawer copy from the nav fragment and the page's `alternates` metadata).
 * Run: node --test blocks/header/header-locales.test.mjs
 */
/* global globalThis */
/* eslint-disable import/no-extraneous-dependencies */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import {
  LOCALES, currentLocale, localeOf, localeEntries, isLocaleGroup, buildLocaleList,
  parseAlternates, permittedTranslation,
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
// the Epiq story's source hreflang set (no SL translation), as the importer writes it
const EPIQ = `cs: ${LIVE}/cs/e-mobilita-cs/skoda-epiq-si-vas-ziska-za-par-sekund/, de: ${LIVE}/de/emobilitat-de/skoda-epiq-will-win-you-over-in-just-a-few-seconds/, sk: ${LIVE}/sk/emobilita-sk/skoda-epiq-si-vas-ziska-za-par-sekund/, sr: ${LIVE}/sr/emobilnost-sr/skoda-epiq-will-win-you-over-in-just-a-few-seconds/`;
const MEDIA_ROOM = `cs: ${LIVE}/cs/media-room/, de: ${LIVE}/de/media-room/, sk: ${LIVE}/sk/media-room/, sr: ${LIVE}/sr/media-room/, sl: ${LIVE}/sl/media-room/`;

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
  assert.equal(localeOf('https://www.skoda-storyboard.com/de/media-room/', 'x', BASE), 'de');
  assert.equal(localeOf(null, 'EN', BASE), 'en');
  assert.equal(localeOf(null, ' cz ', BASE), 'cs');
  assert.equal(localeOf(null, 'sk', BASE), 'sk');
  assert.equal(localeOf('#subscribe', 'Subscribe to our stories', BASE), null, 'a fragment link is not the page locale');
  assert.equal(localeOf('sub/page', 'x', BASE), null, 'nor a relative one');
  assert.equal(localeOf('/en/media-room/', 'Media Room', BASE), 'en', 'a link into a locale tree counts');
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

test('parseAlternates: code → URL pairs; region, x-default, unknown, malformed and repeats handled', () => {
  assert.deepEqual([...parseAlternates(EPIQ).keys()], ['cs', 'de', 'sk', 'sr']);
  assert.equal(parseAlternates(EPIQ).get('cs'), `${LIVE}/cs/e-mobilita-cs/skoda-epiq-si-vas-ziska-za-par-sekund/`);
  const messy = parseAlternates(`x-default: ${LIVE}/, de-AT: ${LIVE}/de/a/, fr: ${LIVE}/fr/b/, sk ${LIVE}/sk/c/, cs:, de: ${LIVE}/de/second/, SL : ${LIVE}/sl/d/`);
  assert.deepEqual([...messy], [['de', `${LIVE}/de/a/`], ['sl', `${LIVE}/sl/d/`]]);
  assert.equal(parseAlternates('').size, 0);
  assert.equal(parseAlternates(null).size, 0);
  assert.equal(parseAlternates('garbage, more garbage').size, 0);
});

test('permittedTranslation: in its own locale tree, on this site or the live site; else null', () => {
  assert.equal(permittedTranslation('cs', `${LIVE}/cs/x/`, BASE), `${LIVE}/cs/x/`, 'a permitted legacy URL');
  assert.equal(permittedTranslation('cs', '/cs/x', BASE), 'https://main--demo--skoda-storyboard.aem.page/cs/x', 'a migrated EDS variant');
  assert.equal(permittedTranslation('cs', `${LIVE}/de/x/`, BASE), null, 'another locale\'s tree');
  assert.equal(permittedTranslation('cs', `${LIVE}/`, BASE), null, 'the bare root');
  assert.equal(permittedTranslation('cs', 'https://evil.example/cs/x', BASE), null, 'another host');
  assert.equal(permittedTranslation('cs', '//evil.example/cs/x', BASE), null);
  // eslint-disable-next-line no-script-url
  assert.equal(permittedTranslation('cs', 'javascript:alert(1)', BASE), null);
  assert.equal(permittedTranslation('cs', 'http://[bad', BASE), null, 'an unparsable URL');
});

test('Epiq story: only the declared translations, same tab, named by their language; SL left out', () => {
  const p = para(AUTHORED);
  const ul = buildLocaleList(localeEntries(p, BASE), 'en', p.ownerDocument, parseAlternates(EPIQ));
  assert.equal(ul.className, 'nav-locales-list');
  assert.equal(ul.getAttribute('aria-label'), 'Language');
  assert.equal(ul.dataset.linkPolicy, 'resolved', 'the site link pass leaves it alone');
  assert.deepEqual(rows(ul), [
    ['EN', 'SPAN', null, null, null],
    ['CZ', 'A', `${LIVE}/cs/e-mobilita-cs/skoda-epiq-si-vas-ziska-za-par-sekund/`, null, 'Čeština'],
    ['DE', 'A', `${LIVE}/de/emobilitat-de/skoda-epiq-will-win-you-over-in-just-a-few-seconds/`, null, 'Deutsch'],
    ['SK', 'A', `${LIVE}/sk/emobilita-sk/skoda-epiq-si-vas-ziska-za-par-sekund/`, null, 'Slovenčina'],
    ['SR', 'A', `${LIVE}/sr/emobilnost-sr/skoda-epiq-will-win-you-over-in-just-a-few-seconds/`, null, 'Srpski'],
  ]);
  const en = ul.querySelector('span');
  assert.deepEqual([en.getAttribute('aria-current'), en.getAttribute('lang')], ['true', 'en']);
  const langs = [...ul.querySelectorAll('a')].map((a) => [a.getAttribute('hreflang'), a.getAttribute('lang')]);
  assert.deepEqual(langs, [['cs', 'cs'], ['de', 'de'], ['sk', 'sk'], ['sr', 'sr']]);
});

test('no declared translations: only the current language, never a locale-home fallback', () => {
  const p = para(AUTHORED);
  [new Map(), undefined, parseAlternates(`x-default: ${LIVE}/`)].forEach((alternates) => {
    const ul = buildLocaleList(localeEntries(p, BASE), 'en', p.ownerDocument, alternates);
    assert.deepEqual(rows(ul), [['EN', 'SPAN', null, null, null]]);
  });
});

test('a declared translation that is not permitted is left out (no fallback)', () => {
  const p = para(AUTHORED);
  const alternates = parseAlternates(`cs: https://evil.example/cs/x/, de: ${LIVE}/sk/wrong-tree/, sk: ${LIVE}/sk/ok/`);
  const ul = buildLocaleList(localeEntries(p, BASE), 'en', p.ownerDocument, alternates);
  assert.deepEqual(rows(ul).map((r) => [r[0], r[2]]), [['EN', null], ['SK', `${LIVE}/sk/ok/`]]);
});

test('Media Room: the declared Media Rooms in the tab; DE takes the authored skoda-media.de in a new tab', () => {
  const p = para(AUTHORED_MR);
  const ul = buildLocaleList(localeEntries(p, BASE), 'en', p.ownerDocument, parseAlternates(MEDIA_ROOM));
  assert.deepEqual(rows(ul), [
    ['EN', 'SPAN', null, null, null],
    ['CZ', 'A', `${LIVE}/cs/media-room/`, null, 'Čeština'],
    ['DE', 'A', 'https://www.skoda-media.de/', '_blank', 'Deutsch (opens in a new tab)'],
    ['SK', 'A', `${LIVE}/sk/media-room/`, null, 'Slovenčina'],
    ['SR', 'A', `${LIVE}/sr/media-room/`, null, 'Srpski'],
    ['SL', 'A', `${LIVE}/sl/media-room/`, null, 'Slovenščina'],
  ]);
  assert.equal(ul.querySelector('a[target]').getAttribute('rel'), 'noopener');
});

test('Media Room nav on a press release without a DE translation: no DE (as the source)', () => {
  const p = para(AUTHORED_MR);
  const zellmer = `cs: ${LIVE}/cs/tiskove-zpravy-archiv/klaus-zellmer-odchazi-ze-spolecnosti-skoda-auto/, sk: ${LIVE}/sk/tlacova-sprava/klaus-zellmer-odchadza-zo-spolocnosti-skoda-auto/, sr: ${LIVE}/sr/press_release/skoda-auto-klaus-zellmer-napusta-kompaniju/`;
  const ul = buildLocaleList(localeEntries(p, BASE), 'en', p.ownerDocument, parseAlternates(zellmer));
  assert.deepEqual(rows(ul).map((r) => r[0]), ['EN', 'CZ', 'SK', 'SR']);
  assert.equal(ul.querySelector('a[target]'), null);
});

test('a CZ page: CZ is current in place, EN links its declared translation', () => {
  const p = para(AUTHORED);
  const ul = buildLocaleList(localeEntries(p, BASE), 'cs', p.ownerDocument, parseAlternates(`en: ${LIVE}/en/x/, de: ${LIVE}/de/y/`));
  assert.deepEqual(rows(ul).map((r) => [r[0], r[1], r[2]]), [
    ['EN', 'A', `${LIVE}/en/x/`], ['CZ', 'SPAN', null], ['DE', 'A', `${LIVE}/de/y/`],
  ]);
});

test('a locale the nav row does not list is not shown, even when declared', () => {
  const p = para('<strong>EN</strong> <a href="/cs">CZ</a> <a href="/de">DE</a>');
  const ul = buildLocaleList(localeEntries(p, BASE), 'en', p.ownerDocument, parseAlternates(`cs: ${LIVE}/cs/a/, sl: ${LIVE}/sl/b/`));
  assert.deepEqual(rows(ul).map((r) => r[0]), ['EN', 'CZ']);
});

test('buildLocaleList: nothing to build returns null; every LOCALES code has a label and name', () => {
  assert.equal(buildLocaleList([], 'en', new JSDOM('').window.document), null);
  assert.deepEqual(LOCALES.map((l) => l.code), ['en', 'cs', 'de', 'sk', 'sr', 'sl']);
  assert.ok(LOCALES.every((l) => l.label && l.name));
});

// --- header wiring (real decorate on jsdom, nav fragment served by a fetch stub) -----------
const NAV = `<div><ul><li><a href="/en/">Stories</a></li><li><a href="/en/media-room/">Media Room</a></li></ul>
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
  : { ok: false, status: 404, text: async () => '', json: async () => ({}) });
const { default: decorateHeader } = await import('./header.js');

// the page's `alternates` metadata, as EDS renders it in the head
function setAlternates(value) {
  document.head.querySelector('meta[name="alternates"]')?.remove();
  if (value === null) return;
  const meta = document.createElement('meta');
  meta.name = 'alternates';
  meta.content = value;
  document.head.append(meta);
}

async function renderHeader(path, alternates = null) {
  window.history.replaceState({}, '', path);
  setAlternates(alternates);
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
  assert.deepEqual(czState, [`${LIVE}/cs/e-mobilita-cs/skoda-epiq-si-vas-ziska-za-par-sekund/`, null, 'Čeština']);
  assert.equal(topbar.querySelector('a[hreflang="sl"]'), null);
  // Subscribe is untouched
  assert.ok(block.querySelector('.nav-topbar p.nav-topbar-utility a.nav-subscribe'));
});

test('header: a page without alternates shows only the current language', async () => {
  const block = await renderHeader('/en/emobility/untranslated');
  const list = block.querySelector('.nav-topbar .nav-locales-list');
  assert.deepEqual([...list.children].map((li) => li.textContent), ['EN']);
});

test('header on a /cs/ page marks CZ current; EN links its declared translation', async () => {
  const block = await renderHeader('/cs/e-mobilita-cs/y', `en: ${LIVE}/en/emobility/y/`);
  const list = block.querySelector('.nav-topbar .nav-locales-list');
  assert.equal(list.querySelector('[aria-current]').textContent, 'CZ');
  assert.equal(list.querySelector('a[hreflang="en"]').getAttribute('href'), `${LIVE}/en/emobility/y/`);
});
