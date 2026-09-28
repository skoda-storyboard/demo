/*
 * Section switcher tab choice (SKODA-301, SKODA-309). Pure: no window, aem.js or fragment
 * import, so node:test can exercise it directly.
 *
 * Media Room pages (press releases, model pages, press kits, listings) live outside
 * `/en/media-room`, so the longest href match alone would keep the Stories tab active.
 * The bulk metadata rows that give those pages the Media Room nav also set
 * `section: media-room`; that value picks the tab whose target ends in the same segment.
 */

/**
 * Pathname of an authored href, resolved against the page URL; null when missing or invalid.
 * @param {string|null} href The authored href
 * @param {string} base The page URL
 * @returns {string|null}
 */
export function hrefPath(href, base) {
  if (!href) return null;
  try {
    return new URL(href, base).pathname;
  } catch (e) {
    return null;
  }
}

/**
 * Index of the tab to mark active: the `section` metadata tab, else the longest href match
 * on segment boundaries (so /news doesn't match /news-room/article), else the first tab.
 * @param {Array<string|null>} paths The tabs' target pathnames, in order
 * @param {string} pathname The current page pathname
 * @param {string} [section] The `section` metadata value, e.g. `media-room`
 * @returns {number} The tab index, or -1 when there are no tabs
 */
export function pickActiveTab(paths, pathname, section = '') {
  if (!paths.length) return -1;
  const wanted = section.trim().toLowerCase();
  if (wanted) {
    const bySection = paths.findIndex((p) => p && p.replace(/\/+$/, '').split('/').pop() === wanted);
    if (bySection !== -1) return bySection;
  }
  let best = -1;
  let bestLen = -1;
  paths.forEach((p, i) => {
    if (!p) return;
    const matches = pathname === p || pathname.startsWith(`${p.replace(/\/$/, '')}/`);
    if (matches && p.length > bestLen) {
      best = i;
      bestLen = p.length;
    }
  });
  return best === -1 ? 0 : best;
}
