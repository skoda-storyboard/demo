/*
 * Language switcher tests (SKODA-303): the pure helper (current locale, authored entries, the
 * list markup) and the header wiring on jsdom (topbar list + drawer copy from the nav fragment).
 * Run: node --test blocks/header/header-locales.test.mjs
 */
/* global globalThis */
/* eslint-disable import/no-extraneous-dependencies */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import {
  LOCALES, currentLocale, localeOf, localeEntries, isLocaleGroup, buildLocaleList, siblingHref, localizedPath,
} from './header-locales.js';

const BASE = 'https://main--demo--skoda-storyboard.aem.page/en/emobility/x';
// the nav as authored for EDS: locale URLs without a trailing slash (the EN home is /en)
const AUTHORED = '<strong>EN</strong> <a href="/cs">CZ</a> <a href="/de">DE</a> <a href="/sk">SK</a> <a href="/sr">SR</a> <a href="/sl">SL</a>';
// the Media Room nav: /{locale}/media-room, DE on the external skoda-media.de (as the source)
const AUTHORED_MR = '<strong>EN</strong> <a href="/cs/media-room">CZ</a> <a href="https://www.skoda-media.de/">DE</a> <a href="/sk/media-room">SK</a> <a href="/sr/media-room">SR</a> <a href="/sl/media-room">SL</a>';
const para = (html) => {
  const { document } = new JSDOM(`<p>${html}</p>`).window;
  return document.querySelector('p');
};

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

test('buildLocaleList on an EN page: current span, links with hreflang / lang / endonym', () => {
  const p = para(AUTHORED);
  const ul = buildLocaleList(localeEntries(p, BASE), 'en', p.ownerDocument);
  assert.equal(ul.tagName, 'UL');
  assert.equal(ul.className, 'nav-locales-list');
  assert.equal(ul.getAttribute('aria-label'), 'Language');
  const items = [...ul.children].map((li) => li.firstElementChild);
  assert.deepEqual(items.map((el) => el.textContent), ['EN', 'CZ', 'DE', 'SK', 'SR', 'SL']);
  const [en, ...links] = items;
  assert.deepEqual([en.tagName, en.getAttribute('aria-current'), en.getAttribute('lang'), en.hasAttribute('href')], ['SPAN', 'true', 'en', false]);
  assert.deepEqual(links.map((a) => [a.tagName, a.getAttribute('href'), a.getAttribute('hreflang'), a.getAttribute('lang'), a.getAttribute('aria-label')]), [
    ['A', '/cs', 'cs', 'cs', 'Čeština'],
    ['A', '/de', 'de', 'de', 'Deutsch'],
    ['A', '/sk', 'sk', 'sk', 'Slovenčina'],
    ['A', '/sr', 'sr', 'sr', 'Srpski'],
    ['A', '/sl', 'sl', 'sl', 'Slovenščina'],
  ]);
});

test('buildLocaleList on a CZ page: CZ is current in place, the authored-bold EN links /en', () => {
  const p = para(AUTHORED);
  const ul = buildLocaleList(localeEntries(p, BASE), 'cs', p.ownerDocument);
  const items = [...ul.children].map((li) => li.firstElementChild);
  assert.deepEqual(items.map((el) => el.textContent), ['EN', 'CZ', 'DE', 'SK', 'SR', 'SL'], 'source order kept');
  assert.equal(items[1].tagName, 'SPAN');
  assert.equal(items[1].getAttribute('aria-current'), 'true');
  assert.deepEqual([items[0].tagName, items[0].getAttribute('href'), items[0].getAttribute('aria-label')], ['A', '/en', 'English']);
  assert.equal(ul.querySelectorAll('[aria-current]').length, 1);
});

test('siblingHref: the unlinked locale takes its siblings\' URL pattern', () => {
  const e = (html) => localeEntries(para(html), BASE);
  assert.equal(siblingHref('en', e(AUTHORED)), '/en');
  assert.equal(siblingHref('en', e(AUTHORED_MR)), '/en/media-room', 'external DE is skipped as the pattern');
  assert.equal(siblingHref('en', e('<strong>EN</strong> <a href="/cs/">CZ</a>')), '/en/', 'the authored form is kept');
  assert.equal(siblingHref('cs', e('<a href="/en/media-room?x=1">EN</a> <strong>CZ</strong>')), '/cs/media-room?x=1');
  assert.equal(siblingHref('en', e('<strong>EN</strong> <a href="https://www.skoda-media.de/">DE</a>')), '/en', 'no site path: the locale home');
  assert.equal(siblingHref('en', []), '/en');
});

test('Media Room nav: /{locale}/media-room links, DE external in a new tab, EN on a CZ page', () => {
  const p = para(AUTHORED_MR);
  const ul = buildLocaleList(localeEntries(p, BASE), 'en', p.ownerDocument);
  const links = [...ul.querySelectorAll('a')];
  assert.deepEqual(links.map((a) => a.getAttribute('href')), ['/cs/media-room', 'https://www.skoda-media.de/', '/sk/media-room', '/sr/media-room', '/sl/media-room']);
  const de = links[1];
  assert.deepEqual([de.getAttribute('target'), de.getAttribute('rel'), de.getAttribute('aria-label'), de.textContent],
    ['_blank', 'noopener', 'Deutsch (opens in a new tab)', 'DE']);
  assert.ok(links.filter((a) => a !== de).every((a) => !a.hasAttribute('target')), 'site links stay in the tab');
  const cz = buildLocaleList(localeEntries(p, BASE), 'cs', p.ownerDocument);
  assert.equal(cz.querySelector('a[hreflang="en"]').getAttribute('href'), '/en/media-room');
});

