/* global WebImporter */

/**
 * Transformer: the company pages' people (SKODA-810a, docs/ui-specs/company-pages.md).
 *
 * The Contacts and Board of Management bodies are SiteOrigin rows of person cards: one editor
 * widget per cell with the name and title (bold), the 16:9 portrait, then the e-mail / phone
 * and LinkedIn lines. A board card adds the `ys-row-toggle` "show more" and a nested builder
 * with the photo set and the CV / photos / press-release links.
 *
 * Runs in beforeTransform right after skoda-page-rows (which makes each row a `page-body`
 * section) and before the cleanup:
 *   - a row of person cards → one block, a row per card: `Contact Directory` [card], or
 *     `Exec Bio` [card, panel] where the panel cell starts with the toggle's label;
 *   - a `skoda-offset` spacer → its own section: `Spacer` 24px (the offset, shown from 720px)
 *     and `Spacer (line)` 10px (the widget's bottom inset, at every width). The source draws
 *     a spacer row 44px tall from 720 and 20px below; the content after a spacer in the same
 *     cell (the board's "Chief Officers" heading) starts a section of its own;
 *   - (preprocess) a paragraph's trailing blank line `<br>&nbsp;` is kept;
 *   - a row with the source's `pull-up` style (20px into the row before, from 768px) adds
 *     `pull-up` to its section style.
 * Content-driven: a card is a cell whose editor widget holds an image and bold text.
 */

// the section mark skoda-page-rows reads in afterTransform (keep in sync with that file)
const MARK = 'data-skoda-page-body';
const BODY = 'page-body';
const PULL_UP = 'pull-up';
const SPACER_PX = 24;
const SPACER_INSET_PX = 10;

// skoda-nbsp's placeholder for U+00A0 (keep in sync with that file and push-lib.mjs)
const NBSP_PLACEHOLDER = '\u{F00A0}';
// the delivery pipeline trims a paragraph's trailing whitespace, a non-breaking space too, so a
// trailing blank line also gets a word joiner (U+2060: no width, not whitespace, not read out)
const LINE_KEEPER = '\u2060';
const NBSP_ONLY = /^[\s\u00a0]*\u00a0[\s\u00a0]*$/;

const KEEP = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'A', 'IMG', 'UL', 'OL', 'LI']);

// the row's cells (SiteOrigin wraps them in `.panel-row-style` on a styled row)
const cellsOf = (row) => [...row.children]
  .flatMap((child) => (child.matches('.panel-row-style') ? [...child.children] : [child]))
  .filter((c) => c.matches('.panel-grid-cell'));

// a cell's widgets, in order (a styled cell wraps them in `.panel-cell-style`)
const widgetsOf = (cell) => [...cell.querySelectorAll('.so-panel')]
  .filter((w) => w.parentElement.closest('.panel-grid-cell') === cell);

const isSpacer = (widget) => widget.matches('.widget_skoda-offset');
const isToggle = (widget) => widget.matches('.widget_ys-row-toggle');
const isBuilder = (widget) => widget.matches('.widget_siteorigin-panels-builder');
const isEditor = (widget) => widget.matches('.widget_sow-editor');

/**
 * A cell is a person card when its first editor widget holds an image and bold text, and the
 * card a contact's e-mail or a board member's "show more" toggle (not a logo tile's bold
 * download links, SKODA-810b).
 */
function isCard(cell) {
  const editor = widgetsOf(cell).find(isEditor);
  if (!editor?.querySelector('img') || !editor.querySelector('strong, b')) return false;
  return !!editor.querySelector('a[href^="mailto:"]') || widgetsOf(cell).some(isToggle);
}

/** Clean copies of an editor's blocks: paragraphs, bold, breaks, links (href, target), images. */
function cleanNodes(source, document) {
  const clean = (node) => {
    if (node.nodeType === 3) return [document.createTextNode(node.textContent)];
    if (node.nodeType !== 1) return [];
    const kids = [...node.childNodes].flatMap(clean);
    if (!KEEP.has(node.tagName)) return kids;
    const el = document.createElement(node.tagName.toLowerCase());
    if (node.tagName === 'A' && node.getAttribute('href')) el.setAttribute('href', node.getAttribute('href'));
    if (node.tagName === 'IMG') {
      el.setAttribute('src', node.getAttribute('src') || '');
      el.setAttribute('alt', node.getAttribute('alt') || '');
      return [el];
    }
    el.append(...kids);
    return [el];
  };
  const text = source?.querySelector('.siteorigin-widget-tinymce, .textwidget') || source;
  return [...(text?.childNodes || [])].flatMap(clean)
    .filter((n) => !(n.nodeType === 3 && !n.textContent.trim()))
    .filter((n) => !(n.tagName === 'P' && !n.textContent.trim() && !n.querySelector('img, a')));
}

