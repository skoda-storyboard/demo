// eslint-disable-next-line import/no-extraneous-dependencies
import { JSDOM } from 'jsdom';
import {
  OVERSIZE_BYTES, logicalId, sizedRenditions, isAspectCrop,
  derivativeSuffix, ratiosDiffer, isImageUrl,
} from './media-lib.mjs';

const TIMEOUT_MS = 20000;
// The source CDN is S3-backed: a missing object answers 403, not 404.
const MISSING = new Set([403, 404]);
// Narrower substitutes (e.g. a -272x182 thumbnail) would render as a blown-up
// thumbnail in a full-width body slot; strip or block instead.
export const MIN_SUBSTITUTE_WIDTH = 768;

export function imageLimit(value = OVERSIZE_BYTES) {
  const bytes = Number(value);
  if (!Number.isSafeInteger(bytes) || bytes < 1) {
    throw new Error('Maximum inline image size must be a positive integer number of bytes');
  }
  return bytes;
}

export function imageWidth(value = MIN_SUBSTITUTE_WIDTH) {
  const px = Number(value);
  if (!Number.isSafeInteger(px) || px < 1) {
    throw new Error('Minimum substitute image width must be a positive integer number of pixels');
  }
  return px;
}

function tooNarrow(url, minWidth) {
  const suffix = derivativeSuffix(url);
  return !!suffix && Number(suffix.split('x')[0]) < minWidth;
}

// Extension-less URLs (e.g. Vimeo thumbnails) pass only on an image/* content-type.
function checkType(url, type, typed) {
  if (type && !/^image\//i.test(type) && !/^application\/octet-stream/i.test(type)) {
    throw new Error(`Not an image response: ${url} (${type})`);
  }
  if (!typed && !/^image\//i.test(type || '')) {
    throw new Error(`Not an image response: ${url} (${type || 'no content-type'})`);
  }
}

function imageReferences(img) {
  const picture = img.closest('picture');
  const attrs = [img, ...(picture ? [...picture.querySelectorAll('source')] : [])];
  const refs = [];
  for (const element of attrs) {
    if (element.hasAttribute('src')) refs.push(element.getAttribute('src'));
    for (const attr of ['srcset', 'data-srcset']) {
      if (element.hasAttribute(attr)) {
        refs.push(...element.getAttribute(attr).split(',').map((part) => part.trim().split(/\s+/)[0]));
      }
    }
  }
  if (!img.getAttribute('src') || refs.some((ref) => !ref)) {
    throw new Error('Inline image has a missing or invalid src/srcset');
  }
  return [...new Set(refs)];
}

function resolveUrl(ref, base) {
  if (ref.startsWith('data:')) return ref;
  const url = new URL(ref, base);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error(`Unsupported image URL: ${ref}`);
  return url.href;
}

async function imageBytes(url, { fetchImpl, maxBytes, verify = false }) {
  if (url.startsWith('data:')) {
    const match = url.match(/^data:image\/[^;,]+(;base64)?,(.*)$/s);
    if (!match) throw new Error('Unsupported inline data image');
    return Buffer.from(match[2], match[1] ? 'base64' : 'utf8').length;
  }
  const typed = isImageUrl(url);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const head = await fetchImpl(url, { method: 'HEAD', signal: controller.signal });
    if (MISSING.has(head.status)) return null;
    if (!head.ok && head.status !== 405 && head.status !== 501) {
      throw new Error(`Image HEAD ${head.status}: ${url}`);
    }
    if (head.ok) checkType(url, head.headers.get('content-type'), typed);
    const size = head.ok ? Number(head.headers.get('content-length')) : NaN;
    if (head.ok && Number.isSafeInteger(size) && size > maxBytes) return size;
    if (!verify && head.ok && Number.isSafeInteger(size) && size > 0) return size;

    const response = await fetchImpl(url, { signal: controller.signal });
    if (MISSING.has(response.status)) return null;
    if (!response.ok || !response.body) throw new Error(`Image GET ${response.status}: ${url}`);
    checkType(url, response.headers.get('content-type'), typed);
    const reader = response.body.getReader();
    let count = 0;
    try {
      while (count <= maxBytes) {
        const { done, value } = await reader.read();
        if (done) return count;
        count += value.length;
      }
      return count;
    } finally {
      await reader.cancel();
    }
  } finally {
    clearTimeout(timer);
  }
}

function protectedImage(img) {
  if (img.closest('.metadata, [class*="hero"], [class*="card"]')) return true;
  if (img.closest('a') && !img.closest('figure')) return true;
  return !img.closest('figure, p');
}

function sameFraming(source, candidate) {
  if (!isAspectCrop(source)) return !isAspectCrop(candidate);
  const dimensions = (url) => {
    const suffix = derivativeSuffix(url);
    if (!suffix) return null;
    const [w, h] = suffix.split('x').map(Number);
    return { w, h };
  };
  const original = dimensions(source);
  const replacement = dimensions(candidate);
  return !!replacement && !ratiosDiffer(original, replacement);
}

