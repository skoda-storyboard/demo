/* eslint-disable */
/* global WebImporter */

/**
 * Import orchestrator: Škoda company / utility page (template-media-room-page, and the
 * company logo's template-custom-full-width): /en/contacts/, /en/board-of-management/,
 * /en/company-logo/, /en/skoda-media-services-application/.
 *
 * Hero banner + the SiteOrigin body, one `page-body` section per row (skoda-page-rows, the
 * SKODA-813 shell). The people pages' card rows become blocks (skoda-company-people,
 * SKODA-810a): `Contact Directory` (/en/contacts/) and `Exec Bio` with its "show more" photo
 * set (/en/board-of-management/); their spacer widgets become `Spacer` sections. The asset
 * layouts (skoda-company-assets, SKODA-810b): logo tiles → `brand-assets` sections with
 * `Brand Asset` blocks (/en/company-logo/), an app-store body → one `App Promo` block
 * (/en/skoda-media-services-application/). Any other row stays default content. Metadata
 * template=page. Content-driven detection only.
 */

import heroBannerParser from './parsers/hero-banner.js';
import { markBoldHeadings, restoreBoldHeadings } from './parsers/story-flatten.js';
import pageRowsTransformer from './transformers/skoda-page-rows.js';
import companyPeopleTransformer from './transformers/skoda-company-people.js';
import companyAssetsTransformer from './transformers/skoda-company-assets.js';
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
    'Škoda company/utility page (template-media-room-page, custom-full-width). Hero banner + the SiteOrigin body as page-body rows; person-card rows → Contact Directory / Exec Bio, spacer widgets → Spacer (SKODA-810a); logo tiles → Brand Asset, an app-store body → App Promo (SKODA-810b). Metadata template=page. Content-driven detection only.',
  urls: [
    'https://www.skoda-storyboard.com/en/contacts/',
    'https://www.skoda-storyboard.com/en/board-of-management/',
    'https://www.skoda-storyboard.com/en/company-logo/',
    'https://www.skoda-storyboard.com/en/skoda-media-services-application/',
  ],
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
  companyAssetsTransformer,
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

// The Media Room chrome (SKODA-309: nav, footer, the Media Room tab) as page metadata, for a
// source page on the Media Room template (`body.media-room`, marked in preprocess: the body's
// classes are gone by the transform). The bulk metadata rows cover /en/contacts only; page
// metadata wins over them and carries the same values (SKODA-810).
const MEDIA_ROOM_CHROME = [['nav', '/media-room/nav'], ['footer', '/media-room/footer'], ['section', 'media-room']];
const MEDIA_ROOM_ATTR = 'data-skoda-media-room';

function addMediaRoomChrome(main, document) {
  if (!document.documentElement.hasAttribute(MEDIA_ROOM_ATTR)) return;
  const table = [...main.querySelectorAll('table')]
    .find((t) => t.rows[0]?.cells[0]?.textContent.trim().toLowerCase() === 'metadata');
  if (!table) return;
  const has = (key) => [...table.rows].some((r) => r.cells[0]?.textContent.trim().toLowerCase() === key);
  const body = table.tBodies[0] || table;
  MEDIA_ROOM_CHROME.filter(([key]) => !has(key)).forEach(([key, value]) => {
    const tr = body.insertRow();
    tr.insertCell().textContent = key;
    tr.insertCell().textContent = value;
  });
}

export default {
  // keep the source's glued non-breaking spaces (html2md would turn them into spaces)
  preprocess: ({ document }) => {
    nbspTransformer('preprocess', document.body, { document });
    // mark the half-width rows while the layout CSS is still there (SKODA-813)
    pageRowsTransformer('preprocess', document.body, { document });
    // keep a person's trailing blank line (`<br>&nbsp;`) before html2md drops it (SKODA-810a)
    companyPeopleTransformer('preprocess', document.body, { document });
    // the logo page's framed row, while the layout CSS is there (SKODA-810b)
    companyAssetsTransformer('preprocess', document.body, { document });
    // a Media Room template page gets the Media Room chrome (SKODA-810)
    if (document.body.classList.contains('media-room')) document.documentElement.setAttribute(MEDIA_ROOM_ATTR, '');
    // wholly bold headings (the logo page's `<h3><strong>`): helix strips their <strong>
    // before the transform, which puts it back (story-flatten, #296)
    markBoldHeadings(document.body);
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
    restoreBoldHeadings(main);
    addMediaRoomChrome(main, document);

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
