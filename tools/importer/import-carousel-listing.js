/* eslint-disable */
/* global WebImporter */

/**
 * Import orchestrator: Media Room carousel listing (template-carousel-listing), SKODA-845.
 * The only page on it is /en/newsletter/: the 240px title band (Hero Image (page), SKODA-813),
 * then one index-driven Story Rail per plant (Kvasiny, Vrchlabí), each in its own section under
 * its h3. The rails read the press releases' `categories` + `company` index columns, so new plant
 * newsletters appear without editing the page. The Media Room nav and footer come from the bulk
 * metadata sheet (/en/newsletter). Metadata template=page. Content-driven detection only.
 */

import heroBannerParser from './parsers/hero-banner.js';
import carouselListingParser from './parsers/carousel-listing.js';
import cleanupTransformer from './transformers/skoda-page-cleanup.js';
import metadataTransformer from './transformers/skoda-metadata.js';
import linksTransformer from './transformers/skoda-links.js';
import nbspTransformer from './transformers/skoda-nbsp.js';

const parsers = {
  'hero-banner': heroBannerParser,
  'carousel-listing': carouselListingParser,
};

const PAGE_TEMPLATE = {
  name: 'carousel-listing',
  description:
    'Media Room carousel listing (template-carousel-listing): Hero Image (page) + one index-driven Story Rail per plant (press releases by categories + company), each under its h3 in its own section. Metadata template=page. Content-driven detection only.',
  urls: ['https://www.skoda-storyboard.com/en/newsletter/'],
  metadata: { template: 'page' },
  blocks: [
    { name: 'hero-banner', instances: ['div.hero'] },
    { name: 'carousel-listing', instances: ['.search-results .search-results-container'] },
  ],
  // the rail parser opens each plant's section itself (an <hr> before its heading)
  sections: [
    {
      id: 'section-1', name: 'Hero', selector: ['div.hero'], style: null, blocks: ['hero-banner'], defaultContent: [],
    },
    {
      id: 'section-2', name: 'Plant rails', selector: ['.search-results'], style: null, blocks: ['carousel-listing'], defaultContent: [],
    },
  ],
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
  // keep the source's glued non-breaking spaces (html2md would turn them into spaces)
  preprocess: ({ document }) => nbspTransformer('preprocess', document.body, { document }),

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
