/*
 * Stories feed block (SKODA-214).
 *
 * The vertical "Latest Stories" / "News" feed that leads each home `.cover-box`
 * (template-home.md §2/§6): first `perpage` cards from the locale query-index +
 * an accessible "Load more" <button> that appends the next slice and pushState's
 * the offset (source-confirmed: a real button, NOT infinite scroll — §6/§9).
 *
 * This is the FACET-LESS sibling of the faceted listing (SKODA-402): it reuses
 * the SAME shared modules — scripts/query-index.js (one memoized fetch/cache) and
 * blocks/listing/listing-logic.mjs (scope/sort/paginate + the offset URL codec).
 * It does NOT fork that engine: decodeState/encodeState are called with an empty
 * facetKeys list, so they handle only `offset`/`sortby` and preserve unrelated
 * params (utm_*, a second feed's params) exactly as the listing does.
 *
 * Measured targets: template-home.md §5–§7 (the dedicated stories.md the ticket
 * cites is not yet captured; values here follow template-home.md + card-teaser.md
 * and the section heading/dark-band tokens). Card shape mirrors the listing cell.
 */
// Render helpers are hoisted function declarations invoked only from deferred
// event handlers, so forward references between them are safe.
/* eslint-disable no-use-before-define */

import { createOptimizedPicture, readBlockConfig } from '../../scripts/aem.js';
import { loadQueryIndex, defaultIndexUrl } from '../../scripts/query-index.js';
import { fetchPlaceholders } from '../../scripts/placeholders.js';
import {
  scopeRows, sortRows, paginate, decodeState, encodeState,
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
    // "N results shown" — announced on load-more for screen readers.
    resultsShown: ph.storiesResultsShown || 'stories shown',
  };
}

function parseFeedConfig(block) {
  const cfg = readBlockConfig(block);
  return {
    index: cfg.index || defaultIndexUrl(),
    path: cfg.path || '',
    template: cfg.template || '',
    heading: cfg.heading || '',
    sort: cfg.sort === 'oldest' ? 'oldest' : 'newest',
    perpage: Math.max(1, Number(cfg.perpage) || 6),
    columns: Math.max(1, Number(cfg.columns) || 3),
  };
}

/** Build one feed cell — mirrors the listing cell shape (image + body). */
function cardCell(row, eager) {
  const li = document.createElement('li');
  li.className = 'stories-item';

  const a = document.createElement('a');
  a.className = 'stories-item-link';
  a.href = row.path || '#';

  if (row.image) {
    const imgWrap = document.createElement('div');
    imgWrap.className = 'stories-item-image';
    const pic = createOptimizedPicture(row.image, row.title || '', eager, [{ width: '750' }]);
    if (eager) pic.querySelector('img')?.setAttribute('fetchpriority', 'high');
    imgWrap.append(pic);
    a.append(imgWrap);
  }

  const body = document.createElement('div');
  body.className = 'stories-item-body';
  if (row.title) {
    const h = document.createElement('h3');
    h.textContent = row.title;
    body.append(h);
  }
  if (row.description) {
    const p = document.createElement('p');
    p.textContent = row.description;
    body.append(p);
  }
  a.append(body);
  li.append(a);
  return li;
}

export default async function decorate(block) {
  const cfg = parseFeedConfig(block);
  const STRINGS = buildStrings(await fetchPlaceholders());

  // State restored from the deep-link URL (offset + sort only; facet-less).
  const initial = decodeState(window.location.search, NO_FACETS, cfg.perpage);
  const state = { sort: cfg.sort || initial.sort, revealed: initial.revealed };

  // Skeleton.
  block.textContent = '';
  block.classList.add(`columns-${cfg.columns}`);

  if (cfg.heading) {
    const h = document.createElement('h2');
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

  // Load the index (self-contained; degrades to empty/error state).
  let scoped = [];
  try {
    const rows = await loadQueryIndex(cfg.index);
    scoped = scopeRows(rows, { template: cfg.template, path: cfg.path });
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
    const qs = encodeState(
      { active: {}, sort: state.sort, revealed: state.revealed },
      cfg.perpage,
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

    // Load-more.
    loadMoreWrap.textContent = '';
    if (shownRows.length < all.length) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'stories-loadmore-btn';
      btn.textContent = STRINGS.loadMore;
      btn.addEventListener('click', () => {
        const prev = grid.children.length;
        state.revealed += cfg.perpage;
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
    const restored = decodeState(window.location.search, NO_FACETS, cfg.perpage);
    state.sort = cfg.sort || restored.sort;
    state.revealed = restored.revealed;
    renderGrid();
  });

  // Initial paint (no pushState — respect the incoming URL).
  renderGrid();
}
