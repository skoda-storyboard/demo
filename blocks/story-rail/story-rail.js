/*
 * Story rail block (SKODA-212) — the index-driven horizontal rail.
 *
 * The home page carries several category rails ("Latest e-mobility", "Models",
 * …). Each is a `story-rail`: a key/value config table that pulls rows from the
 * query index and renders them as a real `carousel` block. This block is the
 * data adapter; the `carousel` block owns all rail chrome + interaction.
 *
 * REUSE (no forking, the ticket's hard requirement):
 *   - scripts/query-index.js  — the SAME memoized loader stories/listing use.
 *   - blocks/listing/listing-logic.mjs — scopeRows/filterRows/sortRows/paginate.
 *   - scripts/card-teaser.js  — synthesizes the card cells the carousel expects.
 * A rail-specific need (drop already-shown slugs) is met with `exclude`/config
 * here, not by forking the shared logic.
 *
 * Deferred build (carousel-rails.md §7): the 4+ home rails must not all build on
 * load, so we build + decorate + load the inner carousel behind an
 * IntersectionObserver (rootMargin 600px) and reserve min-height to avoid CLS.
 *
 * Two input modes:
 *   - config table (default): key/value rows → index query → synthesized cards.
 *   - curated: authored card rows (image + body cells) are passed straight to the
 *     carousel (an author hand-picks the stories).
 */

import {
  buildBlock, decorateBlock, loadBlock, readBlockConfig, createOptimizedPicture, getMetadata,
  toClassName,
} from '../../scripts/aem.js';
import { loadQueryIndex, defaultIndexUrl, cleanTitle } from '../../scripts/query-index.js';
import { formatCardDate } from '../../scripts/card-teaser.js';
import { buildLightbox } from '../../scripts/lightbox.js';
import { feedLightboxItem } from '../../scripts/media-lightbox.js';
import {
  scopeRows, filterRows, sortRows, paginate, INDEX_FACETS,
} from '../listing/listing-logic.mjs';

// Split a comma-separated config value into trimmed tokens.
const tokens = (v) => String(v || '').split(',').map((s) => s.trim()).filter(Boolean);

export function parseConfig(block) {
  const cfg = readBlockConfig(block);
  return {
    index: cfg.index || defaultIndexUrl(),
    path: cfg.path || '',
    // default to the story template so a category-only rail stays scoped to
    // stories (not press releases / other indexed content); an author widens
    // scope by setting `template` explicitly (SKODA-212 review P1).
    template: cfg.template || 'story',
    category: tokens(cfg.category),
    tag: tokens(cfg.tag || cfg.tags),
    // index facet columns (model, years, …) as config keys (SKODA-820): each key is
    // its own facet, so `model: epiq` + `years: 2026` must BOTH match (the story's
    // "Related Stories · Based on tags: 2026, Epiq" rail), while values within one
    // key still OR — the same filterRows semantics as the listing.
    facets: Object.fromEntries(INDEX_FACETS
      .map((key) => [key, tokens(cfg[key])])
      .filter(([, vals]) => vals.length)),
    heading: cfg.heading || '',
    // header "view all" link (source a.link-all)
    viewAll: cfg.viewall || cfg.viewAll || cfg.all || '',
    // 'oldest'/'publishdate' → ascending; else newest-first
    sort: (cfg.sort === 'oldest' || cfg.sort === 'publishdate') ? 'oldest' : 'newest',
    layout: cfg.template === 'press_release' ? 'news' : 'standard',
    limit: Math.max(1, Number(cfg.limit) || 10),
    // comma list of path-slug fragments to exclude (already shown above)
    exclude: tokens(cfg.exclude),
    dots: String(cfg.dots ?? 'false') === 'true',
  };
}

/*
 * Pure row selection for the rail: scope → facet filter → exclude already-shown
 * slugs → sort → slice. Exported so tests exercise the production pipeline (the
 * reuse gate: it must delegate to listing-logic, not a fork). Returns index rows.
 */
