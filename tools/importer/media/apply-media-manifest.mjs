#!/usr/bin/env node
/*
 * apply-media-manifest.mjs — rewrite imported content <img>/<source> URLs to the
 * media-bus-deliverable url (mechanism A), and emit the cart resolver artifact
 * (mechanism B) so the media-cart can resolve an asset → its DAM original path.
 *
 * Usage:
 *   node tools/importer/media/apply-media-manifest.mjs \
 *     --pages content/en/skoda-model/elroq.plain.html [more ...] \
 *     [--manifest tools/importer/media/media-manifest.json] \
 *     [--media-index content/media-index.json] [--dry-run]
 *
 * Two outputs:
 *   1. Rewrite content <img src> → row.delivery_url, removing the source's
 *      derivative-ladder srcset. EDS ingests
 *      that absolute url into its media bus at publish (self-hosted + webp).
 *   2. Emit /media-index.json — the CART RESOLVER SEAM (mechanism B). Maps
 *      logical_id → { dam_asset_path, original_download_url, alt } so the
 *      media-cart block can resolve "download original" to the DAM asset. Today
 *      the seam is fed by this manifest; a later DM/OpenAPI swap changes only the
 *      source of these fields, not the cart (design-for-swap, post-M1 decision).
 *
 * Matching: exact source url → logical id (derivative-suffix + query stripped).
 * Unresolved image references fail the requested run before any page is written.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import {
  logicalId, isImageUrl, cleanUrl, OVERSIZE_BYTES,
} from './media-lib.mjs';

const WORKSPACE = process.env.WORKSPACE_PATH || process.cwd();
const DEFAULT_MANIFEST = path.join(WORKSPACE, 'tools', 'importer', 'media', 'media-manifest.json');
const DEFAULT_MEDIA_INDEX = path.join(WORKSPACE, 'content', 'media-index.json');
const DEFERRED = Symbol('oversized image deferred to import:push media gate');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {
    pages: [], manifest: DEFAULT_MANIFEST, mediaIndex: DEFAULT_MEDIA_INDEX, dryRun: false,
  };
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === '--dry-run') { out.dryRun = true; continue; }
    if (a === '--pages') {
      while (args[i + 1] && !args[i + 1].startsWith('--')) { out.pages.push(args[i + 1]); i += 1; }
      continue;
    }
    if (a === '--manifest') { out.manifest = path.resolve(args[i + 1]); i += 1; continue; }
    if (a === '--media-index') { out.mediaIndex = path.resolve(args[i + 1]); i += 1; continue; }
    throw new Error(`Unexpected argument: ${a}`);
  }
  if (out.pages.length === 0) throw new Error('At least one --pages <file> is required');
  return out;
}

/** Exact-URL + logical-id lookups from verified delivery rows. */
function buildLookups(manifest) {
  const byExact = new Map();
  const byId = new Map();
  const deferred = new Set();
  for (const row of Object.values(manifest.rows || {})) {
    const dest = row.delivery_url || '';
    if (!dest && row.status === 'partial' && row.steps?.deliver === 'skipped'
      && row.note?.startsWith('no safe delivery rendition:')) {
      deferred.add(row.logical_id);
    }
    if (!dest) continue;
    if ((row.status !== 'done' && row.status !== 'partial')
      || row.steps?.deliver !== 'done'
      || !Number.isFinite(row.bytes) || row.bytes > OVERSIZE_BYTES) continue;
    byId.set(row.logical_id, dest);
    for (const u of row.seen_urls || []) byExact.set(u, dest);
    if (row.source_url) byExact.set(row.source_url, dest);
    if (row.master_url) byExact.set(row.master_url, dest);
  }
  return { byExact, byId, deferred };
}

function resolve({ byExact, byId, deferred }, url) {
  if (byExact.has(url)) return byExact.get(url);
  if (byExact.has(cleanUrl(url))) return byExact.get(cleanUrl(url));
  if (!isImageUrl(url)) return null;
  const id = logicalId(url);
  return byId.get(id) || (deferred.has(id) ? DEFERRED : null);
}

