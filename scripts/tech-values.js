/*
 * Technical values are authored as links to their sheet row, `/data/tech-data.json#<key>`
 * (SKODA-852, tools/tech-data/). The link keeps the value's source in the document, its
 * .plain.html and Markdown; on the page the value reads as text and keeps its key.
 */
const TECH_DATA_SHEET = '/data/tech-data.json';
// formatting a value may be wrapped in on its own (a Technical Data cell is <strong>value</strong>)
const WRAPPERS = new Set(['STRONG', 'B', 'EM', 'I']);

const isBlankText = (node) => node.nodeType === 3 && !node.textContent.trim();
/** The link is all its parent holds (whitespace aside), and the parent is a formatting wrapper. */
const isSoleContent = (a) => WRAPPERS.has(a.parentElement?.tagName)
  && [...a.parentElement.childNodes].every((n) => n === a || isBlankText(n));

/**
 * Turn each technical-data link under `root` into text that keeps its key in `data-tech-data`:
 * - the link alone in a <strong>/<em> (a stat cell): its text moves into that element, so the
 *   Columns (stats) decoration still splits value and unit (review P2 #4);
 * - anywhere else: a `<span class="tech-value">`.
 * Runs before button decoration, so a value in bold is never made a button.
 * @param {Element} root The main element (or any container)
 */
export default function decorateTechValues(root) {
  root.querySelectorAll(`a[href*="${TECH_DATA_SHEET}#"]`).forEach((a) => {
    let url;
    let key;
    try {
      url = new URL(a.getAttribute('href'), window.location.href);
      key = decodeURIComponent(url.hash.slice(1));
    } catch {
      return; // a malformed href stays the link the author wrote
    }
    if (url.pathname !== TECH_DATA_SHEET || !key) return;
    if (isSoleContent(a)) {
      const wrapper = a.parentElement;
      wrapper.classList.add('tech-value');
      wrapper.dataset.techData = key;
      wrapper.replaceChildren(...a.childNodes);
      return;
    }
    const span = document.createElement('span');
    span.className = 'tech-value';
    span.dataset.techData = key;
    span.append(...a.childNodes);
    a.replaceWith(span);
  });
}
