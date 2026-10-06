// eslint-disable-next-line import/no-extraneous-dependencies
import { JSDOM } from 'jsdom';
import { isIP } from 'node:net';

const MIME = { document: 'application/pdf', video: 'video/mp4' };
const SOURCE = 'https://www.skoda-storyboard.com';

export function binaryMime(row) {
  const mime = row.mime_type || MIME[row.kind];
  if (mime !== MIME[row.kind] && !(row.kind === 'video' && mime === 'video/quicktime')) {
    throw new Error(`Unsupported original binary MIME: ${mime}`);
  }
  return mime;
}

export function binaryKind(href, declaredType = '') {
  try {
    const url = new URL(href, SOURCE);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    const declared = declaredType.split(';')[0].trim().toLowerCase();
    if (declared === MIME.document) return 'document';
    if (declared === MIME.video) return 'video';
    if (/\.pdf$/i.test(url.pathname)) return 'document';
    if (/\.mp4$/i.test(url.pathname)) return 'video';
  } catch {
    return null;
  }
  return null;
}

export function binarySource(href, pagePath = '') {
  const base = pagePath ? `${SOURCE}/${pagePath.replace(/^\/|\/$/g, '')}/` : SOURCE;
  const url = new URL(href, base);
  url.hash = '';
  url.search = '';
  return url.href;
}

