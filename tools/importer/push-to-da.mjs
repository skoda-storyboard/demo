#!/usr/bin/env node
/*
 * push-to-da.mjs — push imported pages to Document Authoring, then bulk preview/publish
 * (SKODA-602). Replaces the ad-hoc upload loops; feeds SKODA-603 validation.
 *
 * Credentials: NONE handled here. admin.da.live / admin.hlx.page auth is injected by the
 * environment (the proxy adds it; Node fetch follows it via NODE_USE_ENV_PROXY). Never put a
 * token in this script, a flag, or the chat.
 *
 * Usage:
 *   npm run import:push -- --urls docs/planning/skoda-m1-url-set.txt            # push + preview
 *   npm run import:push -- --urls <file> --dry-run                              # plan only
 *   npm run import:push -- --urls <file> --stage publish                  # validate + publish
 *   npm run import:push -- --urls <file> --stage all --publish-fragments         # everything
 *
 * Flags:
 *   --urls <file> | --paths <file>  source URLs or page paths, one per line (# comments ok)
 *   --stage push,preview,publish | all   (default push,preview — "drafts first": the
 *                                  previewed-but-unpublished state IS the draft)
 *   --dry-run                      read DA + decide, no writes, no jobs
 *   --force                        overwrite DA documents that changed since our last push
 *   --publish-fragments            publish /nav, /footer (+ metadata overrides) if they are
 *                                  previewed but not live (a missing live /footer empties the
 *                                  footer on every .aem.live page — 2026-09-25 incident)
 *   --content-dir <dir>            importer output root (default: content)
 *   --org / --repo / --ref         default skoda-storyboard / demo / main
 *   --limit <n>                    only the first n paths
 *   --index <path>                 query index to poll after publish (default /en/query-index.json)
 *   --timeout <s>                  job + index polling timeout (default 300)
 *
 * Per page: new | unchanged | update | conflict | overwrite (see push/push-lib.mjs
 * decideAction). A conflict is never overwritten without --force.
 *
 * Output: tools/importer/reports/push/<stamp>.json (per-URL report) and
 * <stamp>-urls.txt (validated preview URLs for SKODA-603). Shared push state:
 * tools/importer/push/push-manifest.json (committed, like media-manifest.json).
 * Exit code 1 when any page conflicts, errors, or fails validation/publish.
 */

import {
  readFileSync, writeFileSync, existsSync, mkdirSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { uploadToDA, fetchWithRetry } from './media/media-lib.mjs';
import {
  parseList, wrapPage, contentHash, decideAction, PUSHING, chunk, parseJobDetails,
  fragmentPaths, imageCheck, summarize,
} from './push/push-lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MANIFEST = path.join(HERE, 'push', 'push-manifest.json');
const REPORT_DIR = path.join(HERE, 'reports', 'push');
const ADMIN = 'https://admin.hlx.page';
const DA = 'https://admin.da.live';
const BATCH = 100; // paths per bulk job
const ADMIN_GAP_MS = 120; // stay under the 10 req/s admin limit (aem.live/docs/limits)

// ---------------------------------------------------------------------------
// args
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const a = {
    stage: 'push,preview',
    contentDir: 'content',
    org: 'skoda-storyboard',
    repo: 'demo',
    ref: 'main',
    index: '/en/query-index.json',
    timeout: 300,
    dryRun: false,
    force: false,
    publishFragments: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const k = argv[i];
    const v = () => { i += 1; return argv[i]; };
    if (k === '--urls' || k === '--paths') a.list = v();
    else if (k === '--stage') a.stage = v();
    else if (k === '--content-dir') a.contentDir = v();
    else if (k === '--org') a.org = v();
    else if (k === '--repo') a.repo = v();
    else if (k === '--ref') a.ref = v();
    else if (k === '--limit') a.limit = Number(v());
    else if (k === '--index') a.index = v();
    else if (k === '--timeout') a.timeout = Number(v());
    else if (k === '--dry-run') a.dryRun = true;
    else if (k === '--force') a.force = true;
    else if (k === '--publish-fragments') a.publishFragments = true;
    else throw new Error(`unknown flag ${k}`);
  }
  if (!a.list) throw new Error('--urls <file> (or --paths <file>) is required');
  const stages = a.stage === 'all' ? ['push', 'preview', 'publish'] : a.stage.split(',').map((s) => s.trim());
  a.stages = new Set(stages);
  return a;
}

