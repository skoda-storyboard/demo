/*
 * media-lib.mjs — reusable helpers for the Škoda image-import mechanism.
 *
 * Pure/dependency-free (Node 24 built-ins only: fetch, fs, crypto, path).
 * Shared by build-media-manifest.mjs and apply-media-manifest.mjs so any page
 * set in this project can ingest its images into the AEM DAM (system of record,
 * ORIGINALS) and rewrite content to media-bus-deliverable URLs.
 *
 * Grounded in docs/media/SKODA-MEDIA-DEEP-DIVE.md + SKODA-ASSET-MAPPING.md and
 * tickets SKODA-501 (masters-only), SKODA-504 (manifest), SKODA-506 (pre-condition).
 *
 * Two mechanisms this supports:
 *   A) delivery: content <img> → EDS media bus (rewrite to an absolute URL EDS ingests)
 *   B) media-cart "download original" → the DAM asset path is the join key
 */

import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

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

export function needsMediaBuild(row, { dam = false, da = false, force = false } = {}) {
  if (force || !row || row.status !== 'done') return true;
  // A document row has no delivery step; only the DAM original can be outstanding.
  if (row.kind === 'document') return dam && (row.steps?.dam !== 'done' || !row.dam_asset_path);
  if (row.steps?.deliver !== 'done' || !row.delivery_url
    || !Number.isFinite(row.bytes) || row.bytes > OVERSIZE_BYTES) return true;
  if (dam && (row.steps?.dam !== 'done' || !row.dam_asset_path)) return true;
  if (da && (row.steps?.da !== 'done' || !row.original_download_url)) return true;
  return false;
}

// The named WordPress scaled-ladder sizes (SKODA-MEDIA-DEEP-DIVE §2), largest
// first. Used both as the pre-condition fallback ladder (F4) and to distinguish
// scaled derivatives from aspect crops (F7).
const DERIVATIVE_LADDER = ['2560x1707', '2048x1365', '1920x1280', '1536x1024', '1440x960', '768x512', '384x256', '272x182'];
const LADDER_SET = new Set(DERIVATIVE_LADDER);

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

