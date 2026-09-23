/* eslint-disable */
/* global WebImporter */

/**
 * Import orchestrator: Škoda press-release detail (press_release CPT).
 *
 * Orchestrates the content-driven parsers + page transformers for the
 * `press-release` template (tools/importer/page-templates.json). One template =
 * one import script. Detection is content-driven only — blocks are located by the
 * template's DOM selectors, never by URL/position.
 *
 * Pipeline per page:
 *   beforeTransform (cleanup + section <hr> breaks)
 *     → block parsers (gallery / tags / downloads) replace matched fragments
 *       → afterTransform (Section Metadata anchored to markers + shared Metadata)
 *         → WebImporter built-in rules (metadata / background images / image URLs)
 */

// PARSER IMPORTS
import galleryParser from './parsers/gallery.js';
import tagsParser from './parsers/tags.js';
import downloadsParser from './parsers/downloads.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/skoda-press-release-cleanup.js';
import sectionsTransformer from './transformers/skoda-model-sections.js';
import metadataTransformer from './transformers/skoda-metadata.js';

// PARSER REGISTRY
const parsers = {
  gallery: galleryParser,
  tags: tagsParser,
  downloads: downloadsParser,
};

// PAGE TEMPLATE CONFIGURATION — embedded from page-templates.json (press-release)
const PAGE_TEMPLATE = {
  name: 'press-release',
  description:
    'Škoda press release detail (press_release CPT). No hero: header (date + title) -> primary column default content -> Gallery -> Tags -> full-bleed dark Media Box parsed as Downloads. AI-audio embed + widgets removed by cleanup. Content-driven detection only.',
  urls: [
    'https://www.skoda-storyboard.com/en/press-releases/skoda-superb-25-years-of-comfort-space-and-technical-excellence/',
  ],
  blocks: [
    { name: 'gallery', instances: ['section.images.sa-media-kit-preview'] },
    { name: 'tags', instances: ['section.tags'] },
    {
      name: 'downloads',
      instances: ['.cover-box.dark .search-results.media-box, .search-results.media-box'],
    },
  ],
  sections: [
    {
      id: 'section-1',
      name: 'Article',
      selector: ['article.press_release > .container, article.press_release'],
      style: null,
      blocks: ['gallery', 'tags'],
      defaultContent: [
        'header .entry-published',
        'header .entry-title',
        '.column-primary .article-teaser',
        '.column-primary .bullet-points',
        '.column-primary .entry-summary',
        '.column-primary .entry-content',
      ],
    },
    {
      id: 'section-2',
      name: 'Related Media',
      selector: ['.cover-box.dark'],
      style: 'dark, full-width',
      blocks: ['downloads'],
      defaultContent: [],
    },
  ],
};

// TRANSFORMER REGISTRY — cleanup + (sections if 2+) + shared metadata (afterTransform).
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
  metadataTransformer,
];

/**
 * Execute all page transformers for a hook, injecting the template so section /
 * metadata transformers can read PAGE_TEMPLATE.sections and .metadata.
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

/** Find all block instances on the page from the embedded template selectors. */
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

    // 1. beforeTransform — cleanup chrome + insert section <hr> breaks.
    executeTransformers('beforeTransform', main, payload);

    // 2. Discover blocks via template selectors (content-driven).
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block; skip any already detached by an earlier parser.
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

    // 4. afterTransform — Section Metadata (anchored to markers) + shared Metadata.
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules.
    // NOTE: do NOT call WebImporter.rules.createMetadata — the shared
    // skoda-metadata.js transformer (run in afterTransform above) already emits the
    // canonical, query-index-shaped Metadata block (template/category/publisheddate/
    // tags + facets). The built-in only produces a thinner Title/Description/Image
    // duplicate, so calling it here would append a second, competing Metadata table.
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized output path (map root '/' → '/index' to avoid the cwd crash).
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