test('localizedPath: only the locale segment changes; null outside a locale tree', () => {
  assert.equal(localizedPath('/en/emobility/skoda-epiq-x', 'cs'), '/cs/emobility/skoda-epiq-x');
  assert.equal(localizedPath('/en/press-releases/936-km', 'sk'), '/sk/press-releases/936-km');
  assert.equal(localizedPath('/en/media-room', 'de'), '/de/media-room');
  assert.equal(localizedPath('/en', 'sl'), '/sl');
  assert.equal(localizedPath('/cs/e-mobilita-cs/y/', 'en'), '/en/e-mobilita-cs/y/', 'a trailing slash is kept as is');
  assert.equal(localizedPath('/CS/x', 'en'), '/en/x');
  assert.equal(localizedPath('/', 'cs'), null);
  assert.equal(localizedPath('/drafts/skoda-303', 'cs'), null);
  assert.equal(localizedPath('/english/x', 'cs'), null, 'a segment that merely starts with a code');
  assert.equal(localizedPath('', 'cs'), null);
});

test('buildLocaleList with the page path: every locale links this page in that locale', () => {
  const p = para(AUTHORED);
  const ul = buildLocaleList(localeEntries(p, BASE), 'en', p.ownerDocument, '/en/emobility/skoda-epiq-x');
  assert.deepEqual([...ul.querySelectorAll('a')].map((a) => a.getAttribute('href')),
    ['/cs/emobility/skoda-epiq-x', '/de/emobility/skoda-epiq-x', '/sk/emobility/skoda-epiq-x', '/sr/emobility/skoda-epiq-x', '/sl/emobility/skoda-epiq-x']);
  // from a CZ page, the (authored-bold) EN keeps the path too
  const cz = buildLocaleList(localeEntries(p, BASE), 'cs', p.ownerDocument, '/cs/emobility/skoda-epiq-x');
  assert.equal(cz.querySelector('a[hreflang="en"]').getAttribute('href'), '/en/emobility/skoda-epiq-x');
  // outside a locale tree the authored targets stay
  const root = buildLocaleList(localeEntries(p, BASE), 'en', p.ownerDocument, '/');
  assert.equal(root.querySelector('a[hreflang="cs"]').getAttribute('href'), '/cs');
});

test('buildLocaleList with the page path: an authored external link still wins (Media Room DE)', () => {
  const p = para(AUTHORED_MR);
  const ul = buildLocaleList(localeEntries(p, BASE), 'en', p.ownerDocument, '/en/press-releases/936-km');
  const hrefs = [...ul.querySelectorAll('a')].map((a) => [a.textContent, a.getAttribute('href'), a.getAttribute('target')]);
  assert.deepEqual(hrefs, [
    ['CZ', '/cs/press-releases/936-km', null],
    ['DE', 'https://www.skoda-media.de/', '_blank'],
    ['SK', '/sk/press-releases/936-km', null],
    ['SR', '/sr/press-releases/936-km', null],
    ['SL', '/sl/press-releases/936-km', null],
  ]);
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

async function renderHeader(path) {
  window.history.replaceState({}, '', path);
  const block = document.querySelector('.header');
  await decorateHeader(block);
  return block;
}

test('header: the topbar group becomes a <div> list and the drawer gets an identical copy', async () => {
  const block = await renderHeader('/en/emobility/x');
  const topbar = block.querySelector('.nav-topbar .nav-topbar-locales');
  assert.ok(topbar, 'topbar locale group');
  assert.equal(topbar.tagName, 'DIV');
  assert.ok(topbar.classList.contains('nav-topbar-utility'));
  assert.equal(topbar.querySelector('p, strong'), null, 'no authored markup left');
  const drawer = block.querySelector('nav .nav-locales .nav-locales-list');
  assert.ok(drawer, 'drawer copy');
  assert.equal(drawer.outerHTML, topbar.querySelector('.nav-locales-list').outerHTML);
  assert.equal(topbar.querySelector('[aria-current]').textContent, 'EN');
  const czechLink = topbar.querySelector('a[hreflang="cs"]');
  assert.equal(czechLink.getAttribute('href'), 'https://www.skoda-storyboard.com/cs');
  assert.equal(czechLink.target, '_blank');
  assert.match(czechLink.rel, /noopener/);
  // Subscribe is untouched
  assert.ok(block.querySelector('.nav-topbar p.nav-topbar-utility a.nav-subscribe'));
});

test('header on a /cs/ page marks CZ current (the authored bold EN turns into a link)', async () => {
  const block = await renderHeader('/cs/e-mobilita-cs/y');
  const list = block.querySelector('.nav-topbar .nav-locales-list');
  assert.equal(list.querySelector('[aria-current]').textContent, 'CZ');
  assert.equal(list.querySelector('a[hreflang="en"]').getAttribute('href'), '/en/e-mobilita-cs/y', 'the path is kept');
});
