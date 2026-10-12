/*
 * media-cart-fly.js — the source's "flying to cart" feedback (#275, skoda-media-cart.js):
 * when a card's add goes in (`media-cart:added`, scripts/media-cart.js), a 70% copy of its
 * picture flies from the card to the dock's cart badge (blocks/float-dock), fitting into a
 * 100px box on the way (700ms, easeInOutExpo), then shrinks away and fades out (400ms, swing);
 * the badge's count bubble wobbles a second after the click. Decorative only: the copy is inert
 * and hidden from assistive tech (the cart announces the count itself), and nothing moves under
 * prefers-reduced-motion. Cards without a picture (files, the clip's toolbar) don't fly, as on
 * the source.
 */

// the cards whose picture flies, and that picture (the box that clips the image)
const CARD = '.downloads-item, .media-asset, .card-teaser';
const PICTURE = '.downloads-thumb, .listing-item-image, .card-teaser-image';
const TARGET = '.float-dock-cart';

export const FLY = Object.freeze({
  box: 100, // the copy fits into this square at the badge
  opacity: 0.7,
  flight: 700,
  fade: 400,
  wobbleAfter: 1000,
  // jQuery UI easeInOutExpo, and jQuery's default swing, as cubic-béziers
  flightEasing: 'cubic-bezier(0.87, 0, 0.13, 1)',
  fadeEasing: 'cubic-bezier(0.445, 0.05, 0.55, 0.95)',
});

/** The size that fits `width` × `height` into a `box` square, keeping its aspect (rounded down). */
export function fitBox(width, height, box = FLY.box) {
  if (!(width > 0 && height > 0)) return { width: 0, height: 0 };
  const ratio = Math.min(box / width, box / height);
  return { width: Math.floor(width * ratio), height: Math.floor(height * ratio) };
}

const visible = (el) => {
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 ? rect : null;
};

// the source wobbles the badge's count bubble (its icon's :after), the whole badge only when
// it shows no count
const COUNT = '.float-dock-cart-count';

function wobble(target) {
  const count = target.querySelector(COUNT);
  const el = count && !count.hidden ? count : target;
  el.classList.remove('is-wobbling');
  // restart the animation when a second add comes in while it still runs
  window.requestAnimationFrame(() => el.classList.add('is-wobbling'));
  el.addEventListener('animationend', () => el.classList.remove('is-wobbling'), { once: true });
}

const px = (n) => `${n}px`;

/**
 * The flying copy of `picture` as it renders (#307 review): appended to <body>, it is outside
 * the picture's block, so none of the block's scoped styles (thumbnail size, crop, corners)
 * reach it. Everything that shapes it is inlined instead: a fixed box the picture's size that
 * clips like the picture (its corner radius kept), holding one image at the image's rendered
 * size and offset, with its object-fit / object-position crop, from the source it is showing
 * (`currentSrc`, so the copy doesn't pick another `srcset` candidate). Inert and hidden from
 * assistive tech; a picture without an image is copied as it is.
 * @param {Element} picture the clipping thumbnail box
 * @param {DOMRect} from its rect
 * @returns {HTMLElement}
 */
export function flyingCopy(picture, from) {
  const img = picture.querySelector('img');
  const copy = img ? document.createElement('div') : picture.cloneNode(true);
  copy.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
  copy.removeAttribute('id');
  copy.className = img ? 'media-cart-flying' : `${copy.className} media-cart-flying`.trim();
  copy.setAttribute('aria-hidden', 'true');
  copy.inert = true;
  Object.assign(copy.style, {
    position: 'fixed',
    top: px(from.top),
    left: px(from.left),
    width: px(from.width),
    height: px(from.height),
    boxSizing: 'border-box',
    margin: '0',
    padding: '0',
    overflow: 'hidden',
    borderRadius: window.getComputedStyle(picture).borderRadius,
    opacity: String(FLY.opacity),
    pointerEvents: 'none',
    transformOrigin: '0 0',
    zIndex: 'var(--z-cart-flying)',
  });
  if (img) {
    const rect = img.getBoundingClientRect();
    const style = window.getComputedStyle(img);
    const shot = document.createElement('img');
    shot.alt = '';
    shot.src = img.currentSrc || img.src;
    // the rendered box already includes any transform (a hover zoom): drawn at that size
    Object.assign(shot.style, {
      position: 'absolute',
      top: px(rect.top - from.top),
      left: px(rect.left - from.left),
      width: px(rect.width),
      height: px(rect.height),
      maxWidth: 'none',
      maxHeight: 'none',
      margin: '0',
      padding: '0',
      border: '0',
      objectFit: style.objectFit,
      objectPosition: style.objectPosition,
      borderRadius: style.borderRadius,
      transform: 'none',
    });
    copy.append(shot);
  }
  return copy;
}

/**
 * Flies a copy of `picture` to `target`'s centre. Resolves when the copy is gone (at once when
 * either is not on screen, or under reduced motion).
 * @param {Element} picture
 * @param {Element} [target] the cart badge
 * @returns {Promise<void>}
 */
export async function flyToCart(picture, target = document.querySelector(TARGET)) {
  const from = visible(picture);
  const to = visible(target);
  if (!from || !to || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const copy = flyingCopy(picture, from);
  document.body.append(copy);
  // the copy's top-left corner lands on the badge's centre, as the source's
  const dx = to.left + to.width / 2 - from.left;
  const dy = to.top + to.height / 2 - from.top;
  const scale = fitBox(from.width, from.height).width / from.width;
  window.setTimeout(() => wobble(target), FLY.wobbleAfter);
  try {
    await copy.animate([
      { transform: 'none' },
      { transform: `translate(${dx}px, ${dy}px) scale(${scale})` },
    ], { duration: FLY.flight, easing: FLY.flightEasing, fill: 'forwards' }).finished;
    await copy.animate([
      { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: FLY.opacity },
      { transform: `translate(${dx}px, ${dy}px) scale(0)`, opacity: 0 },
    ], { duration: FLY.fade, easing: FLY.fadeEasing, fill: 'forwards' }).finished;
  } finally {
    copy.remove();
  }
}

let installed = false;

/** Listens for card adds on the page, once: each added card's picture flies to the cart. */
export function installFlyToCart(doc = document) {
  if (installed) return;
  installed = true;
  doc.addEventListener('media-cart:added', (e) => {
    const picture = e.target.closest?.(CARD)?.querySelector(PICTURE);
    if (picture) flyToCart(picture).catch(() => { /* decorative: a failed flight is harmless */ });
  });
}
