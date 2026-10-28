import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * The archive term h1 as label chips (SKODA-828 F3): each line of the authored
 * `<h1>Models<br>Peaq</h1>` becomes a `.hero-image-label`. A line that is only a link
 * (a category and its parent, as on the source) is the chip itself. A space between the
 * chips keeps the accessible name "Models Peaq". An h1 without breaks is one chip.
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
      const content = nodes
        .filter((node) => node.nodeType !== Node.TEXT_NODE || node.textContent.trim());
      if (content.length === 1 && content[0].nodeName === 'A') {
        content[0].classList.add('hero-image-label');
        return content[0];
      }
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

/*
 * The fixed-height cover bands (#480): the image fills a band of a set height with
 * object-fit: cover, so a wide panorama is drawn much wider than the viewport (the newsletter's
 * 5.2:1 image: 1281px across a 390px phone). EDS's generic picture picks 750px below 600px of
 * viewport and 2000px above, which blurs it. These bands mirror hero-image.css: the band heights
 * (`--hero-page-h`, `--hero-archive-h-*` in styles.css) per min-width, and the image scale.
 */
// `phoneMax`: the widest file a phone (below COVER_PHONE.below) gets. Page bands: 1440px, the
// source's own phone rendition (there the band image is the LCP element). Archive bands: 1080px,
// as their LCP element is the first story card, which a heavier hero delays (#480 review, eMobility
// at DPR 1.75: 1920w = 244 KB vs 141 KB on main, the card ~550ms later, PSI 88; 1440w still
// ~245ms). DPR 1 phones get the exact need on both.
export const COVER_BANDS = {
  page: { heights: [[0, 240]], scale: 1.02, phoneMax: 1440 },
  archive: { heights: [[0, 184], [576, 224], [768, 240]], scale: 1, phoneMax: 1080 },
};
// rendition widths offered below the master; the master itself is always the largest candidate
export const COVER_WIDTHS = [750, 1080, 1440, 1920, 2560];
export const COVER_PHONE = { below: 768 };

/**
 * The `sizes` and width candidates for an image covering a fixed-height band: per band step the
 * drawn width is the larger of the viewport (× scale) and the band height × scale × the image's
 * aspect. The browser then picks the candidate for its viewport, DPR and zoom.
 * @param {{width: number, height: number, heights: number[][], scale?: number}} opts the master's
 *   size, the band's [min-width, height] steps, the image scale
 * @returns {{sizes: string, widths: number[]}|null} null without a usable size
 */
export function coverSources({
  width, height, heights, scale = 1,
}) {
  const w = Number(width);
  const h = Number(height);
  if (!(w > 0 && h > 0) || !heights?.length) return null;
  const aspect = w / h;
  const vw = `${Math.round(scale * 10000) / 100}vw`;
  const steps = [...heights].sort((a, b) => a[0] - b[0]);
  const entries = [];
  steps.forEach(([min, bandHeight], i) => {
    const next = steps[i + 1]?.[0] ?? Infinity;
    const crop = Math.ceil(bandHeight * scale * aspect);
    // the viewport width from which the viewport, not the crop, is the wider
    const wide = Math.ceil(crop / scale);
    const step = [];
    if (wide < next) step.push([Math.max(min, wide), vw]);
    if (wide > min) step.push([min, `${crop}px`]);
    entries.unshift(...step);
  });
  // the same size on consecutive steps is one entry, from the lower min-width
  const sizes = entries
    .filter(([, size], i) => entries[i + 1]?.[1] !== size)
    .map(([min, size]) => (min > 0 ? `(min-width: ${min}px) ${size}` : size))
    .join(', ');
  return { sizes, widths: [...COVER_WIDTHS.filter((c) => c < w), w] };
}

