/* eslint-disable */
/* global WebImporter */
/**
 * Parser: listing (block name: "Listing")
 * Source: the shared faceted-listing engine (e.g. /en/news/) —
 *   form.search-filter (top pill bar) + .search-results-items grid + .ajax-loader-button.
 * (ties to docs/ui-specs/faceted-listing.md, SKODA-402.)
 *
 * ⚠️ INDEX-DRIVEN: do NOT port the SSR result cards or the Search-&-Filter-Pro /
 * ElasticPress / Isotope stack. The runtime `listing` block reads the config rows
 * emitted here and pulls its rows from the published query-index at render time.
 *
 * ⚠️ CONTENT-DRIVEN, NOT POSITIONAL. The parser confirms a faceted engine is present
 * (a `.search-filter` facet form OR a `.search-results-items` grid inside the matched
 * element) before emitting; otherwise it unwraps and bails. The emitted config is the
 * template's authored listing contract, not derived from card positions.
 *
 * DA table shape (key/value config rows):
 *   ['Listing']
 *   ['index', '/en/query-index.json']
 *   ['path', '/en/press-releases/']
 *   ['template', 'press_release']
 *   ['facets', 'model, derivative, year, company, event, technology']
 *   ['sort', 'newest']
 *   ['perpage', '6']
 *   ['columns', '3']
 */

// Authored listing contract for the PR (news) listing (faceted-listing.md §7).
const LISTING_CONFIG = [
  ['index', '/en/query-index.json'],
  ['path', '/en/press-releases/'],
  ['template', 'press_release'],
  ['facets', 'model, derivative, year, company, event, technology'],
  ['sort', 'newest'],
  ['perpage', '6'],
  ['columns', '3'],
];

export default function parse(element, { document }) {
  // Confirm this really is a faceted-listing engine before emitting (content-driven).
  const isListing = element.matches('#search-filter-results, .search-filter, .search-results-items')
    || element.querySelector('.search-filter, .search-results-items, .ajax-loader-button');
  if (!isListing) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [['Listing'], ...LISTING_CONFIG];
  const table = WebImporter.DOMUtils.createTable(cells, document);
  element.replaceWith(table);
}