export function selectRows(all, cfg) {
  let scoped = scopeRows(all, { template: cfg.template, path: cfg.path });
  const active = { ...(cfg.facets || {}) };
  if (cfg.category.length) active.category = cfg.category;
  if (cfg.tag.length) active.tags = cfg.tag;
  if (Object.keys(active).length) scoped = filterRows(scoped, active);
  if (cfg.exclude.length) {
    scoped = scoped.filter((r) => !cfg.exclude.some((s) => String(r.path || '').includes(s)));
  }
  scoped = sortRows(scoped, cfg.sort);
  return paginate(scoped, cfg.limit);
}

// The config keys parseConfig understands (normalized via toClassName, so
// "View all" → "view-all"). Used to tell a key/value config table apart from a
// curated card rail by ROW SHAPE, not image presence (SKODA-212 review P2): a
// curated rail whose authors omit images must still be treated as curated.
const CONFIG_KEYS = new Set([
  'index', 'path', 'template', 'category', 'tag', 'tags', 'heading',
  'viewall', 'view-all', 'all', 'sort', 'limit', 'exclude', 'dots',
  ...INDEX_FACETS,
]);

// Is this a key/value config table, or curated cards? A config table is a set of
// 2-cell rows whose first cell is a known config key. A curated card rail has
// rows that don't match that shape (image + body, or body-only for image-less
// curated cards). Empty blocks default to config (the common authored case).
export function isConfigTable(block) {
  const rows = [...block.children];
  if (!rows.length) return true;
  return rows.every((row) => {
    const cells = [...row.children];
    if (cells.length !== 2) return false; // curated rows are image+body (or 1 cell)
    if (cells[0].querySelector('picture, img')) return false; // first cell is media → curated
    const key = toClassName(cells[0].textContent.trim());
    return CONFIG_KEYS.has(key);
  });
}

// Rail-chrome settings a curated (hand-picked) rail may keep next to its cards, e.g. the
// "All" link and the `template` that picks the card style (SKODA-208 model rails).
const CURATED_SETTINGS = new Set(['template', 'heading', 'viewall', 'view-all', 'all', 'dots']);

/* A two-cell text row whose first cell is one of the curated rail settings (a card's
   body cell carries a title heading, a setting's value never does). */
function isSettingsRow(row) {
  const cells = [...row.children];
  if (cells.length !== 2) return false;
  if (!CURATED_SETTINGS.has(toClassName(cells[0].textContent?.trim() || ''))) return false;
  return !cells[0].querySelector?.('picture, img') && !cells[1].querySelector?.('h1, h2, h3, h4, h5, h6');
}

export function curatedRows(block) {
  return [...block.children].filter((row) => !isSettingsRow(row)).map((row) => [...row.children]
    .map((cell) => ({ elems: [...cell.childNodes] })));
}

/*
 * The media card's action row (media feed rows, contract media-item): "add to media cart"
 * and "download", as the shared card-teaser toolbar cell (`<p><a>` per button). The cart
 * button carries the cart key (`data-id`) and stays inert until the media cart (SKODA-505)
 * binds it; download links the original (image) or the MP4 (video). Icon-only buttons, so
 * each gets its label from the source titles. Returns null for non-media rows.
 */
export function mediaToolbar(row) {
  if (row.template !== 'image' && row.template !== 'video') return null;
  const button = (action, label, href) => {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.className = `media-cart-action ${action}`;
    a.href = href;
    a.title = label;
    a.setAttribute('aria-label', label);
    a.dataset.action = action;
    p.append(a);
    return { p, a };
  };
  const elems = [];
  if (row.id) {
    const { p, a } = button('add', 'Add to media cart', '#');
    a.dataset.id = row.id;
    a.setAttribute('role', 'button');
    a.setAttribute('aria-disabled', 'true');
    elems.push(p);
  }
  const file = row.template === 'image' ? row.original : row.mp4;
  if (file) {
    const { p, a } = button('download', row.template === 'image' ? 'Download original' : 'Download video', file);
    a.setAttribute('download', '');
    a.target = '_blank';
    elems.push(p);
  }
  return elems.length ? { elems } : null;
}

