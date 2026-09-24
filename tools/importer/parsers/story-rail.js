/* eslint-disable */
/* global WebImporter */
/**
 * Parser: story-rail (block name: "Story Rail")
 * Source: {#derivatives|#news|#press-kits|#stories|#images|#videos} .search-results-container
 *
 * ⚠️ INDEX-DRIVEN: do NOT reproduce the source SSR cards. The runtime story-rail block
 * reads config rows from this table and pulls its items from query-index.
 *
 * The parser self-detects which rail it is by walking up to the closest ancestor with
 * an id among the six known rail ids, then emits the matching config:
 *   #derivatives -> template=skoda_model,  tags=elroq  (heading "Bodywork / Derivatives")
 *   #news        -> template=press_release, tags=elroq (heading "News")
 *   #press-kits  -> template=press_kit,     tags=elroq (heading "Press Kits")
 *   #stories     -> template=story,         tags=elroq (heading "Stories")
 *   #images      -> template=image,         tags=elroq (heading "Images")
 *   #videos      -> template=video,         tags=elroq (heading "Videos")
 *
 * Table shape: ['Story Rail'] then config rows ['heading', <text>], ['template', <val>],
 * ['tags', 'elroq'] (+ optional ['subheading', 'Based on tags: Elroq'] for tag rails).
 */
const RAIL_CONFIG = {
  derivatives: { template: 'skoda_model', heading: 'Bodywork / Derivatives', tagRail: false },
  news: { template: 'press_release', heading: 'News', tagRail: true },
  'press-kits': { template: 'press_kit', heading: 'Press Kits', tagRail: true },
  stories: { template: 'story', heading: 'Stories', tagRail: true },
  images: { template: 'image', heading: 'Images', tagRail: true },
  videos: { template: 'video', heading: 'Videos', tagRail: true },
};

export default function parse(element, { document }) {
  // Walk up to the closest ancestor whose id is a known rail id.
  let node = element;
  let railId = null;
  while (node && node !== document.documentElement) {
    const id = node.id;
    if (id && Object.prototype.hasOwnProperty.call(RAIL_CONFIG, id)) {
      railId = id;
      break;
    }
    node = node.parentElement;
  }

  // Defensive: could not identify the rail -> unwrap and bail (don't emit a bad block).
  if (!railId) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const config = RAIL_CONFIG[railId];

  // Prefer the source heading text where available; strip any subheading span text.
  const headingEl = element.querySelector('.search-results-heading, h2, h3');
  let headingText = config.heading;
  if (headingEl) {
    const clone = headingEl.cloneNode(true);
    clone.querySelectorAll('.subheading').forEach((s) => s.remove());
    const t = (clone.textContent || '').trim();
    if (t) headingText = t;
  }

  const cells = [
    ['Story Rail'],
    ['heading', headingText],
    ['template', config.template],
    ['tags', 'elroq'],
  ];

  // Tag rails render a "Based on tags: <model>" subheading.
  if (config.tagRail) {
    cells.push(['subheading', 'Based on tags: Elroq']);
  }

  const table = WebImporter.DOMUtils.createTable(cells, document);
  element.replaceWith(table);
}
