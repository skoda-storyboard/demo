/*
 * A topbar Subscribe CTA that links the locale's newsletter page instead of opening the panel
 * (the source's SK "Odber noviniek" → /sk/odber-noviniek/, SKODA-1003 QA on #543): the real
 * header decorate() on jsdom. It keeps the mail icon on the topbar link, and the phone mail
 * shortcut links the same page, as the source's SK mobile icon does; no newsletter panel.
 * Run: node --test blocks/header/header-newsletter-page.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
/* eslint-disable import/no-extraneous-dependencies, no-undef */
import { JSDOM } from 'jsdom';

const PAGE = 'https://www.skoda-storyboard.com/sk/odber-noviniek/';
// the SK topbar: tabs, a prose line (not a CTA: a paragraph that is more than its link), the
// newsletter page link, the language row
const NAV = `
<div><ul><li><a href="/sk">Stories</a></li><li><a href="/sk/media-room">Media Room</a></li></ul>
  <p>Alebo sa vráťte na <a href="/sk">domovskú stránku</a>.</p>
  <p><a href="${PAGE}">Odber noviniek</a></p>
  <p><a href="/en">EN</a> <a href="/cs">CZ</a> <strong>SK</strong></p></div>
<div><p><a href="/sk">Škoda Storyboard</a></p></div>
<div><ul><li><p><a href="/sk/category/modely">Modely</a></p></li></ul></div>
<div><p><a href="/sk/hladat">Hľadať</a></p></div>`;

const dom = new JSDOM('<!DOCTYPE html><html lang="sk"><head><meta name="nav" content="/sk/nav"></head><body><header><div class="header block"></div></header><main><div><p>page</p></div></main><footer></footer></body></html>', { url: 'https://main--demo--skoda-storyboard.aem.live/sk/emobilita-sk/x' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Event = dom.window.Event;
globalThis.CustomEvent = dom.window.CustomEvent;
window.hlx = { codeBasePath: '' };
window.matchMedia = (query) => ({ matches: query.includes('1080'), addEventListener() {}, removeEventListener() {} });
const requested = [];
globalThis.fetch = async (url) => {
  requested.push(String(url));
  return String(url) === '/sk/nav.plain.html'
    ? { ok: true, status: 200, text: async () => NAV }
    : { ok: false, status: 404, text: async () => '' };
};
window.Element.prototype.getClientRects = function rects() { return [{}]; };
const headAppend = document.head.append.bind(document.head);
document.head.append = (...nodes) => {
  headAppend(...nodes);
  nodes.filter((n) => n.tagName === 'LINK').forEach((link) => setTimeout(() => link.onload?.(), 0));
};

const header = await import('./header.js');
await header.default(document.querySelector('.header'));
await new Promise((resolve) => { setTimeout(resolve, 300); });
const nav = document.getElementById('nav');

test('a newsletter page CTA keeps its link and the mail icon, like the panel CTA', () => {
  const cta = document.querySelector('.nav-topbar .nav-subscribe');
  assert.ok(cta, 'the page link is the Subscribe CTA');
  assert.equal(cta.tagName, 'A');
  assert.equal(cta.getAttribute('href'), PAGE);
  assert.equal(cta.textContent.trim(), 'Odber noviniek');
  assert.ok(cta.querySelector('.icon-mail'), 'the mail icon, as on the source');
  const prose = [...document.querySelectorAll('.nav-topbar a')].find((a) => a.textContent === 'domovskú stránku');
  assert.ok(!prose.classList.contains('nav-subscribe'), 'a prose line is not the CTA');
});

test('the phone mail shortcut links the newsletter page; no panel, no panel fragment', () => {
  const mail = nav.querySelector('.nav-mail');
  assert.ok(mail, 'the phone shortcut exists, as the source SK mobile icon does');
  assert.equal(mail.tagName, 'A');
  assert.equal(mail.getAttribute('href'), PAGE);
  assert.ok(mail.getAttribute('aria-label'), 'an accessible name');
  assert.equal(mail.getAttribute('aria-controls'), null, 'not a panel button');
  assert.equal(document.getElementById('nav-newsletter'), null);
  assert.ok(!requested.some((url) => url.includes('nav-newsletter')), 'the panel fragment is not loaded');
});
