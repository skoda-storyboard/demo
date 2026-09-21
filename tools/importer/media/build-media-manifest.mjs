#!/usr/bin/env node
/*
 * build-media-manifest.mjs — ingest source images into the AEM DAM (originals),
 * pick a media-bus-deliverable rendition, and emit a re-runnable mapping manifest
 * (SKODA-501 masters-only / SKODA-504 manifest / SKODA-506 pre-condition).
 *
 * Usage:
 *   node tools/importer/media/build-media-manifest.mjs \
 *     --pages content/en/skoda-model/elroq.plain.html [more.plain.html ...] \
 *     [--manifest tools/importer/media/media-manifest.json] \
 *     [--dam-base https://author-p220607-e2281243.adobeaemcloud.com] \
 *     [--dam-folder /content/dam/storyboard] \
 *     [--da-archive] [--org skoda-storyboard --repo demo] \
 *     [--concurrency 4] [--dry-run] [--force] [--limit N]
 *
 * Per distinct LOGICAL image (path-qualified id, F3) referenced by the pages:
 *   1. dedup to the logical master; first PAGE that references it owns the DAM folder
 *   2. pickIngestUrl → DELIVERY rendition (master, or a sized derivative if >10MB, F4)
 *   3. fetch the ORIGINAL master bytes (server-side; no CORS)
 *   4. upload the ORIGINAL to the AEM DAM at /content/dam/storyboard/<page-path>/<file>
 *   5. (optional --da-archive) also self-host in DA for CDN-independence
 *   6. record a manifest row: delivery_url (A) + dam_asset_path (B) + provenance
 *
 * Per-step status (F5): a row is `done` only when every REQUIRED step passed.
 * Manifest is persisted incrementally (B) so a crash/expiry resumes. Non-zero
 * exit when failures remain. Credentials never come from chat/argv (see media-lib).
 */

import {
  readFileSync, writeFileSync, existsSync, mkdirSync,
} from 'node:fs';
import path from 'node:path';
import {
  isImageUrl, masterUrl, logicalId, daPathFor, damPathFor, pagePathFromFile, isAspectCrop,
  pickIngestUrl, fetchBinary, uploadToDA, uploadToDAM, setDamMetadata, resolveDamToken,
} from './media-lib.mjs';

const WORKSPACE = process.env.WORKSPACE_PATH || process.cwd();
const DEFAULT_MANIFEST = path.join(WORKSPACE, 'tools', 'importer', 'media', 'media-manifest.json');
const MEDIA_DA_DIR = path.join(WORKSPACE, 'content', 'media-da');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {
    pages: [],
    manifest: DEFAULT_MANIFEST,
    org: 'skoda-storyboard',
    repo: 'demo',
    damBase: process.env.DAM_BASE_URL || '',
    damFolder: process.env.DAM_FOLDER || '/content/dam/storyboard',
    tokenFile: process.env.AEM_TOKEN_FILE || '',
    concurrency: 4,
    dryRun: false,
    force: false,
    daArchive: false,
    limit: Infinity,
  };
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === '--dry-run') { out.dryRun = true; continue; }
    if (a === '--force') { out.force = true; continue; }
    if (a === '--da-archive') { out.daArchive = true; continue; }
    if (a === '--pages') {
      while (args[i + 1] && !args[i + 1].startsWith('--')) { out.pages.push(args[i + 1]); i += 1; }
      continue;
    }
    const val = args[i + 1];
    if (a === '--manifest') { out.manifest = path.resolve(val); i += 1; continue; }
    if (a === '--org') { out.org = val; i += 1; continue; }
    if (a === '--repo') { out.repo = val; i += 1; continue; }
    if (a === '--dam-base') { out.damBase = val; i += 1; continue; }
    if (a === '--dam-folder') { out.damFolder = val; i += 1; continue; }
    if (a === '--token-file') { out.tokenFile = val; i += 1; continue; }
    if (a === '--concurrency') { out.concurrency = Math.max(1, Number(val) || 1); i += 1; continue; }
    if (a === '--limit') { out.limit = Number(val); i += 1; continue; }
    throw new Error(`Unexpected argument: ${a}`);
  }
  if (out.pages.length === 0) throw new Error('At least one --pages <file> is required');
  return out;
}

