/**
 * Series hub (SKODA-207): loaded only on `template: skoda_series` pages (scripts.js
 * TEMPLATES). The hero is `Hero Image (overlay)` whose content cell is authored as
 * "Series" chip, H1, standfirst (import contract `hero`, parsers/series-hero.js). Before
 * the hero-image block decorates, mark the chip as the badge and the paragraph after
 * the H1 as the standfirst, and move the badge after the H1 so the reading order
 * matches the source (H1, badge, standfirst). Authors may omit either paragraph.
 * The tile mosaic (`Cards (overlay, tiles)`) belongs to the cards block (SKODA-221).
 * @param {Element} main The main element
 */
export default function decorate(main) {
  const hero = main.querySelector('.hero-image.overlay');
  const h1 = hero?.querySelector('h1');
  if (!h1) return;
  const before = h1.previousElementSibling;
  if (before?.matches('p') && !before.querySelector('img, picture')) {
    before.classList.add('hero-image-badge');
    h1.after(before);
  }
  let perex = h1.nextElementSibling;
  if (perex?.matches('.hero-image-badge')) perex = perex.nextElementSibling;
  if (perex?.matches('p')) perex.classList.add('hero-image-perex');
}
