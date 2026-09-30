/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Škoda press-release layout (SKODA-607).
 *
 * Rebuilds `article.press_release` into the five DA sections the press-release
 * template (templates/press-release/) lays out. Measured on the 5 M1 releases
 * (docs/ui-specs/template-press-release.md, SKODA-607 amendment 2026-09-27):
 *
 *   1. header (full width)        date <p> + h1 (a <br> in the title becomes a space)
 *   2. Style: body-column         lead image, bullets <ul>, perex <p><strong>,
 *                                 Buzzsprout URL, body, inline Vimeo URL
 *   3. Style: sidebar             "Additional info" h3 + list, "Images" h3 +
 *                                 Gallery (preview), "Tags" h3 + Tags
 *   4. Style: dark, full-width, media-box   "Media Box" h2 + stats line + Downloads
 *   5. Style: dark, full-width, related     only when the source has the band:
 *                                 h2 + "Based on tags" line + "All" link + Story Rail (press)
 *
 * Contracts (docs/planning/SKODA-PENDING-BLOCK-CONTRACTS.md): gallery-preview v1
 * (SKODA-223), story-rail-press v1 (SKODA-224), press-release-sections v1 (SKODA-607).
 *
 * Every part is optional (bullets: 4 of 5; related band: 4 of 5; sidebar sections
 * vary), so each is found by content and skipped when absent — never positional.
 * The `article` element itself is kept (its `data-publish-date` feeds skoda-metadata).
 *
 * WHY BOTH HOOKS: the gallery / tags / downloads parsers run between the hooks and
 * replace `section.images`, `section.tags` and `.search-results.media-box`, so the
 * layout is rebuilt in beforeTransform with those elements kept in place, and the
 * Section Metadata + variant names are added in afterTransform, anchored to marker
 * <hr>s. Self-contained on purpose (the transformer validator loads it standalone).
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };
const MARKER = 'data-pr-section';
const LAYOUT_ATTR = 'data-pr-layout';

const SECTION_STYLES = {
  body: 'body-column',
  // Background panels in the body (Zellmer grey FAQ, SKODA-824, contract highlight v2).
  'highlight-grey': 'body-column, highlight-grey',
  'highlight-dark': 'body-column, highlight-dark',
  sidebar: 'sidebar',
  'media-box': 'dark, full-width, media-box',
  related: 'dark, full-width, related',
};

const text = (el) => (el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : '');

function make(document, tag, content) {
  const el = document.createElement(tag);
  if (typeof content === 'string') el.textContent = content;
  else if (content) el.append(...[].concat(content));
  return el;
}

function marker(document, id) {
  const hr = document.createElement('hr');
  hr.setAttribute(MARKER, id);
  return hr;
}

function link(document, href, label) {
  const a = document.createElement('a');
  a.setAttribute('href', href);
  a.textContent = label;
  return a;
}

/** A paragraph holding one bare URL (the embed autoblock "URL on its own line"). */
function urlParagraph(document, url) {
  return make(document, 'p', link(document, url, url));
}

/** Title text with <br> as a space (Peaq: "range record<br>for seven-seater"). */
function titleText(h1) {
  const clone = h1.cloneNode(true);
  clone.querySelectorAll('br').forEach((br) => br.replaceWith(' '));
  return text(clone);
}

function isEmptyParagraph(p) {
  return !text(p) && !p.querySelector('img, picture, a[href], iframe');
}

/** Lead image: the bare <img>, without the teaser excerpt captions or a <br> in alt. */
function leadImage(document, primary) {
  const img = primary.querySelector('.article-teaser img');
  if (!img) return null;
  ['data-caption', 'data-video_title', 'data-video_src', 'srcset', 'sizes', 'itemprop'].forEach((a) => img.removeAttribute(a));
  const alt = (img.getAttribute('alt') || '').replace(/<br\s*\/?>/gi, ' ').replace(/\s+/g, ' ').trim();
  img.setAttribute('alt', alt);
  return make(document, 'p', img);
}

/** `.bullet-points`: one or more <p> of "›"-prefixed lines split by <br> (or real <li>). */
function bulletList(document, primary) {
  const box = primary.querySelector('.bullet-points');
  if (!box) return null;
  const lines = [];
  const lis = box.querySelectorAll('li');
  if (lis.length) {
    lis.forEach((li) => lines.push(li.innerHTML));
  } else {
    box.querySelectorAll('p').forEach((p) => {
      p.innerHTML.split(/<br\s*\/?>/i).forEach((line) => lines.push(line));
    });
  }
  const ul = document.createElement('ul');
  lines.forEach((html) => {
    const li = document.createElement('li');
    li.innerHTML = html.replace(/^\s*(?:›|&rsaquo;)\s*/, '').trim();
    if (text(li)) ul.append(li);
  });
  return ul.children.length ? ul : null;
}

