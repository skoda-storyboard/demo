import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Hero (image variant, story) — SKODA-202.
 *
 * Authored as a two-cell block: an image cell + a heading/caption cell.
 *   | Hero-image        |
 *   | ![](hero.jpg)     |
 *   | # Heading         |
 *
 * Renders the title ABOVE a 16:9 image on desktop; the image moves above the
 * title at <=1079px (CSS order swap). The image is the eager-phase LCP element:
 * real <img> in an optimized <picture>, fetchpriority=high + loading=eager, and
 * width/height preserved for low CLS. Decorates defensively (authors omit/add
 * cells; the image may be authored inside a <p>).
 *
 * @param {Element} block the hero-image block element
 */
export default function decorate(block) {
  const img = block.querySelector('img');

  // Build the media (image) layer.
  let media;
  if (img) {
    // Preserve intrinsic dimensions for low CLS. EDS may strip the width/height
    // attributes off the authored <img>; fall back to the natural size if the
    // asset has loaded, else the 16:9 master (1920×1080, hero.md §3).
    const width = img.getAttribute('width') || img.naturalWidth || 1920;
    const height = img.getAttribute('height') || img.naturalHeight || 1080;
    const optimized = createOptimizedPicture(
      img.src,
      img.getAttribute('alt') || '',
      true, // eager: this is the LCP image
      [{ width: '1920' }],
    );
    const optImg = optimized.querySelector('img');
    optImg.setAttribute('fetchpriority', 'high');
    optImg.setAttribute('loading', 'eager');
    optImg.setAttribute('width', width);
    optImg.setAttribute('height', height);

    media = document.createElement('div');
    media.className = 'hero-image-media';
    media.append(optimized);
  }

  // Everything that is not the image becomes the heading/caption content.
  const content = document.createElement('div');
  content.className = 'hero-image-content';
  [...block.children].forEach((row) => {
    // a cell whose only meaningful content is the image is the media row — skip it
    const rowImg = row.querySelector('img');
    if (rowImg && row.textContent.trim() === '') return;
    [...row.children].forEach((cell) => {
      if (cell.querySelector('img') && cell.textContent.trim() === '') return;
      while (cell.firstChild) content.append(cell.firstChild);
    });
  });

  // Rebuild the block: title (content) first in DOM (desktop order), image second.
  // CSS reorders to image-above-title at <=1079px.
  block.textContent = '';
  if (content.childNodes.length) block.append(content);
  if (media) block.append(media);
}
