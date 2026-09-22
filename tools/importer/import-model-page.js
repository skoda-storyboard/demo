/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroParser from './parsers/hero.js';
import inPageNavParser from './parsers/in-page-nav.js';
import keyFactsParser from './parsers/key-facts.js';
import specTableParser from './parsers/spec-table.js';
import storyRailParser from './parsers/story-rail.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/skoda-model-cleanup.js';
import metadataTransformer from './transformers/skoda-model-metadata.js';
import tagsTransformer from './transformers/skoda-model-tags.js';
import sectionsTransformer from './transformers/skoda-model-sections.js';

// PAGE TEMPLATE CONFIGURATION — embedded from page-templates.json (template "model-page")
const PAGE_TEMPLATE = {
  name: 'model-page',
  description: 'Škoda model page (skoda_model CPT, Media Room side). SKODA-208.',
  urls: [
    'https://www.skoda-storyboard.com/en/skoda-model/elroq/',
  ],
  blocks: [
    { name: 'hero', instances: ['article.skoda_model > .carousel'] },
    { name: 'in-page-nav', instances: ['nav.model-nav', '.model-nav'] },
    { name: 'key-facts', instances: ['#keyfacts .so-widget-ys-so-widget-highlights'] },
    { name: 'spec-table', instances: ['#techdata .so-widget-ys-so-widget-techdata'] },
    {
      name: 'story-rail',
      instances: [
        '#derivatives .search-results-container',
        '#news .search-results-container',
        '#press-kits .search-results-container',
        '#stories .search-results-container',
        '#images .search-results-container',
        '#videos .search-results-container',
      ],
    },
  ],
  sections: [
    { id: 'section-1', name: 'Hero', selector: ['article.skoda_model > .carousel'], style: null, blocks: ['hero'], defaultContent: [] },
    { id: 'section-2', name: 'In-page nav', selector: ['.model-nav'], style: null, blocks: ['in-page-nav'], defaultContent: [] },
    { id: 'section-3', name: 'Model Description', selector: ['#intro'], style: null, blocks: [], defaultContent: ['#intro h2', '#intro p'] },
    { id: 'section-4', name: 'Key Facts', selector: ['#keyfacts'], style: null, blocks: ['key-facts'], defaultContent: [] },
    { id: 'section-5', name: 'Technical Data', selector: ['#techdata'], style: null, blocks: ['spec-table'], defaultContent: [] },
    { id: 'section-6', name: 'Bodywork / Derivatives', selector: ['#derivatives'], style: null, blocks: ['story-rail'], defaultContent: [] },
    { id: 'section-7', name: 'News', selector: ['#news'], style: null, blocks: ['story-rail'], defaultContent: [] },
    { id: 'section-8', name: 'Press Kits', selector: ['#press-kits'], style: null, blocks: ['story-rail'], defaultContent: [] },
    { id: 'section-9', name: 'Stories', selector: ['#stories'], style: null, blocks: ['story-rail'], defaultContent: [] },
    { id: 'section-10', name: 'Images', selector: ['#images'], style: null, blocks: ['story-rail'], defaultContent: [] },
    { id: 'section-11', name: 'Videos', selector: ['#videos'], style: null, blocks: ['story-rail'], defaultContent: [] },
  ],
};

// PARSER REGISTRY
const parsers = {
  hero: heroParser,
  'in-page-nav': inPageNavParser,
  'key-facts': keyFactsParser,
  'spec-table': specTableParser,
  'story-rail': storyRailParser,
};

// TRANSFORMER REGISTRY — cleanup (before) → metadata + sections (after)
const transformers = [
  cleanupTransformer,
  metadataTransformer,
  tagsTransformer, // after metadata: inserts Tags blocks just before the Metadata block
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook.
 */
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

/**
 * Find all blocks on the page based on the embedded template configuration.
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name, selector, element, section: blockDef.section || null,
        });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    // 1. beforeTransform (chrome/noise removal)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block (skip elements already replaced by an earlier parser)
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

    // 4. afterTransform (metadata block + section breaks)
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules.
    //    NOTE: createMetadata is intentionally NOT called — the skoda-model-metadata
    //    transformer already emits the complete query-index Metadata block (template,
    //    model, tags, publisheddate). Calling the built-in rule too would append a
    //    second, partial duplicate Metadata block.
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized path (map root to /index defensively)
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
