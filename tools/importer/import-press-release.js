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
 *   beforeTransform (cleanup, then skoda-press-release-layout rebuilds the article
 *   into the five sections of the press-release template, SKODA-607)
 *     → block parsers (gallery / tags / downloads / quote) replace matched fragments
 *       → afterTransform (Section Metadata + Gallery (preview) anchored to the layout
 *         markers, then the shared Metadata and link rewriting)
 *         → WebImporter built-in rules (background images / image URLs)
 */

// PARSER IMPORTS
import galleryParser from './parsers/gallery.js';
import tagsParser from './parsers/tags.js';
import downloadsParser from './parsers/downloads.js';
import quoteParser, { markQuotes } from './parsers/quote.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/skoda-press-release-cleanup.js';
import layoutTransformer from './transformers/skoda-press-release-layout.js';
import metadataTransformer from './transformers/skoda-metadata.js';
import linksTransformer from './transformers/skoda-links.js';
import normalizeImages from './transformers/skoda-images.js';

// PARSER REGISTRY
const parsers = {
  gallery: galleryParser,
  tags: tagsParser,
  downloads: downloadsParser,
  quote: quoteParser,
};

// PAGE TEMPLATE CONFIGURATION — embedded from page-templates.json (press-release)
const PAGE_TEMPLATE = {
  name: 'press-release',
  description:
    'Škoda press release detail (press_release CPT), SKODA-607. No hero: header (date + title) -> body-column (lead image, bullets, perex, Buzzsprout, body, Vimeo) -> sidebar (Additional info, Gallery (preview), Tags) -> dark Media Box band (Downloads) -> optional dark Related Press Releases band (Story Rail (press)). Sections are built by skoda-press-release-layout. Content-driven detection only.',
  urls: [
    'https://www.skoda-storyboard.com/en/press-releases/skoda-superb-25-years-of-comfort-space-and-technical-excellence/',
  ],
  blocks: [
    { name: 'gallery', instances: ['section.images.sa-media-kit-preview'] },
    { name: 'tags', instances: ['section.tags'] },
    { name: 'downloads', instances: ['.search-results.media-box'] },
    // Pull-quotes (SKODA-220): marked in `preprocess`, while their decorative <hr> exists.
    { name: 'quote', instances: ['article p[data-skoda-quote]'] },
  ],
  // Documentation of the emitted section model; skoda-press-release-layout builds it.
  sections: [
    { id: 'header', name: 'Header', style: null, defaultContent: ['header .entry-published', 'header .entry-title'] },
    {
      id: 'body',
      name: 'Body column',
      style: 'body-column',
      defaultContent: ['.column-primary .article-teaser img', '.column-primary .bullet-points', '.column-primary .entry-summary', '.column-primary .entry-content'],
    },
    { id: 'sidebar', name: 'Sidebar', style: 'sidebar', blocks: ['gallery', 'tags'], defaultContent: ['.column-secondary section > .menu'] },
    { id: 'media-box', name: 'Media Box', style: 'dark, full-width, media-box', blocks: ['downloads'], defaultContent: ['.search-results-heading', '.search-results-stats .stats'] },
    { id: 'related', name: 'Related Press Releases', style: 'dark, full-width, related', blocks: ['story-rail'], defaultContent: ['.search-results.type-press_release .search-results-header'] },
  ],
};

// TRANSFORMER REGISTRY — cleanup + layout (sections) + shared metadata + links (last).
const transformers = [
  cleanupTransformer,
  layoutTransformer,
  metadataTransformer,
  linksTransformer,
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
  /**
   * Runs on the untouched DOM, before helix-importer's preProcess drops every empty
   * inline element. The Media Box's single download links (video MP4, PDF) are icon-only
   * `<a><i class="icon"></i></a>`, so they'd vanish before the downloads parser runs;
   * give them a text label so they survive (the parser labels them by file type).
   * preProcess also drops every <hr>, so the pull-quotes are marked by their rule here.
   */
  preprocess: ({ document }) => {
    document.querySelectorAll('.search-results.media-box a.media-cart-action.download[href]').forEach((a) => {
      if (!(a.textContent || '').trim()) a.textContent = 'Download';
    });
    document.querySelectorAll('article.press_release .entry-content').forEach(markQuotes);
  },

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
    normalizeImages(main, document);
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
