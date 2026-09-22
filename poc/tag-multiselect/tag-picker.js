/*
 * tag-picker.js — a DA (da.live) / Experience Workspace library plugin that lets an
 * author MULTI-SELECT from a governed tag list and writes the choice back into the
 * document. No App Builder, no Adobe Developer Console: this is a plain hosted static
 * page registered in a `library` config sheet, talking to the editor over the DA_SDK
 * postMessage bridge (https://docs.da.live/developers/guides/developing-apps-and-plugins).
 *
 * The vocabulary is AUTHORABLE: the client governs the tag list in a DA Sheet
 * (TAGS_SHEET) that the picker fetches at runtime, so tags can be added or renamed with
 * no code change. It falls back to the built-in FALLBACK_TAGS only when that sheet can't
 * be reached (offline / standalone smoke test).
 *
 * Flow:
 *   1. render the picker immediately (so the UI never depends on the DA handshake)
 *   2. connect to DA in the background; enable Insert once connected
 *   3. author ticks any number of tags (grouped by facet)
 *   4. Insert -> build a `Tags` block and actions.sendHTML() it into the document
 *
 * Confirmed DA_SDK actions: sendText / sendHTML / closeLibrary. Writing directly to a
 * metadata FIELD isn't documented, so we emit a Tags block (the SKODA-205 content
 * model) via sendHTML, which the existing tags/query-index blocks already consume.
 * The block markup builder lives in ./tags-block.js so it can be unit-tested in node.
 */

import FALLBACK_TAGS from './fallback-tags.js';
import { buildTagsBlockHTML } from './tags-block.js';

const SDK_URL = 'https://da.live/nx/utils/sdk.js';

// The governed vocabulary sheet: a DA Sheet the client edits, served as JSON from the
// same (preview) origin the plugin is hosted on. Columns: taxonomy, slug, label. On any
// fetch failure the picker falls back to FALLBACK_TAGS, so it never hard-depends on it.
const TAGS_SHEET = '/config/tags.json';

// How long to wait for the DA connection handshake before assuming standalone.
const CONNECT_TIMEOUT_MS = 1500;

/**
 * Connect to the DA host and return the resolved SDK ({ context, token, actions }),
 * or null when not inside DA. `DA_SDK` (mod.default) is a promise that only settles
 * once the parent da.live frame completes the postMessage handshake, so opened
 * standalone it never resolves — we short-circuit when there's no parent frame and
 * race a timeout as a backstop, so the UI is never blocked on it.
 */
async function connect() {
  if (window.parent === window) return null; // no DA host framing this page
  try {
    // eslint-disable-next-line import/no-unresolved
    const mod = await import(SDK_URL);
    const timeout = new Promise((resolve) => {
      setTimeout(() => resolve(null), CONNECT_TIMEOUT_MS);
    });
    return await Promise.race([mod.default, timeout]);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('tag-picker: DA_SDK unavailable (running standalone?)', e);
    return null;
  }
}

/** Normalize one governed-sheet row into a { taxonomy, slug, label } tag. */
function toTag(row) {
  const taxonomy = (row.taxonomy || row.facet || '').trim();
  const slug = (row.slug || row.value || '').trim();
  const label = (row.label || row.title || slug).trim();
  return { taxonomy, slug, label };
}

/**
 * Resolve the vocabulary. Fetch the governed DA Sheet (authenticated with the SDK token
 * when present, for a restricted sheet) so the client governs the list from a
 * spreadsheet; on any failure fall back to the built-in FALLBACK_TAGS. A tag needs both
 * a taxonomy and a slug to form its /en/tag/<taxonomy>/<slug>/ archive href.
 */
