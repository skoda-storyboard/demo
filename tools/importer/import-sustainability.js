/* eslint-disable */
/* global WebImporter */

/**
 * Import orchestrator: the Sustainable Offices page (`page-template-template-sustainability`,
 * /en/sustainable-offices/, SKODA-843). Its SiteOrigin rows are rebuilt as sections, Columns
 * blocks and default content (transformers/skoda-sustainability.js); `theme: sustainability`
 * loads its layout (templates/sustainability). One template = one import script.
 */

// TRANSFORMER IMPORTS
import sustainabilityTransformer from './transformers/skoda-sustainability.js';
import cleanupTransformer from './transformers/skoda-page-cleanup.js';
import metadataTransformer from './transformers/skoda-metadata.js';
import linksTransformer from './transformers/skoda-links.js';
import nbspTransformer from './transformers/skoda-nbsp.js';

// PAGE TEMPLATE CONFIGURATION
const PAGE_TEMPLATE = {
  name: 'sustainability',
  description:
    'Škoda Sustainable Offices page. SiteOrigin rows -> header section, intro, a section per theme (Columns image-card rows, the info-blocks band), the event section. Metadata template=page, theme=sustainability.',
  urls: ['https://www.skoda-storyboard.com/en/sustainable-offices/'],
  // its own chrome: the Sustainability tab, no menu, no sitemap (import-sustainability-nav/-footer)
  metadata: {
    templateDefault: 'page', theme: 'sustainability', nav: '/sustainability/nav', footer: '/sustainability/footer',
  },
  blocks: [],
  sections: [],
};

const transformers = [
  sustainabilityTransformer,
  cleanupTransformer,
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

export default {
  preprocess: ({ document }) => {
    // keep the source's glued non-breaking spaces (html2md would turn them into spaces)
    nbspTransformer('preprocess', document.body, { document });
    // the film's icon-only cart download link (its MP4 master) would be stripped as an empty
    // inline element before transform: give it text, as the press-kit import (SKODA-805b)
    document.querySelectorAll('.panel-layout a.media-cart-action.download[href], .panel-layout a[data-action="download"][href]')
      .forEach((a) => { if (!a.textContent.trim()) a.textContent = 'Download'; });
  },

  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    executeTransformers('beforeTransform', main, payload);
    executeTransformers('afterTransform', main, payload);

    // skoda-metadata.js emitted the Metadata block (no WebImporter.rules.createMetadata)
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
        blocks: ['columns'],
      },
    }];
  },
};
