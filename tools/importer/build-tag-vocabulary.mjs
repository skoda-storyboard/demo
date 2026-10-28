#!/usr/bin/env node
/*
 * build-tag-vocabulary.mjs — one tag vocabulary for authors and pages (SKODA-841).
 *
 * The DA sheet `/config/tags.json` (`taxonomy | slug | label`) is the vocabulary: the tag picker
 * reads it, and an empty Tags block takes its pill labels from it (scripts/tag-links.js). This builds
 * the sheet from what the migrated pages use, so no value in use is missing:
 *   - the sheet's own rows (kept as they are: authors own them);
 *   - every authored pill of the indexed stories, releases and kits (the source's label; its taxonomy
 *     is the facet that holds the value, or the source's own taxonomy, `crew` / `people`, when no
 *     facet does);
 *   - every facet value in the index, named by blocks/listing/facet-labels.json (the source's filter
 *     names) or, failing that, its title-cased slug (listed, to review).
 * It also writes blocks/tags/tag-terms.json: per page family, the values whose source link is an
 * archive where the family's rule says a filter (21 press-release terms on 2026-10-27).
 *
 * Usage: node tools/importer/build-tag-vocabulary.mjs [--host <preview host>] [--out <dir>]
 *   writes <out>/config/tags.json (default content/; POST it to the DA Source API with approval) and
 *   blocks/tags/tag-terms.json; prints the rows added, label conflicts and title-cased guesses.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { INDEX_FACETS, facetTokens } from '../../blocks/listing/listing-logic.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const arg = (name, dflt) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : dflt; };
const HOST = arg('--host', 'https://main--demo--skoda-storyboard.aem.page');
const OUT = path.resolve(ROOT, arg('--out', 'content'));
const TEMPLATES = ['story', 'press_release', 'press_kit', 'press_kit_chapter'];
const family = (t) => (t === 'press_release' ? 'press_release' : (String(t).startsWith('press_kit') ? 'press_kit' : 'story'));
const lower = (v) => String(v || '').trim().toLowerCase();
const tokens = (v) => (Array.isArray(v) ? v : facetTokens(v)).map(lower).filter(Boolean);
const titleCase = (slug) => slug.replace(/-/g, ' ').replace(/(^|\s)([a-z])/g, (m) => m.toUpperCase());

/** The taxonomy and slug a source tag link carries: an archive or a listing filter. */
export function linkTerm(href) {
  const archive = String(href).match(/\/en\/tag\/([^/]+)\/([^/?#]+?)\/?(?:[?#]|$)/);
  if (archive) return { kind: 'archive', taxonomy: lower(archive[1]), slug: lower(decodeURIComponent(archive[2])) };
  const filter = String(href).match(/filter(?:%5B|\[)([^%\]]+)(?:%5D|\])(?:%5B|\[)(?:%5D|\])=([^&#]+)/i);
  if (filter) return { kind: 'filter', taxonomy: lower(filter[1]), slug: lower(decodeURIComponent(filter[2])) };
  return null;
}

// HTML entities decoded once each, `&amp;` last (the served HTML writes `&` as `&#x26;`)
const decode = (s) => String(s)
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (m, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&amp;/g, '&');

/** The authored pills (text + href) of the page's Tags blocks, in order. */
export function authoredPills(plainHtml) {
  const blocks = String(plainHtml).split(/<div class="tags[^"]*">/).slice(1);
  return blocks.flatMap((b) => [...b.split(/<div class="(?!tags)/)[0].matchAll(/<a href="([^"]+)"[^>]*>([^<]*)<\/a>/g)]
    .map(([, href, text]) => ({ href: decode(href), text: decode(text).trim() })));
}

/**
 * Build the vocabulary rows and the link exceptions from pages + index + the current sheet.
 * @param {{pages: {template, facets, tags, pills}[], index: object[], sheet: object[], facetLabels: object}} input
 */
export function buildVocabulary({ pages, index, sheet, facetLabels }) {
  const rows = new Map(); // `taxonomy|slug` → { taxonomy, slug, label, from }
  const conflicts = [];
  const guesses = [];
  const put = (taxonomy, slug, label, from) => {
    const key = `${taxonomy}|${slug}`;
    const had = rows.get(key);
    if (!had) { rows.set(key, { taxonomy, slug, label, from }); return; }
    if (had.label !== label && from !== 'guess') conflicts.push(`${key}: "${had.label}" (${had.from}) vs "${label}" (${from})`);
  };
  sheet.forEach((r) => { if (r.taxonomy && r.slug) put(lower(r.taxonomy), lower(r.slug), String(r.label || '').trim(), 'sheet'); });
  const terms = {};
  pages.forEach((p) => {
    const fam = family(p.template);
    p.pills.forEach((pill) => {
      const t = linkTerm(pill.href);
      if (!t || !pill.text) return;
      const holds = (facet) => tokens(p.facets?.[facet]).includes(t.slug);
      const facet = INDEX_FACETS.includes(t.taxonomy) && holds(t.taxonomy) ? t.taxonomy : INDEX_FACETS.find(holds);
      if (!facet && !tokens(p.tags).includes(t.slug)) return; // neither a facet value nor a tag: noise
      const taxonomy = facet || t.taxonomy;
      put(taxonomy, t.slug, pill.text, 'page');
      // the family's rule: a story links its archive; a release / kit a filter for facet values
      const ruleArchive = fam === 'story' || !facet ? taxonomy : null;
      if (t.kind === 'archive' && t.taxonomy !== ruleArchive) {
        terms[fam] = terms[fam] || {};
        terms[fam][`${taxonomy}/${t.slug}`] = t.taxonomy;
      }
    });
  });
  const names = new Map(Object.entries(facetLabels).filter(([k, v]) => !k.startsWith('_') && Array.isArray(v))
    .flatMap(([facet, pairs]) => pairs.map(([slug, name]) => [`${facet}|${lower(slug)}`, name])));
  index.forEach((r) => INDEX_FACETS.forEach((facet) => tokens(r[facet]).forEach((slug) => {
    const key = `${facet}|${slug}`;
    if (rows.has(key)) return;
    const name = names.get(key);
    if (!name) guesses.push(key);
    put(facet, slug, name || titleCase(slug), name ? 'facet-labels' : 'guess');
  })));
  const order = (r) => [INDEX_FACETS.includes(r.taxonomy) ? INDEX_FACETS.indexOf(r.taxonomy) : 99, r.taxonomy, r.label.toLowerCase()];
  const data = [...rows.values()].sort((a, b) => {
    const [x, y] = [order(a), order(b)];
    return x[0] - y[0] || x[1].localeCompare(y[1]) || x[2].localeCompare(y[2], 'en');
  }).map(({ taxonomy, slug, label }) => ({ taxonomy, slug, label }));
  Object.values(terms).forEach((t) => Object.keys(t).sort().forEach((k) => { const v = t[k]; delete t[k]; t[k] = v; }));
  return { data, terms, conflicts, guesses, added: data.length - sheet.length };
}

async function main() {
  const get = async (url) => { const r = await fetch(url); if (!r.ok) throw new Error(`${r.status} ${url}`); return r; };
  const index = (await (await get(`${HOST}/en/query-index.json?limit=100000`)).json()).data;
  const sheet = (await (await get(`${HOST}/config/tags.json?limit=10000`)).json()).data;
  const facetLabels = JSON.parse(readFileSync(path.join(ROOT, 'blocks/listing/facet-labels.json'), 'utf8'));
  const tagged = index.filter((r) => TEMPLATES.includes(r.template));
  const pages = [];
  const queue = [...tagged];
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (queue.length) {
      const r = queue.shift();
      const html = await (await fetch(`${HOST}${r.path}.plain.html`)).text();
      pages.push({ template: r.template, facets: r, tags: r.tags, pills: authoredPills(html) });
    }
  }));
  const { data, terms, conflicts, guesses, added } = buildVocabulary({ pages, index, sheet, facetLabels });
  mkdirSync(path.join(OUT, 'config'), { recursive: true });
  writeFileSync(path.join(OUT, 'config/tags.json'), `${JSON.stringify({ total: data.length, offset: 0, limit: data.length, data, ':type': 'sheet' }, null, 2)}\n`);
  writeFileSync(path.join(ROOT, 'blocks/tags/tag-terms.json'), `${JSON.stringify(terms, null, 2)}\n`);
  console.log(`${tagged.length} pages, ${index.length} index rows → ${data.length} vocabulary rows (${added} added to the sheet's ${sheet.length})`);
  console.log(`link exceptions: ${Object.entries(terms).map(([f, t]) => `${f} ${Object.keys(t).length}`).join(', ') || 'none'}`);
  if (conflicts.length) console.log(`label conflicts (the first is kept):\n  ${conflicts.join('\n  ')}`);
  if (guesses.length) console.log(`title-cased guesses (no source name; review): ${guesses.join(', ')}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch((e) => { console.error(e); process.exit(1); });
