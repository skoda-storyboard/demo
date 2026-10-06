/*
 * Link containment policy (SKODA-609, decision D-3 (b); new-tab parity with SKODA-306).
 * Pure core (policyHref) so node:test and tools/importer/check-dead-links.mjs share it.
 *
 * - Explicit comparison links marked `data-preserve-href` bypass the runtime policy.
 * - Links to the live source host (`[www.]skoda-storyboard.com`, not `cdn.`) are out of the
 *   demo set by construction (the importer only rewrites allow-listed targets site-relative):
 *   they open in a new tab. Exception: DEMO_LISTINGS (demo entry/listing pages the DA Media
 *   Room nav still links to on the live host) become site-relative and stay in the tab.
 * - Site-relative links to sections the demo does not carry (LIVE_ONLY: other locales,
 *   Škodapedia, feeds, Media Room service pages, source-only downloads) point at the live site
 *   and open in a new tab, instead of 404ing on EDS. Mostly the DA nav/footer fragments.
 * - A trailing slash on any other site-relative path is dropped: EDS 404s `/en/`, serves `/en`.
 */

export const LIVE_ORIGIN = 'https://www.skoda-storyboard.com';
const LIVE_HOST = /^(?:www\.)?skoda-storyboard\.com$/i;

// Site-relative paths the demo does not serve → same path on the live site.
export const LIVE_ONLY = [
  /^\/direct-download\//i,
  /^\/(?!en(?:\/|$))[a-z]{2}(?:\/|$)/i,
  /^\/en\/skodapedia(?:\/|$)/i,
  /^\/en\/category\/podcast(?:-en)?(?:\/|$)/i,
  /^\/en\/(?:press-releases\/)?feed(?:\/|$)/i,
  /^\/en\/contacts(?:\/|$)/i,
  /^\/en\/documents\//i,
  /^\/en\/newsletter-settings(?:\/|$)/i,
  /^\/en\/media-cart(?:\/|$)/i,
];

// Authored chrome paths whose live counterpart has another slug.
export const LIVE_ALIASES = {
  '/en/category/podcast': '/en/category/podcast-en',
};

// Demo listing/entry pages that DA chrome (the Media Room nav) and tag chips link to on the
// live host: they stay on the demo, site-relative, query + hash kept (listing filters).
export const DEMO_LISTINGS = new Set([
  '/en', '/en/media-room', '/en/news', '/en/press-kits', '/en/images', '/en/videos',
  '/en/series-2', '/en/search',
]);

/**
 * Policy result for an authored href on a demo page.
 * @param {string|null} href The authored href
 * @param {string} base The page URL (its origin is the demo origin)
 * @returns {{href: string, newTab: boolean}|null} null = leave the link as it is
 */
export function policyHref(href, base) {
  if (!href || /^(?:#|mailto:|tel:|javascript:|data:)/i.test(href)) return null;
  let url;
  let origin;
  try {
    origin = new URL(base).origin;
    url = new URL(href, base);
  } catch (e) {
    return null;
  }
  if (!/^https?:$/.test(url.protocol)) return null;
  const tail = `${url.search}${url.hash}`;
  const trimmed = url.pathname.replace(/\/+$/, '') || '/';
  if (LIVE_HOST.test(url.hostname)) {
    if (DEMO_LISTINGS.has(trimmed.toLowerCase())) return { href: `${trimmed.toLowerCase()}${tail}`, newTab: false };
    return { href, newTab: true };
  }
  if (url.origin !== origin) return null;

  if (LIVE_ONLY.some((re) => re.test(url.pathname))) {
    const livePath = LIVE_ALIASES[trimmed.toLowerCase()];
    const path = livePath ? `${livePath}/` : url.pathname;
    return { href: `${LIVE_ORIGIN}${path}${tail}`, newTab: true };
  }
  if (trimmed !== url.pathname) {
    const relative = !/^[a-z]+:|^\/\//i.test(href);
    return { href: relative ? `${trimmed}${tail}` : `${url.origin}${trimmed}${tail}`, newTab: false };
  }
  return null;
}

function applyTo(a, base) {
  if (a.hasAttribute('data-preserve-href')) return;
  const result = policyHref(a.getAttribute('href'), base);
  if (!result) return;
  if (result.href !== a.getAttribute('href')) a.setAttribute('href', result.href);
  if (result.newTab) {
    a.target = '_blank';
    const rel = new Set((a.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
    rel.add('noopener');
    rel.add('noreferrer');
    a.setAttribute('rel', [...rel].join(' '));
  }
}

/**
 * Applies the policy to every link under root.
 * @param {Element} root The container element
 */
export function decorateLinks(root) {
  if (!root) return;
  root.querySelectorAll('a[href]').forEach((a) => applyTo(a, window.location.href));
}

/**
 * Catch-all for links blocks build after decoration: applies the policy on click, before
 * the browser follows the link.
 * @param {Document} doc The document
 */
export function installLinkPolicy(doc) {
  doc.addEventListener('click', (e) => {
    const a = e.target.closest?.('a[href]');
    if (a) applyTo(a, window.location.href);
  }, { capture: true });
}
