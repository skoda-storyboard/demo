#!/usr/bin/env node
/*
 * import-validity.mjs: check every imported page for the three import failure patterns
 * (SKODA-603; checks in validity/validity-lib.mjs):
 *   1. page type: the importer used vs the source page's own type (and the template metadata);
 *   2. blocks: unknown / unnamed / content-named blocks, leftover source markup, icon images;
 *   3. completeness: source text, headings, images and files vs the imported page.
 *
 * Pages: everything in DA under /en, the local import output, the push records and the live
 * index. DA is the truth for what a page contains (some pages were imported elsewhere and
 * have no local copy); without DA access, a previewed page's served HTML stands in. The
 * per-page import reports and the importers' URL lists say which importer made a page.
 *
 * Stages (each cached under --cache, default .migration/validity):
 *   inventory  the page list: importer, source URL, template metadata, preview/live status
 *   fetch      each page's DA source (else its served HTML) and its source page (throttled)
 *   check      the checks → findings.json (--drift <push dry-run report>: DA drift findings)
 *   report     findings.json → findings.md (per-page table, most severe first)
 *
 *   node tools/importer/import-validity.mjs --stage inventory,fetch,check,report
 *   … [--cache DIR] [--content-dir DIR] [--reports DIR] [--only /en/press-kits] [--refetch]
 *   … [--drift tools/importer/reports/push/<run>-dry.json]
 *
 * Read-only against DA, admin and the source site.
 */

import {
  readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import {
  sourceType, pageTypeFindings, blockFindings, sourceRegion, contentFacts, compareFacts,
  completenessFindings, sourceIcons, worst, bySeverity,
} from './validity/validity-lib.mjs';

const { JSDOM } = createRequire(import.meta.url)('jsdom');
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const ORG = 'skoda-storyboard';
const REPO = 'demo';
const SOURCE = 'https://www.skoda-storyboard.com';
const LIVE = `https://main--${REPO}--${ORG}.aem.live`;
const PREVIEW = `https://main--${REPO}--${ORG}.aem.page`;
const GAP_MS = 150; // admin / DA
const SOURCE_GAP_MS = 300; // the source site: gentle

function parseArgs(argv) {
  const a = {
    stages: new Set(['inventory', 'fetch', 'check', 'report']),
    cache: path.join(ROOT, '.migration', 'validity'),
    content: path.join(ROOT, 'content'),
    // the import runner's per-page reports (untracked, so not in a fresh checkout)
    reports: path.join(ROOT, 'tools', 'importer', 'reports'),
    only: '',
    drift: '',
    refetch: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const k = argv[i];
    const v = () => { i += 1; return argv[i]; };
    if (k === '--stage') a.stages = new Set(v().split(','));
    else if (k === '--cache') a.cache = path.resolve(v());
    else if (k === '--content-dir') a.content = path.resolve(v());
    else if (k === '--reports') a.reports = path.resolve(v());
    else if (k === '--only') a.only = v();
    else if (k === '--drift') a.drift = path.resolve(v());
    else if (k === '--refetch') a.refetch = true;
    else throw new Error(`unknown flag ${k}`);
  }
  return a;
}

const sleep = (ms) => new Promise((r) => { setTimeout(r, ms); });
const readJson = (f, fallback) => (existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : fallback);
const writeJson = (f, data) => {
  mkdirSync(path.dirname(f), { recursive: true });
  writeFileSync(f, `${JSON.stringify(data, null, 2)}\n`);
};
const writeText = (f, text) => {
  mkdirSync(path.dirname(f), { recursive: true });
  writeFileSync(f, text);
};

async function get(url, { retries = 2, ...opts } = {}) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const res = await fetch(url, { redirect: 'follow', ...opts });
      if (res.status >= 500 && attempt < retries) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (e) {
      if (attempt >= retries) throw e;
      // eslint-disable-next-line no-await-in-loop
      await sleep(1000 * (attempt + 1));
    }
  }
}

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  readdirSync(dir).forEach((name) => {
    const f = path.join(dir, name);
    if (statSync(f).isDirectory()) walk(f, out);
    else out.push(f);
  });
  return out;
}

const toPath = (url) => {
  try {
    return new URL(url).pathname.replace(/\/$/, '').replace(/\.html?$/, '') || '/';
  } catch { return ''; }
};

/** Importer names (import-<name>.js), longest first, to read urls-<name>[-suffix].txt. */
function importerNames() {
  return readdirSync(path.join(ROOT, 'tools', 'importer'))
    .map((f) => (f.match(/^import-(.+)\.js$/) || [])[1]).filter(Boolean)
    .sort((x, y) => y.length - x.length);
}

