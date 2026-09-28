/* eslint-disable */
/* global WebImporter */
/**
 * Parser: series-grid, SKODA-207.
 * Source: the SiteOrigin `.panel-layout` grid of the two-level Series template.
 *
 * HUB (/en/series/<slug>/, body.single-skoda_series): an AUTHORED mosaic. Emits
 * `Cards (overlay, tiles)`, contract cards-tiles v2 (SKODA-PENDING-BLOCK-CONTRACTS.md).
 * One row per tile in source DOM order, mixed Story / Press Kits tiles kept:
 *   ['Cards (overlay, tiles)']
 *   [<size token>, <img>, <a href>Title</a>]
 * The token is the tile's share of its source row in twelfths plus its source ratio:
 *   sq 6·1x1  wide 6·2x1  sq-small 3·1x1  quarter 3·2x1  third 4·2x1  third-sq 4·1x1
 *   two-thirds 8·2x1  banner 12·4x1  banner-tall 12·3x1
 * A row closes when its tiles fill 12/12. A source row that stays short (an empty cell)
 * marks its last tile `<token> end`, so every row break is authored, never guessed.
 * The share comes from the SiteOrigin `#pgc-*{width:N%}` layout CSS in <head>; when that
 * is missing, from the rendered cell width; last, from the row composition (warned).
 * Membership, order and size are the source's: no index, tags, sort, date or excerpt.
 * (measured on the 15 hubs in test/fixtures/series/; docs/ui-specs/series.md §2.)
 *
 * DIRECTORY (/en/series-2/, all cards data-content-type="Series"): the authored card
 * list as `Cards (series-directory)` (a `cards` variant on main), every source card in
 * DOM order, duplicates kept:
 *   ['Cards (series-directory)']
 *   [<img>, [<h2><a href>Title</a></h2>, <p>excerpt</p>]]
 * The excerpt is the full source text (the source truncates it client-side).
 *
 * CONTENT-DRIVEN, NOT POSITIONAL: hub vs directory comes from the body class and the
 * cards' own data-content-type, never the URL, the slug or the first card. Bails
 * (unwrap) if there are no cards.
 */

const TOKENS = {
  '6:1x1': 'sq',
  '6:2x1': 'wide',
  '3:1x1': 'sq-small',
  '3:2x1': 'quarter',
  '4:2x1': 'third',
  '4:1x1': 'third-sq',
  '8:2x1': 'two-thirds',
  '12:4x1': 'banner',
  '12:3x1': 'banner-tall',
};

const clean = (node) => (node ? (node.textContent || '').replace(/\s+/g, ' ').trim() : '');

// `#pgc-<post>-<row>-<cell>` → width % from the SiteOrigin layout CSS (desktop rules;
// the `@media` stack rules set every cell to 100% and are skipped).
function siteOriginWidths(document) {
  const widths = {};
  document.querySelectorAll('style').forEach((style) => {
    const css = (style.textContent || '').replace(/@media[^{]*\{(?:[^{}]*\{[^}]*\})*\s*\}/g, '');
    const re = /([^{}]+)\{([^}]*)\}/g;
    let m;
    while ((m = re.exec(css))) {
      const w = m[2].match(/(?:^|;)\s*width:\s*([\d.]+)%/);
      if (!w) continue;
      (m[1].match(/#pgc-[\w-]+/g) || []).forEach((sel) => {
        widths[sel.slice(1)] = Number(w[1]);
      });
    }
  });
  return widths;
}

function ratioOf(article) {
  const box = article.querySelector('[class*="ratio-"]');
  const m = box && box.className.match(/\bratio-(\d+x\d+)\b/);
  return m ? m[1] : '';
}

// Twelfths of the row each tile takes, in cell order (null where unknown).
function rowSpans(row, cells, widths) {
  const byCss = cells.map((cell) => widths[cell.id]);
  if (byCss.every((w) => w > 0)) return byCss.map((w) => Math.round((w / 100) * 12));
  const rowWidth = row.getBoundingClientRect ? row.getBoundingClientRect().width : 0;
  if (rowWidth > 0) {
    const byBox = cells.map((cell) => cell.getBoundingClientRect().width);
    if (byBox.every((w) => w > 0)) return byBox.map((w) => Math.round((w / rowWidth) * 12));
  }
  return cells.map(() => null);
}

