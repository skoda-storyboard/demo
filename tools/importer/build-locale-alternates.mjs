#!/usr/bin/env node
/*
 * build-locale-alternates.mjs (SKODA-303a): the `alternates` metadata for pages already in DA.
 *
 * The header's language switcher links a page's declared translations: the `alternates`
 * metadata (blocks/header/header-locales.js). New imports write it into the page's Metadata
 * block (transformers/skoda-metadata.js). For the pages imported before that, this tool reads
 * each published EDS page's source on the live site, takes its `<link rel="alternate" hreflang>`
 * set with the importer's own rule (skoda-metadata-extract.mjs::pickAlternates) and writes one
 * `URL` + `alternates` row per page into the bulk metadata sheet (`/metadata`), so no page
 * document is touched. Page-level metadata wins over the sheet (aem.live bulk metadata), and an
 * empty cell never overwrites, so the curated rows (nav / footer / section) keep their values.
 *
 * Every translation must resolve (the migration caveat on #243): a published EDS variant at the
 * same path is linked site-relative; otherwise the live URL is the permitted legacy target when
 * it answers 200 without a redirect. Anything else is dropped (reported), never replaced by a
 * locale home. A source page whose own hreflang doesn't name the requested URL (a redirect, a
 * different page) is skipped.
 *
 * Usage:
 *   node tools/importer/build-locale-alternates.mjs                   build + report (no DA write)
 *   node tools/importer/build-locale-alternates.mjs --push            merge into DA, then preview
 *   node tools/importer/build-locale-alternates.mjs --push --publish  … and publish the sheet
 * Options: --paths a,b (only these EDS paths), --concurrency N (default 4).
 * Credentials: none here; admin.da.live / admin.hlx.page auth is injected by the environment.
 * Output: tools/importer/reports/locale-alternates/<stamp>.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pickAlternates } from './transformers/skoda-metadata-extract.mjs';
import { LIVE_ORIGIN } from '../../scripts/links.js';

const ORG = 'skoda-storyboard';
const SITE = 'demo';
const EDS = `https://main--${SITE}--${ORG}.aem.live`;
const SHEET = 'metadata.json';
const UA = { 'user-agent': 'skoda-locale-alternates/1.0 (+migration)' };
const here = path.dirname(fileURLToPath(import.meta.url));

/** [hreflang, href] pairs of the head's `<link rel="alternate" hreflang>` (any attribute order). */
export function hreflangLinks(html) {
  const out = [];
  const tags = String(html).match(/<link\b[^>]*>/gi) || [];
  tags.forEach((tag) => {
    const attr = (name) => (tag.match(new RegExp(`\\s${name}\\s*=\\s*(["'])(.*?)\\1`, 'i')) || [])[2];
    if (!/\balternate\b/i.test(attr('rel') || '') || !attr('hreflang')) return;
    out.push([attr('hreflang'), (attr('href') || '').replace(/&amp;/g, '&')]);
  });
  return out;
}

/** The source URL of an EDS path: same path on the live site, with its trailing slash. */
export function sourceUrl(edsPath) {
  return `${LIVE_ORIGIN}${edsPath.replace(/\/+$/, '')}/`;
}

/**
 * The sheet after the merge: the curated rows unchanged (an empty `alternates` cell added so
 * every row has the same columns), earlier generated rows (only URL + alternates) replaced
 * by the new ones, sorted by URL.
 * @param {object} sheet the DA sheet JSON ({ data: [...] })
 * @param {Array<{URL: string, alternates: string}>} rows
 */
export function mergeSheet(sheet, rows) {
  const data = Array.isArray(sheet?.data) ? sheet.data : [];
  const columns = [...new Set(['URL', ...data.flatMap((r) => Object.keys(r)), 'alternates'])];
  const generated = (r) => r.alternates && columns.every((c) => ['URL', 'alternates'].includes(c) || !r[c]);
  const blank = Object.fromEntries(columns.map((c) => [c, '']));
  const curated = data.filter((r) => !generated(r)).map((r) => ({ ...blank, ...r }));
  const added = [...rows].sort((a, b) => a.URL.localeCompare(b.URL))
    .map((r) => ({ ...blank, ...r }));
  const merged = [...curated, ...added];
  return {
    ...sheet, total: merged.length, offset: 0, limit: merged.length, data: merged, ':type': 'sheet',
  };
}

async function status(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'manual', headers: UA });
    return res.status;
  } catch (e) {
    return 0;
  }
}

