/*
 * A story highlight panel's own source geometry (PO, 2026-10-13: the panel inset as the source).
 * The story importer carries a SiteOrigin layout's row padding, text-widget margin and gallery
 * margin, desktop and mobile, as Section Metadata rows (`highlight-margin: 0px 0px 0px 20px`).
 * Delivered pages have them as the section's data attributes. Each becomes four custom
 * properties on the section (`--hl-margin-d-left` …), which styles.css composes into the
 * panel's padding; anything else is ignored.
 * A panel's own colours (#516) travel the same way: `highlight-background`, `highlight-color`,
 * `highlight-link` (a hex colour each) → `--hl-bg`, `--hl-color`, `--hl-link`.
 * A two-column panel's own cell geometry (SKODA-227) as well: `highlight-cell-margin[-mobile]`,
 * `highlight-cell-padding[-mobile]`, one box per cell joined by " | ", → each Columns cell's
 * `--hl-cell-margin-d-left` … and the section's `hl-cells` class.
 */

const GEOMETRY_KEY = /^highlight-(padding|margin|gallery-margin)(-mobile)?$/;
// a two-column panel's own cell geometry (SKODA-227): one box per Columns cell, " | " between
const CELL_KEY = /^highlight-cell-(margin|padding)(-mobile)?$/;
const MAX_CELLS = 4;
const PX = /^(?:0|\d+(?:\.\d+)?px)$/;
const SIDES = ['top', 'right', 'bottom', 'left'];
const NAMES = { padding: 'pad', margin: 'margin', 'gallery-margin': 'gallery' };
const COLOUR_KEYS = { 'highlight-background': '--hl-bg', 'highlight-color': '--hl-color', 'highlight-link': '--hl-link' };
const HEX = /^#(?:[\da-f]{3}|[\da-f]{6})$/i;

/**
 * Applies one geometry row to its section.
 * @param {HTMLElement} section
 * @param {string} key the row name, e.g. `highlight-margin-mobile`
 * @param {string} value a 1–4 value box of px lengths (or 0)
 * @returns {boolean} whether it was a valid geometry row
 */
/** `0 15px` → [t, r, b, l] px strings; null for anything but 1–4 px lengths (or 0). */
function box(value) {
  const parts = String(value || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length || parts.length > 4 || !parts.every((v) => PX.test(v))) return null;
  const [t, r = t, b = t, l = r] = parts.map((v) => (v === '0' ? '0px' : v));
  return [t, r, b, l];
}

/**
 * A two-column panel's cell row (`highlight-cell-margin: 0px 0px 0px 15px | 0px 10px 0px 0px`):
 * each valid box becomes its cell's `--hl-cell-margin-d-top` … custom properties, by position in
 * the panel's Columns row (styles.css adds them to the cell's padding); the section gets
 * `hl-cells`, which hands the panel's inset to its cells. A malformed box leaves its cell alone.
 * @returns {boolean} whether it was a valid cell row
 */
function applyCellGeometry(section, match, value) {
  const boxes = String(value || '').split('|').map(box);
  const cells = [...section.querySelectorAll('.columns > div:first-child > div')];
  if (!boxes.some(Boolean) || !cells.length || boxes.length > MAX_CELLS) return false;
  const band = match[2] ? 'm' : 'd';
  boxes.forEach((sides, i) => {
    if (!sides || !cells[i]) return;
    sides.forEach((v, s) => cells[i].style.setProperty(`--hl-cell-${match[1]}-${band}-${SIDES[s]}`, v));
  });
  section.classList.add('hl-cells');
  return true;
}

export function applyHighlightGeometry(section, key, value) {
  const cell = String(key || '').trim().toLowerCase().match(CELL_KEY);
  if (cell) return applyCellGeometry(section, cell, value);
  const colour = COLOUR_KEYS[String(key || '').trim().toLowerCase()];
  if (colour) {
    const v = String(value || '').trim();
    if (!HEX.test(v)) return false;
    section.style.setProperty(colour, v);
    return true;
  }
  const match = String(key || '').trim().toLowerCase().match(GEOMETRY_KEY);
  const parts = String(value || '').trim().split(/\s+/).filter(Boolean);
  if (!match || !parts.length || parts.length > 4 || !parts.every((v) => PX.test(v))) return false;
  const [t, r = t, b = t, l = r] = parts.map((v) => (v === '0' ? '0px' : v));
  const band = match[2] ? 'm' : 'd';
  [t, r, b, l].forEach((v, i) => section.style.setProperty(`--hl-${NAMES[match[1]]}-${band}-${SIDES[i]}`, v));
  return true;
}

/**
 * Applies the geometry a delivered section carries as data attributes
 * (`data-highlight-margin` …).
 * @param {HTMLElement} section
 */
export function applyHighlightDataset(section) {
  Object.entries(section.dataset).forEach(([name, value]) => {
    applyHighlightGeometry(section, name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`), value);
  });
}
