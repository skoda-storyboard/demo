/* eslint-disable */
/* global WebImporter */
/**
 * Parser: model Technical Data band, contract `spec-table` v2 (resolved to `Columns`, SKODA-208).
 * Source: .so-widget-ys-so-widget-techdata (its #techdata id is missing on some pages,
 *   so the importer locates it by widget class). Structure:
 *     .bg-image > img (optional band image, shown above the stats), <h2>Technical Data</h2>,
 *     .items > .item (span.item-value + span.item-unit + span.item-title),
 *     .buttons > a.btn "Download PDF" (the model's technical-specification PDF).
 *
 * No `spec-table` block exists, and the SKODA-208 amendment allows only existing blocks.
 * The source band is a 3-column stat grid, so the stats map to `Columns` rows of 3 cells
 * (the last row is padded), each cell `<p><strong>value unit</strong></p><p>label</p>`.
 * Output, in order (all but the Columns table are default content):
 *   [<img>]  <h2 data-model-key="techdata">  Columns  [<p><a href=…pdf>Download PDF</a></p>]
 * The dark band styling (SKODA-218 Section Metadata) is NOT emitted: Section Metadata is
 * only consumed on story pages today and would 404 as a block here.
 */
const PER_ROW = 3;

export default function parse(element, { document }) {
  const items = Array.from(element.querySelectorAll('.items > .item'));

  if (items.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const clean = (node) => (node ? (node.textContent || '').replace(/\s+/g, ' ').trim() : '');
  const stats = items.map((item) => {
    const value = [clean(item.querySelector('.item-value')), clean(item.querySelector('.item-unit'))]
      .filter(Boolean).join(' ');
    const label = clean(item.querySelector('.item-title'));
    const cell = [];
    if (value) {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = value;
      p.append(strong);
      cell.push(p);
    }
    if (label) {
      const p = document.createElement('p');
      p.textContent = label;
      cell.push(p);
    }
    return cell;
  }).filter((cell) => cell.length);

  const out = [];
  const bgImg = element.querySelector('.bg-image img');
  if (bgImg) {
    const p = document.createElement('p');
    p.append(bgImg);
    out.push(p);
  }

  const headingText = clean(element.querySelector('h2'));
  if (headingText) {
    const h2 = document.createElement('h2');
    h2.textContent = headingText;
    h2.setAttribute('data-model-key', 'techdata');
    out.push(h2);
  }

  if (stats.length) {
    const cells = [['Columns']];
    for (let i = 0; i < stats.length; i += PER_ROW) {
      const row = stats.slice(i, i + PER_ROW);
      while (row.length < Math.min(PER_ROW, stats.length)) row.push('');
      cells.push(row);
    }
    out.push(WebImporter.DOMUtils.createTable(cells, document));
  }

  const pdf = element.querySelector('.buttons a[href], a.btn[href]');
  if (pdf) {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.setAttribute('href', pdf.getAttribute('href'));
    a.textContent = clean(pdf) || 'Download PDF';
    p.append(a);
    out.push(p);
  }

  element.replaceWith(...out);
}
