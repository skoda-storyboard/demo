/*
 * Language switcher (SKODA-303). Pure: no window, aem.js or fragment import, so node:test can
 * exercise it directly (the DOM comes from the element passed in).
 *
 * Authored in the nav fragment's topbar row as one paragraph, the current locale bold and the
 * rest as links:  **EN** [CZ](/cs/) [DE](/de/) [SK](/sk/) [SR](/sr/) [SL](/sl/)
 * The authored bold only marks a locale; the current one is taken from the page URL, so one
 * fragment serves every locale tree. Source order is kept (the live list is always
 * EN CZ DE SK SR SL; the current locale doesn't move). Each link gets `hreflang` / `lang` and
 * the language's own name as its accessible name; the visible text stays the code.
 *
 * Targets (SKODA-303a, decided 2026-10-08): the authored locale home. The nav fragment's link
 * pass (scripts/links.js) points it at the live site, in the same tab as on the source; only a
 * link to another site (the Media Room DE, skoda-media.de) opens a new tab. The page path isn't
 * kept: live translates its slugs, so per-page targets wait for SKODA-1003.
 *
 * i18n: the list's name lives in LABELS (English, the header's other control text is too;
 * per-locale placeholders are SKODA-1003). The language names are endonyms, locale-neutral.
 */

import { opensInSameTab } from '../../scripts/links.js';

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
 * The target of a locale authored without a link (the bold one): the URL pattern of its
 * siblings with the locale segment swapped (`/cs/media-room` → `/en/media-room`, `/cs` → `/en`),
 * as the source links every locale in the same form. Only site paths are used as the
 * pattern; with none, the locale home `/{code}` (EDS serves the home without a trailing slash).
 * @param {string} code the locale to link
 * @param {Array<{code: string, href: string|null}>} entries the authored entries
 * @returns {string}
 */
export function siblingHref(code, entries) {
  const pattern = entries.find(({ code: c, href }) => href && href.startsWith(`/${c}`)
    && !href.startsWith('//') && /^\/[a-z]{2}(\/|$|[?#])/i.test(href));
  return pattern ? `/${code}${pattern.href.slice(pattern.code.length + 1)}` : `/${code}`;
}

/**
 * A link that opens a new tab: one to another site (the source's Media Room DE goes to
 * skoda-media.de). The live storyboard's locale homes stay in the tab (opensInSameTab).
 */
function opensNewTab(href, doc) {
  try {
    const url = new URL(href, doc.baseURI);
    return /^https?:$/.test(url.protocol) && url.host !== new URL(doc.baseURI).host
      && !opensInSameTab(url.href);
  } catch (e) {
    return false;
  }
}

/**
 * The switcher list: the current locale as `<span aria-current="true">`, every other one as
 * a link with `hreflang` / `lang` and its own language name, to its authored target (a bold
 * entry without a link takes its siblings' pattern, siblingHref).
 * @param {Array<{code: string, href: string|null}>} entries from localeEntries()
 * @param {string} current the page's locale, from currentLocale()
 * @param {Document} doc the document to build in
 * @returns {HTMLUListElement|null} null when there are no entries
 */
export function buildLocaleList(entries, current, doc) {
  if (!entries.length) return null;
  const ul = doc.createElement('ul');
  ul.className = 'nav-locales-list';
  ul.setAttribute('aria-label', LABELS.list);
  entries.forEach(({ code, href }) => {
    const { label, name } = byCode.get(code);
    const li = doc.createElement('li');
    let item;
    if (code === current) {
      item = doc.createElement('span');
      item.setAttribute('aria-current', 'true');
    } else {
      // only a site path or a web URL is a target: a broken authored href (`javascript:`,
      // `//host`, empty) falls back to the siblings' pattern
      const usable = href && /^(?:\/(?!\/)|https?:\/\/)/i.test(href);
      const target = usable ? href : siblingHref(code, entries);
      item = doc.createElement('a');
      item.setAttribute('href', target);
      item.setAttribute('hreflang', code);
      if (opensNewTab(target, doc)) {
        item.setAttribute('target', '_blank');
        item.setAttribute('rel', 'noopener');
        item.setAttribute('aria-label', LABELS.newTab(name));
      } else {
        item.setAttribute('aria-label', name);
      }
    }
    item.setAttribute('lang', code);
    item.textContent = label;
    li.append(item);
    ul.append(li);
  });
  return ul;
}