/** The board card's panel: the toggle label, the photo set (one image each), the links. */
function panelOf(cell, document) {
  const widgets = widgetsOf(cell);
  const toggle = widgets.find(isToggle);
  const builder = widgets.find(isBuilder);
  const label = document.createElement('p');
  label.textContent = (toggle?.textContent || '').replace(/\s+/g, ' ').trim() || 'show more';
  const out = [label];
  builder?.querySelectorAll('.gallery-item').forEach((item) => {
    const link = item.querySelector('a[href]');
    const img = item.querySelector('img');
    if (!link && !img) return;
    const p = document.createElement('p');
    const pic = document.createElement('img');
    // the full photo the source's lightbox shows (its link), else the thumbnail
    pic.setAttribute('src', (link?.getAttribute('href') || img.getAttribute('src') || '').split('#')[0]);
    pic.setAttribute('alt', img?.getAttribute('alt') || '');
    p.append(pic);
    // the source crops each photo from its top or centre (`snap-top` / `snap-center`); the
    // block takes top for a portrait photo and centre for a landscape one, so only a photo the
    // source sets otherwise carries the word (blocks/exec-bio photoPosition)
    const snap = (item.querySelector('.image-holder')?.className.match(/\bsnap-(top|center)\b/) || [])[1];
    const portrait = Number(img?.getAttribute('height')) > Number(img?.getAttribute('width'));
    if (snap && snap !== (portrait ? 'top' : 'center')) p.append(` ${snap}`);
    out.push(p);
  });
  // the links under the photo set (the set itself sits in the same editor widget)
  builder?.querySelectorAll('.so-panel.widget_sow-editor').forEach((editor) => {
    const copy = editor.cloneNode(true);
    copy.querySelectorAll('.search-results, .gallery-item').forEach((el) => el.remove());
    out.push(...cleanNodes(copy, document));
  });
  return out;
}

/** A row of person cards as one block. */
function peopleBlock(cards, document) {
  const bio = cards.some((cell) => widgetsOf(cell).some(isToggle));
  const rows = cards.map((cell) => {
    const card = cleanNodes(widgetsOf(cell).find(isEditor), document);
    return bio ? [card, panelOf(cell, document)] : [card];
  });
  return WebImporter.DOMUtils.createTable([[bio ? 'Exec Bio' : 'Contact Directory'], ...rows], document);
}

function spacerTables(document) {
  return [
    WebImporter.DOMUtils.createTable([['Spacer'], [`${SPACER_PX}px`]], document),
    WebImporter.DOMUtils.createTable([['Spacer (line)'], [`${SPACER_INSET_PX}px`]], document),
  ];
}

/** A new `page-body` section after `anchor`, holding `nodes`. */
function sectionAfter(anchor, nodes, document) {
  const holder = document.createElement('div');
  holder.setAttribute(MARK, BODY);
  holder.append(...nodes);
  anchor.after(document.createElement('hr'), holder);
  return holder;
}

/** A row with spacers: each spacer its own section; the widgets after it, the next one. */
function splitSpacers(row, document) {
  const cells = cellsOf(row);
  const widgets = cells.flatMap(widgetsOf);
  if (!widgets.some(isSpacer)) return;
  // the content after the first spacer, in order (a spacer-only row keeps none)
  const rest = [];
  let seen = false;
  widgets.forEach((w) => {
    if (isSpacer(w)) { seen = true; return; }
    if (seen) rest.push(w);
  });
  const before = widgets.slice(0, widgets.findIndex(isSpacer)).filter((w) => !isSpacer(w));
  row.replaceChildren(...before, ...spacerTables(document));
  if (rest.length) sectionAfter(row, rest, document);
}

/**
 * Preprocess: a paragraph that ends or starts on a blank line (`…<br>&nbsp;</p>`, Martina
 * Biene's card; `<p>&nbsp;<br>Download…`, the app page's panel heading) keeps it. html2md
 * drops a whitespace-only run, so its non-breaking space becomes skoda-nbsp's placeholder
 * (U+00A0 again in DA), and the text stays as tall as the source's.
 */
function keepBlankLines(element) {
  element.querySelectorAll('article .widget_sow-editor p').forEach((p) => {
    const nodes = [...p.childNodes].filter((n) => !(n.nodeType === 3 && !n.nodeValue.trim() && !n.nodeValue.includes('\u00a0')));
    const blank = (n) => n?.nodeType === 3 && NBSP_ONLY.test(n.nodeValue);
    const [br, tail] = nodes.slice(-2);
    if (br?.nodeName === 'BR' && blank(tail)) tail.nodeValue = `${NBSP_PLACEHOLDER}${LINE_KEEPER}`;
    const [head, next] = nodes;
    if (next?.nodeName === 'BR' && blank(head) && nodes.length > 2) head.nodeValue = NBSP_PLACEHOLDER;
  });
}

export default function transform(hookName, element, payload) {
  if (hookName === 'preprocess') {
    keepBlankLines(element);
    return;
  }
  if (hookName !== 'beforeTransform') return;
  const document = element.ownerDocument || payload?.document;
  const layout = element.querySelector('article .panel-layout');
  if (!layout) return;
  [...layout.children].filter((r) => r.matches('.panel-grid')).forEach((row) => {
    // the source's `pull-up` row style (-20px from 768px) travels as a section style
    if (row.querySelector(':scope > .panel-row-style.pull-up') && row.hasAttribute(MARK)) {
      row.setAttribute(MARK, `${row.getAttribute(MARK)}, ${PULL_UP}`);
    }
    const cards = cellsOf(row).filter(isCard);
    if (cards.length) {
      row.replaceChildren(peopleBlock(cards, document));
      return;
    }
    splitSpacers(row, document);
  });
}
