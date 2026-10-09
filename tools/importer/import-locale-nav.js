/* eslint-disable */
/* global WebImporter */

/**
 * Import orchestrator (SKODA-303a): the translated header nav (/{locale}/nav, the shape of /nav),
 * from the header / footer of any source page in that locale (urls-locale-chrome.txt).
 * The builder lives in locale-chrome.js; the output path is the locale's fragment, not the
 * page path.
 */

import { localeOfUrl, buildNav } from './locale-chrome.js';

export default {
  transform: ({ document, params }) => {
    const locale = localeOfUrl(params.originalURL);
    const element = buildNav(document, locale);
    return [{ element, path: `/${locale}/nav`, report: { locale, fragment: 'nav' } }];
  },
};
