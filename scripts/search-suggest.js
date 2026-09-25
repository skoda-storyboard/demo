/*
 * search-suggest.js — shared search-suggestion helper (SKODA-403).
 *
 * A live typeahead dropdown for a search <input>, index-driven from the
 * per-locale query-index (SKODA-401), matching the live header behaviour:
 * as-you-type suggestions (from 1 char), capped list, each row a page link
 * with a "date | type" meta line, no image. Enter submits the typed query
 * unless a row was chosen with ↑/↓ (then it opens that row); the chosen row is
 * announced via aria-activedescendant. Index-only — title/summary/tags
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

// Public content-type label per index `template` — the source's search-type
// names (its Stories / News / Press Kits filter), not the URL section.
const TYPE_LABELS = {
  story: 'Stories',
  press_release: 'News',
  press_kit: 'Press Kits',
};

/** Display title (loadQueryIndex already strips the SEO site suffix, SKODA-610). */
function displayTitle(row) {
  return String(row.title || '').trim() || row.path;
}

/** Index ISO date (YYYY-MM-DD) → the source's "DD. MM. YYYY"; other values pass through. */
function displayDate(value) {
  const m = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}. ${m[2]}. ${m[1]}` : String(value || '');
}

/** Build the "date | type" meta line for a row (either part optional). */
function metaLine(row) {
  const parts = [];
  const date = displayDate(row.date);
  if (date) parts.push(date);
  const type = TYPE_LABELS[String(row.template || '').toLowerCase().replace(/-/g, '_')];
  if (type) parts.push(type);
  return parts.join(' | ');
}

/**
 * Leading search-magnifier icon for a suggestion row (Trusted-Types safe:
 * createElementNS, no innerHTML). Matches the source's per-row search glyph.
 * @returns {SVGElement}
 */
function searchIcon() {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('aria-hidden', 'true');
  const circle = document.createElementNS(NS, 'circle');
  circle.setAttribute('cx', '11');
  circle.setAttribute('cy', '11');
  circle.setAttribute('r', '7');
  const line = document.createElementNS(NS, 'line');
  line.setAttribute('x1', '16.5');
  line.setAttribute('y1', '16.5');
  line.setAttribute('x2', '21');
  line.setAttribute('y2', '21');
  line.setAttribute('stroke-linecap', 'round');
  svg.append(circle, line);
  return svg;
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
  let active = -1; // row chosen with ↑/↓; -1 = none (Enter submits the query)

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
    input.removeAttribute('aria-activedescendant');
  };

  const render = (matches) => {
    list.textContent = '';
    active = -1;
    input.removeAttribute('aria-activedescendant');
    if (!matches.length) { close(); return; }
    matches.forEach((row, i) => {
      const li = document.createElement('li');
      li.className = 'search-suggest-item';
      li.id = `${listId}-option-${i}`;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', 'false');
      const a = document.createElement('a');
      a.className = 'search-suggest-link';
      a.href = row.path;

      // leading search glyph (matches the source per-row icon)
      const icon = document.createElement('span');
      icon.className = 'search-suggest-icon';
      icon.append(searchIcon());
      a.append(icon);

      // stacked title + "date | section" meta
      const text = document.createElement('span');
      text.className = 'search-suggest-text';
      const title = document.createElement('span');
      title.className = 'search-suggest-title';
      title.textContent = displayTitle(row);
      text.append(title);
      const meta = metaLine(row);
      if (meta) {
        const m = document.createElement('span');
        m.className = 'search-suggest-meta';
        m.textContent = meta;
        text.append(m);
      }
      a.append(text);

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
  // one source of truth for the chosen row: highlight (.is-active), the
  // option's aria-selected, and the input's aria-activedescendant
  const setActive = (i) => {
    const items = links();
    if (!items.length) return;
    active = (i + items.length) % items.length;
    items.forEach((el, j) => {
      el.classList.toggle('is-active', j === active);
      el.parentElement.setAttribute('aria-selected', j === active ? 'true' : 'false');
    });
    input.setAttribute('aria-activedescendant', items[active].parentElement.id);
    items[active].scrollIntoView({ block: 'nearest' });
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' && !list.hidden) {
      e.preventDefault();
      setActive(active + 1);
    } else if (e.key === 'ArrowUp' && !list.hidden) {
      e.preventDefault();
      // from "none chosen", ↑ goes to the last row
      setActive(active < 0 ? links().length - 1 : active - 1);
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
