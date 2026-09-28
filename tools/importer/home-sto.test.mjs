/* global globalThis */
/*
 * SKODA-611a: the Storyboard home importer keeps the source's 9-band stack —
 * promo, then one section per `.cover-box` (light `cover-box`, dark
 * `cover-box, dark`) — and the Latest Stories feed keeps its authored offset.
 * The fixture mirrors the live /en/ band order (measured 2026-09-28).
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
      selectors.forEach((s) => root.querySelectorAll(s).forEach((n) => n.remove()));
    },
  },
  Blocks: {
    createBlock: (document, { name, cells }) => table([[name], ...Object.entries(cells)], document),
    getMetadataBlock: (document, cells) => table([['Metadata'], ...Object.entries(cells)], document),
  },
  rules: { transformBackgroundImages() {}, adjustImageUrls() {} },
  FileUtils: { sanitizePath: (path) => path },
};

const { default: importer } = await import('./import-home-sto.js');

const rail = (cls, heading, href) => `<div class="cover-box${cls ? ` ${cls}` : ''}">
  <div class="search-results type-post"><div class="search-results-container">
    <header class="search-results-header"><h3 class="search-results-heading">${heading}</h3>
      <a class="search-results-header-link" href="${href}">All</a></header>
    <div class="search-results-items"><div class="search-results-item"><article>
      <h3 class="entry-title">${heading} story</h3></article></div></div></div></div></div>`;
const social = ['skodaglobal', 'skodagram', 'skoda'].map((h, i) => `<div class="search-results-item"><article>
  <a class="article-teaser-media" href="https://social${i}.example/${h}/"><h3 class="entry-title">@${h}</h3></a>
  </article></div>`).join('');

const SOURCE = 'https://www.skoda-storyboard.com/en/';
const HTML = `<html><head><title>Škoda Storyboard</title></head><body><main>
  <section class="promo-box"><div class="items">${[1, 2, 3].map((i) => `<div class="item">
    <article class="promo-box-item"><a href="/en/promo-${i}/"><img src="https://cdn.example/p${i}.jpg" alt="Promo ${i}"></a>
    <h3 class="entry-title"><a href="/en/promo-${i}/">Promo ${i}</a></h3></article></div>`).join('')}</div></section>
  <div class="cover-box"><div class="search-results latest-articles"><div class="search-results-container">
    <header class="search-results-header"><h3 class="search-results-heading">Latest Stories</h3></header>
    <div class="search-results-items"><article><h3>Server-rendered story</h3></article></div>
    <div class="ajax-loader-button-wrapper"><button class="ajax-loader-button">Load more</button></div>
  </div></div></div>
  <style>.x{color:red}</style>
  <div class="cover-box dark socials-static"><div class="search-results type-post type-social">
    <div class="search-results-container"><header class="search-results-header">
      <h3 class="search-results-heading">Social media</h3></header>
    <div class="search-results-items">${social}</div></div></div></div>
  <div class="cover-box"><div class="search-results type-skoda_model"><div class="search-results-container">
    <header class="search-results-header"><h3 class="search-results-heading">Models</h3></header>
    <div class="search-results-items"><article><h3>Elroq</h3></article></div></div></div></div>
  ${rail('', 'eMobility', '/en/category/emobility/')}
  ${rail('', 'Lifestyle', '/en/category/lifestyle/')}
  ${rail('', 'Škoda World', '/en/category/skoda-world/')}
  ${rail('dark', 'Series', '/en/series-2/')}
  ${rail('', 'Latest News', '/en/news/')}
</main></body></html>`;

const name = (t) => t.rows[0].cells[0].textContent.trim();
const config = (t) => Object.fromEntries([...t.rows].slice(1)
  .map((r) => [r.cells[0].textContent.trim().toLowerCase(), r.cells[1]?.textContent.trim()]));

// split the imported body at its <hr> breaks: one entry per DA section
function sections(root) {
  const out = [[]];
  [...root.querySelectorAll('hr, table, h2')].forEach((el) => {
    if (el.tagName === 'HR') out.push([]);
    else if (el.tagName === 'H2') out.at(-1).push(`h2:${el.textContent.trim()}`);
    else if (!el.parentElement.closest('table')) {
      const n = name(el);
      if (n === 'Section Metadata') out.at(-1).push(`[${config(el).style}]`);
      else if (n === 'Story Rail' || n === 'Stories') out.at(-1).push(`${n}:${config(el).heading}`);
      else if (n !== 'Metadata') out.at(-1).push(n);
    }
  });
  return out.map((s) => s.join(' '));
}

test('Storyboard home imports the 9-band stack in source order, dark Social + Series', { skip }, () => {
  const { document } = new JSDOM(HTML, { url: SOURCE }).window;
  globalThis.document = document;
  const [{ element, path }] = importer.transform({
    document, url: SOURCE, params: { originalURL: SOURCE },
  });
  assert.equal(path, '/en');
  assert.deepEqual(sections(element), [
    'Cards (promo)',
    'Stories:Latest Stories [cover-box]',
    'h2:Social media Cards (social) [cover-box, dark]',
    'Story Rail:Models [cover-box]',
    'Story Rail:eMobility [cover-box]',
    'Story Rail:Lifestyle [cover-box]',
    'Story Rail:Škoda World [cover-box]',
    'Story Rail:Series [cover-box, dark]',
    'Story Rail:Latest News [cover-box]',
  ]);
  const cards = [...element.querySelectorAll('table')].find((t) => name(t) === 'Cards (social)');
  assert.equal(cards.rows.length - 1, 3, 'three profile tiles');
});

test('the Latest Stories feed keeps the authored offset (promo posts excluded)', { skip }, () => {
  const { document } = new JSDOM(HTML, { url: SOURCE }).window;
  globalThis.document = document;
  const [{ element }] = importer.transform({
    document, url: SOURCE, params: { originalURL: SOURCE },
  });
  const stories = [...element.querySelectorAll('table')].find((t) => name(t) === 'Stories');
  assert.deepEqual(config(stories), {
    heading: 'Latest Stories', template: 'story', path: '/en/', offset: '3',
  });
  assert.equal(element.textContent.includes('Server-rendered story'), false);
  assert.equal(element.textContent.includes('Load more'), false);
});
