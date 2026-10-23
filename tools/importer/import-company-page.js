/* eslint-disable */
/* global WebImporter */

/**
 * Import orchestrator: Škoda company / utility page (template-media-room-page).
 * e.g. /en/contacts/, /en/board-of-management/, /en/annual-reports/.
 *
 * Hero banner + the SiteOrigin body, one `page-body` section per row (skoda-page-rows, the
 * SKODA-813 shell). The people pages' card rows become blocks (skoda-company-people,
 * SKODA-810a): `Contact Directory` (/en/contacts/) and `Exec Bio` with its "show more" photo
 * set (/en/board-of-management/); their spacer widgets become `Spacer` sections. Any other
 * row stays default content. Metadata template=page. Content-driven detection only.
 */

import heroBannerParser from './parsers/hero-banner.js';
import pageRowsTransformer from './transformers/skoda-page-rows.js';
import companyPeopleTransformer from './transformers/skoda-company-people.js';
import cleanupTransformer from './transformers/skoda-page-cleanup.js';
import sectionsTransformer from './transformers/skoda-model-sections.js';
import metadataTransformer from './transformers/skoda-metadata.js';
import linksTransformer from './transformers/skoda-links.js';
import nbspTransformer from './transformers/skoda-nbsp.js';

const parsers = {
  'hero-banner': heroBannerParser,
};

const PAGE_TEMPLATE = {
  name: 'company-page',
  description:
    'Škoda company/utility page (template-media-room-page). Hero banner + the SiteOrigin body as page-body rows; person-card rows → Contact Directory / Exec Bio, spacer widgets → Spacer (SKODA-810a). Metadata template=page. Content-driven detection only.',
  urls: ['https://www.skoda-storyboard.com/en/contacts/', 'https://www.skoda-storyboard.com/en/board-of-management/'],
  metadata: { template: 'page' },
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
      selector: ['article .entry-content', '.entry-content'],
      style: null,
      blocks: [],
      defaultContent: [
        '.entry-content h1', '.entry-content h2', '.entry-content h3',
        '.entry-content p', '.entry-content ul', '.entry-content ol',
      ],
    },
  ],
};

// the body's sections (before the cleanup drops the layout CSS), then the people rows (before
// the cleanup drops their toggle and spacer widgets)
const transformers = [
  pageRowsTransformer,
  companyPeopleTransformer,
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
  // keep the source's glued non-breaking spaces (html2md would turn them into spaces)
  preprocess: ({ document }) => {
    nbspTransformer('preprocess', document.body, { document });
    // mark the half-width rows while the layout CSS is still there (SKODA-813)
    pageRowsTransformer('preprocess', document.body, { document });
    // keep a person's trailing blank line (`<br>&nbsp;`) before html2md drops it (SKODA-810a)
    companyPeopleTransformer('preprocess', document.body, { document });
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
