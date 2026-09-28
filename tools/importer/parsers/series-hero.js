/* eslint-disable */
/* global WebImporter */
/**
 * Parser: series-hero (block name: "Hero Image (overlay)"), SKODA-207.
 * Source: `div.hero` of a Series hub (body.single-skoda_series, /en/series/<slug>/):
 *   .hero-image img  +  .hero-caption > .container > h1.heading,
 *                        span.category > span.label ("Series", not a link), p.perex.
 * (measured on test/fixtures/series/*.html; docs/ui-specs/series.md §2, §3.)
 *
 * Resolves the `hero` contract for the Series hub (SKODA-PENDING-BLOCK-CONTRACTS.md):
 * the existing `hero-image` block, never the `Hero` boilerplate stub. hero-banner.js
 * stays untouched for the page/company importers. Same shape as parsers/hero.js
 * (model page): the chip `<p>` first, then the single H1, then the standfirst.
 * templates/skoda-series/ shows them as H1 → badge → perex.
 *
 * DA table shape:
 *   ['Hero Image (overlay)']
 *   [<img>]                                  (source alt kept, empty alt stays empty)
 *   [<p>Series</p>, <h1>Title</h1>, <p>perex</p>]   (only what the source authored)
 */

const clean = (node) => (node ? (node.textContent || '').replace(/\s+/g, ' ').trim() : '');

export default function parse(element, { document }) {
  const img = element.querySelector('.hero-image img, img');
  const caption = element.querySelector('.hero-caption') || element;
  const title = clean(caption.querySelector('h1, h2, .heading'));

  if (!img && !title) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const content = [];
  const label = clean(caption.querySelector('.category .label, .category'));
  if (label) {
    const p = document.createElement('p');
    p.textContent = label;
    content.push(p);
  }
  if (title) {
    const h1 = document.createElement('h1');
    h1.textContent = title;
    content.push(h1);
  }
  const perex = clean(caption.querySelector('.perex'));
  if (perex) {
    const p = document.createElement('p');
    p.textContent = perex;
    content.push(p);
  }

  const cells = [['Hero Image (overlay)']];
  if (img) cells.push([img]);
  if (content.length) cells.push([content]);

  element.replaceWith(WebImporter.DOMUtils.createTable(cells, document));
}
