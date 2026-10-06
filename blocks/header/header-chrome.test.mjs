/*
 * Header chrome parity (SKODA-308): the real header decorate() on jsdom, desktop band, with the
 * nav fragment and its newsletter companion fragment. Pins the search bar (scope select, open /
 * close button, Escape), the results URL, the desktop dropdown keys (Space without scrolling,
 * Escape dismissing a focus-shown panel) and the newsletter panel (triggers become disclosure
 * buttons, Escape / ✕ close with focus return). Geometry is measured in the browser against the
 * source.
 * Run: node --test blocks/header/header-chrome.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

/* eslint-disable import/no-extraneous-dependencies, no-undef */

// the nav's companion fragment, /nav-newsletter
const NEWSLETTER = `<div><div class="newsletter-stub topbar">
  <div><div>label</div><div>Subscribe to our stories:</div></div>
  <div><div>button</div><div>Subscribe</div></div>
</div></div>`;

const NAV = `
<div><ul><li><a href="/en">Stories</a></li><li><a href="/en/media-room">Media Room</a></li></ul>
  <p><a href="#subscribe">Subscribe to our stories</a></p></div>
<div><p><a href="/en">Škoda Storyboard</a></p></div>
<div><ul>
  <li><p><a href="/en/category/models">Models</a></p><ul><li><a href="/en/tag/model/fabia">Fabia</a></li></ul></li>
  <li><p><a href="/en/category/emobility">eMobility</a></p></li>
</ul></div>
<div><p><a href="/en/search">Search</a></p></div>`;

