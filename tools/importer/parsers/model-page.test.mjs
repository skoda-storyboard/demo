/* global globalThis */
/*
 * Unit tests for the SKODA-208 model-page importer (parsers hero, key-facts, spec-table,
 * story-rail, in-page-nav + the import-model-page.js orchestration).
 * Run: node --test tools/importer/parsers/model-page.test.mjs
 *
 * The corpus test runs the whole importer over the 22 saved EN source pages in
 * .migration/model-probe/en/ (untracked; fetched from skoda_model-sitemap.xml) and skips
 * when they are absent. jsdom is resolved like archive.test.mjs; DOM tests skip without it.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let JSDOM = null;
try {
  // eslint-disable-next-line import/no-unresolved
  ({ JSDOM } = createRequire(import.meta.url)('jsdom'));
} catch { /* jsdom unavailable — skip */ }
const skip = JSDOM ? false : 'jsdom not installed — DOM tests skip';

function createTable(rows, doc) {
  const table = doc.createElement('table');
  rows.forEach((cells) => {
    const tr = doc.createElement('tr');
    cells.forEach((c) => {
      const td = doc.createElement('td');
      (Array.isArray(c) ? c : [c]).forEach((n) => {
        if (n === '' || n == null) return;
        td.append(typeof n === 'string' ? doc.createTextNode(n) : n);
      });
      tr.append(td);
    });
    table.append(tr);
  });
  return table;
}
globalThis.WebImporter = {
  DOMUtils: {
    createTable,
    remove(el, sels) { sels.forEach((s) => el.querySelectorAll(s).forEach((n) => n.remove())); },
  },
  Blocks: {
    createBlock(doc, { name, cells }) {
      return createTable([[name], ...Object.entries(cells)], doc);
    },
    getMetadataBlock(doc, meta) { return createTable([['Metadata'], ...Object.entries(meta)], doc); },
  },
  rules: { transformBackgroundImages() {}, adjustImageUrls() {} },
  FileUtils: { sanitizePath: (p) => p },
};

const { default: hero } = await import('./hero.js');
const { default: keyFacts } = await import('./key-facts.js');
const { default: specTable } = await import('./spec-table.js');
const { default: storyRail } = await import('./story-rail.js');
const { default: inPageNav } = await import('./in-page-nav.js');

function page(body, url = 'https://www.skoda-storyboard.com/en/skoda-model/new-kodiaq/') {
  const d = new JSDOM(`<html><head><link rel="canonical" href="${url}"></head><body>${body}</body></html>`);
  globalThis.document = d.window.document;
  return d.window.document;
}
const blockName = (t) => t.querySelector('tr td').textContent.trim();
const rows = (t) => [...t.querySelectorAll('tr')].slice(1).map((tr) => [...tr.children].map((td) => td.textContent.trim()));

const HERO = `<article class="skoda_model"><div class="carousel slide"><div class="carousel-inner"><div class="item active">
  <div class="image-wrapper"><img src="https://cdn.x/2023/11/Kodiaq_header-1920x730.png" alt="h"></div>
  <div class="carousel-caption"><div class="entry-body"><div class="entry-meta"><span class="label label-secondary">Models</span></div>
  <div class="entry-title-and-summary"><h1 class="entry-title"> Kodiaq </h1><div class="entry-summary"><p>Model Description The …</p></div></div>
</div></div></div></div></div></article>`;

test('hero → Hero Image (overlay): image, then chip + h1; the teaser is dropped', { skip }, () => {
  const doc = page(HERO);
  hero(doc.querySelector('.carousel'), { document: doc });
  const t = doc.querySelector('table');
  assert.equal(blockName(t), 'Hero Image (overlay)');
  assert.ok(t.querySelector('tr:nth-child(2) img'));
  assert.deepEqual([...t.querySelectorAll('tr:nth-child(3) td > *')].map((n) => `${n.tagName}:${n.textContent}`), ['P:Models', 'H1:Kodiaq']);
  assert.doesNotMatch(doc.body.textContent, /Model Description The/);
});

