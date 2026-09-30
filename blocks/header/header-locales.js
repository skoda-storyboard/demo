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
 * i18n: the list's name lives in LABELS (English, the header's other control text is too;
 * per-locale placeholders are SKODA-1003). The language names are endonyms, locale-neutral.
 */

const LABELS = {
  list: 'Language',
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
 * The switcher list: the current locale as `<span aria-current="true">`, every other one as
 * a link with `hreflang` / `lang` and its own language name. An entry authored without a link
 * (the bold one) links its locale home, `/{code}` (as `/en`).
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
      item = doc.createElement('a');
      item.setAttribute('href', href || `/${code}`);
      item.setAttribute('hreflang', code);
      item.setAttribute('aria-label', name);
    }
    item.setAttribute('lang', code);
    item.textContent = label;
    li.append(item);
    ul.append(li);
  });
  return ul;
}
