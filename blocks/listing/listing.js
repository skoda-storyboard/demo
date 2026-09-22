/*
 * Faceted Listing block (SKODA-402).
 *
 * Index-driven result listing with a top pill-bar facet UI, client-side
 * filter/sort, deep-link URL state, and load-more paging — NO server round-trip.
 * Reproduces the source News/Images/Videos listings (ElasticPress + Search &
 * Filter Pro) as a static EDS block. Measured spec: docs/ui-specs/faceted-listing.md.
 *
 * All filter/sort/paginate/URL logic lives in the pure listing-logic.mjs (unit
 * tested); this file is the DOM adapter: config, fetch, render, events.
 */
// Render helpers are hoisted function declarations invoked only from deferred
// event handlers, so forward references between them are safe.
/* eslint-disable no-use-before-define */

import { createOptimizedPicture, readBlockConfig } from '../../scripts/aem.js';
import { loadQueryIndex, defaultIndexUrl } from '../../scripts/query-index.js';
import { fetchPlaceholders } from '../../scripts/placeholders.js';
import {
  scopeRows, filterRows, sortRows, paginate, distinctFacetValues,
  decodeState, encodeState, selectedCount,
} from './listing-logic.mjs';

// Live facet order + label remaps (faceted-listing.md §3; supersedes backlog).
const DEFAULT_FACETS = [
  'model', 'derivative', 'concept', 'bodywork', 'equipment', 'years', 'company',
  'happening', 'history', 'motorsport', 'sponsorship', 'vip', 'view', 'technology', 'environment',
];
const FACET_LABELS = {
  years: 'Year', happening: 'Event', vip: 'People', view: 'Interior/Exterior',
};

// UI strings resolve from the per-locale placeholders sheet (i18n architecture),
// with English defaults so the block works before any sheet is authored.
function buildStrings(ph) {
  return {
    loadMore: ph.loadMore || 'Load more',
    advancedFilter: ph.advancedFilter || 'Advanced filter',
    noResults: ph.listingNoResults || 'No results — clear filters to see more.',
    loading: ph.loading || 'Loading…',
    removeFilter: ph.removeFilter || 'Remove filter',
    filters: ph.filters || 'Filters',
    loadError: ph.listingLoadError || 'Could not load results.',
    newest: ph.sortNewest || 'Newest',
    oldest: ph.sortOldest || 'Oldest',
  };
}

let instanceSeq = 0; // per-page counter → unique element ids when >1 listing on a page

const titleCase = (s) => String(s).replace(/(^|[\s-])([a-z])/g, (m) => m.toUpperCase());
const labelFor = (key, labels) => labels[key] || FACET_LABELS[key] || titleCase(key);

function parseListConfig(block) {
  const cfg = readBlockConfig(block);
  const list = (v, fallback = []) => (v ? String(v).split(',').map((s) => s.trim()).filter(Boolean) : fallback);
  const facets = list(cfg.facets, DEFAULT_FACETS);
  const facetLabels = {};
  list(cfg.facetlabels).forEach((lbl, i) => { if (facets[i]) facetLabels[facets[i]] = lbl; });
  return {
    index: cfg.index || defaultIndexUrl(),
    path: cfg.path || '',
    template: cfg.template || '',
    facets,
    facetLabels,
    sort: cfg.sort === 'oldest' ? 'oldest' : 'newest',
    perpage: Math.max(1, Number(cfg.perpage) || 6),
    columns: Math.max(1, Number(cfg.columns) || 3),
  };
}

