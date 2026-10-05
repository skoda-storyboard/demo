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
  // One entry per source label ELEMENT (both selectors can match the same one). Equal texts
  // stay: /en/tag/crew/technology shows "Technology" twice. A category label is a link to
  // its term (parent, then child on a sub-category); a tag label is plain text.
  const labelEls = [...new Set(element.querySelectorAll('.hero-caption .label, .hero-caption .category > *'))];
  const lines = labelEls
    .map((l) => {
      const text = (l.textContent || '').replace(/\s+/g, ' ').trim();
      if (!text) return null;
      const href = l.matches('a[href]') ? l.getAttribute('href') : '';
      if (!href) return text;
      const a = document.createElement('a');
      a.setAttribute('href', href);
      a.textContent = text;
      return a;
    })
    .filter(Boolean);
  const docTitle = (document.title || '').replace(/\s+[-–|]\s+Škoda Storyboard\s*$/, '').trim();
  if (!lines.length && docTitle) lines.push(docTitle);

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
