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
  overview: 'Show all images',
  // visible counter, "N / total" (matches source); the aria-live label uses the
  // longer form for screen readers.
  counter: (n, total) => `${n} / ${total}`,
  counterLabel: (n, total) => `Image ${n} of ${total}`,
};

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Build the on-page gallery: a large MAIN image + a thumbnail list beside it
 * (like the live sb-gallery). Clicking the main image or any thumbnail opens the
 * full-screen lightbox at that index. Captions are held off-DOM and shown only
 * in the lightbox (matching the source).
 * @param {Element} block
 * @returns {{items: Array, main: Element}}
 */
function buildGallery(block) {
  const items = [];

  // read authored rows into items first
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

  if (!items.length) return { items, main: null };

  // set the column count on the thumbnail rail from item count (source: >19->5,
  // >9->4, else 3) so the rail sizes to the number of images
  const cols = overviewCols(items.length); // eslint-disable-line no-use-before-define

  // MAIN image (large, click to open lightbox at the active index)
  const main = document.createElement('button');
  main.type = 'button';
  main.className = 'gallery-main';
  main.setAttribute('aria-label', `${LABELS.open} 1`);
  const mainPic = createOptimizedPicture(items[0].src, items[0].alt, true, [{ width: '2000' }]);
  main.append(mainPic);

  // THUMBNAIL rail (one button per image, sized by count)
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

  const layout = document.createElement('div');
  layout.className = 'gallery-layout';
  layout.append(main, thumbs);

  block.textContent = '';
  block.append(layout);
  return { items, main };
}

/**
 * Compute the overview grid column count from item count (source thresholds).
 * @param {number} count
 * @returns {number} 3 | 4 | 5
 */
function overviewCols(count) {
  if (count > 19) return 5;
  if (count > 9) return 4;
  return 3;
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

  // top bar: counter + overview toggle + close
  const topbar = document.createElement('div');
  topbar.className = 'gallery-lightbox-top';

  const counter = document.createElement('p');
  counter.className = 'gallery-lightbox-count';
  counter.setAttribute('aria-live', 'polite');

  const topActions = document.createElement('div');
  topActions.className = 'gallery-lightbox-actions';

  const overviewBtn = document.createElement('button');
  overviewBtn.type = 'button';
  overviewBtn.className = 'gallery-lightbox-overview-toggle';
  overviewBtn.setAttribute('aria-label', LABELS.overview);
  overviewBtn.setAttribute('aria-pressed', 'false');
  overviewBtn.textContent = LABELS.overview;

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'gallery-lightbox-close';
  closeBtn.setAttribute('aria-label', LABELS.close);

  topActions.append(overviewBtn, closeBtn);
  topbar.append(counter, topActions);

  // stage: image (contain-fit) + caption region
  const stage = document.createElement('div');
  stage.className = 'gallery-lightbox-stage';

  const figure = document.createElement('figure');
  figure.className = 'gallery-lightbox-figure';
  const stageImg = document.createElement('img');
  stageImg.className = 'gallery-lightbox-image';
  stageImg.id = 'gallery-lightbox-image';
  const stageCaption = document.createElement('figcaption');
  stageCaption.className = 'gallery-lightbox-caption';
  stageCaption.id = 'gallery-lightbox-caption';
  figure.append(stageImg, stageCaption);
  stage.append(figure);

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'gallery-lightbox-prev';
  prevBtn.setAttribute('aria-label', LABELS.prev);

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'gallery-lightbox-next';
  nextBtn.setAttribute('aria-label', LABELS.next);

  stageImg.setAttribute('aria-describedby', stageCaption.id);

  // overview grid (thumbnails), built lazily on first toggle
  const overview = document.createElement('div');
  overview.className = 'gallery-lightbox-overview';
  overview.hidden = true;
  overview.style.setProperty('--overview-cols', String(overviewCols(items.length)));

  overlay.append(topbar, prevBtn, stage, nextBtn, overview);
  block.append(overlay);

  let current = 0;
  let lastFocused = null;
  let overviewBuilt = false;
  let singleMode = false;

  const render = (index) => {
    current = (index + items.length) % items.length;
    const item = items[current];
    // request a large lightbox rendition from the authored source
    const base = item.src.split('?')[0];
    // reset the fade/zoom, then reveal once the rendition has decoded so the
    // image animates in visible rather than popping in after the open effect
    stageImg.classList.remove('is-loaded');
    stageImg.src = `${base}?width=2000&format=webply&optimize=medium`;
    stageImg.alt = item.alt;
    const reveal = () => stageImg.classList.add('is-loaded');
    if (stageImg.complete) reveal();
    else stageImg.addEventListener('load', reveal, { once: true });
    // clone the authored caption content into the stage caption (plain or panel)
    stageCaption.textContent = '';
    if (item.caption) {
      [...item.caption.childNodes].forEach((n) => stageCaption.append(n.cloneNode(true)));
      stageCaption.hidden = false;
    } else {
      stageCaption.hidden = true;
    }
    counter.textContent = LABELS.counter(current + 1, items.length);
    counter.setAttribute('aria-label', LABELS.counterLabel(current + 1, items.length));
  };

  const buildOverview = () => {
    if (overviewBuilt) return;
    items.forEach((item, i) => {
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'gallery-lightbox-overview-item';
      tile.setAttribute('aria-label', `${LABELS.open} ${i + 1}`);
      const thumb = item.thumbButton.querySelector('picture')?.cloneNode(true);
      if (thumb) tile.append(thumb);
      tile.addEventListener('click', () => {
        render(i);
        // eslint-disable-next-line no-use-before-define
        setOverview(false);
      });
      overview.append(tile);
    });
    overviewBuilt = true;
  };

  const setOverview = (on) => {
    if (on) buildOverview();
    overview.hidden = !on;
    stage.hidden = on;
    prevBtn.hidden = on;
    nextBtn.hidden = on;
    overviewBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
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
    setOverview(false);
    if (lastFocused) lastFocused.focus();
  };

  // `single` = opened from the standalone main/lead image: show just that image,
  // no prev/next, no counter, no overview (matches the live main-image viewer).
  // Otherwise (opened from a thumbnail) it is a navigable gallery set.
  const open = (index, trigger, single = false) => {
    lastFocused = trigger || document.activeElement;
    singleMode = single;
    render(index);
    setOverview(false);
    prevBtn.hidden = single;
    nextBtn.hidden = single;
    counter.hidden = single;
    overviewBtn.hidden = single;
    overlay.hidden = false;
    document.body.classList.add('gallery-lightbox-open');
    document.addEventListener('keydown', onKeydown);
    closeBtn.focus();
  };

  prevBtn.addEventListener('click', () => render(current - 1));
  nextBtn.addEventListener('click', () => render(current + 1));
  closeBtn.addEventListener('click', close);
  overviewBtn.addEventListener('click', () => setOverview(overview.hidden));
  // backdrop click closes (only when the overlay itself, not its children, is clicked)
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  return { open };
}

/**
 * @param {Element} block the gallery block element
 */
export default function decorate(block) {
  const { items, main } = buildGallery(block);
  if (!items.length) return;

  const lightbox = buildLightbox(block, items);

  let active = 0;
  const setMain = (i) => {
    active = i;
    const base = items[i].src.split('?')[0];
    const mainImg = main.querySelector('img');
    mainImg.src = `${base}?width=2000&format=webply&optimize=medium`;
    mainImg.alt = items[i].alt;
    main.setAttribute('aria-label', `${LABELS.open} ${i + 1}`);
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
