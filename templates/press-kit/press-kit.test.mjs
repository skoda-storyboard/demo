/* global globalThis, MutationObserver */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const { JSDOM } = createRequire(import.meta.url)('jsdom');
const { default: decorate } = await import('./press-kit.js');

function setup(markup) {
  const dom = new JSDOM(`<main>${markup}</main>`, { url: 'https://demo.example/en/press-kits/kit' });
  globalThis.document = dom.window.document;
  globalThis.MutationObserver = dom.window.MutationObserver;
  return dom.window.document.querySelector('main');
}

test('the Introduction alone gets a keyboard-accessible Chapters menu', () => {
  const main = setup(`<div class="section press-kit-chapters"><div class="default-content-wrapper">
    <ul id="chapters-links">
      <li><a href="#chapters-links">Chapters</a></li>
      <li><a href="/en/press-kits/intro">Introduction</a></li>
      <li><a href="https://www.skoda-storyboard.com/en/press-kits/exterior/">Exterior</a></li>
    </ul></div></div><div class="section body-column"></div>`);
  decorate(main);
  const nav = main.querySelector('nav[aria-label="Chapters"]');
  const toggle = nav.querySelector('button');
  assert.equal(nav.querySelectorAll('ul > li').length, 2);
  assert.equal(toggle.getAttribute('aria-controls'), 'chapters-links');
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  toggle.click();
  assert.equal(nav.querySelector('ul').hidden, false);
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  assert.equal(nav.querySelector('a[href^="https://"]').target, '_blank');
  nav.querySelector('a[href^="https://"]').click();
  assert.equal(nav.querySelector('ul').hidden, true);
});

test('60-item Media Box collapses after the Downloads block has loaded', async () => {
  const main = setup(`<div class="section body-column"></div>
    <div class="section media-box"><div class="downloads"><div>authored row</div></div>
    <ul class="press-kit-files"><li><a href="https://example.com/press.pdf">Press PDF</a></li></ul></div>`);
  decorate(main);
  const block = main.querySelector('.downloads');
  block.replaceChildren(main.ownerDocument.createElement('ul'));
  const list = block.querySelector('ul');
  list.className = 'downloads-items';
  for (let i = 0; i < 55; i += 1) list.append(main.ownerDocument.createElement('li'));
  block.dataset.blockStatus = 'loaded';
  await new Promise((resolve) => { setTimeout(resolve, 0); });
  const toggle = main.querySelector('.press-kit-show-more');
  assert.equal(list.querySelectorAll('li:not([hidden])').length, 8);
  assert.equal(main.querySelector('.press-kit-files a').getAttribute('href'), 'https://example.com/press.pdf');
  toggle.click();
  assert.equal(list.querySelectorAll('li:not([hidden])').length, 55);
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
});

test('Media Box collapse counts image tiles across multiple Downloads blocks', async () => {
  const main = setup(`<div class="section body-column"></div>
    <div class="section media-box"><div class="downloads"></div>
    <ul class="press-kit-files"><li><a href="https://example.com/a.pdf">PDF</a></li></ul>
    <div class="downloads"></div></div>`);
  decorate(main);
  const blocks = [...main.querySelectorAll('.downloads')];
  for (const [index, block] of blocks.entries()) {
    const list = main.ownerDocument.createElement('ul');
    list.className = 'downloads-items';
    const count = index ? 2 : 53;
    for (let i = 0; i < count; i += 1) list.append(main.ownerDocument.createElement('li'));
    block.append(list);
    block.dataset.blockStatus = 'loaded';
  }
  await new Promise((resolve) => { setTimeout(resolve, 0); });
  assert.equal(main.querySelectorAll('.downloads-items > li:not([hidden])').length, 8);
  main.querySelector('.press-kit-show-more').click();
  assert.equal(main.querySelectorAll('.downloads-items > li:not([hidden])').length, 55);
});

test('a hub keeps links and has no article-only controls', () => {
  const main = setup(`<div class="section"><div class="cards tiles">
    <div><a href="/en/press-kits/intro">Introduction</a></div>
    <div><a href="https://www.skoda-storyboard.com/en/press-kits/other/">Other</a></div>
    </div></div>`);
  decorate(main);
  assert.equal(main.querySelector('a[href^="https://"]').target, '_blank');
  assert.equal(main.querySelector('a[href^="https://"]').rel, 'noopener noreferrer');
  assert.equal(main.querySelector('a[href^="/en"]').target, '');
  assert.equal(main.querySelectorAll('.press-kit-chapters-nav, .press-kit-show-more').length, 0);
});
