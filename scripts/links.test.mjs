/* global globalThis */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { policyHref, opensInSameTab, LIVE_ORIGIN } from './links.js';

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
    '/en/skodapedia/', '/en/feed/', '/en/press-releases/feed/',
    '/en/documents/what-are-your-rights/',
  ].forEach((href) => assert.deepEqual(policyHref(href, PAGE), { href: `${LIVE_ORIGIN}${href}`, newTab: true }, href));
});

test('the migrated documents stay on the demo, in the tab, as Contacts and Copyright (SKODA-843)', () => {
  const CONSENT = '/en/documents/consent-to-personal-data-processing-information-on-personal-data-processing';
  [
    ['/en/documents/', '/en/documents'],
    [`${CONSENT}/`, CONSENT],
    ['/en/documents/cookies/', '/en/documents/cookies'],
    ['/en/documents/cookies', null],
  ].forEach(([href, demo]) => {
    assert.deepEqual(policyHref(href, PAGE), demo && { href: demo, newTab: false }, href);
  });
  // the absolute live consent link (the newsletter forms') stays on the demo too, as Copyright
  assert.deepEqual(policyHref(`${LIVE_ORIGIN}${CONSENT}/`, PAGE), { href: CONSENT, newTab: false });
  assert.deepEqual(policyHref(`${LIVE_ORIGIN}/en/documents/what-are-your-rights/`, PAGE).newTab, true);
  // a longer slug that only starts like a migrated one still goes live
  const near = '/en/documents/cookies-old/';
  assert.deepEqual(policyHref(near, PAGE), { href: `${LIVE_ORIGIN}${near}`, newTab: true });
});

test('"Manage subscription" goes to the live page in the same tab, as on the source (SKODA-308)', () => {
  assert.deepEqual(policyHref('/en/newsletter-settings/', PAGE), { href: `${LIVE_ORIGIN}/en/newsletter-settings/`, newTab: false });
  const live = `${LIVE_ORIGIN}/en/newsletter-settings/`;
  assert.deepEqual(policyHref(live, PAGE), { href: live, newTab: false }, 'an absolute live link too');
  assert.equal(opensInSameTab(live), true);
  assert.equal(opensInSameTab('https://example.com/en/newsletter-settings/'), false, 'only the live host');
  assert.equal(opensInSameTab(`${LIVE_ORIGIN}/en/documents/x/`), false, 'the consent document keeps its new tab');
});

test('Contacts and Copyright open the migrated pages in the same tab (SKODA-813, #457 re-review)', () => {
  [
    [`${LIVE_ORIGIN}/en/contacts/`, '/en/contacts'],
    [`${LIVE_ORIGIN}/en/copyright/`, '/en/copyright'],
    ['/en/contacts/', '/en/contacts'],
    // the footer's source anchors land on the demo page's headings
    [`${LIVE_ORIGIN}/en/contacts/#corporate`, '/en/contacts#škoda-corporate-communications'],
    [`${LIVE_ORIGIN}/en/contacts/#product`, '/en/contacts#škoda-productcommunications'],
    ['/en/contacts#corporate', '/en/contacts#škoda-corporate-communications'],
    // any other anchor is kept as it is
    [`${LIVE_ORIGIN}/en/contacts/#press`, '/en/contacts#press'],
  ].forEach(([href, to]) => assert.deepEqual(policyHref(href, PAGE), { href: to, newTab: false }, href));
  assert.equal(policyHref('/en/contacts', PAGE), null, 'a demo link is left as it is');
});

test('the media cart page is the demo\'s own (SKODA-505b): it stays in the tab', () => {
  assert.equal(policyHref('/en/media-cart', PAGE), null, 'the cart badge link is left as it is');
  assert.deepEqual(policyHref('/en/media-cart/', PAGE), { href: '/en/media-cart', newTab: false });
  assert.deepEqual(
    policyHref(`${LIVE_ORIGIN}/en/media-cart/`, PAGE),
    { href: '/en/media-cart', newTab: false },
    'a chrome link to the live cart page comes to the demo page',
  );
});

