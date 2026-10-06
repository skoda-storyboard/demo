/* global WebImporter */

/*
 * Parser: press-kit small print → `Footnotes` (SKODA-805d, contract footnotes v1).
 *
 * Source (the first-glimpse press kit, in a `sow-editor` `.textwidget`):
 *   <p><span style="font-size: 10pt;">¹ The availability … <a href="…">HERE</a></span><br>
 *      <span style="font-size: 10pt;">² All 85, 85x, or RS …</span></p>
 * Every word of the paragraph sits in a span set below the 16px body size. DA keeps no inline
 * size (nor `small` or `span`), so the paragraph becomes `Footnotes`, one row per paragraph,
 * and the block sets the small type. A few small letters inside an ordinary sentence ("1st",
 * "7th" on the Motorsport chapters) are not small print and stay as they are, as does a
 * paragraph set small as a whole (`<p style="font-size: 12px">`, Peaq/Epiq chapters: a
 * different 12/18 style, left for a follow-up).
 *
 * WHY TWO STEPS: the importer's `preprocess` calls markFootnotes() on the source as published,
 * before helix-importer's own clean-up (it keeps styled spans today, but the rule shouldn't
 * depend on that); the parser builds the table once the layouts have run (their source-table
 * pass would flatten it). Only a top-level paragraph becomes a block: one that ends up in a
 * table (an accordion answer, a Columns cell), a list or a quote stays ordinary text, as
 * blocks can't nest in DA.
 */

const MARK = 'data-skoda-footnote';
const NAME = 'Footnotes';
const BODY_PX = 16;
// a paragraph with media is not small print (its image or player would end up in the block)
const MEDIA = 'img, picture, video, audio, iframe, svg, object, embed, canvas';

const text = (node) => (node?.textContent || '').replace(/\s+/g, ' ').trim();

/**
 * The element's inline font size in px (pt converted), as CSS applies it. The CSSOM's
 * `style.fontSize` is the winning declaration: `!important` beats a later one, and invalid
 * values (`invalid`, `10pt nonsense`) are dropped (PR #251 review). null when it sets none;
 * NaN when the winning value isn't a plain px/pt length (em, %, keywords, calc).
 */
function fontPx(el) {
  const value = el.style?.fontSize;
  if (!value) return null;
  const match = value.match(/^([\d.]+)(px|pt)$/i);
  if (!match) return NaN;
  return match[2].toLowerCase() === 'pt' ? (Number(match[1]) * 4) / 3 : Number(match[1]);
}

const isSmall = (px) => px > 0 && px < BODY_PX;

/**
 * A paragraph whose every word is set below the body size by its nearest sized ancestor (a
 * span). A footnote marker in a <sup> outside the sized span neither counts for nor against it.
 */
export function isFootnote(p) {
  if (!p?.matches?.('p') || fontPx(p) !== null || !text(p) || p.querySelector(MEDIA)) return false;
  const walker = p.ownerDocument.createTreeWalker(p, 4 /* NodeFilter.SHOW_TEXT */);
  let small = false;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (text(node)) {
      let el = node.parentElement;
      let marker = false;
      while (el !== p && fontPx(el) === null) {
        if (el.matches('sup')) marker = true;
        el = el.parentElement;
      }
      if (el !== p) {
        if (!isSmall(fontPx(el))) return false;
        small = true;
      } else if (!marker) {
        return false;
      }
    }
  }
  return small;
}

export function markFootnotes(root) {
  const found = [...root.querySelectorAll('p')].filter(isFootnote);
  found.forEach((p) => p.setAttribute(MARK, ''));
  return found.length;
}

const edge = (n) => n && ((n.nodeType === 1 && n.matches('br')) || (n.nodeType === 3 && !text(n)));

// A copy of the paragraph's content without its spans (and their sizes) and without the edge
// <br>s and spaces: the links, line breaks and markers stay.
function footnoteParagraph(p, document) {
  const copy = document.createElement('p');
  copy.append(...[...p.childNodes].map((node) => node.cloneNode(true)));
  copy.querySelectorAll('span').forEach((span) => span.replaceWith(...span.childNodes));
  copy.querySelectorAll('[style]').forEach((el) => el.removeAttribute('style'));
  while (edge(copy.lastChild)) copy.lastChild.remove();
  while (edge(copy.firstChild)) copy.firstChild.remove();
  // \s covers the source's no-break spaces
  if (copy.lastChild?.nodeType === 3) copy.lastChild.textContent = copy.lastChild.textContent.replace(/\s+$/, '');
  if (copy.firstChild?.nodeType === 3) copy.firstChild.textContent = copy.firstChild.textContent.replace(/^\s+/, '');
  return copy;
}

// The `Footnotes` table right before the paragraph, with nothing but whitespace between them.
function tableBefore(p) {
  let node = p.previousSibling;
  while (node?.nodeType === 3 && !text(node)) node = node.previousSibling;
  return node?.nodeType === 1 && node.matches('table')
    && text(node.querySelector('th, td')) === NAME ? node : null;
}

/** A marked paragraph → `Footnotes`; a footnote right after one adds a row to it. */
export default function parse(p, { document }) {
  p.removeAttribute(MARK);
  if (p.closest('table, li, blockquote, figure') || !text(p)) return;
  const row = [footnoteParagraph(p, document)];
  const table = WebImporter.DOMUtils.createTable([[NAME], row], document);
  const prev = tableBefore(p);
  if (prev) {
    // the outer tables' own rows: a cell may hold a table of its own (as in PR #245's review)
    [...prev.rows].pop().after([...table.rows].pop());
    p.remove();
    return;
  }
  p.replaceWith(table);
}
