/* global globalThis */
/*
 * SKODA-839: a model tag page carries its model's featured image (the source home Models card
 * image) as the page image, so the index-driven Models rail shows the source card image.
 * Other archives keep the source's own og:image (or none).
 * Run: node --test tools/importer/category-archive.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

let JSDOM = null;
try {
  // eslint-disable-next-line import/no-unresolved
  ({ JSDOM } = createRequire(import.meta.url)('jsdom'));
} catch { /* jsdom unavailable — DOM tests skip */ }
const skip = JSDOM ? false : 'jsdom not installed — DOM tests skip';

function table(rows, document) {
  const result = document.createElement('table');
  rows.forEach((cells) => {
    const tr = document.createElement('tr');
    cells.forEach((cell) => {
      const td = document.createElement('td');
      if (cell) td.append(typeof cell === 'string' ? document.createTextNode(cell) : cell);
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
      selectors.forEach((s) => root.querySelectorAll(s).forEach((n) => n.remove()));
    },
  },
  Blocks: {
    getMetadataBlock: (document, cells) => table([['Metadata'], ...Object.entries(cells)], document),
  },
  rules: { transformBackgroundImages() {}, adjustImageUrls() {} },
  FileUtils: { sanitizePath: (path) => path },
};

const { default: importer } = await import('./import-category-archive.js');

function importPage(url, head = '') {
  const { document } = new JSDOM(`<html><head><title>Term - Škoda Storyboard</title>
    <link rel="canonical" href="${url}">${head}</head><body class="archive">
    <div class="hero"><img src="https://cdn.skoda-storyboard.com/2025/01/term_banner_2500_480.jpg" alt=""><h1>Term</h1></div>
    <div class="container"><div class="search-results archive-results"><div class="search-results-items">
      <div class="search-results-item"><article class="article-teaser">Card</article></div>
    </div></div></div></body></html>`).window;
  globalThis.document = document; // the sections transformer reads the runner's global document
  const [{ element }] = importer.transform({ document, url, params: { originalURL: url } });
  const meta = [...element.querySelectorAll('table')]
    .find((t) => t.querySelector('td').textContent.trim() === 'Metadata');
  const row = [...meta.querySelectorAll('tr')]
    .find((tr) => tr.firstElementChild.textContent.trim() === 'Image');
  return row ? row.children[1].querySelector('img').getAttribute('src') : null;
}

test('model tag page → its model card image (source home Models card master)', { skip }, () => {
  assert.equal(
    importPage('https://www.skoda-storyboard.com/en/tag/model/elroq/'),
    'https://cdn.skoda-storyboard.com/2024/10/elroq_header_fede6794.jpg',
  );
  assert.equal(
    importPage('https://www.skoda-storyboard.com/en/tag/model/epiq/'),
    'https://cdn.skoda-storyboard.com/2026/05/skoda-epiq-m70-01_1135a598.jpg',
  );
});

test('the card image wins over a source og:image on a model tag page', { skip }, () => {
  assert.equal(
    importPage('https://www.skoda-storyboard.com/en/tag/model/peaq/', '<meta property="og:image" content="https://cdn.x/share.jpg">'),
    'https://cdn.skoda-storyboard.com/2026/06/Navrh-bez-nazvu-21_ec34da00.png',
  );
});

test('a model tag page without a source home card keeps no page image', { skip }, () => {
  assert.equal(importPage('https://www.skoda-storyboard.com/en/tag/model/kylaq/'), null);
});

test('other archives keep the source og:image (or none)', { skip }, () => {
  assert.equal(importPage('https://www.skoda-storyboard.com/en/category/emobility/'), null);
  assert.equal(
    importPage('https://www.skoda-storyboard.com/en/tag/years/2026/', '<meta property="og:image" content="https://cdn.x/share.jpg">'),
    'https://cdn.x/share.jpg',
  );
});
