/* eslint-disable */
/* global WebImporter */

/**
 * Import orchestrator (SKODA-843): the Sustainable Offices header nav (/sustainability/nav:
 * topbar with the Sustainability tab --- brand --- search, no menu), from the source page's
 * header (urls-sustainability.txt). The builder lives in locale-chrome.js; the output path is
 * the fragment, not the page path.
 */

import { buildSectionNav } from './locale-chrome.js';
import linksTransformer from './transformers/skoda-links.js';

export default {
  transform: ({ document, params }) => {
    const page = new URL(params.originalURL).pathname;
    const element = buildSectionNav(document, page);
    // links to demo pages become site-relative, the rest stay on the live site (SKODA-1001),
    // as the locale chrome importers
    linksTransformer('afterTransform', element, { document });
    return [{ element, path: '/sustainability/nav', report: { fragment: 'nav', page } }];
  },
};
