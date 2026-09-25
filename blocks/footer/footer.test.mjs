/*
 * Footer section decoration tests (SKODA-304 Storyboard + SKODA-305 Media Room).
 * Exercises footer-sections.js (pure DOM, no aem.js/fragment import) against fixtures shaped
 * like the decorated fragment DOM (sections → default-content / block wrappers).
 * Run: node --test blocks/footer/footer.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installDom, parseHTML } from '../../test/mini-dom.mjs';

installDom();
const { default: decorateFooterSections } = await import('./footer-sections.js');

const SOCIAL = `
<div class="section"><div class="default-content-wrapper">
  <p><a href="https://apps.apple.com/x"><span class="icon icon-appstore"><img></span></a><a href="https://play.google.com/x"><span class="icon icon-googleplay"><img></span></a></p>
  <p><a href="https://www.facebook.com/skodaglobal/"><span class="icon icon-facebook"><img></span></a><a href="https://www.instagram.com/skodagram/"><span class="icon icon-instagram"><img></span></a><a href="https://www.youtube.com/user/skoda"><span class="icon icon-youtube"><img></span></a><a href="https://go.skoda.eu/whatsapp"><span class="icon icon-whatsapp"><img></span></a></p>
</div></div>`;

const LEGAL = (copy) => `
<div class="section"><div class="default-content-wrapper">
  <p>${copy}</p>
  <p>© Škoda Auto a.s. 2026</p>
  <p><a href="/en/feed/">RSS</a><a href="/en/press-releases/feed/">RSS (News)</a></p>
</div></div>`;

const SITEMAP = `
<div class="section"><div class="default-content-wrapper">
  <ul>
    <li><p><a href="/en/category/models/">Models</a></p><ul><li><a href="/en/tag/fabia/">Fabia</a></li></ul></li>
    <li><p><a href="/en/category/emobility/">eMobility</a></p></li>
  </ul>
</div></div>`;

const WIDGETS = `
<div class="section">
  <div class="default-content-wrapper">
    <h2>Contacts</h2>
    <ul>
      <li><a href="/en/contacts/#corporate">Škoda Corporate Communications</a></li>
      <li><a href="/en/contacts/#product">Škoda Product Communications</a></li>
    </ul>
    <h2>Subscribe</h2>
    <p>To stay up-to-date with all the latest press information and events, please enter your email below</p>
  </div>
  <div class="newsletter-stub-wrapper"><div class="newsletter-stub block"></div></div>
  <div class="default-content-wrapper">
    <h2>Company</h2>
    <p>The Company's principal business activities are the development, production and sale of Škoda cars.</p>
  </div>
</div>`;

function footerOf(...sections) {
  const footer = parseHTML(sections.join(''));
  decorateFooterSections(footer);
  return footer;
}

test('sections are tagged social / middle / legal in order', () => {
  const footer = footerOf(SOCIAL, SITEMAP, LEGAL('Storyboard usage text'));
  const [social, middle, legal] = footer.children;
  assert.ok(social.classList.contains('footer-social'));
  assert.ok(middle.classList.contains('footer-nav'));
  assert.ok(legal.classList.contains('footer-legal'));
});

test('Storyboard sitemap (no headings) keeps the nav landmark with the whole list', () => {
  const footer = footerOf(SOCIAL, SITEMAP, LEGAL('x'));
  const middle = footer.children[1];
  assert.equal(middle.classList.contains('footer-widgets'), false);
  const nav = middle.querySelector('nav');
  assert.equal(nav.getAttribute('aria-label'), 'Footer');
  assert.equal(middle.children.length, 1);
  assert.equal(nav.querySelectorAll(':scope > ul > li').length, 2);
  assert.equal(nav.querySelector('ul ul a').textContent, 'Fabia');
});

test('Media Room middle section (headings) becomes one column per heading', () => {
  const footer = footerOf(SOCIAL, WIDGETS, LEGAL('x'));
  const middle = footer.children[1];
  assert.ok(middle.classList.contains('footer-widgets'));
  assert.equal(middle.classList.contains('footer-nav'), false);
  assert.equal(middle.querySelector('nav'), null);
  const columns = middle.querySelectorAll('.footer-columns > .footer-column');
  assert.deepEqual(columns.map((c) => c.querySelector('h2').textContent), ['Contacts', 'Subscribe', 'Company']);
});

test('Media Room columns keep their content, blocks and authored order', () => {
  const footer = footerOf(SOCIAL, WIDGETS, LEGAL('x'));
  const [contacts, subscribe, company] = footer.children[1].querySelectorAll('.footer-column');
  assert.deepEqual(contacts.querySelectorAll('a').map((a) => a.getAttribute('href')), ['/en/contacts/#corporate', '/en/contacts/#product']);
  assert.deepEqual(subscribe.children.map((c) => c.tagName), ['H2', 'P', 'DIV']);
  assert.ok(subscribe.children[2].querySelector('.newsletter-stub'));
  assert.deepEqual(company.children.map((c) => c.tagName), ['H2', 'P']);
  // the original wrappers are gone (no stray empty wrappers left in the section)
  assert.equal(footer.children[1].querySelectorAll('.default-content-wrapper').length, 0);
});

test('content authored before the first heading gets its own leading column', () => {
  const footer = footerOf(SOCIAL, WIDGETS.replace('<h2>Contacts</h2>', '<p>Intro</p><h2>Contacts</h2>'), LEGAL('x'));
  const columns = footer.children[1].querySelectorAll('.footer-column');
  assert.equal(columns.length, 4);
  assert.equal(columns[0].textContent, 'Intro');
});

test('social: badges + icons grouped and labelled; emptied paragraphs and wrapper removed', () => {
  const footer = footerOf(SOCIAL, WIDGETS, LEGAL('x'));
  const social = footer.children[0];
  const badges = social.querySelector('.app-badges');
  const icons = social.querySelector('.social-icons');
  assert.equal(badges.children.length, 2);
  assert.equal(badges.children[0].getAttribute('aria-label'), 'Škoda Media Room on the App Store');
  assert.deepEqual(icons.children.map((a) => a.getAttribute('aria-label')), ['Facebook', 'Instagram', 'YouTube', 'WhatsApp']);
  assert.equal(social.querySelector('.default-content-wrapper'), null);
  assert.deepEqual(social.children.map((c) => c.className), ['app-badges', 'social-icons']);
});

test('social: an authored title paragraph is kept', () => {
  const withTitle = SOCIAL.replace('<div class="default-content-wrapper">', '<div class="default-content-wrapper"><p>Follow us</p>');
  const social = footerOf(withTitle, SITEMAP, LEGAL('x')).children[0];
  const wrapper = social.querySelector('.default-content-wrapper');
  assert.equal(wrapper.children.length, 1);
  assert.equal(wrapper.textContent, 'Follow us');
});

test('legal: copy / notice / feeds classified; notice + feeds share a row', () => {
  const mrCopy = '"Without consent from Škoda Auto a.s., third parties are only allowed to use all published content - to an adequate extent - for press, Internet, film, radio and TV news…"';
  const legal = footerOf(SOCIAL, WIDGETS, LEGAL(mrCopy)).children[2];
  assert.equal(legal.querySelector('.copyright-text').textContent, mrCopy);
  const row = legal.querySelector('.legal-row');
  assert.deepEqual(row.children.map((c) => c.className), ['copyright-notice', 'feed-links']);
});

test('missing sections are tolerated', () => {
  const footer = footerOf(SOCIAL);
  assert.ok(footer.children[0].classList.contains('footer-social'));
  assert.doesNotThrow(() => decorateFooterSections(parseHTML('')));
});
