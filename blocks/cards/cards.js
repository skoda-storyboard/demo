/*
 * Cards / Teaser block (SKODA-201) — the universal card unit.
 *
 * ONE block, with media/overlay/toolbar variants and an authored mosaic (overlay, tiles).
 * Variants are read from the block classlist and authored as
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

import {
  decorateCardCells, isImageCell, optimizeImages, wireCardLink,
} from '../../scripts/card-teaser.js';
import { layoutTileRows } from '../../scripts/cards-tiles.js';

const TILE_IMAGE_WIDTHS = {
  sq: '1250',
  wide: '1250',
  'sq-small': '750',
  quarter: '750',
  third: '850',
  'third-sq': '850',
  'two-thirds': '1800',
  banner: '2500',
  'banner-tall': '2500',
  feature: '1000',
  'press-square': '500',
  'press-quarter': '750',
};

export function parseTileRows(block) {
  if (!block.classList.contains('overlay')) {
    throw new Error('Cards tiles: the overlay variant is required');
  }
  // Legacy press-kit previews use ambiguous `sq` tokens, even for the four-up final row.
  const pressPage = block.ownerDocument.body.classList.contains('press-kit')
    || !!block.ownerDocument.querySelector('meta[name="template"][content="press_kit"]');
  const rows = [...block.children].map((row, index) => {
    const cells = [...row.children];
    if (!cells.length) throw new Error(`Cards tiles row ${index + 1}: missing cells`);
    const hasToken = !isImageCell(cells[0]) && cells.length !== 2;
    const raw = hasToken ? cells[0]?.textContent.trim() || '' : '';
    const image = cells[hasToken ? 1 : 0];
    const title = cells[hasToken ? 2 : 1];
    const link = title?.querySelector('a[href]');
    if (cells.length !== (hasToken ? 3 : 2) || !image || !isImageCell(image)
      || !link?.getAttribute('href')?.trim() || !link.textContent.trim()
      || title.querySelectorAll('a').length !== 1
      || title.textContent.trim() !== link.textContent.trim()) {
      throw new Error(`Cards tiles row ${index + 1}: expected [size, picture, linked title]`);
    }
    return {
      row, raw, title, link, hasToken,
    };
  });
  const { tiles: layout, mode } = layoutTileRows(rows.map(({ raw }) => raw), { pressPage });
  const tiles = rows.map((row, index) => ({ ...row, ...layout[index] }));
  return { tiles, mode };
}

export default async function decorate(block) {
  // `Cards (social)` (SKODA-217): link-only follow-profile tiles, a different
  // authored shape from teaser cards — loaded on demand (icon data)
  if (block.classList.contains('social')) {
    const { default: decorateSocialCards } = await import('./cards-social.js');
    decorateSocialCards(block);
    return;
  }

  const isTiles = block.classList.contains('tiles');
  const parsed = isTiles ? parseTileRows(block) : null;
  const ul = document.createElement('ul');
  if (parsed?.mode === 'press') ul.classList.add('tiles-press');
  (parsed?.tiles || [...block.children].map((row) => ({ row }))).forEach(({
    row, token, rowStart, title, link, hasToken,
  }) => {
    const li = document.createElement('li');
    li.className = 'card-teaser';
    if (isTiles) {
      li.classList.add(`tile-${token}`);
      if (rowStart) li.classList.add('tile-row-start');
      if (hasToken) row.firstElementChild.remove();
      const heading = document.createElement('h2');
      heading.append(link);
      title.replaceChildren(heading);
    }
    // carry the block's variant modifiers (overlay/toolbar) onto the card
    ['overlay', 'toolbar', 'media'].forEach((v) => {
      if (block.classList.contains(v)) li.classList.add(v);
    });
    while (row.firstElementChild) li.append(row.firstElementChild);
    decorateCardCells(li); // content-sniffed, defensive (shared primitive)
    ul.append(li);
  });

  if (isTiles) {
    [...ul.children].forEach((li, index) => optimizeImages(li, {
      breakpoints: [
        { media: '(min-width: 781px)', width: TILE_IMAGE_WIDTHS[parsed.tiles[index].token] },
        { media: '(min-width: 500px)', width: '1600' },
        { media: '(min-width: 395px)', width: '1000' },
        { width: '750' },
      ],
    }));
  } else {
    optimizeImages(ul);
  }
  [...ul.children].forEach((li) => wireCardLink(li));

  block.replaceChildren(ul);
}
