import { createOptimizedPicture } from '../../scripts/aem.js';
import { buildLightbox } from '../../scripts/lightbox.js';

/*
 * Gallery block + accessible lightbox — SKODA-203.
 *
 * Authored as one row per image: cell 1 = image, cell 2 = caption (plain text
 * for story galleries, or a rich detail panel — download links / metadata /
 * related links — for Media-Room galleries; both are just authored content).
 *
 *   | Gallery          |
 *   | ![](1.jpg) | Caption 1 |
 *   | ![](2.jpg) | Caption 2 |
 *
 * Renders a fixed 4-across thumbnail grid; clicking a thumbnail opens ONE
 * accessible lightbox (rebuilt vanilla — retires the source colorbox +
 * sb-gallery split). A11y is a hard gate: role=dialog, focus-trap, Escape,
 * arrow-key nav, aria-live counter, focus-return to the invoking thumbnail.
 *
 * i18n: all user-facing control text lives in LABELS below — the single
 * translation point (SKODA-1003 can wire this to a placeholders lookup later).
 * Captions come from authored content, so they are locale-safe already.
 */

const LABELS = {
  open: 'Open image',
  prev: 'Previous image',
  next: 'Next image',
  // heading above the thumbnail rail
  imagesHeading: 'Images',
  // slider variant (SKODA-819): region name fallback, per-slide + per-dot names
  slider: 'Image slider',
  slideOf: (n, total) => `${n} of ${total}`,
  goTo: (n) => `Go to image ${n}`,
  // preview variant (SKODA-223): per-thumb name + the "+N" pill
  openNamed: (n, alt) => (alt ? `${LABELS.open} ${n}: ${alt}` : `${LABELS.open} ${n}`),
  more: (n) => `+${n}`,
  moreLabel: (n) => `Show ${n} more ${n === 1 ? 'image' : 'images'}`,
  // story variant (SKODA-216): the lead button name + the bottom-bar button text
  openGallery: (total) => `Open gallery, ${total} ${total === 1 ? 'image' : 'images'}`,
  viewAll: (total) => `View ${total} ${total === 1 ? 'photo' : 'photos'}`,
};

/**
 * Build an inline SVG icon (Trusted-Types safe: namespaced elements, no innerHTML).
 * Filled house-style matching the project icon set (icons/mail.svg, search.svg):
 * 24×24 viewBox, solid fill via currentColor.
 * @param {string[]} paths one or more SVG path `d` strings
 * @returns {SVGElement}
 */
function svgIcon(paths) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '24');
  svg.setAttribute('height', '24');
  svg.setAttribute('fill', 'currentColor');
  svg.setAttribute('aria-hidden', 'true');
  paths.forEach((d) => {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d);
    svg.append(p);
  });
  return svg;
}

// story variant (SKODA-216) icons, 24×24 solid fill: the lead-image count badge
// (stacked photos) and the lightbox prev chevron (next mirrors it in CSS)
const ICONS = {
  images: ['M22,16V4c0-1.1-0.9-2-2-2H8C6.9,2,6,2.9,6,4v12c0,1.1,0.9,2,2,2h12C21.1,18,22,17.1,22,16z M11,12l2,2.7l3-3.7l4,5H8L11,12z M2,6v14c0,1.1,0.9,2,2,2h14v-2H4V6H2z'],
  chevron: ['M15.4,7.4L14,6l-6,6l6,6l1.4-1.4L10.8,12L15.4,7.4z'],
};

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Read the authored rows (cell 1 = image, cell 2 = optional caption) into items.
 * Shared by the default gallery and the slider variant. Rows without an image
 * are skipped (decorate defensively: authors omit and add cells).
 * @param {Element} block
 * @returns {Array<{src: string, alt: string, caption: Element|null, index: number}>}
 */
function readItems(block) {
  const items = [];
  [...block.children].forEach((row, i) => {
    const cells = [...row.children];
    const img = cells[0]?.querySelector('img');
    if (!img) return;
    const alt = img.getAttribute('alt') || '';
    const { src } = img;

    let caption = null;
    const captionCell = cells[1];
    if (captionCell && captionCell.textContent.trim()) {
      caption = document.createElement('div');
      caption.className = 'gallery-caption-source';
      while (captionCell.firstChild) caption.append(captionCell.firstChild);
    }
    items.push({
      src, alt, caption, index: i,
    });
  });
  return items;
}

