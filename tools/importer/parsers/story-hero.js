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
 * Output (in source order, all inside the hero section):
 *   Hero Image  | image |          ← hero-image story variant: title above the 16:9 image
 *               | h1    |
 *   <p> perex                      ← caption, below the image
 *   <p> date                       ← e.g. "15. 9. 2026"
 *   Tags        | a.category |     ← REUSES the Tags block/parser (SKODA-205) for the
 *                                    category label; no new label markup.
 *
 * ⚠️ CONTENT-DRIVEN, NOT POSITIONAL. Every part is optional (authors omit cells): no
 * image and no heading → unwrap and bail, like hero-banner.
 */
import tagsParser from './tags.js';

export default function parse(element, { document }) {
  const img = element.querySelector('.hero-image img, .hero-wrapper img, img');
  const heading = element.querySelector('.hero-heading h1, h1, .heading, h2');

  if (!img && !heading) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const out = [];

  const cells = [['Hero Image']];
  if (img) cells.push([img]);
  if (heading) {
    const h1 = document.createElement('h1');
    h1.textContent = (heading.textContent || '').trim();
    cells.push([h1]);
  }
  out.push(WebImporter.DOMUtils.createTable(cells, document));

  const caption = element.querySelector('.hero-caption') || element;

  const perex = caption.querySelector('.perex');
  const perexText = perex && (perex.textContent || '').trim();
  if (perexText) {
    const p = document.createElement('p');
    p.textContent = perexText;
    out.push(p);
  }

  const published = caption.querySelector('.published, time');
  const dateText = published && (published.textContent || '').trim();
  if (dateText) {
    const p = document.createElement('p');
    p.textContent = dateText;
    out.push(p);
  }

  // Category label → Tags block, built by the shared tags parser (same DA shape as the
  // aside's tag row). The parser replaces its element in place, so run it in a holder.
  const category = caption.querySelector('.category');
  if (category && category.querySelector('a[href]')) {
    const holder = document.createElement('div');
    holder.append(category);
    tagsParser(category, { document });
    out.push(...holder.childNodes);
  }

  element.replaceWith(...out);
}
