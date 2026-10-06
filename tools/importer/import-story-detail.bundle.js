/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-story-detail.js
  var import_story_detail_exports = {};
  __export(import_story_detail_exports, {
    default: () => import_story_detail_default
  });

  // tools/importer/parsers/story-hero.js
  var HERO_MAX_WIDTH = 2560;
  function useLargestRendition(img) {
    const best = (img.getAttribute("srcset") || "").split(",").map((entry) => entry.trim().split(/\s+/)).map(([url, descriptor]) => ({ url, width: parseInt(descriptor, 10) })).filter(({ url, width }) => url && width > 0 && width <= HERO_MAX_WIDTH).sort((a, b) => b.width - a.width)[0];
    if (best) img.setAttribute("src", best.url);
    img.removeAttribute("srcset");
    img.removeAttribute("sizes");
  }
  function parse(element, { document: document2 }) {
    const img = element.querySelector(".hero-image img, .hero-wrapper img, img");
    const heading = element.querySelector(".hero-heading h1, h1, .heading, h2");
    if (img) useLargestRendition(img);
    if (!img && !heading) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [["Hero Image"]];
    if (img) cells.push([img]);
    if (heading) {
      const h1 = document2.createElement("h1");
      h1.textContent = (heading.textContent || "").trim();
      cells.push([h1]);
    }
    const caption = element.querySelector(".hero-caption") || element;
    const perex = caption.querySelector(".perex");
    const perexText = perex && (perex.textContent || "").trim();
    if (perexText) {
      const p = document2.createElement("p");
      p.textContent = perexText;
      cells.push([p]);
    }
    const published = caption.querySelector(".published, time");
    const dateText = published && (published.textContent || "").trim();
    const category = caption.querySelector(".category a[href]");
    const categoryText = category && (category.textContent || "").trim();
    const categoryHref = category && category.getAttribute("href");
    const meta = document2.createElement("p");
    meta.className = "hero-image-meta";
    if (dateText) {
      const match = dateText.match(/^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})$/);
      let datetime = published.getAttribute("datetime");
      if (match) {
        const [, day, month, year] = match;
        const iso = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
        const d = /* @__PURE__ */ new Date(`${iso}T00:00:00Z`);
        if (!Number.isNaN(d.getTime()) && d.toISOString().startsWith(iso)) datetime = iso;
      }
      const date = document2.createElement(datetime ? "time" : "span");
      date.className = "hero-image-date";
      if (datetime) date.setAttribute("datetime", datetime);
      date.textContent = dateText;
      meta.append(date);
    }
    if (categoryText && categoryHref) {
      const link = document2.createElement("a");
      link.setAttribute("href", categoryHref);
      link.textContent = categoryText;
      meta.append(link);
    }
    if (meta.childNodes.length) cells.push([meta]);
    element.replaceWith(WebImporter.DOMUtils.createTable(cells, document2));
  }

  // tools/importer/parsers/story-flatten.js
  var WIDGET_KINDS = [
    [/\bwidget_skoda-carousel-widget\b|so-widget-skoda-carousel-widget/, "carousel"],
    [/\bwidget_skoda-offset\b|so-widget-skoda-offset/, "offset"],
    [/\bwidget_skoda-quote\b|so-widget-skoda-quote/, "quote"],
    [/\bwidget_skoda-captioned-image\b|so-widget-skoda-captioned-image/, "captioned-image"],
    [/\bwidget_skoda-image-box\b|so-widget-skoda-image-box/, "image-box"],
    [/\bwidget_skoda-newsletter\b|so-widget-skoda-newsletter/, "newsletter"],
    [/\bwidget_sow-slider\b|so-widget-sow-slider/, "slider"],
    [/\bwidget_sow-button\b|so-widget-sow-button|sow-button-wire/, "button"],
    [/\bwidget_sow-image\b|so-widget-sow-image/, "image"],
    [/\bwidget_sow-editor\b|so-widget-sow-editor|siteorigin-widget-tinymce/, "editor"],
    [/\bys-milestones\b/, "milestones"],
    [/\bys-embed-share\b/, "share"],
    [/\bys-so-widget-highlights\b|\bwidget_highlights\b/, "highlights"],
    // Deferred interactive widgets (census §7): skip + log, confirm render-vs-drop.
    [/k2tools-charge-map/, "defer-charge-map"],
    [/k2tools-charging-calculator/, "defer-calculator"],
    [/siteorigin-panels-builder/, "defer-nested-builder"]
  ];
  var DEFERRED = /* @__PURE__ */ new Set(["defer-charge-map", "defer-calculator", "defer-nested-builder"]);
  var DROPPED = /* @__PURE__ */ new Set(["offset", "newsletter", "share", "highlights"]);
  function classifyWidget(panel) {
    const inner = panel.querySelector('[class*="so-widget-"]');
    const signal = `${panel.className || ""} ${inner && inner.className || ""}`;
    for (const [re, kind] of WIDGET_KINDS) {
      if (re.test(signal)) return kind;
    }
    return "unknown";
  }
  function editorNodes(panel, document2) {
    const tiny = panel.querySelector(".siteorigin-widget-tinymce, .textwidget") || panel.querySelector('[class*="so-widget-sow-editor"]');
    if (!tiny) return [];
    const nodes = [...tiny.childNodes];
    const out = [];
    nodes.forEach((n) => {
      if (n.nodeType === 3) {
        if ((n.textContent || "").trim()) out.push(n);
        return;
      }
      if (n.nodeType !== 1) return;
      out.push(n);
    });
    return out;
  }
  function itemCaption(img, item, withAlt = true) {
    var _a, _b;
    const capSource = img.getAttribute("data-caption") && img || ((_a = item.querySelector) == null ? void 0 : _a.call(item, "[data-caption]")) || item;
    return capSource.getAttribute && capSource.getAttribute("data-caption") || ((_b = item.querySelector) == null ? void 0 : _b.call(item, "a[title]")) && item.querySelector("a[title]").getAttribute("title") || withAlt && img.getAttribute("alt") || "";
  }
  function itemDescription(item, document2) {
    var _a;
    const desc = (_a = item.querySelector) == null ? void 0 : _a.call(item, ".search-results-item-description");
    if (!desc || !(desc.textContent || "").trim()) return "";
    const paras = [...desc.querySelectorAll("p")].map((p) => (p.textContent || "").replace(/\s+/g, " ").trim()).filter(Boolean);
    const texts = paras.length ? paras : [desc.textContent.replace(/\s+/g, " ").trim()];
    return texts.map((t) => {
      const p = document2.createElement("p");
      p.textContent = t;
      return p;
    });
  }
  function galleryCells(panel, document2, blockName = "Gallery") {
    const imgs = [...panel.querySelectorAll("img")];
    if (!imgs.length) return null;
    const slider = blockName === CAROUSEL_GALLERY;
    const cells = [[blockName]];
    imgs.forEach((img) => {
      const item = img.closest(".search-results-item, .item, figure") || img;
      cells.push([img, slider ? itemDescription(item, document2) : itemCaption(img, item, false)]);
    });
    return cells.length > 1 ? cells : null;
  }
  var CAROUSEL_GALLERY = "Gallery (slider)";
  function carouselCells(panel, document2) {
    const items = [...panel.querySelectorAll(".search-results-item")];
    if (!items.length) return galleryCells(panel, document2, CAROUSEL_GALLERY);
    const linked = items.filter((it) => it.querySelector("a[href]")).length;
    if (linked < Math.ceil(items.length / 2)) return galleryCells(panel, document2, CAROUSEL_GALLERY);
    const cells = [["Cards"]];
    items.forEach((it) => {
      const img = it.querySelector("img");
      const link = it.querySelector("a[href]");
      if (!img && !link) return;
      const title = itemCaption(img || it, it) || link && (link.textContent || "").trim() || "";
      if (link) {
        const a = document2.createElement("a");
        a.setAttribute("href", link.getAttribute("href"));
        a.textContent = title || "Read more";
        const p = document2.createElement("p");
        p.appendChild(a);
        cells.push([img || "", [p]]);
      } else {
        cells.push([img || "", title]);
      }
    });
    return cells.length > 1 ? cells : null;
  }
  function quoteNodes(panel, document2) {
    const text2 = (panel.textContent || "").replace(/\s+/g, " ").trim();
    if (!text2) return [];
    const bq = document2.createElement("blockquote");
    const p = document2.createElement("p");
    p.textContent = text2;
    bq.appendChild(p);
    return [bq];
  }
  function figureNodes(panel, document2) {
    const img = panel.querySelector("img");
    if (!img) return [];
    const srcFig = panel.querySelector("figure");
    const fig = document2.createElement("figure");
    fig.appendChild(img);
    const nativeCap = srcFig && srcFig.querySelector("figcaption");
    const caption = nativeCap && (nativeCap.textContent || "").trim() || img.getAttribute("data-caption") || panel.querySelector("[data-caption]") && panel.querySelector("[data-caption]").getAttribute("data-caption") || "";
    if ((caption || "").trim()) {
      const fc = document2.createElement("figcaption");
      fc.textContent = caption.trim();
      fig.appendChild(fc);
    }
    return [fig];
  }
  function infoboxNodes(panel, document2) {
    const out = [];
    const img = panel.querySelector("img");
    if (img) out.push(img);
    const body = panel.querySelector('.infobox-content, [class*="infobox"]') || panel;
    const rich = [...body.children].filter((n) => n.nodeType === 1 && !/^(abbr)$/i.test(n.tagName) && (n.textContent || "").trim());
    if (rich.length) {
      rich.forEach((n) => out.push(n));
    } else {
      const text2 = (body.textContent || "").replace(/\s+/g, " ").trim();
      if (text2) {
        const p = document2.createElement("p");
        p.textContent = text2;
        out.push(p);
      }
    }
    return out;
  }
  function imageNodes(panel, document2) {
    const img = panel.querySelector("img");
    return img ? [img] : [];
  }
  function milestonesNodes(panel, document2) {
    const items = [...panel.querySelectorAll("li")].filter((li) => li.querySelector(".year, .title, img"));
    const out = [];
    items.forEach((li) => {
      var _a, _b;
      const year = (((_a = li.querySelector(".year")) == null ? void 0 : _a.textContent) || "").replace(/\s+/g, " ").trim();
      const title = (((_b = li.querySelector(".title")) == null ? void 0 : _b.textContent) || "").replace(/\s+/g, " ").trim();
      if (year || title) {
        const h = document2.createElement("h3");
        h.textContent = [year, title].filter(Boolean).join(" \u2014 ");
        out.push(h);
      }
      const img = li.querySelector("img");
      if (img) out.push(img);
    });
    if (!out.length) {
      panel.querySelectorAll("img").forEach((img) => out.push(img));
      const text2 = (panel.textContent || "").replace(/\s+/g, " ").trim();
      if (text2 && !panel.querySelector("img")) {
        const p = document2.createElement("p");
        p.textContent = text2;
        out.push(p);
      }
    }
    return out;
  }
  function buttonNodes(panel, document2) {
    const a = panel.querySelector("a[href]");
    if (!a) return [];
    const p = document2.createElement("p");
    const strong = document2.createElement("strong");
    const link = document2.createElement("a");
    link.setAttribute("href", a.getAttribute("href"));
    link.textContent = (a.textContent || "").trim() || a.getAttribute("href");
    strong.appendChild(link);
    p.appendChild(strong);
    return [p];
  }
  var BODY_STYLE = "body-column";
  var HIGHLIGHT_ATTR = "data-highlight";
  function highlightVariant(color) {
    const value = (color || "").trim().toLowerCase();
    let rgb = null;
    const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
    if (hex) {
      const h = hex[1].length === 3 ? hex[1].replace(/./g, "$&$&") : hex[1];
      rgb = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
    } else {
      const fn = value.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)(?:[\s,/]+([\d.]+%?))?\s*\)$/);
      if (fn && !(fn[4] !== void 0 && parseFloat(fn[4]) === 0)) rgb = fn.slice(1, 4).map(Number);
    }
    if (!rgb) return null;
    const luminance = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
    if (luminance > 0.98) return null;
    return luminance < 0.5 ? "dark" : "grey";
  }
  function markHighlights(document2) {
    const css = [...document2.querySelectorAll("style")].map((s) => s.textContent || "").join("\n");
    const byId = /* @__PURE__ */ new Map();
    for (const [, selectors, body] of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
      const color = (body.match(/background(?:-color)?\s*:\s*([^;]+)/i) || [])[1];
      const variant = highlightVariant(color && color.replace(/!important/i, ""));
      if (!variant) continue;
      selectors.split(",").forEach((sel) => {
        const m = sel.trim().match(/^#(pg-[\w-]+)\s*>\s*\.panel-row-style$/);
        if (m) byId.set(m[1], variant);
      });
    }
    let count = 0;
    document2.querySelectorAll(".panel-grid").forEach((grid) => {
      const row = grid.querySelector(":scope > .panel-row-style");
      const inline = row && (row.getAttribute("style") || "").match(/background(?:-color)?\s*:\s*([^;]+)/i);
      const variant = byId.get(grid.id) || inline && highlightVariant(inline[1]);
      if (!variant) return;
      grid.setAttribute(HIGHLIGHT_ATTR, variant);
      count += 1;
    });
    return count;
  }
  var CELL_WIDTH_ATTR = "data-cell-width";
  function markCellWidths(document2) {
    const css = [...document2.querySelectorAll("style")].map((s) => s.textContent || "").join("\n");
    const byId = /* @__PURE__ */ new Map();
    for (const [, selectors, body] of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
      const width = (body.match(/(?:^|;)\s*width\s*:\s*(?:calc\(\s*)?([\d.]+)%/i) || [])[1];
      if (!width) continue;
      selectors.split(",").forEach((sel) => {
        const m = sel.trim().match(/^#(pgc-[\w-]+)$/);
        if (m) byId.set(m[1], parseFloat(width));
      });
    }
    let count = 0;
    document2.querySelectorAll(".panel-grid-cell[id]").forEach((cell) => {
      const width = byId.get(cell.id);
      if (!width) return;
      cell.setAttribute(CELL_WIDTH_ATTR, String(width));
      count += 1;
    });
    return count;
  }
  function splitVariant(cells) {
    if (cells.length !== 2) return null;
    const [a, b] = cells.map((c) => parseFloat(c.getAttribute(CELL_WIDTH_ATTR)));
    if (!(a > 0) || !(b > 0) || Math.abs(a - b) < 2) return null;
    const share = Math.round(a / (a + b) * 100);
    return share >= 10 && share <= 99 ? `split-${share}` : null;
  }
  function portraitVariant(cells) {
    const imgs = cells.flatMap((c) => [...c.querySelectorAll("img")]);
    if (imgs.length !== 1) return null;
    const img = imgs[0];
    const width = parseInt(img.getAttribute("width"), 10);
    if (!(width >= 10 && width <= 999)) return null;
    const descriptors = (img.getAttribute("srcset") || "").match(/\s(\d+)w\b/g) || [];
    const fileWidth = Math.max(0, ...descriptors.map((d) => parseInt(d, 10)));
    if (fileWidth && width >= fileWidth) return null;
    return `portrait-${width}`;
  }
  function hasContentAfter(node, root) {
    for (let n = node; n && n !== root; n = n.parentNode) {
      for (let s = n.nextSibling; s; s = s.nextSibling) {
        if ((s.textContent || "").trim() || s.querySelector && s.querySelector("img, picture, iframe, table")) return true;
      }
    }
    return false;
  }
  function sectionMetadata(style, document2) {
    return WebImporter.DOMUtils.createTable([["Section Metadata"], ["style", style]], document2);
  }
  var isSectionMetadata = (el) => el.tagName === "TABLE" && /^section metadata$/i.test(((el.querySelector("tr > th, tr > td") || {}).textContent || "").trim());
  function dropEmptySections(root) {
    const doc = root.ownerDocument;
    const breaks = [...root.querySelectorAll("hr")].filter((hr) => !hr.closest("table"));
    const between = (hr, i, el) => hr.compareDocumentPosition(el) & hr.DOCUMENT_POSITION_FOLLOWING && (!breaks[i + 1] || breaks[i + 1].compareDocumentPosition(el) & hr.DOCUMENT_POSITION_PRECEDING);
    const empty = breaks.map((hr, i) => {
      const range = doc.createRange();
      range.setStartAfter(hr);
      if (breaks[i + 1]) range.setEndBefore(breaks[i + 1]);
      else range.setEnd(root, root.childNodes.length);
      const rest = range.cloneContents();
      rest.querySelectorAll("table").forEach((t) => {
        if (isSectionMetadata(t)) t.remove();
      });
      const isEmpty = !(rest.textContent || "").trim() && !rest.querySelector("img, picture, video, iframe, table");
      return isEmpty && [hr, ...[...root.querySelectorAll("table")].filter((t) => isSectionMetadata(t) && between(hr, i, t))];
    }).filter(Boolean);
    empty.forEach((nodes) => nodes.forEach((n) => n.remove()));
    return empty.length;
  }
  function cellsOf(grid) {
    const direct = [...grid.children].flatMap((c) => {
      if (c.classList && c.classList.contains("panel-grid-cell")) return [c];
      return [...c.querySelectorAll(":scope > .panel-grid-cell")];
    });
    return direct;
  }
  function panelsOf(cell) {
    return [...cell.querySelectorAll([
      ":scope > .so-panel",
      ':scope > [class*="widget_"]',
      ":scope > .panel-cell-style > .so-panel",
      ':scope > .panel-cell-style > [class*="widget_"]'
    ].join(", "))];
  }
  function emitWidget(panel, document2, out, stats) {
    const kind = classifyWidget(panel);
    stats.byKind[kind] = (stats.byKind[kind] || 0) + 1;
    if (DEFERRED.has(kind)) {
      stats.deferred.push(kind);
      return;
    }
    if (DROPPED.has(kind)) return;
    let cells = null;
    let nodes = null;
    switch (kind) {
      case "editor":
        nodes = editorNodes(panel, document2);
        break;
      case "carousel":
        cells = carouselCells(panel, document2);
        break;
      case "slider":
        cells = galleryCells(panel, document2);
        break;
      case "quote":
        nodes = quoteNodes(panel, document2);
        break;
      case "captioned-image":
        nodes = figureNodes(panel, document2);
        break;
      case "image-box":
        nodes = infoboxNodes(panel, document2);
        break;
      case "image":
        nodes = imageNodes(panel, document2);
        break;
      case "button":
        nodes = buttonNodes(panel, document2);
        break;
      case "milestones":
        nodes = milestonesNodes(panel, document2);
        break;
      default:
        nodes = editorNodes(panel, document2);
        if (!nodes.length) {
          stats.unknown.push(panel.className || "(no class)");
          return;
        }
    }
    if (cells) {
      out.push(WebImporter.DOMUtils.createTable(cells, document2));
    } else if (nodes && nodes.length) {
      nodes.forEach((n) => out.push(n));
    }
  }
  function emitMultiColumn(cells, document2, out, stats) {
    const row = [];
    const filled = [];
    cells.forEach((cell) => {
      const cellOut = [];
      panelsOf(cell).forEach((p) => emitWidget(p, document2, cellOut, stats));
      if (cellOut.length) {
        row.push(cellOut);
        filled.push(cell);
      }
    });
    if (row.length > 1) {
      const split = splitVariant(filled);
      const variants = split ? [split, portraitVariant(filled)].filter(Boolean) : [];
      const header = variants.length ? `Columns (${variants.join(", ")})` : "Columns";
      out.push(WebImporter.DOMUtils.createTable([[header], row], document2));
      stats.multiColumn += 1;
      if (split) stats.split = (stats.split || 0) + 1;
    } else if (row.length === 1) {
      row[0].forEach((n) => out.push(n));
    }
  }
  function parse2(element, { document: document2 }) {
    const layout = element.querySelector(".panel-layout, .panel-grid");
    if (!layout) return;
    const grids = [...element.querySelectorAll(".panel-grid")].filter((g) => !g.parentElement.closest(".so-panel"));
    const out = [];
    const stats = {
      grids: grids.length,
      byKind: {},
      deferred: [],
      unknown: [],
      multiColumn: 0,
      highlights: 0
    };
    let resume = false;
    grids.forEach((grid) => {
      const variant = grid.getAttribute(HIGHLIGHT_ATTR);
      const row = [];
      const cells = cellsOf(grid);
      const nonEmpty = cells.filter((c) => panelsOf(c).length > 0);
      if (nonEmpty.length > 1) {
        emitMultiColumn(nonEmpty, document2, row, stats);
      } else {
        cells.forEach((cell) => panelsOf(cell).forEach((p) => emitWidget(p, document2, row, stats)));
      }
      if (!row.length) return;
      if (variant) {
        out.push(document2.createElement("hr"), ...row, sectionMetadata(`${BODY_STYLE}, highlight-${variant}`, document2));
        stats.highlights += 1;
        resume = true;
        return;
      }
      if (resume) out.push(document2.createElement("hr"), sectionMetadata(BODY_STYLE, document2));
      resume = false;
      out.push(...row);
    });
    if (resume && hasContentAfter(layout, element)) {
      out.push(document2.createElement("hr"), sectionMetadata(BODY_STYLE, document2));
    }
    const container = layout.closest(".entry-content") || layout.parentElement;
    const holder = document2.createElement("div");
    out.forEach((n) => holder.appendChild(n));
    layout.replaceWith(holder);
    holder.replaceWith(...holder.childNodes);
    const summary = {
      grids: stats.grids,
      widgets: Object.values(stats.byKind).reduce((a, b) => a + b, 0),
      byKind: stats.byKind,
      multiColumn: stats.multiColumn,
      split: stats.split || 0,
      highlights: stats.highlights,
      deferred: stats.deferred,
      unknown: stats.unknown
    };
    if (stats.deferred.length || stats.unknown.length) {
      console.warn(`[story-flatten] deferred/unknown widgets: ${JSON.stringify(summary)}`);
    } else {
      console.log(`[story-flatten] flattened: ${JSON.stringify(summary)}`);
    }
  }

  // tools/importer/parsers/downloads.js
  var text = (el) => el ? (el.textContent || "").replace(/\s+/g, " ").trim() : "";
  function serialiseMp4(href) {
    try {
      const url = new URL(href, "https://www.skoda-storyboard.com");
      if (!/\.mp4$/i.test(url.pathname) || url.href === href) return href;
      if (/^[a-z][a-z\d+.-]*:/i.test(href)) return url.href;
      return href.startsWith("/") && !href.startsWith("//") ? `${url.pathname}${url.search}${url.hash}` : href;
    } catch (e) {
      return href;
    }
  }
  function fileLabel(href) {
    const ext = ((href || "").split(/[?#]/)[0].split(".").pop() || "").toLowerCase();
    if (/^(jpe?g|png|webp|gif|tiff?)$/.test(ext)) return "Original";
    return ext ? ext.toUpperCase() : "Download";
  }
  function sizeLinks(item, document2) {
    const links = [];
    const add = (raw, label) => {
      if (!raw || raw === "#") return;
      const href = serialiseMp4(raw);
      if (links.some((l) => l.getAttribute("href") === href)) return;
      const a = document2.createElement("a");
      a.setAttribute("href", href);
      a.textContent = label;
      links.push(a);
    };
    item.querySelectorAll(".media-cart-action-multi.download a[href]").forEach((a) => {
      const href = a.getAttribute("href");
      add(href, text(a) || fileLabel(href));
    });
    if (links.length) return links;
    const single = item.querySelector('a.media-cart-action.download[href], a[data-action="download"][href]') || item.querySelector('a[href*="direct-download"]');
    if (single) add(single.getAttribute("href"), fileLabel(single.getAttribute("href")));
    return links;
  }
  function parse3(element, { document: document2 }) {
    let items = Array.from(element.querySelectorAll("article.media-cart-item"));
    if (items.length === 0) {
      items = Array.from(element.querySelectorAll(".search-results-item, .items > .item"));
    }
    if (items.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [["Downloads"]];
    items.forEach((item) => {
      const links = sizeLinks(item, document2);
      if (!links.length) return;
      const img = item.querySelector(".article-teaser-media img, .entry-thumbnail img, img");
      if (img) {
        if (!(img.getAttribute("alt") || "").trim() && img.getAttribute("title")) {
          img.setAttribute("alt", img.getAttribute("title").replace(/^Video\s*\|\s*/i, "").trim());
        }
        const src = img.getAttribute("src") || "";
        if (/^https:\/\/i\.vimeocdn\.com\//.test(src)) {
          img.setAttribute("src", src.replace(/-d_\d+x\d+(\.[a-z]+)?(\?.*)?$/i, "-d_1280x720.jpg"));
        }
        ["data-caption", "data-video_title", "data-video_src", "data-media-url", "srcset", "sizes", "itemprop", "title"].forEach((a) => img.removeAttribute(a));
      }
      const filename = links[0].getAttribute("href").split("/").pop().split(/[?#]/)[0];
      const title = text(item.querySelector(".entry-title")) || img && img.getAttribute("alt") || filename;
      const linkCell = links.map((a) => {
        const p = document2.createElement("p");
        p.append(a);
        return p;
      });
      cells.push([img || "", title, linkCell]);
    });
    if (cells.length === 1) {
      element.replaceWith(...element.childNodes);
      return;
    }
    element.replaceWith(WebImporter.DOMUtils.createTable(cells, document2));
  }

  // tools/importer/transformers/skoda-page-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        // Site header / nav / language switcher / search overlay chrome
        "header.header",
        ".site-header",
        ".mega-menu",
        ".megamenu",
        ".menu-toggle",
        ".language-switcher",
        ".lang-switch",
        ".search-form-wrap",
        ".search-form",
        // Footer chrome (also carries the .social strip)
        "footer.footer",
        ".site-footer",
        ".footer-mediaroom",
        // Secondary widgets / banners. The representative pages carry a standalone
        // newsletter surface as <section id="newsletter-popups"> / .newsletter-popup
        // (form.mailguide-subscribe) OUTSIDE header.header, so removing the header
        // alone leaves it as leading default content — remove those too.
        ".newsletter-subscribe-widget",
        "#newsletter-popups",
        ".newsletter-popup",
        ".mailguide-subscribe",
        ".mailguide-form",
        ".side-banner",
        ".sa-bnr",
        // Cookie / consent (defensive)
        "#onetrust-consent-sdk",
        "#onetrust-banner-sdk",
        "#onetrust-pc-sdk",
        ".onetrust-pc-dark-filter",
        ".ot-sdk-container",
        "#ot-sdk-btn",
        ".ot-sdk-show-settings",
        '[id*="cookie" i]',
        '[class*="cookie" i]',
        '[class*="consent" i]',
        // Floating affordances
        ".scroll-top",
        ".social-share",
        ".media-cart-flyout",
        ".share-bar",
        // Homepage live-Instagram social strip (not index-driven, external links).
        ".socials-static",
        // Chrome resource elements. Scripts carry per-request nonces / random
        // container-id hashes (ys_ajax_loader) that would break byte-identical
        // re-runs (SKODA-602 idempotency) if they survived into default content.
        "script",
        "noscript",
        "style",
        'link[rel="stylesheet"]',
        "link"
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      element.querySelectorAll('a[href*="#s_aid="], a[href*="#s_cid="]').forEach((a) => {
        a.setAttribute("href", a.getAttribute("href").split("#s_aid=")[0].split("#s_cid=")[0]);
      });
      element.querySelectorAll('a[href*="%25"]').forEach((a) => {
        const href = a.getAttribute("href") || "";
        let decoded = href;
        for (let i = 0; i < 8; i += 1) {
          let next;
          try {
            next = decodeURIComponent(decoded);
          } catch (e) {
            break;
          }
          if (next === decoded) break;
          decoded = next;
        }
        if (decoded !== href) a.setAttribute("href", encodeURI(decoded));
      });
      element.querySelectorAll('img[src^="https://i.vimeocdn.com/"]').forEach((img) => {
        const src = img.getAttribute("src");
        img.setAttribute("src", src.replace(/-d_\d+(?:x\d+)?(\.[a-z]+)?(\?.*)?$/i, "-d_1280x720.jpg"));
      });
    }
  }

  // tools/importer/transformers/skoda-story-cleanup.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var FACETS = [
    "model",
    "bodywork",
    "derivative",
    "motorsport",
    "equipment",
    "technology",
    "years",
    "view",
    "company",
    "concept",
    "environment",
    "happening",
    "history",
    "sponsorship",
    "vip"
  ];
  function parseTagHref(href) {
    const m = String(href || "").match(/\/tag\/([a-z0-9-]+)\/([a-z0-9-]+)\/?/i);
    return m ? { taxonomy: m[1].toLowerCase(), slug: m[2].toLowerCase() } : null;
  }
  function videoUrl(el) {
    const id = el.getAttribute("videoid");
    if (el.tagName.toLowerCase() === "lite-youtube") {
      return id ? `https://www.youtube.com/watch?v=${id}` : "";
    }
    const src = el.getAttribute("src") || el.getAttribute("data-src") || "";
    const yt = src.match(/youtube(?:-nocookie)?\.com\/embed\/([\w-]{6,})/i);
    if (yt) return `https://www.youtube.com/watch?v=${yt[1]}`;
    const vimeo = src.match(/player\.vimeo\.com\/video\/(\d+)/i);
    if (vimeo) return `https://vimeo.com/${vimeo[1]}`;
    return "";
  }
  function videosToUrls(element, document2) {
    element.querySelectorAll("lite-youtube, iframe[src], iframe[data-src]").forEach((el) => {
      const url = videoUrl(el);
      if (!url) return;
      const p = document2.createElement("p");
      const a = document2.createElement("a");
      a.setAttribute("href", url);
      a.textContent = url;
      p.appendChild(a);
      const target = el.closest(".embed-controller-wrapper, .video-container, .ratio-container") || el;
      target.replaceWith(p);
    });
    WebImporter.DOMUtils.remove(element, [".page-embed.yt-embed-cookie"]);
  }
  function wpVideosToEmbeds(element, document2) {
    element.querySelectorAll(".wp-video").forEach((wrapper) => {
      var _a, _b;
      const video = wrapper.querySelector("video");
      const src = video && (((_a = video.querySelector("source[src]")) == null ? void 0 : _a.getAttribute("src")) || video.getAttribute("src") || ((_b = wrapper.querySelector("a[href]")) == null ? void 0 : _b.getAttribute("href")) || "");
      if (!src || !/\.(mp4|webm|mov|m4v)(\?|$)/i.test(src)) return;
      const url = src.replace(/\?_=\d+$/, "");
      const link = document2.createElement("a");
      link.setAttribute("href", url);
      link.textContent = url;
      const rows = [["Embed"], ["url", link]];
      const posterUrl = video.getAttribute("poster");
      if (posterUrl) {
        const poster = document2.createElement("img");
        poster.setAttribute("src", posterUrl);
        poster.setAttribute("alt", "");
        rows.push(["poster", poster]);
      }
      wrapper.replaceWith(WebImporter.DOMUtils.createTable(rows, document2));
    });
  }
  function lastSegment(href) {
    try {
      const segs = new URL(href, "https://www.skoda-storyboard.com").pathname.split("/").filter(Boolean);
      return segs[segs.length - 1] || "";
    } catch (e) {
      return "";
    }
  }
  function facetRows(element) {
    const byFacet = {};
    const plain = [];
    element.querySelectorAll("ol.entry-tags a[href], .sidebar .tags a[href]").forEach((a) => {
      const t = parseTagHref(a.getAttribute("href") || "");
      if (!t || !t.slug) return;
      if (FACETS.includes(t.taxonomy)) {
        byFacet[t.taxonomy] = byFacet[t.taxonomy] || [];
        if (!byFacet[t.taxonomy].includes(t.slug)) byFacet[t.taxonomy].push(t.slug);
      } else if (!plain.includes(t.slug)) {
        plain.push(t.slug);
      }
    });
    const rows = FACETS.filter((f) => byFacet[f]).map((f) => [f, byFacet[f].join(", ")]);
    if (plain.length) rows.push(["tags", plain.join(", ")]);
    return rows;
  }
  function relatedBand(element, document2, payload) {
    const band = element.querySelector(".cover-box .related-stories");
    if (!band) return;
    const cover = band.closest(".cover-box") || band;
    const headingEl = band.querySelector(".search-results-heading, h2, h3");
    const subEl = headingEl && headingEl.querySelector(".subheading");
    const subText = subEl ? (subEl.textContent || "").trim() : "";
    let headingText = "Related Stories";
    if (headingEl) {
      const clone = headingEl.cloneNode(true);
      clone.querySelectorAll(".subheading").forEach((s) => s.remove());
      headingText = (clone.textContent || "").trim() || headingText;
    }
    const filters = facetRows(element);
    if (!filters.length) {
      console.warn("[story-cleanup] related band: story has no tags to match; dropped");
      cover.remove();
      return;
    }
    const originalURL = payload && payload.params && payload.params.originalURL || "";
    const self = lastSegment(originalURL);
    const rows = [["Story Rail"], ["template", "story"], ...filters, ["limit", "10"]];
    if (self) rows.push(["exclude", self]);
    const h2 = document2.createElement("h2");
    h2.textContent = headingText;
    const out = [document2.createElement("hr"), h2];
    if (subText) {
      const p = document2.createElement("p");
      p.textContent = subText;
      out.push(p);
    }
    out.push(WebImporter.DOMUtils.createTable(rows, document2));
    out.push(WebImporter.Blocks.createBlock(document2, {
      name: "Section Metadata",
      cells: { Style: "dark" }
    }));
    cover.replaceWith(...out);
  }
  var CHROME_SELECTORS = [
    ".sb-gallery-overlay",
    ".sb-gallery-lightbox",
    ".sb-gallery-share",
    ".sb-gallery-share-dropdown",
    "#colorbox",
    "#cboxOverlay",
    ".togglebox-opener"
  ];
  var MEDIA_BOX_STYLE = "dark, full-width, media-box";
  var MEDIA_BOX_MARKER = "data-story-media-box";
  var squash = (el) => el ? (el.textContent || "").replace(/\s+/g, " ").trim() : "";
  function flattenQuiz(element) {
    element.querySelectorAll(".knowledge-test").forEach((quiz) => {
      quiz.querySelectorAll([
        ".jsonStruct",
        ".position",
        ".next-wrap",
        ".prev-wrap",
        ".question-results",
        "button",
        "input"
      ].join(", ")).forEach((n) => n.remove());
    });
  }
  function tablesToColumns(element, document2) {
    const bodies = element.querySelectorAll(".columns > .content, article .content, .entry-content");
    const tables = /* @__PURE__ */ new Set();
    bodies.forEach((body) => body.querySelectorAll("table").forEach((t) => tables.add(t)));
    tables.forEach((table) => {
      if (table.parentElement && table.parentElement.closest("table")) return;
      const rows = [...table.querySelectorAll(":scope > tbody > tr, :scope > thead > tr, :scope > tr")].map((tr) => {
        const cells = [];
        [...tr.children].filter((c) => /^(td|th)$/i.test(c.tagName)).forEach((c) => {
          const span = Math.max(1, parseInt(c.getAttribute("colspan"), 10) || 1);
          for (let i = 0; i < span; i += 1) {
            const cell = [...(i ? c.cloneNode(true) : c).childNodes];
            cells.push(cell.length ? cell : "");
          }
        });
        return cells;
      }).filter((cells) => cells.some((c) => c && c.some((n) => (n.textContent || "").trim() || n.querySelector && n.querySelector("img"))));
      if (!rows.length) {
        table.remove();
        return;
      }
      const width = Math.max(...rows.map((r) => r.length));
      rows.forEach((r) => {
        while (r.length < width) r.push("");
      });
      table.replaceWith(WebImporter.DOMUtils.createTable([["Columns"], ...rows], document2));
    });
  }
  function seriesNavCards(element, document2) {
    element.querySelectorAll(".series-nav").forEach((nav) => {
      const rows = [["Cards (overlay)"]];
      nav.querySelectorAll("article.article-teaser").forEach((card) => {
        const link = card.querySelector(".entry-title a[href]") || card.querySelector("a.link-more[href]");
        const href = link && link.getAttribute("href");
        if (!href) return;
        const img = card.querySelector("img");
        const alt = img ? (img.getAttribute("alt") || "").trim() : "";
        let title = squash(card.querySelector(".entry-title"));
        if (/(…|\.\.\.)$/.test(title) && alt.startsWith(title.replace(/(…|\.\.\.)$/, "").trim())) title = alt;
        title = title || alt;
        if (!title) return;
        if (img) ["data-caption", "data-video_title", "data-video_src", "srcset", "sizes", "itemprop"].forEach((a2) => img.removeAttribute(a2));
        const body = [];
        const date = squash(card.querySelector(".entry-published"));
        if (date) {
          const p = document2.createElement("p");
          p.textContent = date;
          body.push(p);
        }
        const h3 = document2.createElement("h3");
        const a = document2.createElement("a");
        a.setAttribute("href", href);
        a.textContent = title;
        h3.append(a);
        body.push(h3);
        rows.push([img || "", body]);
      });
      const heading = nav.querySelector(":scope > .heading, :scope > h2, :scope > h3");
      const out = [];
      if (heading && squash(heading)) {
        const h3 = document2.createElement("h3");
        h3.append(...heading.childNodes);
        out.push(h3);
      }
      if (rows.length > 1) out.push(WebImporter.DOMUtils.createTable(rows, document2));
      nav.replaceWith(...out);
    });
  }
  function mediaBoxBand(element, document2) {
    element.querySelectorAll(".search-results.media-box").forEach((box) => {
      if (box.closest(".sidebar")) return;
      const band = box.closest(".cover-box") || box;
      const heading = squash(box.querySelector(".search-results-heading")) || "Media Box";
      const stats = squash(box.querySelector(".search-results-stats .stats, .stats"));
      box.querySelectorAll(".search-results-header, .search-results-stats, .togglebox-opener").forEach((n) => n.remove());
      const hr = document2.createElement("hr");
      hr.setAttribute(MEDIA_BOX_MARKER, "");
      const h2 = document2.createElement("h2");
      h2.textContent = heading;
      const out = [hr, h2];
      if (stats) {
        const p = document2.createElement("p");
        p.textContent = stats;
        out.push(p);
      }
      out.push(box);
      band.replaceWith(...out);
    });
  }
  var isBlockNamed = (el, re) => el && el.tagName === "TABLE" && re.test(squash(el.querySelector("tr > th, tr > td")));
  function finishMediaBox(element, document2) {
    element.querySelectorAll(`hr[${MEDIA_BOX_MARKER}]`).forEach((hr) => {
      const nodes = [];
      for (let n = hr.nextElementSibling; n && n.tagName !== "HR"; n = n.nextElementSibling) nodes.push(n);
      hr.removeAttribute(MEDIA_BOX_MARKER);
      if (!nodes.some((n) => isBlockNamed(n, /^downloads\b/i))) {
        console.warn("[story-cleanup] Media Box had no downloadable asset; section dropped");
        [hr, ...nodes].forEach((n) => n.remove());
        return;
      }
      nodes[nodes.length - 1].after(WebImporter.Blocks.createBlock(document2, {
        name: "Section Metadata",
        cells: { style: MEDIA_BOX_STYLE }
      }));
    });
  }
  function transform2(hookName, element, payload) {
    if (hookName === TransformHook2.beforeTransform) {
      const doc = element.ownerDocument || document;
      WebImporter.DOMUtils.remove(element, [
        ".btn-group.social",
        ".social-container",
        ...CHROME_SELECTORS
      ]);
      tablesToColumns(element, doc);
      videosToUrls(element, doc);
      wpVideosToEmbeds(element, doc);
      flattenQuiz(element);
      seriesNavCards(element, doc);
      mediaBoxBand(element, doc);
    }
    if (hookName === TransformHook2.afterTransform) {
      relatedBand(element, element.ownerDocument || document, payload);
      finishMediaBox(element, element.ownerDocument || document);
      const deferredSelectors = [
        ".sb-gallery",
        "a.colorbox",
        ".embed-controller-wrapper",
        ".page-embed",
        ".cover-box.dark"
      ];
      const dropped = {};
      deferredSelectors.forEach((sel) => {
        const n = element.querySelectorAll(sel).length;
        if (n) dropped[sel] = n;
      });
      if (Object.keys(dropped).length) {
        console.warn(
          `[story-cleanup] flatten-to-default dropped in-body media (deferred to SKODA-801/814/604): ${JSON.stringify(dropped)}`
        );
      }
      WebImporter.DOMUtils.remove(element, deferredSelectors);
    }
  }

  // tools/importer/transformers/skoda-story-aside.js
  var TransformHook3 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function relatedCards(sidebar, document2) {
    const matched = [...sidebar.querySelectorAll(".related .article-teaser, .related article")];
    const teasers = matched.filter((el, i, arr) => arr.indexOf(el) === i).filter((el) => !matched.some((other) => other !== el && other.contains(el)));
    if (!teasers.length) return null;
    const cells = [["Cards (overlay)"]];
    let emitted = 0;
    teasers.forEach((t) => {
      const img = t.querySelector("img");
      const link = t.querySelector("a[href]");
      const titleEl = t.querySelector(".title, h2, h3, h4");
      const title = titleEl && titleEl.textContent.trim() || img && img.getAttribute("alt") || link && link.textContent.trim() || "";
      if (!link && !img) return;
      const content = [];
      if (title) {
        const h = document2.createElement("h3");
        if (link) {
          const a = document2.createElement("a");
          a.setAttribute("href", link.getAttribute("href"));
          a.textContent = title;
          h.appendChild(a);
        } else {
          h.textContent = title;
        }
        content.push(h);
      }
      cells.push([img || "", content]);
      emitted += 1;
    });
    return emitted ? cells : null;
  }
  function tagsCell(sidebar, document2) {
    const anchors = [...sidebar.querySelectorAll(".tags a.label[href], section.tags a[href], ol.entry-tags a[href]")].filter((el, i, arr) => arr.indexOf(el) === i);
    if (!anchors.length) return null;
    const cell = [];
    anchors.forEach((a) => {
      const href = a.getAttribute("href");
      const text2 = (a.textContent || "").trim();
      if (!href || !text2) return;
      if (href === "#" || a.classList.contains("show-hidden-terms")) return;
      const link = document2.createElement("a");
      link.setAttribute("href", href);
      link.textContent = text2;
      cell.push(link);
    });
    return cell.length ? [["Tags"], [cell]] : null;
  }
  function transform3(hookName, element, payload) {
    if (hookName !== TransformHook3.afterTransform) return;
    const sidebar = element.querySelector(".sidebar");
    if (!sidebar) return;
    const cards = relatedCards(sidebar, document);
    const tags = tagsCell(sidebar, document);
    const frag = document.createElement("div");
    const hr = document.createElement("hr");
    frag.appendChild(hr);
    const aside = document.createElement("aside");
    const heading = sidebar.querySelector(".related .heading, .related h2, .related h3");
    if (heading) {
      const h = document.createElement("h2");
      h.textContent = (heading.textContent || "Explore more").trim();
      aside.appendChild(h);
    }
    if (cards) aside.appendChild(WebImporter.DOMUtils.createTable(cards, document));
    if (tags) {
      const tagsHeading = sidebar.querySelector("section.tags .heading, section.tags h2, section.tags h3");
      if (tagsHeading && (tagsHeading.textContent || "").trim()) {
        const h = document.createElement("h2");
        h.textContent = tagsHeading.textContent.trim();
        aside.appendChild(h);
      }
      aside.appendChild(WebImporter.DOMUtils.createTable(tags, document));
    }
    frag.appendChild(aside);
    const metadataBlock = WebImporter.Blocks.createBlock(document, {
      name: "Section Metadata",
      cells: { Style: "sidebar" }
    });
    frag.appendChild(metadataBlock);
    if (!cards && !tags) {
      sidebar.remove();
      return;
    }
    sidebar.replaceWith(...frag.childNodes);
  }

  // tools/importer/transformers/skoda-model-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  function querySection(root, selectors) {
    const list = Array.isArray(selectors) ? selectors : [selectors];
    for (const sel of list) {
      if (!sel) continue;
      const el = root.querySelector(sel);
      if (el) return el;
    }
    return null;
  }
  function transform4(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections || [];
    if (sections.length < 2) return;
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (i === 0 && !section.style) continue;
        const sectionEl = querySection(element, section.selector);
        if (!sectionEl) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
        sectionEl.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        const anchor = marker || querySection(element, section.selector);
        if (!anchor) continue;
        const metadataBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        anchor.after(metadataBlock);
        if (marker) {
          marker.removeAttribute(SECTION_MARKER_ATTR);
          if (i === 0) marker.remove();
        }
      }
    }
  }

  // tools/importer/transformers/skoda-metadata.js
  var TransformHook4 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var FACETS2 = [
    "model",
    "bodywork",
    "derivative",
    "motorsport",
    "equipment",
    "technology",
    "years",
    "view",
    "company",
    "concept",
    "environment",
    "happening",
    "history",
    "sponsorship",
    "vip"
  ];
  var TEMPLATE_SIGNALS = [
    [/\bsingle-skoda_model\b|\bskoda_model-template\b/, "skoda_model"],
    [/\bsingle-skoda_series\b|\bskoda_series-template\b/, "skoda_series"],
    [/\bsingle-press_release\b|\bpress_release-template\b/, "press_release"],
    [/\bsingle-press_kit\b|\bpress_kit-template\b/, "press_kit"],
    [/\bsingle-post\b|\bpost-template\b/, "story"],
    // Škodapedia archive + branded 404 aren't rail CPTs and aren't in the template
    // enum — map them to the valid `page` value (nav/direct only, not rail-indexed).
    [/\bpost-type-archive-skodapedia\b/, "page"],
    [/\berror404\b/, "page"],
    [/\bpage-template\b|\btemplate-media-room-page\b/, "page"]
  ];
  var SITE_SUFFIX = /\s+[-–|]\s+Škoda Storyboard\s*$/;
  function cleanTitle(raw) {
    const t = String(raw || "").replace(/\s+/g, " ").trim();
    return t.replace(SITE_SUFFIX, "").trim() || t;
  }
  function metaContent(document2, selector) {
    const el = document2.querySelector(selector);
    const val = el && el.getAttribute("content");
    return val && val.trim() ? val.trim() : null;
  }
  function normalizeDate(value) {
    if (!value) return "";
    const m = String(value).match(/\d{4}-\d{2}-\d{2}/);
    return m ? m[0] : "";
  }
  function extractDate(document2) {
    const meta = metaContent(document2, 'meta[property="article:published_time"]');
    if (normalizeDate(meta)) return normalizeDate(meta);
    const attrEl = document2.querySelector("[data-publish-date]");
    const attr = attrEl && attrEl.getAttribute("data-publish-date");
    if (normalizeDate(attr)) return normalizeDate(attr);
    const scripts = document2.querySelectorAll('script[type="application/ld+json"]');
    for (const s of scripts) {
      try {
        const data = JSON.parse(s.textContent);
        const graph = data["@graph"] || (Array.isArray(data) ? data : [data]);
        for (const node of graph) {
          if (node && node.datePublished) {
            const d = normalizeDate(node.datePublished);
            if (d) return d;
          }
        }
      } catch (e) {
      }
    }
    const span = document2.querySelector(".entry-published, time[datetime]");
    if (span) {
      const d = normalizeDate(span.getAttribute("datetime") || span.textContent);
      if (d) return d;
    }
    const modified = metaContent(document2, 'meta[property="article:modified_time"]');
    if (normalizeDate(modified)) return normalizeDate(modified);
    return "";
  }
  function extractTemplate(document2) {
    const cls = document2.body && document2.body.getAttribute("class") || "";
    for (const [re, value] of TEMPLATE_SIGNALS) {
      if (re.test(cls)) return value;
    }
    return "";
  }
  function extractCategory(url) {
    try {
      const segs = new URL(url).pathname.split("/").filter(Boolean);
      if (segs.length < 2) return "";
      if (segs[1] === "category") return segs[2] || "";
      if (segs[1] === "tag") return segs[segs.length - 1] || "";
      return segs[1];
    } catch (e) {
    }
    return "";
  }
  function extractTagsAndFacets(document2, pageUrl = "") {
    const tags = [];
    const byFacet = {};
    const seen = /* @__PURE__ */ new Set();
    const add = (taxonomy, slug) => {
      if (!taxonomy || !slug) return;
      const key = `${taxonomy}:${slug}`;
      if (seen.has(key)) return;
      seen.add(key);
      (byFacet[taxonomy] = byFacet[taxonomy] || []).push(slug);
      tags.push(slug);
    };
    const scopes = document2.querySelectorAll("ol.entry-tags, ul.entry-tags, .entry-tags, .tag-list");
    const roots = scopes.length ? scopes : [document2];
    for (const root of roots) {
      root.querySelectorAll("a[href]").forEach((a) => {
        const href = a.getAttribute("href") || "";
        let m = href.match(/\/tag\/([a-z0-9-]+)\/([a-z0-9-]+)\/?/i);
        if (m) {
          add(m[1].toLowerCase(), m[2].toLowerCase());
          return;
        }
        m = href.match(/filter(?:\[|%5B)([a-z0-9-]+)(?:\]|%5D)(?:\[\]|%5B%5D)=([^&"]+)/i);
        if (m) {
          let slug;
          try {
            slug = decodeURIComponent(m[2]);
          } catch (e) {
            slug = m[2];
          }
          add(m[1].toLowerCase(), slug.toLowerCase());
        }
      });
    }
    if (tags.length === 0) {
      const cls = document2.body && document2.body.getAttribute("class") || "";
      const tax = cls.match(/\btax-([a-z0-9_-]+)\b/i);
      const term = cls.match(/\bterm-([a-z0-9-]+)\b/i);
      if (tax && term) {
        const taxonomy = tax[1].toLowerCase().replace(/_/g, "-");
        const slug = term[1].toLowerCase();
        if (FACETS2.includes(taxonomy) && slug && !/^\d+$/.test(slug)) add(taxonomy, slug);
      }
    }
    if (tags.length === 0) {
      const cls = document2.body && document2.body.getAttribute("class") || "";
      const canonical = document2.querySelector('link[rel="canonical"]');
      const href = pageUrl || canonical && canonical.getAttribute("href") || "";
      if (/\bsingle-skoda_series\b|\bskoda_series-template\b/.test(cls)) {
        const m = href.match(/\/series\/([a-z0-9-]+)\/?/i);
        if (m) add("series", m[1].toLowerCase());
      } else if (/\bsingle-skoda_model\b|\bskoda_model-template\b/.test(cls)) {
        const m = href.match(/\/skoda-model\/([a-z0-9-]+)\/?/i);
        if (m) add("model", m[1].toLowerCase());
      }
    }
    if (tags.length === 0) {
      const cls = document2.body && document2.body.getAttribute("class") || "";
      const id = cls.match(/\bpostid-(\d+)\b/);
      const post = id && document2.querySelector(`article[data-post-id="${id[1]}"]`);
      String(post && post.getAttribute("class") || "").split(/\s+/).forEach((token) => {
        const m = token.toLowerCase().match(/^([a-z]+)-([a-z0-9-]+)$/);
        if (m && FACETS2.includes(m[1]) && !/^\d+$/.test(m[2])) add(m[1], m[2]);
      });
    }
    return { tags, byFacet };
  }
  function splitList(value) {
    return value ? String(value).split(",").map((s) => s.trim()).filter(Boolean) : [];
  }
  function hasMetadataBlock(element) {
    const tables = element.querySelectorAll("table");
    for (const t of tables) {
      const firstCell = t.querySelector("tr th, tr td");
      if (firstCell && firstCell.textContent.trim().toLowerCase() === "metadata") return true;
    }
    return false;
  }
  function transform5(hookName, element, payload) {
    if (hookName !== TransformHook4.afterTransform) return;
    if (hasMetadataBlock(element)) return;
    const { document: document2, url, params } = payload;
    const canonical = document2.querySelector('link[rel="canonical"]');
    const pageUrl = params && params.originalURL || url || canonical && canonical.href || "";
    const overrides = payload.template && payload.template.metadata || {};
    const h1 = document2.querySelector("h1");
    const title = cleanTitle(overrides.title || metaContent(document2, 'meta[property="og:title"]') || (document2.querySelector("title") ? document2.querySelector("title").textContent.trim() : "") || (h1 ? h1.textContent.trim() : ""));
    const description = overrides.description || metaContent(document2, 'meta[property="og:description"]') || metaContent(document2, 'meta[name="description"]') || "";
    const imageSrc = overrides.image || metaContent(document2, 'meta[property="og:image"]') || "";
    const publisheddate = overrides.publisheddate || extractDate(document2);
    const template = overrides.template || extractTemplate(document2) || overrides.templateDefault || "";
    const category = overrides.category || extractCategory(pageUrl);
    const { tags: derivedTags, byFacet } = extractTagsAndFacets(document2, pageUrl);
    const meta = {};
    if (title) meta.Title = title;
    if (description) meta.Description = description;
    if (imageSrc) {
      const img = document2.createElement("img");
      img.src = imageSrc;
      meta.Image = img;
    }
    if (publisheddate) meta.publisheddate = publisheddate;
    if (template) meta.template = template;
    if (overrides.theme) meta.theme = overrides.theme;
    if (overrides.presskit) meta.presskit = overrides.presskit;
    if (category) meta.category = category;
    const allTags = [.../* @__PURE__ */ new Set([...derivedTags, ...splitList(overrides.tags)])];
    if (allTags.length) meta.tags = allTags.join(", ");
    FACETS2.forEach((f) => {
      const merged = [.../* @__PURE__ */ new Set([...byFacet[f] || [], ...splitList(overrides[f])])];
      if (merged.length) meta[f] = merged.join(", ");
    });
    const block = WebImporter.Blocks.getMetadataBlock(document2, meta);
    element.append(block);
  }

  // tools/importer/transformers/skoda-links.js
  var TransformHook5 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var SOURCE_ORIGIN = "https://www.skoda-storyboard.com";
  var SOURCE_HOST = /^(?:https?:)?\/\/(?:www\.)?skoda-storyboard\.com(?=[/?#]|$)/i;
  var DEMO_PATHS = [
    "/en",
    "/en/category/classic-cars",
    "/en/category/concepts",
    "/en/category/corporate-life",
    "/en/category/design-eng",
    "/en/category/emobility",
    "/en/category/lifestyle",
    "/en/category/lifestyle/adventures",
    "/en/category/lifestyle/people",
    "/en/category/lifestyle/sports",
    "/en/category/models",
    "/en/category/skoda-world",
    "/en/category/skoda-world/design",
    "/en/category/skoda-world/heritage",
    "/en/category/skoda-world/innovation-and-technology",
    "/en/category/skoda-world/responsibility",
    "/en/emobility/a-custom-made-sunroof-walkie-talkies-and-champagne-the-skoda-peaq-at-the-tour-de-france",
    "/en/emobility/a-stunning-drive-to-the-northernmost-tip-of-mallorca",
    "/en/emobility/an-electric-car-approaching-says-the-license-plate-but-only-in-some-countries",
    "/en/emobility/camouflage-to-get-you-hooked",
    "/en/emobility/coffee-on-electric-wheels-elroq-and-enyaq-serving-coffee",
    "/en/emobility/designers-on-the-peaq-its-modern-durable-and-practical",
    "/en/emobility/elroq-rs-in-a-robe-unveiling-the-secret-of-matte-paint",
    "/en/emobility/enyaq-and-elroq-now-double-as-gaming-consoles-and-thats-not-all",
    "/en/emobility/even-opening-the-door-is-an-experience-says-the-designer-of-the-peaq-suv",
    "/en/emobility/how-the-versatile-skoda-peaq-conquered-a-mountain-peak",
    "/en/emobility/how-was-the-elroq-made-not-in-the-usual-way",
    "/en/emobility/make-use-of-the-frunk-unlock-with-your-phone-new-enhancements-for-elroq-and-enyaq",
    "/en/emobility/meet-the-peaq-comfort-just-like-at-home",
    "/en/emobility/meet-the-peaq-spacious-inside-and-out",
    "/en/emobility/peaq-enters-production-sharing-the-line-with-the-octavia",
    "/en/emobility/peaq-sets-a-record-from-the-heart-of-europe-to-the-sea-without-recharging",
    "/en/emobility/practical-fun-stylish-5-reasons-to-choose-the-epiq",
    "/en/emobility/skoda-elroq-and-a-happy-family",
    "/en/emobility/skoda-elroq-premiere-light-cube-camera-action",
    "/en/emobility/skoda-epiq-will-win-you-over-in-just-a-few-seconds",
    "/en/emobility/skoda-peaq-unparalleled-space-and-comfort",
    "/en/emobility/spacious-comfortable-and-striking-five-reasons-to-want-the-skoda-peaq",
    "/en/emobility/sunset-over-the-mountains-the-story-behind-the-camouflage-for-the-skoda-peaq",
    "/en/images",
    "/en/lifestyle/13-countries-over-19000-kilometers-the-kylaq-traveled-from-pune-to-prague",
    "/en/lifestyle/an-epic-start-to-the-tour-de-france-skoda-got-barcelona-moving",
    "/en/lifestyle/chainsaws-and-sparklers-discover-the-traditions-of-rally-fans",
    "/en/lifestyle/from-unwanted-graffiti-to-bold-support-for-womens-cycling",
    "/en/lifestyle/la-dolce-vita-explore-the-surroundings-of-lake-como",
    "/en/lifestyle/ouninpohja-finlands-roller-coaster-stage",
    "/en/lifestyle/rs-four-ways-which-one-will-you-choose",
    "/en/lifestyle/skodas-smarter-wireless-charging-goes-beyond-phones",
    "/en/lifestyle/what-you-learn-on-the-circuit-can-save-you-on-the-road",
    "/en/models/skoda-elroq-through-designers-eyes",
    "/en/press-kits/125-years-of-skoda-motorsport-press-kit",
    "/en/press-kits/125-years-of-skoda-motorsport-press-kit/images",
    "/en/press-kits/125-years-of-skoda-motorsport-press-kit/laurin-klement-fc-from-1908-the-first-major-motor-racing-successes-of-automobiles-from-mlada-boleslav",
    "/en/press-kits/125-years-of-skoda-motorsport-press-kit/laurin-klement-rk-m-1921-racing-driver-count-sascha-kolowrat-krakowskys-favourite-model",
    "/en/press-kits/125-years-of-skoda-motorsport-press-kit/motorsport-versions-of-the-skoda-favorit-1989-all-different-and-yet-familiar",
    "/en/press-kits/125-years-of-skoda-motorsport-press-kit/skoda-1000-mb-1964-and-1100-mb-b5-1966-a-family-saloon-in-rally",
    "/en/press-kits/125-years-of-skoda-motorsport-press-kit/skoda-1100-ohc-1957-the-beautiful-dream-of-le-mans",
    "/en/press-kits/125-years-of-skoda-motorsport-press-kit/skoda-130-lr-1984-last-motorsport-model-from-mlada-boleslav-with-rear-mounted-engine",
    "/en/press-kits/125-years-of-skoda-motorsport-press-kit/skoda-130-rs-1975-a-star-on-both-sides-of-the-iron-curtain",
    "/en/press-kits/125-years-of-skoda-motorsport-press-kit/skoda-180-rs-and-200-rs-1974-rally-cars-from-another-league",
    "/en/press-kits/125-years-of-skoda-motorsport-press-kit/skoda-f3-type-992-1964-european-class-formula-racing-car",
    "/en/press-kits/125-years-of-skoda-motorsport-press-kit/skoda-fabia-motorsport-edition-limited-edition-celebrates-the-125th-anniversary-of-skoda-motorsport",
    "/en/press-kits/125-years-of-skoda-motorsport-press-kit/skoda-fabia-r5-rally2-rally2-evo-successful-in-the-hands-of-factory-drivers-and-privateers-alike",
    "/en/press-kits/125-years-of-skoda-motorsport-press-kit/skoda-fabia-rs-rally2-celebrates-125-years-of-skoda-motorsport-success",
    "/en/press-kits/125-years-of-skoda-motorsport-press-kit/skoda-fabia-super-2000-2008-successful-motorsport-comeback-for-the-works-team",
    "/en/press-kits/125-years-of-skoda-motorsport-press-kit/skoda-fabia-wrc-2003-paving-the-way-for-future-success",
    "/en/press-kits/125-years-of-skoda-motorsport-press-kit/skoda-felicia-kit-car-1995-the-next-chapter-in-an-international-success-story",
    "/en/press-kits/125-years-of-skoda-motorsport-press-kit/skoda-octavia-touring-sport-1960-successful-return-to-international-rally-courses",
    "/en/press-kits/125-years-of-skoda-motorsport-press-kit/skoda-octavia-wrc-1999-entering-the-highest-class-of-international-rallying",
    "/en/press-kits/125-years-of-skoda-motorsport-press-kit/skoda-popular-sport-1936-outstanding-success-at-the-monte-carlo-rally",
    "/en/press-kits/125-years-of-skoda-motorsport-press-kit/skoda-spider-b5-1972-and-skoda-spider-ii-1975-prototypes-for-the-racetrack",
    "/en/press-kits/125-years-of-skoda-motorsport-press-kit/skoda-sport-1949-the-long-distance-runner-from-the-other-side-of-the-iron-curtain",
    "/en/press-kits/125-years-of-skoda-motorsport-press-kit/texts",
    "/en/press-kits/125-years-of-skoda-motorsport-press-kit/videos",
    "/en/press-kits/4x4-winter-experience-press-kit",
    "/en/press-kits/lets-explore-albania-press-kit",
    "/en/press-kits/new-skoda-enyaq-press-kit-2",
    "/en/press-kits/press-kit-skoda-at-the-iaa-2019",
    "/en/press-kits/skoda-elroq-press-kit",
    "/en/press-kits/skoda-elroq-press-kit-2",
    "/en/press-kits/skoda-epiq-city-suv-crossover-preview-of-skodas-most-affordable-all-electric-car",
    "/en/press-kits/skoda-epiq-press-kit-2",
    "/en/press-kits/skoda-epiq-press-kit-2/battery-and-powertrain-variants-front-wheel-drive-architectureand-efficient-electric-performance",
    "/en/press-kits/skoda-epiq-press-kit-2/connectivity-intuitive-digital-services-and-seamless-vehicle-access",
    "/en/press-kits/skoda-epiq-press-kit-2/exterior-the-first-skoda-production-model-to-fully-incorporatethe-modern-solid-design-language",
    "/en/press-kits/skoda-epiq-press-kit-2/first-edition-launch-version-with-exclusive-design-details",
    "/en/press-kits/skoda-epiq-press-kit-2/frequently-asked-questions",
    "/en/press-kits/skoda-epiq-press-kit-2/images",
    "/en/press-kits/skoda-epiq-press-kit-2/infographics",
    "/en/press-kits/skoda-epiq-press-kit-2/interior-designed-for-space-intuitive-use-and-everyday-convenience",
    "/en/press-kits/skoda-epiq-press-kit-2/safety-and-assistance-systems-comprehensive-predictiveand-reassuring-driver-support",
    "/en/press-kits/skoda-epiq-press-kit-2/skoda-epiq-the-new-all-electric-entry-model-combining-accessibilitycompact-dimensions-and-everyday-practicality",
    "/en/press-kits/skoda-epiq-press-kit-2/technical-data",
    "/en/press-kits/skoda-epiq-press-kit-2/texts",
    "/en/press-kits/skoda-epiq-press-kit-2/videos",
    "/en/press-kits/skoda-fabia-130-special-edition-celebrates-skoda-autos-anniversary-and-motorsport-heritage",
    "/en/press-kits/skoda-octavia-media-launch-press-kit",
    "/en/press-kits/skoda-octavia-press-kit",
    "/en/press-kits/skoda-octavia-press-kit-2",
    "/en/press-kits/skoda-octavia-rs-245-sporty-spacious-practical-family-sportster-delivers-245-ps",
    "/en/press-kits/skoda-octavia-rs-and-octavia-scout-press-kit",
    "/en/press-kits/skoda-peaq-first-glimpse-of-skodas-new-electric-flagship",
    "/en/press-kits/skoda-peaq-press-kit",
    "/en/press-kits/skoda-peaq-press-kit-2",
    "/en/press-kits/skoda-peaq-press-kit-2/battery-and-powertrain-variants-the-longest-rangeof-any-skoda-electric-model",
    "/en/press-kits/skoda-peaq-press-kit-2/connectivity-vertical-infotainment-display-and-sonos-premiumsound-system-set-the-peaq-apart",
    "/en/press-kits/skoda-peaq-press-kit-2/exterior-skodas-largest-suv-with-the-modern-solid-design",
    "/en/press-kits/skoda-peaq-press-kit-2/frequently-asked-questions",
    "/en/press-kits/skoda-peaq-press-kit-2/images",
    "/en/press-kits/skoda-peaq-press-kit-2/infographics",
    "/en/press-kits/skoda-peaq-press-kit-2/interior-a-relaxing-lounge-with-seven-seats-and-the-largest-boot",
    "/en/press-kits/skoda-peaq-press-kit-2/safety-a-comprehensive-suite-of-active-and-passive-safety-systems",
    "/en/press-kits/skoda-peaq-press-kit-2/technical-data",
    "/en/press-kits/skoda-peaq-press-kit-2/texts",
    "/en/press-kits/skoda-peaq-press-kit-2/the-peaq-sportline-dynamic-inside-and-out",
    "/en/press-kits/skoda-peaq-press-kit-2/the-skoda-peaq-skodas-new-flagship-expands-the-brands-electric-portfolio",
    "/en/press-kits/skoda-peaq-press-kit-2/videos",
    "/en/press-kits/skoda-rs-driving-experience-press-kit",
    "/en/press-kits/skoda-rs-experience-press-kit",
    "/en/press-kits/skoda-vision-o-press-kit",
    "/en/press-kits/the-all-electric-skoda-elroq-breaking-new-ground-in-the-compactsuv-segment-with-a-covered-design",
    "/en/press-kits/the-all-new-skoda-kodiaq-press-kit",
    "/en/press-kits/the-all-new-skoda-superb-press-kit",
    "/en/press-kits/the-enyaq-rs-race-a-new-motorsport-concept-with-sustainable-ideas-for-production-models",
    "/en/press-releases/30-years-since-the-foundation-stone-was-laid-m13-a-key-pillar-of-skodas-production",
    "/en/press-releases/936-km-without-recharging-skoda-peaq-sets-range-record-for-seven-seater-electric-suvs",
    "/en/press-releases/production-milestone-skoda-auto-builds-its-one-millionth-karoq",
    "/en/press-releases/skoda-auto-achieves-strong-financial-results-record-ev-deliveries-and-second-place-in-europe-in-h1-2026",
    "/en/press-releases/skoda-auto-and-national-theatre-extend-partnership-until-at-least-2029",
    "/en/press-releases/skoda-auto-announces-changes-to-its-board-of-management",
    "/en/press-releases/skoda-auto-enters-saudi-arabian-market-strengthening-its-presence-in-the-middle-east",
    "/en/press-releases/skoda-auto-klaus-zellmer-to-leave-the-company",
    "/en/press-releases/skoda-auto-launches-production-of-the-new-peaq-in-mlada-boleslav",
    "/en/press-releases/skoda-auto-marks-23-years-as-tour-de-france-main-partner-new-skoda-peaq-to-serve-as-red-car",
    "/en/press-releases/skoda-auto-produces-first-units-of-updated-octavia-in-kvasiny",
    "/en/press-releases/skoda-octavia-combi-rs-wins-prestigious-2024-golden-steering-wheel-award-in-the-mid-sized-car-category",
    "/en/press-releases/skoda-octavia-turns-30-three-decades-of-a-brand-icon",
    "/en/press-releases/skoda-peaq-comprehensive-testing-in-extreme-conditions",
    "/en/press-releases/skoda-superb-25-years-of-comfort-space-and-technical-excellence",
    "/en/press-releases/skodas-electric-bestsellers-elroq-and-enyaq-receive-model-year-updates",
    "/en/press-releases/skodas-voice-assistant-laura-now-enhanced-with-chatgpt-capabilities",
    "/en/press-releases/the-skoda-4x4-model-range-safe-driving-in-all-weather-and-challenging-terrain",
    "/en/press-releases/the-skoda-elroq-earns-5-star-euro-ncap-safety-rating-with-the-enyaq-and-octavia-retaining-their-top-scores",
    "/en/press-releases/the-updated-octavia-now-with-all-wheel-drive",
    "/en/press-releases/when-driving-fun-meets-comfort-rally-ace-oliver-solberg-tests-the-skoda-octavia-rs",
    "/en/press-releases/world-premiere-of-the-all-new-skoda-elroq-press-materials-and-highlight-video-available",
    "/en/press-releases/world-premiere-of-the-all-new-skoda-epiq-livestream-from-zurich",
    "/en/press-releases/world-premiere-of-the-all-new-skoda-peaq-livestream-from-france",
    "/en/series/125-years-of-motorsport",
    "/en/series/130-years",
    "/en/series/60-seconds-walkaround",
    "/en/series/back-to-the-past",
    "/en/series/czech-footprint",
    "/en/series/evolution-of-parts",
    "/en/series/hidden-helpers",
    "/en/series/minutes-from-car-production",
    "/en/series/my-life-my-car",
    "/en/series/road-trip",
    "/en/series/roads-places",
    "/en/series/sustainable-mobility",
    "/en/series/unexpected-jobs",
    "/en/series/unknown-parts",
    "/en/series/winter-tips",
    "/en/simply-clever/park-your-skoda-using-your-mobile-phone-well-show-you-how-how",
    "/en/skoda-model/elroq",
    "/en/skoda-model/elroq/elroq-rs",
    "/en/skoda-model/elroq/elroq-sportline",
    "/en/skoda-model/enyaq-iv-2",
    "/en/skoda-model/enyaq-iv-2/enyaq-rs",
    "/en/skoda-model/enyaq-iv-2/enyaq-sportline-iv",
    "/en/skoda-model/epiq",
    "/en/skoda-model/kamiq",
    "/en/skoda-model/karoq-6",
    "/en/skoda-model/karoq-6/karoq-sportline",
    "/en/skoda-model/new-fabia",
    "/en/skoda-model/new-kodiaq",
    "/en/skoda-model/new-kodiaq/kodiaq-rs",
    "/en/skoda-model/new-kodiaq/new-kodiaq-iv",
    "/en/skoda-model/new-kodiaq/new-kodiaq-sportline",
    "/en/skoda-model/new-superb",
    "/en/skoda-model/new-superb/new-superb-iv",
    "/en/skoda-model/octavia",
    "/en/skoda-model/octavia/octavia-rs",
    "/en/skoda-model/octavia/octavia-sportline",
    "/en/skoda-model/peaq",
    "/en/skoda-model/scala",
    "/en/skoda-world/2024-a-year-of-new-electric-cars-and-innovated-favourites",
    "/en/skoda-world/a-kodiaq-made-of-paper-the-modeler-spent-700-hours-developing-and-building-it",
    "/en/skoda-world/a-record-year-for-skoda-electrified-models-also-contribute",
    "/en/skoda-world/come-cheer-and-sing-along-meet-the-karaoke-car",
    "/en/skoda-world/explore-the-new-skoda-models-in-mixed-reality",
    "/en/skoda-world/how-the-skoda-octavia-reached-365-km-h",
    "/en/skoda-world/legend-chris-froome-takes-you-behind-the-scenes-of-the-tour-de-france",
    "/en/skoda-world/making-driving-easier-how-cruise-control-works",
    "/en/skoda-world/oliver-solberg-behind-the-wheel-of-the-new-octavia-rs",
    "/en/skoda-world/quiz-can-you-recognise-skoda-models-by-their-details",
    "/en/skoda-world/sportline-models-dynamic-elegance-for-every-day",
    "/en/skoda-world/the-immortal-octavia-see-what-it-looks-like-after-one-million-kilometres",
    "/en/skoda-world/the-new-skoda-slavia-features-a-refreshed-look-and-an-exclusive-colour",
    "/en/skoda-world/the-versatile-octavia-do-you-know-these-ones-too",
    "/en/tag/company/design",
    "/en/tag/company/production",
    "/en/tag/crew/electro-vehicle",
    "/en/tag/crew/electromobility",
    "/en/tag/crew/emobility",
    "/en/tag/crew/technology",
    "/en/tag/derivative/sportline",
    "/en/tag/environment/greenfuture",
    "/en/tag/environment/sustainability",
    "/en/tag/model/elroq",
    "/en/tag/model/enyaq",
    "/en/tag/model/epiq",
    "/en/tag/model/fabia",
    "/en/tag/model/kamiq",
    "/en/tag/model/karoq",
    "/en/tag/model/kodiaq",
    "/en/tag/model/kylaq",
    "/en/tag/model/octavia",
    "/en/tag/model/peaq",
    "/en/tag/model/scala",
    "/en/tag/model/slavia",
    "/en/tag/model/superb",
    "/en/tag/people/stefani",
    "/en/tag/years/2024",
    "/en/tag/years/2025",
    "/en/tag/years/2026",
    "/en/videos"
  ];
  var DEMO_ALIASES = {
    "/en/skoda-world/innovation-and-technology/explore-the-new-skoda-models-in-mixed-reality": "/en/skoda-world/explore-the-new-skoda-models-in-mixed-reality"
  };
  var ALLOWED = new Set(DEMO_PATHS);
  function edsPath(sourcePath) {
    let p = sourcePath || "/";
    try {
      p = decodeURIComponent(p);
    } catch (e) {
    }
    p = p.replace(/\.html?$/i, "").replace(/\/+$/, "");
    if (!p) return "/";
    return p.split("/").map((seg) => seg.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-")).join("/");
  }
  function rewriteHref(href) {
    const m = href.match(SOURCE_HOST);
    if (!m) return null;
    const rest = href.slice(m[0].length);
    const cut = rest.search(/[?#]/);
    const tail = cut === -1 ? "" : rest.slice(cut);
    if (/^\?(?:[^#]*&)?(?:p|page_id)=\d/.test(tail)) return null;
    let target = edsPath(cut === -1 ? rest : rest.slice(0, cut));
    target = DEMO_ALIASES[target] || target;
    return ALLOWED.has(target) ? `${target}${tail}` : null;
  }
  var TAG_FILTER = /^(?:(?:https?:)?\/\/(?:www\.)?skoda-storyboard\.com)?\/en\/news\/?\?filter(?:\[|%5B)([a-z0-9-]+)(?:\]|%5D)(?:\[\]|%5B%5D)=([^&#]+)$/i;
  function tagPageHref(href) {
    const m = href.match(TAG_FILTER);
    if (!m) return null;
    const slug = edsPath(`/${m[2]}`).slice(1);
    const exact = `/en/tag/${m[1].toLowerCase()}/${slug}`;
    if (ALLOWED.has(exact)) return exact;
    const bySlug = DEMO_PATHS.filter((p) => p.startsWith("/en/tag/") && p.endsWith(`/${slug}`) && p.split("/").length === 5);
    return bySlug.length === 1 ? bySlug[0] : null;
  }
  function transform6(hookName, element, payload) {
    if (hookName !== TransformHook5.afterTransform) return;
    element.querySelectorAll("a[href]").forEach((a) => {
      let href = a.getAttribute("href");
      if (/#s_[ac]id=/.test(href)) href = href.split("#s_aid=")[0].split("#s_cid=")[0];
      if (href.startsWith("/direct-download/")) href = `${SOURCE_ORIGIN}${href}`;
      else href = tagPageHref(href) || rewriteHref(href) || href;
      if (href !== a.getAttribute("href")) a.setAttribute("href", href);
    });
  }

  // tools/importer/transformers/skoda-nbsp.js
  var NBSP_PLACEHOLDER = "\u{F00A0}";
  var GLUED_NBSP = new RegExp("(?<=[^\\s])\\u00a0+(?=[^\\s])", "g");
  function transform7(hookName, element, payload) {
    if (hookName !== "preprocess") return;
    const doc = element.ownerDocument || payload && payload.document;
    const walker = doc.createTreeWalker(
      element,
      4
      /* NodeFilter.SHOW_TEXT */
    );
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (node.nodeValue.includes("\xA0")) {
        node.nodeValue = node.nodeValue.replace(GLUED_NBSP, (run) => NBSP_PLACEHOLDER.repeat(run.length));
      }
    }
  }

  // tools/importer/transformers/skoda-images.js
  function hasContent(node) {
    return [...node.childNodes].some((child) => child.nodeType === 1 || (child.textContent || "").trim());
  }
  function withCaption(node, caption, document2) {
    if (!caption) return node;
    const figure = document2.createElement("figure");
    const figcaption = document2.createElement("figcaption");
    figcaption.textContent = caption;
    figure.append(node, figcaption);
    return figure;
  }
  function editorialCaption(node) {
    if (!node) return "";
    const caption = (node.getAttribute("data-caption") || "").trim();
    if (!caption || node.closest(".article-teaser, .media-cart-image")) return "";
    return caption === (node.getAttribute("data-video_title") || "").trim() ? "" : caption;
  }
  function imageContainer(img, document2, link = null) {
    const div = document2.createElement("div");
    div.append(img);
    if (!link) return div;
    link.append(div);
    return link;
  }
  function splitParagraph(img, paragraph, caption, document2) {
    const link = img.closest("a");
    const linkedImage = link && paragraph.contains(link) && link.querySelectorAll("img").length === 1 && !(link.textContent || "").trim();
    const target = linkedImage ? link : img;
    const afterRange = document2.createRange();
    afterRange.setStartAfter(target);
    afterRange.setEnd(paragraph, paragraph.childNodes.length);
    const after = paragraph.cloneNode(false);
    after.append(afterRange.extractContents());
    const beforeRange = document2.createRange();
    beforeRange.selectNodeContents(paragraph);
    beforeRange.setEndBefore(target);
    const before = paragraph.cloneNode(false);
    before.append(beforeRange.extractContents());
    const imageNode = imageContainer(img, document2, linkedImage ? link : null);
    const image = withCaption(imageNode, caption, document2);
    paragraph.replaceWith(...[before, image, after].filter(hasContent));
  }
  function normalizeImages(root, document2 = root.ownerDocument) {
    root.querySelectorAll("img").forEach((img) => {
      if (!img.hasAttribute("alt") || !img.getAttribute("alt").trim()) {
        const type = img.hasAttribute("alt") ? "empty" : "missing";
        console.warn(`[image-import] ${type} alt: ${img.getAttribute("src") || "(no src)"}`);
      }
      if (img.closest("table, picture")) return;
      const figure = img.closest("figure");
      const wrapper = img.closest("[data-caption]");
      const wrapperCaption = (wrapper == null ? void 0 : wrapper.querySelectorAll("img").length) === 1 ? editorialCaption(wrapper) : "";
      const caption = (img.hasAttribute("data-caption") ? editorialCaption(img) : "") || wrapperCaption;
      if (figure) {
        if (img.parentElement.tagName !== "DIV") {
          const div = document2.createElement("div");
          img.replaceWith(div);
          div.append(img);
        }
        if (caption && !figure.querySelector("figcaption")) {
          const figcaption = document2.createElement("figcaption");
          figcaption.textContent = caption;
          figure.append(figcaption);
        }
        return;
      }
      const paragraph = img.closest("p");
      if (paragraph) {
        splitParagraph(img, paragraph, caption, document2);
        return;
      }
      if (img.parentElement.tagName === "DIV") {
        if (caption) {
          const div = img.parentElement;
          if (div.childElementCount === 1 && !(div.textContent || "").trim()) {
            const marker2 = document2.createComment("image");
            div.replaceWith(marker2);
            marker2.replaceWith(withCaption(div, caption, document2));
          } else {
            const marker2 = document2.createComment("image");
            img.replaceWith(marker2);
            marker2.replaceWith(withCaption(imageContainer(img, document2), caption, document2));
          }
        }
        return;
      }
      const link = img.closest("a");
      const linkedImage = link && link.querySelectorAll("img").length === 1 && !(link.textContent || "").trim();
      const target = linkedImage ? link : img;
      const marker = document2.createComment("image");
      target.replaceWith(marker);
      const imageNode = imageContainer(img, document2, linkedImage ? link : null);
      marker.replaceWith(withCaption(imageNode, caption, document2));
    });
  }

  // tools/importer/import-story-detail.js
  var parsers = {
    // SKODA-816: story hero → Hero Image with heading, caption and metadata
    // inside one block, not the overlay Hero banner used by page/archive.
    "story-hero": parse,
    "story-flatten": parse2,
    // SKODA-801a: the Media Box band → Downloads (its section is built by skoda-story-cleanup).
    downloads: parse3
  };
  var PAGE_TEMPLATE = {
    name: "story-detail",
    description: "\u0160koda story detail (single-post + SiteOrigin), full-fidelity SiteOrigin flatten (SKODA-801). Hero banner + primary .content SiteOrigin widget tree flattened to default content + block tables (17-widget map, census-driven). The secondary .sidebar column is rebuilt as a Style:sidebar section (Cards + Tags) beside the body via the grid-on-main story layout. In-body galleries/embeds/Media Box remain SKODA-604 full-restore work. Metadata template=story. Content-driven detection only.",
    urls: ["https://www.skoda-storyboard.com/en/lifestyle/people/the-story-of-olive-oil-from-andalusia-to-the-czech-republic/"],
    blocks: [
      { name: "story-hero", instances: ["div.hero"] },
      // Flatten the SiteOrigin widget tree inside the primary reading column. The
      // parser self-detects the builder tree and no-ops (linear-story fallback) when
      // absent, so the 3.6% non-Page-Builder stories fall through to default content.
      { name: "story-flatten", instances: [".columns > .content", "article .content", ".entry-content"] },
      { name: "downloads", instances: [".search-results.media-box"] }
    ],
    sections: [
      {
        id: "section-1",
        name: "Hero",
        selector: ["div.hero"],
        style: null,
        blocks: ["story-hero"],
        defaultContent: []
      },
      {
        id: "section-2",
        name: "Body",
        selector: [".columns > .content", "article .content", ".entry-content"],
        // Style: body-column tags the primary reading column so the grid-on-main story
        // layout (styles.css, body.story) places it in the left track and caps the prose
        // measure. skoda-model-sections emits the Section Metadata; the story-scoped
        // runtime hook (scripts.js decorateStorySections) turns it into a class.
        style: "body-column",
        blocks: ["story-flatten"],
        defaultContent: [
          ".content .entry-content h2",
          ".content .entry-content h3",
          ".content .entry-content p",
          ".content .entry-content ul",
          ".content .entry-content ol",
          ".content .entry-content blockquote"
        ]
      }
      // The aside section is emitted dynamically by skoda-story-aside (Style: sidebar);
      // it inserts its own leading <hr> in afterTransform, so it is not listed here
      // (skoda-model-sections only breaks statically-known section selectors).
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform4] : [],
    transform5,
    transform2,
    transform3,
    transform6
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document2.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          pageBlocks.push({ name: blockDef.name, selector, element });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_story_detail_default = {
    /**
     * Runs on the untouched DOM, before helix-importer's preProcess and the cleanup
     * transformers. The highlight rows' background colour (SKODA-824) is only in the
     * SiteOrigin head CSS, so the rows are marked here for story-flatten, and so are the cell
     * widths of unequal 2-cell rows (SKODA-225, Columns (split-NN)). Also keeps the
     * source's glued non-breaking spaces (html2md would turn them into spaces).
     */
    preprocess: ({ document: document2 }) => {
      markHighlights(document2);
      markCellWidths(document2);
      transform7("preprocess", document2.body, { document: document2 });
      document2.querySelectorAll(".search-results.media-box a.media-cart-action.download[href]").forEach((a) => {
        if (!(a.textContent || "").trim()) a.textContent = "Download";
      });
    },
    transform: (payload) => {
      const { document: document2, url, params } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document: document2, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      dropEmptySections(main);
      WebImporter.rules.transformBackgroundImages(main, document2);
      normalizeImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document2.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_story_detail_exports);
})();
