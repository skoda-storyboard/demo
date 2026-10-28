#!/usr/bin/env node
/*
 * build-link-allowlist.mjs — regenerate the demo-page allow-list inside
 * transformers/skoda-links.js (SKODA-605).
 *
 * The import rewrites an absolute source-host link to site-relative only when its target
 * is a demo page: docs/planning/skoda-m1-url-set.txt + skoda-rail-feed-corpus.txt
 * + skoda-archive-url-set.txt (category / tag archives) + skoda-published-url-set.txt
 * (every page live on the demo, from the live query index; SKODA-801a: pages imported
 * after the three planned lists, e.g. the SKODA-838 content and the hubs).
 * Transformers are self-contained scripts (no imports: the bundles and the transformer
 * validator load them standalone), so the list is written between the
 * `BEGIN/END GENERATED ALLOWLIST` markers. Paths use the importer's EDS form (edsPath:
 * lowercase, no trailing slash, `/en/` → `/en`). The ALIAS entry maps to its canonical;
 * `?attachment_id=` items have no EDS path yet (SKODA-608) and stay out, so links to
 * them stay absolute.
 *
 * Usage: npm run import:allowlist   (then re-bundle the importers)
 *        npm run import:allowlist -- --refresh-published   (first rewrite the published list
 *        from every locale's live query index and the pages import:push previewed, SKODA-1001;
 *        run it after pushing or publishing new pages)
 * skoda-links.test.mjs fails if the committed list drifts from the text files.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LOCALE_PATHS } from '../../scripts/locale-paths.js';
import { parseSectionedList, mergeLists } from './push/m1-status-lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const SET = 'docs/planning/skoda-m1-url-set.txt';
export const CORPUS = 'docs/planning/skoda-rail-feed-corpus.txt';
export const ARCHIVES = 'docs/planning/skoda-archive-url-set.txt';
export const PUBLISHED = 'docs/planning/skoda-published-url-set.txt';
// every locale's live index (SKODA-1001): a translated page is a demo page too, so links to it
// become site-relative; a locale without an index yet (404) is skipped
const LIVE_INDEXES = Object.keys(LOCALE_PATHS)
  .map((locale) => `https://main--demo--skoda-storyboard.aem.live/${locale}/query-index.json?limit=10000`);
const SOURCE_ORIGIN = 'https://www.skoda-storyboard.com';
// live demo-only pages that are not source pages (QA fixtures), never link targets
const NOT_SOURCE = /^\/(?:drafts|en\/test)(?:\/|$)/;
// the import's push record: the pages it pushed and previewed (SKODA-602)
export const PUSH_MANIFEST = 'tools/importer/push/push-manifest.json';
// chrome and shared fragments, never a page a link names
const NOT_PAGE = /(?:^|\/)(?:nav|footer|nav-newsletter|metadata|placeholders)$|\/fragments\//;

/**
 * The pages import:push has previewed (a previewed hash in its manifest), chrome and fragments
 * left out (pure; used by the test too). They count as demo pages before they are published, so
 * a link to a previewed translation stays on the demo (SKODA-1001 review, PO 2026-10-23); they
 * publish together with the chrome that links them.
 * @param {{pages?: object}} manifest the push manifest
 */
export function previewedPaths(manifest) {
  return Object.entries((manifest && manifest.pages) || {})
    .filter(([p, row]) => p.startsWith('/') && row && row.previewedHash && !NOT_PAGE.test(p) && !NOT_SOURCE.test(p))
    .map(([p]) => p);
}
export const TARGET = 'tools/importer/transformers/skoda-links.js';
const BLOCK = /(\/\/ BEGIN GENERATED ALLOWLIST[^\n]*\n)[\s\S]*?(\/\/ END GENERATED ALLOWLIST)/;

