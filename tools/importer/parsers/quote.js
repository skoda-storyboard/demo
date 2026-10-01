/* global WebImporter */

/*
 * Parser: inline pull-quote → `Quote` (SKODA-220, contract quote v1).
 *
 * Source (press releases in `.entry-content`, press kits in a `sow-editor` `.textwidget`):
 *   <p style="text-align: center;"><em>“Quote …”</em></p>
 *   <hr style="width: 10%; …">                       decorative 81×2 rule
 *   <p style="text-align: center;"><strong>Name, role</strong></p>
 * Output: `Quote` with one row [<p>quote</p>, <p><strong>Name, role</strong></p>]. The
 * attribution cell is kept empty when the source has none; the rule is never emitted (a bare
 * <hr> in DA splits the section). The block renders the italics, the rule and the centring.
 *
 * WHY TWO STEPS: helix-importer's preProcess drops every <hr> before `transform`, and the
 * press-kit layout turns body tables into default content in beforeTransform. So the
 * importer's `preprocess` calls markQuotes() while the rule is still there, and this parser
 * builds the table from the marks once the layouts have run. An unmarked quote that is still
 * followed by its rule (the raw source DOM) is recognised too.
 */

const QUOTE = 'data-skoda-quote';
const BY = 'data-skoda-quote-by';

const text = (node) => (node?.textContent || '').replace(/\s+/g, ' ').trim();
const centred = (p) => /text-align:\s*center/i.test(p.getAttribute('style') || '')
  || p.classList.contains('has-text-align-center');

/** A centred <p> whose only content is italic text (a trailing <br> is allowed). */
function isQuote(p) {
  if (!p?.matches('p') || !centred(p)) return false;
  const nodes = [...p.childNodes].filter((n) => n.nodeType === 1 || text(n));
  return nodes.some((n) => n.matches?.('em, i') && text(n))
    && nodes.every((n) => n.nodeType === 1 && n.matches('em, i, br'));
}

/** The centred bold line after the rule. */
function isAttribution(p) {
  return !!p?.matches('p') && centred(p) && !!p.querySelector('strong, b') && !isQuote(p);
}

/** Mark every quote run (centred italic <p> + rule + optional attribution) and drop its rule. */
function markRun(hr) {
  const quote = hr.previousElementSibling;
  if (!isQuote(quote)) return false;
  quote.setAttribute(QUOTE, '');
  const by = hr.nextElementSibling;
  if (isAttribution(by)) by.setAttribute(BY, '');
  hr.remove();
  return true;
}

export function markQuotes(root) {
  return [...root.querySelectorAll('hr')].filter(markRun).length;
}

/** The inline content of the <em>s, without the italics and the edge <br>s. */
function quoteParagraph(quote, document) {
  const p = document.createElement('p');
  [...quote.childNodes].forEach((node) => {
    if (node.nodeType === 1 && node.matches('em, i')) p.append(...node.childNodes);
  });
  const edge = (n) => n && ((n.nodeType === 1 && n.matches('br')) || (n.nodeType === 3 && !text(n)));
  while (edge(p.lastChild)) p.lastChild.remove();
  while (edge(p.firstChild)) p.firstChild.remove();
  return p;
}

function attributionParagraph(by, document) {
  const p = document.createElement('p');
  p.append(...by.childNodes);
  const first = p.querySelector('strong, b')?.firstChild;
  if (first?.nodeType === 3) first.textContent = first.textContent.replace(/^\s+/, '');
  return p;
}

/*
 * The press-kit chapters' WordPress quote (SKODA-220): figure.quote > blockquote > p > em, and an
 * optional figcaption with the name (<em><strong>Name, role</strong></em>). On the source it is
 * left-aligned, with no rule: it becomes `Quote (left)`, one row per quote. Consecutive figures
 * sit flush on the source (0 between them), so they share one block, one row each.
 */
const LEFT = 'Quote (left)';
const MEDIA = 'img, picture, video, audio, iframe, svg, object, embed, canvas';
// kept as they are in a cell, never wrapped in a <p>
const BLOCK = 'address, article, aside, blockquote, details, div, dl, fieldset, figure, form, '
  + 'h1, h2, h3, h4, h5, h6, hr, ol, pre, section, table, ul';
const is = (node, selector) => node?.nodeType === 1 && node.matches(selector);

/** A figure whose blockquote has text; a figure with media in it is left as authored. */
export function isFigureQuote(node) {
  const quoteEl = is(node, 'figure') ? node.querySelector(':scope > blockquote') : null;
  return !!quoteEl && !node.querySelector(MEDIA)
    && [...quoteEl.childNodes].some((n) => !is(n, 'cite') && text(n));
}

