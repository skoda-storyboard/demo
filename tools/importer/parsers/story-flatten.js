/* eslint-disable */
/* global WebImporter */
/**
 * Parser: story-flatten (SiteOrigin Page-Builder → flat EDS default content + blocks)
 * Ticket: SKODA-801. Render target: docs/ui-specs/story-detail.md. Widget universe:
 * docs/analysis/SKODA-STORY-WIDGET-CENSUS.md (100% EN+CS census, 17 canonical types).
 *
 * ⚠️ CONTENT-DRIVEN, NOT POSITIONAL. Everything is read from the DOM of the element
 * the `.content` / `.entry-content` selector matched. Detection is by structure
 * (`.panel-layout` / `.panel-grid` / `.so-panel` / `so-widget-*`), never by URL or
 * template order (repo import rule).
 *
 * WHAT IT DOES
 * The story body is a nested visual-builder tree, NOT linear content:
 *   .panel-layout
 *     └ .panel-grid            (a builder "row"    — vertical block in the reading column)
 *         └ .panel-grid-cell   (a builder "column" — usually 1; >1 = genuine multi-column)
 *             └ .so-panel.widget_<TYPE>       (one widget)
 *                 └ .panel-widget-style
 *                     └ .so-widget-<type> ...  (widget payload)
 * The `panel-*` wrappers carry NO editorial meaning — only layout scaffolding. This
 * parser strips the scaffolding, keeps the content, and maps each widget to its EDS
 * equivalent, IN ORDER, replacing the whole builder subtree in place with a flat
 * sequence of default content (h/p/ul/blockquote/figure) + block tables.
 *
 * SECTION MODEL (deviation from the ticket's "panel-row → --- section break", noted
 * deliberately): the render-target spec (story-detail.md §2/§3, 2026-09-15) models the
 * story body as ONE primary reading column (.content 66.66%) sitting BESIDE the
 * .sidebar secondary column. A two-column grid-on-main needs the whole body to be a
 * single primary-column section, so we do NOT emit per-row `---` breaks inside the
 * body; panel-rows linearize into stacked default content within the one body section
 * (the M1 "single-column stacked" behaviour). Full fidelity here means full WIDGET
 * coverage + robustness to arbitrary nesting / very large trees — which this delivers.
 * A genuine multi-column panel-grid (>1 non-empty cell) is preserved inline as a
 * Columns block (that is what the columns block is for), NOT linearized away. Two unequal
 * cells emit `Columns (split-NN[, portrait-NNN])` (contract columns-split v2, SKODA-225).
 * Exception (SKODA-824): a row with a background colour is a highlight panel and gets its
 * own `body-column, highlight-<variant>` section; see markHighlights() below.
 *
 * WIDGET → EDS MAPPING (census §3; 17 canonical types; % of 35,159 instances):
 *   sow-editor / tinymce      83.5%  → default content (inner h/p/ul kept as-is)
 *   skoda-offset (spacer)      8.2%  → dropped
 *   skoda-carousel-widget      4.0%  → routed BY CONTENT (not widget name): items with
 *                                       links → Cards (related-story teasers); link-free
 *                                       → Gallery (slider) (in-body image set, one image
 *                                       per view like the source; SKODA-819). Corpus uses both.
 *   sow-slider                 1.5%  → Gallery block (image slider)
 *   skoda-quote                1.1%  → <blockquote>
 *   skoda-captioned-image      0.7%  → <figure> + <figcaption> (lifts the native figure)
 *   sow-button                 0.3%  → EDS button (<p><strong><a>>)
 *   skoda-image-box            0.2%  → infobox/definition callout: text (+ image) as
 *                                       default content — NOT a plain image (D2)
 *   sow-image                  0.1%  → image (lifted to direct child)
 *   ys-milestones              0.1%  → timeline flattened to content: per entry an
 *                                       <h3> "YEAR — Title" + its image (SKODA-815/D1)
 *   ys-embed-share             0.1%  → dropped (social share chrome, not body)
 *   iframe-embed              0.01%  → embed block (preserve dnt=1)
 *   highlights                0.02%  → dropped + logged
 *   skoda-newsletter-widget   0.01%  → dropped (chrome/service)
 *   k2tools-charge-map         0.1%  → DEFERRED: skip + log (interactive external app)
 *   k2tools-charging-calc     0.01%  → DEFERRED: skip + log
 *   siteorigin-panels-builder 0.02%  → DEFERRED: skip + log (nested-builder safety net)
 *   inline <img> in sow-editor        → lifted to direct child; alt + data-caption kept
 *
 * GROUPING IS FAITHFUL — ONE WIDGET, ONE BLOCK (confirmed 2026-09-24). Image grouping
 * follows the SOURCE widget type, never image adjacency: a `skoda-carousel-widget` (many
 * `search-results-item`s) → one Cards block, a `sow-slider` → one Gallery block, but N
 * separate `sow-image`/`skoda-captioned-image` widgets in a row → N stacked figures, NOT
 * a synthesised gallery. There is deliberately no "several images in a row → carousel"
 * heuristic (repo rule: content-driven, no positional assumptions; and in the real Škoda
 * corpus multi-image runs are already authored as carousel widgets — nothing to merge).
 *
 * Unknown / empty widgets are skipped cleanly and logged — never crash (AC).
 * In-body galleries / video embeds / Media Box remain the province of SKODA-604's
 * full-fidelity restore; this pass maps the common widgets and defers those media
 * shells to skoda-story-cleanup (which logs + drops them) unless already handled here.
 */

