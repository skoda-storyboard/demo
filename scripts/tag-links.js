/*
 * Tags entered once (SKODA-841): a page's visible tag pills, derived from its facet metadata.
 *
 * Authors set the facet rows (`model`, `years`, …) and, for the source's WordPress terms that
 * are no facet (`crew`, `people`), the `tags` row. An empty Tags block then shows one pill per
 * value, with the source's label and link:
 *   - the label comes from the vocabulary sheet `/config/tags.json` (`taxonomy | slug | label`,
 *     the sheet the DA tag picker reads); a value it doesn't list shows its title-cased slug;
 *   - the link depends on the page type, as on the source: a story links the tag archive
 *     `/en/tag/<taxonomy>/<slug>`; a press release links the News filter, except the terms the
 *     source links to an archive (`blocks/tags/tag-terms.json`); a press kit links the Press
 *     Kits filter;
 *   - an archive link stays on the site when the archive is a page here (in the query index),
 *     else it points at the source archive (as the importer's link policy does); filter links
 *     point at the source listing (the importer keeps them absolute too);
 *   - pills sort by label, as plain text without case (the source's order: "2018" before "4x4").
 * Measured on the 322 migrated stories, releases and kits (SKODA-841): 271 of the 274 Tags blocks
 * come out with the same labels, hrefs and order; the other 3 show a pill no metadata holds.
 */

import { INDEX_FACETS, facetTokens } from '../blocks/listing/listing-logic.mjs';

export const SOURCE_ORIGIN = 'https://www.skoda-storyboard.com';
export const VOCABULARY_URL = '/config/tags.json';

const lower = (v) => String(v || '').trim().toLowerCase();
const titleCase = (slug) => String(slug).replace(/-/g, ' ').replace(/(^|\s)([a-z])/g, (m) => m.toUpperCase());

/**
 * The page family whose link rule applies.
 * @param {string} template the page's `template` metadata
 * @returns {'story'|'press_release'|'press_kit'}
 */
export function linkFamily(template) {
  const t = lower(template);
  if (t === 'press_release') return 'press_release';
  if (t.startsWith('press_kit')) return 'press_kit';
  return 'story';
}

/**
 * The vocabulary sheet as a lookup: `taxonomy|slug` → label, and slug → the non-facet taxonomies it
 * belongs to (`crew`, `people`), so a `tags` value outside the facets still gets its archive.
 * @param {object|object[]} sheet the sheet JSON (`{ data: [...] }`) or its rows
 */
export function vocabularyMap(sheet) {
  const rows = Array.isArray(sheet) ? sheet : (sheet?.data || []);
  const labels = new Map();
  const otherTaxonomies = new Map();
  rows.forEach((row) => {
    const taxonomy = lower(row?.taxonomy);
    const slug = lower(row?.slug);
    const label = String(row?.label || '').trim();
    if (!taxonomy || !slug) return;
    if (label) labels.set(`${taxonomy}|${slug}`, label);
    if (!INDEX_FACETS.includes(taxonomy)) {
      if (!otherTaxonomies.has(slug)) otherTaxonomies.set(slug, []);
      otherTaxonomies.get(slug).push(taxonomy);
    }
  });
  return { labels, otherTaxonomies };
}

/**
 * The tag entries of a page: one per facet value, then one per `tags` value that is no facet value
 * but a vocabulary term of a non-facet taxonomy. A `tags` value that is neither has no taxonomy to
 * link, so it isn't shown (the page keeps its authored Tags block for it).
 * @param {{facets: Record<string, string|string[]>, tags?: string|string[]}} page metadata values
 * @param {{labels: Map, otherTaxonomies: Map}} vocabulary vocabularyMap() output
 * @returns {{taxonomy: string, slug: string, label: string}[]}
 */
