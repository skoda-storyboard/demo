/* eslint-disable */
/* global WebImporter */

/**
 * Import orchestrator: Škoda Storyboard home (template-homepage, /en/).
 *
 * Featured promo-box (curated cards), a Stories feed, and index-driven Story Rails
 * (home-rail self-classifies each .search-results rail from its heading + "All"
 * link / type-<cpt> class). The live-Instagram social strip is not index-driven —
 * home-rail unwraps it. Preserve each cover-box section and its Style metadata.
 * Metadata template=page (nav/direct only; body class carries `page`).
 */

import promoBoxParser from './parsers/promo-box.js';
import homeRailParser from './parsers/home-rail.js';
import homeStoriesParser from './parsers/home-stories.js';
import cleanupTransformer from './transformers/skoda-page-cleanup.js';
import sectionsTransformer from './transformers/skoda-home-sections.js';
import metadataTransformer from './transformers/skoda-metadata.js';
import linksTransformer from './transformers/skoda-links.js';
import normalizeImages from './transformers/skoda-images.js';

const parsers = {
  'promo-box': promoBoxParser,
  'home-rail': homeRailParser,
  'home-stories': homeStoriesParser,
};

const PAGE_TEMPLATE = {
  name: 'home-sto',
  description:
    'Škoda Storyboard home (template-homepage). Curated promo, Stories feed and index-driven Story Rails in cover-box bands. Social strip unwrapped. Metadata template=page.',
  urls: ['https://www.skoda-storyboard.com/en/'],
  metadata: { template: 'page' },
  blocks: [
    { name: 'promo-box', instances: ['section.promo-box'] },
    { name: 'home-stories', instances: ['.cover-box .search-results.latest-articles'] },
    { name: 'home-rail', instances: ['.cover-box .search-results[class*="type-"]'] },
  ],
  sections: [],
};

const transformers = [
  cleanupTransformer,
  sectionsTransformer,
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
    normalizeImages(main, document);
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
