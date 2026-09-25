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

import storyHeroParser from './parsers/story-hero.js';
import storyFlattenParser from './parsers/story-flatten.js';
import pageCleanupTransformer from './transformers/skoda-page-cleanup.js';
import storyCleanupTransformer from './transformers/skoda-story-cleanup.js';
import storyAsideTransformer from './transformers/skoda-story-aside.js';
import sectionsTransformer from './transformers/skoda-model-sections.js';
import metadataTransformer from './transformers/skoda-metadata.js';
import normalizeImages from './transformers/skoda-images.js';

const parsers = {
  // SKODA-816: story hero → Hero Image with heading, caption and metadata
  // inside one block, not the overlay Hero banner used by page/archive.
  'story-hero': storyHeroParser,
  'story-flatten': storyFlattenParser,
};

const PAGE_TEMPLATE = {
  name: 'story-detail',
  description:
    'Škoda story detail (single-post + SiteOrigin), full-fidelity SiteOrigin flatten (SKODA-801). Hero banner + primary .content SiteOrigin widget tree flattened to default content + block tables (17-widget map, census-driven). The secondary .sidebar column is rebuilt as a Style:sidebar section (Cards + Tags) beside the body via the grid-on-main story layout. In-body galleries/embeds/Media Box remain SKODA-604 full-restore work. Metadata template=story. Content-driven detection only.',
  urls: ['https://www.skoda-storyboard.com/en/lifestyle/people/the-story-of-olive-oil-from-andalusia-to-the-czech-republic/'],
  blocks: [
    { name: 'story-hero', instances: ['div.hero'] },
    // Flatten the SiteOrigin widget tree inside the primary reading column. The
    // parser self-detects the builder tree and no-ops (linear-story fallback) when
    // absent, so the 3.6% non-Page-Builder stories fall through to default content.
    { name: 'story-flatten', instances: ['.columns > .content', 'article .content', '.entry-content'] },
  ],
  sections: [
    {
      id: 'section-1',
      name: 'Hero',
      selector: ['div.hero'],
      style: null,
      blocks: ['story-hero'],
      defaultContent: [],
    },
    {
      id: 'section-2',
      name: 'Body',
      selector: ['.columns > .content', 'article .content', '.entry-content'],
      // Style: body-column tags the primary reading column so the grid-on-main story
      // layout (styles.css, body.story) places it in the left track and caps the prose
      // measure. skoda-model-sections emits the Section Metadata; the story-scoped
      // runtime hook (scripts.js decorateStorySections) turns it into a class.
      style: 'body-column',
      blocks: ['story-flatten'],
      defaultContent: [
        '.content .entry-content h2', '.content .entry-content h3',
        '.content .entry-content p', '.content .entry-content ul',
        '.content .entry-content ol', '.content .entry-content blockquote',
      ],
    },
    // The aside section is emitted dynamically by skoda-story-aside (Style: sidebar);
    // it inserts its own leading <hr> in afterTransform, so it is not listed here
    // (skoda-model-sections only breaks statically-known section selectors).
  ],
};

// NOTE ordering (unchanged constraint): the `.sidebar` holds `ol.entry-tags`, the tag
// links skoda-metadata.js derives `tags`/facets from. Both storyCleanup and storyAside
// touch the sidebar in afterTransform, so metadata MUST run before them. Transformers
// execute in array order per hook, so metadata is registered before storyCleanup and
// storyAside. storyCleanup now only strips floating social + the in-body media shells
// deferred to SKODA-604 (it no longer drops the sidebar — storyAside rebuilds it).
const transformers = [
  pageCleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
  metadataTransformer,
  storyCleanupTransformer,
  storyAsideTransformer,
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
