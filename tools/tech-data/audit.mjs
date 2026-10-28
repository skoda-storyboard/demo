#!/usr/bin/env node
/*
 * Technical-data audit (SKODA-852): run the Tech data check over published pages.
 *
 *   npm run tech-data:audit -- [--host <origin>] [--sheet <file|url>] [--sitemap <prefix>]
 *     [--json] [paths…]
 *
 * Defaults: the live demo host, the sheet served from that host, and every page the sheet's
 * `models` tab lists. `--sitemap /en/skoda-model/` adds every sitemap page under that prefix.
 * Read-only. Exit code 1 when any page has an Issue.
 */
/* eslint-disable no-console */
import fs from 'node:fs';
import { parseArgs } from 'node:util';
import { runChecks } from './checks.js';
import { TECH_DATA_SHEET, normalizePath, readSheet } from './tech-data.js';

const DEFAULT_HOST = 'https://main--demo--skoda-storyboard.aem.live';
const LABELS = { pass: 'Pass', warn: 'Review', fail: 'Issue' };

async function fetchText(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`${url}: HTTP ${resp.status}`);
  return resp.text();
}

async function loadSheet(source, host) {
  const target = source || `${host}${TECH_DATA_SHEET}`;
  const text = /^https?:/.test(target) ? await fetchText(target) : fs.readFileSync(target, 'utf8');
  return readSheet(JSON.parse(text));
}

async function sitemapPaths(host, prefix) {
  const xml = await fetchText(`${host}/sitemap.xml`);
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => normalizePath(new URL(m[1]).pathname))
    .filter((p) => p.startsWith(prefix));
}

async function main() {
  const { values: opts, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      host: { type: 'string', default: DEFAULT_HOST },
      sheet: { type: 'string' },
      sitemap: { type: 'string' },
      json: { type: 'boolean', default: false },
    },
  });
  const host = opts.host.replace(/\/+$/, '');
  const sheet = await loadSheet(opts.sheet, host);
  const listed = sheet.models.flatMap((m) => m.pages);
  const fromSitemap = opts.sitemap ? await sitemapPaths(host, opts.sitemap) : [];
  const requested = positionals.length ? positionals : [...listed, ...fromSitemap];
  const paths = [...new Set(requested.map(normalizePath))];

  const auditPage = async (path) => {
    try {
      const html = await fetchText(`${host}${path}.plain.html`);
      return { path, results: runChecks({ html, path, sheet }) };
    } catch (e) {
      return { path, error: e.message };
    }
  };
  // one page at a time: a few dozen small requests, no need to fan out
  const report = [];
  await paths.reduce((previous, path) => previous.then(async () => {
    report.push(await auditPage(path));
  }), Promise.resolve());

  if (opts.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    report.forEach(({ path, results, error }) => {
      if (error) {
        console.log(`\n${path}\n  ERROR ${error}`);
        return;
      }
      const open = results.filter((r) => r.status !== 'pass');
      console.log(`\n${path}${open.length ? '' : '  (all pass)'}`);
      open.forEach((r) => {
        console.log(`  ${LABELS[r.status].padEnd(6)} ${r.title}: ${r.summary}`);
        r.details.forEach((d) => console.log(`         - ${d}`));
        if (r.more) console.log(`         … and ${r.more} more`);
      });
    });
  }
  const failing = report.filter((p) => p.error || p.results.some((r) => r.status === 'fail'));
  const reviewing = report.filter((p) => p.results?.some((r) => r.status === 'warn'));
  console.error(`\n${report.length} pages: ${failing.length} with an Issue or error, ${reviewing.length} with a Review.`);
  process.exitCode = failing.length ? 1 : 0;
}

await main();
