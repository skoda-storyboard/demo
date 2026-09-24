/* eslint-disable */
/* global WebImporter */
/**
 * Parser: spec-table (block name: "Spec Table")
 * Source: #techdata .so-widget-ys-so-widget-techdata
 *   .bg-image > img, <h2>Technical Data</h2>, .items > .item
 *   (each: span.item-value + span.item-unit + span.item-title),
 *   and a .buttons > a.btn "Download PDF".
 *
 * NET-NEW block (no reference impl, SKODA-BLOCK-DATA-MODEL §84).
 * Clean, author-friendly 2-column table: [label, value+unit] per spec row,
 * plus a final row with the Download PDF link. The "Technical Data" heading is
 * kept as default content ABOVE the table.
 */
export default function parse(element, { document }) {
  const heading = element.querySelector('h2');
  const items = Array.from(element.querySelectorAll(':scope > .items > .item, .items > .item'));

  if (items.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [['Spec Table']];

  items.forEach((item) => {
    const value = (item.querySelector('.item-value')?.textContent || '').trim();
    const unit = (item.querySelector('.item-unit')?.textContent || '').trim();
    const title = (item.querySelector('.item-title')?.textContent || '').trim();
    const valueText = [value, unit].filter(Boolean).join(' ');
    cells.push([title, valueText]);
  });

  // Final row: Download PDF link (preserve as an <a>).
  const pdfLink = element.querySelector('.buttons a[href], a.btn[href]');
  if (pdfLink) {
    const a = document.createElement('a');
    a.setAttribute('href', pdfLink.getAttribute('href'));
    a.textContent = (pdfLink.textContent || 'Download PDF').trim();
    cells.push([a, '']);
  }

  const table = WebImporter.DOMUtils.createTable(cells, document);

  if (heading) {
    element.replaceWith(heading, table);
  } else {
    element.replaceWith(table);
  }
}
