/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Škoda press-release (press_release CPT) chrome/noise cleanup.
 *
 * Removes non-authorable Media Room site chrome so only the press-release article
 * content survives for parsing: header (date+title), primary column (lead teaser,
 * bullet points, summary, body) and the secondary/related blocks the parsers map
 * (Gallery, Tags, Downloads / Media Box).
 *
 * ALL selectors below were verified by reading .migration/work/samples/press.html
 * — none are guessed. Notable, page-specific decisions:
 *  - `header.header` (top nav + inline `sk`/`en` language links) + `footer.footer`
 *    (which also carries the `.social` strip) are the site chrome and are removed.
 *  - `.newsletter-subscribe-widget` (hidden on every M1 release) and `.side-banner`
 *    are ruled out (SKODA-904 / 903) and dropped. `.sa-bnr` banner slots (also inline
 *    in the body) are removed.
 *  - SKODA-607: the "Additional info" `<section>` (Media contacts + Download Media Box)
 *    and the Buzzsprout `.embed-controller-wrapper` are KEPT — skoda-press-release-layout
 *    turns them into sidebar content and a bare embed URL.
 *  - `.sticky-buttons` (share / cart floating dock → SKODA-215) is chrome.
 *  - Cookie/consent: this sample has no OneTrust SDK ids, but `[*cookie*]`/`[*consent*]`
 *    defensive patterns are kept as harmless no-ops for sibling press pages that do.
 *  - The Media Box (`.search-results.media-box`), gallery (`.sa-media-kit-preview`)
 *    and tag row (`.entry-tags`) are CONTENT the parsers consume — never removed here.
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
      '.menu-toggle',
      '.language-switcher',
      '.lang-switch',
      '.search-form-wrap',
      '.search-form',

      // Footer chrome (also carries the .social strip)
      'footer.footer',
      '.site-footer',
      '.footer-mediaroom',

      // Secondary-column widgets that are NOT press-release article content
      '.newsletter-subscribe-widget',   // verified: mailguide subscribe form widget
      '.side-banner',                   // verified: SiteOrigin banner slot
      '.sa-bnr',                        // verified: banner injection (also inline in body)

      // Cookie / consent (defensive — no OneTrust SDK on this sample)
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

      // Floating affordances — verified: .scroll-top. Others are defensive no-ops.
      '.scroll-top',
      '.sticky-buttons',                // verified: share + cart floating dock (→ SKODA-215)
      '.skoda-anniversary-background',  // verified: decorative page background
      '.social-share',
      '.media-cart-flyout',
      '.share-bar',

      // Chrome resource elements (external stylesheet link). script/style not present.
      'link[rel="stylesheet"]',
      'link',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Strip per-request Adobe-Analytics tracking fragments (#s_aid=…) the source
    // injects onto asset hrefs. They vary every fetch, so leaving them in would
    // make the generated DA HTML non-deterministic and break SKODA-602's
    // idempotent re-push. Detection is content-driven (by href shape, not URL).
    element.querySelectorAll('a[href*="#s_aid="], a[href*="#s_cid="]').forEach((a) => {
      a.setAttribute('href', a.getAttribute('href').split('#s_aid=')[0].split('#s_cid=')[0]);
    });
  }
}
