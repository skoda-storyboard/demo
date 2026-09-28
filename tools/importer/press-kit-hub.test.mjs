/* global globalThis */
import { test } from 'node:test';
import assert from 'node:assert/strict';
// eslint-disable-next-line import/no-extraneous-dependencies
import { JSDOM } from 'jsdom';

function table(rows, document) {
  const t = document.createElement('table');
  rows.forEach((cells) => {
    const tr = document.createElement('tr');
    cells.forEach((cell) => {
      const td = document.createElement('td');
      (Array.isArray(cell) ? cell : [cell]).forEach((item) => {
        if (item !== undefined && item !== '') td.append(item);
      });
      tr.append(td);
    });
    t.append(tr);
  });
  return t;
}

globalThis.WebImporter = {
  DOMUtils: { createTable: table },
  Blocks: {
    createBlock: (doc, { name, cells }) => table([[name], ...Object.entries(cells)], doc),
    getMetadataBlock: (doc, cells) => table([['Metadata'], ...Object.entries(cells)], doc),
  },
  rules: { transformBackgroundImages() {}, adjustImageUrls() {} },
  FileUtils: { sanitizePath: (p) => p },
};

const { default: importer } = await import('./import-press-kit-hub.js');
const root = 'https://www.skoda-storyboard.com/en/press-kits/';
const child = `${root}skoda-peaq-press-kit-2/the-skoda-peaq-skodas-new-flagship-expands-the-brands-electric-portfolio/`;

function page(count, { banners = false, intro = false, missingImage = -1 } = {}) {
  const items = Array.from({ length: count }, (_, index) => `
    <div class="panel-grid"><article class="article-teaser">
      <a href="${index === 0 ? child : `${root}unimported-${index}/`}">
        <div class="ratio-container ${index < 2 && count === 13 ? 'ratio-2x1' : 'ratio-1x1'}">
          ${index === missingImage ? '' : `<img src="https://cdn.skoda-storyboard.com/${index}.jpg" alt="">`}
        </div><h2 class="heading">Chapter ${index + 1}</h2>
      </a></article></div>`).join('');
  const widgets = `${intro ? '<div class="widget_sow-editor"><div class="textwidget"><p>Kit introduction</p></div></div>' : ''}
  ${banners ? '<div class="widget_sow-editor"><div class="textwidget"><p><a href="http://go.skoda.eu/whatsapp"><img src="https://cdn.skoda-storyboard.com/wa.png"></a></p></div></div><div class="widget_sow-editor"><div class="textwidget"><p><a href="https://cdn.skoda-storyboard.com/kit.zip"><img src="https://cdn.skoda-storyboard.com/zip.png"></a></p></div></div>' : ''}`;
  const doc = new JSDOM(`<!doctype html><title>Press Kit</title><body class="single-press_kit">
    <article class="press_kit category-press-kits ${count === 24 ? 'motorsport-motorsport' : 'model-peaq bodywork-suv'}" data-publish-date="2026-09-21T08:00:00+02:00">
      <div class="hero"><div class="hero-image"><img src="https://cdn.skoda-storyboard.com/hero.jpg" alt="Press Kit"></div><div class="hero-caption"><h1>Press Kit</h1><p class="perex">Perex</p></div></div>
      <div class="content">${items}${widgets}</div></article></body>`, { url: root });
  return doc.window.document;
}

function output(document, url = `${root}skoda-peaq-press-kit-2/`) {
  return importer.transform({
    document,
    url,
    params: { originalURL: url },
  })[0];
}

function blocks(element) {
  return [...element.querySelectorAll('table')].map((t) => t.rows[0].textContent.trim());
}

