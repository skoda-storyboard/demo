/* global WebImporter */

import gallery from './parsers/gallery.js';
import tags from './parsers/tags.js';
import content from './parsers/press-kit-content.js';
import media from './parsers/press-kit-media.js';
import layout from './transformers/skoda-press-kit-default-layout.js';
import metadata from './transformers/skoda-metadata.js';
import normalizeImages from './transformers/skoda-images.js';
import links from './transformers/skoda-links.js';

const TEMPLATE = { name: 'press-kit-default', metadata: { template: 'press_kit' } };

export default {
  preprocess: ({ document }) => {
    document.querySelectorAll('.search-results.media-box a.media-cart-action.download[href]')
      .forEach((a) => { if (!a.textContent.trim()) a.textContent = 'Download'; });
  },
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;
    layout('beforeTransform', main, payload);
    const article = main.querySelector('article.press_kit');
    const body = article.querySelector('.entry-content');
    content(body, { document });

    article.querySelectorAll('section.images.sa-media-kit-preview')
      .forEach((section) => gallery(section, payload));
    article.querySelectorAll('section.tags')
      .forEach((section) => tags(section, payload));
    const mediaBox = article.querySelector('.search-results.media-box');
    media(mediaBox, payload);
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
