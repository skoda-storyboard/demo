/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Škoda model-page Tags block (afterTransform).
 *
 * The live Elroq model page carries NO `ol.entry-tags` markup (article tags render only on
 * story / press-release templates). To exercise the SKODA-205 `tags` block on real served
 * content, this transformer SYNTHESISES a Tags block (plus its `chips` variants) from the page's
 * genuine taxonomy. Hrefs use the press-release LISTING FACET pattern
 * `/en/news/?filter[<taxonomy>][]=<value>` (see the linked Superb press release), aligned with the
 * SKODA-401 facet taxonomy (model / technology / years). The values are synthesised (the source
 * model page carries no tag row); the link shape mirrors the real press-release tags.
 *
 * Emits three block tables just before the Metadata block:
 *   - `Tags`                  → default grey→ink label pills (per-article style).
 *   - `Tags (chips)`          → green filter-chip variant; the model's own tag is marked
 *                               selected (wrapped in <strong>) → runtime adds `.active` + aria.
 *   - `Tags (chips outline)`  → outlined filter-chip variant; selected tag marked the same way.
 * Each block sits in its own section (leading <hr>) so decorateSections renders it standalone.
 *
 * afterTransform only (appended output, not parser input). Idempotent: no-op if a Tags block
 * already exists.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

// Listing facet URLs, matching the press-release tag pattern /en/news/?filter[<taxonomy>][]=<value>
// (SKODA-401 facet taxonomy). label → href.
const TAGS = [
  { label: '2026', href: '/en/news/?filter[years][]=2026' },
  { label: 'eMobility', href: '/en/news/?filter[technology][]=emobility' },
  { label: 'Elroq', href: '/en/news/?filter[model][]=elroq', selected: true },
];

// Detect an already-present Tags block table (first row cell starts with 'tags').
function hasTagsBlock(element) {
  const tables = element.querySelectorAll('table');
  for (const t of tables) {
    const firstCell = t.querySelector('tr th, tr td');
    if (firstCell && firstCell.textContent.trim().toLowerCase().startsWith('tags')) {
      return true;
    }
  }
  return false;
}

// Build a single row of tag anchors. When `markSelected`, wrap the selected tag in <strong>
// (the chips variant reads that as the active/selected facet).
function tagRow(document, markSelected) {
  return TAGS.map((tag) => {
    const a = document.createElement('a');
    a.href = tag.href;
    a.textContent = tag.label;
    if (markSelected && tag.selected) {
      const strong = document.createElement('strong');
      strong.append(a);
      return strong;
    }
    return a;
  });
}

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.afterTransform) return;
  if (hasTagsBlock(element)) return; // idempotent

  const { document } = payload;

  // Metadata block (appended earlier in afterTransform) must stay last; insert Tags before it.
  const metaTable = [...element.querySelectorAll('table')].find((t) => {
    const c = t.querySelector('tr th, tr td');
    return c && c.textContent.trim().toLowerCase() === 'metadata';
  });
  const anchor = metaTable || null;

  const insert = (node) => {
    if (anchor) anchor.before(node);
    else element.append(node);
  };

  // Default Tags block — its own section.
  insert(document.createElement('hr'));
  insert(WebImporter.DOMUtils.createTable([['Tags'], tagRow(document, false)], document));

  // Chips variant — its own section, selected tag marked.
  insert(document.createElement('hr'));
  insert(WebImporter.DOMUtils.createTable([['Tags (chips)'], tagRow(document, true)], document));

  // Chips outline variant — its own section, selected tag marked.
  insert(document.createElement('hr'));
  insert(WebImporter.DOMUtils.createTable([['Tags (chips, outline)'], tagRow(document, true)], document));
}
