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
  pickIngestUrl, headBytes, fetchBinary, uploadToDA, uploadToDAM, setDamMetadata, resolveDamToken,
  needsMediaBuild, OVERSIZE_BYTES,
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
    fromManifest: false,
    idsFile: '',
    limit: Infinity,
  };
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === '--dry-run') { out.dryRun = true; continue; }
    if (a === '--force') { out.force = true; continue; }
    if (a === '--da-archive') { out.daArchive = true; continue; }
    if (a === '--from-manifest') { out.fromManifest = true; continue; }
    if (a === '--pages') {
      while (args[i + 1] && !args[i + 1].startsWith('--')) { out.pages.push(args[i + 1]); i += 1; }
      continue;
    }
    const val = args[i + 1];
    if (a === '--manifest') { out.manifest = path.resolve(val); i += 1; continue; }
    if (a === '--ids-file') {
      if (!val || val.startsWith('--')) throw new Error('--ids-file requires a path');
      out.idsFile = path.resolve(val); i += 1; continue;
    }
    if (a === '--org') { out.org = val; i += 1; continue; }
    if (a === '--repo') { out.repo = val; i += 1; continue; }
    if (a === '--dam-base') { out.damBase = val; i += 1; continue; }
    if (a === '--dam-folder') { out.damFolder = val; i += 1; continue; }
    if (a === '--token-file') { out.tokenFile = val; i += 1; continue; }
    if (a === '--concurrency') { out.concurrency = Math.max(1, Number(val) || 1); i += 1; continue; }
    if (a === '--limit') { out.limit = Number(val); i += 1; continue; }
    throw new Error(`Unexpected argument: ${a}`);
  }
  if (out.pages.length === 0 && !out.fromManifest) {
    throw new Error('Provide --pages <file> [...] or --from-manifest (re-ingest from the existing manifest\'s source_urls)');
  }
  if (out.idsFile && !out.fromManifest) throw new Error('--ids-file requires --from-manifest');
  return out;
}