/** The permitted target of a declared translation, or null: an EDS variant, else the live URL. */
async function resolveTranslation(href) {
  const { pathname } = new URL(href);
  const edsPath = pathname.replace(/\/+$/, '');
  if (await status(`${EDS}${edsPath}`) === 200) return { target: edsPath, kind: 'eds' };
  const live = await status(href);
  return live === 200 ? { target: href, kind: 'live' } : { target: null, kind: `dead ${live}` };
}

async function buildRow(edsPath) {
  const src = sourceUrl(edsPath);
  const res = await fetch(src, { headers: UA });
  if (!res.ok) return { path: edsPath, skipped: `source ${res.status}` };
  if (res.redirected && res.url !== src) return { path: edsPath, skipped: `source redirects to ${res.url}` };
  const links = hreflangLinks(await res.text());
  const self = links.find(([lang]) => lang.toLowerCase().split('-')[0] === edsPath.split('/')[1]);
  if (links.length && (!self || self[1] !== src)) return { path: edsPath, skipped: `own hreflang is ${self?.[1] || 'missing'}` };
  const declared = pickAlternates(links, src);
  const kept = [];
  const dropped = [];
  for (const pair of declared ? declared.split(', ') : []) {
    const [code, href] = pair.split(/:\s(.+)/);
    // eslint-disable-next-line no-await-in-loop
    const { target, kind } = await resolveTranslation(href);
    if (target) kept.push(`${code}: ${target}`);
    else dropped.push(`${code} ${href} (${kind})`);
  }
  return { path: edsPath, alternates: kept.join(', '), dropped };
}

async function edsPaths() {
  const res = await fetch(`${EDS}/en/query-index.json?limit=5000`, { headers: UA });
  if (!res.ok) throw new Error(`query index: ${res.status}`);
  const { data } = await res.json();
  return [...new Set(['/en', ...data.map((r) => r.path)])].sort();
}

async function adminFetch(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`${options?.method || 'GET'} ${url}: ${res.status} ${(await res.text()).slice(0, 200)}`);
  return res;
}

async function main() {
  const args = process.argv.slice(2);
  const flag = (name) => args.includes(`--${name}`);
  const value = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : null; };
  const paths = value('paths') ? value('paths').split(',').map((p) => p.trim()).filter(Boolean) : await edsPaths();
  const concurrency = Number(value('concurrency')) || 4;

  const results = [];
  const queue = [...paths];
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (queue.length) {
      const p = queue.shift();
      // eslint-disable-next-line no-await-in-loop
      results.push(await buildRow(p).catch((e) => ({ path: p, skipped: String(e.message || e) })));
    }
  }));
  results.sort((a, b) => a.path.localeCompare(b.path));
  const rows = results.filter((r) => r.alternates)
    .map((r) => ({ URL: r.path, alternates: r.alternates }));
  const report = {
    generated: new Date().toISOString(),
    pages: results.length,
    withAlternates: rows.length,
    withoutAlternates: results.filter((r) => !r.skipped && !r.alternates).map((r) => r.path),
    skipped: results.filter((r) => r.skipped).map((r) => `${r.path}: ${r.skipped}`),
    dropped: results.flatMap((r) => (r.dropped || []).map((d) => `${r.path}: ${d}`)),
    rows,
  };

  if (flag('push')) {
    const source = `https://admin.da.live/source/${ORG}/${SITE}/${SHEET}`;
    const sheet = await (await adminFetch(source)).json();
    const merged = mergeSheet(sheet, rows);
    const form = new FormData();
    form.append('data', new Blob([JSON.stringify(merged)], { type: 'application/json' }), SHEET);
    await adminFetch(source, { method: 'POST', body: form });
    await adminFetch(`https://admin.hlx.page/preview/${ORG}/${SITE}/main/${SHEET}`, { method: 'POST' });
    report.pushed = { rows: merged.data.length, preview: true };
    if (flag('publish')) {
      await adminFetch(`https://admin.hlx.page/live/${ORG}/${SITE}/main/${SHEET}`, { method: 'POST' });
      report.pushed.publish = true;
    }
  }

  const dir = path.join(here, 'reports', 'locale-alternates');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${report.generated.replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(file, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`pages ${report.pages}, with alternates ${report.withAlternates}, without ${report.withoutAlternates.length}, skipped ${report.skipped.length}, dropped ${report.dropped.length}`);
  if (report.pushed) console.log(`pushed: ${JSON.stringify(report.pushed)}`);
  console.log(`report: ${path.relative(process.cwd(), file)}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