async function daWalk(folder, out) {
  await sleep(GAP_MS);
  const res = await get(`https://admin.da.live/list/${ORG}/${REPO}${folder}`);
  if (!res.ok) throw new Error(`DA list ${folder}: HTTP ${res.status}`);
  const items = await res.json();
  for (const it of items) {
    const p = it.path.replace(`/${ORG}/${REPO}`, '');
    if (it.ext === 'html') out.push(p.replace(/\.html$/, ''));
    // eslint-disable-next-line no-await-in-loop
    else if (!it.ext) await daWalk(p, out);
  }
  return out;
}

// --- inventory ----------------------------------------------------------------------------

/**
 * The importer that produced each page: its per-page import report, else the importer's URL
 * list (urls-<importer>[-suffix].txt). Offline, so a cached inventory can be refreshed.
 */
function attachImporters(a, list) {
  const pages = new Map(list.map((pg) => [pg.path, pg]));
  walk(path.join(a.reports, 'en')).filter((f) => f.endsWith('.report.json')).forEach((f) => {
    const r = readJson(f, {});
    const pg = pages.get(`/${r.path || path.relative(a.reports, f).replace(/\.report\.json$/, '')}`);
    if (pg && r.template) Object.assign(pg, { importer: r.template, importerFrom: 'report', source: r.url || pg.source });
  });
  const names = importerNames();
  readdirSync(path.join(ROOT, 'tools', 'importer')).filter((f) => /^urls-.+\.txt$/.test(f)).forEach((f) => {
    const stem = f.replace(/^urls-|\.txt$/g, '');
    const importer = names.find((n) => stem === n || stem.startsWith(`${n}-`));
    readFileSync(path.join(ROOT, 'tools', 'importer', f), 'utf8').split(/\r?\n/)
      .map((l) => l.replace(/#.*$/, '').trim()).filter((l) => /^https?:/.test(l))
      .forEach((url) => {
        const pg = pages.get(toPath(url));
        if (!pg) return;
        pg.source = pg.source && pg.importerFrom === 'report' ? pg.source : url;
        if (pg.importerFrom !== 'report' && importer) Object.assign(pg, { importer, importerFrom: f });
      });
  });
  return list;
}

async function inventory(a) {
  const pages = new Map();
  const page = (p) => {
    if (!pages.has(p)) pages.set(p, { path: p, in: {} });
    return pages.get(p);
  };
  (await daWalk('/en', [])).forEach((p) => { page(p).in.da = true; });
  walk(path.join(a.content, 'en')).filter((f) => f.endsWith('.plain.html')).forEach((f) => {
    page(`/${path.relative(a.content, f).replace(/\.plain\.html$/, '')}`).in.local = true;
  });
  const manifest = readJson(path.join(ROOT, 'tools', 'importer', 'push', 'push-manifest.json'), { pages: {} });
  Object.keys(manifest.pages || {}).filter((p) => p.startsWith('/en')).forEach((p) => { page(p).in.pushed = true; });
  const index = await (await get(`${LIVE}/en/query-index.json?limit=5000&cb=${Date.now()}`)).json();
  (index.data || []).forEach((row) => {
    Object.assign(page(row.path), { templateMeta: row.template || '', title: row.title || '' });
    page(row.path).in.index = true;
  });
  // /en content pages only: not fragments, nav/footer docs or sheets
  const list = [...pages.values()]
    .filter((pg) => pg.path.startsWith('/en') && !/\/(fragments|nav|footer)(\/|$)|\/(metadata|placeholders)$/.test(pg.path))
    .filter((pg) => !a.only || pg.path.startsWith(a.only))
    .map((pg) => ({ ...pg, source: `${SOURCE}${pg.path}/` }))
    .sort((x, y) => x.path.localeCompare(y.path));
  attachImporters(a, list);
  for (const pg of list) {
    // eslint-disable-next-line no-await-in-loop
    await sleep(GAP_MS);
    // eslint-disable-next-line no-await-in-loop
    const res = await get(`https://admin.hlx.page/status/${ORG}/${REPO}/main${pg.path}`).catch(() => null);
    // eslint-disable-next-line no-await-in-loop
    const j = res && res.ok ? await res.json() : {};
    pg.preview = j.preview?.status || 0;
    pg.live = j.live?.status || 0;
  }
  writeJson(path.join(a.cache, 'inventory.json'), list);
  console.log(`[validity] inventory: ${list.length} pages (${list.filter((p) => p.in.da).length} in DA, ${list.filter((p) => p.in.local).length} local, ${list.filter((p) => p.importer).length} with a known importer)`);
  return list;
}

// --- fetch --------------------------------------------------------------------------------
const cached = (a, kind, p) => path.join(a.cache, kind, `${p.replace(/^\//, '')}.html`);

async function fetchAll(a, list) {
  let n = 0;
  let daDenied = false; // DA refused (no credentials): stop asking, use the served HTML
  for (const pg of list) {
    const daFile = cached(a, 'da', pg.path);
    if (pg.in.da && !daDenied && (a.refetch || !existsSync(daFile))) {
      // eslint-disable-next-line no-await-in-loop
      await sleep(GAP_MS);
      // eslint-disable-next-line no-await-in-loop
      const res = await get(`https://admin.da.live/source/${ORG}/${REPO}${pg.path}.html`);
      if (res.status === 401 || res.status === 403) {
        daDenied = true;
        console.warn(`[validity] DA refused (${res.status}): using the served preview HTML instead`);
      // eslint-disable-next-line no-await-in-loop
      } else if (res.ok) writeText(daFile, await res.text());
    }
    const servedFile = cached(a, 'served', pg.path);
    if (!existsSync(daFile) && pg.preview === 200 && (a.refetch || !existsSync(servedFile))) {
      // eslint-disable-next-line no-await-in-loop
      await sleep(GAP_MS);
      // eslint-disable-next-line no-await-in-loop
      const res = await get(`${PREVIEW}${pg.path}.plain.html`);
      // eslint-disable-next-line no-await-in-loop
      if (res.ok) writeText(servedFile, `<body><main>${await res.text()}</main></body>`);
    }
    const srcFile = cached(a, 'src', pg.path);
    if (a.refetch || !existsSync(`${srcFile}.json`)) {
      // eslint-disable-next-line no-await-in-loop
      await sleep(SOURCE_GAP_MS);
      // eslint-disable-next-line no-await-in-loop
      const res = await get(pg.source, { headers: { 'user-agent': 'Mozilla/5.0 (validity check)' } })
        .catch(() => ({ ok: false, status: 0, url: pg.source }));
      // eslint-disable-next-line no-await-in-loop
      writeText(srcFile, res.ok ? await res.text() : '');
      writeJson(`${srcFile}.json`, { status: res.status, finalUrl: res.url, redirected: toPath(res.url || pg.source) !== toPath(pg.source) });
    }
    n += 1;
    if (n % 25 === 0) console.log(`[validity] fetched ${n}/${list.length}`);
  }
}

// --- check --------------------------------------------------------------------------------
function presenceFindings(pg, drift) {
  const out = [];
  if (!pg.in.da) {
    out.push({ check: 'not-in-da', severity: pg.in.local ? 'low' : 'medium', detail: pg.in.local ? 'imported locally, never pushed' : 'only in the index or push records' });
  }
  if (pg.in.da && !pg.in.local && !pg.importer) {
    out.push({ check: 'no-import-record', severity: 'low', detail: 'in DA with no local import or report (imported elsewhere or by hand)' });
  }
  const d = drift[pg.path];
  if (d && /DA changed|no push record/.test(d.reason || '')) out.push({ check: 'da-drift', severity: 'medium', detail: d.reason });
  if (d && /local changed/.test(d.reason || '')) out.push({ check: 'unpushed-change', severity: 'low', detail: 'the local import differs from DA (not pushed)' });
  if (pg.in.da && pg.preview !== 200) out.push({ check: 'not-previewed', severity: 'low', detail: `preview ${pg.preview || 'none'}` });
  return out;
}

function checkPage(a, pg, { codeBlocks, drift }) {
  const findings = presenceFindings(pg, drift);
  const srcFile = cached(a, 'src', pg.path);
  const meta = readJson(`${srcFile}.json`, {});
  const srcHtml = existsSync(srcFile) ? readFileSync(srcFile, 'utf8') : '';
  const daFile = cached(a, 'da', pg.path);
  const servedFile = cached(a, 'served', pg.path);
  let contentFrom = '';
  if (existsSync(daFile)) contentFrom = 'da';
  else if (existsSync(servedFile)) contentFrom = 'served';
  if (!srcHtml) {
    findings.push({ check: 'source-unavailable', severity: 'low', detail: `source ${meta.status || 'error'}` });
    return { ...pg, type: 'unknown', contentFrom, findings, severity: worst(findings) };
  }
  // each page's windows are closed once checked: 2 × 372 full pages don't fit in memory
  const srcDom = new JSDOM(srcHtml);
  const src = srcDom.window.document;
  const { type, markers } = sourceType(src);
  if (meta.redirected) findings.push({ check: 'source-redirects', severity: 'low', detail: `the source redirects to ${toPath(meta.finalUrl)} (an alias?)` });
  findings.push(...pageTypeFindings({ type, importer: pg.importer, templateMeta: pg.templateMeta }));
  let cmp = null;
  if (contentFrom) {
    const impDom = new JSDOM(readFileSync(contentFrom === 'da' ? daFile : servedFile, 'utf8'));
    const imp = impDom.window.document;
    findings.push(...blockFindings(imp, codeBlocks, { icons: sourceIcons(src) }));
    const region = sourceRegion(src, type);
    if (region) {
      cmp = compareFacts(contentFacts(region), contentFacts(imp.querySelector('main') || imp.body));
      findings.push(...completenessFindings(cmp));
    }
    impDom.window.close();
  }
  srcDom.window.close();
  findings.sort(bySeverity);
  return {
    ...pg,
    type,
    markers,
    contentFrom,
    coverage: cmp ? Number(cmp.coverage.toFixed(3)) : null,
    imageRatio: cmp ? Number(cmp.imageRatio.toFixed(3)) : null,
    missing: cmp ? {
      blocks: cmp.missingBlocks.slice(0, 5),
      headings: cmp.missingHeadings.slice(0, 5),
      images: cmp.missingImages.slice(0, 8),
      files: cmp.missingFiles,
    } : null,
    findings,
    severity: worst(findings),
  };
}

function check(a, list) {
  const codeBlocks = new Set(readdirSync(path.join(ROOT, 'blocks'))
    .filter((d) => statSync(path.join(ROOT, 'blocks', d)).isDirectory()));
  const drift = a.drift
    ? Object.fromEntries((readJson(a.drift, { pages: [] }).pages || []).map((p) => [p.path, p]))
    : {};
  const results = list.map((pg) => checkPage(a, pg, { codeBlocks, drift }));
  writeJson(path.join(a.cache, 'findings.json'), results);
  const count = (s) => results.filter((r) => r.severity === s).length;
  console.log(`[validity] checked ${results.length}: high ${count('high')} · medium ${count('medium')} · low ${count('low')} · clean ${count('none')}`);
  return results;
}

// --- report -------------------------------------------------------------------------------
function report(a, results) {
  const esc = (s) => String(s ?? '').replace(/\|/g, '\\|');
  const rows = results.filter((r) => r.findings.length)
    .sort((x, y) => bySeverity(x, y) || x.path.localeCompare(y.path));
  const byCheck = {};
  results.forEach((r) => r.findings.forEach((f) => { byCheck[f.check] = (byCheck[f.check] || 0) + 1; }));
  const pct = (r) => (r.coverage == null ? '–' : `${Math.round(r.coverage * 100)}%`);
  const out = [
    `# Import validity: per-page findings (generated ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC)`, '',
    `${results.length} pages checked · ${rows.length} with findings.`, '',
    '| Check | Pages |', '|---|--:|',
    ...Object.entries(byCheck).sort((x, y) => y[1] - x[1]).map(([k, n]) => `| ${k} | ${n} |`), '',
    '| Severity | Path | Source type | Importer | Coverage | Findings |', '|---|---|---|---|--:|---|',
    ...rows.map((r) => `| ${r.severity} | \`${r.path}\` | ${r.type} | ${r.importer || '–'} | ${pct(r)} | ${esc(r.findings.map((f) => `**${f.check}**: ${f.detail}`).join('<br>'))} |`),
  ];
  writeText(path.join(a.cache, 'findings.md'), `${out.join('\n')}\n`);
  console.log(`[validity] wrote ${path.join(a.cache, 'findings.md')}`);
}

async function main() {
  const a = parseArgs(process.argv.slice(2));
  let list = a.stages.has('inventory') ? await inventory(a)
    : attachImporters(a, readJson(path.join(a.cache, 'inventory.json'), []));
  if (a.only) list = list.filter((pg) => pg.path.startsWith(a.only));
  if (a.stages.has('fetch')) await fetchAll(a, list);
  const results = a.stages.has('check') ? check(a, list) : readJson(path.join(a.cache, 'findings.json'), []);
  if (a.stages.has('report')) report(a, results);
}

main().catch((e) => {
  console.error(`[validity] fatal: ${e.message}`);
  process.exitCode = 1;
});
