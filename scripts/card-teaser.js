/*
 * Shared decoration for the Cards / Teaser family (SKODA-201).
 *
 * Three sibling blocks reuse this: cards-media (image above body), cards-overlay
 * (text over image + scrim) and cards-toolbar (card + action row). A single source
 * `.article-teaser` composite maps to a combination of these EDS variants
 * (see docs/ui-specs/card-teaser.md).
 *
 * Cells are classified by CONTENT SNIFFING, never by position (no `:not()` chains):
 *   - image cell   = single child containing a <picture>            -> cards-card-image
 *   - toolbar cell = every child is a <p> that contains an <a>      -> cards-card-toolbar
 *   - otherwise                                                     -> cards-card-body
 *
 * Decoration is defensive: authors omit and add cells, so every lookup is guarded.
 */

import { createOptimizedPicture } from './aem.js';

/** A cell is an image cell when its only child wraps a <picture>. */
function isImageCell(cell) {
  return cell.children.length === 1 && !!cell.querySelector(':scope > picture, :scope > p > picture');
}

/** A cell is a toolbar cell when it has children and every child is a <p> holding an <a>. */
function isToolbarCell(cell) {
  const kids = [...cell.children];
  return kids.length > 0 && kids.every((p) => p.tagName === 'P' && p.querySelector(':scope > a'));
}

/**
 * Lift an authored <img> out of its wrapping <p> so <picture> is a direct child of the
 * cell (EDS import wraps images in <p>), then swap in an optimized <picture>.
 */
function optimizeImages(scope) {
  scope.querySelectorAll('picture > img').forEach((img) => {
    const picture = img.closest('picture');
    // unwrap a lone <p> wrapper left by the importer
    const p = picture.closest('p');
    if (p && p.children.length === 1) p.replaceWith(picture);
    const optimized = createOptimizedPicture(
      img.src,
      img.alt,
      false,
      [{ media: '(min-width: 768px)', width: '750' }, { width: '500' }],
    );
    picture.replaceWith(optimized);
  });
}

/**
 * Build the action row for a toolbar cell: each authored link becomes a pill button.
 * Icon-only links (no visible text) get an aria-label derived from title/href.
 */
function decorateToolbar(cell) {
  cell.classList.add('cards-card-toolbar');
  cell.querySelectorAll(':scope > p').forEach((p) => {
    const a = p.querySelector(':scope > a');
    if (!a) return;
    a.classList.add('cards-toolbar-button');
    const label = a.textContent.trim();
    const iconOnly = !label && !!a.querySelector('.icon, svg, img');
    if (iconOnly && !a.getAttribute('aria-label')) {
      a.setAttribute('aria-label', a.title || a.getAttribute('href') || 'action');
    }
    // flatten the wrapping <p> so buttons are direct flex children of the toolbar
    cell.append(a);
    p.remove();
  });
}

/**
 * Give the card ONE tab stop: the first non-toolbar link becomes a "stretched" link
 * covering the whole card (via the `cards-card-link` class + a ::after in CSS). Any
 * other same-target link (e.g. a linked image) is made aria-hidden / not focusable so
 * a card exposes a single accessible name. Toolbar buttons keep their own focus.
 */
function wireCardLink(li) {
  const toolbar = li.querySelector('.cards-card-toolbar');
  const links = [...li.querySelectorAll('a')].filter((a) => !toolbar || !toolbar.contains(a));
  if (!links.length) return;
  // prefer a text link (title) as the primary; fall back to the first link
  const primary = links.find((a) => a.textContent.trim()) || links[0];
  primary.classList.add('cards-card-link');
  links.forEach((a) => {
    if (a === primary) return;
    if (a.getAttribute('href') === primary.getAttribute('href')) {
      a.setAttribute('tabindex', '-1');
      a.setAttribute('aria-hidden', 'true');
    }
  });
}

/**
 * Decorate one Cards/Teaser block. `block` already carries its variant class
 * (cards-media / cards-overlay / cards-toolbar). Returns the built <ul> for callers
 * that need it (e.g. the promo-box carousel).
 */
export default function decorateCards(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((cell) => {
      if (isImageCell(cell)) cell.className = 'cards-card-image';
      else if (isToolbarCell(cell)) decorateToolbar(cell);
      else cell.className = 'cards-card-body';
    });
    // drop empty image cells so they don't leave a blank slot
    li.querySelectorAll('.cards-card-image:empty').forEach((c) => c.remove());
    ul.append(li);
  });

  optimizeImages(ul);
  [...ul.children].forEach((li) => wireCardLink(li));

  block.replaceChildren(ul);
  return ul;
}
