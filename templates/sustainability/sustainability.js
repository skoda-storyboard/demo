/**
 * Sustainable Offices (SKODA-843): loaded on `theme: sustainability` pages (scripts.js
 * TEMPLATES). The header section (`Style: sustainability-header`) is authored as the h1, the
 * wide header image, then its phone crop (import contract: transformers/skoda-sustainability.js);
 * the CSS shows one of them by width, as the source's `hide-mobile` / `hide-desktop` rows. Mark
 * them, and on a phone put its crop first: the first image of the first section is the one
 * loaded eagerly at high priority (aem.js waitForFirstImage), the page's LCP image. An author
 * may omit the phone crop; then the wide image shows at every width.
 * @param {Element} main The main element
 */
export default function decorate(main) {
  const header = main.querySelector('.section.sustainability-header');
  const images = [...(header?.querySelectorAll('p:has(> picture)') || [])];
  if (images.length < 2) return;
  const [wide, phone] = images;
  wide.classList.add('sustainability-header-wide');
  phone.classList.add('sustainability-header-phone');
  if (window.matchMedia('(width < 720px)').matches) wide.before(phone);
}
