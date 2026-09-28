/* eslint-disable */
/* global WebImporter */

export default function parse(element, { document }) {
  const heading = element.querySelector('.search-results-heading')?.textContent.trim();
  if (!heading) throw new Error('Homepage stories feed needs a heading.');
  element.replaceWith(WebImporter.DOMUtils.createTable([
    ['Stories'],
    ['heading', heading],
    ['template', 'story'],
  ], document));
}
