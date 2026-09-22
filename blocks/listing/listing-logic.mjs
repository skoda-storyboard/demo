/*
 * listing-logic.mjs — PURE, dependency-free logic for the faceted listing
 * (SKODA-402). No DOM, no fetch: filter across facets + template, sort, paginate,
 * derive facet values, and encode/decode the deep-link URL state. Unit-tested by
 * listing-logic.test.mjs; the DOM/decorate glue lives in listing.js.
 *
 * A "row" is a query-index entry: { path, title, description, image, template,
 * date, tags, model, bodywork, … } — facet columns are comma-joined strings
 * (SKODA-401 contract), so a row "matches" a facet value if the value is one of
 * its comma-split tokens.
 */

/** Split a comma-joined facet cell into trimmed lowercase tokens. */
export function facetTokens(value) {
  return String(value || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

/** Scope rows to a template and/or path prefix (the block's fixed filter). */
export function scopeRows(rows, { template = '', path = '' } = {}) {
  return rows.filter((r) => {
    if (template && String(r.template || '').toLowerCase() !== template.toLowerCase()) return false;
    if (path && !String(r.path || '').startsWith(path)) return false;
    return true;
  });
}

/**
 * Filter rows by the active facet selection.
 * @param {object[]} rows scoped rows
 * @param {Record<string,string[]>} active facetKey → [selected value tokens]
 *   Within one facet: OR (row matches if it has ANY selected value).
 *   Across facets: AND (row must match every facet that has a selection).
 */
export function filterRows(rows, active = {}) {
  const facets = Object.entries(active).filter(([, vals]) => vals && vals.length);
  if (!facets.length) return rows.slice();
  return rows.filter((row) => facets.every(([key, vals]) => {
    const tokens = facetTokens(row[key]).map((t) => t.toLowerCase());
    return vals.some((v) => tokens.includes(String(v).toLowerCase()));
  }));
}

/** Sort by date (default) — 'newest' desc, 'oldest' asc. Stable, non-mutating. */
export function sortRows(rows, sort = 'newest') {
  const dir = sort === 'oldest' ? 1 : -1;
  const key = (r) => {
    const d = Date.parse(r.date || r.publisheddate || '');
    return Number.isNaN(d) ? 0 : d;
  };
  return rows
    .map((r, i) => [r, i])
    .sort((a, b) => (key(a[0]) - key(b[0])) * dir || (a[1] - b[1]))
    .map(([r]) => r);
}

/** First `count` rows (the currently-revealed slice for load-more paging). */
export function paginate(rows, count) {
  return rows.slice(0, Math.max(0, count));
}

/**
 * Distinct values for a facet across rows, in first-seen order (for pill panels).
 * @returns {{ value:string, count:number }[]} value + how many rows carry it
 */
export function distinctFacetValues(rows, key) {
  const counts = new Map();
  rows.forEach((row) => facetTokens(row[key]).forEach((tok) => {
    counts.set(tok, (counts.get(tok) || 0) + 1);
  }));
  return [...counts.entries()].map(([value, count]) => ({ value, count }));
}

// --- deep-link URL state ---------------------------------------------------
// URL scheme MATCHES THE SOURCE (verified live on /en/news/) so migrated deep
// links keep working with no redirects:
//   facets → `filter[<facet>][]=<value>` (repeated, array-style, one per value)
//   sort   → `sortby=oldest` (omitted when 'newest')
//   offset → `offset=<revealed>` (the load-more count the source pushState's;
//            omitted when === perpage, i.e. first page)
// Unrelated params (utm_*, analytics, a second listing's params) are PRESERVED.
// `filter[search]` (source free-text) is intentionally not handled (no full-text).

const facetParam = (key) => `filter[${key}][]`;

/**
 * Decode listing state from a URLSearchParams (or query string).
 * @param {URLSearchParams|string} search
 * @param {string[]} facetKeys the block's configured facet keys
 * @param {number} perpage
 */
export function decodeState(search, facetKeys, perpage = 6) {
  const params = typeof search === 'string' ? new URLSearchParams(search) : search;
  const active = {};
  facetKeys.forEach((key) => {
    // Array-style: filter[model][]=elroq&filter[model][]=octavia. Also accept a
    // single comma-joined value for convenience (filter[model][]=a,b).
    const vals = params.getAll(facetParam(key))
      .flatMap((v) => v.split(','))
      .map((s) => s.trim())
      .filter(Boolean);
    if (vals.length) active[key] = [...new Set(vals)];
  });
  const sort = params.get('sortby') === 'oldest' ? 'oldest' : 'newest';
  const off = Number(params.get('offset'));
  const revealed = Number.isFinite(off) && off > perpage ? off : perpage;
  return { active, sort, revealed };
}

/**
 * Encode listing state into a query string (no leading '?'), PRESERVING any
 * params already present in `base` that aren't ours. Pass the current
 * `window.location.search` as `base` so utm/tracking/other-block params
 * survive a facet change. Only our keys are cleared + re-set.
 * @param {{active?:object, sort?:string, revealed?:number}} state
 * @param {number} perpage
 * @param {URLSearchParams|string} [base] existing params to preserve
 * @param {string[]} [facetKeys] our facet keys (needed to know what to clear)
 */
export function encodeState({ active = {}, sort = 'newest', revealed } = {}, perpage = 6, base = '', facetKeys = null) {
  const params = new URLSearchParams(typeof base === 'string' ? base : base.toString());
  const keys = facetKeys || Object.keys(active);

  // Clear OUR keys only (leave everything else untouched).
  keys.forEach((key) => params.delete(facetParam(key)));
  params.delete('sortby');
  params.delete('offset');

  // Re-write our state (array-style facet params, matching the source).
  Object.entries(active).forEach(([key, vals]) => {
    (vals || []).forEach((v) => params.append(facetParam(key), v));
  });
  if (sort === 'oldest') params.set('sortby', 'oldest');
  if (revealed && revealed !== perpage) params.set('offset', String(revealed));

  // URLSearchParams encodes `[` `]` as %5B/%5D; decode those back for readable,
  // source-matching URLs (filter[model][] not filter%5Bmodel%5D%5B%5D).
  return params.toString().replace(/%5B/gi, '[').replace(/%5D/gi, ']');
}

/** Count of selected values in a facet (for the pill count badge). */
export function selectedCount(active, key) {
  return (active[key] || []).length;
}