/**
 * Build the on-page gallery: a large MAIN image + a thumbnail list beside it
 * (like the live sb-gallery). Clicking the main image or any thumbnail opens the
 * full-screen lightbox at that index. Captions are held off-DOM and shown only
 * in the lightbox (matching the source).
 * @param {Element} block
 * @returns {{items: Array, main: Element, mainHeading: Element}}
 */
function buildGallery(block) {
  // read authored rows into items first
  const items = readItems(block);

  if (!items.length) return { items, main: null, mainHeading: null };

  // set the column count on the thumbnail rail from item count (source: >19->5,
  // >9->4, else 3) so the rail sizes to the number of images
  const cols = overviewCols(items.length); // eslint-disable-line no-use-before-define

  // MAIN image column: dynamic heading (the active image's title) + the image
  const mainCol = document.createElement('div');
  mainCol.className = 'gallery-main-col';

  const mainHeading = document.createElement('h3');
  mainHeading.className = 'gallery-main-heading';
  mainHeading.textContent = items[0].alt;

  const main = document.createElement('button');
  main.type = 'button';
  main.className = 'gallery-main';
  main.setAttribute('aria-label', `${LABELS.open} 1`);
  const mainPic = createOptimizedPicture(items[0].src, items[0].alt, true, [{ width: '2000' }]);
  main.append(mainPic);
  mainCol.append(mainHeading, main);

  // THUMBNAIL column: "Images" heading + the thumbnail rail
  const thumbsCol = document.createElement('div');
  thumbsCol.className = 'gallery-thumbs-col';

  const thumbsHeading = document.createElement('h3');
  thumbsHeading.className = 'gallery-thumbs-heading';
  thumbsHeading.textContent = LABELS.imagesHeading;

  const thumbs = document.createElement('ul');
  thumbs.className = 'gallery-thumbs';
  thumbs.style.setProperty('--thumb-cols', String(cols));

  items.forEach((item, i) => {
    const li = document.createElement('li');
    li.className = 'gallery-thumb-item';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gallery-thumb';
    btn.setAttribute('aria-label', `${LABELS.open} ${i + 1}`);
    btn.dataset.index = String(i);
    btn.append(createOptimizedPicture(item.src, item.alt, false, [{ width: '750' }]));
    li.append(btn);
    thumbs.append(li);
    item.thumbButton = btn;
  });

  thumbsCol.append(thumbsHeading, thumbs);

  const layout = document.createElement('div');
  layout.className = 'gallery-layout';
  layout.append(mainCol, thumbsCol);

  block.textContent = '';
  block.append(layout);
  return { items, main, mainHeading };
}

/**
 * Compute the thumbnail-rail column count from item count (source thresholds).
 * @param {number} count
 * @returns {number} 3 | 4 | 5
 */
function overviewCols(count) {
  if (count > 19) return 5;
  if (count > 9) return 4;
  return 3;
}

/* ==========================================================================
 * Slider variant — `Gallery (slider)` (SKODA-819)
 *
 * The story in-body image carousel (source: link-free `skoda-carousel-widget`,
 * Flickity `{cellAlign:left, groupCells, pageDots, autoPlay:3000, wrapAround}`).
 * One full-width 16:9 image per view with prev/next arrows and page dots; no
 * thumbnail strip, no "Images" heading, no caption, no lightbox (the source
 * slides are not links). Measured spec: docs/tickets/tickets/SKODA-819.md.
 *
 * Native scroll-snap track (swipe/trackpad for free) + a small controller:
 * - wrap-around: the track is [clone of last, 1..N, clone of first], so going
 *   past either end scrolls forward/back seamlessly; once the scroll settles on
 *   a clone it is swapped instantly for the real slide.
 * - autoplay every 3s (source), paused while hovered or focused, off-screen or
 *   in a hidden tab; stopped for good once the user navigates (as Flickity does);
 *   never started under prefers-reduced-motion.
 * - mouse drag (native scrolling covers touch and trackpads).
 * The SKODA-212 rail's page maths (many cards per page, partial last page, no
 * wrap) doesn't fit a one-per-view looping slider, and blocks can't import each
 * other (AGENTS.md), so this is a purpose-built, smaller controller.
 * ========================================================================== */

