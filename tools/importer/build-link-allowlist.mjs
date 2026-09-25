#!/usr/bin/env node
/*
 * build-link-allowlist.mjs — regenerate the demo-page allow-list inside
 * transformers/skoda-links.js (SKODA-605).
 *
 * The import rewrites an absolute source-host link to site-relative only when its target
 * is a demo page: docs/planning/skoda-m1-url-set.txt + skoda-rail-feed-corpus.txt.
 * Transformers are self-contained scripts (no imports: the bundles and the transformer
 * validator load them standalone), so the list is written between the
 * `BEGIN/END GENERATED ALLOWLIST` markers. Paths use the importer's EDS form (edsPath:
 * lowercase, no trailing slash, `/en/` → `/en`). The ALIAS entry maps to its canonical;
 * `?attachment_id=` items have no EDS path yet (SKODA-608) and stay out, so links to
 * them stay absolute.
 *
 * Usage: npm run import:allowlist   (then re-bundle the importers)
 * skoda-links.test.mjs fails if the committed list drifts from the two text files.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseSectionedList, mergeLists } from './push/m1-status-lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const SET = 'docs/planning/skoda-m1-url-set.txt';
export const CORPUS = 'docs/planning/skoda-rail-feed-corpus.txt';
export const TARGET = 'tools/importer/transformers/skoda-links.js';
const BLOCK = /(\/\/ BEGIN GENERATED ALLOWLIST[^\n]*\n)[\s\S]*?(\/\/ END GENERATED ALLOWLIST)/;

/** Build { paths, aliases } from the two list texts (pure; used by the test too). */
export function buildAllowlist(setText, corpusText) {
  const rows = mergeLists(parseSectionedList(setText), parseSectionedList(corpusText))
    .filter((r) => !r.unmapped);
  const aliases = {};
  rows.filter((r) => r.alias).forEach((r) => { aliases[r.path] = r.alias; });
  const paths = rows.filter((r) => !r.alias).map((r) => (r.path === '/index' ? '/' : r.path));
  return { paths: [...new Set(paths)].sort(), aliases };
}

/** The transformer source with its generated block replaced. */
export function renderInto(source, { paths, aliases }) {
  if (!BLOCK.test(source)) throw new Error(`${TARGET}: GENERATED ALLOWLIST markers not found`);
  const body = `const DEMO_PATHS = ${JSON.stringify(paths, null, 2)};\n`
    + `const DEMO_ALIASES = ${JSON.stringify(aliases, null, 2)};\n`;
  return source.replace(BLOCK, (all, begin, end) => `${begin}${body}${end}`);
}

export function readLists(root = ROOT) {
  return buildAllowlist(
    readFileSync(path.join(root, SET), 'utf8'),
    readFileSync(path.join(root, CORPUS), 'utf8'),
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const list = readLists();
  const file = path.join(ROOT, TARGET);
  writeFileSync(file, renderInto(readFileSync(file, 'utf8'), list));
  console.log(`${TARGET}: ${list.paths.length} paths, ${Object.keys(list.aliases).length} alias(es)`);
}
