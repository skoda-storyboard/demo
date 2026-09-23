/*
 * Carousel / horizontal rail block (SKODA-212).
 *
 * A native, no-library horizontal teaser rail: a CSS `overflow-x` + `scroll-snap`
 * track of card-teaser cells with prev/next arrows and pointer-drag. Replaces the
 * source's Flickity/Owl/jQuery stack (docs/ui-specs/carousel-rails.md §2) with a
 * vanilla scroll track + rAF-gated arrow state — no JS animation loop.
 *
 * REUSE (no forking, per the ticket): the card interior comes entirely from the
 * shared card-teaser primitive (scripts/card-teaser.js + styles/card-teaser.css).
 * This block owns only the rail (viewport, track, arrows, dots, drag). The
 * index-driven sibling `story-rail` builds one of these via buildBlock().
 *
 * Two source card styles inside a rail (carousel-rails.md §2), detected by the
 * presence of a date paragraph after card-teaser classification:
 *   - DATED post  → `.overlay` (white caption over the image, like cards-overlay);
 *   - TAXONOMY    → `.carousel-caption` (bold title below a wide letterbox image).
 *
 * Authoring: one card per row; cells content-sniffed by the primitive (image cell
 * = single child with <picture>; else body). story-rail passes an aria-label via
 * the built block's attribute so the region names itself after the rail heading.
 */

import {
  decorateCardCells, optimizeImages, wireCardLink,
} from '../../scripts/card-teaser.js';

// A pointer must travel this far (px) before we treat the gesture as a drag and
// suppress the post-drag click (so a small wobble on a tap still navigates).
const DRAG_THRESHOLD = 6;

const prefersReducedMotion = () => window.matchMedia
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/*
 * Pure arrow-state decision (exported so tests exercise the production logic,
 * not a copy). prev hides at the left end, next at the right end, both hide when
 * the whole rail fits. Tolerant of sub-pixel scrollLeft (±1px).
 */
export function arrowState({ scrollLeft = 0, scrollWidth = 0, clientWidth = 0 } = {}) {
  const max = scrollWidth - clientWidth;
  const scrollable = max > 1;
  return {
    scrollable,
    prevDisabled: !scrollable || scrollLeft <= 1,
    nextDisabled: !scrollable || scrollLeft >= max - 1,
  };
}

/*
 * Pure cell-variant decision: a card with a date paragraph is a dated post
 * (white overlay caption); one without is a taxonomy card (title below a wide
 * image). Exported for tests. Returns the class list to add.
 */
export function railVariant(hasDate) {
  return hasDate ? ['overlay', 'carousel-overlay'] : ['carousel-caption'];
}

/*
 * Pure page-count + active-dot decision (exported for tests). The active dot is
 * derived from the fraction of REACHABLE scroll, not scrollLeft/clientWidth:
 * the browser clamps the last dot's scroll target to (scrollWidth - clientWidth),
 * which on a partial final page is less than a full page-width — so a naive
 * round(scrollLeft/clientWidth) never reaches the last dot (SKODA-212 review P2).
 * Mapping scrollLeft/max onto [0, pages-1] makes the right edge select the last
 * dot exactly and the left edge select the first.
 */
export function dotState({ scrollLeft = 0, scrollWidth = 0, clientWidth = 0 } = {}) {
  const pages = clientWidth > 0 ? Math.max(1, Math.ceil(scrollWidth / clientWidth)) : 1;
  const max = scrollWidth - clientWidth;
  const active = max <= 0 ? 0 : Math.round((scrollLeft / max) * (pages - 1));
  return { pages, active: Math.min(Math.max(active, 0), pages - 1) };
}

/* Turn each authored row into a shared card-teaser <li>, tagged overlay (dated)
 * or caption (taxonomy) from whether the primitive classified a date. */
function buildCards(block) {
  const track = document.createElement('ul');
  track.className = 'carousel-track';
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'card-teaser';
    while (row.firstElementChild) li.append(row.firstElementChild);
    decorateCardCells(li); // shared content-sniff (image/body/date/title)
    railVariant(!!li.querySelector('.card-teaser-date')).forEach((c) => li.classList.add(c));
    track.append(li);
  });
  optimizeImages(track); // authored <picture> → optimized (shared with cards)
  [...track.children].forEach((cell) => wireCardLink(cell));
  return track;
}

