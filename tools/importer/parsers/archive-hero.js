/* eslint-disable */
/* global WebImporter */
/**
 * Parser: archive-hero (default content, no block) — category / tag archive term hero.
 * Source: div.hero > .hero-image img (1920×375 banner) + .hero-caption .category .label ×N
 *   (tag: "Models" "Peaq"; category: "Lifestyle" "People"). The source has no <h1>.
 *
 * Replaces hero-banner for the archive template only: hero-banner emits the `Hero` block,
 * which is an empty stub on main. The archive term hero is emitted as default content —
 * the banner picture + one <h1> built from the labels (parent + term, as measured in
 * docs/ui-specs/template-category-archive.md §4: "Models Octavia"). The styled short banner
 * (240px) is SKODA-209's visual work.
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
  const title = unique.length ? unique.join(' ') : docTitle;

  if (!img && !title) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const out = [];
  if (img) {
    const p = document.createElement('p');
    img.removeAttribute('srcset');
    img.removeAttribute('sizes');
    p.append(img);
    out.push(p);
  }
  if (title) {
    const h1 = document.createElement('h1');
    h1.textContent = title;
    out.push(h1);
  }
  element.replaceWith(...out);
}
