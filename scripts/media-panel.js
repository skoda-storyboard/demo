/*
 * media-panel.js: the lightbox detail panel of a media item (the source colorbox's): title,
 * description, file metadata ("File type: JPG"), tag chips, related article. Shared by the media
 * feed (media-lightbox.js) and the Media Box (blocks/downloads), so both read the same labels.
 *
 * UI text (SKODA-1003): the metadata labels are the source panel's, read from the page locale's
 * placeholders sheet as `mediaPanel…` (CS "Typ souboru", DE "Dateityp"). A panel built before the
 * sheet has loaded (a lightbox item built early and cached, PR #496 review) shows English and takes
 * the locale's labels when the sheet arrives; without a sheet they stay English. The metadata and
 * related-article paragraphs carry classes, so the lightbox finds them in any language
 * (lightbox.js).
 */

import { localize, placeholdersNow, fetchPlaceholders } from './placeholders.js';

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
 * @param {typeof MEDIA_PANEL_LABELS} [labels] fixed labels (default: the page locale's, from the
 *   sheet; a panel built before it has loaded relabels itself when it does)
 * @returns {HTMLDivElement}
 */
export function buildMediaPanel({
  title = '', description = '', meta = [], tags = [], related = {},
} = {}, labels = undefined) {
  const loaded = placeholdersNow();
  const text = labels || localize(MEDIA_PANEL_LABELS, loaded, 'mediaPanel');
  const name = (t, key) => `${t[key] || MEDIA_PANEL_LABELS[key] || key}: `;
  // the label text nodes, by their key, to relabel once the sheet has loaded
  const named = [];
  const label = (key) => {
    const node = document.createTextNode(name(text, key));
    named.push([node, key]);
    return node;
  };
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
      p.append(label(key), strong);
    });
  }
  if (tags.length) para(tags.join(' · '));
  if (related.href) {
    const a = document.createElement('a');
    a.href = related.href;
    a.textContent = related.title || related.href;
    para(label('relatedArticle'), a).className = RELATED_CLASS;
  }
  if (!labels && named.length && !Object.keys(loaded).length) {
    fetchPlaceholders()
      .then((ph) => {
        const t = localize(MEDIA_PANEL_LABELS, ph, 'mediaPanel');
        named.forEach(([node, key]) => { node.nodeValue = name(t, key); });
      })
      .catch(() => { /* the English labels stay */ });
  }
  return caption;
}
