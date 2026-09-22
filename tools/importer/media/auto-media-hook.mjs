#!/usr/bin/env node
/*
 * auto-media-hook.mjs — PostToolUse(Bash) hook: after a content bulk-import
 * finishes, automatically run the media step (DELIVERY-ONLY) over the pages that
 * were just imported, and only when there are new images to process.
 *
 * Wired in .claude/settings.json:
 *   PostToolUse → matcher "Bash" → node tools/importer/media/auto-media-hook.mjs
 *
 * Behaviour:
 *  - Fires only when the Bash command invoked `run-bulk-import.js` (else no-op).
 *  - Reads the runner's stdout for `✅ Saved content to <path>` lines to learn
 *    exactly which pages this run wrote → the --pages set (scoped, not the whole site).
 *  - Runs build-media-manifest (delivery-only: NO --dam-base) then apply. Both are
 *    incremental: the manifest skips images already `done`, so if no NEW images
 *    were imported this is effectively a no-op (nothing fetched, nothing rewritten).
 *  - DAM ingest is intentionally NOT auto-run (needs a token + hits the external
 *    instance) — that stays an explicit `npm run media:build -- --dam-base …`.
 *  - Never fails the tool: any error is logged to stderr and the hook exits 0.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

function readStdin() {
  return new Promise((resolve) => {
    const chunks = [];
    process.stdin.on('data', (c) => chunks.push(c));
    process.stdin.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch { resolve({}); }
    });
    process.stdin.on('error', () => resolve({}));
  });
}

// Pull the runner's textual output from the PostToolUse payload (shape varies a
// little across harness versions — check the common fields).
function extractOutput(hook) {
  const r = hook.tool_response ?? hook.toolResponse ?? hook.tool_result ?? {};
  if (typeof r === 'string') return r;
  return [r.stdout, r.stderr, r.output, r.content, hook.output]
    .filter((s) => typeof s === 'string').join('\n');
}

async function main() {
  const hook = await readStdin();
  const command = hook?.tool_input?.command || hook?.tool_input?.cmd || '';
  // Only react to the content bulk-import runner.
  if (!/run-bulk-import\.js/.test(command)) return;

  const workspace = process.env.WORKSPACE_PATH || process.cwd();
  const output = extractOutput(hook);

  // Which pages did this run write? Parse `✅ Saved content to <relativeDocPath>`.
  const pages = [];
  const re = /Saved content to\s+(\S+)/g;
  let m;
  // eslint-disable-next-line no-cond-assign
  while ((m = re.exec(output)) !== null) {
    const rel = m[1].trim();
    const abs = path.join(workspace, 'content', `${rel}.plain.html`);
    if (existsSync(abs)) pages.push(abs);
  }
  if (pages.length === 0) return; // nothing imported (or output not parseable) → no-op

  const mediaDir = path.join(workspace, 'tools', 'importer', 'media');
  const buildJs = path.join(mediaDir, 'build-media-manifest.mjs');
  const applyJs = path.join(mediaDir, 'apply-media-manifest.mjs');
  if (!existsSync(buildJs) || !existsSync(applyJs)) return; // toolkit absent → no-op

  const manifestPath = path.join(mediaDir, 'media-manifest.json');
  const countRows = (fallback) => {
    try {
      return Object.keys(JSON.parse(readFileSync(manifestPath, 'utf8')).rows || {}).length;
    } catch {
      return fallback;
    }
  };
  const beforeRows = countRows(0);

  const run = (script) => spawnSync('node', [script, '--pages', ...pages], {
    cwd: workspace, encoding: 'utf8', timeout: 5 * 60 * 1000,
  });

  // 1. Build the manifest (delivery-only — no --dam-base). Incremental: only new
  //    images are fetched; existing `done` rows are skipped.
  const build = run(buildJs);
  const newImages = countRows(beforeRows) - beforeRows;

  // 2. Rewrite content <img> → delivery url + emit the cart resolver index.
  const apply = run(applyJs);

  // Surface a short note to the agent (stderr; never fail the tool).
  const lines = [
    '[auto-media] wired media step ran after content import',
    `  pages: ${pages.length} · new images this run: ${newImages >= 0 ? newImages : 'n/a'}`,
    build.status === 0 ? '  build: ok (delivery-only; DAM ingest stays explicit)' : `  build: exit ${build.status}`,
    apply.status === 0 ? '  apply: ok (media-bus rewrite + media-index.json)' : `  apply: exit ${apply.status}`,
    newImages > 0
      ? '  → NEW images ingested to media bus. To also store originals in the AEM DAM, run: npm run media:build -- --dam-base <host> --dam-folder /content/dam/storyboard'
      : '  → no new images; delivery rewrite is a no-op.',
  ];
  process.stderr.write(`${lines.join('\n')}\n`);
}

main().catch((err) => {
  process.stderr.write(`[auto-media] hook error (non-fatal): ${err.message}\n`);
  process.exit(0); // never fail the originating tool
});
