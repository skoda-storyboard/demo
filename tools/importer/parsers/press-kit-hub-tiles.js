/* global WebImporter */

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

export default function parseTiles(content, document) {
  // Top-level grids only: a nested SiteOrigin builder (older default-template kits) is a grid
  // inside a cell, and its tiles belong to the outer row, in source order.
  const sourceRows = [...content.querySelectorAll('.panel-grid')]
    .filter((grid) => !grid.parentElement.closest('.panel-grid'))
    .map((grid) => [...grid.querySelectorAll('article.article-teaser')])
    .filter((tiles) => tiles.length);
  if (!sourceRows.length) throw new Error('Press-kit hub has no chapter tiles');
  const rows = [['Cards (overlay, tiles)']];
  sourceRows.forEach((tiles, rowIndex) => {
    const tokens = rowTokens(tiles, rowIndex);
    tiles.forEach((tile, index) => {
      const sourceLink = tile.querySelector(':scope > a[href]');
      const sourceImage = tile.querySelector('.ratio-container img[src]');
      const heading = tile.querySelector('.heading');
      if (!sourceLink || !sourceImage || !heading?.textContent.trim()) {
        throw new Error(`Press-kit tile ${rows.length} needs a link, image and title`);
      }
      const title = heading.textContent.replace(/\s+/g, ' ').trim();
      const img = sourceImage.cloneNode(true);
      img.setAttribute('alt', title);
      img.removeAttribute('srcset');
      img.removeAttribute('sizes');
      const link = document.createElement('a');
      link.href = sourceLink.href;
      link.textContent = title;
      rows.push([tokens[index], img, link]);
    });
  });
  return WebImporter.DOMUtils.createTable(rows, document);
}
