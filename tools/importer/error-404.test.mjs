/* global globalThis */
/*
 * SKODA-706: import-404 turns a source template-404 variant page into its fragment, on markup
 * shaped like the live /en/youve-reached-a-dead-end/ and /en/welcome-to-our-remote-car-park/
 * (the SiteOrigin photo rules, the .message-mobile + .message-desktop copies).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
// eslint-disable-next-line import/no-extraneous-dependencies
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';

function table(rows, document) {
  const t = document.createElement('table');
  rows.forEach((cells) => {
    const tr = document.createElement('tr');
    cells.forEach((cell) => {
      const td = document.createElement('td');
      td.append(cell);
      tr.append(td);
    });
    t.append(tr);
  });
  return t;
}

globalThis.WebImporter = {
  DOMUtils: { createTable: table },
  rules: { adjustImageUrls() {} },
};

const { default: importer, fragmentPath } = await import('./import-404.js');
const { parseList } = await import('./push/push-lib.mjs');
const { VARIANTS } = await import('../../templates/error-404/error-404.js');

const CDN = 'https://cdn.skoda-storyboard.com/2023/01';
const message = (heading, white, label) => `<div class="error-message"${white ? ' style="color: #ffffff;"' : ''}>
  ${label ? '<div class="subheading">404</div>' : ''}
  <${heading}>You’ve reached a dead end.</${heading}>
  <p>You’re going to have to reverse out of here. A <span class="term-explain" data-explain="{&quot;id&quot;:121796}">rear-view camera</span> might come in handy for that.</p>
  <p>Or return to the <a href="/">homepage</a>.</p>
</div>`;

function sourcePage({ white = false, label = true } = {}) {
  const html = `<html><head><style>
    #pg-135057-0> .panel-row-style { background-image:url(${CDN}/Storyboard_404_1125px_01a.jpg);background-position:center center;background-size:cover }
    #pg-135057-1> .panel-row-style { background-image:url(${CDN}/Storyboard_404_3000px_01a.jpg);background-position:center center;background-size:cover }
  </style></head><body><article class="error-404"><div class="panel-layout">
    <div id="pg-135057-0" class="panel-grid panel-has-style"><div class="message-mobile panel-row-style">${message('h3', white, label)}</div></div>
    <div id="pg-135057-1" class="panel-grid panel-has-style"><div class="message-desktop panel-row-style">${message('h1', white, label)}</div></div>
  </div></article></body></html>`;
  return new JSDOM(html).window.document;
}

function run(document, url) {
  importer.preprocess({ document });
  const [out] = importer.transform({ document, url, params: { originalURL: url } });
  return out;
}

test('a variant page becomes its fragment: photos, label, h1, copy, link, not-found style', () => {
  const url = 'https://www.skoda-storyboard.com/en/youve-reached-a-dead-end/';
  const out = run(sourcePage(), url);
  assert.equal(out.path, '/en/fragments/404/youve-reached-a-dead-end');
  const main = out.element;
  const imgs = [...main.querySelectorAll(':scope > p > img')];
  assert.deepEqual(imgs.map((i) => i.getAttribute('src')), [`${CDN}/Storyboard_404_3000px_01a.jpg`, `${CDN}/Storyboard_404_1125px_01a.jpg`], 'desktop photo, then mobile');
  imgs.forEach((i) => assert.equal(i.getAttribute('alt'), ''));
  assert.deepEqual([...main.children].map((c) => c.tagName), ['P', 'P', 'P', 'H1', 'P', 'P', 'TABLE']);
  assert.equal(main.children[2].textContent, '404', 'the label');
  assert.equal(main.querySelectorAll('h1, h3').length, 1, 'the desktop copy only, as one h1');
  assert.match(main.children[4].textContent, /A rear-view camera might come in handy/);
  assert.equal(main.querySelector('.term-explain, [data-explain]'), null, 'the Škodapedia tooltip unwrapped');
  assert.equal(main.querySelector('a').getAttribute('href'), '/');
  const meta = [...main.querySelectorAll('table td')].map((td) => td.textContent);
  assert.deepEqual(meta, ['Section Metadata', 'Style', 'not-found']);
  assert.equal(main.querySelector('.message-desktop, .message-mobile, .error-message'), null);
});

test('a white message gets the not-found-white style; no label, no label paragraph', () => {
  const url = 'https://www.skoda-storyboard.com/en/welcome-to-our-remote-car-park/';
  const out = run(sourcePage({ white: true, label: false }), url);
  assert.equal(out.path, '/en/fragments/404/welcome-to-our-remote-car-park');
  assert.deepEqual([...out.element.children].map((c) => c.tagName), ['P', 'P', 'H1', 'P', 'P', 'TABLE']);
  assert.equal([...out.element.querySelectorAll('table td')].at(-1).textContent, 'not-found, not-found-white');
  assert.equal(out.report.white, true);
});

test('a page without the message fails loudly', () => {
  const { document } = new JSDOM('<body><p>Nothing here</p></body>').window;
  assert.throws(() => run(document, 'https://www.skoda-storyboard.com/en/x/'), /no \.error-message/);
});

test('the path contract: urls-404.txt imports, paths-404.txt publishes, the template requests', () => {
  const read = (name) => readFileSync(new URL(name, import.meta.url), 'utf8');
  const sources = read('./urls-404.txt').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  const imported = sources.map(fragmentPath);
  const published = parseList(read('./paths-404.txt'));
  const requested = VARIANTS.map((slug) => `/en/fragments/404/${slug}`);
  assert.deepEqual(imported, requested, 'each source variant page imports to a fragment the 404 requests');
  assert.deepEqual(published, requested, 'push/publish takes exactly those paths (push-lib parseList)');
});
