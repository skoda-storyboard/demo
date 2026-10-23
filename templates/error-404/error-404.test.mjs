/*
 * Branded 404 (SKODA-706): the variant pick and the not-found section layout, on a jsdom
 * section shaped like a decorated /en/fragments/404/<slug> fragment.
 * Run: node --test templates/error-404/error-404.test.mjs
 */
/* global globalThis */
import { test } from 'node:test';
import assert from 'node:assert/strict';
// eslint-disable-next-line import/no-extraneous-dependencies
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><body><main></main></body>', { url: 'https://example.com/en/missing' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;

const {
  default: decorate, decorateNotFound, variantPath, VARIANTS,
} = await import('./error-404.js');

const photo = (src) => `<p><picture><source srcset="${src}?width=2000&format=webply"><img src="${src}?width=750&format=jpg&optimize=medium" alt="" loading="lazy"></picture></p>`;

function section({ label = true, white = false } = {}) {
  const el = document.createElement('div');
  el.className = `section not-found${white ? ' not-found-white' : ''}`;
  el.innerHTML = `<div class="default-content-wrapper">
    ${photo('/en/fragments/404/media_desktop.jpg')}${photo('/en/fragments/404/media_mobile.jpg')}
    ${label ? '<p>404</p>' : ''}
    <h1 id="dead-end">You’ve reached a dead end.</h1>
    <p>You’re going to have to reverse out of here. A rear-view camera might come in handy for that.</p>
    <p>Or return to the <a href="/">homepage</a>.</p>
  </div>`;
  return el;
}

test('one of the two variants is picked at random', () => {
  assert.deepEqual(VARIANTS, ['youve-reached-a-dead-end', 'welcome-to-our-remote-car-park']);
  assert.equal(variantPath(() => 0), '/en/fragments/404/youve-reached-a-dead-end');
  // a page in a locale without its own fragments reads the English ones (SKODA-1001)
  assert.equal(variantPath(() => 0, '/cs/nic-tady-neni'), '/en/fragments/404/youve-reached-a-dead-end');
  assert.equal(variantPath(() => 0.49), '/en/fragments/404/youve-reached-a-dead-end');
  assert.equal(variantPath(() => 0.5), '/en/fragments/404/welcome-to-our-remote-car-park');
  assert.equal(variantPath(() => 0.9999), '/en/fragments/404/welcome-to-our-remote-car-park');
});

test('the two photos become one full-bleed picture, the desktop one from 720px', () => {
  const el = section();
  decorateNotFound(el);
  const wrapper = el.querySelector('.default-content-wrapper');
  const [picture, message] = wrapper.children;
  assert.ok(picture.matches('picture.not-found-photo'));
  assert.equal(wrapper.querySelectorAll('picture').length, 1, 'the authored photo paragraphs are gone');
  const sources = [...picture.querySelectorAll('source')];
  assert.deepEqual(sources.map((s) => s.media), ['(width >= 720px)', '(width >= 720px)', '']);
  assert.match(sources[0].srcset, /media_desktop\.jpg\?width=1000&format=webply&optimize=medium 1000w/);
  assert.match(sources[0].srcset, /3000w$/);
  assert.match(sources[1].srcset, /format=jpg/);
  const img = picture.querySelector('img');
  assert.match(img.getAttribute('src'), /media_mobile\.jpg\?width=750&format=jpg&optimize=medium$/);
  assert.equal(img.getAttribute('alt'), '', 'decorative');
  assert.equal(img.getAttribute('loading'), 'eager', 'the LCP image');
  assert.equal(img.getAttribute('fetchpriority'), 'high');
  assert.ok(message.matches('.not-found-message'));
  assert.deepEqual([...message.children].map((c) => c.tagName), ['P', 'H1', 'P', 'P']);
  assert.ok(message.firstElementChild.classList.contains('not-found-label'));
  assert.equal(message.querySelector('a').getAttribute('href'), '/');
});

test('a variant without the label keeps its copy unmarked; decorating twice is a no-op', () => {
  const el = section({ label: false, white: true });
  decorateNotFound(el);
  decorateNotFound(el);
  assert.equal(el.querySelectorAll('.not-found-message').length, 1);
  assert.equal(el.querySelector('.not-found-label'), null);
  assert.equal(el.querySelectorAll('picture').length, 1);
});

test('a single photo serves every width', () => {
  const el = section();
  el.querySelector('.default-content-wrapper > p:nth-child(2)').remove();
  decorateNotFound(el);
  const picture = el.querySelector('picture');
  assert.deepEqual([...picture.querySelectorAll('source')].map((s) => s.media), ['']);
  assert.match(picture.querySelector('img').getAttribute('src'), /media_desktop\.jpg\?width=1000/);
});

test('an authored variant is laid out in place; a failed fragment keeps the fallback', async () => {
  const main = document.querySelector('main');
  main.replaceChildren(section());
  await decorate(main, () => assert.fail('an authored variant loads no fragment'));
  assert.ok(main.querySelector('.not-found-message h1'));

  main.innerHTML = '<div class="section"><div class="default-content-wrapper"><h1>Page not found</h1></div></div>';
  const asked = [];
  await decorate(main, async (path) => { asked.push(path); return null; });
  assert.equal(asked.length, 1);
  assert.match(asked[0], /^\/en\/fragments\/404\//);
  assert.equal(main.querySelector('h1').textContent, 'Page not found', '404.html message stays');
  assert.equal(main.querySelector('.not-found-message'), null);
});

test('a loaded variant replaces the fallback message', async () => {
  const main = document.querySelector('main');
  main.innerHTML = '<div class="section"><div class="default-content-wrapper"><h1>Page not found</h1></div></div>';
  const fragment = document.createElement('main');
  fragment.append(section({ label: false, white: true }));
  await decorate(main, async () => fragment);
  assert.equal(main.querySelectorAll('h1').length, 1, 'one h1');
  assert.equal(main.querySelector('h1').textContent, 'You’ve reached a dead end.');
  assert.ok(main.querySelector(':scope > .section.not-found.not-found-white .not-found-photo'));
});
