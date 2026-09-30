#!/usr/bin/env node
/**
 * Dead-link report (SKODA-609). Crawls every page in the demo query index plus the nav/footer
 * fragments those pages reference, and lists every in-site (root-relative or same-origin) link
 * that does not resolve on the preview. Each href first goes through the runtime link policy
 * (scripts/links.js policyHref), so the report shows what a visitor gets. Links to the live
 * source host are counted, not fetched: out-of-set by policy D-3 (b), they open in a new tab.
 *
 *   node tools/importer/check-dead-links.mjs [--base=https://main--demo--skoda-storyboard.aem.page]
 *     [--index=/en/query-index.json] [--concurrency=6] [--out=report.md]
 *
 * Exit code 1 when at least one in-site link is dead.
 */
import { writeFile } from 'node:fs/promises';
import { policyHref } from '../../scripts/links.js';

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, ...v] = a.replace(/^--/, '').split('=');
  return [k, v.join('=') || true];
}));
const BASE = (args.base || 'https://main--demo--skoda-storyboard.aem.page').replace(/\/$/, '');
const INDEX = args.index || '/en/query-index.json';
const CONCURRENCY = Number(args.concurrency) || 6;
const LIVE_HOST = /^(?:https?:)?\/\/(?:www\.)?skoda-storyboard\.com(?=[/?#]|$)/i;

export function extractHrefs(html) {
  return [...html.matchAll(/<a\b[^>]*?\bhref="([^"]*)"/gi)]
    .map((m) => m[1].replace(/&amp;/g, '&').trim())
    .filter(Boolean);
}

export function metaContent(html, name) {
  const m = html.match(new RegExp(`<meta[^>]+name="${name}"[^>]+content="([^"]*)"`, 'i'));
  return m ? m[1] : null;
}

/** Classifies an href found on `pagePath`: 'live', 'site' (with its path) or null (ignored). */
export function classify(href, base = BASE) {
  if (LIVE_HOST.test(href)) return { kind: 'live' };
  if (/^(?:mailto|tel|javascript|data):/i.test(href) || href.startsWith('#')) return null;
  let url;
  try { url = new URL(href, `${base}/`); } catch { return null; }
  if (url.origin !== new URL(base).origin) return null;
  return { kind: 'site', path: url.pathname };
}

async function pool(items, n, fn) {
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) {
      const item = items[i];
      i += 1;
      // eslint-disable-next-line no-await-in-loop
      await fn(item);
    }
  }));
}

async function get(path, init) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await fetch(`${BASE}${path}`, init);
    } catch (e) {
      if (attempt === 2) throw e;
    }
  }
  return null;
}

async function indexPaths() {
  const paths = [];
  let offset = 0;
  let total = Infinity;
  while (offset < total) {
    // eslint-disable-next-line no-await-in-loop
    const res = await get(`${INDEX}?offset=${offset}&limit=500`);
    if (!res.ok) throw new Error(`index ${INDEX}: ${res.status}`);
    // eslint-disable-next-line no-await-in-loop
    const json = await res.json();
    total = json.total;
    paths.push(...json.data.map((r) => r.path));
    offset += json.data.length || total;
  }
  return [...new Set(paths)];
}

async function main() {
  const pages = await indexPaths();
  const sources = new Map(); // in-site path -> Set(source page)
  const live = new Map(); // live path -> count
  const fragments = new Set();
  const pageErrors = [];
  const contained = new Map(); // authored in-site href the policy sends to the live site -> count

  const scan = (html, from) => {
    extractHrefs(html).forEach((authored) => {
      const policy = policyHref(authored, `${BASE}${from.split(' ')[0]}`);
      const href = policy ? policy.href : authored;
      if (policy && policy.newTab && href !== authored) {
        const key = authored.split(/[?#]/)[0];
        contained.set(key, (contained.get(key) || 0) + 1);
      }
      const c = classify(href);
      if (!c) return;
      if (c.kind === 'live') {
        const p = href.replace(LIVE_HOST, '').split(/[?#]/)[0] || '/';
        live.set(p, (live.get(p) || 0) + 1);
        return;
      }
      if (!sources.has(c.path)) sources.set(c.path, new Set());
      sources.get(c.path).add(from);
    });
  };

  await pool(pages, CONCURRENCY, async (page) => {
    const res = await get(page);
    if (!res.ok) { pageErrors.push(`${res.status} ${page}`); return; }
    const html = await res.text();
    ['nav', 'footer'].forEach((name) => {
      const meta = metaContent(html, name);
      fragments.add(meta ? new URL(meta, `${BASE}/`).pathname : `/${name}`);
    });
    scan(html, page);
  });

  await pool([...fragments], CONCURRENCY, async (frag) => {
    const res = await get(`${frag}.plain.html`);
    if (!res.ok) { pageErrors.push(`${res.status} ${frag} (fragment)`); return; }
    scan(await res.text(), `${frag} (fragment)`);
  });

  const dead = [];
  await pool([...sources.keys()], CONCURRENCY, async (path) => {
    const res = await get(path, { method: 'HEAD', redirect: 'manual' });
    if (res.status >= 400) dead.push({ status: res.status, path, from: [...sources.get(path)] });
  });
  dead.sort((a, b) => b.from.length - a.from.length || a.path.localeCompare(b.path));

  const lines = [
    '# SKODA-609 dead-link report',
    '',
    `- Base: ${BASE}`,
    `- Pages crawled: ${pages.length} (index ${INDEX}) + fragments: ${[...fragments].sort().join(', ')}`,
    `- Distinct in-site targets: ${sources.size}`,
    `- **Dead in-site targets: ${dead.length}**`,
    `- Distinct links to the live site (policy D-3 b, new tab): ${live.size}`,
    `- Authored in-site links the runtime policy sends to the live site: ${contained.size}`,
    '',
  ];
  if (pageErrors.length) lines.push('## Pages that failed to load', '', ...pageErrors.map((e) => `- ${e}`), '');
  if (dead.length) {
    lines.push('## Dead in-site links', '', '| Status | Target | Linked from (count: first 3) |', '|---|---|---|');
    dead.forEach((d) => lines.push(`| ${d.status} | \`${d.path}\` | ${d.from.length}: ${d.from.slice(0, 3).join(', ')} |`));
    lines.push('');
  }
  if (contained.size) {
    lines.push('## Contained by the runtime policy (scripts/links.js LIVE_ONLY)', '', '| Authored href | Links |', '|---|---|');
    [...contained].sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([h, n]) => lines.push(`| \`${h}\` | ${n} |`));
    lines.push('');
  }
  const report = lines.join('\n');
  if (args.out) await writeFile(args.out, `${report}\n`);
  console.log(report);
  process.exitCode = dead.length || pageErrors.length ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) main();
