/**
 * Branded 404 (SKODA-706): loaded on the site-root 404.html (`template: error-404`, scripts.js
 * TEMPLATES) and on QA drafts that carry the variant themselves. Render target:
 * docs/ui-specs/template-404.md.
 *
 * The source serves one of its two 404 pages at random; each is a DA fragment
 * (`/en/fragments/404/<slug>`, tools/importer/import-404.js): a `not-found` section with the
 * desktop photo, the mobile photo, the optional "404" label, the h1, the copy and the
 * homepage link. One variant is loaded per visit, and its two photos become one full-bleed
 * <picture> (the desktop photo from 720px, as the source's .message-desktop). If the fragment
 * doesn't load, 404.html's own message stays. Per-locale variants are SKODA-1001.
 * @param {Element} main The main element
 */

import { builtLocale } from '../../scripts/locale-paths.js';
// the fragments under /en/fragments/404/, one per source variant page
export const VARIANTS = ['youve-reached-a-dead-end', 'welcome-to-our-remote-car-park'];

// the source switches .message-mobile → .message-desktop at 720px
const DESKTOP = '(width >= 720px)';
const DESKTOP_WIDTHS = [1000, 2000, 3000];
const MOBILE_WIDTHS = [750, 1125];

// a short line before the heading is the variant's label ("404")
const LABEL = /^\S{1,8}$/;

/**
 * The fragment path of one variant, picked at random.
 * @param {() => number} [random]
 */
export function variantPath(random = Math.random, pathname = window.location.pathname) {
  const index = Math.min(VARIANTS.length - 1, Math.floor(random() * VARIANTS.length));
  // the page's locale when its fragments are built, else English (SKODA-1001)
  return `/${builtLocale('fragments404', pathname)}/fragments/404/${VARIANTS[index]}`;
}

/** An image's media-bus base (no query) and its format, as createOptimizedPicture does. */
function mediaOf(img) {
  const url = new URL(img.getAttribute('src'), window.location.href);
  return { base: `${url.origin}${url.pathname}`, format: url.pathname.split('.').pop().toLowerCase() };
}

function srcset({ base }, widths, format) {
  return widths.map((w) => `${base}?width=${w}&format=${format}&optimize=medium ${w}w`).join(', ');
}

function source(media, image, widths, format, type) {
  const el = document.createElement('source');
  if (media) el.media = media;
  if (type) el.type = type;
  el.srcset = srcset(image, widths, format);
  el.sizes = '100vw';
  return el;
}

/**
 * One full-bleed picture from the variant's two photos: the desktop one from 720px, the mobile
 * one below (either alone when only one is authored). It is the page's LCP image.
 * @param {HTMLImageElement} desktopImg
 * @param {HTMLImageElement} [mobileImg]
 */
export function photoOf(desktopImg, mobileImg) {
  const desktop = mediaOf(desktopImg);
  const mobile = mobileImg ? mediaOf(mobileImg) : desktop;
  const picture = document.createElement('picture');
  picture.className = 'not-found-photo';
  if (mobileImg) {
    picture.append(
      source(DESKTOP, desktop, DESKTOP_WIDTHS, 'webply', 'image/webp'),
      source(DESKTOP, desktop, DESKTOP_WIDTHS, desktop.format),
    );
  }
  const widths = mobileImg ? MOBILE_WIDTHS : DESKTOP_WIDTHS;
  picture.append(source('', mobile, widths, 'webply', 'image/webp'));
  const img = document.createElement('img');
  img.src = `${mobile.base}?width=${widths[0]}&format=${mobile.format}&optimize=medium`;
  img.srcset = srcset(mobile, widths, mobile.format);
  img.sizes = '100vw';
  img.alt = '';
  img.setAttribute('loading', 'eager');
  img.setAttribute('fetchpriority', 'high');
  picture.append(img);
  return picture;
}

/**
 * Lays out a `not-found` section: the photo behind, the label, heading, copy and link in
 * `.not-found-message`. Content-driven: the photos are the leading image paragraphs.
 * @param {Element} section
 */
export function decorateNotFound(section) {
  const content = section.querySelector(':scope > .default-content-wrapper');
  if (!content || content.querySelector('.not-found-message')) return;
  const photos = [...content.querySelectorAll(':scope > p')]
    .filter((p) => p.querySelector('img') && !p.textContent.trim());
  const imgs = photos.map((p) => p.querySelector('img'));
  photos.forEach((p) => p.remove());

  const message = document.createElement('div');
  message.className = 'not-found-message';
  const heading = content.querySelector(':scope > h1, :scope > h2, :scope > h3');
  const label = heading?.previousElementSibling;
  if (label?.matches('p') && LABEL.test(label.textContent.trim())) label.classList.add('not-found-label');
  message.append(...content.children);
  content.replaceChildren(message);
  if (imgs.length) content.prepend(photoOf(imgs[0], imgs[1]));
}

/** The fragment loader (the one allowed cross-block import), loaded when it's needed. */
async function loadVariant(path) {
  const { loadFragment } = await import('../../blocks/fragment/fragment.js');
  return loadFragment(path);
}

/**
 * @param {Element} main
 * @param {(path: string) => Promise<Element|null>} [load] the fragment loader (tests stub it)
 */
export default async function decorate(main, load = loadVariant) {
  let section = main.querySelector(':scope > .section.not-found');
  if (!section) {
    const fragment = await load(variantPath());
    section = fragment?.querySelector(':scope > .section.not-found');
    // the fragment didn't load: 404.html's own message stays
    if (!section) return;
    main.replaceChildren(...fragment.children);
  }
  main.querySelectorAll(':scope > .section.not-found').forEach(decorateNotFound);
}
