/*
 * Mobile nav drawer (SKODA-302): the real header decorate() on jsdom with a nav fragment, in
 * the drawer band (< 1080). Pins the accessible toggle (aria-expanded on the hamburger), the
 * accordion buttons (role / aria-expanded / aria-controls, Enter + Space), Escape and
 * tap-outside close with focus return, the focus trap, and the return to the desktop links
 * when the viewport crosses 1080. Geometry is measured in the browser against the source.
 * Run: node --test blocks/header/header-drawer.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

/* eslint-disable import/no-extraneous-dependencies, no-undef */

const NAV = `
<div><ul><li><a href="/en">Stories</a></li><li><a href="/en/media-room">Media Room</a></li></ul>
  <p><a href="#subscribe">Subscribe to our stories</a></p></div>
<div><p><a href="/en">Škoda Storyboard</a></p></div>
<div><ul>
  <li><p><a href="/en/category/models">Models</a></p><ul><li><a href="/en/category/models">Models</a></li><li><a href="/en/tag/model/fabia">Fabia</a></li></ul></li>
  <li><p><a href="/en/category/emobility">eMobility</a></p></li>
  <li><p>Company</p><ul><li><a href="/en/contacts">Contacts</a></li></ul></li>
</ul></div>
<div><p><a href="#search">Search</a></p></div>`;

