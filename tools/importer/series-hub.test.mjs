/* global globalThis */
/*
 * SKODA-207: the Series hub importer (import-series-hub.js) on all 15 hubs, and the
 * series directory (import-series-directory.js) that shares the series-grid parser.
 * Fixtures: test/fixtures/series/<slug>.html (source pages, trimmed of scripts and site
 * chrome; the SiteOrigin layout <style> is kept, it carries the tile widths; test/* is
 * .hlxignore'd). The pipeline runs on jsdom with a minimal WebImporter stub; the output is
 * read the way DA reads it: <hr> = section break, a table = a block (first cell = name).
 * Run: node --test tools/importer/series-hub.test.mjs
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let JSDOM = null;
try {
  const req = createRequire('/home/node/.excat-marketplaces/excat-marketplace/excat/hooks/import-validator/');
  // eslint-disable-next-line import/no-unresolved
  ({ JSDOM } = req('jsdom'));
} catch {
  try {
    const req = createRequire(import.meta.url);
    // eslint-disable-next-line import/no-unresolved
    ({ JSDOM } = req('jsdom'));
  } catch { /* jsdom unavailable — skip */ }
}
const skip = JSDOM ? false : 'jsdom not installed — DOM tests skip';

const FIXTURES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../test/fixtures/series');
const SRC = 'https://www.skoda-storyboard.com/en';

// Source row shapes (SiteOrigin `.panel-grid` rows, cell width % + ratio class, measured on
// the fixtures; the 5 M1 hubs also match docs/ui-specs/series.md §2).
const HUBS = {
  '125-years-of-motorsport': 'sq sq / sq-small wide sq-small / third third third',
  '130-years': 'third third third / sq-small wide sq-small / sq sq / third third third / sq-small wide sq-small',
  'roads-places': 'sq-small wide sq-small / sq sq / third third third / wide wide',
  'unexpected-jobs': 'wide wide / third third third',
  'minutes-from-car-production': 'wide wide / sq-small sq-small wide / wide wide / wide sq-small sq-small / wide wide',
  'road-trip': 'wide wide / wide end',
  'winter-tips': 'third-sq two-thirds / two-thirds third-sq',
  'back-to-the-past': 'wide wide / quarter quarter quarter quarter / third third third / sq-small sq-small wide / quarter quarter quarter quarter / wide sq-small sq-small / third third third',
  'unknown-parts': 'wide wide / banner',
  'hidden-helpers': 'wide wide / third third third / wide wide / third third third / sq-small sq-small wide / wide sq-small sq-small / third third third',
  'czech-footprint': 'wide wide / banner / wide wide',
  'sustainable-mobility': [
    'wide wide', 'wide sq-small sq-small', 'third third third', 'sq-small sq-small sq-small sq-small',
    'third third third', 'wide sq-small sq-small', 'wide wide', 'sq-small sq-small wide', 'wide wide',
    'third third third', 'wide sq-small sq-small', 'sq-small sq-small wide', 'sq-small sq-small sq-small sq-small',
    'wide sq-small sq-small', 'sq-small sq-small wide', 'wide sq-small sq-small', 'third third third',
    'sq-small sq-small wide', 'wide sq-small sq-small', 'third third third', 'sq-small sq-small wide',
    'wide sq-small end', 'wide wide', 'wide sq-small sq-small', 'wide wide', 'wide sq-small sq-small',
    'sq-small sq-small wide', 'wide wide', 'sq-small sq-small wide', 'sq-small sq-small wide',
    'wide sq-small sq-small', 'sq-small sq-small sq-small sq-small', 'banner',
  ].join(' / '),
  'my-life-my-car': 'third-sq third-sq third-sq / banner-tall / wide wide / third-sq third-sq third-sq / wide wide',
  'evolution-of-parts': 'banner / third-sq third-sq third-sq / banner / third-sq third-sq third-sq',
  '60-seconds-walkaround': 'wide wide / third third third / wide wide / third third third / wide wide / wide wide / third third third',
};
// ticket SKODA-207: the M1 census
const M1_COUNTS = {
  '125-years-of-motorsport': 8, '130-years': 14, 'roads-places': 10, 'unexpected-jobs': 5, 'minutes-from-car-production': 12,
};
const SHARE = {
  sq: 6, wide: 6, 'sq-small': 3, quarter: 3, third: 4, 'third-sq': 4, 'two-thirds': 8, banner: 12, 'banner-tall': 12,
};

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
const toRows = (cells) => Object.entries(cells).map(([k, v]) => [k, v]);
globalThis.WebImporter = {
  DOMUtils: {
    remove(el, sels) { sels.forEach((s) => el.querySelectorAll(s).forEach((n) => n.remove())); },
    createTable,
  },
  Blocks: {
    createBlock(doc, { name, cells }) { return createTable([[name], ...toRows(cells)], doc); },
    getMetadataBlock(doc, meta) { return createTable([['Metadata'], ...toRows(meta)], doc); },
  },
  rules: { transformBackgroundImages() {}, adjustImageUrls() {} },
  FileUtils: { sanitizePath: (p) => p },
};

