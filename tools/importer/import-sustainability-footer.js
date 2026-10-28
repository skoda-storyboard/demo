/* eslint-disable */
/* global WebImporter */

/**
 * Import orchestrator (SKODA-843): the Sustainable Offices footer (/sustainability/footer: app
 * badges + social icons --- notice, ©, feeds; the source has no sitemap there), from the source
 * page's footer (urls-sustainability.txt). The builder lives in locale-chrome.js.
 */

import { buildFooter } from './locale-chrome.js';

export default {
  transform: ({ document }) => {
    const element = buildFooter(document);
    return [{ element, path: '/sustainability/footer', report: { fragment: 'footer' } }];
  },
};