/** `.entry-summary` perex → <p><strong>…</strong></p> (bold on the source, 16/24/600). */
function perex(document, primary) {
  const out = [];
  const summary = primary.querySelector('.entry-summary');
  if (!summary) return out;
  summary.querySelectorAll('p').forEach((p) => {
    if (isEmptyParagraph(p)) return;
    const strong = document.createElement('strong');
    strong.append(...p.childNodes);
    out.push(make(document, 'p', strong));
  });
  return out;
}

/** `dark` / `grey` for an inline `background(-color)`; null for none or white. */
function panelVariant(style) {
  const value = ((style || '').match(/background(?:-color)?\s*:\s*([^;]+)/i) || [])[1];
  const hex = (value || '').trim().toLowerCase().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  const rgb = (value || '').match(/rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/);
  let channels = null;
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].replace(/./g, '$&$&') : hex[1];
    channels = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  } else if (rgb) channels = rgb.slice(1, 4).map(Number);
  if (!channels) return null;
  const luminance = (0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]) / 255;
  if (luminance > 0.98) return null;
  return luminance < 0.5 ? 'dark' : 'grey';
}

/** `.entry-content` → flat default content with bare embed URLs. */
function bodyContent(document, primary) {
  const content = primary.querySelector('.entry-content');
  if (!content) return [];

  content.querySelectorAll('.sa-bnr').forEach((n) => n.remove());

  // Buzzsprout AI-audio player (lazy: the URL is in data-src until scrolled into view).
  content.querySelectorAll('.embed-controller-wrapper').forEach((wrap) => {
    const iframe = wrap.querySelector('iframe');
    const url = iframe && (iframe.getAttribute('data-src') || iframe.getAttribute('src'));
    wrap.replaceWith(...(url ? [urlParagraph(document, url)] : []));
  });

  // Inline video attachment (Peaq): Vimeo iframe + cart/download toolbar → bare URL.
  content.querySelectorAll('.media-cart-item.attachment, .video-container').forEach((wrap) => {
    if (!wrap.parentNode) return;
    const iframe = wrap.querySelector('iframe[src], iframe[data-src]');
    const url = iframe && (iframe.getAttribute('src') || iframe.getAttribute('data-src'));
    wrap.replaceWith(...(url ? [urlParagraph(document, url)] : []));
  });
  content.querySelectorAll('.media-cart-actions').forEach((n) => n.remove());

  // Any other iframe with a provider URL → bare URL; the rest is dropped.
  content.querySelectorAll('iframe').forEach((iframe) => {
    const url = iframe.getAttribute('src') || iframe.getAttribute('data-src');
    const p = iframe.closest('p');
    const replacement = url && /^https?:/.test(url) ? urlParagraph(document, url) : null;
    if (p && text(p) === '') p.replaceWith(...(replacement ? [replacement] : []));
    else iframe.replaceWith(...(replacement ? [replacement] : []));
  });

  // Stray rules: a bare <hr> would split the DA section. The pull-quote rules are consumed
  // in `preprocess` (parsers/quote.js, SKODA-220) before helix drops every <hr>.
  content.querySelectorAll('hr').forEach((hr) => hr.remove());

  // Background panels (Zellmer grey FAQ, SKODA-824) get their own highlight section and
  // the body resumes after them; other inline-styled divs just keep their paragraphs.
  content.querySelectorAll(':scope > div[style]').forEach((div) => {
    const variant = panelVariant(div.getAttribute('style'));
    if (variant && text(div)) {
      div.replaceWith(marker(document, `highlight-${variant}`), ...div.childNodes, marker(document, 'body'));
    }
  });
  content.querySelectorAll('div[style]').forEach((div) => div.replaceWith(...div.childNodes));

  content.querySelectorAll('p').forEach((p) => { if (isEmptyParagraph(p)) p.remove(); });
  dataTables(document, content);
  return [...content.childNodes].filter((n) => n.nodeType === 1 || text(n));
}

/**
 * A source data table (spec or results figures: 2+ rows with 2+ filled cells) would become an
 * unknown DA block named after its first cell (`Škoda Elroq` → `koda-elroq`). As on the press
 * kits (SKODA-805b), each row becomes one line: the bold row label (its footnote <sup> kept),
 * then `column: value` pairs; the header's first cell leads the list. Other tables are left.
 */