const HIGHLIGHTS = `<div class="so-widget-ys-so-widget-highlights"><h2>Key Highlights</h2><div class="items">
  <div class="item"><div class="item-image"><h3 class="item-title">Design</h3><img src="https://cdn.x/d.png"></div>
    <div class="item-text"><h3 class="item-title">Design</h3><p>Modern Solid.</p></div></div>
  <div class="item"><div class="item-image"><h3 class="item-title">7 seats</h3><img src="https://cdn.x/s.png"></div>
    <div class="item-text"><h3 class="item-title">7 seats</h3><p>Family.</p></div></div>
</div></div>`;

test('key-facts → tagged h2 + Cards (key-facts), one title per card', { skip }, () => {
  const doc = page(HIGHLIGHTS);
  keyFacts(doc.querySelector('.so-widget-ys-so-widget-highlights'), { document: doc });
  const h2 = doc.querySelector('h2');
  assert.equal(h2.textContent, 'Key Highlights');
  assert.equal(h2.getAttribute('data-model-key'), 'keyfacts');
  const t = doc.querySelector('table');
  assert.equal(blockName(t), 'Cards (key-facts)');
  assert.deepEqual(rows(t), [['', 'DesignModern Solid.'], ['', '7 seatsFamily.']]);
  assert.equal(t.querySelectorAll('img').length, 2);
  assert.equal(t.querySelectorAll('h3').length, 2);
});

const TECH = `<div class="so-widget-ys-so-widget-techdata"><div class="bg-image"><img src="https://cdn.x/kodiaq_da5f6f1a.jpg"></div>
  <h2>Technical data</h2><div class="items">
  ${['110 – 142|kW|Maximum performance', '250 – 400|Nm|Maximum torque', '203 – 220|km/h|Maximum speed', '7.8 – 9.9|s|Acceleration']
    .map((s) => s.split('|')).map(([v, u, l]) => `<div class="item"><span class="item-value">${v}</span> <span class="item-unit">${u}</span> <span class="item-title">${l}</span></div>`).join('')}
  </div><div class="buttons"><a class="btn" href="https://cdn.skoda-storyboard.com/2024/04/TD-Kodiaq-en_eda330ec.pdf"><span>Download PDF</span></a></div></div>`;

test('tech data → band image, tagged h2, Columns (3 stat cells a row, padded), PDF link; never Spec Table', { skip }, () => {
  const doc = page(`<div id="w">${TECH}</div>`);
  specTable(doc.querySelector('.so-widget-ys-so-widget-techdata'), { document: doc });
  const kids = [...doc.querySelector('#w').children].map((n) => n.tagName);
  assert.deepEqual(kids, ['P', 'H2', 'TABLE', 'P']);
  assert.ok(doc.querySelector('#w > p:first-child img[src*="kodiaq_da5f6f1a"]'));
  assert.equal(doc.querySelector('h2').getAttribute('data-model-key'), 'techdata');
  const t = doc.querySelector('table');
  assert.equal(blockName(t), 'Columns');
  assert.deepEqual(rows(t), [
    ['110 – 142 kWMaximum performance', '250 – 400 NmMaximum torque', '203 – 220 km/hMaximum speed'],
    ['7.8 – 9.9 sAcceleration', '', ''],
  ]);
  assert.ok(t.querySelector('strong'));
  assert.match(doc.querySelector('#w > p:last-child a').getAttribute('href'), /TD-Kodiaq-en_eda330ec\.pdf$/);
});

