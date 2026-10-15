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

// Replace self-hosted WordPress videos (`[video]` shortcode) with an Embed table, as the story
// importer does (skoda-story-cleanup wpVideosToEmbeds; transformers stay standalone, so it is a
// copy). MediaElement.js wraps the <video> in `.mejs-*` chrome whose sprite (mejs-controls.svg),
// timecodes and javascript:void volume link would otherwise flatten into the body (the Epiq
// Sportline release, 2026-10-14). The embed block plays the file natively.
function wpVideosToEmbeds(element, document) {
  element.querySelectorAll('.wp-video').forEach((wrapper) => {
    const video = wrapper.querySelector('video');
    const url = wpVideoUrl(wrapper);
    if (!url) return;
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.textContent = url;
    const rows = [['Embed'], ['url', link]];
    const posterUrl = video.getAttribute('poster');
    if (posterUrl) {
      const poster = document.createElement('img');
      poster.setAttribute('src', posterUrl);
      poster.setAttribute('alt', '');
      rows.push(['poster', poster]);
    }
    wrapper.replaceWith(WebImporter.DOMUtils.createTable(rows, document));
  });
}

// The MP4 URL of a WordPress `[video]` wrapper ('' when it has none), without the cache-buster
// (?_=1) WordPress appends to the source.
function wpVideoUrl(wrapper) {
  const video = wrapper.querySelector('video');
  const src = video && (video.querySelector('source[src]')?.getAttribute('src')
    || video.getAttribute('src') || wrapper.querySelector('a[href]')?.getAttribute('href') || '');
  return src && /\.(mp4|webm|mov|m4v)(\?|$)/i.test(src) ? src.replace(/\?_=\d+$/, '') : '';
}

// Collapsed SiteOrigin row toggles (`ys-row-toggle` heading + `siteorigin-panels-builder` answer,
// one per top-level row; the Epiq Sportline release's five sections) become one Accordion, as
// the press-kit importer does (parsers/press-kit-content.js). Blocks can't nest: a video in an
// answer stays a link to its MP4, as in a press-kit answer.
function rowTogglesToAccordion(element, document) {
  const content = element.querySelector('.entry-content') || element;
  const topPanels = (grid) => [...grid.querySelectorAll('.so-panel')]
    .filter((panel) => !panel.parentElement.closest('.so-panel'));
  const isToggleRow = (grid) => {
    const panels = topPanels(grid);
    return panels.length === 2 && panels[0].matches('.widget_ys-row-toggle')
      && panels[1].matches('.widget_siteorigin-panels-builder');
  };
  const rowOf = (grid) => {
    const [toggle, answer] = topPanels(grid);
    const heading = toggle.querySelector('h1.row-title, h2.row-title, h3.row-title, h4.row-title');
    if (!heading || !heading.textContent.trim()) return null;
    answer.querySelectorAll('.wp-video').forEach((wrapper) => {
      const url = wpVideoUrl(wrapper);
      if (!url) return;
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.setAttribute('href', url);
      // named by its file, not its address (the push rewrites the href to the DAM copy)
      const file = decodeURIComponent(url.split('/').pop()).replace(/\.[a-z0-9]+$/i, '')
        .replace(/_[0-9a-f]{8}$/i, '').replace(/[-_]+/g, ' ').trim();
      a.textContent = `Video: ${file}`;
      p.append(a);
      wrapper.replaceWith(p);
    });
    answer.querySelectorAll('hr').forEach((rule) => rule.remove());
    const body = [...answer.querySelectorAll('.textwidget')]
      .flatMap((widget) => [...widget.children])
      .filter((node) => node.textContent.trim() || node.querySelector('img, a[href]'));
    if (!body.length) return null;
    const title = document.createElement('h2');
    title.textContent = heading.textContent.replace(/\s+/g, ' ').trim();
    return [title, body];
  };
  const grids = [...content.querySelectorAll('.panel-grid')]
    .filter((grid) => !grid.parentElement.closest('.panel-grid'));
  let group = [];
  const flush = () => {
    const rows = group.map(rowOf);
    if (group.length && rows.every(Boolean)) {
      group[0].replaceWith(WebImporter.DOMUtils.createTable([['Accordion'], ...rows], document));
      group.slice(1).forEach((grid) => grid.remove());
    }
    group = [];
  };
  grids.forEach((grid) => {
    if (!isToggleRow(grid)) { flush(); return; }
    if (group.length && group[group.length - 1].nextElementSibling !== grid) flush();
    group.push(grid);
  });
  flush();
}

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Toggles first: a video inside an answer becomes a link, not a nested Embed.
    rowTogglesToAccordion(element, element.ownerDocument || document);
    wpVideosToEmbeds(element, element.ownerDocument || document);
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
