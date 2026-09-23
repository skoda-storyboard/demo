/*
 * Stories feed block (SKODA-214).
 *
 * The vertical "Latest Stories" feed that leads the Storyboard home `.cover-box`
 * (stories.md): a fixed first slice of card-teaser cards + an accessible "Load
 * more" <button> that appends the next batch. Source pager (measured, stories.md
 * §2/§8): initial render = 5 cards, each Load more appends 6 — NOT infinite
 * scroll. The promo-box hero posts are excluded (source `exclude_carousel_posts`)
 * so the feed never repeats the featured items.
 *
 * FACET-LESS reuse of SKODA-402 (no fork): scripts/query-index.js (one memoized
 * fetch/cache) + listing-logic.mjs scopeRows/filterRows/sortRows/paginate + the
 * offset URL codec. decodeState/encodeState are called with an empty facetKeys
 * list and `initial` as the baseline page size, so they handle only offset/sortby
 * and preserve unrelated params (utm_* etc.). Card markup + CSS follow the
 * card-teaser overlay design (card-teaser.md / SKODA-201): image with a dual
 * scrim, date + title in white over the bottom-left.
 */
// Render helpers are hoisted function declarations invoked only from deferred
// event handlers, so forward references between them are safe.
/* eslint-disable no-use-before-define */

import { createOptimizedPicture, readBlockConfig } from '../../scripts/aem.js';
import { loadQueryIndex, defaultIndexUrl } from '../../scripts/query-index.js';
import { fetchPlaceholders } from '../../scripts/placeholders.js';
import {
  scopeRows, filterRows, sortRows, paginate, decodeState, encodeState,
} from '../listing/listing-logic.mjs';

// The feed has no facets — an empty key list makes the shared URL codec operate
// on `offset`/`sortby` only (and preserve everything else).
const NO_FACETS = [];

// UI strings resolve from the per-locale placeholders sheet, English defaults so
// the block works before any sheet is authored (same source as the listing).
function buildStrings(ph) {
  return {
    loadMore: ph.loadMore || 'Load more',
    loading: ph.loading || 'Loading…',
    loadError: ph.listingLoadError || 'Could not load results.',
    noResults: ph.listingNoResults || 'Nothing to show yet.',
    // "N shown" — announced on load-more for screen readers.
    resultsShown: ph.storiesResultsShown || 'stories shown',
  };
}

// Split a comma-separated config value into trimmed tokens.
const tokens = (v) => String(v || '').split(',').map((s) => s.trim()).filter(Boolean);

function parseFeedConfig(block) {
  const cfg = readBlockConfig(block);
  return {
    index: cfg.index || defaultIndexUrl(),
    path: cfg.path || '',
    template: cfg.template || '',
    // category/tag: within-value OR, across-key AND (reuses listing-logic filterRows)
    category: tokens(cfg.category),
    tag: tokens(cfg.tag || cfg.tags),
    heading: cfg.heading || '',
    // 'oldest'/'publishDate' → ascending; anything else (incl. '-publishDate') → newest
    sort: (cfg.sort === 'oldest' || cfg.sort === 'publishDate') ? 'oldest' : 'newest',
    // pager (stories.md §8): first `initial` cards, then +`perpage` per Load more
    initial: Math.max(1, Number(cfg.initial) || 5),
    perpage: Math.max(1, Number(cfg.perpage) || 6),
    // 'featured' (default): 2 large + 3-up; a number → plain N-up grid
    columns: cfg.columns || 'featured',
    // exclude promo-box hero posts so the feed doesn't duplicate them (default on)
    excludeFeatured: String(cfg.excludefeatured ?? 'true') !== 'false',
  };
}

// A promo/featured entry the promo-box already shows (source `exclude_carousel_posts`).
// Defensive: the index may signal this via a `featured`/`promo` flag (SKODA-401).
const isFeatured = (row) => {
  const v = row.featured ?? row.promo ?? row.carousel;
  return v === true || v === 'true' || v === '1' || v === 1;
};

// Format an ISO/parseable date to the source's "D. M. YYYY" (e.g. 10. 9. 2026).
function formatDate(value) {
  const t = Date.parse(value);
  if (Number.isNaN(t)) return '';
  const d = new Date(t);
  return `${d.getUTCDate()}. ${d.getUTCMonth() + 1}. ${d.getUTCFullYear()}`;
}

/*
 * Build one overlay card-teaser cell (card-teaser.md): image fills the card, a
 * dual scrim darkens the bottom, date + title sit in white over the image.
 */
