/*
 * Cards / Teaser block (SKODA-201) — the universal card unit.
 *
 * ONE block, three co-occurring variants read from the block classlist and authored as
 * `Cards (media)` / `Cards (overlay)` / `Cards (toolbar)` in DA (EDS maps the parenthetical
 * to modifier classes: `Cards (overlay)` -> `.cards.overlay`). A single card may combine
 * variants, e.g. `Cards (overlay, toolbar)` -> `.cards.overlay.toolbar`.
 *
 * The card structure, content-sniffing, and visual all live in the shared primitive
 * (scripts/card-teaser.js + styles/card-teaser.css, SKODA-201), reused by every card
 * consumer (cards, stories, …). This block only turns authored DA rows into card-teaser
 * <li>s and owns its grid (cards.css). See docs/ui-specs/card-teaser.md.
 */

import { decorateCardCells, optimizeImages, wireCardLink } from '../../scripts/card-teaser.js';

export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'card-teaser';
    // carry the block's variant modifiers (overlay/toolbar) onto the card
    ['overlay', 'toolbar', 'media'].forEach((v) => {
      if (block.classList.contains(v)) li.classList.add(v);
    });
    while (row.firstElementChild) li.append(row.firstElementChild);
    decorateCardCells(li); // content-sniffed, defensive (shared primitive)
    ul.append(li);
  });

  optimizeImages(ul);
  [...ul.children].forEach((li) => wireCardLink(li));

  block.replaceChildren(ul);
}
