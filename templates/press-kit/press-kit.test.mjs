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

// #275: an accordion answer's image cells, the source's two-cell rows
const ANSWER = (cells) => `<div class="section body-column"><div class="accordion-wrapper"><div class="accordion">
  <div><div><h2>Largest model</h2></div><div>${cells}</div></div></div></div></div>`;
const IMG = (name) => `<p><a href="https://cdn.example/${name}.jpg"><picture><img src="./${name}.jpg" alt="${name}"></picture></a></p>`;
const LINKS = '<p><a href="/one.pdf">PDF download</a> <a href="/one.jpg">JPG download</a></p>';

test('accordion images pair with their download links, two or more in a row become one media row (#275)', () => {
  const main = setup(ANSWER(`<p>Intro text</p>${IMG('a')}${LINKS}${IMG('b')}<p>After text</p>`));
  decorate(main);
  const cell = main.querySelector('.accordion > div > div:nth-child(2)');
  assert.deepEqual([...cell.children].map((el) => el.className || el.tagName), ['P', 'press-kit-media-row', 'P']);
  const media = [...cell.querySelectorAll('.press-kit-media-row > .press-kit-media')];
  assert.equal(media.length, 2);
  assert.deepEqual([...media[0].children].map((el) => el.className), ['press-kit-media-image', 'press-kit-media-links']);
  assert.deepEqual([...media[1].children].map((el) => el.className), ['press-kit-media-image']);
  assert.equal(cell.lastElementChild.textContent, 'After text', 'text after the row stays where it was');
});

test('a lone image, an image with text and a links paragraph with text are not media cells (#275)', () => {
  const main = setup(ANSWER(`${IMG('a')}<p>Text</p><p><a href="/x.jpg"><picture><img src="./x.jpg" alt=""></picture></a> caption</p>${IMG('b')}<p><a href="/b.pdf">PDF download</a> and more</p>`));
  decorate(main);
  assert.equal(main.querySelector('.press-kit-media-row'), null);
  assert.equal(main.querySelector('.press-kit-media-links'), null);
});

const SIDEBAR = `<div class="section sidebar"><div class="default-content-wrapper"><h3>Additional info</h3><ul>
  <li><a href="https://www.skoda-storyboard.com/en/contacts/">Media contacts</a></li>
  <li><a href="#media-box">Download Media Box</a></li></ul></div></div>`;

test('the sidebar "Download Media Box" row is the label and a + that drives the Media Box group toggle (#275)', async () => {
  const main = setup(`<div class="section body-column"></div>${SIDEBAR}
    <div class="section media-box"><div class="downloads-wrapper"><div class="downloads"></div></div></div>`);
  decorate(main);
  const row = main.querySelector('.press-kit-media-box-row');
  assert.equal(row.querySelector('a[href="#media-box"]'), null);
  assert.equal(row.querySelector('span').textContent, 'Download Media Box');
  const add = row.querySelector('button.press-kit-action.add');
  assert.equal(add.getAttribute('aria-label'), 'Add all files to the media cart');
  assert.equal(add.getAttribute('aria-disabled'), 'true', 'inert until the Media Box toggle exists');
  add.click(); // no toggle yet: nothing happens, nothing throws
  // the Downloads block adds its group toggle later; the + follows its state and clicks it
  const toggle = document.createElement('button');
  toggle.className = 'downloads-add downloads-add-all';
  let clicks = 0;
  toggle.addEventListener('click', () => { clicks += 1; });
  main.querySelector('.downloads').append(toggle);
  toggle.setAttribute('aria-pressed', 'true');
  toggle.toggleAttribute('data-in-cart', true);
  await new Promise((resolve) => { setTimeout(resolve, 0); });
  assert.equal(add.getAttribute('aria-pressed'), 'true');
  assert.ok(add.hasAttribute('data-in-cart'));
  assert.equal(add.hasAttribute('aria-disabled'), false);
  add.click();
  assert.equal(clicks, 1);
});

test('without a Media Box the sidebar keeps its "Download Media Box" link (#275)', () => {
  const main = setup(`<div class="section body-column"></div>${SIDEBAR}`);
  decorate(main);
  assert.ok(main.querySelector('.section.sidebar a[href="#media-box"]'));
  assert.equal(main.querySelector('.press-kit-action'), null);
});

test('a clip\'s "Download video" link becomes add / download / open controls; other links stay (#275)', () => {
  const clip = 'https://dam.example/content/dam/clip.mp4';
  const main = setup(`<div class="section body-column">
    <div class="embed-wrapper"><div class="embed"><div><div>url</div><div><a href="${clip}">Covered Drive</a></div></div></div></div>
    <div class="default-content-wrapper"><p><a href="${clip}" title="Download video">Download video</a></p></div>
    <div class="embed-wrapper"><div class="embed"><div><div>url</div><div><a href="https://www.youtube.com/watch?v=x">Clip</a></div></div></div></div>
    <div class="default-content-wrapper"><p><a href="/brochure.pdf">Brochure</a></p></div></div>`);
  decorate(main);
  const [toolbar, other] = main.querySelectorAll('.embed-wrapper + .default-content-wrapper > p');
  assert.ok(toolbar.classList.contains('press-kit-actions'));
  const controls = [...toolbar.children];
  assert.deepEqual(controls.map((el) => `${el.tagName} ${el.classList[1]}`), ['BUTTON add', 'A download', 'A link']);
  assert.deepEqual(controls.map((el) => el.getAttribute('aria-label')), [
    'Add to media cart: Covered Drive', 'Download Covered Drive', 'Open Covered Drive']);
  assert.equal(controls[0].getAttribute('aria-disabled'), 'true', 'disabled until the cart binds it');
  assert.equal(controls[1].getAttribute('href'), clip);
  assert.equal(controls[1].getAttribute('download'), '');
  assert.equal(other.textContent, 'Brochure');
  assert.equal(other.classList.contains('press-kit-actions'), false);
});
