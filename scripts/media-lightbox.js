/*
 * media-lightbox.js — the shared lightbox (scripts/lightbox.js) fed from the media feed
 * (/en/media-feed.json, contract media-item): the image rails (story-rail) and images that
 * page copy links to (the model page's Liftback / Combi drawings, feed rows of template
 * `asset`). The detail panel is the source colorbox panel, migrated into the feed.
 */

import { buildLightbox } from './lightbox.js';
import { loadQueryIndex, cleanTitle, currentLocale } from './query-index.js';
import { formatCardDate } from './card-teaser.js';

/*
 * One shared-lightbox item from a media feed row (contract media-item shape 5): the stage
 * shows the 1920px rendition, and the detail panel follows the source colorbox: title,
 * caption, (the lightbox's action buttons), file metadata, tag chips, related article.
 */
export function feedLightboxItem(row) {
  const title = cleanTitle(row.title);
  const caption = document.createElement('div');
  const para = (...nodes) => {
    const p = document.createElement('p');
    p.append(...nodes);
    caption.append(p);
    return p;
  };
  if (title) para(title);
  if (row.description) para(row.description);
  // the source panel order; videos add length, bitrate and audio format
  const meta = [['File type', row.filetype], ['File size', row.filesize], ['Length', row.length],
    ['Bitrate', row.bitrate], ['Audio format', row.audioformat], ['Dimensions', row.dimensions],
    ['Published', formatCardDate(row.date)]].filter(([, v]) => v);
  if (meta.length) {
    const p = para();
    meta.forEach(([label, value], i) => {
      if (i) p.append(document.createElement('br'));
      const strong = document.createElement('strong');
      strong.textContent = value;
      p.append(`${label}: `, strong);
    });
  }
  const labels = String(row.labels || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (labels.length) para(labels.join(' · '));
  if (row.related) {
    const a = document.createElement('a');
    a.href = row.related;
    a.textContent = row['related-title'] || row.related;
    para('Related article: ', a);
  }
  if (row.template === 'video') {
    const vimeo = row['vimeo-id'];
    return {
      src: row.poster || row.image,
      alt: title,
      caption,
      // the source colorbox player: autoplay, muted (the browser allows muted autoplay)
      video: vimeo ? `https://player.vimeo.com/video/${vimeo}?dnt=1&autoplay=1&muted=1` : row.mp4,
      download: row.mp4 || '',
      link: vimeo ? `https://vimeo.com/${vimeo}` : row.mp4,
      cartId: row.id || '',
      cartHref: row.mp4 || '',
      thumb: row.poster || row.image || '',
      actions: true,
    };
  }
  const src = row['rendition-1920'] || row.original || row.image;
  return {
    src,
    full: src,
    alt: title,
    caption,
    download: row.original || src,
    link: row.original || src,
    cartId: row.id || '',
    cartHref: row.original || '',
    // the cart page's card image: the listing's 768px image, not the 1920px slide / original
    thumb: row.image || '',
    // content images (asset rows) have no cart / download / link buttons on the source
    actions: row.template !== 'asset',
  };
}

/** The media feed of the current locale. */
export const mediaFeedUrl = () => `/${currentLocale()}/media-feed.json`;

const fileKey = (url) => {
  try { return new URL(url, window.location.href).pathname.split('/').pop().toLowerCase(); } catch (e) { return ''; }
};

/**
 * Links in page copy that point at a full-size image (`<a href="…jpg"><picture>`) open the
 * lightbox on their own image (single view: no counter, no arrows), with the file details
 * from the feed's `asset` row for that file; the image alt titles it when there is no row.
 * The stage shows the page's own media-bus image. Modifier clicks keep the link.
 * @param {Element[]} links the anchors
 */
export function wireImageLinks(links) {
  if (!links.length) return;
  let lightbox = null;
  const build = async () => {
    let rows = [];
    try { rows = await loadQueryIndex(mediaFeedUrl()); } catch (e) { /* titled by the alt */ }
    const byFile = new Map(rows.map((r) => [fileKey(r.original), r]));
    const items = links.map((a) => {
      const img = a.querySelector('img');
      const row = byFile.get(fileKey(a.href));
      const pageSrc = img?.currentSrc || img?.src || a.href;
      if (row) return { ...feedLightboxItem(row), src: pageSrc, full: undefined };
      const caption = document.createElement('div');
      const p = document.createElement('p');
      p.textContent = img?.alt || '';
      caption.append(p);
      return {
        src: pageSrc, alt: img?.alt || '', caption, actions: false,
      };
    });
    return buildLightbox(document.body, items);
  };
  links.forEach((a, i) => {
    a.addEventListener('click', async (e) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      lightbox = lightbox || await build();
      lightbox.open(i, a, true);
    });
  });
}
