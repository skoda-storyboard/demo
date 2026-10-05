import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * The archive term h1 as label chips (SKODA-828 F3): each line of the authored
 * `<h1>Models<br>Peaq</h1>` becomes a `.hero-image-label`. A space between the chips
 * keeps the accessible name "Models Peaq". An h1 without breaks is one chip.
 * @param {Element} h1 the archive heading
 */
function decorateLabels(h1) {
  const lines = [[]];
  [...h1.childNodes].forEach((node) => {
    if (node.nodeName === 'BR') lines.push([]);
    else lines[lines.length - 1].push(node);
  });
  const labels = lines
    .filter((nodes) => nodes.some((node) => node.textContent.trim()))
    .map((nodes) => {
      const label = document.createElement('span');
      label.className = 'hero-image-label';
      label.append(...nodes);
      label.normalize();
      const { firstChild: first, lastChild: last } = label;
      if (first.nodeType === Node.TEXT_NODE) first.textContent = first.textContent.trimStart();
      if (last.nodeType === Node.TEXT_NODE) last.textContent = last.textContent.trimEnd();
      return label;
    });
  h1.textContent = '';
  labels.forEach((label, i) => {
    if (i) h1.append(' ');
    h1.append(label);
  });
}

/**
 * Hero (image variant) — SKODA-202.
 *
 * One block, three rendering variants selected by the authored block class
 * (hero.md §1/§3/§7):
 *   - default / `story`  → title ABOVE a 16:9 image on desktop; image-above-title
 *                          order swap at <=1079; ink title. Never overlaid.
 *   - `overlay`          → 16:9 image with the caption below on mobile; from 768 a
 *                          full-bleed 61.8vh image with the heading + caption
 *                          overlaid in white (series / press-kit / model form).
 *   - `archive`          → full-bleed band (184/224/240), no scrim; the term h1
 *                          renders as label chips. With no image the band is empty.
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
    // the band keeps its height without an image (the source's empty term band)
    if (!media) {
      media = document.createElement('div');
      media.className = 'hero-image-media';
    }
    block.append(media);
    const h1 = content.querySelector('h1');
    if (h1) {
      decorateLabels(h1);
      content.replaceChildren(h1);
      block.append(content);
    }
  } else if (block.classList.contains('overlay')) {
    // overlay: media first, then the caption (CSS overlays it from 768). A paragraph
    // after the heading is the perex unless a template has classed it already.
    content.querySelectorAll(':scope > :is(h1, h2) ~ p:not([class])').forEach((p) => {
      if (!p.querySelector('img, picture')) p.classList.add('hero-image-perex');
    });
    if (media) block.append(media);
    if (content.childNodes.length) block.append(content);
  } else {
    if (content.childNodes.length) block.append(content);
    if (media) block.append(media);
    if (caption.childNodes.length) block.append(caption);
  }
}
