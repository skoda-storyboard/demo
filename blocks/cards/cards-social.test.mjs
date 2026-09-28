/* global globalThis */
/*
 * Unit tests for the Cards (social) variant (SKODA-217): the host → network
 * mapping, the accessible name, and the decorated card markup.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

let JSDOM = null;
try {
  const req = createRequire(import.meta.url);
  // eslint-disable-next-line import/no-unresolved
  ({ JSDOM } = req('jsdom'));
} catch { /* jsdom unavailable — DOM tests skip */ }
const skip = JSDOM ? false : 'jsdom not installed — DOM tests skip';

const {
  default: decorateSocialCards, networkOf, profileUrl, socialLabel,
} = await import('./cards-social.js');

test('networkOf: the three profile hosts, with or without www / sub-domains', () => {
  assert.equal(networkOf('https://www.facebook.com/skodaglobal/'), 'facebook');
  assert.equal(networkOf('https://m.facebook.com/skodaglobal'), 'facebook');
  assert.equal(networkOf('https://www.instagram.com/skodagram/'), 'instagram');
  assert.equal(networkOf('https://www.youtube.com/@skoda'), 'youtube');
  assert.equal(networkOf('https://youtu.be/abc'), 'youtube');
});

test('networkOf: other hosts, look-alikes and bad URLs are not a network', () => {
  assert.equal(networkOf('https://www.skoda-storyboard.com/en/'), null);
  assert.equal(networkOf('https://notfacebook.com/x'), null);
  assert.equal(networkOf('https://facebook.com.evil.example/x'), null);
  assert.equal(networkOf('not a url at all ::'), null);
});

test('profileUrl: only absolute http(s) links are profile links', () => {
  assert.equal(profileUrl('https://www.facebook.com/skodaglobal/').href, 'https://www.facebook.com/skodaglobal/');
  assert.equal(profileUrl('http://instagram.com/skodagram').hostname, 'instagram.com');
  ['javascript:alert(1)', 'JavaScript:alert(1)', 'mailto:a@b.c', '/en/relative', '', 'not a url'].forEach((href) => {
    assert.equal(profileUrl(href), null, href);
  });
});

test('socialLabel keeps the visible handle and says it opens a new tab', () => {
  assert.equal(socialLabel('facebook', '@skodaglobal'), 'Facebook @skodaglobal (opens in a new tab)');
  assert.equal(socialLabel(null, '@someone'), '@someone (opens in a new tab)');
});

const decorate = (rows) => {
  const { window } = new JSDOM('<main></main>');
  globalThis.document = window.document;
  const block = window.document.createElement('div');
  block.className = 'cards social';
  block.innerHTML = rows;
  decorateSocialCards(block);
  return block;
};
const row = (inner) => `<div><div>${inner}</div></div>`;

test('each authored row becomes one safe external link: icon + handle', { skip }, () => {
  const block = decorate([
    row('<a href="https://www.facebook.com/skodaglobal/">@skodaglobal</a>'),
    row('<a href="https://www.instagram.com/skodagram/">@skodagram</a>'),
    row('<a href="https://www.youtube.com/@skoda">@skoda</a>'),
  ].join(''));
  const cards = [...block.querySelectorAll('ul > li.card-teaser.social')];
  assert.equal(cards.length, 3);
  cards.forEach((li) => {
    const links = li.querySelectorAll('a');
    assert.equal(links.length, 1, 'one link per card');
    const [a] = links;
    assert.equal(a.target, '_blank');
    assert.equal(a.rel, 'noopener noreferrer');
    assert.ok(a.querySelector('svg[aria-hidden="true"] path'), 'decorative svg icon');
    assert.ok(a.getAttribute('aria-label').includes(a.querySelector('.card-teaser-social-handle').textContent));
  });
  assert.deepEqual(cards.map((li) => li.querySelector('a').getAttribute('href')), [
    'https://www.facebook.com/skodaglobal/', 'https://www.instagram.com/skodagram/', 'https://www.youtube.com/@skoda',
  ]);
});

test('defensive: rows without a link are skipped; unknown hosts render without an icon', { skip }, () => {
  const block = decorate([
    row('just text'),
    row('<a href="https://www.example.com/profile">@elsewhere</a>'),
  ].join(''));
  const cards = block.querySelectorAll('li');
  assert.equal(cards.length, 1);
  assert.equal(cards[0].querySelector('svg'), null);
  assert.equal(cards[0].querySelector('a').getAttribute('aria-label'), '@elsewhere (opens in a new tab)');
});

test('defensive: non-http(s) links never become cards', { skip }, () => {
  const block = decorate([
    row('<a href="javascript:alert(1)">@x</a>'),
    row('<a href="mailto:press@skoda.example">@mail</a>'),
    row('<a href="/en/relative">@local</a>'),
    row('<a href="https://www.youtube.com/@skoda">@skoda</a>'),
  ].join(''));
  const links = [...block.querySelectorAll('li a')];
  assert.deepEqual(links.map((a) => a.getAttribute('href')), ['https://www.youtube.com/@skoda']);
});

test('defensive: an empty link text still gets a visible handle and a full name', { skip }, () => {
  const block = decorate([
    row('<a href="https://www.example.com/profile"> </a>'),
    row('<a href="https://www.instagram.com/skodagram/"></a>'),
  ].join(''));
  const [unknown, insta] = [...block.querySelectorAll('li a')];
  assert.equal(unknown.querySelector('.card-teaser-social-handle').textContent, 'example.com');
  assert.equal(unknown.getAttribute('aria-label'), 'example.com (opens in a new tab)');
  assert.equal(insta.getAttribute('aria-label'), 'Instagram instagram.com (opens in a new tab)');
});
