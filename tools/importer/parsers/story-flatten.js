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
 *   siteorigin-panels-builder 0.02%  → its rows, flattened as the top-level ones (older stories
 *                                       keep their whole body in one: the Miss Peaches series,
 *                                       SKODA-516); inside a Columns cell they linearize
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
  [/siteorigin-panels-builder/, 'nested-builder'],
];

const DEFERRED = new Set(['defer-charge-map', 'defer-calculator']);
const DROPPED = new Set(['newsletter', 'share', 'highlights']);

// The spacer widget (`skoda-offset`: `<div style="padding-top:1em">` at the widget's 24px font,
// shown from 720px): its height in px, 0 when unreadable.
const SPACER_EM_PX = 24;
// a blank editor paragraph (`<p>&nbsp;</p>`, 23 in 14 stories): one body line and its gap, at
// every width (it is text, not a spacer widget)
const BLANK_LINE_PX = 44;
// helix-importer's preProcess drops an empty paragraph, so `preprocess` (markTextStyles) marks
// each blank one and gives it a placeholder text to survive until the flatten
const BLANK_ATTR = 'data-skoda-blank';
const isBlank = (n) => n.nodeType === 1 && n.tagName === 'P'
  && !n.querySelector('img, picture, iframe, video, table') && !n.textContent.replace(/[\s\u00a0]/g, '');
const isBlankParagraph = (n) => n.nodeType === 1 && n.tagName === 'P' && n.hasAttribute(BLANK_ATTR);
/** The blank paragraphs leading an editor widget, in px (they push its text down). */
function leadingBlankHeight(panel) {
  const tiny = panel.querySelector('.siteorigin-widget-tinymce, .textwidget');
  if (!tiny) return 0;
  let height = 0;
  for (const el of tiny.children) {
    if (!isBlankParagraph(el) && !isBlank(el)) break;
    height += BLANK_LINE_PX;
  }
  return height;
}
export function spacerHeight(panel) {
  const value = (panel.querySelector('[style*="padding-top"]')?.getAttribute('style') || '')
    .match(/padding-top:\s*([\d.]+)(em|px)/i);
  if (!value) return 0;
  const n = parseFloat(value[1]);
  return Math.round(value[2].toLowerCase() === 'em' ? n * SPACER_EM_PX : n);
}