test('Company → Newsletter opens the migrated page in the same tab (SKODA-845, #457 review)', () => {
  assert.deepEqual(
    policyHref(`${LIVE_ORIGIN}/en/newsletter/`, PAGE),
    { href: '/en/newsletter', newTab: false },
    'the authored live link in the Media Room nav comes to the demo page',
  );
  assert.deepEqual(policyHref('/en/newsletter/', PAGE), { href: '/en/newsletter', newTab: false });
  assert.deepEqual(
    policyHref(`${LIVE_ORIGIN}/en/newsletter-settings/`, PAGE),
    { href: `${LIVE_ORIGIN}/en/newsletter-settings/`, newTab: false },
    '"Manage subscription" still goes to live',
  );
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

test('links inside [data-link-policy="resolved"] keep the target and tab their block chose (SKODA-303a)', async () => {
  // eslint-disable-next-line import/no-extraneous-dependencies
  const { JSDOM } = await import('jsdom');
  const { window } = new JSDOM(`<main>
    <ul data-link-policy="resolved"><li><a id="kept" href="${LIVE_ORIGIN}/cs/e-mobilita-cs/x/">CZ</a></li></ul>
    <p><a id="policed" href="${LIVE_ORIGIN}/cs/e-mobilita-cs/x/">CZ</a></p></main>`, { url: PAGE });
  const { decorateLinks } = await import('./links.js');
  globalThis.window = window;
  try {
    decorateLinks(window.document.querySelector('main'));
  } finally {
    delete globalThis.window;
  }
  const kept = window.document.getElementById('kept');
  const policed = window.document.getElementById('policed');
  assert.deepEqual([kept.getAttribute('target'), kept.getAttribute('rel')], [null, null]);
  assert.equal(policed.getAttribute('target'), '_blank', 'other live links keep the policy');
});

test('Fragment block references skip the live redirect: a locale fragment loads from this site (#243)', async () => {
  // eslint-disable-next-line import/no-extraneous-dependencies
  const { JSDOM } = await import('jsdom');
  const { window } = new JSDOM(`<main>
    <div class="fragment"><div><div><a id="frag" href="/cs/fragments/newsletter-card"></a></div></div></div>
    <div class="fragment"><div><div><a id="frag-slash" href="/cs/fragments/newsletter-card/"></a></div></div></div>
    <div class="fragment"><div><div><a id="en-slash" href="/en/fragments/newsletter-card/"></a></div></div></div>
    <p><a id="page" href="/cs/e-mobilita-cs/x">CZ</a></p></main>`, { url: 'https://main--demo--skoda-storyboard.aem.page/cs/e-mobilita-cs/story' });
  const { decorateLinks } = await import('./links.js');
  globalThis.window = window;
  try {
    decorateLinks(window.document.querySelector('main'));
  } finally {
    delete globalThis.window;
  }
  const frag = window.document.getElementById('frag');
  assert.equal(frag.getAttribute('href'), '/cs/fragments/newsletter-card');
  assert.equal(frag.getAttribute('target'), null);
  // the trailing-slash rule still applies, so loadFragment() fetches `<path>.plain.html` (#348 review)
  const slashed = ['frag-slash', 'en-slash'].map((id) => window.document.getElementById(id));
  assert.deepEqual(slashed.map((a) => a.getAttribute('href')), ['/cs/fragments/newsletter-card', '/en/fragments/newsletter-card']);
  assert.deepEqual(slashed.map((a) => a.getAttribute('target')), [null, null]);
  const page = window.document.getElementById('page');
  assert.equal(page.getAttribute('href'), `${LIVE_ORIGIN}/cs/e-mobilita-cs/x`, 'other locale links keep the policy');
  assert.equal(page.getAttribute('target'), '_blank');
});

test('policyHref fragment option: no live redirect, the trailing-slash rule kept (#348 review)', () => {
  const page = 'https://main--demo--skoda-storyboard.aem.page/cs/e-mobilita-cs/story';
  assert.equal(policyHref('/cs/fragments/newsletter-card', page, { fragment: true }), null);
  assert.deepEqual(policyHref('/cs/fragments/newsletter-card/', page, { fragment: true }), { href: '/cs/fragments/newsletter-card', newTab: false });
  assert.deepEqual(policyHref('/en/fragments/newsletter-card/?x=1', page, { fragment: true }), { href: '/en/fragments/newsletter-card?x=1', newTab: false });
  // without the option a locale path still goes to the live site (the nav / footer rule)
  assert.deepEqual(policyHref('/cs/fragments/newsletter-card', page), { href: `${LIVE_ORIGIN}/cs/fragments/newsletter-card`, newTab: true });
});
