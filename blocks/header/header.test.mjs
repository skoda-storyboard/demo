/*
 * Header tests: section switcher tab choice (SKODA-301/309, pure helper) and the missing-fragment
 * null guard of the header and footer blocks (SKODA-307), which run the real decorate() on jsdom
 * with a fetch that answers 404.
 * Run: node --test blocks/header/header.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { hrefPath, pickActiveTab } from './header-switcher.js';

/* eslint-disable import/no-extraneous-dependencies, no-undef */

const BASE = 'https://main--demo--skoda-storyboard.aem.live/en/press-releases/x';
const TABS = ['/en', '/en/media-room'];

test('Stories pages keep the longest href match', () => {
  assert.equal(pickActiveTab(TABS, '/en/lifestyle/some-story'), 0);
  assert.equal(pickActiveTab(TABS, '/en'), 0);
  assert.equal(pickActiveTab(TABS, '/en/media-room'), 1);
  assert.equal(pickActiveTab(TABS, '/en/media-room/sub'), 1);
});

test('Media Room pages outside /en/media-room activate the tab named by `section`', () => {
  ['/en/press-releases/x', '/en/skoda-model/peaq', '/en/images', '/en/press-kits/y'].forEach((p) => {
    assert.equal(pickActiveTab(TABS, p), 0, `${p} without section`);
    assert.equal(pickActiveTab(TABS, p, 'media-room'), 1, `${p} with section`);
  });
  assert.equal(pickActiveTab(['/en/', '/en/media-room/'], '/en/news', ' Media-Room '), 1);
});

test('an unknown section, no match or missing hrefs fall back safely', () => {
  assert.equal(pickActiveTab(TABS, '/en/press-releases/x', 'podcasts'), 0);
  assert.equal(pickActiveTab(TABS, '/cs/tiskove-zpravy'), 0);
  assert.equal(pickActiveTab([null, '/en/media-room'], '/en/media-room/a'), 1);
  assert.equal(pickActiveTab([null, null], '/en', 'media-room'), 0);
  assert.equal(pickActiveTab([], '/en', 'media-room'), -1);
  // segment boundaries: /en/media doesn't claim /en/media-room
  assert.equal(pickActiveTab(['/en/media', '/en/media-room'], '/en/media-room/x'), 1);
});

test('hrefPath resolves relative, absolute and invalid hrefs', () => {
  assert.equal(hrefPath('/en/media-room', BASE), '/en/media-room');
  assert.equal(hrefPath('https://www.skoda-storyboard.com/en/media-room/', BASE), '/en/media-room/');
  assert.equal(hrefPath('', BASE), null);
  assert.equal(hrefPath(null, BASE), null);
  assert.equal(hrefPath('http://[::1', BASE), null);
});

// ---- missing-fragment null guard (SKODA-307) ------------------------------------------------

const dom = new JSDOM('<!DOCTYPE html><html><head><meta name="nav" content="/media-room/nav"><meta name="footer" content="/media-room/footer"></head><body><header><div class="header block"></div></header><main><div><p>page</p></div></main><footer><div class="footer block"></div></footer></body></html>', { url: BASE });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Event = dom.window.Event;
globalThis.CustomEvent = dom.window.CustomEvent;
window.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} });
window.hlx = { codeBasePath: '' };
const requested = [];
globalThis.fetch = async (url) => { requested.push(String(url)); return { ok: false, status: 404 }; };

const warnings = [];
const { warn } = console;
console.warn = (...args) => warnings.push(args.join(' '));
const { default: decorateHeader } = await import('./header.js');
const { default: decorateFooter } = await import('../footer/footer.js');

test('a text-only dropdown parent gets a focusable trigger link that never navigates', async () => {
  const { linkDropLabel } = await import('./header.js');
  const li = document.createElement('li');
  li.innerHTML = '<p>Models</p><ul><li><a href="/en/skoda-model/peaq">Peaq</a></li></ul>';
  linkDropLabel(li);
  const trigger = li.querySelector(':scope > p > a');
  assert.equal(trigger.textContent, 'Models');
  assert.equal(trigger.getAttribute('href'), '#');
  assert.equal(trigger.getAttribute('role'), 'button');
  const click = new window.MouseEvent('click', { bubbles: true, cancelable: true });
  trigger.dispatchEvent(click);
  assert.equal(click.defaultPrevented, true);
  // an authored parent link is left alone
  const linked = document.createElement('li');
  linked.innerHTML = '<p><a href="/en/category/models">Models</a></p><ul><li>x</li></ul>';
  linkDropLabel(linked);
  assert.equal(linked.querySelector('a').getAttribute('href'), '/en/category/models');
});

test('a 404 nav fragment leaves an empty header without throwing', async () => {
  const block = document.querySelector('.header');
  block.innerHTML = '<p>stale</p>';
  await decorateHeader(block);
  assert.equal(block.children.length, 0);
  assert.ok(requested.includes('/media-room/nav.plain.html'));
  assert.ok(warnings.some((w) => w.includes('/media-room/nav')));
});

test('a 404 footer fragment leaves an empty footer without throwing', async () => {
  const block = document.querySelector('.footer');
  await decorateFooter(block);
  assert.equal(block.children.length, 0);
  assert.ok(requested.includes('/media-room/footer.plain.html'));
  assert.ok(warnings.some((w) => w.includes('/media-room/footer')));
  console.warn = warn;
});
