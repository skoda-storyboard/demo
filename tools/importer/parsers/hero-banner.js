/* eslint-disable */
/* global WebImporter */
/**
 * Parser: hero-banner (block name: "Hero")
 * Source: the short full-bleed banner used by editorial "Page", category and
 *   tag/model archive templates — div.hero > .hero-image (img) [+ optional
 *   heading/CTA overlay].
 * (measured against .migration/work/samples/rep_*.html; ties to template-page-base.md
 *  and template-category-archive.md.)
 *
 * ⚠️ CONTENT-DRIVEN, NOT POSITIONAL. Everything is read from the DOM inside the
 * element the `.hero` selector matched. If there is no image AND no heading it
 * unwraps and bails (a bare banner slot is not a hero).
 *
 * EDS Hero convention (1 column, up to 3 rows):
 *   Row 1: block name.
 *   Row 2: background image (optional).
 *   Row 3: Title (heading) + optional Call-to-Action link(s).
 */
export default function parse(element, { document }) {
  const img = element.querySelector('.hero-image img, .image-wrapper img, img');

  // Overlay content: a heading (title) and any call-to-action links.
  const heading = element.querySelector('h1, h2, .hero-title, .entry-title');
  const ctas = Array.from(element.querySelectorAll('a.btn, a.btn-secondary, .hero-content a, .cta a'));

  // Defensive: nothing hero-shaped — unwrap and bail.
  if (!img && !heading) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [['Hero']];
  // Row 2: background image (optional).
  cells.push([img || '']);

  // Row 3: title + optional CTA link(s).
  const contentCell = [];
  if (heading) contentCell.push(heading);
  ctas.forEach((a) => {
    const link = document.createElement('a');
    link.setAttribute('href', a.getAttribute('href') || '#');
    link.textContent = (a.textContent || '').trim();
    if (link.textContent) contentCell.push(link);
  });
  if (contentCell.length) cells.push([contentCell]);

  const table = WebImporter.DOMUtils.createTable(cells, document);
  element.replaceWith(table);
}
