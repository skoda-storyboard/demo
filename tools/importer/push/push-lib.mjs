/*
 * push-lib.mjs — pure helpers for the DA push + bulk preview/publish tool (SKODA-602).
 * No network, no fs: everything here is unit-tested (push-lib.test.mjs). The I/O lives in
 * tools/importer/push-to-da.mjs.
 *
 * Contract (docs/architecture/IMPORT-PIPELINE.md §2):
 *   content/<path>.plain.html  →  wrapPage()  →  POST admin.da.live/source/{org}/{repo}/<path>.html
 *   → bulk preview job (admin.hlx.page/preview/{org}/{site}/{ref}/*) → validate
 *   → bulk publish job (admin.hlx.page/live/…/*) only when asked.
 */

import { createHash } from 'node:crypto';

/**
 * Source URL (or already-a-path) → EDS page path: no host, no trailing slash, no
 * extension, `/` → `/index`. Mirrors the importers' own path rule
 * (import-*.js: pathname, strip trailing slash + .html, sanitized by the importer).
 * @param {string} input e.g. https://www.skoda-storyboard.com/en/emobility/foo/ or /en/emobility/foo
 * @returns {string} e.g. /en/emobility/foo
 */
export function pagePath(input) {
  const raw = String(input || '').trim();
  if (!raw) return '';
  let p;
  try {
    p = new URL(raw, 'https://www.skoda-storyboard.com').pathname;
  } catch (e) {
    return '';
  }
  p = decodeURIComponent(p).replace(/\.plain\.html$|\.html?$/i, '').replace(/\/+$/, '');
  return p === '' ? '/index' : p;
}

/**
 * Parse a URL/path list file: one entry per line; `#` comments and blanks skipped; an
 * inline `# ALIAS …` note after an entry is ignored. De-duplicated, order kept.
 * @param {string} text file contents
 * @returns {string[]} page paths
 */
