/* eslint-disable */
/* global WebImporter */
/**
 * Parser: key-facts (block name: "Cards (key-facts)"), contract `cards-key-facts` v1 (SKODA-208).
 * Source: .so-widget-ys-so-widget-highlights (the "Highlights" / "Key Highlights" /
 *   "Key Specifications" widget; its #keyfacts id is missing on some pages, so the
 *   importer locates it by widget class). Structure:
 *     <h2>Highlights</h2> then .items > .item, each item:
 *       .item-image (square <img> + a stray h3.item-title) + .item-text (h3.item-title + <p>).
 *
 * Output: the heading as default content, then the cards block shape
 * (blocks/cards/cards.js): one row per item [image, <h3>title</h3><p>text</p>].
 * The heading carries data-model-key="keyfacts" so the model nav (in-page-nav.js,
 * which runs last) can link to it; the importer strips the attribute afterwards.
 */
export default function parse(element, { document }) {
  const items = Array.from(element.querySelectorAll('.items > .item'));

  if (items.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [['Cards (key-facts)']];
  items.forEach((item) => {
    const img = item.querySelector('.item-image img, img');
    // The source repeats the title in .item-image and .item-text: take one.
    const title = item.querySelector('.item-text .item-title, .item-text h3, .item-title, h3');
    const body = [];
    const titleText = title ? (title.textContent || '').replace(/\s+/g, ' ').trim() : '';
    if (titleText) {
      const h3 = document.createElement('h3');
      h3.textContent = titleText;
      body.push(h3);
    }
    const textRoot = item.querySelector('.item-text') || item;
    textRoot.querySelectorAll('p').forEach((p) => {
      if ((p.textContent || '').trim()) body.push(p);
    });
    if (!img && body.length === 0) return;
    cells.push([img || '', body]);
  });

  const out = [];
  const heading = element.querySelector('h2');
  const headingText = heading ? (heading.textContent || '').replace(/\s+/g, ' ').trim() : '';
  if (headingText) {
    const h2 = document.createElement('h2');
    h2.textContent = headingText;
    h2.setAttribute('data-model-key', 'keyfacts');
    out.push(h2);
  }
  out.push(WebImporter.DOMUtils.createTable(cells, document));
  element.replaceWith(...out);
}