const dom = new JSDOM('<!DOCTYPE html><html><head></head><body><header><div class="header block"></div></header><main><div><p>page</p></div></main><footer></footer></body></html>', { url: 'https://main--demo--skoda-storyboard.aem.live/en' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Event = dom.window.Event;
globalThis.CustomEvent = dom.window.CustomEvent;
window.hlx = { codeBasePath: '' };
// the desktop band throughout
window.matchMedia = (query) => ({
  matches: query.includes('1080'),
  addEventListener() {},
  removeEventListener() {},
});
const FRAGMENTS = { '/nav.plain.html': NAV, '/nav-newsletter.plain.html': NEWSLETTER };
const requested = [];
globalThis.fetch = async (url) => {
  requested.push(String(url));
  const body = FRAGMENTS[String(url)];
  return body ? { ok: true, status: 200, text: async () => body } : { ok: false, status: 404, text: async () => '' };
};
window.Element.prototype.getClientRects = function rects() { return [{}]; };
// jsdom loads no stylesheets: settle aem.js loadCSS (the fragment's newsletter block loads
// one) so the block loader doesn't wait forever; its JS import fails and is logged
const headAppend = document.head.append.bind(document.head);
document.head.append = (...nodes) => {
  headAppend(...nodes);
  nodes.filter((n) => n.tagName === 'LINK').forEach((link) => setTimeout(() => link.onload?.(), 0));
};

const header = await import('./header.js');
const block = document.querySelector('.header');
await header.default(block);
// importing header.js loads scripts.js, whose page loader decorates the same header block
// again: let it settle, then use the one live nav
await new Promise((resolve) => { setTimeout(resolve, 300); });
assert.equal(document.querySelectorAll('#nav').length, 1);

const nav = document.getElementById('nav');
const key = (target, k, opts = {}) => {
  const e = new window.KeyboardEvent('keydown', {
    key: k, code: k === ' ' ? 'Space' : k, bubbles: true, cancelable: true, ...opts,
  });
  target.dispatchEvent(e);
  return e;
};

// ---- search ---------------------------------------------------------------------------------

test('search: a labelled button controlling a search bar with the scope select and the field', () => {
  const toggle = nav.querySelector('.nav-search-toggle');
  const bar = document.getElementById(toggle.getAttribute('aria-controls'));
  assert.ok(bar?.classList.contains('nav-search-bar'));
  assert.equal(bar.getAttribute('role'), 'search');
  assert.equal(toggle.getAttribute('aria-label'), 'Search');
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  const scope = bar.querySelector('select.nav-search-type');
  assert.equal(scope.getAttribute('aria-label'), 'Search in');
  assert.deepEqual([...scope.options].map((o) => o.textContent), ['All', 'Stories', 'News', 'Press Kits', 'Images', 'Videos']);
  assert.equal(scope.value, 'post', 'Storyboard pages search Stories by default (source)');
  assert.ok(bar.querySelector('.nav-search-field .nav-search-icon'));
  assert.equal(bar.querySelector('input[type=search]').tabIndex, -1, 'closed: out of the tab order');
  assert.equal(scope.tabIndex, -1);
});

test('search: the button opens the bar (focus in the field) and, open, closes it', () => {
  const toggle = nav.querySelector('.nav-search-toggle');
  const search = nav.querySelector('.nav-search');
  const input = search.querySelector('input');
  const scope = search.querySelector('select');
  toggle.click();
  assert.ok(search.classList.contains('nav-search-open'));
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  assert.equal(toggle.getAttribute('aria-label'), 'Close search');
  assert.equal(document.activeElement, input);
  assert.equal(input.tabIndex, 0);
  assert.equal(scope.tabIndex, 0, 'the scope is reachable while open');
  input.value = 'peaq';
  toggle.click(); // the ✕: closes, it doesn't submit
  assert.equal(search.classList.contains('nav-search-open'), false);
  assert.equal(toggle.getAttribute('aria-label'), 'Search');
  assert.equal(scope.tabIndex, -1);
  assert.equal(document.activeElement, toggle, 'focus is not left in the hidden field');
});

test('search: pressing the button keeps focus where it is (Safari / Firefox focusout race)', () => {
  const toggle = nav.querySelector('.nav-search-toggle');
  const down = new window.MouseEvent('mousedown', { bubbles: true, cancelable: true });
  toggle.dispatchEvent(down);
  assert.equal(down.defaultPrevented, true);
});

test('search: Escape anywhere in the bar closes it and returns focus to the button', () => {
  const toggle = nav.querySelector('.nav-search-toggle');
  const search = nav.querySelector('.nav-search');
  toggle.click();
  key(search.querySelector('select'), 'Escape');
  assert.equal(search.classList.contains('nav-search-open'), false);
  assert.equal(document.activeElement, toggle);
});

test('search: the results URL carries the query and the scope (not for All)', () => {
  const origin = 'https://main--demo--skoda-storyboard.aem.page';
  assert.equal(header.searchUrl('/en/search', 'peaq', 'post', origin), `${origin}/en/search?filter%5Bsearch%5D=peaq&search_type=post`);
  assert.equal(header.searchUrl('/en/search', 'a & b', '', origin), `${origin}/en/search?filter%5Bsearch%5D=a+%26+b`);
  assert.equal(header.buildSearchScope('').select.value, '', 'the Media Room default: All');
  assert.equal(header.buildSearchScope('video').select.value, 'video');
  assert.equal(header.buildSearchScope('unknown').select.value, '', 'an unknown default falls back to the first');
});

// ---- desktop dropdown keys -----------------------------------------------------------------

test('desktop dropdown: Space toggles what is on screen, without scrolling; Enter follows the link', () => {
  const models = nav.querySelector('.nav-drop');
  const trigger = models.querySelector(':scope > p > a');
  trigger.focus(); // :focus-within shows the panel
  const space = key(trigger, ' ');
  assert.equal(space.defaultPrevented, true, 'Space does not scroll');
  assert.equal(models.getAttribute('aria-expanded'), 'false');
  assert.equal(models.dataset.dismissed, 'true', 'the first Space hides the panel focus was showing');
  key(trigger, ' ');
  assert.equal(models.getAttribute('aria-expanded'), 'true', 'and the next shows it again');
  assert.equal(models.dataset.dismissed, undefined);
  const enter = key(trigger, 'Enter');
  assert.equal(enter.defaultPrevented, false, 'Enter still follows the category link');
});

test('desktop dropdown: focus moving on closes an open dropdown (one at a time)', () => {
  const models = nav.querySelector('.nav-drop');
  models.querySelector(':scope > p > a').focus();
  models.setAttribute('aria-expanded', 'true');
  const next = nav.querySelector('.nav-sections .default-content-wrapper > ul > li:not(.nav-drop) a');
  models.dispatchEvent(new window.FocusEvent('focusout', { bubbles: true, relatedTarget: next }));
  assert.equal(models.getAttribute('aria-expanded'), 'false');
});

test('desktop dropdown: Escape hides a panel shown by focus; it returns once focus leaves', () => {
  const models = nav.querySelector('.nav-drop');
  delete models.dataset.dismissed;
  const sub = models.querySelector('ul a');
  sub.focus();
  key(sub, 'Escape');
  assert.equal(models.dataset.dismissed, 'true');
  assert.equal(models.getAttribute('aria-expanded'), 'false');
  assert.equal(document.activeElement, sub, 'focus stays where it was');
  const outside = nav.querySelector('.nav-brand a');
  models.dispatchEvent(new window.FocusEvent('focusout', { bubbles: true, relatedTarget: outside }));
  assert.equal(models.dataset.dismissed, undefined);
});

test('desktop dropdown: the panel rule honours the dismissal (CSS guard, jsdom has no cascade)', async () => {
  const { readFile } = await import('node:fs/promises');
  const css = await readFile(new URL('./header.css', import.meta.url), 'utf8');
  assert.match(css, /li:focus-within:not\(\[data-dismissed\]\) > ul/);
  assert.match(css, /li:hover:not\(\[data-dismissed\]\) > ul/, 'a hover-shown panel is dismissible (WCAG 1.4.13)');
  assert.doesNotMatch(css, /li:(focus-within|hover) > ul/);
});

// ---- newsletter panel ----------------------------------------------------------------------

test('newsletter: the panel holds the block of the nav companion fragment (/nav-newsletter)', () => {
  assert.ok(requested.includes('/nav-newsletter.plain.html'));
  assert.equal(nav.querySelector('.newsletter-stub'), null, 'nothing added to the nav rows');
  const panel = document.getElementById('nav-newsletter');
  assert.ok(panel.closest('.nav-wrapper'));
  assert.equal(panel.hidden, true);
  assert.ok(panel.querySelector(':scope > .newsletter-stub.topbar'));
  assert.equal(panel.querySelector('.nav-newsletter-close').getAttribute('aria-label'), 'Close newsletter subscription');
  const cta = document.querySelector('.nav-topbar .nav-subscribe').closest('.nav-topbar-utility');
  assert.equal(cta.nextElementSibling, panel, 'right after the CTA: Tab moves from it into the panel');
});

test('newsletter: Subscribe and the mail shortcut become the panel disclosure buttons', () => {
  const subscribe = document.querySelector('.nav-topbar .nav-subscribe');
  const mail = nav.querySelector('.nav-mail');
  [subscribe, mail].forEach((b) => {
    assert.equal(b.tagName, 'BUTTON');
    assert.equal(b.getAttribute('type'), 'button');
    assert.equal(b.getAttribute('aria-controls'), 'nav-newsletter');
    assert.equal(b.getAttribute('aria-expanded'), 'false');
  });
  assert.equal(subscribe.textContent.trim(), 'Subscribe to our stories');
  assert.ok(subscribe.querySelector('.icon-mail'), 'the mail icon is kept');
  assert.equal(mail.getAttribute('aria-label'), 'Subscribe to our stories');
});

test('newsletter: a trigger toggles the panel; Escape and ✕ close it, focus returns', () => {
  const panel = document.getElementById('nav-newsletter');
  const subscribe = document.querySelector('.nav-topbar .nav-subscribe');
  const mail = nav.querySelector('.nav-mail');
  subscribe.focus();
  subscribe.click();
  assert.equal(panel.hidden, false);
  assert.equal(subscribe.getAttribute('aria-expanded'), 'true');
  assert.equal(mail.getAttribute('aria-expanded'), 'true', 'both triggers report the state');
  const close = panel.querySelector('.nav-newsletter-close');
  close.focus();
  key(close, 'Escape');
  assert.equal(panel.hidden, true);
  assert.equal(document.activeElement, subscribe);
  mail.click();
  assert.equal(panel.hidden, false);
  close.focus();
  close.click();
  assert.equal(panel.hidden, true);
  assert.equal(document.activeElement, mail, 'back to the trigger that opened it');
  subscribe.click();
  subscribe.click();
  assert.equal(panel.hidden, true, 'a second press closes it');
});

test('newsletter: it closes on Escape at a trigger, focus moving on, a click outside, the drawer', () => {
  const panel = document.getElementById('nav-newsletter');
  const subscribe = document.querySelector('.nav-topbar .nav-subscribe');
  const reopen = () => { subscribe.click(); assert.equal(panel.hidden, false); };

  reopen();
  subscribe.focus();
  key(subscribe, 'Escape');
  assert.equal(panel.hidden, true, 'Escape on the trigger');

  reopen();
  const elsewhere = nav.querySelector('.nav-brand a');
  panel.dispatchEvent(new window.FocusEvent('focusout', { bubbles: true, relatedTarget: elsewhere }));
  assert.equal(panel.hidden, true, 'focus moved to another control');

  reopen();
  panel.dispatchEvent(new window.FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
  assert.equal(panel.hidden, false, 'a click on its own text moves focus nowhere: stays open');
  panel.click();
  assert.equal(panel.hidden, false, 'a click inside keeps it');
  document.querySelector('main p').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  assert.equal(panel.hidden, true, 'a click outside closes it');

  reopen();
  nav.querySelector('.nav-hamburger button').click();
  assert.equal(panel.hidden, true, 'opening the drawer closes it');
});

test('newsletter helpers: a missing fragment or block → no panel; opening focuses the field', () => {
  assert.equal(header.takeNewsletterPanel(null), null, 'a 404 fragment');
  const plain = document.createElement('main');
  plain.innerHTML = '<div class="section"><p>no block</p></div>';
  assert.equal(header.takeNewsletterPanel(plain), null);

  const fragment = document.createElement('main');
  fragment.innerHTML = '<div class="section"><div class="newsletter-stub topbar"><form><input type="email"></form></div></div>';
  const panel = header.takeNewsletterPanel(fragment);
  assert.equal(fragment.querySelector('.newsletter-stub'), null, 'the block moves into the panel');
  assert.ok(panel.querySelector('.newsletter-stub'));
  document.body.append(panel);
  const link = document.createElement('a');
  link.href = '#subscribe';
  link.className = 'nav-subscribe';
  link.textContent = 'Subscribe';
  document.body.append(link);
  const button = header.toPanelButton(link, panel);
  assert.equal(link.isConnected, false);
  assert.equal(button.className, 'nav-subscribe');
  header.wireNewsletterPanel(panel, [button]);
  button.click();
  assert.equal(document.activeElement, panel.querySelector('input[type=email]'));
  panel.remove();
  button.remove();
});