test('all three hub counts retain ordered pinned tiles and source metadata', () => {
  for (const count of [13, 13, 24]) {
    const { element, path } = output(page(count, { banners: count !== 24 }));
    const cards = [...element.querySelectorAll('table')].find((t) => t.rows[0].textContent.includes('Cards'));
    const metadata = [...element.querySelectorAll('table')].find((t) => t.rows[0].textContent.trim() === 'Metadata');
    assert.equal(path, '/en/press-kits/skoda-peaq-press-kit-2');
    assert.equal(cards.rows.length, count + 1);
    assert.equal(cards.rows[1].cells[0].textContent, count === 24 ? 'sq' : 'feature');
    assert.equal(cards.rows[1].cells[2].textContent, 'Chapter 1');
    assert.equal(cards.rows[count].cells[2].textContent, `Chapter ${count}`);
    assert.match(metadata.textContent, /2026-09-21/);
    assert.match(metadata.textContent, /press_kit/);
    assert.equal(element.querySelectorAll('h1').length, 1);
    assert.equal(element.querySelectorAll('a[href$=".zip"]').length, count === 24 ? 0 : 1);
    assert.ok(blocks(element).includes('Hero Image (overlay)'));
  }
});

test('the imported child becomes an internal link; other children stay on the source', () => {
  const { element } = output(page(13));
  const { rows } = [...element.querySelectorAll('table')].find((t) => t.rows[0].textContent.includes('Cards'));
  assert.equal(rows[1].querySelector('a').getAttribute('href'), new URL(child).pathname.replace(/\/$/, ''));
  assert.equal(rows[2].querySelector('a').getAttribute('href'), `${root}unimported-1/`);
});

test('a missing chapter image fails explicitly', () => {
  assert.throws(() => output(page(13, { missingImage: 2 })), /tile 3 needs a link, image and title/);
});

test('an optional introduction is retained before the tile table', () => {
  const { element } = output(page(13, { intro: true }));
  const article = element.querySelector('article');
  assert.equal(article.children[1].tagName, 'HR');
  assert.equal(article.children[2].textContent, 'Kit introduction');
  assert.equal(article.children[3].tagName, 'HR');
  assert.equal(article.querySelectorAll('.panel-grid').length, 0);
});

test('live SSR hubs retain exact chapter titles, dates, facets and banner assets', {
  skip: !process.env.SKODA_PRESS_KIT_LIVE,
}, async () => {
  for (const [slug, count, model] of [
    ['skoda-peaq-press-kit-2', 13, 'peaq'],
    ['skoda-epiq-press-kit-2', 13, 'epiq'],
    ['125-years-of-skoda-motorsport-press-kit', 24, ''],
  ]) {
    const url = `${root}${slug}/`;
    const response = await fetch(url);
    assert.equal(response.status, 200, url);
    const { document } = new JSDOM(await response.text(), { url }).window;
    const headings = [...document.querySelectorAll(
      'article.press_kit > .content .panel-grid article.article-teaser .heading',
    )]
      .map((heading) => heading.textContent.trim());
    const { element, path } = output(document, url);
    const cards = [...element.querySelectorAll('table')]
      .find((t) => t.rows[0].textContent.trim() === 'Cards (overlay, tiles)');
    const metadata = [...element.querySelectorAll('table')]
      .find((t) => t.rows[0].textContent.trim() === 'Metadata');
    const meta = Object.fromEntries([...metadata.rows].slice(1)
      .map((row) => [row.cells[0].textContent.trim(), row.cells[1].textContent.trim()]));
    assert.equal(path, `/en/press-kits/${slug}`);
    assert.equal(cards.rows.length, count + 1);
    const titles = [...cards.rows].slice(1).map((row) => row.cells[2].textContent.trim());
    assert.deepEqual(titles, headings);
    assert.equal(meta.template, 'press_kit');
    assert.equal(meta.category, 'press-kits');
    assert.match(meta.publisheddate, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(meta.model || '', model);
    assert.equal(element.querySelectorAll('a[href$=".zip"]').length, model ? 1 : 0);
    assert.equal(element.querySelectorAll('h1').length, 1);
    assert.equal(element.querySelectorAll('.panel-grid, .so-panel').length, 0);
    assert.equal([...cards.rows].slice(1).filter((row) => row.cells[0].textContent === 'feature').length, model ? 2 : 0);
  }
});
