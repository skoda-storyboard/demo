/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: shared Škoda "representative page" chrome cleanup.
 *
 * Reused across the low-complexity representative templates that share the same
 * Media Room site chrome: editorial Page (SiteOrigin body → default content),
 * category archive, and tag/model archive. Removes non-authorable header/footer/
 * nav/newsletter/banner/social/consent chrome so the hero banner + body/archive
 * content survive for the parsers.
 *
 * Selectors verified against .migration/work/samples/rep_brand-group-core-bgc.html,
 * rep_category_emobility.html and rep_tag_model_elroq.html. OneTrust/side-banner
 * patterns are defensive no-ops on samples that lack them but present on siblings.
 *
 * NOTE: SiteOrigin `.panel-grid` widget WRAPPERS are intentionally NOT removed —
 * the editorial Page body is flattened to its plain default content (headings +
 * rich text survive as-is); reconstructing the SiteOrigin widget tree is the hard
 * Phase-B work explicitly deferred to SKODA-801 and out of scope here.
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

      // Secondary widgets / banners. The representative pages carry a standalone
      // newsletter surface as <section id="newsletter-popups"> / .newsletter-popup
      // (form.mailguide-subscribe) OUTSIDE header.header, so removing the header
      // alone leaves it as leading default content — remove those too.
      '.newsletter-subscribe-widget',
      '#newsletter-popups',
      '.newsletter-popup',
      '.mailguide-subscribe',
      '.mailguide-form',
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

      // Homepage live-Instagram social strip (not index-driven, external links).
      '.socials-static',

      // Chrome resource elements. Scripts carry per-request nonces / random
      // container-id hashes (ys_ajax_loader) that would break byte-identical
      // re-runs (SKODA-602 idempotency) if they survived into default content.
      'script',
      'noscript',
      'style',
      'link[rel="stylesheet"]',
      'link',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Strip per-request Adobe-Analytics tracking fragments (#s_aid= / #s_cid=) the
    // source injects onto asset/social hrefs — they rotate every fetch, so leaving
    // them makes output non-deterministic (breaks SKODA-602 idempotent re-push).
    element.querySelectorAll('a[href*="#s_aid="], a[href*="#s_cid="]').forEach((a) => {
      a.setAttribute('href', a.getAttribute('href').split('#s_aid=')[0].split('#s_cid=')[0]);
    });
  }
}