// ---- widget classification ------------------------------------------------

// Ordered so more-specific signals win. Each entry: [test(className), kind].
// className is the concatenated class list of the .so-panel (which carries the
// `widget_<type>` signal) plus its inner `.so-widget-<type>` element.
const WIDGET_KINDS = [
  [/\bwidget_skoda-carousel-widget\b|so-widget-skoda-carousel-widget/, 'carousel'],
  [/\bwidget_skoda-offset\b|so-widget-skoda-offset/, 'offset'],
  [/\bwidget_skoda-quote\b|so-widget-skoda-quote/, 'quote'],
  [/\bwidget_skoda-captioned-image\b|so-widget-skoda-captioned-image/, 'captioned-image'],
  [/\bwidget_skoda-image-box\b|so-widget-skoda-image-box/, 'image-box'],
  [/\bwidget_skoda-newsletter\b|so-widget-skoda-newsletter/, 'newsletter'],
  [/\bwidget_sow-slider\b|so-widget-sow-slider/, 'slider'],
  [/\bwidget_sow-button\b|so-widget-sow-button|sow-button-wire/, 'button'],
  [/\bwidget_sow-image\b|so-widget-sow-image/, 'image'],
  [/\bwidget_sow-editor\b|so-widget-sow-editor|siteorigin-widget-tinymce/, 'editor'],
  [/\bys-milestones\b/, 'milestones'],
  [/\bys-embed-share\b/, 'share'],
  [/\bys-so-widget-highlights\b|\bwidget_highlights\b/, 'highlights'],
  // Deferred interactive widgets (census §7): skip + log, confirm render-vs-drop.
  [/k2tools-charge-map/, 'defer-charge-map'],
  [/k2tools-charging-calculator/, 'defer-calculator'],
  [/siteorigin-panels-builder/, 'defer-nested-builder'],
];

const DEFERRED = new Set(['defer-charge-map', 'defer-calculator', 'defer-nested-builder']);
const DROPPED = new Set(['offset', 'newsletter', 'share', 'highlights']);

function classifyWidget(panel) {
  const inner = panel.querySelector('[class*="so-widget-"]');
  const signal = `${panel.className || ''} ${(inner && inner.className) || ''}`;
  for (const [re, kind] of WIDGET_KINDS) {
    if (re.test(signal)) return kind;
  }
  return 'unknown';
}

// ---- per-widget emitters --------------------------------------------------
// Each returns an array of DOM nodes to splice into the flattened body, or [].