function dataTables(document, content) {
  content.querySelectorAll('table').forEach((table) => {
    const rows = [...table.rows].filter((row) => text(row));
    const filled = (row) => [...row.cells].filter((cell) => text(cell));
    if (rows.filter((row) => filled(row).length >= 2).length < 2) return;
    const [head, ...body] = rows;
    const labels = [...head.cells].map((cell) => text(cell));
    const out = [];
    if (labels[0]) out.push(make(document, 'p', labels[0]));
    const list = document.createElement('ul');
    body.forEach((row) => {
      const [first, ...cells] = [...row.cells];
      const li = document.createElement('li');
      const label = document.createElement('strong');
      label.append(...[...first.childNodes].map((node) => node.cloneNode(true)));
      label.querySelectorAll('strong, b').forEach((inner) => inner.replaceWith(...inner.childNodes));
      const values = cells.map((cell, i) => [text(cell) && labels[i + 1], text(cell)])
        .filter(([, value]) => value)
        .map((pair) => pair.filter(Boolean).join(': '));
      if (text(label)) li.append(label, values.length ? `: ${values.join(' · ')}` : '');
      else li.append(values.join(' · '));
      list.append(li);
    });
    out.push(list);
    table.replaceWith(...out);
  });
}

/** No empty body section: drop a body marker that is last or directly before another marker. */
function dropEmptyBodies(nodes) {
  const isMarker = (n) => n && n.nodeType === 1 && n.hasAttribute(MARKER);
  const nextElement = (i) => nodes.slice(i + 1).find((n) => n.nodeType === 1);
  return nodes.filter((n, i) => !(isMarker(n) && n.getAttribute(MARKER) === 'body'
    && (!nextElement(i) || isMarker(nextElement(i)))));
}

/** Secondary column → sidebar parts (the parser-owned sections are kept in place). */
function sidebarContent(document, secondary, hasMediaBox) {
  const out = [];
  if (!secondary) return out;

  secondary.querySelectorAll(':scope > section').forEach((section) => {
    const heading = section.querySelector('h2, h3, .heading');
    const headingText = text(heading);

    if (section.matches('.images, .sa-media-kit-preview')) {
      if (heading) heading.remove();
      out.push(make(document, 'h3', headingText || 'Images'), section);
      return;
    }
    if (section.matches('.tags') || section.querySelector('.entry-tags')) {
      if (heading) heading.remove();
      out.push(make(document, 'h3', headingText || 'Tags'), section);
      return;
    }

    const menu = section.querySelector('ul.menu, .menu');
    if (!menu) return; // newsletter / side-banner are stripped by the cleanup
    const ul = document.createElement('ul');
    menu.querySelectorAll(':scope > li').forEach((li) => {
      const a = li.querySelector('a[href]:not([href="#"])');
      if (a && text(a)) {
        ul.append(make(document, 'li', link(document, a.getAttribute('href'), text(a))));
        return;
      }
      // "Download Media Box" (a cart button on the source) → jump to the Media Box band
      // until the media cart (SKODA-505a) wires the button.
      const label = text(li.querySelector('span')) || text(li);
      if (label && hasMediaBox) ul.append(make(document, 'li', link(document, '#media-box', label)));
    });
    if (!ul.children.length) return;
    out.push(make(document, 'h3', headingText || 'Additional info'), ul);
  });
  return out;
}

/** Media Box band → heading + stats line + the element the downloads parser consumes. */
function mediaBoxContent(document, band) {
  const box = band.querySelector('.search-results.media-box');
  if (!box) return [];
  const heading = text(box.querySelector('.search-results-heading')) || 'Media Box';
  const stats = text(box.querySelector('.search-results-stats .stats, .stats'));
  box.querySelectorAll('.search-results-header, .search-results-stats, .togglebox-opener').forEach((n) => n.remove());
  const out = [make(document, 'h2', heading)];
  if (stats) out.push(make(document, 'p', stats));
  out.push(box);
  return out;
}

/** Related Press Releases band → heading, "Based on tags" line, "All" link, Story Rail (press). */
function relatedContent(document, band) {
  const results = band.querySelector('.search-results');
  if (!results) return [];

  const rows = [['Story Rail (press)']];
  results.querySelectorAll('article.article-teaser').forEach((card) => {
    const titleLink = card.querySelector('.entry-title a[href]');
    const href = titleLink && titleLink.getAttribute('href');
    if (!href || !text(titleLink)) return; // never emit a card without a target
    const img = card.querySelector('.article-teaser-media img');
    if (img) ['data-caption', 'data-video_title', 'data-video_src', 'srcset', 'sizes', 'itemprop'].forEach((a) => img.removeAttribute(a));
    const body = [];
    const date = text(card.querySelector('.entry-published'));
    if (date) body.push(make(document, 'p', date));
    body.push(make(document, 'h3', link(document, href, text(titleLink))));
    rows.push([img || '', body]);
  });
  if (rows.length === 1) return [];

  const headingEl = results.querySelector('.search-results-heading');
  const sub = text(headingEl && headingEl.querySelector('.subheading'));
  let heading = 'Related Press Releases';
  if (headingEl) {
    const clone = headingEl.cloneNode(true);
    clone.querySelectorAll('.subheading').forEach((s) => s.remove());
    heading = text(clone) || heading;
  }
  const out = [make(document, 'h2', heading)];
  if (sub) out.push(make(document, 'p', sub));
  const all = results.querySelector('a.search-results-header-link[href], .search-results-header a[href]');
  if (all && all.getAttribute('href')) out.push(make(document, 'p', link(document, all.getAttribute('href'), text(all) || 'All')));
  out.push(WebImporter.DOMUtils.createTable(rows, document));
  return out;
}

