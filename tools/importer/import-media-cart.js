/* eslint-disable */
/* global WebImporter */

/**
 * Import orchestrator: Škoda media cart page (template-media-cart, /en/media-cart/).
 *
 * SKODA-505b. The cart is client-side (the device's SKODA-505a store), so the page is only
 * its shell: a `Style: page-header` section (the source's title band) with the h1 "Your
 * downloads", then an empty `Media Cart` block that blocks/media-cart/media-cart.js renders.
 * Metadata template=page (a utility page,
 * not a rail row); nav/footer/section come from the `/en/media-cart` bulk metadata row
 * (Media Room chrome, as /en/images). Content-driven detection only.
 */

import cleanupTransformer from './transformers/skoda-listing-cleanup.js';
import mediaCartTransformer from './transformers/skoda-media-cart.js';
import metadataTransformer from './transformers/skoda-metadata.js';
import nbspTransformer from './transformers/skoda-nbsp.js';

const PAGE_TEMPLATE = {
  name: 'media-cart',
  description:
    'Škoda media cart page (body.media-cart). Emits a dark h1 section + an empty Media Cart block (blocks/media-cart, SKODA-505b); the cart widget and package history are client-side and not ported. Metadata template=page.',
  urls: ['https://www.skoda-storyboard.com/en/media-cart/'],
  metadata: { template: 'page' },
  blocks: [],
  sections: [],
};

const transformers = [
  cleanupTransformer,
  mediaCartTransformer,
  metadataTransformer,
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
  // keep the source's glued non-breaking spaces (html2md would turn them into spaces)
  preprocess: ({ document }) => nbspTransformer('preprocess', document.body, { document }),

  transform: (payload) => {
    const { document, params } = payload;
    const main = document.body;

    executeTransformers('beforeTransform', main, payload);
    executeTransformers('afterTransform', main, payload);

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
        blocks: ['media-cart'],
      },
    }];
  },
};
