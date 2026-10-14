/* eslint-disable */
/* global WebImporter */

/**
 * Import orchestrator: Škoda model page (skoda_model CPT), SKODA-208.
 * All 22 EN model pages (11 models + 11 derivatives, source skoda_model-sitemap.xml),
 * e.g. /en/skoda-model/new-kodiaq/ and /en/skoda-model/new-kodiaq/kodiaq-rs/.
 *
 * Source layout (varies per page; every part optional):
 *   hero carousel (1 slide) → icon nav → SiteOrigin widgets: editor (Model Description,
 *   + Liftback/Combi editors on Octavia/Superb), highlights (Key Facts), techdata
 *   (Technical Data) → up to 6 rails (#derivatives #news #press-kits #stories #images #videos).
 * The widget ids (#intro/#keyfacts/#techdata) are missing on several pages, so the
 * widgets are located by class; the rails always carry their ids.
 *
 * Emits only blocks that exist on main: Hero Image (overlay), Cards (key-facts), Columns,
 * Story Rail; the nav is default content. The nav parser runs LAST so it can link to the
 * headings the other parsers emitted (see parsers/in-page-nav.js).
 *
 * Metadata: the shared skoda-metadata.js derives template=skoda_model (body class),
 * category and publisheddate; the model / bodywork / derivative facets + tags come from
 * the page's own rail filter ("All" link), passed as overrides, because the URL slug is
 * not the tag (new-kodiaq → kodiaq, new-fabia → fabia, karoq-6 → karoq).
 */

// PARSER IMPORTS
import heroParser from './parsers/hero.js';
import inPageNavParser from './parsers/in-page-nav.js';
import keyFactsParser from './parsers/key-facts.js';
import specTableParser from './parsers/spec-table.js';
import storyRailParser from './parsers/story-rail.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/skoda-model-cleanup.js';
import sectionsTransformer from './transformers/skoda-model-sections.js';
import metadataTransformer from './transformers/skoda-metadata.js';
import linksTransformer from './transformers/skoda-links.js';
import nbspTransformer from './transformers/skoda-nbsp.js';
import normalizeImages from './transformers/skoda-images.js';

const parsers = {
  hero: heroParser,
  'key-facts': keyFactsParser,
  'spec-table': specTableParser,
  'story-rail': storyRailParser,
  'in-page-nav': inPageNavParser,
};

// PAGE TEMPLATE CONFIGURATION — embedded from page-templates.json (model-page).
// Block order = parse order: in-page-nav must stay last.
const PAGE_TEMPLATE = {
  name: 'model-page',
  description:
    'Škoda model page (skoda_model CPT, 22 EN pages incl. derivatives). Hero Image (overlay) + section-link list + Model Description + Cards (key-facts) + Technical Data (Columns + PDF) + up to 6 index-driven Story Rails. Widgets located by class (ids are missing on some pages).',
  urls: ['https://www.skoda-storyboard.com/en/skoda-model/new-kodiaq/'],
  blocks: [
    { name: 'hero', instances: ['article.skoda_model > .carousel'] },
    { name: 'key-facts', instances: ['.so-widget-ys-so-widget-highlights'] },
    { name: 'spec-table', instances: ['.so-widget-ys-so-widget-techdata'] },
    {
      name: 'story-rail',
      instances: [
        '#derivatives .search-results-container',
        '#news .search-results-container',
        '#press-kits .search-results-container',
        '#stories .search-results-container',
        '#images .search-results-container',
        '#videos .search-results-container',
      ],
    },
    { name: 'in-page-nav', instances: ['.model-nav'] },
  ],
  sections: [
    { id: 'section-1', name: 'Hero', selector: ['article.skoda_model > .carousel'], style: null, blocks: ['hero'], defaultContent: [] },
    { id: 'section-2', name: 'Section nav', selector: ['.model-nav'], style: null, blocks: ['in-page-nav'], defaultContent: [] },
    { id: 'section-3', name: 'Model Description', selector: ['.so-panel.widget_sow-editor'], style: null, blocks: [], defaultContent: ['.so-widget-sow-editor'] },
    { id: 'section-4', name: 'Key Facts', selector: ['.so-panel.widget_ys-so-widget-highlights'], style: null, blocks: ['key-facts'], defaultContent: [] },
    { id: 'section-5', name: 'Technical Data', selector: ['.so-panel.widget_ys-so-widget-techdata'], style: null, blocks: ['spec-table'], defaultContent: [] },
    { id: 'section-6', name: 'Bodywork / Derivatives', selector: ['#derivatives'], style: null, blocks: ['story-rail'], defaultContent: [] },
    { id: 'section-7', name: 'News', selector: ['#news'], style: null, blocks: ['story-rail'], defaultContent: [] },
    { id: 'section-8', name: 'Press Kits', selector: ['#press-kits'], style: null, blocks: ['story-rail'], defaultContent: [] },
    { id: 'section-9', name: 'Stories', selector: ['#stories'], style: null, blocks: ['story-rail'], defaultContent: [] },
    { id: 'section-10', name: 'Images', selector: ['#images'], style: null, blocks: ['story-rail'], defaultContent: [] },
    { id: 'section-11', name: 'Videos', selector: ['#videos'], style: null, blocks: ['story-rail'], defaultContent: [] },
  ],
};

