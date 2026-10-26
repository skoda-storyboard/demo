/* global WebImporter */

/**
 * Transformer: the generic page body's sections (SKODA-813).
 *
 * The page-base importer flattens the SiteOrigin rows to default content, so each row
 * becomes its own section: the source sets every row 10px below the one before (its widget
 * style's 10px padding, less a -10px margin), which the `page-body` section style draws. A
 * row that holds its text in the left cell of a 50/50 row, the right cell empty (the live
 * /en/copyright: four of its five rows), shows that text at half the column from 781px:
 * `Style: page-body, half`. Its right cell, when it holds an empty widget rather than none
 * (the copyright's first one), still takes the widget's 10px on phones, where SiteOrigin
 * stacks the cells and hides only an empty cell: `empty-cell`. A body without rows is one
 * `page-body` section.
 *
 * preprocess (the untouched page: the importer drops <style>, which holds the cell widths,
 * before transform): each half-width row is marked. beforeTransform: an <hr> before every
 * row but the first, each row marked with its style. afterTransform: each mark becomes the
 * row's Section Metadata.
 */

const MARK = 'data-skoda-page-body';
const HALF_ROW = 'data-skoda-half-row';
const BODY = 'page-body';
const HALF = 'page-body, half';
const EMPTY_WIDGET = 'empty-cell';

const isFilled = (cell) => !!cell && (!!cell.querySelector('img, picture, iframe, video, table')
  || !!cell.textContent.replace(/[\s\u00a0]/g, ''));

// CSS without its @media blocks (balanced braces): SiteOrigin writes every layout of a page
// into one style, each layout's desktop rules followed by its @media block of mobile overrides
function withoutMedia(css) {
  let out = '';
  let i = 0;
  while (i < css.length) {
    const at = css.indexOf('@media', i);
    if (at < 0) return out + css.slice(i);
    out += css.slice(i, at);
    let depth = 0;
    let j = css.indexOf('{', at);
    if (j < 0) return out;
    for (; j < css.length; j += 1) {
      if (css[j] === '{') depth += 1;
      else if (css[j] === '}') {
        depth -= 1;
        if (!depth) break;
      }
    }
    i = j + 1;
  }
  return out;
}

// `#pgc-…` cell id → its width in %, from the page's SiteOrigin layout CSS (desktop rules)
function cellWidths(doc) {
  const css = withoutMedia([...doc.querySelectorAll('style')].map((s) => s.textContent).join('\n'));
  const widths = new Map();
  [...css.matchAll(/((?:#pgc-[\w-]+\s*,?\s*)+)\{\s*width:\s*([\d.]+)%/g)].forEach(([, ids, w]) => {
    ids.split(',').map((id) => id.trim().replace(/^#/, '')).filter(Boolean)
      .forEach((id) => widths.set(id, Number(w)));
  });
  return widths;
}

// the row's cells (SiteOrigin wraps them in `.panel-row-style` on a styled row)
const cellsOf = (row) => [...row.children]
  .flatMap((child) => (child.matches('.panel-row-style') ? [...child.children] : [child]))
  .filter((c) => c.matches('.panel-grid-cell'));

// a half-width text row: two cells, the left one filled and 50% wide, the right one empty
function isHalfRow(row, widths) {
  const cells = cellsOf(row);
  if (cells.length !== 2) return false;
  const [left, right] = cells;
  return isFilled(left) && !isFilled(right) && widths.get(left.id) === 50;
}

// the body's SiteOrigin rows, in order
function rowsOf(article) {
  const layout = article.querySelector('.panel-layout');
  return layout ? [...layout.children].filter((r) => r.matches('.panel-grid')) : [];
}

export default function transform(hookName, element, payload) {
  const doc = element.ownerDocument || payload?.document;
  const article = element.querySelector('article.page, article.post');
  if (hookName === 'preprocess') {
    if (!article) return;
    const widths = cellWidths(doc);
    rowsOf(article).filter((row) => isHalfRow(row, widths)).forEach((row) => {
      row.setAttribute(HALF_ROW, cellsOf(row)[1].querySelector('.so-panel') ? EMPTY_WIDGET : '');
    });
  }

  if (hookName === 'beforeTransform') {
    if (!article) return;
    const rows = rowsOf(article);
    if (!rows.length) {
      (article.querySelector('.entry-content') || article).setAttribute(MARK, BODY);
      return;
    }
    rows.forEach((row, i) => {
      const half = row.getAttribute(HALF_ROW);
      let style = BODY;
      if (half !== null) style = half ? `${HALF}, ${half}` : HALF;
      row.removeAttribute(HALF_ROW);
      if (i > 0) row.before(doc.createElement('hr'));
      row.setAttribute(MARK, style);
    });
  }

  if (hookName === 'afterTransform') {
    element.querySelectorAll(`[${MARK}]`).forEach((anchor) => {
      const style = anchor.getAttribute(MARK);
      anchor.removeAttribute(MARK);
      anchor.before(WebImporter.Blocks.createBlock(doc, { name: 'Section Metadata', cells: { style } }));
    });
  }
}
