/*
 * media-panel.js: the lightbox detail panel of a media item (the source colorbox's): title,
 * description, file metadata ("File type: JPG"), tag chips, related article. Shared by the media
 * feed (media-lightbox.js) and the Media Box (blocks/downloads), so both read the same labels.
 *
 * UI text (SKODA-1003): the metadata labels are the source panel's, read from the page locale's
 * placeholders sheet as `mediaPanel…` (CS "Typ souboru", DE "Dateityp"). The panel is built
 * after the page has loaded, so the memoized sheet is there (placeholdersNow); before that, or
 * without one, they are English. The metadata and related-article paragraphs carry classes, so
 * the lightbox finds them in any language (lightbox.js).
 */

import { localize, placeholdersNow } from './placeholders.js';

export const MEDIA_PANEL_LABELS = {
  fileType: 'File type',
  fileSize: 'File size',
  length: 'Length',
  bitrate: 'Bitrate',
  audioFormat: 'Audio format',
  dimensions: 'Dimensions',
  published: 'Published',
  relatedArticle: 'Related article',
};

export const META_CLASS = 'lightbox-meta';
export const RELATED_CLASS = 'lightbox-related';

/**
 * The detail panel's content.
 * @param {object} item
 * @param {string} [item.title]
 * @param {string} [item.description]
 * @param {Array<[keyof MEDIA_PANEL_LABELS, string]>} [item.meta] label key and value, in order;
 *   empty values are left out
 * @param {string[]} [item.tags] tag chip labels
 * @param {{href?: string, title?: string}} [item.related] the related article
 * @param {typeof MEDIA_PANEL_LABELS} [labels] the page locale's (default: from the loaded sheet)
 * @returns {HTMLDivElement}
 */
export function buildMediaPanel({
  title = '', description = '', meta = [], tags = [], related = {},
} = {}, labels = localize(MEDIA_PANEL_LABELS, placeholdersNow(), 'mediaPanel')) {
  const caption = document.createElement('div');
  const para = (...nodes) => {
    const p = document.createElement('p');
    p.append(...nodes);
    caption.append(p);
    return p;
  };
  if (title) para(title);
  if (description) para(description);
  const rows = meta.filter(([, value]) => value);
  if (rows.length) {
    const p = para();
    p.className = META_CLASS;
    rows.forEach(([key, value], i) => {
      if (i) p.append(document.createElement('br'));
      const strong = document.createElement('strong');
      strong.textContent = value;
      p.append(`${labels[key] || MEDIA_PANEL_LABELS[key] || key}: `, strong);
    });
  }
  if (tags.length) para(tags.join(' · '));
  if (related.href) {
    const a = document.createElement('a');
    a.href = related.href;
    a.textContent = related.title || related.href;
    para(`${labels.relatedArticle}: `, a).className = RELATED_CLASS;
  }
  return caption;
}
