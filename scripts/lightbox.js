/*
 * lightbox.js — the shared accessible image lightbox (SKODA-203), used by the `gallery`
 * block and the media rails (story-rail Images, SKODA-208/406). Lives in /scripts/
 * because it is cross-block shared code (AGENTS.md). Its styles are styles/lightbox.css,
 * loaded on build.
 *
 * One overlay per image set: role=dialog, focus trap, Escape, arrow-key nav, aria-live
 * counter, focus return to the invoking element. Desktop: the image left, a detail panel
 * right (title, caption, actions, file metadata, tag chips, related article), the close ✕
 * top-right and the counter + ‹ › bottom-right (the source colorbox chrome).
 *
 * Items: { src, alt, caption: Element|null } plus, optionally,
 *   full     the URL shown in the stage (default: `src` as a 2000px media-bus rendition)
 *   download the download link (default: `src` as JPEG)
 *   link     the URL "copy link" copies (default: `src`)
 *   cartId   the media-cart key on the add button (SKODA-505 binds it)
 *   actions  false: no action buttons (the source's content images), spacing kept
 *   video    an embed URL (Vimeo player): the stage plays it instead of the image
 *
 * i18n: all control text lives in LABELS (the single translation point, SKODA-1003).
 */

import { loadCSS } from './aem.js';

const LABELS = {
  dialog: 'Image gallery',
  prev: 'Previous image',
  next: 'Next image',
  close: 'Close gallery',
  video: 'Video player',
  // the visible counter reads "N / total" (the total in grey); the aria-live label is the long form
  counterLabel: (n, total) => `Image ${n} of ${total}`,
  // detail-panel action buttons (Media-Room style)
  addToBox: 'Add to media box',
  download: 'Download image',
  copyLink: 'Copy image link',
};

const REDUCED_MOTION = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Turn the tags paragraph (e.g. "2026 · Peaq") into individual chips (the live
 * Media-Room tag pills). Idempotent. The tags line is the `·`-separated paragraph that is
 * neither the file-metadata block nor the related-article line.
 * @param {Element} caption the stage caption/detail panel
 */
export function decorateTags(caption) {
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
 * Build one reusable accessible lightbox overlay for an image set.
 * @param {Element} host where the overlay is appended (a block, or document.body)
 * @param {Array} items see the file header
 * @returns {{open: Function, overlay: Element}}
 */
export function buildLightbox(host, items) {
  loadCSS(`${window.hlx?.codeBasePath || ''}/styles/lightbox.css`);
  const overlay = document.createElement('div');
  overlay.className = 'gallery-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', LABELS.dialog);
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
  addBtn.classList.add('add');
  const downloadBtn = document.createElement('a');
  downloadBtn.className = 'gallery-lightbox-action';
  downloadBtn.setAttribute('aria-label', LABELS.download);
  downloadBtn.setAttribute('download', '');
  downloadBtn.classList.add('download');
  const linkBtn = document.createElement('button');
  linkBtn.type = 'button';
  linkBtn.className = 'gallery-lightbox-action';
  linkBtn.setAttribute('aria-label', LABELS.copyLink);
  linkBtn.classList.add('link');
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
  host.append(overlay);

  let current = 0;
  let lastFocused = null;
  let singleMode = false;

  // one player iframe per overlay, created on the first video item
  let player = null;
  const videoPlayer = () => {
    if (!player) {
      player = document.createElement('iframe');
      player.className = 'gallery-lightbox-video';
      player.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
      player.setAttribute('allowfullscreen', '');
      player.hidden = true;
      imageFrame.append(player);
    }
    return player;
  };
  // leaving a video (close, prev / next) must stop it: drop the player's document
  const stopVideo = () => {
    if (!player || player.hidden) return;
    player.removeAttribute('src');
    player.hidden = true;
  };

  const render = (index) => {
    current = (index + items.length) % items.length;
    const item = items[current];
    // request a large lightbox rendition from the authored source
    const base = item.src.split('?')[0];
    // show the loading placeholder + reset the fade/zoom, then reveal once the
    // rendition has decoded so the image animates in visible rather than
    // popping in after the open effect
    stopVideo();
    if (item.video) {
      // videos play in the stage (the source colorbox iframe): the player letterboxes
      stageImg.hidden = true;
      imageFrame.classList.remove('is-loading');
      const frame = videoPlayer();
      frame.title = item.alt || LABELS.video;
      frame.src = item.video;
      frame.hidden = false;
    } else {
      stageImg.hidden = false;
    }
    stageImg.classList.remove('is-loaded');
    if (!item.video) imageFrame.classList.add('is-loading');
    if (item.video) stageImg.removeAttribute('src');
    else stageImg.src = item.full || `${base}?width=2000&format=webply&optimize=medium`;
    stageImg.alt = item.alt;
    const reveal = () => {
      stageImg.classList.add('is-loaded');
      imageFrame.classList.remove('is-loading');
    };
    if (item.video || stageImg.complete) reveal();
    else {
      stageImg.addEventListener('load', reveal, { once: true });
      // still reveal (so the placeholder clears and the caption/detail panel is
      // never stuck hidden) if the rendition fails to load
      stageImg.addEventListener('error', reveal, { once: true });
    }
    // clone the caption content into the stage caption (plain or panel), then place
    // the action buttons after the description, above the file metadata block
    // (matches the live layout)
    stageCaption.textContent = '';
    if (item.caption) {
      [...item.caption.childNodes].forEach((n) => stageCaption.append(n.cloneNode(true)));
      downloadBtn.href = item.download || `${base}?format=jpg`;
      // `actions: false` (content images): the source panel keeps an empty actions row
      actions.classList.toggle('is-empty', item.actions === false);
      if (item.cartId) addBtn.dataset.id = item.cartId;
      else delete addBtn.dataset.id;
      // insert before the first "File type…"/metadata paragraph if present,
      // otherwise fall back to the end of the panel
      const paras = [...stageCaption.querySelectorAll('p')];
      const meta = paras.find((p) => /file type/i.test(p.textContent));
      if (meta) stageCaption.insertBefore(actions, meta);
      else stageCaption.append(actions);
      // render the tags paragraph ("2026 · Peaq") as individual chips
      decorateTags(stageCaption);
      stageCaption.hidden = false;
    } else {
      stageCaption.hidden = true;
    }
    // "1 / 20": the total (with its separator) in grey, as the source counter
    const sep = document.createElement('span');
    sep.className = 'gallery-lightbox-sep';
    sep.textContent = ' / ';
    const total = document.createElement('span');
    total.className = 'gallery-lightbox-total';
    total.append(sep, String(items.length));
    counter.replaceChildren(String(current + 1), total);
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
    stopVideo();
    overlay.hidden = true;
    document.body.classList.remove('gallery-lightbox-open');
    document.removeEventListener('keydown', onKeydown);
    if (lastFocused) lastFocused.focus();
  };

  // `single` = opened from a standalone lead image: just that image, no prev/next, no
  // counter (the live main-image viewer). Otherwise it is a navigable set.
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
    const target = items[current].link || items[current].src.split('?')[0];
    const url = new URL(target, window.location.href).href;
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

  return { open, overlay };
}