const SLIDER_AUTOPLAY_MS = 3000; // source Flickity autoPlay
const SLIDER_SETTLE_MS = 120; // scroll idle time that counts as "settled"
const SLIDER_DRAG_THRESHOLD = 40; // px a mouse drag must travel to change slide
// The source's icon-font arrow (skoda-bnr-icons U+E00B, Flickity's own SVG is
// hidden), traced into a 32×32 box: a left arrow with 45° arms, drawn in ink on
// a light disc. The next button mirrors it in CSS.
const SLIDER_ARROW_PATH = 'M8.55 16 16.5 8.05l1.66 1.66-4.94 4.94H23.4v2.7H13.22l4.94 4.94-1.66 1.66z';

/**
 * Map a track scroll offset to a slide. With `looped`, physical position 0 is
 * the clone of the last slide and `count + 1` the clone of the first.
 * @param {number} scrollLeft track scroll offset
 * @param {number} width one slide's width (the track's client width)
 * @param {number} count number of real slides
 * @param {boolean} looped whether the track carries the two wrap clones
 * @returns {{pos: number, index: number, onClone: boolean}}
 */
export function slidePosition(scrollLeft, width, count, looped = true) {
  const last = looped ? count + 1 : count - 1;
  if (!width || count < 1) return { pos: looped ? 1 : 0, index: 0, onClone: false };
  const pos = Math.max(0, Math.min(last, Math.round(scrollLeft / width)));
  if (!looped) return { pos, index: pos, onClone: false };
  if (pos === 0) return { pos, index: count - 1, onClone: true };
  if (pos === count + 1) return { pos, index: 0, onClone: true };
  return { pos, index: pos - 1, onClone: false };
}

/**
 * The slide a mouse drag lands on: one step per drag past the threshold,
 * otherwise back to where it started.
 * @param {number} start slide index when the drag began
 * @param {number} dx horizontal drag distance (negative = towards the next slide)
 * @returns {number}
 */
export function dragTarget(start, dx) {
  if (dx <= -SLIDER_DRAG_THRESHOLD) return start + 1;
  if (dx >= SLIDER_DRAG_THRESHOLD) return start - 1;
  return start;
}

function sliderArrow(dir) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `gallery-slider-${dir}`;
  btn.setAttribute('aria-label', dir === 'prev' ? LABELS.prev : LABELS.next);
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 32 32');
  svg.setAttribute('aria-hidden', 'true');
  // ink under-disc (source ::before, scaled 0.95) → translucent white disc → ink arrow
  [['gallery-slider-arrow-under', 15.2], ['gallery-slider-arrow-disc', 16]].forEach(([cls, r]) => {
    const circle = document.createElementNS(NS, 'circle');
    circle.setAttribute('class', cls);
    circle.setAttribute('cx', '16');
    circle.setAttribute('cy', '16');
    circle.setAttribute('r', String(r));
    svg.append(circle);
  });
  const path = document.createElementNS(NS, 'path');
  path.setAttribute('d', SLIDER_ARROW_PATH);
  svg.append(path);
  btn.append(svg);
  return btn;
}

