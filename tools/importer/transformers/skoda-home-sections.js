/* eslint-disable */
/* global WebImporter */

export default function transform(hookName, element) {
  if (hookName === 'beforeTransform') {
    element.querySelectorAll('.cover-box').forEach((band) => {
      band.before(document.createElement('hr'));
    });
  }
  if (hookName === 'afterTransform') {
    element.querySelectorAll('.cover-box').forEach((band) => {
      band.after(WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: band.classList.contains('dark') ? 'cover-box, dark' : 'cover-box' },
      }));
    });
  }
}
