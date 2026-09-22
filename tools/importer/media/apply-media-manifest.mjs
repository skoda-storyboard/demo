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
 *   1. Rewrite content <img src> (and srcset, F9) → row.delivery_url. EDS ingests
 *      that absolute url into its media bus at publish (self-hosted + webp).
 *   2. Emit /media-index.json — the CART RESOLVER SEAM (mechanism B). Maps
 *      logical_id → { dam_asset_path, original_download_url, alt } so the
 *      media-cart block can resolve "download original" to the DAM asset. Today
 *      the seam is fed by this manifest; a later DM/OpenAPI swap changes only the
 *      source of these fields, not the cart (design-for-swap, post-M1 decision).
 *
 * Matching: exact source url → logical id (derivative-suffix + query stripped).
 * Rows without a delivery_url (delivery skipped) are left untouched (reference-in-place).
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { logicalId, isImageUrl, cleanUrl } from './media-lib.mjs';

const WORKSPACE = process.env.WORKSPACE_PATH || process.cwd();
const DEFAULT_MANIFEST = path.join(WORKSPACE, 'tools', 'importer', 'media', 'media-manifest.json');
const DEFAULT_MEDIA_INDEX = path.join(WORKSPACE, 'content', 'media-index.json');

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

/** Exact-URL + logical-id lookups from rows that have a delivery_url. */
function buildLookups(manifest) {
  const byExact = new Map();
  const byId = new Map();
  for (const row of Object.values(manifest.rows || {})) {
    const dest = row.delivery_url || '';
    if (!dest) continue;
    if (row.status !== 'done' && row.status !== 'partial') continue;
    byId.set(row.logical_id, dest);
    for (const u of row.seen_urls || []) byExact.set(u, dest);
    if (row.source_url) byExact.set(row.source_url, dest);
    if (row.master_url) byExact.set(row.master_url, dest);
  }
  return { byExact, byId };
}

function resolve({ byExact, byId }, url) {
  if (byExact.has(url)) return byExact.get(url);
  if (byExact.has(cleanUrl(url))) return byExact.get(cleanUrl(url));
  if (!isImageUrl(url)) return null;
  return byId.get(logicalId(url)) || null;
}

/** F9 — rewrite one srcset value's URLs through resolve(), preserving descriptors. */
function rewriteSrcset(value, lookups) {
  return value.split(',').map((part) => {
    const seg = part.trim();
    if (!seg) return seg;
    const sp = seg.search(/\s/);
    const url = sp === -1 ? seg : seg.slice(0, sp);
    const descriptor = sp === -1 ? '' : seg.slice(sp);
    const dest = resolve(lookups, url);
    return `${dest || url}${descriptor}`;
  }).join(', ');
}

/**
 * Emit the cart resolver index (mechanism B). Delivery-safe subset of the
 * manifest keyed by logical_id, only for rows that carry a DAM asset path.
 */
function emitMediaIndex(manifest, file, dryRun) {
  const items = {};
  for (const row of Object.values(manifest.rows || {})) {
    if (!row.dam_asset_path) continue;
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
  for (const page of cfg.pages) {
    const abs = path.resolve(page);
    if (!existsSync(abs)) { console.warn(`⚠️  page not found: ${page}`); continue; }
    let html = readFileSync(abs, 'utf8');
    let rw = 0;

    // src="..."
    html = html.replace(/(\ssrc=")([^"]+)(")/gi, (whole, pre, url, post) => {
      const dest = resolve(lookups, url);
      if (dest) { rw += 1; return `${pre}${dest}${post}`; }
      return whole;
    });
    // srcset="..." (F9 — actually rewrite, not just claim to)
    html = html.replace(/(\ssrcset=")([^"]+)(")/gi, (whole, pre, val, post) => {
      const rewritten = rewriteSrcset(val, lookups);
      if (rewritten !== val) { rw += 1; return `${pre}${rewritten}${post}`; }
      return whole;
    });

    if (rw > 0 && !cfg.dryRun) writeFileSync(abs, html);
    totalRewrites += rw;
    console.log(`${cfg.dryRun ? '[dry-run] ' : ''}${path.relative(WORKSPACE, abs)}: ${rw} media ref(s) rewritten → delivery url`);
  }

  const indexed = emitMediaIndex(manifest, cfg.mediaIndex, cfg.dryRun);
  console.log(`\n[media] ${totalRewrites} total rewrite(s)${cfg.dryRun ? ' (dry-run, no files changed)' : ''}`);
  console.log(`[media] cart resolver index: ${indexed} asset(s) → ${path.relative(WORKSPACE, cfg.mediaIndex)}${cfg.dryRun ? ' (dry-run)' : ''}`);
}

main();
