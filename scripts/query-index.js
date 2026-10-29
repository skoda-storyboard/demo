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

// The source SEO plugin appends the site name to titles ("Elroq - Škoda Storyboard");
// index-driven cards/rails/search show the bare title (SKODA-610). The importer strips it
// too (tools/importer/transformers/skoda-metadata-extract.mjs); this keeps rows that
// haven't been re-imported clean. Keep the regex identical in both places.
export const SITE_SUFFIX = /\s+[-–|]\s+Škoda Storyboard\s*$/;

/** Row title without the site suffix; a title that is only the site name is kept. */
export function cleanTitle(raw) {
  const t = String(raw || '').replace(/\s+/g, ' ').trim();
  return t.replace(SITE_SUFFIX, '').trim() || t;
}

// A chrome fragment (`/cs/nav`, `/cs/media-room/footer`, `/sustainability/nav`) or a shared
// fragment (`/cs/fragments/newsletter-card`) is no content: the locale indexes cover their whole
// tree, so they index the locale's fragments, which search and listings must never show
// (SKODA-1001 QA: "Stories" → /cs/nav). The English ones sit outside /en/**.
const CHROME_FRAGMENT = new RegExp([
  '^/(?:[a-z]{2}/)?(?:(?:media-room|sustainability)/)?(?:nav|footer)/?$', // nav / footer
  '/fragments/', // shared fragments
].join('|'), 'i');

/** Is this index path a chrome or shared fragment, not a page? */
export function isChromeFragment(path) {
  return CHROME_FRAGMENT.test(String(path || ''));
}

const isPage = (row) => !(row && typeof row === 'object' && isChromeFragment(row.path));

/** Normalise one index row for display (currently: the title). */
export function normalizeRow(row) {
  if (!row || typeof row !== 'object' || typeof row.title !== 'string') return row;
  const title = cleanTitle(row.title);
  return title === row.title ? row : { ...row, title };
}

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
      if (Array.isArray(json)) { rows.push(...json.filter(isPage).map(normalizeRow)); break; }
      const data = Array.isArray(json.data) ? json.data : [];
      rows.push(...data.filter(isPage).map(normalizeRow));
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