function removeBodyImage(img) {
  const picture = img.closest('picture');
  const target = picture || img;
  const parent = target.parentElement;
  const outer = parent?.parentElement;
  const figure = img.closest('figure');
  const caption = img.getAttribute('data-caption');
  if (caption && figure && !figure.querySelector('figcaption')) {
    const label = figure.ownerDocument.createElement('figcaption');
    label.textContent = caption;
    figure.append(label);
  }
  if (caption && !figure) {
    const label = img.ownerDocument.createElement(parent?.tagName === 'P' ? 'span' : 'p');
    label.textContent = caption;
    target.replaceWith(label);
  } else target.remove();
  if (parent && !parent.textContent.trim() && !parent.querySelector('img')) parent.remove();
  if (outer?.tagName === 'A' && !outer.textContent.trim() && !outer.querySelector('img')) outer.remove();
}

export async function conditionInlineMedia(html, {
  base, manifest = { rows: {} }, maxBytes = OVERSIZE_BYTES, minWidth = MIN_SUBSTITUTE_WIDTH,
  fetchImpl = fetch, cache = new Map(),
} = {}) {
  imageLimit(maxBytes);
  imageWidth(minWidth);
  if (!base) throw new Error('A page URL is required to resolve inline image references');
  const { document } = new JSDOM(`<body>${html}</body>`).window;
  const changes = [];
  const errors = [];
  const measure = async (url, verify = false) => {
    const key = `${url}:${verify}`;
    if (!cache.has(key)) cache.set(key, imageBytes(url, { fetchImpl, maxBytes, verify }));
    return cache.get(key);
  };
  for (const img of [...document.querySelectorAll('img')]) {
    const src = img.getAttribute('src') || '(missing)';
    try {
      const references = imageReferences(img);
      const urls = references.map((ref) => resolveUrl(ref, base));
      const lengths = await Promise.all(urls.map((url) => measure(url)));
      if (lengths.some((length) => length === null || length === 0)) {
        const missing = lengths.findIndex((length) => length === null || length === 0);
        throw new Error(`Referenced image is missing or empty: ${references[missing]}`);
      }
      if (lengths.every((length) => length <= maxBytes)) continue;

      const picture = img.closest('picture');
      if (img.closest('.metadata')) throw new Error('Metadata imagery must not be modified');
      if (picture && urls.slice(1).some((url) => logicalId(url) !== logicalId(urls[0])
        || !sameFraming(urls[0], url))) {
        throw new Error('Art-directed picture needs a manually reviewed safe rendition');
      }
      const row = manifest.rows?.[logicalId(urls[0])];
      const candidates = [
        ...(lengths[0] <= maxBytes ? [urls[0]] : []),
        row?.delivery_url,
        ...urls.filter((url) => url !== urls[0]),
        ...(!isAspectCrop(urls[0]) && !/\/media_[0-9a-f]+\./i.test(urls[0])
          ? sizedRenditions(urls[0]) : []),
      ].filter((url, i, all) => url && all.indexOf(url) === i);
      let safe = null;
      const tooSmall = [];
      for (const candidate of candidates) {
        if (!sameFraming(urls[0], candidate)) continue;
        if (candidate !== urls[0] && tooNarrow(candidate, minWidth)) {
          tooSmall.push(candidate);
          continue;
        }
        const bytes = candidate === urls[0] ? lengths[0] : await measure(candidate, true);
        if (bytes !== null && bytes > 0 && bytes <= maxBytes) {
          safe = { url: candidate, bytes };
          break;
        }
      }
      // Only report narrow renditions that exist, so the log explains the strip/block.
      const narrow = [];
      if (!safe) {
        for (const candidate of tooSmall) {
          const bytes = await measure(candidate, true);
          if (bytes !== null && bytes > 0 && bytes <= maxBytes) narrow.push(candidate);
        }
      }
      if (safe) {
        img.setAttribute('src', safe.url);
        img.removeAttribute('srcset');
        img.removeAttribute('data-srcset');
        picture?.querySelectorAll('source').forEach((source) => source.remove());
        changes.push({
          action: 'substitute', from: src, to: safe.url, bytes: safe.bytes,
        });
      } else if (!protectedImage(img)) {
        changes.push({
          action: 'strip',
          from: src,
          alt: img.getAttribute('alt'),
          caption: img.getAttribute('data-caption') || img.closest('figure')?.querySelector('figcaption')?.textContent || '',
          ...(narrow.length ? { narrowerThanMinWidth: narrow } : {}),
        });
        removeBodyImage(img);
      } else {
        const why = narrow.length ? ` (renditions under ${minWidth}px ignored: ${narrow.join(', ')})` : '';
        throw new Error(`No safe rendition; hero/card or unclassified image cannot be stripped: ${src}${why}`);
      }
    } catch (error) {
      errors.push(`${src}: ${error.message}`);
    }
  }
  return { html: changes.length ? document.body.innerHTML : html, changes, errors };
}
