/* eslint-disable */
/* global WebImporter */
/**
 * Parser: listing (block name: "Listing")
 * Source: the shared faceted-listing engine (template-search-results) used by
 *   /en/news/, /en/images/, /en/videos/, /en/search/ —
 *   form.search-filter (top pill bar) + .search-results-items grid + .ajax-loader-button,
 *   all inside #search-filter-results.
 * (ties to docs/ui-specs/faceted-listing.md, SKODA-402/403.)
 *
 * ⚠️ INDEX-DRIVEN: do NOT port the SSR result cards or the Search-&-Filter-Pro /
 * ElasticPress / Isotope stack. The runtime `listing` block reads the config rows
 * emitted here and pulls its rows from the published query-index at render time.
 *
 * ⚠️ CONTENT-DRIVEN, NOT POSITIONAL. The variant is selected from the <body> class
 * token the source itself carries (images | videos | search | news→press_release),
 * NOT from the URL or section position — the four pages are one engine differing only
 * by that signal. The parser confirms a faceted engine is present before emitting;
 * otherwise it unwraps and bails.
 *
 * DA table shape (key/value config rows), e.g. Images:
 *   ['Listing']
 *   ['index', '/en/query-index.json']
 *   ['path', '/en/images/']
 *   ['template', 'image']
 *   ['facets', 'model, derivative, year, company, event, technology']
 *   ['sort', 'newest']
 *   ['perpage', '12']
 *   ['columns', '4']
 */

const FACETS_DEFAULT = 'model, derivative, year, company, event, technology';

// Variant config keyed by the <body> class token the source page carries.
// Each value is the authored Listing contract (faceted-listing.md §7). Order-preserving.
const VARIANTS = {
  // News (press releases) — the baseline.
  news: [
    ['index', '/en/query-index.json'],
    ['path', '/en/press-releases/'],
    ['template', 'press_release'],
    ['facets', FACETS_DEFAULT],
    ['sort', 'newest'],
    ['perpage', '6'],
    ['columns', '3'],
  ],
  images: [
    ['index', '/en/query-index.json'],
    ['path', '/en/images/'],
    ['template', 'image'],
    ['facets', FACETS_DEFAULT],
    ['sort', 'newest'],
    ['perpage', '12'],
    ['columns', '4'],
  ],
  videos: [
    ['index', '/en/query-index.json'],
    ['path', '/en/videos/'],
    ['template', 'video'],
    ['facets', FACETS_DEFAULT],
    ['sort', 'newest'],
    ['perpage', '12'],
    ['columns', '3'],
  ],
  // Site-wide free-text search: no path/template filter (cross-type), search box on.
  search: [
    ['index', '/en/query-index.json'],
    ['facets', 'model'],
    ['search', 'true'],
    ['sort', 'newest'],
    ['perpage', '12'],
    ['columns', '3'],
  ],
};

// Body-class token → variant key. All four pages share the engine class
// `page-template-template-search-results`, so a substring/word-boundary test on
// "search" would false-match every variant. Match the STANDALONE class token
// instead (split on whitespace, exact-equal), which the source sets to exactly
// one of images | videos | search | news. Default → news.
function variantFromBody(document) {
  const tokens = ((document.body && document.body.getAttribute('class')) || '').split(/\s+/);
  if (tokens.includes('images')) return 'images';
  if (tokens.includes('videos')) return 'videos';
  if (tokens.includes('search')) return 'search';
  return 'news';
}

export default function parse(element, { document }) {
  // Confirm this really is a faceted-listing engine before emitting (content-driven).
  const isListing = element.matches('#search-filter-results, .search-filter, .search-results-items')
    || element.querySelector('.search-filter, .search-results-items, .ajax-loader-button');
  if (!isListing) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [['Listing'], ...VARIANTS[variantFromBody(document)]];
  const table = WebImporter.DOMUtils.createTable(cells, document);
  element.replaceWith(table);
}
