/*
 * placeholders.js — shared, memoized i18n string loader (SKODA i18n architecture).
 * Reads the per-locale placeholders sheet (`/{locale}/placeholders.json`, the EDS
 * key/value convention) so blocks read UI strings from content instead of hardcoding
 * them — the foundation the localization phase (E10, 6 locales) builds on.
 *
 * Keys are normalized to camelCase (`Load More` → `loadMore`). A missing sheet or a
 * missing key degrades silently to {} / undefined, so callers keep English defaults
 * and the block still works before any sheet exists.
 *
 * A module's UI text (SKODA-1003): an object of English defaults, its keys read from the sheet
 * under the module's prefix (`localize(LABELS, ph, 'gallery')` reads `galleryPrevious` for
 * `previous`). Those objects are the English master list: tools/i18n/ui-text.mjs collects them,
 * writes the English sheet and checks every locale's sheet for missing keys.
 */

import { currentLocale } from './query-index.js';

const cache = new Map();

/** Normalize a sheet Key ("Load More", "no_results") to a camelCase lookup token. */
function toKey(s) {
  return String(s || '')
    .trim()
    .replace(/[^a-zA-Z0-9]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^([A-Z])/, (m) => m.toLowerCase());
}

// How long a caller waits for the sheet (SKODA-1003): a stalled request must not hold a block,
// and with it every section after it, so past this the caller builds in English. The sheet
// still fills the memo when it arrives, for every later reader.
export const SHEET_WAIT_MS = 3000;

async function loadSheet(prefix) {
  try {
    const resp = await fetch(`${prefix}/placeholders.json`);
    if (!resp.ok) return {};
    const json = await resp.json();
    const rows = Array.isArray(json) ? json : (json.data || []);
    const map = {};
    rows.forEach((row) => {
      if (row && row.Key) map[toKey(row.Key)] = row.Text ?? row.Value ?? '';
    });
    return map;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(`placeholders: load failed for ${prefix}`, e);
    return {};
  }
}

/**
 * Fetch and memoize a placeholders map for a locale prefix.
 * @param {string} [prefix] e.g. `/en` (default: current locale)
 * @returns {Promise<Record<string,string>>} camelCase key → text (empty on failure, or after
 *   SHEET_WAIT_MS while the request is still open)
 */