function rebuild(element, document) {
  // The page's own release is the press_release article with the two-column shell
  // (rail cards on other templates are `article.press_release` too).
  const article = [...element.querySelectorAll('article.press_release, article.type-press_release')]
    .find((a) => a.querySelector('.column-primary'));
  if (!article) return; // not the measured shape — leave the page to the default path
  const container = article.querySelector(':scope > .container') || article;
  const primary = container.querySelector('.column-primary');

  const header = container.querySelector(':scope > header') || container;
  const date = text(header.querySelector('.entry-published'));
  const h1 = header.querySelector('h1');
  const secondary = container.querySelector('.column-secondary');
  const bands = [...article.querySelectorAll('.cover-box.dark')];
  const mediaBand = bands.find((b) => b.querySelector('.search-results.media-box'));
  const relatedBand = bands.find((b) => b !== mediaBand && b.querySelector('article.article-teaser'));

  const out = [];
  if (date) out.push(make(document, 'p', date));
  if (h1) out.push(make(document, 'h1', titleText(h1)));

  out.push(marker(document, 'body'));
  [leadImage(document, primary), bulletList(document, primary), ...perex(document, primary),
    ...bodyContent(document, primary)].forEach((n) => { if (n) out.push(n); });

  const media = mediaBand ? mediaBoxContent(document, mediaBand) : [];
  const side = sidebarContent(document, secondary, media.length > 0);
  if (side.length) out.push(marker(document, 'sidebar'), ...side);
  if (media.length) out.push(marker(document, 'media-box'), ...media);
  const related = relatedBand ? relatedContent(document, relatedBand) : [];
  if (related.length) out.push(marker(document, 'related'), ...related);

  article.replaceChildren(...dropEmptyBodies(out));
  article.setAttribute(LAYOUT_ATTR, '');
}

function finish(element, document) {
  const article = element.querySelector(`[${LAYOUT_ATTR}]`);
  if (!article) return;
  article.removeAttribute(LAYOUT_ATTR);

  // Sidebar preview gallery → the contracted variant (gallery-preview, SKODA-223).
  const sidebar = element.querySelector(`hr[${MARKER}="sidebar"]`);
  if (sidebar) {
    let n = sidebar.nextElementSibling;
    while (n && !n.hasAttribute(MARKER)) {
      const cell = n.matches('table') && n.querySelector('tr > th, tr > td');
      if (cell && text(cell).toLowerCase() === 'gallery') cell.textContent = 'Gallery (preview)';
      n = n.nextElementSibling;
    }
  }

  // Section Metadata at the end of each styled section; the markers become plain breaks.
  element.querySelectorAll(`hr[${MARKER}]`).forEach((hr) => {
    const style = SECTION_STYLES[hr.getAttribute(MARKER)];
    let end = hr.nextElementSibling;
    let last = hr;
    while (end && !end.hasAttribute(MARKER)) { last = end; end = end.nextElementSibling; }
    if (style) {
      last.after(WebImporter.Blocks.createBlock(document, { name: 'Section Metadata', cells: { style } }));
    }
    hr.removeAttribute(MARKER);
  });

  // Never ship an empty link (source `a.colorbox href=""`, SKODA-612).
  article.querySelectorAll('a[href=""], a:not([href])').forEach((a) => a.replaceWith(...a.childNodes));

  // An image-only PDF/MP4 link (the Peaq production infographic) is named by its image, in the
  // link title the SKODA-503 binary gate reads, as the press-kit importer does.
  article.querySelectorAll('a[href]').forEach((a) => {
    const img = a.querySelector('img');
    const alt = (img?.getAttribute('alt') || '').trim();
    if (!alt || text(a) || a.title || !/\.(?:pdf|mp4)(?:$|[?#])/i.test(a.getAttribute('href'))) return;
    a.title = alt;
  });
}

export default function transform(hookName, element, payload) {
  const document = element.ownerDocument || (typeof window !== 'undefined' && window.document);
  if (hookName === TransformHook.beforeTransform) rebuild(element, document);
  if (hookName === TransformHook.afterTransform) finish(element, document);
}
