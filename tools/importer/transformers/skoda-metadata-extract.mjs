/*
 * skoda-metadata-extract.mjs — PURE, dependency-free metadata-derivation helpers
 * for SKODA-401. No DOM, no WebImporter: takes primitive inputs (strings, arrays
 * of hrefs) and returns derived values, so it is unit-testable with node:test
 * anywhere. The DOM glue lives in skoda-metadata.js (the transformer), which
 * pulls values out of the document and delegates the logic here.
 *
 * Contract (doc-confirmed, aem.live /docs/special-metadata-properties):
 *   `tags` → comma-separated row → AEM renders N <meta property="article:tag">.
 *   The 14 non-tag facets → plain comma-joined <meta name="<facet>">.
 */

// The 15 taxonomy facets (SKODA-METADATA-SCHEMA §"15-facet taxonomy").
export const FACETS = [
  'model', 'bodywork', 'derivative', 'motorsport', 'equipment', 'technology',
  'years', 'view', 'company', 'concept', 'environment', 'happening', 'history',
  'sponsorship', 'vip',
];

// Body-class CPT signal → template enum (SKODA-METADATA-SCHEMA `template`).
// Most-specific first; first match wins.
const TEMPLATE_SIGNALS = [
  [/\bsingle-skoda_model\b|\bskoda_model-template\b/, 'skoda_model'],
  [/\bsingle-skoda_series\b|\bskoda_series-template\b/, 'skoda_series'],
  [/\bsingle-press_release\b|\bpress_release-template\b/, 'press_release'],
  [/\bsingle-press_kit\b|\bpress_kit-template\b/, 'press_kit'],
  [/\bsingle-post\b|\bpost-template\b/, 'story'],
  [/\bpage-template\b|\btemplate-media-room-page\b/, 'page'],
];

/** Normalize any date-ish string to YYYY-MM-DD (or '' if none found). */
export function normalizeDate(value) {
  if (!value) return '';
  const m = String(value).match(/\d{4}-\d{2}-\d{2}/);
  return m ? m[0] : '';
}

/**
 * 4-way publish-date fallback (SKODA-401), given already-extracted candidates
 * in priority order. Returns the first that normalizes to YYYY-MM-DD.
 * @param {{ articlePublishedTime?: string, dataPublishDate?: string,
 *   jsonLdDatePublished?: string, entryPublished?: string }} c
 */
export function pickDate(c = {}) {
  return normalizeDate(c.articlePublishedTime)
    || normalizeDate(c.dataPublishDate)
    || normalizeDate(c.jsonLdDatePublished)
    || normalizeDate(c.entryPublished)
    || '';
}

/** Template enum from a <body> class string. */
export function templateFromBodyClass(bodyClass) {
  const cls = bodyClass || '';
  for (const [re, value] of TEMPLATE_SIGNALS) {
    if (re.test(cls)) return value;
  }
  return '';
}

/** Category = the content-family path segment after the locale. */
export function categoryFromUrl(url) {
  try {
    const segs = new URL(url).pathname.split('/').filter(Boolean);
    if (segs.length >= 2) return segs[1]; // segs[0] = locale
  } catch (e) { /* bad url */ }
  return '';
}

/**
 * Parse one tag href → { taxonomy, slug } or null. Handles both measured shapes:
 *   /en/tag/<taxonomy>/<slug>/                (archive links)
 *   ...?filter[<taxonomy>][]=<slug>           (listing facet links)
 */
export function parseTagHref(href) {
  if (!href) return null;
  let m = href.match(/\/tag\/([a-z0-9-]+)\/([a-z0-9-]+)\/?/i);
  if (m) return { taxonomy: m[1].toLowerCase(), slug: m[2].toLowerCase() };
  m = href.match(/filter\[([a-z0-9-]+)\]\[\]=([^&"]+)/i);
  if (m) {
    const [, taxonomy, raw] = m;
    let slug;
    try { slug = decodeURIComponent(raw); } catch (e) { slug = raw; }
    return { taxonomy: taxonomy.toLowerCase(), slug: slug.toLowerCase() };
  }
  return null;
}

/**
 * Group a list of tag hrefs into { tags:[slug,…], byFacet:{ taxonomy:[slug,…] } },
 * de-duped, order-preserving.
 */
export function groupTags(hrefs = []) {
  const tags = [];
  const byFacet = {};
  const seen = new Set();
  for (const href of hrefs) {
    const parsed = parseTagHref(href);
    if (!parsed) continue;
    const key = `${parsed.taxonomy}:${parsed.slug}`;
    if (seen.has(key)) continue;
    seen.add(key);
    (byFacet[parsed.taxonomy] = byFacet[parsed.taxonomy] || []).push(parsed.slug);
    tags.push(parsed.slug);
  }
  return { tags, byFacet };
}

/** Split a comma list into trimmed non-empty tokens. */
export function splitList(value) {
  return value ? String(value).split(',').map((s) => s.trim()).filter(Boolean) : [];
}

/**
 * Assemble the final Metadata field map (values as strings; Image handled by the
 * DOM adapter). Merges derived tag/facet values with importer overrides.
 * Returns { meta: {key:value,…}, tags:[…] } — `tags` comma-joined in meta.tags.
 */
export function buildMetaFields({
  title = '', description = '', publisheddate = '', template = '', category = '',
  derived = { tags: [], byFacet: {} }, overrides = {},
} = {}) {
  const meta = {};
  if (title) meta.Title = title;
  if (description) meta.Description = description;
  if (publisheddate) meta.publisheddate = publisheddate;
  if (template) meta.template = template;
  if (category) meta.category = category;

  const facetValues = {};
  FACETS.forEach((f) => {
    const merged = [...new Set([...(derived.byFacet[f] || []), ...splitList(overrides[f])])];
    if (merged.length) facetValues[f] = merged.join(', ');
  });

  const allTags = [...new Set([...(derived.tags || []), ...splitList(overrides.tags)])];
  if (allTags.length) meta.tags = allTags.join(', ');
  Object.entries(facetValues).forEach(([f, v]) => { meta[f] = v; });

  return { meta, tags: allTags };
}
