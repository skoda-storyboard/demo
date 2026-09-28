/* global WebImporter */

import gallery from './parsers/gallery.js';
import tags from './parsers/tags.js';
import content from './parsers/press-kit-content.js';
import media from './parsers/press-kit-media.js';
import quote, { markQuotes } from './parsers/quote.js';
import layout from './transformers/skoda-press-kit-default-layout.js';
import metadata from './transformers/skoda-metadata.js';
import normalizeImages from './transformers/skoda-images.js';
import links from './transformers/skoda-links.js';

const TEMPLATE = { name: 'press-kit-default', metadata: { template: 'press_kit' } };

export default {
  preprocess: ({ document }) => {
    // Icon-only cart download links would be stripped as empty inline elements before
    // transform. Give every one text: Media Box and inline grid assets, and the video
    // attachments of resource "Videos" children (SKODA-805b).
    document.querySelectorAll('article.press_kit a.media-cart-action.download[href], article.press_kit a[data-action="download"][href]')
      .forEach((a) => { if (!a.textContent.trim()) a.textContent = 'Download'; });
    // preProcess also drops every <hr>: mark the pull-quotes by their rule first (SKODA-220).
    document.querySelectorAll('article.press_kit .entry-content').forEach(markQuotes);
  },
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;
    layout('beforeTransform', main, payload);
    const article = main.querySelector('article.press_kit');
    const body = article.querySelector('.entry-content');
    // Resource "Images" children (SKODA-805b) carry their assets as inline grids with the
    // Media Box item markup: one Downloads table per grid, before content() strips the cart
    // toolbars that hold each image's download sizes.
    body.querySelectorAll('.search-results-items').forEach((grid) => media(grid, payload));
    content(body, { document });
    // After the layout, whose source-table pass would flatten a Quote table.
    body.querySelectorAll('p[data-skoda-quote]').forEach((p) => quote(p, payload));

    article.querySelectorAll('section.images.sa-media-kit-preview')
      .forEach((section) => gallery(section, payload));
    article.querySelectorAll('section.tags')
      .forEach((section) => tags(section, payload));
    const mediaBox = article.querySelector('.search-results.media-box');
    if (mediaBox) media(mediaBox, payload); // resource children have none (SKODA-805b)
    layout('afterTransform', main, payload);
    metadata('afterTransform', main, { ...payload, template: TEMPLATE });

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