const dom = new JSDOM('<!DOCTYPE html><html><head></head><body><header><div class="header block"></div></header><main><div><p>page</p></div></main><footer></footer></body></html>', { url: 'https://main--demo--skoda-storyboard.aem.live/en' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Event = dom.window.Event;
globalThis.CustomEvent = dom.window.CustomEvent;
window.hlx = { codeBasePath: '' };

// a switchable viewport: the drawer band first, then >= 1080 for the desktop checks
const viewport = { desktop: false, listeners: [] };
window.matchMedia = (query) => ({
  get matches() { return query.includes('1080') ? viewport.desktop : false; },
  addEventListener(_, fn) { if (query.includes('1080')) viewport.listeners.push(fn); },
  removeEventListener() {},
});
globalThis.fetch = async (url) => (String(url) === '/nav.plain.html'
  ? { ok: true, status: 200, text: async () => NAV }
  : { ok: false, status: 404, text: async () => '' });
// jsdom has no layout: every element counts as rendered for the focus trap
window.Element.prototype.getClientRects = function rects() { return [{}]; };

const { default: decorateHeader } = await import('./header.js');
const block = document.querySelector('.header');
await decorateHeader(block);
// importing header.js loads scripts.js, whose page loader decorates the same header block
// again: let it settle, then use the one live nav
await new Promise((resolve) => { setTimeout(resolve, 300); });
assert.equal(document.querySelectorAll('#nav').length, 1);

const nav = document.getElementById('nav');
const hamburger = () => nav.querySelector('.nav-hamburger button');
const drops = () => [...nav.querySelectorAll('.nav-drop')];
const trigger = (li) => li.querySelector(':scope > p > a, :scope > a');
const key = (target, k, opts = {}) => {
  const e = new window.KeyboardEvent('keydown', {
    key: k, code: k === 'Escape' ? 'Escape' : k, bubbles: true, cancelable: true, ...opts,
  });
  target.dispatchEvent(e);
  return e;
};
const open = () => { if (nav.getAttribute('aria-expanded') !== 'true') hamburger().click(); };
const close = () => { if (nav.getAttribute('aria-expanded') === 'true') hamburger().click(); };

test('the hamburger is a labelled button that reports the drawer state', () => {
  close();
  const btn = hamburger();
  assert.equal(btn.tagName, 'BUTTON');
  assert.equal(btn.getAttribute('aria-controls'), 'nav');
  assert.equal(btn.getAttribute('aria-expanded'), 'false');
  assert.equal(btn.getAttribute('aria-label'), 'Open navigation');
  btn.click();
  assert.equal(btn.getAttribute('aria-expanded'), 'true');
  assert.equal(btn.getAttribute('aria-label'), 'Close navigation');
  assert.equal(nav.getAttribute('aria-expanded'), 'true');
  assert.equal(document.body.style.overflowY, 'hidden', 'body scroll locked');
  btn.click();
  assert.equal(btn.getAttribute('aria-expanded'), 'false');
  assert.equal(document.body.style.overflowY, '');
});

test('accordion parents are buttons controlling their sub-menu; Enter and Space toggle', () => {
  open();
  assert.equal(drops().length, 2);
  drops().forEach((li) => {
    const t = trigger(li);
    assert.equal(t.getAttribute('role'), 'button');
    assert.equal(t.getAttribute('aria-expanded'), 'false');
    const sub = document.getElementById(t.getAttribute('aria-controls'));
    assert.equal(sub, li.querySelector(':scope > ul'), 'aria-controls names its sub-menu');
  });
  const [models] = drops();
  const t = trigger(models);
  const enter = key(t, 'Enter');
  assert.equal(enter.defaultPrevented, true, 'Enter does not follow the category link');
  assert.equal(t.getAttribute('aria-expanded'), 'true');
  assert.equal(models.getAttribute('aria-expanded'), 'true');
  const space = key(t, ' ');
  assert.equal(space.defaultPrevented, true, 'Space does not scroll');
  assert.equal(t.getAttribute('aria-expanded'), 'false');
  // a tap toggles the same state
  t.click();
  assert.equal(t.getAttribute('aria-expanded'), 'true');
  // closing the drawer collapses every sub-menu, trigger state included
  close();
  open();
  assert.equal(t.getAttribute('aria-expanded'), 'false');
  close();
});

test('Escape closes the drawer and returns focus to the hamburger', () => {
  open();
  trigger(drops()[0]).focus();
  key(document.activeElement, 'Escape');
  assert.equal(nav.getAttribute('aria-expanded'), 'false');
  assert.equal(document.activeElement, hamburger());
});

test('Tab and Shift+Tab stay inside the open drawer (switcher tabs included)', () => {
  open();
  const scope = nav.closest('.nav-wrapper');
  const focusables = [...scope.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex]')]
    .filter((el) => el.tabIndex >= 0);
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  assert.equal(first.textContent, 'Stories', 'the section switcher is reachable');
  last.focus();
  const tab = key(last, 'Tab');
  assert.equal(tab.defaultPrevented, true);
  assert.equal(document.activeElement, first, 'Tab from the last control wraps to the first');
  key(first, 'Tab', { shiftKey: true });
  assert.equal(document.activeElement, last, 'Shift+Tab from the first wraps to the last');
  close();
});

test('a tap outside the drawer closes it and focuses the hamburger; a tap inside does not', () => {
  open();
  nav.querySelector('.nav-brand a').dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
  assert.equal(nav.getAttribute('aria-expanded'), 'true', 'inside: stays open');
  document.querySelector('main p').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  assert.equal(nav.getAttribute('aria-expanded'), 'false', 'outside: closes');
  assert.equal(document.activeElement, hamburger());
});

test('from 1080 the triggers are the desktop dropdown links again', () => {
  viewport.desktop = true;
  viewport.listeners.forEach((fn) => fn());
  const [models, company] = drops();
  assert.equal(trigger(models).getAttribute('role'), null, 'a linked parent is a link');
  assert.equal(trigger(models).getAttribute('aria-controls'), null);
  assert.equal(trigger(models).getAttribute('aria-expanded'), null);
  assert.equal(trigger(company).getAttribute('role'), 'button', 'a text-only parent keeps its role');
  assert.equal(models.getAttribute('tabindex'), '0', 'desktop dropdown keyboard access');
  assert.equal(document.body.style.overflowY, '');
  // back to the drawer band: buttons again
  viewport.desktop = false;
  viewport.listeners.forEach((fn) => fn());
  assert.equal(trigger(models).getAttribute('role'), 'button');
  assert.equal(models.getAttribute('tabindex'), null);
});

// --- closed bar on narrow screens (PR #237 review): CSS guards ----------------------------
// jsdom has no layout, so these pin the two rules that keep the closed bar inside 320 / 330px
// viewports with the 68px hamburger: a brand column that may shrink and a logo that fits it.
// Measured in the browser: scrollWidth = viewport at 320 / 330, toggle 252→320 / 262→330.
const { readFile } = await import('node:fs/promises');
const css = await readFile(new URL('./header.css', import.meta.url), 'utf8');
const drawerBand = css.slice(css.indexOf('@media (width < 1080px) {'));

test('narrow screens: the brand column can shrink below the logo width', () => {
  const templates = css.match(/'sections sections' 1fr \/ [^;]+;/g);
  assert.ok(templates?.length >= 2);
  templates.forEach((t) => assert.match(t, /\/ minmax\(0, 1fr\) auto;/, t));
});

test('narrow screens: the drawer-band logo fits its column, up to 194px', () => {
  const rule = drawerBand.match(/header \.nav-brand \.icon-skoda-storyboard-logo \{([^}]+)\}/)?.[1] || '';
  assert.match(rule, /width: min\(194px, 100cqi\)/);
  assert.match(rule, /aspect-ratio: 255\.19 \/ 23\.1/, 'the source wordmark proportions (SKODA-308)');
  assert.match(drawerBand.match(/header \.nav-brand \{([^}]+)\}/)?.[1] || '', /container-type: inline-size/);
  assert.match(css, /width: var\(--nav-hamburger-width\)/, 'the 68px touch target is kept');
});
