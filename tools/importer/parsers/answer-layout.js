/* global WebImporter */
/*
 * A press-kit accordion answer's authored layout (#275). DA keeps neither the source's empty
 * paragraphs (a pushed `<p>&nbsp;</p>` is dropped on preview, SKODA-805c) nor its SiteOrigin
 * cell widths, so both travel as small tables nested in the answer, as a nested Quote does:
 * - `Spacer`: an empty paragraph, a blank line and its paragraph gap (the first-glimpse
 *   answer 1 ends each image cell with one, 44px)
 * - `Spacer (row)`: an empty builder row, its two 10px cell insets (answer 8 ends with one)
 * - `Media row` + one width per cell: a row of side-by-side image cells whose widths aren't
 *   equal (the source sizes them in its panels CSS, `#pgc-… { width:50.3984% }`), placed
 *   before the row's first image. press-kit.js reads it; equal rows carry none.
 * The Accordion block draws the spacers. Marked in `preprocess`, while the panels CSS is
 * still in the document and before helix-importer drops whitespace-only paragraphs; built
 * after the content flatten.
 */

const ANSWERS = '.widget_ys-row-toggle + .widget_siteorigin-panels-builder';
const text = (node) => (node?.textContent || '').replace(/\s+/g, ' ').trim();
const blank = (node) => !text(node) && !node.querySelector('img, picture, iframe, video, a[href]');

// The desktop width (%) of each builder cell, by id; the mobile @media rules stack them.
function cellWidths(document) {
  const css = [...document.querySelectorAll('style')].map((style) => style.textContent).join('\n')
    .replace(/@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');
  const widths = new Map();
  [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].forEach(([, selectors, body]) => {
    const width = body.match(/(?:^|;)\s*width:\s*([\d.]+)%/);
    if (!width) return;
    selectors.split(',').map((s) => s.trim()).filter((s) => /^#pgc-[\w-]+$/.test(s))
      .forEach((s) => { if (!widths.has(s.slice(1))) widths.set(s.slice(1), Number(width[1])); });
  });
  return widths;
}

function marker(document, data, value, label) {
  const p = document.createElement('p');
  p.dataset[data] = value;
  p.textContent = label;
  return p;
}

/** Mark the spacers and unequal image rows of every accordion answer under `root`. */
export function markAnswerLayout(root) {
  const document = root.ownerDocument;
  const widths = cellWidths(document);
  root.querySelectorAll(ANSWERS).forEach((answer) => {
    answer.querySelectorAll('.textwidget > p').forEach((p) => {
      if (blank(p)) p.replaceWith(marker(document, 'skodaSpacer', 'line', 'Spacer'));
    });
    const layout = answer.querySelector('.panel-layout');
    [...(layout?.children || [])].filter((row) => row.matches('.panel-grid')).forEach((row) => {
      const cells = [...row.querySelectorAll(':scope > .panel-grid-cell')];
      if (blank(row)) {
        row.querySelector('.textwidget')?.append(marker(document, 'skodaSpacer', 'row', 'Spacer'));
        return;
      }
      if (cells.length < 2 || !cells.every((cell) => cell.querySelectorAll('img').length === 1)) return;
      const cellWidth = cells.map((cell) => widths.get(cell.id));
      const equal = cellWidth.every((w) => Math.abs(w - 100 / cells.length) < 0.01);
      if (equal || cellWidth.some((w) => !(w > 0))) return;
      cells[0].querySelector('.textwidget')
        ?.prepend(marker(document, 'skodaMediaRow', cellWidth.join(' '), 'Media row'));
    });
  });
}

/** The marked spacers and image rows become their tables. */
export default function answerLayout(root, { document }) {
  root.querySelectorAll('p[data-skoda-spacer]').forEach((p) => {
    const name = p.dataset.skodaSpacer === 'row' ? 'Spacer (row)' : 'Spacer';
    p.replaceWith(WebImporter.DOMUtils.createTable([[name]], document));
  });
  root.querySelectorAll('p[data-skoda-media-row]').forEach((p) => {
    const cells = p.dataset.skodaMediaRow.split(' ').map((w) => `${w}%`);
    p.replaceWith(WebImporter.DOMUtils.createTable([['Media row'], cells], document));
  });
}
