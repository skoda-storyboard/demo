/* global WebImporter */

/**
 * Transformer: the Sustainable Offices page (`page-template-template-sustainability`,
 * /en/sustainable-offices/, SKODA-843). Its SiteOrigin rows become DA sections and blocks;
 * templates/sustainability lays them out (`theme: sustainability`).
 *
 * The source writes each zig-zag row twice: a `hide-mobile` row (from 720px) and a
 * `hide-desktop hide-tablet` copy with the image first (below 720). The copy is dropped; the
 * Columns block already puts the image first when it stacks. Output, in order:
 *   section 1  `Style: sustainability-header`  h1, the desktop header image, the phone one
 *   then a section per theme (a new one at each h2 row): the h2, a `Columns (image-card)` per
 *     image + text row (cells in source order), the 3-card band as `Columns (info-blocks)`,
 *     the "Interested in hiring…" line, and the film (a Vimeo link, which the embed autoblock
 *     plays) in the last theme.
 *   the event section: its h2, image and text.
 * Blank editor lines (`&nbsp;<br>`, `<br>&nbsp;`, `<p>&nbsp;</p>`) are dropped; the template
 * CSS keeps the source's rhythm. The inline colour spans go (the band's white is the template's).
 * The in-page "Find out more." links point at the event section's h2 id.
 *
 * beforeTransform; self-contained (no imports), as the bundles and the transformer validator
 * load it standalone.
 */

const BLANK = /^[\s\u00a0]*$/;
const INLINE = new Set(['#text', 'A', 'STRONG', 'B', 'EM', 'I', 'SPAN', 'SUP', 'SUB', 'BR', 'IMG', 'PICTURE', 'U']);

// the heading id EDS gives the h2 (GitHub-style: lower case, punctuation dropped, each space a
// '-'; "ŠKODA AUTO’s Press Releases" → `škoda-autos-press-releases`, #843 review)
const slug = (value) => value.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s/g, '-');

const text = (el) => (el?.textContent || '').replace(/\s+/g, ' ').trim();

// a paragraph's leading and trailing blank lines: `&nbsp;<br>` before its content, `<br>&nbsp;`
// (or a lone <br>) after it
function trimBlankLines(p) {
  const strip = (pick) => {
    for (let node = pick(); node; node = pick()) {
      const blank = node.nodeType === 3 && BLANK.test(node.nodeValue);
      if (!blank && node.nodeName !== 'BR') return;
      node.remove();
    }
  };
  strip(() => p.firstChild);
  strip(() => p.lastChild);
}

