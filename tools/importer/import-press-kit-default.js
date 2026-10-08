/* global WebImporter */

import gallery from './parsers/gallery.js';
import tags from './parsers/tags.js';
import content from './parsers/press-kit-content.js';
import media from './parsers/press-kit-media.js';
import quote, { markQuotes, parseFigure } from './parsers/quote.js';
import footnotes, { markFootnotes } from './parsers/footnotes.js';
import layout from './transformers/skoda-press-kit-default-layout.js';
import metadata from './transformers/skoda-metadata.js';
import normalizeImages from './transformers/skoda-images.js';
import links from './transformers/skoda-links.js';
import nbspTransformer from './transformers/skoda-nbsp.js';

const TEMPLATE = { name: 'press-kit-default', metadata: { template: 'press_kit' } };

// A chapter/resource child's Chapters nav links back to its hub. Children get their own
// template so they don't fill the Press Kits rails, which match template=press_kit, and
// theme=press-kit so scripts.js still loads the press-kit layout for them (SKODA-805b).
function templateFor(document, pageUrl) {
  const hub = document.querySelector('.chapter-nav .link-intro[href]');
  if (!hub) return TEMPLATE;
  const hubUrl = new URL(hub.getAttribute('href'), pageUrl);
  const path = (value) => value.pathname.replace(/\/$/, '');
  if (path(hubUrl) === path(new URL(pageUrl))) return TEMPLATE;
  return {
    ...TEMPLATE,
    metadata: { template: 'press_kit_chapter', theme: 'press-kit', presskit: path(hubUrl) },
  };
}

// A document holds at most 200 images (helix html2md). An Images chapter past that (the Peaq kit:
// 246 tiles) moves its largest gallery groups to fragments until the page, counting every image
// it keeps, is within the limit; the page loads each with a Fragment block where the group was. A
// fragment is imported from the page URL with `?fragment=<slug>` (the bulk runner writes one
// document per URL), SKODA-806. A group past the limit on its own can't be a fragment either, and
// every emitted document is checked once built (PR #287 review).
export const IMAGE_LIMIT = 200;

/** Throws when an emitted document holds more images than one document can. */
function checkImageLimit(root, what) {
  const count = root.querySelectorAll('img').length;
  if (count > IMAGE_LIMIT) {
    throw new Error(`${what} holds ${count} images; a document holds at most ${IMAGE_LIMIT}`);
  }
}

const slugOf = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

/** The gallery groups of an Images chapter: element, tile count, widget title, unique slug. */
function galleryGroups(body) {
  const seen = new Map();
  return [...body.querySelectorAll('.search-results.search-results-gallery')].map((el) => {
    const titleEl = el.closest('.textwidget')?.parentElement?.querySelector(':scope > .widget-title');
    const title = (titleEl?.textContent || '').trim();
    const base = slugOf(title) || 'images';
    const n = (seen.get(base) || 0) + 1;
    seen.set(base, n);
    return {
      el, titleEl, title, slug: n > 1 ? `${base}-${n}` : base, size: el.querySelectorAll('img').length,
    };
  });
}

/**
 * The groups that leave the page: the largest first, until the page's images (`others` outside
 * the groups plus the groups that stay) are within the limit. A group too big for a document of
 * its own is refused rather than split, as its tiles are one Downloads block.
 * @param {Array<{size: number, title?: string, slug: string}>} groups images per group
 * @param {number} [others] the page's images outside the groups
 * @param {number} [limit]
 */
export function fragmentGroups(groups, others = 0, limit = IMAGE_LIMIT) {
  let total = others + groups.reduce((n, group) => n + group.size, 0);
  const out = new Set();
  [...groups].sort((a, b) => b.size - a.size).forEach((group) => {
    if (total <= limit) return;
    if (group.size > limit) {
      throw new Error(`Press-kit Images group "${group.title || group.slug}" has ${group.size} images; a document holds at most ${limit}`);
    }
    out.add(group);
    total -= group.size;
  });
  return groups.filter((group) => out.has(group));
}

/** Where a group's fragment lives: outside the /en page tree, so feeds never list it. */
export function fragmentPath(pagePath, slug) {
  return `/fragments${pagePath.replace(/\/$/, '')}/${slug}`;
}

