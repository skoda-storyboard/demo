/*
 * fallback-tags.js — the offline fallback vocabulary for the picker.
 *
 * The live vocabulary is authored by the client in a governed DA Sheet (see TAGS_SHEET
 * in tag-picker.js); the picker fetches it at runtime so tags can be added or renamed
 * with no code change. This list is only the fallback used when that sheet can't be
 * reached (offline / standalone smoke test), so it stays small and representative.
 *
 * Each tag is a { taxonomy, slug, label } triple:
 *   - `taxonomy` is one of the 15 facets (SKODA-401): model, bodywork, derivative,
 *     motorsport, equipment, technology, years, view, company, concept, environment,
 *     happening, history, sponsorship, vip.
 *   - `slug` is the value within that facet; together they form the tag-archive href
 *     /en/tag/<taxonomy>/<slug>/ (docs/ui-specs/tags.md, SKODA-205).
 *   - `label` is what the author sees and the visible pill text.
 */

const FALLBACK_TAGS = [
  { taxonomy: 'model', slug: 'enyaq', label: 'Enyaq' },
  { taxonomy: 'model', slug: 'elroq', label: 'Elroq' },
  { taxonomy: 'model', slug: 'epiq', label: 'Epiq' },
  { taxonomy: 'model', slug: 'octavia', label: 'Octavia' },
  { taxonomy: 'model', slug: 'kodiaq', label: 'Kodiaq' },
  { taxonomy: 'model', slug: 'superb', label: 'Superb' },
  { taxonomy: 'bodywork', slug: 'suv', label: 'SUV' },
  { taxonomy: 'bodywork', slug: 'estate', label: 'Estate' },
  { taxonomy: 'technology', slug: 'emobility', label: 'E-mobility' },
  { taxonomy: 'motorsport', slug: 'wrc', label: 'WRC' },
  { taxonomy: 'years', slug: '2025', label: '2025' },
  { taxonomy: 'years', slug: '2026', label: '2026' },
];

export default FALLBACK_TAGS;
