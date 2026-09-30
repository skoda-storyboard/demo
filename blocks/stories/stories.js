/*
 * Stories feed block (SKODA-214).
 *
 * The vertical "Latest Stories" feed that leads the Storyboard home `.cover-box`
 * (stories.md): a fixed first slice of card-teaser cards + an accessible "Load
 * more" <button> that appends the next batch. Source pager (measured, stories.md
 * §2/§8): initial render = 5 cards, each Load more appends 6 — NOT infinite
 * scroll. The promo-box hero posts are excluded (source `exclude_carousel_posts`)
 * so the feed never repeats the featured items. An authored offset can also skip
 * the promo's top N stories when the index has no featured flag.
 *
 * FACET-LESS reuse of SKODA-402 (no fork): scripts/query-index.js (one memoized
 * fetch/cache) + listing-logic.mjs scopeRows/filterRows/sortRows/paginate + the
 * offset URL codec. decodeState/encodeState are called with an empty facetKeys
 * list and `initial` as the baseline page size, so they handle only offset/sortby
 * and preserve unrelated params (utm_* etc.). Card markup + CSS follow the
 * card-teaser overlay design (card-teaser.md / SKODA-201): image with a dual
 * scrim, date + title in white over the bottom-left.
 *
 * Model tag archives add a `feature` row: the featured model card (SKODA-222), rendered as
 * the grid's first cell, see readFeature / buildFeature.
 */
// Render helpers are hoisted function declarations invoked only from deferred
// event handlers, so forward references between them are safe.
/* eslint-disable no-use-before-define */

import { readBlockConfig, createOptimizedPicture } from '../../scripts/aem.js';
import { loadQueryIndex, defaultIndexUrl } from '../../scripts/query-index.js';
import { fetchPlaceholders } from '../../scripts/placeholders.js';
import { buildCardTeaser } from '../../scripts/card-teaser.js';
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
    newTab: ph.newTab || 'opens in a new tab',
  };
}

// Split a comma-separated config value into trimmed tokens.
const tokens = (v) => String(v || '').split(',').map((s) => s.trim()).filter(Boolean);

export function parseFeedConfig(block) {
  const cfg = readBlockConfig(block);
  let offset = cfg.offset ? Number(cfg.offset) : 0;
  if (!Number.isSafeInteger(offset) || offset < 0) {
    // eslint-disable-next-line no-console
    console.warn('stories: offset must be a non-negative integer; using 0');
    offset = 0;
  }
  const exclude = tokens(cfg.exclude).map((path) => {
    if (!/^\/(?!\/)/.test(path)) throw new Error('stories: exclude requires site-relative paths');
    return path.replace(/\/+$/, '');
  });
  return {
    index: cfg.index || defaultIndexUrl(),
    path: cfg.path || '',
    template: cfg.template || '',
    offset, // skip sorted, scoped rows before applying the load-more slice
    exclude, // exact promo paths, independent of their position in the index
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
    // Use either the authored skip or flagged promo rows by default, not both.
    excludeFeatured: String(cfg.excludefeatured ?? (offset || exclude.length ? 'false' : 'true')) !== 'false',
  };
}

// A promo/featured entry the promo-box already shows (source `exclude_carousel_posts`).
// Defensive: the index may signal this via a `featured`/`promo` flag (SKODA-401).
// Exported so tests exercise the production predicate (not a copy).
export const isFeatured = (row) => {
  const v = row.featured ?? row.promo ?? row.carousel;
  return v === true || v === 'true' || v === '1' || v === 1;
};

export const selectFeedRows = (rows, sort, offset, exclude = []) => sortRows(
  rows.filter((row) => typeof row.path === 'string' && /^\/(?!\/)/.test(row.path)
    && row.title && !exclude.includes(row.path.replace(/\/+$/, ''))),
  sort,
).slice(offset);

