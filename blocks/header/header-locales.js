/*
 * Language switcher (SKODA-303). Pure: no window, aem.js or fragment import, so node:test can
 * exercise it directly (the DOM comes from the element passed in).
 *
 * Authored in the nav fragment's topbar row as one paragraph, the current locale bold and the
 * rest as links:  **EN** [CZ](/cs/) [DE](/de/) [SK](/sk/) [SR](/sr/) [SL](/sl/)
 * The row names the site's locales and their order (the live list is always EN CZ DE SK SR SL;
 * the current locale doesn't move); the current one is taken from the page URL, so one
 * fragment serves every locale tree. Each link gets `hreflang` / `lang` and the language's own
 * name as its accessible name; the visible text stays the code.
 *
 * Targets (SKODA-303a, #299 review): the page's declared translations, its native hreflang links
 * (`<link rel="alternate" hreflang href>` in the head, which EDS renders from the `hreflang:<code>`
 * metadata that tools/importer/build-locale-alternates.mjs writes for the pairs migrated to EDS).
 * `x-default` is not a language and is skipped. A locale without a declared translation is
 * omitted: no prefix swap, no locale-home fallback, never a live-site URL. A translation must be
 * a page of this site (this host, or another branch / stage host of the same EDS site) in its
 * own locale's tree; its path opens on the current host, in the same tab, as on the source.
 * Only an authored link to another site replaces a declared translation, in a new tab (the
 * Media Room DE → skoda-media.de, as on the source). The list is marked
 * `data-link-policy="resolved"` so the site's link pass (scripts/links.js) leaves it alone.
 *
 * i18n: the list's names are LOCALE_LIST_LABELS, the header passes the page locale's (SKODA-1003).
 * The language names are endonyms, locale-neutral.
 */

import { LIVE_ORIGIN } from '../../scripts/links.js';

const LIVE_HOST = new URL(LIVE_ORIGIN).host;

// the list's name and a new-tab link's name; the header passes the page locale's
// (`headerLanguages`, `headerNewTab`, SKODA-1003)
export const LOCALE_LIST_LABELS = {
  languages: 'Language',
  newTab: '{name} (opens in a new tab)',
};

/** The site's locales: code (URL segment), the visible label, the language's own name. */
export const LOCALES = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'cs', label: 'CZ', name: 'Čeština' },
  { code: 'de', label: 'DE', name: 'Deutsch' },
  { code: 'sk', label: 'SK', name: 'Slovenčina' },
  { code: 'sr', label: 'SR', name: 'Srpski' },
  { code: 'sl', label: 'SL', name: 'Slovenščina' },
];

const byCode = new Map(LOCALES.map((l) => [l.code, l]));
const byLabel = new Map(LOCALES.map((l) => [l.label.toLowerCase(), l]));

/**
 * The locale of a pathname: its first segment when that is a known locale, else `en` (the
 * root home and unprefixed pages are English).
 * @param {string} pathname e.g. `/cs/e-mobilita/x`
 * @returns {string} a LOCALES code
 */
export function currentLocale(pathname = '/') {
  const seg = String(pathname).split('/')[1]?.toLowerCase() || '';
  return byCode.has(seg) ? seg : 'en';
}

/**
 * The locale an authored entry stands for: its link's first path segment, else its text
 * (`CZ`, `cs`, `EN` …). Null when neither is a known locale.
 * @param {string|null} href the authored href (null for the bold current-locale text)
 * @param {string} text the entry's text
 * @param {string} base the page URL, to resolve relative hrefs
 * @returns {string|null}
 */
export function localeOf(href, text, base) {
  // only a path or an absolute URL names a locale tree: `#subscribe` or a relative href
  // would resolve into the current page's own locale
  if (href && /^(\/|https?:)/i.test(href)) {
    try {
      const seg = new URL(href, base).pathname.split('/')[1]?.toLowerCase() || '';
      if (byCode.has(seg)) return seg;
    } catch (e) { /* fall back to the text */ }
  }
  const t = String(text || '').trim().toLowerCase();
  return byLabel.get(t)?.code || (byCode.has(t) ? t : null);
}

/**
 * The authored locale entries of a paragraph, in source order: links and bold text that
 * stand for a known locale (anything else is ignored). A duplicate locale keeps the first.
 * @param {Element} p the authored paragraph
 * @param {string} base the page URL
 * @returns {Array<{code: string, href: string|null}>}
 */
export function localeEntries(p, base) {
  const seen = new Set();
  const entries = [];
  [...p.querySelectorAll('a, strong, b')].forEach((el) => {
    if (el.tagName !== 'A' && el.querySelector('a')) return; // bold wrapping a link: the link counts
    const href = el.tagName === 'A' ? el.getAttribute('href') : null;
    const code = localeOf(href, el.textContent, base);
    if (!code || seen.has(code)) return;
    seen.add(code);
    entries.push({ code, href });
  });
  return entries;
}

/** Is this paragraph the locale list? At least two known locales in it. */
export function isLocaleGroup(p, base) {
  return localeEntries(p, base).length >= 2;
}

/**
 * The page's declared translations: its native hreflang links, `<link rel="alternate"
 * hreflang="cs" href="…">` in the head (EDS renders them from `hreflang:<code>` metadata). A
 * region subtag is dropped (`de-AT` → de); `x-default`, unknown codes, links without an href,
 * alternate stylesheets and repeats (the first wins) are skipped.
 * @param {Document} doc the page
 * @returns {Map<string, string>} locale code → URL as declared
 */
