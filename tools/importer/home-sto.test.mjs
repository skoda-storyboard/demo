import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

/* global globalThis */

const { JSDOM } = createRequire(import.meta.url)('jsdom');

function table(rows, document) {
  const result = document.createElement('table');
  rows.forEach((cells) => {
    const tr = document.createElement('tr');
    cells.forEach((cell) => {
      const td = document.createElement('td');
      (Array.isArray(cell) ? cell : [cell]).forEach((item) => {
        if (item) td.append(typeof item === 'string' ? document.createTextNode(item) : item);
      });
      tr.append(td);
    });
    result.append(tr);
  });
  return result;
}

globalThis.WebImporter = {
  DOMUtils: {
    createTable: table,
    remove(root, selectors) {
      selectors.forEach((selector) => {
        root.querySelectorAll(selector).forEach((node) => node.remove());
      });
    },
  },
  Blocks: {
    createBlock(document, { name, cells }) {
      return table([[name], ...Object.entries(cells)], document);
    },
    getMetadataBlock(document, cells) {
      return table([['Metadata'], ...Object.entries(cells)], document);
    },
  },
  rules: { transformBackgroundImages() {}, adjustImageUrls() {} },
  FileUtils: { sanitizePath: (path) => path },
};

const { default: importer } = await import('./import-home-sto.js');

test('Storyboard home imports index promo settings, a complementary feed, and separate news band', () => {
  const source = 'https://www.skoda-storyboard.com/en/';
  const { document } = new JSDOM(`<html><head><title>Storyboard</title>
    <link rel="canonical" href="${source}"></head>
    <body class="page-template-template-homepage">
      <section class="promo-box"><div class="items">${[1, 2, 3].map((i) => `
        <div class="item"><article class="promo-box-item">
          <a href="/en/story-${i}"><img src="https://cdn.example/promo-${i}.jpg" alt="Story ${i}"></a>
          <h3>Story ${i}</h3>
        </article></div>`).join('')}</div></section>
      <div class="cover-box"><div class="search-results latest-articles">
        <h3 class="search-results-heading">Latest Stories</h3>
        <article>Old server-rendered story</article>
      </div></div>
      <div class="cover-box"><div class="search-results type-press_release">
        <h3 class="search-results-heading">Latest News</h3>
        <div class="search-results-items"><article>Old server-rendered release</article></div>
      </div></div>
    </body></html>`, { url: source }).window;
  globalThis.document = document;

  const [{ element, path }] = importer.transform({
    document, url: source, params: { originalURL: source },
  });
  const tables = [...element.querySelectorAll('table')];
  const name = (block) => block.querySelector('tr td').textContent.trim();
  const config = (block) => Object.fromEntries([...block.querySelectorAll('tr')].slice(1)
    .map((row) => [...row.querySelectorAll('td')].map((cell) => cell.textContent.trim())));

  assert.equal(path, '/en');
  assert.equal(name(tables[0]), 'Promo Box');
  assert.deepEqual(config(tables[0]), {
    template: 'story',
    path: '/en/',
    limit: '3',
  });
  assert.equal(tables[0].querySelectorAll('img, a').length, 0);
  assert.equal(name(tables[1]), 'Stories');
  assert.deepEqual(config(tables[1]), {
    heading: 'Latest Stories',
    template: 'story',
    path: '/en/',
    offset: '3',
  });
  assert.equal(name(tables[3]), 'Story Rail');
  assert.equal(config(tables[3]).template, 'press_release');
  assert.equal(config(tables[3]).heading, 'Latest News');
  assert.deepEqual(tables.filter((block) => name(block) === 'Section Metadata')
    .map((block) => config(block).style), ['cover-box', 'cover-box']);
  assert.equal(element.querySelectorAll('hr').length, 2);
  assert.equal(element.textContent.includes('Old server-rendered story'), false);
});
