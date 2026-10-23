/* global globalThis */
/*
 * Contact Directory (SKODA-810a): one card per row, kept as authored; the name line, the
 * portrait (also when it shares the e-mail paragraph) and the LinkedIn icon are marked; web
 * links open in a new tab, mail links don't; empty rows drop. Geometry is measured in the
 * browser against the source (docs/ui-specs/company-pages.md).
 * Run: node --test blocks/contact-directory/contact-directory.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

let JSDOM = null;
try {
  // eslint-disable-next-line import/no-unresolved
  ({ JSDOM } = createRequire(import.meta.url)('jsdom'));
} catch { /* jsdom unavailable — DOM tests skip */ }
const skip = JSDOM ? false : 'jsdom not installed — DOM tests skip';

const decorate = JSDOM ? (await import('./contact-directory.js')).default : null;

const CARD = `<p><strong>Tom Drechsler</strong><br> <strong>Head of Communications</strong></p>
  <p><picture><img src="/media_tom.png" alt="Thomas Drechsler"></picture></p>
  <p>e: <a href="mailto:thomas.drechsler@skoda-auto.cz">thomas.drechsler@skoda-auto.cz</a><br> t: +420 730 863 027</p>
  <p><picture><img src="/media_linkedin.png" alt="linkedin"></picture><a href="https://www.linkedin.com/in/tom/">LinkedIn</a></p>`;
// the source writes some portraits on the e-mail paragraph's first line, and some names in
// one bold run with the title
const SHARED = `<p><strong>Michaela Sklenářová<br> Spokesperson Product Communications</strong></p>
  <p><picture><img src="/media_michaela.png" alt="Michaela"></picture><br> e: <a href="mailto:m@skoda-auto.cz">m@skoda-auto.cz</a></p>`;

function block(...cells) {
  const dom = new JSDOM(`<main><div class="contact-directory">${cells.map((c) => `<div><div>${c}</div></div>`).join('')}</div></main>`, { url: 'https://example.com/en/contacts' });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  return dom.window.document.querySelector('.contact-directory');
}

test('one list item per authored row, its content kept; the name line, portrait and icon marked', { skip }, () => {
  const el = block(CARD, CARD);
  const portrait = el.querySelector('img[alt="Thomas Drechsler"]');
  decorate(el);
  const cards = [...el.querySelectorAll(':scope > ul.contact-directory-list > li.contact-directory-card')];
  assert.equal(cards.length, 2);
  const [card] = cards;
  assert.equal(card.querySelector('.contact-directory-portrait img'), portrait, 'the authored image is kept');
  assert.equal(card.querySelector('.contact-directory-name').textContent, 'Tom Drechsler');
  assert.equal(card.querySelector('.contact-directory-identity strong:not(.contact-directory-name strong)').textContent, 'Head of Communications');
  assert.equal(card.querySelector('.contact-directory-icon img').alt, 'linkedin');
  const phone = card.querySelector('a[href^="tel:"]');
  assert.equal(phone.getAttribute('href'), 'tel:+420730863027', 'the text phone is a tel: link');
  assert.equal(phone.textContent, '+420 730 863 027');
  assert.match(phone.parentElement.textContent, /t: \+420 730 863 027/, 'its text unchanged');
  assert.equal(phone.target, '', 'phone links stay in the tab');
});

test('a portrait on the e-mail line gets its own paragraph; a bold run shared with the title is split', { skip }, () => {
  const el = block(SHARED);
  decorate(el);
  const card = el.querySelector('li');
  const [identity, portrait, mail] = card.querySelectorAll(':scope > p');
  assert.equal(identity.querySelector('.contact-directory-name').textContent, 'Michaela Sklenářová');
  assert.match(identity.textContent, /Spokesperson Product Communications/);
  assert.equal(identity.querySelectorAll('strong').length, 2, 'both lines stay bold');
  assert.ok(portrait.classList.contains('contact-directory-portrait'));
  assert.equal(portrait.querySelector('img').alt, 'Michaela');
  assert.equal(mail.firstChild.nodeName, '#text', 'the line break before the e-mail is gone');
  assert.equal(card.querySelector('.contact-directory-icon'), null, 'no icon');
});

test('a phone with non-breaking spaces links too; a number already linked is left alone', { skip }, () => {
  const el = block('<p><strong>A</strong></p><p>t: +420\u00a0730\u00a0865\u00a0258<br>t: <a href="tel:+1">+1 555 0100 22</a></p>');
  decorate(el);
  const phones = [...el.querySelectorAll('a[href^="tel:"]')].map((a) => a.getAttribute('href'));
  assert.deepEqual(phones, ['tel:+420730865258', 'tel:+1']);
});

test('web links open in a new tab with noopener; mail links stay in the tab', { skip }, () => {
  const el = block(CARD);
  decorate(el);
  const linkedin = el.querySelector('a[href*="linkedin"]');
  assert.equal(linkedin.target, '_blank');
  assert.equal(linkedin.rel, 'noopener');
  const mail = el.querySelector('a[href^="mailto:"]');
  assert.equal(mail.target, '');
  assert.equal(mail.rel, '');
});

test('empty rows drop; an empty block renders an empty list', { skip }, () => {
  const el = block('', CARD, ' ');
  decorate(el);
  assert.equal(el.querySelectorAll('li').length, 1);
  const empty = block();
  decorate(empty);
  assert.equal(empty.querySelectorAll('ul.contact-directory-list').length, 1);
  assert.equal(empty.querySelectorAll('li').length, 0);
});
