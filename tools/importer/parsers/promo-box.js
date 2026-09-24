/* eslint-disable */
/* global WebImporter */
/**
 * Parser: promo-box (block name: "Promo box")
 * Source: the homepage featured slider — section.promo-box > .items[data-flickity]
 *   > .item > article.promo-box-item (typically 3 hand-picked posts).
 * (measured against .migration/work/samples/sto-home.html + mr-home.html;
 *  ties to docs/ui-specs/template-home.md + the runtime block blocks/promo-box, SKODA-213.)
 *
 * ⚠️ CURATED, NOT INDEX-DRIVEN. The promo-box is an editorially hand-picked set that
 * a query-index config cannot reproduce, so we carry the picked items as authored
 * cards. The runtime block (SKODA-213) CURATED mode requires **exactly three rows,
 * each with a story link in a teaser heading** (image + optional summary); it shows a
 * visible error otherwise. So we emit the "Promo box" block with one card per item and
 * ONLY items that resolve to a story link (link-less items are skipped, never guessed).
 *
 * DA table shape (curated) — matches blocks/promo-box authoring contract:
 *   ['Promo box']
 *   [img, [<h3><a href>title</a></h3>, <p>summary?</p>]]
 *   … (× the picked items, in author order)
 */
export default function parse(element, { document }) {
  // ONE precise selector so a wrapper and its inner <article> aren't both matched
  // (matching both duplicates every card — and the curated block requires exactly 3
  // rows). Prefer the per-item <article>; fall back to the flickity .item wrapper.
  let items = Array.from(element.querySelectorAll('article.promo-box-item'));
  if (items.length === 0) items = Array.from(element.querySelectorAll('.items > .item'));

  if (items.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [['Promo box']];
  let emitted = 0;

  items.forEach((item) => {
    const img = item.querySelector('img');
    const anchor = item.querySelector('a[href]');
    const href = anchor && anchor.getAttribute('href');
    // The runtime block requires a story link per curated card — skip link-less items.
    if (!href || href === '#') return;

    // Title: an explicit teaser heading, else the story link's text, else the image alt.
    const titleEl = item.querySelector('.article-teaser-title, .entry-title, h2, h3');
    const title = (titleEl && (titleEl.textContent || '').trim())
      || (anchor.textContent || '').trim()
      || (img && img.getAttribute('alt')) || '';
    if (!title) return; // a card with no title/link is unusable

    // Body cell: a linked heading (### [title](href)) + optional summary paragraph.
    const heading = document.createElement('h3');
    const link = document.createElement('a');
    link.setAttribute('href', href);
    link.textContent = title;
    heading.append(link);
    const bodyCell = [heading];

    const summaryEl = item.querySelector('.article-teaser-excerpt, .entry-summary, .perex');
    const summary = summaryEl && (summaryEl.textContent || '').trim();
    if (summary) {
      const p = document.createElement('p');
      p.textContent = summary;
      bodyCell.push(p);
    }

    cells.push([img || '', bodyCell]);
    emitted += 1;
  });

  // The block needs a valid card set; if nothing resolved, unwrap and bail.
  if (emitted === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const table = WebImporter.DOMUtils.createTable(cells, document);
  element.replaceWith(table);
}
