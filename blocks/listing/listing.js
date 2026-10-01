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
import { loadQueryIndex, defaultIndexUrl, cleanTitle } from '../../scripts/query-index.js';
import { fetchPlaceholders } from '../../scripts/placeholders.js';
import { formatCardDate } from '../../scripts/card-teaser.js';
import { mediaActions, mediaLabels, playBadge } from '../../scripts/media-card.js';
import {
  scopeRows, filterRows, sortRows, paginate, distinctFacetValues,
  decodeState, encodeState, selectedCount, INDEX_FACETS,
} from './listing-logic.mjs';

// Live facet order + label remaps (faceted-listing.md §3; supersedes backlog).
const DEFAULT_FACETS = INDEX_FACETS;
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

// After a filter change the source waits ~0.9s (so quick picks batch), veils the results
// (0.2s fade), shows the new results and collapses the filter panel (measured on /en/images).
export const FILTER_SETTLE_MS = 900;
export const VEIL_MS = 200;
// Load more shows the source's 4-dot loader in its button for one dot cycle (live waits on
// the server, ~1s; the index is already here) before the next items appear. Keep equal to
// the dot cycle in listing.css (--listing-loader-cycle).
export const LOAD_MORE_MS = 500;
const reducedMotion = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const titleCase = (s) => String(s).replace(/(^|[\s-])([a-z])/g, (m) => m.toUpperCase());
const labelFor = (key, labels) => labels[key] || FACET_LABELS[key] || titleCase(key);
// Facet values are index slugs ("peaq", "enyaq-coupe"); the source shows names ("Peaq").
export const valueLabel = (v) => titleCase(String(v).replace(/-/g, ' '));

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

/** Image / video listings (media feed rows) render the media card (SKODA-406). */
export const isMediaTemplate = (template) => template === 'image' || template === 'video';

/*
 * One media card (source article.media-cart-item): the 16:9 thumbnail link (a play badge
 * on videos), the date and the title / filename, then the add-to-cart + download actions.
 * No description. The thumbnail link keeps the file / Vimeo URL for modifier clicks and
 * no-JS; a plain click opens the lightbox (wireMediaLightbox). `labels` is the control text
 * (`mediaLabels(placeholders)`; English by default).
 */
export function mediaCell(row, eager, labels = undefined) {
  const title = cleanTitle(row.title);
  const li = document.createElement('li');
  li.className = `listing-item media-asset${row.template === 'video' ? ' video' : ''}`;

  const a = document.createElement('a');
  a.className = 'listing-item-link media-asset-thumb';
  a.href = row.path || row.original || row.mp4 || '#';
  const imgWrap = document.createElement('div');
  imgWrap.className = 'listing-item-image';
  const src = row.image || row.poster;
  if (src) {
    const pic = createOptimizedPicture(src, title, eager, [
      { media: '(min-width: 768px)', width: '750' }, { width: '500' },
    ]);
    if (eager) pic.querySelector('img')?.setAttribute('fetchpriority', 'high');
    imgWrap.append(pic);
  } else {
    a.setAttribute('aria-label', title);
  }
  if (row.template === 'video') imgWrap.append(playBadge());
  a.append(imgWrap);
  li.append(a);

  const body = document.createElement('div');
  body.className = 'listing-item-body';
  const dateText = formatCardDate(row.date);
  if (dateText) {
    const time = document.createElement('time');
    time.className = 'media-asset-date';
    time.setAttribute('datetime', String(row.date));
    time.textContent = dateText;
    body.append(time);
  }
  // the inner span carries the 2-line clamp, so the heading's bottom padding stays clear of a
  // third line (the source clamps the title link inside its padded h3 the same way)
  const h = document.createElement('h3');
  h.className = 'media-asset-title';
  const text = document.createElement('span');
  text.textContent = title;
  h.append(text);
  body.append(h);
  li.append(body);

  const actions = mediaActions(row, title, labels);
  if (actions) li.append(actions);
  return li;
}

