/* eslint-disable */
/* global WebImporter */

/**
 * Import orchestrator: Škoda site-wide search results (template-search-results, /en/search/).
 *
 * INDEX-DRIVEN. Emits a single `Listing` config block (search variant: no path/template
 * filter — cross-type; search=true free-text; columns=3) selected content-driven from the
 * body class by listing.js. Content-driven detection only.
 */

import listingParser from './parsers/listing.js';
import cleanupTransformer from './transformers/skoda-listing-cleanup.js';
import sectionsTransformer from './transformers/skoda-model-sections.js';
import metadataTransformer from './transformers/skoda-metadata.js';

const parsers = {
  listing: listingParser,
};

const PAGE_TEMPLATE = {
  name: 'search-listing',
  description:
    'Škoda site-wide search (body.search). listing.js emits the search variant (no path/template filter; search=true; columns=3). Index-driven over the whole query-index. Metadata template=page.',
  urls: ['https://www.skoda-storyboard.com/en/search/'],
  metadata: { template: 'page' },
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
