/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: SHARED generic query-index Metadata block (afterTransform).
 * SKODA-401 — content-type-agnostic metadata extraction + normalization.
 *
 * Replaces per-page hardcoded metadata transformers (e.g. the Elroq-specific
 * skoda-model-metadata.js) with ONE extractor that derives, from ANY source page,
 * the fields the published query-index + the tags block read:
 *   Title, Description, Image, publisheddate, template, category, tags + 15 facets.
 *
 * ⚠️ SELF-CONTAINED ON PURPOSE. This transformer is loaded standalone by the
 * per-save transformer-validator (no module resolution) AND inlined by the import
 * bundler — it must NOT import sibling modules. The derivation RULES here are
 * mirrored, 1:1, by the pure/dependency-free skoda-metadata-extract.mjs, which is
 * unit-tested (skoda-metadata-extract.test.mjs). KEEP THE TWO IN SYNC: change a
 * rule here → change it there → run `node --test …/skoda-metadata-extract.test.mjs`.
 *
 * Contract (doc-confirmed, aem.live /docs/special-metadata-properties):
 *   `tags` → ONE comma-separated Metadata row → AEM renders N
 *   <meta property="article:tag"> (read by query-index + tags-block fallback).
 *   The 14 non-tag facets → plain comma-joined <meta name="<facet>">.
 *
 * Config-over-hardcode: an importer may pass overrides via
 * payload.template.metadata (e.g. { template:'skoda_model', model:'elroq' }) for
 * CPT-fixed / source-absent fields; derivation fills the rest.
 * Idempotent: no-op if a Metadata block already exists.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

// The 15 taxonomy facets (SKODA-METADATA-SCHEMA §"15-facet taxonomy").
const FACETS = [
  'model', 'bodywork', 'derivative', 'motorsport', 'equipment', 'technology',
  'years', 'view', 'company', 'concept', 'environment', 'happening', 'history',
  'sponsorship', 'vip',
];

// Body-class CPT signal → template enum. Most-specific first; first match wins.
const TEMPLATE_SIGNALS = [
  [/\bsingle-skoda_model\b|\bskoda_model-template\b/, 'skoda_model'],
  [/\bsingle-skoda_series\b|\bskoda_series-template\b/, 'skoda_series'],
  [/\bsingle-press_release\b|\bpress_release-template\b/, 'press_release'],
  [/\bsingle-press_kit\b|\bpress_kit-template\b/, 'press_kit'],
  [/\bsingle-post\b|\bpost-template\b/, 'story'],
  // Škodapedia archive + branded 404 aren't rail CPTs and aren't in the template
  // enum — map them to the valid `page` value (nav/direct only, not rail-indexed).
  [/\bpost-type-archive-skodapedia\b/, 'page'],
  [/\berror404\b/, 'page'],
  [/\bpage-template\b|\btemplate-media-room-page\b/, 'page'],
];

function metaContent(document, selector) {
  const el = document.querySelector(selector);
  const val = el && el.getAttribute('content');
  return val && val.trim() ? val.trim() : null;
}

function normalizeDate(value) {
  if (!value) return '';
  const m = String(value).match(/\d{4}-\d{2}-\d{2}/);
  return m ? m[0] : '';
}

/** Publish date: 4-way fallback (SKODA-401), normalized to YYYY-MM-DD. */
function extractDate(document) {
  const meta = metaContent(document, 'meta[property="article:published_time"]');
  if (normalizeDate(meta)) return normalizeDate(meta);

  const attrEl = document.querySelector('[data-publish-date]');
  const attr = attrEl && attrEl.getAttribute('data-publish-date');
  if (normalizeDate(attr)) return normalizeDate(attr);

  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (const s of scripts) {
    try {
      const data = JSON.parse(s.textContent);
      const graph = data['@graph'] || (Array.isArray(data) ? data : [data]);
      for (const node of graph) {
        if (node && node.datePublished) {
          const d = normalizeDate(node.datePublished);
          if (d) return d;
        }
      }
    } catch (e) { /* malformed JSON-LD — skip */ }
  }

  const span = document.querySelector('.entry-published, time[datetime]');
  if (span) {
    const d = normalizeDate(span.getAttribute('datetime') || span.textContent);
    if (d) return d;
  }

  // Last resort: article:modified_time (<head> meta, survives cleanup). Some CPT
  // pages (series hub) expose no published_time that outlives grid removal; a valid
  // ISO modified date beats an empty publisheddate. Mirror in skoda-metadata-extract.mjs.
  const modified = metaContent(document, 'meta[property="article:modified_time"]');
  if (normalizeDate(modified)) return normalizeDate(modified);

  return '';
}

/** Template from the <body> class CPT signal. */
function extractTemplate(document) {
  const cls = (document.body && document.body.getAttribute('class')) || '';
  for (const [re, value] of TEMPLATE_SIGNALS) {
    if (re.test(cls)) return value;
  }
  return '';
}

/**
 * Category = the content-family slug. Normally the segment after the locale, but
 * archive URLs nest the real slug behind a routing prefix (returning segs[1] would
 * emit the literal `category`/`tag` prefix — not a valid slug). Keep in sync with
 * skoda-metadata-extract.mjs::categoryFromUrl.
 *   /en/category/<slug>/          → <slug>            (segs[2])
 *   /en/tag/<taxonomy>/<slug>/    → <slug> (the term) (last segment)
 */
