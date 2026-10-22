/* eslint-disable */
/* global WebImporter */

/**
 * Import orchestrator (SKODA-303a): the translated header nav (/{locale}/nav, the shape of /nav),
 * from the header / footer of any source page in that locale (urls-locale-chrome.txt).
 * The builder lives in locale-chrome.js; the output path is the locale's fragment, not the
 * page path.
 */

import { localeOfUrl, buildNav } from './locale-chrome.js';
import linksTransformer from './transformers/skoda-links.js';

export default {
  transform: ({ document, params }) => {
    const locale = localeOfUrl(params.originalURL);
    const element = buildNav(document, locale);
    // links to demo pages become site-relative, the rest stay on the live site (SKODA-1001)
    linksTransformer('afterTransform', element, { document });
    // a Media Room page's chrome is the locale's Media Room nav (`/cs/media-room/nav`, as
    // `/media-room/nav` for English); the Storyboard side's is `/{locale}/nav` (SKODA-1001)
    const mediaRoom = !!(document.body && document.body.classList.contains('media-room'));
    const path = mediaRoom ? `/${locale}/media-room/nav` : `/${locale}/nav`;
    return [{ element, path, report: { locale, fragment: 'nav', side: mediaRoom ? 'media-room' : 'storyboard' } }];
  },
};
