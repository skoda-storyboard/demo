/*
 * media-cart-ui.js — the media cart's shared presentation (SKODA-505b): its text, the link to
 * the cart page, the package-limit banner and the notice shown when an add is refused. The
 * cart state and behaviour live in media-cart.js (SKODA-505a); the badge is in float-dock,
 * the cart page is the media-cart block. Styles: /styles/media-cart.css (loaded on use).
 *
 * i18n: every string comes from the per-locale placeholders sheet (keys below, camelCased by
 * fetchPlaceholders) with English defaults. `{n}`, `{max}`, `{size}`, `{title}`, `{added}`,
 * `{total}` are replaced by `format`; a `…One` key is the singular of a counted text (`plural`).
 */

import { loadCSS } from './aem.js';
import { currentLocale } from './query-index.js';
// not the store: the UI and the listing banner must not pull it in (SKODA-505a review)
import {
  LIMITS, LIMIT_BANNER_TEXT, buildLimitBanner, format, formatBytes,
} from './media-cart-limits.js';

export { format, formatBytes };

export const DEFAULT_LABELS = {
  badge: 'Media cart',
  badgeCount: 'Media cart, {n} items',
  badgeCountOne: 'Media cart, 1 item',
  countChanged: '{n} items in the media cart',
  countChangedOne: '1 item in the media cart',
  heading: 'Your downloads',
  downloadPackage: 'Download package',
  emptyPackage: 'Empty package',
  cancel: 'Cancel',
  emptyMessage: 'No downloads',
  count: '{n} / {max} files · {size}',
  preparing: 'Preparing your package: {done} of {total} files',
  downloaded: 'Your package is ready.',
  cancelled: 'The download was cancelled.',
  downloadFailed: 'The package couldn\'t be prepared. Please try again.',
  failedFiles: '{n} files couldn\'t be added to the package:',
  failedFilesOne: '1 file couldn\'t be added to the package:',
  kindImage: 'Images',
  kindVideo: 'Videos',
  kindDocument: 'Documents',
  kindOther: 'Other files',
  sizeOriginal: 'Original',
  remove: 'Remove {title} from the media cart',
  limitBanner: LIMIT_BANNER_TEXT,
  limitItems: 'Your download package is full: it can contain up to {max} files. Download or empty it to add more.',
  limitBytes: 'This file doesn\'t fit: a download package can contain up to {size}.',
  network: 'The file couldn\'t be added to the media cart. Please try again.',
  unresolved: 'This file can\'t be added to the media cart.',
  storage: 'The media cart couldn\'t be saved in this browser.',
  skippedLimitBytes: '{n} files don\'t fit: a download package can contain up to {size}.',
  skippedLimitBytesOne: '1 file doesn\'t fit: a download package can contain up to {size}.',
  skippedNetwork: '{n} files couldn\'t be added to the media cart. Please try again.',
  skippedNetworkOne: '1 file couldn\'t be added to the media cart. Please try again.',
  skippedUnresolved: '{n} files can\'t be added to the media cart.',
  skippedUnresolvedOne: '1 file can\'t be added to the media cart.',
  addAll: 'Add all files to the media cart',
  addedSome: 'Added {added} of {total} files to the media cart.',
  close: 'Close',
};

const PLACEHOLDER_KEYS = Object.fromEntries(Object.keys(DEFAULT_LABELS)
  .map((key) => [key, `mediaCart${key[0].toUpperCase()}${key.slice(1)}`]));

/**
 * The cart labels from a placeholders map (`mediaCartBadge`, `mediaCartLimitBanner`, …),
 * falling back to English per key. A translated counted text without its translated `…One`
 * gets no English singular: `plural` then uses the translated text for one as well.
 * @param {Record<string,string>} [ph] from fetchPlaceholders()
 * @returns {typeof DEFAULT_LABELS}
 */
export function cartLabels(ph = {}) {
  return Object.fromEntries(Object.entries(DEFAULT_LABELS).map(([key, text]) => {
    const own = ph[PLACEHOLDER_KEYS[key]];
    if (own) return [key, own];
    const base = key.endsWith('One') ? PLACEHOLDER_KEYS[key.slice(0, -3)] : '';
    return [key, base && ph[base] ? '' : text];
  }));
}

/**
 * A counted text: `{key}One` for exactly one (when the sheet has it), else `{key}`, with `{n}`
 * and any other values filled in.
 */
export const plural = (labels, key, n, values = {}) => format(
  (n === 1 && labels[`${key}One`]) || labels[key],
  { ...values, n },
);

/** The cart page for the current locale (the source `/en/media-cart/`). */
export const cartHref = (pathname = window.location.pathname) => `/${currentLocale(pathname)}/media-cart`;

// one load for the page: loadCSS resolves at once for a sheet that is already linked but
// still loading, so callers share this promise to wait for the real load
let cartStyles = null;

