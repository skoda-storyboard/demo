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
    [/siteorigin-panels-builder/, "nested-builder"]
  ];
  var DEFERRED = /* @__PURE__ */ new Set(["defer-charge-map", "defer-calculator"]);
  var DROPPED = /* @__PURE__ */ new Set(["newsletter", "share", "highlights"]);
  var SPACER_EM_PX = 24;
  var BLANK_LINE_PX = 44;
  var BLANK_ATTR = "data-skoda-blank";
  var isBlank = (n) => n.nodeType === 1 && n.tagName === "P" && !n.querySelector("img, picture, iframe, video, table") && !n.textContent.replace(/[\s\u00a0]/g, "");
  var isBlankParagraph = (n) => n.nodeType === 1 && n.tagName === "P" && n.hasAttribute(BLANK_ATTR);
  function leadingBlankHeight(panel) {
    const tiny = panel.querySelector(".siteorigin-widget-tinymce, .textwidget");
    if (!tiny) return 0;
    let height = 0;
    for (const el of tiny.children) {
      if (!isBlankParagraph(el) && !isBlank(el)) break;
      height += BLANK_LINE_PX;
    }
    return height;
  }
  function spacerHeight(panel) {
    var _a;
    const value = (((_a = panel.querySelector('[style*="padding-top"]')) == null ? void 0 : _a.getAttribute("style")) || "").match(/padding-top:\s*([\d.]+)(em|px)/i);
    if (!value) return 0;
    const n = parseFloat(value[1]);
    return Math.round(value[2].toLowerCase() === "em" ? n * SPACER_EM_PX : n);
  }
  function classifyWidget(panel) {
    if (/siteorigin-panels-builder/.test(panel.className || "")) return "nested-builder";
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
    tiny.querySelectorAll(":is(strong, b, em, i, span) > br:last-child").forEach((br) => {
      var _a;
      if (!(((_a = br.nextSibling) == null ? void 0 : _a.textContent) || "").trim()) br.parentElement.after(br);
    });
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
  function itemDescription(item, document2, img) {
    var _a;
    const desc = (_a = item.querySelector) == null ? void 0 : _a.call(item, ".search-results-item-description");
    const paras = desc ? [...desc.querySelectorAll("p")].map((p) => (p.textContent || "").replace(/\s+/g, " ").trim()).filter(Boolean) : [];
    const descText = desc ? desc.textContent.replace(/\s+/g, " ").trim() : "";
    const texts = paras.length || !descText ? paras : [descText];
    const note = regulatoryCaption(img, item);
    if (note && !texts.some((t) => t.includes(note))) texts.push(note);
    if (!texts.length) return "";
    return texts.map((t) => {
      const p = document2.createElement("p");
      p.textContent = t;
      return p;
    });
  }
  var CONSUMPTION_RE = /\b(?:kWh|l)\s*\/\s*100\s*km\b/i;
  var EMISSIONS_RE = /\bCO(?:₂|2)\s+emissions?\b|\bg\s*\/\s*km\b/i;
  function isRegulatoryCaption(text5) {
    const t = (text5 || "").replace(/\s+/g, " ").trim();
    if (!t) return false;
    return /\bWLTP\b/.test(t) || CONSUMPTION_RE.test(t) && EMISSIONS_RE.test(t);
  }
  function regulatoryCaption(img, item) {
    var _a;
    const holder = img && img.getAttribute && img.getAttribute("data-caption") && img || ((_a = item.querySelector) == null ? void 0 : _a.call(item, "[data-caption]"));
    const text5 = holder ? (holder.getAttribute("data-caption") || "").replace(/\s+/g, " ").trim() : "";
    return isRegulatoryCaption(text5) ? text5 : "";
  }
  function galleryCells(panel, document2, blockName = "Gallery") {
    const imgs = [...panel.querySelectorAll("img")];
    if (!imgs.length) return null;
    const slider = blockName === CAROUSEL_GALLERY;
    const cells = [[blockName]];
    imgs.forEach((img) => {
      const item = img.closest(".search-results-item, .item, figure") || img;
      cells.push([img, slider ? itemDescription(item, document2, img) : itemCaption(img, item, false)]);
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
    const text5 = (panel.textContent || "").replace(/\s+/g, " ").trim();
    if (!text5) return [];
    const bq = document2.createElement("blockquote");
    const p = document2.createElement("p");
    p.textContent = text5;
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
      const text5 = (body.textContent || "").replace(/\s+/g, " ").trim();
      if (text5) {
        const p = document2.createElement("p");
        p.textContent = text5;
        out.push(p);
      }
    }
    return out;
  }
  function imageNodes(panel, document2) {
    const img = panel.querySelector("img");
    return img ? [img] : [];
  }
  var MILESTONE_KEEP = /* @__PURE__ */ new Set(["P", "BR", "STRONG", "B", "EM", "I", "A", "UL", "OL", "LI"]);
  function milestoneRich(source, document2) {
    const clean = (node) => {
      if (node.nodeType === 3) return [document2.createTextNode(node.textContent)];
      if (node.nodeType !== 1) return [];
      const kids = [...node.childNodes].flatMap(clean);
      if (!MILESTONE_KEEP.has(node.tagName)) return kids;
      const el = document2.createElement(node.tagName.toLowerCase());
      if (node.tagName === "A" && node.getAttribute("href")) el.setAttribute("href", node.getAttribute("href"));
      const trailing = [];
      while (/^(STRONG|B|EM|I)$/.test(node.tagName) && kids.length) {
        const last = kids[kids.length - 1];
        if (last.nodeType === 1 && last.tagName === "BR") trailing.unshift(kids.pop());
        else if (last.nodeType === 3 && !last.textContent.trim()) kids.pop();
        else break;
      }
      el.append(...kids);
      return [el, ...trailing];
    };
    const nodes = [...(source == null ? void 0 : source.childNodes) || []].flatMap(clean).filter((n) => !(n.nodeType === 3 && !n.textContent.trim()));
    return nodes.filter((n) => !(n.tagName === "P" && !n.textContent.trim() && !n.querySelector("br, a")));
  }
  var MILESTONE_BLACK = /background(?:-color)?\s*:\s*(?:#0{3}(?:0{3})?\b|rgb\(\s*0\s*,\s*0\s*,\s*0\s*\)|black\b)/i;
  function milestoneTitleSize(items) {
    const px = (value) => {
      const m = String(value).match(/^([\d.]+)(pt|px)$/);
      if (!m) return 0;
      return m[2] === "pt" ? Number(m[1]) * 4 / 3 : Number(m[1]);
    };
    const sizes = items.flatMap((li) => [...li.querySelectorAll('.title [style*="font-size"]')].map((span) => px(span.style.fontSize.trim())).filter(Boolean));
    if (!sizes.length) return "";
    const counts = /* @__PURE__ */ new Map();
    sizes.forEach((size) => counts.set(size, (counts.get(size) || 0) + 1));
    const [dominant] = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0];
    if (dominant >= 32) return "xl";
    return dominant >= 24 ? "large" : "";
  }
  var MILESTONE_SPACER = 44;
  function milestoneSpace(title) {
    let space = 0;
    const paragraphs = title ? [...title.querySelectorAll(":scope > p")] : [];
    const first = paragraphs.find((p) => {
      if ((p.textContent || "").trim() || p.querySelector("img, a")) return true;
      space += MILESTONE_SPACER;
      return false;
    });
    if (!first) return 0;
    const margin = (first.getAttribute("style") || "").match(/margin-top\s*:\s*(\d+(?:\.\d+)?)px/i);
    return Math.round(space + (margin ? Number(margin[1]) : 0));
  }
  var SPACE_ATTR = "data-title-space";
  function markMilestoneSpaces(root) {
    root.querySelectorAll(".so-widget-ys-milestones li").forEach((li) => {
      const space = milestoneSpace(li.querySelector(".title"));
      if (space) li.setAttribute(SPACE_ATTR, String(space));
    });
  }
  function titleSpaceOf(li) {
    if (li.hasAttribute(SPACE_ATTR)) return Number(li.getAttribute(SPACE_ATTR)) || 0;
    return milestoneSpace(li.querySelector(".title"));
  }
  function milestonesCells(panel, document2) {
    var _a;
    const items = [...panel.querySelectorAll("li")].filter((li) => li.querySelector(".year, .title, .description, img"));
    if (!items.length) return null;
    const variants = [
      MILESTONE_BLACK.test(((_a = items[0].querySelector(".year")) == null ? void 0 : _a.getAttribute("style")) || "") ? "black" : "",
      milestoneTitleSize(items)
    ].filter(Boolean);
    const cells = [[variants.length ? `Timeline (${variants.join(", ")})` : "Timeline"]];
    const spaces = items.map(titleSpaceOf);
    const spaced = spaces.some(Boolean);
    items.forEach((li, i) => {
      var _a2;
      const year = (((_a2 = li.querySelector(".year")) == null ? void 0 : _a2.textContent) || "").replace(/\s+/g, " ").trim();
      const title = milestoneRich(li.querySelector(".title"), document2);
      const thumbs = [...li.querySelectorAll(".thumbnail img")];
      const imgs = thumbs.length ? thumbs : [...li.querySelectorAll("img")].slice(0, 1);
      const description = li.querySelector(".description");
      description == null ? void 0 : description.querySelectorAll(".dot").forEach((dot) => dot.remove());
      const row = [year, title, imgs.length ? imgs : "", milestoneRich(description, document2)];
      if (spaced) row.push(spaces[i] ? String(spaces[i]) : "");
      cells.push(row);
    });
    return cells;
  }
  function milestonesFallback(panel, document2) {
    const out = [...panel.querySelectorAll("img")];
    const text5 = (panel.textContent || "").replace(/\s+/g, " ").trim();
    if (text5) {
      const p = document2.createElement("p");
      p.textContent = text5;
      out.push(p);
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
  var PANEL_DEFAULTS = { dark: { background: "#0e3a2f", color: "#ffffff" }, grey: { background: "", color: "" } };
  var hexColour = (value) => {
    const v = String(value || "").trim().toLowerCase();
    const hex = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
    if (hex) return `#${hex[1].length === 3 ? hex[1].replace(/./g, "$&$&") : hex[1]}`;
    const fn = v.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/);
    return fn ? `#${fn.slice(1, 4).map((n) => Number(n).toString(16).padStart(2, "0")).join("")}` : "";
  };
  function inlineColours(roots, within = "") {
    const text5 = /* @__PURE__ */ new Map();
    const links = /* @__PURE__ */ new Map();
    roots.filter((root) => root.nodeType === 1).forEach((root) => {
      const walker = root.ownerDocument.createTreeWalker(
        root,
        4
        /* SHOW_TEXT */
      );
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const length = n.textContent.trim().length;
        if (length && (!within || n.parentElement.closest(within))) {
          let colour = "";
          for (let p = n.parentElement; p && p !== root.parentElement && !colour; p = p.parentElement) {
            const decl = (p.getAttribute("style") || "").match(/(?:^|;)\s*color\s*:\s*([^;]+)/i);
            if (decl) colour = hexColour(decl[1]);
          }
          const bucket = n.parentElement.closest("a") ? links : text5;
          bucket.set(colour, (bucket.get(colour) || 0) + length);
        }
      }
    });
    const top = (m) => {
      var _a;
      return ((_a = [...m.entries()].sort((a, b) => b[1] - a[1])[0]) == null ? void 0 : _a[0]) || "";
    };
    return { text: top(text5), link: top(links) };
  }
  function panelColours(row, { variant, color }) {
    const out = {};
    const background = hexColour(color);
    if (background && background !== PANEL_DEFAULTS[variant].background) out["highlight-background"] = background;
    const { text: textColour, link: linkColour } = inlineColours([row], ".textwidget");
    if (textColour && textColour !== PANEL_DEFAULTS[variant].color) out["highlight-color"] = textColour;
    if (linkColour) out["highlight-link"] = linkColour;
    return out;
  }
  function headCss(document2) {
    return [...document2.querySelectorAll("style")].map((s) => s.textContent || "").join("\n").replace(/\/\*[\s\S]*?\*\//g, "");
  }
  function markHighlights(document2) {
    const css = headCss(document2);
    const byId = /* @__PURE__ */ new Map();
    for (const [, selectors, body] of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
      const color = (body.match(/background(?:-color)?\s*:\s*([^;]+)/i) || [])[1];
      const value = color && color.replace(/!important/i, "").trim();
      const variant = highlightVariant(value);
      if (!variant) continue;
      selectors.split(",").forEach((sel) => {
        const m = sel.trim().match(/^#(pg-[\w-]+)\s*>\s*\.panel-row-style$/);
        if (m) byId.set(m[1], { variant, color: value });
      });
    }
    let count = 0;
    const geometry = highlightGeometry(css);
    document2.querySelectorAll(".panel-grid").forEach((grid) => {
      const row = grid.querySelector(":scope > .panel-row-style");
      const inline2 = row && (row.getAttribute("style") || "").match(/background(?:-color)?\s*:\s*([^;]+)/i);
      const panel = byId.get(grid.id) || inline2 && highlightVariant(inline2[1]) && { variant: highlightVariant(inline2[1]), color: inline2[1].trim() };
      if (!panel) return;
      const { variant } = panel;
      grid.setAttribute(HIGHLIGHT_ATTR, variant);
      Object.entries(geometry(grid)).forEach(([key, value]) => grid.setAttribute(`data-${key}`, value));
      Object.entries(panelColours(row || grid, panel)).forEach(([key, value]) => grid.setAttribute(`data-${key}`, value));
      count += 1;
    });
    return count;
  }
  var DEFAULT_TEXT_MARGIN = ["0px 15px 0px 15px", "15px 15px 15px 15px"];
  var MEDIA_780 = /@media[^{]*max-width:\s*780px[^{]*\{((?:[^{}]*\{[^{}]*\})*)[^{}]*\}/g;
  function boxValue(value) {
    const parts = String(value || "").trim().split(/\s+/).map((v) => v === "0" ? "0px" : v);
    if (!parts[0] || parts.length > 4 || !parts.every((v) => /^\d+(?:\.\d+)?px$/.test(v))) return null;
    const [t, r = t, b = t, l = r] = parts;
    return `${t} ${r} ${b} ${l}`;
  }
  function layoutRules(css) {
    const rules = (text5) => [...text5.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, sel, body]) => ({ sels: sel.split(",").map((s) => s.trim()), body }));
    const mobile = rules([...css.matchAll(MEDIA_780)].map((m) => m[1]).join("\n"));
    const desktop = rules(css.replace(/@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, ""));
    const find = (list, test, prop) => {
      let found = null;
      list.forEach(({ sels, body }) => {
        if (!sels.some(test)) return;
        const m = body.match(new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;!]+)`, "i"));
        if (m) found = boxValue(m[1]);
      });
      return found;
    };
    const rowPadding = (grid) => {
      const isRow = (s) => s.replace(/\s+/g, "") === `#${grid.id}>.panel-row-style`;
      const padD = find(desktop, isRow, "padding");
      return { padD, padM: find(mobile, isRow, "padding") || padD };
    };
    return {
      mobile,
      desktop,
      find,
      rowPadding
    };
  }
  function highlightGeometry(css) {
    const {
      mobile,
      desktop,
      find,
      rowPadding
    } = layoutRules(css);
    const margins = (panel, fallback) => {
      if (!panel) return null;
      const test = (s) => s.endsWith(`#${panel.id}`);
      const d = find(desktop, test, "margin");
      const m = find(mobile, test, "margin") || d;
      return [d || fallback, m || fallback];
    };
    const cellGeometry = (cells) => {
      const per = cells.map((cell) => {
        const widget = cell.querySelector(":scope > .so-panel, :scope > .panel-cell-style > .so-panel");
        const isWidget = (s) => !!(widget == null ? void 0 : widget.id) && s.endsWith(`#${widget.id}`);
        const isCell = (s) => s.replace(/\s+/g, "") === `#${cell.id}>.panel-cell-style`;
        const marginD = find(desktop, isWidget, "margin");
        const marginM = find(mobile, isWidget, "margin") || marginD;
        const padD = find(desktop, isCell, "padding");
        const padM = find(mobile, isCell, "padding") || padD;
        return {
          own: !!(marginD || marginM || padD || padM),
          marginD: marginD || DEFAULT_TEXT_MARGIN[0],
          marginM: marginM || DEFAULT_TEXT_MARGIN[1],
          padD: padD || "0px 0px 0px 0px",
          padM: padM || "0px 0px 0px 0px"
        };
      });
      if (!per.some((c) => c.own)) return {};
      const join = (key) => per.map((c) => c[key]).join(" | ");
      return {
        "highlight-cell-margin": join("marginD"),
        "highlight-cell-margin-mobile": join("marginM"),
        "highlight-cell-padding": join("padD"),
        "highlight-cell-padding-mobile": join("padM")
      };
    };
    return (grid) => {
      const out = {};
      const cells = [...grid.querySelectorAll(":scope > .panel-row-style > .panel-grid-cell, :scope > .panel-grid-cell")].filter((c) => c.querySelector(".so-panel"));
      if (cells.length > 1) {
        const filled = cells.filter((c) => (c.textContent || "").trim() || c.querySelector("img, picture, iframe, video"));
        if (filled.length > 1) Object.assign(out, cellGeometry(cells));
        if (Object.keys(out).length) {
          const { padD: padD2, padM: padM2 } = rowPadding(grid);
          if (padD2) out["highlight-padding"] = padD2;
          if (padM2) out["highlight-padding-mobile"] = padM2;
        }
        return out;
      }
      const { padD, padM } = rowPadding(grid);
      if (padD) out["highlight-padding"] = padD;
      if (padM) out["highlight-padding-mobile"] = padM;
      const panels = [...grid.querySelectorAll(":scope > .panel-row-style > .panel-grid-cell > .so-panel, :scope > .panel-grid-cell > .so-panel")];
      const text5 = margins(panels.find((p) => p.matches(".widget_sow-editor, .widget_text")), "0px 0px 0px 0px");
      if (text5 && (text5[0] !== DEFAULT_TEXT_MARGIN[0] || text5[1] !== DEFAULT_TEXT_MARGIN[1])) {
        [out["highlight-margin"], out["highlight-margin-mobile"]] = text5;
      }
      const gallery = margins(panels.find((p) => p.matches('[class*="carousel-widget"], [class*="slider"]')), "0px 0px 0px 0px");
      if (gallery && (gallery[0] !== "0px 0px 0px 0px" || gallery[1] !== "0px 0px 0px 0px")) {
        [out["highlight-gallery-margin"], out["highlight-gallery-margin-mobile"]] = gallery;
      }
      return out;
    };
  }
  var THEME_ROW_TOP = "32px 0px 0px 0px";
  var ROW_PAD_ATTR = "data-row-padding";
  var ROW_PAD_MOBILE_ATTR = "data-row-padding-mobile";
  var FULL_ENOUGH_PX = 1600;
  function useLargestSources(document2) {
    let count = 0;
    document2.querySelectorAll(".panel-layout img[srcset]").forEach((img) => {
      var _a;
      if (img.closest(".search-results.media-box, .search-results-gallery, .sb-gallery")) return;
      const candidates = (img.getAttribute("srcset") || "").split(",").map((c) => c.trim().split(/\s+/)).map(([url, d]) => ({ url, w: parseInt((d || "").replace(/w$/, ""), 10) })).filter(({ url, w }) => url && w > 0);
      if (!candidates.length) return;
      const largest = candidates.reduce((a, b) => b.w > a.w ? b : a);
      const src = img.getAttribute("src") || "";
      const current = ((_a = candidates.find((c) => c.url === src)) == null ? void 0 : _a.w) || parseInt((src.match(/-(\d+)x\d+\.\w+(?:$|\?)/) || [])[1], 10) || 0;
      const slide = !!img.closest(".search-results.carousel-widget");
      const authored = !slide && parseInt(img.getAttribute("width"), 10) || Infinity;
      if (current >= FULL_ENOUGH_PX) return;
      if (largest.url !== src && largest.w > current && authored > current) {
        img.setAttribute("src", largest.url);
        count += 1;
      }
    });
    return count;
  }
  function markRowPadding(document2) {
    const { rowPadding } = layoutRules(headCss(document2));
    let count = 0;
    const unstretched = (box, stretched) => {
      if (!box || !stretched) return box;
      const [t, , b] = box.split(" ");
      return `${t} 0px ${b} 0px`;
    };
    document2.querySelectorAll(".panel-grid").forEach((grid) => {
      if (grid.hasAttribute(HIGHLIGHT_ATTR)) return;
      const style = grid.querySelector(":scope > .panel-row-style");
      const stretched = !!(style == null ? void 0 : style.hasAttribute("data-stretch-type"));
      const pads = rowPadding(grid);
      const prev = grid.previousElementSibling;
      const afterPanel = !!(prev == null ? void 0 : prev.matches(".panel-grid")) && prev.hasAttribute(HIGHLIGHT_ATTR);
      const padD = unstretched(pads.padD || (style && !afterPanel ? THEME_ROW_TOP : null), stretched);
      const padM = unstretched(pads.padM, stretched);
      if (!padD && !padM) return;
      if (padD) grid.setAttribute(ROW_PAD_ATTR, padD);
      if (padM) grid.setAttribute(ROW_PAD_MOBILE_ATTR, padM);
      count += 1;
    });
    return count;
  }
  function padToken(value) {
    const parts = String(value || "").split(/\s+/).filter(Boolean).map((v) => Math.round(parseFloat(v)));
    if (parts.length !== 4 || parts.some((n) => !(n >= 0) || n > 999) || parts.every((n) => n === 0)) return null;
    return parts.join("-");
  }
  function rowPaddingVariants(grid) {
    if (!grid) return [];
    const d = padToken(grid.getAttribute(ROW_PAD_ATTR));
    const m = padToken(grid.getAttribute(ROW_PAD_MOBILE_ATTR));
    return [d && `pad-${d}`, m && `pad-m-${m}`].filter(Boolean);
  }
  var GEOMETRY_KEYS = [
    "highlight-padding",
    "highlight-padding-mobile",
    "highlight-margin",
    "highlight-margin-mobile",
    "highlight-gallery-margin",
    "highlight-gallery-margin-mobile",
    "highlight-background",
    "highlight-color",
    "highlight-link",
    "highlight-cell-margin",
    "highlight-cell-margin-mobile",
    "highlight-cell-padding",
    "highlight-cell-padding-mobile"
  ];
  var CELL_WIDTH_ATTR = "data-cell-width";
  function markCellWidths(document2) {
    const css = headCss(document2);
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
  var BOLD_ATTR = "data-skoda-bold";
  function isBoldHeading(heading) {
    const words = (node) => (node.textContent || "").replace(/\s+/g, "");
    if (!words(heading)) return false;
    const walker = heading.ownerDocument.createTreeWalker(
      heading,
      4
      /* NodeFilter.SHOW_TEXT */
    );
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const bold = node.parentElement.closest("strong, b");
      if (words(node) && !(bold && heading.contains(bold))) return false;
    }
    return true;
  }
  function markBoldHeadings(root) {
    const bold = [...root.querySelectorAll("h1, h2, h3, h4, h5, h6")].filter(isBoldHeading);
    bold.forEach((h) => h.setAttribute(BOLD_ATTR, ""));
    return bold.length;
  }
  function restoreBoldHeadings(root) {
    const marked = [...root.querySelectorAll(`[${BOLD_ATTR}]`)];
    marked.forEach((h) => {
      h.removeAttribute(BOLD_ATTR);
      if (!/^H[1-6]$/.test(h.tagName) || !(h.textContent || "").trim()) return;
      const strong = h.ownerDocument.createElement("strong");
      strong.append(...h.childNodes);
      h.append(strong);
    });
    return marked.length;
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
    const width = imgs.length === 1 && shownWidth(imgs[0]);
    return width ? `portrait-${width}` : null;
  }
  function shownWidth(img) {
    const width = parseInt(img.getAttribute("width"), 10);
    if (!(width >= 10 && width <= 999)) return null;
    const descriptors = (img.getAttribute("srcset") || "").match(/\s(\d+)w\b/g) || [];
    const fileWidth = Math.max(0, ...descriptors.map((d) => parseInt(d, 10)));
    return fileWidth && width >= fileWidth ? null : width;
  }
  var ALIGN_ATTR = "data-skoda-align";
  var CENTRED_IMAGES_ATTR = "data-skoda-centred-images";
  var CENTRED_IMAGES_STYLE = "centered-images";
  var COLUMN_WIDTH = 819;
  function markCentredImages(document2) {
    let count = 0;
    document2.querySelectorAll(".textwidget img").forEach((img) => {
      if (img.closest(".search-results, .sb-gallery")) return;
      const centred = !!img.closest('.aligncenter, [style*="text-align: center"], [style*="text-align:center"]');
      img.setAttribute(ALIGN_ATTR, centred ? "center" : "left");
      count += centred ? 1 : 0;
    });
    return count;
  }
  var isCentred = (img) => img.getAttribute(ALIGN_ATTR) === "center";
  function centredVariants(cells) {
    const cellWidths = cells.map((c) => parseFloat(c.getAttribute(CELL_WIDTH_ATTR)));
    if (cells.length < 2 || !cellWidths.every((w) => w > 0) || Math.max(...cellWidths) - Math.min(...cellWidths) >= 2) return [];
    const imgs = cells.flatMap((c) => [...c.querySelectorAll("img")]);
    if (!imgs.length || !imgs.every(isCentred)) return [];
    const firsts = cells.map((c) => c.querySelector("img")).filter(Boolean);
    const widths = firsts.map(shownWidth);
    const portrait = widths.every((w) => w && w === widths[0]) ? `portrait-${widths[0]}` : null;
    const captioned = firsts.every((img) => {
      var _a;
      return (_a = img.closest("figure")) == null ? void 0 : _a.querySelector("figcaption");
    });
    const texts = cells.flatMap((c) => [...c.querySelectorAll(`[${TEXT_ATTR}]`)]).filter((el) => !el.querySelector("img") && el.textContent.trim());
    const textCenter = texts.length && texts.every((el) => textTokens(el).includes("center"));
    const captions = cells.filter((c) => c.querySelector("img")).flatMap((c) => [...c.querySelectorAll(`[${TEXT_ATTR}], .textwidget > p`)]).filter((el) => el.textContent.trim());
    const textSmall = captions.length && captions.every((el) => textTokens(el).includes("text-small"));
    return ["centered", portrait, captioned && "captioned", textCenter && "text-center", textSmall && "text-small"].filter(Boolean);
  }
  var TEXT_ATTR = "data-skoda-text";
  var BOX_ATTR = "data-skoda-box";
  var SIZE_TOKENS = { "10pt": "text-small", "14pt": "text-medium", "16pt": "text-large", "18pt": "text-xlarge" };
  var textTokens = (el) => (el.getAttribute(TEXT_ATTR) || "").split(" ").filter(Boolean);
  var styleOf = (el, prop) => {
    const decl = (el.getAttribute("style") || "").split(";").map((d) => d.split(":")).find(([p]) => (p == null ? void 0 : p.trim().toLowerCase()) === prop);
    return decl ? decl.slice(1).join(":").trim() : "";
  };
  function uniformSize(el) {
    const sizes = /* @__PURE__ */ new Set();
    const walker = el.ownerDocument.createTreeWalker(
      el,
      4
      /* SHOW_TEXT */
    );
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (n.textContent.trim()) {
        let size = "";
        for (let p = n.parentElement; p && p !== el.parentElement; p = p.parentElement) {
          size = styleOf(p, "font-size");
          if (size) break;
        }
        sizes.add(size.toLowerCase());
      }
    }
    return sizes.size === 1 ? [...sizes][0] : "";
  }
  function markTextStyles(document2) {
    let count = 0;
    document2.querySelectorAll(".panel-layout .textwidget > p").forEach((p) => {
      if (!isBlank(p) || p.closest(".search-results, .sb-gallery")) return;
      p.setAttribute(BLANK_ATTR, "");
      p.textContent = "blank line";
    });
    const alignAndSize = (el) => {
      const tokens = [];
      if (/^center$/i.test(styleOf(el, "text-align"))) tokens.push("center");
      const size = SIZE_TOKENS[uniformSize(el)];
      if (size) tokens.push(size);
      return tokens;
    };
    document2.querySelectorAll(".panel-layout .textwidget > :is(p, h2, h3, h4, div)").forEach((el) => {
      if (el.closest(".search-results, .sb-gallery") || el.matches(".search-results, .sb-gallery")) return;
      const tokens = alignAndSize(el);
      const background = styleOf(el, "background-color") || styleOf(el, "background");
      if (/^(#[0-9a-f]{3}(?:[0-9a-f]{3})?|[a-z]+)$/i.test(background) && background.toLowerCase() !== "transparent") {
        const colours = [...el.querySelectorAll('[style*="color"]')].map((c) => styleOf(c, "color")).filter(Boolean);
        el.setAttribute(BOX_ATTR, JSON.stringify({
          background,
          padding: styleOf(el, "padding"),
          shadow: styleOf(el, "box-shadow"),
          color: colours.length && colours.every((c) => c === colours[0]) ? colours[0] : ""
        }));
        tokens.push("box");
        el.querySelectorAll(":scope > :is(p, h2, h3, h4)").forEach((child) => {
          const own = alignAndSize(child);
          if (own.length) child.setAttribute(TEXT_ATTR, own.join(" "));
        });
      }
      if (!tokens.length) return;
      el.setAttribute(TEXT_ATTR, tokens.join(" "));
      count += 1;
    });
    return count;
  }
  var BOX_ROWS = [["background", "box-background"], ["padding", "box-padding"], ["shadow", "box-shadow"], ["color", "box-color"]];
  function captionCard(node, document2) {
    if (node.nodeType !== 1 || !node.matches("figure.wp-caption") || !node.querySelector("figcaption")) return null;
    const img = node.querySelector("img");
    const width = img && img.getAttribute(ALIGN_ATTR) === "center" && shownWidth(img);
    if (!width) return null;
    return WebImporter.DOMUtils.createTable([[`Columns (centered, portrait-${width}, captioned)`], [[node]]], document2);
  }
  var CONTINUED = "continued";
  var sectionTokens = (key) => key.split(" ").filter((t) => t && t !== "box").map((t) => t === "center" ? "text-center" : t);
  function textParts(nodes) {
    const parts = [];
    let leading = [];
    const isEmpty = (node) => node.nodeType === 1 && isSpacer(node) || !(node.textContent || "").trim() && !(node.nodeType === 1 && (node.matches("img, picture, video, iframe, table") || node.querySelector("img, picture, video, iframe, table")));
    nodes.forEach((node) => {
      const last = parts[parts.length - 1];
      if (isEmpty(node)) {
        if (last) last.nodes.push(node);
        else leading.push(node);
        return;
      }
      const key = node.nodeType === 1 ? node.getAttribute(TEXT_ATTR) || "" : "";
      if (node.nodeType === 1) node.removeAttribute(TEXT_ATTR);
      if (last && last.key === key) last.nodes.push(node);
      else {
        parts.push({ key, tokens: sectionTokens(key), nodes: [...leading, node] });
        leading = [];
      }
    });
    if (!parts.length && leading.length) parts.push({ key: "", tokens: [], nodes: leading });
    return parts;
  }
  function partSections(nodes, style, rows, document2, variant = "") {
    const base = style.split(",").map((t) => t.trim());
    const parts = textParts(nodes);
    const partRows = (part) => {
      if (!variant || parts.length < 2) return rows;
      const { text: text5 } = inlineColours(part.nodes);
      const own = text5 && text5 !== PANEL_DEFAULTS[variant].color ? [["highlight-color", text5]] : [];
      return [...rows.filter(([key]) => key !== "highlight-color"), ...own];
    };
    return parts.flatMap((part, i) => [
      document2.createElement("hr"),
      ...part.nodes,
      sectionMetadata([.../* @__PURE__ */ new Set([...base, ...part.tokens, ...i ? [CONTINUED] : []])].join(", "), document2, partRows(part))
    ]);
  }
  function splitTextRuns(nodes, document2) {
    const out = [];
    let run = [];
    let runKey = "";
    const flush = () => {
      if (!run.length) return;
      const [first] = run;
      const tokens = textTokens(first).filter((t) => t !== "box").map((t) => t === "center" ? "text-center" : t);
      const box = first.getAttribute(BOX_ATTR);
      const rows = [];
      if (box) {
        tokens.push("text-box");
        const data = JSON.parse(box);
        BOX_ROWS.forEach(([field, key]) => {
          if (data[field]) rows.push([key, data[field]]);
        });
      }
      const content = run.flatMap((el) => {
        el.removeAttribute(TEXT_ATTR);
        el.removeAttribute(BOX_ATTR);
        if (el.tagName !== "DIV") return [el];
        if (el.querySelector(":scope > :is(p, h2, h3, h4, ul, ol)")) return [...el.childNodes];
        const p = document2.createElement("p");
        p.append(...el.childNodes);
        return [p];
      });
      out.push(
        ...partSections(content, [BODY_STYLE, ...tokens].join(", "), rows, document2),
        document2.createElement("hr"),
        sectionMetadata(BODY_STYLE, document2)
      );
      run = [];
      runKey = "";
    };
    nodes.forEach((node) => {
      const card = captionCard(node, document2);
      if (card) {
        flush();
        out.push(card);
        return;
      }
      const key = node.nodeType === 1 && node.hasAttribute(TEXT_ATTR) ? `${node.getAttribute(TEXT_ATTR)}|${node.getAttribute(BOX_ATTR) || ""}` : "";
      if (key && key === runKey) {
        run.push(node);
        return;
      }
      flush();
      if (key) {
        run = [node];
        runKey = key;
        return;
      }
      out.push(node);
    });
    flush();
    return out;
  }
  function narrowBodyImages(nodes) {
    return nodes.filter((n) => n.nodeType === 1 && n.tagName !== "TABLE").flatMap((n) => n.tagName === "IMG" ? [n] : [...n.querySelectorAll("img")]).filter((img) => img.hasAttribute(ALIGN_ATTR) && !img.closest("table") && parseInt(img.getAttribute("width"), 10) < COLUMN_WIDTH);
  }
  function hasContentAfter(node, root) {
    for (let n = node; n && n !== root; n = n.parentNode) {
      for (let s = n.nextSibling; s; s = s.nextSibling) {
        if ((s.textContent || "").trim() || s.querySelector && s.querySelector("img, picture, iframe, table")) return true;
      }
    }
    return false;
  }
  function sectionMetadata(style, document2, rows = []) {
    return WebImporter.DOMUtils.createTable([["Section Metadata"], ["style", style], ...rows], document2);
  }
  var tableName = (el) => ((el.querySelector("tr > th, tr > td") || {}).textContent || "").trim();
  var isSectionMetadata = (el) => el.tagName === "TABLE" && /^section metadata$/i.test(tableName(el));
  var isSpacer = (el) => el.tagName === "TABLE" && /^spacer(?:\s*\(line\))?$/i.test(tableName(el));
  var isFiller = (el) => isSectionMetadata(el) || isSpacer(el);
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
        if (isFiller(t)) t.remove();
      });
      const isEmpty = !(rest.textContent || "").trim() && !rest.querySelector("img, picture, video, iframe, table");
      return isEmpty && [hr, ...[...root.querySelectorAll("table")].filter((t) => isFiller(t) && between(hr, i, t))];
    }).filter(Boolean);
    empty.forEach((nodes) => nodes.forEach((n) => n.remove()));
    return empty.length;
  }
  function applyCentredImages(root) {
    root.querySelectorAll(`[${ALIGN_ATTR}]`).forEach((img) => img.removeAttribute(ALIGN_ATTR));
    root.querySelectorAll(`[${TEXT_ATTR}], [${BOX_ATTR}]`).forEach((el) => {
      el.removeAttribute(TEXT_ATTR);
      el.removeAttribute(BOX_ATTR);
    });
    const html = root.ownerDocument.documentElement;
    if (!html.hasAttribute(CENTRED_IMAGES_ATTR)) return 0;
    html.removeAttribute(CENTRED_IMAGES_ATTR);
    let count = 0;
    [...root.querySelectorAll("table")].filter(isSectionMetadata).forEach((table) => {
      const style = [...table.querySelectorAll("tr")].map((tr) => [...tr.children]).find((cells) => cells.length > 1 && /^style$/i.test(cells[0].textContent.trim()));
      if (!style) return;
      const tokens = style[1].textContent.split(",").map((t) => t.trim()).filter(Boolean);
      if (!tokens.includes(BODY_STYLE) || tokens.includes(CENTRED_IMAGES_STYLE)) return;
      style[1].textContent = [...tokens, CENTRED_IMAGES_STYLE].join(", ");
      count += 1;
    });
    return count;
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
  function emitWidget(panel, document2, out, stats, { inBlock = false } = {}) {
    const kind = classifyWidget(panel);
    stats.byKind[kind] = (stats.byKind[kind] || 0) + 1;
    if (DEFERRED.has(kind)) {
      stats.deferred.push(kind);
      return;
    }
    if (DROPPED.has(kind)) return;
    if (kind === "offset") {
      const height = spacerHeight(panel);
      if (!inBlock && height) out.push(WebImporter.DOMUtils.createTable([["Spacer"], [`${height}px`]], document2));
      return;
    }
    if (kind === "nested-builder") {
      emitNestedRows(panel, document2, out, stats, { inBlock });
      return;
    }
    let cells = null;
    let nodes = null;
    switch (kind) {
      case "editor":
        nodes = editorNodes(panel, document2);
        break;
      // carousel-widget routes by content (Cards if teasers-with-links, else Gallery (slider));
      // sow-slider is always an image slider → Gallery.
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
        cells = milestonesCells(panel, document2);
        if (!cells) {
          nodes = milestonesFallback(panel, document2);
          stats.fallback.push(kind);
        }
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
      nodes.forEach((n) => {
        if (!isBlankParagraph(n)) {
          out.push(n);
          return;
        }
        if (!inBlock) out.push(WebImporter.DOMUtils.createTable([["Spacer (line)"], [`${BLANK_LINE_PX}px`]], document2));
      });
    }
  }
  function emitMultiColumn(cells, document2, out, stats) {
    var _a;
    const row = [];
    const filled = [];
    const offsets = [];
    const leads = [];
    cells.forEach((cell) => {
      const cellOut = [];
      const panels = panelsOf(cell);
      panels.forEach((p) => emitWidget(p, document2, cellOut, stats, { inBlock: true }));
      if (cellOut.length) {
        row.push(cellOut);
        filled.push(cell);
        const first = panels.findIndex((p) => classifyWidget(p) !== "offset");
        offsets.push(panels.slice(0, first).reduce((sum, p) => sum + spacerHeight(p), 0));
        leads.push(first >= 0 ? leadingBlankHeight(panels[first]) : 0);
      }
    });
    if (row.length > 1) {
      const split = splitVariant(filled);
      const variants = split ? [split, portraitVariant(filled)].filter(Boolean) : centredVariants(filled);
      const token = (name, values) => values.some((v) => v > 0) && values.every((v) => v <= 999) ? [`${name}-${values.join("-")}`] : [];
      variants.push(...token("offset", offsets), ...token("lead", leads));
      if (variants.some((v) => v === "centered" || v.startsWith("split-"))) {
        variants.push(...rowPaddingVariants((_a = cells[0]) == null ? void 0 : _a.closest(".panel-grid")));
      }
      const header = variants.length ? `Columns (${variants.join(", ")})` : "Columns";
      out.push(WebImporter.DOMUtils.createTable([[header], row], document2));
      stats.multiColumn += 1;
      if (split) stats.split = (stats.split || 0) + 1;
      if (variants.includes("centered")) stats.centered = (stats.centered || 0) + 1;
    } else if (row.length === 1) {
      row[0].forEach((n) => out.push(n));
    }
  }
  function gridRow(grid, document2, stats, { inBlock = false } = {}) {
    const row = [];
    const cells = cellsOf(grid);
    const nonEmpty = cells.filter((c) => panelsOf(c).length > 0);
    if (nonEmpty.length > 1 && !inBlock) {
      emitMultiColumn(nonEmpty, document2, row, stats);
    } else {
      cells.forEach((cell) => panelsOf(cell).forEach((p) => emitWidget(p, document2, row, stats, { inBlock })));
    }
    return row;
  }
  function nestedGrids(panel) {
    const layout = panel.querySelector(".panel-layout") || panel;
    return [...layout.children].filter((grid) => grid.matches(".panel-grid"));
  }
  function emitNestedRows(panel, document2, out, stats, { inBlock = false } = {}) {
    const grids = nestedGrids(panel);
    if (!grids.length) {
      stats.unknown.push(`nested builder without rows: ${panel.className || "(no class)"}`);
      return;
    }
    grids.forEach((grid) => out.push(...gridRow(grid, document2, stats, { inBlock })));
  }
  function expandGrids(grids) {
    return grids.flatMap((grid) => {
      if (grid.hasAttribute(HIGHLIGHT_ATTR)) return [grid];
      const panels = cellsOf(grid).flatMap(panelsOf);
      if (panels.length !== 1 || classifyWidget(panels[0]) !== "nested-builder") return [grid];
      const inner = nestedGrids(panels[0]);
      return inner.length ? expandGrids(inner) : [grid];
    });
  }
  function parse2(element, { document: document2 }) {
    const layout = element.querySelector(".panel-layout, .panel-grid");
    if (!layout) return;
    const grids = expandGrids([...element.querySelectorAll(".panel-grid")].filter((g) => !g.parentElement.closest('.so-panel, [class*="widget_"]')));
    const out = [];
    const stats = {
      grids: grids.length,
      byKind: {},
      deferred: [],
      unknown: [],
      fallback: [],
      multiColumn: 0,
      highlights: 0
    };
    let resume = false;
    let held = [];
    grids.forEach((grid) => {
      const variant = grid.getAttribute(HIGHLIGHT_ATTR);
      const row = gridRow(grid, document2, stats);
      if (!row.length) return;
      if (resume && !variant && row.every(isSpacer)) {
        held.push(...row);
        return;
      }
      if (variant) held = [];
      if (variant) {
        const geometry = GEOMETRY_KEYS.filter((key) => grid.hasAttribute(`data-${key}`)).map((key) => [key, grid.getAttribute(`data-${key}`)]);
        out.push(...partSections(row, `${BODY_STYLE}, highlight-${variant}`, geometry, document2, variant));
        stats.highlights += 1;
        resume = true;
        return;
      }
      if (resume) out.push(document2.createElement("hr"), sectionMetadata(BODY_STYLE, document2));
      resume = false;
      out.push(...held, ...splitTextRuns(row, document2));
      held = [];
    });
    if (resume && hasContentAfter(layout, element)) {
      out.push(document2.createElement("hr"), sectionMetadata(BODY_STYLE, document2));
    }
    const narrow = narrowBodyImages(out);
    const centred = narrow.filter(isCentred).length;
    if (narrow.length && centred === narrow.length) document2.documentElement.setAttribute(CENTRED_IMAGES_ATTR, "");
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
      centered: stats.centered || 0,
      images: { narrow: narrow.length, centred },
      highlights: stats.highlights,
      deferred: stats.deferred,
      unknown: stats.unknown,
      fallback: stats.fallback
    };
    if (stats.deferred.length || stats.unknown.length || stats.fallback.length) {
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
  var SOURCE_DATE = /^\d{1,2}\.\s?\d{1,2}\.\s?\d{4}$/;
  function itemDate(item) {
    const date = text(item.querySelector(".entry-meta .entry-published, .entry-published"));
    return SOURCE_DATE.test(date) ? date : "";
  }
  function parse3(element, { document: document2, dates = false }) {
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
      const date = dates ? itemDate(item) : "";
      cells.push(date ? [img || "", date, title, linkCell] : [img || "", title, linkCell]);
    });
    if (cells.length === 1) {
      element.replaceWith(...element.childNodes);
      return;
    }
    element.replaceWith(WebImporter.DOMUtils.createTable(cells, document2));
  }

  // tools/importer/parsers/press-kit-media.js
  var text2 = (node) => ((node == null ? void 0 : node.textContent) || "").replace(/\s+/g, " ").trim();
  var SOURCE_DATE2 = /^\d{1,2}\.\s?\d{1,2}\.\s?\d{4}$/;
  var tileDate = (item) => {
    const date = text2(item.querySelector(".entry-meta .entry-published, .entry-published"));
    return SOURCE_DATE2.test(date) ? date : "";
  };
  function downloads(item, document2) {
    const candidates = [...item.querySelectorAll(".media-cart-action-multi.download a[href]")];
    if (!candidates.length) {
      const single = item.querySelector('a.media-cart-action.download[href], a[data-action="download"][href]') || item.querySelector('a[href*="direct-download"]');
      if (single) candidates.push(single);
    }
    const seen = /* @__PURE__ */ new Set();
    return candidates.flatMap((a) => {
      const href = a.getAttribute("href");
      if (!href || href === "#" || seen.has(href)) return [];
      seen.add(href);
      const ext = href.split(/[?#]/)[0].split(".").pop().toUpperCase();
      const label = text2(a) && text2(a) !== "Download" ? text2(a) : ext;
      const link = document2.createElement("a");
      link.href = href;
      link.textContent = label;
      return [link];
    });
  }
  var REGULATORY = /\bWLTP\b|(?=.*\b\d[\d.,\s–-]*(?:kWh|l)\s*\/\s*100\s*km)(?=.*(?:CO[₂2]|g\s*\/\s*km))/i;
  function parse4(element, { document: document2 }, { story = false } = {}) {
    const gallery = element.matches(".search-results-gallery");
    const notes = gallery ? [...new Set([...element.querySelectorAll(".article-teaser-media img[data-caption]")].map((img) => text2(Object.assign(document2.createElement("div"), { innerHTML: img.getAttribute("data-caption") }))).filter((caption) => caption && REGULATORY.test(caption)))] : [];
    const items = [...element.querySelectorAll(".search-results-item")];
    if (!items.length) throw new Error("Press-kit Media Box has no assets");
    const expected = Number(element.dataset.expectedAssets);
    if (expected && items.length !== expected) {
      throw new Error(`Press-kit Media Box expected ${expected} assets, found ${items.length}`);
    }
    const rows = [];
    items.forEach((wrapper) => {
      var _a, _b;
      const item = wrapper.querySelector("article.media-cart-item");
      if (!item) throw new Error("Malformed press-kit Media Box asset");
      const links = downloads(item, document2);
      if (!links.length) throw new Error(`Press-kit asset has no download URL: ${text2(item.querySelector(".entry-title"))}`);
      const img = item.querySelector(".article-teaser-media img");
      const title = text2(item.querySelector(".entry-title")) || (img == null ? void 0 : img.getAttribute("alt")) || "";
      if (!title) throw new Error("Press-kit Media Box asset has no title");
      const paragraphs = links.map((link) => {
        const p = document2.createElement("p");
        p.append(link);
        return p;
      });
      const date = gallery ? "" : tileDate(item);
      const named = date ? [date, title] : [title];
      if (!img) {
        rows.push(["", ...named, paragraphs]);
        return;
      }
      if (!((_a = img.getAttribute("alt")) == null ? void 0 : _a.trim())) img.alt = ((_b = img.getAttribute("title")) == null ? void 0 : _b.replace(/^Video\s*\|\s*/i, "")) || title;
      const src = img.getAttribute("src") || "";
      if (/^https:\/\/i\.vimeocdn\.com\//.test(src)) {
        img.src = src.replace(/-d_\d+x\d+(\.[a-z]+)?(\?.*)?$/i, "-d_1280x720.jpg");
      }
      ["data-caption", "data-video_title", "data-video_src", "srcset", "sizes", "itemprop", "title"].forEach((attr) => img.removeAttribute(attr));
      rows.push([img, ...named, paragraphs]);
    });
    let config = gallery ? [["collapse", "auto"]] : [];
    if (gallery && story) {
      const toggled = !!element.querySelector(".search-results-items[data-togglebox]");
      config = [["collapse", toggled ? "auto" : "none"], ["columns", toggled ? "4" : "3"]];
    }
    let name = gallery ? "Downloads (gallery)" : "Downloads";
    if (gallery && story) name = "Downloads (gallery, story)";
    const table = WebImporter.DOMUtils.createTable([[name], ...config, ...rows], document2);
    element.replaceWith(table, ...notes.map((note) => Object.assign(document2.createElement("p"), { textContent: note })));
  }

  // tools/importer/transformers/skoda-drop-cap.js
  var ATTR = "data-skoda-drop-cap";
  var ROWS = [
    ["text", "drop-cap-text"],
    ["color", "drop-cap-color"],
    ["background", "drop-cap-background"],
    ["marginBottom", "drop-cap-margin-bottom"]
  ];
  var inline = (style, name) => {
    const decl = style.split(";").map((d) => d.split(":")).find(([prop]) => (prop == null ? void 0 : prop.trim().toLowerCase()) === name);
    return decl ? decl.slice(1).join(":").trim() : "";
  };
  function markDropCap(document2) {
    const cap = document2.querySelector("article .entry-content .drop-cap, article .content .drop-cap");
    const text5 = ((cap == null ? void 0 : cap.textContent) || "").trim();
    if (!text5) return null;
    const style = cap.getAttribute("style") || "";
    const data = {
      text: text5,
      color: inline(style, "color"),
      background: inline(style, "background-color"),
      marginBottom: inline(style, "margin-bottom")
    };
    document2.documentElement.setAttribute(ATTR, JSON.stringify(data));
    return data;
  }
  var isSectionMetadata2 = (el) => el.tagName === "TABLE" && /^section metadata$/i.test(((el.querySelector("tr > th, tr > td") || {}).textContent || "").trim());
  var after = (a, b) => !!(a.compareDocumentPosition(b) & 4);
  function applyDropCap(root) {
    const html = root.ownerDocument.documentElement;
    const raw = html.getAttribute(ATTR);
    html.removeAttribute(ATTR);
    if (!raw) return false;
    const data = JSON.parse(raw);
    const doc = root.ownerDocument;
    const missed = (why) => {
      console.warn(`drop cap "${data.text}" not applied: ${why}`);
      return false;
    };
    const breaks = [...root.querySelectorAll("hr")].filter((hr) => !hr.closest("table"));
    const metas = [...root.querySelectorAll("table")].filter(isSectionMetadata2);
    const styleRow = (table) => [...table.querySelectorAll("tr")].find((tr) => tr.children.length > 1 && /^style$/i.test(tr.children[0].textContent.trim()));
    const meta = metas.find((t) => {
      var _a;
      return /\bbody-column\b/.test(((_a = styleRow(t)) == null ? void 0 : _a.children[1].textContent) || "");
    });
    if (!meta) return missed("no body section");
    const start = [...breaks].reverse().find((hr) => after(hr, meta));
    const end = breaks.find((hr) => after(meta, hr));
    const first = [...root.querySelectorAll("p")].find((p) => !p.closest("table") && p.textContent.trim() && (!start || after(start, p)) && (!end || after(p, end)));
    if (!first || !first.textContent.trim().startsWith(data.text)) {
      return missed("the first body section does not open with it");
    }
    const cell = styleRow(meta).children[1];
    cell.textContent = `${cell.textContent.trim()}, drop-cap`;
    ROWS.forEach(([field, key]) => {
      if (!data[field]) return;
      const tr = doc.createElement("tr");
      [key, data[field]].forEach((value) => {
        tr.appendChild(doc.createElement("td")).textContent = value;
      });
      (meta.querySelector("tbody") || meta).appendChild(tr);
    });
    return true;
  }

  // tools/importer/parsers/footnotes.js
  var MARK = "data-skoda-footnote";
  var NAME = "Footnotes";
  var BODY_PX = 16;
  var MEDIA = "img, picture, video, audio, iframe, svg, object, embed, canvas";
  var text3 = (node) => ((node == null ? void 0 : node.textContent) || "").replace(/\s+/g, " ").trim();
  function fontPx(el) {
    var _a;
    const value = (_a = el.style) == null ? void 0 : _a.fontSize;
    if (!value) return null;
    const match = value.match(/^([\d.]+)(px|pt)$/i);
    if (!match) return NaN;
    return match[2].toLowerCase() === "pt" ? Number(match[1]) * 4 / 3 : Number(match[1]);
  }
  var isSmall = (px) => px > 0 && px < BODY_PX;
  function isFootnote(p) {
    var _a;
    if (!((_a = p == null ? void 0 : p.matches) == null ? void 0 : _a.call(p, "p")) || fontPx(p) !== null || !text3(p) || p.querySelector(MEDIA)) return false;
    const walker = p.ownerDocument.createTreeWalker(
      p,
      4
      /* NodeFilter.SHOW_TEXT */
    );
    let small = false;
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (text3(node)) {
        let el = node.parentElement;
        let marker = false;
        while (el !== p && fontPx(el) === null) {
          if (el.matches("sup")) marker = true;
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
  function markFootnotes(root) {
    const found = [...root.querySelectorAll("p")].filter(isFootnote);
    found.forEach((p) => p.setAttribute(MARK, ""));
    return found.length;
  }
  var edge = (n) => n && (n.nodeType === 1 && n.matches("br") || n.nodeType === 3 && !text3(n));
  function footnoteParagraph(p, document2) {
    var _a, _b;
    const copy = document2.createElement("p");
    copy.append(...[...p.childNodes].map((node) => node.cloneNode(true)));
    copy.querySelectorAll("span").forEach((span) => span.replaceWith(...span.childNodes));
    copy.querySelectorAll("[style]").forEach((el) => el.removeAttribute("style"));
    while (edge(copy.lastChild)) copy.lastChild.remove();
    while (edge(copy.firstChild)) copy.firstChild.remove();
    if (((_a = copy.lastChild) == null ? void 0 : _a.nodeType) === 3) copy.lastChild.textContent = copy.lastChild.textContent.replace(/\s+$/, "");
    if (((_b = copy.firstChild) == null ? void 0 : _b.nodeType) === 3) copy.firstChild.textContent = copy.firstChild.textContent.replace(/^\s+/, "");
    return copy;
  }
  function tableBefore(p) {
    let node = p.previousSibling;
    while ((node == null ? void 0 : node.nodeType) === 3 && !text3(node)) node = node.previousSibling;
    return (node == null ? void 0 : node.nodeType) === 1 && node.matches("table") && text3(node.querySelector("th, td")) === NAME ? node : null;
  }
  function parse5(p, { document: document2 }) {
    p.removeAttribute(MARK);
    if (p.closest("table, li, blockquote, figure") || !text3(p)) return;
    const row = [footnoteParagraph(p, document2)];
    const table = WebImporter.DOMUtils.createTable([[NAME], row], document2);
    const prev = tableBefore(p);
    if (prev) {
      [...prev.rows].pop().after([...table.rows].pop());
      p.remove();
      return;
    }
    p.replaceWith(table);
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
    const yt = src.match(/(youtube(?:-nocookie)?\.com)\/embed\/([\w-]{6,})(\?[^#]*)?/i);
    if (yt) return `https://www.${yt[1].toLowerCase()}/embed/${yt[2]}${yt[3] || ""}`;
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
  function sourceLocale(url) {
    try {
      const m = new URL(url, "https://www.skoda-storyboard.com").pathname.match(/^\/([a-z]{2})(?:\/|$)/i);
      return m ? m[1].toLowerCase() : "en";
    } catch (e) {
      return "en";
    }
  }
  var plainAlt = (alt) => (alt || "").replace(/<br\s*\/?>/gi, " ").replace(/\s+/g, " ").trim();
  function fullTitle(title, alt) {
    const clipped = title.match(/^(.*?)\s*(?:…|\.\.\.)$/);
    const prefix = clipped ? clipped[1] : "";
    const whole = plainAlt(alt);
    if (prefix.split(" ").length < 2 || !whole.startsWith(prefix)) return title;
    if (whole.length > prefix.length && !/^[\s,.:;!?–-]/.test(whole.slice(prefix.length))) return title;
    return whole;
  }
  function curatedCards(band, document2) {
    const squashed = (el) => el ? (el.textContent || "").replace(/\s+/g, " ").trim() : "";
    const rows = [];
    band.querySelectorAll("article.article-teaser").forEach((card) => {
      const titleLink = card.querySelector(".entry-title a[href]");
      const href = titleLink && titleLink.getAttribute("href");
      const img = card.querySelector(".article-teaser-media img");
      const title = fullTitle(squashed(titleLink), img && img.getAttribute("alt"));
      if (!href || !title) return;
      if (img) {
        ["data-caption", "data-video_title", "data-video_src", "srcset", "sizes", "itemprop", "loading", "decoding"].forEach((a2) => img.removeAttribute(a2));
        if (img.hasAttribute("alt")) img.setAttribute("alt", plainAlt(img.getAttribute("alt")));
      }
      const body = [];
      const date = squashed(card.querySelector(".entry-published"));
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
      rows.push(img ? [img, body] : [body]);
    });
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
    const originalURL = payload && payload.params && payload.params.originalURL || "";
    let rows;
    if (sourceLocale(originalURL) !== "en") {
      rows = [["Story Rail"], ...curatedCards(band, document2)];
      if (rows.length === 1) {
        console.warn("[story-cleanup] related band: no source cards; dropped");
        cover.remove();
        return;
      }
    } else {
      const filters = facetRows(element);
      if (!filters.length) {
        console.warn("[story-cleanup] related band: story has no tags to match; dropped");
        cover.remove();
        return;
      }
      const self = lastSegment(originalURL);
      rows = [["Story Rail"], ["template", "story"], ...filters, ["limit", "10"]];
      if (self) rows.push(["exclude", self]);
    }
    const title = document2.createElement("h3");
    title.textContent = headingText;
    const out = [document2.createElement("hr"), title];
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
      if (table.hasAttribute("data-skoda-block")) return;
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
      const title = document2.createElement("h3");
      title.textContent = heading;
      const out = [hr, title];
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
  var NEWSLETTER_BLOCK = "Newsletter Stub (card)";
  var NEWSLETTER_DEFAULTS = {
    label: "Email address",
    message: "Newsletter signup is not available yet",
    error: "Please enter a valid e-mail address.",
    "consent-error": "Please accept the terms before continuing."
  };
  var squash2 = (s) => (s || "").replace(/[ \t\r\n]+/g, " ").trim();
  function inlineNodes(source, document2) {
    const nodes = [];
    source.childNodes.forEach((n) => {
      if (n.nodeType === 3) {
        const t = n.nodeValue.replace(/[ \t\r\n]+/g, " ");
        if (t) nodes.push(document2.createTextNode(t));
      } else if (n.nodeName === "BR") {
        nodes.push(document2.createElement("br"));
      } else if (n.nodeName === "A" && n.getAttribute("href")) {
        const a = document2.createElement("a");
        a.setAttribute("href", n.getAttribute("href"));
        a.textContent = squash2(n.textContent);
        if (a.textContent) nodes.push(a);
      } else if (n.nodeType === 1) {
        const t = squash2(n.textContent);
        if (t) nodes.push(document2.createTextNode(t));
      }
    });
    const edge2 = (i, re) => {
      while (nodes.length && nodes[i()].nodeType === 3) {
        const n = nodes[i()];
        n.nodeValue = n.nodeValue.replace(re, "");
        if (n.nodeValue) break;
        nodes.splice(i(), 1);
      }
    };
    edge2(() => 0, /^[ \u00a0]+/);
    edge2(() => nodes.length - 1, /[ \u00a0]+$/);
    return nodes.filter((n) => n.nodeType !== 3 || n.nodeValue);
  }
  function newsletterCard(widget, document2) {
    const rows = [[NEWSLETTER_BLOCK]];
    const add = (key, value2) => {
      if (Array.isArray(value2) ? value2.length : value2) rows.push([key, value2]);
    };
    const value = (sel, attr) => {
      const el = widget.querySelector(sel);
      if (!el) return "";
      return squash2(attr ? el.getAttribute(attr) : el.textContent);
    };
    const src = widget.querySelector("header img");
    if (src && src.getAttribute("src")) {
      const img = document2.createElement("img");
      img.setAttribute("src", src.getAttribute("src"));
      img.setAttribute("alt", "");
      add("image", [img]);
    }
    const heading = widget.querySelector("header h1, header h2, header h3, header h4");
    if (heading) add("heading", inlineNodes(heading, document2));
    add("label", NEWSLETTER_DEFAULTS.label);
    add("placeholder", value('input[type="email"], input.email', "placeholder"));
    add("button", value('button[type="submit"], button'));
    const terms = widget.querySelector(".terms label, label[for]");
    if (terms) {
      const label = terms.cloneNode(true);
      label.querySelectorAll(".manage-subscription-link").forEach((n) => n.remove());
      add("consent", inlineNodes(label, document2));
    }
    const manage = widget.querySelector(".manage-subscription-link a[href]");
    if (manage && squash2(manage.textContent)) {
      const a = document2.createElement("a");
      a.setAttribute("href", manage.getAttribute("href"));
      a.textContent = squash2(manage.textContent);
      add("manage", [a]);
    }
    add("message", NEWSLETTER_DEFAULTS.message);
    add("error", NEWSLETTER_DEFAULTS.error);
    add("consent-error", value(".checkbox-error") || NEWSLETTER_DEFAULTS["consent-error"]);
    add("list", value('input[name="list"]', "value"));
    add("language", value('input[name="language"]', "value"));
    return rows.some(([k]) => k === "heading" || k === "button") ? rows : null;
  }
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
      const text5 = (a.textContent || "").trim();
      if (!href || !text5) return;
      if (href === "#" || a.classList.contains("show-hidden-terms")) return;
      const link = document2.createElement("a");
      link.setAttribute("href", href);
      link.textContent = text5;
      cell.push(link);
    });
    return cell.length ? [["Tags"], [cell]] : null;
  }
  function transform3(hookName, element, payload) {
    const widgets = () => element.querySelectorAll(".sidebar .newsletter-subscribe-widget");
    if (hookName === "newsletter-card") {
      const doc = element.ownerDocument || payload && payload.document;
      widgets().forEach((widget) => {
        const rows = newsletterCard(widget, doc);
        if (rows) widget.replaceWith(WebImporter.DOMUtils.createTable(rows, doc));
        else widget.remove();
      });
      return;
    }
    if (hookName === "preprocess") {
      widgets().forEach((widget) => {
        const sidebar2 = widget.closest(".sidebar");
        if (sidebar2 && newsletterCard(widget, element.ownerDocument)) sidebar2.setAttribute("data-newsletter-card", "shared");
        widget.remove();
      });
      return;
    }
    if (hookName !== TransformHook3.afterTransform) return;
    const sidebar = element.querySelector(".sidebar");
    if (!sidebar) return;
    const cards = relatedCards(sidebar, document);
    const tags = tagsCell(sidebar, document);
    const newsletter = sidebar.getAttribute("data-newsletter-card") === "shared";
    const frag = document.createElement("div");
    const hr = document.createElement("hr");
    frag.appendChild(hr);
    const aside = document.createElement("aside");
    const heading = sidebar.querySelector(".related .heading, .related h2, .related h3");
    if (heading) {
      const h = document.createElement("h3");
      h.textContent = (heading.textContent || "Explore more").trim();
      aside.appendChild(h);
    }
    if (cards) aside.appendChild(WebImporter.DOMUtils.createTable(cards, document));
    if (tags) {
      const tagsHeading = sidebar.querySelector("section.tags .heading, section.tags h2, section.tags h3");
      if (tagsHeading && (tagsHeading.textContent || "").trim()) {
        const h = document.createElement("h3");
        h.textContent = tagsHeading.textContent.trim();
        aside.appendChild(h);
      }
      aside.appendChild(WebImporter.DOMUtils.createTable(tags, document));
    }
    if (newsletter && !cards && !tags) {
      const source = payload && payload.params && payload.params.originalURL || "";
      let locale = "en";
      try {
        const first = new URL(source).pathname.split("/")[1] || "";
        if (/^[a-z]{2}$/.test(first)) locale = first;
      } catch (e) {
      }
      const link = document.createElement("a");
      link.setAttribute("href", `/${locale}/fragments/newsletter-card`);
      link.textContent = link.getAttribute("href");
      aside.appendChild(WebImporter.DOMUtils.createTable([["Fragment"], [[link]]], document));
    }
    frag.appendChild(aside);
    const metadataBlock = WebImporter.Blocks.createBlock(document, {
      name: "Section Metadata",
      cells: { Style: "sidebar" }
    });
    frag.appendChild(metadataBlock);
    if (!cards && !tags && !newsletter) {
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
  var SOFT_BREAK = /[\u00A0\u{F00A0}]/gu;
  function spacedText(h1) {
    const copy = h1.cloneNode(true);
    copy.querySelectorAll("br").forEach((br) => br.replaceWith(" "));
    return copy.textContent.replace(SOFT_BREAK, " ").replace(/\s+/g, " ").trim();
  }
  function respacedTitle(title, h1) {
    if (!title || !h1) return title;
    const spaced = spacedText(h1);
    const bare = (s) => s.replace(SOFT_BREAK, "").replace(/\s+/g, "");
    const words = (s) => s.split(" ").length;
    return bare(spaced) === bare(title) && words(spaced) > words(title) ? spaced : title;
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
  var CATEGORY_PARENTS = {
    "120-years-of-skoda-motorsport": "motorsport",
    adventures: "lifestyle",
    "annual-reports": "media",
    citigo: "models",
    connectivity: "innovation-and-technology",
    cycling: "sports",
    design: "skoda-world",
    elroq: "models",
    enyaq: "models",
    "enyaq-coupe-rs-iv": "models",
    epiq: "models",
    fabia: "models",
    heritage: "skoda-world",
    hockey: "sports",
    "innovation-and-technology": "skoda-world",
    kamiq: "models",
    "kamiq-china": "models",
    karoq: "models",
    kodiaq: "models",
    kushaq: "models",
    kylaq: "models",
    livestream: "media",
    motorsport: "lifestyle",
    octavia: "models",
    "octavia-combi": "models",
    "octavia-combi-greenline": "models",
    "octavia-combi-rs": "models",
    "octavia-greenline": "models",
    "octavia-rs": "models",
    "octavia-scout": "models",
    other: "media",
    "peaq-en": "models",
    people: "lifestyle",
    rapid: "models",
    "rapid-spaceback": "models",
    responsibility: "skoda-world",
    scala: "models",
    slavia: "models",
    speeches: "media",
    sports: "lifestyle",
    superb: "models",
    "superb-combi": "models",
    "technical-data": "media",
    technology: "innovation-and-technology",
    yeti: "models",
    "yeti-outdoor": "models"
  };
  function extractCategories(document2) {
    const cls = document2.body && document2.body.getAttribute("class") || "";
    const id = cls.match(/\bpostid-(\d+)\b/);
    const post = id && document2.querySelector(`article.post-${id[1]}`);
    const out = [];
    String(post && post.getAttribute("class") || "").split(/\s+/).forEach((token) => {
      const m = token.toLowerCase().match(/^category-([a-z0-9_-]+)$/);
      let slug = m && m[1];
      while (slug && !out.includes(slug)) {
        out.push(slug);
        slug = CATEGORY_PARENTS[slug];
      }
    });
    return out;
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
    const title = respacedTitle(cleanTitle(overrides.title || metaContent(document2, 'meta[property="og:title"]') || (document2.querySelector("title") ? document2.querySelector("title").textContent.trim() : "") || (h1 ? h1.textContent.trim() : "")), h1);
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
    if (overrides.nav) meta.nav = overrides.nav;
    if (overrides.footer) meta.footer = overrides.footer;
    if (overrides.presskit) meta.presskit = overrides.presskit;
    if (category) meta.category = category;
    const categories = template === "story" ? extractCategories(document2) : [];
    if (categories.length) meta.categories = categories.join(", ");
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
    "/en/emobility/a-true-czech-from-spain",
    "/en/emobility/an-electric-car-approaching-says-the-license-plate-but-only-in-some-countries",
    "/en/emobility/big-possibilities-in-a-small-package-the-new-skoda-epiq",
    "/en/emobility/camouflage-to-get-you-hooked",
    "/en/emobility/coffee-on-electric-wheels-elroq-and-enyaq-serving-coffee",
    "/en/emobility/come-and-play-skoda-is-heading-to-milan",
    "/en/emobility/designers-on-the-peaq-its-modern-durable-and-practical",
    "/en/emobility/elroq-rs-in-a-robe-unveiling-the-secret-of-matte-paint",
    "/en/emobility/enyaq-and-elroq-now-double-as-gaming-consoles-and-thats-not-all",
    "/en/emobility/even-opening-the-door-is-an-experience-says-the-designer-of-the-peaq-suv",
    "/en/emobility/how-the-versatile-skoda-peaq-conquered-a-mountain-peak",
    "/en/emobility/how-was-the-elroq-made-not-in-the-usual-way",
    "/en/emobility/make-use-of-the-frunk-unlock-with-your-phone-new-enhancements-for-elroq-and-enyaq",
    "/en/emobility/meet-peaq-safe-and-comfortable",
    "/en/emobility/meet-the-peaq-a-large-suv-with-outstanding-aerodynamics",
    "/en/emobility/meet-the-peaq-comfort-just-like-at-home",
    "/en/emobility/meet-the-peaq-spacious-inside-and-out",
    "/en/emobility/modelling-clay-yoga-simply-epiq-skoda-returns-to-milan",
    "/en/emobility/peaq-enters-production-sharing-the-line-with-the-octavia",
    "/en/emobility/peaq-sets-a-record-from-the-heart-of-europe-to-the-sea-without-recharging",
    "/en/emobility/practical-fun-stylish-5-reasons-to-choose-the-epiq",
    "/en/emobility/skoda-elroq-and-a-happy-family",
    "/en/emobility/skoda-elroq-premiere-light-cube-camera-action",
    "/en/emobility/skoda-epiq-now-dresses-up-in-striking-sportline-trim",
    "/en/emobility/skoda-epiq-will-win-you-over-in-just-a-few-seconds",
    "/en/emobility/skoda-peaq-unparalleled-space-and-comfort",
    "/en/emobility/spacious-comfortable-and-striking-five-reasons-to-want-the-skoda-peaq",
    "/en/emobility/sunset-over-the-mountains-the-story-behind-the-camouflage-for-the-skoda-peaq",
    "/en/emobility/teaser",
    "/en/emobility/the-skoda-peaq-will-win-you-over-fast",
    "/en/emobility/this-is-epiq-a-behind-the-scenes-look-at-the-premiere",
    "/en/emobility/watch-the-world-premiere-of-the-skoda-epiq-ev-live",
    "/en/emobility/whats-behind-epiq-design",
    "/en/images",
    "/en/lifestyle/13-countries-over-19000-kilometers-the-kylaq-traveled-from-pune-to-prague",
    "/en/lifestyle/an-epic-start-to-the-tour-de-france-skoda-got-barcelona-moving",
    "/en/lifestyle/chainsaws-and-sparklers-discover-the-traditions-of-rally-fans",
    "/en/lifestyle/feeling-the-heat-skoda-cars-keep-both-passengers-and-their-snacks-cool",
    "/en/lifestyle/from-unwanted-graffiti-to-bold-support-for-womens-cycling",
    "/en/lifestyle/la-dolce-vita-explore-the-surroundings-of-lake-como",
    "/en/lifestyle/ouninpohja-finlands-roller-coaster-stage",
    "/en/lifestyle/rs-four-ways-which-one-will-you-choose",
    "/en/lifestyle/skodas-smarter-wireless-charging-goes-beyond-phones",
    "/en/lifestyle/what-you-learn-on-the-circuit-can-save-you-on-the-road",
    "/en/media-cart",
    "/en/media-room",
    "/en/models/skoda-elroq-through-designers-eyes",
    "/en/news",
    "/en/press-kits",
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
    "/en/press-kits/classic-days-2026-press-kit",
    "/en/press-kits/classic-days-2026-press-kit/125-years-of-skoda-motorsport",
    "/en/press-kits/classic-days-2026-press-kit/1955-skoda-440-on-the-international-stage",
    "/en/press-kits/classic-days-2026-press-kit/60-years-of-the-trekka-an-suv-from-new-zealand",
    "/en/press-kits/classic-days-2026-press-kit/images",
    "/en/press-kits/classic-days-2026-press-kit/laurin-klement-bz-1902-1904",
    "/en/press-kits/classic-days-2026-press-kit/laurin-klement-slavia-type-b-1899-1904",
    "/en/press-kits/classic-days-2026-press-kit/laurin-klement-voiturette-a-1905-1907",
    "/en/press-kits/classic-days-2026-press-kit/skoda-110-r-coupe-1970-1980",
    "/en/press-kits/classic-days-2026-press-kit/skoda-1100-mbx-1967-1969",
    "/en/press-kits/classic-days-2026-press-kit/skoda-120-gls-1976-1990",
    "/en/press-kits/classic-days-2026-press-kit/skoda-120-s-rallye-1972-1975",
    "/en/press-kits/classic-days-2026-press-kit/skoda-130-rs-1975-a-star-on-both-sides-of-the-iron-curtain",
    "/en/press-kits/classic-days-2026-press-kit/skoda-645-1929-1934",
    "/en/press-kits/classic-days-2026-press-kit/skoda-auto-celebrates-more-than-130-years-of-craftsmanship-and-innovation",
    "/en/press-kits/classic-days-2026-press-kit/skoda-fabia-rs-rally2-celebrates-125-years-of-skoda-motorsportsuccess",
    "/en/press-kits/classic-days-2026-press-kit/skoda-favorit-136-l-1988-1994",
    "/en/press-kits/classic-days-2026-press-kit/skoda-felicia-1959-1964",
    "/en/press-kits/classic-days-2026-press-kit/skoda-museum",
    "/en/press-kits/classic-days-2026-press-kit/skoda-museum-presents-only-surviving-laurin-klement-bscsports-car-from-1908",
    "/en/press-kits/classic-days-2026-press-kit/skoda-octavia-1959-1964",
    "/en/press-kits/classic-days-2026-press-kit/skoda-octavia-turns-30-three-decades-of-a-brand-icon",
    "/en/press-kits/classic-days-2026-press-kit/skoda-popular-monte-carlo-1936-1939",
    "/en/press-kits/classic-days-2026-press-kit/skoda-popular-sport-1936-outstanding-success-at-the-monte-carlo-rally",
    "/en/press-kits/classic-days-2026-press-kit/skoda-rapid-135-1987-1990",
    "/en/press-kits/classic-days-2026-press-kit/skoda-rapid-ldd-1984",
    "/en/press-kits/classic-days-2026-press-kit/skoda-sport-1949-the-long-distance-runner-from-the-other-side-of-the-iron-curtain",
    "/en/press-kits/classic-days-2026-press-kit/skoda-superb-3000-ohv-1938-1949",
    "/en/press-kits/classic-days-2026-press-kit/texts",
    "/en/press-kits/classic-days-2026-press-kit/the-skoda-1101-tudor-celebrates-its-80th-anniversary",
    "/en/press-kits/classic-days-2026-press-kit/videos",
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
    "/en/press-releases/2026-iihf-ice-hockey-world-championship-roman-josi-wins-most-valuable-player-trophy-created-by-skoda-design",
    "/en/press-releases/30-years-since-the-foundation-stone-was-laid-m13-a-key-pillar-of-skodas-production",
    "/en/press-releases/936-km-without-recharging-skoda-peaq-sets-range-record-for-seven-seater-electric-suvs",
    "/en/press-releases/camp-mode-in-the-myskoda-app-comfortable-overnight-stays-in-electric-vehicles",
    "/en/press-releases/lorena-wiebes-receives-skoda-design-trophy-after-winning-tour-de-france-femmes-avec-zwift-points-classification",
    "/en/press-releases/newsletter-for-employees-and-residents-living-near-the-skoda-auto-kvasiny-plant-3-2026",
    "/en/press-releases/newsletter-for-employees-and-residents-living-near-the-skoda-auto-vrchlabi-plant-3-2026",
    "/en/press-releases/preparations-begin-for-the-11th-skoda-student-car-celebrating-100-years-of-vocational-education",
    "/en/press-releases/production-milestone-skoda-auto-builds-its-one-millionth-karoq",
    "/en/press-releases/simply-clever-for-summer-smart-skoda-features-that-make-every-trip-easier",
    "/en/press-releases/skoda-auto-achieves-strong-financial-results-record-ev-deliveries-and-second-place-in-europe-in-h1-2026",
    "/en/press-releases/skoda-auto-and-national-theatre-extend-partnership-until-at-least-2029",
    "/en/press-releases/skoda-auto-announces-changes-to-its-board-of-management",
    "/en/press-releases/skoda-auto-appoints-world-renowned-road-cyclist-chris-froome-as-brand-cycling-ambassador",
    "/en/press-releases/skoda-auto-celebrates-33-years-as-official-main-sponsor-of-the-iihf-ice-hockey-world-championship-and-unveils-the-epiq",
    "/en/press-releases/skoda-auto-celebrates-successful-milan-design-week-with-strong-visitor-interest-and-fuorisalone-award-recognition-as-highest-rated-installation",
    "/en/press-releases/skoda-auto-enters-saudi-arabian-market-strengthening-its-presence-in-the-middle-east",
    "/en/press-releases/skoda-auto-klaus-zellmer-to-leave-the-company",
    "/en/press-releases/skoda-auto-launches-production-of-the-new-peaq-in-mlada-boleslav",
    "/en/press-releases/skoda-auto-marks-23-years-as-tour-de-france-main-partner-new-skoda-peaq-to-serve-as-red-car",
    "/en/press-releases/skoda-auto-produces-first-units-of-updated-octavia-in-kvasiny",
    "/en/press-releases/skoda-auto-ranks-as-europes-second-best-selling-car-brand-after-a-strong-first-quarter",
    "/en/press-releases/skoda-auto-supports-tour-de-france-femmes-avec-zwift-as-official-main-partner-for-the-fifth-year",
    "/en/press-releases/skoda-auto-supports-uci-mountain-bike-world-championshipsas-official-partner-for-second-year-running",
    "/en/press-releases/skoda-auto-teams-up-with-hasbros-play-doh-brand",
    "/en/press-releases/skoda-auto-unveils-updated-slavia-in-india",
    "/en/press-releases/skoda-epiq-sportline-debuts-at-the-paris-motor-show",
    "/en/press-releases/skoda-expands-electric-portfolio-the-new-epiq-sportlinedebuts-with-dynamic-exterior-styling",
    "/en/press-releases/skoda-fabia-motorsport-edition-limited-edition-celebrates-the-125th-anniversary-of-skoda-motorsport",
    "/en/press-releases/skoda-kvasiny-newsletter-2-2026",
    "/en/press-releases/skoda-launches-production-of-the-new-epiq-in-pamplona-spain",
    "/en/press-releases/skoda-octavia-combi-rs-wins-prestigious-2024-golden-steering-wheel-award-in-the-mid-sized-car-category",
    "/en/press-releases/skoda-octavia-is-the-brands-first-model-with-a-full-hybrid-powertrain",
    "/en/press-releases/skoda-octavia-turns-30-three-decades-of-a-brand-icon",
    "/en/press-releases/skoda-offers-a-first-glimpse-of-the-interior-concept-of-its-electric-seven-seater-peaq",
    "/en/press-releases/skoda-peaq-comprehensive-testing-in-extreme-conditions",
    "/en/press-releases/skoda-presents-exterior-sketches-of-its-all-new-electric-seven-seater-peaq",
    "/en/press-releases/skoda-presents-first-interior-sketches-and-announces-world-premiere-date-of-electric-epiq",
    "/en/press-releases/skoda-receives-red-dot-award-for-its-vision-app-concept",
    "/en/press-releases/skoda-superb-25-years-of-comfort-space-and-technical-excellence",
    "/en/press-releases/skoda-vrchlabi-newsletter-2-2026",
    "/en/press-releases/skodas-electric-bestsellers-elroq-and-enyaq-receive-model-year-updates",
    "/en/press-releases/skodas-voice-assistant-laura-now-enhanced-with-chatgpt-capabilities",
    "/en/press-releases/tadej-pogacar-winner-of-the-113th-tour-de-france-receives-crystal-trophy-created-by-skoda-design",
    "/en/press-releases/the-skoda-4x4-model-range-safe-driving-in-all-weather-and-challenging-terrain",
    "/en/press-releases/the-skoda-elroq-earns-5-star-euro-ncap-safety-rating-with-the-enyaq-and-octavia-retaining-their-top-scores",
    "/en/press-releases/the-updated-octavia-now-with-all-wheel-drive",
    "/en/press-releases/when-driving-fun-meets-comfort-rally-ace-oliver-solberg-tests-the-skoda-octavia-rs",
    "/en/press-releases/world-premiere-of-the-all-new-skoda-elroq-press-materials-and-highlight-video-available",
    "/en/press-releases/world-premiere-of-the-all-new-skoda-epiq-livestream-from-zurich",
    "/en/press-releases/world-premiere-of-the-all-new-skoda-epiq-pictures-on-the-skoda-storyboard",
    "/en/press-releases/world-premiere-of-the-all-new-skoda-peaq-livestream-from-france",
    "/en/search",
    "/en/series-2",
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
    "/en/skoda-model/enyaq-iv-2/enyaq-coupe-iv",
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
    "/en/skoda-world/125-years-of-racing-history-in-one-place-come-visit-the-museum",
    "/en/skoda-world/2024-a-year-of-new-electric-cars-and-innovated-favourites",
    "/en/skoda-world/a-kodiaq-made-of-paper-the-modeler-spent-700-hours-developing-and-building-it",
    "/en/skoda-world/a-record-year-for-skoda-electrified-models-also-contribute",
    "/en/skoda-world/come-cheer-and-sing-along-meet-the-karaoke-car",
    "/en/skoda-world/explore-the-new-skoda-models-in-mixed-reality",
    "/en/skoda-world/get-your-car-ready-for-summer-with-skoda-accessories",
    "/en/skoda-world/how-the-skoda-octavia-reached-365-km-h",
    "/en/skoda-world/king-of-space-and-long-distance-travel-skoda-superb-celebrates-25-years",
    "/en/skoda-world/legend-chris-froome-takes-you-behind-the-scenes-of-the-tour-de-france",
    "/en/skoda-world/making-driving-easier-how-cruise-control-works",
    "/en/skoda-world/octavia-arrives-with-a-new-full-hybrid-powertrain",
    "/en/skoda-world/oliver-solberg-behind-the-wheel-of-the-new-octavia-rs",
    "/en/skoda-world/peaq-inside-a-designblok",
    "/en/skoda-world/quiz-can-you-recognise-skoda-models-by-their-details",
    "/en/skoda-world/rally-champion-and-the-unique-skoda-fabia-motorsport-edition",
    "/en/skoda-world/skoda-classic-tour-through-the-eyes-of-a-spectator",
    "/en/skoda-world/sportline-models-dynamic-elegance-for-every-day",
    "/en/skoda-world/the-immortal-octavia-see-what-it-looks-like-after-one-million-kilometres",
    "/en/skoda-world/the-new-skoda-slavia-features-a-refreshed-look-and-an-exclusive-colour",
    "/en/skoda-world/the-versatile-octavia-do-you-know-these-ones-too",
    "/en/skoda-world/what-was-racing-like-half-a-century-ago-skoda-120-s-rallye-delights-a-champion",
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
  var LIVE_ONLY_PATHS = [
    "/en/emobility/a-true-czech-from-spain",
    "/en/emobility/big-possibilities-in-a-small-package-the-new-skoda-epiq",
    "/en/emobility/come-and-play-skoda-is-heading-to-milan",
    "/en/emobility/meet-peaq-safe-and-comfortable",
    "/en/emobility/meet-the-peaq-a-large-suv-with-outstanding-aerodynamics",
    "/en/emobility/modelling-clay-yoga-simply-epiq-skoda-returns-to-milan",
    "/en/emobility/teaser",
    "/en/emobility/the-skoda-peaq-will-win-you-over-fast",
    "/en/emobility/this-is-epiq-a-behind-the-scenes-look-at-the-premiere",
    "/en/emobility/watch-the-world-premiere-of-the-skoda-epiq-ev-live",
    "/en/emobility/whats-behind-epiq-design",
    "/en/lifestyle/feeling-the-heat-skoda-cars-keep-both-passengers-and-their-snacks-cool",
    "/en/media-cart",
    "/en/media-room",
    "/en/news",
    "/en/press-kits",
    "/en/press-releases/2026-iihf-ice-hockey-world-championship-roman-josi-wins-most-valuable-player-trophy-created-by-skoda-design",
    "/en/press-releases/camp-mode-in-the-myskoda-app-comfortable-overnight-stays-in-electric-vehicles",
    "/en/press-releases/lorena-wiebes-receives-skoda-design-trophy-after-winning-tour-de-france-femmes-avec-zwift-points-classification",
    "/en/press-releases/newsletter-for-employees-and-residents-living-near-the-skoda-auto-kvasiny-plant-3-2026",
    "/en/press-releases/newsletter-for-employees-and-residents-living-near-the-skoda-auto-vrchlabi-plant-3-2026",
    "/en/press-releases/preparations-begin-for-the-11th-skoda-student-car-celebrating-100-years-of-vocational-education",
    "/en/press-releases/simply-clever-for-summer-smart-skoda-features-that-make-every-trip-easier",
    "/en/press-releases/skoda-auto-appoints-world-renowned-road-cyclist-chris-froome-as-brand-cycling-ambassador",
    "/en/press-releases/skoda-auto-celebrates-33-years-as-official-main-sponsor-of-the-iihf-ice-hockey-world-championship-and-unveils-the-epiq",
    "/en/press-releases/skoda-auto-celebrates-successful-milan-design-week-with-strong-visitor-interest-and-fuorisalone-award-recognition-as-highest-rated-installation",
    "/en/press-releases/skoda-auto-ranks-as-europes-second-best-selling-car-brand-after-a-strong-first-quarter",
    "/en/press-releases/skoda-auto-supports-tour-de-france-femmes-avec-zwift-as-official-main-partner-for-the-fifth-year",
    "/en/press-releases/skoda-auto-supports-uci-mountain-bike-world-championshipsas-official-partner-for-second-year-running",
    "/en/press-releases/skoda-auto-teams-up-with-hasbros-play-doh-brand",
    "/en/press-releases/skoda-auto-unveils-updated-slavia-in-india",
    "/en/press-releases/skoda-epiq-sportline-debuts-at-the-paris-motor-show",
    "/en/press-releases/skoda-fabia-motorsport-edition-limited-edition-celebrates-the-125th-anniversary-of-skoda-motorsport",
    "/en/press-releases/skoda-kvasiny-newsletter-2-2026",
    "/en/press-releases/skoda-launches-production-of-the-new-epiq-in-pamplona-spain",
    "/en/press-releases/skoda-octavia-is-the-brands-first-model-with-a-full-hybrid-powertrain",
    "/en/press-releases/skoda-offers-a-first-glimpse-of-the-interior-concept-of-its-electric-seven-seater-peaq",
    "/en/press-releases/skoda-presents-exterior-sketches-of-its-all-new-electric-seven-seater-peaq",
    "/en/press-releases/skoda-presents-first-interior-sketches-and-announces-world-premiere-date-of-electric-epiq",
    "/en/press-releases/skoda-receives-red-dot-award-for-its-vision-app-concept",
    "/en/press-releases/skoda-vrchlabi-newsletter-2-2026",
    "/en/press-releases/tadej-pogacar-winner-of-the-113th-tour-de-france-receives-crystal-trophy-created-by-skoda-design",
    "/en/press-releases/world-premiere-of-the-all-new-skoda-epiq-pictures-on-the-skoda-storyboard",
    "/en/search",
    "/en/series-2",
    "/en/skoda-model/enyaq-iv-2/enyaq-coupe-iv",
    "/en/skoda-world/125-years-of-racing-history-in-one-place-come-visit-the-museum",
    "/en/skoda-world/get-your-car-ready-for-summer-with-skoda-accessories",
    "/en/skoda-world/king-of-space-and-long-distance-travel-skoda-superb-celebrates-25-years",
    "/en/skoda-world/octavia-arrives-with-a-new-full-hybrid-powertrain",
    "/en/skoda-world/peaq-inside-a-designblok",
    "/en/skoda-world/rally-champion-and-the-unique-skoda-fabia-motorsport-edition",
    "/en/skoda-world/skoda-classic-tour-through-the-eyes-of-a-spectator",
    "/en/skoda-world/what-was-racing-like-half-a-century-ago-skoda-120-s-rallye-delights-a-champion"
  ];
  var ALLOWED = new Set(DEMO_PATHS);
  var LIVE_ONLY = new Set(LIVE_ONLY_PATHS);
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
  var SCHEMELESS_SOURCE = /^(?:(?:https?:)?\/\/(?:www\.)?skoda-storyboard\.com\/(?:[^?#]*\/)?)?(?:www\.)?skoda-storyboard\.com(?=\/)/i;
  function schemelessSource(href) {
    const m = href.match(SCHEMELESS_SOURCE);
    return m ? `${SOURCE_ORIGIN}${href.slice(m[0].length)}` : href;
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
    if (LIVE_ONLY.has(target) && /[?&]filter(?:\[|%5B)(?!search(?:\]|%5D))/i.test(tail.split("#")[0])) {
      return null;
    }
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
  var RAIL_VIEWALL_KEYS = ["viewall", "view-all", "all"];
  function isRailViewAll(a) {
    const row = a.closest("tr");
    const table = row && row.closest("table");
    if (!table || row.cells.length < 2 || !RAIL_VIEWALL_KEYS.includes(row.cells[0].textContent.trim().toLowerCase())) return false;
    const head = table.rows[0] && table.rows[0].cells[0];
    return !!head && /^story rail\b/i.test(head.textContent.trim());
  }
  function transform6(hookName, element, payload) {
    if (hookName !== TransformHook5.afterTransform) return;
    element.querySelectorAll("a[href]").forEach((a) => {
      let href = a.getAttribute("href").replace(/(?:\s|%20)+$/i, "");
      if (/#s_[ac]id=/.test(href)) href = href.split("#s_aid=")[0].split("#s_cid=")[0];
      href = schemelessSource(href);
      if (href.startsWith("/direct-download/")) href = `${SOURCE_ORIGIN}${href}`;
      else href = !isRailViewAll(a) && tagPageHref(href) || rewriteHref(href) || href;
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
    const after2 = paragraph.cloneNode(false);
    after2.append(afterRange.extractContents());
    const beforeRange = document2.createRange();
    beforeRange.selectNodeContents(paragraph);
    beforeRange.setEndBefore(target);
    const before = paragraph.cloneNode(false);
    before.append(beforeRange.extractContents());
    const imageNode = imageContainer(img, document2, linkedImage ? link : null);
    const image = withCaption(imageNode, caption, document2);
    paragraph.replaceWith(...[before, image, after2].filter(hasContent));
  }
  var text4 = (value) => (value || "").replace(/\s+/g, " ").trim();
  function linkedImageAlt(img, root) {
    var _a;
    const link = img.closest("a");
    if (!link || link.querySelectorAll("img").length !== 1 || text4(link.textContent)) return "";
    const caption = editorialCaption(img) || editorialCaption(img.closest("[data-caption]"));
    const titled = [link.getAttribute("title"), img.getAttribute("title")].map(text4).find(Boolean);
    const heading = [...root.querySelectorAll("h1, h2, h3, h4, h5, h6")].filter(
      (h) => h.compareDocumentPosition(img) & 4
      /* Node.DOCUMENT_POSITION_FOLLOWING */
    ).map((h) => text4(h.textContent)).filter(Boolean).pop();
    return text4(caption) || titled || heading || text4((_a = root.ownerDocument.querySelector("h1")) == null ? void 0 : _a.textContent);
  }
  function normalizeImages(root, document2 = root.ownerDocument) {
    root.querySelectorAll("img").forEach((img) => {
      if (!img.hasAttribute("alt") || !img.getAttribute("alt").trim()) {
        const backfill = linkedImageAlt(img, root);
        if (backfill) {
          img.setAttribute("alt", backfill);
        } else {
          const type = img.hasAttribute("alt") ? "empty" : "missing";
          console.warn(`[image-import] ${type} alt: ${img.getAttribute("src") || "(no src)"}`);
        }
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
    description: "\u0160koda story detail (single-post + SiteOrigin), full-fidelity SiteOrigin flatten (SKODA-801). Hero banner + primary .content SiteOrigin widget tree flattened to default content + block tables (17-widget map, census-driven). The secondary .sidebar column is rebuilt as a Style:sidebar section (Newsletter Stub (card) + Cards + Tags) beside the body via the grid-on-main story layout. In-body galleries/embeds/Media Box remain SKODA-604 full-restore work. Metadata template=story. Content-driven detection only.",
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
     * widths of unequal 2-cell rows (SKODA-225, Columns (split-NN)), and the images the source
     * centres (`aligncenter`: Columns (centered), the body's `centered-images`). Also keeps the
     * source's glued non-breaking spaces (html2md would turn them into spaces).
     */
    preprocess: ({ document: document2 }) => {
      useLargestSources(document2);
      markHighlights(document2);
      markCellWidths(document2);
      markRowPadding(document2);
      markCentredImages(document2);
      markTextStyles(document2);
      markDropCap(document2);
      markMilestoneSpaces(document2.body);
      document2.querySelectorAll("article .entry-content, article .content").forEach((body) => {
        markFootnotes(body);
        markBoldHeadings(body);
      });
      transform7("preprocess", document2.body, { document: document2 });
      transform3("preprocess", document2.body, { document: document2 });
      document2.querySelectorAll(".search-results.media-box a.media-cart-action.download[href]").forEach((a) => {
        if (!(a.textContent || "").trim()) a.textContent = "Download";
      });
    },
    transform: (payload) => {
      const { document: document2, url, params } = payload;
      const main = document2.body;
      main.querySelectorAll(".textwidget .search-results.search-results-gallery").forEach((group) => {
        var _a;
        const anchor = document2.createComment("gallery");
        group.before(anchor);
        try {
          parse4(group, payload, { story: true });
          (_a = anchor.nextElementSibling) == null ? void 0 : _a.setAttribute("data-skoda-block", "");
        } catch (e) {
          console.error("Failed to parse a story gallery (.search-results-gallery):", e);
        }
        anchor.remove();
      });
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, {
              document: document2,
              url,
              params,
              dates: block.name === "downloads"
            });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      main.querySelectorAll("p[data-skoda-footnote]").forEach((p) => parse5(p, payload));
      main.querySelectorAll("[data-skoda-footnote]").forEach((p) => p.removeAttribute("data-skoda-footnote"));
      restoreBoldHeadings(main);
      applyCentredImages(main);
      applyDropCap(main);
      main.querySelectorAll("[data-skoda-block]").forEach((el) => el.removeAttribute("data-skoda-block"));
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
