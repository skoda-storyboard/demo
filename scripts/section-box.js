/*
 * A story's boxed text (Section Metadata style `text-box`): the source editor's padded, coloured
 * box (`<div style="background: #cccccc; padding: 50px">`, the 4×4 press-kit note), carried by the
 * story importer as rows `box-background`, `box-padding`, `box-shadow`, `box-color`. Delivered
 * pages have the rows as the section's data attributes. Each valid value becomes a custom
 * property (`--box-background` …) that styles.css draws; anything else is ignored.
 */

const ROWS = {
  'box-background': 'boxBackground',
  'box-padding': 'boxPadding',
  'box-shadow': 'boxShadow',
  'box-color': 'boxColor',
};
const COLOR = /^(?:#[\da-f]{3}(?:[\da-f]{3})?|[a-z]{3,20})$/i;
const LENGTHS = /^(?:(?:0|\d{1,3}(?:\.\d+)?px)\s*){1,4}$/;
const SHADOW = /^(?:(?:-?(?:0|\d{1,2}(?:\.\d+)?px))\s+){2,4}(?:#[\da-f]{3}(?:[\da-f]{3})?|[a-z]{3,20})$/i;
const VALID = {
  boxBackground: COLOR, boxPadding: LENGTHS, boxShadow: SHADOW, boxColor: COLOR,
};
const PROPS = {
  boxBackground: '--box-background', boxPadding: '--box-padding', boxShadow: '--box-shadow', boxColor: '--box-color',
};

/**
 * Keeps one box Section Metadata row as the section's data attribute, as delivered pages do.
 * @param {HTMLElement} section
 * @param {string} key the row name, e.g. `box-background`
 * @param {string} value
 * @returns {boolean} whether it was a box row
 */
export function readBoxRow(section, key, value) {
  const name = ROWS[String(key || '').trim().toLowerCase()];
  if (!name) return false;
  section.dataset[name] = String(value || '').trim();
  return true;
}

/**
 * Sets a `text-box` section's custom properties from its (valid) box data.
 * @param {HTMLElement} section
 * @returns {number} how many were set
 */
export function decorateBox(section) {
  if (!section.classList.contains('text-box')) return 0;
  let set = 0;
  Object.entries(PROPS).forEach(([name, prop]) => {
    const value = (section.dataset[name] || '').trim();
    if (!value || !VALID[name].test(value)) return;
    section.style.setProperty(prop, value);
    set += 1;
  });
  return set;
}
