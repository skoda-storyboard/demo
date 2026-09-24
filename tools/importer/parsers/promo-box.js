/* eslint-disable */
/* global WebImporter */
/**
 * Parser: promo-box (block name: "Cards (promo)")
 * Source: the homepage featured slider — section.promo-box > .items[data-flickity]
 *   > .item > article.promo-box-item (typically 3 hand-picked posts).
 * (measured against .migration/work/samples/sto-home.html + mr-home.html;
 *  ties to docs/ui-specs/template-home.md.)
 *
 * ⚠️ CURATED, NOT INDEX-DRIVEN. The promo-box is an editorially hand-picked set
 * (mixed content types, specific order) that a query-index config (template/tags/
 * limit) cannot reproduce. So — unlike the rails — we DO carry the picked items as
 * authored default-content cards (image + title + link), giving authors an editable
 * starting point. (Open decision in template-home.md §"open decisions": a curated-
 * items block that stores N index paths could replace this later.)
 *
 * ⚠️ CONTENT-DRIVEN, NOT POSITIONAL. Items are read from the matched element; bails
 * (unwrap) if none are present.
 *
 * DA table shape (one row per picked item): [linkedImage, titleLink].
 *   ['Cards (promo)']
 *   [img(wrapped in its link), <a href>title</a>]
 */
export default function parse(element, { document }) {
  const items = Array.from(element.querySelectorAll('article.promo-box-item, .item article, .items > .item'))
    .filter((el, i, arr) => arr.indexOf(el) === i);

  if (items.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [['Cards (promo)']];
  let emitted = 0;

  items.forEach((item) => {
    const img = item.querySelector('img');
    const anchor = item.querySelector('a[href]');
    const href = anchor ? anchor.getAttribute('href') : '';
    // Title: an explicit heading/title element, else the image alt.
    const titleEl = item.querySelector('.article-teaser-title, h2, h3');
    const title = (titleEl && (titleEl.textContent || '').trim())
      || (img && img.getAttribute('alt')) || '';

    if (!img && !title) return; // nothing usable — skip, never guess

    const titleCell = [];
    if (href && title) {
      const link = document.createElement('a');
      link.setAttribute('href', href);
      link.textContent = title;
      titleCell.push(link);
    } else if (title) {
      const p = document.createElement('p');
      p.textContent = title;
      titleCell.push(p);
    }

    cells.push([img || '', titleCell]);
    emitted += 1;
  });

  if (emitted === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const table = WebImporter.DOMUtils.createTable(cells, document);
  element.replaceWith(table);
}
