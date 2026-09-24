/* eslint-disable */
/* global WebImporter */

/**
 * Import orchestrator: Škoda model page (skoda_model CPT, e.g. /en/skoda-model/elroq/).
 *
 * Full-bleed hero + 9-anchor in-page icon nav + "Model Description" default content +
 * Key Facts cards + Technical Data spec table + 6 index-driven story-rails. One
 * template = one import script. Detection is content-driven (blocks located by the
 * page-templates.json selectors; parsers self-identify / bail defensively).
 *
 * Metadata: the shared skoda-metadata.js derives template=skoda_model (from the
 * single-skoda_model body class), category from the URL path, and publisheddate; the
 * model facet + rail tags come from the page's own tag links / story-rail config.
 */

// PARSER IMPORTS
import heroParser from './parsers/hero.js';
import inPageNavParser from './parsers/in-page-nav.js';
import keyFactsParser from './parsers/key-facts.js';
import specTableParser from './parsers/spec-table.js';
import storyRailParser from './parsers/story-rail.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/skoda-model-cleanup.js';
import sectionsTransformer from './transformers/skoda-model-sections.js';
import metadataTransformer from './transformers/skoda-metadata.js';

const parsers = {
  hero: heroParser,
  'in-page-nav': inPageNavParser,
  'key-facts': keyFactsParser,
  'spec-table': specTableParser,
  'story-rail': storyRailParser,
};

// PAGE TEMPLATE CONFIGURATION — embedded from page-templates.json (model-page)
const PAGE_TEMPLATE = {
  name: 'model-page',
  description:
    'Škoda model page (skoda_model CPT). Hero + in-page nav + Model Description + Key Facts + Technical Data + 6 index-driven rails. Metadata template=skoda_model (body class), category from URL. Content-driven detection only.',
  urls: ['https://www.skoda-storyboard.com/en/skoda-model/elroq/'],
  blocks: [
    { name: 'hero', instances: ['article.skoda_model > .carousel'] },
    { name: 'in-page-nav', instances: ['nav.model-nav, .model-nav'] },
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