function classifyWidget(panel) {
  // a nested layout's own class wins (bare or `widget_`): its first inner widget (often a
  // text editor) would otherwise name the whole layout, and only that widget would survive
  // (SKODA-516)
  if (/siteorigin-panels-builder/.test(panel.className || '')) return 'nested-builder';
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
  // a line break closing an inline (`<strong>instagram:<br></strong>`, the Miss Peaches
  // profiles) is lost in DA; after the inline it breaks the line as on the source
  tiny.querySelectorAll(':is(strong, b, em, i, span) > br:last-child').forEach((br) => {
    if (!(br.nextSibling?.textContent || '').trim()) br.parentElement.after(br);
  });
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

// `withAlt` is for card TITLES only (a teaser needs a label). A gallery caption is never the
// alt (often the file name or the page title, never shown on the source; SKODA-830 audit 4.4).
function itemCaption(img, item, withAlt = true) {
  // data-caption first (~53% of Škoda captions live there), then colorbox title, then alt.
  const capSource = (img.getAttribute('data-caption') && img)
    || item.querySelector?.('[data-caption]')
    || item;
  return (capSource.getAttribute && capSource.getAttribute('data-caption'))
    || (item.querySelector?.('a[title]') && item.querySelector('a[title]').getAttribute('title'))
    || (withAlt && img.getAttribute('alt')) || '';
}

// The slider's visible caption is the carousel item's optional description
// (`.search-results-item-description`, shown under the image on the source, e.g.
// the Octavia story), never data-caption or alt: those are not shown there, and
// an alt fallback would put a caption under every Epiq image. Absent → empty cell.
// Only the paragraphs' text is kept (the source's inline font-size/centring styles
// are presentation, owned by the block).
//
// D5 (SKODA-830, user decision 2026-10-06 "Keep it, visible"): a lightbox-only data-caption
// that is a regulatory consumption / CO₂ disclaimer stays, as a visible note under the
// image (after the description, if any). Every other lightbox-only caption is dropped.
function itemDescription(item, document, img) {
  const desc = item.querySelector?.('.search-results-item-description');
  const paras = desc ? [...desc.querySelectorAll('p')]
    .map((p) => (p.textContent || '').replace(/\s+/g, ' ').trim())
    .filter(Boolean) : [];
  const descText = desc ? desc.textContent.replace(/\s+/g, ' ').trim() : '';
  const texts = paras.length || !descText ? paras : [descText];
  const note = regulatoryCaption(img, item);
  if (note && !texts.some((t) => t.includes(note))) texts.push(note);
  if (!texts.length) return '';
  return texts.map((t) => {
    const p = document.createElement('p');
    p.textContent = t;
    return p;
  });
}

// A consumption / CO₂ disclaimer, detected conservatively: a WLTP mention, or a consumption
// figure (kWh/100 km, l/100 km) together with an emissions figure (CO₂/CO2 emissions, g/km).
// A narrative caption that only mentions "energy consumption" or a kWh/100 km result (e.g.
// the Peaq aerodynamics or 936 km range photos) is not one.
const CONSUMPTION_RE = /\b(?:kWh|l)\s*\/\s*100\s*km\b/i;
const EMISSIONS_RE = /\bCO(?:₂|2)\s+emissions?\b|\bg\s*\/\s*km\b/i;
export function isRegulatoryCaption(text) {
  const t = (text || '').replace(/\s+/g, ' ').trim();
  if (!t) return false;
  return /\bWLTP\b/.test(t) || (CONSUMPTION_RE.test(t) && EMISSIONS_RE.test(t));
}

function regulatoryCaption(img, item) {
  const holder = (img && img.getAttribute && img.getAttribute('data-caption') && img)
    || item.querySelector?.('[data-caption]');
  const text = holder ? (holder.getAttribute('data-caption') || '').replace(/\s+/g, ' ').trim() : '';
  return isRegulatoryCaption(text) ? text : '';
}

// Build a Gallery block (SKODA-203 / story-detail.md STO-D04): one row per image,
// [img, caption]. Used for link-free image sets (sow-slider and image carousels).
// `blockName` picks the variant: link-free carousels render as the one-image
// slider (`Gallery (slider)`, SKODA-819) captioned by the item description;
// sow-slider keeps the default Gallery and its data-caption → title caption (no alt).
function galleryCells(panel, document, blockName = 'Gallery') {
  const imgs = [...panel.querySelectorAll('img')];
  if (!imgs.length) return null;
  const slider = blockName === CAROUSEL_GALLERY;
  const cells = [[blockName]];
  imgs.forEach((img) => {
    const item = img.closest('.search-results-item, .item, figure') || img;
    cells.push([img, slider ? itemDescription(item, document, img) : itemCaption(img, item, false)]);
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

// A panel's own colours (#516 PO, measured on the live stories 2026-10-16): the source's panels
// come in 12 colours (#0e3a2f on 36 of 59, then cyan #1ed4df, green #4ba82e, blue #325880, …),
// their text and link colours set inline (`<a style="color: #ffffff">`, which DA drops). Each
// differing from its variant's default travels as a row: `highlight-background`,
// `highlight-color` (the colour most of the text is set in), `highlight-link`.
const PANEL_DEFAULTS = { dark: { background: '#0e3a2f', color: '#ffffff' }, grey: { background: '', color: '' } };
const hexColour = (value) => {
  const v = String(value || '').trim().toLowerCase();
  const hex = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (hex) return `#${hex[1].length === 3 ? hex[1].replace(/./g, '/** Mark every background-styled builder row (head CSS or inline). Returns the count. *//** Mark every background-styled builder row (head CSS or inline). Returns the count. */') : hex[1]}`;
  const fn = v.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/);
  return fn ? `#${fn.slice(1, 4).map((n) => Number(n).toString(16).padStart(2, '0')).join('')}` : '';
};
function panelColours(row, { variant, color }) {
  const out = {};
  const background = hexColour(color);
  if (background && background !== PANEL_DEFAULTS[variant].background) out['highlight-background'] = background;
  // the colour the most text (outside links) / link text is set in inline, by text length
  const text = new Map(); const links = new Map();
  const walker = row.ownerDocument.createTreeWalker(row, 4 /* SHOW_TEXT */);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const length = n.textContent.trim().length;
    if (length && n.parentElement.closest('.textwidget')) {
      let colour = '';
      for (let p = n.parentElement; p && p !== row && !colour; p = p.parentElement) {
        const decl = (p.getAttribute('style') || '').match(/(?:^|;)\s*color\s*:\s*([^;]+)/i);
        if (decl) colour = hexColour(decl[1]);
      }
      const bucket = n.parentElement.closest('a') ? links : text;
      bucket.set(colour, (bucket.get(colour) || 0) + length);
    }
  }
  const top = (m) => [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  const textColour = top(text);
  if (textColour && textColour !== PANEL_DEFAULTS[variant].color) out['highlight-color'] = textColour;
  const linkColour = top(links);
  if (linkColour) out['highlight-link'] = linkColour;
  return out;
}

/** Mark every background-styled builder row (head CSS or inline). Returns the count. */
export function markHighlights(document) {
  const css = [...document.querySelectorAll('style')].map((s) => s.textContent || '').join('\n');
  const byId = new Map();
  for (const [, selectors, body] of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    const color = (body.match(/background(?:-color)?\s*:\s*([^;]+)/i) || [])[1];
    const value = color && color.replace(/!important/i, '').trim();
    const variant = highlightVariant(value);
    if (!variant) continue;
    selectors.split(',').forEach((sel) => {
      const m = sel.trim().match(/^#(pg-[\w-]+)\s*>\s*\.panel-row-style$/);
      if (m) byId.set(m[1], { variant, color: value });
    });
  }
  let count = 0;
  const geometry = highlightGeometry(css);
  document.querySelectorAll('.panel-grid').forEach((grid) => {
    const row = grid.querySelector(':scope > .panel-row-style');
    const inline = row && (row.getAttribute('style') || '').match(/background(?:-color)?\s*:\s*([^;]+)/i);
    const panel = byId.get(grid.id)
      || (inline && highlightVariant(inline[1]) && { variant: highlightVariant(inline[1]), color: inline[1].trim() });
    if (!panel) return;
    const { variant } = panel;
    grid.setAttribute(HIGHLIGHT_ATTR, variant);
    Object.entries(geometry(grid)).forEach(([key, value]) => grid.setAttribute(`data-${key}`, value));
    Object.entries(panelColours(row || grid, panel)).forEach(([key, value]) => grid.setAttribute(`data-${key}`, value));
    count += 1;
  });
  return count;
}

// ---- highlight geometry (PO, 2026-10-13: the panel inset as the source) ----
// The source panel's content sits its row padding + the 10px cell padding + each widget's
// margin in. Most panels keep the theme's widget margin (`0 15px` from 781px, `15px` all round
// up to 780px) and no row padding, which styles.css draws by default. A layout that sets its own
// (`#pl-… #panel-… { margin:0px 0px 0px 20px }`, `#pg-…> .panel-row-style { padding:… }`, a
// `@media (max-width:780px)` copy for mobile) travels as Section Metadata rows the story runtime
// reads; a value absent on mobile is the desktop one there too, no margin at all is 0.
const DEFAULT_TEXT_MARGIN = ['0px 15px 0px 15px', '15px 15px 15px 15px'];
const MEDIA_780 = /@media[^{]*max-width:\s*780px[^{]*\{((?:[^{}]*\{[^{}]*\})*)[^{}]*\}/g;

/** `0px 15px` / `15px` / `0` → `0px 15px 0px 15px`; null for anything but px/0 lengths. */
function boxValue(value) {
  const parts = String(value || '').trim().split(/\s+/).map((v) => (v === '0' ? '0px' : v));
  if (!parts[0] || parts.length > 4 || !parts.every((v) => /^\d+(?:\.\d+)?px$/.test(v))) return null;
  const [t, r = t, b = t, l = r] = parts;
  return `${t} ${r} ${b} ${l}`;
}

function highlightGeometry(css) {
  const rules = (text) => [...text.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .map(([, sel, body]) => ({ sels: sel.split(',').map((s) => s.trim()), body }));
  const mobile = rules([...css.matchAll(MEDIA_780)].map((m) => m[1]).join('\n'));
  const desktop = rules(css.replace(/@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, ''));
  const find = (list, test, prop) => {
    let found = null;
    list.forEach(({ sels, body }) => {
      if (!sels.some(test)) return;
      const m = body.match(new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;!]+)`, 'i'));
      if (m) found = boxValue(m[1]);
    });
    return found;
  };
  const margins = (panel, fallback) => {
    if (!panel) return null;
    const test = (s) => s.endsWith(`#${panel.id}`);
    const d = find(desktop, test, 'margin');
    const m = find(mobile, test, 'margin') || d;
    return [d || fallback, m || fallback];
  };
  return (grid) => {
    const out = {};
    // a multi-column row has a margin per cell; its Columns block keeps the default inset
    const cells = grid.querySelectorAll(':scope > .panel-row-style > .panel-grid-cell, :scope > .panel-grid-cell');
    if ([...cells].filter((c) => c.querySelector('.so-panel')).length > 1) return out;
    const isRow = (s) => s.replace(/\s+/g, '') === `#${grid.id}>.panel-row-style`;
    const padD = find(desktop, isRow, 'padding');
    const padM = find(mobile, isRow, 'padding') || padD;
    if (padD) out['highlight-padding'] = padD;
    if (padM) out['highlight-padding-mobile'] = padM;
    const panels = [...grid.querySelectorAll(':scope > .panel-row-style > .panel-grid-cell > .so-panel, :scope > .panel-grid-cell > .so-panel')];
    const text = margins(panels.find((p) => p.matches('.widget_sow-editor, .widget_text')), '0px 0px 0px 0px');
    if (text && (text[0] !== DEFAULT_TEXT_MARGIN[0] || text[1] !== DEFAULT_TEXT_MARGIN[1])) {
      [out['highlight-margin'], out['highlight-margin-mobile']] = text;
    }
    const gallery = margins(panels.find((p) => p.matches('[class*="carousel-widget"], [class*="slider"]')), '0px 0px 0px 0px');
    if (gallery && (gallery[0] !== '0px 0px 0px 0px' || gallery[1] !== '0px 0px 0px 0px')) {
      [out['highlight-gallery-margin'], out['highlight-gallery-margin-mobile']] = gallery;
    }
    return out;
  };
}

const GEOMETRY_KEYS = ['highlight-padding', 'highlight-padding-mobile', 'highlight-margin',
  'highlight-margin-mobile', 'highlight-gallery-margin', 'highlight-gallery-margin-mobile',
  'highlight-background', 'highlight-color', 'highlight-link'];

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

/*
 * Bold headings (#296 review). The source bolds most story h3 text (`<h3><strong>…</strong></h3>`,
 * 17 of the 18 body h3 in the 21 demo stories) but not every one (Slavia "Technical
 * improvements"), and helix-importer's preProcess strips a heading's <strong>
 * (DOMUtils.reviewHeadings). So `preprocess` marks the headings whose every word is bold, and
 * `transform`, which runs after that clean-up, wraps their content in <strong> again: it reaches
 * DA as `### **…**`.
 */
const BOLD_ATTR = 'data-skoda-bold';

/** Whether every word of the heading sits inside a <strong> / <b> of its own. */
export function isBoldHeading(heading) {
  const words = (node) => (node.textContent || '').replace(/\s+/g, '');
  if (!words(heading)) return false;
  const walker = heading.ownerDocument.createTreeWalker(heading, 4 /* NodeFilter.SHOW_TEXT */);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const bold = node.parentElement.closest('strong, b');
    if (words(node) && !(bold && heading.contains(bold))) return false;
  }
  return true;
}

/** Mark the root's wholly bold headings, on the source as published. Returns the count. */
export function markBoldHeadings(root) {
  const bold = [...root.querySelectorAll('h1, h2, h3, h4, h5, h6')].filter(isBoldHeading);
  bold.forEach((h) => h.setAttribute(BOLD_ATTR, ''));
  return bold.length;
}

/** Wrap each marked heading's content in one <strong> again, and drop the mark. Returns the count. */
export function restoreBoldHeadings(root) {
  const marked = [...root.querySelectorAll(`[${BOLD_ATTR}]`)];
  marked.forEach((h) => {
    h.removeAttribute(BOLD_ATTR);
    if (!/^H[1-6]$/.test(h.tagName) || !(h.textContent || '').trim()) return;
    const strong = h.ownerDocument.createElement('strong');
    strong.append(...h.childNodes);
    h.append(strong);
  });
  return marked.length;
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
  const width = imgs.length === 1 && shownWidth(imgs[0]);
  return width ? `portrait-${width}` : null;
}

/** An image's authored display width (10–999px) when smaller than its file, else null. */
function shownWidth(img) {
  const width = parseInt(img.getAttribute('width'), 10);
  if (!(width >= 10 && width <= 999)) return null;
  const descriptors = (img.getAttribute('srcset') || '').match(/\s(\d+)w\b/g) || [];
  const fileWidth = Math.max(0, ...descriptors.map((d) => parseInt(d, 10)));
  return fileWidth && width >= fileWidth ? null : width;
}

// ---- centred images (the source's `aligncenter`) -------------------------------------
// DA keeps neither an image's class nor its paragraph's inline style, so the importer's
// `preprocess` calls markCentredImages() on the untouched DOM, and the flatten turns the marks
// into a Columns variant (an equal row) or a body Section Metadata style (the column).
const ALIGN_ATTR = 'data-skoda-align'; // an editor image: `center` or `left`
const CENTRED_IMAGES_ATTR = 'data-skoda-centred-images'; // on <html>: the body's images are centred
const CENTRED_IMAGES_STYLE = 'centered-images';
const COLUMN_WIDTH = 819; // the story text column at 1440 (an image this wide fills it)

/**
 * Mark every editor image with its alignment: `center` for `img.aligncenter`, an image in a
 * centred caption figure (`figure.wp-caption.aligncenter`) or a centred paragraph, else
 * `left`. Images outside the editor's own text stay unmarked: a slider, and the gallery or
 * media box a shortcode renders inside the editor (`.search-results`, `.sb-gallery`), which
 * become blocks. Returns the number of centred images.
 */
export function markCentredImages(document) {
  let count = 0;
  document.querySelectorAll('.textwidget img').forEach((img) => {
    if (img.closest('.search-results, .sb-gallery')) return;
    const centred = !!img.closest('.aligncenter, [style*="text-align: center"], [style*="text-align:center"]');
    img.setAttribute(ALIGN_ATTR, centred ? 'center' : 'left');
    count += centred ? 1 : 0;
  });
  return count;
}
const isCentred = (img) => img.getAttribute(ALIGN_ATTR) === 'center';

/**
 * The variants of an equal-width row whose every image the source centres (the Miss Peaches
 * profile cards: a 384px portrait, a name and role, an Instagram icon, all centred):
 * `centered`, plus `portrait-NNN` when each image cell's first image is shown at the same width
 * NNN, smaller than its file (the 300px portraits of 384px files), and `captioned` when each
 * is a caption figure (`figure.wp-caption`: DA keeps its caption as the paragraphs after the
 * image). Empty for any other row. Later images in a cell keep their file size (DA keeps no
 * per-image width).
 */
export function centredVariants(cells) {
  const cellWidths = cells.map((c) => parseFloat(c.getAttribute(CELL_WIDTH_ATTR)));
  if (cells.length < 2 || !cellWidths.every((w) => w > 0)
    || Math.max(...cellWidths) - Math.min(...cellWidths) >= 2) return [];
  const imgs = cells.flatMap((c) => [...c.querySelectorAll('img')]);
  if (!imgs.length || !imgs.every(isCentred)) return [];
  const firsts = cells.map((c) => c.querySelector('img')).filter(Boolean);
  const widths = firsts.map(shownWidth);
  const portrait = widths.every((w) => w && w === widths[0]) ? `portrait-${widths[0]}` : null;
  const captioned = firsts.every((img) => img.closest('figure')?.querySelector('figcaption'));
  // the row's text (not its captions) all centred on the source too: the 4×4 interview quotes
  const texts = cells.flatMap((c) => [...c.querySelectorAll(`[${TEXT_ATTR}]`)])
    .filter((el) => !el.querySelector('img') && el.textContent.trim());
  const textCenter = texts.length && texts.every((el) => textTokens(el).includes('center'));
  // the portraits' own text all 10pt on the source (`<img><strong>Name</strong><br>role` in one
  // 10pt paragraph: the electric-car and Coca-Cola interviewees)
  const captions = cells.filter((c) => c.querySelector('img')).flatMap((c) => [...c.querySelectorAll(`[${TEXT_ATTR}], .textwidget > p`)])
    .filter((el) => el.textContent.trim());
  const textSmall = captions.length && captions.every((el) => textTokens(el).includes('text-small'));
  return ['centered', portrait, captioned && 'captioned', textCenter && 'text-center', textSmall && 'text-small'].filter(Boolean);
}

// ---- the editor text's inline styles -------------------------------------------------
// The source's editor text centres paragraphs (`<p style="text-align: center">`, 172 in 54
// stories, mostly a photo with its 10pt caption), sets runs in 10 / 14 / 16 / 18pt and boxes some
// text (`<div style="background: #cccccc; padding: 50px">`). DA keeps none of it, so
// `preprocess` marks each editor paragraph (markTextStyles) and the flatten sets each run of
// marked body paragraphs as its own body section, styled `text-center`, `text-small` … (a
// Columns cell can't hold a section: there the row gets `text-center`, centredVariants).
const TEXT_ATTR = 'data-skoda-text';
const BOX_ATTR = 'data-skoda-box';
const SIZE_TOKENS = { '10pt': 'text-small', '14pt': 'text-medium', '16pt': 'text-large', '18pt': 'text-xlarge' };
const textTokens = (el) => (el.getAttribute(TEXT_ATTR) || '').split(' ').filter(Boolean);
const styleOf = (el, prop) => {
  const decl = (el.getAttribute('style') || '').split(';').map((d) => d.split(':'))
    .find(([p]) => p?.trim().toLowerCase() === prop);
  return decl ? decl.slice(1).join(':').trim() : '';
};

/** The font size every text of `el` is set in by an inline style, or '' (mixed / none). */
function uniformSize(el) {
  const sizes = new Set();
  const walker = el.ownerDocument.createTreeWalker(el, 4 /* SHOW_TEXT */);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (n.textContent.trim()) {
      let size = '';
      for (let p = n.parentElement; p && p !== el.parentElement; p = p.parentElement) {
        size = styleOf(p, 'font-size');
        if (size) break;
      }
      sizes.add(size.toLowerCase());
    }
  }
  return sizes.size === 1 ? [...sizes][0] : '';
}

/**
 * Mark each top-level editor paragraph (and padded box) with the styles DA drops: `center`, a
 * size token, and for a box its background / padding / shadow / text colour. Returns the count.
 */
export function markTextStyles(document) {
  let count = 0;
  document.querySelectorAll('.panel-layout .textwidget > p').forEach((p) => {
    if (!isBlank(p) || p.closest('.search-results, .sb-gallery')) return;
    p.setAttribute(BLANK_ATTR, '');
    p.textContent = 'blank line';
  });
  document.querySelectorAll('.panel-layout .textwidget > :is(p, h2, h3, h4, div)').forEach((el) => {
    if (el.closest('.search-results, .sb-gallery') || el.matches('.search-results, .sb-gallery')) return;
    const tokens = [];
    if (/^center$/i.test(styleOf(el, 'text-align'))) tokens.push('center');
    const size = SIZE_TOKENS[uniformSize(el)];
    if (size) tokens.push(size);
    const background = styleOf(el, 'background-color') || styleOf(el, 'background');
    if (/^(#[0-9a-f]{3}(?:[0-9a-f]{3})?|[a-z]+)$/i.test(background) && background.toLowerCase() !== 'transparent') {
      const colours = [...el.querySelectorAll('[style*="color"]')].map((c) => styleOf(c, 'color')).filter(Boolean);
      el.setAttribute(BOX_ATTR, JSON.stringify({
        background,
        padding: styleOf(el, 'padding'),
        shadow: styleOf(el, 'box-shadow'),
        color: colours.length && colours.every((c) => c === colours[0]) ? colours[0] : '',
      }));
      tokens.push('box');
    }
    if (!tokens.length) return;
    el.setAttribute(TEXT_ATTR, tokens.join(' '));
    count += 1;
  });
  return count;
}

const BOX_ROWS = [['background', 'box-background'], ['padding', 'box-padding'], ['shadow', 'box-shadow'], ['color', 'box-color']];

/**
 * A body caption figure shown narrower than its file (the 4×4 spokesperson, 200px of 384): the
 * profile card of a centred row, alone: `Columns (centered, portrait-NNN, captioned)`.
 */
function captionCard(node, document) {
  if (node.nodeType !== 1 || !node.matches('figure.wp-caption') || !node.querySelector('figcaption')) return null;
  const img = node.querySelector('img');
  const width = img && img.getAttribute(ALIGN_ATTR) === 'center' && shownWidth(img);
  if (!width) return null;
  return WebImporter.DOMUtils.createTable([[`Columns (centered, portrait-${width}, captioned)`], [[node]]], document);
}

/**
 * A body row's nodes with each run of styled paragraphs set as its own body section: `<hr>`, the
 * run, its Section Metadata (`body-column, text-center, text-small`; a box adds `text-box` and its
 * rows), then `<hr>` and a plain `body-column` Section Metadata, so the body resumes. An empty
 * resumed section (a run at the end) is dropped later (dropEmptySections).
 */
export function splitTextRuns(nodes, document) {
  const out = [];
  let run = [];
  let runKey = '';
  const flush = () => {
    if (!run.length) return;
    const [first] = run;
    const tokens = textTokens(first).filter((t) => t !== 'box').map((t) => (t === 'center' ? 'text-center' : t));
    const box = first.getAttribute(BOX_ATTR);
    const rows = [];
    if (box) {
      tokens.push('text-box');
      const data = JSON.parse(box);
      BOX_ROWS.forEach(([field, key]) => { if (data[field]) rows.push([key, data[field]]); });
    }
    const content = run.flatMap((el) => {
      el.removeAttribute(TEXT_ATTR);
      el.removeAttribute(BOX_ATTR);
      if (el.tagName !== 'DIV') return [el];
      // a box's inline content (text, <br>, a linked image) as a paragraph
      const p = document.createElement('p');
      p.append(...el.childNodes);
      return [p];
    });
    out.push(document.createElement('hr'), ...content,
      sectionMetadata([BODY_STYLE, ...tokens].join(', '), document, rows),
      document.createElement('hr'), sectionMetadata(BODY_STYLE, document));
    run = [];
    runKey = '';
  };
  nodes.forEach((node) => {
    const card = captionCard(node, document);
    if (card) { flush(); out.push(card); return; }
    const key = node.nodeType === 1 && node.hasAttribute(TEXT_ATTR)
      ? `${node.getAttribute(TEXT_ATTR)}|${node.getAttribute(BOX_ATTR) || ''}` : '';
    if (key && key === runKey) { run.push(node); return; }
    flush();
    if (key) { run = [node]; runKey = key; return; }
    out.push(node);
  });
  flush();
  return out;
}

/**
 * The body's editor images narrower than the column, outside a block (a Columns row): wider
 * ones fill the column, centred or not. `nodes` is the flattened body.
 */
function narrowBodyImages(nodes) {
  return nodes.filter((n) => n.nodeType === 1 && n.tagName !== 'TABLE')
    .flatMap((n) => (n.tagName === 'IMG' ? [n] : [...n.querySelectorAll('img')]))
    .filter((img) => img.hasAttribute(ALIGN_ATTR) && !img.closest('table')
      && parseInt(img.getAttribute('width'), 10) < COLUMN_WIDTH);
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

function sectionMetadata(style, document, rows = []) {
  return WebImporter.DOMUtils.createTable([['Section Metadata'], ['style', style], ...rows], document);
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

/**
 * Add `centered-images` to every body Section Metadata (`body-column`, and the highlight
 * sections, `body-column, highlight-…`) when the flatten found the body's images centred.
 * Call after afterTransform, once skoda-model-sections has written the body's own metadata;
 * it also clears the images' marks. Returns the number of sections styled.
 */
export function applyCentredImages(root) {
  root.querySelectorAll(`[${ALIGN_ATTR}]`).forEach((img) => img.removeAttribute(ALIGN_ATTR));
  root.querySelectorAll(`[${TEXT_ATTR}], [${BOX_ATTR}]`).forEach((el) => { el.removeAttribute(TEXT_ATTR); el.removeAttribute(BOX_ATTR); });
  const html = root.ownerDocument.documentElement;
  if (!html.hasAttribute(CENTRED_IMAGES_ATTR)) return 0;
  html.removeAttribute(CENTRED_IMAGES_ATTR);
  let count = 0;
  [...root.querySelectorAll('table')].filter(isSectionMetadata).forEach((table) => {
    const style = [...table.querySelectorAll('tr')].map((tr) => [...tr.children])
      .find((cells) => cells.length > 1 && /^style$/i.test(cells[0].textContent.trim()));
    if (!style) return;
    const tokens = style[1].textContent.split(',').map((t) => t.trim()).filter(Boolean);
    if (!tokens.includes(BODY_STYLE) || tokens.includes(CENTRED_IMAGES_STYLE)) return;
    style[1].textContent = [...tokens, CENTRED_IMAGES_STYLE].join(', ');
    count += 1;
  });
  return count;
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
// `inBlock`: the widget sits in a Columns cell, where a nested layout can't open another block.
function emitWidget(panel, document, out, stats, { inBlock = false } = {}) {
  const kind = classifyWidget(panel);
  stats.byKind[kind] = (stats.byKind[kind] || 0) + 1;

  if (DEFERRED.has(kind)) { stats.deferred.push(kind); return; }
  if (DROPPED.has(kind)) return;
  // a spacer: its own block in the body; in a Columns cell the row's `offset-…` carries the
  // ones that lead a cell (emitMultiColumn), the others go
  if (kind === 'offset') {
    const height = spacerHeight(panel);
    if (!inBlock && height) out.push(WebImporter.DOMUtils.createTable([['Spacer'], [`${height}px`]], document));
    return;
  }
  // eslint-disable-next-line no-use-before-define
  if (kind === 'nested-builder') { emitNestedRows(panel, document, out, stats, { inBlock }); return; }

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
    nodes.forEach((n) => {
      if (!isBlankParagraph(n)) { out.push(n); return; }
      // a blank line: a Spacer (line) in the body; in a cell the row's offset carries the
      // leading ones (emitMultiColumn), the others go
      if (!inBlock) out.push(WebImporter.DOMUtils.createTable([['Spacer (line)'], [`${BLANK_LINE_PX}px`]], document));
    });
  }
}

// Emit a genuine multi-column grid as a Columns block: one row, one cell per column.
// createTable takes plain-array cells (a cell = an array of nodes) — NOT an { elems }
// object (that is the runtime buildBlock format; here it serialises to "[object Object]").
// Two unequal cells carry their width ratio, and an authored-size image its width, as
// variants (`Columns (split-62, portrait-235)`, contract columns-split v2, SKODA-225); an
// equal row of centred images is `Columns (centered[, portrait-NNN])` (centredVariants).
function emitMultiColumn(cells, document, out, stats) {
  const row = [];
  const filled = [];
  const offsets = [];
  cells.forEach((cell) => {
    const cellOut = [];
    const panels = panelsOf(cell);
    panels.forEach((p) => emitWidget(p, document, cellOut, stats, { inBlock: true }));
    if (cellOut.length) {
      row.push(cellOut);
      filled.push(cell);
      // the spacers leading the cell, before its first content widget, and that widget's own
      // leading blank lines
      const first = panels.findIndex((p) => classifyWidget(p) !== 'offset');
      const lead = panels.slice(0, first);
      offsets.push(lead.reduce((sum, p) => sum + spacerHeight(p), 0)
        + (first >= 0 ? leadingBlankHeight(panels[first]) : 0));
    }
  });
  if (row.length > 1) {
    const split = splitVariant(filled);
    const variants = split ? [split, portraitVariant(filled)].filter(Boolean) : centredVariants(filled);
    if (offsets.some((v) => v > 0) && offsets.every((v) => v <= 999)) variants.push(`offset-${offsets.join('-')}`);
    const header = variants.length ? `Columns (${variants.join(', ')})` : 'Columns';
    out.push(WebImporter.DOMUtils.createTable([[header], row], document));
    stats.multiColumn += 1;
    if (split) stats.split = (stats.split || 0) + 1;
    if (variants.includes('centered')) stats.centered = (stats.centered || 0) + 1;
  } else if (row.length === 1) {
    // Only one non-empty column after mapping — linearize (no block needed).
    row[0].forEach((n) => out.push(n));
  }
}

// One grid row → its nodes: a genuine multi-column row becomes Columns, a single column
// linearizes its widgets in order. `inBlock` (the row sits in a Columns cell): it linearizes
// too, so no Columns opens inside a Columns (a widget's own block, e.g. a slider, is kept
// there as at the top level).
function gridRow(grid, document, stats, { inBlock = false } = {}) {
  const row = [];
  const cells = cellsOf(grid);
  const nonEmpty = cells.filter((c) => panelsOf(c).length > 0);
  if (nonEmpty.length > 1 && !inBlock) {
    emitMultiColumn(nonEmpty, document, row, stats);
  } else {
    cells.forEach((cell) => panelsOf(cell).forEach((p) => emitWidget(p, document, row, stats, { inBlock })));
  }
  return row;
}

// A nested layout builder's own rows: those of its `.panel-layout`, or rows set straight
// in the widget.
function nestedGrids(panel) {
  const layout = panel.querySelector('.panel-layout') || panel;
  return [...layout.children].filter((grid) => grid.matches('.panel-grid'));
}

// A nested builder beside other widgets: its rows flatten in place (no highlight sections
// there; a row holding nothing but the builder is unwrapped by expandGrids instead). A
// builder with no rows is logged, never dropped silently.
function emitNestedRows(panel, document, out, stats, { inBlock = false } = {}) {
  const grids = nestedGrids(panel);
  if (!grids.length) {
    stats.unknown.push(`nested builder without rows: ${panel.className || '(no class)'}`);
    return;
  }
  grids.forEach((grid) => out.push(...gridRow(grid, document, stats, { inBlock })));
}

// Older stories keep their whole body in one nested builder (the Miss Peaches series): a
// plain row whose only widget is a builder stands for that builder's rows, so they take
// part in the body as top-level rows (highlight sections and their geometry included).
function expandGrids(grids) {
  return grids.flatMap((grid) => {
    if (grid.hasAttribute(HIGHLIGHT_ATTR)) return [grid];
    const panels = cellsOf(grid).flatMap(panelsOf);
    if (panels.length !== 1 || classifyWidget(panels[0]) !== 'nested-builder') return [grid];
    const inner = nestedGrids(panels[0]);
    return inner.length ? expandGrids(inner) : [grid];
  });
}

export default function parse(element, { document }) {
  const layout = element.querySelector('.panel-layout, .panel-grid');
  // Detection: no SiteOrigin tree → linear-story fallback. Leave content untouched;
  // the template's default-content selection handles the plain-post body.
  if (!layout) return;

  const grids = expandGrids([...element.querySelectorAll('.panel-grid')]
    // only top-level grids: a nested builder's grids live inside its widget (`.so-panel`, or
    // a bare `widget_…` panel) and are walked through it, never twice
    .filter((g) => !g.parentElement.closest('.so-panel, [class*="widget_"]')));

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
  // spacer-only rows after a highlight wait for the body to resume (with nothing after them,
  // or a highlight next, they would only open an empty-looking section, so they go)
  let held = [];
  const isSpacer = (n) => n.tagName === 'TABLE'
    && /^spacer(\s*\(line\))?$/i.test(((n.querySelector('tr > th, tr > td') || {}).textContent || '').trim());
  grids.forEach((grid) => {
    const variant = grid.getAttribute(HIGHLIGHT_ATTR);
    const row = gridRow(grid, document, stats);
    if (!row.length) return;
    if (resume && !variant && row.every(isSpacer)) { held.push(...row); return; }
    if (variant) held = [];
    if (variant) {
      const geometry = GEOMETRY_KEYS.filter((key) => grid.hasAttribute(`data-${key}`))
        .map((key) => [key, grid.getAttribute(`data-${key}`)]);
      out.push(document.createElement('hr'), ...row, sectionMetadata(`${BODY_STYLE}, highlight-${variant}`, document, geometry));
      stats.highlights += 1;
      resume = true;
      return;
    }
    if (resume) out.push(document.createElement('hr'), sectionMetadata(BODY_STYLE, document));
    resume = false;
    out.push(...held, ...splitTextRuns(row, document));
    held = [];
  });
  if (resume && hasContentAfter(layout, element)) {
    out.push(document.createElement('hr'), sectionMetadata(BODY_STYLE, document));
  }
  // the body's narrower images: all centred on the source → its sections centre them
  // (applyCentredImages, once the body's own Section Metadata exists)
  const narrow = narrowBodyImages(out);
  const centred = narrow.filter(isCentred).length;
  if (narrow.length && centred === narrow.length) document.documentElement.setAttribute(CENTRED_IMAGES_ATTR, '');

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
    centered: stats.centered || 0,
    images: { narrow: narrow.length, centred },
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
  classifyWidget, cellsOf, panelsOf, WIDGET_KINDS, splitVariant, portraitVariant, centredVariants,
};
