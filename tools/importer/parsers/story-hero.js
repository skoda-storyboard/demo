/* eslint-disable */
/* global WebImporter */
/**
 * Parser: story-hero (block name: "Hero Image", default = story variant) — SKODA-816.
 * Source: the single-post story hero (docs/ui-specs/hero.md Variant A):
 *   div.hero
 *   ├── .hero-heading .heading            h1 title (ink, ABOVE the image on desktop)
 *   ├── .hero-wrapper .hero-image img     16:9 real <img>
 *   └── .hero-caption                     perex + .published date + .category (a.label)
 *
 * Replaces the shared hero-banner parser for the story template only. hero-banner emits
 * the overlay **Hero** block (white title over a cropped strip), which is the page/archive
 * shape, not the story's. hero-banner is left unchanged for those templates.
 *
 * Output (one block, source order):
 *   Hero Image  | image |
 *               | h1    |
 *               | perex |
 *               | date + linked categories (every source badge, in source order: a category and
 *               |   its sub-categories, e.g. Lifestyle, Sports, Cycling; #458) |
 *
 * ⚠️ CONTENT-DRIVEN, NOT POSITIONAL. Every part is optional (authors omit cells): no
 * image and no heading → unwrap and bail, like hero-banner.
 */

// The hero shows at 970 CSS px (1940 device px at 2x): take the largest `srcset` copy up to
// 2560w, not whatever `src` the scrape caught (a -768x512 or -1440x960, SKODA-828 F6).
const HERO_MAX_WIDTH = 2560;

function useLargestRendition(img) {
  const best = (img.getAttribute('srcset') || '').split(',')
    .map((entry) => entry.trim().split(/\s+/))
    .map(([url, descriptor]) => ({ url, width: parseInt(descriptor, 10) }))
    .filter(({ url, width }) => url && width > 0 && width <= HERO_MAX_WIDTH)
    .sort((a, b) => b.width - a.width)[0];
  if (best) img.setAttribute('src', best.url);
  img.removeAttribute('srcset');
  img.removeAttribute('sizes');
}

export default function parse(element, { document }) {
  const img = element.querySelector('.hero-image img, .hero-wrapper img, img');
  const heading = element.querySelector('.hero-heading h1, h1, .heading, h2');
  if (img) useLargestRendition(img);

  if (!img && !heading) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [['Hero Image']];
  if (img) cells.push([img]);
  if (heading) {
    const h1 = document.createElement('h1');
    h1.textContent = (heading.textContent || '').trim();
    cells.push([h1]);
  }
  const caption = element.querySelector('.hero-caption') || element;

  const perex = caption.querySelector('.perex');
  const perexText = perex && (perex.textContent || '').trim();
  if (perexText) {
    const p = document.createElement('p');
    p.textContent = perexText;
    cells.push([p]);
  }

  const published = caption.querySelector('.published, time');
  const dateText = published && (published.textContent || '').trim();
  // every badge the source shows, in its order, each href once (#458)
  const seen = new Set();
  const categories = [...caption.querySelectorAll('.category a[href]')]
    .map((a) => ({ text: (a.textContent || '').trim(), href: a.getAttribute('href') }))
    .filter(({ text, href }) => text && href && !seen.has(href) && seen.add(href));
  const meta = document.createElement('p');
  meta.className = 'hero-image-meta';
  if (dateText) {
    const match = dateText.match(/^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})$/);
    let datetime = published.getAttribute('datetime');
    if (match) {
      const [, day, month, year] = match;
      const iso = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      const d = new Date(`${iso}T00:00:00Z`);
      if (!Number.isNaN(d.getTime()) && d.toISOString().startsWith(iso)) datetime = iso;
    }
    const date = document.createElement(datetime ? 'time' : 'span');
    date.className = 'hero-image-date';
    if (datetime) date.setAttribute('datetime', datetime);
    date.textContent = dateText;
    meta.append(date);
  }

  categories.forEach(({ text, href }) => {
    const link = document.createElement('a');
    link.setAttribute('href', href);
    link.textContent = text;
    meta.append(link);
  });

  if (meta.childNodes.length) cells.push([meta]);
  element.replaceWith(WebImporter.DOMUtils.createTable(cells, document));
}
