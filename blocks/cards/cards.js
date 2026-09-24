/*
 * Cards / Teaser block (SKODA-201): shared authored-card primitive with
 * media, overlay, and toolbar variants supplied by the block classes.
 */

import { decorateCardCells, optimizeImages, wireCardLink } from '../../scripts/card-teaser.js';

export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => ul.append(decorateCardCells(row)));
  optimizeImages(ul);
  [...ul.children].forEach((li) => wireCardLink(li));
  block.replaceChildren(ul);
}
