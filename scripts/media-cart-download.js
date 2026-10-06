/*
 * media-cart-download.js — the media cart's download (SKODA-505a), loaded on the first
 * download only.
 *
 * One item: a plain download link to the DAM original (the publish host sends it as an
 * attachment with its filename). Several: each original is fetched in turn (CORS, no
 * credentials), checked against its indexed size, and stored uncompressed in one zip
 * (JPEG / PNG / MP4 / PDF don't shrink; STORE keeps it fast). The vendored fflate is only
 * imported here. Items that fail are skipped and reported; an abort (until the save)
 * stops everything and saves nothing. Memory: one original is held at a time; after each
 * file the zip output so far is folded into a Blob, which the browser keeps outside the JS
 * heap (and may page to disk), and the final zip is a Blob of those Blobs, not a copy.
 * media-cart.js applies the caps before calling, so the zip stays under 4 GiB (fflate
 * writes no ZIP64).
 */

const pad = (n) => String(n).padStart(2, '0');

/** `skoda-storyboard-media-YYYY-MM-DD.zip` (local date). */
export function zipName(date = new Date()) {
  return `skoda-storyboard-media-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.zip`;
}

/**
 * Unique, safe entry names: path separators and control characters out, repeats get
 * " (2)", " (3)" before the extension (case-insensitive, as on most file systems).
 * @param {string[]} names
 * @returns {string[]}
 */
export function uniqueNames(names) {
  const used = new Set();
  return names.map((raw) => {
    // eslint-disable-next-line no-control-regex
    const clean = String(raw || '').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '_').replace(/^\.+/, '').trim() || 'file';
    const dot = clean.lastIndexOf('.');
    const stem = dot > 0 ? clean.slice(0, dot) : clean;
    const ext = dot > 0 ? clean.slice(dot) : '';
    let name = clean;
    for (let n = 2; used.has(name.toLowerCase()); n += 1) name = `${stem} (${n})${ext}`;
    used.add(name.toLowerCase());
    return name;
  });
}

const abortError = () => new DOMException('The download was aborted.', 'AbortError');

function save(doc, href, filename) {
  const a = doc.createElement('a');
  a.href = href;
  a.download = filename;
  a.rel = 'noopener';
  a.hidden = true;
  doc.body.append(a);
  a.click();
  a.remove();
}

// the whole body of one original, or throws (HTTP error, size mismatch, abort)
async function fetchOriginal(item, { fetchImpl, signal, onChunk }) {
  const res = await fetchImpl(item.url, { mode: 'cors', credentials: 'omit', signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const chunks = [];
  let size = 0;
  const reader = res.body.getReader();
  for (;;) {
    // eslint-disable-next-line no-await-in-loop
    const { done, value } = await reader.read();
    if (done) break;
    if (signal?.aborted) throw abortError();
    chunks.push(value);
    size += value.length;
    onChunk(value.length);
  }
  if (item.bytes > 0 && size !== item.bytes) throw new Error(`size ${size}, expected ${item.bytes}`);
  return chunks;
}

/**
 * Download cart items (see media-cart.js for their shape).
 * @param {Array<{url: string, filename: string, bytes: number}>} items
 * @param {object} [o]
 * @param {function({done: number, total: number, loaded: number, totalBytes: number,
 *   item: object}): void} [o.onProgress]
 * @param {AbortSignal} [o.signal]
 * @returns {Promise<{mode: 'none'|'single'|'zip', filename: string|null,
 *   failed: Array<{item: object, reason: string}>, bytes?: number}>}
 */
export async function downloadItems(items, {
  onProgress = () => {},
  signal,
  fetchImpl = (...args) => fetch(...args),
  loadZip = () => import('./vendor/fflate.js'),
  doc = document,
  now = () => new Date(),
  createObjectURL = (blob) => URL.createObjectURL(blob),
  revokeObjectURL = (url) => URL.revokeObjectURL(url),
  // give the browser time to start reading the blob before it is released
  later = (fn) => setTimeout(fn, 60000),
} = {}) {
  if (signal?.aborted) throw abortError();
  if (!items?.length) return { mode: 'none', filename: null, failed: [] };
  if (items.length === 1) {
    const [item] = items;
    save(doc, item.url, item.filename);
    onProgress({
      done: 1, total: 1, loaded: item.bytes, totalBytes: item.bytes, item,
    });
    return { mode: 'single', filename: item.filename, failed: [] };
  }

  const { Zip, ZipPassThrough } = await loadZip();
  if (signal?.aborted) throw abortError();
  const names = uniqueNames(items.map((it) => it.filename));
  const totalBytes = items.reduce((sum, it) => sum + (it.bytes || 0), 0);
  // zip output not yet folded, and the Blobs it was folded into (one per stored file)
  let parts = [];
  const blobs = [];
  const fold = () => {
    if (!parts.length) return;
    blobs.push(new Blob(parts));
    parts = [];
  };
  let zipError = null;
  const zip = new Zip((err, data) => {
    if (err) zipError = err;
    else parts.push(data);
  });
  const mtime = now();
  const failed = [];
  let loaded = 0;
  let stored = 0;

  // one at a time: bounded memory, and the DAM isn't hit by 80 parallel requests
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    const before = loaded;
    let got = 0;
    try {
      // eslint-disable-next-line no-await-in-loop
      const chunks = await fetchOriginal(item, {
        fetchImpl,
        signal,
        onChunk: (n) => {
          got += n;
          onProgress({
            done: i, total: items.length, loaded: before + got, totalBytes, item,
          });
        },
      });
      const file = new ZipPassThrough(names[i]);
      file.mtime = mtime;
      zip.add(file);
      if (!chunks.length) file.push(new Uint8Array(0), true);
      chunks.forEach((chunk, c) => file.push(chunk, c === chunks.length - 1));
      // this file's bytes leave the JS heap before the next one is fetched
      fold();
      stored += 1;
    } catch (e) {
      if (e?.name === 'AbortError' || signal?.aborted) throw abortError();
      failed.push({ item, reason: e?.message || 'failed' });
    }
    loaded += item.bytes || got;
    onProgress({
      done: i + 1, total: items.length, loaded, totalBytes, item,
    });
  }

  if (signal?.aborted) throw abortError();
  if (!stored) return { mode: 'zip', filename: null, failed };
  zip.end();
  if (zipError) throw zipError;
  fold();
  const blob = new Blob(blobs, { type: 'application/zip' });
  const filename = zipName(now());
  const href = createObjectURL(blob);
  save(doc, href, filename);
  later(() => revokeObjectURL(href));
  return {
    mode: 'zip', filename, failed, bytes: blob.size,
  };
}