// ---------------------------------------------------------------------------
// small I/O helpers
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((r) => { setTimeout(r, ms); });
let lastAdmin = 0;
async function adminFetch(url, opts) {
  const wait = lastAdmin + ADMIN_GAP_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastAdmin = Date.now();
  return fetchWithRetry(url, opts);
}

function loadManifest() {
  if (!existsSync(MANIFEST)) return { version: 1, pages: {} };
  return JSON.parse(readFileSync(MANIFEST, 'utf8'));
}

function saveManifest(m) {
  const sorted = Object.fromEntries(Object.keys(m.pages).sort().map((k) => [k, m.pages[k]]));
  writeFileSync(MANIFEST, `${JSON.stringify({ ...m, pages: sorted }, null, 2)}\n`);
}

const hosts = ({ org, repo, ref }) => ({
  page: `https://${ref}--${repo}--${org}.aem.page`,
  live: `https://${ref}--${repo}--${org}.aem.live`,
});

/** Current DA document (text) or null when DA has none. */
async function readDA(a, p) {
  const res = await adminFetch(`${DA}/source/${a.org}/${a.repo}${p}.html`);
  if (res.status === 404) return { text: null, status: 404 };
  if (!res.ok) throw new Error(`DA read ${p}: HTTP ${res.status}`);
  return { text: await res.text(), status: res.status, lastModified: res.headers.get('last-modified') };
}

/** Start one bulk job (topic preview|live), poll to completion, return per-path results. */
async function runBulk(a, topic, paths, log) {
  const results = {};
  for (const batch of chunk(paths, BATCH)) {
    const res = await adminFetch(`${ADMIN}/${topic}/${a.org}/${a.repo}/${a.ref}/*`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ forceUpdate: false, paths: batch }),
    });
    if (res.status !== 202) {
      const err = `bulk ${topic} not scheduled: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`;
      batch.forEach((p) => { results[p] = { status: res.status, error: err }; });
      log(err);
      continue;
    }
    const job = await res.json();
    const self = job.links && job.links.self;
    log(`bulk ${topic}: ${job.job && job.job.name} (${batch.length} paths)`);
    const deadline = Date.now() + a.timeout * 1000;
    let parsed = { done: false, results: {} };
    while (!parsed.done && Date.now() < deadline) {
      await sleep(2000);
      const d = await adminFetch(`${self}/details`);
      if (d.ok) parsed = parseJobDetails(await d.json());
    }
    batch.forEach((p) => {
      results[p] = parsed.results[p] || { status: 0, error: parsed.done ? 'not in job result' : `job timeout (${parsed.state})` };
    });
  }
  return results;
}