// the lightbox code, loaded on the first open (story / news listings never need it)
const loadLightbox = async () => {
  const [{ buildLightbox }, { feedLightboxItem }] = await Promise.all([
    import('../../scripts/lightbox.js'), import('../../scripts/media-lightbox.js'),
  ]);
  return { buildLightbox, feedLightboxItem };
};

/*
 * The shared lightbox over the shown media cards (the source colorbox; videos play in it):
 * a click anywhere on a card except its actions opens it at that card, and focus returns to
 * the card's thumbnail link on close. Modifier clicks keep the link (new tab). Built lazily
 * on the first open and rebuilt when the shown rows change (filter, sort, load more); the
 * previous overlay is removed so they don't pile up on <body>. If the lightbox code fails to
 * load, the click falls back to the thumbnail link (the file / Vimeo URL). The inert cart
 * buttons cancel their own clicks (scripts/media-card.js), so they never get here.
 * `opts.load` / `opts.navigate` are injectable for tests.
 */
export function wireMediaLightbox(grid, getRows, {
  load = loadLightbox, navigate = (url) => window.location.assign(url),
} = {}) {
  let built = null; // { rows, lightbox }
  grid.addEventListener('click', async (e) => {
    const modified = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
    if (e.defaultPrevented || e.button !== 0 || modified) return;
    const card = e.target.closest('.listing-item.media-asset');
    if (!card || e.target.closest('.media-card-actions')) return;
    const index = [...grid.children].indexOf(card);
    const rows = getRows();
    if (index < 0 || !rows[index]) return;
    e.preventDefault();
    const thumb = card.querySelector('.media-asset-thumb');
    if (!built || built.rows !== rows) {
      try {
        const { buildLightbox, feedLightboxItem } = await load();
        built?.lightbox.overlay.remove();
        built = { rows, lightbox: buildLightbox(document.body, rows.map(feedLightboxItem)) };
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('listing: lightbox load failed', err);
        const href = thumb?.getAttribute('href');
        if (href && href !== '#') navigate(thumb.href);
        return;
      }
    }
    built.lightbox.open(index, thumb || card);
  });
}