function editorNodes(panel, document) {
  // The rich text lives in .siteorigin-widget-tinymce.textwidget; keep its inner
  // h/p/ul/blockquote/figure as-is. Lift any inline <img> to a direct child so EDS
  // wraps it in <picture>, carrying alt + data-caption into a <figcaption>.
  const tiny = panel.querySelector('.siteorigin-widget-tinymce, .textwidget')
    || panel.querySelector('[class*="so-widget-sow-editor"]');
  if (!tiny) return [];
  const nodes = [...tiny.childNodes];
  const out = [];
  nodes.forEach((n) => {
    if (n.nodeType === 3) { // text node
      if ((n.textContent || '').trim()) out.push(n);
      return;
    }
    if (n.nodeType !== 1) return;
    out.push(n);
  });
  return out;
}

function itemCaption(img, item) {
  // data-caption first (~53% of Škoda captions live there), then colorbox title, then alt.
  const capSource = (img.getAttribute('data-caption') && img)
    || item.querySelector?.('[data-caption]')
    || item;
  return (capSource.getAttribute && capSource.getAttribute('data-caption'))
    || (item.querySelector?.('a[title]') && item.querySelector('a[title]').getAttribute('title'))
    || img.getAttribute('alt') || '';
}

// The slider's visible caption is the carousel item's optional description
// (`.search-results-item-description`, shown under the image on the source, e.g.
// the Octavia story), never data-caption or alt: those are not shown there, and
// an alt fallback would put a caption under every Epiq image. Absent → empty cell.
// Only the paragraphs' text is kept (the source's inline font-size/centring styles
// are presentation, owned by the block).
function itemDescription(item, document) {
  const desc = item.querySelector?.('.search-results-item-description');
  if (!desc || !(desc.textContent || '').trim()) return '';
  const paras = [...desc.querySelectorAll('p')]
    .map((p) => (p.textContent || '').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const texts = paras.length ? paras : [desc.textContent.replace(/\s+/g, ' ').trim()];
  return texts.map((t) => {
    const p = document.createElement('p');
    p.textContent = t;
    return p;
  });
}

// Build a Gallery block (SKODA-203 / story-detail.md STO-D04): one row per image,
// [img, caption]. Used for link-free image sets (sow-slider and image carousels).
// `blockName` picks the variant: link-free carousels render as the one-image
// slider (`Gallery (slider)`, SKODA-819) captioned by the item description;
// sow-slider keeps the default Gallery and its data-caption → title → alt caption.
function galleryCells(panel, document, blockName = 'Gallery') {
  const imgs = [...panel.querySelectorAll('img')];
  if (!imgs.length) return null;
  const slider = blockName === CAROUSEL_GALLERY;
  const cells = [[blockName]];
  imgs.forEach((img) => {
    const item = img.closest('.search-results-item, .item, figure') || img;
    cells.push([img, slider ? itemDescription(item, document) : itemCaption(img, item)]);
  });
  return cells.length > 1 ? cells : null;
}

// skoda-carousel-widget is used BOTH ways in the corpus (variance confirmed 2026-09-24:
// build-inspected stories were link-free IMAGE carousels; the earlier 5-story POC saw
// link-bearing related-story TEASER cards). So route by CONTENT, not by widget name
// (repo rule: content-driven detection):
//   items carry links → related-story teasers → Cards block ([img, linked-title])
//   items are link-free → the article's own photo set → Gallery (slider) block
//   ([img, caption]), rendered like the source: one image per view (SKODA-819)
const CAROUSEL_GALLERY = 'Gallery (slider)';
function carouselCells(panel, document) {
  const items = [...panel.querySelectorAll('.search-results-item')];
  // odd shape → treat as images
  if (!items.length) return galleryCells(panel, document, CAROUSEL_GALLERY);
  const linked = items.filter((it) => it.querySelector('a[href]')).length;
  // Teaser only when a clear majority of items link out (a stray caption link in an
  // image set must not flip the whole widget to Cards).
  if (linked < Math.ceil(items.length / 2)) return galleryCells(panel, document, CAROUSEL_GALLERY);

  const cells = [['Cards']];
  items.forEach((it) => {
    const img = it.querySelector('img');
    const link = it.querySelector('a[href]');
    if (!img && !link) return;
    const title = itemCaption(img || it, it) || (link && (link.textContent || '').trim()) || '';
    if (link) {
      const a = document.createElement('a');
      a.setAttribute('href', link.getAttribute('href'));
      a.textContent = title || 'Read more';
      const p = document.createElement('p');
      p.appendChild(a);
      cells.push([img || '', [p]]);
    } else {
      cells.push([img || '', title]);
    }
  });
  return cells.length > 1 ? cells : null;
}

function quoteNodes(panel, document) {
  const text = (panel.textContent || '').replace(/\s+/g, ' ').trim();
  if (!text) return [];
  const bq = document.createElement('blockquote');
  const p = document.createElement('p');
  p.textContent = text;
  bq.appendChild(p);
  return [bq];
}

function figureNodes(panel, document) {
  // skoda-captioned-image: the widget usually contains a NATIVE <figure class="figure">
  // (sometimes with a <figcaption>). Lift the existing figure and normalise it rather
  // than building a fresh one, so a real caption is never lost (D2, 2026-09-24). The
  // caption source order matches gallery.js: native figcaption → data-caption → alt.
  const img = panel.querySelector('img');
  if (!img) return [];
  const srcFig = panel.querySelector('figure');
  const fig = document.createElement('figure');
  fig.appendChild(img);
  const nativeCap = srcFig && srcFig.querySelector('figcaption');
  const caption = (nativeCap && (nativeCap.textContent || '').trim())
    || img.getAttribute('data-caption')
    || (panel.querySelector('[data-caption]') && panel.querySelector('[data-caption]').getAttribute('data-caption'))
    || '';
  if ((caption || '').trim()) {
    const fc = document.createElement('figcaption');
    fc.textContent = caption.trim();
    fig.appendChild(fc);
  }
  return [fig];
}

// skoda-image-box is an INFObox / definition callout (a label + explanatory text,
// sometimes with an image), NOT a plain image (D2, 2026-09-24). Source shape:
// `<abbr class="infobox"><abbr class="infobox-content">…rich text…</abbr></abbr>`,
// occasionally alongside an <img>. Preserve BOTH the text and (if present) the image
// as default content — keep the text as its own paragraph(s) so nothing is dropped.
function infoboxNodes(panel, document) {
  const out = [];
  const img = panel.querySelector('img');
  if (img) out.push(img);
  // The definition body: the infobox-content, else the widget's own text.
  const body = panel.querySelector('.infobox-content, [class*="infobox"]') || panel;
  // Prefer real child elements (p/ul/etc.); fall back to a single paragraph of the text.
  const rich = [...body.children].filter((n) => n.nodeType === 1
    && !/^(abbr)$/i.test(n.tagName) // skip the wrapping <abbr>, recurse into its content instead
    && (n.textContent || '').trim());
  if (rich.length) {
    rich.forEach((n) => out.push(n));
  } else {
    const text = (body.textContent || '').replace(/\s+/g, ' ').trim();
    if (text) {
      const p = document.createElement('p');
      p.textContent = text;
      out.push(p);
    }
  }
  return out;
}

function imageNodes(panel, document) {
  // sow-image: lift the <img> out to a direct child (EDS wraps it in <picture>).
  const img = panel.querySelector('img');
  return img ? [img] : [];
}

// ys-milestones = a dated timeline (SKODA-815 / D1). Source shape:
// `section.milestones > ul > li` where each <li> holds `.year`, `.title` (rich text)
// and an `<img>`. Reduced-fidelity flatten (M1): each milestone → an <h3> "YEAR — Title"
// heading + its image lifted to a direct child (EDS wraps it in <picture>), in order.
// No content is dropped; the source's timeline visual is not reproduced (see SKODA-815
// for the optional dedicated timeline block). Falls back gracefully if the DOM differs.
function milestonesNodes(panel, document) {
  const items = [...panel.querySelectorAll('li')].filter((li) => li.querySelector('.year, .title, img'));
  const out = [];
  items.forEach((li) => {
    const year = (li.querySelector('.year')?.textContent || '').replace(/\s+/g, ' ').trim();
    const title = (li.querySelector('.title')?.textContent || '').replace(/\s+/g, ' ').trim();
    if (year || title) {
      const h = document.createElement('h3');
      h.textContent = [year, title].filter(Boolean).join(' — ');
      out.push(h);
    }
    const img = li.querySelector('img');
    if (img) out.push(img);
  });
  // Defensive: unexpected DOM (no <li> entries) → salvage any images + text so nothing
  // is silently lost, rather than emitting an empty block.
  if (!out.length) {
    panel.querySelectorAll('img').forEach((img) => out.push(img));
    const text = (panel.textContent || '').replace(/\s+/g, ' ').trim();
    if (text && !panel.querySelector('img')) {
      const p = document.createElement('p');
      p.textContent = text;
      out.push(p);
    }
  }
  return out;
}

function buttonNodes(panel, document) {
  const a = panel.querySelector('a[href]');
  if (!a) return [];
  const p = document.createElement('p');
  const strong = document.createElement('strong');
  const link = document.createElement('a');
  link.setAttribute('href', a.getAttribute('href'));
  link.textContent = (a.textContent || '').trim() || a.getAttribute('href');
  strong.appendChild(link);
  p.appendChild(strong);
  return [p];
}

// ---- highlight rows (SKODA-824, contract highlight v2) ---------------------
// A SiteOrigin row with a background colour (the story dark box, `#0e3a2f` on all 16 M1
// rows) is a highlight panel, not scaffolding: it becomes its own section closed by
// `Section Metadata` style `body-column, highlight-dark` (a light background → `-grey`).
// `body-column` keeps the section in the story's reading track. The colour lives in the
// page's SiteOrigin head CSS (`#pg-<id>> .panel-row-style { background-color: … }`),
// which the cleanup transformers strip, so the importer's `preprocess` calls
// markHighlights() on the untouched DOM and the walk below reads `data-highlight`.
const BODY_STYLE = 'body-column'; // import-story-detail.js section-2 style
const HIGHLIGHT_ATTR = 'data-highlight';

/** `dark` / `grey` for a panel background colour; null for none, white or unparseable. */
function highlightVariant(color) {
  const value = (color || '').trim().toLowerCase();
  let rgb = null;
  const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].replace(/./g, '$&$&') : hex[1];
    rgb = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  } else {
    const fn = value.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)(?:[\s,/]+([\d.]+%?))?\s*\)$/);
    if (fn && !(fn[4] !== undefined && parseFloat(fn[4]) === 0)) rgb = fn.slice(1, 4).map(Number);
  }
  if (!rgb) return null;
  const luminance = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
  if (luminance > 0.98) return null; // white: no panel
  return luminance < 0.5 ? 'dark' : 'grey';
}

