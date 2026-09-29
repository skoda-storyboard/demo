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

export function curatedRows(block) {
  return [...block.children].map((row) => [...row.children]
    .map((cell) => ({ elems: [...cell.childNodes] })));
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

  // OMIT the image cell entirely when the row has no image (SKODA-212 review
  // P2): an empty placeholder <div> would be sniffed as a second .card-teaser-
  // body, giving an overlay card two bodies + doubled 16/9 fallback height.
  // With only a body cell, decorateCardCells flags .card-teaser-no-image and the
  // single body gets the correct intrinsic height (matches buildCardTeaser).
  return row.image
    ? [
      createOptimizedPicture(row.image, title, false, [
        { media: '(min-width: 768px)', width: '750' }, { width: '500' },
      ]),
      body,
    ]
    : [body];
}

export function collapseRail(block, mount, header) {
  const relatedSection = block.closest('body.story .section.dark.story-rail-container');
  if (relatedSection) {
    relatedSection.remove();
    return;
  }
  mount.remove();
  if (!header.children.length) header.remove();
}

// `press` variant (SKODA-224): the source Related Press Releases band shows at most this many
// cards; when it is full (more releases match) it ends with an "All" card linking to the
// band's "All" listing (live Zellmer release: 10 cards + the .item-all cell; bands with
// fewer cards have none).
export const PRESS_BAND_SIZE = 10;

/**
 * The band's "All" link: the default-content paragraph before the block whose only content
 * is one link (the header pill), or null.
 * @param {Element} block
 * @returns {HTMLAnchorElement|null}
 */
export function pressAllLink(block) {
  const paragraphs = block.closest('.section')?.querySelectorAll('.default-content-wrapper p') || [];
  return [...paragraphs].map((p) => {
    const link = p.querySelector(':scope > a[href]');
    const onlyLink = link && p.children.length === 1
      && p.textContent.trim() === link.textContent.trim();
    return onlyLink ? link : null;
  }).find(Boolean) || null;
}

/**
 * Whether a press band is full, so it gets the trailing "All" card.
 * @param {number} shown cards in the rail
 * @param {boolean} more index mode: more rows match than the limit
 */
export function pressBandIsFull(shown, more = false) {
  return more || shown >= PRESS_BAND_SIZE;
}

/**
 * Appends the "All" end card after the last press card (source .item-all).
 * @param {Element} carousel the built carousel block
 * @param {HTMLAnchorElement} link the band's "All" link
 */
function appendPressAllCard(carousel, link) {
  const track = carousel.querySelector('.carousel-track');
  if (!track) return;
  const cell = document.createElement('li');
  cell.className = 'story-rail-all';
  const a = document.createElement('a');
  a.className = 'story-rail-all-link';
  a.href = link.getAttribute('href');
  a.textContent = link.textContent.trim();
  cell.append(a);
  track.append(cell);
  // the carousel recomputes its arrows on scroll: count the new end cell right away
  track.dispatchEvent(new Event('scroll'));
}

export default async function decorate(block) {
  const cfg = parseConfig(block);
  const curated = !isConfigTable(block);
  const press = block.classList.contains('press');

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
    a.textContent = 'View all';
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
    let more = false;
    if (!curated) {
      try {
        const all = await loadQueryIndex(cfg.index);
        // one extra row tells a full press band apart from one that just fits
        const matches = selectRows(all, press ? { ...cfg, limit: cfg.limit + 1 } : cfg);
        more = matches.length > cfg.limit;
        rows = matches.slice(0, cfg.limit).map((r) => rowToCells(r));
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
    if (cfg.dots) carousel.classList.add('dots');
    if (heading) carousel.setAttribute('aria-label', heading);
    mount.append(carousel);
    decorateBlock(carousel);
    await loadBlock(carousel);
    const allLink = press && pressBandIsFull(rows.length, more) ? pressAllLink(block) : null;
    if (allLink) appendPressAllCard(carousel, allLink);
    mount.classList.add('is-built'); // release the reserved card geometry
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
