#!/usr/bin/env node
/*
 * Technical-data audit (SKODA-852): run the Tech data check over published pages.
 *
 *   npm run tech-data:audit -- [--host <origin>] [--sheet <file|url>] [--sitemap <prefix>]
 *     [--source page|da] [--org <org>] [--site <site>] [--json] [paths…]
 *
 * Defaults: the live demo host, the sheet served from that host, and every page the sheet's
 * `models` tab lists. `--sitemap /en/skoda-model/` adds every sitemap page under that prefix.
 * `--source da` reads the DA document source instead (unpublished drafts too; needs DA access),
 * metadata block included. For published pages the model, tags, title and description come from
 * the page's head, because .plain.html has no metadata block.
 * Read-only. Exit code 1 when any page has an Issue.
 */
/* eslint-disable no-console */
import fs from 'node:fs';
import { parseArgs } from 'node:util';
import { runChecks } from './checks.js';
import { TECH_DATA_SHEET, normalizePath, readSheet } from './tech-data.js';

const DEFAULT_HOST = 'https://main--demo--skoda-storyboard.aem.live';
const DA_SOURCE = 'https://admin.da.live/source';
const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const decodeAttr = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&amp;/g, '&');

/** A metadata block (as DA stores it) from a page head: title, description, model, tags. */
function metadataFromHead(page) {
  const meta = (attr, name) => [...page.matchAll(new RegExp(`<meta ${attr}="${name}" content="([^"]*)"`, 'g'))]
    .map((m) => decodeAttr(m[1]));
  const rows = [
    ['title', meta('property', 'og:title')[0]],
    ['description', meta('name', 'description')[0]],
    ['model', meta('name', 'model')[0]],
    ['tags', meta('property', 'article:tag').join(', ')],
  ].filter(([, value]) => value);
  const cells = rows.map(([k, v]) => `<div><div><p>${k}</p></div><div><p>${escapeHtml(v)}</p></div></div>`);
  return `<div class="metadata">${cells.join('')}</div>`;
}
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
      source: { type: 'string', default: 'page' },
      org: { type: 'string', default: 'skoda-storyboard' },
      site: { type: 'string', default: 'demo' },
      json: { type: 'boolean', default: false },
    },
  });
  const host = opts.host.replace(/\/+$/, '');
  const sheet = await loadSheet(opts.sheet, host);
  const listed = sheet.models.flatMap((m) => m.pages);
  const fromSitemap = opts.sitemap ? await sitemapPaths(host, opts.sitemap) : [];
  const requested = positionals.length ? positionals : [...listed, ...fromSitemap];
  const paths = [...new Set(requested.map(normalizePath))];

  if (!['page', 'da'].includes(opts.source)) throw new Error(`--source must be page or da, not ${opts.source}`);
  const readDocument = async (path) => {
    if (opts.source === 'da') return fetchText(`${DA_SOURCE}/${opts.org}/${opts.site}${path}.html`);
    const [plain, page] = await Promise.all([
      fetchText(`${host}${path}.plain.html`),
      fetchText(`${host}${path}`),
    ]);
    return `${plain}${metadataFromHead(page)}`;
  };
  const auditPage = async (path) => {
    try {
      const html = await readDocument(path);
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