const hub = JSDOM ? (await import('./import-series-hub.js')).default : null;
const directory = JSDOM ? (await import('./import-series-directory.js')).default : null;

const txt = (n) => (n.textContent || '').replace(/\s+/g, ' ').trim();
const blockName = (table) => txt(table.querySelector('tr td'));
const rowsOf = (table) => [...table.querySelectorAll('tr')].slice(1);
// Hosts and the trailing slash differ once SKODA-605 relativises allow-listed links.
const normHref = (h) => (h || '').replace(/^https:\/\/www\.skoda-storyboard\.com/, '').replace(/\/$/, '');

function load(importer, slug, url) {
  const html = readFileSync(path.join(FIXTURES, `${slug}.html`), 'utf8');
  const source = new JSDOM(html).window.document;
  const dom = new JSDOM(html, { url });
  globalThis.document = dom.window.document;
  globalThis.window = dom.window;
  const [{ element, path: pagePath }] = importer.transform({
    document: dom.window.document, url, params: { originalURL: url },
  });
  const tables = [...element.querySelectorAll('table')];
  return {
    source, element, pagePath, tables, find: (name) => tables.find((t) => blockName(t) === name),
  };
}
const cache = {};
const importHub = (slug) => {
  cache[slug] ||= load(hub, slug, `${SRC}/series/${slug}/`);
  return cache[slug];
};

/** Replay the tokens: a row closes at 12/12 or on `end`. */
function replayRows(tokens) {
  const rows = [];
  let cur = [];
  let sum = 0;
  tokens.forEach((token) => {
    const [name, flag] = token.split(' ');
    assert.ok(name in SHARE, `unknown size token "${token}"`);
    cur.push(token);
    sum += SHARE[name];
    assert.ok(sum <= 12, `row overfills at "${token}"`);
    if (sum === 12 || flag === 'end') { rows.push(cur.join(' ')); cur = []; sum = 0; }
  });
  assert.equal(cur.length, 0, `open row at the end: ${cur.join(' ')}`);
  return rows.join(' / ');
}

test('hub: Hero Image (overlay), one Cards (overlay, tiles), Metadata; no Hero / Listing', { skip }, () => {
  Object.keys(HUBS).forEach((slug) => {
    const { element, tables, pagePath } = importHub(slug);
    assert.deepEqual(tables.map(blockName), ['Hero Image (overlay)', 'Cards (overlay, tiles)', 'Metadata'], slug);
    assert.equal(element.querySelectorAll('hr').length, 1, `${slug}: hero | tiles sections`);
    assert.equal(element.querySelectorAll('h1').length, 1, `${slug}: single h1`);
    assert.equal(pagePath, `/en/series/${slug}`);
  });
});

test('hub hero: picture, then Series badge, H1 and standfirst from the source caption', { skip }, () => {
  Object.keys(HUBS).forEach((slug) => {
    const { find, source } = importHub(slug);
    const [media, content] = rowsOf(find('Hero Image (overlay)'));
    assert.ok(media.querySelector('img'), `${slug}: hero image`);
    assert.equal(txt(media), '', `${slug}: image-only media row`);
    const nodes = [...content.querySelector('td').children];
    assert.deepEqual(nodes.map((n) => n.tagName), ['P', 'H1', 'P'], slug);
    assert.equal(txt(nodes[0]), 'Series');
    assert.equal(txt(nodes[1]), txt(source.querySelector('.hero h1')));
    assert.equal(txt(nodes[2]), txt(source.querySelector('.hero .perex')));
  });
});

test('hub tiles: every source tile in DOM order with its title, href and alt', { skip }, () => {
  Object.keys(HUBS).forEach((slug) => {
    const { find, source } = importHub(slug);
    const articles = [...source.querySelectorAll('.panel-layout article.article-teaser[data-content-type]')];
    const rows = rowsOf(find('Cards (overlay, tiles)'));
    assert.equal(rows.length, articles.length, `${slug}: tile count`);
    if (M1_COUNTS[slug]) assert.equal(rows.length, M1_COUNTS[slug], `${slug}: M1 census`);
    rows.forEach((row, i) => {
      const src = articles[i];
      const [token, media, title] = row.children;
      assert.equal(row.children.length, 3, `${slug} #${i + 1}: 3 cells`);
      assert.ok(txt(token), `${slug} #${i + 1}: size token`);
      const img = media.querySelector('img');
      assert.ok(img, `${slug} #${i + 1}: picture`);
      assert.equal(img.getAttribute('alt') ?? '', src.querySelector('img').getAttribute('alt') ?? '');
      const a = title.querySelector('a');
      assert.equal(title.children.length, 1, `${slug} #${i + 1}: one link`);
      assert.equal(txt(a), txt(src.querySelector('h2')), `${slug} #${i + 1}: title`);
      assert.equal(normHref(a.getAttribute('href')), normHref(src.querySelector('a[href]').getAttribute('href')));
    });
  });
});

