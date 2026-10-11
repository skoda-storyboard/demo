/*
 * Media cart resolver (SKODA-505a): a page's download link → the published DAM original.
 *
 * Imported pages and the media feed still link the source files (www.skoda-storyboard.com
 * /direct-download/…, cdn.skoda-storyboard.com/…), and DA drops any data-* id, so identity
 * comes from the href. The lookup is the generated `/scripts/media-cart-index.json`
 * (tools/importer/media/build-cart-index.mjs, from the media manifest's verified publish
 * rows), loaded once on the first resolve. A link already on the DAM publish host passes
 * through (size + type from the index, else a HEAD). Anything else resolves to null: the
 * cart never downloads from the retiring source site.
 */

export const DAM_HOST = 'https://publish-p220607-e2281243.adobeaemcloud.com';
export const DAM_ROOT = '/content/dam/';

const FIRST_PARTY = /(^|\.)skoda-storyboard\.com$/i;
const SOURCE_PREFIX = /^\/(?:direct-download|wp-content\/uploads)\//;
// WordPress scaled sizes (`-1920x1280`) and the big-image copy (`-scaled`) of one upload
const DERIVATIVE = /-(?:\d{2,5}x\d{2,5}|scaled)(?=\.[a-z0-9]+$)/i;

const parse = (href) => {
  try {
    return new URL(href);
  } catch {
    return null;
  }
};

/**
 * Host-less lookup key of a first-party source link, e.g.
 * https://www.skoda-storyboard.com/direct-download/2025/05/a.jpg → `2025/05/a.jpg`
 * (the cdn and the direct-download route serve the same upload). Path stays in URL
 * (percent-encoded) form; query and hash are dropped. Null for anything else.
 */
export function normalizeSource(href) {
  const u = parse(href);
  if (!u || !/^https?:$/.test(u.protocol) || !FIRST_PARTY.test(u.hostname)) return null;
  const key = u.pathname.replace(SOURCE_PREFIX, '/').replace(/^\/+/, '');
  return key && !key.endsWith('/') ? key : null;
}

/** The key of the upload a scaled derivative was made from (`a-1920x1280.jpg` → `a.jpg`). */
export function stripDerivative(key) {
  let out = key;
  let prev;
  do {
    prev = out;
    out = out.replace(DERIVATIVE, '');
  } while (out !== prev);
  return out;
}

/** DAM asset path of a link already on the publish host, else null. */
export function damPath(href) {
  const u = parse(href);
  if (!u || u.origin !== DAM_HOST || !u.pathname.startsWith(DAM_ROOT)) return null;
  return u.pathname.endsWith('/') ? null : u.pathname;
}

export function kindOf(mime = '') {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  return 'document';
}

export function filenameOf(path) {
  const seg = path.slice(path.lastIndexOf('/') + 1);
  try {
    return decodeURIComponent(seg);
  } catch {
    return seg;
  }
}

/** Expand the compact index file (see build-cart-index.mjs) into lookups. */
export function decodeIndex(json) {
  if (json?.v !== 1 || !Array.isArray(json.assets) || !json.keys || typeof json.keys !== 'object') {
    throw new Error('media cart index: unsupported format');
  }
  const base = typeof json.base === 'string' ? json.base : '';
  const mimes = Array.isArray(json.mimes) ? json.mimes : [];
  const assets = json.assets.map(([path, bytes, mime]) => ({
    path: `${base}${path}`, bytes: Number(bytes) || 0, mime: mimes[mime] || '',
  }));
  return {
    assets,
    keys: new Map(Object.entries(json.keys)),
    byPath: new Map(assets.map((a, i) => [a.path, i])),
  };
}

const defaultIndexUrl = () => `${window.hlx?.codeBasePath || ''}/scripts/media-cart-index.json`;

// the DAM or the network may recover: not a verdict on the asset
const transient = (status) => status >= 500 || status === 408 || status === 429;

/**
 * `fetchImpl` / `indexUrl` are injectable for tests. A failed index load is not cached, so
 * the next resolve retries.
 */
export function createResolver({
  fetchImpl = (...args) => fetch(...args), indexUrl = defaultIndexUrl,
} = {}) {
  let pending = null;

  function loadIndex() {
    if (!pending) {
      pending = (async () => {
        const res = await fetchImpl(typeof indexUrl === 'function' ? indexUrl() : indexUrl);
        if (!res.ok) throw new Error(`media cart index: HTTP ${res.status}`);
        return decodeIndex(await res.json());
      })();
      pending.catch(() => { pending = null; });
    }
    return pending;
  }

  const item = (path, bytes, mime) => ({
    id: path, url: `${DAM_HOST}${path}`, filename: filenameOf(path), bytes, mime, kind: kindOf(mime),
  });

  // a DAM link the index doesn't know yet (published after the last index build); a
  // network error or a 5xx throws, a 4xx or an unsized answer is a miss
  async function head(path) {
    const res = await fetchImpl(`${DAM_HOST}${path}`, { method: 'HEAD', mode: 'cors', credentials: 'omit' });
    if (!res.ok && transient(res.status)) throw new Error(`media cart: HEAD ${res.status}`);
    const bytes = Number(res.headers.get('content-length'));
    if (!res.ok || !(bytes > 0)) return null;
    return item(path, bytes, (res.headers.get('content-type') || '').split(';')[0].trim());
  }

  // one HEAD per DAM path for the page: the hover sweep, a later click and other controls
  // for the same file share the request and its answer. A rejection (network, 5xx/408/429)
  // is not kept, so the next resolve tries again.
  const heads = new Map();
  function headOnce(path) {
    if (!heads.has(path)) {
      const answer = head(path);
      heads.set(path, answer);
      answer.catch(() => heads.delete(path));
    }
    return heads.get(path);
  }

  /**
   * → `{ id, url, filename, bytes, mime, kind, sourceKey }`, or null when the link has no
   * published original. `id` is the DAM asset path (the cart's dedupe key), `url` the
   * published original. Rejects when the index or the DAM can't be reached (try again).
   */
  async function resolve(href) {
    const dam = damPath(href);
    const sourceKey = dam ? null : normalizeSource(href);
    if (!dam && !sourceKey) return null;
    let index = null;
    try {
      index = await loadIndex();
    } catch (e) {
      if (!dam) throw e;
    }
    if (dam) {
      const i = index?.byPath.get(dam);
      if (i === undefined) return headOnce(dam);
      const a = index.assets[i];
      return { ...item(a.path, a.bytes, a.mime), sourceKey };
    }
    const i = index.keys.get(sourceKey) ?? index.keys.get(stripDerivative(sourceKey));
    const a = index.assets[i];
    if (!a) return null;
    return { ...item(a.path, a.bytes, a.mime), sourceKey };
  }

  return { resolve, loadIndex };
}

const shared = createResolver();
export const { resolve, loadIndex } = shared;
