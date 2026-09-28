/* global WebImporter */

export default function parseTiles(content, document) {
  const tiles = [...content.querySelectorAll('.panel-grid article.article-teaser')];
  if (!tiles.length) throw new Error('Press-kit hub has no chapter tiles');
  const rows = [['Cards (overlay, tiles)']];
  tiles.forEach((tile, index) => {
    const sourceLink = tile.querySelector(':scope > a[href]');
    const sourceImage = tile.querySelector('.ratio-container img[src]');
    const heading = tile.querySelector('.heading');
    if (!sourceLink || !sourceImage || !heading?.textContent.trim()) {
      throw new Error(`Press-kit tile ${index + 1} needs a link, image and title`);
    }
    const title = heading.textContent.replace(/\s+/g, ' ').trim();
    const img = sourceImage.cloneNode(true);
    img.setAttribute('alt', title);
    img.removeAttribute('srcset');
    img.removeAttribute('sizes');
    const link = document.createElement('a');
    link.href = sourceLink.href;
    link.textContent = title;
    rows.push([sourceImage.closest('.ratio-2x1') ? 'feature' : 'sq', img, link]);
  });
  return WebImporter.DOMUtils.createTable(rows, document);
}
