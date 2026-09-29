/* eslint-disable */
/* global WebImporter */
/**
 * Parser: home-stories (block name: "Stories") — SKODA-214 / SKODA-611a.
 *
 * Source: the Storyboard home "Latest Stories" feed —
 *   div.cover-box > div.search-results.latest-articles
 *     header h3.search-results-heading        "Latest Stories"
 *     .search-results-items (5 SSR posts) + button.ajax-loader-button "Load more"
 * (measured on https://www.skoda-storyboard.com/en/, 2026-09-28)
 *
 * ⚠️ INDEX-DRIVEN: the SSR posts are NOT ported. The runtime stories block pulls
 * the feed from the query index. The source excludes the promo-box posts from the
 * feed (`exclude_carousel_posts`); the index has no featured flag, so the feed
 * skips the promo's 3 newest stories with an authored `offset` (regression guard:
 * the first card is the 4th newest story, 0 overlap with the promo box).
 *
 *   ['Stories']
 *   ['heading', 'Latest Stories'] ['template', 'story'] ['path', '/en/'] ['offset', '3']
 */
export default function parse(element, { document }) {
  const headingEl = element.querySelector('.search-results-heading, .search-results-header h2, .search-results-header h3');
  const heading = headingEl ? headingEl.textContent.trim() : '';
  const rows = [['Stories']];
  if (heading) rows.push(['heading', heading]);
  rows.push(['template', 'story'], ['path', '/en/'], ['offset', '3']);
  element.replaceWith(WebImporter.DOMUtils.createTable(rows, document));
}
