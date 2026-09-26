/* eslint-disable */
/* global WebImporter */
/**
 * Parser: model-page rail (block name: "Story Rail"), SKODA-208.
 * Source: {#derivatives|#news|#press-kits|#stories|#images|#videos} .search-results-container
 *
 * ⚠️ INDEX-DRIVEN: the source SSR cards are NOT reproduced. The runtime story-rail
 * block reads the config rows and pulls its items from the query-index.
 *
 * Output (the skoda-story-cleanup.js related-band pattern), in order:
 *   <h2 data-model-key="<rail id>">News</h2>   default content (rail heading)
 *   <p>Based on tags: Kodiaq, SUV</p>           default content (source .subheading)
 *   Story Rail | template | press_release |
 *              | model    | kodiaq        |      facets from the page's "All" filter links
 *              | bodywork | suv           |
 *              | viewall  | <a href="…/en/news/?filter[model][]=kodiaq&filter[bodywork][]=suv">All</a> |
 * Never `heading` / `subheading` keys: the heading stays in the section even when the
 * rail is empty, and an unknown key (`subheading`) makes story-rail render the config
 * as curated cards (contract `story-rail-subheading`, fallback broken).
 *
 * Facets: from this rail's own "All" link (`filter[<facet>][0]=<slug>`); a rail without
 * one (Stories) borrows the first "All" link on the page. Every model page's rails share
 * one filter set. The view-all href uses the listing block's `filter[<facet>][]` scheme.
 *
 * Bodywork / Derivatives (template skoda_model) lists the model family by path: on a
 * parent page `/en/skoda-model/<parent>/` (its derivatives only); on a derivative page
 * `/en/skoda-model/<parent>` (parent + all derivatives, as the source shows).
 */
const RAILS = {
  derivatives: { template: 'skoda_model', heading: 'Bodywork / Derivatives' },
  news: { template: 'press_release', heading: 'News' },
  'press-kits': { template: 'press_kit', heading: 'Press Kits' },
  stories: { template: 'story', heading: 'Stories' },
  images: { template: 'image', heading: 'Images', limit: '20' },
  videos: { template: 'video', heading: 'Videos', limit: '20' },
};
const FACET_KEYS = ['model', 'bodywork', 'derivative'];

const clean = (text) => String(text || '').replace(/\s+/g, ' ').trim();

/** { facet: [slug…] } from a source "All" href (`filter[model][0]=kodiaq&…`), in href order. */
function facetsFromHref(href) {
  const out = {};
  let query = '';
  try { query = new URL(href, 'https://www.skoda-storyboard.com').search; } catch (e) { return out; }
  new URLSearchParams(query).forEach((value, key) => {
    const m = key.match(/^filter\[([a-z0-9_-]+)\](?:\[\d*\])?$/i);
    if (!m || !value) return;
    const facet = m[1].toLowerCase();
    if (!FACET_KEYS.includes(facet)) return;
    (out[facet] = out[facet] || []);
    const slug = value.toLowerCase();
    if (!out[facet].includes(slug)) out[facet].push(slug);
  });
  return out;
}

function allLink(root) {
  return root.querySelector('a.search-results-header-link[href*="filter"]');
}

/** The source-page path segments after /skoda-model/ (e.g. ['new-kodiaq', 'kodiaq-rs']). */
function modelSegments(document, url) {
  const canonical = document.querySelector('link[rel="canonical"]');
  const href = url || (canonical && canonical.getAttribute('href')) || '';
  const m = String(href).match(/\/skoda-model\/([a-z0-9/-]+)/i);
  return m ? m[1].toLowerCase().split('/').filter(Boolean) : [];
}

export default function parse(element, { document, url, params }) {
  let node = element;
  let railId = null;
  while (node && node !== document.documentElement) {
    if (node.id && Object.prototype.hasOwnProperty.call(RAILS, node.id)) { railId = node.id; break; }
    node = node.parentElement;
  }
  if (!railId) {
    element.replaceWith(...element.childNodes);
    return;
  }
  const rail = RAILS[railId];

  const headingEl = element.querySelector('.search-results-heading, h2, h3');
  let headingText = rail.heading;
  let subText = '';
  if (headingEl) {
    const sub = headingEl.querySelector('.subheading');
    subText = sub ? clean(sub.textContent) : '';
    const clone = headingEl.cloneNode(true);
    clone.querySelectorAll('.subheading').forEach((s) => s.remove());
    headingText = clean(clone.textContent) || headingText;
  }

  const rows = [['Story Rail'], ['template', rail.template]];
  let viewAll = null;

  if (railId === 'derivatives') {
    const segs = modelSegments(document, (params && params.originalURL) || url);
    if (!segs.length) {
      console.warn('[story-rail] derivatives rail: no /skoda-model/<slug> in the page URL; dropped');
      element.remove();
      return;
    }
    rows.push(['path', segs.length > 1 ? `/en/skoda-model/${segs[0]}` : `/en/skoda-model/${segs[0]}/`]);
  } else {
    const own = allLink(element);
    const link = own || allLink(document);
    const facets = link ? facetsFromHref(link.getAttribute('href')) : {};
    FACET_KEYS.forEach((f) => { if (facets[f]) rows.push([f, facets[f].join(', ')]); });
    if (rows.length === 2) {
      console.warn(`[story-rail] ${railId}: no model filter on the page; dropped`);
      element.remove();
      return;
    }
    if (rail.limit) rows.push(['limit', rail.limit]);
    if (own) {
      const target = new URL(own.getAttribute('href'), 'https://www.skoda-storyboard.com');
      const qs = new URLSearchParams();
      FACET_KEYS.forEach((f) => (facets[f] || []).forEach((v) => qs.append(`filter[${f}][]`, v)));
      viewAll = document.createElement('a');
      viewAll.setAttribute('href', `${target.origin}${target.pathname}?${qs.toString().replace(/%5B/g, '[').replace(/%5D/g, ']')}`);
      viewAll.textContent = clean(own.textContent) || 'All';
      rows.push(['viewall', viewAll]);
    }
  }

  const h2 = document.createElement('h2');
  h2.textContent = headingText;
  h2.setAttribute('data-model-key', railId);
  const out = [h2];
  if (subText) {
    const p = document.createElement('p');
    p.textContent = subText;
    out.push(p);
  }
  out.push(WebImporter.DOMUtils.createTable(rows, document));
  element.replaceWith(...out);
}
