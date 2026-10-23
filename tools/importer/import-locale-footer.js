/* eslint-disable */
/* global WebImporter */

/**
 * Import orchestrator (SKODA-303a): the translated footer (/{locale}/footer, the shape of /footer),
 * from the header / footer of any source page in that locale (urls-locale-chrome.txt).
 * The builder lives in locale-chrome.js; the output path is the locale's fragment, not the
 * page path.
 */

import { localeOfUrl, buildFooter } from './locale-chrome.js';
import linksTransformer from './transformers/skoda-links.js';
// the demo's own thank-you text (the source shows its ESP response), as import-locale-newsletter.js
const MESSAGE = 'Thank you for your interest. Newsletter sign-up will be available soon.';

export default {
  transform: ({ document, params }) => {
    const locale = localeOfUrl(params.originalURL);
    // the Media Room footer's Subscribe form says the demo's own thank-you text, as the topbar panel
    const element = buildFooter(document, locale, { message: MESSAGE });
    // links to demo pages become site-relative, the rest stay on the live site (SKODA-1001)
    linksTransformer('afterTransform', element, { document });
    // a Media Room page's chrome is the locale's Media Room footer (`/cs/media-room/footer`, as
    // `/media-room/footer` for English); the Storyboard side's is `/{locale}/footer` (SKODA-1001)
    const mediaRoom = !!(document.body && document.body.classList.contains('media-room'));
    const path = mediaRoom ? `/${locale}/media-room/footer` : `/${locale}/footer`;
    return [{ element, path, report: { locale, fragment: 'footer', side: mediaRoom ? 'media-room' : 'storyboard' } }];
  },
};
