/* global WebImporter */

/**
 * Transformer: the company pages' asset layouts (SKODA-810b, docs/ui-specs/company-pages.md).
 *
 * Runs in beforeTransform right after skoda-page-rows, before skoda-company-people and the
 * cleanup. Content-driven: a page is one of these by what its SiteOrigin body holds.
 *
 * Brand assets (/en/company-logo/): rows of logo tiles, each an editor widget with the image
 * and its "PDF download" / "PNG download" links, under heading rows. Every row becomes its own
 * section, `Style: brand-assets` (the source's full-width layout): a heading row its heading
 * as text, a tile row a `Brand Asset` block, one row per tile [image, links]. A row the source
 * frames with a padding on every side (its last) adds `framed`.
 *
 * App promo (/en/skoda-media-services-application/): a body with links to the app stores. Its
 * rows (before a trailing spacer row) become one `App Promo` block, a block row per source
 * row, nested builder rows flattened in order: the intro [icon, text], the mockup [image], the
 * two columns [text + screenshot, screenshot + text], the download panel's heading [text] and
 * its store strip [QR, App Store badge, Google Play badge]. blocks/app-promo reads each row's
 * part from its shape; the spacer widgets in a cell are its CSS.
 */

// the section mark skoda-page-rows reads in afterTransform (keep in sync with that file)
const MARK = 'data-skoda-page-body';
const BRAND = 'brand-assets';
const FRAMED = 'framed';
const FRAMED_ATTR = 'data-skoda-framed';
const STORE_LINK = /^https?:\/\/(?:apps\.apple\.com|play\.google\.com)\//i;
const DOWNLOAD_TEXT = /\bdownload\b/i;
// story-flatten's mark for a wholly bold heading, restored after the transform (keep in sync)
const BOLD_ATTR = 'data-skoda-bold';

const KEEP = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'A', 'IMG', 'UL', 'OL', 'LI', 'H2', 'H3', 'H4']);

const rowsOf = (layout) => [...(layout?.children || [])].filter((r) => r.matches('.panel-grid'));

// the row's cells (SiteOrigin wraps them in `.panel-row-style` on a styled row)
const cellsOf = (row) => [...row.children]
  .flatMap((child) => (child.matches('.panel-row-style') ? [...child.children] : [child]))
  .filter((c) => c.matches('.panel-grid-cell'));

// a cell's own widgets, in order (not those of a builder nested in it)
const widgetsOf = (cell) => [...cell.querySelectorAll('.so-panel')]
  .filter((w) => w.parentElement.closest('.panel-grid-cell') === cell);

const isSpacer = (widget) => widget.matches('.widget_skoda-offset');
const isBuilder = (widget) => widget.matches('.widget_siteorigin-panels-builder');
const isEditor = (widget) => widget.matches('.widget_sow-editor');
const filled = (cell) => widgetsOf(cell).some((w) => !isSpacer(w));

/** Clean copies of an editor's blocks: text, bold, breaks, links (href), images (src, alt). */
function cleanNodes(source, document) {
  const clean = (node) => {
    if (node.nodeType === 3) return [document.createTextNode(node.textContent)];
    if (node.nodeType !== 1) return [];
    const kids = [...node.childNodes].flatMap(clean);
    if (!KEEP.has(node.tagName)) return kids;
    const el = document.createElement(node.tagName.toLowerCase());
    if (node.tagName === 'A' && node.getAttribute('href')) el.setAttribute('href', node.getAttribute('href'));
    if (node.hasAttribute(BOLD_ATTR)) el.setAttribute(BOLD_ATTR, '');
    if (node.tagName === 'IMG') {
      el.setAttribute('src', node.getAttribute('src') || '');
      el.setAttribute('alt', node.getAttribute('alt') || '');
      return [el];
    }
    el.append(...kids);
    return [el];
  };
  const text = source?.querySelector('.siteorigin-widget-tinymce, .textwidget') || source;
  return [...(text?.childNodes || [])].flatMap(clean)
    .filter((n) => !(n.nodeType === 3 && !n.textContent.trim()))
    .filter((n) => !(n.nodeType === 1 && !n.textContent.trim() && !n.querySelector('img, a') && n.tagName !== 'IMG'));
}

const cellNodes = (cell, document) => widgetsOf(cell).filter(isEditor)
  .flatMap((w) => cleanNodes(w, document));

