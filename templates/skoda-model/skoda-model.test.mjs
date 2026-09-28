/*
 * Model page (SKODA-208) — template + block-variant logic, on a jsdom page shaped like
 * the imported model markup (decorated sections, before the blocks decorate).
 * Covers: skoda-model.js (section roles, rail variants, nav build, dropped links,
 * short-page flag), story-rail viewAllLabel / isRailOnlySection, columns decorateStats.
 * Run: node --test templates/skoda-model/skoda-model.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const PAGE = `<main>
  <div class="section hero-image-container"><div class="hero-image-wrapper"><div class="hero-image overlay block">
    <div><div><picture><img src="/h.jpg" alt=""></picture></div></div>
    <div><div><p>Models</p><h1 id="octavia">Octavia</h1></div></div>
  </div></div></div>
  <div class="section"><div class="default-content-wrapper"><ul>
    <li><a href="#model-description">Model Description</a></li>
    <li><a href="#highlights">Key Facts</a></li>
    <li><a href="#technical-data">Technical Data</a></li>
    <li><a href="#bodywork--derivatives">Bodywork / Derivatives</a></li>
    <li><a href="#news">News</a></li>
    <li><a href="#images">Images</a></li>
    <li><a href="#missing">Missing</a></li>
  </ul></div></div>
  <div class="section"><div class="default-content-wrapper"><h2 id="model-description">Model Description</h2><p>Text</p></div></div>
  <div class="section">
    <div class="default-content-wrapper"><h2 id="highlights">Highlights</h2></div>
    <div class="cards-wrapper"><div class="cards key-facts block"></div></div>
    <div class="default-content-wrapper"><h3 id="liftback">Liftback</h3><p><a href="/d.jpg"><picture><img src="/d.jpg" alt=""></picture></a></p></div>
  </div>
  <div class="section">
    <div class="default-content-wrapper"><p><picture><img src="/b.jpg" alt=""></picture></p><h2 id="technical-data">Technical Data</h2></div>
    <div class="columns-wrapper"><div class="columns block"><div>
      <div><p><strong>85 – 110 kW</strong></p><p>Maximum performance</p></div>
      <div><p><strong>4.9 – 5.8 l/100 km</strong></p><p>Fuel consumption</p></div>
      <div><p><strong>n/a</strong></p><p>Other</p></div>
    </div></div></div>
    <div class="default-content-wrapper"><p><a href="/td.pdf">Download PDF</a></p></div>
  </div>
  <div class="section">
    <div class="default-content-wrapper"><h2 id="bodywork--derivatives">Bodywork / Derivatives</h2></div>
    <div class="story-rail-wrapper"><div class="story-rail block"><div><div>template</div><div>skoda_model</div></div></div></div>
  </div>
  <div class="section">
    <div class="default-content-wrapper"><h2 id="news">News</h2><p>Based on tags: Octavia</p></div>
    <div class="story-rail-wrapper"><div class="story-rail block">
      <div><div>template</div><div>press_release</div></div>
      <div><div>viewall</div><div><a href="/en/tag/model/octavia">All</a></div></div>
    </div></div>
  </div>
  <div class="section">
    <div class="default-content-wrapper"><h2 id="images">Images</h2><p>Based on tags: Octavia</p></div>
    <div class="story-rail-wrapper"><div class="story-rail block"><div><div>template</div><div>image</div></div></div></div>
  </div>
</main>`;

function setup(html = PAGE) {
  const { window } = new JSDOM(`<!doctype html><body>${html}</body>`, { url: 'https://example.com/en/skoda-model/octavia' });
  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.CSS = window.CSS || { escape: (s) => s };
  globalThis.CustomEvent = window.CustomEvent;
  globalThis.requestAnimationFrame = (fn) => setTimeout(fn, 0);
  return window.document.querySelector('main');
}

setup();
const { default: decorate } = await import('./skoda-model.js');
const { viewAllLabel, isRailOnlySection } = await import('../../blocks/story-rail/story-rail.js');
const { decorateStats } = await import('../../blocks/columns/columns.js');

test('sections get their roles and the source anchors as aliases', () => {
  const main = setup();
  decorate(main);
  const roles = [...main.querySelectorAll(':scope > .section')].map((s) => [...s.classList].filter((c) => c.startsWith('model-')).join(' '));
  assert.deepEqual(roles, ['', 'model-nav-section', 'model-intro', 'model-highlights', 'model-techdata', 'model-rail', 'model-rail', 'model-rail']);
  assert.ok(main.querySelector('#intro.model-intro'));
  assert.ok(main.querySelector('#keyfacts.model-highlights'));
  assert.ok(main.querySelector('#techdata.model-techdata'));
  assert.ok(main.querySelector('#derivatives.model-rail'));
});

test('hero chip, tech data parts, drawings and rail lead-ins are marked', () => {
  const main = setup();
  decorate(main);
  assert.equal(main.querySelector('.hero-image-badge').textContent, 'Models');
  assert.ok(main.querySelector('.model-techdata .columns').classList.contains('stats'));
  assert.ok(main.querySelector('.model-techdata-download a[href="/td.pdf"]'));
  assert.ok(main.querySelector('.model-techdata-banner picture'));
  assert.ok(main.querySelector('.model-highlights .model-drawing picture'));
  assert.deepEqual([...main.querySelectorAll('.model-rail-subheading')].map((p) => p.textContent), ['Based on tags: Octavia', 'Based on tags: Octavia']);
});

test('rails get their variants from the configured template', () => {
  const main = setup();
  decorate(main);
  const rails = [...main.querySelectorAll('.story-rail')];
  assert.deepEqual(rails.map((r) => [...r.classList].filter((c) => !['story-rail', 'block'].includes(c)).join(' ')), ['center caption', '', 'media caption image']);
});

test('the link list becomes a labelled nav with icons; links without a target are dropped', () => {
  const main = setup();
  decorate(main);
  const nav = main.querySelector('nav.model-nav');
  assert.equal(nav.getAttribute('aria-label'), 'On this page');
  const items = [...nav.querySelectorAll('li')];
  assert.deepEqual(items.map((li) => li.dataset.target), ['model-description', 'highlights', 'technical-data', 'bodywork--derivatives', 'news', 'images']);
  assert.ok(items[0].querySelector('.model-nav-icon.icon-model-description[aria-hidden="true"]'));
  assert.ok(items[5].querySelector('.icon-model-images'));
});

test('an empty rail that removes its section also removes its nav link', () => {
  const main = setup();
  decorate(main);
  const section = main.querySelector('h2#images').closest('.section');
  section.dispatchEvent(new window.CustomEvent('story-rail:empty', { bubbles: true }));
  assert.equal(main.querySelector('li[data-target="images"]'), null);
  assert.ok(main.querySelector('li[data-target="news"]'));
});

test('short pages (no Highlights / Technical Data) are flagged', () => {
  const main = setup(PAGE.replace(/<div class="section">\s*<div class="default-content-wrapper"><h2 id="highlights">[\s\S]*?<\/div>\s*<\/div>\s*(?=<div class="section">\s*<div class="default-content-wrapper"><p><picture>)/, ''));
  main.querySelector('h2#technical-data').closest('.section').remove();
  document.body.classList.remove('model-short');
  decorate(main);
  assert.ok(document.body.classList.contains('model-short'));
});

test('story-rail: the view-all label comes from the authored link text', () => {
  const main = setup();
  const [, news, images] = main.querySelectorAll('.story-rail');
  assert.equal(viewAllLabel(news), 'All');
  assert.equal(viewAllLabel(images), 'View all');
  news.querySelector('a').textContent = 'https://www.skoda-storyboard.com/en/news/';
  assert.equal(viewAllLabel(news), 'View all', 'a pasted URL is not used as the label');
});

test('story-rail: a rail alone with a heading lead-in owns its section; one next to prose does not', () => {
  const main = setup();
  const news = main.querySelector('h2#news').closest('.section');
  assert.equal(isRailOnlySection(news, news.querySelector('.story-rail')), true);
  news.querySelector('.default-content-wrapper').insertAdjacentHTML('beforeend', '<p>More prose</p>');
  assert.equal(isRailOnlySection(news, news.querySelector('.story-rail')), false);
});

test('columns (stats): value and unit are split; other cells are left alone', () => {
  const main = setup();
  const block = main.querySelector('.columns');
  decorateStats(block);
  const cells = [...block.querySelectorAll('.columns-stat')];
  assert.equal(cells.length, 3);
  assert.equal(cells[0].querySelector('.columns-stat-value').textContent, '85 – 110');
  assert.equal(cells[0].querySelector('.columns-stat-unit').textContent, 'kW');
  assert.equal(cells[1].querySelector('.columns-stat-value').textContent, '4.9 – 5.8');
  assert.equal(cells[1].querySelector('.columns-stat-unit').textContent, 'l/100 km');
  assert.equal(cells[2].querySelector('.columns-stat-value'), null);
  assert.equal(cells[2].querySelector('strong').textContent, 'n/a');
});
