/* eslint-disable */
/* global WebImporter */
/**
 * Parser: tags (block name: "Tags")
 * Source: the press-release tag row —
 *   ol.entry-tags.tag-list > li > a.label
 * (measured against .migration/work/samples/press.html; ties to docs/ui-specs/tags.md, SKODA-205.)
 *
 * ⚠️ CONTENT-DRIVEN, NOT POSITIONAL. The parser reads the tag anchors inside the
 * element the `.entry-tags` selector matched. hrefs come in the two measured shapes
 * the shared metadata extractor also understands:
 *   /en/tag/<taxonomy>/<slug>/                (story-archive tag links)
 *   /en/news/?filter[<taxonomy>][]=<slug>     (press-release facet links)
 * The block preserves the links verbatim (deep-linking is handled downstream by the
 * tags/listing runtime). If no tag anchors are present it unwraps and bails.
 *
 * DA table shape:
 *   ['Tags']
 *   [ [a, a, a, …] ]     // a single cell holding the list of tag links
 *
 * NOTE: the trailing Metadata block's `tags`/facet columns are emitted separately by
 * the shared skoda-metadata.js transformer, which parses the SAME anchors. This block
 * is the visible on-page chip row; the two are complementary, not duplicative.
 */
export default function parse(element, { document }) {
  const anchors = Array.from(element.querySelectorAll('a.label[href], li a[href], a[href]'))
    .filter((el, i, arr) => arr.indexOf(el) === i);

  // Defensive: no tag links — unwrap and bail.
  if (anchors.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cell = [];
  anchors.forEach((a) => {
    const href = a.getAttribute('href');
    const text = (a.textContent || '').trim();
    if (!href || !text) return;
    const link = document.createElement('a');
    link.setAttribute('href', href);
    link.textContent = text;
    cell.push(link);
  });

  if (cell.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const table = WebImporter.DOMUtils.createTable([['Tags'], [cell]], document);
  element.replaceWith(table);
}
