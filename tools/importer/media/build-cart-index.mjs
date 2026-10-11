#!/usr/bin/env node
/*
 * build-cart-index.mjs — the media cart's resolver index (SKODA-505a):
 * source link → published DAM original, for every asset the media manifest has
 * verified on the publish host (steps.publish === 'done' + public_verified).
 *
 * Usage:
 *   npm run media:cart-index [-- --manifest <file>] [--out <file>] [--check]
 *
 * --check exits 1 (writing nothing) when the committed index is stale. Re-run after
 * every manifest change that publishes assets.
 *
 * Output (compact, one entry per line for reviewable diffs):
 *   { v: 1, base: '/content/dam/storyboard/', mimes: [...],
 *     assets: [[pathBelowBase, bytes, mimeIndex], ...],   // sorted by path
 *     keys: { 'YYYY/MM/file.ext': assetIndex, ... } }     // normalizeSource() keys
 *
 * Keys come from each row's source / master / seen URLs (first-party hosts only). A
 * derivative key (`-1920x1280`) is left out when stripping it already lands on the same
 * asset (the resolver strips at lookup). A key claimed by several assets maps to the
 * first path when they are the same file (same name + bytes, e.g. a press-kit PDF filed
 * twice) and is dropped otherwise.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DAM_HOST, normalizeSource, stripDerivative, filenameOf,
} from '../../../scripts/media-cart-resolver.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const DEFAULT_MANIFEST = path.join(ROOT, 'tools', 'importer', 'media', 'media-manifest.json');
const DEFAULT_OUT = path.join(ROOT, 'scripts', 'media-cart-index.json');
export const BASE = '/content/dam/storyboard/';

const isPublished = (row) => row?.steps?.publish === 'done' && row.public_url
  && row.public_verified?.url === row.public_url && row.public_verified.bytes > 0;

export function buildCartIndex(manifest) {
  const rows = Object.values(manifest?.rows || {}).filter(isPublished);
  const byPath = new Map(); // DAM path → { bytes, mime, rows }
  rows.forEach((row) => {
    const u = new URL(row.public_url);
    if (u.origin !== DAM_HOST) throw new Error(`${row.logical_id}: publish origin ${u.origin} is not ${DAM_HOST}`);
    if (!u.pathname.startsWith(BASE)) throw new Error(`${row.logical_id}: ${u.pathname} is outside ${BASE}`);
    const entry = byPath.get(u.pathname) || { bytes: row.public_verified.bytes, mime: row.public_verified.mime || '', rows: [] };
    entry.rows.push(row);
    byPath.set(u.pathname, entry);
  });

  const paths = [...byPath.keys()].sort();
  const mimes = [...new Set(paths.map((p) => byPath.get(p).mime))].sort();
  const assets = paths.map((p) => {
    const { bytes, mime } = byPath.get(p);
    return [p.slice(BASE.length), bytes, mimes.indexOf(mime)];
  });

  const claims = new Map(); // key → Set(asset index)
  paths.forEach((p, i) => {
    byPath.get(p).rows.forEach((row) => {
      [row.source_url, row.master_url, row.dam_original_url, ...(row.seen_urls || [])]
        .map(normalizeSource).filter(Boolean)
        .forEach((key) => claims.set(key, (claims.get(key) || new Set()).add(i)));
    });
  });

  const same = (a, b) => assets[a][1] === assets[b][1]
    && filenameOf(paths[a]) === filenameOf(paths[b]);
  const stats = { assets: assets.length, duplicates: 0, dropped: [] };
  const exact = new Map();
  claims.forEach((set, key) => {
    const [first, ...rest] = [...set].sort((a, b) => a - b);
    if (rest.every((i) => same(first, i))) {
      exact.set(key, first);
      if (rest.length) stats.duplicates += 1;
    } else stats.dropped.push(key);
  });

  const keys = {};
  [...exact.keys()].sort().forEach((key) => {
    const i = exact.get(key);
    const stripped = stripDerivative(key);
    if (stripped !== key && exact.get(stripped) === i) return;
    keys[key] = i;
  });
  stats.keys = Object.keys(keys).length;
  return {
    index: {
      v: 1, base: BASE, mimes, assets, keys,
    },
    stats,
  };
}

export function serialize(index) {
  const assets = index.assets.map((a) => JSON.stringify(a)).join(',\n');
  const keys = Object.entries(index.keys).map(([k, i]) => `${JSON.stringify(k)}:${i}`).join(',\n');
  return `{"v":${index.v},"base":${JSON.stringify(index.base)},"mimes":${JSON.stringify(index.mimes)},\n"assets":[\n${assets}\n],\n"keys":{\n${keys}\n}}\n`;
}

function parseArgs(argv) {
  const out = { manifest: DEFAULT_MANIFEST, out: DEFAULT_OUT, check: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--check') out.check = true;
    else if (a === '--manifest' || a === '--out') {
      if (!argv[i + 1]) throw new Error(`${a} needs a file`);
      out[a.slice(2)] = path.resolve(argv[i + 1]);
      i += 1;
    } else throw new Error(`Unexpected argument: ${a}`);
  }
  return out;
}

function main() {
  const cfg = parseArgs(process.argv.slice(2));
  if (!existsSync(cfg.manifest)) throw new Error(`Manifest not found: ${cfg.manifest}`);
  const { index, stats } = buildCartIndex(JSON.parse(readFileSync(cfg.manifest, 'utf8')));
  const text = serialize(index);
  const rel = path.relative(process.cwd(), cfg.out);
  if (cfg.check) {
    const current = existsSync(cfg.out) ? readFileSync(cfg.out, 'utf8') : '';
    if (current !== text) {
      console.error(`${rel} is stale: run npm run media:cart-index`);
      process.exitCode = 1;
      return;
    }
    console.log(`${rel} is up to date (${stats.assets} assets, ${stats.keys} keys)`);
    return;
  }
  writeFileSync(cfg.out, text);
  console.log(`${rel}: ${stats.assets} assets, ${stats.keys} keys, ${stats.duplicates} keys on duplicate files, ${stats.dropped.length} ambiguous keys dropped, ${text.length} bytes`);
  stats.dropped.forEach((key) => console.log(`  dropped ${key}`));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  }
}
