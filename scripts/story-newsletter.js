/**
 * Story newsletter card from one shared fragment (SKODA-840). Every story sidebar opens with
 * the same `Newsletter Stub (card)` (the source `.newsletter-subscribe-widget`). Instead of a
 * copy in each story, the locale's fragment `/{locale}/fragments/newsletter-card` holds the one
 * table, and this puts a Fragment block for it at the top of the story's `.section.sidebar`.
 *
 * It runs after the section styles are applied and before decorateBlocks, so the Fragment
 * block loads with the sidebar section: aem.js keeps a section hidden until its blocks have
 * loaded, so the card never shifts the page. A sidebar that already holds a newsletter card
 * (authored, or a story not re-imported yet) keeps it, and nothing is added.
 */

/** The fragment path for a locale. */
export const newsletterCardPath = (locale) => `/${locale}/fragments/newsletter-card`;

/**
 * The locale of a page path: its first segment when that is a two-letter code, else `en`.
 * @param {string} pathname e.g. `/cs/e-mobilita-cs/x`
 * @returns {string}
 */
export function pageLocale(pathname) {
  const [, first] = String(pathname || '').split('/');
  return /^[a-z]{2}$/.test(first || '') ? first : 'en';
}

/**
 * Prepend the shared newsletter card (as a Fragment block) to the story sidebar.
 * @param {Element} main The main element, its sections styled (`.section.sidebar`)
 * @param {string} [pathname] the page path, for the locale (default: the current page)
 * @returns {Element|null} the inserted block, or null when nothing was added
 */
export function addNewsletterCard(main, pathname = window.location.pathname) {
  const sidebar = main.querySelector(':scope > .section.sidebar');
  // a card is there already: authored, or a Fragment block for it (authored or added before)
  if (!sidebar || sidebar.querySelector('.newsletter-stub, a[href$="/fragments/newsletter-card"]')) return null;
  const doc = main.ownerDocument;
  const link = doc.createElement('a');
  link.href = newsletterCardPath(pageLocale(pathname));
  // no link text: if the fragment can't load, the empty block shows nothing
  const block = doc.createElement('div');
  block.className = 'fragment';
  const row = doc.createElement('div');
  const cell = doc.createElement('div');
  cell.append(link);
  row.append(cell);
  block.append(row);
  const wrapper = doc.createElement('div');
  wrapper.append(block);
  sidebar.prepend(wrapper);
  return block;
}