async function loadTags(sdk) {
  try {
    const headers = sdk?.token ? { Authorization: `Bearer ${sdk.token}` } : {};
    const res = await fetch(TAGS_SHEET, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const rows = json.data || json; // DA sheet-as-JSON wraps rows under `data`
    const list = rows.map(toTag).filter((t) => t.taxonomy && t.slug);
    return list.length ? list : FALLBACK_TAGS;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('tag-picker: tags sheet fetch failed, using built-in list', e);
    return FALLBACK_TAGS;
  }
}

/** The tags currently ticked, in list order, as { taxonomy, slug, label }. */
function selectedTags(root) {
  return [...root.querySelectorAll('input[type="checkbox"]:checked')].map((cb) => ({
    taxonomy: cb.dataset.taxonomy,
    slug: cb.dataset.slug,
    label: cb.dataset.label,
  }));
}

/** Group tags by taxonomy, preserving first-seen order of both facets and tags. */
function groupByFacet(list) {
  const groups = new Map();
  list.forEach((tag) => {
    if (!groups.has(tag.taxonomy)) groups.set(tag.taxonomy, []);
    groups.get(tag.taxonomy).push(tag);
  });
  return groups;
}

/**
 * Render the grouped checkbox list + toolbar into `root`. `state.sdk` may be null now
 * and set later once the DA connection lands; the returned `refresh` re-reads it to
 * enable Insert and update the help text. Everything paints without waiting for DA.
 */
function render(root, list, state) {
  root.textContent = '';

  const help = document.createElement('p');
  help.className = 'tp-help';
  root.append(help);

  // Typeahead filter: narrows the visible tags by label as the author types. Fixed above
  // the scrolling list so it stays put; ticked tags keep their state while filtering.
  const search = document.createElement('input');
  search.type = 'search';
  search.className = 'tp-search';
  search.placeholder = 'Filter tags…';
  search.setAttribute('aria-label', 'Filter tags');
  root.append(search);

  const fieldset = document.createElement('div');
  fieldset.className = 'tp-list';
  groupByFacet(list).forEach((tags, taxonomy) => {
    const group = document.createElement('div');
    group.className = 'tp-group';
    const heading = document.createElement('p');
    heading.className = 'tp-group-label';
    heading.textContent = taxonomy;
    group.append(heading);
    tags.forEach(({ slug, label }) => {
      const item = document.createElement('label');
      item.className = 'tp-item';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.value = `${taxonomy}/${slug}`;
      cb.dataset.taxonomy = taxonomy;
      cb.dataset.slug = slug;
      cb.dataset.label = label;
      const text = document.createElement('span');
      text.textContent = label;
      item.append(cb, text);
      group.append(item);
    });
    fieldset.append(group);
  });
  root.append(fieldset);

  // Hide any tag whose label doesn't contain the query; hide a whole facet group once
  // all of its items are filtered out. Empty query shows everything.
  const applyFilter = (q) => {
    const query = q.trim().toLowerCase();
    fieldset.querySelectorAll('.tp-group').forEach((group) => {
      let anyVisible = false;
      group.querySelectorAll('.tp-item').forEach((item) => {
        const { label } = item.querySelector('input').dataset;
        const match = !query || label.toLowerCase().includes(query);
        item.hidden = !match;
        if (match) anyVisible = true;
      });
      group.hidden = !anyVisible;
    });
  };
  search.addEventListener('input', () => applyFilter(search.value));

  const bar = document.createElement('div');
  bar.className = 'tp-bar';

  const count = document.createElement('span');
  count.className = 'tp-count';

  const refresh = () => {
    const n = selectedTags(root).length;
    count.textContent = n ? `${n} selected` : 'None selected';
    help.textContent = state.sdk
      ? 'Select one or more tags, then Insert.'
      : 'Preview only — open this inside da.live / Experience Workspace to insert.';
    // eslint-disable-next-line no-use-before-define
    insert.disabled = !state.sdk || n === 0;
  };
  fieldset.addEventListener('change', refresh);

  const selectAll = document.createElement('button');
  selectAll.type = 'button';
  selectAll.className = 'tp-btn';
  selectAll.textContent = 'Select all';
  selectAll.addEventListener('click', () => {
    // Act on what's currently visible, so it composes with the filter.
    fieldset.querySelectorAll('.tp-item:not([hidden]) input').forEach((cb) => { cb.checked = true; });
    refresh();
  });

  const clear = document.createElement('button');
  clear.type = 'button';
  clear.className = 'tp-btn';
  clear.textContent = 'Clear';
  clear.addEventListener('click', () => {
    fieldset.querySelectorAll('.tp-item:not([hidden]) input').forEach((cb) => { cb.checked = false; });
    refresh();
  });

  const insert = document.createElement('button');
  insert.type = 'button';
  insert.className = 'tp-btn tp-btn-primary';
  insert.textContent = 'Insert';
  insert.addEventListener('click', async () => {
    const tags = selectedTags(root);
    if (!state.sdk || !tags.length) return;
    await state.sdk.actions.sendHTML(buildTagsBlockHTML(tags));
    state.sdk.actions.closeLibrary?.();
  });

  bar.append(selectAll, clear, count, insert);
  root.append(bar);
  refresh();

  return { refresh };
}

async function init() {
  const root = document.querySelector('#app');
  const state = { sdk: null };
  // Paint the picker as soon as the vocabulary is in (a fast same-origin JSON fetch
  // with its own fallback). The DA connection (needed only for Insert) lands afterwards
  // and flips Insert on when ready, so the UI never blocks on the DA handshake (§3.4).
  // A public governed sheet is read anonymously here; a restricted sheet would need the
  // token, i.e. render a placeholder, connect, then load — see README.
  const list = await loadTags(state.sdk);
  const ui = render(root, list, state);
  state.sdk = await connect();
  ui.refresh();
}

init();
