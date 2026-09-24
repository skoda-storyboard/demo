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
 *  - `.newsletter-subscribe-widget` and the "Additional info" `<section>` (a `.menu`
 *    of contact/legal links) are secondary-column WIDGETS, not article content, and
 *    are dropped for the pilot (newsletter is its own block ticket; the menu is chrome).
 *  - `.side-banner` / `.sa-bnr` are ad/banner slots (SiteOrigin banner injection) —
 *    removed. `.entry-content > .sa-bnr` (an inline banner slot) is included here.
 *  - `.embed-controller-wrapper` is the Buzzsprout AI-audio embed — Embeds-block
 *    (SKODA-204) territory, NOT 601's media path — so it is removed for this slice.
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
      '.embed-controller-wrapper',      // verified: Buzzsprout AI-audio embed (→ SKODA-204)

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
      '.social-share',
      '.media-cart-flyout',
      '.share-bar',

      // Chrome resource elements (external stylesheet link). script/style not present.
      'link[rel="stylesheet"]',
      'link',
    ]);

    // The "Additional info" section is a bare <section> holding a <ul.menu> of
    // contact/legal links — remove it by targeting that menu's owning section.
    element.querySelectorAll('section > ul.menu, section > .menu').forEach((menu) => {
      const section = menu.closest('section');
      if (section) section.remove();
    });
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
