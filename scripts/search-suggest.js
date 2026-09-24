/*
 * search-suggest.js — shared search-suggestion helper (SKODA-403).
 *
 * A live typeahead dropdown for a search <input>, index-driven from the
 * per-locale query-index (SKODA-401), matching the live header behaviour:
 * as-you-type suggestions (from 1 char), capped list, each row a page link
 * with a "date | section" meta line, no image. Index-only — title/summary/tags
 * matching, no body/relevance (that is Phase C, SKODA-901).
 *
 * Lives in /scripts/ (not a block) so the header (SKODA-301) and the search
 * results block (SKODA-403) can both use it without a cross-block import
 * (AGENTS.md: fragment.js is the only cross-block import). Vanilla, no deps.
 */

import { loadQueryIndex, defaultIndexUrl } from './query-index.js';

const MATCH_FIELDS = ['title', 'description', 'tags'];
const MAX_SUGGESTIONS = 5; // live cap (measured on the source)
const MIN_CHARS = 1; // live triggers from the first character

/** Rows whose title/description/tags contain every term (AND, case-insensitive). */
function matchRows(rows, query) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return rows.filter((row) => {
    const hay = MATCH_FIELDS.map((f) => String(row[f] || '')).join(' ').toLowerCase();
    return terms.every((t) => hay.includes(t));
  });
}

/** Derive the "section" label from a page path (e.g. /en/emobility/x → eMobility). */
function sectionOf(path) {
  const seg = String(path || '').split('/').filter(Boolean)[1] || '';
  if (!seg) return '';
  return seg.replace(/-/g, ' ').replace(/(^|\s)\S/g, (m) => m.toUpperCase());
}

/** Build the "date | section" meta line for a row (either part optional). */
function metaLine(row) {
  const parts = [];
  if (row.date) parts.push(row.date);
  const sec = sectionOf(row.path);
  if (sec) parts.push(sec);
  return parts.join(' | ');
}

/**
 * Attach a live suggestion dropdown to a search input.
 * @param {HTMLInputElement} input the search field
 * @param {object} [opts]
 * @param {string} [opts.source] index URL (default: current locale's query-index)
 * @param {Element} [opts.container] element to append the dropdown to (must be a
 *   positioned, non-`overflow:hidden` ancestor so the absolute list isn't
 *   clipped). Defaults to the input's parent.
 * @param {(query:string)=>void} [opts.onSubmit] called on Enter with the raw query
 * @returns {HTMLUListElement} the dropdown element
 */
export default function attachSuggest(input, opts = {}) {
  const source = opts.source || defaultIndexUrl();
  const listId = `${input.id || 'search'}-suggest`;

  const list = document.createElement('ul');
  list.className = 'search-suggest';
  list.id = listId;
  list.hidden = true;
  list.setAttribute('role', 'listbox');
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-controls', listId);
  input.setAttribute('aria-expanded', 'false');
  // append to the given container (a positioned, non-clipping ancestor) so the
  // absolutely-positioned dropdown isn't clipped by an overflow:hidden wrapper
  // (e.g. the header pill field). Falls back to inserting after the input.
  if (opts.container) opts.container.append(list);
  else input.after(list);

  let rows = null;
  let loadFailed = false;
  let active = -1; // keyboard-highlighted item index

  const ensureIndex = async () => {
    if (rows || loadFailed) return;
    try {
      rows = await loadQueryIndex(source);
    } catch (e) {
      loadFailed = true;
      // eslint-disable-next-line no-console
      console.error('search-suggest: index load failed', e);
    }
  };

  const close = () => {
    list.hidden = true;
    list.textContent = '';
    active = -1;
    input.setAttribute('aria-expanded', 'false');
  };

  const render = (matches) => {
    list.textContent = '';
    active = -1;
    if (!matches.length) { close(); return; }
    matches.forEach((row) => {
      const li = document.createElement('li');
      li.className = 'search-suggest-item';
      li.setAttribute('role', 'option');
      const a = document.createElement('a');
      a.className = 'search-suggest-link';
      a.href = row.path;
      const title = document.createElement('span');
      title.className = 'search-suggest-title';
      title.textContent = row.title || row.path;
      a.append(title);
      const meta = metaLine(row);
      if (meta) {
        const m = document.createElement('span');
        m.className = 'search-suggest-meta';
        m.textContent = meta;
        a.append(m);
      }
      li.append(a);
      list.append(li);
    });
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  };

  const update = async () => {
    const q = input.value.trim();
    if (q.length < MIN_CHARS) { close(); return; }
    await ensureIndex();
    if (loadFailed || !rows) { close(); return; }
    render(matchRows(rows, q).slice(0, MAX_SUGGESTIONS));
  };

  // debounce keystrokes; preload the index as soon as the field is focused
  let timer = 0;
  input.addEventListener('input', () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(update, 150);
  });
  input.addEventListener('focus', ensureIndex, { once: true });

  const links = () => [...list.querySelectorAll('.search-suggest-link')];
  const setActive = (i) => {
    const items = links();
    active = (i + items.length) % items.length;
    items.forEach((el, j) => el.classList.toggle('is-active', j === active));
    items[active]?.scrollIntoView({ block: 'nearest' });
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' && !list.hidden) {
      e.preventDefault();
      setActive(active + 1);
    } else if (e.key === 'ArrowUp' && !list.hidden) {
      e.preventDefault();
      setActive(active - 1);
    } else if (e.key === 'Enter') {
      const chosen = links()[active];
      if (chosen) {
        e.preventDefault();
        window.location.assign(chosen.href);
      } else if (opts.onSubmit) {
        e.preventDefault();
        opts.onSubmit(input.value);
      }
    } else if (e.key === 'Escape') {
      close();
    }
  });

  // close on outside click / blur
  document.addEventListener('click', (e) => {
    if (e.target !== input && !list.contains(e.target)) close();
  });

  return list;
}
