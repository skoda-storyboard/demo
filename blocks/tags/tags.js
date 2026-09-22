/*
 * Tags block (SKODA-205).
 *
 * Renders a page's taxonomy tags as an accessible, semantic pill list. Authored as a small DA
 * table — each cell (or each <a> within a cell) becomes one tag. Links are preserved verbatim so
 * their hrefs (tag-archive `/en/tag/<taxonomy>/<slug>/` or listing facet `/en/news/?filter[…]`)
 * stay aligned with the SKODA-401 query-index facet taxonomy.
 *
 * Variants (extra classes on the block, read defensively):
 *   - (default)        grey→ink per-article label pill.
 *   - chips            green emerald filter/media-cart chip (facet contexts).
 *   - chips outline    outlined filter chip; fills emerald on hover/selected.
 * A tag marked as selected (wrapped in <strong>) gets `.active` + aria-current="true" (chips).
 */

export default function decorate(block) {
  const isChips = block.classList.contains('chips');

  const ul = document.createElement('ul');
  ul.className = 'tags-list';

  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => {
      // A cell may hold one or more anchors, or plain text. Prefer explicit links.
      const anchors = [...cell.querySelectorAll('a')];
      const items = anchors.length ? anchors : [cell];

      items.forEach((node) => {
        const text = node.textContent.trim();
        if (!text) return; // skip empty / whitespace-only entries

        const li = document.createElement('li');

        // Selected marker: authored as **text** → <strong> (chips facet context).
        const selected = isChips && !!node.closest('strong');

        const href = node.tagName === 'A' ? node.getAttribute('href') : null;
        let el;
        if (href) {
          el = document.createElement('a');
          el.href = href;
          // preserve title only when it adds information beyond the visible text
          const title = node.getAttribute('title');
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
      });
    });
  });

  block.replaceChildren(ul);
}
