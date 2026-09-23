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
} from '../../scripts/aem.js';
import { loadQueryIndex, defaultIndexUrl } from '../../scripts/query-index.js';
import { formatCardDate } from '../../scripts/card-teaser.js';
import {
  scopeRows, filterRows, sortRows, paginate,
} from '../listing/listing-logic.mjs';

// Split a comma-separated config value into trimmed tokens.
const tokens = (v) => String(v || '').split(',').map((s) => s.trim()).filter(Boolean);

export function parseConfig(block) {
  const cfg = readBlockConfig(block);
  return {
    index: cfg.index || defaultIndexUrl(),
    path: cfg.path || '',
    template: cfg.template || '',
    category: tokens(cfg.category),
    tag: tokens(cfg.tag || cfg.tags),
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
  const active = {};
  if (cfg.category.length) active.category = cfg.category;
  if (cfg.tag.length) active.tags = cfg.tag;
  if (Object.keys(active).length) scoped = filterRows(scoped, active);
  if (cfg.exclude.length) {
    scoped = scoped.filter((r) => !cfg.exclude.some((s) => String(r.path || '').includes(s)));
  }
  scoped = sortRows(scoped, cfg.sort);
  return paginate(scoped, cfg.limit);
}

// Is this a key/value config table (first cell a known key), or curated cards?
// A config row's first cell is a short single-word-ish key; a curated card row's
// first cell contains a <picture>. Sniff by looking for any image in the block.
function isConfigTable(block) {
  return !block.querySelector('picture, img');
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
function rowToCells(row) {
  // image cell: a single <picture> child (carousel's image-cell contract)
  const imageCell = row.image
    ? createOptimizedPicture(row.image, row.title || '', false, [
      { media: '(min-width: 768px)', width: '750' }, { width: '500' },
    ])
    : document.createElement('div');

  // body cell: date paragraph (→ overlay) + title heading (link), as flat elems
  const elems = [];
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
  link.textContent = row.title || '';
  h.append(link);
  elems.push(h);

  return [imageCell, { elems }];
}

export default async function decorate(block) {
  const cfg = parseConfig(block);
  const curated = !isConfigTable(block);

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

  const authoredRows = curated ? [...block.children].map((r) => [...r.children]) : null;
  block.replaceChildren();
  if (header.children.length) block.append(header);
  block.append(mount);

  // Build + decorate + load the inner carousel. Deferred so multiple home rails
  // don't all build on load.
  async function buildRail() {
    let rows = authoredRows;
    if (!curated) {
      try {
        const all = await loadQueryIndex(cfg.index);
        rows = selectRows(all, cfg).map((r) => rowToCells(r));
      } catch (e) {
        // degrade silently: leave the reserved space empty rather than error out
        // eslint-disable-next-line no-console
        console.error('story-rail: index load failed', e);
        return;
      }
    }
    if (!rows || !rows.length) return;

    const carousel = buildBlock('carousel', rows);
    if (cfg.dots) carousel.classList.add('dots');
    if (heading) carousel.setAttribute('aria-label', heading);
    mount.append(carousel);
    decorateBlock(carousel);
    await loadBlock(carousel);
    mount.classList.add('is-built'); // release the reserved min-height
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
