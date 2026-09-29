/* global globalThis, MutationObserver */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const { JSDOM } = createRequire(import.meta.url)('jsdom');
const { default: decorate } = await import('./press-kit.js');

function setup(markup, url = 'https://demo.example/en/press-kits/kit') {
  const dom = new JSDOM(`<main>${markup}</main>`, { url });
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

test('the Chapters menu marks the current chapter, not the hub or other chapters', () => {
  const main = setup(`<div class="section press-kit-chapters"><div class="default-content-wrapper"><ul>
      <li><a href="#chapters-links">Chapters</a></li>
      <li><a href="/en/press-kits/kit">Škoda Peaq – Press Kit</a></li>
      <li><a href="/en/press-kits/kit/images">Images</a></li>
      <li><a href="/en/press-kits/kit/videos">Videos</a></li>
    </ul></div></div><div class="section body-column"></div>`, 'https://demo.example/en/press-kits/kit/images/');
  decorate(main);
  assert.deepEqual(
    [...main.querySelectorAll('nav a[aria-current="page"]')].map((a) => a.textContent),
    ['Images'],
  );
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
// A desktop window for the REAL Downloads block (it reads matchMedia for its Media Box
// disclosure), mirroring blocks/downloads/downloads.test.mjs.
function setupWindow(markup, width = 1280) {
  const dom = new JSDOM(`<main>${markup}</main>`, { url: 'https://demo.example/en/press-kits/kit' });
  dom.window.matchMedia = (media) => ({
    matches: width >= Number(media.match(/\d+/)[0]),
    addEventListener() {},
  });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  return dom.window.document.querySelector('main');
}

test('Media Box: the Downloads block alone owns the disclosure and renders file rows as tiles', async () => {
  // As imported: one Downloads table, image rows plus file-only PDF/MP4 rows (SKODA-510).
  const rows = [
    ...Array.from({ length: 30 }, (_, i) => imageRow(i)),
    fileRow('Press kit PDF', 'https://example.com/press.pdf', 'PDF'),
    ...Array.from({ length: 28 }, (_, i) => imageRow(30 + i)),
    fileRow('Launch film', 'https://example.com/film.mp4', 'MP4'),
  ];
  const main = setupWindow(`<div class="section body-column"></div>
    <div class="section media-box"><div class="downloads-wrapper"><div class="downloads">${rows.join('')}</div></div></div>`);
  decorate(main);
  const { default: decorateDownloads } = await import('../../blocks/downloads/downloads.js');
  const block = main.querySelector('.downloads');
  await decorateDownloads(block);
  // What loadBlock does after decorating: page code may wait on this (MutationObserver).
  block.dataset.blockStatus = 'loaded';
  await new Promise((resolve) => { setTimeout(resolve, 0); });

  const section = main.querySelector('.section.media-box');
  assert.equal(section.id, 'media-box', 'anchor for the sidebar "+N" link');
  const toggles = [...section.querySelectorAll('button')]
    .filter((button) => /show (more|less)/i.test(button.textContent));
  assert.equal(toggles.length, 1, 'exactly one disclosure control');
  assert.ok(toggles[0].classList.contains('downloads-more'), 'and it is the Downloads block\'s');
  assert.equal(section.querySelectorAll('.press-kit-show-more, .press-kit-files').length, 0);
  assert.equal(section.querySelectorAll('.downloads-file').length, 2, 'PDF + MP4 render as file tiles');
});

test('Images chapter: each gallery group with `collapse auto` gets its own block disclosure', async () => {
  const group = (from, count) => `<div class="downloads-wrapper"><div class="downloads">
    <div><div>collapse</div><div>auto</div></div>${Array.from({ length: count }, (_, i) => imageRow(from + i)).join('')}</div></div>`;
  const main = setupWindow(`<div class="section body-column"><div class="default-content-wrapper"><h2>Exterior</h2></div>
    ${group(0, 12)}<div class="default-content-wrapper"><h2>Interior</h2></div>${group(12, 3)}</div>
    <div class="section sidebar"></div>`);
  decorate(main);
  const { default: decorateDownloads } = await import('../../blocks/downloads/downloads.js');
  const [exterior, interior] = main.querySelectorAll('.downloads');
  await decorateDownloads(exterior);
  await decorateDownloads(interior);
  assert.equal(exterior.querySelectorAll('.downloads-items > li:not([hidden])').length, 8, 'two rows at 1280');
  assert.equal(interior.querySelectorAll('.downloads-items > li:not([hidden])').length, 3);
  assert.equal(main.querySelectorAll('.downloads-more').length, 1, 'only the group above 8 tiles gets a control');
  assert.ok(exterior.querySelector('.downloads-more'));
  assert.equal(main.querySelectorAll('#media-box, .press-kit-show-more').length, 0);
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
