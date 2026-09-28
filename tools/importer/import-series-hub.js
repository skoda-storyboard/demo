/* eslint-disable */
/* global WebImporter */

/**
 * Import orchestrator: Škoda Series hub (single-skoda_series, /en/series/<slug>/).
 *
 * SKODA-207: `Hero Image (overlay)` (SERIES badge, H1, standfirst; series-hero.js) +
 * the authored tile mosaic as `Cards (overlay, tiles)`, contract cards-tiles v2
 * (series-grid.js: every source tile in DOM order, size token per tile, mixed
 * Story / Press Kits kept; no index, tags or sort). Metadata template=skoda_series
 * (derived from the single-skoda_series body class). Content-driven detection only.
 */

import seriesHeroParser from './parsers/series-hero.js';
import seriesGridParser from './parsers/series-grid.js';
import cleanupTransformer from './transformers/skoda-page-cleanup.js';
import sectionsTransformer from './transformers/skoda-model-sections.js';
import metadataTransformer from './transformers/skoda-metadata.js';
import linksTransformer from './transformers/skoda-links.js';
import normalizeImages from './transformers/skoda-images.js';

const parsers = {
  'series-hero': seriesHeroParser,
  'series-grid': seriesGridParser,
};

const PAGE_TEMPLATE = {
  name: 'series-hub',
  description:
    'Škoda Series hub (single-skoda_series). Hero Image (overlay) with SERIES badge, H1 and standfirst + the authored tile mosaic as Cards (overlay, tiles), cards-tiles v2: one row per source tile in DOM order, size token from the SiteOrigin row share + ratio, `end` on short rows. Metadata template=skoda_series (from body class). Content-driven detection only.',
  urls: [
    'https://www.skoda-storyboard.com/en/series/125-years-of-motorsport/',
    'https://www.skoda-storyboard.com/en/series/130-years/',
    'https://www.skoda-storyboard.com/en/series/roads-places/',
    'https://www.skoda-storyboard.com/en/series/unexpected-jobs/',
    'https://www.skoda-storyboard.com/en/series/minutes-from-car-production/',
    'https://www.skoda-storyboard.com/en/series/road-trip/',
    'https://www.skoda-storyboard.com/en/series/winter-tips/',
    'https://www.skoda-storyboard.com/en/series/back-to-the-past/',
    'https://www.skoda-storyboard.com/en/series/unknown-parts/',
    'https://www.skoda-storyboard.com/en/series/hidden-helpers/',
    'https://www.skoda-storyboard.com/en/series/czech-footprint/',
    'https://www.skoda-storyboard.com/en/series/sustainable-mobility/',
    'https://www.skoda-storyboard.com/en/series/my-life-my-car/',
    'https://www.skoda-storyboard.com/en/series/evolution-of-parts/',
    'https://www.skoda-storyboard.com/en/series/60-seconds-walkaround/',
  ],
  blocks: [
    { name: 'series-hero', instances: ['div.hero'] },
    { name: 'series-grid', instances: ['.panel-layout'] },
  ],
  sections: [
    {
      id: 'section-1',
      name: 'Hero',
      selector: ['div.hero'],
      style: null,
      blocks: ['series-hero'],
      defaultContent: [],
    },
    {
      id: 'section-2',
      name: 'Stories',
      selector: ['.panel-layout'],
      style: null,
      blocks: ['series-grid'],
      defaultContent: [],
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
