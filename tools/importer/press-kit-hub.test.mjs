/* global globalThis */
import { test } from 'node:test';
import assert from 'node:assert/strict';
// eslint-disable-next-line import/no-extraneous-dependencies
import { JSDOM } from 'jsdom';
import { layoutTileRows } from '../../scripts/cards-tiles.js';

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
  const rowCounts = count === 24 ? [5, 5, 5, 5, 4] : [3, 5, 5];
  let index = 0;
  const items = rowCounts.map((rowCount) => `<div class="panel-grid">${Array.from(
    { length: rowCount },
    () => {
      const tileIndex = index;
      index += 1;
      return `<article class="article-teaser">
      <a href="${tileIndex === 0 ? child : `${root}unimported-${tileIndex}/`}">
        <div class="ratio-container ${tileIndex < 2 && count === 13 ? 'ratio-2x1' : 'ratio-1x1'}">
          ${tileIndex === missingImage ? '' : `<img src="https://cdn.skoda-storyboard.com/${tileIndex}.jpg" alt="">`}
        </div><h2 class="heading">Chapter ${tileIndex + 1}</h2>
      </a></article>`;
    },
  ).join('')}</div>`).join('');
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
    const tokens = [...cards.rows].slice(1).map((row) => row.cells[0].textContent);
    assert.equal(tokens[0], count === 24 ? 'press-square' : 'feature');
    assert.equal(tokens[count - 1], count === 24 ? 'press-quarter' : 'press-square');
    const { mode, tiles } = layoutTileRows(tokens, { pressPage: true });
    assert.equal(mode, 'press');
    assert.equal(tiles.filter((tile) => tile.rowStart).length, count === 24 ? 5 : 3);
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

test('an unsupported source tile row fails before emitting a malformed mosaic', () => {
  const document = page(13);
  document.querySelector('.panel-grid article.article-teaser').remove();
  assert.throws(() => output(document), /tile row 1 has an unsupported layout/);
});

test('an optional introduction is retained before the tile table', () => {
  const { element } = output(page(13, { intro: true }));
  const article = element.querySelector('article');
  assert.equal(article.children[1].tagName, 'HR');
  assert.equal(article.children[2].textContent, 'Kit introduction');
  assert.equal(article.children[3].tagName, 'HR');
  assert.equal(article.querySelectorAll('.panel-grid').length, 0);
});

test('banner alt text follows the link: ZIP, WhatsApp, else the source alt', () => {
  const { element } = output(page(13, { banners: true }));
  assert.deepEqual([...element.querySelectorAll('img')]
    .filter((img) => /wa\.png|zip\.png/.test(img.getAttribute('src')))
    .map((img) => img.alt), ['Follow Škoda Storyboard on WhatsApp', 'Download the press kit ZIP']);

  const other = page(13);
  other.querySelector('.content').insertAdjacentHTML('beforeend', '<div class="widget_sow-editor"><div class="textwidget"><p><a href="https://example.com/configurator"><img src="https://cdn.skoda-storyboard.com/cfg.png" alt="Open the configurator"></a></p></div></div>');
  const { element: labelled } = output(other);
  assert.equal(labelled.querySelector('img[src$="cfg.png"]').alt, 'Open the configurator');

  const unlabelled = page(13);
  unlabelled.querySelector('.content').insertAdjacentHTML('beforeend', '<div class="widget_sow-editor"><div class="textwidget"><p><a href="https://example.com/unknown"><img src="https://cdn.skoda-storyboard.com/x.png"></a></p></div></div>');
  assert.throws(() => output(unlabelled), /banner has no accessible name/);
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
    const tokens = [...cards.rows].slice(1).map((row) => row.cells[0].textContent);
    const starts = layoutTileRows(tokens, { pressPage: true }).tiles
      .filter((tile) => tile.rowStart);
    assert.equal(starts.length, model ? 3 : 5);
  }
});

