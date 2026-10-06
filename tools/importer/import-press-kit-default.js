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

export default {
  preprocess: ({ document }) => {
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
    // Resource "Images" children (SKODA-805b) carry their assets as inline grids with the
    // Media Box item markup: one Downloads table per grid, before content() strips the cart
    // toolbars that hold each image's download sizes. A per-heading gallery is converted whole
    // (`collapse auto`), so its select-all toolbar and Show more/less toggle go with it (PR #202).
    body.querySelectorAll('.search-results.search-results-gallery').forEach((group) => media(group, payload));
    body.querySelectorAll('.search-results-items').forEach((grid) => media(grid, payload));
    content(body, { document });
    // After the layout, whose source-table pass would flatten a Quote table.
    body.querySelectorAll('p[data-skoda-quote]').forEach((p) => quote(p, payload));
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

    const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html?$/, '');
    return [{
      element: main,
      path: WebImporter.FileUtils.sanitizePath(rawPath || '/index'),
      report: { title: document.title, template: TEMPLATE.name },
    }];
  },
};
