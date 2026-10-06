/*
 * media-lib.mjs — reusable helpers for the Škoda media-import mechanism.
 *
 * Pure/dependency-free (Node 24 built-ins only: fetch, fs, crypto, path).
 * Shared by build-media-manifest.mjs and apply-media-manifest.mjs so any page
 * set in this project can ingest originals into the AEM DAM (system of record)
 * and rewrite images to media-bus-deliverable URLs.
 *
 * Grounded in docs/media/SKODA-MEDIA-DEEP-DIVE.md + SKODA-ASSET-MAPPING.md and
 * tickets SKODA-501 (masters-only), SKODA-504 (manifest), SKODA-506 (pre-condition).
 *
 * Two mechanisms this supports:
 *   A) delivery: content <img> → EDS media bus (rewrite to an absolute URL EDS ingests)
 *   B) media-cart "download original" → the DAM asset path is the join key
 */

import { createHash } from 'node:crypto';
import {
  readFileSync, existsSync, createReadStream, createWriteStream,
} from 'node:fs';
import { open, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import { Readable, Transform } from 'node:stream';
import { finished, pipeline } from 'node:stream/promises';

// WordPress pre-bakes an 8-size derivative ladder as `-WxH` filename suffixes.
// Strip a *scaled* suffix to recover the logical (master) image. Aspect CROPS
// (e.g. -1920x1082) are handled separately — see isAspectCrop / F7.
const DERIVATIVE_SUFFIX_RE = /-\d{2,5}x\d{2,5}(?=\.[a-z0-9]+$)/i;

const IMAGE_EXT_RE = /\.(jpe?g|png|gif|webp|avif|svg)$/i;

// Linked documents tracked for the DAM (SKODA-208: the model Technical Data PDFs). They
// have no media-bus delivery (the page keeps the source link until the DAM ingest).
const DOCUMENT_EXT_RE = /\.pdf$/i;

// Content-bus 409 threshold: masters over ~10 MB 409 the content bus on publish
// (SKODA-506, build-confirmed). Pre-condition the DELIVERY image by substituting
// a sized derivative. The DAM still stores the full ORIGINAL.
export const OVERSIZE_BYTES = 10 * 1024 * 1024;

// Smallest long edge (px) of a rendition the pipeline may pick in place of an
// oversized master. Below it (e.g. a -272x182 thumbnail in a full-width slot) a
// logged strip/block is better than a silent downgrade (SKODA-506).
export const MIN_RENDITION_EDGE = 768;

/** Validate a --min-image-edge value (positive integer px). */
export function renditionEdge(value = MIN_RENDITION_EDGE) {
  const px = Number(value);
  if (!Number.isSafeInteger(px) || px < 1) {
    throw new Error('Minimum rendition edge must be a positive integer number of pixels');
  }
  return px;
}

// The named WordPress scaled-ladder sizes (SKODA-MEDIA-DEEP-DIVE §2), largest
// first. Used both as the pre-condition fallback ladder (F4) and to distinguish
// scaled derivatives from aspect crops (F7).
const DERIVATIVE_LADDER = ['2560x1707', '2048x1365', '1920x1280', '1536x1024', '1440x960', '768x512', '384x256', '272x182'];
const LADDER_SET = new Set(DERIVATIVE_LADDER);

// The same scaled sizes as long edges. WordPress fits each into a square box, so a
// master that is not exactly 3:2 gets its own suffixes: an 8000x4500 master has
// -1920x1080 and -1536x864, which the 3:2 names above never match (SKODA-805c/506).
const LADDER_EDGES = [2560, 2048, 1920, 1536, 1440, 768];

/** Strip query string + hash from a URL, returning the bare path. */
export function cleanUrl(url) {
  return url.split('#')[0].split('?')[0];
}

/** Basename of a URL, ignoring query/hash. */
export function urlBasename(url) {
  const clean = cleanUrl(url);
  return clean.slice(clean.lastIndexOf('/') + 1);
}

/** True if the URL points at a raster/vector image we should process. */
export function isImageUrl(url) {
  return IMAGE_EXT_RE.test(cleanUrl(url));
}

/** True if the URL points at a linked document (PDF) tracked for the DAM. */
export function isDocumentUrl(url) {
  return DOCUMENT_EXT_RE.test(cleanUrl(url));
}

/** The `-WxH` suffix on a filename, or null. */
export function derivativeSuffix(url) {
  const m = urlBasename(url).match(/-(\d{2,5}x\d{2,5})(?=\.[a-z0-9]+$)/i);
  return m ? m[1] : null;
}

/**
 * F7 — is this `-WxH` an aspect CROP (a different framing) rather than a scaled
 * rendition? Heuristic without fetching: a suffix that is NOT one of the known
 * scaled-ladder sizes is treated as a crop candidate (e.g. `-1920x1082`).
 * `-1920x750` (hero) is also non-ladder but is the model's natural wide framing;
 * callers verify against the master's real dimensions when bytes are available
 * (see cropDiffersFromMaster).
 */
export function isAspectCrop(url) {
  const suffix = derivativeSuffix(url);
  return !!suffix && !LADDER_SET.has(suffix);
}

/** True when the url's `-WxH` suffix is under `minEdge` on its long edge; unsuffixed → false. */
export function belowMinEdge(url, minEdge = MIN_RENDITION_EDGE) {
  const suffix = derivativeSuffix(url);
  return !!suffix && Math.max(...suffix.split('x').map(Number)) < minEdge;
}

/** A delivery rendition we stepped down to (not the page's own reference) that is too small. */
export function stepDownTooSmall(row, minEdge = MIN_RENDITION_EDGE) {
  return !!row.preconditioned && row.delivery_url !== row.source_url
    && belowMinEdge(row.delivery_url, minEdge);
}

export function needsMediaBuild(row, {
  dam = false, da = false, force = false, minEdge = MIN_RENDITION_EDGE, publicUrl = '',
} = {}) {
  if (force || !row || row.status !== 'done') return true;
  // A binary must have a verified public destination, not merely a private DAM upload.
  if (row.kind === 'document' || row.kind === 'video') {
    return row.steps?.dam !== 'done' || !row.dam_asset_path
      || (dam && row.steps?.publish !== 'done')
      || !row.public_url || (publicUrl && row.public_url !== publicUrl)
      || row.public_verified?.url !== row.public_url;
  }
  if (row.steps?.deliver !== 'done' || !row.delivery_url
    || !Number.isFinite(row.bytes) || row.bytes > OVERSIZE_BYTES) return true;
  if (stepDownTooSmall(row, minEdge)) return true;
  if (dam && (row.steps?.dam !== 'done' || !row.dam_asset_path)) return true;
  if (da && (row.steps?.da !== 'done' || !row.original_download_url)) return true;
  return false;
}

/**
 * F8 — normalise a URL for logical-id/master derivation:
 *  - lowercase the extension,
 *  - collapse the WordPress double-extension shape `.JPG-384x256.jpg` →
 *    a single logical extension (keep the real inner extension).
 * Returns the cleaned URL (no query/hash) with a normalised tail.
 */
export function normalizeExtension(url) {
  let clean = cleanUrl(url);
  // Double-extension: `name.JPG-384x256.jpg` → `name.jpg` (inner ext wins, lc).
  const dbl = clean.match(/\.([a-z0-9]+)-\d{2,5}x\d{2,5}\.([a-z0-9]+)$/i);
  if (dbl) {
    clean = clean.replace(/\.[a-z0-9]+-\d{2,5}x\d{2,5}\.[a-z0-9]+$/i, `.${dbl[1].toLowerCase()}`);
    return clean;
  }
  // Single extension: just lowercase it.
  return clean.replace(/\.([a-z0-9]+)$/i, (whole, ext) => `.${ext.toLowerCase()}`);
}

/**
 * The master URL — the WordPress original. Always strips the `-WxH` suffix
 * (the no-suffix file IS the master, verified: the `-1920x750` hero derivative
 * and its `…_fede6794.jpg` master both exist). F7 (aspect crops) is handled by
 * FLAGGING a non-ladder suffix in the manifest for review (see isAspectCrop),
 * not by refusing to strip — refusing would break dedup and DAM-original naming.
 */
export function masterUrl(url) {
  return normalizeExtension(url).replace(DERIVATIVE_SUFFIX_RE, '');
}

export function sizedRenditions(url) {
  const master = masterUrl(url);
  const ext = path.extname(cleanUrl(master));
  if (!ext) return [];
  const base = master.slice(0, -ext.length);
  return DERIVATIVE_LADDER.map((size) => `${base}-${size}${ext}`);
}

/** `-WxH` suffix as { w, h }, or null. */
export function suffixSize(url) {
  const suffix = derivativeSuffix(url);
  if (!suffix) return null;
  const [w, h] = suffix.split('x').map(Number);
  return { w, h };
}

/**
 * F3 — logical id for a source image (the dedup key). Path-qualified so two
 * different images that happen to share a basename in different folders (e.g.
 * `/2018/08/hero.jpg` vs `/2021/03/hero.jpg`, common for un-hashed legacy
 * masters) do NOT collapse into one. Format: `<pathhash8>__<master-basename>`.
 */
export function logicalId(url) {
  const master = masterUrl(url);
  let dir = '';
  try {
    const u = new URL(master);
    dir = u.pathname.slice(0, u.pathname.lastIndexOf('/'));
  } catch {
    dir = master.slice(0, master.lastIndexOf('/'));
  }
  const base = urlBasename(master);
  const pathHash = createHash('sha1').update(dir).digest('hex').slice(0, 8);
  return `${pathHash}__${base}`;
}

/**
 * DAM asset path, page-mirrored (SKODA-ASSET-MAPPING): originals are stored under
 * the source PAGE path, not flat. e.g.
 *   base=/content/dam/storyboard, pagePath=en/skoda-model/elroq, file=hero.jpg
 *   → /content/dam/storyboard/en/skoda-model/elroq/hero.jpg
 * The DAM filename uses the master basename (human-readable), not the logical id.
 */
export function damPathFor(url, { damFolder = '/content/dam/storyboard', pagePath = '' } = {}) {
  const base = (damFolder || '/content/dam/storyboard').replace(/\/$/, '');
  const page = String(pagePath || '').replace(/^\/+|\/+$/g, '');
  const file = urlBasename(masterUrl(url));
  return page ? `${base}/${page}/${file}` : `${base}/${file}`;
}

/** The DA delivery path (local /media-da/ archive convention; NOT aem.live-resolvable). */
export function daPathFor(id) {
  return `/media-da/${id}`;
}

/**
 * Derive the page path (`en/skoda-model/elroq`) from an imported content file
 * path (`content/en/skoda-model/elroq.plain.html`). Strips a leading
 * `content/` and a trailing `.plain.html`/`.html`.
 */
export function pagePathFromFile(file) {
  let p = String(file).replace(/\\/g, '/');
  const idx = p.lastIndexOf('content/');
  if (idx !== -1) p = p.slice(idx + 'content/'.length);
  return p.replace(/\.plain\.html$/i, '').replace(/\.html$/i, '').replace(/^\/+/, '');
}

/** Short stable hash of a string (provenance / logging). */
export function shortHash(str) {
  return createHash('sha1').update(str).digest('hex').slice(0, 12);
}

/**
 * Read intrinsic pixel dimensions from a JPEG/PNG/GIF buffer (dependency-free).
 * Returns { w, h } or null. Used for F7 crop verification when bytes are on hand.
 */
export function imageSize(buffer) {
  if (!buffer || buffer.length < 24) return null;
  // PNG: IHDR at bytes 16..24
  if (buffer[0] === 0x89 && buffer[1] === 0x50) {
    return { w: buffer.readUInt32BE(16), h: buffer.readUInt32BE(20) };
  }
  // GIF: logical screen descriptor (little-endian) at bytes 6..10
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return { w: buffer.readUInt16LE(6), h: buffer.readUInt16LE(8) };
  }
  // JPEG: scan for a SOF marker
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let off = 2;
    while (off + 9 < buffer.length) {
      if (buffer[off] !== 0xff) { off += 1; continue; }
      const marker = buffer[off + 1];
      // SOF0..SOF15 except DHT(0xc4)/JPG(0xc8)/DAC(0xcc)
      const isSof = marker >= 0xc0 && marker <= 0xcf
        && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
      if (isSof) {
        return { h: buffer.readUInt16BE(off + 5), w: buffer.readUInt16BE(off + 7) };
      }
      const len = buffer.readUInt16BE(off + 2);
      if (len < 2) break;
      off += 2 + len;
    }
  }
  return null;
}

