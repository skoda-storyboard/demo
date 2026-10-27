/*
 * media-panel.js: the lightbox detail panel of a media item (the source colorbox's): title,
 * description, file metadata ("File type: JPG"), tag chips, related article. Shared by the media
 * feed (media-lightbox.js) and the Media Box (blocks/downloads), so both read the same labels.
 *
 * UI text (SKODA-1003): the metadata labels are the source panel's, read from the page locale's
 * placeholders sheet as `mediaPanel…` (CS "Typ souboru", DE "Dateityp"). A panel built before the
 * sheet has loaded (a lightbox item built early and cached, PR #496 review) shows English and takes
 * the locale's labels when the sheet arrives; without a sheet they stay English. Each label is a
 * span carrying its key (LABEL_ATTR), so a copy of the panel (the lightbox's displayed caption)
 * relabels the same way (relabelMediaPanel). The metadata and related-article paragraphs carry
 * classes, so the lightbox finds them in any language (lightbox.js).
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
// a sheet-driven label's key (a fixed label passed by the caller has none, so it never changes)
export const LABEL_ATTR = 'data-media-label';

const labelText = (t, key) => `${t[key] || MEDIA_PANEL_LABELS[key] || key}: `;

/**
 * Relabel a media panel, or any copy of one, from a placeholders map: every sheet-driven label in
 * `root` takes the map's text (English where the map has none). Values are untouched.
 * @param {ParentNode} root a panel, or an element holding a copy of one
 * @param {Record<string,string>} ph from fetchPlaceholders()
 */
export function relabelMediaPanel(root, ph) {
  const t = localize(MEDIA_PANEL_LABELS, ph, 'mediaPanel');
  root.querySelectorAll(`[${LABEL_ATTR}]`).forEach((el) => {
    el.textContent = labelText(t, el.getAttribute(LABEL_ATTR));
  });
}

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
  let named = 0;
  const label = (key) => {
    const span = document.createElement('span');
    span.textContent = labelText(text, key);
    if (!labels) {
      span.setAttribute(LABEL_ATTR, key);
      named += 1;
    }
    return span;
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
  if (named && !Object.keys(loaded).length) {
    fetchPlaceholders()
      .then((ph) => relabelMediaPanel(caption, ph))
      .catch(() => { /* the English labels stay */ });
  }
  return caption;
}
