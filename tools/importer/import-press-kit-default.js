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
    document.querySelectorAll('.search-results.media-box a.media-cart-action.download[href]')
      .forEach((a) => { if (!a.textContent.trim()) a.textContent = 'Download'; });
  },
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;
    const template = templateFor(document, params.originalURL);
    layout('beforeTransform', main, payload);
    const article = main.querySelector('article.press_kit');
    const body = article.querySelector('.entry-content');
    content(body, { document });

    article.querySelectorAll('section.images.sa-media-kit-preview')
      .forEach((section) => gallery(section, payload));
    article.querySelectorAll('section.tags')
      .forEach((section) => tags(section, payload));
    // Images resource pages group their assets in per-heading galleries (SKODA-805b).
    body.querySelectorAll('.search-results.search-results-gallery')
      .forEach((group) => media(group, payload));
    const mediaBox = article.querySelector('.search-results.media-box');
    if (mediaBox) media(mediaBox, payload);
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