// Last resort, the tile layouts seen in the source (warned by the caller).
function spanFromComposition(tiles, i) {
  const ratios = tiles.map((t) => t.ratio);
  if (tiles.length === 1) return 12;
  if (tiles.length === 4) return 3;
  if (tiles.length === 2) return 6;
  if (tiles.length === 3) return ratios[i] === '1x1' && ratios.includes('2x1') ? 3
    : ratios[i] === '2x1' && ratios.includes('1x1') ? 6 : 4;
  return null;
}

function directoryRows(element, document) {
  return [...element.querySelectorAll('article.article-teaser[data-content-type]')].map((article) => {
    const link = article.querySelector('a[href]');
    const h2 = document.createElement('h2');
    const a = document.createElement('a');
    a.setAttribute('href', link ? link.getAttribute('href') : '');
    a.textContent = clean(article.querySelector('h2, h3, .heading')) || clean(link);
    h2.append(a);
    const body = [h2];
    const excerpt = clean(article.querySelector('.article-teaser-excerpt'));
    if (excerpt) {
      const p = document.createElement('p');
      p.textContent = excerpt;
      body.push(p);
    }
    return [article.querySelector('img') || '', body];
  });
}

function hubRows(element, document) {
  const widths = siteOriginWidths(document);
  const out = [];
  const grids = element.querySelectorAll(':scope > .panel-grid, .panel-layout > .panel-grid');
  const rows = grids.length ? [...grids] : [element];
  rows.forEach((row, r) => {
    const cells = [...row.querySelectorAll(':scope > .panel-grid-cell, :scope > .panel-row-style > .panel-grid-cell')];
    const spans = rowSpans(row, cells, widths);
    const tiles = [];
    let short = false;
    cells.forEach((cell, c) => {
      const article = cell.querySelector('article.article-teaser[data-content-type]');
      if (!article) { short = true; return; } // empty cell / empty widget: the row stays short
      tiles.push({ article, ratio: ratioOf(article), span: spans[c] });
    });
    let sum = 0;
    tiles.forEach((tile, i) => {
      let { span } = tile;
      if (!span) {
        span = spanFromComposition(tiles, i);
        console.warn(`[series-grid] row ${r + 1}: no source width for tile ${i + 1}, inferred ${span}/12`);
      }
      const token = TOKENS[`${span}:${tile.ratio}`];
      if (!token) console.warn(`[series-grid] row ${r + 1} tile ${i + 1}: no cards-tiles token for ${span}/12 ${tile.ratio}`);
      sum += span || 0;
      out.push({ ...tile, token: token || '' });
    });
    if (!tiles.length) return;
    if (sum > 12) console.warn(`[series-grid] row ${r + 1} overfills: ${sum}/12`);
    if (sum < 12 || short) out[out.length - 1].token += ' end';
  });
  // A short final row ends the grid anyway, the flag is still authored (source row).
  return out.map(({ article, token }) => {
    const link = article.querySelector('a[href]');
    const img = article.querySelector('img');
    const a = document.createElement('a');
    a.setAttribute('href', link ? link.getAttribute('href') : '');
    a.textContent = clean(article.querySelector('h2, h3, .heading')) || clean(link);
    return [token.trim(), img || '', a];
  });
}

export default function parse(element, { document }) {
  const cards = Array.from(element.querySelectorAll('article[data-content-type]'));
  if (cards.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const types = cards.map((c) => (c.getAttribute('data-content-type') || '').toLowerCase());
  const isHub = document.body.classList.contains('single-skoda_series')
    || !types.includes('series');

  let cells;
  if (isHub) {
    cells = [['Cards (overlay, tiles)'], ...hubRows(element, document)];
  } else {
    cells = [['Cards (series-directory)'], ...directoryRows(element, document)];
  }

  const table = WebImporter.DOMUtils.createTable(cells, document);
  element.replaceWith(table);
}
