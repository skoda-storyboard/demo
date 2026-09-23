/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Škoda model-page query-index Metadata block (afterTransform).
 *
 * Appends a single `Metadata` block table carrying EXACTLY the keys defined in
 * docs/planning/SKODA-METADATA-SCHEMA.md that the published query-index reads to
 * drive the Models rails and model listings:
 *   Title, Description, Image, publisheddate, template, model, tags
 *
 * Values are pulled from the document head (og tags / JSON-LD) when present,
 * with the known-correct Elroq values hardcoded as a defensive fallback (this
 * transformer targets the skoda_model CPT / Elroq page). template/model/tags are
 * fixed by the content type and this page's model slug.
 *
 * Runs in afterTransform only (the block is appended output, not something
 * parsers consume). Idempotent: no-op if a Metadata block already exists.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

// Known-correct Elroq values (fallbacks + fixed content-type fields).
const FALLBACK = {
  title: 'Elroq',
  description:
    "Model Description The Elroq is Škoda's first production model to feature the innovative design language it calls Modern Solid. This car …",
  image: 'https://cdn.skoda-storyboard.com/2024/10/hero_car_timiano_ext_front_1f67abb3.png',
  publisheddate: '2024-10-15',
  template: 'skoda_model',
  model: 'elroq',
  tags: 'elroq',
};

function metaContent(document, selector) {
  const el = document.querySelector(selector);
  const val = el && el.getAttribute('content');
  return val && val.trim() ? val.trim() : null;
}

// Pull datePublished from JSON-LD @graph and normalise to YYYY-MM-DD.
function jsonLdPublishedDate(document) {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (const s of scripts) {
    try {
      const data = JSON.parse(s.textContent);
      const graph = data['@graph'] || (Array.isArray(data) ? data : [data]);
      for (const node of graph) {
        if (node && node.datePublished) {
          return String(node.datePublished).slice(0, 10);
        }
      }
    } catch (e) {
      // malformed JSON-LD — ignore, fall through to fallback
    }
  }
  return null;
}

// Detect an already-present Metadata block table (first row cell === 'Metadata').
function hasMetadataBlock(element) {
  const tables = element.querySelectorAll('table');
  for (const t of tables) {
    const firstCell = t.querySelector('tr th, tr td');
    if (firstCell && firstCell.textContent.trim().toLowerCase() === 'metadata') {
      return true;
    }
  }
  return false;
}

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.afterTransform) return;

  // Idempotency: don't duplicate an existing Metadata block.
  if (hasMetadataBlock(element)) return;

  const { document } = payload;

  const title = metaContent(document, 'meta[property="og:title"]') || FALLBACK.title;
  const description =
    metaContent(document, 'meta[property="og:description"]')
    || metaContent(document, 'meta[name="description"]')
    || FALLBACK.description;
  const imageSrc = metaContent(document, 'meta[property="og:image"]') || FALLBACK.image;
  const publisheddate = jsonLdPublishedDate(document) || FALLBACK.publisheddate;

  // Image cell must be an <img> element (not a bare URL) so it round-trips.
  const img = document.createElement('img');
  img.src = imageSrc;

  const meta = {
    Title: title,
    Description: description,
    Image: img,
    publisheddate,               // JSON-LD datePublished → 2024-10-15
    template: FALLBACK.template, // fixed: skoda_model CPT
    model: FALLBACK.model,       // fixed: this page's model slug
    tags: FALLBACK.tags,         // fixed: model-tag rails key
  };

  const block = WebImporter.Blocks.getMetadataBlock(document, meta);
  element.append(block);
}
