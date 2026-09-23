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
 * METADATA FALLBACK (SKODA-401): when the block is authored with NO tag entries,
 * it falls back to the page's tags metadata — `getMetadata('article:tag')`, which
 * (because it contains ':') returns all <meta property="article:tag"> contents
 * joined with ', '. Each becomes a static label pill. This lets any imported page
 * that carries the standard comma-separated `tags` Metadata row (→ article:tag)
 * render its tags without the author re-listing them in the block. Authored tags
 * always win; the fallback only fires for an otherwise-empty block.
 *
 * Variants (extra classes on the block, read defensively):
 *   - (default)        grey→ink per-article label pill.
 *   - chips            green emerald filter/media-cart chip (facet contexts).
 *   - chips outline    outlined filter chip; fills emerald on hover/selected.
 * A tag marked as selected (wrapped in <strong>) gets `.active` + aria-current="true" (chips).
 */

import { getMetadata } from '../../scripts/aem.js';

export default function decorate(block) {
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

  // Fallback: no authored tags → derive from page metadata (article:tag).
  // Metadata tags are bare slugs (no per-tag taxonomy), so they render as static
  // labels — matching the spec's static-label path.
  if (!ul.children.length) {
    getMetadata('article:tag')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .forEach((text) => addTag(text));
  }

  block.replaceChildren(ul);
}
