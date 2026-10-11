/*
 * media-cart-limits.js: the media cart's package limits and the package-limit banner, with no
 * imports, so a media listing can render the banner in its first paint without loading the
 * cart (SKODA-505a review: the cart stays off the eager path). The store (media-cart.js) and
 * its UI (media-cart-ui.js) re-export these. The banner's styles are with the blocks that show
 * it (listing, media-cart), so it needs no stylesheet of its own.
 */

// the source cart-limit plugin's 80 items; 1 GiB keeps the zip in browser memory (and
// under the classic ZIP limits: fflate writes no ZIP64)
export const LIMITS = Object.freeze({ items: 80, bytes: 1024 ** 3 });

/** The banner's English text; `mediaCartLimitBanner` in the placeholders sheet overrides it. */
export const LIMIT_BANNER_TEXT = 'A download package can contain up to {max} files ({size} in total). Larger selections need to be downloaded as several packages.';

/** Replace `{name}` tokens; unknown tokens stay as they are. */
export const format = (text, values = {}) => String(text)
  .replace(/\{(\w+)\}/g, (m, name) => (name in values ? String(values[name]) : m));

/** A byte count for people: 1.2 MB, 850 KB, 1 GB. */
export function formatBytes(bytes = 0) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = Math.max(0, Number(bytes) || 0);
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const digits = unit === 0 || value >= 10 || Number.isInteger(value) ? 0 : 1;
  return `${Number(value.toFixed(digits))} ${units[unit]}`;
}

/**
 * The source's package-limit notice (media-cart-limit plugin): an info banner above a media
 * grid and on the cart page.
 * @param {string} [text] the banner text with `{max}` / `{size}` tokens
 * @param {{items: number, bytes: number}} [limits]
 * @returns {HTMLDivElement}
 */
export function buildLimitBanner(text = LIMIT_BANNER_TEXT, limits = LIMITS) {
  const banner = document.createElement('div');
  banner.className = 'media-cart-limit';
  banner.textContent = format(text, { max: limits.items, size: formatBytes(limits.bytes) });
  return banner;
}
