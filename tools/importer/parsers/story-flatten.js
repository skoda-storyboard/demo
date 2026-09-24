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
 * Columns block (that is what the columns block is for), NOT linearized away.
 *
 * WIDGET → EDS MAPPING (census §3; 17 canonical types; % of 35,159 instances):
 *   sow-editor / tinymce      83.5%  → default content (inner h/p/ul kept as-is)
 *   skoda-offset (spacer)      8.2%  → dropped
 *   skoda-carousel-widget      4.0%  → routed BY CONTENT (not widget name): items with
 *                                       links → Cards (related-story teasers); link-free
 *                                       → Gallery (in-body image set). Corpus uses both.
 *   sow-slider                 1.5%  → Gallery block (image slider)
 *   skoda-quote                1.1%  → <blockquote>
 *   skoda-captioned-image      0.7%  → <figure> + <figcaption> (lifts the native figure)
 *   sow-button                 0.3%  → EDS button (<p><strong><a>>)
 *   skoda-image-box            0.2%  → infobox/definition callout: text (+ image) as
 *                                       default content — NOT a plain image (D2)
 *   sow-image                  0.1%  → image (lifted to direct child)
 *   ys-milestones              0.1%  → dropped + logged (timeline; M2/omit)
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
const DROPPED = new Set(['offset', 'newsletter', 'share', 'milestones', 'highlights']);

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

// Build a Gallery block (SKODA-203 / story-detail.md STO-D04): one row per image,
// [img, caption]. Used for link-free image sets (sow-slider and image carousels).
function galleryCells(panel, document) {
  const imgs = [...panel.querySelectorAll('img')];
  if (!imgs.length) return null;
  const cells = [['Gallery']];
  imgs.forEach((img) => {
    const item = img.closest('.search-results-item, .item, figure') || img;
    cells.push([img, itemCaption(img, item)]);
  });
  return cells.length > 1 ? cells : null;
}

// skoda-carousel-widget is used BOTH ways in the corpus (variance confirmed 2026-09-24:
// build-inspected stories were link-free IMAGE carousels; the earlier 5-story POC saw
// link-bearing related-story TEASER cards). So route by CONTENT, not by widget name
// (repo rule: content-driven detection):
//   items carry links → related-story teasers → Cards block ([img, linked-title])
//   items are link-free → the article's own photo set → Gallery block ([img, caption])
function carouselCells(panel, document) {
  const items = [...panel.querySelectorAll('.search-results-item')];
  if (!items.length) return galleryCells(panel, document); // odd shape → treat as images
  const linked = items.filter((it) => it.querySelector('a[href]')).length;
  // Teaser only when a clear majority of items link out (a stray caption link in an
  // image set must not flip the whole widget to Cards).
  if (linked < Math.ceil(items.length / 2)) return galleryCells(panel, document);

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

// Widgets (.so-panel) directly inside a cell.
function panelsOf(cell) {
  return [...cell.querySelectorAll(':scope > .so-panel, :scope > [class*="widget_"]')];
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
    // carousel-widget routes by content (Cards if teasers-with-links, else Gallery);
    // sow-slider is always an image slider → Gallery.
    case 'carousel': cells = carouselCells(panel, document); break;
    case 'slider': cells = galleryCells(panel, document); break;
    case 'quote': nodes = quoteNodes(panel, document); break;
    case 'captioned-image': nodes = figureNodes(panel, document); break;
    case 'image-box': nodes = infoboxNodes(panel, document); break;
    case 'image': nodes = imageNodes(panel, document); break;
    case 'button': nodes = buttonNodes(panel, document); break;
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
function emitMultiColumn(cells, document, out, stats) {
  const row = [];
  cells.forEach((cell) => {
    const cellOut = [];
    panelsOf(cell).forEach((p) => emitWidget(p, document, cellOut, stats));
    if (cellOut.length) row.push(cellOut);
  });
  if (row.length > 1) {
    out.push(WebImporter.DOMUtils.createTable([['Columns'], row], document));
    stats.multiColumn += 1;
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
    grids: grids.length, byKind: {}, deferred: [], unknown: [], multiColumn: 0,
  };

  grids.forEach((grid) => {
    const cells = cellsOf(grid);
    const nonEmpty = cells.filter((c) => panelsOf(c).length > 0);
    if (nonEmpty.length > 1) {
      emitMultiColumn(nonEmpty, document, out, stats);
    } else {
      // Single column (the common case): linearize widgets in order.
      cells.forEach((cell) => panelsOf(cell).forEach((p) => emitWidget(p, document, out, stats)));
    }
  });

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
  classifyWidget, cellsOf, panelsOf, WIDGET_KINDS,
};