export function publicBinaryUrl(href) {
  try {
    const url = new URL(href);
    const hostname = url.hostname.replace(/^\[|\]$/g, '');
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash
      || !binaryKind(href)
      || /(?:^|\.)skoda-storyboard\.com$/i.test(url.hostname)
      || /(?:^|\.)admin\.da\.live$/i.test(url.hostname)
      || /(?:^|\.)admin\.hlx\.page$/i.test(url.hostname)
      || /^author-[^.]+\.adobeaemcloud\.com$/i.test(url.hostname)
      || isIP(hostname)
      || /(?:^|\.)(?:localhost|local|internal)$/i.test(hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

export function binaryAnchors(html) {
  const { document } = new JSDOM(html).window;
  return [...document.querySelectorAll('a[href]')].flatMap((a) => {
    const href = a.getAttribute('href');
    const kind = binaryKind(href, a.getAttribute('type') || '');
    return kind ? [{
      href,
      kind,
      label: (a.textContent || '').replace(/\s+/g, ' ').trim(),
      title: a.getAttribute('aria-label') || a.getAttribute('title') || '',
    }] : [];
  });
}

export function binaryLookups(manifest) {
  const urls = new Map();
  for (const row of Object.values(manifest.rows || {})) {
    if (!MIME[row.kind]) continue;
    for (const url of [row.source_url, ...(row.seen_urls || []), row.public_url].filter(Boolean)) {
      urls.set(binarySource(url), row);
    }
  }
  return urls;
}

export function binaryErrors(html, manifest, pagePath = '') {
  const { document } = new JSDOM(html).window;
  const errors = [];
  const lookup = binaryLookups(manifest);
  document.querySelectorAll('img, source, picture, video, embed, object, iframe').forEach((element) => {
    ['src', 'srcset', 'data'].forEach((attr) => {
      const refs = attr === 'srcset'
        ? (element.getAttribute(attr) || '').split(',').map((part) => part.trim().split(/\s+/)[0])
        : [element.getAttribute(attr) || ''];
      if (refs.some((ref) => binaryKind(ref, element.getAttribute('type') || ''))) {
        errors.push(`${element.localName} ${attr} points at a PDF/MP4`);
      }
    });
  });
  const seen = new Set();
  // CDN and /direct-download/ aliases of one original are separate rows sharing a DAM asset;
  // the page links it once, so a row counts as present when its asset is.
  const seenAssets = new Set();
  for (const {
    href, kind, label, title,
  } of binaryAnchors(html)) {
    const row = lookup.get(binarySource(href, pagePath));
    if (row) {
      seen.add(row.logical_id);
      if (row.dam_asset_path) seenAssets.add(row.dam_asset_path);
    }
    if (!row || row.kind !== kind || row.status !== 'done'
      || row.steps?.dam !== 'done' || row.steps?.publish !== 'done'
      || !row.dam_asset_path || !row.public_url || !publicBinaryUrl(row.public_url)
      || row.public_verified?.url !== row.public_url
      || row.public_verified?.mime !== binaryMime(row)
      || !Number.isSafeInteger(row.public_verified?.bytes)
      || !Number.isSafeInteger(row.bytes)
      || row.bytes < 1
      || row.public_verified.bytes !== row.bytes) {
      errors.push(`unverified ${kind} link: ${href}`);
    } else if (href !== row.public_url) {
      errors.push(`binary link not re-hosted: ${href}`);
    }
    if (!label && !title) errors.push(`binary link has no accessible label: ${href}`);
  }
  if (pagePath) {
    Object.values(manifest.rows || {}).filter((row) => MIME[row.kind]
      && (row.page_refs || []).includes(pagePath) && !seen.has(row.logical_id)
      && !(row.dam_asset_path && seenAssets.has(row.dam_asset_path)))
      .forEach((row) => errors.push(`imported binary link missing: ${row.logical_id}`));
  }
  return errors;
}

export function rewriteBinaryLinks(html, manifest, pagePath = '') {
  const lookup = binaryLookups(manifest);
  const errors = [];
  let rewrites = 0;
  const updated = html.replace(/<a\b[^>]*>/gi, (tag) => {
    const target = tag.match(/(\shref\s*=\s*)(?:(["'])(.*?)\2|([^\s>]+))/i);
    if (!target) return tag;
    const [, prefix, quote, quotedHref, bareHref] = target;
    const href = (quotedHref ?? bareHref).replace(/&amp;/gi, '&');
    const typeMatch = tag.match(/\stype\s*=\s*(?:(["'])(.*?)\1|([^\s>]+))/i);
    const type = typeMatch?.[2] ?? typeMatch?.[3] ?? '';
    const kind = binaryKind(href, type);
    if (!kind) return tag;
    const row = lookup.get(binarySource(href, pagePath));
    if (!row || row.kind !== kind || row.status !== 'done'
      || row.steps?.dam !== 'done' || row.steps?.publish !== 'done'
      || !publicBinaryUrl(row.public_url)
      || row.public_verified?.url !== row.public_url
      || row.public_verified?.mime !== binaryMime(row)
      || !Number.isSafeInteger(row.public_verified?.bytes)
      || !Number.isSafeInteger(row.bytes)
      || row.bytes < 1
      || row.public_verified.bytes !== row.bytes) {
      errors.push(`unverified ${kind} link: ${href}`);
      return tag;
    }
    if (href === row.public_url) return tag;
    rewrites += 1;
    const delimiter = quote || '"';
    return tag.replace(target[0], `${prefix}${delimiter}${row.public_url}${delimiter}`);
  });
  return {
    html: updated,
    rewrites,
    errors: [...errors, ...binaryErrors(updated, manifest, pagePath)],
  };
}

export async function verifyPublicBinary(url, kind, bytes, {
  attempts = 1, intervalMs = 2000, mime: expectedMime = MIME[kind],
} = {}) {
  if (!publicBinaryUrl(url)) throw new Error(`Not a public Assets binary URL: ${url}`);
  binaryMime({ kind, mime_type: expectedMime });
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    // eslint-disable-next-line no-await-in-loop
    const response = await fetch(url, {
      method: 'HEAD', redirect: 'error', signal: AbortSignal.timeout(20000),
    });
    if (response.status === 404 && attempt < attempts - 1) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => { setTimeout(resolve, intervalMs); });
      continue;
    }
    if (!response.ok) throw new Error(`Public binary HEAD returned ${response.status}: ${url}`);
    const mime = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    const size = Number(response.headers.get('content-length'));
    if (mime !== expectedMime || !Number.isSafeInteger(size) || size < 1 || size !== bytes) {
      throw new Error(`Public binary type/size mismatch: ${url} (${mime}, ${size} bytes; expected ${expectedMime}, ${bytes})`);
    }
    return { url, mime, bytes: size };
  }
  throw new Error(`No public binary HEAD attempts were made: ${url}`);
}

export async function probeBinaryBytes(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const head = await fetch(url, { method: 'HEAD', signal: controller.signal });
    const size = Number(head.headers.get('content-length'));
    if (head.ok && Number.isSafeInteger(size) && size > 0) return size;
    const range = await fetch(url, {
      headers: { Range: 'bytes=0-0' },
      signal: controller.signal,
    });
    const total = range.headers.get('content-range')?.match(/\/(\d+)$/)?.[1];
    const length = Number(total || (range.ok ? range.headers.get('content-length') : null));
    await range.body?.cancel();
    return range.ok && Number.isSafeInteger(length) && length > 0 ? length : null;
  } finally {
    clearTimeout(timer);
  }
}
