/* global globalThis */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const { JSDOM } = createRequire(import.meta.url)('jsdom');

function setup(markup) {
  const dom = new JSDOM(`<head></head><body class="press-release"><main>${markup}</main></body>`, {
    url: 'https://demo.example/en/press-releases/release',
  });
  // the page globals aem.js reads on import (getMetadata)
  Object.assign(globalThis, {
    window: dom.window, document: dom.window.document, MutationObserver: dom.window.MutationObserver,
  });
  return dom.window.document.querySelector('main');
}

setup('');
const { default: decorate } = await import('./press-release.js');

const header = '<div class="section"><div class="default-content-wrapper"><p>21. 9. 2026</p><h1>Title</h1></div></div>';
const lead = `<div class="section body-column"><div class="default-content-wrapper">
  <p><picture><img src="/lead.jpg" alt=""></picture></p>
  <ul><li>First point</li></ul>
  <p><strong>Mladá Boleslav, 21 September – the perex.</strong></p>
</div><div class="embed-wrapper"><div class="embed"></div></div>
<div class="default-content-wrapper"><p>Body.</p></div></div>`;
const callout = `<div class="section body-column highlight-grey"><div class="default-content-wrapper">
  <p><strong>Frequently Asked Questions:</strong><br><strong>Who is leaving?</strong><br>Answer.</p>
  <p><strong>A question on its own line?</strong></p>
  <ul><li>A list in the callout</li></ul>
</div></div>`;
const sidebar = '<div class="section sidebar"><div class="default-content-wrapper"><h3>Additional info</h3></div></div>';

test('only the first body part is the lead: bullets and perex are marked there', () => {
  const main = setup(`${header}${lead}${sidebar}`);
  decorate(main);
  const parts = main.querySelectorAll(':scope > .section.body-column');
  assert.equal(parts.length, 1);
  assert.ok(parts[0].classList.contains('press-release-lead'));
  assert.ok(parts[0].querySelector('ul').classList.contains('press-release-bullets'));
  assert.equal(parts[0].querySelectorAll('.press-release-perex').length, 1);
  assert.equal(main.querySelector('.press-release-date time').dateTime, '2026-09-21');
});

test('a highlight callout after the lead is not decorated as the lead (SKODA-607a)', () => {
  const main = setup(`${header}${lead}${callout}${sidebar}`);
  decorate(main);
  const [first, panel] = main.querySelectorAll(':scope > .section.body-column');
  assert.ok(first.classList.contains('press-release-lead'));
  assert.equal(panel.classList.contains('press-release-lead'), false);
  // the FAQ's all-bold question line is not a perex, its list is not the › bullets
  assert.equal(panel.querySelector('.press-release-perex'), null);
  assert.equal(panel.querySelector('.press-release-bullets'), null);
});

test('a release without a body column or sidebar still decorates its header', () => {
  const main = setup(header);
  decorate(main);
  assert.ok(main.querySelector('.press-release-header'));
  assert.equal(main.querySelector('.press-release-lead'), null);
});

// --- #274: the sidebar's "Additional info" links -----------------------------------------------

const links = `<div class="section sidebar"><div class="default-content-wrapper"><h3>Additional info</h3>
  <ul><li><a href="https://www.skoda-storyboard.com/en/contacts/">Media contacts</a></li>
  <li><a href="#media-box">Download Media Box</a></li></ul></div></div>`;
// the Downloads block's add-all control before (no data-wired) and after bindCart wires it
const mediaBox = `<div class="section dark full-width media-box"><div class="default-content-wrapper">
  <h3>Media Box</h3><p class="downloads-stats">1 image<button type="button" class="downloads-add downloads-add-all"
  aria-disabled="true"></button></p></div><div class="downloads-wrapper"><div class="downloads"></div></div></div>`;
const tick = () => new Promise((resolve) => { setTimeout(resolve, 0); });

test('#274: "Media contacts" is marked for its arrow, "Download Media Box" gets the add button', () => {
  const main = setup(`${header}${lead}${links}${mediaBox}`);
  decorate(main);
  assert.ok(main.querySelector('a[href*="contacts"]').classList.contains('press-release-contacts'));
  const li = main.querySelector('a[href="#media-box"]').parentElement;
  assert.ok(li.classList.contains('press-release-media-box'));
  const button = li.querySelector('button.press-release-add-all');
  assert.equal(button.type, 'button');
  assert.equal(button.getAttribute('aria-label'), 'Add all Media Box files to the media cart');
  // the jump link stays as it was
  assert.equal(li.querySelector('a').textContent, 'Download Media Box');
});

test('#274: the sidebar add button is inert until the Media Box control is wired, then mirrors and proxies it', async () => {
  const main = setup(`${header}${lead}${links}${mediaBox}`);
  decorate(main);
  const button = main.querySelector('.press-release-add-all');
  const addAll = main.querySelector('.downloads-add-all');
  let clicks = 0;
  addAll.addEventListener('click', () => { clicks += 1; });
  assert.equal(button.getAttribute('aria-disabled'), 'true');
  button.click();
  assert.equal(clicks, 0, 'no click before the Media Box control is wired');

  // bindCart: wired, enabled, nothing in the cart yet
  addAll.removeAttribute('aria-disabled');
  addAll.setAttribute('aria-pressed', 'false');
  addAll.dataset.wired = '';
  await tick();
  assert.equal(button.hasAttribute('aria-disabled'), false);
  assert.equal(button.getAttribute('aria-pressed'), 'false');
  button.click();
  assert.equal(clicks, 1, 'the click goes to the Media Box add-all');

  // everything in the cart: the remove glyph and pressed state follow
  addAll.toggleAttribute('data-in-cart', true);
  addAll.setAttribute('aria-pressed', 'true');
  await tick();
  assert.ok(button.hasAttribute('data-in-cart'));
  assert.equal(button.getAttribute('aria-pressed'), 'true');

  // busy while adding: shown, and the Media Box control ignores the click itself
  addAll.setAttribute('aria-busy', 'true');
  await tick();
  assert.equal(button.getAttribute('aria-busy'), 'true');
});

test('#274: no add button without a Media Box Downloads block, and none on other sidebar links', () => {
  const main = setup(`${header}${lead}${links}`);
  decorate(main);
  assert.equal(main.querySelector('.press-release-add-all'), null);
  assert.equal(main.querySelector('.press-release-media-box'), null);
  // the contacts arrow does not depend on the Media Box
  assert.ok(main.querySelector('.press-release-contacts'));
});

