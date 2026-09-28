/* eslint-disable */
/* global WebImporter */

/**
 * Import orchestrator: Škoda Škodapedia glossary directory (post-type-archive-skodapedia).
 *
 * Emits a single `Skodapedia` directory block (one row per glossary term: letter +
 * linked title). The A–Z nav / model / category filters are re-applied client-side
 * by the runtime block. The ~212 term-detail fragments (a thin REST fetch on the
 * source) are pre-baked separately under SKODA-802 — not this pass. Metadata
 * template=page. Content-driven detection only (SKODA-206).
 */

import skodapediaParser from './parsers/skodapedia.js';
import cleanupTransformer from './transformers/skoda-page-cleanup.js';
import metadataTransformer from './transformers/skoda-metadata.js';
import linksTransformer from './transformers/skoda-links.js';

const parsers = {
  skodapedia: skodapediaParser,
};

const PAGE_TEMPLATE = {
  name: 'skodapedia',
  description:
    'Škoda Škodapedia glossary directory (post-type-archive-skodapedia). One Skodapedia block (term index); term-detail prebake → SKODA-802. Metadata template=page. Content-driven detection only.',
  urls: ['https://www.skoda-storyboard.com/en/skodapedia/'],
  metadata: { template: 'page' },
  blocks: [
    { name: 'skodapedia', instances: ['.sp__list-content'] },
  ],
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
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
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
      } else {
        console.warn(`No parser found for block: ${block.name}`);
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
