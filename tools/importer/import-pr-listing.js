/* eslint-disable */
/* global WebImporter */

/**
 * Import orchestrator: Škoda PR / faceted listing (template-search-results, /en/news/).
 *
 * INDEX-DRIVEN. Emits a single `Listing` config block over the published
 * query-index; does NOT port SSR result cards or the source filter stack. One
 * template = one import script. Detection is content-driven (the listing engine is
 * located by its DOM selector, `#search-filter-results`).
 */

// PARSER IMPORTS
import listingParser from './parsers/listing.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/skoda-listing-cleanup.js';
import sectionsTransformer from './transformers/skoda-model-sections.js';
import metadataTransformer from './transformers/skoda-metadata.js';

// PARSER REGISTRY
const parsers = {
  listing: listingParser,
};

// PAGE TEMPLATE CONFIGURATION — embedded from page-templates.json (pr-listing)
const PAGE_TEMPLATE = {
  name: 'pr-listing',
  description:
    'Škoda faceted-listing page (template-search-results engine, e.g. /en/news/). Index-driven: emits a single Listing config block; SSR cards + source filter stack not ported. Page metadata template=page. Content-driven detection only.',
  urls: ['https://www.skoda-storyboard.com/en/news/'],
  blocks: [
    { name: 'listing', instances: ['#search-filter-results'] },
  ],
  sections: [
    {
      id: 'section-1',
      name: 'Listing',
      selector: ['#search-filter-results'],
      style: null,
      blocks: ['listing'],
      defaultContent: ['h1.entry-title, h1.page-title, main h1'],
    },
  ],
};

// TRANSFORMER REGISTRY — cleanup + (sections if 2+, here it no-ops) + shared metadata.
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
  metadataTransformer,
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

    // Shared skoda-metadata.js already emitted the canonical Metadata block; do NOT
    // call WebImporter.rules.createMetadata (it would append a thinner duplicate).
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
