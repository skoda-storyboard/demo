#!/usr/bin/env node
/*
 * build-facet-labels.mjs — the source's facet option names, for the listing block (#273).
 *
 * Our index / media feed carries facet slugs (`citigoe`, `india-2-0`, `rs`); the source's
 * filter shows names (`Citigoᵉ iV`, `India 2.0`, `RS`) in its own order. This reads the
 * source's filter forms (form.search-filter: `<input name="filter[<facet>][]" value="<slug>">`
 * + its `<label>`) on the listing pages and writes, per facet, the [slug, name] pairs in the
 * source's order to blocks/listing/facet-labels.json (committed, served with the block).
 * The listing shows only the options its rows have (PO, #273); a slug the source does not
 * list keeps the title-cased slug.
 *
 * Usage: node tools/importer/build-facet-labels.mjs [--check]
 *   --check  exit 1 if the committed file differs from the source (no write)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const TARGET = path.resolve(here, '../../blocks/listing/facet-labels.json');
const SOURCE = 'https://www.skoda-storyboard.com';
// the media listings first: their order wins for the facets they share with the others
const PAGES = ['/en/images/', '/en/videos/', '/en/news/', '/en/press-kits/'];
const UA = { 'user-agent': 'Mozilla/5.0 (compatible; skoda-eds-migration/1.0)' };

// entities decoded once each, `&amp;` last (so `&amp;lt;` stays the text `&lt;`)
const decode = (s) => String(s)
  .replace(/<[^>]+>/g, '')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (m, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ')
  .trim();

/**
 * The [facet, slug, name] options of one source page's filter form, in document order.
 * @param {string} html
 * @returns {Array<[string, string, string]>}
 */
export function filterOptions(html) {
  const form = String(html).match(/<form[^>]*class="[^"]*\bsearch-filter\b[^"]*"[\s\S]*?<\/form>/i);
  if (!form) return [];
  const out = [];
  const li = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
  let m;
  // eslint-disable-next-line no-cond-assign
  while ((m = li.exec(form[0]))) {
    const input = m[1].match(/<input\b[^>]*>/i)?.[0] || '';
    const facet = input.match(/name="filter\[([a-z0-9_-]+)\]\[\]"/i)?.[1];
    const slug = input.match(/value="([^"]*)"/i)?.[1];
    const name = decode(m[1].match(/<label\b[^>]*>([\s\S]*?)<\/label>/i)?.[1] || '');
    if (facet && slug && name) out.push([facet.toLowerCase(), decode(slug).toLowerCase(), name]);
  }
  return out;
}

/**
 * Per facet, the [slug, name] pairs in first-seen order across the pages' options.
 * @param {Array<Array<[string, string, string]>>} pages
 * @returns {Record<string, Array<[string, string]>>}
 */
export function mergeOptions(pages) {
  const out = {};
  const seen = new Set();
  pages.flat().forEach(([facet, slug, name]) => {
    if (seen.has(`${facet}\u0000${slug}`)) return;
    seen.add(`${facet}\u0000${slug}`);
    (out[facet] ||= []).push([slug, name]);
  });
  return out;
}

export const render = (labels) => `${JSON.stringify(labels, null, 1)}\n`;

async function main() {
  const check = process.argv.includes('--check');
  const pages = [];
  for (const p of PAGES) {
    // eslint-disable-next-line no-await-in-loop
    const res = await fetch(`${SOURCE}${p}`, { headers: UA });
    if (!res.ok) throw new Error(`${p}: ${res.status}`);
    // eslint-disable-next-line no-await-in-loop
    const options = filterOptions(await res.text());
    if (!options.length) throw new Error(`${p}: no filter options found`);
    console.log(`${p}: ${options.length} options`);
    pages.push(options);
  }
  const text = render(mergeOptions(pages));
  if (check) {
    const current = fs.existsSync(TARGET) ? fs.readFileSync(TARGET, 'utf8') : '';
    if (current !== text) {
      console.error(`${path.relative(process.cwd(), TARGET)} differs from the source; run without --check`);
      process.exit(1);
    }
    console.log('up to date');
    return;
  }
  fs.writeFileSync(TARGET, text);
  const labels = JSON.parse(text);
  console.log(`wrote ${path.relative(process.cwd(), TARGET)}: ${Object.entries(labels).map(([f, v]) => `${f} ${v.length}`).join(', ')}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
