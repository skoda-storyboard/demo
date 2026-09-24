/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Škoda faceted-listing page (template-search-results) chrome cleanup.
 *
 * Removes non-authorable Media Room site chrome so only the listing engine
 * (#search-filter-results: facet form + results grid + load-more) and the page
 * title survive. The listing itself is emitted as an index-driven `Listing` config
 * block by parsers/listing.js — the SSR result cards and the Search-&-Filter-Pro /
 * ElasticPress / Isotope stack are intentionally NOT ported.
 *
 * ALL selectors verified against .migration/work/samples/news.html. This sample has
 * no OneTrust SDK / newsletter / banner nodes, but those patterns are kept as
 * harmless defensive no-ops for sibling listing pages (images/videos/search) that do.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    WebImporter.DOMUtils.remove(element, [
      // Site header / nav / language switcher / search overlay chrome
      'header.header',
      '.site-header',
      '.mega-menu',
      '.megamenu',
      '.menu-toggle',
      '.language-switcher',
      '.lang-switch',
      '.search-form-wrap',
      '.search-form',

      // Footer chrome (also carries the .social strip)
      'footer.footer',
      '.site-footer',
      '.footer-mediaroom',

      // Secondary widgets / banners (defensive — not on this sample)
      '.newsletter-subscribe-widget',
      '.side-banner',
      '.sa-bnr',

      // Cookie / consent (defensive)
      '#onetrust-consent-sdk',
      '#onetrust-banner-sdk',
      '#onetrust-pc-sdk',
      '.onetrust-pc-dark-filter',
      '.ot-sdk-container',
      '#ot-sdk-btn',
      '.ot-sdk-show-settings',
      '[id*="cookie" i]',
      '[class*="cookie" i]',
      '[class*="consent" i]',

      // Floating affordances
      '.scroll-top',
      '.social-share',
      '.media-cart-flyout',
      '.share-bar',

      // Chrome resource elements
      'link[rel="stylesheet"]',
      'link',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // intentionally empty
  }
}
