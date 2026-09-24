/* eslint-disable */
/* global WebImporter */
/**
 * Parser: hero (block name: "Hero")
 * Source: article.skoda_model > .carousel (Škoda model-page, Elroq)
 *
 * EDS Hero convention: 1 column, 3 rows.
 *   Row 1: block name.
 *   Row 2: background image (optional).
 *   Row 3: title (Heading) + subheading/additional text + optional CTA.
 *
 * Here: row 2 = hero image; row 3 = chip text + H1 model name + teaser paragraph.
 * Keeps the model-name H1 as the single H1.
 */
export default function parse(element, { document }) {
  // Background image: the single hero image inside the (non-functional) carousel item.
  const img = element.querySelector('.image-wrapper img, img.media-cart-image, img');

  // Chip / label ("Models").
  const chip = element.querySelector('.entry-meta .label, span.label-secondary, .label');

  // Model-name heading — keep as the single H1.
  const heading = element.querySelector('h1.entry-title, h1');

  // Teaser paragraph echoing the Model Description.
  const teaser = element.querySelector('.entry-summary p, .entry-summary');

  // Defensive: if nothing meaningful found, unwrap and bail.
  if (!img && !heading) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Row 3 content cell: chip text, heading, teaser.
  const contentCell = [];
  if (chip) {
    const chipText = (chip.textContent || '').trim();
    if (chipText) {
      const p = document.createElement('p');
      p.textContent = chipText;
      contentCell.push(p);
    }
  }
  if (heading) contentCell.push(heading);
  if (teaser) contentCell.push(teaser);

  const cells = [
    ['Hero'],
    [img || ''],
    [contentCell],
  ];

  const table = WebImporter.DOMUtils.createTable(cells, document);
  element.replaceWith(table);
}