/**
 * Intrinsic size of a remote image from its leading bytes, or null (never throws).
 * Streams until the size header is found: an embedded ICC profile can put a JPEG's
 * SOF past 600 KB (the 18.6 MB `Skoda_all-electric_family` master: byte 654933).
 */
export async function remoteImageSize(url, {
  fetchImpl = fetch, maxBytes = 4 * 1024 * 1024, timeoutMs = 20000,
} = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, {
      headers: { Range: `bytes=0-${maxBytes - 1}`, 'Accept-Encoding': 'identity' },
      signal: controller.signal,
    });
    if (!res.ok || !res.body) return null;
    const reader = res.body.getReader();
    const chunks = [];
    let count = 0;
    try {
      while (count < maxBytes) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        count += value.length;
        const size = imageSize(Buffer.concat(chunks));
        if (size?.w && size?.h) return size;
      }
      return null;
    } finally {
      await reader.cancel().catch(() => {});
    }
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Aspect ratios differ beyond tolerance (F7 crop confirmation). */
export function ratiosDiffer(a, b, tol = 0.02) {
  if (!a || !b || !a.w || !a.h || !b.w || !b.h) return false;
  const ra = a.w / a.h;
  const rb = b.w / b.h;
  return Math.abs(ra - rb) / Math.max(ra, rb) > tol;
}