/** Build one result cell reusing the cards shape (image cell + body cell). */
function cardCell(row, eager) {
  const li = document.createElement('li');
  li.className = 'listing-item';

  const a = document.createElement('a');
  a.className = 'listing-item-link';
  a.href = row.path || '#';

  if (row.image) {
    const imgWrap = document.createElement('div');
    imgWrap.className = 'listing-item-image';
    const pic = createOptimizedPicture(row.image, row.title || '', eager, [{ width: '750' }]);
    if (eager) pic.querySelector('img')?.setAttribute('fetchpriority', 'high');
    imgWrap.append(pic);
    a.append(imgWrap);
  }

  const body = document.createElement('div');
  body.className = 'listing-item-body';
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
  const cfg = parseListConfig(block);
  instanceSeq += 1;
  const uid = `l${instanceSeq}`; // unique id prefix for this block instance
  const STRINGS = buildStrings(await fetchPlaceholders());

  // State (restored from the deep-link URL).
  const initial = decodeState(window.location.search, cfg.facets, cfg.perpage);
  const state = { active: initial.active, sort: initial.sort, revealed: initial.revealed };

  // Skeleton.
  block.textContent = '';
  block.classList.add(`columns-${cfg.columns}`);
  const facetBar = document.createElement('form');
  facetBar.className = 'listing-facets';
  facetBar.setAttribute('aria-label', STRINGS.filters);
  const chipsRow = document.createElement('div');
  chipsRow.className = 'listing-chips';
  const sortRow = document.createElement('div');
  sortRow.className = 'listing-sort';
  const countEl = document.createElement('div');
  countEl.className = 'listing-count';
  countEl.setAttribute('aria-live', 'polite');
  const grid = document.createElement('ul');
  grid.className = 'listing-items';
  const status = document.createElement('div');
  status.className = 'listing-status';
  status.setAttribute('aria-live', 'polite');
  status.textContent = STRINGS.loading;
  const loadMoreWrap = document.createElement('div');
  loadMoreWrap.className = 'listing-loadmore';

  // Mobile "Advanced filter (N)" toggle lives in the sort row.
  const filterToggle = document.createElement('button');
  filterToggle.type = 'button';
  filterToggle.className = 'listing-filter-toggle';
  filterToggle.setAttribute('aria-expanded', 'false');
  filterToggle.setAttribute('aria-controls', `${uid}-facets`);
  facetBar.id = `${uid}-facets`;

  block.append(facetBar, chipsRow, sortRow, countEl, status, grid, loadMoreWrap);

  // Load the index (self-contained; degrades to empty/error state).
  let scoped = [];
  try {
    const rows = await loadQueryIndex(cfg.index);
    scoped = scopeRows(rows, { template: cfg.template, path: cfg.path });
  } catch (e) {
    status.textContent = STRINGS.loadError;
    // eslint-disable-next-line no-console
    console.error('listing: index load failed', e);
    return;
  }

  // --- rendering ---------------------------------------------------------
  const filteredSorted = () => sortRows(filterRows(scoped, state.active), state.sort);

  // Filter/sort changes replace the current history entry (keeps the URL
  // deep-linkable without a back-stack entry per toggle); only load-more pushes
  // a new entry, matching the source's offset paging.
  function updateUrl(push = false) {
    const qs = encodeState(state, cfg.perpage);
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    if (push) window.history.pushState(state, '', url);
    else window.history.replaceState(state, '', url);
  }

  function renderCount(shown, total) {
    countEl.textContent = '';
    const cur = document.createElement('span');
    cur.className = 'listing-count-current';
    cur.textContent = String(shown);
    const tot = document.createElement('span');
    tot.className = 'listing-count-total';
    tot.textContent = String(total); // CSS adds the "/" separator
    countEl.append(cur, tot);
  }

  function renderChips() {
    chipsRow.textContent = '';
    Object.entries(state.active).forEach(([key, vals]) => {
      vals.forEach((val) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'listing-chip';
        chip.textContent = `${labelFor(key, cfg.facetLabels)}: ${val}`;
        chip.setAttribute('aria-label', `${STRINGS.removeFilter}: ${labelFor(key, cfg.facetLabels)} — ${val}`);
        chip.addEventListener('click', () => {
          state.active[key] = (state.active[key] || []).filter((v) => v !== val);
          if (!state.active[key].length) delete state.active[key];
          state.revealed = cfg.perpage;
          rerender();
        });
        chipsRow.append(chip);
      });
    });
  }

  function renderGrid() {
    const all = filteredSorted();
    const shownRows = paginate(all, state.revealed);
    grid.textContent = '';
    shownRows.forEach((row, i) => grid.append(cardCell(row, i === 0)));

    status.hidden = all.length > 0;
    if (!all.length) status.textContent = STRINGS.noResults;

    renderCount(shownRows.length, all.length);

    // Load-more.
    loadMoreWrap.textContent = '';
    if (shownRows.length < all.length) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'listing-loadmore-btn';
      btn.textContent = STRINGS.loadMore;
      btn.addEventListener('click', () => {
        const prev = grid.children.length;
        state.revealed += cfg.perpage;
        updateUrl(true); // load-more pushes a history entry (source offset paging)
        renderGrid();
        // move focus to the first newly-added cell (a11y)
        const firstNew = grid.children[prev];
        firstNew?.querySelector('a')?.focus();
      });
      loadMoreWrap.append(btn);
    }
  }

  // Update the pill "active" state + count badges from current selection.
  function refreshPillStates() {
    facetBar.querySelectorAll('.facet').forEach((f) => {
      const key = f.dataset.facet;
      const n = selectedCount(state.active, key);
      const pill = f.querySelector('.facet-pill');
      pill.classList.toggle('active', n > 0);
      pill.querySelector('.facet-count').textContent = n ? String(n) : '';
    });
    filterToggle.textContent = '';
    const totalSel = Object.values(state.active).reduce((s, v) => s + v.length, 0);
    filterToggle.append(document.createTextNode(`${STRINGS.advancedFilter}${totalSel ? ` (${totalSel})` : ''}`));
  }

  function rerender() {
    updateUrl();
    refreshPillStates();
    renderChips();
    renderGrid();
  }

  // --- facet bar ---------------------------------------------------------
  cfg.facets.forEach((key) => {
    const values = distinctFacetValues(scoped, key);
    if (!values.length) return; // no data for this facet in scope → skip pill

    const facet = document.createElement('div');
    facet.className = 'facet';
    facet.dataset.facet = key;

    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'facet-pill';
    pill.setAttribute('aria-expanded', 'false');
    const panelId = `${uid}-facet-panel-${key}`;
    pill.setAttribute('aria-controls', panelId);
    const labelSpan = document.createElement('span');
    labelSpan.className = 'facet-label';
    labelSpan.textContent = labelFor(key, cfg.facetLabels);
    const countBadge = document.createElement('span');
    countBadge.className = 'facet-count';
    pill.append(labelSpan, countBadge);

    const panel = document.createElement('fieldset');
    panel.className = 'facet-panel';
    panel.id = panelId;
    panel.hidden = true;
    const legend = document.createElement('legend');
    legend.className = 'sr-only';
    legend.textContent = labelFor(key, cfg.facetLabels);
    panel.append(legend);

    values.forEach(({ value, count }) => {
      const optId = `${uid}-facet-${key}-${value}`.replace(/[^a-z0-9-]/gi, '-');
      const wrap = document.createElement('label');
      wrap.className = 'facet-option';
      wrap.htmlFor = optId;
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.id = optId;
      cb.value = value;
      cb.checked = (state.active[key] || []).includes(value);
      cb.addEventListener('change', () => {
        const cur = new Set(state.active[key] || []);
        if (cb.checked) cur.add(value); else cur.delete(value);
        if (cur.size) state.active[key] = [...cur]; else delete state.active[key];
        state.revealed = cfg.perpage;
        rerender();
      });
      const txt = document.createElement('span');
      txt.textContent = `${value} (${count})`;
      wrap.append(cb, txt);
      panel.append(wrap);
    });

    pill.addEventListener('click', () => {
      const open = pill.getAttribute('aria-expanded') === 'true';
      // close others
      facetBar.querySelectorAll('.facet-pill[aria-expanded="true"]').forEach((p) => {
        p.setAttribute('aria-expanded', 'false');
        p.closest('.facet').querySelector('.facet-panel').hidden = true;
      });
      pill.setAttribute('aria-expanded', String(!open));
      panel.hidden = open;
    });

    facet.append(pill, panel);
    facetBar.append(facet);
  });

  // --- sort + mobile toggle ---------------------------------------------
  sortRow.append(filterToggle);
  const sortList = document.createElement('div');
  sortList.className = 'listing-sort-options';
  [['newest', STRINGS.newest], ['oldest', STRINGS.oldest]].forEach(([val, lbl]) => {
    const s = document.createElement('button');
    s.type = 'button';
    s.className = 'listing-sort-btn';
    s.dataset.sort = val;
    s.textContent = lbl;
    s.setAttribute('aria-pressed', String(state.sort === val));
    s.addEventListener('click', () => {
      state.sort = val;
      state.revealed = cfg.perpage;
      sortList.querySelectorAll('.listing-sort-btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.sort === val)));
      rerender();
    });
    sortList.append(s);
  });
  sortRow.append(sortList);

  // Mobile drawer: toggle exposes the facet bar; Esc closes; Tab is trapped
  // between the toggle and the facet controls while open (focus restored to the
  // trigger on close).
  const drawerFocusables = () => [
    filterToggle,
    ...facetBar.querySelectorAll('button, input'),
  ].filter((el) => !el.disabled && el.offsetParent !== null);

  const closeDrawer = () => {
    filterToggle.setAttribute('aria-expanded', 'false');
    block.classList.remove('facets-open');
    filterToggle.focus();
  };

  filterToggle.addEventListener('click', () => {
    const open = filterToggle.getAttribute('aria-expanded') === 'true';
    if (open) { closeDrawer(); return; }
    filterToggle.setAttribute('aria-expanded', 'true');
    block.classList.add('facets-open');
    facetBar.querySelector('button, input')?.focus();
  });
  block.addEventListener('keydown', (e) => {
    if (!block.classList.contains('facets-open')) return;
    if (e.key === 'Escape') {
      closeDrawer();
      return;
    }
    if (e.key === 'Tab') {
      const f = drawerFocusables();
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  // Restore state on back/forward.
  window.addEventListener('popstate', () => {
    const restored = decodeState(window.location.search, cfg.facets, cfg.perpage);
    state.active = restored.active;
    state.sort = restored.sort;
    state.revealed = restored.revealed;
    refreshPillStates();
    renderChips();
    renderGrid();
    sortList.querySelectorAll('.listing-sort-btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.sort === state.sort)));
  });

  // Initial paint (no pushState — respect the incoming URL).
  refreshPillStates();
  renderChips();
  renderGrid();
}
