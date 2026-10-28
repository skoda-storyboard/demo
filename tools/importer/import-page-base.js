/* eslint-disable */
/* global WebImporter */

/**
 * Import orchestrator: Škoda editorial "Page" base shell (page-template-default).
 *
 * Hero banner + single-column body. The SiteOrigin panel-grid body is flattened to
 * plain default content (headings + rich text) — the widget tree is NOT rebuilt
 * (deferred to SKODA-801). One template = one import script. Content-driven detection.
 */

// PARSER IMPORTS
import heroBannerParser from './parsers/hero-banner.js';

// TRANSFORMER IMPORTS
import pageRowsTransformer from './transformers/skoda-page-rows.js';
import pageTablesTransformer from './transformers/skoda-page-tables.js';
import pageOffsetTransformer from './transformers/skoda-page-offset.js';
import pageButtonsTransformer from './transformers/skoda-page-buttons.js';
import cleanupTransformer from './transformers/skoda-page-cleanup.js';
import sectionsTransformer from './transformers/skoda-model-sections.js';
import metadataTransformer from './transformers/skoda-metadata.js';
import linksTransformer from './transformers/skoda-links.js';
import nbspTransformer from './transformers/skoda-nbsp.js';

// PARSER REGISTRY
const parsers = {
  'hero-banner': heroBannerParser,
};

// PAGE TEMPLATE CONFIGURATION — embedded from page-templates.json (page-base)
const PAGE_TEMPLATE = {
  name: 'page-base',
  description:
    'Škoda editorial Page base shell. Hero banner -> single-column article body; SiteOrigin body flattened to plain default content (no widget-tree rebuild). Metadata template=page. Content-driven detection only.',
  urls: ['https://www.skoda-storyboard.com/en/brand-group-core-bgc/'],
  // a default, not an override: a CPT page flattened here (press-kit hub) keeps its type
  metadata: { templateDefault: 'page' },
  // a one-cell row's further widgets are sections of their own (skoda-page-rows, SKODA-843)
  splitWidgets: true,
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
      selector: ['article.page, article.post'],
      style: null,
      blocks: [],
      defaultContent: [
        'article.page h1', 'article.page h2', 'article.page h3',
        'article.page p', 'article.page ul', 'article.page ol',
      ],
    },
  ],
};

// TRANSFORMER REGISTRY — the body's sections (before the cleanup drops the layout CSS),
// cleanup + (sections if 2+) + shared metadata (afterTransform).
const transformers = [
  // the body's tables as Table blocks, before the importer reads them as blocks (SKODA-843)
  pageTablesTransformer,
  // the spacer widgets as Spacer blocks (SKODA-843)
  pageOffsetTransformer,
  // the source's pill buttons as secondary buttons (SKODA-843)
  pageButtonsTransformer,
  pageRowsTransformer,
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
  preprocess: ({ document }) => {
    // keep the source's glued non-breaking spaces (html2md would turn them into spaces)
    nbspTransformer('preprocess', document.body, { document });
    // mark the half-width rows while the layout CSS is still there (SKODA-813)
    pageRowsTransformer('preprocess', document.body, { document });
    // keep the blank editor lines the importer would drop, as spacers (SKODA-843)
    pageOffsetTransformer('preprocess', document.body, { document });
  },

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
