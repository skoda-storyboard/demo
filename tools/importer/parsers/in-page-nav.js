/* eslint-disable */
/* global WebImporter */
/**
 * Parser: in-page-nav (block name: "In-Page Nav")
 * Source: nav.model-nav / .model-nav > .model-nav-content > ul.nav > li > a[href="#..."]
 * (Škoda model-page, Elroq — 9 anchors).
 *
 * Each source anchor wraps a base64 SVG icon <img> + label text. We DROP the icon
 * image and keep only a clean anchor with its href and text label.
 * Emits: row 1 = block name, then one row per anchor, each cell an <a href="#..">Label</a>.
 * Defensive: if no anchors found, no-op (unwrap element).
 */
export default function parse(element, { document }) {
  // Anchors may live directly on the passed element or within its ul.nav.
  const anchors = Array.from(
    element.querySelectorAll('ul.nav > li > a[href], .model-nav-content a[href], a[href^="#"]'),
  );

  // Deduplicate (selector fallbacks may overlap) and keep in-page anchors.
  const seen = new Set();
  const cleanAnchors = [];
  anchors.forEach((a) => {
    const href = a.getAttribute('href') || '';
    const label = (a.textContent || '').trim();
    if (!href || !label) return;
    const key = `${href}::${label}`;
    if (seen.has(key)) return;
    seen.add(key);
    const link = document.createElement('a');
    link.setAttribute('href', href);
    link.textContent = label;
    cleanAnchors.push(link);
  });

  // Defensive guard: nothing to build.
  if (cleanAnchors.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [['In-Page Nav']];
  cleanAnchors.forEach((a) => cells.push([a]));

  const table = WebImporter.DOMUtils.createTable(cells, document);
  element.replaceWith(table);
}
