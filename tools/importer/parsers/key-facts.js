/* eslint-disable */
/* global WebImporter */
/**
 * Parser: key-facts (block name: "Cards (key-facts)")
 * Source: #keyfacts .so-widget-ys-so-widget-highlights
 *   <h2>Highlights</h2> then .items > .item, each item:
 *     .item-image (square <img> + a stray h3.item-title) + .item-text (h3.item-title + <p>).
 *
 * Matches repo cards block shape (blocks/cards/cards.js): two-column rows [image, body].
 * Preserves the "Highlights" heading as default content ABOVE the table so the section
 * keeps its visible heading.
 */
export default function parse(element, { document }) {
  const heading = element.querySelector('h2');
  const items = Array.from(element.querySelectorAll(':scope > .items > .item, .items > .item'));

  // Defensive: no items -> unwrap.
  if (items.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [['Cards (key-facts)']];

  items.forEach((item) => {
    const img = item.querySelector('img');

    // Title: prefer the one inside .item-text; fall back to any item-title.
    const title = item.querySelector('.item-text .item-title, .item-text h3, .item-title, h3');

    // Description paragraph(s) from the text column.
    const paras = Array.from(item.querySelectorAll('.item-text p, p'));

    const bodyCell = [];
    if (title) {
      // Clone so we take a single title (source repeats it in .item-image and .item-text).
      bodyCell.push(title.cloneNode(true));
    }
    paras.forEach((p) => bodyCell.push(p));

    cells.push([img || '', bodyCell]);
  });

  const table = WebImporter.DOMUtils.createTable(cells, document);

  // Keep "Highlights" heading as default content above the table.
  if (heading) {
    element.replaceWith(heading, table);
  } else {
    element.replaceWith(table);
  }
}
