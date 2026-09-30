/* global WebImporter */

export default function parseTiles(content, document) {
  const sourceRows = [...content.querySelectorAll('.panel-grid')]
    .map((grid) => [...grid.querySelectorAll('article.article-teaser')])
    .filter((tiles) => tiles.length);
  if (!sourceRows.length) throw new Error('Press-kit hub has no chapter tiles');
  const rows = [['Cards (overlay, tiles)']];
  sourceRows.forEach((tiles, rowIndex) => {
    const wide = tiles.filter((tile) => tile.querySelector('.ratio-container.ratio-2x1')).length;
    const square = tiles.filter((tile) => tile.querySelector('.ratio-container.ratio-1x1')).length;
    // Older kits also use half rows: 2 wide tiles, or 1 wide + 2 quarters in either order.
    const half = (wide === 2 && tiles.length === 2)
      || (wide === 1 && square === 2 && tiles.length === 3);
    if (!((wide === 2 && square === 1 && tiles.length === 3) || half
      || (wide === 0 && square === tiles.length && [4, 5].includes(tiles.length)))) {
      throw new Error(`Press-kit tile row ${rowIndex + 1} has an unsupported layout`);
    }
    tiles.forEach((tile) => {
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
      const isWide = !!tile.querySelector('.ratio-container.ratio-2x1');
      let token = 'press-square';
      if (isWide) token = half ? 'press-half' : 'feature';
      else if (tiles.length === 4 || half) token = 'press-quarter';
      rows.push([token, img, link]);
    });
  });
  return WebImporter.DOMUtils.createTable(rows, document);
}
