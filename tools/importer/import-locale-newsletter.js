/* eslint-disable */
/* global WebImporter */

/**
 * Import orchestrator (SKODA-303a): the translated Subscribe panel (/{locale}/nav-newsletter, the shape of /nav-newsletter),
 * from the header / footer of any source page in that locale (urls-locale-chrome.txt).
 * The builder lives in locale-chrome.js; the output path is the locale's fragment, not the
 * page path.
 */

import { localeOfUrl, buildNewsletter } from './locale-chrome.js';

// the panel's thank-you text is the demo's own (the source shows its ESP response): kept in
// English until a translation is supplied (SKODA-303a known gap)
const MESSAGE = 'Thank you for your interest. Newsletter sign-up will be available soon.';

export default {
  transform: ({ document, params }) => {
    const locale = localeOfUrl(params.originalURL);
    const element = buildNewsletter(document, locale, { message: MESSAGE });
    return [{ element, path: `/${locale}/nav-newsletter`, report: { locale, fragment: 'nav-newsletter' } }];
  },
};
