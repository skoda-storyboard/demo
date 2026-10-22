/*
 * Per-locale site paths (SKODA-1001). The translated sites use their own slugs (Images is
 * `/cs/foto`, Search `/de/suche`), so a section's link can't be built by swapping the
 * `/en/` prefix. The map is the source's own translation map: each English section page's
 * `<link rel="alternate" hreflang>` set on the live site (2026-10-22), in the EDS form (no
 * trailing slash). A section a locale doesn't have falls back to the English path.
 *
 * BUILT names the per-locale content this site generates itself, not imported pages: the media
 * feed (`/{locale}/media-feed.json`, tools/importer/media-items) and the branded 404's
 * fragments (`/{locale}/fragments/404/…`, SKODA-706). Only English exists so far; a locale
 * without its own reads the English one rather than a 404.
 */

import { currentLocale } from './query-index.js';

export const LOCALE_PATHS = {
  en: {
    home: '/en',
    mediaRoom: '/en/media-room',
    news: '/en/news',
    pressKits: '/en/press-kits',
    images: '/en/images',
    videos: '/en/videos',
    search: '/en/search',
    mediaCart: '/en/media-cart',
    series: '/en/series-2',
    contacts: '/en/contacts',
    newsletter: '/en/newsletter',
  },
  cs: {
    home: '/cs',
    mediaRoom: '/cs/media-room',
    news: '/cs/tiskove-zpravy',
    pressKits: '/cs/tiskove-mapy',
    images: '/cs/foto',
    videos: '/cs/video',
    search: '/cs/hledat',
    mediaCart: '/cs/kontakty/kosik',
    series: '/cs/serialy',
    contacts: '/cs/kontakty',
    newsletter: '/cs/newsletter',
  },
  de: {
    home: '/de',
    mediaRoom: '/de/media-room',
    news: '/de/pressemitteilungen',
    pressKits: '/de/pressemappen',
    images: '/de/fotos',
    videos: '/de/videos',
    search: '/de/suche',
    mediaCart: '/de/media-kart',
    contacts: '/de/kontakte',
  },
  sk: {
    home: '/sk',
    mediaRoom: '/sk/media-room',
    news: '/sk/tlacove-spravy',
    pressKits: '/sk/tlacove-mapy',
    images: '/sk/fotografie',
    videos: '/sk/video',
    search: '/sk/hladat',
    mediaCart: '/sk/kosik',
    series: '/sk/serialy',
    contacts: '/sk/kontakty',
  },
  sr: {
    home: '/sr',
    mediaRoom: '/sr/media-room',
    news: '/sr/news',
    pressKits: '/sr/press-kits',
    images: '/sr/fotografije',
    videos: '/sr/video',
    search: '/sr/pretraga',
    mediaCart: '/sr/media-package',
    series: '/sr/serije',
    contacts: '/sr/kontakti',
  },
  sl: {
    home: '/sl',
    mediaRoom: '/sl/media-room',
    images: '/sl/slike',
    videos: '/sl/videoposnetki',
    search: '/sl/isci',
    mediaCart: '/sl/medijski-paket',
    series: '/sl/serije',
    contacts: '/sl/kontakti',
  },
};

/**
 * Where each locale keeps a content type's pages (the source's item URLs, 2026-10-22), as the
 * listings' and rails' `path` scope, in the EDS form the importer writes (`_` → `-`: the source's
 * `/sr/press_release/…` is `/sr/press-release/…` here). A locale with none of that type falls
 * back to English.
 */
export const CONTENT_PREFIXES = {
  press_release: {
    en: '/en/press-releases',
    cs: '/cs/tiskove-zpravy-archiv',
    de: '/de/pressemitteilungen-archive',
    sk: '/sk/tlacova-sprava',
    sr: '/sr/press-release',
    sl: '/sl/press-release',
  },
  press_kit: {
    en: '/en/press-kits',
    cs: '/cs/tiskove-mapy',
    de: '/de/pressemappe',
    sk: '/sk/press-kit',
    sr: '/sr/press-kit',
  },
  skoda_model: {
    en: '/en/skoda-model',
    cs: '/cs/skoda-model',
    de: '/de/skoda-model',
    sk: '/sk/skoda-model',
  },
};

/** Per-locale content this site builds itself; a locale not listed reads the English one. */
export const BUILT = {
  mediaFeed: ['en'],
  fragments404: ['en'],
};

/**
 * A site section's path in the page's locale, else the English one.
 * @param {string} key a LOCALE_PATHS key (`news`, `images`, `mediaCart`, …)
 * @param {string} [pathname] the page path (default: the current page)
 */
export function localePath(key, pathname = window.location.pathname) {
  const locale = currentLocale(pathname);
  return LOCALE_PATHS[locale]?.[key] || LOCALE_PATHS.en[key];
}

/**
 * The locale whose copy of a built resource to read: the page's own when it is built, else
 * English.
 * @param {string} kind a BUILT key (`mediaFeed`, `fragments404`)
 * @param {string} [pathname] the page path (default: the current page)
 */
export function builtLocale(kind, pathname = window.location.pathname) {
  const locale = currentLocale(pathname);
  return (BUILT[kind] || []).includes(locale) ? locale : 'en';
}

/**
 * A content type's path prefix in a locale (`/cs/tiskove-zpravy-archiv`), else the English one.
 * @param {string} template a CONTENT_PREFIXES key (`press_release`, `press_kit`, `skoda_model`)
 * @param {string} locale a two-letter locale code
 */
export function contentPrefix(template, locale) {
  const prefixes = CONTENT_PREFIXES[template];
  return prefixes?.[locale] || prefixes?.en;
}