function buildSlider(block) {
  const items = readItems(block);
  block.textContent = '';
  if (!items.length) return;

  const count = items.length;
  const looped = count > 1;
  // WAI carousel pattern: a named group (not a region landmark — a story can hold
  // several sliders sharing one title, which would give duplicate landmarks)
  block.setAttribute('role', 'group');
  block.setAttribute('aria-roledescription', 'carousel');
  block.setAttribute('aria-label', items[0].alt || LABELS.slider);

  const viewport = document.createElement('div');
  viewport.className = 'gallery-slider-viewport';
  // a plain scroller of slide groups (not a <ul>: role=group children would
  // break list semantics); named by the carousel group around it
  const track = document.createElement('div');
  track.className = 'gallery-slider-track';
  track.tabIndex = 0; // keyboard-scrollable (← / →)

  const slides = items.map((item, i) => {
    const slide = document.createElement('div');
    slide.className = 'gallery-slide';
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slide');
    slide.setAttribute('aria-label', LABELS.slideOf(i + 1, count));
    const pic = createOptimizedPicture(item.src, item.alt, false, [
      { media: '(min-width: 768px)', width: '1600' },
      { width: '1000' },
    ]);
    pic.querySelector('img').draggable = false;
    slide.append(pic);
    // the optional authored description, under the 16:9 frame (source
    // .search-results-item-description); none → nothing added, so no gap
    if (item.caption) {
      const caption = document.createElement('div');
      caption.className = 'gallery-slide-caption';
      caption.append(...[...item.caption.childNodes].map((n) => n.cloneNode(true)));
      slide.append(caption);
    }
    return slide;
  });
  track.append(...slides);

  if (looped) {
    const clone = (slide) => {
      const c = slide.cloneNode(true);
      c.classList.add('is-clone');
      c.removeAttribute('role');
      c.removeAttribute('aria-roledescription');
      c.removeAttribute('aria-label');
      c.setAttribute('aria-hidden', 'true');
      c.inert = true;
      return c;
    };
    track.prepend(clone(slides[count - 1]));
    track.append(clone(slides[0]));
  }

  viewport.append(track);
  block.append(viewport);
  if (!looped) return; // a single image: no controls, no autoplay

  const prev = sliderArrow('prev');
  const next = sliderArrow('next');
  viewport.append(prev, next);

  const dotsNav = document.createElement('div');
  dotsNav.className = 'gallery-slider-dots';
  const dots = items.map((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'gallery-slider-dot';
    dot.setAttribute('aria-label', LABELS.goTo(i + 1));
    dotsNav.append(dot);
    return dot;
  });
  block.append(dotsNav);

  let current = 0;
  const setCurrent = (i) => {
    current = i;
    // aria-current="true" (an empty value means false to assistive tech)
    dots.forEach((d, j) => {
      if (j === i) d.setAttribute('aria-current', 'true');
      else d.removeAttribute('aria-current');
    });
  };
  setCurrent(0);

  const slideWidth = () => track.clientWidth;
  const jumpTo = (index) => track.scrollTo({ left: (index + 1) * slideWidth(), behavior: 'auto' });
  // index may be -1 or `count`: those land on a clone and are swapped on settle
  const goTo = (index) => {
    const target = Math.max(-1, Math.min(count, index));
    track.scrollTo({ left: (target + 1) * slideWidth(), behavior: REDUCED_MOTION ? 'auto' : 'smooth' });
  };

  // ---- autoplay -----------------------------------------------------------
  let timer = 0;
  let stopped = REDUCED_MOTION;
  const paused = {
    hover: false, focus: false, hidden: document.hidden, offscreen: true,
  };
  const schedule = () => {
    window.clearTimeout(timer);
    if (stopped || Object.values(paused).some(Boolean)) return;
    timer = window.setTimeout(() => { goTo(current + 1); schedule(); }, SLIDER_AUTOPLAY_MS);
  };
  const setPaused = (key, value) => { paused[key] = value; schedule(); };
  const stop = () => { stopped = true; window.clearTimeout(timer); };

  block.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') setPaused('hover', true); });
  block.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') setPaused('hover', false); });
  block.addEventListener('focusin', () => setPaused('focus', true));
  block.addEventListener('focusout', (e) => { if (!block.contains(e.relatedTarget)) setPaused('focus', false); });
  document.addEventListener('visibilitychange', () => setPaused('hidden', document.hidden));
  new IntersectionObserver(([entry]) => setPaused('offscreen', !entry.isIntersecting), { threshold: 0.5 })
    .observe(viewport);

  // ---- scroll tracking + wrap swap ---------------------------------------
  let dragging = null;
  let raf = 0;
  let settleTimer = 0;
  // the slide width the scroll offset was last valid for: while the column is
  // resizing, the browser's own scroll adjustment reports the OLD offset against
  // the NEW width, which would pick the wrong slide, so skip it until the
  // ResizeObserver below has re-aligned the current slide
  let knownWidth = slideWidth();
  const resizing = () => slideWidth() !== knownWidth;
  track.addEventListener('scroll', () => {
    if (!raf) {
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        if (resizing()) return;
        setCurrent(slidePosition(track.scrollLeft, slideWidth(), count).index);
      });
    }
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => {
      if (dragging || resizing()) return;
      const at = slidePosition(track.scrollLeft, slideWidth(), count);
      if (at.onClone) jumpTo(at.index);
    }, SLIDER_SETTLE_MS);
  }, { passive: true });

  // keep the current slide aligned when the column width changes
  new ResizeObserver(() => {
    knownWidth = slideWidth();
    jumpTo(current);
  }).observe(track);

  // ---- user navigation (any of it stops autoplay, as on the source) -------
  prev.addEventListener('click', () => { stop(); goTo(current - 1); });
  next.addEventListener('click', () => { stop(); goTo(current + 1); });
  dots.forEach((dot, i) => dot.addEventListener('click', () => { stop(); goTo(i); }));
  track.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    stop();
    goTo(current + (e.key === 'ArrowRight' ? 1 : -1));
  });

  track.addEventListener('pointerdown', (e) => {
    stop();
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    dragging = {
      x: e.clientX, lastX: e.clientX, left: track.scrollLeft, start: current,
    };
    track.setPointerCapture(e.pointerId);
    track.classList.add('is-dragging');
  });
  track.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    dragging.lastX = e.clientX;
    track.scrollLeft = dragging.left - (e.clientX - dragging.x);
  });
  // use the last move position: a cancelled pointer can report clientX 0
  const endDrag = () => {
    if (!dragging) return;
    const target = dragTarget(dragging.start, dragging.lastX - dragging.x);
    dragging = null;
    track.classList.remove('is-dragging');
    goTo(target);
  };
  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointercancel', endDrag);
}

