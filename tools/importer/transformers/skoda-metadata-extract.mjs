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
  // Škodapedia archive + branded 404: not rail CPTs, not in the enum → `page`.
  [/\bpost-type-archive-skodapedia\b/, 'page'],
  [/\berror404\b/, 'page'],
  [/\bpage-template\b|\btemplate-media-room-page\b/, 'page'],
];

// The source SEO plugin appends the site name to every og:title / <title>
// ("Elroq - Škoda Storyboard"). Index rows + cards show the bare title (SKODA-610).
// Mirrored inline in skoda-metadata.js and scripts/query-index.js — keep in sync.
export const SITE_SUFFIX = /\s+[-–|]\s+Škoda Storyboard\s*$/;

/**
 * Clean a page title: collapse whitespace (incl. nbsp) and strip ONE trailing site
 * suffix. A title that is only the site name (the home page) is kept as is.
 */
export function cleanTitle(raw) {
  const t = String(raw || '').replace(/\s+/g, ' ').trim();
  return t.replace(SITE_SUFFIX, '').trim() || t;
}

/** Normalize any date-ish string to YYYY-MM-DD (or '' if none found). */
export function normalizeDate(value) {
  if (!value) return '';
  const m = String(value).match(/\d{4}-\d{2}-\d{2}/);
  return m ? m[0] : '';
}

/**
 * Publish-date fallback (SKODA-401), given already-extracted candidates in
 * priority order. Returns the first that normalizes to YYYY-MM-DD. `articleModified`
 * is the last resort — some CPT pages (e.g. the series hub) expose no published_time
 * in the body/head that survives cleanup, only `article:modified_time` in <head> —
 * a stale-but-valid ISO date beats an empty publisheddate (which fails the gate).
 * @param {{ articlePublishedTime?: string, dataPublishDate?: string,
 *   jsonLdDatePublished?: string, entryPublished?: string, articleModified?: string }} c
 */
export function pickDate(c = {}) {
  return normalizeDate(c.articlePublishedTime)
    || normalizeDate(c.dataPublishDate)
    || normalizeDate(c.jsonLdDatePublished)
    || normalizeDate(c.entryPublished)
    || normalizeDate(c.articleModified)
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

/**
 * Category = the content-family slug. Normally the path segment after the locale
 * (`/en/press-releases/…` → `press-releases`), but archive URLs nest the real
 * slug one level deeper behind a routing prefix, so returning segs[1] verbatim
 * would emit the literal prefix (`category` / `tag`) — not a valid category slug:
 *   /en/category/<slug>/          → <slug>            (segs[2])
 *   /en/tag/<taxonomy>/<slug>/    → <slug> (the term) (last segment)
 */
export function categoryFromUrl(url) {
  try {
    const segs = new URL(url).pathname.split('/').filter(Boolean); // segs[0] = locale
    if (segs.length < 2) return '';
    if (segs[1] === 'category') return segs[2] || '';
    if (segs[1] === 'tag') return segs[segs.length - 1] || '';
    return segs[1];
  } catch (e) { /* bad url */ }
  return '';
}

/**
 * Parse one tag href → { taxonomy, slug } or null. Handles both measured shapes,
 * each in raw OR percent-encoded bracket form:
 *   /en/tag/<taxonomy>/<slug>/                       (archive links)
 *   ...?filter[<taxonomy>][]=<slug>                   (listing facet links, raw)
 *   ...?filter%5B<taxonomy>%5D%5B%5D=<slug>           (listing facet links, encoded)
 * Press-release tag links use the ENCODED form; the model page used /tag/ links —
 * both must resolve, or a page's tags silently vanish from the query-index.
 */
export function parseTagHref(href) {
  if (!href) return null;
  let m = href.match(/\/tag\/([a-z0-9-]+)\/([a-z0-9-]+)\/?/i);
  if (m) return { taxonomy: m[1].toLowerCase(), slug: m[2].toLowerCase() };
  // Match filter[<tax>][]=<slug> with '[' / ']' either literal or %5B / %5D.
  m = href.match(/filter(?:\[|%5B)([a-z0-9-]+)(?:\]|%5D)(?:\[\]|%5B%5D)=([^&"]+)/i);
  if (m) {
    const [, taxonomy, raw] = m;
    let slug;
    try { slug = decodeURIComponent(raw); } catch (e) { slug = raw; }
    return { taxonomy: taxonomy.toLowerCase(), slug: slug.toLowerCase() };
  }
  return null;
}

/**
 * Derive a taxonomy facet from a WordPress archive <body> class. Tag/model archive
 * pages (e.g. /en/tag/model/elroq/) carry their taxonomy ONLY in the body class as
 * `tax-<taxonomy> term-<slug>` (there are no entry-tags anchors to parse), so a
 * model-tag listing would otherwise index with an empty `model` facet and never
 * feed its model rail. Returns { taxonomy, slug } or null; only recognises the
 * `tax-…`/`term-…` pair and maps it to a known facet name.
 */
export function facetFromBodyClass(bodyClass) {
  const cls = bodyClass || '';
  const tax = cls.match(/\btax-([a-z0-9_-]+)\b/i);
  const term = cls.match(/\bterm-([a-z0-9-]+)\b/i); // first term-<slug>, not term-<numericId>
  if (!tax || !term) return null;
  // WP taxonomy slug → our facet key (only map ones in the 15-facet set).
  const taxonomy = tax[1].toLowerCase().replace(/_/g, '-');
  const facet = FACETS.includes(taxonomy) ? taxonomy : null;
  const slug = term[1].toLowerCase();
  if (!facet || !slug || /^\d+$/.test(slug)) return null;
  return { taxonomy: facet, slug };
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
  if (cleanTitle(title)) meta.Title = cleanTitle(title);
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