async function adminStatus(a, p) {
  const res = await adminFetch(`${ADMIN}/status/${a.org}/${a.repo}/${a.ref}${p}`);
  if (!res.ok) return { preview: res.status, live: res.status };
  const j = await res.json();
  return {
    preview: (j.preview && j.preview.status) || 404,
    live: (j.live && j.live.status) || 404,
  };
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

async function main() {
  const a = parseArgs(process.argv.slice(2));
  const log = (...m) => console.log(...m);
  const h = hosts(a);
  const manifest = loadManifest();
  let paths = parseList(readFileSync(a.list, 'utf8'));
  if (a.limit) paths = paths.slice(0, a.limit);
  log(`[push] ${paths.length} paths · stages=${[...a.stages].join(',')}${a.dryRun ? ' · DRY RUN' : ''}${a.force ? ' · FORCE' : ''}`);

  const pages = [];
  const plains = [];

  // 1) read local + DA, decide ---------------------------------------------------------
  for (const p of paths) {
    const file = path.join(a.contentDir, `${p}.plain.html`);
    const page = { path: p, preview: `${h.page}${p}`, live: `${h.live}${p}` };
    pages.push(page);
    if (!existsSync(file)) {
      Object.assign(page, { action: 'missing-local', error: `no ${file} — run the importer first` });
      continue;
    }
    const plain = readFileSync(file, 'utf8');
    plains.push(plain);
    const doc = wrapPage(plain);
    const localHash = contentHash(doc);
    let remote;
    try {
      remote = await readDA(a, p);
    } catch (e) {
      Object.assign(page, { action: 'error', error: e.message });
      continue;
    }
    const decision = decideAction({
      localHash,
      remoteHash: remote.text == null ? null : contentHash(remote.text),
      record: manifest.pages[p],
      force: a.force,
    });
    Object.assign(page, decision, { localHash, daLastModified: remote.lastModified || null, doc });
  }

  // 2) push ------------------------------------------------------------------------------
  const now = new Date().toISOString();
  for (const page of pages) {
    if (!page.doc) continue;
    if (page.action === 'unchanged' && !a.dryRun) {
      // DA already equals local: (re)record that state. Adopts pages pushed before the
      // manifest existed and keeps older records on the current hash scheme.
      const rec = manifest.pages[page.path];
      if (!rec || rec.hash !== page.localHash) {
        manifest.pages[page.path] = {
          hash: page.localHash,
          pushedAt: (rec && rec.pushedAt) || now,
          adopted: !rec || !!rec.adopted,
        };
      }
    }
    if (!a.stages.has('push') || !PUSHING.has(page.action) || a.dryRun) continue;
    const res = await uploadToDA({
      org: a.org, repo: a.repo, daPath: `${page.path}.html`, buffer: Buffer.from(page.doc, 'utf8'), contentType: 'text/html',
    });
    page.daStatus = res.status;
    if (res.ok) manifest.pages[page.path] = { hash: page.localHash, pushedAt: now };
    else page.error = `DA push HTTP ${res.status} ${res.body.slice(0, 200)}`;
    await sleep(ADMIN_GAP_MS);
  }

  const inDA = (pg) => pg.doc && pg.action !== 'conflict' && !pg.error;

  // 3) preview + validate ------------------------------------------------------------------
  const wantPublish = a.stages.has('publish');
  if ((a.stages.has('preview') || wantPublish) && !a.dryRun) {
    const targets = pages.filter(inDA).map((pg) => pg.path);
    if (a.stages.has('preview') && targets.length) {
      const res = await runBulk(a, 'preview', targets, log);
      pages.forEach((pg) => {
        if (!res[pg.path]) return;
        pg.previewStatus = res[pg.path].status;
        if (res[pg.path].error) pg.error = `preview: ${res[pg.path].error}`;
      });
    }
    // validate on .aem.page (always before any publish)
    for (const pg of pages.filter((x) => inDA(x) && !x.error)) {
      const r = await fetchWithRetry(`${h.page}${pg.path}.plain.html?cb=${Date.now()}`);
      const body = r.ok ? await r.text() : '';
      const img = imageCheck(body);
      pg.validation = {
        plainStatus: r.status,
        images: img.images,
        selfHosted: img.selfHosted,
        external: img.external.length,
      };
      pg.valid = r.ok && img.external.length === 0;
      if (!pg.valid) pg.error = r.ok ? `${img.external.length} image(s) not moved to the media bus (oversized master? SKODA-506)` : `preview .plain.html HTTP ${r.status}`;
    }
  }

  // 4) shared fragments ------------------------------------------------------------------
  const fragments = [];
  for (const f of fragmentPaths(plains)) {
    const st = await adminStatus(a, f);
    const frag = { path: f, preview: st.preview, live: st.live };
    if (st.live !== 200 && a.publishFragments && st.preview === 200 && !a.dryRun) {
      const r = await adminFetch(`${ADMIN}/live/${a.org}/${a.repo}/${a.ref}${f}`, { method: 'POST' });
      frag.published = r.status;
      if (r.ok) frag.live = 200;
    }
    frag.ok = frag.live === 200;
    fragments.push(frag);
  }
  const fragmentsOk = fragments.every((f) => f.ok);
  fragments.filter((f) => !f.ok).forEach((f) => log(`[push] ⚠ fragment ${f.path} is not live (preview ${f.preview}, live ${f.live}) — pages will render without it on .aem.live${a.publishFragments ? '' : '; re-run with --publish-fragments'}`));

  // 5) publish ------------------------------------------------------------------------------
  if (wantPublish && !a.dryRun) {
    const ready = pages.filter((pg) => pg.valid).map((pg) => pg.path);
    if (!fragmentsOk) {
      log('[push] ✖ publish skipped: shared fragments are not live (see above)');
    } else if (ready.length) {
      const res = await runBulk(a, 'live', ready, log);
      pages.forEach((pg) => {
        if (!res[pg.path]) return;
        pg.liveStatus = res[pg.path].status;
        if (res[pg.path].error) pg.error = `publish: ${res[pg.path].error}${res[pg.path].status === 409 ? ' (409: oversized media? SKODA-506)' : ''}`;
      });
      // index + live chrome smoke test
      const published = pages.filter((pg) => pg.liveStatus === 200).map((pg) => pg.path);
      const deadline = Date.now() + a.timeout * 1000;
      let missing = new Set(published);
      while (missing.size && Date.now() < deadline) {
        const r = await fetchWithRetry(`${h.live}${a.index}?limit=5000&cb=${Date.now()}`);
        if (r.ok) {
          const rows = ((await r.json()).data || []).map((row) => row.path);
          missing = new Set([...missing].filter((p) => !rows.includes(p)));
        }
        if (missing.size) await sleep(10000);
      }
      pages.forEach((pg) => { if (pg.liveStatus === 200) pg.indexed = !missing.has(pg.path); });
      for (const f of ['/nav', '/footer']) {
        const r = await fetchWithRetry(`${h.live}${f}.plain.html?cb=${Date.now()}`);
        const frag = fragments.find((x) => x.path === f);
        if (frag) frag.liveSmoke = r.status;
      }
    }
  }

  // 6) report ------------------------------------------------------------------------------
  if (!a.dryRun) saveManifest(manifest);
  mkdirSync(REPORT_DIR, { recursive: true });
  const stamp = now.replace(/[:.]/g, '-');
  const report = {
    run: now,
    args: {
      list: a.list,
      stages: [...a.stages],
      dryRun: a.dryRun,
      force: a.force,
      publishFragments: a.publishFragments,
      ref: a.ref,
    },
    summary: summarize(pages),
    fragments,
    pages: pages.map(({ doc, localHash, ...rest }) => rest),
  };
  const reportFile = path.join(REPORT_DIR, `${stamp}${a.dryRun ? '-dry' : ''}.json`);
  writeFileSync(reportFile, `${JSON.stringify(report, null, 2)}\n`);
  const urls = pages.filter((pg) => pg.valid).map((pg) => pg.preview);
  if (urls.length) writeFileSync(path.join(REPORT_DIR, `${stamp}-urls.txt`), `${urls.join('\n')}\n`);

  pages.forEach((pg) => {
    const bits = [pg.action];
    if (pg.daStatus) bits.push(`da=${pg.daStatus}`);
    if (pg.previewStatus) bits.push(`preview=${pg.previewStatus}`);
    if (pg.validation) bits.push(`imgs=${pg.validation.selfHosted}/${pg.validation.images}`);
    if (pg.liveStatus) bits.push(`live=${pg.liveStatus}`);
    if (pg.indexed !== undefined) bits.push(pg.indexed ? 'indexed' : 'NOT indexed');
    const bad = pg.error || pg.action === 'conflict' || pg.action === 'missing-local';
    log(`  ${bad ? '✖' : '✓'} ${pg.path}  ${bits.join(' ')}${pg.reason ? `  (${pg.reason})` : ''}${pg.error ? `  — ${pg.error}` : ''}`);
  });
  log(`[push] summary ${JSON.stringify(report.summary)} · fragments ${fragmentsOk ? 'live' : 'NOT all live'}`);
  log(`[push] report ${path.relative(process.cwd(), reportFile)}`);

  const failed = pages.some((pg) => pg.error || pg.action === 'conflict' || pg.action === 'missing-local')
    || (wantPublish && !a.dryRun && !fragmentsOk);
  process.exitCode = failed ? 1 : 0;
}

main().catch((e) => {
  console.error(`[push] fatal: ${e.message}`);
  process.exitCode = 1;
});
