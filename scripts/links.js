/*
 * Link containment policy (SKODA-609, decision D-3 (b); new-tab parity with SKODA-306).
 * Pure core (policyHref) so node:test and tools/importer/check-dead-links.mjs share it.
 *
 * - Links to the live source host (`[www.]skoda-storyboard.com`, not `cdn.`) are out of the
 *   demo set by construction (the importer only rewrites allow-listed targets site-relative):
 *   they open in a new tab. Exception: DEMO_LISTINGS (demo entry/listing pages the DA Media
 *   Room nav still links to on the live host) become site-relative and stay in the tab.
 * - Site-relative links to sections the demo does not carry (LIVE_ONLY: other locales,
 *   Škodapedia, feeds, Media Room service pages, source-only downloads) point at the live site
 *   and open in a new tab, instead of 404ing on EDS. Mostly the DA nav/footer fragments.
 *   Exception: LIVE_SAME_TAB pages (the newsletter "Manage subscription") stay in the tab, as
 *   on the source (SKODA-308).
 * - A trailing slash on any other site-relative path is dropped: EDS 404s `/en/`, serves `/en`.
 * - Links inside `[data-link-policy="resolved"]` are left alone: their block already chose
 *   the target and the tab (the language switcher's translations, SKODA-303a).
 * - Fragment block references skip the live redirect (LIVE_ONLY): the link names content this
 *   site serves (the shared `/{locale}/fragments/newsletter-card`, SKODA-840), not a page to
 *   navigate to, and the locale rule would send `/cs/fragments/…` to the live site, so the card
 *   would never load (#243). They keep the trailing-slash rule: `loadFragment()` appends
 *   `.plain.html`, and `/x/.plain.html` 404s (#348 review).
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
  // the documents the demo doesn't carry (`what-are-your-rights`: live 302s it to skoda-auto.com);
  // the index, the consent and the cookies document are migrated (SKODA-843)
  /^\/en\/documents\/(?!(?:consent-to-personal-data-processing-information-on-personal-data-processing|cookies)?\/?$)/i,
  /^\/en\/newsletter-settings(?:\/|$)/i,
];

// Live-only pages that open in the same tab, as on the source (SKODA-308, decided 2026-10-06:
// the newsletter forms' "Manage subscription"). Their links still go to the live site.
export const LIVE_SAME_TAB = [
  /^\/en\/newsletter-settings(?:\/|$)/i,
];

/**
 * Whether a live-site link opens in the same tab (LIVE_SAME_TAB) instead of a new one.
 * @param {string} href
 * @returns {boolean}
 */
export function opensInSameTab(href) {
  try {
    const url = new URL(href, LIVE_ORIGIN);
    return LIVE_HOST.test(url.hostname) && LIVE_SAME_TAB.some((re) => re.test(url.pathname));
  } catch (e) {
    return false;
  }
}

// Authored chrome paths whose live counterpart has another slug.
export const LIVE_ALIASES = {
  '/en/category/podcast': '/en/category/podcast-en',
};

// Demo listing/entry pages that DA chrome (the Media Room nav) and tag chips link to on the
// live host: they stay on the demo, site-relative, query + hash kept (listing filters).
// `/en/media-cart` is the demo's own cart page (SKODA-505b): the cart badge links there.
// `/en/contacts` and `/en/copyright` are the migrated page-shell pages (SKODA-813): the header's
// Contacts and the footers' contact and Copyright links. The migrated documents (SKODA-843) too:
// the newsletter forms' absolute consent link.
// `/en/newsletter` is the migrated plant newsletter page (SKODA-845): Company → Newsletter.
export const DEMO_LISTINGS = new Set([
  '/en', '/en/media-room', '/en/news', '/en/press-kits', '/en/images', '/en/videos',
  '/en/series-2', '/en/search', '/en/media-cart', '/en/contacts', '/en/copyright',
  '/en/newsletter',
  '/en/documents', '/en/documents/cookies',
  '/en/documents/consent-to-personal-data-processing-information-on-personal-data-processing',
]);

// Source anchors a demo page has under another id: the Media Room footer links to the source's
// `/en/contacts/#corporate` and `#product` sections, which are the demo page's headings (ids from
// their text). SKODA-810 rebuilds that body; keep these in step with its headings.
export const HASH_ALIASES = {
  '/en/contacts': {
    '#corporate': '#škoda-corporate-communications',
    '#product': '#škoda-productcommunications',
  },
};

/** A demo path with its query and hash, the hash mapped through HASH_ALIASES. */
function demoHref(path, url) {
  const hash = HASH_ALIASES[path]?.[url.hash.toLowerCase()] || url.hash;
  return `${path}${url.search}${hash}`;
}

/**
 * Policy result for an authored href on a demo page.
 * @param {string|null} href The authored href
 * @param {string} base The page URL (its origin is the demo origin)
 * @param {{fragment?: boolean}} [options] fragment: a Fragment block reference (no live redirect)
 * @returns {{href: string, newTab: boolean}|null} null = leave the link as it is
 */
export function policyHref(href, base, { fragment = false } = {}) {
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
    const demoPath = trimmed.toLowerCase();
    if (DEMO_LISTINGS.has(demoPath)) return { href: demoHref(demoPath, url), newTab: false };
    return { href, newTab: !opensInSameTab(href) };
  }
  if (url.origin !== origin) return null;
  const aliased = HASH_ALIASES[trimmed.toLowerCase()]?.[url.hash.toLowerCase()];
  if (aliased) return { href: demoHref(trimmed.toLowerCase(), url), newTab: false };

  if (!fragment && LIVE_ONLY.some((re) => re.test(url.pathname))) {
    const livePath = LIVE_ALIASES[trimmed.toLowerCase()];
    const path = livePath ? `${livePath}/` : url.pathname;
    return { href: `${LIVE_ORIGIN}${path}${tail}`, newTab: !opensInSameTab(path) };
  }
  if (trimmed !== url.pathname) {
    const relative = !/^[a-z]+:|^\/\//i.test(href);
    return { href: relative ? `${trimmed}${tail}` : `${url.origin}${trimmed}${tail}`, newTab: false };
  }
  return null;
}

function applyTo(a, base) {
  if (a.closest('[data-link-policy="resolved"]')) return;
  const result = policyHref(a.getAttribute('href'), base, { fragment: !!a.closest('.fragment') });
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
