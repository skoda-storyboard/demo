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

test('the Chapters bar moves above the date and title, which become the header', () => {
  const main = setup(`<div class="section"><div class="default-content-wrapper"><p>21. 9. 2026</p><h1>Exterior</h1></div></div>
    <div class="section press-kit-chapters"><div class="default-content-wrapper"><ul>
      <li><a href="#chapters-links">Chapters</a></li><li><a href="/en/press-kits/kit">Kit</a></li>
    </ul></div></div><div class="section body-column"><div class="default-content-wrapper"><p>Body</p></div></div>`);
  decorate(main);
  const sections = [...main.children];
  assert.ok(sections[0].matches('.press-kit-chapters'));
  assert.ok(sections[1].matches('.press-kit-header') && sections[1].querySelector('h1'));
  assert.ok(sections[2].matches('.body-column') && !sections[2].matches('.press-kit-header'));
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

test('a variant chapter (SKODA-808) is marked current in the Chapters menu, in source order', () => {
  const main = setup(`<div class="section press-kit-chapters"><div class="default-content-wrapper"><ul>
      <li><a href="#chapters-links">Chapters</a></li>
      <li><a href="/en/press-kits/skoda-peaq-press-kit-2">Škoda Peaq – Press Kit</a></li>
      <li><a href="/en/press-kits/skoda-peaq-press-kit-2/connectivity">Connectivity</a></li>
      <li><a href="/en/press-kits/skoda-peaq-press-kit-2/the-peaq-sportline-dynamic-inside-and-out">Sportline</a></li>
      <li><a href="/en/press-kits/skoda-peaq-press-kit-2/frequently-asked-questions">Frequently Asked Questions</a></li>
    </ul></div></div><div class="section body-column"></div>`, 'https://demo.example/en/press-kits/skoda-peaq-press-kit-2/the-peaq-sportline-dynamic-inside-and-out');
  decorate(main);
  const links = [...main.querySelectorAll('nav a')];
  assert.deepEqual(links.map((a) => a.textContent), ['Škoda Peaq – Press Kit', 'Connectivity', 'Sportline', 'Frequently Asked Questions']);
  assert.deepEqual(links.filter((a) => a.getAttribute('aria-current') === 'page').map((a) => a.textContent), ['Sportline']);
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
  // rows 3+ stay in the clipped list (their top peeks behind the pill) but are inert
  assert.equal(exterior.querySelectorAll('.downloads-items > li:not([inert])').length, 8, 'two rows at 1280');
  assert.equal(exterior.querySelectorAll('.downloads-items > li[hidden]').length, 0);
  assert.equal(interior.querySelectorAll('.downloads-items > li:not([inert])').length, 3);
  // the control follows the rows (SKODA-830 D2): 3 tiles fit one row at 1280, so the
  // Interior control stays hidden there (it shows once they need a third row)
  const shown = main.querySelectorAll('.downloads-more:not([hidden])');
  assert.equal(shown.length, 1, 'only the group above two rows shows a control');
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

test('the sidebar "+N" link becomes the Gallery (preview) pill data, pointing at the Media Box', () => {
  const main = setup(`<div class="section sidebar"><div class="default-content-wrapper"><h3>Images</h3></div>
    <div class="gallery-wrapper"><div class="gallery preview"><div><div>img</div></div></div></div>
    <div class="default-content-wrapper"><p><a href="#media-box">+51</a></p><h3>Tags</h3></div></div>`);
  decorate(main);
  const gallery = main.querySelector('.gallery.preview');
  assert.equal(gallery.dataset.moreCount, '51');
  assert.equal(gallery.dataset.moreHref, '#media-box');
  assert.equal(main.querySelector('a[href="#media-box"]'), null, 'the separate link is gone');
  assert.ok(main.querySelector('.sidebar h3:last-child'), 'the Tags heading stays');
});

test('an article that carries a tiles mosaic is still an article (header, not a hub)', () => {
  const main = setup(`<div class="section"><div class="default-content-wrapper"><p>9. 12. 2024</p><h1>Elroq kit</h1></div></div>
    <div class="section body-column"><div class="cards-wrapper"><div class="cards overlay tiles"></div></div></div>`);
  decorate(main);
  assert.ok(main.querySelector('.press-kit-header h1'));
});
