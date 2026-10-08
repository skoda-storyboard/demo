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
 * Targets (SKODA-303a): the page's declared translations, the `alternates` metadata the
 * importer takes from the source page's `<link rel="alternate" hreflang>` (x-default dropped).
 * A locale without a declared translation is omitted: no prefix swap, no locale-home fallback.
 * A translation must be in its own locale's tree, on EDS or on the live site (the permitted
 * legacy URLs while the locale trees aren't migrated); it opens in the same tab, as on the
 * source. Only an authored link to another site replaces a declared translation, in a new tab
 * (the Media Room DE → skoda-media.de, as on the source). The list is marked
 * `data-link-policy="resolved"` so the site's link pass (scripts/links.js) leaves it alone.
 *
 * i18n: the list's name lives in LABELS (English, the header's other control text is too;
 * per-locale placeholders are SKODA-1003). The language names are endonyms, locale-neutral.
 */

import { LIVE_ORIGIN } from '../../scripts/links.js';

const LIVE_HOST = new URL(LIVE_ORIGIN).host;

const LABELS = {
  list: 'Language',
  newTab: (name) => `${name} (opens in a new tab)`,
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
 * The page's declared translations: the `alternates` metadata, `cs: https://…/, de: https://…/`
 * (one `code: URL` pair per locale, comma-separated). A region subtag is dropped (`de-AT` → de);
 * unknown codes, `x-default`, malformed pairs and repeats (the first wins) are ignored.
 * @param {string|null} value the metadata value
 * @returns {Map<string, string>} locale code → URL as declared
 */
export function parseAlternates(value) {
  const map = new Map();
  String(value || '').split(/,\s*(?=[a-z]{1,8}(?:-[a-z0-9]+)*\s*:)/i).forEach((pair) => {
    const m = pair.trim().match(/^([a-z]{2})(?:-[a-z0-9]+)*\s*:\s*(\S+)$/i);
    const code = m?.[1].toLowerCase();
    if (code && byCode.has(code) && !map.has(code)) map.set(code, m[2]);
  });
  return map;
}

/**
 * A declared translation as a permitted link target, else null: an http(s) URL in its own
 * locale's tree (`/cs/…` for cs), on this site (a migrated EDS variant) or on the live site
 * (the permitted legacy URL).
 * @param {string} code the locale
 * @param {string} href the declared URL
 * @param {string} base the page URL
 * @returns {string|null} the absolute URL
 */
export function permittedTranslation(code, href, base) {
  let url;
  try {
    url = new URL(href, base);
  } catch (e) {
    return null;
  }
  if (!/^https?:$/.test(url.protocol)) return null;
  if (url.pathname.split('/')[1]?.toLowerCase() !== code) return null;
  return [new URL(base).host, LIVE_HOST].includes(url.host) ? url.href : null;
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
 * @param {Map<string, string>} [alternates] from parseAlternates()
 * @returns {HTMLUListElement|null} null when there are no entries
 */
export function buildLocaleList(entries, current, doc, alternates = new Map()) {
  if (!entries.length) return null;
  const base = doc.baseURI;
  const ul = doc.createElement('ul');
  ul.className = 'nav-locales-list';
  ul.setAttribute('aria-label', LABELS.list);
  ul.dataset.linkPolicy = 'resolved';
  entries.forEach(({ code, href }) => {
    const { label, name } = byCode.get(code);
    let item;
    if (code === current) {
      item = doc.createElement('span');
      item.setAttribute('aria-current', 'true');
    } else {
      const translation = alternates.has(code)
        && permittedTranslation(code, alternates.get(code), base);
      if (!translation) return; // no declared translation: omitted, never a locale home
      const elsewhere = isOtherSite(href, base);
      item = doc.createElement('a');
      item.setAttribute('href', elsewhere ? href : translation);
      item.setAttribute('hreflang', code);
      if (elsewhere) {
        item.setAttribute('target', '_blank');
        item.setAttribute('rel', 'noopener');
        item.setAttribute('aria-label', LABELS.newTab(name));
      } else {
        item.setAttribute('aria-label', name);
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
