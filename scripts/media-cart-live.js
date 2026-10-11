/*
 * media-cart-live.js: the media cart's add/remove announcement (spec §6, SKODA-505a review).
 *
 * One polite live region on the page, created (empty) when the first cart control is bound, so
 * it exists before the first change and is never display-toggled (a region that appears with
 * its text, or toggles display, is often not announced). While the lightbox is open, the
 * announcement goes to a region inside it: the lightbox is an aria-modal dialog, so screen
 * readers ignore regions outside it. Styled visually hidden by styles.css (`.media-cart-live`).
 *
 * No imports, so the store (media-cart.js) can use it and stay testable without a page; the
 * text comes from the cart labels (media-cart-ui.js + placeholders), loaded on the first change.
 */

const REGION_CLASS = 'media-cart-live';
const OVERLAY = '.gallery-overlay';
// the region is emptied first and filled a moment later, so a repeated text is read again
export const ANNOUNCE_DELAY_MS = 50;

function regionIn(host) {
  let region = [...host.children].find((el) => el.classList.contains(REGION_CLASS));
  if (!region) {
    region = host.ownerDocument.createElement('div');
    region.className = REGION_CLASS;
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    host.append(region);
  }
  return region;
}

const openOverlay = (doc) => [...doc.querySelectorAll(OVERLAY)].find((o) => !o.hidden) || null;

let seq = 0;

/**
 * Say `text` in the live region of the open lightbox, else the page's.
 * @param {string} text
 * @param {Document} [doc]
 * @returns {Promise<HTMLElement|null>} the region, once the text is in it
 */
export function announce(text, doc = document) {
  if (!text || !doc.body) return Promise.resolve(null);
  const region = regionIn(openOverlay(doc) || doc.body);
  seq += 1;
  const mine = seq;
  region.textContent = '';
  return new Promise((resolve) => {
    setTimeout(() => {
      if (mine === seq) region.textContent = text;
      resolve(region);
    }, ANNOUNCE_DELAY_MS);
  });
}

const installed = new WeakSet();

/**
 * Called for each bound cart control: makes sure the page region exists (and one in the
 * lightbox when the control is in it), and, once per window, announces each cart change.
 * @param {Element} el the bound control
 * @param {Window} win
 * @param {function(number): Promise<string>} [countText] the announcement for a count
 */
export function prepareAnnouncements(el, win = window, countText = undefined) {
  const doc = win.document;
  if (!doc?.body) return;
  regionIn(doc.body);
  const overlay = el?.closest?.(OVERLAY);
  if (overlay) regionIn(overlay);
  if (installed.has(win)) return;
  installed.add(win);
  const text = countText || (async (n) => {
    const [{ cartLabels, plural }, { fetchPlaceholders }] = await Promise.all([
      import('./media-cart-ui.js'), import('./placeholders.js'),
    ]);
    return plural(cartLabels(await fetchPlaceholders()), 'countChanged', n);
  });
  win.addEventListener('media-cart:change', async (e) => {
    try {
      announce(await text(e.detail?.count ?? 0), doc);
    } catch (err) {
      win.console?.warn('media cart: the change could not be announced', err);
    }
  });
}
