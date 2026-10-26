/* eslint-disable */
/* global WebImporter */

/**
 * Import orchestrator: the shared story newsletter card (SKODA-840).
 *
 * Every story sidebar opens with the same `.newsletter-subscribe-widget`. Instead of a copy in
 * each story, it is imported once, from one source story, into the locale's fragment
 * `/{locale}/fragments/newsletter-card`: a single Newsletter Stub (card) table, built by the
 * same skoda-story-aside `newsletter-card` hook the story importer used before (SKODA-823).
 * scripts/story-newsletter.js puts the fragment at the top of every story sidebar at runtime.
 * Run it on one story URL per locale (urls-newsletter-card.txt). Publish the fragment before
 * the stories that lose their own card.
 */

import storyAsideTransformer from './transformers/skoda-story-aside.js';
import nbspTransformer from './transformers/skoda-nbsp.js';
import imagesTransformer from './transformers/skoda-images.js';

const NEWSLETTER_BLOCK = 'Newsletter Stub (card)';

const PAGE_TEMPLATE = {
  name: 'newsletter-card',
  description:
    'Škoda story sidebar newsletter widget → the shared Newsletter Stub (card) fragment (/{locale}/fragments/newsletter-card). One source story per locale; no Metadata (a fragment).',
  urls: ['https://www.skoda-storyboard.com/en/emobility/skoda-epiq-will-win-you-over-in-just-a-few-seconds/'],
  blocks: [],
  sections: [],
};

const isCard = (table) => {
  const cell = table.querySelector('tr > th, tr > td');
  return !!cell && (cell.textContent || '').replace(/\s+/g, ' ').trim() === NEWSLETTER_BLOCK;
};

/** `/cs/…` → `cs`; anything else → `en`. */
function localeOf(url) {
  const first = new URL(url).pathname.split('/')[1] || '';
  return /^[a-z]{2}$/.test(first) ? first : 'en';
}

export default {
  // before helix-importer's preProcess drops the widget's empty inputs (see skoda-story-aside)
  preprocess: ({ document }) => {
    nbspTransformer('preprocess', document.body, { document });
    storyAsideTransformer('newsletter-card', document.body, { document });
  },

  transform: (payload) => {
    const { document, url, params } = payload;
    const card = [...document.querySelectorAll('table')].find(isCard);
    if (!card) throw new Error(`no sidebar newsletter widget on ${params.originalURL}`);

    const main = document.createElement('div');
    main.append(card);
    imagesTransformer('afterTransform', main, payload);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    return [{
      element: main,
      path: `/${localeOf(params.originalURL)}/fragments/newsletter-card`,
      report: { title: 'Newsletter card', template: PAGE_TEMPLATE.name, blocks: [NEWSLETTER_BLOCK] },
    }];
  },
};
