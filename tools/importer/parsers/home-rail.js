/* eslint-disable */
/* global WebImporter */
/**
 * Parser: home-rail (block name: "Story Rail")
 * Source: a homepage rail band — div.cover-box[.dark] > div.search-results.type-<cpt>
 *   with a .search-results-heading and (usually) a .search-results-header-link "All" <a>.
 * (measured against .migration/work/samples/sto-home.html + mr-home.html;
 *  ties to docs/ui-specs/template-home.md.)
 *
 * ⚠️ INDEX-DRIVEN: do NOT port the SSR flickity cards. The runtime story-rail block
 * reads the emitted config and pulls its items from the published query-index.
 *
 * ⚠️ CONTENT-DRIVEN, NOT POSITIONAL. Config is derived from the rail's own DOM:
 *   - heading  ← .search-results-heading text
 *   - query    ← the "All" header-link href when present:
 *                  /en/category/<cat>/  → category=<cat>
 *                  /en/news/            → template=press_release
 *                  /en/images|videos/   → template=image|video
 *                  /en/series-2/        → template=skoda_series
 *                else fall back to the wrapper's `type-<cpt>` class:
 *                  type-skoda_model→skoda_model, type-press_release→press_release,
 *                  type-skoda_series→skoda_series, type-press_kit→press_kit,
 *                  type-attachment→(image|video by heading), type-post→story.
 * Never keyed on section order or the page URL. Rails it cannot classify (e.g. the
 * live-Instagram `type-social` strip) unwrap and bail — they are not index-driven.
 */

// href → { key, value } (category or template). Returns null if unrecognised.
function queryFromHref(href) {
  if (!href) return null;
  let m = href.match(/\/category\/([a-z0-9-]+)\/?/i);
  if (m) return { key: 'category', value: m[1].toLowerCase() };
  if (/\/news\/?($|[?#])/i.test(href)) return { key: 'template', value: 'press_release' };
  if (/\/images\/?($|[?#])/i.test(href)) return { key: 'template', value: 'image' };
  if (/\/videos\/?($|[?#])/i.test(href)) return { key: 'template', value: 'video' };
  if (/\/series-2\/?($|[?#])/i.test(href)) return { key: 'template', value: 'skoda_series' };
  return null;
}

// wrapper `type-<cpt>` class → template value.
function templateFromTypeClass(element, headingText) {
  const cls = element.className || '';
  if (/\btype-skoda_model\b/.test(cls)) return 'skoda_model';
  if (/\btype-skoda_series\b/.test(cls)) return 'skoda_series';
  if (/\btype-press_release\b/.test(cls)) return 'press_release';
  if (/\btype-press_kit\b/.test(cls)) return 'press_kit';
  if (/\btype-post\b/.test(cls)) return 'story';
  if (/\btype-attachment\b/.test(cls)) {
    return /video/i.test(headingText) ? 'video' : 'image';
  }
  return null;
}

export default function parse(element, { document }) {
  // The live-Instagram social strip (`type-social`, in a `.socials-static` band)
  // is NOT an index-driven rail — bail before anything else so it isn't mistaken
  // for a `type-post` story rail.
  if (/\btype-social\b/.test(element.className || '') || element.closest('.socials-static')) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const headingEl = element.querySelector('.search-results-heading, h2, h3');
  const heading = headingEl ? (headingEl.textContent || '').trim() : '';

  const allLink = element.querySelector('.search-results-header-link[href]');
  const href = allLink ? allLink.getAttribute('href') : '';

  // Derive the query: prefer the explicit "All" link, else the type-<cpt> class.
  const q = queryFromHref(href);
  const cells = [['Story Rail']];
  if (heading) cells.push(['heading', heading]);

  if (q) {
    cells.push([q.key, q.value]);
  } else {
    const template = templateFromTypeClass(element, heading);
    if (!template) {
      // Not an index-driven rail (e.g. the social strip) — unwrap and bail.
      element.replaceWith(...element.childNodes);
      return;
    }
    cells.push(['template', template]);
  }

  const table = WebImporter.DOMUtils.createTable(cells, document);
  element.replaceWith(table);
}
