/* eslint-disable */
/* global WebImporter */
/**
 * Parser: archive-list (block name: "Stories") — category / tag ARCHIVE grid.
 * Source: div.search-results.archive-results > .search-results-items (card grid) [+ load-more].
 * (measured against .migration/work/samples/rep_category_emobility.html and
 *  rep_tag_model_elroq.html; ties to docs/ui-specs/template-category-archive.md.)
 *
 * ⚠️ INDEX-DRIVEN: the SSR result cards are not ported. The parser emits a `Stories` config
 * (the SKODA-214 feed block: card-teaser grid + Load more) whose scope is DERIVED from the
 * page canonical URL (content-driven), never hard-coded:
 *   /en/tag/<taxonomy>/<slug>/        → tag: <slug>          (index `tags` column)
 *   /en/category/<cat>[/<sub>]/       → path: /en/<cat>[/<sub>]/  (story URLs carry the
 *                                        category and sub-category; the index `category`
 *                                        column has only the top level)
 * The source archives list stories only (post type `post`), so template = story.
 *
 * (Was a path-scoped `Listing`: `path: /en/tag/model/elroq/` matched no index row — no story
 * lives under /en/tag/ or /en/category/ — so every archive rendered empty.)
 *
 * ⚠️ CONTENT-DRIVEN, NOT POSITIONAL. Requires an archive grid (.archive-results or
 * .search-results-items) inside the matched element; otherwise unwraps and bails.
 *
 * DA table shape (tag example):
 *   ['Stories']
 *   ['index', '/en/query-index.json']
 *   ['template', 'story']
 *   ['tag', 'peaq']
 *   ['columns', '3'] ['initial', '6'] ['perpage', '6'] ['excludefeatured', 'false']
 */
// Locale-relative index path for a given page path ('/en/…' → '/en/query-index.json').
function indexForPath(pathname) {
  const segs = pathname.split('/').filter(Boolean);
  const locale = segs[0] || 'en';
  return `/${locale}/query-index.json`;
}

// Archive scope row from the archive URL, or null when the URL isn't an archive.
function scopeFor(pathname) {
  const segs = pathname.split('/').filter(Boolean); // [en, tag|category, …]
  const [locale, kind, ...rest] = segs;
  if (kind === 'tag' && rest.length) return ['tag', rest[rest.length - 1]];
  if (kind === 'category' && rest.length) return ['path', `/${locale}/${rest.join('/')}/`];
  return null;
}

export default function parse(element, { document }) {
  // Confirm this is an archive grid before emitting (content-driven).
  const isArchive = element.matches('.archive-results, .search-results-items')
    || element.querySelector('.archive-results, .search-results-items');
  if (!isArchive) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // The source pager ("4 / 19" status + "Load more" button) sits beside the grid; the
  // Stories block renders its own Load more, so drop the source one.
  const container = element.closest('.search-results') || element.parentElement;
  if (container) {
    container.querySelectorAll('.search-results-pagination, .ajax-loader-button-wrapper')
      .forEach((n) => n.remove());
  }

  // Derive the scope from the page's canonical URL (never hardcoded).
  const canonical = document.querySelector('link[rel="canonical"]');
  const ogUrl = document.querySelector('meta[property="og:url"]');
  const rawUrl = (canonical && canonical.getAttribute('href'))
    || (ogUrl && ogUrl.getAttribute('content')) || '';
  let pathname = '';
  try { pathname = new URL(rawUrl).pathname; } catch (e) { /* no canonical */ }
  const scope = scopeFor(pathname);
  if (!scope) {
    console.warn(`[archive-list] no archive scope for canonical "${rawUrl}"; grid dropped`);
    element.remove();
    return;
  }

  const cells = [
    ['Stories'],
    ['index', indexForPath(pathname)],
    ['template', 'story'],
    scope,
    ['columns', '3'],
    ['initial', '6'],
    ['perpage', '6'],
    ['excludefeatured', 'false'],
  ];
  element.replaceWith(WebImporter.DOMUtils.createTable(cells, document));
}