function cardCell(row, eager) {
  const li = document.createElement('li');
  li.className = 'stories-item';

  const a = document.createElement('a');
  a.className = 'stories-item-link';
  a.href = row.path || '#';

  const media = document.createElement('div');
  media.className = 'stories-item-media';
  if (row.image) {
    const pic = createOptimizedPicture(row.image, row.title || '', eager, [{ width: '750' }]);
    if (eager) pic.querySelector('img')?.setAttribute('fetchpriority', 'high');
    media.append(pic);
  }
  a.append(media);

  const body = document.createElement('div');
  body.className = 'stories-item-body';
  const dateText = formatDate(row.date || row.publisheddate || row.publishDate);
  if (dateText) {
    const time = document.createElement('time');
    time.className = 'stories-item-date';
    const iso = row.date || row.publisheddate || row.publishDate;
    if (iso) time.setAttribute('datetime', String(iso));
    time.textContent = dateText;
    body.append(time);
  }
  if (row.title) {
    const h = document.createElement('h3');
    h.className = 'stories-item-title';
    h.textContent = row.title;
    body.append(h);
  }
  a.append(body);
  li.append(a);
  return li;
}

export default async function decorate(block) {
  const cfg = parseFeedConfig(block);
  const STRINGS = buildStrings(await fetchPlaceholders());

  // State restored from the deep-link URL. `initial` (5) is the baseline page
  // size the shared codec floors to; load-more grows `revealed` by `perpage` (6).
  const restored = decodeState(window.location.search, NO_FACETS, cfg.initial);
  const state = { sort: cfg.sort || restored.sort, revealed: restored.revealed };

  // Skeleton.
  block.textContent = '';
  block.classList.add(Number(cfg.columns) ? `stories-cols-${Number(cfg.columns)}` : 'stories-featured');

  if (cfg.heading) {
    const h = document.createElement('h3');
    h.className = 'stories-heading';
    h.textContent = cfg.heading;
    block.append(h);
  }

  const grid = document.createElement('ul');
  grid.className = 'stories-items';
  const status = document.createElement('div');
  status.className = 'stories-status';
  status.setAttribute('aria-live', 'polite');
  status.textContent = STRINGS.loading;
  const loadMoreWrap = document.createElement('div');
  loadMoreWrap.className = 'stories-loadmore';
  block.append(grid, status, loadMoreWrap);

  // Load + filter the index (self-contained; degrades to empty/error state).
  let scoped = [];
  try {
    const rows = await loadQueryIndex(cfg.index);
    // template/path scope, then category/tag facet filter (reuses listing-logic)
    scoped = scopeRows(rows, { template: cfg.template, path: cfg.path });
    const active = {};
    if (cfg.category.length) active.category = cfg.category;
    if (cfg.tag.length) active.tags = cfg.tag;
    if (Object.keys(active).length) scoped = filterRows(scoped, active);
    // exclude the promo-box hero posts (source exclude_carousel_posts parity)
    if (cfg.excludeFeatured) scoped = scoped.filter((r) => !isFeatured(r));
  } catch (e) {
    status.textContent = STRINGS.loadError;
    // eslint-disable-next-line no-console
    console.error('stories: index load failed', e);
    return;
  }

  const sortedRows = () => sortRows(scoped, state.sort);

  // Load-more pushes a new history entry (offset paging, matching the source);
  // there is no filter/sort UI here, so no replaceState path is needed.
  function updateUrl() {
    // Encode on top of the CURRENT search so unrelated params survive; only our
    // offset/sortby keys change (facetKeys empty → nothing else is touched).
    // `initial` is the baseline: offset is omitted while revealed === initial.
    const qs = encodeState(
      { active: {}, sort: state.sort, revealed: state.revealed },
      cfg.initial,
      window.location.search,
      NO_FACETS,
    );
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.pushState({ revealed: state.revealed, sort: state.sort }, '', url);
  }

  function renderGrid() {
    const all = sortedRows();
    const shownRows = paginate(all, state.revealed);
    grid.textContent = '';
    shownRows.forEach((row, i) => grid.append(cardCell(row, i === 0)));

    status.hidden = all.length > 0;
    if (!all.length) status.textContent = STRINGS.noResults;

    // Load-more: dropped (not disabled) when the slice is exhausted (stories.md §5).
    loadMoreWrap.textContent = '';
    if (shownRows.length < all.length) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'stories-loadmore-btn';
      btn.textContent = STRINGS.loadMore;
      btn.addEventListener('click', () => {
        const prev = grid.children.length;
        state.revealed += cfg.perpage; // append the next batch of `perpage` (6)
        updateUrl(); // load-more pushes a history entry (source offset paging)
        renderGrid();
        // Announce + move focus to the first newly-added cell (a11y).
        const nowShown = Math.min(state.revealed, all.length);
        status.hidden = false;
        status.textContent = `${nowShown} ${STRINGS.resultsShown}`;
        grid.children[prev]?.querySelector('a')?.focus();
      });
      loadMoreWrap.append(btn);
    }
  }

  // Restore state on back/forward.
  window.addEventListener('popstate', () => {
    const back = decodeState(window.location.search, NO_FACETS, cfg.initial);
    state.sort = cfg.sort || back.sort;
    state.revealed = back.revealed;
    renderGrid();
  });

  // Initial paint (no pushState — respect the incoming URL).
  renderGrid();
}
