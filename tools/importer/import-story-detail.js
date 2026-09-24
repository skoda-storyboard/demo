/* eslint-disable */
/* global WebImporter */

/**
 * Import orchestrator: Škoda story detail (single-post + SiteOrigin), linear flatten.
 *
 * FLATTEN-TO-DEFAULT (Phase-A pass): hero banner + the primary column `.content`
 * rich text flattened to default content. The SiteOrigin widget tree is NOT
 * reconstructed and in-body galleries / embeds / Media Box are intentionally left
 * out (deferred to SKODA-801 body flatten + SKODA-814 region contract + SKODA-604
 * full article assembly). The 3.6% already-linear stories import cleanly; Page-Builder
 * stories degrade to readable default content (not empty). Metadata template=story.
 * Content-driven detection only.
 *
 * Uses skoda-story-cleanup (drops .sidebar + floating social) on top of the shared
 * skoda-page-cleanup.
 */

import heroBannerParser from './parsers/hero-banner.js';
import pageCleanupTransformer from './transformers/skoda-page-cleanup.js';
import storyCleanupTransformer from './transformers/skoda-story-cleanup.js';
import sectionsTransformer from './transformers/skoda-model-sections.js';
import metadataTransformer from './transformers/skoda-metadata.js';

const parsers = {
  'hero-banner': heroBannerParser,
};

const PAGE_TEMPLATE = {
  name: 'story-detail',
  description:
    'Škoda story detail (single-post + SiteOrigin), linear flatten. Hero banner + primary .content flattened to default content. In-body galleries/embeds/Media Box deferred to SKODA-801/814/604. Metadata template=story. Content-driven detection only.',
  urls: ['https://www.skoda-storyboard.com/en/lifestyle/people/the-story-of-olive-oil-from-andalusia-to-the-czech-republic/'],
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
      selector: ['.columns > .content', 'article .content', '.entry-content'],
      style: null,
      blocks: [],
      defaultContent: [
        '.content .entry-content h2', '.content .entry-content h3',
        '.content .entry-content p', '.content .entry-content ul',
        '.content .entry-content ol', '.content .entry-content blockquote',
      ],
    },
  ],
};

// NOTE ordering: storyCleanupTransformer removes `.sidebar` in afterTransform, but
// the sidebar holds the entry-tags the metadata transformer reads — so metadata MUST
// run before it. Transformers execute in array order per hook, so storyCleanup is
// registered LAST (its afterTransform sidebar-drop runs after metadata's). Its
// beforeTransform (floating social) still runs early enough.
const transformers = [
  pageCleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
  metadataTransformer,
  storyCleanupTransformer,
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