function extractCategory(url) {
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
 * Tags + per-facet values from the entry-tags row links. Handles both measured
 * href shapes (docs/ui-specs/tags.md):
 *   /en/tag/<taxonomy>/<slug>/                 (story archive links)
 *   ...?filter[<taxonomy>][]=<slug>            (press-release facet links)
 * Returns { tags:[slug,…], byFacet:{ taxonomy:[slug,…] } }, de-duped.
 */
function extractTagsAndFacets(document) {
  const tags = [];
  const byFacet = {};
  const seen = new Set();
  const add = (taxonomy, slug) => {
    if (!taxonomy || !slug) return;
    const key = `${taxonomy}:${slug}`;
    if (seen.has(key)) return;
    seen.add(key);
    (byFacet[taxonomy] = byFacet[taxonomy] || []).push(slug);
    tags.push(slug);
  };

  const scopes = document.querySelectorAll('ol.entry-tags, ul.entry-tags, .entry-tags, .tag-list');
  const roots = scopes.length ? scopes : [document];
  for (const root of roots) {
    root.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href') || '';
      let m = href.match(/\/tag\/([a-z0-9-]+)\/([a-z0-9-]+)\/?/i);
      if (m) { add(m[1].toLowerCase(), m[2].toLowerCase()); return; }
      // filter[<tax>][]=<slug> with brackets literal OR percent-encoded (%5B/%5D).
      // Press-release tag links use the encoded form; keep this in sync with
      // skoda-metadata-extract.mjs::parseTagHref (mirrored 1:1).
      m = href.match(/filter(?:\[|%5B)([a-z0-9-]+)(?:\]|%5D)(?:\[\]|%5B%5D)=([^&"]+)/i);
      if (m) {
        let slug;
        try { slug = decodeURIComponent(m[2]); } catch (e) { slug = m[2]; }
        add(m[1].toLowerCase(), slug.toLowerCase());
      }
    });
  }

  // Fallback: tag/model ARCHIVE pages carry their taxonomy ONLY in the <body>
  // class (`tax-model term-elroq`), with no entry-tags anchors. Derive the facet
  // from there so a model-tag listing self-classifies. Keep in sync with
  // skoda-metadata-extract.mjs::facetFromBodyClass.
  if (tags.length === 0) {
    const cls = (document.body && document.body.getAttribute('class')) || '';
    const tax = cls.match(/\btax-([a-z0-9_-]+)\b/i);
    const term = cls.match(/\bterm-([a-z0-9-]+)\b/i);
    if (tax && term) {
      const taxonomy = tax[1].toLowerCase().replace(/_/g, '-');
      const slug = term[1].toLowerCase();
      if (FACETS.includes(taxonomy) && slug && !/^\d+$/.test(slug)) add(taxonomy, slug);
    }
  }

  // Fallback: a series-hub (single-skoda_series) has no entry-tags in the body that
  // survives grid removal. Its own series slug is the tag that feeds the Series rail
  // — derive it from the canonical path (/en/series/<slug>/), mirroring how a model
  // page carries its own model slug as a tag. Content-driven, not positional.
  if (tags.length === 0) {
    const cls = (document.body && document.body.getAttribute('class')) || '';
    if (/\bsingle-skoda_series\b|\bskoda_series-template\b/.test(cls)) {
      const canonical = document.querySelector('link[rel="canonical"]');
      const href = (canonical && canonical.getAttribute('href')) || '';
      const m = href.match(/\/series\/([a-z0-9-]+)\/?/i);
      if (m) add('series', m[1].toLowerCase());
    }
  }
  return { tags, byFacet };
}

function splitList(value) {
  return value ? String(value).split(',').map((s) => s.trim()).filter(Boolean) : [];
}

function hasMetadataBlock(element) {
  const tables = element.querySelectorAll('table');
  for (const t of tables) {
    const firstCell = t.querySelector('tr th, tr td');
    if (firstCell && firstCell.textContent.trim().toLowerCase() === 'metadata') return true;
  }
  return false;
}

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.afterTransform) return;
  if (hasMetadataBlock(element)) return;

  const { document, url, params } = payload;
  const canonical = document.querySelector('link[rel="canonical"]');
  const pageUrl = (params && params.originalURL) || url || (canonical && canonical.href) || '';
  const overrides = (payload.template && payload.template.metadata) || {};

  const title = overrides.title
    || metaContent(document, 'meta[property="og:title"]')
    || (document.querySelector('title') ? document.querySelector('title').textContent.trim() : '');
  const description = overrides.description
    || metaContent(document, 'meta[property="og:description"]')
    || metaContent(document, 'meta[name="description"]') || '';
  const imageSrc = overrides.image || metaContent(document, 'meta[property="og:image"]') || '';
  const publisheddate = overrides.publisheddate || extractDate(document);
  const template = overrides.template || extractTemplate(document);
  const category = overrides.category || extractCategory(pageUrl);
  const { tags: derivedTags, byFacet } = extractTagsAndFacets(document);

  const meta = {};
  if (title) meta.Title = title;
  if (description) meta.Description = description;
  if (imageSrc) {
    const img = document.createElement('img');
    img.src = imageSrc;
    meta.Image = img;
  }
  if (publisheddate) meta.publisheddate = publisheddate;
  if (template) meta.template = template;
  if (category) meta.category = category;

  // tags = derived ∪ override (comma-joined → AEM splits into article:tag metas).
  const allTags = [...new Set([...derivedTags, ...splitList(overrides.tags)])];
  if (allTags.length) meta.tags = allTags.join(', ');

  // 14 non-tag facets: derived ∪ override, comma-joined → <meta name="<facet>">.
  FACETS.forEach((f) => {
    const merged = [...new Set([...(byFacet[f] || []), ...splitList(overrides[f])])];
    if (merged.length) meta[f] = merged.join(', ');
  });

  const block = WebImporter.Blocks.getMetadataBlock(document, meta);
  element.append(block);
}