/*
 * Featured model card (SKODA-222, contract `stories-feature`): the `feature` row on a model
 * tag archive holds a picture, an <h3> title and one <p> link per CTA, the primary one in
 * <strong>. The source `.featured-model` fills two story slots on the first page (its
 * archive offset is 4, not 6), so the feed shows `initial - FEATURE_SLOTS` stories with it.
 */
export const FEATURE_SLOTS = 2;
let featureSeq = 0;

// decorateButtons (scripts.js) has already turned <strong><a> into a.button.primary by the
// time blocks run, so both forms mark the primary CTA
const isPrimaryLink = (a) => a.classList.contains('primary') || a.classList.contains('accent')
  || !!(a.closest('strong, b') || a.querySelector('strong, b'));

export function readFeature(block) {
  const row = [...block.querySelectorAll(':scope > div')]
    .find((r) => r.children[0]?.textContent.trim().toLowerCase() === 'feature');
  const cell = row?.children[1];
  if (!cell) return null;
  const heading = cell.querySelector('h1, h2, h3, h4, h5, h6');
  const links = [...cell.querySelectorAll('a[href]')]
    .filter((a) => !heading?.contains(a))
    .map((a) => ({ href: a.getAttribute('href'), text: a.textContent.trim(), primary: isPrimaryLink(a) }))
    .filter((link) => link.text);
  if (!links.length) return null;
  if (!links.some((link) => link.primary)) links[0].primary = true;
  const img = cell.querySelector('img');
  const image = img?.getAttribute('src') ? {
    src: img.getAttribute('src'),
    alt: img.getAttribute('alt') || '',
    width: img.getAttribute('width'),
    height: img.getAttribute('height'),
  } : null;
  return { title: heading?.textContent.trim() || '', image, links };
}

/*
 * The card is the grid's first cell. Below 992px the title is a disclosure <button> (the source
 * `h2.toggle`) and the CTAs start collapsed; from 992px CSS shows the plain title instead and
 * the CTAs are always open, so layout needs no JS. JS only keeps focus when the width crosses
 * 992 (a rotated tablet, a zoomed window) while focus is in the card. The title is an h2
 * (source parity) or, under an authored feed heading (h3), an h4 so the outline stays in order.
 */
export const FEATURE_WIDE = '(width >= 992px)';

export function buildFeature(feature, { titleLevel = 2, newTab = 'opens in a new tab' } = {}) {
  featureSeq += 1;
  const item = document.createElement('li');
  item.className = 'stories-feature';
  const panel = document.createElement('div');
  panel.className = 'stories-feature-panel';
  panel.id = `stories-feature-${featureSeq}`;

  if (feature.title) {
    const title = document.createElement(`h${titleLevel}`);
    title.className = 'stories-feature-title';
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'stories-feature-toggle';
    toggle.textContent = feature.title;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', panel.id);
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      item.classList.toggle('is-expanded', open);
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    // the change fires before the new layout hides the focused control, so focus can move first
    const wide = window.matchMedia?.(FEATURE_WIDE);
    wide?.addEventListener?.('change', () => {
      if (!item.contains(document.activeElement)) return;
      if (wide.matches) {
        if (document.activeElement === toggle) item.querySelector('.stories-feature-cta')?.focus();
      } else if (toggle.getAttribute('aria-expanded') !== 'true') {
        setOpen(true); // a CTA had focus: keep the panel it sits in open
      }
    });
    const text = document.createElement('span');
    text.className = 'stories-feature-text';
    text.textContent = feature.title;
    title.append(toggle, text);
    item.append(title);
  } else {
    item.classList.add('is-expanded'); // nothing to toggle with: keep the CTAs reachable
  }

  if (feature.image) {
    // 240 CSS px at most (source `.featured-model img`), so 480 covers 2x screens
    const picture = createOptimizedPicture(feature.image.src, feature.image.alt, false, [{ width: '480' }]);
    picture.classList.add('stories-feature-image');
    const img = picture.querySelector('img');
    // keep the authored ratio so the lazy image reserves its space (no shift under the title)
    if (feature.image.width && feature.image.height) {
      img.setAttribute('width', feature.image.width);
      img.setAttribute('height', feature.image.height);
    }
    panel.append(picture);
  }
  const ctas = document.createElement('ul');
  ctas.className = 'stories-feature-ctas';
  feature.links.forEach((link) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = link.href;
    a.textContent = link.text;
    a.className = `stories-feature-cta ${link.primary ? 'primary' : 'secondary'}`;
    if (/^https?:$/.test(a.protocol) && a.origin !== window.location.origin) {
      // "Configure your <Model>" goes to the Škoda configurator, in a new tab as on the source
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.setAttribute('aria-label', `${link.text} (${newTab})`); // as cards-social does
    }
    li.append(a);
    ctas.append(li);
  });
  panel.append(ctas);
  item.append(panel);
  return item;
}

