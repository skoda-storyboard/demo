/*
 * Cards / Teaser block (SKODA-201) — the universal card unit.
 *
 * ONE block, three co-occurring variants read from the block classlist and authored as
 * `Cards (media)` / `Cards (overlay)` / `Cards (toolbar)` in DA (EDS maps the parenthetical
 * to modifier classes: `Cards (overlay)` -> `.cards.overlay`). A single card may combine
 * variants, e.g. `Cards (overlay, toolbar)` -> `.cards.overlay.toolbar`.
 * `Cards (social)` (SKODA-217) is a separate, link-only shape — the homepage
 * follow-profile tiles — decorated by ./cards-social.js.
 *
 * The card structure, content-sniffing, and visual all live in the shared primitive
 * (scripts/card-teaser.js + styles/card-teaser.css, SKODA-201), reused by every card
 * consumer (cards, stories, …). This block only turns authored DA rows into card-teaser
 * <li>s and owns its grid (cards.css). See docs/ui-specs/card-teaser.md.
 */

import { decorateCardCells, optimizeImages, wireCardLink } from '../../scripts/card-teaser.js';

// `Cards (overlay, tiles)` size token (contract `cards-tiles` shape 2): the first cell of a
// row, e.g. `sq`, `wide end`; an empty cell means `sq-small`.
const TILE_TOKEN = /^(?:sq|sq-small|wide|third|third-sq|two-thirds|quarter|feature|banner|banner-tall)(?:\s+end)?$/i;

/**
 * Take the size token off a tile row so it never prints as body text, and keep it on the
 * card as `data-tile-size` for the mosaic layout (SKODA-221). Only a link-free, image-free
 * first cell holding a known token (or nothing) counts; an omitted token leaves the row as is.
 */
function takeTileToken(row, li) {
  const cell = row.firstElementChild;
  if (!cell || row.children.length < 2 || cell.querySelector('img, picture, a, h1, h2, h3, h4, h5, h6')) return;
  const token = cell.textContent.trim().replace(/\s+/g, ' ');
  if (token && !TILE_TOKEN.test(token)) return;
  li.dataset.tileSize = token.toLowerCase() || 'sq-small';
  cell.remove();
}

export default async function decorate(block) {
  // `Cards (social)` (SKODA-217): link-only follow-profile tiles, a different
  // authored shape from teaser cards — loaded on demand (icon data)
  if (block.classList.contains('social')) {
    const { default: decorateSocialCards } = await import('./cards-social.js');
    decorateSocialCards(block);
    return;
  }

  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'card-teaser';
    // carry the block's variant modifiers (overlay/toolbar) onto the card
    ['overlay', 'toolbar', 'media'].forEach((v) => {
      if (block.classList.contains(v)) li.classList.add(v);
    });
    if (block.classList.contains('tiles')) takeTileToken(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    decorateCardCells(li); // content-sniffed, defensive (shared primitive)
    ul.append(li);
  });

  optimizeImages(ul);
  [...ul.children].forEach((li) => wireCardLink(li));

  block.replaceChildren(ul);
}
