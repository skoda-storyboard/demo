/*
 * fallback-tags.js — the offline fallback vocabulary for the picker.
 *
 * The live vocabulary is authored by the client in a governed DA Sheet (see TAGS_SHEET
 * in tag-picker.js); the picker fetches it at runtime so tags can be added or renamed
 * with no code change. This list is only the fallback used when that sheet can't be
 * reached (offline / standalone smoke test).
 *
 * Each tag is a { taxonomy, slug, label } triple: `taxonomy` is the facet, `slug` the
 * value within it (together they form the /en/tag/<taxonomy>/<slug>/ archive href,
 * docs/ui-specs/tags.md, SKODA-205), and `label` is the display / pill text.
 *
 * Seeded from the live source site's tag links (skoda-storyboard.com) so it mirrors the
 * real tag tree; note `crew` and `people` are taxonomies the live site carries beyond
 * SKODA-401's 15 facets. The client governs the authoritative list in the DA Sheet.
 */

const FALLBACK_TAGS = [
  { taxonomy: 'model', slug: 'elroq', label: 'Elroq' },
  { taxonomy: 'model', slug: 'enyaq', label: 'Enyaq' },
  { taxonomy: 'model', slug: 'epiq', label: 'Epiq' },
  { taxonomy: 'model', slug: 'fabia', label: 'Fabia' },
  { taxonomy: 'model', slug: 'kamiq', label: 'Kamiq' },
  { taxonomy: 'model', slug: 'karoq', label: 'Karoq' },
  { taxonomy: 'model', slug: 'kodiaq', label: 'Kodiaq' },
  { taxonomy: 'model', slug: 'kushaq', label: 'Kushaq' },
  { taxonomy: 'model', slug: 'kylaq', label: 'Kylaq' },
  { taxonomy: 'model', slug: 'octavia', label: 'Octavia' },
  { taxonomy: 'model', slug: 'peaq', label: 'Peaq' },
  { taxonomy: 'model', slug: 'scala', label: 'Scala' },
  { taxonomy: 'model', slug: 'slavia', label: 'Slavia' },
  { taxonomy: 'model', slug: 'superb', label: 'Superb' },
  { taxonomy: 'derivative', slug: 'sportline', label: 'SportLine' },
  { taxonomy: 'years', slug: '2024', label: '2024' },
  { taxonomy: 'years', slug: '2025', label: '2025' },
  { taxonomy: 'years', slug: '2026', label: '2026' },
  { taxonomy: 'view', slug: 'interior', label: 'interior' },
  { taxonomy: 'company', slug: 'design', label: 'design' },
  { taxonomy: 'company', slug: 'production', label: 'production' },
  { taxonomy: 'environment', slug: 'ecology', label: 'ecology' },
  { taxonomy: 'environment', slug: 'greenfuture', label: 'GreenFuture' },
  { taxonomy: 'environment', slug: 'sustainability', label: 'Sustainability' },
  { taxonomy: 'crew', slug: 'electro-vehicle', label: 'electro vehicle' },
  { taxonomy: 'crew', slug: 'electromobility', label: 'electromobility' },
  { taxonomy: 'crew', slug: 'emobility', label: 'eMobility' },
  { taxonomy: 'crew', slug: 'technology', label: 'Technology' },
  { taxonomy: 'people', slug: 'stefani', label: 'Stefani' },
];

export default FALLBACK_TAGS;
