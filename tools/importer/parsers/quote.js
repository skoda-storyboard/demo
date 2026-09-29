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
