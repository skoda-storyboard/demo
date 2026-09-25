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

  // tools/importer/parsers/tags.js
  function parse(element, { document: document2 }) {
    const anchors = Array.from(element.querySelectorAll("a.label[href], li a[href], a[href]")).filter((el, i, arr) => arr.indexOf(el) === i);
    if (anchors.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cell = [];
    anchors.forEach((a) => {
      const href = a.getAttribute("href");
      const text = (a.textContent || "").trim();
      if (!href || !text) return;
      const link = document2.createElement("a");
      link.setAttribute("href", href);
      link.textContent = text;
      cell.push(link);
    });
    if (cell.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const table = WebImporter.DOMUtils.createTable([["Tags"], [cell]], document2);
    element.replaceWith(table);
  }

  // tools/importer/parsers/story-hero.js
  function parse2(element, { document: document2 }) {
    const img = element.querySelector(".hero-image img, .hero-wrapper img, img");
    const heading = element.querySelector(".hero-heading h1, h1, .heading, h2");
    if (!img && !heading) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const out = [];
    const cells = [["Hero Image"]];
    if (img) cells.push([img]);
    if (heading) {
      const h1 = document2.createElement("h1");
      h1.textContent = (heading.textContent || "").trim();
      cells.push([h1]);
    }
    out.push(WebImporter.DOMUtils.createTable(cells, document2));
    const caption = element.querySelector(".hero-caption") || element;
    const perex = caption.querySelector(".perex");
    const perexText = perex && (perex.textContent || "").trim();
    if (perexText) {
      const p = document2.createElement("p");
      p.textContent = perexText;
      out.push(p);
    }
    const published = caption.querySelector(".published, time");
    const dateText = published && (published.textContent || "").trim();
    if (dateText) {
      const p = document2.createElement("p");
      p.textContent = dateText;
      out.push(p);
    }
    const category = caption.querySelector(".category");
    if (category && category.querySelector("a[href]")) {
      const holder = document2.createElement("div");
      holder.append(category);
      parse(category, { document: document2 });
      out.push(...holder.childNodes);
    }
    element.replaceWith(...out);
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
  function itemCaption(img, item) {
    var _a, _b;
    const capSource = img.getAttribute("data-caption") && img || ((_a = item.querySelector) == null ? void 0 : _a.call(item, "[data-caption]")) || item;
    return capSource.getAttribute && capSource.getAttribute("data-caption") || ((_b = item.querySelector) == null ? void 0 : _b.call(item, "a[title]")) && item.querySelector("a[title]").getAttribute("title") || img.getAttribute("alt") || "";
  }
  function galleryCells(panel, document2, blockName = "Gallery") {
    const imgs = [...panel.querySelectorAll("img")];
    if (!imgs.length) return null;
    const cells = [[blockName]];
    imgs.forEach((img) => {
      const item = img.closest(".search-results-item, .item, figure") || img;
      cells.push([img, itemCaption(img, item)]);
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
    const text = (panel.textContent || "").replace(/\s+/g, " ").trim();
    if (!text) return [];
    const bq = document2.createElement("blockquote");
    const p = document2.createElement("p");
    p.textContent = text;
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
      const text = (body.textContent || "").replace(/\s+/g, " ").trim();
      if (text) {
        const p = document2.createElement("p");
        p.textContent = text;
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
      const text = (panel.textContent || "").replace(/\s+/g, " ").trim();
      if (text && !panel.querySelector("img")) {
        const p = document2.createElement("p");
        p.textContent = text;
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
  function cellsOf(grid) {
    const direct = [...grid.children].flatMap((c) => {
      if (c.classList && c.classList.contains("panel-grid-cell")) return [c];
      return [...c.querySelectorAll(":scope > .panel-grid-cell")];
    });
    return direct;
  }
  function panelsOf(cell) {
    return [...cell.querySelectorAll(':scope > .so-panel, :scope > [class*="widget_"]')];
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
    cells.forEach((cell) => {
      const cellOut = [];
      panelsOf(cell).forEach((p) => emitWidget(p, document2, cellOut, stats));
      if (cellOut.length) row.push(cellOut);
    });
    if (row.length > 1) {
      out.push(WebImporter.DOMUtils.createTable([["Columns"], row], document2));
      stats.multiColumn += 1;
    } else if (row.length === 1) {
      row[0].forEach((n) => out.push(n));
    }
  }
  function parse3(element, { document: document2 }) {
    const layout = element.querySelector(".panel-layout, .panel-grid");
    if (!layout) return;
    const grids = [...element.querySelectorAll(".panel-grid")].filter((g) => !g.parentElement.closest(".so-panel"));
    const out = [];
    const stats = {
      grids: grids.length,
      byKind: {},
      deferred: [],
      unknown: [],
      multiColumn: 0
    };
    grids.forEach((grid) => {
      const cells = cellsOf(grid);
      const nonEmpty = cells.filter((c) => panelsOf(c).length > 0);
      if (nonEmpty.length > 1) {
        emitMultiColumn(nonEmpty, document2, out, stats);
      } else {
        cells.forEach((cell) => panelsOf(cell).forEach((p) => emitWidget(p, document2, out, stats)));
      }
    });
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
      deferred: stats.deferred,
      unknown: stats.unknown
    };
    if (stats.deferred.length || stats.unknown.length) {
      console.warn(`[story-flatten] deferred/unknown widgets: ${JSON.stringify(summary)}`);
    } else {
      console.log(`[story-flatten] flattened: ${JSON.stringify(summary)}`);
    }
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
  function transform2(hookName, element, payload) {
    if (hookName === TransformHook2.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        ".btn-group.social",
        ".social-container"
      ]);
      videosToUrls(element, element.ownerDocument || document);
    }
    if (hookName === TransformHook2.afterTransform) {
      relatedBand(element, element.ownerDocument || document, payload);
      const deferredSelectors = [
        ".search-results.media-box",
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
      const text = (a.textContent || "").trim();
      if (!href || !text) return;
      const link = document2.createElement("a");
      link.setAttribute("href", href);
      link.textContent = text;
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
    const template = overrides.template || extractTemplate(document2);
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
      const wrapperCaption = (wrapper == null ? void 0 : wrapper.querySelectorAll("img").length) === 1 ? wrapper.getAttribute("data-caption") : "";
      const caption = (img.getAttribute("data-caption") || wrapperCaption || "").trim();
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
    // SKODA-816: story hero → Hero Image (story variant) + caption + Tags, not the
    // overlay Hero banner used by the page/archive templates.
    "story-hero": parse2,
    "story-flatten": parse3
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
      { name: "story-flatten", instances: [".columns > .content", "article .content", ".entry-content"] }
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
    transform3
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