/* ==========================================================================
 * Preview variant — `Gallery (preview)` (SKODA-223)
 *
 * The press-release sidebar "Images" preview (source section.sa-media-kit-preview):
 * no main stage, just a 2-up grid of 16:9 thumbnails (1-up below 768), at most
 * PREVIEW_MAX shown. With more images the last shown thumb carries a "+N" pill that
 * opens the lightbox at the first hidden image. Every thumb opens the shared
 * lightbox over ALL images; captions stay off-page for the lightbox. The "Images"
 * heading is authored default content before the block, so none is added here.
 * ========================================================================== */

const PREVIEW_MAX = 4;

/**
 * What the preview shows for a given image count.
 * @param {number} count number of images
 * @param {number} max most thumbs shown
 * @returns {{shown: number, more: number, moreIndex: number}} `more` = hidden images
 *   (0 = no pill); `moreIndex` = the image the pill opens (-1 without a pill)
 */
export function previewPlan(count, max = PREVIEW_MAX) {
  const total = Math.max(0, count);
  const shown = Math.min(total, max);
  const more = total - shown;
  return { shown, more, moreIndex: more ? shown : -1 };
}

function buildPreview(block) {
  const items = readItems(block);
  block.textContent = '';
  if (!items.length) return;

  const { shown, more, moreIndex } = previewPlan(items.length);
  const grid = document.createElement('ul');
  grid.className = 'gallery-preview-grid';
  const triggers = items.slice(0, shown).map((item, i) => {
    const li = document.createElement('li');
    li.className = 'gallery-preview-item';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gallery-preview-thumb';
    btn.setAttribute('aria-label', LABELS.openNamed(i + 1, item.alt));
    btn.append(createOptimizedPicture(item.src, item.alt, false, [{ width: '750' }]));
    li.append(btn);
    grid.append(li);
    return [btn, i];
  });

  if (more) {
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'gallery-preview-more';
    pill.setAttribute('aria-label', LABELS.moreLabel(more));
    pill.textContent = LABELS.more(more);
    grid.lastElementChild.append(pill);
    triggers.push([pill, moreIndex]);
  }
  block.append(grid);

  const lightbox = buildLightbox(block, items);
  const single = items.length === 1;
  triggers.forEach(([btn, index]) => {
    btn.addEventListener('click', () => lightbox.open(index, btn, single));
  });
}

/* ==========================================================================
 * Story variant — `Gallery (story)` (SKODA-216)
 *
 * The story in-body gallery (source .sb-gallery, measured on the live Favorit
 * story): a full-column 16:9 lead image carrying a count badge, then a 4-across
 * strip of the NEXT images (the lead is not repeated). The lead opens the lightbox
 * at image 1, thumb k at image k + 1; it is one navigable set per block, so two
 * galleries on a page never mix. The lightbox title is the story title (source
 * data-title). Overview, share and media-cart actions are out of scope.
 * ========================================================================== */

const STORY_STRIP_MAX = 4;

/**
 * Which images the story strip shows for a given image count.
 * @param {number} count number of images
 * @param {number} max most thumbs in the strip
 * @returns {number[]} item indexes in the strip (the lead, index 0, is never repeated)
 */
export function storyStrip(count, max = STORY_STRIP_MAX) {
  const shown = Math.max(0, Math.min(count - 1, max));
  return Array.from({ length: shown }, (_, i) => i + 1);
}

function storyPicture(item) {
  const pic = createOptimizedPicture(item.src, item.alt, false, [
    { media: '(min-width: 768px)', width: '1600' },
    { width: '1000' },
  ]);
  pic.querySelector('img').draggable = false;
  return pic;
}