/* One labelled arrow <button>; disabled state hides it (opacity:0) at track ends. */
function makeArrow(dir, label) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `carousel-arrow carousel-${dir}`;
  btn.setAttribute('aria-label', label);
  return btn;
}

export default function decorate(block) {
  const hasDots = block.classList.contains('dots');
  const track = buildCards(block);

  // region semantics: name the rail from the label story-rail passes (or a
  // generic fallback for a standalone authored carousel).
  const label = block.getAttribute('aria-label') || 'Content carousel';
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'carousel');
  block.setAttribute('aria-label', label);

  const viewport = document.createElement('div');
  viewport.className = 'carousel-viewport';
  const prev = makeArrow('prev', 'Previous');
  const next = makeArrow('next', 'Next');
  viewport.append(prev, track, next);

  const dotsNav = document.createElement('div');
  dotsNav.className = 'carousel-dots';
  dotsNav.setAttribute('role', 'tablist');

  block.replaceChildren(viewport);
  if (hasDots) block.append(dotsNav);

  // ---- arrow / dot state (rAF-gated; recomputed on scroll + resize) ----------
  let rafId = 0;
  const pageWidth = () => Math.max(1, Math.round(track.clientWidth * 0.9));

  function syncControls() {
    rafId = 0;
    const x = track.scrollLeft;
    const { prevDisabled, nextDisabled } = arrowState({
      scrollLeft: x, scrollWidth: track.scrollWidth, clientWidth: track.clientWidth,
    });
    prev.disabled = prevDisabled;
    next.disabled = nextDisabled;

    if (hasDots) {
      const { pages, active } = dotState({
        scrollLeft: x, scrollWidth: track.scrollWidth, clientWidth: track.clientWidth,
      });
      // rebuild dots only when the page count changes (resize)
      if (dotsNav.children.length !== pages) {
        dotsNav.replaceChildren();
        for (let i = 0; i < pages; i += 1) {
          const dot = document.createElement('button');
          dot.type = 'button';
          dot.className = 'carousel-dot';
          dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
          // last dot targets the reachable maximum so it can actually select;
          // interior dots page by clientWidth.
          dot.addEventListener('click', () => track.scrollTo({
            left: i === pages - 1
              ? track.scrollWidth - track.clientWidth
              : i * track.clientWidth,
            behavior: prefersReducedMotion() ? 'auto' : 'smooth',
          }));
          dotsNav.append(dot);
        }
      }
      [...dotsNav.children].forEach((dot, i) => {
        dot.classList.toggle('is-selected', i === active);
        if (i === active) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });
      dotsNav.hidden = pages <= 1;
    }
  }

  function scheduleSync() {
    if (!rafId) rafId = requestAnimationFrame(syncControls);
  }

  function scrollByPage(sign) {
    track.scrollBy({
      left: sign * pageWidth(),
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  }
  prev.addEventListener('click', () => scrollByPage(-1));
  next.addEventListener('click', () => scrollByPage(1));

  track.addEventListener('scroll', scheduleSync, { passive: true });
  if (window.ResizeObserver) {
    new ResizeObserver(scheduleSync).observe(track);
  } else {
    window.addEventListener('resize', scheduleSync);
  }

  // ---- pointer-capture drag with post-drag click suppression -----------------
  let dragging = false;
  let moved = false;
  let startX = 0;
  let startLeft = 0;

  track.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return; // primary button / touch / pen only
    dragging = true;
    moved = false;
    startX = e.clientX;
    startLeft = track.scrollLeft;
    track.setPointerCapture(e.pointerId);
    track.classList.add('is-dragging');
  });

  track.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > DRAG_THRESHOLD) moved = true;
    track.scrollLeft = startLeft - dx;
  });

  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    track.classList.remove('is-dragging');
    if (track.hasPointerCapture?.(e.pointerId)) track.releasePointerCapture(e.pointerId);
  }
  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointercancel', endDrag);

  // Suppress the click that ends a drag so it can't navigate the dragged card.
  track.addEventListener('click', (e) => {
    if (moved) {
      e.preventDefault();
      e.stopPropagation();
      moved = false;
    }
  }, true);

  // Initial paint of arrow/dot state (after layout).
  scheduleSync();
}