/** Extract image refs (src + alt + data-caption) from imported .plain.html. */
function extractImageRefs(html) {
  const refs = [];
  const imgRe = /<img\b[^>]*>/gi;
  const attr = (tag, name) => {
    const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`, 'i'));
    return m ? m[1] : null;
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
  const m = JSON.parse(readFileSync(file, 'utf8'));
  if (!m.rows || typeof m.rows !== 'object') throw new Error(`Invalid media manifest: ${file}`);
  return m;
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
  if (damConfig && !damToken && !cfg.dryRun) {
    throw new Error('DAM ingest requested but no DAM token is available; no images were processed');
  }
  if (!cfg.fromManifest) {
    const missing = cfg.pages.filter((page) => !existsSync(path.resolve(page)));
    if (missing.length) throw new Error(`Requested page(s) not found: ${missing.join(', ')}`);
  }

  const manifest = loadManifest(cfg.manifest);
  ensureDir(path.dirname(cfg.manifest));

  // 1. Collect + dedup image refs. First page that references a logical image
  //    OWNS its DAM folder (page-mirrored). Later pages reuse that path.
  const byLogical = new Map(); // id -> { sourceUrl, alt, caption, seenUrls:Set, ownerPage }

  if (cfg.fromManifest) {
    // Re-ingest straight from the existing manifest's recorded source_urls — for
    // when the imported .plain.html isn't in the checkout (content/ is a separate
    // store). Reuses each row's own dam_page_path/alt so foldering is unchanged.
    for (const row of Object.values(manifest.rows || {})) {
      const src = row.source_url;
      if (!src || !isImageUrl(src)) continue;
      const id = row.logical_id || logicalId(src);
      byLogical.set(id, {
        sourceUrl: src,
        alt: row.alt || '',
        caption: row.caption || '',
        seenUrls: new Set(row.seen_urls && row.seen_urls.length ? row.seen_urls : [src]),
        ownerPage: row.dam_page_path || '',
        pageRefs: new Set(row.page_refs || [row.dam_page_path].filter(Boolean)),
      });
    }
  } else {
    for (const page of cfg.pages) {
      const abs = path.resolve(page);
      const pagePath = pagePathFromFile(abs);
      const html = readFileSync(abs, 'utf8');
      for (const ref of extractImageRefs(html)) {
        if (ref.alt === null || !ref.alt.trim()) {
          console.warn(`[media] ${ref.alt === null ? 'missing' : 'empty'} alt: ${pagePath} ${ref.url}`);
        }
        if (!/^https?:\/\//i.test(ref.url)) continue; // skip already-ingested / relative
        if (!isImageUrl(ref.url)) continue; // skip PDFs etc.
        const id = logicalId(ref.url);
        const existing = byLogical.get(id);
        if (existing) {
          existing.seenUrls.add(ref.url);
          existing.pageRefs.add(pagePath);
          if (!existing.alt && ref.alt) existing.alt = ref.alt;
          if (!existing.caption && ref.caption) existing.caption = ref.caption;
        } else {
          byLogical.set(id, {
            sourceUrl: ref.url,
            alt: ref.alt,
            caption: ref.caption,
            seenUrls: new Set([ref.url]),
            ownerPage: pagePath,
            pageRefs: new Set([pagePath]),
          });
        }
      }
    }
  }

  let logicalIds = [...byLogical.keys()];
  if (cfg.idsFile) {
    const ids = readFileSync(cfg.idsFile, 'utf8').split(/\r?\n/)
      .map((id) => id.trim()).filter((id) => id && !id.startsWith('#'));
    if (!ids.length) throw new Error(`Empty media ID list: ${cfg.idsFile}`);
    const seen = new Set();
    ids.forEach((id) => {
      if (seen.has(id)) throw new Error(`Duplicate media ID in list: ${id}`);
      if (!byLogical.has(id)) throw new Error(`Media ID not in manifest: ${id}`);
      seen.add(id);
    });
    logicalIds = ids;
  }
  logicalIds = logicalIds.slice(0, cfg.limit);
  const srcLabel = cfg.fromManifest ? 'from manifest' : `across ${cfg.pages.length} page(s)`;
  console.log(`[media] ${logicalIds.length} distinct logical image(s) ${srcLabel}`);
  console.log(`[media] DAM: ${damConfig ? `${damConfig.baseUrl}${damConfig.folder} (token: ${damToken ? 'present' : 'dry-run only'})` : 'not configured'}`);
  console.log(`[media] DA archive: ${cfg.daArchive ? 'on' : 'off'}  ·  concurrency: ${cfg.concurrency}`);
  if (cfg.dryRun) console.log('[media] DRY RUN — no fetch/upload/write');

  // Incremental persistence (B): flush after each row completes.
  let dirty = 0;
  const flush = () => {
    if (cfg.dryRun) return;
    writeFileSync(cfg.manifest, JSON.stringify(manifest, null, 2));
    dirty = 0;
  };

  const counts = {
    done: 0, skipped: 0, failed: 0, precond: 0,
  };

  async function processOne(id) {
    const info = byLogical.get(id);
    const prior = manifest.rows[id];
    if (!needsMediaBuild(prior, { dam: !!damConfig, da: cfg.daArchive, force: cfg.force })) {
      const priorRefs = prior.page_refs || [prior.dam_page_path].filter(Boolean);
      const pageRefs = [...new Set([...priorRefs, ...info.pageRefs])];
      const seenUrls = [...new Set([...(prior.seen_urls || []), ...info.seenUrls])];
      if (!cfg.dryRun && (pageRefs.length !== (prior.page_refs || []).length
        || seenUrls.length !== (prior.seen_urls || []).length)) {
        manifest.rows[id] = {
          ...prior,
          page_refs: pageRefs,
          seen_urls: seenUrls,
          alt: prior.alt || info.alt,
          caption: prior.caption || info.caption,
        };
        flush();
      }
      counts.skipped += 1;
      return;
    }

    const pagePath = (prior && prior.dam_page_path) || info.ownerPage;
    const damAssetPath = damConfig ? damPathFor(info.sourceUrl, { damFolder: cfg.damFolder, pagePath }) : '';
    const delivered = prior?.steps?.deliver === 'done' && !cfg.force
      && Number.isFinite(prior.bytes) && prior.bytes <= OVERSIZE_BYTES;
    const storedInDam = prior?.steps?.dam === 'done' && (!cfg.force || !damConfig);
    const archivedInDa = prior?.steps?.da === 'done' && (!cfg.force || !cfg.daArchive);
    let damStep = prior?.steps?.dam || 'n/a';
    let daStep = prior?.steps?.da || 'n/a';
    if (damConfig) damStep = storedInDam ? 'done' : 'pending';
    if (cfg.daArchive) daStep = archivedInDa ? 'done' : 'pending';

    const row = {
      ...prior,
      logical_id: id,
      source_url: info.sourceUrl,
      master_url: masterUrl(info.sourceUrl),
      dam_page_path: pagePath,
      page_refs: [...new Set([...(prior?.page_refs || []), ...info.pageRefs])],
      // Mechanism B (media-cart original): the DAM asset path is the join key.
      dam_asset_path: storedInDam ? prior.dam_asset_path : '',
      dam_original_url: storedInDam ? prior.dam_original_url : '',
      original_download_url: archivedInDa ? prior.original_download_url : '',
      // Mechanism A (delivery): absolute url EDS ingests into its media bus at publish.
      delivery_url: delivered ? prior.delivery_url : '',
      da_path: archivedInDa ? prior.da_path : '',
      alt: info.alt || '',
      caption: info.caption || '',
      seen_urls: [...info.seenUrls],
      // F7 — source referenced a non-ladder `-WxH` (possible aspect crop). We
      // still ingest the true master, but flag it so a reviewer can confirm the
      // page wanted a specific framing rather than the uncropped original.
      aspect_crop_source: [...info.seenUrls].some((u) => isAspectCrop(u)),
      bytes: delivered ? prior.bytes : null,
      preconditioned: delivered ? prior.preconditioned : false,
      // Per-step status (F5).
      steps: {
        deliver: delivered ? 'done' : 'pending',
        dam: damStep,
        da: daStep,
      },
      status: 'pending',
      note: '',
    };

    if (cfg.dryRun) {
      try {
        const pick = row.steps.deliver === 'done'
          ? { ok: true, reason: 'already delivered', preconditioned: row.preconditioned }
          : await pickIngestUrl(info.sourceUrl);
        const originalBytes = damConfig && row.steps.dam !== 'done'
          ? await headBytes(row.master_url) : null;
        const originalUnavailable = damConfig && row.steps.dam !== 'done'
          && !(Number.isFinite(originalBytes) && originalBytes > 0);
        if (!pick.ok || originalUnavailable) counts.failed += 1;
        console.log(`  · ${id}  ${pick.reason}${pick.preconditioned ? ' [pre-conditioned]' : ''}${originalUnavailable ? ' [original unavailable]' : ''} → DAM ${damAssetPath || '(n/a)'}`);
      } catch (err) {
        counts.failed += 1;
        console.error(`  ✗ ${id}  ${err.message}`);
      }
      return;
    }

    try {
      // Delivery is reusable when a later run adds DAM ingest or DA archiving.
      let deliveryBuffer = null; let deliveryType = '';
      if (row.steps.deliver !== 'done') {
        const pick = await pickIngestUrl(info.sourceUrl);
        row.preconditioned = pick.preconditioned;
        if (pick.preconditioned) counts.precond += 1;
        if (pick.ok) {
          const got = await fetchBinary(pick.url);
          if (got.bytes > OVERSIZE_BYTES) throw new Error(`Delivery exceeds ${OVERSIZE_BYTES} bytes: ${pick.url}`);
          row.delivery_url = pick.url;
          row.bytes = got.bytes;
          row.steps.deliver = 'done';
          deliveryBuffer = got.buffer; deliveryType = got.contentType;
        } else {
          row.steps.deliver = 'skipped';
          row.note = `no safe delivery rendition: ${pick.reason}`;
          console.warn(`  ⚠ ${id}  ${row.note}`);
        }
      }

      // Originals are fetched separately from delivery renditions. Never upload
      // a resized or fallback source under the DAM-original identity.
      if ((damConfig && row.steps.dam !== 'done') || (cfg.daArchive && row.steps.da !== 'done')) {
        let masterBuffer = deliveryBuffer; let masterType = deliveryType;
        if (!masterBuffer || row.delivery_url !== row.master_url) {
          const master = await fetchBinary(row.master_url);
          masterBuffer = master.buffer; masterType = master.contentType;
        }
        if (!masterBuffer.length || !/^image\//i.test(masterType)) {
          throw new Error(`Original is not a non-empty image: ${row.master_url}`);
        }
        if (damConfig && row.steps.dam !== 'done') {
          row.dam_original_url = row.master_url;
          if (masterBuffer) {
            const dam = await uploadToDAM({
              damConfig,
              damPath: damAssetPath,
              buffer: masterBuffer,
              contentType: masterType,
              token: damToken,
            });
            row.dam_status = dam.status;
            if (dam.ok) {
              row.steps.dam = 'done';
              row.dam_asset_path = damAssetPath;
              const metadata = await setDamMetadata({
                damConfig,
                damPath: damAssetPath,
                token: damToken,
                metadata: {
                  originUrl: row.master_url, alt: row.alt, title: row.alt, sourcePage: pagePath,
                },
              });
              if (!metadata.ok) {
                row.note = [row.note, `DAM provenance metadata ${metadata.status}`].filter(Boolean).join('; ');
                console.warn(`  ⚠ ${id}  ${row.note}`);
              }
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
        if (cfg.daArchive && row.steps.da !== 'done') {
          ensureDir(MEDIA_DA_DIR);
          writeFileSync(path.join(MEDIA_DA_DIR, id), masterBuffer);
          const da = await uploadToDA({
            org: cfg.org,
            repo: cfg.repo,
            daPath: daPathFor(id),
            buffer: masterBuffer,
            contentType: masterType,
          });
          row.da_status = da.status;
          if (da.ok) {
            row.da_path = daPathFor(id);
            row.steps.da = 'done';
            row.original_download_url = row.da_path;
          } else {
            row.steps.da = 'error';
            row.note = [row.note, `DA archive ${da.status}`].filter(Boolean).join('; ');
          }
        }
      }

      // Per-step verdict (F5): done only when every REQUIRED step passed.
      const required = ['deliver'];
      if (damConfig) required.push('dam');
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
      row.status = 'partial';
      if (damConfig && row.steps.dam !== 'done') row.steps.dam = 'error';
      if (cfg.daArchive && row.steps.da !== 'done') row.steps.da = 'error';
      row.note = [row.note, String(err.message || err)].filter(Boolean).join('; ');
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
  if (counts.failed > 0) process.exitCode = 1;
}

main().catch((err) => { console.error(err); process.exit(1); });