/**
 * Step-down candidates for a master, largest first. With the master's real size
 * (see remoteImageSize), the scaled sizes keep its own ratio (rounded as WordPress
 * does) and 3:2 names are kept only when they match it; without it, the 3:2 ladder.
 */
export function renditionCandidates(url, size = null) {
  if (!size?.w || !size?.h) return sizedRenditions(url);
  const master = masterUrl(url);
  const ext = path.extname(cleanUrl(master));
  if (!ext) return [];
  const base = master.slice(0, -ext.length);
  const long = Math.max(size.w, size.h);
  const scaled = LADDER_EDGES.filter((edge) => edge < long).map((edge) => {
    const ratio = edge / long;
    return `${base}-${Math.round(size.w * ratio)}x${Math.round(size.h * ratio)}${ext}`;
  });
  const named = sizedRenditions(url)
    .filter((candidate) => !ratiosDiffer(size, suffixSize(candidate)));
  return [...new Set([...scaled, ...named])];
}

/** Sleep helper for backoff. */
function sleep(ms) {
  return new Promise((res) => { setTimeout(res, ms); });
}

/**
 * fetch with retry + exponential backoff on 429/5xx and network errors (B).
 * Deterministic backoff (no jitter — Math.random is unavailable in this env).
 */
export async function fetchWithRetry(url, opts = {}, { retries = 3, baseDelayMs = 500 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const res = await fetch(url, opts);
      if (res.status === 429 || res.status >= 500) {
        if (attempt < retries) { await sleep(baseDelayMs * 2 ** attempt); continue; }
      }
      return res;
    } catch (err) {
      lastErr = err;
      if (attempt < retries) { await sleep(baseDelayMs * 2 ** attempt); continue; }
      throw lastErr;
    }
  }
  throw lastErr || new Error(`fetch failed: ${url}`);
}