/** Extract image refs (src + alt + data-caption) from imported .plain.html. */
function extractImageRefs(html) {
  const refs = [];
  const imgRe = /<img\b[^>]*>/gi;
  const attr = (tag, name) => {
    const m = tag.match(new RegExp(`${name}="([^"]*)"`, 'i'));
    return m ? m[1] : '';
  };
  let m;
  // eslint-disable-next-line no-cond-assign
  while ((m = imgRe.exec(html)) !== null) {
    const tag = m[0];
    const src = attr(tag, 'src');
    if (!src) continue;
    refs.push({ url: src, alt: attr(tag, 'alt'), caption: attr(tag, 'data-caption') });
  }
  return refs;
}

function loadManifest(file) {
  if (!existsSync(file)) return { generatedAt: null, rows: {} };
  try {
    const m = JSON.parse(readFileSync(file, 'utf8'));
    m.rows = m.rows || {};
    return m;
  } catch {
    return { generatedAt: null, rows: {} };
  }
}

function ensureDir(dir) { if (!existsSync(dir)) mkdirSync(dir, { recursive: true }); }

/** Bounded-concurrency map (B): run worker over items, at most `limit` at once. */
async function mapPool(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  async function runner() {
    for (;;) {
      const i = next; next += 1;
      if (i >= items.length) return;
      results[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, runner));
  return results;
}

async function main() {
  const cfg = parseArgs();
  const damConfig = cfg.damBase ? { baseUrl: cfg.damBase, folder: cfg.damFolder } : null;
  const damToken = damConfig ? resolveDamToken({ tokenFile: cfg.tokenFile }) : null;

  // 1. Collect + dedup image refs. First page that references a logical image
  //    OWNS its DAM folder (page-mirrored). Later pages reuse that path.
  const byLogical = new Map(); // id -> { sourceUrl, alt, caption, seenUrls:Set, ownerPage }
  for (const page of cfg.pages) {
    const abs = path.resolve(page);
    if (!existsSync(abs)) { console.warn(`⚠️  page not found: ${page}`); continue; }
    const pagePath = pagePathFromFile(abs);
    const html = readFileSync(abs, 'utf8');
    for (const ref of extractImageRefs(html)) {
      if (!/^https?:\/\//i.test(ref.url)) continue; // skip already-ingested / relative
      if (!isImageUrl(ref.url)) continue; // skip PDFs etc.
      const id = logicalId(ref.url);
      const existing = byLogical.get(id);
      if (existing) {
        existing.seenUrls.add(ref.url);
        if (!existing.alt && ref.alt) existing.alt = ref.alt;
        if (!existing.caption && ref.caption) existing.caption = ref.caption;
      } else {
        byLogical.set(id, {
          sourceUrl: ref.url,
          alt: ref.alt,
          caption: ref.caption,
          seenUrls: new Set([ref.url]),
          ownerPage: pagePath,
        });
      }
    }
  }

  const logicalIds = [...byLogical.keys()].slice(0, cfg.limit);
  console.log(`[media] ${logicalIds.length} distinct logical image(s) across ${cfg.pages.length} page(s)`);
  console.log(`[media] DAM: ${damConfig ? `${damConfig.baseUrl}${damConfig.folder} (token: ${damToken ? 'present' : 'MISSING → reference-in-place'})` : 'not configured'}`);
  console.log(`[media] DA archive: ${cfg.daArchive ? 'on' : 'off'}  ·  concurrency: ${cfg.concurrency}`);
  if (cfg.dryRun) console.log('[media] DRY RUN — no fetch/upload/write');

  const manifest = loadManifest(cfg.manifest);
  ensureDir(path.dirname(cfg.manifest));

  // Incremental persistence (B): flush after each row completes.
  let dirty = 0;
  const flush = () => {
    writeFileSync(cfg.manifest, JSON.stringify(manifest, null, 2));
    dirty = 0;
  };

  const counts = {
    done: 0, skipped: 0, failed: 0, precond: 0,
  };

  async function processOne(id) {
    const info = byLogical.get(id);
    const prior = manifest.rows[id];
    if (prior && prior.status === 'done' && !cfg.force) { counts.skipped += 1; return; }

    const pagePath = (prior && prior.dam_page_path) || info.ownerPage;
    const damAssetPath = damConfig ? damPathFor(info.sourceUrl, { damFolder: cfg.damFolder, pagePath }) : '';

    const row = {
      logical_id: id,
      source_url: info.sourceUrl,
      master_url: masterUrl(info.sourceUrl),
      dam_page_path: pagePath,
      // Mechanism B (media-cart original): the DAM asset path is the join key.
      dam_asset_path: damAssetPath,
      dam_original_url: '', // set to the fetched original url (provenance)
      original_download_url: '', // deliverable original for the cart (M1: DA copy; prod: DM/OpenAPI)
      // Mechanism A (delivery): absolute url EDS ingests into its media bus at publish.
      delivery_url: '',
      da_path: '',
      alt: info.alt || '',
      caption: info.caption || '',
      seen_urls: [...info.seenUrls],
      // F7 — source referenced a non-ladder `-WxH` (possible aspect crop). We
      // still ingest the true master, but flag it so a reviewer can confirm the
      // page wanted a specific framing rather than the uncropped original.
      aspect_crop_source: [...info.seenUrls].some((u) => isAspectCrop(u)),
      bytes: null,
      preconditioned: false,
      // Per-step status (F5).
      steps: { deliver: 'pending', dam: damConfig ? 'pending' : 'n/a', da: cfg.daArchive ? 'pending' : 'n/a' },
      status: 'pending',
      note: '',
    };

    if (cfg.dryRun) {
      const pick = await pickIngestUrl(info.sourceUrl);
      row.bytes = pick.bytes;
      row.preconditioned = pick.preconditioned;
      row.delivery_url = pick.ok ? pick.url : '';
      row.steps.deliver = pick.ok ? 'planned' : 'skipped';
      row.status = pick.ok ? 'planned' : 'skipped';
      row.note = `dry-run: deliver ${pick.reason}; DAM original ${row.dam_asset_path || '(n/a)'}`;
      manifest.rows[id] = row;
      console.log(`  · ${id}  ${pick.reason}${pick.preconditioned ? ' [pre-conditioned]' : ''} → DAM ${row.dam_asset_path || '(n/a)'}`);
      return;
    }

    try {
      // 2. DELIVERY rendition (F4). If none is safe, skip delivery but still try DAM.
      const pick = await pickIngestUrl(info.sourceUrl);
      row.preconditioned = pick.preconditioned;
      if (pick.preconditioned) counts.precond += 1;

      let originalBuffer = null; let originalType = '';
      if (pick.ok) {
        const got = await fetchBinary(pick.url);
        row.delivery_url = pick.url;
        row.bytes = got.bytes;
        row.steps.deliver = 'done';
        originalBuffer = got.buffer; originalType = got.contentType;
      } else {
        row.steps.deliver = 'skipped';
        row.note = `no safe delivery rendition: ${pick.reason}`;
        console.warn(`  ⚠ ${id}  ${row.note}`);
      }

      // 3/4. DAM ingest — the ORIGINAL master (not the pre-conditioned copy).
      if (damConfig) {
        if (!damToken) {
          row.steps.dam = 'skipped';
          row.dam_asset_path = '';
          row.note = [row.note, 'DAM token missing → reference-in-place'].filter(Boolean).join('; ');
        } else {
          // Fetch the ORIGINAL master (may be >10MB — that's fine for storage).
          let masterBuf = originalBuffer; let masterType = originalType;
          if (!pick.preconditioned && pick.ok && pick.url === row.master_url) {
            // delivery WAS the master → reuse the buffer.
          } else {
            try {
              const gotMaster = await fetchBinary(row.master_url);
              masterBuf = gotMaster.buffer; masterType = gotMaster.contentType;
              row.dam_original_url = row.master_url;
            } catch {
              // master unreachable → fall back to whatever delivery fetched
              row.dam_original_url = pick.ok ? pick.url : '';
            }
          }
          if (!row.dam_original_url) row.dam_original_url = pick.ok ? pick.url : row.master_url;
          if (masterBuf) {
            const dam = await uploadToDAM({
              damConfig,
              damPath: damAssetPath,
              buffer: masterBuf,
              contentType: masterType,
              token: damToken,
            });
            row.dam_status = dam.status;
            if (dam.ok) {
              row.steps.dam = 'done';
              await setDamMetadata({
                damConfig,
                damPath: damAssetPath,
                token: damToken,
                metadata: {
                  originUrl: row.master_url, alt: row.alt, title: row.alt, sourcePage: pagePath,
                },
              });
            } else {
              row.steps.dam = 'error';
              row.dam_asset_path = '';
              row.note = [row.note, `DAM ${dam.status}: ${(dam.body || '').slice(0, 100)}`].filter(Boolean).join('; ');
            }
          } else {
            row.steps.dam = 'error';
            row.dam_asset_path = '';
            row.note = [row.note, 'no master bytes to upload to DAM'].filter(Boolean).join('; ');
          }
        }
      }

      // 5. Optional DA archive (CDN-independence) + M1 deliverable original for cart.
      if (cfg.daArchive && originalBuffer) {
        ensureDir(MEDIA_DA_DIR);
        writeFileSync(path.join(MEDIA_DA_DIR, id), originalBuffer);
        const da = await uploadToDA({
          org: cfg.org,
          repo: cfg.repo,
          daPath: daPathFor(id),
          buffer: originalBuffer,
          contentType: originalType,
        });
        row.da_status = da.status;
        if (da.ok) {
          row.da_path = daPathFor(id);
          row.steps.da = 'done';
          // M1 cart "download original" default = the DA-hosted copy (deliverable).
          row.original_download_url = row.da_path;
        } else {
          row.steps.da = 'error';
          row.note = [row.note, `DA archive ${da.status}`].filter(Boolean).join('; ');
        }
      }

      // Per-step verdict (F5): done only when every REQUIRED step passed.
      const required = ['deliver'];
      if (damConfig && damToken) required.push('dam');
      if (cfg.daArchive) required.push('da');
      const allOk = required.every((s) => row.steps[s] === 'done');
      if (allOk) { row.status = 'done'; counts.done += 1; } else { row.status = 'partial'; counts.failed += 1; }

      manifest.rows[id] = row;
      const extras = [
        row.dam_asset_path ? `DAM:${row.dam_asset_path}` : null,
        row.da_path ? `DA:${row.da_path}` : null,
      ].filter(Boolean).join(' ');
      console.log(`  ${allOk ? '✓' : '⚠'} ${id}  ${row.bytes ?? '?'} bytes${row.preconditioned ? ' [pre-conditioned]' : ''} → ${row.delivery_url || '(no delivery)'}${extras ? `  (${extras})` : ''}`);
    } catch (err) {
      row.status = 'error';
      row.note = String(err.message || err);
      counts.failed += 1;
      manifest.rows[id] = row;
      console.error(`  ✗ ${id}  ${row.note}`);
    }
    dirty += 1;
    if (dirty >= 1) flush(); // flush per row (B)
  }

  await mapPool(logicalIds, cfg.concurrency, processOne);
  flush();

  console.log(`\n[media] done=${counts.done} partial/failed=${counts.failed} skipped=${counts.skipped} pre-conditioned=${counts.precond}`);
  console.log(`[media] manifest → ${path.relative(WORKSPACE, cfg.manifest)}`);
  // F5: non-zero exit when failures remain (unless dry-run).
  if (!cfg.dryRun && counts.failed > 0) process.exitCode = 1;
}

main().catch((err) => { console.error(err); process.exit(1); });
