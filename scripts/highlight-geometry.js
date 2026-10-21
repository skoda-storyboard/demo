/*
 * A story highlight panel's own source geometry (PO, 2026-10-13: the panel inset as the source).
 * The story importer carries a SiteOrigin layout's row padding, text-widget margin and gallery
 * margin, desktop and mobile, as Section Metadata rows (`highlight-margin: 0px 0px 0px 20px`).
 * Delivered pages have them as the section's data attributes. Each becomes four custom
 * properties on the section (`--hl-margin-d-left` …), which styles.css composes into the
 * panel's padding; anything else is ignored.
 * A panel's own colours (#516) travel the same way: `highlight-background`, `highlight-color`,
 * `highlight-link` (a hex colour each) → `--hl-bg`, `--hl-color`, `--hl-link`.
 */

const GEOMETRY_KEY = /^highlight-(padding|margin|gallery-margin)(-mobile)?$/;
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
export function applyHighlightGeometry(section, key, value) {
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
