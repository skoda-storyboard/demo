/* eslint-disable */
/* global WebImporter */

/**
 * Import orchestrator: Škoda branded 404 (error404, SKODA-706).
 *
 * The source 404 serves one of its `template-404` pages at random. Each of them is also a
 * stable page (`/en/youve-reached-a-dead-end/`, `/en/welcome-to-our-remote-car-park/`), so
 * the importer runs on those and writes one fragment per variant,
 * `/{locale}/fragments/404/<slug>`, that the site-root 404.html loads at random
 * (templates/error-404).
 *
 * A variant page holds its message twice: `.message-desktop` (h1, from 720px) and
 * `.message-mobile` (h3), each on a full-bleed photo set in a SiteOrigin <style> rule. One
 * section is written: the desktop photo, the mobile photo, the message (desktop copy) and
 * Section Metadata `Style: not-found` (+ `not-found-white` when the message is white; the global
 * `light` section style is a grey band). Škodapedia
 * `term-explain` tooltips are unwrapped to their text (SKODA-206). No Metadata (a fragment).
 * Content-driven detection only.
 */

import nbspTransformer from './transformers/skoda-nbsp.js';
import linksTransformer from './transformers/skoda-links.js';

const PAGE_TEMPLATE = {
  name: 'error-404',
  description:
    'Škoda branded 404 (error404). Each source template-404 variant page → the fragment /{locale}/fragments/404/<slug>: desktop + mobile photo, the .error-message copy (h1, homepage link), Section Metadata Style not-found (+ not-found-white). The site-root 404.html loads one at random (templates/error-404). Content-driven detection only.',
  urls: [
    'https://www.skoda-storyboard.com/en/youve-reached-a-dead-end/',
    'https://www.skoda-storyboard.com/en/welcome-to-our-remote-car-park/',
  ],
  blocks: [],
  sections: [],
};

const BG_ATTR = 'data-not-found-photo';
const WHITE = /color\s*:\s*(?:#fff(?:fff)?\b|white\b|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\))/i;

/**
 * The SiteOrigin row photos live in <style> rules (`#pg-<id>> .panel-row-style {
 * background-image:url(…) }`), which the importer drops before transform: copy each one onto
 * its row first.
 */
function markPhotos(document) {
  const css = [...document.querySelectorAll('style')].map((s) => s.textContent).join('\n');
  document.querySelectorAll('.message-desktop, .message-mobile').forEach((row) => {
    const id = row.parentElement?.id;
    const rule = id && css.split('}').find((r) => r.includes(`#${id}`) && /background-image/.test(r));
    const url = rule && (rule.match(/background-image\s*:\s*url\(\s*["']?([^"')]+)/) || [])[1];
    if (url) row.setAttribute(BG_ATTR, url.trim());
  });
}

/** `/cs/…` → `cs`; anything else → `en`. */
function localeOf(url) {
  const first = new URL(url).pathname.split('/')[1] || '';
  return /^[a-z]{2}$/.test(first) ? first : 'en';
}

function slugOf(url) {
  return new URL(url).pathname.replace(/\/$/, '').split('/').pop();
}

function photo(row, document) {
  const src = row?.getAttribute(BG_ATTR);
  if (!src) return null;
  const p = document.createElement('p');
  const img = document.createElement('img');
  img.src = src;
  img.alt = '';
  p.append(img);
  return p;
}

/** The message as default content: the label, the heading (h1), the copy and the link. */
function message(source, document) {
  const out = [];
  [...source.children].forEach((child) => {
    child.querySelectorAll('.term-explain').forEach((term) => term.replaceWith(...term.childNodes));
    const text = (child.textContent || '').trim();
    if (!text) return;
    if (/^H[1-6]$/.test(child.tagName)) {
      const h1 = document.createElement('h1');
      h1.append(...child.childNodes);
      out.push(h1);
    } else if (child.tagName === 'P') {
      out.push(child);
    } else {
      // the "404" label (div.subheading)
      const p = document.createElement('p');
      p.textContent = text;
      out.push(p);
    }
  });
  return out;
}

export default {
  preprocess: ({ document }) => {
    // keep the source's glued non-breaking spaces (html2md would turn them into spaces)
    nbspTransformer('preprocess', document.body, { document });
    markPhotos(document);
  },

  transform: (payload) => {
    const { document, url, params } = payload;
    const desktop = document.querySelector('.message-desktop');
    const mobile = document.querySelector('.message-mobile');
    const source = (desktop || mobile)?.querySelector('.error-message');
    if (!source) throw new Error(`no .error-message on ${params.originalURL}`);

    const white = WHITE.test(source.getAttribute('style') || '');
    const main = document.createElement('div');
    [photo(desktop, document), photo(mobile, document)].filter(Boolean).forEach((p) => main.append(p));
    main.append(...message(source, document));
    main.append(WebImporter.DOMUtils.createTable([
      ['Section Metadata'],
      ['Style', white ? 'not-found, not-found-white' : 'not-found'],
    ], document));

    linksTransformer('afterTransform', main, { ...payload, template: PAGE_TEMPLATE });
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    return [{
      element: main,
      path: `/${localeOf(params.originalURL)}/fragments/404/${slugOf(params.originalURL)}`,
      report: {
        title: (source.querySelector('h1, h2, h3')?.textContent || '').trim(),
        template: PAGE_TEMPLATE.name,
        blocks: [],
        white,
      },
    }];
  },
};
