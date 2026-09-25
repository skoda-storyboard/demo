#!/usr/bin/env node
/*
 * m1-status.mjs — regenerate the SKODA-603 per-URL status tracker.
 *
 * For every page in docs/planning/skoda-m1-url-set.txt + skoda-rail-feed-corpus.txt:
 *   imported   content/<path>.plain.html exists
 *   DA         a push record in tools/importer/push/push-manifest.json
 *   previewed  admin status preview = 200   (admin.hlx.page/status, credentials injected)
 *   published  admin status live = 200
 *   indexed    the path is a row in the live /en/query-index.json
 *   blocks     the pending-block contract check (validate-blocks)
 *   QA / notes from tools/importer/push/m1-status-overrides.json
 * and writes docs/planning/skoda-m1-url-status.md. Read-only against DA/admin: no pushes,
 * no previews, no publishes.
 *
 * Usage:
 *   npm run import:status                 # full (network) run
 *   npm run import:status -- --offline    # local facts only (preview/live/index = ?)
 *   … [--content-dir content] [--ref main] [--out <file>]
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchWithRetry } from './media/media-lib.mjs';
import { checkPage } from './push/block-check.mjs';
import { loadContracts } from './validate-blocks.mjs';
import {
  parseSectionedList, mergeLists, buildRow, renderTracker,
} from './push/m1-status-lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const PLANNING = path.join(ROOT, 'docs', 'planning');
const ADMIN = 'https://admin.hlx.page';
const ADMIN_GAP_MS = 120; // stay under the 10 req/s admin limit

function parseArgs(argv) {
  const a = {
    offline: false,
    contentDir: 'content',
    org: 'skoda-storyboard',
    repo: 'demo',
    ref: 'main',
    out: path.join(PLANNING, 'skoda-m1-url-status.md'),
  };
  for (let i = 0; i < argv.length; i += 1) {
    const k = argv[i];
    const v = () => { i += 1; return argv[i]; };
    if (k === '--offline') a.offline = true;
    else if (k === '--content-dir') a.contentDir = v();
    else if (k === '--ref') a.ref = v();
    else if (k === '--out') a.out = v();
    else throw new Error(`unknown flag ${k}`);
  }
  return a;
}

const sleep = (ms) => new Promise((r) => { setTimeout(r, ms); });

async function adminStatus(a, p) {
  await sleep(ADMIN_GAP_MS);
  const res = await fetchWithRetry(`${ADMIN}/status/${a.org}/${a.repo}/${a.ref}${p}`);
  if (!res.ok) return { preview: res.status, live: res.status };
  const j = await res.json();
  return {
    preview: (j.preview && j.preview.status) || 404,
    live: (j.live && j.live.status) || 404,
  };
}

async function liveIndex(a) {
  const res = await fetchWithRetry(`https://${a.ref}--${a.repo}--${a.org}.aem.live/en/query-index.json?limit=5000&cb=${Date.now()}`);
  if (!res.ok) return null;
  return ((await res.json()).data || []).map((row) => row.path);
}

async function main() {
  const a = parseArgs(process.argv.slice(2));
  const read = (f) => readFileSync(path.join(PLANNING, f), 'utf8');
  const rows = mergeLists(
    parseSectionedList(read('skoda-m1-url-set.txt')),
    parseSectionedList(read('skoda-rail-feed-corpus.txt')),
  );
  const manifestFile = path.join(HERE, 'push', 'push-manifest.json');
  const manifest = existsSync(manifestFile) ? JSON.parse(readFileSync(manifestFile, 'utf8')).pages || {} : {};
  const overrides = JSON.parse(readFileSync(path.join(HERE, 'push', 'm1-status-overrides.json'), 'utf8'));
  const { contracts, codeBlocks, registry } = loadContracts();
  registry.forEach((p) => console.log(`[status] ⚠ registry: ${p}`));

  const index = a.offline ? null : await liveIndex(a);
  const indexSet = new Set(index || []);
  console.log(`[status] ${rows.length} rows · ${a.offline ? 'offline' : `index ${index ? index.length : '?'} rows`}`);

  const built = [];
  for (const row of rows) {
    const file = path.join(a.contentDir, `${row.path}.plain.html`);
    const local = !row.unmapped && existsSync(file);
    const st = a.offline || row.alias || row.unmapped ? {} : await adminStatus(a, row.path);
    const o = (overrides.pages || {})[row.path] || {};
    built.push(buildRow(row, {
      local,
      da: !!manifest[row.path],
      preview: st.preview,
      live: st.live,
      indexed: index ? indexSet.has(row.path) : undefined,
      check: local ? checkPage(readFileSync(file, 'utf8'), contracts, codeBlocks) : null,
      qa: o.qa,
      note: o.note,
    }));
  }

  const pages = built.filter((r) => !r.alias);
  const md = renderTracker(built, {
    generated: `${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`,
    ref: a.ref,
    mode: a.offline ? 'offline: preview/live/index not checked' : 'live check',
    families: overrides.families,
    index: index ? {
      rows: index.length,
      expected: pages.length,
      present: pages.filter((r) => indexSet.has(r.path)).length,
    } : null,
  });
  writeFileSync(a.out, md);
  const c = (k) => pages.filter((r) => r.done[k]).length;
  console.log(`[status] ${pages.length} pages · imported ${c('imported')} · previewed ${c('previewed')} · published ${c('published')} · indexed ${c('indexed')} · QA ${c('qa')} · block errors ${c('blockErrors')}`);
  console.log(`[status] wrote ${path.relative(process.cwd(), a.out)}`);
}

main().catch((e) => {
  console.error(`[status] fatal: ${e.message}`);
  process.exitCode = 1;
});