/*
 * One feed cell = the shared overlay card-teaser (scripts/card-teaser.js), which
 * returns the <li> itself. The card structure/visual/missing-image handling all
 * come from the primitive; the feed only adds `stories-item` so its flex grid can
 * size the cell (the primitive owns everything inside the card).
 */
function cardCell(row, eager) {
  const item = buildCardTeaser(row, { eager, overlay: true });
  item.classList.add('stories-item');
  return item;
}

export default async function decorate(block) {
  const cfg = parseFeedConfig(block);
  const feature = readFeature(block); // read before the config rows are cleared
  const STRINGS = buildStrings(await fetchPlaceholders());
  // the featured model card takes two story slots on the first page (source parity)
  const firstPage = feature ? Math.max(1, cfg.initial - FEATURE_SLOTS) : cfg.initial;

  // State restored from the deep-link URL. `initial` (5) is the baseline page
  // size the shared codec floors to; load-more grows `revealed` by `perpage` (6).
  const restored = decodeState(window.location.search, NO_FACETS, firstPage);
  const state = { sort: cfg.sort || restored.sort, revealed: restored.revealed };

  // Skeleton.
  block.textContent = '';
  block.classList.add(Number(cfg.columns) ? `stories-cols-${Number(cfg.columns)}` : 'stories-featured');
  const featureCell = feature
    && buildFeature(feature, { titleLevel: cfg.heading ? 4 : 2, newTab: STRINGS.newTab });
  if (featureCell) block.classList.add('has-feature');

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
  // the card is authored content: it paints now, before (and without) the index
  if (featureCell) grid.append(featureCell);
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

  const sortedRows = () => selectFeedRows(scoped, state.sort, cfg.offset, cfg.exclude);

  // Load-more pushes a new history entry (offset paging, matching the source);
  // there is no filter/sort UI here, so no replaceState path is needed.
  function updateUrl() {
    // Encode on top of the CURRENT search so unrelated params survive; only our
    // offset/sortby keys change (facetKeys empty → nothing else is touched).
    // `firstPage` is the baseline: offset is omitted while revealed === firstPage.
    const qs = encodeState(
      { active: {}, sort: state.sort, revealed: state.revealed },
      firstPage,
      window.location.search,
      NO_FACETS,
    );
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.pushState({ revealed: state.revealed, sort: state.sort }, '', url);
  }

  function renderGrid() {
    const all = sortedRows();
    const shownRows = paginate(all, state.revealed);
    // re-render the stories only: the card stays the first cell, open and focused as it was
    grid.querySelectorAll(':scope > .stories-item').forEach((cell) => cell.remove());
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
    const back = decodeState(window.location.search, NO_FACETS, firstPage);
    state.sort = cfg.sort || back.sort;
    state.revealed = back.revealed;
    renderGrid();
  });

  // Initial paint (no pushState — respect the incoming URL).
  renderGrid();
}
