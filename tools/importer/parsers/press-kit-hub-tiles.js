/* global WebImporter */
import { siteOriginWidths } from './series-grid.js';

const ratioOf = (tile) => tile.querySelector('.ratio-container')
  ?.className.match(/\bratio-(\d+x\d+)\b/)?.[1];

// Size tokens for one source row (a top-level SiteOrigin grid), in source order.
function rowTokens(tiles, rowIndex) {
  const ratios = tiles.map(ratioOf);
  const wide = ratios.filter((ratio) => ratio === '2x1').length;
  const square = ratios.filter((ratio) => ratio === '1x1').length;
  // A lone wide (2:1) or banner (4:1, the Octavia RS/Scout intro) tile: the press grid has no
  // full-width token, so it becomes a half tile that ends its row (the banner's height).
  if (tiles.length === 1 && ['2x1', '4x1'].includes(ratios[0])) return ['press-half end'];
  if (wide === 2 && square === 1 && tiles.length === 3) {
    return ratios.map((ratio) => (ratio === '2x1' ? 'feature' : 'press-square'));
  }
  // Older kits also use half rows: 2 wide tiles, or 1 wide + 2 quarters in either order.
  if ((wide === 2 && tiles.length === 2) || (wide === 1 && square === 2 && tiles.length === 3)) {
    return ratios.map((ratio) => (ratio === '2x1' ? 'press-half' : 'press-quarter'));
  }
  if (square === tiles.length && tiles.length === 5) return Array(5).fill('press-square');
  // Other square rows (default-template kits): quarters, four to a row, the last short row
  // ending early. Six tiles in a nested builder (2-up beside the dropped X timeline) become
  // 4 + 2; three 1/3 squares become three quarters.
  if (square === tiles.length) {
    return tiles.map((tile, index) => (index === tiles.length - 1 && tiles.length % 4
      ? 'press-quarter end' : 'press-quarter'));
  }
  throw new Error(`Press-kit tile row ${rowIndex + 1} has an unsupported layout`);
}

function tileRow(tile, token, rowNumber, document) {
  const sourceLink = tile.querySelector(':scope > a[href]');
  const sourceImage = tile.querySelector('.ratio-container img[src]');
  const heading = tile.querySelector('.heading');
  if (!sourceLink || !sourceImage || !heading?.textContent.trim()) {
    throw new Error(`Press-kit tile ${rowNumber} needs a link, image and title`);
  }
  const title = heading.textContent.replace(/\s+/g, ' ').trim();
  const img = sourceImage.cloneNode(true);
  img.setAttribute('alt', title);
  img.removeAttribute('srcset');
  img.removeAttribute('sizes');
  const link = document.createElement('a');
  link.href = sourceLink.href;
  link.textContent = title;
  return [token, img, link];
}

// A cell's linked banner images (the hub's image-only `sow-editor` links).
const bannersIn = (cell) => [...cell.querySelectorAll('.widget_sow-editor .textwidget a[href]')]
  .filter((a) => a.querySelector('img[src]'));
const cellsOf = (grid) => [...grid.querySelectorAll(
  ':scope > .panel-grid-cell, :scope > .panel-row-style > .panel-grid-cell',
)];

// Mosaic tokens by kind and SiteOrigin cell width (scripts/cards-tiles.js MOSAIC_SPANS).
const MOSAIC_TOKENS = {
  'tile:1x1:20': 'press-square',
  'tile:2x1:33': 'press-third',
  'banner:60': 'press-banner-wide',
  'banner:40': 'press-banner-narrow',
  'banner:50': 'press-banner-half',
};

/*
 * A hub whose banners share rows with its tiles (Classic Days 2026: Intro + Museum on top, Trekka
 * beside the last fifths, …) is one mosaic: every top-level row with tiles or banners, in source
 * order, each cell sized by its SiteOrigin width. Banners become [size, linked picture] rows, and
 * their source links are marked so the hub's banner section doesn't repeat them.
 */
function mosaicRows(grids, widths, banner, document) {
  const rows = [];
  grids.forEach((grid, rowIndex) => {
    cellsOf(grid).forEach((cell) => {
      const tiles = [...cell.querySelectorAll('article.article-teaser')];
      const banners = bannersIn(cell);
      if (!tiles.length && !banners.length) return;
      const width = Math.round(widths[cell.id]);
      if (tiles.length + banners.length !== 1) {
        throw new Error(`Press-kit mosaic row ${rowIndex + 1}: one tile or banner per cell`);
      }
      const key = tiles.length ? `tile:${ratioOf(tiles[0])}:${width}` : `banner:${width}`;
      const token = MOSAIC_TOKENS[key];
      if (!token) throw new Error(`Press-kit mosaic row ${rowIndex + 1}: unsupported cell (${key})`);
      if (tiles.length) {
        rows.push(tileRow(tiles[0], token, rows.length + 1, document));
        return;
      }
      banners[0].setAttribute('data-pk-mosaic', '');
      rows.push([token, banner(banners[0])]);
    });
  });
  return rows;
}

/**
 * @param {Element} content the hub's `.content`
 * @param {Document} document
 * @param {{ banner?: (source: HTMLAnchorElement) => HTMLAnchorElement }} [options] builds a
 *   banner's linked picture; without it a hub with mosaic banners is refused
 */
export default function parseTiles(content, document, { banner } = {}) {
  // Top-level grids only: a nested SiteOrigin builder (older default-template kits) is a grid
  // inside a cell, and its tiles belong to the outer row, in source order.
  const grids = [...content.querySelectorAll('.panel-grid')]
    .filter((grid) => !grid.parentElement.closest('.panel-grid'));
  const sourceRows = grids
    .map((grid) => [...grid.querySelectorAll('article.article-teaser')])
    .filter((tiles) => tiles.length);
  if (!sourceRows.length) throw new Error('Press-kit hub has no chapter tiles');
  const header = [['Cards (overlay, tiles)']];
  const mixed = grids.some((grid) => grid.querySelector('article.article-teaser')
    && cellsOf(grid).some((cell) => !cell.querySelector('article.article-teaser') && bannersIn(cell).length));
  if (mixed) {
    if (!banner) throw new Error('Press-kit tiles share rows with banners: not supported here');
    const widths = siteOriginWidths(document);
    const live = grids.filter((grid) => grid.querySelector('article.article-teaser') || bannersIn(grid).length);
    return WebImporter.DOMUtils.createTable(
      [...header, ...mosaicRows(live, widths, banner, document)],
      document,
    );
  }
  const rows = [...header];
  sourceRows.forEach((tiles, rowIndex) => {
    const tokens = rowTokens(tiles, rowIndex);
    tiles.forEach((tile, index) => rows.push(tileRow(tile, tokens[index], rows.length, document)));
  });
  return WebImporter.DOMUtils.createTable(rows, document);
}
