/*
 * A section's own nav without a menu (SKODA-843: /sustainability/nav, the Sustainable Offices
 * header): topbar (3 tabs) + brand + search, 3 rows. The real header decorate() on jsdom, in the
 * drawer band (< 1080), as header-drawer.test.mjs: the rows are topbar / brand / tools, and the
 * drawer, which holds only the search, still opens and closes (hamburger, Escape) with focus
 * back on the hamburger.
 * Run: node --test blocks/header/header-no-menu.test.mjs
 */
/* eslint-disable import/no-extraneous-dependencies, no-undef */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const NAV = `
<div><ul><li><a href="/en/">Stories</a></li><li><a href="/en/media-room/">Media Room</a></li>
  <li><a href="/en/sustainable-offices/">Sustainability</a></li></ul>
  <p><strong>EN</strong> <a href="/cs/udrzitelne-kancelare/">CZ</a></p></div>
<div><p><a href="/en/sustainable-offices/" title="Sustainability">Škoda Storyboard</a></p></div>
<div><p><a href="/en/search/" title="Search">Search</a></p></div>`;

const dom = new JSDOM('<!DOCTYPE html><html><head><meta name="nav" content="/sustainability/nav"></head><body><header><div class="header block"></div></header><main><div><p>page</p></div></main><footer></footer></body></html>', { url: 'https://main--demo--skoda-storyboard.aem.live/en/sustainable-offices' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Event = dom.window.Event;
globalThis.CustomEvent = dom.window.CustomEvent;
window.hlx = { codeBasePath: '' };
window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
globalThis.fetch = async (url) => (String(url) === '/sustainability/nav.plain.html'
  ? { ok: true, status: 200, text: async () => NAV }
  : { ok: false, status: 404, text: async () => '' });
window.Element.prototype.getClientRects = function rects() { return [{}]; };

const { default: decorateHeader } = await import('./header.js');
const block = document.querySelector('.header');
await decorateHeader(block);
await new Promise((resolve) => { setTimeout(resolve, 300); });
const nav = document.getElementById('nav');
const hamburger = () => nav.querySelector('.nav-hamburger button');

test('the rows are topbar, brand and tools; there is no menu', () => {
  assert.ok(block.querySelector('.nav-topbar .nav-section-switcher'));
  assert.equal(block.querySelector('.nav-section-switcher li.active').textContent.trim(), 'Sustainability');
  assert.ok(nav.querySelector('.nav-brand .nav-brand-logo'));
  assert.ok(nav.querySelector('.nav-tools'));
  assert.equal(nav.querySelector('.nav-sections'), null);
});

test('the drawer opens from the hamburger and Escape closes it, focus back on the hamburger', () => {
  hamburger().click();
  assert.equal(nav.getAttribute('aria-expanded'), 'true');
  assert.equal(hamburger().getAttribute('aria-expanded'), 'true');
  window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
  assert.equal(nav.getAttribute('aria-expanded'), 'false');
  assert.equal(hamburger().getAttribute('aria-expanded'), 'false');
  assert.equal(document.activeElement, hamburger());
});
