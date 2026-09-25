import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Hero (image variant) — SKODA-202.
 *
 * One block, three rendering variants selected by the authored block class
 * (hero.md §1/§3/§7):
 *   - default / `story`  → title ABOVE a 16:9 image on desktop; image-above-title
 *                          order swap at <=1079; ink title. Never overlaid.
 *   - `overlay`          → full-bleed image (61.8vh); heading + caption overlaid
 *                          bottom-left in white over a scrim (landing/series/
 *                          press-kit form).
 *   - `archive`          → image-only fixed-height band (160/200/240); no scrim,
 *                          no heading (the page <h1> lives in the content column).
 *
 * The image is the eager-phase LCP element: real <img> in a <picture>,
 * fetchpriority=high + loading=eager, width/height preserved for low CLS.
 * Decorates defensively (image may be authored inside a <p>; cells omitted).
 *
 * @param {Element} block the hero-image block element
 */
export default function decorate(block) {
  const isArchive = block.classList.contains('archive');

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

  const isStory = !isArchive && !block.classList.contains('overlay');
  const content = document.createElement('div');
  content.className = 'hero-image-content';
  const caption = document.createElement('div');
  caption.className = 'hero-image-caption';
  [...block.children].forEach((row) => {
    const rowImg = row.querySelector('img');
    if (rowImg && row.textContent.trim() === '') return; // media row
    [...row.children].forEach((cell) => {
      if (cell.querySelector('img') && cell.textContent.trim() === '') return;
      while (cell.firstChild) {
        const node = cell.firstChild;
        if (isStory && node.nodeType === Node.ELEMENT_NODE && node.matches('h1, h2')) {
          content.append(node);
        } else if (isStory) {
          if (node.nodeType === Node.ELEMENT_NODE && node.matches('p')) {
            const isMeta = node.matches('.hero-image-meta')
              || node.querySelector('time, .hero-image-date, a[href]')
              || /^\d{1,2}\.\s*\d{1,2}\.\s*\d{4}/.test(node.textContent.trim());
            node.classList.add(isMeta ? 'hero-image-meta' : 'hero-image-perex');
            if (isMeta && !node.querySelector('time, .hero-image-date')) {
              const dateElement = [...node.children].find((el) => !el.matches('a'));
              if (dateElement) dateElement.classList.add('hero-image-date');
              else {
                const dateNodes = [...node.childNodes]
                  .filter((child) => child.nodeType === Node.TEXT_NODE);
                const dateText = dateNodes.map((child) => child.textContent).join('').trim();
                if (dateText) {
                  const date = document.createElement('span');
                  date.className = 'hero-image-date';
                  date.textContent = dateText;
                  dateNodes.forEach((child) => child.remove());
                  node.prepend(date);
                }
              }
            }
          }
          caption.append(node);
        } else {
          content.append(node);
        }
      }
    });
  });

  // Rebuild the block per variant.
  block.textContent = '';
  if (isArchive) {
    // image-only band: no heading/caption, no scrim (CSS drops ::after)
    if (media) block.append(media);
  } else if (block.classList.contains('overlay')) {
    // overlay: media first, content layered on top (CSS position:absolute)
    if (media) block.append(media);
    if (content.childNodes.length) block.append(content);
  } else {
    if (content.childNodes.length) block.append(content);
    if (media) block.append(media);
    if (caption.childNodes.length) block.append(caption);
  }
}
