/*
 * A story's drop cap (the source's `span.drop-cap`, 22 of the 82 migrated stories): the body's
 * first letter as a 100×100 block floated left, the letter light, uppercase and centred, in the
 * story's own colours (a green letter on black unless the story sets its own).
 *
 * The story importer carries it on the first body section's Section Metadata: style
 * `drop-cap`, plus rows `drop-cap-text` (the letters the source wraps, e.g. `“T`),
 * `drop-cap-color`, `drop-cap-background` and `drop-cap-margin-bottom`, each optional. Delivered
 * pages have the rows as the section's data attributes. Invalid values are ignored, so the
 * styles.css defaults apply.
 *
 * The visible letter is decorative (aria-hidden). A visually hidden copy stays inline before
 * the rest of the word, so assistive tech reads "Sitting", not "S" and then "itting".
 */

const ROWS = {
  'drop-cap-text': 'dropCapText',
  'drop-cap-color': 'dropCapColor',
  'drop-cap-background': 'dropCapBackground',
  'drop-cap-margin-bottom': 'dropCapMarginBottom',
};
const COLOR = /^(?:#[\da-f]{3}(?:[\da-f]{3})?|[a-z]{3,20})$/i;
const PX = /^(?:0|\d{1,3}(?:\.\d+)?px)$/;
const MAX_LETTERS = 3; // a letter with its opening quote (`“T`)

/**
 * Keeps one drop-cap Section Metadata row as the section's data attribute, as delivered pages
 * carry it.
 * @param {HTMLElement} section
 * @param {string} key the row name, e.g. `drop-cap-color`
 * @param {string} value
 * @returns {boolean} whether it was a drop-cap row
 */
export function readDropCapRow(section, key, value) {
  const name = ROWS[String(key || '').trim().toLowerCase()];
  if (!name) return false;
  section.dataset[name] = String(value || '').trim();
  return true;
}

/**
 * Wraps a `drop-cap` section's first letter(s): the first text of its first paragraph.
 * @param {HTMLElement} section
 * @returns {HTMLElement|null} the visible drop cap, or null when the section has none
 */
export function decorateDropCap(section) {
  if (!section.classList.contains('drop-cap') || section.querySelector('.drop-cap-letter')) return null;
  const p = [...section.querySelectorAll('p')].find((el) => el.textContent.trim());
  if (!p) return null;
  const walker = p.ownerDocument.createTreeWalker(p, 4 /* NodeFilter.SHOW_TEXT */);
  let node = walker.nextNode();
  while (node && !node.textContent.trim()) node = walker.nextNode();
  if (!node) return null;

  const offset = node.textContent.length - node.textContent.trimStart().length;
  const content = node.textContent.slice(offset);
  const {
    dropCapText = '', dropCapColor = '', dropCapBackground = '', dropCapMarginBottom = '',
  } = section.dataset;
  const authored = dropCapText && [...dropCapText].length <= MAX_LETTERS
    && content.startsWith(dropCapText);
  const letters = authored ? dropCapText : [...content][0];

  const doc = p.ownerDocument;
  const rest = node.splitText(offset);
  rest.splitText(letters.length);
  const cap = doc.createElement('span');
  cap.className = 'drop-cap-letter';
  cap.setAttribute('aria-hidden', 'true');
  cap.textContent = letters;
  const spoken = doc.createElement('span');
  spoken.className = 'drop-cap-spoken';
  spoken.textContent = letters;
  rest.replaceWith(cap, spoken);

  if (COLOR.test(dropCapColor)) section.style.setProperty('--drop-cap-color', dropCapColor);
  if (COLOR.test(dropCapBackground)) section.style.setProperty('--drop-cap-background', dropCapBackground);
  if (PX.test(dropCapMarginBottom)) section.style.setProperty('--drop-cap-margin-bottom', dropCapMarginBottom === '0' ? '0px' : dropCapMarginBottom);
  return cap;
}