test('hub tiles: the size tokens replay to the source rows (cards-tiles v2)', { skip }, () => {
  Object.entries(HUBS).forEach(([slug, shape]) => {
    const tokens = rowsOf(importHub(slug).find('Cards (overlay, tiles)')).map((r) => txt(r.children[0]));
    assert.equal(replayRows(tokens), shape, slug);
  });
});

test('130-years keeps its Press Kits tile and the editorial (not date) order', { skip }, () => {
  const { find, source } = importHub('130-years');
  const articles = [...source.querySelectorAll('.panel-layout article.article-teaser')];
  const kit = articles.findIndex((a) => a.dataset.contentType === 'Press Kits');
  assert.equal(kit, 6);
  const rows = rowsOf(find('Cards (overlay, tiles)'));
  assert.match(rows[kit].querySelector('a').getAttribute('href'), /\/en\/press-kits\/skoda-fabia-130-special-edition/);
  const dates = articles.slice(0, 3).map((a) => a.dataset.publishDate.slice(0, 10));
  assert.deepEqual(dates, ['2025-12-17', '2025-11-21', '2025-12-09']);
  assert.equal(txt(rows[2].querySelector('a')), txt(articles[2].querySelector('h2')));
});

test('hub metadata: template skoda_series, title without the site suffix, description, image', { skip }, () => {
  Object.keys(HUBS).forEach((slug) => {
    const { find, source } = importHub(slug);
    const meta = Object.fromEntries(rowsOf(find('Metadata')).map((r) => [txt(r.children[0]).toLowerCase(), r.children[1]]));
    assert.equal(txt(meta.template), 'skoda_series', slug);
    assert.equal(txt(meta.title), txt(source.querySelector('.hero h1')), slug);
    assert.ok(txt(meta.description), `${slug}: description`);
    assert.ok(meta.image.querySelector('img'), `${slug}: image`);
  });
});

test('directory: Hero Image (overlay) with the H1, Cards (series-directory), Metadata', { skip }, () => {
  const {
    element, tables, find, pagePath,
  } = load(directory, 'series-2', `${SRC}/series-2/`);
  assert.equal(pagePath, '/en/series-2');
  assert.deepEqual(tables.map(blockName), ['Hero Image (overlay)', 'Cards (series-directory)', 'Metadata']);
  assert.equal(element.querySelectorAll('hr').length, 1, 'hero | cards sections');
  assert.equal(element.querySelectorAll('h1').length, 1);
  const [media, content] = rowsOf(find('Hero Image (overlay)'));
  assert.equal(media.querySelector('img').getAttribute('alt'), 'Series');
  assert.deepEqual([...content.querySelector('td').children].map((n) => `${n.tagName}:${txt(n)}`), ['H1:Series']);
});

test('directory cards: all 25 source cards in order with title, href, alt and full excerpt', { skip }, () => {
  const { find, source } = load(directory, 'series-2', `${SRC}/series-2/`);
  const articles = [...source.querySelectorAll('.panel-layout article.article-teaser[data-content-type="Series"]')];
  const rows = rowsOf(find('Cards (series-directory)'));
  assert.equal(articles.length, 25);
  assert.equal(rows.length, 25);
  rows.forEach((row, i) => {
    const src = articles[i];
    const [media, body] = row.children;
    assert.equal(row.children.length, 2, `#${i + 1}: 2 cells`);
    assert.equal(media.querySelector('img').getAttribute('alt') ?? '', src.querySelector('img').getAttribute('alt') ?? '');
    const [h2, p] = body.children;
    assert.equal(h2.tagName, 'H2');
    const a = h2.querySelector('a');
    assert.equal(txt(a), txt(src.querySelector('h2')), `#${i + 1}: title`);
    assert.equal(normHref(a.getAttribute('href')), normHref(src.querySelector('a[href]').getAttribute('href')));
    assert.equal(p.tagName, 'P');
    assert.equal(txt(p), txt(src.querySelector('.article-teaser-excerpt')), `#${i + 1}: excerpt`);
  });
  // the source lists minutes-from-car-production twice; both cards are kept
  assert.equal(rows.filter((r) => /minutes-from-car-production/.test(r.querySelector('a').getAttribute('href'))).length, 2);
});

test('directory metadata: template page (not a series in the index), theme skoda-series', { skip }, () => {
  const { find } = load(directory, 'series-2', `${SRC}/series-2/`);
  const meta = Object.fromEntries(rowsOf(find('Metadata')).map((r) => [txt(r.children[0]).toLowerCase(), txt(r.children[1])]));
  assert.equal(meta.template, 'page');
  assert.equal(meta.theme, 'skoda-series');
  assert.equal(meta.title, 'Series');
});
