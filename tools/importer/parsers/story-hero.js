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
 *               | date + linked category |
 *
 * ⚠️ CONTENT-DRIVEN, NOT POSITIONAL. Every part is optional (authors omit cells): no
 * image and no heading → unwrap and bail, like hero-banner.
 */
export default function parse(element, { document }) {
  const img = element.querySelector('.hero-image img, .hero-wrapper img, img');
  const heading = element.querySelector('.hero-heading h1, h1, .heading, h2');

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
  const category = caption.querySelector('.category a[href]');
  const categoryText = category && (category.textContent || '').trim();
  const categoryHref = category && category.getAttribute('href');
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

  if (categoryText && categoryHref) {
    const link = document.createElement('a');
    link.setAttribute('href', categoryHref);
    link.textContent = categoryText;
    meta.append(link);
  }

  if (meta.childNodes.length) cells.push([meta]);
  element.replaceWith(WebImporter.DOMUtils.createTable(cells, document));
}