/**
 * Size a band's authored picture for its cover crop, in place (#480): one WebP `<source>` and the
 * `<img>` (original format) with width candidates up to the master and the crop's `sizes`. Only
 * media-bus images (`…/media_<hash>.<ext>`) are resized; anything else keeps its picture.
 * @param {HTMLPictureElement} picture the band's picture
 * @param {{heights: number[][], scale: number, phoneMax: number}} band COVER_BANDS entry
 * @param {{width: string|null, height: string|null}} size the master's authored size (no
 *   fallback: without it the crop is unknown and the picture stays as it is)
 */
function sizeForCover(picture, band, { width, height }) {
  const img = picture.querySelector('img');
  const url = new URL(img.getAttribute('src') || '', window.location.href);
  const ext = url.pathname.match(/\/media_[0-9a-f]+\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
  if (!ext) return;
  const cover = coverSources({ width, height, ...band });
  if (!cover) return;
  const candidate = (format) => (w) => `${url.pathname}?width=${w}&format=${format}&optimize=medium ${w}w`;
  const webp = (widths, media) => {
    const source = document.createElement('source');
    source.type = 'image/webp';
    if (media) source.media = media;
    source.srcset = widths.map(candidate('webply')).join(', ');
    source.sizes = cover.sizes;
    return source;
  };
  picture.querySelectorAll('source').forEach((s) => s.remove());
  // phones first (the first matching source wins): the widths up to the band's phoneMax
  const phone = cover.widths.filter((w) => w <= band.phoneMax);
  if (phone.length < cover.widths.length) {
    picture.prepend(webp(phone, `(width < ${COVER_PHONE.below}px)`), webp(cover.widths));
  } else {
    picture.prepend(webp(cover.widths));
  }
  const format = ext === 'jpeg' ? 'jpg' : ext;
  img.srcset = cover.widths.map(candidate(format)).join(', ');
  img.sizes = cover.sizes;
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
 *   - `page`             → the generic page's title band (SKODA-813): 240px at every
 *                          width, the image covering it under the scrim, else the
 *                          source's empty grey band; the white page title on it.
 *
 * The image is the eager-phase LCP element: real <img> in a <picture>,
 * fetchpriority=high + loading=eager, width/height preserved for low CLS.
 * Decorates defensively (image may be authored inside a <p>; cells omitted).
 *
 * @param {Element} block the hero-image block element
 */
export default function decorate(block) {
  const isArchive = block.classList.contains('archive');
  const isPage = block.classList.contains('page');

  const img = block.querySelector('img');
  const authoredPicture = img?.closest('picture');

  // Build the media (image) layer.
  let media;
  if (img) {
    // Preserve intrinsic dimensions for low CLS. EDS may strip the width/height
    // attributes off the authored <img>; fall back to the natural size if the
    // asset has loaded, else the 16:9 master (1920×1080, hero.md §3).
    const authored = { width: img.getAttribute('width'), height: img.getAttribute('height') };
    const width = authored.width || img.naturalWidth || 1920;
    const height = authored.height || img.naturalHeight || 1080;

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

    // the fixed-height bands draw the image wider than the viewport: size it for that crop. First,
    // while the image is still lazy: made eager before, Chrome starts the authored 750w file, then
    // aborts it, and Lighthouse counts that request against the LCP (#480 review)
    const band = (isPage && COVER_BANDS.page) || (isArchive && COVER_BANDS.archive);
    if (band) sizeForCover(picture, band, authored);
    const heroImg = picture.querySelector('img');
    heroImg.setAttribute('fetchpriority', 'high'); // LCP element
    heroImg.setAttribute('loading', 'eager');
    heroImg.setAttribute('width', width);
    heroImg.setAttribute('height', height);

    media = document.createElement('div');
    media.className = 'hero-image-media';
    media.append(picture);
  }

  const isStory = !isArchive && !isPage && !block.classList.contains('overlay');
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
  if (isPage) {
    // the band keeps its 240px without an image (the source's empty page band)
    if (!media) {
      media = document.createElement('div');
      media.className = 'hero-image-media';
    }
    block.append(media);
    if (content.childNodes.length) block.append(content);
  } else if (isArchive) {
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