export default async function decorate(block) {
  const cfg = parseListConfig(block);
  instanceSeq += 1;
  const uid = `l${instanceSeq}`; // unique id prefix for this block instance
  const media = isMediaTemplate(cfg.template);
  // media listings show the cart's package-limit notice (SKODA-505b); loaded with the
  // placeholders, so it is in the skeleton (no shift above the grid)
  const [placeholders, cartUi] = await Promise.all([
    fetchPlaceholders(),
    media ? import('../../scripts/media-cart-ui.js').catch(() => null) : null,
  ]);
  const STRINGS = buildStrings(placeholders);
  const mediaText = mediaLabels(placeholders); // media card controls (SKODA-406)

  // State (restored from the deep-link URL).
  const initial = decodeState(window.location.search, cfg.facets, cfg.perpage);
  const state = { active: initial.active, sort: initial.sort, revealed: initial.revealed };

  // Skeleton.
  block.textContent = '';
  block.classList.add(`columns-${cfg.columns}`);
  if (media) block.classList.add('listing-media', `listing-${cfg.template}`);
  // Facet panel, as on the source form.search-filter: a row of pills, then the open pill's
  // option list full width under the whole row (not a dropdown under its pill).
  const facetBar = document.createElement('form');
  facetBar.className = 'listing-facets';
  facetBar.setAttribute('aria-label', STRINGS.filters);
  const facetPills = document.createElement('div');
  facetPills.className = 'facet-pills';
  const facetOptions = document.createElement('div');
  facetOptions.className = 'facet-options';
  // the inner wrapper lets CSS animate the panel's height open and closed (grid 0fr → 1fr)
  const facetInner = document.createElement('div');
  facetInner.className = 'facet-inner';
  // the applied-filter chips live inside the panel, under the options, so they hide and show
  // with it (source form.search-filter > .search-filter-selected)
  const chipsRow = document.createElement('div');
  chipsRow.className = 'listing-chips';
  facetInner.append(facetPills, facetOptions, chipsRow);
  facetBar.append(facetInner);
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

  // "Advanced filter (N)" toggle (SKODA-402a): as on the source, the facets are collapsed
  // behind it at every width. It sits in the sort row; the panel it reveals opens ABOVE the
  // sort row (live), and the DOM follows that visual order.
  const filterToggle = document.createElement('button');
  filterToggle.type = 'button';
  filterToggle.className = 'listing-filter-toggle';
  filterToggle.setAttribute('aria-expanded', 'false');
  filterToggle.setAttribute('aria-controls', `${uid}-facets`);
  facetBar.id = `${uid}-facets`;

  // Source order: facet panel (pills, options, chips), sort row, grid, then the "N / total"
  // count right above Load more (measured on /en/news, /en/images).
  block.append(facetBar, sortRow, status, grid, countEl, loadMoreWrap);
  if (cartUi) sortRow.after(cartUi.limitBanner(cartUi.cartLabels(placeholders)));

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

  // Deep-link values match the index value case-insensitively (`filter[model][]=Peaq` →
  // "peaq"), so the checkbox shows as ticked and a second pick doesn't duplicate it.
  function canonicalValues(active) {
    const out = {};
    Object.entries(active).forEach(([key, vals]) => {
      const known = new Map(distinctFacetValues(scoped, key)
        .map(({ value }) => [String(value).toLowerCase(), value]));
      out[key] = [...new Set(vals.map((v) => known.get(String(v).toLowerCase()) ?? v))];
    });
    return out;
  }
  state.active = canonicalValues(state.active);

  // --- rendering ---------------------------------------------------------
  const filteredSorted = () => sortRows(filterRows(scoped, state.active), state.sort);
  let currentRows = []; // the rows the grid shows, in order (the media lightbox's items)
  if (media) wireMediaLightbox(grid, () => currentRows);

  // Filter/sort changes replace the current history entry (keeps the URL
  // deep-linkable without a back-stack entry per toggle); only load-more pushes
  // a new entry, matching the source's offset paging.
  function updateUrl(push = false) {
    // Preserve unrelated params (utm_*, analytics, a 2nd listing's params) by
    // encoding on top of the CURRENT search; only our facet/sort/offset keys change.
    const qs = encodeState(state, cfg.perpage, window.location.search, cfg.facets);
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
        chip.textContent = `${labelFor(key, cfg.facetLabels)}: ${valueLabel(val)}`;
        chip.setAttribute('aria-label', `${STRINGS.removeFilter}: ${labelFor(key, cfg.facetLabels)} — ${valueLabel(val)}`);
        // removing a filter veils, updates and collapses like a pick, but at once (live: the
        // chip is a link, so there is no settle time)
        chip.addEventListener('click', () => {
          state.active[key] = (state.active[key] || []).filter((v) => v !== val);
          if (!state.active[key].length) delete state.active[key];
          state.revealed = cfg.perpage;
          applyFilterChange(0);
        });
        chipsRow.append(chip);
      });
    });
  }

  function renderGrid() {
    const all = filteredSorted();
    const shownRows = paginate(all, state.revealed);
    currentRows = shownRows;
    grid.textContent = '';
    const cell = media ? (row, eager) => mediaCell(row, eager, mediaText) : cardCell;
    shownRows.forEach((row, i) => grid.append(cell(row, i === 0)));

    status.hidden = all.length > 0;
    if (!all.length) status.textContent = STRINGS.noResults;

    renderCount(shownRows.length, all.length);

    // Load-more.
    loadMoreWrap.textContent = '';
    if (shownRows.length < all.length) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'listing-loadmore-btn';
      const label = document.createElement('span');
      label.className = 'listing-loadmore-label';
      label.textContent = STRINGS.loadMore;
      // the source ajax-loader-button's 4-dot loader, shown while the next items load
      const loader = document.createElement('span');
      loader.className = 'listing-loader';
      loader.setAttribute('aria-hidden', 'true');
      loader.append(...Array.from({ length: 4 }, () => {
        const dot = document.createElement('span');
        dot.className = 'listing-loader-dot';
        return dot;
      }));
      btn.append(label, loader);
      btn.addEventListener('click', loadMore);
      loadMoreWrap.append(btn);
    }
  }

  // Load more: the button shows its loader, then the next page appends and focus moves to its
  // first card (a11y). A pick still settling shows first, so paging counts its rows.
  let loadTimer = 0;
  function loadMore() {
    if (loadTimer) return;
    const clicked = loadMoreWrap.querySelector('.listing-loadmore-btn');
    const hadFocus = document.activeElement === clicked;
    flushPendingFilter(); // may re-render the grid and so replace the button
    const btn = loadMoreWrap.querySelector('.listing-loadmore-btn');
    if (!btn) {
      // the pick left nothing more to load: keep focus in the results, not on <body>
      if (hadFocus) grid.querySelector('a')?.focus();
      return;
    }
    if (hadFocus && btn !== clicked) btn.focus();
    btn.classList.add('is-loading');
    btn.setAttribute('aria-busy', 'true');
    loadTimer = setTimeout(() => {
      loadTimer = 0;
      const prev = grid.children.length;
      state.revealed += cfg.perpage;
      updateUrl(true); // load-more pushes a history entry (source offset paging)
      renderGrid();
      grid.children[prev]?.querySelector('a')?.focus();
    }, reducedMotion() ? 0 : LOAD_MORE_MS);
  }

  function syncSortButtons() {
    sortList.querySelectorAll('.listing-sort-btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.sort === state.sort)));
  }

  function activeFilterCount() {
    return Object.values(state.active).reduce((s, v) => s + v.length, 0);
  }

  // Update the pill "active" state + count badges from current selection.
  function refreshPillStates() {
    facetPills.querySelectorAll('.facet-pill').forEach((pill) => {
      const n = selectedCount(state.active, pill.dataset.facet);
      pill.classList.toggle('active', n > 0);
      pill.querySelector('.facet-count').textContent = n ? String(n) : '';
    });
    // the source always shows the count, "(0)" included
    filterToggle.textContent = '';
    const count = document.createElement('span');
    count.className = 'listing-filter-count';
    count.textContent = `(${activeFilterCount()})`;
    filterToggle.append(document.createTextNode(`${STRINGS.advancedFilter} `), count);
  }

  // Re-sync facet-panel checkboxes with the current selection. The checkboxes
  // are built once, so any state change that doesn't originate from a checkbox
  // (chip remove, back/forward) must refresh their checked state here.
  function refreshFacetOptions() {
    facetOptions.querySelectorAll('.facet-panel').forEach((panel) => {
      const sel = new Set(state.active[panel.dataset.facet] || []);
      panel.querySelectorAll('.facet-option input').forEach((cb) => {
        cb.checked = sel.has(cb.value);
      });
    });
  }

  function rerender() {
    updateUrl();
    syncSortButtons();
    refreshPillStates();
    refreshFacetOptions();
    renderChips();
    renderGrid();
  }

  // A filter change, as on the source: settle, veil the listing, show the new results and
  // collapse the panel (focus goes to the toggle if it was in the panel), then unveil.
  // A checkbox ticks at once and settles (a later change, even under the veil, restarts it);
  // a chip removal or a sort change passes settleMs 0 and veils at once.
  let settleTimer = 0;
  let veilTimer = 0;
  function cancelPendingFilter() {
    clearTimeout(settleTimer);
    clearTimeout(veilTimer);
    clearTimeout(loadTimer); // a pending Load more would page the old results
    settleTimer = 0;
    veilTimer = 0;
    loadTimer = 0;
    loadMoreWrap.querySelector('.listing-loadmore-btn.is-loading')?.classList.remove('is-loading');
    loadMoreWrap.querySelector('.listing-loadmore-btn[aria-busy]')?.removeAttribute('aria-busy');
    block.classList.remove('is-loading');
    block.removeAttribute('aria-busy');
  }
  // show a pick that is still settling now, without the veil or the collapse
  function flushPendingFilter() {
    if (!settleTimer && !veilTimer) return;
    cancelPendingFilter();
    rerender();
  }
  function applyFilterChange(settleMs = FILTER_SETTLE_MS) {
    cancelPendingFilter();
    settleTimer = setTimeout(() => {
      settleTimer = 0;
      block.classList.add('is-loading');
      block.setAttribute('aria-busy', 'true');
      veilTimer = setTimeout(() => {
        veilTimer = 0;
        // before the render: it removes a clicked chip, which would drop focus to <body>
        const hadFocus = facetBar.contains(document.activeElement);
        rerender();
        setFacetsOpen(false);
        if (hadFocus) filterToggle.focus();
        block.classList.remove('is-loading');
        block.removeAttribute('aria-busy');
      }, reducedMotion() ? 0 : VEIL_MS);
    }, settleMs);
  }

  // Open or close one pill's option list (panels are looked up by pill, not by id).
  const panelFor = new Map();
  function setOptionsOpen(pill, open) {
    pill.setAttribute('aria-expanded', String(open));
    panelFor.get(pill).hidden = !open;
  }

  // Close any open option list; returns its pill (or null) so Esc can hand focus back.
  function closeOptionPanels() {
    const openPill = facetPills.querySelector('.facet-pill[aria-expanded="true"]');
    facetPills.querySelectorAll('.facet-pill[aria-expanded="true"]').forEach((p) => setOptionsOpen(p, false));
    return openPill;
  }

  // --- facet bar ---------------------------------------------------------
  cfg.facets.forEach((key) => {
    // options in name order, filled column by column like the source
    const byName = (a, b) => valueLabel(a.value)
      .localeCompare(valueLabel(b.value), undefined, { numeric: true });
    const values = distinctFacetValues(scoped, key).sort(byName);
    if (!values.length) return; // no data for this facet in scope → skip pill

    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'facet-pill';
    pill.dataset.facet = key;
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
    panel.dataset.facet = key;
    panel.id = panelId;
    panel.hidden = true;
    const legend = document.createElement('legend');
    legend.className = 'sr-only';
    legend.textContent = labelFor(key, cfg.facetLabels);
    panel.append(legend);

    values.forEach(({ value }) => {
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
        applyFilterChange();
      });
      // name only, like the source ("Peaq"); the box is drawn on the text span in CSS
      const txt = document.createElement('span');
      txt.className = 'facet-option-label';
      txt.textContent = valueLabel(value);
      wrap.append(cb, txt);
      panel.append(wrap);
    });

    pill.addEventListener('click', () => {
      const open = pill.getAttribute('aria-expanded') === 'true';
      closeOptionPanels();
      setOptionsOpen(pill, !open);
      // the lists sit after the whole pill row, so Tab from this pill would reach the next
      // pill first: opening hands focus to its first option (Esc returns it to the pill)
      if (!open) panel.querySelector('input')?.focus();
    });

    panelFor.set(pill, panel);
    facetPills.append(pill);
    facetOptions.append(panel);
  });

  // --- sort row: sort options + "Advanced filter (n)" toggle -------------
  // The toggle comes last: below 768 it is its own row under the sort options; from 768 CSS
  // moves it to the left of them.
  const sortList = document.createElement('div');
  sortList.className = 'listing-sort-options';
  [['newest', STRINGS.newest], ['oldest', STRINGS.oldest]].forEach(([val, lbl]) => {
    const s = document.createElement('button');
    s.type = 'button';
    s.className = 'listing-sort-btn';
    s.dataset.sort = val;
    s.textContent = lbl;
    s.setAttribute('aria-pressed', String(state.sort === val));
    // a sort change veils, updates and collapses like a chip removal (live: veil at once; the
    // active sort switches with the new results)
    s.addEventListener('click', () => {
      if (state.sort === val) return; // the source's active sort is plain text
      state.sort = val;
      state.revealed = cfg.perpage;
      applyFilterChange(0);
    });
    sortList.append(s);
  });
  sortRow.append(sortList, filterToggle);

  // Facet disclosure (SKODA-402a): an inline panel opened by the toggle at every width. It
  // is not a modal. The panel comes before the toggle in the DOM (it opens above the sort row),
  // so Tab from the toggle would skip it: opening hands focus to the panel's first stop, the
  // open list's pill or else the first pill (PR #227 review). Closing it from the toggle keeps
  // focus there. Esc on the toggle closes the panel (focus stays). Esc in the panel closes one
  // layer at a time: an open option list first (focus back to its pill), then the panel (focus
  // back to the toggle). Esc elsewhere in the block (a result card, Load more) and an Esc an
  // inner control already handled (defaultPrevented) are left alone.
  // A filter selection collapses it once the results show, as on the source (applyFilterChange).
  // Collapsing keeps the open option list (as on live): it shrinks away inside the panel and
  // is still open when the panel is expanded again. Only Esc or its pill closes a list.
  const setFacetsOpen = (open) => {
    filterToggle.setAttribute('aria-expanded', String(open));
    block.classList.toggle('facets-open', open);
  };

  filterToggle.addEventListener('click', () => {
    const open = filterToggle.getAttribute('aria-expanded') !== 'true';
    setFacetsOpen(open);
    if (open) {
      (facetPills.querySelector('.facet-pill[aria-expanded="true"]')
        || facetPills.querySelector('.facet-pill'))?.focus();
    }
  });
  block.addEventListener('keydown', (e) => {
    // an inner control that already handled Esc (e.g. a media card's size menu) wins
    if (e.key !== 'Escape' || e.defaultPrevented || !block.classList.contains('facets-open')) return;
    if (e.target !== filterToggle && !facetBar.contains(e.target)) return;
    e.preventDefault();
    // on the toggle itself: close the panel and stay put (an open list persists for next time)
    if (e.target === filterToggle) {
      setFacetsOpen(false);
      return;
    }
    const openPill = closeOptionPanels();
    if (openPill) {
      openPill.focus();
      return;
    }
    setFacetsOpen(false);
    filterToggle.focus();
  });

  // Restore state on back/forward.
  window.addEventListener('popstate', () => {
    cancelPendingFilter(); // back/forward replaces the state, so a settling pick is dropped
    const restored = decodeState(window.location.search, cfg.facets, cfg.perpage);
    state.active = canonicalValues(restored.active);
    state.sort = restored.sort;
    state.revealed = restored.revealed;
    refreshPillStates();
    refreshFacetOptions();
    renderChips();
    renderGrid();
    syncSortButtons();
  });

  // Initial paint (no pushState — respect the incoming URL). A deep link that already
  // filters opens the panel, so the active filters are visible (product decision
  // 2026-09-29; the source keeps it closed and only shows the count), with the first
  // filtered facet's options open, as the source shows them once its panel is opened.
  setFacetsOpen(activeFilterCount() > 0);
  const filteredPill = [...facetPills.querySelectorAll('.facet-pill')]
    .find((p) => selectedCount(state.active, p.dataset.facet) > 0);
  if (filteredPill) setOptionsOpen(filteredPill, true);
  refreshPillStates();
  renderChips();
  renderGrid();
}
