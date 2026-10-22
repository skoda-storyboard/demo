/* eslint-disable */
/* global WebImporter */
/**
 * Parser: carousel-listing rail (block name: "Story Rail"), SKODA-845.
 * Source: the Media Room Newsletter page (template-carousel-listing), one
 *   div.search-results > .search-results-container per plant: an h3
 *   .search-results-heading ("Kvasiny") over a Flickity row of press-release teasers.
 *
 * ⚠️ INDEX-DRIVEN: the source SSR cards are NOT reproduced. The runtime story-rail block
 * pulls the rows from the query index, so a new plant newsletter appears without editing
 * the page.
 *
 * The rail's filter is what every teaser of the container has in common, read from the
 * teasers' WordPress classes (content-driven, no plant list):
 *   - `category-<slug>` → `categories` (index column, SKODA-831 / 845);
 *   - `company-<slug>` → `company` (the index facet).
 * One term per key: the rail ORs the values of a key, so two shared terms (`company:
 * kvasiny, production`) would list other plants' releases. The container is dropped instead,
 * and so is one whose teasers all carry a taxonomy but share no usable slug (a term-id class
 * like `company-61572`): a weaker filter would mix plants. Term-id classes are skipped. A
 * container with no teasers, no heading or no shared term is dropped (a rail without a filter
 * would list every press release).
 *
 * Output, in order (each plant its own section, as on the source):
 *   <hr>                                   section break
 *   <h3>Kvasiny</h3>                       default content (the rail heading, h3 as the source)
 *   Story Rail | template   | press_release |
 *              | categories | newsletter    |
 *              | company    | kvasiny       |
 *   Section Metadata | style | carousel-listing |   the section's spacing (styles.css)
 */
const TERMS = [
  ['category', 'categories'],
  ['company', 'company'],
];

const clean = (text) => String(text || '').replace(/\s+/g, ' ').trim();

/**
 * One taxonomy's classes on a teaser (`company-kvasiny` → kvasiny): `slugs` without term ids,
 * `any` whether the teaser carries the taxonomy at all.
 */
function termsOf(teaser, taxonomy) {
  const slugs = [];
  let any = false;
  String(teaser.getAttribute('class') || '').split(/\s+/).forEach((token) => {
    const m = token.toLowerCase().match(new RegExp(`^${taxonomy}-([a-z0-9_-]+)$`));
    if (!m) return;
    any = true;
    if (!/^\d+$/.test(m[1]) && !slugs.includes(m[1])) slugs.push(m[1]);
  });
  return { slugs, any };
}

export default function parse(element, { document }) {
  const teasers = Array.from(element.querySelectorAll('article.article-teaser'));
  // the carousel's own heading, never a card title (h3.entry-title inside a teaser)
  const headingEl = element.querySelector('.search-results-heading')
    || [...element.querySelectorAll('.search-results-header h2, .search-results-header h3')][0];
  const heading = headingEl ? clean(headingEl.textContent) : '';
  if (!teasers.length || !heading) {
    console.warn(`[carousel-listing] "${heading}": no teasers or no heading; dropped`);
    element.remove();
    return;
  }

  const rows = [['Story Rail'], ['template', 'press_release']];
  let ambiguous = '';
  TERMS.forEach(([taxonomy, key]) => {
    const terms = teasers.map((t) => termsOf(t, taxonomy));
    const shared = terms[0].slugs.filter((slug) => terms.every((t) => t.slugs.includes(slug)));
    if (shared.length > 1) ambiguous = `${taxonomy}: ${shared.join(', ')}`;
    else if (shared.length === 1) rows.push([key, shared[0]]);
    else if (terms.every((t) => t.any)) ambiguous = `${taxonomy}: no shared slug`;
  });
  if (ambiguous) {
    console.warn(`[carousel-listing] "${heading}": not one shared ${ambiguous}; dropped`);
    element.remove();
    return;
  }
  if (rows.length === 2) {
    console.warn(`[carousel-listing] "${heading}": the teasers share no category or company; dropped`);
    element.remove();
    return;
  }

  const hr = document.createElement('hr');
  const h3 = document.createElement('h3');
  h3.textContent = heading;
  const table = WebImporter.DOMUtils.createTable(rows, document);
  const sectionMetadata = WebImporter.Blocks.createBlock(document, {
    name: 'Section Metadata',
    cells: { style: 'carousel-listing' },
  });
  element.replaceWith(hr, h3, table, sectionMetadata);
}
