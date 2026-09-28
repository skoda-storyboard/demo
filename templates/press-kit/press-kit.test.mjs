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

// Authored Downloads rows as they come from DA (contract `downloads`): image rows and
// file-only rows with an empty picture cell.
function imageRow(i) {
  return `<div><div><picture><img src="https://example.com/${i}.jpg" alt="Asset ${i}"></picture></div><div>Asset ${i}</div>
    <div><p><a href="https://example.com/${i}.jpg">Original</a></p><p><a href="https://example.com/${i}-1920.jpg">1920px</a></p></div></div>`;
}
function fileRow(title, href, label) {
  return `<div><div></div><div>${title}</div><div><p><a href="${href}">${label}</a></p></div></div>`;
}
// What the Downloads block does: one tile per image row, file-only rows dropped.
function loadDownloads(block) {
  const list = block.ownerDocument.createElement('ul');
  list.className = 'downloads-items';
  [...block.children].filter((row) => row.querySelector('img')).forEach(() => {
    list.append(block.ownerDocument.createElement('li'));
  });
  block.replaceChildren(list);
  block.dataset.blockStatus = 'loaded';
}

test('60-asset Media Box collapses to 8 tiles and lists file-only rows after Show more', async () => {
  const rows = [
    ...Array.from({ length: 30 }, (_, i) => imageRow(i)),
    fileRow('Press kit PDF', 'https://example.com/press.pdf', 'PDF'),
    ...Array.from({ length: 25 }, (_, i) => imageRow(30 + i)),
    fileRow('Launch film', 'https://example.com/film.mp4', 'MP4'),
  ];
  const main = setup(`<div class="section body-column"></div>
    <div class="section media-box"><div class="downloads-wrapper"><div class="downloads">${rows.join('')}</div></div></div>`);
  decorate(main);
  const block = main.querySelector('.downloads');
  loadDownloads(block);
  await new Promise((resolve) => { setTimeout(resolve, 0); });
  const list = block.querySelector('.downloads-items');
  const toggle = main.querySelector('.press-kit-show-more');
  assert.equal(list.querySelectorAll('li:not([hidden])').length, 8);
  const files = main.querySelector('ul.press-kit-files');
  assert.deepEqual([...files.querySelectorAll('a[download]')].map((a) => [a.getAttribute('href'), a.textContent]), [
    ['https://example.com/press.pdf', 'Press kit PDF (PDF)'],
    ['https://example.com/film.mp4', 'Launch film (MP4)'],
  ]);
  assert.ok(toggle.compareDocumentPosition(files) & 4, 'file links follow the Show more control');
  toggle.click();
  assert.equal(list.querySelectorAll('li:not([hidden])').length, 55);
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
});

test('Media Box collapse counts image tiles across multiple Downloads blocks', async () => {
  const main = setup(`<div class="section body-column"></div>
    <div class="section media-box"><div class="downloads">${Array.from({ length: 53 }, (_, i) => imageRow(i)).join('')}</div>
    <div class="downloads">${[imageRow(53), imageRow(54)].join('')}</div></div>`);
  decorate(main);
  main.querySelectorAll('.downloads').forEach(loadDownloads);
  await new Promise((resolve) => { setTimeout(resolve, 0); });
  assert.equal(main.querySelectorAll('.downloads-items > li:not([hidden])').length, 8);
  assert.equal(main.querySelectorAll('.press-kit-files').length, 0, 'no file rows, no file list');
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
