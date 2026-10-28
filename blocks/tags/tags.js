/*
 * Tags block (SKODA-205).
 *
 * Renders a page's taxonomy tags as an accessible, semantic pill list. Authored as a small DA
 * table — each cell (or each <a> within a cell) becomes one tag. A plain-text cell may also hold
 * several tags separated by commas or newlines (`Kamiq, Technology, Motorsport`), each of which
 * becomes its own pill. Links are preserved verbatim so their hrefs (tag-archive
 * `/en/tag/<taxonomy>/<slug>/` or listing facet `/en/news/?filter[…]`) stay aligned with the
 * SKODA-401 query-index facet taxonomy.
 *
 * TAGS ENTERED ONCE (SKODA-841): when the block is authored with NO tag entries, its pills come
 * from the page's metadata: one per facet value (`model`, `years`, …) and per `tags` value of a
 * non-facet vocabulary taxonomy (`crew`, `people`), labelled and linked as the source does
 * (scripts/tag-links.js: the `/config/tags.json` vocabulary, blocks/tags/tag-terms.json, the
 * index's tag archives). Authors then set the metadata only; an empty `Tags` table marks where
 * the pills go. Authored tags always win.
 * Last resort (SKODA-401): with nothing derivable, the `tags` metadata —
 * `getMetadata('article:tag')`, all <meta property="article:tag"> contents joined with ', ' — as
 * static label pills.
 *
 * Variants (extra classes on the block, read defensively):
 *   - (default)        grey→ink per-article label pill.
 *   - chips            green emerald filter/media-cart chip (facet contexts).
 *   - chips outline    outlined filter chip; fills emerald on hover/selected.
 * A tag marked as selected (wrapped in <strong>) gets `.active` + aria-current="true" (chips).
 */

import { getMetadata } from '../../scripts/aem.js';
import { loadQueryIndex } from '../../scripts/query-index.js';
import {
  derivedTags, loadVocabulary, loadTerms, archivePaths,
} from '../../scripts/tag-links.js';
import { INDEX_FACETS } from '../listing/listing-logic.mjs';

/**
 * The page's pills from its metadata (SKODA-841). The index only decides whether an archive link
 * stays on the site; without it every archive link points at the source, which is still correct.
 * @returns {Promise<{label: string, href: string}[]>}
 */
async function metadataTags() {
  const facets = Object.fromEntries(INDEX_FACETS.map((facet) => [facet, getMetadata(facet)]));
  const page = { template: getMetadata('template'), facets, tags: getMetadata('article:tag') };
  if (!Object.values(facets).some(Boolean) && !page.tags) return [];
  const [vocabulary, terms, rows] = await Promise.all([
    loadVocabulary(),
    loadTerms(),
    loadQueryIndex().catch(() => []),
  ]);
  return derivedTags(page, { vocabulary, terms, archives: archivePaths(rows) });
}

export default async function decorate(block) {
  const isChips = block.classList.contains('chips');

  const ul = document.createElement('ul');
  ul.className = 'tags-list';

  // Build one <li><a|span class="tag-label"> per tag. `href`/`title` come from an authored anchor;
  // `selected` marks the active chip (aria-current). Empty text is skipped.
  const addTag = (text, { href, title, selected } = {}) => {
    if (!text) return; // skip empty / whitespace-only entries
    const li = document.createElement('li');
    let el;
    if (href) {
      el = document.createElement('a');
      el.href = href;
      // preserve title only when it adds information beyond the visible text
      if (title && title.trim() && title.trim() !== text) el.title = title;
    } else {
      el = document.createElement('span');
    }
    el.className = 'tag-label';
    el.textContent = text;
    if (selected) {
      el.classList.add('active');
      el.setAttribute('aria-current', 'true');
    }
    li.append(el);
    ul.append(li);
  };

  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => {
      // A cell may hold one or more anchors, or plain text. Prefer explicit links.
      const anchors = [...cell.querySelectorAll('a')];

      if (anchors.length) {
        anchors.forEach((a) => {
          const text = a.textContent.trim();
          if (!text) return; // skip empty / whitespace-only entries
          addTag(text, {
            href: a.getAttribute('href'),
            title: a.getAttribute('title'),
            // Selected marker: authored as **text** → <strong> (chips facet context).
            selected: isChips && !!a.closest('strong'),
          });
        });
        return;
      }

      // Plain-text cell: one or more tags separated by commas or newlines.
      const selected = isChips && !!cell.querySelector('strong');
      cell.textContent
        .split(/[,\n]/)
        .map((t) => t.trim())
        .filter(Boolean)
        .forEach((text) => addTag(text, { selected }));
    });
  });

  // No authored tags → the metadata's pills (SKODA-841).
  if (!ul.children.length) {
    let derived = [];
    try {
      derived = await metadataTags();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('tags: could not derive the tags from the metadata', e);
    }
    derived.forEach(({ label, href }) => addTag(label, { href }));
  }

  // Last resort: bare `tags` slugs (no taxonomy to link), as static labels.
  if (!ul.children.length) {
    getMetadata('article:tag')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .forEach((text) => addTag(text));
  }

  block.replaceChildren(ul);
}
