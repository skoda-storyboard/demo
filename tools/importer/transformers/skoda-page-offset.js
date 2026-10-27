/* global WebImporter */

/**
 * Transformer: a generic page's spacers become `Spacer` blocks (SKODA-843).
 *
 * The source's spacer widget (`skoda-offset`: `<div style="padding-top:1em">` at the widget's
 * 24px font) opens the body of BGC, the terms page and the IIHF pages. The page-base flatten
 * dropped it, so their text started 44px higher than on the source (the widget's 24px and its
 * panel's 20px gap). Here each one becomes `Spacer` with its height in px, as the story importer
 * writes it (parsers/story-flatten.js `spacerHeight`, the same 24px per em); the block shows it
 * from 720px, as the source does.
 *
 * A blank editor line is one 24px line on the source, at every width; the importer drops it.
 * - A blank paragraph (`<p>&nbsp;</p>`: cookies, competition, GDPR) is that line and its 20px
 *   gap: `Spacer (line)`, 44px.
 * - A paragraph ending in a blank line (`…<br>&nbsp;</p>`, the GDPR rights list) keeps its text,
 *   and the line follows it: `Spacer (line)`, 24px (the paragraph's own gap is already there).
 * `preprocess` marks them (a blank paragraph keeps a placeholder text, so it survives the
 * importer's clean-up), `beforeTransform` writes the spacers.
 *
 * An editor's indent is a run of `&nbsp;` too: the competition terms number each paragraph
 * `28.&nbsp;×10 The Promoter…` and indent its sub-items `&nbsp;×17 i.&nbsp;×4 obscene…`. html2md
 * turns each run into one space, so the text lost its indent and wrapped differently from the
 * source (a line more or less on several paragraphs, by width). skoda-nbsp.js keeps only a run
 * glued between two visible characters, and headings carry runs too (`3.&nbsp;×3 Продолжительность
 * конкурса&nbsp;`, two lines at 390 on the IIHF ru terms). `preprocess` here turns every other run
 * in a paragraph, heading or list item with text into the same placeholder, which push-lib.mjs
 * `wrapPage` turns back into U+00A0 before the DA upload (keep NBSP_PLACEHOLDER in sync); a
 * paragraph's blank last line is dropped first, above. DA keeps a leading run too, but the EDS
 * preview trims it, so the sub-items' indent is lost there (a "Deviations" note in SKODA-843).
 *
 * preprocess + beforeTransform; self-contained (no imports), as the bundles and the transformer
 * validator load it standalone.
 */

const BLANK = 'data-skoda-blank-line';
const TRAILING = 'data-skoda-trailing-line';
// one body line, and with its paragraph gap
const LINE_PX = 24;
const BLANK_PARAGRAPH_PX = 44;
// a blank line holds a non-breaking space (the editor's `&nbsp;`); a paragraph with no text at all
// (the browser's split of `<p><center>…</center></p>`) is only a margin, which the importer drops
const isBlank = (p) => !p.querySelector('img, picture, iframe, video, table, a[href]')
  && p.textContent.includes('\u00a0') && !p.textContent.replace(/[\s\u00a0]/g, '');

// the widget's font: 1em of its padding is 24px
const SPACER_EM_PX = 24;

const NBSP_PLACEHOLDER = '\u{F00A0}';
const VISIBLE = /[^\s\u00a0]/;

// a text block's runs (a paragraph's blank last line already dropped): each U+00A0 → placeholder
function keepIndent(block, doc) {
  if (!VISIBLE.test(block.textContent)) return;
  const walker = doc.createTreeWalker(block, 4 /* NodeFilter.SHOW_TEXT */);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    node.nodeValue = node.nodeValue.replace(/\u00a0/g, NBSP_PLACEHOLDER);
  }
}

function heightOf(panel) {
  const value = (panel.querySelector('[style*="padding-top"]')?.getAttribute('style') || '')
    .match(/padding-top:\s*([\d.]+)(em|px)/i);
  if (!value) return 0;
  const n = parseFloat(value[1]);
  return Math.round(value[2].toLowerCase() === 'em' ? n * SPACER_EM_PX : n);
}

export default function transform(hookName, element, payload) {
  const doc = payload?.document || element.ownerDocument;
  if (hookName === 'preprocess') {
    element.querySelectorAll('.entry-content p').forEach((p) => {
      // a table cell's lines stay with the cell: its Table block can't hold a Spacer block
      if (p.closest('table')) return;
      if (isBlank(p)) {
        p.setAttribute(BLANK, '');
        p.textContent = 'blank line';
        return;
      }
      // a last line that is only a <br> and blank text: drop it, remember it
      // (a <br> followed only by a line break makes no line: the &nbsp; does)
      const tail = [...p.childNodes].reverse();
      const ws = tail.findIndex((n) => !(n.nodeType === 3 && !n.nodeValue.replace(/[\s\u00a0]/g, '')));
      const br = ws >= 0 ? tail[ws] : null;
      const blankText = tail.slice(0, Math.max(ws, 0)).map((n) => n.nodeValue).join('');
      if (br?.nodeName === 'BR' && ws > 0 && blankText.includes('\u00a0')) {
        tail.slice(0, ws + 1).forEach((n) => n.remove());
        p.setAttribute(TRAILING, '');
      }
      keepIndent(p, doc);
    });
    element.querySelectorAll('.entry-content :is(h1, h2, h3, h4, h5, h6, li)').forEach((block) => keepIndent(block, doc));
    return;
  }
  if (hookName !== 'beforeTransform') return;
  const line = (px) => WebImporter.DOMUtils.createTable([['Spacer (line)'], [`${px}px`]], doc);
  // a marked line that ends up inside a block (a table) goes, so its placeholder text never stays
  element.querySelectorAll(`p[${BLANK}]`).forEach((p) => {
    if (p.closest('table')) p.remove();
    else p.replaceWith(line(BLANK_PARAGRAPH_PX));
  });
  element.querySelectorAll(`p[${TRAILING}]`).forEach((p) => {
    p.removeAttribute(TRAILING);
    p.after(line(LINE_PX));
  });
  element.querySelectorAll('.so-panel.widget_skoda-offset').forEach((panel) => {
    const height = heightOf(panel);
    if (!height) {
      panel.remove();
      return;
    }
    panel.replaceWith(WebImporter.DOMUtils.createTable([['Spacer'], [`${height}px`]], doc));
  });
}
