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
  const authoredPicture = img?.closest('picture');

  // Build the media (image) layer.
  let media;
  if (img) {
    // Preserve intrinsic dimensions for low CLS. EDS may strip the width/height
    // attributes off the authored <img>; fall back to the natural size if the
    // asset has loaded, else the 16:9 master (1920×1080, hero.md §3).
    const width = img.getAttribute('width') || img.naturalWidth || 1920;
    const height = img.getAttribute('height') || img.naturalHeight || 1080;

    // Only rebuild via createOptimizedPicture when the authored image has a
    // usable http(s)/relative src. When EDS already emitted an optimized
    // <picture>, reuse it (rebuilding from a hashed/optimized src is lossy);
    // and never feed a broken src (e.g. "about:error") into new URL().
    const rawSrc = img.getAttribute('src') || '';
    const usableSrc = /^(https?:|\/)/.test(rawSrc);
    let picture;
    if (authoredPicture) {
      picture = authoredPicture;
    } else if (usableSrc) {
      picture = createOptimizedPicture(
        img.src,
        img.getAttribute('alt') || '',
        true, // eager: this is the LCP image
        [{ width: '1920' }],
      );
    } else {
      // Fallback: keep the authored <img> as-is inside a <picture> wrapper.
      picture = document.createElement('picture');
      picture.append(img.cloneNode(true));
    }

    const heroImg = picture.querySelector('img');
    heroImg.setAttribute('fetchpriority', 'high'); // LCP element
    heroImg.setAttribute('loading', 'eager');
    heroImg.setAttribute('width', width);
    heroImg.setAttribute('height', height);

    media = document.createElement('div');
    media.className = 'hero-image-media';
    media.append(picture);
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

  // Rebuild the block as an overlay hero: full-bleed image with the heading +
  // caption overlaid (bottom-left, white) over a scrim. Media first, content
  // layered on top via CSS (position: absolute).
  block.textContent = '';
  if (media) block.append(media);
  if (content.childNodes.length) block.append(content);
}
