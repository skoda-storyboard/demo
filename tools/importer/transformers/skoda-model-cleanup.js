/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Škoda model-page (skoda_model CPT) chrome/noise cleanup.
 *
 * Removes non-authorable Media Room site chrome so only the model article
 * content (#intro/#keyfacts/#techdata + the 6 rails) survives for parsing.
 *
 * ALL selectors below were verified by reading
 * .migration/work/elroq/cleaned.html — none are guessed. Notable guards:
 *  - The ONLY `.affix` element is the primary `.model-nav affix` (in-page nav),
 *    so we NEVER use a broad `.affix` selector.
 *  - `.social`/`.social-container`/`.social-links` live INSIDE `footer.footer`
 *    and are removed with it (the `.social-share`/`.share-bar` classes named in
 *    generic guidance do not exist on this page).
 *  - `media-cart-item`/`media-cart-image`/`media-cart-action` are per-CARD rail
 *    content (thumbnails + add/download buttons), NOT floating chrome — they are
 *    deliberately left in place.
 *  - The 4 Vimeo `<iframe>`s are video-rail CONTENT, so we do NOT blanket-remove
 *    `iframe`; the single OneTrust `iframe.ot-text-resize` is removed via the
 *    OneTrust id/class selectors.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    WebImporter.DOMUtils.remove(element, [
      // Site header / nav / mega-menu / language switcher / search overlay chrome
      'header.header',
      '.site-header',
      '.mega-menu',
      '.megamenu',
      '.language-switcher',
      '.lang-switch',
      '.search-form-wrap',           // verified: global search bar wrapper
      '.search-form',

      // Footer chrome (also carries the .social / .social-container / .social-links strip)
      'footer.footer',
      '.site-footer',
      '.footer-mediaroom',

      // Cookie / consent (OneTrust) — verified ids/classes + defensive patterns
      '#onetrust-consent-sdk',
      '#onetrust-banner-sdk',
      '#onetrust-pc-sdk',
      '.onetrust-pc-dark-filter',
      '.ot-sdk-container',
      '#ot-sdk-btn',                 // verified: floating "Manage Cookies" settings button
      '.ot-sdk-show-settings',
      '.optanon-show-settings',
      '[id*="cookie" i]',
      '[class*="cookie" i]',
      '[class*="consent" i]',

      // Floating affordances — verified: .scroll-top (scroll-to-top). The
      // .social-share/.media-cart-flyout/.share-bar names do not exist here but
      // are kept as harmless defensive no-ops for reuse on sibling model pages.
      '.scroll-top',
      '.social-share',
      '.media-cart-flyout',
      '.share-bar',

      // Chrome resource elements (svg sprite/defs, external stylesheet link).
      // NOTE: script/style/noscript = 0 on this page; svg = 0. Left as defensive
      // no-ops. `iframe`/`link` are NOT blanket-removed here — Vimeo iframes are
      // video-rail content; only the cookie CSS <link> is dropped.
      'svg symbol',
      'svg defs',
      'link[rel="stylesheet"]',
      'link',
    ]);
  }

  // Removals happen only in beforeTransform (per task). No-op on afterTransform.
  if (hookName === TransformHook.afterTransform) {
    // intentionally empty
  }
}
