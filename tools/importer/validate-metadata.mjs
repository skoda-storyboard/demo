#!/usr/bin/env node
/*
 * validate-metadata.mjs — post-import metadata gate (SKODA-401 WS3).
 *
 * After a bulk import, checks each generated `.plain.html`'s Metadata block so a
 * mis-wired importer is CAUGHT, not shipped with a silently-empty query-index /
 * tags column. Non-fatal + loud: prints a per-page report; exits non-zero only
 * when required fields are missing/malformed so CI can gate on it.
 *
 * Usage:
 *   node tools/importer/validate-metadata.mjs content/en/skoda-model/elroq.plain.html [more…]
 *   node tools/importer/validate-metadata.mjs content/en/<dir>/*.plain.html   (shell-expanded)
 *
 * What it checks per page (the query-index contract, SKODA-METADATA-SCHEMA):
 *  - a Metadata block exists;
 *  - `template` present and one of the known enum values;
 *  - `tags` present, comma-separated, no empty tokens (the article:tag contract);
 *  - `category` present;
 *  - `publisheddate` present + ISO YYYY-MM-DD.
 * `tags`/`category`/`date` requirements are RELAXED for template=page (nav/utility
 * pages aren't indexed for rails), matching the schema's "(not indexed)" note.
 *
 * Zero-dependency: regex over the emitted plain HTML (no DOM). The importer emits
 * a predictable `<div class="metadata"><div><div>key</div><div>value</div>…`.
 */

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const WORKSPACE = process.env.WORKSPACE_PATH || process.cwd();

const TEMPLATE_ENUM = new Set([
  'story', 'skoda_model', 'skoda_series', 'press_release', 'press_kit', 'image', 'video', 'page',
]);
// Templates that don't need rail-facing facets (nav/utility/direct only).
const RAIL_EXEMPT = new Set(['page']);

/**
 * Parse the Metadata block from an imported .plain.html into a {key:value} map.
 * The block is `<div class="metadata"> <div><div>Key</div><div>Value</div></div> …`.
 * Returns null if no metadata block is present.
 */
export function parseMetadata(html) {
  const start = html.search(/<div class="metadata">/i);
  if (start === -1) return null;
  // Scope from the block open to end-of-input. The row regex below is
  // self-delimiting, so trailing nested `</div>` closers are harmless — this
  // avoids brittle balanced-tag matching on the block's closing divs.
  const scope = html.slice(start);
  const rows = {};
  const rowRe = /<div>\s*<div>([\s\S]*?)<\/div>\s*<div>([\s\S]*?)<\/div>\s*<\/div>/gi;
  let m;
  // eslint-disable-next-line no-cond-assign
  while ((m = rowRe.exec(scope)) !== null) {
    const key = m[1].replace(/<[^>]*>/g, '').trim();
    // value may contain an <img> (Image row) or an <a> — keep text/inner for checks
    const rawVal = m[2].trim();
    if (key) rows[key.toLowerCase()] = rawVal;
  }
  return rows;
}

/** Validate one metadata map; returns { ok, issues:[…], template }. */
export function validateMetadata(meta, { relaxRails = false } = {}) {
  const issues = [];
  if (!meta) return { ok: false, issues: ['no Metadata block found'], template: null };

  const template = (meta.template || '').replace(/<[^>]*>/g, '').trim();
  if (!template) issues.push('template missing');
  else if (!TEMPLATE_ENUM.has(template)) issues.push(`template "${template}" not in enum`);

  const railExempt = relaxRails || RAIL_EXEMPT.has(template);

  const category = (meta.category || '').replace(/<[^>]*>/g, '').trim();
  if (!category && !railExempt) issues.push('category missing');

  const date = (meta.publisheddate || '').replace(/<[^>]*>/g, '').trim();
  if (!railExempt) {
    if (!date) issues.push('publisheddate missing');
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) issues.push(`publisheddate "${date}" not YYYY-MM-DD`);
  }

  const tags = (meta.tags || '').replace(/<[^>]*>/g, '').trim();
  if (!railExempt) {
    if (!tags) {
      issues.push('tags missing (→ article:tag empty; query-index tags + tags-block fallback break)');
    } else if (tags.split(',').some((t) => !t.trim())) {
      issues.push(`tags "${tags}" has empty comma tokens`);
    }
  }

  return { ok: issues.length === 0, issues, template: template || null };
}

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { pages: [], relaxRails: false };
  for (const a of args) {
    if (a === '--relax-rails') { out.relaxRails = true; continue; }
    if (a.startsWith('--')) throw new Error(`Unexpected argument: ${a}`);
    out.pages.push(a);
  }
  if (out.pages.length === 0) throw new Error('Provide one or more .plain.html paths');
  return out;
}

function main() {
  const cfg = parseArgs();
  let pass = 0; let fail = 0;
  for (const page of cfg.pages) {
    const abs = path.resolve(page);
    if (!existsSync(abs)) { console.warn(`⚠️  not found: ${page}`); fail += 1; continue; }
    const meta = parseMetadata(readFileSync(abs, 'utf8'));
    const res = validateMetadata(meta, { relaxRails: cfg.relaxRails });
    const rel = path.relative(WORKSPACE, abs);
    if (res.ok) {
      pass += 1;
      console.log(`  ✓ ${rel}  [template=${res.template}]`);
    } else {
      fail += 1;
      console.error(`  ✗ ${rel}  [template=${res.template || '?'}]`);
      res.issues.forEach((i) => console.error(`      - ${i}`));
    }
  }
  console.log(`\n[metadata-gate] pass=${pass} fail=${fail}`);
  if (fail > 0) {
    console.error('[metadata-gate] FAILED — fix the importer/transformer so every indexed page emits '
      + 'template + comma-separated tags + category + ISO publisheddate (see docs/planning/SKODA-METADATA-SCHEMA.md).');
    process.exitCode = 1;
  }
}

// Only run the CLI when invoked directly (allows importing the pure fns in tests).
if (import.meta.url === `file://${process.argv[1]}`) main();