function buildStory(block) {
  const items = readItems(block);
  block.textContent = '';
  if (!items.length) return;

  const title = document.querySelector('main h1')?.textContent.trim() || items[0].alt;

  const lead = document.createElement('button');
  lead.type = 'button';
  lead.className = 'gallery-story-lead';
  lead.setAttribute('aria-label', LABELS.openGallery(items.length));
  // count badge (source .sb-gallery-show-more): icon + total, decorative
  const badge = document.createElement('span');
  badge.className = 'gallery-story-count';
  badge.setAttribute('aria-hidden', 'true');
  const total = document.createElement('span');
  total.textContent = String(items.length);
  badge.append(svgIcon(ICONS.images), total);
  lead.append(storyPicture(items[0]), badge);
  const triggers = [[lead, 0]];
  block.append(lead);

  const strip = storyStrip(items.length);
  if (strip.length) {
    const list = document.createElement('ul');
    list.className = 'gallery-story-strip';
    strip.forEach((index) => {
      const li = document.createElement('li');
      li.className = 'gallery-story-item';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'gallery-story-thumb';
      btn.setAttribute('aria-label', LABELS.openNamed(index + 1, items[index].alt));
      btn.append(createOptimizedPicture(items[index].src, items[index].alt, false, [{ width: '750' }]));
      li.append(btn);
      list.append(li);
      triggers.push([btn, index]);
    });
    block.append(list);
  }

  // bottom bar (source .sb-gallery-bottom): the green "View N photos" button, which
  // opens the set at image 1 (the source opens its removed overview grid on phones).
  // "Share gallery" is SKODA-215 and would sit at the bar's right end.
  const bar = document.createElement('div');
  bar.className = 'gallery-story-bottom';
  const viewAll = document.createElement('button');
  viewAll.type = 'button';
  viewAll.className = 'gallery-story-view';
  const viewLabel = document.createElement('span');
  viewLabel.textContent = LABELS.viewAll(items.length);
  viewAll.append(svgIcon(ICONS.images), viewLabel);
  bar.append(viewAll);
  block.append(bar);
  triggers.push([viewAll, 0]);

  const lightbox = buildLightbox(block, items, { story: true, title });
  // the source's chevron in the green squares (the shared lightbox draws ‹ › glyphs)
  lightbox.overlay.querySelectorAll('.gallery-lightbox-prev, .gallery-lightbox-next')
    .forEach((btn) => btn.append(svgIcon(ICONS.chevron)));
  const single = items.length === 1;
  triggers.forEach(([btn, index]) => {
    btn.addEventListener('click', () => lightbox.open(index, btn, single));
  });
}

/**
 * @param {Element} block the gallery block element
 */
export default function decorate(block) {
  if (block.classList.contains('story')) {
    buildStory(block);
    return;
  }
  if (block.classList.contains('slider')) {
    buildSlider(block);
    return;
  }
  if (block.classList.contains('preview')) {
    buildPreview(block);
    return;
  }

  const { items, main, mainHeading } = buildGallery(block);
  if (!items.length) return;

  const lightbox = buildLightbox(block, items);

  let active = 0;
  const setMain = (i) => {
    active = i;
    const base = items[i].src.split('?')[0];
    const mainImg = main.querySelector('img');
    // show a placeholder while the new main rendition downloads, cleared on
    // load or error so it never sticks (mirrors the lightbox loading graphic)
    main.classList.add('is-loading');
    const done = () => main.classList.remove('is-loading');
    mainImg.src = `${base}?width=2000&format=webply&optimize=medium`;
    mainImg.alt = items[i].alt;
    if (mainImg.complete) done();
    else {
      mainImg.addEventListener('load', done, { once: true });
      mainImg.addEventListener('error', done, { once: true });
    }
    main.setAttribute('aria-label', `${LABELS.open} ${i + 1}`);
    // update the heading above the main image to the active image's title
    mainHeading.textContent = items[i].alt;
    items.forEach((it, j) => it.thumbButton.setAttribute('aria-current', j === i ? 'true' : 'false'));
  };
  setMain(0);

  // main/lead image: open a single-image viewer (no prev/next, no counter) —
  // matches the live behaviour (screenshot 1).
  main.addEventListener('click', () => lightbox.open(active, main, true));

  // thumbnails: open the navigable gallery set (prev/next + "N / total") at
  // that image — matches the live behaviour (screenshot 2).
  items.forEach((item, i) => {
    item.thumbButton.addEventListener('click', () => {
      setMain(i);
      lightbox.open(i, item.thumbButton, false);
    });
  });
}
