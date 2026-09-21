/*
 * tags-block.js — builds the `Tags` block markup DA pastes into the document.
 *
 * Extracted from tag-picker.js so the output contract is importable by a plain node
 * smoke test (test.mjs) without loading the browser-only picker module. Keep the
 * emitted markup aligned with the SKODA-205 Tags-block spec (docs/ui-specs/tags.md):
 * one header row `Tags`, then one row with one cell per chosen tag. Each cell is an
 * anchor to the tag archive at /en/tag/<taxonomy>/<slug>/ (the two-segment pattern the
 * spec measured, §3 / §7), with the human label as the link text.
 */

/**
 * @param {{ taxonomy: string, slug: string, label: string }[]} tags selected tags, in list order
 * @returns {string} the Tags block table markup
 */
export function buildTagsBlockHTML(tags) {
  const cells = tags
    .map(({ taxonomy, slug, label }) => `<td><a href="/en/tag/${taxonomy}/${slug}/">${label}</a></td>`)
    .join('');
  return `<table><tbody><tr><th>Tags</th></tr><tr>${cells}</tr></tbody></table>`;
}

export default buildTagsBlockHTML;