/**
 * Emit the cart resolver index (mechanism B). Delivery-safe subset of the
 * manifest keyed by logical_id, only for rows that carry a DAM asset path.
 */
function emitMediaIndex(manifest, file, dryRun) {
  const items = {};
  for (const row of Object.values(manifest.rows || {})) {
    if (row.steps?.dam !== 'done' || !row.dam_asset_path || !row.original_download_url) continue;
    items[row.logical_id] = {
      dam_asset_path: row.dam_asset_path,
      original_download_url: row.original_download_url || '',
      alt: row.alt || '',
    };
  }
  const index = { version: 1, note: 'cart resolver seam (SKODA-505); source: media-manifest. Swap source for DM/OpenAPI post-M1.', items };
  if (!dryRun) writeFileSync(file, JSON.stringify(index, null, 2));
  return Object.keys(items).length;
}

function main() {
  const cfg = parseArgs();
  if (!existsSync(cfg.manifest)) throw new Error(`Manifest not found: ${cfg.manifest}`);
  const manifest = JSON.parse(readFileSync(cfg.manifest, 'utf8'));
  const lookups = buildLookups(manifest);

  let totalRewrites = 0;
  let totalDeferred = 0;
  const prepared = [];
  const failures = [];
  for (const page of cfg.pages) {
    const abs = path.resolve(page);
    if (!existsSync(abs)) {
      failures.push(`${page}: requested page not found`);
      continue;
    }
    let html = readFileSync(abs, 'utf8');
    let rw = 0;
    let deferred = 0;
    html = html.replace(/<img\b[^>]*>/gi, (tag) => {
      const match = tag.match(/(\ssrc=")([^"]+)(")/i);
      if (!match) {
        failures.push(`${page}: image has no src`);
        return tag;
      }
      const [, pre, url, post] = match;
      if (url.startsWith('data:') || /^\.?\/media_[^/]+/.test(url)) return tag;
      const dest = resolve(lookups, url);
      if (!dest) {
        failures.push(`${page}: unresolved image ${url}`);
        return tag;
      }
      if (dest === DEFERRED) {
        deferred += 1;
        console.warn(`[media] ${page}: ${url} has no safe delivery rendition; import:push must strip or block it before DA preview`);
        return tag;
      }
      // A repeated absolute URL under eight different width descriptors is not
      // a responsive ladder; EDS generates the real srcset from the delivery URL.
      const rewritten = tag.replace(match[0], `${pre}${dest}${post}`)
        .replace(/\ssrcset="[^"]*"/gi, '');
      if (rewritten !== tag) rw += 1;
      return rewritten;
    });

    prepared.push({ abs, html, rw });
    totalRewrites += rw;
    totalDeferred += deferred;
    console.log(`${cfg.dryRun ? '[dry-run] ' : ''}${path.relative(WORKSPACE, abs)}: ${rw} media ref(s) rewritten → delivery url`);
  }

  if (failures.length) { throw new Error(`Media apply blocked:\n${failures.join('\n')}`); }
  if (!cfg.dryRun) {
    prepared.forEach(({ abs, html, rw }) => {
      if (rw) { writeFileSync(abs, html); }
    });
  }
  const indexed = emitMediaIndex(manifest, cfg.mediaIndex, cfg.dryRun);
  console.log(`\n[media] ${totalRewrites} total rewrite(s)${cfg.dryRun ? ' (dry-run, no files changed)' : ''}`);
  if (totalDeferred) console.log(`[media] ${totalDeferred} image(s) deferred to mandatory import:push gate`);
  console.log(`[media] cart resolver index: ${indexed} asset(s) → ${path.relative(WORKSPACE, cfg.mediaIndex)}${cfg.dryRun ? ' (dry-run)' : ''}`);
}

try {
  main();
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
}