/** The longest a render waits for the sheet; after that the cart renders and styles itself late. */
export const CART_STYLES_TIMEOUT_MS = 3000;

/**
 * Load /styles/media-cart.css (the refusal notice). Await it before showing the notice, or it
 * appears unstyled and then grows (a layout shift). Never rejects, and settles within
 * CART_STYLES_TIMEOUT_MS even if the sheet stalls (or never reports, as in jsdom).
 * @returns {Promise<void>}
 */
export const loadCartStyles = () => {
  cartStyles ||= Promise.race([
    loadCSS(`${window.hlx?.codeBasePath || ''}/styles/media-cart.css`).catch(() => {}),
    new Promise((resolve) => { setTimeout(resolve, CART_STYLES_TIMEOUT_MS); }),
  ]);
  return cartStyles;
};

/**
 * The source's package-limit notice (media-cart-limit plugin): an info banner above a media
 * grid and on the cart page. Built by media-cart-limits.js; styled by the block showing it
 * (listing.css, media-cart.css), so it renders styled with no extra stylesheet.
 * @param {typeof DEFAULT_LABELS} [labels]
 * @param {{items: number, bytes: number}} [limits]
 * @returns {HTMLDivElement}
 */
export function limitBanner(labels = DEFAULT_LABELS, limits = LIMITS) {
  return buildLimitBanner(labels.limitBanner, limits);
}

/**
 * The notice text for a refused add (`media-cart:refused` reasons, see REASONS). With `count`
 * (a group add), per-file reasons are counted: "2 files can't be added …".
 */
export function refusalMessage(reason, labels = DEFAULT_LABELS, limits = LIMITS, count = 0) {
  const values = { max: limits.items, size: formatBytes(limits.bytes) };
  const key = {
    'limit-items': 'limitItems',
    'limit-bytes': 'limitBytes',
    network: 'network',
    unresolved: 'unresolved',
    storage: 'storage',
  }[reason];
  if (!key) return '';
  const counted = `skipped${key[0].toUpperCase()}${key.slice(1)}`;
  if (count > 0 && labels[counted]) return plural(labels, counted, count, values);
  return format(labels[key], values);
}

// one notice at a time, reused; it closes itself after a while
let notice = null;
let noticeTimer = 0;
const NOTICE_MS = 8000;

function closeNotice() {
  clearTimeout(noticeTimer);
  if (notice) notice.hidden = true;
}

/**
 * Show a short, non-modal notice (the source's centred cart-limit popup). It doesn't take
 * focus; Escape or its close button dismisses it, and it hides itself after 8s.
 * @param {string} text
 * @param {typeof DEFAULT_LABELS} [labels]
 * @returns {HTMLElement|null}
 */
export function showNotice(text, labels = DEFAULT_LABELS) {
  if (!text) return null;
  loadCartStyles();
  if (!notice) {
    notice = document.createElement('div');
    notice.className = 'media-cart-notice';
    notice.hidden = true;
    const message = document.createElement('p');
    message.className = 'media-cart-notice-text';
    message.setAttribute('role', 'alert');
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'media-cart-notice-close';
    close.addEventListener('click', closeNotice);
    notice.append(message, close);
    // capture: the notice closes first, not a dialog under it (the lightbox listens too).
    // Only when it is on top: a lightbox opened over a page notice covers it, so Escape is the
    // lightbox's (the notice still closes itself after NOTICE_MS).
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !notice?.isConnected || notice.closest('[hidden]')) return;
      const overlay = document.querySelector('.gallery-overlay:not([hidden])');
      if (overlay && !overlay.contains(notice)) return;
      e.stopPropagation();
      closeNotice();
    }, true);
  }
  // inside an open lightbox (a modal dialog, above everything), else at the end of the page;
  // re-attached when the page has replaced its body content since
  const host = document.querySelector('.gallery-overlay:not([hidden])') || document.body;
  if (notice.parentElement !== host) host.append(notice);
  const close = notice.querySelector('.media-cart-notice-close');
  close.setAttribute('aria-label', labels.close);
  notice.querySelector('.media-cart-notice-text').textContent = text;
  notice.hidden = false;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(closeNotice, NOTICE_MS);
  return notice;
}

/**
 * The page-wide `media-cart:refused` handler (scripts.js): says why an add didn't happen.
 * Duplicates are not refusals worth a notice.
 * @param {CustomEvent} e
 */
export async function onRefused(e) {
  const reason = e?.detail?.reason;
  if (!reason || reason === 'duplicate') return;
  const { fetchPlaceholders } = await import('./placeholders.js');
  const [ph] = await Promise.all([fetchPlaceholders(), loadCartStyles()]);
  const labels = cartLabels(ph);
  showNotice(refusalMessage(reason, labels), labels);
}