export async function fetchPlaceholders(prefix = `/${currentLocale()}`) {
  const known = cache.get(prefix);
  if (known && typeof known.then !== 'function') return known;
  let request = known;
  if (!request) {
    request = loadSheet(prefix);
    cache.set(prefix, request);
    // replace the in-flight promise with the resolved map
    request.then((map) => cache.set(prefix, map));
  }
  let timer;
  const late = new Promise((resolve) => {
    timer = setTimeout(() => {
      // eslint-disable-next-line no-console
      console.warn(`placeholders: ${prefix} took over ${SHEET_WAIT_MS}ms, English for now`);
      resolve({});
    }, SHEET_WAIT_MS);
  });
  try {
    return await Promise.race([request, late]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Replace `{name}` tokens; unknown tokens stay as they are. The same rule as media-cart-limits.js
 * `format`, which must import nothing (its eager-path test), so it keeps its own copy.
 */
export const fillText = (text, values = {}) => String(text)
  .replace(/\{(\w+)\}/g, (m, name) => (Object.hasOwn(values, name) ? String(values[name]) : m));

/**
 * The sheet key of a module label: the prefix and the key in camelCase (`gallery` + `previous` →
 * `galleryPrevious`), or the key itself without a prefix.
 * @param {string} prefix the module's prefix ('' for shared keys such as `loadMore`)
 * @param {string} key the label key
 */
export function sheetKey(prefix, key) {
  return prefix ? `${prefix}${key[0].toUpperCase()}${key.slice(1)}` : key;
}

/**
 * A module's labels in the page's locale: each English default replaced by its sheet text
 * (`sheetKey(prefix, key)`) when that is a non-empty string. The defaults are not changed.
 * @template {Record<string,string>} T
 * @param {T} defaults the module's English labels
 * @param {Record<string,string>} [ph] from fetchPlaceholders()
 * @param {string} [prefix] the module's sheet-key prefix
 * @returns {T}
 */
export function localize(defaults, ph = {}, prefix = '') {
  const own = (key) => {
    const value = ph ? ph[sheetKey(prefix, key)] : undefined;
    return typeof value === 'string' && value.trim() ? value : '';
  };
  const plural = /(Zero|One|Two|Few|Many)$/;
  const out = Object.fromEntries(Object.entries(defaults).map(([key, text]) => {
    const base = key.replace(plural, '');
    const counted = base !== key && Object.hasOwn(defaults, base);
    // a plural form follows its general text: an English general text keeps the English forms,
    // so a sheet with `…One` / `…Few` rows but no general row never mixes languages
    if (counted && !own(base)) return [key, text];
    if (own(key)) return [key, own(key)];
    // a plural form the sheet lacks while it translates the general text: empty, so
    // pluralText uses the translation, never the English form
    return [key, counted ? '' : text];
  }));
  // the locale's other plural forms of a translated counted text (English has `…One`; Czech
  // adds `…Few`)
  Object.keys(defaults).filter((key) => key.endsWith('One')).forEach((one) => {
    const base = one.slice(0, -3);
    if (!Object.hasOwn(defaults, base) || !own(base)) return;
    ['Zero', 'Two', 'Few', 'Many'].forEach((form) => {
      if (own(`${base}${form}`)) out[`${base}${form}`] = own(`${base}${form}`);
    });
  });
  return out;
}

/**
 * For a synchronous builder whose text is only names and tooltips (no visible words): apply
 * the English labels now, then the page locale's when the memoized sheet resolves.
 * @template {Record<string,string>} T
 * @param {T} defaults the module's English labels
 * @param {string} prefix the module's sheet-key prefix
 * @param {(labels: T) => void} apply sets the labels on the module's elements
 * @returns {Promise<void>} settles once the locale's labels are applied (or the sheet failed)
 */
export function applyLocalized(defaults, prefix, apply) {
  apply(localize(defaults, {}, prefix));
  return fetchPlaceholders()
    .then((ph) => apply(localize(defaults, ph, prefix)))
    .catch((e) => {
      // the English labels stay
      // eslint-disable-next-line no-console
      console.warn(`placeholders: ${prefix || 'shared'} labels not applied`, e);
    });
}

/**
 * A date in a sheet pattern (SKODA-1003: the date format is per locale, `dateFormat`): `{d}` /
 * `{m}` the day / month, `{dd}` / `{mm}` zero-padded, `{yyyy}` the year, in UTC (the index's ISO
 * dates are days). '' for an unparseable date.
 * @param {string|number|Date} value an ISO date or a timestamp
 * @param {string} pattern e.g. `{d}. {m}. {yyyy}`
 */
export function formatDate(value, pattern) {
  let t = Date.parse(value);
  if (value instanceof Date || typeof value === 'number') t = new Date(value).getTime();
  if (!Number.isFinite(t)) return '';
  const d = new Date(t);
  const pad = (n) => String(n).padStart(2, '0');
  return fillText(pattern, {
    d: d.getUTCDate(),
    dd: pad(d.getUTCDate()),
    m: d.getUTCMonth() + 1,
    mm: pad(d.getUTCMonth() + 1),
    yyyy: d.getUTCFullYear(),
  });
}

const PLURAL_SUFFIX = {
  zero: 'Zero', one: 'One', two: 'Two', few: 'Few', many: 'Many',
};

/**
 * A counted text in the locale's plural form (Czech, Slovak and Serbian have three): the
 * label `{base}{One|Few|Many|…}` for the count's CLDR category when the labels have it, else
 * `{base}`, with `{n}` and the other values filled in.
 * @param {Record<string,string>} labels localized labels (`moreLabel`, `moreLabelOne`, …)
 * @param {string} base the label key for the general form
 * @param {number} n the count
 * @param {Record<string,string|number>} [values] other tokens
 * @param {string} [locale] a BCP 47 code (default: the page's)
 */
export function pluralText(labels, base, n, values = {}, locale = currentLocale()) {
  let category = 'other';
  try {
    category = new Intl.PluralRules(locale).select(n);
  } catch (e) {
    // an unknown locale: the general form
  }
  const own = PLURAL_SUFFIX[category] && labels[`${base}${PLURAL_SUFFIX[category]}`];
  return fillText(own || labels[base], { ...values, n });
}

/**
 * The placeholders map if it has already loaded (it starts with the page), else {}: for a
 * synchronous builder whose text is a fallback under authored text, or shown later (an error
 * message). Never waits and never fetches.
 * @param {string} [prefix] e.g. `/cs` (default: current locale)
 * @returns {Record<string,string>}
 */
export function placeholdersNow(prefix) {
  let key = prefix;
  if (key === undefined) {
    // no page (a test, a worker): nothing has loaded
    if (typeof window === 'undefined' || !window.location) return {};
    key = `/${currentLocale()}`;
  }
  const map = cache.get(key);
  return map && typeof map.then !== 'function' ? map : {};
}

/** Test/hot-reload helper: clear the memo. */
export function clearPlaceholdersCache() {
  cache.clear();
}
