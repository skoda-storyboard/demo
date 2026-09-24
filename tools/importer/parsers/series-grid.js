/* eslint-disable */
/* global WebImporter */
/**
 * Parser: series-grid (block name: "Listing")
 * Source: the SiteOrigin `.panel-layout` grid of the two-level Series template —
 *   directory (/en/series-2/): ~25 article.article-teaser[data-content-type="Series"] cards;
 *   hub (/en/series/<slug>/): ~8 article.article-teaser[data-content-type="Story"] cards.
 * (measured against .migration/work/samples/series-directory.html + series-hub.html;
 *  ties to docs/ui-specs/series.md §127-131.)
 *
 * ⚠️ INDEX-DRIVEN: do NOT port the SSR article cards. The runtime listing/rail block
 * reads the emitted config and pulls rows from the published query-index:
 *   - directory → enumerate all skoda_series posts (editorial order),
 *   - hub       → stories tagged with the series slug, newest first.
 *
 * ⚠️ CONTENT-DRIVEN, NOT POSITIONAL. Directory-vs-hub is decided from the cards'
 * own `data-content-type` (Series vs Story), never from the URL or position; the hub's
 * tag slug is derived from the page canonical link. Bails (unwrap) if no cards.
 *
 * DA table shape (directory):        DA table shape (hub):
 *   ['Listing']                        ['Listing']
 *   ['index','/en/query-index.json']   ['index','/en/query-index.json']
 *   ['template','skoda_series']        ['template','story']
 *   ['sort','editorial']               ['tags','<series-slug>']
 *   ['columns','2']                    ['sort','newest']
 *                                      ['perpage','8']
 *                                      ['columns','2']
 */

// Series slug = last non-empty path segment of the hub canonical (/en/series/<slug>/).
function seriesSlugFromCanonical(document) {
  const canonical = document.querySelector('link[rel="canonical"]');
  const ogUrl = document.querySelector('meta[property="og:url"]');
  const raw = (canonical && canonical.getAttribute('href'))
    || (ogUrl && ogUrl.getAttribute('content')) || '';
  try {
    const segs = new URL(raw).pathname.split('/').filter(Boolean);
    return segs[segs.length - 1] || '';
  } catch (e) { return ''; }
}

export default function parse(element, { document }) {
  const cards = Array.from(element.querySelectorAll('article[data-content-type]'));
  if (cards.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Content-driven directory-vs-hub: the dominant card content-type.
  const types = cards.map((c) => (c.getAttribute('data-content-type') || '').toLowerCase());
  const isDirectory = types.filter((t) => t === 'series').length
    >= types.filter((t) => t === 'story').length;

  let cells;
  if (isDirectory) {
    cells = [
      ['Listing'],
      ['index', '/en/query-index.json'],
      ['template', 'skoda_series'],
      ['sort', 'editorial'],
      ['columns', '2'],
    ];
  } else {
    const slug = seriesSlugFromCanonical(document);
    cells = [
      ['Listing'],
      ['index', '/en/query-index.json'],
      ['template', 'story'],
      ['sort', 'newest'],
      ['perpage', '8'],
      ['columns', '2'],
    ];
    // Insert the tag filter right after template when a slug is resolvable.
    if (slug) cells.splice(3, 0, ['tags', slug]);
  }

  const table = WebImporter.DOMUtils.createTable(cells, document);
  element.replaceWith(table);
}
