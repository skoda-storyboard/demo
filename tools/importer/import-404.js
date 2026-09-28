/* eslint-disable */
/* global WebImporter */

/**
 * Import orchestrator: Škoda branded 404 (error404).
 *
 * Minimal: keep the dead-end message (`.error-message`: "404" + "You've reached a
 * dead end." + the "return to the homepage" link) as default content; drop all
 * chrome. This becomes the site-root 404.html shell (EDS serves a real HTTP 404;
 * the STO header/footer are re-added by runtime decoration, not the import).
 * Metadata template=page (error404 body class maps to `page`; the 404 is not a
 * rail-indexed content row). Content-driven detection only (SKODA-706).
 */

import cleanupTransformer from './transformers/skoda-page-cleanup.js';
import metadataTransformer from './transformers/skoda-metadata.js';
import linksTransformer from './transformers/skoda-links.js';

const parsers = {};

const PAGE_TEMPLATE = {
  name: 'error-404',
  description:
    'Škoda branded 404 (error404). Keeps the .error-message dead-end copy + homepage link as default content; chrome dropped. Metadata template=page. Site-root 404.html shell. Content-driven detection only.',
  urls: ['https://www.skoda-storyboard.com/en/this-page-does-not-exist-zzz/'],
  metadata: { template: 'page' },
  blocks: [],
  sections: [],
};

const transformers = [
  cleanupTransformer,
  metadataTransformer,
  linksTransformer,
];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element) => {
        pageBlocks.push({ name: blockDef.name, selector, element });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    executeTransformers('beforeTransform', main, payload);

    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      }
    });

    executeTransformers('afterTransform', main, payload);

    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
