/* global globalThis */
/* eslint-disable import/no-extraneous-dependencies */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import {
  policyHref, LIVE_ORIGIN, decorateLinks, installLinkPolicy,
} from './links.js';

const PAGE = 'https://main--demo--skoda-storyboard.aem.page/en/emobility/some-story';

test('live-host links keep their href and open in a new tab', () => {
  ['https://www.skoda-storyboard.com/en/board-of-management/', '//skoda-storyboard.com/en/skodapedia/', 'http://www.skoda-storyboard.com/en/tag/x/?a=1#b']
    .forEach((href) => assert.deepEqual(policyHref(href, PAGE), { href, newTab: true }));
});

test('live-host links to demo listings become site-relative in the same tab', () => {
  assert.deepEqual(policyHref('https://www.skoda-storyboard.com/en/media-room/', PAGE), { href: '/en/media-room', newTab: false });
  assert.deepEqual(policyHref('https://www.skoda-storyboard.com/en/', PAGE), { href: '/en', newTab: false });
  assert.deepEqual(
    policyHref('https://www.skoda-storyboard.com/en/news/?filter[model][]=elroq&filter[years][]=2026', PAGE),
    { href: '/en/news?filter[model][]=elroq&filter[years][]=2026', newTab: false },
  );
  assert.deepEqual(policyHref('//www.skoda-storyboard.com/en/Press-Kits/', PAGE), { href: '/en/press-kits', newTab: false });
  // a page under a listing path is not a listing
  assert.equal(policyHref('https://www.skoda-storyboard.com/en/news/some-post/', PAGE).newTab, true);
});

test('cdn, external, relative-demo, hash, mailto and tel links are left alone', () => {
  [
    'https://cdn.skoda-storyboard.com/2026/08/a.jpg',
    'https://www.youtube.com/user/skoda',
    '/en/category/models',
    '/en/news?filter[model][]=elroq',
    '#subscribe',
    'mailto:press@skoda-auto.cz',
    'tel:+420123',
    '',
    null,
  ].forEach((href) => assert.equal(policyHref(href, PAGE), null, String(href)));
});

test('a trailing slash on a demo path is dropped, query + hash kept, relative stays relative', () => {
  assert.deepEqual(policyHref('/en/', PAGE), { href: '/en', newTab: false });
  assert.deepEqual(policyHref('/en/media-room/', PAGE), { href: '/en/media-room', newTab: false });
  assert.deepEqual(policyHref('/en/news/?filter[years][]=2026#x', PAGE), { href: '/en/news?filter[years][]=2026#x', newTab: false });
  assert.deepEqual(
    policyHref('https://main--demo--skoda-storyboard.aem.page/en/series-2/', PAGE),
    { href: 'https://main--demo--skoda-storyboard.aem.page/en/series-2', newTab: false },
  );
  assert.equal(policyHref('/', PAGE), null);
});

test('LIVE_ONLY chrome targets go to the live site in a new tab', () => {
  [
    '/cs/', '/de/', '/sk/', '/sl/', '/sr/', '/de/some/page/',
    '/en/skodapedia/', '/en/feed/', '/en/press-releases/feed/', '/en/contacts/',
    '/en/documents/consent-to-personal-data-processing-information-on-personal-data-processing/',
    '/en/newsletter-settings/', '/en/media-cart/',
  ].forEach((href) => assert.deepEqual(policyHref(href, PAGE), { href: `${LIVE_ORIGIN}${href}`, newTab: true }, href));
});

test('source-only downloads go to the live site', () => {
  const href = '/direct-download/2026/08/01_Skoda_Slavia_Monte_Carlo_9ae70a7b.jpg';
  assert.deepEqual(policyHref(href, PAGE), { href: `${LIVE_ORIGIN}${href}`, newTab: true });
});

test('the podcast nav alias points at the live podcast-en archive', () => {
  assert.deepEqual(
    policyHref('/en/category/podcast/', PAGE),
    { href: `${LIVE_ORIGIN}/en/category/podcast-en/`, newTab: true },
  );
  assert.deepEqual(
    policyHref('/en/category/podcast-en/', PAGE),
    { href: `${LIVE_ORIGIN}/en/category/podcast-en/`, newTab: true },
  );
});

test('the en locale and look-alike paths are not caught by the locale rule', () => {
  ['/en', '/en/tag/model/elroq', '/nav', '/footer', '/media-room/nav'].forEach((href) => {
    assert.equal(policyHref(href, PAGE), null, href);
  });
});

test('explicit comparison links keep their href during decoration and clicks', (t) => {
  const href = `${LIVE_ORIGIN}/en/images/?model=peaq#gallery`;
  const dom = new JSDOM(`<main>
    <a data-preserve-href href="${href}" target="_blank" rel="noopener noreferrer">Source</a>
    <a href="${href}">Navigation</a>
  </main>`, { url: PAGE });
  const previousWindow = globalThis.window;
  globalThis.window = dom.window;
  t.after(() => {
    globalThis.window = previousWindow;
    dom.window.close();
  });
  const { document } = dom.window;
  const [source, navigation] = document.querySelectorAll('a');

  decorateLinks(document.querySelector('main'));
  assert.equal(source.getAttribute('href'), href);
  assert.equal(navigation.getAttribute('href'), '/en/images?model=peaq#gallery');

  installLinkPolicy(document);
  document.addEventListener('click', (event) => event.preventDefault());
  navigation.setAttribute('href', href);
  [source, navigation].forEach((a) => {
    a.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  });
  assert.equal(source.getAttribute('href'), href);
  assert.equal(source.target, '_blank');
  assert.equal(source.rel, 'noopener noreferrer');
  assert.equal(navigation.getAttribute('href'), '/en/images?model=peaq#gallery');
});