const rail = (id, type, { all = true, sub = 'Based on tags: Kodiaq, SUV', q = 'filter[model]%5B0%5D=kodiaq&amp;filter[bodywork]%5B0%5D=suv' } = {}) => `<div id="${id}"><div class="search-results type-${type}"><div class="search-results-container">
  <header class="search-results-header"><h3 class="search-results-heading">${id === 'press-kits' ? 'Press Kits' : id[0].toUpperCase() + id.slice(1)} ${sub ? `<span class="subheading">${sub}</span>` : ''}</h3>
  ${all ? `<a class="btn-ghost-compact search-results-header-link" href="https://www.skoda-storyboard.com/en/${id}/?${q}">All</a>` : ''}</header>
  <div class="search-results-items"><div class="search-results-item"><article class="article-teaser">SSR card</article></div></div></div></div></div>`;

test('tag rail → h2 + subheading as default content, facets + viewall from its All link; no heading/subheading keys', { skip }, () => {
  const doc = page(rail('news', 'press_release'));
  storyRail(doc.querySelector('#news .search-results-container'), { document: doc });
  const h2 = doc.querySelector('h2');
  assert.equal(h2.textContent, 'News');
  assert.equal(h2.getAttribute('data-model-key'), 'news');
  assert.equal(doc.querySelector('h2 + p').textContent, 'Based on tags: Kodiaq, SUV');
  const t = doc.querySelector('table');
  assert.equal(blockName(t), 'Story Rail');
  assert.deepEqual(rows(t), [['template', 'press_release'], ['model', 'kodiaq'], ['bodywork', 'suv'], ['viewall', 'All']]);
  assert.equal(t.querySelector('a').getAttribute('href'), 'https://www.skoda-storyboard.com/en/news/?filter[model][]=kodiaq&filter[bodywork][]=suv');
  assert.doesNotMatch(doc.body.textContent, /SSR card/);
});

test('Stories rail (no All link) borrows the page facets; images get limit 20', { skip }, () => {
  const doc = page(rail('stories', 'post', { all: false }) + rail('images', 'attachment'));
  storyRail(doc.querySelector('#stories .search-results-container'), { document: doc });
  assert.deepEqual(rows(doc.querySelector('table')), [['template', 'story'], ['model', 'kodiaq'], ['bodywork', 'suv']]);
  storyRail(doc.querySelector('#images .search-results-container'), { document: doc });
  assert.deepEqual(rows(doc.querySelectorAll('table')[1]).slice(0, 4), [['template', 'image'], ['model', 'kodiaq'], ['bodywork', 'suv'], ['limit', '20']]);
});

test('a tag rail with no filter anywhere on the page is dropped, not emitted unscoped', { skip }, () => {
  const doc = page(`<main>${rail('news', 'press_release', { all: false })}</main>`);
  storyRail(doc.querySelector('#news .search-results-container'), { document: doc });
  assert.equal(doc.querySelector('table'), null);
});

const DERIV = '<div id="derivatives"><div class="search-results"><div class="search-results-container"><header class="search-results-header"><h3 class="search-results-heading">Bodywork / Derivatives </h3></header></div></div></div>';

test('Bodywork rail: parent page → its derivatives by path; derivative page → the family', { skip }, () => {
  let doc = page(DERIV);
  storyRail(doc.querySelector('.search-results-container'), { document: doc, params: { originalURL: 'https://www.skoda-storyboard.com/en/skoda-model/new-kodiaq/' } });
  assert.deepEqual(rows(doc.querySelector('table')), [['template', 'skoda_model'], ['path', '/en/skoda-model/new-kodiaq/']]);
  assert.equal(doc.querySelector('h2').textContent, 'Bodywork / Derivatives');
  doc = page(DERIV);
  storyRail(doc.querySelector('.search-results-container'), { document: doc, params: { originalURL: 'https://www.skoda-storyboard.com/en/skoda-model/new-kodiaq/kodiaq-rs/' } });
  assert.deepEqual(rows(doc.querySelector('table')), [['template', 'skoda_model'], ['path', '/en/skoda-model/new-kodiaq']]);
});