// Older kits (Enyaq, Superb, Kodiaq, Elroq, Vision O): rows given as source ratios.
function olderKit(rows, { timeline = false } = {}) {
  let index = 0;
  const grids = rows.map((ratios) => `<div class="panel-grid">${ratios.map((ratio) => {
    index += 1;
    return `<article class="article-teaser"><a href="${root}older-${index}/">
      <div class="ratio-container ratio-${ratio}"><img src="https://cdn.skoda-storyboard.com/o${index}.jpg" alt=""></div>
      <h2 class="heading">Chapter ${index}</h2></a></article>`;
  }).join('')}</div>`).join('');
  const x = timeline ? `<div class="widget_sow-editor"><div class="textwidget"><p>
    <a class="twitter-timeline" href="https://twitter.com/skodaautonews">Tweets by skodaautonews</a>
    <script async src="https://platform.twitter.com/widgets.js"></script></p></div></div>` : '';
  return new JSDOM(`<!doctype html><title>Kit</title><body class="single-press_kit">
    <article class="press_kit category-press-kits model-superb" data-publish-date="2023-11-02T08:00:00+01:00">
      <div class="hero"><div class="hero-image"><img src="https://cdn.skoda-storyboard.com/h.jpg" alt="Kit"></div><div class="hero-caption"><h1>Kit</h1></div></div>
      <div class="content">${grids}${x}</div></article></body>`, { url: root }).window.document;
}

test('older kits: 2-wide and 1-wide + 2-square rows become half + quarter tiles', () => {
  const { element } = output(olderKit([
    ['2x1', '1x1', '1x1'], ['1x1', '1x1', '2x1'], ['2x1', '2x1'], ['1x1', '1x1', '1x1', '1x1', '1x1'],
  ]), `${root}new-skoda-enyaq-press-kit-2/`);
  const cards = [...element.querySelectorAll('table')].find((t) => t.rows[0].textContent.includes('Cards'));
  const tokens = [...cards.rows].slice(1).map((row) => row.cells[0].textContent);
  assert.deepEqual(tokens.slice(0, 8), [
    'press-half', 'press-quarter', 'press-quarter',
    'press-quarter', 'press-quarter', 'press-half',
    'press-half', 'press-half',
  ]);
  assert.deepEqual(tokens.slice(8), Array(5).fill('press-square'));
  const starts = layoutTileRows(tokens, { pressPage: true }).tiles.filter((tile) => tile.rowStart);
  assert.equal(starts.length, 4, 'one row per source row');
});

test('older kits: an X timeline widget is dropped, not imported as intro text', () => {
  const { element } = output(olderKit([['2x1', '2x1'], ['1x1', '1x1', '1x1', '1x1']], { timeline: true }));
  assert.equal(element.querySelectorAll('a[href*="twitter.com"], script').length, 0);
  assert.equal(element.textContent.includes('Tweets by'), false);
});

test('a lone wide + square row is still rejected', () => {
  assert.throws(() => output(olderKit([['2x1', '1x1']])), /tile row 1 has an unsupported layout/);
});

test('Threads and Spotify banners are named by their image text', () => {
  const document = page(13);
  document.querySelector('.content').insertAdjacentHTML('beforeend', `
    <div class="widget_sow-editor"><div class="textwidget"><p><a href="https://www.threads.com/@skodagram"><img src="https://cdn.skoda-storyboard.com/EN-THREADS.png" alt=""></a></p></div></div>
    <div class="widget_sow-editor"><div class="textwidget"><p><a href="https://open.spotify.com/episode/5qh"><img src="https://cdn.skoda-storyboard.com/CZ-Threads.jpg" alt=""></a></p></div></div>`);
  const alts = [...output(document).element.querySelectorAll('a[href*="threads"] img, a[href*="spotify"] img')].map((img) => img.alt);
  assert.deepEqual(alts, [
    'Škoda on Threads: the latest news and updates from the world of Škoda',
    'Listen to the #ExploreŠkoda Podcast on Spotify',
  ]);
});
