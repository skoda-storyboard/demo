/* eslint-disable */
/* global WebImporter */
/**
 * Parser: skodapedia (block name: "Skodapedia")
 * Source: the Škodapedia glossary directory (post-type-archive-skodapedia) —
 *   .sp__list-content > .sp__list-directory__item.sp-<letter> > a[href][data-term-id][data-term-path]
 *   (~212 term rows; A–Z nav .sp__list-nav is a client-side filter, not needed in DA).
 * (measured against .migration/work/samples/skodapedia-directory.html; ties to
 *  docs/ui-specs/skodapedia.md, SKODA-206; term-detail prebake → SKODA-802.)
 *
 * ⚠️ CONTENT-DRIVEN, NOT POSITIONAL. Reads the term rows inside the matched element.
 * Bails (unwrap) if none are present. The 212 term-detail fragments (a thin REST
 * fetch on the source) are pre-baked separately under SKODA-802 — this block emits
 * the directory index (one row per term: letter + linked title) that the runtime
 * Skodapedia block re-filters A–Z / by model / by category client-side.
 *
 * DA table shape (one row per term):
 *   ['Skodapedia']
 *   ['<letter>', <a href=term-path>Title</a>]
 */
export default function parse(element, { document }) {
  const rows = Array.from(element.querySelectorAll('.sp__list-directory__item'));
  if (rows.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [['Skodapedia']];
  let emitted = 0;

  rows.forEach((row) => {
    const a = row.querySelector('a[href]');
    if (!a) return;
    const title = (a.textContent || '').trim();
    const href = a.getAttribute('href');
    if (!title || !href) return;

    // Letter bucket: the `sp-<letter>` class on the row (client-side A–Z group).
    const cls = row.className || '';
    const m = cls.match(/\bsp-([a-z0-9]+)\b/i);
    const letter = m ? m[1].toLowerCase() : '';

    const link = document.createElement('a');
    link.setAttribute('href', href);
    link.textContent = title;

    cells.push([letter, link]);
    emitted += 1;
  });

  if (emitted === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const table = WebImporter.DOMUtils.createTable(cells, document);
  element.replaceWith(table);
}
