/* eslint-disable */
/* global WebImporter */
/**
 * Parser: social-cards (block name: "Cards (social)") — SKODA-217.
 *
 * Source: the homepage "Social media" band —
 *   div.cover-box.dark.socials-static
 *     header h3.search-results-heading            "Social media"
 *     .search-results-items > .search-results-item > article
 *       > a.article-teaser-media[href]            the profile URL (target=_blank)
 *           svg (tile icon) + h3.entry-title      "@skodaglobal"
 * (measured on https://www.skoda-storyboard.com/en/, 2026-09-25)
 *
 * Emits the band as its OWN section (a leading and trailing <hr>) so the section
 * can later carry the dark style (SKODA-218) without touching its neighbours:
 *   <h2>Social media</h2>
 *   ['Cards (social)']
 *   [<a href="profile URL">@handle</a>]   ← one row per profile, source order
 * The icon is NOT imported: the block draws it from the link's host, so authors
 * only edit the link and the visible handle.
 *
 * Content-driven: if no profile link is found the element is left untouched, and
 * the shared page cleanup removes it as before.
 */
export default function parse(element, { document }) {
  // one card per profile: an item with more than one link to the same profile
  // (media + title) must not become two cards
  const seen = new Set();
  const links = [...element.querySelectorAll(
    '.search-results-item a[href], .search-results-items a[href]',
  )].filter((a) => {
    const href = a.getAttribute('href') || '';
    if (!/^https?:/i.test(href) || seen.has(href)) return false;
    seen.add(href);
    return true;
  });

  const rows = links.map((a) => {
    const handleEl = a.querySelector('.entry-title, h2, h3, h4');
    const handle = ((handleEl && handleEl.textContent) || a.textContent || '').trim();
    if (!handle) return null;
    const link = document.createElement('a');
    link.setAttribute('href', a.getAttribute('href'));
    link.textContent = handle;
    return [link];
  }).filter(Boolean);
  if (!rows.length) return;

  const out = [document.createElement('hr')];
  const headingEl = element.querySelector('.search-results-heading, .search-results-header h2, .search-results-header h3');
  const headingText = headingEl && headingEl.textContent.trim();
  if (headingText) {
    const h2 = document.createElement('h2');
    h2.textContent = headingText;
    out.push(h2);
  }
  out.push(WebImporter.DOMUtils.createTable([['Cards (social)'], ...rows], document));
  out.push(document.createElement('hr'));
  element.replaceWith(...out);
}
