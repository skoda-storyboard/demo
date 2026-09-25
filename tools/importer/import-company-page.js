/* eslint-disable */
/* global WebImporter */

/**
 * Import orchestrator: Škoda company / utility page (template-media-room-page).
 * e.g. /en/contacts/, /en/board-of-management/, /en/annual-reports/.
 *
 * FLATTEN-TO-DEFAULT: hero banner + the SiteOrigin `.entry-content` body flattened
 * to plain default content (headings + rich text survive). The per-member "show more"
 * photo galleries / download grids / the 5 named company sub-type blocks are NOT
 * reconstructed here — deferred to SKODA-810 (+ SKODA-604 full-fidelity). Metadata
 * template=page. Content-driven detection only.
 */

import heroBannerParser from './parsers/hero-banner.js';
import cleanupTransformer from './transformers/skoda-page-cleanup.js';
import sectionsTransformer from './transformers/skoda-model-sections.js';
import metadataTransformer from './transformers/skoda-metadata.js';
import linksTransformer from './transformers/skoda-links.js';

const parsers = {
  'hero-banner': heroBannerParser,
};

const PAGE_TEMPLATE = {
  name: 'company-page',
  description:
    'Škoda company/utility page (template-media-room-page). Hero banner + .entry-content flattened to default content. Named sub-type blocks/galleries deferred to SKODA-810. Metadata template=page. Content-driven detection only.',
  urls: ['https://www.skoda-storyboard.com/en/contacts/'],
  metadata: { template: 'page' },
  blocks: [
    { name: 'hero-banner', instances: ['div.hero'] },
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
      name: 'Body',
      selector: ['article .entry-content', '.entry-content'],
      style: null,
      blocks: [],
      defaultContent: [
        '.entry-content h1', '.entry-content h2', '.entry-content h3',
        '.entry-content p', '.entry-content ul', '.entry-content ol',
      ],
    },
  ],
};

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
