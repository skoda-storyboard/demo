/*
 * Cards / Teaser block (SKODA-201) — the universal card unit.
 *
 * ONE block, three co-occurring variants read from the block classlist and authored as
 * `Cards (media)` / `Cards (overlay)` / `Cards (toolbar)` in DA (EDS maps the parenthetical
 * to modifier classes: `Cards (overlay)` -> `.cards.overlay`). A single card may combine
 * variants, e.g. `Cards (overlay, toolbar)` -> `.cards.overlay.toolbar`. CSS scopes each
 * variant via compound selectors; this file holds the shared decoration + the promo-box
 * (overlay showcase) carousel behavior. See docs/ui-specs/card-teaser.md.
 *
 * Cells are classified by CONTENT SNIFFING, never by position (no `:not()` chains):
 *   - image cell   = single child containing a <picture>            -> cards-card-image
 *   - toolbar cell = every child is a <p> that contains an <a>      -> cards-card-toolbar
 *   - otherwise                                                     -> cards-card-body
 *
 * Decoration is defensive: authors omit and add cells, so every lookup is guarded.
 */

import { createOptimizedPicture } from '../../scripts/aem.js';

const AUTOPLAY_MS = 10000;
const MOBILE_QUERY = '(max-width: 767.98px)';
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

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

/** Shared row -> <ul>/<li> decoration for every variant. Returns the built <ul>. */
function decorateCards(block) {
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

/**
 * Promo-box behavior (overlay showcase; SKODA-201 / carousel-rails §3):
 *   >= 768px : static mosaic (1 big 66.66% + 2 small 33.33% stacked) — pure CSS, no JS here.
 *   < 768px  : 1-up carousel auto-rotating every 10s, dots-only, pausing on hover/focus/touch,
 *              honoring prefers-reduced-motion. This wiring runs only while the mobile MQ matches.
 */
function initPromoCarousel(block, ul) {
  const items = [...ul.children];
  if (items.length < 2) return null;

  // mark the track booted so CSS drops the pre-JS `:first-child { display:block }` fallback
  // and shows only the JS-selected slide
  ul.classList.add('is-booted');

  const dots = document.createElement('div');
  dots.className = 'cards-dots';
  dots.setAttribute('role', 'tablist');
  dots.setAttribute('aria-label', 'Featured stories');
  items.forEach((li, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'cards-dot';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
    dots.append(dot);
  });
  block.append(dots);

  let index = 0;
  let timer = null;
  let paused = false;

  const select = (next) => {
    index = (next + items.length) % items.length;
    items.forEach((li, i) => {
      li.classList.toggle('is-selected', i === index);
      li.setAttribute('aria-hidden', i === index ? 'false' : 'true');
    });
    [...dots.children].forEach((dot, i) => {
      dot.classList.toggle('is-selected', i === index);
      if (i === index) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  };

  const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
  const start = () => {
    stop();
    if (paused || window.matchMedia(REDUCED_MOTION).matches) return;
    timer = setInterval(() => select(index + 1), AUTOPLAY_MS);
  };

  dots.addEventListener('click', (e) => {
    const dot = e.target.closest('.cards-dot');
    if (!dot) return;
    select([...dots.children].indexOf(dot));
    start();
  });

  const pause = () => { paused = true; stop(); };
  const resume = () => { paused = false; start(); };
  block.addEventListener('mouseenter', pause);
  block.addEventListener('mouseleave', resume);
  block.addEventListener('focusin', pause);
  block.addEventListener('focusout', resume);
  block.addEventListener('touchstart', pause, { passive: true });
  block.addEventListener('touchend', resume, { passive: true });

  select(0);
  start();

  return { stop, start, select };
}

export default function decorate(block) {
  const ul = decorateCards(block);

  // promo showcase only applies to the overlay variant: an authored `promo` modifier, or
  // exactly 3 cards, becomes the mosaic/carousel featured showcase (matches source `.promo-box`).
  if (!block.classList.contains('overlay')) return;
  const isPromo = block.classList.contains('promo') || ul.children.length === 3;
  if (!isPromo) return;

  block.classList.add('cards-promo');

  let carousel = null;
  const mq = window.matchMedia(MOBILE_QUERY);
  const sync = () => {
    if (mq.matches && !carousel) {
      carousel = initPromoCarousel(block, ul) || {};
    } else if (!mq.matches && carousel) {
      // leaving mobile: stop autoplay and clear selection state so mosaic shows all cards
      carousel.stop?.();
      ul.classList.remove('is-booted');
      [...ul.children].forEach((li) => {
        li.classList.remove('is-selected');
        li.removeAttribute('aria-hidden');
      });
      block.querySelector('.cards-dots')?.remove();
      carousel = null;
    }
  };
  sync();
  mq.addEventListener('change', sync);
}