/*
 * Synthesize one carousel row (image cell + body cell) from an index row. The
 * body is returned as buildBlock's `{ elems }` form so the date <p> and title
 * <h3> land DIRECTLY in the cell (not wrapped in an extra <div>) — the carousel
 * then content-sniffs these exactly like authored DA cells, so indexed and
 * authored rails share one decorate path, and the date→overlay detection fires.
 *
 * These rails are deferred (built near-viewport, below the fold), so images stay
 * lazy — no eager/fetchpriority (that belongs to the page's real LCP element).
 */
export function rowToCells(row) {
  // body cell: date paragraph (→ overlay) + title heading (link), as flat elems
  const elems = [];
  const title = cleanTitle(row.title);
  const iso = row.date || row.publisheddate || row.publishDate;
  const dateText = formatCardDate(iso);
  if (dateText) {
    const p = document.createElement('p');
    p.textContent = dateText;
    elems.push(p);
  }
  const h = document.createElement('h3');
  const link = document.createElement('a');
  link.href = row.path || '#';
  link.textContent = title;
  h.append(link);
  elems.push(h);
  const body = { elems };
  const toolbar = mediaToolbar(row);

  // OMIT the image cell entirely when the row has no image (SKODA-212 review
  // P2): an empty placeholder <div> would be sniffed as a second .card-teaser-
  // body, giving an overlay card two bodies + doubled 16/9 fallback height.
  // With only a body cell, decorateCardCells flags .card-teaser-no-image and the
  // single body gets the correct intrinsic height (matches buildCardTeaser).
  const cells = row.image
    ? [
      createOptimizedPicture(row.image, title, false, [
        { media: '(min-width: 768px)', width: '750' }, { width: '500' },
      ]),
      body,
    ]
    : [body];
  if (toolbar) cells.push(toolbar);
  return cells;
}

/*
 * The authored text of the "view all" link, when the cell holds a link (the model page's
 * rails say "All"). readBlockConfig keeps only the href, so read the anchor directly.
 */
export function viewAllLabel(block) {
  const row = [...block.children].find((r) => {
    const key = toClassName(r.children[0]?.textContent.trim() || '');
    return key === 'viewall' || key === 'view-all' || key === 'all';
  });
  const text = row?.children[1]?.querySelector('a')?.textContent.trim() || '';
  // a bare URL as link text (the common DA paste) is not a label
  return text && !/^(https?:\/\/|\/)/i.test(text) ? text : 'View all';
}

/*
 * Image and video rails open the shared lightbox (the source colorbox; videos play in it)
 * instead of the bare file / vimeo.com: a click anywhere on a card except its toolbar opens
 * it at that card. Modifier clicks keep
 * the link (new tab). The overlay lives on <body>: a fixed layer inside the carousel
 * would be clipped by its transforms.
 */
function wireMediaLightbox(carousel, rows) {
  const cards = [...carousel.querySelectorAll('.carousel-track > *')];
  if (!cards.length) return;
  const lightbox = buildLightbox(document.body, rows.slice(0, cards.length).map(feedLightboxItem));
  carousel.addEventListener('click', (e) => {
    const modified = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
    if (e.defaultPrevented || e.button !== 0 || modified) return;
    const card = e.target.closest('.carousel-track > *');
    if (!card || e.target.closest('.card-teaser-toolbar')) return;
    const index = cards.indexOf(card);
    if (index < 0) return;
    e.preventDefault();
    lightbox.open(index, card.querySelector('.card-teaser-link') || card);
  });
}

// Classes that belong to the rail itself and are never passed to the inner carousel.
const OWN_CLASSES = new Set(['story-rail', 'block']);

/*
 * Is this rail the only thing in its section apart from a short lead-in (a heading and at
 * most one line such as "Based on tags: Octavia")? Then an empty rail takes the section
 * with it (SKODA-208 / SKODA-608: an empty rail leaves no heading behind).
 */
export function isRailOnlySection(section, block) {
  const wrappers = [...section.children];
  const blocks = wrappers.filter((w) => !w.classList.contains('default-content-wrapper'));
  if (blocks.length !== 1 || !blocks[0].contains(block)) return false;
  const lead = wrappers.filter((w) => w.classList.contains('default-content-wrapper'))
    .flatMap((w) => [...w.children]);
  const paragraphs = lead.filter((el) => el.tagName === 'P');
  return lead.every((el) => /^(H[1-6]|P)$/.test(el.tagName)) && paragraphs.length <= 1;
}

