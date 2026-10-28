/* global WebImporter */

/**
 * Transformer: a generic page's body tables become `Table` blocks (SKODA-843).
 *
 * The importer reads any <table> left in the body as a block, its first cell as the block's
 * name, so the consent page's label / value table ("Purpose of the processing:" …) came out as
 * an unknown `purpose-of-the-processing` block. Here each body table is rebuilt as a `Table`
 * block, one block row per source row, each cell's content as it is (its <strong> and links
 * kept). A table whose first row is all header cells is `Table (header)`; its first row stays
 * the head. A layout table with nothing in it is dropped.
 *
 * beforeTransform, while the source tables are still in the body; self-contained (no imports),
 * as the bundles and the transformer validator load it standalone.
 */

const DONE = 'data-skoda-table';

const hasContent = (el) => !!el.textContent.replace(/[\s\u00a0]/g, '') || !!el.querySelector('img, picture, a[href]');

function toBlock(table, document) {
  const rows = [...table.rows].filter((row) => [...row.cells].some(hasContent));
  if (!rows.length) return null;
  // a cell spanning n columns takes n block cells, its content in the first: the columns stay in
  // line (a block has no spans); rowspan is not modelled
  const span = (cell) => Math.max(1, Number.parseInt(cell.getAttribute('colspan'), 10) || 1);
  const columns = (row) => [...row.cells].reduce((n, cell) => n + span(cell), 0);
  const width = Math.max(...rows.map(columns));
  const header = [...rows[0].cells].every((cell) => cell.tagName === 'TH');
  const cells = rows.map((row) => {
    const out = [];
    [...row.cells].forEach((cell) => {
      const div = document.createElement('div');
      div.append(...cell.childNodes);
      out.push(div, ...Array.from({ length: span(cell) - 1 }, () => document.createElement('div')));
    });
    while (out.length < width) out.push(document.createElement('div'));
    return out;
  });
  const block = WebImporter.DOMUtils.createTable([[header ? 'Table (header)' : 'Table'], ...cells], document);
  block.setAttribute(DONE, '');
  return block;
}

export default function transform(hookName, element, payload) {
  if (hookName !== 'beforeTransform') return;
  const doc = payload?.document || element.ownerDocument;
  // innermost first: a table inside another table's cell is its own block row content
  [...element.querySelectorAll(`table:not([${DONE}])`)].reverse().forEach((table) => {
    if (table.closest(`[${DONE}]`)) return;
    const block = toBlock(table, doc);
    if (block) table.replaceWith(block);
    else table.remove();
  });
}
