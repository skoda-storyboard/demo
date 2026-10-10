/* eslint-disable */
/* global WebImporter */

/**
 * Import orchestrator: Škoda category/tag ARCHIVE listing (body.archive).
 *
 * Term hero (`Hero Image (archive)`: banner + h1 from the source labels, SKODA-828) + an index-driven
 * Stories grid (tag / path scope derived from the page canonical URL). Distinct from
 * pr-listing (which has the facet engine). Serves both /en/category/<x>/ and
 * /en/tag/model/<x>/ — same DOM shape. One template = one import script.
 * Content-driven detection only.
 */

// PARSER IMPORTS
import archiveHeroParser from './parsers/archive-hero.js';
import archiveListParser from './parsers/archive-list.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/skoda-page-cleanup.js';
import sectionsTransformer from './transformers/skoda-model-sections.js';
import metadataTransformer from './transformers/skoda-metadata.js';
import linksTransformer from './transformers/skoda-links.js';
import nbspTransformer from './transformers/skoda-nbsp.js';

// PARSER REGISTRY
const parsers = {
  'archive-hero': archiveHeroParser,
  'archive-list': archiveListParser,
};

// PAGE TEMPLATE CONFIGURATION — embedded from page-templates.json (category-archive)
const PAGE_TEMPLATE = {
  name: 'category-archive',
  description:
    'Škoda category/tag archive listing. Term hero (banner + h1, default content) -> index-driven Stories grid (tag or path scope from the canonical URL). Metadata template=page. Content-driven detection only.',
  urls: [
    'https://www.skoda-storyboard.com/en/category/emobility/',
    'https://www.skoda-storyboard.com/en/tag/model/elroq/',
  ],
  metadata: { template: 'page' },
  blocks: [
    { name: 'archive-hero', instances: ['div.hero'] },
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
      blocks: ['archive-hero'],
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

// SKODA-839: the Storyboard home's Models rail cards are the model tag pages (#272), and the
// card image is the index `image`. The source card shows the model's featured image (the
// header banner), which the tag page itself doesn't carry and the source gives no og:image
// for. Masters of the source home card renditions (/en/, measured 2026-10-10).
const MODEL_CARD_IMAGES = {
  elroq: 'https://cdn.skoda-storyboard.com/2024/10/elroq_header_fede6794.jpg',
  kodiaq: 'https://cdn.skoda-storyboard.com/2023/11/Skoda_Kodiaq_header_04479753.png',
  enyaq: 'https://cdn.skoda-storyboard.com/2025/01/enyaq_fl_header_eb9109f9.jpg',
  karoq: 'https://cdn.skoda-storyboard.com/2017/07/33_SKODA_KAROQ.jpg',
  kamiq: 'https://cdn.skoda-storyboard.com/2023/09/kamiq-header_d6fedb2b.jpg',
  scala: 'https://cdn.skoda-storyboard.com/2023/09/scala_header_34ad5f38.jpg',
  fabia: 'https://cdn.skoda-storyboard.com/2021/05/Header_New_FABIA.jpg',
  superb: 'https://cdn.skoda-storyboard.com/2023/12/header_superb_d05c278a.jpg',
  octavia: 'https://cdn.skoda-storyboard.com/2024/03/octaviaFL-header_e0f394a0.jpg',
  epiq: 'https://cdn.skoda-storyboard.com/2026/05/skoda-epiq-m70-01_1135a598.jpg',
  peaq: 'https://cdn.skoda-storyboard.com/2026/06/Navrh-bez-nazvu-21_ec34da00.png',
};

// The page template for one URL: a model tag page gets its model's card image as the page
// image; every other archive keeps the shared template unchanged.
function templateFor(originalURL) {
  const slug = (new URL(originalURL).pathname.match(/^\/en\/tag\/model\/([^/]+)\/?$/) || [])[1];
  const image = slug && MODEL_CARD_IMAGES[slug];
  if (!image) return PAGE_TEMPLATE;
  return { ...PAGE_TEMPLATE, metadata: { ...PAGE_TEMPLATE.metadata, image } };
}

// TRANSFORMER REGISTRY — cleanup + (sections if 2+) + shared metadata (afterTransform).
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
  metadataTransformer,
  linksTransformer,
];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: templateFor(payload.params.originalURL) };
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