export function parseList(text) {
  const out = [];
  String(text || '').split(/\r?\n/).forEach((line) => {
    const entry = line.replace(/\s+#.*$/, '').trim();
    if (!entry || entry.startsWith('#')) return;
    const p = pagePath(entry.split(/\s+/)[0]);
    if (p && !out.includes(p)) out.push(p);
  });
  return out;
}

/**
 * Wrap a bare importer `.plain.html` body in the document shape DA expects (proven in the
 * 2026-09-24 Epiq push: DA stores and returns it byte-for-byte).
 * @param {string} plain the content of content/<path>.plain.html
 */
export function wrapPage(plain) {
  return `<body><header></header><main>${String(plain || '').trim()}</main><footer></footer></body>`;
}

/** Stable content hash (sha256 hex) of a string. */
export function hashOf(text) {
  return createHash('sha256').update(String(text ?? ''), 'utf8').digest('hex');
}

/**
 * The comparable part of a DA document: the `<main>` content, trimmed. The wrapper around
 * it (body/header/footer and whitespace between them) varies by who uploaded the doc —
 * e.g. an earlier push wrote `<body>\n<header></header>\n<main>\n…` — and must not count
 * as an edit (seen on /en/press-releases/skoda-auto-klaus-zellmer-to-leave-the-company,
 * 2026-09-25). Documents without a <main> compare as a whole, trimmed.
 */
export function mainContent(doc) {
  const text = String(doc ?? '');
  const m = text.match(/<main[^>]*>([\s\S]*)<\/main>/i);
  return (m ? m[1] : text).trim();
}

/** Hash used for all local/DA/manifest comparisons: hash of the normalised <main> content. */
export function contentHash(doc) {
  return hashOf(mainContent(doc));
}

/**
 * Decide what to do with one page (the overwrite-protection core).
 *
 * @param {object} p
 * @param {string} p.localHash   hash of the wrapped local document
 * @param {string|null} p.remoteHash hash of the current DA document, null when DA has none
 * @param {object|undefined} p.record the manifest entry from our last push ({ hash })
 * @param {boolean} [p.force] overwrite even on conflict
 * @returns {{action: 'new'|'unchanged'|'update'|'conflict'|'overwrite', reason: string}}
 *
 *  - new        DA has no document → push.
 *  - unchanged  DA already holds exactly the local document → skip (and adopt into the
 *               manifest if it was pushed before the manifest existed).
 *  - update     local changed, DA still equals what we pushed last → push.
 *  - conflict   DA differs from our last push (an author edited it), or DA holds a
 *               document we have no record of → refuse, report.
 *  - overwrite  a conflict pushed anyway because --force was given.
 */
export function decideAction({
  localHash, remoteHash, record, force = false,
}) {
  if (remoteHash == null) return { action: 'new', reason: 'not in DA' };
  if (remoteHash === localHash) return { action: 'unchanged', reason: 'DA already matches local' };
  if (record && record.hash === remoteHash) {
    return { action: 'update', reason: 'local changed; DA still matches last push' };
  }
  const reason = record
    ? 'DA changed since our last push (edited in DA?)'
    : 'DA has a document we have no push record of';
  return force ? { action: 'overwrite', reason: `${reason}; --force` } : { action: 'conflict', reason };
}

/** Actions that result in a DA write. */
export const PUSHING = new Set(['new', 'update', 'overwrite']);

/** Split a list into chunks of at most `size` (bulk jobs + the 10 req/s admin limit). */
export function chunk(list, size) {
  const n = Math.max(1, Math.floor(size) || 1);
  const out = [];
  for (let i = 0; i < list.length; i += n) out.push(list.slice(i, i + n));
  return out;
}

/**
 * Normalise a bulk-job `/details` payload into per-path results.
 * admin.hlx.page returns `{ state, progress, data: { resources: [{ path, status, error }] } }`
 * (verified on a live preview job 2026-09-25).
 * @returns {{done: boolean, state: string, results: Record<string,{status:number,error?:string}>}}
 */
export function parseJobDetails(details) {
  const state = (details && details.state) || 'unknown';
  const done = state === 'stopped';
  const results = {};
  const resources = (details && details.data && details.data.resources) || [];
  resources.forEach((r) => {
    if (!r || !r.path) return;
    results[r.path] = r.error ? { status: r.status, error: r.error } : { status: r.status };
  });
  return { done, state, results };
}

/**
 * Shared fragments a page depends on: the header/footer blocks load `/nav` and `/footer`
 * unless page metadata overrides them (blocks/header/header.js, blocks/footer/footer.js).
 * Reads a `nav` / `footer` row from the importer's Metadata block.
 * @param {string[]} plains the `.plain.html` bodies of the batch
 * @returns {string[]} unique fragment paths, defaults first
 */
export function fragmentPaths(plains) {
  const out = ['/nav', '/footer'];
  (plains || []).forEach((plain) => {
    // key/value rows `<div><div>nav</div><div>/path</div></div>` (Metadata block shape)
    const text = String(plain || '');
    const re = /<div><div>(nav|footer)<\/div><div>([^<]+)<\/div><\/div>/gi;
    let m = re.exec(text);
    while (m) {
      const p = pagePath(m[2]);
      if (p && !out.includes(p)) out.push(p);
      m = re.exec(text);
    }
  });
  return out;
}

/**
 * Post-preview content check on a previewed `.plain.html`: images must be served from the
 * site's media bus (`./media_<hash>`), not left pointing at the source CDN (that means the
 * media-bus ingest failed — typically an oversized master, SKODA-506).
 * @returns {{images: number, selfHosted: number, external: string[]}}
 */
export function imageCheck(plainHtml) {
  const srcs = [...String(plainHtml || '').matchAll(/<img[^>]*\ssrc="([^"]+)"/g)].map((m) => m[1]);
  const external = srcs.filter((s) => /^https?:\/\/cdn\.skoda-storyboard\.com\//i.test(s));
  return {
    images: srcs.length,
    selfHosted: srcs.filter((s) => /(^|\/)media_[0-9a-f]+\./i.test(s)).length,
    external,
  };
}

/** Count per-page outcomes for the run summary. */
export function summarize(pages) {
  const counts = {};
  (pages || []).forEach((p) => {
    counts[p.action] = (counts[p.action] || 0) + 1;
  });
  return counts;
}