// a film, named by its iframe title, else the page title (the link text is the player's name).
// The source's Vimeo account locks this clip to its own domain ("Because of its privacy settings,
// this video cannot be played here" on the demo), so a clip whose cart toolbar carries its MP4
// master becomes `Embed (vimeo)` with both, as the press-kit clips (SKODA-805c): the block plays
// Vimeo where it may, else the master. Without a master: a paragraph with the Vimeo link.
function filmOf(frame, holder, { doc, title }) {
  const url = frame.getAttribute('src') || frame.getAttribute('data-src') || '';
  const name = frame.getAttribute('title') || title || url;
  const link = (href) => Object.assign(doc.createElement('a'), { href, textContent: name });
  const file = [...holder.querySelectorAll('a.media-cart-action.download[href], a[data-action="download"][href]')]
    .map((a) => a.getAttribute('href')).find((href) => /\.mp4([?#]|$)/i.test(href));
  if (file && /(^|\.)vimeo\.com$/i.test(new URL(url, 'https://player.vimeo.com').hostname)) {
    const rows = [['Embed (vimeo)'], ['url', link(url)], ['file', link(file)]];
    if (name !== url) rows.push(['title', name]);
    return WebImporter.DOMUtils.createTable(rows, doc);
  }
  const film = doc.createElement('p');
  film.append(link(url));
  return film;
}

// a widget's content as block-level nodes: loose inline runs wrapped in <p>, an inner wrapper
// div (`image-card_text-inner`) opened, spans unwrapped, images unlinked from their own file
function blocksOf(widget, ctx) {
  const { doc } = ctx;
  const out = [];
  let run = null;
  const flush = () => {
    if (run) out.push(run);
    run = null;
  };
  [...widget.childNodes].forEach((node) => {
    // the cart toolbar under the film (no link of its own on the demo, as on stories)
    if (node.nodeType === 1 && node.matches('.media-cart-actions')) return;
    const attachment = node.nodeType === 1 && node.matches('.media-cart-item') && node.querySelector('iframe');
    if (attachment || node.nodeName === 'IFRAME') {
      flush();
      out.push(filmOf(attachment || node, node, ctx));
    } else if (node.nodeName === 'DIV') {
      flush();
      out.push(...blocksOf(node, ctx));
    } else if (INLINE.has(node.nodeName)) {
      if (!run) run = doc.createElement('p');
      run.append(node);
    } else if (node.nodeType === 1) {
      flush();
      out.push(node);
    }
  });
  flush();
  out.forEach((el) => {
    el.querySelectorAll('span').forEach((span) => span.replaceWith(...span.childNodes));
    el.querySelectorAll('a[href]').forEach((a) => {
      if (!text(a) && /\.(jpe?g|png|webp|gif)([?#]|$)/i.test(a.getAttribute('href'))) {
        a.replaceWith(...a.childNodes);
      }
    });
    if (el.matches('p')) trimBlankLines(el);
  });
  return out.filter((el) => !el.matches('p') || text(el) || el.querySelector('img, iframe'));
}

// a paragraph holding text then a film (`…<br>&nbsp;<br><iframe>` + the cart toolbar, as the
// server writes it; the page script moves the film into a cart attachment div): the text, then
// the film
function splitFilm(p, ctx) {
  const frame = p.querySelector('iframe[src]');
  if (!frame) return [p];
  const film = filmOf(frame, p, ctx);
  p.querySelectorAll('.media-cart-action').forEach((a) => a.remove());
  frame.remove();
  trimBlankLines(p);
  return text(p) ? [p, film] : [film];
}

// a card whose text the source left outside a paragraph: its theme sets only `p` at 18/28, so that
// text shows at the page's 16/24 (Variable spaces' first card); `text-small` keeps it so
const looseText = (row) => [...row.querySelectorAll('.image-card_text-inner')].some((inner) => [...inner.childNodes]
  .some((n) => (n.nodeType === 3 ? !BLANK.test(n.nodeValue) : INLINE.has(n.nodeName) && n.nodeName !== 'BR')));

const cellsOf = (row) => [...row.querySelectorAll('.panel-grid-cell')]
  .filter((cell) => cell.closest('.panel-grid') === row);
const widgetOf = (cell) => cell.querySelector('.siteorigin-widget-tinymce') || cell;

export default function transform(hookName, element, payload) {
  if (hookName !== 'beforeTransform') return;
  const doc = payload?.document || element.ownerDocument;
  if (!doc.body.matches('.page-template-template-sustainability')) return;
  const layout = element.querySelector('.panel-layout');
  if (!layout) return;

  // the in-page anchor's target: the row widget with that id → its h2's EDS id
  const anchorTargets = new Map();
  layout.querySelectorAll('[id]').forEach((el) => {
    const h2 = el.querySelector('h2');
    if (h2 && !el.matches('.panel-grid, .panel-grid-cell, .so-panel')) anchorTargets.set(el.id, slug(text(h2)));
  });

  const ctx = { doc, title: text(layout.querySelector('h1')) };
  const table = (name, cells) => WebImporter.DOMUtils.createTable([[name], cells], doc);
  const out = [];
  let header = true;
  [...layout.children].filter((row) => row.matches('.panel-grid')).forEach((row, index) => {
    const classes = row.querySelector(':scope > .panel-row-style')?.classList;
    const has = (name) => !!classes?.contains(name);
    // the phone copy of a zig-zag row
    if (has('image-card') && has('hide-desktop')) return;
    const small = looseText(row);
    const cells = cellsOf(row).map((cell) => blocksOf(widgetOf(cell), ctx));
    let nodes;
    if (has('image-card')) nodes = [table(`Columns (image-card${small ? ', text-small' : ''})`, cells)];
    else if (has('info-blocks')) nodes = [table('Columns (info-blocks)', cells)];
    else nodes = cells.flat().flatMap((node) => (node.matches('p') ? splitFilm(node, ctx) : [node]));
    if (!nodes.length) return;
    if (header) {
      // the title row and the header images (desktop, phone)
      if (index === 0 || nodes.every((n) => n.matches('p') && n.querySelector('img') && !text(n))) {
        out.push(...nodes);
        return;
      }
      out.push(WebImporter.Blocks.createBlock(doc, { name: 'Section Metadata', cells: { Style: 'sustainability-header' } }));
      // the intro is its own section, then a section per theme
      out.push(doc.createElement('hr'));
      header = false;
    }
    if (nodes[0].matches('h2')) out.push(doc.createElement('hr'));
    out.push(...nodes);
  });

  out.forEach((node) => {
    node.querySelectorAll('a[href^="#"]').forEach((a) => {
      const target = anchorTargets.get(a.getAttribute('href').slice(1));
      if (target) a.setAttribute('href', `#${target}`);
    });
  });

  if (!out.length) return;
  const article = layout.closest('main') || layout.parentElement;
  article.replaceChildren(...out);
}
