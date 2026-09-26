/* eslint-disable */
/* global WebImporter */
/**
 * Parser: model hero (block name: "Hero Image (overlay)"), contract `hero` v2 (SKODA-208).
 * Source: article.skoda_model > .carousel (every Škoda model page; always ONE slide:
 *   .item.active > .image-wrapper img + .carousel-caption (.label "Models" chip + h1)).
 *
 * `blocks/hero` is an empty boilerplate stub; the project hero is `hero-image`, whose
 * `overlay` variant renders the full-bleed image with the heading layered on top.
 *
 * Output (one block):
 *   Hero Image (overlay) | <img>            |
 *                        | <p>Models</p><h1>Kodiaq</h1> |
 * The chip precedes the H1 (source order: chip above the name). The truncated
 * .entry-summary teaser is NOT imported: it duplicates the Model Description section.
 * Keeps the model name as the page's single H1.
 *
 * ⚠️ CONTENT-DRIVEN: image and heading are both optional; neither → unwrap and bail.
 */
export default function parse(element, { document }) {
  const img = element.querySelector('.item.active .image-wrapper img, .image-wrapper img, img');
  const heading = element.querySelector('h1.entry-title, h1');

  if (!img && !heading) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const content = [];
  const chip = element.querySelector('.entry-meta .label, span.label-secondary, .label');
  const chipText = chip ? (chip.textContent || '').replace(/\s+/g, ' ').trim() : '';
  if (chipText) {
    const p = document.createElement('p');
    p.textContent = chipText;
    content.push(p);
  }
  if (heading) {
    const h1 = document.createElement('h1');
    h1.textContent = (heading.textContent || '').replace(/\s+/g, ' ').trim();
    content.push(h1);
  }

  const cells = [['Hero Image (overlay)']];
  if (img) cells.push([img]);
  if (content.length) cells.push([content]);

  element.replaceWith(WebImporter.DOMUtils.createTable(cells, document));
}
