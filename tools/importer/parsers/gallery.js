/* eslint-disable */
/* global WebImporter */
/**
 * Parser: gallery (block name: "Gallery")
 * Source: the press-release secondary-column image set —
 *   section.images.sa-media-kit-preview > .items > .item > article.gallery-item
 * (measured against .migration/work/samples/press.html; ties to docs/ui-specs/gallery-lightbox.md).
 *
 * ⚠️ CONTENT-DRIVEN, NOT POSITIONAL. The parser is handed the element the
 * `.sa-media-kit-preview` block selector matched and derives everything from the
 * DOM inside it — never from URL, template type, or section position. If the
 * expected image items are absent it unwraps and bails rather than emit a bad block.
 *
 * DA table shape (one row per image): cell 1 = <img>, cell 2 = caption text.
 *   ['Gallery']
 *   [img, caption]
 *   ...
 *
 * Media rules (SKODA-501): the <img> is emitted as a direct table-cell child (so
 * EDS wraps it in <picture>), alt is preserved, and the caption is read from
 * data-caption — ~53% of Škoda captions live there, not in visible text.
 */
export default function parse(element, { document }) {
  // Each gallery entry is an <article> (…gallery-item…) inside .items > .item.
  // Use ONE precise selector so a wrapper and its inner <article> are not both
  // matched — matching both would try to reuse the same live <img> node in two
  // cells, and appending a node twice moves it, emptying the first cell.
  let items = Array.from(element.querySelectorAll('article.gallery-item'));
  if (items.length === 0) items = Array.from(element.querySelectorAll('.items > .item'));

  // Defensive: nothing gallery-shaped here — unwrap and bail.
  if (items.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [['Gallery']];
  let emitted = 0;

  items.forEach((item) => {
    const img = item.querySelector('img');
    if (!img) return; // skip caption-less/image-less entries, never guess

    // Caption: data-caption first (SKODA-501), then the colorbox title, then alt.
    const captionEl = item.querySelector('[data-caption]');
    const caption = (captionEl && captionEl.getAttribute('data-caption'))
      || (item.querySelector('a[title]') && item.querySelector('a[title]').getAttribute('title'))
      || img.getAttribute('alt')
      || '';

    cells.push([img, caption]);
    emitted += 1;
  });

  // No usable images after filtering — unwrap and bail.
  if (emitted === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const table = WebImporter.DOMUtils.createTable(cells, document);
  element.replaceWith(table);
}