const FACET_KEYS = ['model', 'bodywork', 'derivative'];

/** Page facets from the first rail "All" link: filter[model][0]=kodiaq&filter[bodywork][0]=suv. */
function pageFacets(document) {
  const link = document.querySelector('a.search-results-header-link[href*="filter"]');
  const out = {};
  if (!link) return out;
  let query = '';
  try { query = new URL(link.getAttribute('href'), 'https://www.skoda-storyboard.com').search; } catch (e) { return out; }
  new URLSearchParams(query).forEach((value, key) => {
    const m = key.match(/^filter\[([a-z0-9_-]+)\](?:\[\d*\])?$/i);
    const facet = m && m[1].toLowerCase();
    if (!facet || !FACET_KEYS.includes(facet) || !value) return;
    out[facet] = [...new Set([...(out[facet] || []), value.toLowerCase()])];
  });
  return out;
}

// The Media Room home's Models rail lists the 11 base model pages, and the card image is the
// index `image`. The source card shows the model's header banner (the same files as the
// Storyboard home's tag-page cards, SKODA-839), not the page's og:image cut-out. Base model
// pages only, keyed by their source slug; derivatives keep their og:image.
const MODEL_CARD_IMAGES = {
  'new-superb': 'https://cdn.skoda-storyboard.com/2023/12/header_superb_d05c278a.jpg',
  octavia: 'https://cdn.skoda-storyboard.com/2024/03/octaviaFL-header_e0f394a0.jpg',
  epiq: 'https://cdn.skoda-storyboard.com/2026/05/skoda-epiq-m70-01_1135a598.jpg',
  peaq: 'https://cdn.skoda-storyboard.com/2026/06/Navrh-bez-nazvu-21_ec34da00.png',
  'new-fabia': 'https://cdn.skoda-storyboard.com/2021/05/Header_New_FABIA.jpg',
  scala: 'https://cdn.skoda-storyboard.com/2023/09/scala_header_34ad5f38.jpg',
  kamiq: 'https://cdn.skoda-storyboard.com/2023/09/kamiq-header_d6fedb2b.jpg',
  'karoq-6': 'https://cdn.skoda-storyboard.com/2017/07/33_SKODA_KAROQ.jpg',
  'enyaq-iv-2': 'https://cdn.skoda-storyboard.com/2025/01/enyaq_fl_header_eb9109f9.jpg',
  'new-kodiaq': 'https://cdn.skoda-storyboard.com/2023/11/Skoda_Kodiaq_header_04479753.png',
  elroq: 'https://cdn.skoda-storyboard.com/2024/10/elroq_header_fede6794.jpg',
};

// a base model page's card image, null for derivatives and unknown models
function modelCardImage(originalURL) {
  const slug = (new URL(originalURL).pathname.match(/^\/en\/skoda-model\/([^/]+)\/?$/) || [])[1];
  return (slug && MODEL_CARD_IMAGES[slug]) || null;
}

function metadataOverrides(facets) {
  const meta = { template: 'skoda_model' };
  const tags = [];
  FACET_KEYS.forEach((f) => {
    if (!facets[f]) return;
    meta[f] = facets[f].join(', ');
    tags.push(...facets[f]);
  });
  if (tags.length) meta.tags = [...new Set(tags)].join(', ');
  return meta;
}

function executeTransformers(transformers, hookName, element, payload, template) {
  const enhancedPayload = { ...payload, template };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({ name: blockDef.name, selector, element });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  // keep the source's glued non-breaking spaces (html2md would turn them into spaces)
  preprocess: ({ document }) => nbspTransformer('preprocess', document.body, { document }),

  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    // Read the page facets before the rails (which carry the filter links) are parsed.
    const metadata = metadataOverrides(pageFacets(document));
    const cardImage = modelCardImage(params.originalURL);
    if (cardImage) metadata.image = cardImage;
    const template = { ...PAGE_TEMPLATE, metadata };
    const transformers = [cleanupTransformer, sectionsTransformer, metadataTransformer, linksTransformer];

    executeTransformers(transformers, 'beforeTransform', main, payload, template);

    const pageBlocks = findBlocksOnPage(document, template);
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });
    // The nav has resolved its targets; the heading tags must not reach DA.
    main.querySelectorAll('[data-model-key]').forEach((el) => el.removeAttribute('data-model-key'));

    executeTransformers(transformers, 'afterTransform', main, payload, template);

    // Shared skoda-metadata.js already emitted the canonical Metadata block; do NOT
    // call WebImporter.rules.createMetadata (it would append a thinner duplicate).
    WebImporter.rules.transformBackgroundImages(main, document);
    normalizeImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
