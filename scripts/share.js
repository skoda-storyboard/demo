/*
 * share.js — share-intent URL builder (SKODA-215).
 *
 * Shared by the page-level floating action bar (blocks/float-dock) and the gallery share
 * (SKODA-216), so it lives in /scripts/ rather than inside either block. Pure functions only:
 * no DOM writes, so it is unit-testable in Node (share.test.mjs).
 *
 * Intent URLs follow the measured source hrefs (docs/ui-specs/social-share.md §3), except
 * Facebook, which uses the app-less `sharer.php` fallback instead of `dialog/share?app_id=`
 * (the app_id is out of scope, see SKODA-215).
 */

/** Networks in the source display order (X, Pinterest, LinkedIn, Facebook, WhatsApp). */
export const SHARE_NETWORKS = [
  { id: 'x', label: 'X' },
  { id: 'pinterest', label: 'Pinterest' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'whatsapp', label: 'WhatsApp' },
];

/** Encodes like the source (URLSearchParams: spaces become `+`). */
const query = (params) => new URLSearchParams(
  Object.entries(params).filter(([, v]) => v),
).toString();

/**
 * Builds the share-intent URL for one network.
 * @param {string} network one of SHARE_NETWORKS ids
 * @param {{ url: string, title?: string, image?: string }} data the shared page
 * @returns {string} the intent URL, or '' for an unknown network or missing URL
 */
export function shareUrl(network, { url, title = '', image = '' } = {}) {
  if (!url) return '';
  switch (network) {
    case 'x':
      return `https://twitter.com/intent/tweet?${query({ url, text: title })}`;
    case 'pinterest':
      return `https://pinterest.com/pin/create/bookmarklet?${query({ url, media: image, description: title })}`;
    case 'linkedin':
      return `https://linkedin.com/shareArticle?${query({
        mini: 'true', url, title, summary: title,
      })}`;
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?${query({ u: url })}`;
    case 'whatsapp':
      return `whatsapp://send?${query({ text: title ? `${title} - ${url}` : url })}`;
    default:
      return '';
  }
}

/**
 * Reads the share data for a document: the canonical URL (else the current URL without its
 * hash), the og:title (else the document title) and the og:image.
 * @param {Document} doc
 * @returns {{ url: string, title: string, image: string }}
 */
export function sharePageData(doc) {
  const meta = (property) => doc.querySelector(`meta[property="${property}"]`)?.content || '';
  const canonical = doc.querySelector('link[rel="canonical"]')?.href;
  const url = canonical || doc.location.href.split('#')[0];
  return {
    url,
    title: meta('og:title') || doc.title,
    image: meta('og:image'),
  };
}
