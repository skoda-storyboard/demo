/* global globalThis */
/*
 * Exec Bio (SKODA-810a): one card per member, the "show more" toggle (an h2 holding a button)
 * over a hidden panel with the photo grid and the links; toggles are independent and
 * keyboard-operable (native buttons); a photo opens the shared lightbox over the member's
 * set and Escape returns focus to it. Geometry and the slide are measured in the browser
 * against the source (docs/ui-specs/company-pages.md).
 * Run: node --test blocks/exec-bio/exec-bio.test.mjs
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

if (JSDOM) {
  const { window } = new JSDOM('<!doctype html><main></main>', { url: 'http://localhost/en/board-of-management' });
  window.hlx = { codeBasePath: '' };
  window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  globalThis.window = window;
  globalThis.document = window.document;
}
const decorate = JSDOM ? (await import('./exec-bio.js')).default : null;

const CARD = `<p><strong>Holger Peters</strong><br> <strong>Acting Chair of the Board of Management<br> (since 1 June 2023)</strong></p>
  <p><picture><img src="/media_holger.png" alt="Holger Peters portrait"></picture></p>`;
const PANEL = `<p>show more</p>
  <p><picture><img src="/media_1.jpg" alt="Holger Peters"></picture></p>
  <p><picture><img src="/media_2.jpg" alt="Holger Peters"></picture></p>
  <p><strong><a href="https://cdn.example.com/cv.pdf">Download cv</a></strong><br>
  <strong><a href="https://www.skoda-storyboard.com/en/press-releases/x/">More details in the press release</a></strong></p>`;

function block(rows) {
  document.body.innerHTML = `<main><div class="exec-bio">${rows.map((cells) => `<div>${cells.map((c) => `<div>${c}</div>`).join('')}</div>`).join('')}</div></main>`;
  return document.querySelector('.exec-bio');
}

test('a card per member: the name line marked, the portrait kept, then an h2 toggle over a hidden panel', { skip }, () => {
  const el = block([[CARD, PANEL]]);
  const portrait = el.querySelector('img[alt="Holger Peters portrait"]');
  decorate(el);
  const card = el.querySelector(':scope > ul.exec-bio-list > li.exec-bio-card');
  assert.ok(card);
  assert.equal(card.querySelector('.exec-bio-name').textContent, 'Holger Peters');
  assert.equal(card.querySelector('.exec-bio-portrait img'), portrait);
  const heading = card.querySelector('h2.exec-bio-heading');
  const button = heading.querySelector('button[type="button"]');
  assert.equal(button.textContent, 'show more');
  assert.equal(button.getAttribute('aria-expanded'), 'false');
  assert.equal(button.querySelector('.exec-bio-icon').getAttribute('aria-hidden'), 'true');
  const panel = document.getElementById(button.getAttribute('aria-controls'));
  assert.equal(panel.parentElement, card);
  assert.equal(panel.getAttribute('role'), 'region');
  assert.equal(panel.getAttribute('aria-labelledby'), button.id);
  assert.equal(panel.hidden, true);
  const photos = [...panel.querySelectorAll('ul.exec-bio-photos > li > button.exec-bio-photo')];
  assert.equal(photos.length, 2);
  assert.equal(photos[0].getAttribute('aria-label'), 'Open photo 1 of 2: Holger Peters');
  assert.ok(photos[0].querySelector('picture img[loading="lazy"]'));
  // the links follow the photos, web links in a new tab
  const cv = panel.querySelector('a[href$="cv.pdf"]');
  assert.equal(cv.target, '_blank');
  assert.match(cv.rel, /noopener/);
  assert.equal(panel.lastElementChild.tagName, 'P');
});

test('toggles open and close their own panel only (independent, unique ids)', { skip }, () => {
  const el = block([[CARD, PANEL], [CARD, PANEL]]);
  decorate(el);
  const [first, second] = el.querySelectorAll('.exec-bio-heading button');
  assert.notEqual(first.id, second.id);
  first.click();
  const panelOf = (b) => document.getElementById(b.getAttribute('aria-controls'));
  assert.equal(first.getAttribute('aria-expanded'), 'true');
  assert.equal(panelOf(first).hidden, false);
  assert.ok(first.closest('.exec-bio-card').classList.contains('is-open'));
  assert.equal(panelOf(second).hidden, true);
  first.click();
  assert.equal(first.getAttribute('aria-expanded'), 'false');
  assert.equal(panelOf(first).hidden, true);
  assert.equal(first.closest('.exec-bio-card').classList.contains('is-open'), false);
});

test('a row without a panel is a plain card; a panel without a label gets the default one', { skip }, () => {
  const el = block([[CARD], [CARD, PANEL.replace('<p>show more</p>', '')], ['', '']]);
  decorate(el);
  const cards = el.querySelectorAll('li.exec-bio-card');
  assert.equal(cards.length, 2, 'the empty row drops');
  assert.equal(cards[0].querySelector('.exec-bio-heading'), null);
  assert.equal(cards[1].querySelector('.exec-bio-heading button').textContent, 'show more');
});

test('a photo opens the shared lightbox over the set; Escape closes it and returns focus', { skip }, async () => {
  const el = block([[CARD, PANEL]]);
  decorate(el);
  el.querySelector('.exec-bio-heading button').click();
  const [, second] = el.querySelectorAll('.exec-bio-photo');
  second.click();
  // the lightbox module loads on the first click
  for (let i = 0; i < 50 && !document.querySelector('.gallery-overlay:not([hidden])'); i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => { setTimeout(r, 10); });
  }
  const overlay = document.querySelector('.gallery-overlay');
  assert.ok(overlay && !overlay.hidden, 'the lightbox is open');
  assert.equal(overlay.getAttribute('role'), 'dialog');
  assert.match(overlay.querySelector('.gallery-lightbox-image').getAttribute('src'), /media_2\.jpg/);
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(overlay.hidden, true);
  assert.equal(document.activeElement, second);
});
