#!/usr/bin/env node
/*
 * validate-blocks.mjs — pending-block import contract gate (SKODA-603).
 *
 * Run after an import and before `npm run import:push`. For each page's `.plain.html`,
 * every block must be on `main` (blocks/<name>/ exists, variants supported) or a pinned
 * entry in the pending registry; config tables may only use known keys. Pages whose
 * pending blocks all have a readable fallback are marked publishable.
 *
 * Usage:
 *   npm run import:validate-blocks -- --urls docs/planning/skoda-m1-url-set.txt
 *   npm run import:validate-blocks -- content/en/skoda-model/peaq.plain.html [more…]
 *   … [--content-dir content] [--json]
 *
 * Registry: tools/importer/push/block-contracts.json + the doc it names
 * (docs/planning/SKODA-PENDING-BLOCK-CONTRACTS.md). Exit 1 on any error, a missing page
 * or a registry self-check failure.
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseList } from './push/push-lib.mjs';
import { checkPage, registryProblems } from './push/block-check.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
export const REGISTRY = path.join(HERE, 'push', 'block-contracts.json');

/** Load the registry + the block folders on this checkout. */
export function loadContracts() {
  const contracts = JSON.parse(readFileSync(REGISTRY, 'utf8'));
  const codeBlocks = new Set(readdirSync(path.join(ROOT, 'blocks'), { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(path.join(ROOT, 'blocks', d.name, `${d.name}.js`)))
    .map((d) => d.name));
  const docFile = path.join(ROOT, contracts.doc);
  const doc = existsSync(docFile) ? readFileSync(docFile, 'utf8') : '';
  return { contracts, codeBlocks, registry: doc ? registryProblems(contracts, doc) : [`missing ${contracts.doc}`] };
}

function parseArgs(argv) {
  const a = { contentDir: 'content', files: [], json: false };
  for (let i = 0; i < argv.length; i += 1) {
    const k = argv[i];
    if (k === '--urls' || k === '--paths') { i += 1; a.list = argv[i]; } else if (k === '--content-dir') { i += 1; a.contentDir = argv[i]; } else if (k === '--json') a.json = true;
    else if (k.startsWith('--')) throw new Error(`unknown flag ${k}`);
    else a.files.push(k);
  }
  if (!a.list && !a.files.length) throw new Error('--urls <file> or one or more .plain.html files required');
  return a;
}

function main() {
  const a = parseArgs(process.argv.slice(2));
  const { contracts, codeBlocks, registry } = loadContracts();
  const targets = a.list
    ? parseList(readFileSync(a.list, 'utf8')).map((p) => ({ path: p, file: path.join(a.contentDir, `${p}.plain.html`) }))
    : a.files.map((f) => ({ path: f, file: f }));

  const results = targets.map((t) => {
    if (!existsSync(t.file)) return { path: t.path, missing: true };
    return { path: t.path, ...checkPage(readFileSync(t.file, 'utf8'), contracts, codeBlocks) };
  });

  if (a.json) {
    console.log(JSON.stringify({
      registry,
      pages: results.map(({ blocks, ...r }) => r),
    }, null, 2));
  } else {
    registry.forEach((p) => console.log(`✖ registry: ${p}`));
    results.forEach((r) => {
      if (r.missing) { console.log(`  · ${r.path}  not imported`); return; }
      const pend = r.pending.map((p) => `${p.id}→${p.ticket}${p.fallback === 'broken' ? '(broken)' : ''}`).join(', ');
      console.log(`  ${r.errors.length ? '✖' : '✓'} ${r.path}${pend ? `  pending: ${pend}` : ''}${r.publishable ? '' : '  [hold publish]'}`);
      r.errors.forEach((e) => console.log(`      ✖ ${e}`));
      r.warnings.forEach((w) => console.log(`      ⚠ ${w}`));
    });
    const checked = results.filter((r) => !r.missing);
    console.log(`[blocks] ${checked.length} checked · ${checked.filter((r) => r.errors.length).length} with errors · ${checked.filter((r) => !r.publishable).length} hold publish · ${results.length - checked.length} not imported`);
  }
  const failed = registry.length || results.some((r) => r.missing || (r.errors && r.errors.length));
  process.exitCode = failed ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (e) {
    console.error(`[blocks] fatal: ${e.message}`);
    process.exitCode = 1;
  }
}
