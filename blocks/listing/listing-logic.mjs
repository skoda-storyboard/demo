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
// Encoding: each facet with a selection → `?<facet>=v1,v2`; sort → `?sortby=oldest`
// (omitted when 'newest'); revealed count → `?n=12` (omitted when === perpage).

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
    const raw = params.get(key);
    const vals = raw ? raw.split(',').map((s) => s.trim()).filter(Boolean) : [];
    if (vals.length) active[key] = vals;
  });
  const sort = params.get('sortby') === 'oldest' ? 'oldest' : 'newest';
  const n = Number(params.get('n'));
  const revealed = Number.isFinite(n) && n > 0 ? n : perpage;
  return { active, sort, revealed };
}

/**
 * Encode listing state back to a query string (no leading '?').
 * Only non-default values are written, so a pristine listing has a clean URL.
 */
export function encodeState({ active = {}, sort = 'newest', revealed } = {}, perpage = 6) {
  const params = new URLSearchParams();
  Object.entries(active).forEach(([key, vals]) => {
    if (vals && vals.length) params.set(key, vals.join(','));
  });
  if (sort === 'oldest') params.set('sortby', 'oldest');
  if (revealed && revealed !== perpage) params.set('n', String(revealed));
  return params.toString();
}

/** Count of selected values in a facet (for the pill count badge). */
export function selectedCount(active, key) {
  return (active[key] || []).length;
}
