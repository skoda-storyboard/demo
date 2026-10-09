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
  Object.assign(globalThis, { window: dom.window, document: dom.window.document });
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