/** Mark every background-styled builder row (head CSS or inline). Returns the count. */
export function markHighlights(document) {
  const css = [...document.querySelectorAll('style')].map((s) => s.textContent || '').join('\n');
  const byId = new Map();
  for (const [, selectors, body] of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    const color = (body.match(/background(?:-color)?\s*:\s*([^;]+)/i) || [])[1];
    const variant = highlightVariant(color && color.replace(/!important/i, ''));
    if (!variant) continue;
    selectors.split(',').forEach((sel) => {
      const m = sel.trim().match(/^#(pg-[\w-]+)\s*>\s*\.panel-row-style$/);
      if (m) byId.set(m[1], variant);
    });
  }
  let count = 0;
  document.querySelectorAll('.panel-grid').forEach((grid) => {
    const row = grid.querySelector(':scope > .panel-row-style');
    const inline = row && (row.getAttribute('style') || '').match(/background(?:-color)?\s*:\s*([^;]+)/i);
    const variant = byId.get(grid.id) || (inline && highlightVariant(inline[1]));
    if (!variant) return;
    grid.setAttribute(HIGHLIGHT_ATTR, variant);
    count += 1;
  });
  return count;
}

// ---- unequal 2-cell rows (SKODA-225, contract columns-split v2) -------------------
// SiteOrigin sizes each cell in the page's head CSS (`#pgc-<id> { width:61.8% }`, sometimes
// `calc(61.8% - …)`), which the cleanup transformers strip, so the importer's `preprocess`
// calls markCellWidths() on the untouched DOM and emitMultiColumn() reads `data-cell-width`.
const CELL_WIDTH_ATTR = 'data-cell-width';

/** Tag every builder cell with its CSS width share (a % number). Returns the count. */
export function markCellWidths(document) {
  const css = [...document.querySelectorAll('style')].map((s) => s.textContent || '').join('\n');
  const byId = new Map();
  for (const [, selectors, body] of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    const width = (body.match(/(?:^|;)\s*width\s*:\s*(?:calc\(\s*)?([\d.]+)%/i) || [])[1];
    if (!width) continue;
    selectors.split(',').forEach((sel) => {
      const m = sel.trim().match(/^#(pgc-[\w-]+)$/);
      if (m) byId.set(m[1], parseFloat(width));
    });
  }
  let count = 0;
  document.querySelectorAll('.panel-grid-cell[id]').forEach((cell) => {
    const width = byId.get(cell.id);
    if (!width) return;
    cell.setAttribute(CELL_WIDTH_ATTR, String(width));
    count += 1;
  });
  return count;
}

/**
 * The `split-NN` variant for a row's two non-empty cells: the first cell's share of the two,
 * in %, rounded. Null when a width is unknown, the cells are (nearly) equal, or the share is
 * outside the contract's 10–99.
 */
export function splitVariant(cells) {
  if (cells.length !== 2) return null;
  const [a, b] = cells.map((c) => parseFloat(c.getAttribute(CELL_WIDTH_ATTR)));
  if (!(a > 0) || !(b > 0) || Math.abs(a - b) < 2) return null;
  const share = Math.round((a / (a + b)) * 100);
  return share >= 10 && share <= 99 ? `split-${share}` : null;
}

/**
 * The `portrait-NNN` variant: the authored display width of a cell's single image, when it
 * is smaller than the file (the source shows `width="235"` portraits of 500px files; DA keeps
 * only the file's own size). An image whose width is its file width (the largest `srcset`
 * descriptor, e.g. a sow-image) fills its cell instead: no token.
 */
export function portraitVariant(cells) {
  const imgs = cells.flatMap((c) => [...c.querySelectorAll('img')]);
  if (imgs.length !== 1) return null;
  const img = imgs[0];
  const width = parseInt(img.getAttribute('width'), 10);
  if (!(width >= 10 && width <= 999)) return null;
  const descriptors = (img.getAttribute('srcset') || '').match(/\s(\d+)w\b/g) || [];
  const fileWidth = Math.max(0, ...descriptors.map((d) => parseInt(d, 10)));
  if (fileWidth && width >= fileWidth) return null;
  return `portrait-${width}`;
}

/** Whether readable content follows `node` inside `root` (avoids an empty section). */
function hasContentAfter(node, root) {
  for (let n = node; n && n !== root; n = n.parentNode) {
    for (let s = n.nextSibling; s; s = s.nextSibling) {
      if ((s.textContent || '').trim() || (s.querySelector && s.querySelector('img, picture, iframe, table'))) return true;
    }
  }
  return false;
}

function sectionMetadata(style, document) {
  return WebImporter.DOMUtils.createTable([['Section Metadata'], ['style', style]], document);
}

const isSectionMetadata = (el) => el.tagName === 'TABLE'
  && /^section metadata$/i.test(((el.querySelector('tr > th, tr > td') || {}).textContent || '').trim());

/**
 * Drop every section that holds nothing but Section Metadata, e.g. the `body-column`
 * section skoda-model-sections opens when the first builder row is a highlight panel.
 * Call after afterTransform, once every break and Section Metadata is in place. Returns
 * the number of sections dropped.
 */
export function dropEmptySections(root) {
  const doc = root.ownerDocument;
  const breaks = [...root.querySelectorAll('hr')].filter((hr) => !hr.closest('table'));
  const between = (hr, i, el) => (hr.compareDocumentPosition(el) & hr.DOCUMENT_POSITION_FOLLOWING)
    && (!breaks[i + 1] || (breaks[i + 1].compareDocumentPosition(el) & hr.DOCUMENT_POSITION_PRECEDING));
  const empty = breaks.map((hr, i) => {
    const range = doc.createRange();
    range.setStartAfter(hr);
    if (breaks[i + 1]) range.setEndBefore(breaks[i + 1]);
    else range.setEnd(root, root.childNodes.length);
    const rest = range.cloneContents();
    rest.querySelectorAll('table').forEach((t) => { if (isSectionMetadata(t)) t.remove(); });
    const isEmpty = !(rest.textContent || '').trim() && !rest.querySelector('img, picture, video, iframe, table');
    return isEmpty && [hr, ...[...root.querySelectorAll('table')].filter((t) => isSectionMetadata(t) && between(hr, i, t))];
  }).filter(Boolean);
  empty.forEach((nodes) => nodes.forEach((n) => n.remove()));
  return empty.length;
}

// ---- tree walk ------------------------------------------------------------

// Direct panel-grid-cell children of a grid (SiteOrigin sometimes wraps cells in a
// .panel-row-style element, so look one level down too).
function cellsOf(grid) {
  const direct = [...grid.children].flatMap((c) => {
    if (c.classList && c.classList.contains('panel-grid-cell')) return [c];
    return [...c.querySelectorAll(':scope > .panel-grid-cell')];
  });
  return direct;
}

// Widgets (.so-panel) directly inside a cell, or inside the cell's style wrapper
// (`.panel-cell-style`, e.g. the charging story's portrait cell; it was dropped as empty).
function panelsOf(cell) {
  return [...cell.querySelectorAll([':scope > .so-panel', ':scope > [class*="widget_"]',
    ':scope > .panel-cell-style > .so-panel', ':scope > .panel-cell-style > [class*="widget_"]'].join(', '))];
}

// Flatten one widget → nodes / block table appended to `out`. Returns a stats delta.
function emitWidget(panel, document, out, stats) {
  const kind = classifyWidget(panel);
  stats.byKind[kind] = (stats.byKind[kind] || 0) + 1;

  if (DEFERRED.has(kind)) { stats.deferred.push(kind); return; }
  if (DROPPED.has(kind)) return;

  let cells = null;
  let nodes = null;
  switch (kind) {
    case 'editor': nodes = editorNodes(panel, document); break;
    // carousel-widget routes by content (Cards if teasers-with-links, else Gallery (slider));
    // sow-slider is always an image slider → Gallery.
    case 'carousel': cells = carouselCells(panel, document); break;
    case 'slider': cells = galleryCells(panel, document); break;
    case 'quote': nodes = quoteNodes(panel, document); break;
    case 'captioned-image': nodes = figureNodes(panel, document); break;
    case 'image-box': nodes = infoboxNodes(panel, document); break;
    case 'image': nodes = imageNodes(panel, document); break;
    case 'button': nodes = buttonNodes(panel, document); break;
    case 'milestones': nodes = milestonesNodes(panel, document); break;
    default:
      // unknown: try to salvage rich text, else skip + log.
      nodes = editorNodes(panel, document);
      if (!nodes.length) { stats.unknown.push(panel.className || '(no class)'); return; }
  }

  if (cells) {
    out.push(WebImporter.DOMUtils.createTable(cells, document));
  } else if (nodes && nodes.length) {
    nodes.forEach((n) => out.push(n));
  }
}

// Emit a genuine multi-column grid as a Columns block: one row, one cell per column.
// createTable takes plain-array cells (a cell = an array of nodes) — NOT an { elems }
// object (that is the runtime buildBlock format; here it serialises to "[object Object]").
// Two unequal cells carry their width ratio, and an authored-size image its width, as
// variants (`Columns (split-62, portrait-235)`, contract columns-split v2, SKODA-225).
function emitMultiColumn(cells, document, out, stats) {
  const row = [];
  const filled = [];
  cells.forEach((cell) => {
    const cellOut = [];
    panelsOf(cell).forEach((p) => emitWidget(p, document, cellOut, stats));
    if (cellOut.length) { row.push(cellOut); filled.push(cell); }
  });
  if (row.length > 1) {
    const split = splitVariant(filled);
    const variants = split ? [split, portraitVariant(filled)].filter(Boolean) : [];
    const header = variants.length ? `Columns (${variants.join(', ')})` : 'Columns';
    out.push(WebImporter.DOMUtils.createTable([[header], row], document));
    stats.multiColumn += 1;
    if (split) stats.split = (stats.split || 0) + 1;
  } else if (row.length === 1) {
    // Only one non-empty column after mapping — linearize (no block needed).
    row[0].forEach((n) => out.push(n));
  }
}

export default function parse(element, { document }) {
  const layout = element.querySelector('.panel-layout, .panel-grid');
  // Detection: no SiteOrigin tree → linear-story fallback. Leave content untouched;
  // the template's default-content selection handles the plain-post body.
  if (!layout) return;

  const grids = [...element.querySelectorAll('.panel-grid')]
    // only top-level grids (a nested-builder grid lives inside a widget; the
    // defer-nested-builder path handles those — don't double-walk).
    .filter((g) => !g.parentElement.closest('.so-panel'));

  const out = [];
  const stats = {
    grids: grids.length, byKind: {}, deferred: [], unknown: [], multiColumn: 0, highlights: 0,
  };

  // Highlight rows split the body: <hr> + row content + its Section Metadata, then the
  // body resumes in a fresh `body-column` section. Consecutive rows are one section each
  // (the runtime joins them). The body resumes only once a later row emits something
  // (spacer-only rows don't), or when content follows the builder tree, so no empty
  // section is emitted. A leading row still breaks here, keeping any body content before
  // it (the body section's own `body-column` metadata comes from skoda-model-sections);
  // if nothing precedes it, the importer's dropEmptySections() removes that empty section.
  let resume = false; // a highlight section was closed and the body hasn't resumed yet
  grids.forEach((grid) => {
    const variant = grid.getAttribute(HIGHLIGHT_ATTR);
    const row = [];
    const cells = cellsOf(grid);
    const nonEmpty = cells.filter((c) => panelsOf(c).length > 0);
    if (nonEmpty.length > 1) {
      emitMultiColumn(nonEmpty, document, row, stats);
    } else {
      // Single column (the common case): linearize widgets in order.
      cells.forEach((cell) => panelsOf(cell).forEach((p) => emitWidget(p, document, row, stats)));
    }
    if (!row.length) return;
    if (variant) {
      out.push(document.createElement('hr'), ...row, sectionMetadata(`${BODY_STYLE}, highlight-${variant}`, document));
      stats.highlights += 1;
      resume = true;
      return;
    }
    if (resume) out.push(document.createElement('hr'), sectionMetadata(BODY_STYLE, document));
    resume = false;
    out.push(...row);
  });
  if (resume && hasContentAfter(layout, element)) {
    out.push(document.createElement('hr'), sectionMetadata(BODY_STYLE, document));
  }

  // Replace the whole builder subtree with the flat sequence. Wrap in a plain <div>
  // so the parser's element (.content) keeps its shell; markdown conversion drops the
  // wrapper and keeps the flat h/p/ul/figure/blockquote + block tables.
  const container = layout.closest('.entry-content') || layout.parentElement;
  const holder = document.createElement('div');
  out.forEach((n) => holder.appendChild(n));
  // Remove the original builder tree, then append the flattened content.
  layout.replaceWith(holder);
  // Unwrap the holder so its children sit directly in the content column.
  holder.replaceWith(...holder.childNodes);

  // Never silent: log the flatten outcome for QA + the census-corpus run.
  const summary = {
    grids: stats.grids,
    widgets: Object.values(stats.byKind).reduce((a, b) => a + b, 0),
    byKind: stats.byKind,
    multiColumn: stats.multiColumn,
    split: stats.split || 0,
    highlights: stats.highlights,
    deferred: stats.deferred,
    unknown: stats.unknown,
  };
  if (stats.deferred.length || stats.unknown.length) {
    console.warn(`[story-flatten] deferred/unknown widgets: ${JSON.stringify(summary)}`);
  } else {
    console.log(`[story-flatten] flattened: ${JSON.stringify(summary)}`);
  }
}

// Exposed for unit/prototype testing (harness-only; ignored by the bundle default).
export const __test = {
  classifyWidget, cellsOf, panelsOf, WIDGET_KINDS, splitVariant, portraitVariant,
};
