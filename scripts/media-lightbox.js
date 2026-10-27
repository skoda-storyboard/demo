/*
 * media-lightbox.js — the shared lightbox (scripts/lightbox.js) fed from the media feed
 * (/en/media-feed.json, contract media-item): the image rails (story-rail) and images that
 * page copy links to (the model page's Liftback / Combi drawings, feed rows of template
 * `asset`). The detail panel is the source colorbox panel, migrated into the feed.
 */

import { buildLightbox } from './lightbox.js';
import { buildMediaPanel } from './media-panel.js';
import { cleanTitle, currentLocale } from './query-index.js';
import { fileKey, findRowsByFile } from './media-feed.js';
import { formatCardDate } from './card-teaser.js';
import { downloadHref } from './media-card.js';
import { fetchPlaceholders } from './placeholders.js';

/*
 * One shared-lightbox item from a media feed row (contract media-item shape 5): the stage
 * shows the 1920px rendition, and the detail panel follows the source colorbox: title,
 * caption, (the lightbox's action buttons), file metadata, tag chips, related article.
 */
export function feedLightboxItem(row) {
  const title = cleanTitle(row.title);
  // the source panel order; videos add length, bitrate and audio format
  const caption = buildMediaPanel({
    title,
    description: row.description,
    meta: [['fileType', row.filetype], ['fileSize', row.filesize], ['length', row.length],
      ['bitrate', row.bitrate], ['audioFormat', row.audioformat], ['dimensions', row.dimensions],
      ['published', formatCardDate(row.date)]],
    tags: String(row.labels || '').split(',').map((s) => s.trim()).filter(Boolean),
    related: { href: row.related, title: row['related-title'] },
  });
  if (row.template === 'video') {
    const vimeo = row['vimeo-id'];
    return {
      src: row.poster || row.image,
      alt: title,
      caption,
      // the source colorbox player: autoplay, muted (the browser allows muted autoplay)
      video: vimeo ? `https://player.vimeo.com/video/${vimeo}?dnt=1&autoplay=1&muted=1` : row.mp4,
      // the MP4 through the source's download route, as the card's button and the source's
      // player (an MP4 still on the source CDN only plays in a tab, #273); a new tab, as live
      download: downloadHref(row.mp4 || ''),
      downloadTarget: '_blank',
      // the action names are the lightbox's clip names (the source player's titles), per locale,
      // also for a row with neither a Vimeo id nor an MP4
      clip: true,
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

/**
 * Links in page copy that point at a full-size image (`<a href="…jpg"><picture>`) open the
 * lightbox on their own image (single view: no counter, no arrows), with the file details
 * from the feed's `asset` row for that file; the image alt titles it when there is no row.
 * The stage shows the page's own media-bus image. Modifier clicks keep the link.
 * @param {Element[]} links the anchors
 */
export function wireImageLinks(links) {
  if (!links.length) return;
  // one build for every link: a second click while the first is still waiting reuses it (a
  // failed build is retried on the next click)
  let pending = null;
  const build = async () => {
    // only the keyed shards of these files when the feed has them (SKODA-517); with the page
    // locale's sheet (memoized, never longer than SHEET_WAIT_MS), so the items and the lightbox
    // are built in its labels, as every other lightbox caller does (PR #496 review)
    // (no feed: each item is titled by its alt; no sheet: English)
    const [byFile] = await Promise.all([
      findRowsByFile(mediaFeedUrl(), links.map((a) => a.href)).catch(() => new Map()),
      fetchPlaceholders().catch(() => ({})),
    ]);
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
      pending = pending || build().catch((err) => {
        pending = null;
        throw err;
      });
      (await pending).open(i, a, true);
    });
  });
}