/** Aspect ratios differ beyond tolerance (F7 crop confirmation). */
export function ratiosDiffer(a, b, tol = 0.02) {
  if (!a || !b || !a.w || !a.h || !b.w || !b.h) return false;
  const ra = a.w / a.h;
  const rb = b.w / b.h;
  return Math.abs(ra - rb) / Math.max(ra, rb) > tol;
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
 * step down the ladder to the largest rendition under threshold (SKODA-506).
 *
 * Returns { url, bytes, preconditioned, ok, reason }.
 *  - ok=false → NO safe delivery rendition (all oversized / master unreachable
 *    with an oversized fallback). Caller marks the row skipped/error, NOT done,
 *    and does not set delivery_url. The DAM still gets the original separately.
 */
export async function pickIngestUrl(sourceUrl, { oversizeBytes = OVERSIZE_BYTES } = {}) {
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

  // Master oversized: step down the ladder to the first rendition under limit.
  const ext = path.extname(cleanUrl(master));
  const base = master.slice(0, master.length - ext.length);
  for (const size of DERIVATIVE_LADDER) {
    const candidate = `${base}-${size}${ext}`;
    const bytes = await headBytes(candidate);
    if (bytes !== null && bytes <= oversizeBytes) {
      return {
        url: candidate, bytes, preconditioned: true, ok: true, reason: `oversize-master(${masterBytes})->${size}`,
      };
    }
  }
  // No rendition under threshold — decline (F4: never ship an oversized master).
  return {
    url: master, bytes: masterBytes, preconditioned: false, ok: false, reason: `oversize-no-derivative-under-threshold(${masterBytes})`,
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

/** Split a buffer into N parts to match the count of returned uploadURIs. */
export function splitBuffer(buffer, uploadURIs, maxPartSize) {
  const n = uploadURIs.length;
  if (!n || !buffer.length || (maxPartSize && buffer.length > n * maxPartSize)) {
    throw new Error('DAM upload URIs cannot hold the complete original');
  }
  if (n === 1) return [buffer];
  const part = Math.ceil(buffer.length / n);
  const size = maxPartSize ? Math.min(part, maxPartSize) : part;
  const parts = [];
  for (let off = 0; off < buffer.length; off += size) {
    parts.push(buffer.subarray(off, Math.min(off + size, buffer.length)));
  }
  if (parts.length !== n) throw new Error('DAM upload URI count does not match original parts');
  return parts;
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
  damConfig, folderPath, token, fetchImpl = fetchWithRetry,
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
  const leaf = await fetchImpl(`${base}${folderPath}.json`, { headers: auth });
  if (leaf.ok) return { ok: true, status: leaf.status, body: '' };

  const tail = folderPath.slice(root.length + 1).split('/').filter(Boolean);
  let acc = root;
  for (const seg of tail) {
    acc = `${acc}/${seg}`;
    const apiPath = acc.replace(/^\/content\/dam\//, ''); // e.g. storyboard/en/skoda-model
    // eslint-disable-next-line no-await-in-loop
    const res = await fetchImpl(`${base}/api/assets/${apiPath}`, {
      method: 'POST',
      headers: { ...auth, 'content-type': 'application/json' },
      body: JSON.stringify({ class: 'assetFolder', properties: { 'jcr:title': seg } }),
    });
    // 200/201 created; 409 already exists (idempotent / concurrent create) — all OK.
    if (!res.ok && res.status !== 409) {
      // eslint-disable-next-line no-await-in-loop
      const body = await res.text().catch(() => '');
      return { ok: false, status: res.status, body: `mkdir ${apiPath} ${res.status}: ${body.slice(0, 120)}` };
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
  damConfig, damPath, buffer, contentType, token, fetchImpl = fetchWithRetry,
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

  try {
    // 0) ensure the page-mirrored folder chain exists (initiateUpload 404s otherwise).
    const mk = await ensureDamFolder({
      damConfig, folderPath: folder, token, fetchImpl,
    });
    if (!mk.ok) {
      return {
        ok: false, status: mk.status, assetPath: damPath, body: `folder ${mk.body}`,
      };
    }
    // 1) initiateUpload
    const initForm = new URLSearchParams();
    initForm.set('fileName', fileName);
    initForm.set('fileSize', String(buffer.length));
    const initRes = await fetchImpl(`${base}${folder}.initiateUpload.json`, {
      method: 'POST',
      headers: { ...auth, 'content-type': 'application/x-www-form-urlencoded' },
      body: initForm.toString(),
    });
    if (!initRes.ok) {
      const body = await initRes.text().catch(() => '');
      return {
        ok: false, status: initRes.status, assetPath: damPath, body: `initiate ${initRes.status}: ${body.slice(0, 160)}`,
      };
    }
    const init = await initRes.json();
    const file = (init.files && init.files[0]) || {};
    const uploadURIs = file.uploadURIs || [];
    const completeURI = init.completeURI || `${folder}.completeUpload.json`;
    if (!uploadURIs.length) {
      return {
        ok: false, status: 0, assetPath: damPath, body: 'initiate returned no uploadURIs',
      };
    }

    // 2) PUT parts
    const parts = splitBuffer(buffer, uploadURIs, file.maxPartSize);
    for (let i = 0; i < uploadURIs.length; i += 1) {
      const partBuf = parts[i];
      const putRes = await fetchImpl(uploadURIs[i], {
        method: 'PUT',
        headers: { 'content-type': contentType || 'application/octet-stream' },
        body: partBuf,
      });
      if (!putRes.ok) {
        const body = await putRes.text().catch(() => '');
        return {
          ok: false, status: putRes.status, assetPath: damPath, body: `part ${i} ${putRes.status}: ${body.slice(0, 120)}`,
        };
      }
    }

    // 3) completeUpload
    const compForm = new URLSearchParams();
    compForm.set('fileName', fileName);
    compForm.set('mimeType', contentType || 'application/octet-stream');
    compForm.set('uploadToken', file.uploadToken || '');
    const compUrl = completeURI.startsWith('http') ? completeURI : `${base}${completeURI}`;
    const compRes = await fetchImpl(compUrl, {
      method: 'POST',
      headers: { ...auth, 'content-type': 'application/x-www-form-urlencoded' },
      body: compForm.toString(),
    });
    const body = await compRes.text().catch(() => '');
    return {
      ok: compRes.ok, status: compRes.status, assetPath: damPath, body: body.slice(0, 160),
    };
  } catch (err) {
    return {
      ok: false, status: 0, assetPath: damPath, body: String(err.message || err),
    };
  }
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
    });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  }
}
