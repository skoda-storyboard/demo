/*
 * tags-block.js — builds the `Tags` block markup DA pastes into the document.
 *
 * Extracted from tag-picker.js so the output contract is importable by a plain node
 * smoke test (test.mjs) without loading the browser-only picker module. Keep the
 * emitted markup aligned with the SKODA-205 Tags-block spec (docs/ui-specs/tags.md):
 * one header row `Tags`, then ONE ROW PER chosen tag (a single-column table). Each
 * tag cell is an anchor to the tag archive at /en/tag/<taxonomy>/<slug>/ (the
 * two-segment pattern the spec measured, §3 / §7), with the human label as the link text.
 *
 * One-cell-per-row (not one row of N cells) is deliberate: DA's sendHTML normalizes a
 * table to a rectangle, so a single-cell `Tags` name row followed by an N-cell content
 * row gets padded with empty leading cells and the block name is pushed out of column 1
 * (verified in-editor: a 2-tag insert produced `<th></th><th>Tags</th>`). Keeping every
 * row single-column preserves the name-in-column-1 block contract for any tag count.
 */

/**
 * @param {{ taxonomy: string, slug: string, label: string }[]} tags selected tags, in list order
 * @returns {string} the Tags block table markup
 */
export function buildTagsBlockHTML(tags) {
  const rows = tags
    .map(({ taxonomy, slug, label }) => `<tr><td><a href="/en/tag/${taxonomy}/${slug}/">${label}</a></td></tr>`)
    .join('');
  return `<table><tbody><tr><th>Tags</th></tr>${rows}</tbody></table>`;
}

export default buildTagsBlockHTML;
