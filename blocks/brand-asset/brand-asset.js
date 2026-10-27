/*
 * Brand Asset (SKODA-810b, docs/ui-specs/company-pages.md, sub-spec C): the company logo
 * page's tiles, three to a row from 781px (each 17% of the page, centred), one below.
 *
 * One row per asset, one cell, as on the source: the logo image (optionally linked to the
 * file), then its download links ("PDF download", "PNG download"). The links go to the live
 * site's download route and open in a new tab (scripts/links.js). Rows without content drop.
 * Put each source row in a section styled `brand-assets` (styles.css: the full-width layout).
 */

/**
 * @param {Element} block
 */
export default function decorate(block) {
  const list = document.createElement('ul');
  list.className = 'brand-asset-list';
  [...block.children].forEach((row) => {
    const cells = [...row.children].filter((cell) => cell.textContent.trim() || cell.querySelector('picture, img'));
    if (!cells.length) return;
    const tile = document.createElement('li');
    tile.className = 'brand-asset-tile';
    cells.forEach((cell) => tile.append(...cell.childNodes));
    // a cell of one paragraph arrives without it: the links line keeps its paragraph rhythm
    if (![...tile.children].some((el) => el.matches('p'))) {
      const p = document.createElement('p');
      p.append(...tile.childNodes);
      tile.append(p);
    }
    tile.querySelectorAll('p').forEach((p) => {
      if (p.querySelector('picture, img') && !p.textContent.trim()) p.classList.add('brand-asset-image');
      else if (p.querySelector('a[href]')) p.classList.add('brand-asset-links');
    });
    list.append(tile);
  });
  block.replaceChildren(list);
}
