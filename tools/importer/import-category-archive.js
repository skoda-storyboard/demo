/* eslint-disable */
/* global WebImporter */

/**
 * Import orchestrator: Škoda category/tag ARCHIVE listing (body.archive).
 *
 * Hero banner (tag/model adds a CTA overlay) + an index-driven, facet-less Listing
 * over the archive grid (scope derived from the page canonical URL). Distinct from
 * pr-listing (which has the facet engine). Serves both /en/category/<x>/ and
 * /en/tag/model/<x>/ — same DOM shape. One template = one import script.
 * Content-driven detection only.
 */

// PARSER IMPORTS
import heroBannerParser from './parsers/hero-banner.js';
import archiveListParser from './parsers/archive-list.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/skoda-page-cleanup.js';
import sectionsTransformer from './transformers/skoda-model-sections.js';
import metadataTransformer from './transformers/skoda-metadata.js';
import linksTransformer from './transformers/skoda-links.js';

// PARSER REGISTRY
const parsers = {
  'hero-banner': heroBannerParser,
  'archive-list': archiveListParser,
};

// PAGE TEMPLATE CONFIGURATION — embedded from page-templates.json (category-archive)
const PAGE_TEMPLATE = {
  name: 'category-archive',
  description:
    'Škoda category/tag archive listing. Hero banner -> index-driven facet-less Listing over the archive grid (scope from canonical URL). Metadata template=page. Content-driven detection only.',
  urls: [
    'https://www.skoda-storyboard.com/en/category/emobility/',
    'https://www.skoda-storyboard.com/en/tag/model/elroq/',
  ],
  metadata: { template: 'page' },
  blocks: [
    { name: 'hero-banner', instances: ['div.hero'] },
    {
      name: 'archive-list',
      instances: ['div.search-results.archive-results, .container .search-results-items'],
    },
  ],
  sections: [
    {
      id: 'section-1',
      name: 'Hero',
      selector: ['div.hero'],
      style: null,
      blocks: ['hero-banner'],
      defaultContent: [],
    },
    {
      id: 'section-2',
      name: 'Archive',
      selector: [
        'div.search-results.archive-results',
        '.container .search-results-items',
      ],
      style: null,
      blocks: ['archive-list'],
      defaultContent: [],
    },
  ],
};

// TRANSFORMER REGISTRY — cleanup + (sections if 2+) + shared metadata (afterTransform).
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
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
