/*
 * Search block (SKODA-403) — index-only site search.
 *
 * Pilot search over the per-locale `/{locale}/query-index.json` (the SKODA-401
 * index). Matches the source ElasticPress search page's SHAPE (a search input +
 * a list of result links) but NOT its engine: this matches only the indexed
 * `title` / `description` / `tags` fields — no full-text body relevance, no
 * fuzzy/typo tolerance, no ranking. Body-relevance search is a separate hosted
 * service fed by the same index in Phase C (SKODA-901). Reduced recall vs the
 * source is a known, accepted pilot boundary.
 *
 * Vanilla, no dependencies. Reuses the shared query-index loader + placeholders
 * i18n + createOptimizedPicture, like the other index-driven blocks.
 *
 * Authoring: a `Search` block; an optional single config cell overrides the
 * index source (defaults to the current locale's query-index):
 *
 *   | Search |            |
 *   | source | /en/query-index.json |
 */

import { createOptimizedPicture, readBlockConfig } from '../../scripts/aem.js';
import { loadQueryIndex, defaultIndexUrl } from '../../scripts/query-index.js';
import { fetchPlaceholders } from '../../scripts/placeholders.js';

// UI strings resolve from the per-locale placeholders sheet (i18n architecture),
// with English defaults so the block works before any sheet is authored.
function buildStrings(ph) {
  return {
    label: ph.searchLabel || 'Search',
    placeholder: ph.searchPlaceholder || 'Search',
    // aria-live result summaries (%d / %q are substituted)
    resultsCount: ph.searchResultsCount || '%d results for “%q”',
    resultsOne: ph.searchResultsOne || '1 result for “%q”',
    noResults: ph.searchNoResults || 'No results for “%q”.',
    prompt: ph.searchPrompt || 'Type to search.',
    loadError: ph.searchLoadError || 'Could not load the search index.',
  };
}

let instanceSeq = 0; // per-page counter → unique element ids when >1 search on a page

// the indexed fields this pilot matches against (title/summary/tags only)
const MATCH_FIELDS = ['title', 'description', 'tags'];

/** Fill a template string's %q (query) / %d (count) tokens. */
function format(tpl, { q = '', d = 0 } = {}) {
  return tpl.replace('%q', q).replace('%d', String(d));
}

/**
 * Read the optional leading config row into settings. A key/value row has
 * exactly two cells; `source` overrides the index URL. Consumes the row.
 * @param {Element} block
 * @returns {{source: string}}
 */
function readConfig(block) {
  const cfg = readBlockConfig(block);
  return { source: (cfg.source || '').trim() };
}

/**
 * Pure matcher: rows whose title/description/tags contain every whitespace-
 * separated term (case-insensitive, AND). Empty query → no results (the page
 * shows the prompt instead). Index-only: never looks at page body text.
 * @param {Array<object>} rows the query-index rows
 * @param {string} query raw user input
 * @returns {Array<object>} matching rows (index order preserved)
 */
export function matchRows(rows, query) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return rows.filter((row) => {
    const hay = MATCH_FIELDS.map((f) => String(row[f] || '')).join(' ').toLowerCase();
    return terms.every((t) => hay.includes(t));
  });
}

/** Build one result <li>: thumbnail (if any) + title link + description. */
function buildResult(row) {
  const li = document.createElement('li');
  li.className = 'search-result';

  const link = document.createElement('a');
  link.className = 'search-result-link';
  link.href = row.path;

  if (row.image) {
    const fig = document.createElement('span');
    fig.className = 'search-result-image';
    fig.append(createOptimizedPicture(row.image, '', false, [{ width: '400' }]));
    link.append(fig);
  }

  const body = document.createElement('span');
  body.className = 'search-result-body';
  const title = document.createElement('span');
  title.className = 'search-result-title';
  title.textContent = row.title || row.path;
  body.append(title);
  if (row.description) {
    const desc = document.createElement('span');
    desc.className = 'search-result-desc';
    desc.textContent = row.description;
    body.append(desc);
  }
  link.append(body);

  li.append(link);
  return li;
}

/**
 * @param {Element} block the search block element
 */
export default async function decorate(block) {
  const cfg = readConfig(block);
  instanceSeq += 1;
  const uid = `search-${instanceSeq}`;
  const STRINGS = buildStrings(await fetchPlaceholders());

  // Skeleton: a labelled search form + an aria-live status + a results list.
  block.textContent = '';

  const form = document.createElement('form');
  form.className = 'search-box';
  form.setAttribute('role', 'search');

  const label = document.createElement('label');
  label.className = 'sr-only';
  label.setAttribute('for', `${uid}-input`);
  label.textContent = STRINGS.label;

  const input = document.createElement('input');
  input.type = 'search';
  input.id = `${uid}-input`;
  input.className = 'search-input';
  input.setAttribute('placeholder', STRINGS.placeholder);
  input.setAttribute('autocomplete', 'off');
  input.setAttribute('enterkeyhint', 'search');
  input.setAttribute('aria-controls', `${uid}-results`);

  form.append(label, input);

  // status: announces the result count / prompt / errors to assistive tech
  const status = document.createElement('p');
  status.className = 'search-status';
  status.setAttribute('aria-live', 'polite');
  status.textContent = STRINGS.prompt;

  const results = document.createElement('ul');
  results.className = 'search-results';
  results.id = `${uid}-results`;

  block.append(form, status, results);

  let rows = null; // lazily loaded, then cached by the shared loader
  let loadFailed = false;

  const render = (query) => {
    results.textContent = '';
    const q = query.trim();
    if (!q) { status.textContent = STRINGS.prompt; return; }
    if (loadFailed || !rows) { status.textContent = STRINGS.loadError; return; }

    const matches = matchRows(rows, q);
    if (!matches.length) {
      status.textContent = format(STRINGS.noResults, { q });
      return;
    }
    const tpl = matches.length === 1 ? STRINGS.resultsOne : STRINGS.resultsCount;
    status.textContent = format(tpl, { q, d: matches.length });
    const frag = document.createDocumentFragment();
    matches.forEach((row) => frag.append(buildResult(row)));
    results.append(frag);
  };

  // load the index on first interaction (keeps it off the critical path)
  const ensureIndex = async () => {
    if (rows || loadFailed) return;
    try {
      rows = await loadQueryIndex(cfg.source || defaultIndexUrl());
    } catch (e) {
      loadFailed = true;
      // eslint-disable-next-line no-console
      console.error('search: index load failed', e);
    }
  };

  // debounce input so we don't re-render on every keystroke
  let timer = 0;
  const onInput = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(async () => {
      await ensureIndex();
      render(input.value);
    }, 200);
  };

  input.addEventListener('input', onInput);
  input.addEventListener('focus', ensureIndex, { once: true });
  // Enter submits the form — render immediately, don't navigate/reload
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    window.clearTimeout(timer);
    await ensureIndex();
    render(input.value);
  });

  // deep-link: ?q=octavia pre-fills and runs the search (shareable result URL)
  const initialQuery = new URLSearchParams(window.location.search).get('q');
  if (initialQuery) {
    input.value = initialQuery;
    await ensureIndex();
    render(initialQuery);
  }
}