export default {
  preprocess: ({ document }) => {
    // keep the source's glued non-breaking spaces (html2md would turn them into spaces): the
    // FAQ answers wrap a line differently without them (PR #263 review)
    nbspTransformer('preprocess', document.body, { document });
    // Icon-only cart download links would be stripped as empty inline elements before
    // transform. Give every one text: Media Box and inline grid assets, and the video
    // attachments of resource "Videos" children (SKODA-805b).
    document.querySelectorAll('article.press_kit a.media-cart-action.download[href], article.press_kit a[data-action="download"][href]')
      .forEach((a) => { if (!a.textContent.trim()) a.textContent = 'Download'; });
    // preProcess also drops every <hr>: mark the pull-quotes by their rule first (SKODA-220).
    document.querySelectorAll('article.press_kit .entry-content').forEach(markQuotes);
    // Small print, read from the source as published, before helix-importer's clean-up
    // (SKODA-805d).
    document.querySelectorAll('article.press_kit .entry-content').forEach(markFootnotes);
  },
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;
    const template = templateFor(document, params.originalURL);
    layout('beforeTransform', main, payload);
    const article = main.querySelector('article.press_kit');
    const body = article.querySelector('.entry-content');
    const pagePath = new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html?$/, '');
    const groups = galleryGroups(body);
    const wanted = new URL(params.originalURL).searchParams.get('fragment');
    if (wanted) {
      // one gallery group as its own fragment document: its heading + its Downloads (gallery)
      const group = groups.find(({ slug }) => slug === wanted);
      if (!group) throw new Error(`Press-kit Images chapter has no gallery group "${wanted}"`);
      const holder = document.createElement('div');
      if (group.title) holder.append(Object.assign(document.createElement('h2'), { textContent: group.title }));
      holder.append(group.el);
      media(group.el, payload);
      main.replaceChildren(holder);
      normalizeImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      links('afterTransform', main, payload);
      checkImageLimit(main, `Press-kit Images fragment "${group.slug}"`);
      return [{
        element: main,
        path: WebImporter.FileUtils.sanitizePath(fragmentPath(pagePath, group.slug)),
        report: { title: group.title, template: TEMPLATE.name },
      }];
    }
    // an oversize Images chapter: these groups become Fragment blocks (marked, then built after
    // the layout, whose table pass would flatten the block table)
    // the page's other images (lead image, inline grids, sidebar) count towards its limit too
    const others = main.querySelectorAll('img').length - groups.reduce((n, group) => n + group.size, 0);
    fragmentGroups(groups, others).forEach((group) => {
      const mark = document.createElement('p');
      mark.dataset.skodaFragment = fragmentPath(pagePath, group.slug);
      const link = Object.assign(document.createElement('a'), { href: mark.dataset.skodaFragment });
      link.textContent = mark.dataset.skodaFragment;
      mark.append(link);
      group.el.replaceWith(mark);
      group.titleEl?.remove();
    });
    // Resource "Images" children (SKODA-805b) carry their assets as inline grids with the
    // Media Box item markup: one Downloads table per grid, before content() strips the cart
    // toolbars that hold each image's download sizes. A per-heading gallery is converted whole
    // (`collapse auto`), so its select-all toolbar and Show more/less toggle go with it (PR #202).
    body.querySelectorAll('.search-results.search-results-gallery').forEach((group) => media(group, payload));
    body.querySelectorAll('.search-results-items').forEach((grid) => media(grid, payload));
    // the kit's FAQ chapter (`…/frequently-asked-questions/`) emits `Accordion (faq)` (SKODA-807)
    const faq = /\/frequently-asked-questions\/?$/.test(new URL(params.originalURL).pathname);
    content(body, { document, faq });
    // After the layout, whose source-table pass would flatten a Quote table.
    body.querySelectorAll('p[data-skoda-quote]').forEach((p) => quote(p, payload));
    body.querySelectorAll('p[data-skoda-fragment]').forEach((p) => {
      const link = p.querySelector('a');
      p.replaceWith(WebImporter.DOMUtils.createTable([['Fragment'], [link]], document));
    });
    // The chapters' WordPress figure quotes (left-aligned, no rule): `Quote (left)`.
    body.querySelectorAll('figure').forEach((figure) => parseFigure(figure, payload));
    body.querySelectorAll('p[data-skoda-footnote]').forEach((p) => footnotes(p, payload));
    // a mark outside the article body (another .entry-content) never reaches DA
    main.querySelectorAll('[data-skoda-footnote]').forEach((p) => p.removeAttribute('data-skoda-footnote'));

    article.querySelectorAll('section.images.sa-media-kit-preview')
      .forEach((section) => gallery(section, payload));
    article.querySelectorAll('section.tags')
      .forEach((section) => tags(section, payload));
    const mediaBox = article.querySelector('.search-results.media-box');
    if (mediaBox) media(mediaBox, payload); // resource children have none (SKODA-805b)
    layout('afterTransform', main, payload);
    metadata('afterTransform', main, { ...payload, template });

    WebImporter.rules.transformBackgroundImages(main, document);
    normalizeImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
    links('afterTransform', main, payload);

    checkImageLimit(main, `Press-kit page ${pagePath}`);
    return [{
      element: main,
      path: WebImporter.FileUtils.sanitizePath(pagePath || '/index'),
      report: { title: document.title, template: TEMPLATE.name },
    }];
  },
};
