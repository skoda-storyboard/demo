/*
 * Technical values are authored as links to their sheet row, `/data/tech-data.json#<key>`
 * (SKODA-852, tools/tech-data/). The link keeps the value's source in the document, its
 * .plain.html and Markdown; on the page the value reads as text, so it becomes a span that
 * keeps the key.
 */
const TECH_DATA_SHEET = '/data/tech-data.json';

/**
 * Replace each technical-data link under `root` with `<span class="tech-value" data-tech-data>`.
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
    const span = document.createElement('span');
    span.className = 'tech-value';
    span.dataset.techData = key;
    span.append(...a.childNodes);
    a.replaceWith(span);
  });
}
