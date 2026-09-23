/*
 * query-index.js — shared, memoized loader for the per-locale query-index
 * (SKODA-401 schema). Reused by index-driven blocks (listing, story-rail,
 * stories, search) so they share ONE fetch + cache per index URL.
 *
 * The query-index is a single JSON with an optional chunking envelope:
 *   { total, offset, limit, data: [ {path,title,...}, ... ] }
 * Large indexes are chunked (offset/limit); this loader pages through all
 * chunks and returns the full concatenated `data` array. A bare array or a
 * `{ data: [...] }` object are both accepted defensively.
 */

const cache = new Map();

/** Derive the locale prefix (`/en`) from the current path, defaulting to /en. */
export function currentLocale(pathname = window.location.pathname) {
  const m = pathname.match(/^\/([a-z]{2})(?:\/|$)/i);
  return m ? m[1].toLowerCase() : 'en';
}

/** The default index URL for the current locale. */
export function defaultIndexUrl() {
  return `/${currentLocale()}/query-index.json`;
}

async function fetchChunk(url, offset) {
  const u = new URL(url, window.location.href);
  if (offset) u.searchParams.set('offset', String(offset));
  const resp = await fetch(u.toString());
  if (!resp.ok) throw new Error(`query-index ${resp.status} for ${u.pathname}`);
  return resp.json();
}

/**
 * Load and memoize a query-index. Returns the full array of row objects.
 * @param {string} [url] index URL (default: `/{locale}/query-index.json`)
 * @param {{ force?: boolean }} [opts] force a re-fetch (bypass cache)
 */
export async function loadQueryIndex(url = defaultIndexUrl(), { force = false } = {}) {
  if (!force && cache.has(url)) return cache.get(url);

  const promise = (async () => {
    const rows = [];
    let offset = 0;
    // Page through chunks until we've read `total` rows (or a non-chunked payload).
    for (;;) {
      // eslint-disable-next-line no-await-in-loop
      const json = await fetchChunk(url, offset);
      if (Array.isArray(json)) { rows.push(...json); break; }
      const data = Array.isArray(json.data) ? json.data : [];
      rows.push(...data);
      const total = Number(json.total);
      const limit = Number(json.limit) || data.length;
      offset += data.length;
      // Stop when the envelope is absent, we've read everything, or a chunk was empty.
      if (!Number.isFinite(total) || offset >= total || data.length === 0 || limit === 0) break;
    }
    return rows;
  })();

  // Cache the promise so concurrent callers share one in-flight fetch; drop it on failure.
  cache.set(url, promise);
  try {
    const rows = await promise;
    cache.set(url, rows);
    return rows;
  } catch (e) {
    cache.delete(url);
    throw e;
  }
}

/** Test/hot-reload helper: clear the memo. */
export function clearQueryIndexCache() {
  cache.clear();
}
