/* eslint-disable */
/* global WebImporter */
/**
 * Parser: downloads (block name: "Downloads")
 * Source: the press-release Media Box —
 *   div.cover-box.dark div.search-results.media-box (…-container) with a grid of
 *   article.media-cart-item entries, each carrying a preview <img>, a download
 *   anchor (a.media-cart-action[data-action="download"] or a[href*="direct-download"]),
 *   add-to-cart actions with data-size (Original / 1920px), and a caption.
 * (measured against .migration/work/samples/press.html; ties to docs/ui-specs/downloads.md, SKODA-502.)
 *
 * ⚠️ CONTENT-DRIVEN, NOT POSITIONAL. Everything is derived from the DOM inside the
 * element the Media-Box selector matched. If no download-shaped items are found it
 * unwraps and bails rather than emit an empty block.
 *
 * Media rules:
 *  - SKODA-502: one row per asset = preview image + title + a download link.
 *  - SKODA-503: PDF/MP4 references are emitted as plain links (never the image pipeline);
 *    detection is by href/type, not by page.
 *  - SKODA-505: per-asset cart hooks are carried onto the download link as
 *    data-action / data-id / data-size so the demo media-cart can wire them later.
 *
 * DA table shape (one row per asset):
 *   ['Downloads']
 *   [previewImgOrEmpty, linkCell]     // linkCell = <a href> (title text) + optional size label
 */

// Is this href a document/binary that must stay a link, not an <img>? (SKODA-503)
function isBinaryHref(href) {
  return /\.(pdf|mp4|zip|docx?|pptx?|xlsx?)(\?|#|$)/i.test(href || '');
}

export default function parse(element, { document }) {
  // Media-box entries: prefer the per-asset <article>; fall back to result items.
  let items = Array.from(element.querySelectorAll('article.media-cart-item'));
  if (items.length === 0) {
    items = Array.from(element.querySelectorAll('.search-results-item, .items > .item'));
  }

  // Defensive: nothing download-shaped — unwrap and bail.
  if (items.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [['Downloads']];
  let emitted = 0;

  items.forEach((item) => {
    // Download URL: explicit download action first, then any direct-download href,
    // then the colorbox/original-file anchor.
    const dlAnchor = item.querySelector('a[data-action="download"]')
      || item.querySelector('a[href*="direct-download"]')
      || item.querySelector('a.colorbox[href], a.file-type[href]');
    const href = dlAnchor && dlAnchor.getAttribute('href');
    if (!href || href === '#') return; // no resolvable asset — skip, never guess

    const img = item.querySelector('img');

    // Title: caption → colorbox title → alt → clean filename (no query/fragment).
    const captionEl = item.querySelector('[data-caption]');
    const filename = href.split('/').pop().split(/[?#]/)[0];
    const title = (captionEl && captionEl.getAttribute('data-caption'))
      || (dlAnchor.getAttribute('title') || '').replace(/^Download\s+/i, '').trim()
      || (img && img.getAttribute('alt'))
      || filename;

    // Per-asset cart hooks (SKODA-505). Carry the source data-* onto our link.
    const link = document.createElement('a');
    link.setAttribute('href', href);
    link.textContent = title;
    const addAction = item.querySelector('a[data-action="add"][data-id]');
    const dataId = (addAction && addAction.getAttribute('data-id'))
      || (dlAnchor.getAttribute('data-id')) || '';
    if (dataId) link.setAttribute('data-id', dataId);
    // PDFs/MP4s are pure links; images get a media-cart "add" affordance seam.
    link.setAttribute('data-action', isBinaryHref(href) ? 'link' : 'download');
    const sizeAction = item.querySelector('a[title*="Original" i], a[data-size]');
    const dataSize = (sizeAction && sizeAction.getAttribute('data-size')) || 'original';
    if (!isBinaryHref(href)) link.setAttribute('data-size', dataSize || 'original');

    // Put the link and the size/type label in separate paragraphs so the label
    // does not run onto the link text when the table is flattened to DA divs.
    const linkPara = document.createElement('p');
    linkPara.append(link);
    const linkCell = [linkPara];
    const label = isBinaryHref(href)
      ? href.split('.').pop().split(/[?#]/)[0].toUpperCase()
      : 'Original';
    if (label) {
      const labelPara = document.createElement('p');
      labelPara.textContent = label;
      linkCell.push(labelPara);
    }

    cells.push([img || '', linkCell]);
    emitted += 1;
  });

  if (emitted === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const table = WebImporter.DOMUtils.createTable(cells, document);
  element.replaceWith(table);
}
