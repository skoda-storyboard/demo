/* eslint-disable */
/* global WebImporter */

export default function parse(element, { document, featuredPaths = [] }) {
  const heading = element.querySelector('.search-results-heading')?.textContent.trim();
  if (!heading) throw new Error('Homepage stories feed needs a heading.');
  const rows = [
    ['Stories'],
    ['heading', heading],
    ['template', 'story'],
  ];
  if (featuredPaths.length) rows.push(['exclude', featuredPaths.join(', ')]);
  element.replaceWith(WebImporter.DOMUtils.createTable(rows, document));
}