/*
 * Terminal empty/error state: remove the rail so no blank reserved slot or dead
 * "View all" lingers (SKODA-212 review P2, SKODA-608).
 *   - the story page's related band (SKODA-820) goes as a whole section;
 *   - so does any rail alone in its section with just a heading lead-in (the model
 *     page's rails: heading + "Based on tags"), SKODA-208;
 *   - otherwise the rail drops its own chrome (mount + header, "View all" included).
 * `story-rail:empty` (bubbling) is dispatched first so a page template can drop in-page
 * links to the removed section.
 */
export function collapseRail(block, mount, header) {
  const relatedSection = block.closest('body.story .section.dark.story-rail-container');
  const section = relatedSection || block.closest('.section');
  if (section && (relatedSection || isRailOnlySection(section, block))) {
    section.dispatchEvent?.(new CustomEvent('story-rail:empty', { bubbles: true }));
    section.remove();
    return;
  }
  block.dispatchEvent?.(new CustomEvent('story-rail:empty', { bubbles: true }));
  mount.remove();
  header.remove();
}

export default async function decorate(block) {
  const cfg = parseConfig(block);
  const curated = !isConfigTable(block);
  const allLabel = viewAllLabel(block);
  const variants = [...block.classList].filter((c) => !OWN_CLASSES.has(c));
  if (!curated && cfg.layout === 'news' && document.body.classList.contains('page')) {
    block.classList.add('story-rail-news');
  }

  // --- header (heading + optional "view all") --------------------------------
  const heading = cfg.heading || getMetadata('story-rail-heading') || '';
  const header = document.createElement('div');
  header.className = 'story-rail-header';
  if (heading) {
    const h = document.createElement('h2');
    h.className = 'story-rail-heading';
    h.textContent = heading;
    header.append(h);
  }
  if (cfg.viewAll) {
    const a = document.createElement('a');
    a.className = 'story-rail-viewall';
    a.href = cfg.viewAll;
    a.textContent = allLabel;
    header.append(a);
  }

  // reserve height until the carousel builds (CLS guard, carousel-rails.md §7)
  const mount = document.createElement('div');
  mount.className = 'story-rail-mount';

  const authoredRows = curated ? curatedRows(block) : null;
  block.replaceChildren();
  if (header.children.length) block.append(header);
  block.append(mount);

  // Build + decorate + load the inner carousel. Deferred so multiple home rails
  // don't all build on load.
  async function buildRail() {
    let rows = authoredRows;
    let indexRows = [];
    if (!curated) {
      try {
        const all = await loadQueryIndex(cfg.index);
        indexRows = selectRows(all, cfg);
        rows = indexRows.map((r) => rowToCells(r));
      } catch (e) {
        // index load failed: remove the empty story band or generic rail
        // eslint-disable-next-line no-console
        console.error('story-rail: index load failed', e);
        collapseRail(block, mount, header);
        return;
      }
    }
    if (!rows || !rows.length) { collapseRail(block, mount, header); return; }

    const carousel = buildBlock('carousel', rows);
    // the rail's own variants (e.g. `center`, `caption`, `media`) style the inner carousel
    carousel.classList.add(...variants);
    if (cfg.dots) carousel.classList.add('dots');
    if (heading) carousel.setAttribute('aria-label', heading);
    carousel.hidden = true;
    mount.append(carousel);
    // the media cart (SKODA-505) isn't bound yet: its "#" button must not jump to the top
    carousel.addEventListener('click', (e) => {
      if (e.target.closest('.media-cart-action[aria-disabled="true"]')) e.preventDefault();
    });
    decorateBlock(carousel);
    await loadBlock(carousel);
    mount.classList.add('is-built');
    carousel.hidden = false;
    if (['image', 'video'].includes(cfg.template) && indexRows.length) wireMediaLightbox(carousel, indexRows);
  }

  if (window.IntersectionObserver) {
    const io = new IntersectionObserver((entries, obs) => {
      if (entries.some((en) => en.isIntersecting)) {
        obs.disconnect();
        buildRail();
      }
    }, { rootMargin: '600px 0px' });
    io.observe(block);
  } else {
    buildRail();
  }
}
