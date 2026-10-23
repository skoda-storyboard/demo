#!/usr/bin/env node
/*
 * build-media-shards.mjs — SKODA-517: split the published media feed into the shards the
 * listing, the rails and the image links read (media-shards.mjs), write them, and on --push
 * publish them: every shard of the build first (under /en/media-feed/<build>/), the registry
 * /en/media-feed/index.json last, so a failed run leaves the previous build live.
 *
 *   npm run media-items:shards -- [--feed <file|url>] [--out <dir>] [--dry-run] [--push]
 *
 * --feed: the published feed (default: the live /en/media-feed.json, with its AEM Assets and
 *         Media Bus URLs: the shards must carry the same rows the whole feed serves)
 * --out:  where the sheets are written (default: content/)
 * Run it after every media-items:build --push (the feed changed); the same feed gives the same
 * build id, so a re-run publishes nothing new under another name.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildShards, REGISTRY, cells } from './media-shards.mjs';
import { uploadToDA } from '../media/media-lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const ORG = 'skoda-storyboard';
const REPO = 'demo';
const LIVE_FEED = `https://main--${REPO}--${ORG}.aem.live/en/media-feed.json`;
const CONCURRENCY = 4;

function parseArgs(argv) {
  const a = {
    feed: LIVE_FEED, out: path.join(ROOT, 'content'), dryRun: false, push: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const k = argv[i];
    const v = () => { i += 1; return argv[i]; };
    if (k === '--feed') a.feed = v();
    else if (k === '--out') a.out = path.resolve(v());
    else if (k === '--dry-run') a.dryRun = true;
    else if (k === '--push') a.push = true;
    else throw new Error(`unknown flag ${k}`);
  }
  return a;
}

/** The feed's rows: a sheet file, or a published sheet read page by page. */
async function readFeed(src) {
  if (!/^https?:/.test(src)) return JSON.parse(readFileSync(path.resolve(src), 'utf8'));
  const data = [];
  for (let offset = 0; ;) {
    const u = new URL(src);
    u.searchParams.set('offset', String(offset));
    u.searchParams.set('limit', '1000');
    u.searchParams.set('ck', String(Date.now()));
    // eslint-disable-next-line no-await-in-loop
    const res = await fetch(u, { cache: 'no-store' });
    if (!res.ok) throw new Error(`${u.pathname} ${res.status}`);
    // eslint-disable-next-line no-await-in-loop
    const page = await res.json();
    data.push(...(page.data || []));
    offset += (page.data || []).length;
    if (!page.data?.length || offset >= Number(page.total)) break;
  }
  return { data };
}

/** Upload one sheet to DA, then preview and publish it (credentials are injected). */
async function publishSheet(url, sheet) {
  const res = await uploadToDA({
    org: ORG, repo: REPO, daPath: url, buffer: Buffer.from(JSON.stringify(sheet)), contentType: 'application/json',
  });
  if (!res.ok) throw new Error(`DA upload ${url} ${res.status}: ${String(res.body).slice(0, 200)}`);
  const doc = url.replace(/^\//, '');
  for (const stage of ['preview', 'live']) {
    // eslint-disable-next-line no-await-in-loop
    const r = await fetch(`https://admin.hlx.page/${stage}/${ORG}/${REPO}/main/${doc}`, { method: 'POST' });
    // eslint-disable-next-line no-await-in-loop
    if (!r.ok) throw new Error(`${stage} ${url} ${r.status} ${await r.text()}`);
  }
}

async function inPool(items, fn, limit = CONCURRENCY) {
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const item = items[next];
      next += 1;
      // eslint-disable-next-line no-await-in-loop
      await fn(item);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
}

export async function main(argv = process.argv.slice(2)) {
  const a = parseArgs(argv);
  const feed = await readFeed(a.feed);
  const { build, registry, files } = buildShards(feed);
  const byKind = {};
  registry.data.forEach((r) => {
    const sheet = files.get(r.url);
    const k = byKind[r.kind] || { sheets: 0, rows: 0, bytes: 0, maxCells: 0 };
    k.sheets += 1;
    k.rows += Number(r.rows);
    k.bytes += JSON.stringify(sheet).length;
    k.maxCells = Math.max(k.maxCells, cells(sheet.data));
    byKind[r.kind] = k;
  });
  const summary = {
    build, feedRows: feed.data.length, shards: files.size, byKind,
  };
  console.log(JSON.stringify(summary, null, 1));
  if (a.dryRun) return summary;

  const write = (url, sheet) => {
    const file = path.join(a.out, url);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, `${JSON.stringify(sheet)}\n`);
  };
  files.forEach((sheet, url) => write(url, sheet));
  write(REGISTRY, registry);
  console.log(`[media-shards] wrote ${files.size} shards + the registry under ${path.join(a.out, 'en/media-feed')}`);
  if (!a.push) return summary;

  // every shard of the build first; the registry last (a failed run leaves the old one live)
  let done = 0;
  await inPool([...files.entries()], async ([url, sheet]) => {
    await publishSheet(url, sheet);
    done += 1;
    if (!(done % 20)) console.log(`[media-shards] ${done}/${files.size} published`);
  });
  await publishSheet(REGISTRY, registry);
  console.log(`[media-shards] published ${files.size} shards, then the registry ${REGISTRY} (build ${build})`);
  return summary;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(`[media-shards] ${e.message}`); process.exit(1); });
}
