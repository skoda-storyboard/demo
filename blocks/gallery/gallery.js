import { createOptimizedPicture } from '../../scripts/aem.js';

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
  close: 'Close gallery',
  // visible counter, "N / total" (matches source); the aria-live label uses the
  // longer form for screen readers.
  counter: (n, total) => `${n} / ${total}`,
  counterLabel: (n, total) => `Image ${n} of ${total}`,
  // heading above the thumbnail rail
  imagesHeading: 'Images',
  // detail-panel action buttons (Media-Room style)
  addToBox: 'Add to media box',
  download: 'Download image',
  copyLink: 'Copy image link',
  // slider variant (SKODA-819): region name fallback, per-slide + per-dot names
  slider: 'Image slider',
  slideOf: (n, total) => `${n} of ${total}`,
  goTo: (n) => `Go to image ${n}`,
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

// filled icon path sets in the project house-style (24×24, solid fill):
// add-to-box (plus in rounded square), download (tray + arrow), link (chain).
const ICONS = {
  addToBox: ['M4,3h16c0.6,0,1,0.4,1,1v16c0,0.6-0.4,1-1,1H4c-0.6,0-1-0.4-1-1V4C3,3.4,3.4,3,4,3z M11,11H7v2h4v4h2v-4h4v-2h-4V7h-2V11z'],
  download: ['M12,3c0.6,0,1,0.4,1,1v9.6l2.9-2.9c0.4-0.4,1-0.4,1.4,0c0.4,0.4,0.4,1,0,1.4l-4.6,4.6c-0.4,0.4-1,0.4-1.4,0l-4.6-4.6c-0.4-0.4-0.4-1,0-1.4c0.4-0.4,1-0.4,1.4,0l2.9,2.9V4C11,3.4,11.4,3,12,3z M4,15c0.6,0,1,0.4,1,1v3h14v-3c0-0.6,0.4-1,1-1s1,0.4,1,1v4c0,0.6-0.4,1-1,1H4c-0.6,0-1-0.4-1-1v-4C3,15.4,3.4,15,4,15z'],
  copyLink: ['M10.6,13.4c-0.4-0.4-0.4-1,0-1.4l3.5-3.5c0.4-0.4,1-0.4,1.4,0s0.4,1,0,1.4l-3.5,3.5C11.6,13.8,11,13.8,10.6,13.4z M9.5,17.7l-1.4,1.4c-1,1-2.6,1-3.5,0s-1-2.6,0-3.5l1.4-1.4c0.4-0.4,0.4-1,0-1.4s-1-0.4-1.4,0l-1.4,1.4c-1.8,1.8-1.8,4.6,0,6.4s4.6,1.8,6.4,0l1.4-1.4c0.4-0.4,0.4-1,0-1.4S9.9,17.3,9.5,17.7z M20.4,3.6c-1.8-1.8-4.6-1.8-6.4,0l-1.4,1.4c-0.4,0.4-0.4,1,0,1.4s1,0.4,1.4,0l1.4-1.4c1-1,2.6-1,3.5,0s1,2.6,0,3.5l-1.4,1.4c-0.4,0.4-0.4,1,0,1.4s1,0.4,1.4,0l1.4-1.4C22.2,8.2,22.2,5.4,20.4,3.6z'],
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

/**
 * Turn the authored tags paragraph (e.g. "2026 · Peaq") into individual chips
 * (matches the live Media-Room tag pills). Idempotent: skips if already done.
 * The tags line is the `·`-separated paragraph that is neither the file-metadata
 * block nor the related-article line.
 * @param {Element} caption the stage caption/detail panel
 */
function decorateTags(caption) {
  const p = [...caption.querySelectorAll('p')].find((el) => (
    el.textContent.includes('·')
    && !/file type|file size|dimensions|published/i.test(el.textContent)
    && !/related article/i.test(el.textContent)
    && !el.querySelector('a')
  ));
  if (!p) return;
  const tags = p.textContent.split('·').map((t) => t.trim()).filter(Boolean);
  if (!tags.length) return;
  p.classList.add('gallery-lightbox-tags');
  p.textContent = '';
  tags.forEach((tag) => {
    const chip = document.createElement('span');
    chip.className = 'gallery-lightbox-tag';
    chip.textContent = tag;
    p.append(chip);
  });
}

/**
 * Build the single reusable accessible lightbox overlay.
 * @param {Element} block
 * @param {Array} items
 * @returns {{open: Function}}
 */
function buildLightbox(block, items) {
  const overlay = document.createElement('div');
  overlay.className = 'gallery-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Image gallery');
  overlay.hidden = true;
  if (REDUCED_MOTION) overlay.classList.add('reduced-motion');

  // top bar: just the close ✕, right-aligned (matches the source colorbox chrome)
  const topbar = document.createElement('div');
  topbar.className = 'gallery-lightbox-top';

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'gallery-lightbox-close';
  closeBtn.setAttribute('aria-label', LABELS.close);

  topbar.append(closeBtn);

  // bottom-right control cluster: prev + counter + next (matches the live
  // colorbox where the counter and arrows sit together bottom-right)
  const controls = document.createElement('div');
  controls.className = 'gallery-lightbox-controls';

  const counter = document.createElement('p');
  counter.className = 'gallery-lightbox-count';
  counter.setAttribute('aria-live', 'polite');

  // stage: image (contain-fit) + caption region
  const stage = document.createElement('div');
  stage.className = 'gallery-lightbox-stage';

  const figure = document.createElement('figure');
  figure.className = 'gallery-lightbox-figure';
  // frame holds the image + a loading placeholder (spinner) shown while the
  // full-size rendition downloads (mirrors the source colorbox loading graphic)
  const imageFrame = document.createElement('div');
  imageFrame.className = 'gallery-lightbox-image-frame';
  const stageImg = document.createElement('img');
  stageImg.className = 'gallery-lightbox-image';
  stageImg.id = 'gallery-lightbox-image';
  imageFrame.append(stageImg);
  const stageCaption = document.createElement('figcaption');
  stageCaption.className = 'gallery-lightbox-caption';
  stageCaption.id = 'gallery-lightbox-caption';
  figure.append(imageFrame, stageCaption);
  stage.append(figure);

  // detail-panel action buttons (add to media box / download / copy link),
  // rendered inside the caption panel — matches the live Media-Room chrome
  const actions = document.createElement('div');
  actions.className = 'gallery-lightbox-actions';
  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'gallery-lightbox-action';
  addBtn.setAttribute('aria-label', LABELS.addToBox);
  addBtn.append(svgIcon(ICONS.addToBox));
  const downloadBtn = document.createElement('a');
  downloadBtn.className = 'gallery-lightbox-action';
  downloadBtn.setAttribute('aria-label', LABELS.download);
  downloadBtn.setAttribute('download', '');
  downloadBtn.append(svgIcon(ICONS.download));
  const linkBtn = document.createElement('button');
  linkBtn.type = 'button';
  linkBtn.className = 'gallery-lightbox-action';
  linkBtn.setAttribute('aria-label', LABELS.copyLink);
  linkBtn.append(svgIcon(ICONS.copyLink));
  actions.append(addBtn, downloadBtn, linkBtn);

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'gallery-lightbox-prev';
  prevBtn.setAttribute('aria-label', LABELS.prev);

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'gallery-lightbox-next';
  nextBtn.setAttribute('aria-label', LABELS.next);

  controls.append(counter, prevBtn, nextBtn);

  stageImg.setAttribute('aria-describedby', stageCaption.id);

  overlay.append(topbar, stage, controls);
  block.append(overlay);

  let current = 0;
  let lastFocused = null;
  let singleMode = false;

  const render = (index) => {
    current = (index + items.length) % items.length;
    const item = items[current];
    // request a large lightbox rendition from the authored source
    const base = item.src.split('?')[0];
    // show the loading placeholder + reset the fade/zoom, then reveal once the
    // rendition has decoded so the image animates in visible rather than
    // popping in after the open effect
    stageImg.classList.remove('is-loaded');
    imageFrame.classList.add('is-loading');
    stageImg.src = `${base}?width=2000&format=webply&optimize=medium`;
    stageImg.alt = item.alt;
    const reveal = () => {
      stageImg.classList.add('is-loaded');
      imageFrame.classList.remove('is-loading');
    };
    if (stageImg.complete) reveal();
    else {
      stageImg.addEventListener('load', reveal, { once: true });
      // still reveal (so the placeholder clears and the caption/detail panel is
      // never stuck hidden) if the rendition fails to load
      stageImg.addEventListener('error', reveal, { once: true });
    }
    // clone the authored caption content into the stage caption (plain or panel),
    // then place the action buttons after the description, above the file
    // metadata block (matches the live layout)
    stageCaption.textContent = '';
    if (item.caption) {
      [...item.caption.childNodes].forEach((n) => stageCaption.append(n.cloneNode(true)));
      downloadBtn.href = `${base}?format=jpg`;
      // insert before the first "File type…"/metadata paragraph if present,
      // otherwise fall back to the end of the panel
      const paras = [...stageCaption.querySelectorAll('p')];
      const meta = paras.find((p) => /file type/i.test(p.textContent));
      if (meta) stageCaption.insertBefore(actions, meta);
      else stageCaption.append(actions);
      // render the tags paragraph ("2026 · Peaq") as individual chips
      decorateTags(stageCaption); // eslint-disable-line no-use-before-define
      stageCaption.hidden = false;
    } else {
      stageCaption.hidden = true;
    }
    counter.textContent = LABELS.counter(current + 1, items.length);
    counter.setAttribute('aria-label', LABELS.counterLabel(current + 1, items.length));
  };

  const focusable = () => [...overlay.querySelectorAll('button:not([hidden])')]
    .filter((el) => el.offsetParent !== null);

  const onKeydown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      // eslint-disable-next-line no-use-before-define
      close();
    } else if (e.key === 'ArrowRight' && !singleMode) {
      e.preventDefault();
      render(current + 1);
    } else if (e.key === 'ArrowLeft' && !singleMode) {
      e.preventDefault();
      render(current - 1);
    } else if (e.key === 'Home' && !singleMode) {
      e.preventDefault();
      render(0);
    } else if (e.key === 'End' && !singleMode) {
      e.preventDefault();
      render(items.length - 1);
    } else if (e.key === 'Tab') {
      // focus trap
      const f = focusable();
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const close = () => {
    overlay.hidden = true;
    document.body.classList.remove('gallery-lightbox-open');
    document.removeEventListener('keydown', onKeydown);
    if (lastFocused) lastFocused.focus();
  };

  // `single` = opened from the standalone main/lead image: show just that image,
  // no prev/next, no counter (matches the live main-image viewer). Otherwise
  // (opened from a thumbnail) it is a navigable gallery set.
  const open = (index, trigger, single = false) => {
    lastFocused = trigger || document.activeElement;
    singleMode = single;
    render(index);
    // single-image view: no navigation cluster
    controls.hidden = single;
    overlay.hidden = false;
    document.body.classList.add('gallery-lightbox-open');
    document.addEventListener('keydown', onKeydown);
    closeBtn.focus();
  };

  prevBtn.addEventListener('click', () => render(current - 1));
  nextBtn.addEventListener('click', () => render(current + 1));
  closeBtn.addEventListener('click', close);
  // copy the current image's absolute URL to the clipboard
  linkBtn.addEventListener('click', async () => {
    const url = new URL(items[current].src.split('?')[0], window.location.href).href;
    try {
      await navigator.clipboard.writeText(url);
      linkBtn.classList.add('is-copied');
      setTimeout(() => linkBtn.classList.remove('is-copied'), 1500);
    } catch {
      // clipboard unavailable (e.g. insecure context) — no-op
    }
  });
  // backdrop click closes (only when the overlay itself, not its children, is clicked)
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  return { open };
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
  track.addEventListener('scroll', () => {
    if (!raf) {
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        setCurrent(slidePosition(track.scrollLeft, slideWidth(), count).index);
      });
    }
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => {
      if (dragging) return;
      const at = slidePosition(track.scrollLeft, slideWidth(), count);
      if (at.onClone) jumpTo(at.index);
    }, SLIDER_SETTLE_MS);
  }, { passive: true });

  // keep the current slide aligned when the column width changes
  new ResizeObserver(() => jumpTo(current)).observe(track);

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

/**
 * @param {Element} block the gallery block element
 */
export default function decorate(block) {
  if (block.classList.contains('slider')) {
    buildSlider(block);
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
