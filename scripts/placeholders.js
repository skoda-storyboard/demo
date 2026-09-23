/*
 * placeholders.js — shared, memoized i18n string loader (SKODA i18n architecture).
 * Reads the per-locale placeholders sheet (`/{locale}/placeholders.json`, the EDS
 * key/value convention) so blocks read UI strings from content instead of hardcoding
 * them — the foundation the localization phase (E10, 6 locales) builds on.
 *
 * Keys are normalized to camelCase (`Load More` → `loadMore`). A missing sheet or a
 * missing key degrades silently to {} / undefined, so callers keep English defaults
 * (`ph.loadMore || 'Load more'`) and the block still works before any sheet exists.
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

/**
 * Fetch and memoize a placeholders map for a locale prefix.
 * @param {string} [prefix] e.g. `/en` (default: current locale)
 * @returns {Promise<Record<string,string>>} camelCase key → text (empty on failure)
 */
export async function fetchPlaceholders(prefix = `/${currentLocale()}`) {
  if (cache.has(prefix)) return cache.get(prefix);

  const promise = (async () => {
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
  })();

  cache.set(prefix, promise);
  const map = await promise;
  cache.set(prefix, map); // replace the in-flight promise with the resolved map
  return map;
}

/** Test/hot-reload helper: clear the memo. */
export function clearPlaceholdersCache() {
  cache.clear();
}
