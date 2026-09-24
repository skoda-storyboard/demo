/*
 * Search block (SKODA-403) — index-only search RESULTS.
 *
 * Results-only by design: the site has ONE search input, in the header
 * (SKODA-301), which submits the query to this page as `?filter[search]=…`
 * (mirroring the live `/en/search/` IA — the results page carries no input of
 * its own). This block reads that query from the URL, searches the per-locale
 * `/{locale}/query-index.json` (the SKODA-401 index), and renders the matches.
 *
 * It matches only the indexed `title` / `description` / `tags` fields — no
 * full-text body relevance, fuzzy/typo tolerance, or ranking (that is the
 * hosted service in Phase C, SKODA-901; reduced recall is an accepted pilot
 * boundary). Results are link-only (no thumbnail) per the ticket.
 *
 * Vanilla, no dependencies. Reuses the shared query-index loader + placeholders
 * i18n, like the other index-driven blocks.
 *
 * Authoring: a `Search` block; an optional single config cell overrides the
 * index source (defaults to the current locale's query-index):
 *
 *   | Search |            |
 *   | source | /en/query-index.json |
 */

import { readBlockConfig } from '../../scripts/aem.js';
import { loadQueryIndex, defaultIndexUrl } from '../../scripts/query-index.js';
import { fetchPlaceholders } from '../../scripts/placeholders.js';

// UI strings resolve from the per-locale placeholders sheet (i18n architecture),
// with English defaults so the block works before any sheet is authored.
function buildStrings(ph) {
  return {
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

/**
 * Build one result <li>: a title link + optional summary. Link-only per the
 * ticket (renders result links to matched pages) and the Block Collection
 * Search pattern — NO thumbnail (the live card image comes from the ElasticPress
 * card-teaser this pilot deliberately does not replicate).
 */
function buildResult(row) {
  const li = document.createElement('li');
  li.className = 'search-result';

  const link = document.createElement('a');
  link.className = 'search-result-link';
  link.href = row.path;

  const title = document.createElement('span');
  title.className = 'search-result-title';
  title.textContent = row.title || row.path;
  link.append(title);

  li.append(link);

  if (row.description) {
    const desc = document.createElement('p');
    desc.className = 'search-result-desc';
    desc.textContent = row.description;
    li.append(desc);
  }
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

  // Results-only skeleton: an aria-live status + a results list. There is NO
  // input here by design — the site has a single search input in the header
  // (SKODA-301), which submits the query to this page as `?filter[search]=`
  // (matching the live `/en/search/` IA). This block reads that query from the
  // URL and renders the matching results.
  block.textContent = '';

  const status = document.createElement('p');
  status.className = 'search-status';
  status.setAttribute('aria-live', 'polite');
  status.textContent = STRINGS.prompt;

  const results = document.createElement('ul');
  results.className = 'search-results';
  results.id = `${uid}-results`;

  block.append(status, results);

  let rows = null;
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

  // Read the query from the URL and run the search. Accepts `?filter[search]=`
  // (the live header search form's param) and `?q=` (a shareable short form).
  const params = new URLSearchParams(window.location.search);
  const initialQuery = params.get('filter[search]') || params.get('q');
  if (initialQuery) {
    await ensureIndex();
    render(initialQuery);
  }
}
