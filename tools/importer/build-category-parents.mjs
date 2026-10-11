#!/usr/bin/env node
/*
 * build-category-parents.mjs — regenerate the WordPress category tree (child slug → parent
 * slug) inlined in transformers/skoda-metadata.js and transformers/skoda-metadata-extract.mjs
 * (SKODA-831).
 *
 * A story's `categories` metadata = its own `category-<slug>` post classes plus every
 * ancestor, because a source category archive lists the stories of its descendants too
 * (/en/category/skoda-world/ holds the design and heritage stories). The tree comes from
 * the source REST API (/wp-json/wp/v2/categories, every page), filtered to the English
 * archives (link under /en/category/). Root categories have no entry.
 * Transformers are self-contained scripts (no imports: the bundles and the transformer
 * validator load them standalone), so the map is written between the
 * `BEGIN/END GENERATED CATEGORY PARENTS` markers in both files.
 *
 * Usage: node tools/importer/build-category-parents.mjs [--from <categories.json>]
 *   (then re-bundle every importer: all of them embed skoda-metadata.js)
 * skoda-metadata-categories.test.mjs fails if the two copies differ.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const API = 'https://www.skoda-storyboard.com/wp-json/wp/v2/categories';
export const TARGETS = [
  'tools/importer/transformers/skoda-metadata.js',
  'tools/importer/transformers/skoda-metadata-extract.mjs',
];
export const BLOCK = /(\/\/ BEGIN GENERATED CATEGORY PARENTS[^\n]*\n)[\s\S]*?(\/\/ END GENERATED CATEGORY PARENTS)/;

/**
 * { childSlug: parentSlug } for the English categories (pure; used by the test too).
 * @param {{id:number, slug:string, parent:number, link:string}[]} categories REST rows
 */
export function buildParents(categories, locale = 'en') {
  const local = categories.filter((c) => String(c.link || '').includes(`/${locale}/category/`));
  const byId = new Map(local.map((c) => [c.id, c]));
  const parents = {};
  local
    .filter((c) => c.parent && byId.has(c.parent))
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .forEach((c) => { parents[c.slug] = byId.get(c.parent).slug; });
  return parents;
}

// An eslint-clean object literal (airbnb quote-props / quotes); slugs are [a-z0-9_-] only.
function literal(parents) {
  const entries = Object.entries(parents);
  if (!entries.length) return '{}';
  const key = (k) => (/^[a-z_$][a-z0-9_$]*$/i.test(k) ? k : `'${k}'`);
  return `{\n${entries.map(([k, v]) => `  ${key(k)}: '${v}',`).join('\n')}\n}`;
}

/** A target source with its generated block replaced (keeps the file's `export` style). */
export function renderInto(source, parents) {
  if (!BLOCK.test(source)) throw new Error('GENERATED CATEGORY PARENTS markers not found');
  return source.replace(BLOCK, (all, begin, end) => {
    const decl = /export const CATEGORY_PARENTS/.test(all) ? 'export const' : 'const';
    return `${begin}${decl} CATEGORY_PARENTS = ${literal(parents)};\n${end}`;
  });
}

async function fetchAll() {
  const rows = [];
  for (let page = 1; ; page += 1) {
    // eslint-disable-next-line no-await-in-loop
    const res = await fetch(`${API}?per_page=100&page=${page}&_fields=id,slug,parent,link`);
    if (res.status === 400 && page > 1) break; // past the last page
    if (!res.ok) throw new Error(`${API} page ${page}: HTTP ${res.status}`);
    // eslint-disable-next-line no-await-in-loop
    const batch = await res.json();
    rows.push(...batch);
    if (batch.length < 100 || page >= Number(res.headers.get('x-wp-totalpages') || page)) break;
  }
  return rows;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const from = process.argv.indexOf('--from');
  const categories = from > 0
    ? JSON.parse(readFileSync(process.argv[from + 1], 'utf8'))
    : await fetchAll();
  const parents = buildParents(categories);
  TARGETS.forEach((t) => {
    const file = path.join(ROOT, t);
    writeFileSync(file, renderInto(readFileSync(file, 'utf8'), parents));
  });
  console.log(`${categories.length} categories → ${Object.keys(parents).length} English child → parent entries`);
}
