/* eslint-disable */
/* global WebImporter */

/**
 * Import orchestrator (SKODA-843): the Sustainable Offices header nav (/sustainability/nav:
 * topbar with the Sustainability tab --- brand --- search, no menu), from the source page's
 * header (urls-sustainability.txt). The builder lives in locale-chrome.js; the output path is
 * the fragment, not the page path.
 */

import { buildSectionNav } from './locale-chrome.js';

export default {
  transform: ({ document, params }) => {
    const page = new URL(params.originalURL).pathname;
    const element = buildSectionNav(document, page);
    return [{ element, path: '/sustainability/nav', report: { fragment: 'nav', page } }];
  },
};
