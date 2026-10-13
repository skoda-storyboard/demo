/* eslint-disable */
/* global WebImporter */

/**
 * Import orchestrator: Škoda Media Room home (template-media-room, /en/media-room/).
 *
 * Featured promo-box (curated cards) + index-driven Story Rails (News / Images /
 * Videos / Models / Press Kits / Latest Stories), each self-classified by home-rail
 * from its heading + "All" link / type-<cpt> class. Every source `.cover-box` band
 * becomes its own section (skoda-dark-bands): the dark Models + Press Kits band
 * `Style: cover-box, dark, compact` (SKODA-218), each light band `Style: cover-box, compact`,
 * as on the Storyboard home (SKODA-611a), so its rails get the home-band layout. The
 * Models band keeps the source's hand-picked base models, in its order (home-rail).
 * Metadata template=page (body class carries `page`; MR side selects
 * chrome at runtime). Content-driven detection.
 */

import promoBoxParser from './parsers/promo-box.js';
import homeRailParser from './parsers/home-rail.js';
import cleanupTransformer from './transformers/skoda-page-cleanup.js';
import darkBandsTransformer from './transformers/skoda-dark-bands.js';
import sectionsTransformer from './transformers/skoda-model-sections.js';
import metadataTransformer from './transformers/skoda-metadata.js';
import linksTransformer from './transformers/skoda-links.js';
import nbspTransformer from './transformers/skoda-nbsp.js';

const parsers = {
  'promo-box': promoBoxParser,
  'home-rail': homeRailParser,
};

const PAGE_TEMPLATE = {
  name: 'home-mr',
  description:
    'Škoda Media Room home (template-media-room). Curated promo-box cards + index-driven Story Rails (News/Images/Videos/Models/Press Kits/Latest Stories) via home-rail. Metadata template=page. Content-driven detection only.',
  urls: ['https://www.skoda-storyboard.com/en/media-room/'],
  metadata: { template: 'page' },
  // skoda-dark-bands: the MR home's bands sit 16px tighter at the top (live, SKODA-218)
  darkBandStyle: 'cover-box, dark, compact',
  // every light .cover-box is its own section too, as on the Storyboard home (SKODA-611a);
  // `compact`: its rails end 60px above the band end, not 28px (live, measured 375–1440)
  lightBandStyle: 'cover-box, compact',
  blocks: [
    { name: 'promo-box', instances: ['section.promo-box'] },
    { name: 'home-rail', instances: ['.cover-box .search-results[class*="type-"]'] },
  ],
  sections: [],
};

const transformers = [
  cleanupTransformer,
  darkBandsTransformer,
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
          // the Models band keeps the source's hand-picked order on this home too (home-rail);
          // the promo shows the newest three press releases from the index, with their dates
          parser(block.element, {
            document,
            url,
            params,
            orderModels: true,
            indexDriven: block.name === 'promo-box',
            promoTemplate: 'press_release',
          });
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