/** Build { paths, aliases } from the list texts (pure; used by the test too). */
export function buildAllowlist(setText, corpusText, archiveText = '', publishedText = '') {
  const planned = mergeLists(
    mergeLists(parseSectionedList(setText), parseSectionedList(corpusText)),
    parseSectionedList(archiveText),
  );
  const rows = mergeLists(planned, parseSectionedList(publishedText)).filter((r) => !r.unmapped);
  const aliases = {};
  rows.filter((r) => r.alias).forEach((r) => { aliases[r.path] = r.alias; });
  const toPath = (r) => (r.path === '/index' ? '/' : r.path);
  const paths = rows.filter((r) => !r.alias).map(toPath);
  // pages known only from the live index: plain links only (see skoda-links.js rule 1)
  const plannedPaths = new Set(planned.map(toPath));
  const liveOnly = paths.filter((p) => !plannedPaths.has(p));
  return { paths: [...new Set(paths)].sort(), aliases, liveOnly: [...new Set(liveOnly)].sort() };
}

/** The transformer source with its generated block replaced. */
export function renderInto(source, { paths, aliases, liveOnly = [] }) {
  if (!BLOCK.test(source)) throw new Error(`${TARGET}: GENERATED ALLOWLIST markers not found`);
  const body = `const DEMO_PATHS = ${JSON.stringify(paths, null, 2)};\n`
    + `const DEMO_ALIASES = ${JSON.stringify(aliases, null, 2)};\n`
    + `const LIVE_ONLY_PATHS = ${JSON.stringify(liveOnly, null, 2)};\n`;
  return source.replace(BLOCK, (all, begin, end) => `${begin}${body}${end}`);
}

export function readLists(root = ROOT) {
  return buildAllowlist(
    readFileSync(path.join(root, SET), 'utf8'),
    readFileSync(path.join(root, CORPUS), 'utf8'),
    readFileSync(path.join(root, ARCHIVES), 'utf8'),
    readFileSync(path.join(root, PUBLISHED), 'utf8'),
  );
}

/** The published list text from live index paths (pure; used by the test too). */
export function renderPublished(indexPaths, date) {
  const urls = [...new Set(indexPaths.filter((p) => p.startsWith('/') && !NOT_SOURCE.test(p)))]
    .sort()
    .map((p) => `${SOURCE_ORIGIN}${p === '/' ? '' : p}/`);
  return [
    '# Škoda Demo — every page live or previewed on the demo (SKODA-801a), generated; do not edit by hand.',
    `# From every locale's live query index and the push manifest's previewed pages (${date}),`,
    '# via npm run import:allowlist -- --refresh-published.',
    '# Feeds the SKODA-605 link allow-list, so imports rewrite links to these pages site-relative.',
    '',
    `# ===== PUBLISHED (${urls.length}) =====`,
    ...urls,
    '',
  ].join('\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--refresh-published')) {
    const paths = [];
    for (const index of LIVE_INDEXES) {
      // eslint-disable-next-line no-await-in-loop
      const response = await fetch(index);
      if (response.status === 404) { console.log(`${index}: no index yet, skipped`); continue; }
      if (!response.ok) throw new Error(`${index}: HTTP ${response.status}`);
      // eslint-disable-next-line no-await-in-loop
      const { data } = await response.json();
      paths.push(...data.map((row) => row.path));
    }
    const previewed = previewedPaths(JSON.parse(readFileSync(path.join(ROOT, PUSH_MANIFEST), 'utf8')));
    console.log(`${PUSH_MANIFEST}: ${previewed.length} previewed pages`);
    paths.push(...previewed);
    const today = new Date().toISOString().slice(0, 10);
    const text = renderPublished(paths, today);
    writeFileSync(path.join(ROOT, PUBLISHED), text);
    console.log(`${PUBLISHED}: ${text.match(/^https:/gm).length} pages`);
  }
  const list = readLists();
  const file = path.join(ROOT, TARGET);
  writeFileSync(file, renderInto(readFileSync(file, 'utf8'), list));
  console.log(`${TARGET}: ${list.paths.length} paths, ${Object.keys(list.aliases).length} alias(es)`);
}