const edge = (n) => is(n, 'br') || (n?.nodeType === 3 && !text(n));
const trim = (node, re) => {
  if (node?.nodeType === 3) node.textContent = node.textContent.replace(re, '');
};

// A <p> of copies of inline nodes, without the italics (the block styles them) and without the
// edge <br>s and spaces (\s covers the source's no-break spaces), also inside an edge <strong>.
function plainParagraph(nodes, document) {
  const p = document.createElement('p');
  p.append(...nodes.map((node) => node.cloneNode(true)));
  p.querySelectorAll('em, i').forEach((it) => it.replaceWith(...it.childNodes));
  while (edge(p.lastChild)) p.lastChild.remove();
  while (edge(p.firstChild)) p.firstChild.remove();
  const inner = (n, side) => (is(n, 'strong, b') ? n[side] : n);
  trim(inner(p.lastChild, 'lastChild'), /\s+$/);
  trim(inner(p.firstChild, 'firstChild'), /^\s+/);
  return p;
}

// A cell's content: one paragraph per source <p> and per run of loose inline content, block
// elements kept as they are, so no words are lost and no block ends up inside a <p>.
function paragraphs(nodes, document) {
  const cell = [];
  let run = [];
  const flush = () => {
    if (run.length) cell.push(plainParagraph(run, document));
    run = [];
  };
  nodes.forEach((node) => {
    if (is(node, 'p')) {
      flush();
      cell.push(...paragraphs([...node.childNodes], document));
    } else if (is(node, BLOCK)) {
      flush();
      const copy = node.cloneNode(true);
      copy.querySelectorAll('em, i').forEach((it) => it.replaceWith(...it.childNodes));
      cell.push(copy);
    } else {
      run.push(node);
    }
  });
  flush();
  return cell.filter((el) => text(el));
}

// Everything in the figure but its captions is quote text. A <cite> in the blockquote
// (WordPress pullquote) is the attribution when there is no figcaption, else it stays quote text.
function figureRow(figure, document) {
  const nodes = [...figure.childNodes].filter((node) => !is(node, 'figcaption'));
  const cites = nodes.filter((node) => is(node, 'blockquote'))
    .flatMap((quoteEl) => [...quoteEl.querySelectorAll(':scope > cite')]);
  const quote = nodes.flatMap((node) => paragraphs(is(node, 'blockquote')
    ? [...node.childNodes].filter((child) => !cites.includes(child)) : [node], document));
  const cited = cites.flatMap((cite) => paragraphs([...cite.childNodes], document));
  let by = [...figure.querySelectorAll(':scope > figcaption')]
    .flatMap((caption) => paragraphs([...caption.childNodes], document));
  if (by.length) quote.push(...cited);
  else by = cited;
  if (!by.length) return [quote, ''];
  // the source sets the name in bold; keep it bold when the caption is plain text
  if (!by.some((el) => el.querySelector('strong, b')) && is(by[0], 'p')) {
    const strong = document.createElement('strong');
    strong.append(...by[0].childNodes);
    by[0].append(strong);
  }
  return [quote, by];
}

const isLeftTable = (node) => is(node, 'table') && text(node.querySelector('th, td')) === LEFT;

// The `Quote (left)` table right before the figure, with nothing but whitespace between them.
function leftTableBefore(figure) {
  let node = figure.previousSibling;
  while (node?.nodeType === 3 && !text(node)) node = node.previousSibling;
  return isLeftTable(node) ? node : null;
}

/** figure.quote → `Quote (left)`; a figure right after one adds a row to it. */
export function parseFigure(figure, { document }) {
  if (!isFigureQuote(figure)) return;
  const table = WebImporter.DOMUtils.createTable([[LEFT], figureRow(figure, document)], document);
  const prev = leftTableBefore(figure);
  if (prev) {
    const row = [...table.querySelectorAll('tr')].pop();
    [...prev.querySelectorAll('tr')].pop().after(row);
    figure.remove();
    return;
  }
  figure.replaceWith(table);
}

export default function parse(element, { document }) {
  if (!element.hasAttribute(QUOTE)) {
    const hr = element.nextElementSibling;
    if (!hr?.matches('hr') || !markRun(hr)) return;
  }
  const by = element.nextElementSibling?.hasAttribute(BY) ? element.nextElementSibling : null;
  const cells = [quoteParagraph(element, document), by ? attributionParagraph(by, document) : ''];
  by?.remove();
  element.replaceWith(WebImporter.DOMUtils.createTable([['Quote'], cells], document));
}
