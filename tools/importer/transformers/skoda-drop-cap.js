/*
 * Story drop cap: the source's `<span class="drop-cap" style="color: …; background-color: …">`
 * around the first body paragraph's first letter (22 of the 82 migrated stories). DA keeps
 * neither the class nor the inline colours, so:
 * - `markDropCap()` (the importer's `preprocess`, untouched DOM) records the letters and
 *   colours on <html>;
 * - `applyDropCap()` (after afterTransform, once the body's Section Metadata exists) adds the
 *   style `drop-cap` and rows `drop-cap-text`, `drop-cap-color`, `drop-cap-background`,
 *   `drop-cap-margin-bottom` to the Section Metadata of the body section that opens with those
 *   letters. scripts/drop-cap.js draws it.
 */

const ATTR = 'data-skoda-drop-cap';
const ROWS = [['text', 'drop-cap-text'], ['color', 'drop-cap-color'],
  ['background', 'drop-cap-background'], ['marginBottom', 'drop-cap-margin-bottom']];

const inline = (style, name) => {
  const decl = style.split(';').map((d) => d.split(':')).find(([prop]) => prop?.trim().toLowerCase() === name);
  return decl ? decl.slice(1).join(':').trim() : '';
};

/**
 * Records the body's drop cap. Returns what it found, or null.
 * @param {Document} document the untouched source document
 */
export function markDropCap(document) {
  const cap = document.querySelector('article .entry-content .drop-cap, article .content .drop-cap');
  const text = (cap?.textContent || '').trim();
  if (!text) return null;
  const style = cap.getAttribute('style') || '';
  const data = {
    text,
    color: inline(style, 'color'),
    background: inline(style, 'background-color'),
    marginBottom: inline(style, 'margin-bottom'),
  };
  document.documentElement.setAttribute(ATTR, JSON.stringify(data));
  return data;
}

const isSectionMetadata = (el) => el.tagName === 'TABLE'
  && /^section metadata$/i.test(((el.querySelector('tr > th, tr > td') || {}).textContent || '').trim());
// eslint-disable-next-line no-bitwise
const after = (a, b) => !!(a.compareDocumentPosition(b) & 4 /* DOCUMENT_POSITION_FOLLOWING */);

/**
 * Adds the drop cap to its body section's Section Metadata. Returns whether it did.
 * @param {Element} root the transformed page
 */
export function applyDropCap(root) {
  const html = root.ownerDocument.documentElement;
  const raw = html.getAttribute(ATTR);
  html.removeAttribute(ATTR);
  if (!raw) return false;
  const data = JSON.parse(raw);
  const doc = root.ownerDocument;
  const breaks = [...root.querySelectorAll('hr')].filter((hr) => !hr.closest('table'));
  const metas = [...root.querySelectorAll('table')].filter(isSectionMetadata);
  const styleRow = (table) => [...table.querySelectorAll('tr')]
    .find((tr) => tr.children.length > 1 && /^style$/i.test(tr.children[0].textContent.trim()));
  // the first body section: its Section Metadata, and the section's bounds
  const meta = metas.find((t) => /\bbody-column\b/.test(styleRow(t)?.children[1].textContent || ''));
  if (!meta) return false;
  const start = [...breaks].reverse().find((hr) => after(hr, meta));
  const end = breaks.find((hr) => after(meta, hr));
  const first = [...root.querySelectorAll('p')].find((p) => !p.closest('table') && p.textContent.trim()
    && (!start || after(start, p)) && (!end || after(p, end)));
  if (!first || !first.textContent.trim().startsWith(data.text)) return false;

  const cell = styleRow(meta).children[1];
  cell.textContent = `${cell.textContent.trim()}, drop-cap`;
  ROWS.forEach(([field, key]) => {
    if (!data[field]) return;
    const tr = doc.createElement('tr');
    [key, data[field]].forEach((value) => {
      tr.appendChild(doc.createElement('td')).textContent = value;
    });
    (meta.querySelector('tbody') || meta).appendChild(tr);
  });
  return true;
}

/**
 * Transformer hook form: `afterTransform` applies a recorded drop cap (the story importer calls
 * applyDropCap() itself, after the sections transformer has written the body's metadata).
 * @param {string} hookName
 * @param {Element} element
 */
export default function transform(hookName, element) {
  if (hookName === 'afterTransform') applyDropCap(element);
}
