/*
 * Story newsletter card from one shared fragment (SKODA-840): addNewsletterCard() puts a
 * Fragment block for `/{locale}/fragments/newsletter-card` at the top of the story sidebar,
 * unless the sidebar already holds a card. The rendered card is measured in the browser
 * (before vs after on 3 stories); this pins the DOM contract.
 * Run: node --test scripts/story-newsletter.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
// eslint-disable-next-line import/no-extraneous-dependencies
import { JSDOM } from 'jsdom';
import { addNewsletterCard, newsletterCardPath, pageLocale } from './story-newsletter.js';

const { document } = new JSDOM('<!DOCTYPE html><main></main>', { url: 'https://example.com/en/x' }).window;

/** A main after decorateSections + the section styles: one `.section` per HTML string. */
function main(...sections) {
  const el = document.createElement('main');
  sections.forEach(([classes, html]) => {
    const section = document.createElement('div');
    section.className = `section ${classes}`.trim();
    section.innerHTML = html;
    el.append(section);
  });
  return el;
}

const SIDEBAR = '<div class="default-content-wrapper"><h2>Explore more</h2></div><div><div class="cards overlay"></div></div>';
const CARD = '<div><div class="newsletter-stub card"><div><div>heading</div><div>Be the first</div></div></div></div>';

test('pageLocale: a two-letter first segment, else en', () => {
  assert.equal(pageLocale('/en/emobility/x'), 'en');
  assert.equal(pageLocale('/cs/e-mobilita-cs/x'), 'cs');
  assert.equal(pageLocale('/drafts/x'), 'en');
  assert.equal(pageLocale('/'), 'en');
  assert.equal(pageLocale(''), 'en');
  assert.equal(newsletterCardPath('de'), '/de/fragments/newsletter-card');
});

test('a sidebar without a card gets the fragment block first, in its own wrapper', () => {
  const el = main(['body-column', '<p>text</p>'], ['sidebar', SIDEBAR], ['dark', '']);
  const block = addNewsletterCard(el, '/en/emobility/x');
  const sidebar = el.querySelector('.section.sidebar');
  assert.ok(block);
  assert.equal(sidebar.firstElementChild, block.parentElement, 'the wrapper is the first child');
  assert.equal(block.className, 'fragment');
  // decorateBlocks reads `div.section > div > div`: wrapper > block > row > cell > link
  assert.equal(sidebar.querySelector(':scope > div > div.fragment > div > div > a').getAttribute('href'), '/en/fragments/newsletter-card');
  assert.equal(block.textContent, '', 'no link text, so a failed fragment shows nothing');
  assert.equal(el.querySelectorAll('.fragment').length, 1, 'only the sidebar gets one');
});

test('the locale comes from the page path', () => {
  const el = main(['sidebar', SIDEBAR]);
  addNewsletterCard(el, '/cs/e-mobilita-cs/x');
  assert.equal(el.querySelector('.fragment a').getAttribute('href'), '/cs/fragments/newsletter-card');
});

test('a locale whose stories have no card (German, Slovak, Serbian on the source): nothing is added (SKODA-1001 review)', () => {
  ['/de/emobilitat-de/x', '/sk/emobilita-sk/x', '/sr/emobilnost-sr/x', '/sl/x'].forEach((path) => {
    const el = main(['sidebar', SIDEBAR]);
    assert.equal(addNewsletterCard(el, path), null, path);
    assert.equal(el.querySelector('.fragment'), null, path);
  });
});

test('the placeholder link is out of the tab order and the accessibility tree until the card loads', () => {
  const el = main(['sidebar', SIDEBAR]);
  addNewsletterCard(el, '/en/x');
  const link = el.querySelector('.fragment a');
  assert.equal(link.getAttribute('aria-hidden'), 'true');
  assert.equal(link.getAttribute('tabindex'), '-1');
});

test('an authored card wins: nothing is added', () => {
  const el = main(['sidebar', CARD + SIDEBAR]);
  assert.equal(addNewsletterCard(el, '/en/x'), null);
  assert.equal(el.querySelectorAll('.fragment').length, 0);
  assert.equal(el.querySelectorAll('.newsletter-stub').length, 1);
});

test('no sidebar (or only a nested one): nothing is added', () => {
  assert.equal(addNewsletterCard(main(['body-column', '<p>x</p>']), '/en/x'), null);
  // a fragment's own main has no sidebar section, so loading the card never recurses
  assert.equal(addNewsletterCard(main(['', CARD]), '/en/x'), null);
  const nested = main(['', '<div class="section sidebar"></div>']);
  assert.equal(addNewsletterCard(nested, '/en/x'), null, 'only a top-level section counts');
});

test('running twice adds one card', () => {
  const el = main(['sidebar', SIDEBAR]);
  assert.ok(addNewsletterCard(el, '/en/x'));
  assert.equal(addNewsletterCard(el, '/en/x'), null);
  assert.equal(el.querySelectorAll('.fragment').length, 1);
});

test('an authored Fragment block for the card also counts as a card', () => {
  const el = main(['sidebar', `<div><div class="fragment"><div><div><a href="/en/fragments/newsletter-card">/en/fragments/newsletter-card</a></div></div></div></div>${SIDEBAR}`]);
  assert.equal(addNewsletterCard(el, '/en/x'), null);
  assert.equal(el.querySelectorAll('.fragment').length, 1);
});