/**
 * Fetch a URL as a Buffer (server-side; no CORS needed). With retry/backoff.
 * @returns {Promise<{buffer: Buffer, contentType: string, bytes: number}>}
 */
export async function fetchBinary(url, { timeoutMs = 45000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchWithRetry(url, {
      signal: controller.signal,
      headers: { 'user-agent': 'skoda-media-import/1.0 (+migration)' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    return { buffer, contentType: res.headers.get('content-type') || '', bytes: buffer.length };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Download an original to a caller-owned local file, never buffering the body.
 * Retry transient failures from byte zero (truncate the file each attempt);
 * both a stalled connection and the entire transfer have finite deadlines.
 */
export async function fetchBinaryToFile(url, {
  filePath, timeoutMs = 2 * 60 * 60 * 1000, idleTimeoutMs = 120000,
  retries = 2, fetchImpl = fetch,
} = {}) {
  if (!filePath) throw new Error('A local binary file path is required');
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const totalTimer = setTimeout(() => controller.abort(new Error('Source download deadline exceeded')), timeoutMs);
    let idleTimer;
    const resetIdle = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => controller.abort(new Error('Source download stalled')), idleTimeoutMs);
    };
    let retry = true;
    try {
      resetIdle();
      // eslint-disable-next-line no-await-in-loop
      const res = await fetchImpl(url, {
        signal: controller.signal,
        headers: { 'user-agent': 'skoda-media-import/1.0 (+migration)' },
      });
      if (!res.ok) {
        retry = res.status === 429 || res.status >= 500;
        // eslint-disable-next-line no-await-in-loop
        await res.body?.cancel();
        throw new Error(`HTTP ${res.status} for ${url}`);
      }
      if (!res.body) throw new Error(`Empty response for ${url}`);
      const length = res.headers.get('content-length');
      const expected = length === null ? null : Number(length);
      if (expected !== null && (!Number.isSafeInteger(expected) || expected < 1)) {
        throw new Error(`Invalid source Content-Length for ${url}`);
      }
      let bytes = 0;
      const counter = new Transform({
        transform(chunk, encoding, callback) {
          bytes += chunk.length;
          resetIdle();
          callback(null, chunk);
        },
      });
      // eslint-disable-next-line no-await-in-loop
      await pipeline(Readable.fromWeb(res.body), counter, createWriteStream(filePath, { flags: 'w' }));
      // eslint-disable-next-line no-await-in-loop
      const diskBytes = (await stat(filePath)).size;
      if (!Number.isSafeInteger(bytes) || !bytes || diskBytes !== bytes
        || (expected !== null && bytes !== expected)) {
        throw new Error(`Source byte count mismatch for ${url}: ${bytes} / ${expected} (disk ${diskBytes})`);
      }
      // eslint-disable-next-line no-await-in-loop
      const handle = await open(filePath, 'r');
      const header = Buffer.alloc(12);
      try {
        // eslint-disable-next-line no-await-in-loop
        await handle.read(header, 0, header.length, 0);
      } finally {
        // eslint-disable-next-line no-await-in-loop
        await handle.close();
      }
      return {
        filePath, header, bytes, contentType: res.headers.get('content-type') || '',
      };
    } catch (err) {
      if (!retry || attempt === retries) throw err;
      // eslint-disable-next-line no-await-in-loop
      await sleep(500 * 2 ** attempt);
    } finally {
      clearTimeout(totalTimer);
      clearTimeout(idleTimer);
    }
  }
  throw new Error(`Source download failed: ${url}`);
}

/** HEAD a URL for Content-Length (bytes) without the body. Null if unreachable. */
export async function headBytes(url, { timeoutMs = 20000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
    if (!res.ok) return null;
    const len = res.headers.get('content-length');
    return len ? Number(len) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * F4 — choose the DELIVERY url for a logical image (what content <img> points at
 * for EDS media-bus ingest). The master unless it is over OVERSIZE_BYTES, then
 * step down the ladder to the largest rendition under threshold, never below
 * `minEdge` px on the long edge (SKODA-506).
 *
 * Returns { url, bytes, preconditioned, ok, reason }.
 *  - ok=false → NO safe delivery rendition (all oversized or too small / master
 *    unreachable with an oversized fallback). Caller marks the row skipped/error,
 *    NOT done, and does not set delivery_url; the import:push gate then strips or
 *    blocks the image. The DAM still gets the original separately.
 */
export async function pickIngestUrl(sourceUrl, {
  oversizeBytes = OVERSIZE_BYTES, minEdge = MIN_RENDITION_EDGE,
} = {}) {
  const master = masterUrl(sourceUrl);
  const masterBytes = await headBytes(master);

  if (masterBytes !== null && masterBytes <= oversizeBytes) {
    return {
      url: master, bytes: masterBytes, preconditioned: false, ok: true, reason: 'master',
    };
  }

  if (masterBytes === null) {
    // Master unreachable (private masters happen). Fall back to the source URL as
    // given — but size-check it; if it too is oversized/unknown, decline.
    const srcBytes = await headBytes(sourceUrl);
    if (srcBytes !== null && srcBytes <= oversizeBytes) {
      return {
        url: sourceUrl, bytes: srcBytes, preconditioned: sourceUrl !== master, ok: true, reason: 'master-unreachable->source',
      };
    }
    return {
      url: sourceUrl, bytes: srcBytes, preconditioned: false, ok: false, reason: 'master-unreachable-and-source-oversize-or-unknown',
    };
  }

  // Master oversized: step down the ladder (at the master's own ratio) to the first
  // rendition under limit.
  const size = await remoteImageSize(master);
  for (const candidate of renditionCandidates(master, size)) {
    if (belowMinEdge(candidate, minEdge)) continue;
    const bytes = await headBytes(candidate);
    if (bytes !== null && bytes <= oversizeBytes) {
      return {
        url: candidate, bytes, preconditioned: true, ok: true, reason: `oversize-master(${masterBytes})->${derivativeSuffix(candidate)}`,
      };
    }
  }
  // No rendition under threshold — decline (F4: never ship an oversized master).
  return {
    url: master, bytes: masterBytes, preconditioned: false, ok: false, reason: `oversize-no-derivative-under-threshold(${masterBytes}, min ${minEdge}px)`,
  };
}

// ---------------------------------------------------------------------------
// Auth (D) — per-host credential routing.
// ---------------------------------------------------------------------------

/**
 * Resolve the AEM DAM bearer token WITHOUT ever taking it from chat/argv.
 * Order: AEM_DAM_TOKEN / AEM_DEV_TOKEN env → explicit tokenFile / AEM_TOKEN_FILE
 * → default files (.migration/secrets/aem-token, ~/.aem-dev-token) → null.
 * Never logged. Pass { searchDefaults:false } to consider ONLY env + the
 * explicit tokenFile (used by tests so an ambient token file can't leak in).
 */
export function resolveDamToken({ tokenFile, searchDefaults = true } = {}) {
  const env = process.env.AEM_DAM_TOKEN || process.env.AEM_DEV_TOKEN;
  if (env && env.trim()) return env.trim();
  const candidates = [tokenFile];
  if (searchDefaults) {
    candidates.push(
      process.env.AEM_TOKEN_FILE,
      path.join(process.env.WORKSPACE_PATH || process.cwd(), '.migration', 'secrets', 'aem-token'),
      path.join(homedir(), '.aem-dev-token'),
    );
  }
  for (const f of candidates.filter(Boolean)) {
    try {
      if (existsSync(f)) {
        const t = readFileSync(f, 'utf8').trim();
        if (t) return t;
      }
    } catch { /* ignore unreadable candidate */ }
  }
  return null;
}

// ---------------------------------------------------------------------------
// DA source upload (session-cred host; used only for the optional --da-archive).
// ---------------------------------------------------------------------------

/**
 * Upload a binary to Document Authoring's source API (credentials INJECTED by the
 * environment for admin.da.live — never a token here). Non-HTML assets posted as-is.
 */
export async function uploadToDA({
  org, repo, daPath, buffer, contentType,
}) {
  const clean = daPath.replace(/^\//, '');
  const endpoint = `https://admin.da.live/source/${org}/${repo}/${clean}`;
  const form = new FormData();
  form.append('data', new Blob([buffer], { type: contentType || 'application/octet-stream' }), urlBasename(daPath));
  const res = await fetchWithRetry(endpoint, { method: 'POST', body: form });
  const body = await res.text().catch(() => '');
  return { ok: res.ok, status: res.status, body };
}

// ---------------------------------------------------------------------------
// AEM DAM upload (E) — AEMaaCS direct-binary-upload, 3 steps.
//   1) POST <folder>.initiateUpload.json  (form: fileName, fileSize)
//        → { completeURI, files:[{ uploadToken, uploadURIs:[...], maxPartSize }] }
//   2) PUT each part to its uploadURI (split the binary by maxPartSize)
//   3) POST completeURI (form: fileName, mimeType, uploadToken)
// Auth = custom IMS bearer (DAM host only). No per-part S3 ETags (AEM abstracts).
// ---------------------------------------------------------------------------

function partRanges(size, uploadURIs, minPartSize, maxPartSize) {
  const n = uploadURIs.length;
  const max = maxPartSize == null && n === 1 ? size : Number(maxPartSize);
  const min = minPartSize == null ? 1 : Number(minPartSize);
  const needed = Number.isSafeInteger(max) && max > 0 ? Math.ceil(size / max) : NaN;
  if (!Number.isSafeInteger(size) || size < 1 || !n
    || !Number.isSafeInteger(max) || max < 1
    || !Number.isSafeInteger(min) || min < 1
    || (n > 1 && min > max) || needed > n) {
    throw new Error(`DAM upload URIs cannot hold the complete original: ${size}B, ${n} URIs, ${min}-${max}B/part`);
  }
  const ranges = [];
  let offset = 0;
  while (offset < size) {
    const length = Math.min(max, size - offset);
    if (offset + length < size && length < min) {
      throw new Error('DAM upload part is below the server minimum');
    }
    ranges.push({ start: offset, end: offset + length - 1 });
    offset += length;
  }
  return ranges;
}

/** Use only as many ordered upload URIs as the original needs at maxPartSize. */
export function splitBuffer(buffer, uploadURIs, maxPartSize, minPartSize) {
  return partRanges(buffer.length, uploadURIs, minPartSize, maxPartSize)
    .map(({ start, end }) => buffer.subarray(start, end + 1));
}

async function withAuthorDeadline(label, timeoutMs, action) {
  const controller = new AbortController();
  let timer;
  const deadline = new Promise((resolve, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  try {
    return await Promise.race([action(controller.signal), deadline]);
  } finally {
    clearTimeout(timer);
  }
}

async function authorRequest(url, options, {
  fetchImpl, timeoutMs, label, retries = 0, retry404 = false, json = false,
}) {
  const request = fetchImpl === fetchWithRetry ? fetch : fetchImpl;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const result = await withAuthorDeadline(label, timeoutMs, async (signal) => {
        const response = await request(url, { ...options, signal });
        return { response, data: json && response.ok ? await response.json() : null };
      });
      const { status } = result.response;
      if (!json || !result.response.ok) {
        const cancel = result.response.body?.cancel?.();
        if (cancel) cancel.catch(() => {});
      }
      if (attempt < retries
        && (status === 429 || status >= 500 || (retry404 && status === 404))) {
        // eslint-disable-next-line no-await-in-loop
        await sleep(500 * 2 ** attempt);
      } else {
        return result;
      }
    } catch (err) {
      if (attempt === retries) {
        throw new Error(err.message.startsWith(`${label} timed out`)
          ? err.message : `${label} failed (${err.name || 'network'})`);
      }
      // eslint-disable-next-line no-await-in-loop
      await sleep(500 * 2 ** attempt);
    }
  }
  throw new Error(`${label} failed`);
}

/**
 * Ensure the page-mirrored DAM folder chain for an asset exists before upload.
 * `initiateUpload` 404s when the target folder node is absent and the Assets HTTP
 * API does NOT auto-create parents, so we create every segment BELOW the (assumed
 * pre-existing) configured base folder, top-down, via POST /api/assets/<path>.
 * Idempotent + concurrency-safe: an already-present folder (200/201/409) is fine,
 * and a single leaf existence GET short-circuits the common "folder already there"
 * case so re-uploads into the same folder cost one GET, not N creates.
 * Returns { ok, status, body }.
 */
export async function ensureDamFolder({
  damConfig, folderPath, token, fetchImpl = fetchWithRetry, requestTimeoutMs = 60000,
}) {
  if (!damConfig || !damConfig.baseUrl || !token) {
    return { ok: false, status: 0, body: 'DAM not configured' };
  }
  const base = damConfig.baseUrl.replace(/\/$/, '');
  const root = (damConfig.folder || '/content/dam/storyboard').replace(/\/$/, '');
  // Nothing to create at/above the base folder (assumed to exist).
  if (folderPath === root || !folderPath.startsWith(`${root}/`)) {
    return { ok: true, status: 200, body: '' };
  }
  const auth = { authorization: `Bearer ${token}` };
  // Fast path: leaf already exists → all ancestors do too.
  const { response: leaf } = await authorRequest(`${base}${folderPath}.json`, {
    headers: auth,
  }, {
    fetchImpl, timeoutMs: requestTimeoutMs, label: 'DAM folder lookup', retries: 1,
  });
  if (leaf.ok) return { ok: true, status: leaf.status, body: '' };
  if (leaf.status !== 404) {
    return { ok: false, status: leaf.status, body: `DAM folder lookup ${leaf.status}` };
  }

  const tail = folderPath.slice(root.length + 1).split('/').filter(Boolean);
  let acc = root;
  for (const seg of tail) {
    acc = `${acc}/${seg}`;
    const apiPath = acc.replace(/^\/content\/dam\//, ''); // e.g. storyboard/en/skoda-model
    // eslint-disable-next-line no-await-in-loop
    const { response: res } = await authorRequest(`${base}/api/assets/${apiPath}`, {
      method: 'POST',
      headers: { ...auth, 'content-type': 'application/json' },
      body: JSON.stringify({ class: 'assetFolder', properties: { 'jcr:title': seg } }),
    }, {
      fetchImpl,
      timeoutMs: requestTimeoutMs,
      label: `DAM folder create ${apiPath}`,
      retries: 1,
      retry404: true,
    });
    // 200/201 created; 409 already exists (idempotent / concurrent create) — all OK.
    if (!res.ok && res.status !== 409) {
      return { ok: false, status: res.status, body: `mkdir ${apiPath} ${res.status}` };
    }
  }
  return { ok: true, status: 200, body: '' };
}

/**
 * Upload one asset's ORIGINAL bytes into the AEM DAM via direct-binary-upload,
 * into the page-mirrored folder. Returns { ok, status, assetPath, body }.
 * Credentials: bearer token (custom IMS) — pass explicitly from resolveDamToken.
 */
export async function uploadToDAM({
  damConfig, damPath, buffer, filePath, contentType, token, fetchImpl = fetchWithRetry,
  partTimeoutMs = 3600000, partIdleTimeoutMs = 120000, requestTimeoutMs = 60000, partRetries = 2,
  onStage,
}) {
  if (!damConfig || !damConfig.baseUrl) {
    return {
      ok: false, status: 0, assetPath: '', body: 'DAM not configured',
    };
  }
  if (!token) {
    return {
      ok: false, status: 0, assetPath: '', body: 'no DAM token',
    };
  }
  const base = damConfig.baseUrl.replace(/\/$/, '');
  const folder = damPath.slice(0, damPath.lastIndexOf('/'));
  const fileName = damPath.slice(damPath.lastIndexOf('/') + 1);
  const auth = { authorization: `Bearer ${token}` };

  let stage = 'folder';
  try {
    if ((buffer === undefined) === (filePath === undefined)) {
      throw new Error('Provide exactly one of buffer or filePath');
    }
    const size = filePath ? (await stat(filePath)).size : buffer.length;
    if (!Number.isSafeInteger(size) || size < 1) throw new Error('Original has invalid size');
    // 0) ensure the page-mirrored folder chain exists (initiateUpload 404s otherwise).
    onStage?.(stage);
    const mk = await ensureDamFolder({
      damConfig, folderPath: folder, token, fetchImpl, requestTimeoutMs,
    });
    if (!mk.ok) {
      return {
        ok: false, status: mk.status, assetPath: damPath, body: `folder ${mk.body}`,
      };
    }
    // 1) initiateUpload
    const initForm = new URLSearchParams();
    initForm.set('fileName', fileName);
    initForm.set('fileSize', String(size));
    stage = 'initiate';
    onStage?.(stage);
    const { response: initRes, data: init } = await authorRequest(`${base}${folder}.initiateUpload.json`, {
      method: 'POST',
      headers: { ...auth, 'content-type': 'application/x-www-form-urlencoded' },
      body: initForm.toString(),
    }, {
      fetchImpl,
      timeoutMs: requestTimeoutMs,
      label: 'DAM initiate',
      retries: 2,
      retry404: true,
      json: true,
    });
    if (!initRes.ok) {
      return {
        ok: false, status: initRes.status, assetPath: damPath, body: `initiate ${initRes.status}`,
      };
    }
    const file = (init.files && init.files[0]) || {};
    const uploadURIs = file.uploadURIs || [];
    const completeURI = init.completeURI || `${folder}.completeUpload.json`;
    if (!uploadURIs.length) {
      return {
        ok: false, status: 0, assetPath: damPath, body: 'initiate returned no uploadURIs',
      };
    }

    // 2) PUT parts
    const ranges = filePath
      ? partRanges(size, uploadURIs, file.minPartSize, file.maxPartSize)
      : splitBuffer(buffer, uploadURIs, file.maxPartSize, file.minPartSize);
    for (let i = 0; i < ranges.length; i += 1) {
      stage = `part ${i + 1}/${ranges.length}`;
      onStage?.(stage);
      let putRes;
      let failure = '';
      for (let attempt = 0; attempt <= (filePath ? partRetries : 0); attempt += 1) {
        const body = filePath
          ? createReadStream(filePath, { ...ranges[i], highWaterMark: 1024 * 1024 })
          : ranges[i];
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(new Error('DAM upload part deadline exceeded')), partTimeoutMs);
        let idleTimer;
        if (filePath) {
          const resetIdle = () => {
            clearTimeout(idleTimer);
            idleTimer = setTimeout(() => controller.abort(new Error('DAM upload part stalled')), partIdleTimeoutMs);
          };
          body.on('data', resetIdle);
          body.pause();
          resetIdle();
        }
        try {
          // eslint-disable-next-line no-await-in-loop
          const putFetch = filePath && fetchImpl === fetchWithRetry ? fetch : fetchImpl;
          putRes = await putFetch(uploadURIs[i], {
            method: 'PUT',
            headers: {
              'content-type': contentType || 'application/octet-stream',
              'content-length': String(filePath ? ranges[i].end - ranges[i].start + 1 : body.length),
            },
            body,
            ...(filePath ? { duplex: 'half' } : {}),
            signal: controller.signal,
          });
          if (putRes.ok) break;
          // eslint-disable-next-line no-await-in-loop
          failure = (await putRes.text().catch(() => '')).slice(0, 120);
          if (putRes.status !== 429 && putRes.status < 500) break;
        } catch (err) {
          failure = String(err.message || err).slice(0, 120);
        } finally {
          clearTimeout(timer);
          clearTimeout(idleTimer);
          if (filePath) {
            const closed = finished(body);
            body.destroy();
            // eslint-disable-next-line no-await-in-loop
            await closed.catch(() => {});
          }
        }
        if (attempt < partRetries && filePath) {
          // eslint-disable-next-line no-await-in-loop
          await sleep(500 * 2 ** attempt);
        }
      }
      if (!putRes?.ok) {
        return {
          ok: false, status: putRes?.status || 0, assetPath: damPath, body: `part ${i} ${putRes?.status || 0}: ${failure}`,
        };
      }
    }

    // 3) completeUpload
    const compForm = new URLSearchParams();
    compForm.set('fileName', fileName);
    compForm.set('mimeType', contentType || 'application/octet-stream');
    compForm.set('uploadToken', file.uploadToken || '');
    const compUrl = completeURI.startsWith('http') ? completeURI : `${base}${completeURI}`;
    stage = 'complete';
    onStage?.(stage);
    const { response: compRes } = await authorRequest(compUrl, {
      method: 'POST',
      headers: { ...auth, 'content-type': 'application/x-www-form-urlencoded' },
      body: compForm.toString(),
    }, {
      fetchImpl, timeoutMs: requestTimeoutMs, label: 'DAM complete',
    });
    return {
      ok: compRes.ok,
      status: compRes.status,
      assetPath: damPath,
      body: compRes.ok ? '' : `complete ${compRes.status}; outcome requires confirmation`,
      uncertain: !compRes.ok,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      assetPath: damPath,
      body: `${stage}: ${String(err.message || err)}`,
      uncertain: stage === 'complete',
    };
  }
}

/** Confirm an uncertain completion from authenticated author metadata without uploading again. */
export async function verifyDamOriginal({
  damConfig, damPath, token, bytes, contentType, fetchImpl = fetchWithRetry,
  requestTimeoutMs = 60000,
}) {
  if (!damConfig?.baseUrl || !token || !Number.isSafeInteger(bytes) || bytes < 1) {
    throw new Error('Cannot verify DAM original without its expected size and authorization');
  }
  const { response } = await authorRequest(`${damConfig.baseUrl.replace(/\/$/, '')}${damPath}`, {
    method: 'HEAD',
    headers: new Headers({ Authorization: ['Bearer', token].join(' ') }),
    redirect: 'error',
  }, {
    fetchImpl, timeoutMs: requestTimeoutMs, label: 'DAM original HEAD', retries: 1,
  });
  const mime = (response.headers?.get('content-type') || '').split(';')[0].trim().toLowerCase();
  const length = Number(response.headers?.get('content-length'));
  return {
    ok: response.ok && mime === contentType && length === bytes,
    status: response.status,
    body: `author HEAD ${response.status}, ${mime || 'no MIME'}, ${length} bytes; expected ${contentType}, ${bytes}`,
  };
}

/** Activate one validated DAM original; callers constrain the asset type. */
async function activateDamOriginal({
  damConfig, damPath, token, fetchImpl = fetch,
}, extensions) {
  const folder = (damConfig?.folder || '/content/dam/storyboard').replace(/\/$/, '');
  if (!damConfig?.baseUrl || !token || !damPath?.startsWith(`${folder}/`)
    || path.posix.normalize(damPath) !== damPath || !extensions.test(damPath)) {
    throw new Error(`Cannot activate an unconfigured or out-of-scope DAM original: ${damPath}`);
  }
  const response = await fetchImpl(`${damConfig.baseUrl.replace(/\/$/, '')}/bin/replicate.json`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ cmd: 'Activate', path: damPath }).toString(),
    redirect: 'error',
    signal: AbortSignal.timeout(60000),
  });
  if (!response.ok) throw new Error(`DAM activation returned ${response.status} for ${damPath}`);
  if ((response.headers.get('content-type') || '').includes('application/json')) {
    const result = await response.json();
    if (result.success === false || result.error || result.status === 'error') {
      throw new Error(`DAM activation reported failure for ${damPath}`);
    }
  }
  return response.status;
}

/** Activate a PDF/MP4 original on the AEM publish tier. */
export async function publishDamBinary(options) {
  return activateDamOriginal(options, /\.(pdf|mp4)$/i);
}

/** Activate an image original on the AEM publish tier. */
export async function publishDamImage(options) {
  return activateDamOriginal(options, /\.(png|jpe?g|gif|webp|svg|avif)$/i);
}

/**
 * Set asset metadata (provenance) after completeUpload. Best-effort — a failure
 * here doesn't invalidate the uploaded original. Uses the AEM assets metadata API.
 */
export async function setDamMetadata({
  damConfig, damPath, metadata, token, fetchImpl = fetchWithRetry,
}) {
  if (!damConfig || !damConfig.baseUrl || !token) return { ok: false, status: 0 };
  const base = damConfig.baseUrl.replace(/\/$/, '');
  const endpoint = `${base}/api/assets/${damPath.replace(/^\/content\/dam\//, '')}`;
  const props = {};
  if (metadata?.originUrl) props['skoda:sourceUrl'] = metadata.originUrl;
  if (metadata?.alt) props['dc:description'] = metadata.alt;
  if (metadata?.title) props['dc:title'] = metadata.title;
  if (metadata?.sourcePage) props['skoda:sourcePage'] = metadata.sourcePage;
  try {
    const res = await fetchImpl(endpoint, {
      method: 'PUT',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ class: 'asset', properties: props }),
      signal: AbortSignal.timeout(60000),
    });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  }
}
