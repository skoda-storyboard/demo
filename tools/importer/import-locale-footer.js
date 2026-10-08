/* eslint-disable */
/* global WebImporter */

/**
 * Import orchestrator (SKODA-303a): the translated footer (/{locale}/footer, the shape of /footer),
 * from the header / footer of any source page in that locale (urls-locale-chrome.txt).
 * The builder lives in locale-chrome.js; the output path is the locale's fragment, not the
 * page path.
 */

import { localeOfUrl, buildFooter } from './locale-chrome.js';

export default {
  transform: ({ document, params }) => {
    const locale = localeOfUrl(params.originalURL);
    const element = buildFooter(document, locale);
    return [{ element, path: `/${locale}/footer`, report: { locale, fragment: 'footer' } }];
  },
};