// ---- brand assets ---------------------------------------------------------------------

/** A logo tile: an editor widget with an image and a download link. */
const isTile = (cell) => widgetsOf(cell).some((w) => isEditor(w) && w.querySelector('img')
  && [...w.querySelectorAll('a[href]')].some((a) => DOWNLOAD_TEXT.test(a.textContent)));

/**
 * Preprocess: mark the rows the source frames with a padding on all four sides (the logo
 * page's last row, `padding: 70px`), from the page's layout CSS before the cleanup drops it.
 */
function markFramedRows(element) {
  const doc = element.ownerDocument;
  const css = [...doc.querySelectorAll('style')].map((s) => s.textContent).join('\n');
  [...css.matchAll(/([^{}@]+)\{([^}]*)\}/g)].forEach(([, selectors, body]) => {
    const pad = (body.match(/(?:^|;)\s*padding\s*:\s*([^;]+)/i) || [])[1];
    const parts = pad?.trim().split(/\s+/).map((v) => parseFloat(v));
    if (parts?.length !== 4 || !parts.every((v) => v > 0)) return;
    selectors.split(',').forEach((sel) => {
      const m = sel.trim().match(/^#(pg-[\w-]+)\s*>\s*\.panel-row-style$/);
      if (m) doc.getElementById(m[1])?.setAttribute(FRAMED_ATTR, '');
    });
  });
}

function brandAssets(layout, document) {
  const rows = rowsOf(layout);
  if (!rows.some((row) => cellsOf(row).some(isTile))) return false;
  rows.forEach((row, i) => {
    const style = row.hasAttribute(FRAMED_ATTR) ? `${BRAND}, ${FRAMED}` : BRAND;
    row.removeAttribute(FRAMED_ATTR);
    const cells = cellsOf(row).filter(filled);
    const tiles = cells.filter(isTile);
    const content = tiles.length
      ? [WebImporter.DOMUtils.createTable([['Brand Asset'], ...tiles.map((cell) => [cellNodes(cell, document)])], document)]
      : cells.flatMap((cell) => cellNodes(cell, document));
    row.replaceChildren(...content);
    row.setAttribute(MARK, style);
    if (i > 0 && row.previousElementSibling?.tagName !== 'HR') row.before(document.createElement('hr'));
  });
  return true;
}

// ---- app promo ------------------------------------------------------------------------

/** The block rows of one source row: a row per nested builder row, else the row's cells. */
function promoRows(row, document) {
  const cells = cellsOf(row).filter(filled);
  if (cells.length === 1) {
    return widgetsOf(cells[0]).flatMap((w) => {
      if (isBuilder(w)) return rowsOf(w.querySelector('.panel-layout')).flatMap((r) => promoRows(r, document));
      if (isEditor(w)) {
        const nodes = cleanNodes(w, document);
        return nodes.length ? [[nodes]] : [];
      }
      return [];
    });
  }
  return cells.length ? [cells.map((cell) => cellNodes(cell, document))] : [];
}

function appPromo(layout, document) {
  if (![...layout.querySelectorAll('a[href]')].some((a) => STORE_LINK.test(a.getAttribute('href')))) return false;
  const rows = rowsOf(layout);
  // the body's trailing spacer rows stay (skoda-company-people makes them Spacer sections)
  let end = rows.length;
  while (end > 0 && cellsOf(rows[end - 1]).every((c) => widgetsOf(c).every(isSpacer))) end -= 1;
  const body = rows.slice(0, end);
  if (!body.length) return false;
  const blockRows = body.flatMap((row) => promoRows(row, document));
  body[0].replaceChildren(WebImporter.DOMUtils.createTable([['App Promo'], ...blockRows], document));
  // its section mark (from skoda-page-rows) covers the block; the other rows' go with them
  body.slice(1).forEach((row) => {
    const prev = row.previousElementSibling;
    if (prev?.tagName === 'HR') prev.remove();
    row.remove();
  });
  return true;
}

export default function transform(hookName, element, payload) {
  if (hookName === 'preprocess') {
    markFramedRows(element);
    return;
  }
  if (hookName !== 'beforeTransform') return;
  const document = element.ownerDocument || payload?.document;
  const layout = element.querySelector('article .panel-layout');
  if (!layout) return;
  if (!brandAssets(layout, document)) appPromo(layout, document);
}