const NAV = `<div class="model-nav"><ul class="nav">
  ${['intro|Model Description', 'keyfacts|Key Facts', 'techdata|Technical Data', 'news|News', 'stories|Stories']
    .map((s) => s.split('|')).map(([h, l]) => `<li><a href="#${h}"><svg class="icon"></svg> ${l} </a></li>`).join('')}</ul></div>`;

test('nav → a link list to the emitted headings only; ids follow the pipeline slugger', { skip }, () => {
  const doc = page(`${NAV}<h1>Peaq</h1>
    <div class="so-widget-sow-editor"><h2>Model Description</h2></div>
    <h3>News</h3><h2 data-model-key="news">News</h2><h2 data-model-key="techdata">Bodywork / Technical – data</h2>`);
  inPageNav(doc.querySelector('.model-nav'), { document: doc });
  const links = [...doc.querySelectorAll('ul > li > a')].map((a) => [a.textContent, a.getAttribute('href')]);
  assert.deepEqual(links, [
    ['Model Description', '#model-description'],
    ['Technical Data', '#bodywork--technical--data'],
    ['News', '#news-1'], // the h3 "News" before it takes #news
  ]);
  assert.equal(doc.querySelector('.model-nav'), null);
});

// ---- corpus: the whole importer over the 22 saved source pages -------------------

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const PROBES = path.join(ROOT, '.migration/model-probe/en');
const corpus = existsSync(PROBES) ? readdirSync(PROBES).filter((f) => f.endsWith('.html')) : [];
const corpusSkip = skip || (corpus.length ? false : 'no saved model pages in .migration/model-probe/en');
const ON_MAIN = new Set(['hero-image', 'cards', 'columns', 'story-rail', 'metadata']);

test('corpus: every page emits only blocks on main, no dangling nav link, every source image', { skip: corpusSkip }, async () => {
  const { default: importer } = await import('../import-model-page.js');
  const seen = [];
  corpus.forEach((file) => {
    const slug = file.replace(/\.html$/, '').replace(/__/g, '/');
    const url = `https://www.skoda-storyboard.com/en/skoda-model/${slug}/`;
    const html = readFileSync(path.join(PROBES, file), 'utf8');
    const d = new JSDOM(html, { url });
    globalThis.document = d.window.document;
    const doc = d.window.document;
    const sourceImages = doc.querySelectorAll('article.skoda_model > .carousel .item.active img, article.skoda_model .entry-content img').length;

    const [{ element }] = importer.transform({ document: doc, url, params: { originalURL: url } });
    const names = [...element.querySelectorAll('table')].map((t) => blockName(t).toLowerCase().replace(/\s*\(.*$/, '').replace(/\s+/g, '-'));
    names.forEach((n) => assert.ok(ON_MAIN.has(n), `${slug}: emits ${n}`));
    assert.equal(element.querySelectorAll('[data-model-key]').length, 0, `${slug}: data-model-key leaked`);

    const headingTexts = new Set([...element.querySelectorAll('h2')].map((h) => h.textContent.trim()));
    const links = [...element.querySelectorAll('ul a[href^="#"]')];
    assert.ok(links.length >= 6, `${slug}: ${links.length} nav links`);
    assert.equal(links.length, headingTexts.size, `${slug}: one nav link per section heading`);

    const meta = [...element.querySelectorAll('table')].find((t) => blockName(t) === 'Metadata');
    const metaRows = Object.fromEntries(rows(meta));
    assert.equal(metaRows.template, 'skoda_model');
    assert.doesNotMatch(metaRows.model || '', /new-|-\d|iv-2/, `${slug}: model=${metaRows.model}`);
    const outImages = [...element.querySelectorAll('img')].filter((i) => !meta.contains(i)).length;
    assert.equal(outImages, sourceImages, `${slug}: ${outImages}/${sourceImages} images`);
    seen.push(slug);
  });
  assert.equal(seen.length, corpus.length);
});