export function pageHreflangs(doc) {
  const map = new Map();
  doc.head?.querySelectorAll('link[rel~="alternate"][hreflang][href]:not([rel~="stylesheet"])').forEach((link) => {
    const code = link.getAttribute('hreflang').trim().toLowerCase().split('-')[0];
    const href = link.getAttribute('href').trim();
    if (href && byCode.has(code) && !map.has(code)) map.set(code, href);
  });
  return map;
}

// The hosts of one EDS site: `<ref>--<site>--<org>.aem.page|live`, any branch or stage.
const EDS_HOST = /^[a-z0-9-]+(--[a-z0-9-]+--[a-z0-9-]+)\.aem\.(?:page|live)$/i;

/**
 * Is `host` this site: the current host, the host the page's own hreflang link names (the site's
 * canonical host, e.g. its live host while it is previewed or developed locally), or another
 * branch / stage host of the same EDS site?
 */
function isThisSite(host, base, ownHost = '') {
  const current = new URL(base).host;
  if (host === current || (ownHost && host === ownHost)) return true;
  const [, site] = current.match(EDS_HOST) || [];
  return !!site && (host.match(EDS_HOST) || [])[1]?.toLowerCase() === site.toLowerCase();
}

/** The host of a URL, '' when it doesn't parse. */
const hostOf = (href, base) => {
  try {
    return new URL(href, base).host;
  } catch (e) {
    return '';
  }
};

/**
 * A declared translation as a permitted link target, else null: a page of this site (a
 * migrated EDS variant; the hreflang URLs are absolute on the site's live host) in its own
 * locale's tree (`/cs/…` for cs), returned as its path, so it opens on the current host. Live-site
 * URLs are not targets: the switcher never leaves the demo (SKODA-303a, PO 2026-10-08).
 * @param {string} code the locale
 * @param {string} href the declared URL
 * @param {string} base the page URL
 * @param {string} [ownHost] the host of the page's own hreflang link
 * @returns {string|null} the site-relative path (+ query / hash)
 */
export function permittedTranslation(code, href, base, ownHost = '') {
  let url;
  try {
    url = new URL(href, base);
  } catch (e) {
    return null;
  }
  if (!/^https?:$/.test(url.protocol) || !isThisSite(url.host, base, ownHost)) return null;
  if (url.pathname.split('/')[1]?.toLowerCase() !== code) return null;
  return `${url.pathname}${url.search}${url.hash}`;
}

/** An authored link to another site (neither this one nor the live storyboard). */
function isOtherSite(href, base) {
  try {
    const url = new URL(href, base);
    return /^https?:$/.test(url.protocol) && ![new URL(base).host, LIVE_HOST].includes(url.host);
  } catch (e) {
    return false;
  }
}

/**
 * The switcher list, in the authored order: the current locale as
 * `<span aria-current="true">`, every other locale with a permitted declared translation as a
 * link with `hreflang` / `lang` and its own language name (an authored link to another site
 * replaces the translation, in a new tab). Locales without one are left out.
 * @param {Array<{code: string, href: string|null}>} entries from localeEntries()
 * @param {string} current the page's locale, from currentLocale()
 * @param {Document} doc the document to build in
 * @param {Map<string, string>} [translations] the declared translations, from pageHreflangs()
 * @param {typeof LOCALE_LIST_LABELS} [labels] the page locale's names (English by default)
 * @returns {HTMLUListElement|null} null when there are no entries
 */
export function buildLocaleList(
  entries,
  current,
  doc,
  translations = new Map(),
  labels = LOCALE_LIST_LABELS,
) {
  if (!entries.length) return null;
  const base = doc.baseURI;
  // the page's own hreflang link names the site's host (absolute on its live host)
  const ownHost = translations.has(current) ? hostOf(translations.get(current), base) : '';
  const ul = doc.createElement('ul');
  ul.className = 'nav-locales-list';
  ul.setAttribute('aria-label', labels.languages);
  ul.dataset.linkPolicy = 'resolved';
  entries.forEach(({ code, href }) => {
    const { label, name } = byCode.get(code);
    let item;
    if (code === current) {
      item = doc.createElement('span');
      item.setAttribute('aria-current', 'true');
    } else {
      const translation = translations.has(code)
        && permittedTranslation(code, translations.get(code), base, ownHost);
      if (!translation) return; // no declared translation: omitted, never a locale home
      const elsewhere = isOtherSite(href, base);
      // the name starts with the visible label (WCAG 2.5.3 Label in Name, SKODA-703): CZ – Čeština
      const named = `${label} – ${name}`;
      item = doc.createElement('a');
      item.setAttribute('href', elsewhere ? href : translation);
      item.setAttribute('hreflang', code);
      if (elsewhere) {
        item.setAttribute('target', '_blank');
        item.setAttribute('rel', 'noopener');
        item.setAttribute('aria-label', labels.newTab.replace('{name}', named));
      } else {
        item.setAttribute('aria-label', named);
      }
    }
    item.setAttribute('lang', code);
    item.textContent = label;
    const li = doc.createElement('li');
    li.append(item);
    ul.append(li);
  });
  return ul;
}
