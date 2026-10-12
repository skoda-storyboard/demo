#!/usr/bin/env node
/*
 * build-locale-alternates.mjs (SKODA-303a): the native hreflang metadata of the migrated
 * translations, for SEO and the header's language switcher (blocks/header/header-locales.js).
 *
 * For every published EDS page this reads its source on the live site, takes the
 * `<link rel="alternate" hreflang>` set (skoda-metadata-extract.mjs::pickHreflang) and keeps
 * only the entries that are pages on EDS too. A translation that isn't migrated is left out: the
 * switcher never links the live site and never falls back to a locale home, so a page without a
 * migrated translation gets no row and shows only its own language. The translated pages found
 * that way get their own row (their links point back), so the switch works both ways.
 *
 * The rows go into the bulk metadata sheet (`/metadata`), one row per page: `URL` plus one
 * native `hreflang:<code>` column per language (#299 review; aem.live special metadata
 * properties), the page's own language included and `x-default` when the source declares it and
 * its target is migrated. Values are absolute URLs on `--origin` (default: the demo's live host;
 * the production domain at go-live). EDS renders each as
 * `<link rel="alternate" hreflang="cs" href="…">` in the head; the switcher reads those. No page
 * document is touched. Page-level metadata wins over the sheet and an empty cell never
 * overwrites (aem.live bulk metadata), so the curated rows keep their values. The earlier custom
 * `alternates` column is removed. `--chrome cs,de` also adds a `/{locale}/**` row per locale
 * pointing `nav` / `footer` at `/{locale}/nav` and `/{locale}/footer` (the translated menus).
 *
 * Usage:
 *   node tools/importer/build-locale-alternates.mjs                  build + report (no DA write)
 *   … --stage preview                     count pages previewed on .aem.page (default: live)
 *   … --push                              merge into DA /metadata.json, then preview it
 *   … --push --publish                    … and publish the sheet
 * Options: --paths a,b (only these EDS paths), --chrome cs,de,sk,sr, --chrome-footer cs (the
 *   locales with a translated footer; default: all --chrome ones), --origin <url> (the host of
 *   the hreflang URLs), --concurrency N (4).
 * Credentials: none here; admin.da.live / admin.hlx.page auth is injected by the environment.
 * Output: tools/importer/reports/locale-alternates/<stamp>.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pickHreflang, ALTERNATE_LOCALES } from './transformers/skoda-metadata-extract.mjs';
import { LIVE_ORIGIN } from '../../scripts/links.js';

const ORG = 'skoda-storyboard';
const SITE = 'demo';
const HOSTS = {
  live: `https://main--${SITE}--${ORG}.aem.live`,
  preview: `https://main--${SITE}--${ORG}.aem.page`,
};
const SHEET = 'metadata.json';
const UA = { 'user-agent': 'skoda-locale-alternates/1.0 (+migration)' };
const here = path.dirname(fileURLToPath(import.meta.url));

/** [hreflang, href] pairs of the head's `<link rel="alternate" hreflang>` (any attribute order). */
export function hreflangLinks(html) {
  const out = [];
  const tags = String(html || '').match(/<link\b[^>]*>/gi) || [];
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

/** The EDS path of a live-site URL: its pathname without the trailing slash, or null. */
export function edsPathOf(href) {
  try {
    const url = new URL(href);
    if (url.origin !== LIVE_ORIGIN) return null;
    return decodeURIComponent(url.pathname).replace(/\/+$/, '') || null;
  } catch (e) {
    return null;
  }
}

/** The EDS paths a pickHreflang result names. */
const declaredPaths = (declared) => (declared || []).map(([, href]) => edsPathOf(href))
  .filter(Boolean);

/** The `hreflang:<code>` column of a code, as aem.live names the property. */
export const hreflangColumn = (code) => `hreflang:${code}`;

/** The hreflang columns in the switcher's order, x-default last. */
export const HREFLANG_COLUMNS = [...ALTERNATE_LOCALES, 'x-default'].map(hreflangColumn);

/**
 * The hreflang metadata of one page: its declared entries (pickHreflang output) kept only where
 * `migrated(path)` holds, as absolute URLs on `origin`. Every kept entry is written, so its own
 * language (self-hreflang) and an authored `x-default` stay even when none of its translations
 * is migrated (#299 review: SEO metadata does not depend on the switcher having a link to show).
 * @param {Array<[string, string]>} declared [code, live URL] pairs
 * @param {(edsPath: string) => boolean} migrated
 * @param {string} origin e.g. https://main--demo--skoda-storyboard.aem.live
 * @returns {{columns: Record<string, string>, kept: string[], missing: string[]}}
 */
export function migratedHreflang(declared, migrated, origin) {
  const kept = [];
  const missing = [];
  (declared || []).forEach(([code, href]) => {
    const target = edsPathOf(href);
    if (target && migrated(target)) kept.push([code, `${origin.replace(/\/+$/, '')}${target}`]);
    else missing.push(code);
  });
  const columns = Object.fromEntries(kept.map(([code, url]) => [hreflangColumn(code), url]));
  return { columns, kept: kept.map(([code]) => code), missing };
}

/**
 * `/{locale}/**` rows pointing nav (and footer) at the locale's translated fragments; a locale
 * not in `footers` keeps the English `/footer` (PO, M1: DE / SK / SR).
 * @param {string[]} codes the locales with translated chrome
 * @param {string[]} [footers] the locales with a translated footer (default: all of them)
 */
export function chromeRows(codes = [], footers = codes) {
  return codes.filter((c) => ALTERNATE_LOCALES.includes(c) && c !== 'en')
    .map((c) => ({ URL: `/${c}/**`, nav: `/${c}/nav`, footer: footers.includes(c) ? `/${c}/footer` : '' }));
}

/** A `/{locale}/**` chrome row this tool writes (replaced on every merge). */
const isChromeRow = (r) => /^\/([a-z]{2})\/\*\*$/.test(r.URL || '') && r.nav === `${r.URL.slice(0, 3)}/nav`;

const isHreflang = (column) => /^hreflang:/i.test(column);
// the columns this tool writes: the native hreflang ones and the earlier custom `alternates`
const isGenerated = (column) => column === 'alternates' || isHreflang(column);

/**
 * The sheet after the merge: the curated rows unchanged, this tool's earlier rows (URL + hreflang
 * or the old `alternates` only, and the `/{locale}/**` chrome rows) replaced by the new ones,
 * sorted by URL. The custom `alternates` column is dropped (#299 review: native hreflang only),
 * and every row gets every column (an empty cell never overwrites in bulk metadata), the
 * hreflang ones last in the switcher's order.
 * @param {object} sheet the DA sheet JSON ({ data: [...] })
 * @param {Array<object>} rows `{ URL, 'hreflang:en': …, … }`
 * @param {Array<object>} [extra] curated rows to ensure (e.g. chromeRows())
 */
export function mergeSheet(sheet, rows, extra = []) {
  const data = Array.isArray(sheet?.data) ? sheet.data : [];
  const all = [...data, ...extra, ...rows].flatMap((r) => Object.keys(r));
  const hreflang = [...new Set([...HREFLANG_COLUMNS, ...all.filter(isHreflang)])]
    .filter((c) => all.includes(c));
  const columns = [...new Set(['URL', ...all.filter((c) => c !== 'URL' && !isGenerated(c)), ...hreflang])];
  const shape = (r) => Object.fromEntries(columns.map((c) => [c, r[c] ?? '']));
  const generated = (r) => Object.keys(r).some((c) => isGenerated(c) && r[c])
    && Object.keys(r).every((c) => c === 'URL' || isGenerated(c) || !r[c]);
  const curated = data.filter((r) => !generated(r) && !isChromeRow(r)).map(shape);
  const ensured = extra.map(shape);
  const added = [...rows].sort((a, b) => a.URL.localeCompare(b.URL)).map(shape);
  const merged = [...curated, ...ensured, ...added];
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

/** The source page's declared translations, or a reason it was skipped. */
async function declaredFor(edsPath) {
  const src = sourceUrl(edsPath);
  const res = await fetch(src, { headers: UA });
  if (!res.ok) return { skipped: `source ${res.status}` };
  if (res.redirected && res.url !== src) return { skipped: `source redirects to ${res.url}` };
  const links = hreflangLinks(await res.text());
  const own = edsPath.split('/')[1];
  const self = links.find(([lang]) => lang.toLowerCase().split('-')[0] === own);
  if (links.length && (!self || self[1] !== src)) return { skipped: `own hreflang is ${self?.[1] || 'missing'}` };
  return { declared: pickHreflang(links) };
}

async function edsPaths(host) {
  const res = await fetch(`${host}/en/query-index.json?limit=5000`, { headers: UA });
  if (!res.ok) throw new Error(`query index: ${res.status}`);
  const { data } = await res.json();
  return [...new Set(['/en', ...data.map((r) => r.path)])];
}

async function adminFetch(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`${options?.method || 'GET'} ${url}: ${res.status} ${(await res.text()).slice(0, 200)}`);
  return res;
}

async function pool(items, concurrency, fn) {
  const queue = [...items];
  const out = [];
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (queue.length) {
      const item = queue.shift();
      // eslint-disable-next-line no-await-in-loop
      out.push(await fn(item));
    }
  }));
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const flag = (name) => args.includes(`--${name}`);
  const value = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : null; };
  const list = (name) => (value(name) || '').split(',').map((s) => s.trim()).filter(Boolean);
  const stage = value('stage') === 'preview' ? 'preview' : 'live';
  const host = HOSTS[stage];
  const concurrency = Number(value('concurrency')) || 4;
  const origin = value('origin') || HOSTS.live;
  if (!/^https:\/\/[^/]+$/.test(origin)) throw new Error(`--origin must be an https origin, got ${origin}`);
  const start = list('paths').length ? list('paths') : await edsPaths(host);

  // 1) the declared translations of every page, then of the migrated translations they name
  const declared = new Map();
  const onEds = new Map();
  const isOnEds = async (p) => {
    if (!onEds.has(p)) onEds.set(p, (await status(`${host}${p}`)) === 200);
    return onEds.get(p);
  };
  let wave = start;
  while (wave.length) {
    // eslint-disable-next-line no-await-in-loop
    const results = await pool(wave, concurrency, async (p) => [
      p, await declaredFor(p).catch((e) => ({ skipped: String(e.message || e) })),
    ]);
    results.forEach(([p, r]) => declared.set(p, r));
    const named = [...new Set(results.flatMap(([, r]) => declaredPaths(r.declared)))]
      .filter((p) => !declared.has(p));
    // eslint-disable-next-line no-await-in-loop
    const migrated = await pool(named, concurrency, async (p) => [p, await isOnEds(p)]);
    wave = migrated.filter(([, ok]) => ok).map(([p]) => p);
  }

  // 2) keep the migrated pairs
  const rows = [];
  const report = {
    generated: new Date().toISOString(),
    stage,
    origin,
    pages: declared.size,
    rows,
    skipped: [],
    translatedPages: [],
  };
  let missing = 0;
  for (const [p, r] of [...declared].sort(([a], [b]) => a.localeCompare(b))) {
    if (r.skipped) { report.skipped.push(`${p}: ${r.skipped}`); continue; }
    // eslint-disable-next-line no-await-in-loop
    const known = new Set(await Promise.all(
      declaredPaths(r.declared).map(async (t) => ((await isOnEds(t)) ? t : null)),
    ));
    const result = migratedHreflang(r.declared, (t) => known.has(t), origin);
    missing += result.missing.length;
    if (Object.keys(result.columns).length) rows.push({ URL: p, ...result.columns });
    if (!start.includes(p)) report.translatedPages.push(p);
  }
  report.notMigratedTranslations = missing;
  const extra = chromeRows(list('chrome'), value('chrome-footer') === null ? list('chrome') : list('chrome-footer'));
  report.chrome = extra;

  if (flag('push')) {
    const source = `https://admin.da.live/source/${ORG}/${SITE}/${SHEET}`;
    const sheet = await (await adminFetch(source)).json();
    const merged = mergeSheet(sheet, rows, extra);
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
  console.log(`stage ${stage}: pages ${report.pages}, rows ${rows.length}, translated pages ${report.translatedPages.length}, skipped ${report.skipped.length}, not-migrated translations ${missing}, chrome rows ${extra.length}`);
  rows.forEach((r) => console.log(`  ${r.URL} -> ${Object.keys(r).filter(isHreflang).map((c) => c.slice(9)).join(', ')}`));
  if (report.pushed) console.log(`pushed: ${JSON.stringify(report.pushed)}`);
  console.log(`report: ${path.relative(process.cwd(), file)}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
