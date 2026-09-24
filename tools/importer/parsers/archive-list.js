/* eslint-disable */
/* global WebImporter */
/**
 * Parser: archive-list (block name: "Listing")
 * Source: a category/tag ARCHIVE grid that has NO facet engine —
 *   div.search-results.archive-results > .search-results-items (card grid) [+ load-more].
 * (measured against .migration/work/samples/rep_category_emobility.html and
 *  rep_tag_model_elroq.html; ties to docs/ui-specs/template-category-archive.md.)
 *
 * ⚠️ INDEX-DRIVEN, and distinct from the faceted `listing` parser: an archive is a
 * plain index query scoped by the page's own path with NO facet pills. The parser
 * emits a facet-less `Listing` config whose `path` is DERIVED from the page canonical
 * URL (content-driven) — never from a positional/URL-matching assumption baked into
 * the parser. The runtime `listing` block reads this and pulls rows from the
 * query-index; the SSR result cards are not ported.
 *
 * ⚠️ CONTENT-DRIVEN, NOT POSITIONAL. Requires an archive grid (.archive-results or
 * .search-results-items) inside the matched element; otherwise unwraps and bails.
 *
 * DA table shape:
 *   ['Listing']
 *   ['index', '/en/query-index.json']
 *   ['path', '/en/category/emobility/']   // derived from canonical
 *   ['sort', 'newest']
 *   ['perpage', '6']
 *   ['columns', '3']
 */

// Locale-relative index path for a given absolute/relative page URL ('/en/…' → '/en/query-index.json').
function indexForPath(pathname) {
  const segs = pathname.split('/').filter(Boolean);
  const locale = segs[0] || 'en';
  return `/${locale}/query-index.json`;
}

export default function parse(element, { document }) {
  // Confirm this is an archive grid before emitting (content-driven).
  const isArchive = element.matches('.archive-results, .search-results-items')
    || element.querySelector('.archive-results, .search-results-items');
  if (!isArchive) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Derive the listing scope from the page's canonical URL (never hardcoded).
  const canonical = document.querySelector('link[rel="canonical"]');
  const ogUrl = document.querySelector('meta[property="og:url"]');
  const rawUrl = (canonical && canonical.getAttribute('href'))
    || (ogUrl && ogUrl.getAttribute('content')) || '';
  let pathname = '/en/';
  try { pathname = new URL(rawUrl).pathname; } catch (e) { /* fall back below */ }

  const cells = [
    ['Listing'],
    ['index', indexForPath(pathname)],
    ['path', pathname],
    ['sort', 'newest'],
    ['perpage', '6'],
    ['columns', '3'],
  ];

  const table = WebImporter.DOMUtils.createTable(cells, document);
  element.replaceWith(table);
}
