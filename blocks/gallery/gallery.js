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
  // counter: "Image {n} of {total}"
  counter: (n, total) => `Image ${n} of ${total}`,
};

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Build the grid: each row -> <li> with a <button> thumbnail + <figcaption>.
 * @param {Element} block
 * @returns {Array<{picture: Element, caption: Element|null, alt: string}>} items
 */
function buildGrid(block) {
  const items = [];
  const list = document.createElement('ul');
  list.className = 'gallery-grid';

  [...block.children].forEach((row, i) => {
    const cells = [...row.children];
    const imageCell = cells[0];
    const captionCell = cells[1];
    const img = imageCell?.querySelector('img');
    if (!img) return;

    // optimized thumbnail picture
    const alt = img.getAttribute('alt') || '';
    const picture = createOptimizedPicture(img.src, alt, false, [{ width: '750' }]);

    const li = document.createElement('li');
    li.className = 'gallery-item';

    const figure = document.createElement('figure');
    figure.className = 'gallery-figure';

    // real button so the thumbnail is keyboard-openable
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'gallery-thumb';
    button.setAttribute('aria-label', `${LABELS.open} ${i + 1}`);
    button.dataset.index = String(i);
    button.append(picture);
    figure.append(button);

    // caption: move authored caption content into a <figcaption> (plain text or
    // the MR detail panel — links/metadata/related — all preserved)
    let caption = null;
    if (captionCell && captionCell.textContent.trim()) {
      caption = document.createElement('figcaption');
      caption.className = 'gallery-caption';
      while (captionCell.firstChild) caption.append(captionCell.firstChild);
      figure.append(caption);
    }

    li.append(figure);
    list.append(li);
    items.push({ button, alt, caption });
  });

  block.textContent = '';
  block.append(list);
  return items;
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

  const render = (index) => {
    current = (index + items.length) % items.length;
    const item = items[current];
    const srcImg = item.button.querySelector('img');
    // reuse the largest source; request a large lightbox rendition
    const base = srcImg.src.split('?')[0];
    stageImg.src = `${base}?width=2000&format=webply&optimize=medium`;
    stageImg.alt = item.alt;
    // clone the authored caption content into the stage caption (plain or panel)
    stageCaption.textContent = '';
    if (item.caption) {
      [...item.caption.childNodes].forEach((n) => stageCaption.append(n.cloneNode(true)));
      stageCaption.hidden = false;
    } else {
      stageCaption.hidden = true;
    }
    counter.textContent = LABELS.counter(current + 1, items.length);
  };

  const buildOverview = () => {
    if (overviewBuilt) return;
    items.forEach((item, i) => {
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'gallery-lightbox-overview-item';
      tile.setAttribute('aria-label', `${LABELS.open} ${i + 1}`);
      const thumb = item.button.querySelector('picture')?.cloneNode(true);
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
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      render(current + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      render(current - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      render(0);
    } else if (e.key === 'End') {
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

  const open = (index, trigger) => {
    lastFocused = trigger || document.activeElement;
    render(index);
    setOverview(false);
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
  const items = buildGrid(block);
  if (!items.length) return;

  const lightbox = buildLightbox(block, items);
  items.forEach((item, i) => {
    item.button.addEventListener('click', () => lightbox.open(i, item.button));
  });
}
