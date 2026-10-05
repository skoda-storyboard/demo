/* eslint-disable */
/* global WebImporter */
/**
 * Parser: archive-hero (block name: "Hero Image (archive)") — category / tag archive term hero.
 * Source: div.hero > .hero-image img (1920×375 banner) + .hero-caption .category .label ×N
 *   (tag: "Models" "Peaq"; category: "Lifestyle" "People"). The source has no <h1>.
 *
 * Output (SKODA-828 F3; pinned contract `hero`, SKODA-PENDING-BLOCK-CONTRACTS.md):
 *   Hero Image (archive) | banner picture (empty cell when the term has no banner) |
 *                        | h1: one line per label (`<br>` between), parent + term     |
 * The block renders the band (184/224/240px) and each h1 line as a grey label chip; the h1
 * stays the page's single heading (SKODA-209: "Models Peaq"). The empty image row keeps the
 * source's empty band for the 16 terms without a banner.
 *
 * ⚠️ CONTENT-DRIVEN: every part optional. No labels → the <title> term (site suffix trimmed).
 * No image and no title → unwrap and bail.
 */
export default function parse(element, { document }) {
  const img = element.querySelector('.hero-image img, img');
  const labels = [...element.querySelectorAll('.hero-caption .label, .hero-caption .category > *')]
    .map((l) => (l.textContent || '').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const unique = labels.filter((l, i) => labels.indexOf(l) === i);
  const docTitle = (document.title || '').replace(/\s+[-–|]\s+Škoda Storyboard\s*$/, '').trim();
  const lines = unique.length ? unique : [docTitle].filter(Boolean);

  if (!img && !lines.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [['Hero Image (archive)']];
  if (img) {
    img.removeAttribute('srcset');
    img.removeAttribute('sizes');
    cells.push([img]);
  } else {
    cells.push(['']);
  }
  if (lines.length) {
    const h1 = document.createElement('h1');
    lines.forEach((line, i) => {
      if (i) h1.append(document.createElement('br'));
      h1.append(line);
    });
    cells.push([h1]);
  }
  element.replaceWith(WebImporter.DOMUtils.createTable(cells, document));
}