export function tagEntries({ facets = {}, tags = '' }, vocabulary = vocabularyMap([])) {
  const seen = new Set();
  const out = [];
  const add = (taxonomy, slug) => {
    const key = `${taxonomy}|${slug}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ taxonomy, slug, label: vocabulary.labels.get(key) || titleCase(slug) });
  };
  const values = (v) => (Array.isArray(v) ? v : facetTokens(v)).map(lower).filter(Boolean);
  INDEX_FACETS.forEach((facet) => values(facets[facet]).forEach((slug) => add(facet, slug)));
  const facetSlugs = new Set(out.map((e) => e.slug));
  values(tags).forEach((slug) => {
    if (facetSlugs.has(slug)) return;
    (vocabulary.otherTaxonomies.get(slug) || []).forEach((taxonomy) => add(taxonomy, slug));
  });
  return out;
}

/** A tag archive link: on the site when the archive is a page here, else the source's. */
export function archiveHref(taxonomy, slug, archives = new Set()) {
  const path = `/en/tag/${taxonomy}/${slug}`;
  return archives.has(path) ? path : `${SOURCE_ORIGIN}${path}/`;
}

/** A source listing filter link, encoded as the source's (`?filter%5Bvip%5D%5B%5D=graf-en`). */
export function filterHref(listing, facet, slug) {
  return `${SOURCE_ORIGIN}/en/${listing}/?filter%5B${facet}%5D%5B%5D=${encodeURIComponent(slug)}`;
}

/**
 * The link of one tag entry on a page of the given family.
 * @param {{taxonomy: string, slug: string}} entry
 * @param {string} family linkFamily() output
 * @param {{terms?: object, archives?: Set<string>}} [ctx] `terms`: tag-terms.json (per family,
 *   `taxonomy/slug` → the archive taxonomy the source links); `archives`: the tag archive paths
 *   here
 */
export function tagHref({ taxonomy, slug }, family, { terms = {}, archives = new Set() } = {}) {
  const archive = terms[family]?.[`${taxonomy}/${slug}`];
  if (archive) return archiveHref(archive, slug, archives);
  const facet = INDEX_FACETS.includes(taxonomy);
  if (family === 'press_kit' && facet) return filterHref('press-kits', taxonomy, slug);
  if (family === 'press_release' && facet) return filterHref('news', taxonomy, slug);
  return archiveHref(taxonomy, slug, archives);
}

/** Pill order: by label, as plain text without case (the source's). */
export const byLabel = (a, b) => a.label.localeCompare(b.label, 'en', { sensitivity: 'base' });

/**
 * The page's pills: label + href, in the source's order.
 * @param {object} page `{ template, facets, tags }`
 * @param {{vocabulary?: object, terms?: object, archives?: Set<string>}} [ctx]
 * @returns {{label: string, href: string}[]}
 */
export function derivedTags(page, { vocabulary, terms, archives } = {}) {
  const family = linkFamily(page.template);
  return tagEntries(page, vocabulary)
    .map((entry) => ({ label: entry.label, href: tagHref(entry, family, { terms, archives }) }))
    .sort(byLabel);
}

/** The tag archive paths among index rows (`/en/tag/<taxonomy>/<slug>`). */
export function archivePaths(rows = []) {
  return new Set(rows.map((row) => String(row?.path || '').replace(/\/+$/, ''))
    .filter((path) => /^\/en\/tag\/[^/]+\/[^/]+$/.test(path)));
}

const memo = new Map();
const fetchJson = (url) => {
  if (!memo.has(url)) {
    memo.set(url, fetch(url).then((res) => (res.ok ? res.json() : null)).catch(() => null));
  }
  return memo.get(url);
};

/** The vocabulary sheet, fetched once per page (an unreachable sheet gives an empty vocabulary). */
export async function loadVocabulary(url = VOCABULARY_URL) {
  return vocabularyMap(await fetchJson(url));
}

/** The link exceptions (blocks/tags/tag-terms.json), fetched once per page. */
export async function loadTerms() {
  const base = window.hlx?.codeBasePath || '';
  return (await fetchJson(`${base}/blocks/tags/tag-terms.json`)) || {};
}
