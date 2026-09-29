/* global WebImporter */

export default function parseHero(hero, document) {
  const image = hero.querySelector('.hero-image img');
  const title = hero.querySelector('.hero-caption h1');
  if (!image?.getAttribute('src') || !title?.textContent.trim()) {
    throw new Error('Press-kit hub requires a hero image and title');
  }

  const caption = document.createElement('div');
  const h1 = document.createElement('h1');
  h1.textContent = title.textContent.trim();
  caption.append(h1);
  const perex = hero.querySelector('.hero-caption .perex');
  if (perex?.textContent.trim()) {
    const p = document.createElement('p');
    p.textContent = perex.textContent.trim();
    caption.append(p);
  }
  image.removeAttribute('data-caption');
  image.removeAttribute('data-video_title');
  image.removeAttribute('srcset');
  image.removeAttribute('sizes');
  return WebImporter.DOMUtils.createTable([
    ['Hero Image (overlay)'],
    [image],
    [caption],
  ], document);
}
