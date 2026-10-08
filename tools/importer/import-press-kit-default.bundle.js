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

  // tools/importer/import-press-kit-default.js
  var import_press_kit_default_exports = {};
  __export(import_press_kit_default_exports, {
    default: () => import_press_kit_default_default
  });

  // tools/importer/parsers/gallery.js
  function parse(element, { document }) {
    let items = Array.from(element.querySelectorAll("article.gallery-item"));
    if (items.length === 0) items = Array.from(element.querySelectorAll(".items > .item"));
    if (items.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [["Gallery"]];
    let emitted = 0;
    items.forEach((item) => {
      const img = item.querySelector("img");
      if (!img) return;
      const captionEl = item.querySelector("[data-caption]");
      const caption = captionEl && captionEl.getAttribute("data-caption") || item.querySelector("a[title]") && item.querySelector("a[title]").getAttribute("title") || img.getAttribute("alt") || "";
      cells.push([img, caption]);
      emitted += 1;
    });
    if (emitted === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const table = WebImporter.DOMUtils.createTable(cells, document);
    element.replaceWith(table);
  }

  // tools/importer/parsers/tags.js
  function parse2(element, { document }) {
    const anchors = Array.from(element.querySelectorAll("a.label[href], li a[href], a[href]")).filter((el, i, arr) => arr.indexOf(el) === i).filter((a) => !a.matches(".show-hidden-terms") && a.getAttribute("href") !== "#");
    if (anchors.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cell = [];
    anchors.forEach((a) => {
      const href = a.getAttribute("href");
      const text6 = (a.textContent || "").trim();
      if (!href || !text6) return;
      const link = document.createElement("a");
      link.setAttribute("href", href);
      link.textContent = text6;
      cell.push(link);
    });
    if (cell.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const table = WebImporter.DOMUtils.createTable([["Tags"], [cell]], document);
    element.replaceWith(table);
  }

  // tools/importer/parsers/press-kit-hub-tiles.js
  var ratioOf = (tile) => {
    var _a, _b;
    return (_b = (_a = tile.querySelector(".ratio-container")) == null ? void 0 : _a.className.match(/\bratio-(\d+x\d+)\b/)) == null ? void 0 : _b[1];
  };
  function rowTokens(tiles, rowIndex) {
    const ratios = tiles.map(ratioOf);
    const wide = ratios.filter((ratio) => ratio === "2x1").length;
    const square = ratios.filter((ratio) => ratio === "1x1").length;
    if (tiles.length === 1 && ["2x1", "4x1"].includes(ratios[0])) return ["press-half end"];
    if (wide === 2 && square === 1 && tiles.length === 3) {
      return ratios.map((ratio) => ratio === "2x1" ? "feature" : "press-square");
    }
    if (wide === 2 && tiles.length === 2 || wide === 1 && square === 2 && tiles.length === 3) {
      return ratios.map((ratio) => ratio === "2x1" ? "press-half" : "press-quarter");
    }
    if (square === tiles.length && tiles.length === 5) return Array(5).fill("press-square");
    if (square === tiles.length) {
      return tiles.map((tile, index) => index === tiles.length - 1 && tiles.length % 4 ? "press-quarter end" : "press-quarter");
    }
    throw new Error(`Press-kit tile row ${rowIndex + 1} has an unsupported layout`);
  }
  function parseTiles(content, document) {
    const sourceRows = [...content.querySelectorAll(".panel-grid")].filter((grid) => !grid.parentElement.closest(".panel-grid")).map((grid) => [...grid.querySelectorAll("article.article-teaser")]).filter((tiles) => tiles.length);
    if (!sourceRows.length) throw new Error("Press-kit hub has no chapter tiles");
    const rows = [["Cards (overlay, tiles)"]];
    sourceRows.forEach((tiles, rowIndex) => {
      const tokens = rowTokens(tiles, rowIndex);
      tiles.forEach((tile, index) => {
        const sourceLink = tile.querySelector(":scope > a[href]");
        const sourceImage = tile.querySelector(".ratio-container img[src]");
        const heading = tile.querySelector(".heading");
        if (!sourceLink || !sourceImage || !(heading == null ? void 0 : heading.textContent.trim())) {
          throw new Error(`Press-kit tile ${rows.length} needs a link, image and title`);
        }
        const title = heading.textContent.replace(/\s+/g, " ").trim();
        const img = sourceImage.cloneNode(true);
        img.setAttribute("alt", title);
        img.removeAttribute("srcset");
        img.removeAttribute("sizes");
        const link = document.createElement("a");
        link.href = sourceLink.href;
        link.textContent = title;
        rows.push([tokens[index], img, link]);
      });
    });
    return WebImporter.DOMUtils.createTable(rows, document);
  }

  // tools/importer/parsers/press-kit-content.js
  var text = (node) => ((node == null ? void 0 : node.textContent) || "").replace(/\s+/g, " ").trim();
  var boldCaption = (node) => (node == null ? void 0 : node.matches("p")) && !!text(node) && text(node) === [...node.querySelectorAll("strong, b")].map(text).join(" ").trim();
  function clipTitle(document, file, attachment) {
    const before = attachment.previousElementSibling;
    if (boldCaption(before)) return text(before);
    let node = before;
    while (node && !node.matches("h1, h2, h3, h4, h5, h6, .media-cart-item")) node = node.previousElementSibling;
    if (node && !node.matches(".media-cart-item") && text(node)) return text(node);
    const item = [...document.querySelectorAll(".search-results-item")].find((el) => [...el.querySelectorAll("a[href]")].some((a) => a.getAttribute("href") === file));
    return text(item == null ? void 0 : item.querySelector(".entry-title"));
  }
  function videoEmbed(document, file, attachment) {
    const title = clipTitle(document, file, attachment);
    const link = Object.assign(document.createElement("a"), { href: file, textContent: title || "Video" });
    const rows = [["Embed"], ["url", link]];
    if (title) rows.push(["title", title]);
    return WebImporter.DOMUtils.createTable(rows, document);
  }
  function embedUrls(root, document, { nested = false } = {}) {
    root.querySelectorAll("iframe").forEach((frame) => {
      const url = frame.getAttribute("src") || frame.getAttribute("data-src");
      if (!url || !/^https?:\/\//.test(url)) {
        throw new Error("Press-kit article contains an iframe without a provider URL");
      }
      const p = document.createElement("p");
      const a = document.createElement("a");
      a.href = url;
      a.textContent = url;
      p.append(a);
      const attachment = frame.closest(".media-cart-item.attachment");
      const video = frame.closest(".video-container");
      const bare = attachment == null ? void 0 : attachment.cloneNode(true);
      bare == null ? void 0 : bare.querySelectorAll(".media-cart-actions").forEach((actions) => actions.remove());
      if (attachment && root.contains(attachment) && !text(bare) && attachment.querySelectorAll("iframe").length === 1 && !attachment.querySelector("img, video")) {
        const file = [...attachment.querySelectorAll('a.media-cart-action.download[href], a[data-action="download"][href]')].map((link) => link.getAttribute("href")).find((href) => /\.mp4(?:[?#]|$)/i.test(href || ""));
        const locked = /(^|\.)vimeo\.com$/i.test(new URL(url).hostname);
        const out = [file && locked && !nested ? videoEmbed(document, file, attachment) : p];
        if (file) {
          const dp = document.createElement("p");
          const link = document.createElement("a");
          link.href = file;
          link.textContent = "Download video";
          dp.append(link);
          out.push(dp);
        }
        attachment.replaceWith(...out);
      } else if (video && root.contains(video) && !text(video) && video.querySelectorAll("iframe").length === 1) {
        video.replaceWith(p);
      } else {
        frame.replaceWith(p);
      }
    });
  }
  function inlineGalleries(root, document) {
    root.querySelectorAll(".sb-gallery").forEach((gallery) => {
      var _a;
      const img = gallery.querySelector(".sb-gallery-image-main img") || gallery.querySelector("img");
      if (!img) throw new Error("Press-kit in-body gallery has no image");
      const nodes = [];
      const figure = document.createElement("p");
      const caption = (_a = img.getAttribute("data-caption")) == null ? void 0 : _a.trim();
      ["data-caption", "data-video_title", "data-video_src", "srcset", "sizes", "itemprop"].forEach((attr) => img.removeAttribute(attr));
      figure.append(img);
      nodes.push(figure);
      if (caption) nodes.push(Object.assign(document.createElement("p"), { textContent: caption }));
      const more = text(gallery.querySelector(".sb-gallery-show-more"));
      if (more && document.querySelector(".search-results.media-box")) {
        const p = document.createElement("p");
        p.append(Object.assign(document.createElement("a"), { href: "#media-box", textContent: `+${more}` }));
        nodes.push(p);
      }
      gallery.replaceWith(...nodes);
    });
  }
  var FLOAT_ICON_MAX_WIDTH = 60;
  function floatCallouts(widget, document) {
    widget.querySelectorAll(":scope > p > img[width]").forEach((img) => {
      const width = Number(img.getAttribute("width"));
      if (!(width > 0 && width <= FLOAT_ICON_MAX_WIDTH) || !/float:\s*left/i.test(img.getAttribute("style") || "")) return;
      const p = img.parentElement;
      const rest = [...p.childNodes].filter((node) => node !== img && (node.nodeType === 1 || text(node)));
      let body = rest;
      if (!rest.length) {
        const next = p.nextElementSibling;
        if (!next || !text(next) || next.querySelector("img")) return;
        body = [...next.childNodes];
        next.remove();
      }
      img.setAttribute("alt", "");
      ["style", "class", "loading", "decoding"].forEach((attr) => img.removeAttribute(attr));
      const icon = document.createElement("p");
      icon.append(img);
      const copy = document.createElement("p");
      copy.append(...body);
      p.replaceWith(WebImporter.DOMUtils.createTable([["Columns (callout)"], [[icon], [copy]]], document));
    });
  }
  function contents(panel, document, { nested: inBlock = false } = {}) {
    var _a;
    const nested = panel.querySelector(":scope > .panel-widget-style .panel-layout, :scope > .panel-layout, .panel-layout");
    if (nested) return flatten(nested, document, { nested: true });
    const widgets = panel.querySelectorAll(".textwidget");
    if (widgets.length) {
      return [...widgets].flatMap((widget) => {
        var _a2;
        const title = text((_a2 = widget.parentElement) == null ? void 0 : _a2.querySelector(":scope > .widget-title"));
        const heading = title ? [Object.assign(document.createElement("h2"), { textContent: title })] : [];
        embedUrls(widget, document, { nested: inBlock });
        inlineGalleries(widget, document);
        if (!inBlock) floatCallouts(widget, document);
        widget.querySelectorAll("hr").forEach((rule) => rule.remove());
        const items = widget.childNodes;
        return [...heading, ...[...items].filter((node) => node.nodeType === 1 || text(node))];
      });
    }
    if (panel.matches(".widget_media_video")) {
      const holder = (_a = panel.querySelector(".media-cart-item.attachment")) == null ? void 0 : _a.parentElement;
      if (!holder || panel.querySelectorAll("iframe").length !== 1) {
        throw new Error("Press-kit video widget needs one cart attachment with a player");
      }
      embedUrls(holder, document, { nested: inBlock });
      return [...holder.children];
    }
    if (!text(panel) && !panel.querySelector("img, a[href]")) return [];
    throw new Error(`Unsupported press-kit content widget: ${panel.className}`);
  }
  var BANNER_MAX_WIDTH = 400;
  function bannerCell(nodes) {
    var _a, _b, _c;
    if (nodes.length !== 1 || text(nodes[0])) return false;
    const imgs = ((_b = (_a = nodes[0]).querySelectorAll) == null ? void 0 : _b.call(_a, "img")) || [];
    const width = Number((_c = imgs[0]) == null ? void 0 : _c.getAttribute("width"));
    return imgs.length === 1 && !!imgs[0].closest("a[href]") && width > 0 && width <= BANNER_MAX_WIDTH;
  }
  var hasContent = (cell) => text(cell) || cell.querySelector("img, iframe, a[href]");
  function columnsRow(cells, document) {
    const row = cells.map((cell) => [...cell.children].filter((node) => node.matches(".so-panel")).flatMap((panel) => contents(panel, document, { nested: true })));
    const name = row.every(bannerCell) ? "Columns (banners)" : "Columns";
    return WebImporter.DOMUtils.createTable([[name], row], document);
  }
  function flatten(layout, document, { nested = false, faq = false } = {}) {
    const output = [];
    let rows = [];
    let tileGrids = [];
    const name = faq && !nested ? "Accordion (faq)" : "Accordion";
    const flush = () => {
      if (rows.length) output.push(WebImporter.DOMUtils.createTable([[name], ...rows], document));
      rows = [];
    };
    const flushTiles = () => {
      if (!tileGrids.length) return;
      const holder = document.createElement("div");
      holder.append(...tileGrids);
      output.push(parseTiles(holder, document));
      tileGrids = [];
    };
    [...layout.children].forEach((grid) => {
      if (!grid.matches(".panel-grid")) {
        if (text(grid) || grid.querySelector("img, a[href]")) throw new Error("Unexpected press-kit article grid");
        return;
      }
      const gridPanels = [...grid.querySelectorAll(":scope > .panel-grid-cell > .so-panel")];
      if (!nested && gridPanels.some((panel) => panel.matches(".widget_ys-so-widget-post-teaser")) && gridPanels.every((panel) => panel.matches(".widget_ys-so-widget-post-teaser, .widget_skoda-offset"))) {
        flush();
        tileGrids.push(grid);
        return;
      }
      flushTiles();
      const filled = [...grid.children].filter((cell) => cell.matches(".panel-grid-cell") && hasContent(cell));
      if (!nested && filled.length > 1 && !grid.querySelector(".widget_ys-row-toggle, .widget_siteorigin-panels-builder")) {
        flush();
        output.push(columnsRow(filled, document));
        return;
      }
      [...grid.children].forEach((cell) => {
        if (!cell.matches(".panel-grid-cell")) return;
        const panels = [...cell.children].filter((node) => node.matches(".so-panel"));
        panels.forEach((panel, index) => {
          var _a;
          if (panel.matches(".widget_ys-row-toggle")) {
            const heading = panel.querySelector("h1.row-title, h2.row-title, h3.row-title, h4.row-title");
            const answer = panels[index + 1];
            if (!heading || !text(heading) || !(answer == null ? void 0 : answer.matches(".widget_siteorigin-panels-builder"))) {
              throw new Error("Press-kit row toggle requires a heading and immediately paired answer");
            }
            const body = contents(answer, document);
            if (!body.length || !body.some((node) => {
              var _a2;
              return text(node) || ((_a2 = node.querySelector) == null ? void 0 : _a2.call(node, "img, a[href]"));
            })) {
              throw new Error(`Press-kit row toggle has an empty answer: ${text(heading)}`);
            }
            rows.push([heading.cloneNode(true), body]);
            return;
          }
          if (panel.matches(".widget_siteorigin-panels-builder")) {
            if (!((_a = panels[index - 1]) == null ? void 0 : _a.matches(".widget_ys-row-toggle"))) {
              throw new Error("Unpaired press-kit answer panel");
            }
            return;
          }
          flush();
          output.push(...contents(panel, document, { nested }));
        });
      });
    });
    flush();
    flushTiles();
    return output;
  }
  function parse3(element, { document, faq = false }) {
    const layout = element.querySelector(":scope > .panel-layout");
    if (!layout) throw new Error("Press-kit article is missing SiteOrigin body content");
    const nodes = flatten(layout, document, { faq });
    if (!nodes.length) throw new Error("Press-kit article body is empty");
    layout.replaceWith(...nodes);
    element.querySelectorAll(".sa-bnr, .media-cart-actions").forEach((node) => node.remove());
  }

  // tools/importer/parsers/press-kit-media.js
  var text2 = (node) => ((node == null ? void 0 : node.textContent) || "").replace(/\s+/g, " ").trim();
  function downloads(item, document) {
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
      const link = document.createElement("a");
      link.href = href;
      link.textContent = label;
      return [link];
    });
  }
  function parse4(element, { document }) {
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
      const links = downloads(item, document);
      if (!links.length) throw new Error(`Press-kit asset has no download URL: ${text2(item.querySelector(".entry-title"))}`);
      const img = item.querySelector(".article-teaser-media img");
      const title = text2(item.querySelector(".entry-title")) || (img == null ? void 0 : img.getAttribute("alt")) || "";
      if (!title) throw new Error("Press-kit Media Box asset has no title");
      const paragraphs2 = links.map((link) => {
        const p = document.createElement("p");
        p.append(link);
        return p;
      });
      if (!img) {
        rows.push(["", title, paragraphs2]);
        return;
      }
      if (!((_a = img.getAttribute("alt")) == null ? void 0 : _a.trim())) img.alt = ((_b = img.getAttribute("title")) == null ? void 0 : _b.replace(/^Video\s*\|\s*/i, "")) || title;
      const src = img.getAttribute("src") || "";
      if (/^https:\/\/i\.vimeocdn\.com\//.test(src)) {
        img.src = src.replace(/-d_\d+x\d+(\.[a-z]+)?(\?.*)?$/i, "-d_1280x720.jpg");
      }
      ["data-caption", "data-video_title", "data-video_src", "srcset", "sizes", "itemprop", "title"].forEach((attr) => img.removeAttribute(attr));
      rows.push([img, title, paragraphs2]);
    });
    const config = element.matches(".search-results-gallery") ? [["collapse", "auto"]] : [];
    element.replaceWith(WebImporter.DOMUtils.createTable([["Downloads"], ...config, ...rows], document));
  }

  // tools/importer/parsers/quote.js
  var QUOTE = "data-skoda-quote";
  var BY = "data-skoda-quote-by";
  var text3 = (node) => ((node == null ? void 0 : node.textContent) || "").replace(/\s+/g, " ").trim();
  var centred = (p) => /text-align:\s*center/i.test(p.getAttribute("style") || "") || p.classList.contains("has-text-align-center");
  function isQuote(p) {
    if (!(p == null ? void 0 : p.matches("p")) || !centred(p)) return false;
    const nodes = [...p.childNodes].filter((n) => n.nodeType === 1 || text3(n));
    return nodes.some((n) => {
      var _a;
      return ((_a = n.matches) == null ? void 0 : _a.call(n, "em, i")) && text3(n);
    }) && nodes.every((n) => n.nodeType === 1 && n.matches("em, i, br"));
  }
  function isAttribution(p) {
    return !!(p == null ? void 0 : p.matches("p")) && centred(p) && !!p.querySelector("strong, b") && !isQuote(p);
  }
  function markRun(hr) {
    if (hr.closest("figure blockquote")) return false;
    const quote = hr.previousElementSibling;
    if (!isQuote(quote)) return false;
    quote.setAttribute(QUOTE, "");
    const by = hr.nextElementSibling;
    if (isAttribution(by)) by.setAttribute(BY, "");
    hr.remove();
    return true;
  }
  function markQuotes(root) {
    return [...root.querySelectorAll("hr")].filter(markRun).length;
  }
  function quoteParagraph(quote, document) {
    const p = document.createElement("p");
    [...quote.childNodes].forEach((node) => {
      if (node.nodeType === 1 && node.matches("em, i")) p.append(...node.childNodes);
    });
    const edge3 = (n) => n && (n.nodeType === 1 && n.matches("br") || n.nodeType === 3 && !text3(n));
    while (edge3(p.lastChild)) p.lastChild.remove();
    while (edge3(p.firstChild)) p.firstChild.remove();
    return p;
  }
  function attributionParagraph(by, document) {
    var _a;
    const p = document.createElement("p");
    p.append(...by.childNodes);
    const first = (_a = p.querySelector("strong, b")) == null ? void 0 : _a.firstChild;
    if ((first == null ? void 0 : first.nodeType) === 3) first.textContent = first.textContent.replace(/^\s+/, "");
    return p;
  }
  var LEFT = "Quote (left)";
  var MEDIA = "img, picture, video, audio, iframe, svg, object, embed, canvas";
  var BLOCK = "address, article, aside, blockquote, details, div, dl, fieldset, figure, form, h1, h2, h3, h4, h5, h6, hr, ol, pre, section, table, ul";
  var is = (node, selector) => (node == null ? void 0 : node.nodeType) === 1 && node.matches(selector);
  function isFigureQuote(node) {
    const quoteEl = is(node, "figure") ? node.querySelector(":scope > blockquote") : null;
    return !!quoteEl && !node.querySelector(MEDIA) && [...quoteEl.childNodes].some((n) => !is(n, "cite") && text3(n));
  }
  var edge = (n) => is(n, "br") || (n == null ? void 0 : n.nodeType) === 3 && !text3(n);
  var trim = (node, re) => {
    if ((node == null ? void 0 : node.nodeType) === 3) node.textContent = node.textContent.replace(re, "");
  };
  function plainParagraph(nodes, document) {
    const p = document.createElement("p");
    p.append(...nodes.map((node) => node.cloneNode(true)));
    p.querySelectorAll("em, i").forEach((it) => it.replaceWith(...it.childNodes));
    while (edge(p.lastChild)) p.lastChild.remove();
    while (edge(p.firstChild)) p.firstChild.remove();
    const inner = (n, side) => is(n, "strong, b") ? n[side] : n;
    trim(inner(p.lastChild, "lastChild"), /\s+$/);
    trim(inner(p.firstChild, "firstChild"), /^\s+/);
    return p;
  }
  function paragraphs(nodes, document) {
    const cell = [];
    let run = [];
    const flush = () => {
      if (run.length) cell.push(plainParagraph(run, document));
      run = [];
    };
    nodes.forEach((node) => {
      if (is(node, "p")) {
        flush();
        cell.push(...paragraphs([...node.childNodes], document));
      } else if (is(node, BLOCK)) {
        flush();
        const copy = node.cloneNode(true);
        copy.querySelectorAll("em, i").forEach((it) => it.replaceWith(...it.childNodes));
        cell.push(copy);
      } else {
        run.push(node);
      }
    });
    flush();
    return cell.filter((el) => text3(el));
  }
  function figureRow(figure, document) {
    const nodes = [...figure.childNodes].filter((node) => !is(node, "figcaption"));
    const cites = nodes.filter((node) => is(node, "blockquote")).flatMap((quoteEl) => [...quoteEl.querySelectorAll(":scope > cite")]);
    const quote = nodes.flatMap((node) => paragraphs(is(node, "blockquote") ? [...node.childNodes].filter((child) => !cites.includes(child)) : [node], document));
    const cited = cites.flatMap((cite) => paragraphs([...cite.childNodes], document));
    let by = [...figure.querySelectorAll(":scope > figcaption")].flatMap((caption) => paragraphs([...caption.childNodes], document));
    if (by.length) quote.push(...cited);
    else by = cited;
    if (!by.length) return [quote, ""];
    if (!by.some((el) => el.querySelector("strong, b")) && is(by[0], "p")) {
      const strong = document.createElement("strong");
      strong.append(...by[0].childNodes);
      by[0].append(strong);
    }
    return [quote, by];
  }
  var isLeftTable = (node) => is(node, "table") && text3(node.querySelector("th, td")) === LEFT;
  function leftTableBefore(figure) {
    let node = figure.previousSibling;
    while ((node == null ? void 0 : node.nodeType) === 3 && !text3(node)) node = node.previousSibling;
    return isLeftTable(node) ? node : null;
  }
  function parseFigure(figure, { document }) {
    if (!isFigureQuote(figure)) return;
    const table = WebImporter.DOMUtils.createTable([[LEFT], figureRow(figure, document)], document);
    const prev = leftTableBefore(figure);
    if (prev) {
      const row = [...table.rows].pop();
      [...prev.rows].pop().after(row);
      figure.remove();
      return;
    }
    figure.replaceWith(table);
  }
  function parse5(element, { document }) {
    var _a;
    if (!element.hasAttribute(QUOTE)) {
      const hr = element.nextElementSibling;
      if (!(hr == null ? void 0 : hr.matches("hr")) || !markRun(hr)) return;
    }
    const by = ((_a = element.nextElementSibling) == null ? void 0 : _a.hasAttribute(BY)) ? element.nextElementSibling : null;
    const cells = [quoteParagraph(element, document), by ? attributionParagraph(by, document) : ""];
    by == null ? void 0 : by.remove();
    element.replaceWith(WebImporter.DOMUtils.createTable([["Quote"], cells], document));
  }

  // tools/importer/parsers/footnotes.js
  var MARK = "data-skoda-footnote";
  var NAME = "Footnotes";
  var BODY_PX = 16;
  var MEDIA2 = "img, picture, video, audio, iframe, svg, object, embed, canvas";
  var text4 = (node) => ((node == null ? void 0 : node.textContent) || "").replace(/\s+/g, " ").trim();
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
    if (!((_a = p == null ? void 0 : p.matches) == null ? void 0 : _a.call(p, "p")) || fontPx(p) !== null || !text4(p) || p.querySelector(MEDIA2)) return false;
    const walker = p.ownerDocument.createTreeWalker(
      p,
      4
      /* NodeFilter.SHOW_TEXT */
    );
    let small = false;
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (text4(node)) {
        let el = node.parentElement;
        let marker2 = false;
        while (el !== p && fontPx(el) === null) {
          if (el.matches("sup")) marker2 = true;
          el = el.parentElement;
        }
        if (el !== p) {
          if (!isSmall(fontPx(el))) return false;
          small = true;
        } else if (!marker2) {
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
  var edge2 = (n) => n && (n.nodeType === 1 && n.matches("br") || n.nodeType === 3 && !text4(n));
  function footnoteParagraph(p, document) {
    var _a, _b;
    const copy = document.createElement("p");
    copy.append(...[...p.childNodes].map((node) => node.cloneNode(true)));
    copy.querySelectorAll("span").forEach((span) => span.replaceWith(...span.childNodes));
    copy.querySelectorAll("[style]").forEach((el) => el.removeAttribute("style"));
    while (edge2(copy.lastChild)) copy.lastChild.remove();
    while (edge2(copy.firstChild)) copy.firstChild.remove();
    if (((_a = copy.lastChild) == null ? void 0 : _a.nodeType) === 3) copy.lastChild.textContent = copy.lastChild.textContent.replace(/\s+$/, "");
    if (((_b = copy.firstChild) == null ? void 0 : _b.nodeType) === 3) copy.firstChild.textContent = copy.firstChild.textContent.replace(/^\s+/, "");
    return copy;
  }
  function tableBefore(p) {
    let node = p.previousSibling;
    while ((node == null ? void 0 : node.nodeType) === 3 && !text4(node)) node = node.previousSibling;
    return (node == null ? void 0 : node.nodeType) === 1 && node.matches("table") && text4(node.querySelector("th, td")) === NAME ? node : null;
  }
  function parse6(p, { document }) {
    p.removeAttribute(MARK);
    if (p.closest("table, li, blockquote, figure") || !text4(p)) return;
    const row = [footnoteParagraph(p, document)];
    const table = WebImporter.DOMUtils.createTable([[NAME], row], document);
    const prev = tableBefore(p);
    if (prev) {
      [...prev.rows].pop().after([...table.rows].pop());
      p.remove();
      return;
    }
    p.replaceWith(table);
  }

  // tools/importer/transformers/skoda-press-kit-default-layout.js
  var text5 = (node) => ((node == null ? void 0 : node.textContent) || "").replace(/\s+/g, " ").trim();
  var marker = (document, style) => {
    const hr = document.createElement("hr");
    hr.dataset.pressKitSection = style;
    return hr;
  };
  var make = (document, tag, value) => {
    const node = document.createElement(tag);
    node.textContent = value;
    return node;
  };
  function chapters(document) {
    const source = document.querySelector(".chapter-nav");
    if (!source) return null;
    const links = [
      source.querySelector(".chapter-nav-header .link-intro[href]"),
      ...source.querySelectorAll(".chapter-nav-body a[href]")
    ].filter((a) => a && a.getAttribute("href") !== "#");
    if (!links.length) throw new Error("Press-kit Chapters navigation has no destinations");
    const list = document.createElement("ul");
    list.id = "chapters-links";
    const chaptersLink = document.createElement("a");
    chaptersLink.href = "#chapters-links";
    chaptersLink.textContent = text5(source.querySelector(".link-chapters")) || "Chapters";
    const chaptersItem = document.createElement("li");
    chaptersItem.append(chaptersLink);
    list.append(chaptersItem);
    links.forEach((sourceLink) => {
      var _a;
      const link = document.createElement("a");
      link.href = sourceLink.getAttribute("href");
      link.textContent = sourceLink.matches(".link-intro") && ((_a = sourceLink.getAttribute("title")) == null ? void 0 : _a.trim()) || text5(sourceLink);
      const li = document.createElement("li");
      li.append(link);
      list.append(li);
    });
    return list;
  }
  function sidebar(document, secondary, mediaBox) {
    if (!secondary) return [];
    const nodes = [];
    [...secondary.querySelectorAll(":scope > section")].forEach((section) => {
      if (section.matches(".newsletter-subscribe-widget, .side-banner")) return;
      const heading = section.querySelector("h2, h3");
      const label = text5(heading);
      if (section.matches(".images.sa-media-kit-preview")) {
        if (heading) heading.remove();
        nodes.push(make(document, "h3", label || "Images"), section);
        const more = section.querySelector("a.more");
        if (mediaBox && more && text5(more)) {
          const link = document.createElement("a");
          link.href = "#media-box";
          link.textContent = text5(more);
          const p = document.createElement("p");
          p.append(link);
          nodes.push(p);
        }
      } else if (section.matches(".tags")) {
        if (heading) heading.remove();
        nodes.push(make(document, "h3", label || "Tags"), section);
      } else if (section.querySelector("ul.menu")) {
        const ul = document.createElement("ul");
        section.querySelectorAll("ul.menu > li").forEach((li) => {
          const a = li.querySelector('a[href]:not([href="#"])');
          const title = text5(a) || text5(li);
          if (!title || !a && !mediaBox) return;
          const link = document.createElement("a");
          link.href = (a == null ? void 0 : a.getAttribute("href")) || "#media-box";
          link.textContent = title;
          const entry = document.createElement("li");
          entry.append(link);
          ul.append(entry);
        });
        if (ul.children.length) nodes.push(make(document, "h3", label || "Additional info"), ul);
      }
    });
    return nodes;
  }
  var ICON_MAX_WIDTH = 60;
  function iconCallout(table, document) {
    var _a;
    const rows = [...table.rows];
    const cells = rows.length === 1 ? [...rows[0].cells] : [];
    if (cells.length !== 2 || text5(cells[0])) return null;
    const imgs = cells[0].querySelectorAll("img");
    const width = Number((_a = imgs[0]) == null ? void 0 : _a.getAttribute("width"));
    if (imgs.length !== 1 || !(width > 0 && width <= ICON_MAX_WIDTH) || !text5(cells[1])) return null;
    const icon = make(document, "p", "");
    icon.append(cells[0].querySelector("a:has(img)") || imgs[0]);
    const body = make(document, "p", "");
    body.append(...cells[1].childNodes);
    return WebImporter.DOMUtils.createTable([["Columns (callout)"], [[icon], [body]]], document);
  }
  function layoutTable(table, document) {
    const callout = iconCallout(table, document);
    if (callout) return [callout];
    table.querySelectorAll('img[src*="whatsapp"]').forEach((img) => {
      const link = img.closest("a");
      (link && !text5(link) ? link : img).remove();
    });
    return [...table.querySelectorAll("td, th")].flatMap((cell) => {
      if (!text5(cell) && !cell.querySelector("img, a[href]")) return [];
      if (cell.querySelector("p, ul, ol, h1, h2, h3, h4, h5, h6, div")) return [...cell.childNodes];
      const p = document.createElement("p");
      p.append(...cell.childNodes);
      return [p];
    });
  }
  function sourceTables(content, document) {
    content.querySelectorAll("table").forEach((table) => {
      const rows = [...table.rows].filter((row) => text5(row) || row.querySelector("a[href], img"));
      if (!rows.length) {
        table.remove();
        return;
      }
      const cols = Math.max(...rows.map((row) => row.cells.length));
      const labelled = rows.filter((row) => [...row.cells].filter((cell) => text5(cell)).length >= 2);
      if (cols > 1 && labelled.length < 2) {
        table.replaceWith(...layoutTable(table, document));
        return;
      }
      const out = [];
      if (cols === 1) {
        const [first, ...rest] = rows;
        const headed = !first.querySelector("a[href], img") && rest.length;
        if (headed) out.push(make(document, "h3", text5(first)));
        const list = document.createElement("ul");
        (headed ? rest : rows).forEach((row) => {
          const li = document.createElement("li");
          li.append(...row.cells[0].childNodes);
          list.append(li);
        });
        out.push(list);
      } else {
        const [head, ...body] = rows;
        const labels = [...head.cells].map((cell) => text5(cell));
        const list = document.createElement("ul");
        body.forEach((row) => {
          const cells = [...row.cells];
          const li = document.createElement("li");
          const strong = make(document, "strong", text5(cells[0]));
          const values = cells.slice(1).map((cell, i) => [labels[i + 1], text5(cell)].filter(Boolean).join(": "));
          li.append(strong, `: ${values.join(" \xB7 ")}`);
          list.append(li);
        });
        if (labels[0]) out.push(make(document, "p", labels[0]));
        out.push(list);
      }
      table.replaceWith(...out);
    });
  }
  function rebuild(element, document) {
    if (!/\bpress_kit-template-default\b/.test(document.body.className)) {
      throw new Error("Not a default press-kit article (body class missing)");
    }
    const article = [...element.querySelectorAll("article.press_kit")].find((node) => node.querySelector(".column-primary"));
    if (!article) throw new Error("Default press-kit article has no primary column");
    const h1 = article.querySelector(".container > header h1");
    const content = article.querySelector(".column-primary .entry-content");
    const media = article.querySelector(".search-results.media-box");
    if (!h1 || !text5(h1) || !(content == null ? void 0 : content.querySelector(":scope > .panel-layout"))) {
      throw new Error("Default press-kit article requires a title and body");
    }
    sourceTables(content, document);
    const out = [];
    const date = text5(article.querySelector(".container > header .entry-published"));
    if (date) out.push(make(document, "p", date));
    const title = h1.cloneNode(true);
    title.querySelectorAll("br").forEach((br) => br.replaceWith(" "));
    out.push(title);
    const chapterLinks = chapters(document);
    if (chapterLinks) out.push(marker(document, "press-kit-chapters"), chapterLinks);
    out.push(marker(document, "body-column"));
    const lead = article.querySelector(".column-primary .article-teaser-media img");
    if (lead) {
      const img = lead.cloneNode(true);
      img.alt = (img.alt || "").replace(/<br\s*\/?>/gi, " ");
      ["data-caption", "data-video_title", "data-video_src", "srcset", "sizes", "itemprop"].forEach((attr) => img.removeAttribute(attr));
      const p = document.createElement("p");
      p.append(img);
      out.push(p);
    }
    const summary = text5(article.querySelector(".column-primary > .entry-summary"));
    if (summary) {
      const intro = make(document, "p", "");
      intro.append(make(document, "strong", summary));
      out.push(intro);
    }
    out.push(content);
    const side = sidebar(document, article.querySelector(".column-secondary"), !!media);
    if (side.length) out.push(marker(document, "sidebar"), ...side);
    if (media) {
      const heading = text5(media.querySelector(".search-results-heading")) || "Media Box";
      const stats = text5(media.querySelector(".search-results-stats .stats"));
      const totals = [...stats.matchAll(/\b(\d+)\s+(?:images?|videos?|PDFs?)\b/gi)];
      if (totals.length) {
        media.dataset.expectedAssets = totals.reduce((sum, match) => sum + Number(match[1]), 0);
      }
      out.push(marker(document, "media-box, dark, full-width"), make(document, "h2", heading));
      if (stats) out.push(make(document, "p", stats));
      media.querySelectorAll(".search-results-header, .search-results-stats, .togglebox-opener").forEach((node) => node.remove());
      out.push(media);
    }
    article.replaceChildren(...out);
    element.replaceChildren(article);
  }
  var PLACEHOLDER_ALT = /^(?:(?:download|share)-[a-z]{2}|ikon[ay]_\S*_[0-9a-f]{8})$/i;
  function bannerLabel(href) {
    if (/\.pdf(?:$|[?#])/i.test(href)) return "Download PDF";
    if (/\.zip(?:$|[?#])/i.test(href)) return "Download the press kit ZIP";
    if (/whatsapp/i.test(href)) return "Follow \u0160koda Storyboard on WhatsApp";
    if (/\.mp4(?:$|[?#])/i.test(href)) return "Download video";
    if (/^mailto:\?/i.test(href)) return "Share by email";
    return "";
  }
  function labelImageLinks(article) {
    article.querySelectorAll("a[href]").forEach((a) => {
      const img = a.querySelector("img");
      if (!img || text5(a) || a.title) return;
      const alt = (img.getAttribute("alt") || "").trim();
      if (alt && !PLACEHOLDER_ALT.test(alt)) {
        a.title = alt;
        return;
      }
      const href = a.getAttribute("href");
      const label = bannerLabel(href);
      if (!label) {
        if (/\.(?:pdf|mp4)(?:$|[?#])/i.test(href)) {
          throw new Error(`Press-kit PDF/MP4 link has no accessible name: ${href}`);
        }
        return;
      }
      img.alt = label;
      a.title = label;
    });
  }
  function finish(element, document) {
    const article = element.querySelector("article.press_kit");
    if (article) labelImageLinks(article);
    const sidebarStart = article == null ? void 0 : article.querySelector('hr[data-press-kit-section="sidebar"]');
    if (sidebarStart) {
      let node = sidebarStart.nextElementSibling;
      while (node && !node.matches("hr[data-press-kit-section]")) {
        const first = node.matches("table") && node.querySelector("tr > td, tr > th");
        if (first && text5(first) === "Gallery") first.textContent = "Gallery (preview)";
        node = node.nextElementSibling;
      }
    }
    article == null ? void 0 : article.querySelectorAll("hr[data-press-kit-section]").forEach((hr) => {
      const style = hr.dataset.pressKitSection;
      let node = hr.nextElementSibling;
      let last = hr;
      while (node && !node.matches("hr[data-press-kit-section]")) {
        last = node;
        node = node.nextElementSibling;
      }
      last.after(WebImporter.Blocks.createBlock(document, {
        name: "Section Metadata",
        cells: { style }
      }));
      hr.removeAttribute("data-press-kit-section");
    });
    article == null ? void 0 : article.querySelectorAll('a[href=""], a:not([href])').forEach((a) => a.replaceWith(...a.childNodes));
  }
  function transform(hookName, element, payload) {
    if (hookName === "beforeTransform") rebuild(element, payload.document);
    if (hookName === "afterTransform") finish(element, payload.document);
  }

  // tools/importer/transformers/skoda-metadata.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
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
  function metaContent(document, selector) {
    const el = document.querySelector(selector);
    const val = el && el.getAttribute("content");
    return val && val.trim() ? val.trim() : null;
  }
  function normalizeDate(value) {
    if (!value) return "";
    const m = String(value).match(/\d{4}-\d{2}-\d{2}/);
    return m ? m[0] : "";
  }
  function extractDate(document) {
    const meta = metaContent(document, 'meta[property="article:published_time"]');
    if (normalizeDate(meta)) return normalizeDate(meta);
    const attrEl = document.querySelector("[data-publish-date]");
    const attr = attrEl && attrEl.getAttribute("data-publish-date");
    if (normalizeDate(attr)) return normalizeDate(attr);
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
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
    const span = document.querySelector(".entry-published, time[datetime]");
    if (span) {
      const d = normalizeDate(span.getAttribute("datetime") || span.textContent);
      if (d) return d;
    }
    const modified = metaContent(document, 'meta[property="article:modified_time"]');
    if (normalizeDate(modified)) return normalizeDate(modified);
    return "";
  }
  function extractTemplate(document) {
    const cls = document.body && document.body.getAttribute("class") || "";
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
  function extractCategories(document) {
    const cls = document.body && document.body.getAttribute("class") || "";
    const id = cls.match(/\bpostid-(\d+)\b/);
    const post = id && document.querySelector(`article.post-${id[1]}`);
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
  function extractTagsAndFacets(document, pageUrl = "") {
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
    const scopes = document.querySelectorAll("ol.entry-tags, ul.entry-tags, .entry-tags, .tag-list");
    const roots = scopes.length ? scopes : [document];
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
      const cls = document.body && document.body.getAttribute("class") || "";
      const tax = cls.match(/\btax-([a-z0-9_-]+)\b/i);
      const term = cls.match(/\bterm-([a-z0-9-]+)\b/i);
      if (tax && term) {
        const taxonomy = tax[1].toLowerCase().replace(/_/g, "-");
        const slug = term[1].toLowerCase();
        if (FACETS.includes(taxonomy) && slug && !/^\d+$/.test(slug)) add(taxonomy, slug);
      }
    }
    if (tags.length === 0) {
      const cls = document.body && document.body.getAttribute("class") || "";
      const canonical = document.querySelector('link[rel="canonical"]');
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
      const cls = document.body && document.body.getAttribute("class") || "";
      const id = cls.match(/\bpostid-(\d+)\b/);
      const post = id && document.querySelector(`article[data-post-id="${id[1]}"]`);
      String(post && post.getAttribute("class") || "").split(/\s+/).forEach((token) => {
        const m = token.toLowerCase().match(/^([a-z]+)-([a-z0-9-]+)$/);
        if (m && FACETS.includes(m[1]) && !/^\d+$/.test(m[2])) add(m[1], m[2]);
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
  function transform2(hookName, element, payload) {
    if (hookName !== TransformHook.afterTransform) return;
    if (hasMetadataBlock(element)) return;
    const { document, url, params } = payload;
    const canonical = document.querySelector('link[rel="canonical"]');
    const pageUrl = params && params.originalURL || url || canonical && canonical.href || "";
    const overrides = payload.template && payload.template.metadata || {};
    const h1 = document.querySelector("h1");
    const title = cleanTitle(overrides.title || metaContent(document, 'meta[property="og:title"]') || (document.querySelector("title") ? document.querySelector("title").textContent.trim() : "") || (h1 ? h1.textContent.trim() : ""));
    const description = overrides.description || metaContent(document, 'meta[property="og:description"]') || metaContent(document, 'meta[name="description"]') || "";
    const imageSrc = overrides.image || metaContent(document, 'meta[property="og:image"]') || "";
    const publisheddate = overrides.publisheddate || extractDate(document);
    const template = overrides.template || extractTemplate(document) || overrides.templateDefault || "";
    const category = overrides.category || extractCategory(pageUrl);
    const { tags: derivedTags, byFacet } = extractTagsAndFacets(document, pageUrl);
    const meta = {};
    if (title) meta.Title = title;
    if (description) meta.Description = description;
    if (imageSrc) {
      const img = document.createElement("img");
      img.src = imageSrc;
      meta.Image = img;
    }
    if (publisheddate) meta.publisheddate = publisheddate;
    if (template) meta.template = template;
    if (overrides.theme) meta.theme = overrides.theme;
    if (overrides.presskit) meta.presskit = overrides.presskit;
    if (category) meta.category = category;
    const categories = template === "story" ? extractCategories(document) : [];
    if (categories.length) meta.categories = categories.join(", ");
    const allTags = [.../* @__PURE__ */ new Set([...derivedTags, ...splitList(overrides.tags)])];
    if (allTags.length) meta.tags = allTags.join(", ");
    FACETS.forEach((f) => {
      const merged = [.../* @__PURE__ */ new Set([...byFacet[f] || [], ...splitList(overrides[f])])];
      if (merged.length) meta[f] = merged.join(", ");
    });
    const block = WebImporter.Blocks.getMetadataBlock(document, meta);
    element.append(block);
  }

  // tools/importer/transformers/skoda-images.js
  function hasContent2(node) {
    return [...node.childNodes].some((child) => child.nodeType === 1 || (child.textContent || "").trim());
  }
  function withCaption(node, caption, document) {
    if (!caption) return node;
    const figure = document.createElement("figure");
    const figcaption = document.createElement("figcaption");
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
  function imageContainer(img, document, link = null) {
    const div = document.createElement("div");
    div.append(img);
    if (!link) return div;
    link.append(div);
    return link;
  }
  function splitParagraph(img, paragraph, caption, document) {
    const link = img.closest("a");
    const linkedImage = link && paragraph.contains(link) && link.querySelectorAll("img").length === 1 && !(link.textContent || "").trim();
    const target = linkedImage ? link : img;
    const afterRange = document.createRange();
    afterRange.setStartAfter(target);
    afterRange.setEnd(paragraph, paragraph.childNodes.length);
    const after = paragraph.cloneNode(false);
    after.append(afterRange.extractContents());
    const beforeRange = document.createRange();
    beforeRange.selectNodeContents(paragraph);
    beforeRange.setEndBefore(target);
    const before = paragraph.cloneNode(false);
    before.append(beforeRange.extractContents());
    const imageNode = imageContainer(img, document, linkedImage ? link : null);
    const image = withCaption(imageNode, caption, document);
    paragraph.replaceWith(...[before, image, after].filter(hasContent2));
  }
  function normalizeImages(root, document = root.ownerDocument) {
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
          const div = document.createElement("div");
          img.replaceWith(div);
          div.append(img);
        }
        if (caption && !figure.querySelector("figcaption")) {
          const figcaption = document.createElement("figcaption");
          figcaption.textContent = caption;
          figure.append(figcaption);
        }
        return;
      }
      const paragraph = img.closest("p");
      if (paragraph) {
        splitParagraph(img, paragraph, caption, document);
        return;
      }
      if (img.parentElement.tagName === "DIV") {
        if (caption) {
          const div = img.parentElement;
          if (div.childElementCount === 1 && !(div.textContent || "").trim()) {
            const marker3 = document.createComment("image");
            div.replaceWith(marker3);
            marker3.replaceWith(withCaption(div, caption, document));
          } else {
            const marker3 = document.createComment("image");
            img.replaceWith(marker3);
            marker3.replaceWith(withCaption(imageContainer(img, document), caption, document));
          }
        }
        return;
      }
      const link = img.closest("a");
      const linkedImage = link && link.querySelectorAll("img").length === 1 && !(link.textContent || "").trim();
      const target = linkedImage ? link : img;
      const marker2 = document.createComment("image");
      target.replaceWith(marker2);
      const imageNode = imageContainer(img, document, linkedImage ? link : null);
      marker2.replaceWith(withCaption(imageNode, caption, document));
    });
  }

  // tools/importer/transformers/skoda-links.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
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
  function transform3(hookName, element, payload) {
    if (hookName !== TransformHook2.afterTransform) return;
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
  function transform4(hookName, element, payload) {
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

  // tools/importer/import-press-kit-default.js
  var TEMPLATE = { name: "press-kit-default", metadata: { template: "press_kit" } };
  function templateFor(document, pageUrl) {
    const hub = document.querySelector(".chapter-nav .link-intro[href]");
    if (!hub) return TEMPLATE;
    const hubUrl = new URL(hub.getAttribute("href"), pageUrl);
    const path = (value) => value.pathname.replace(/\/$/, "");
    if (path(hubUrl) === path(new URL(pageUrl))) return TEMPLATE;
    return __spreadProps(__spreadValues({}, TEMPLATE), {
      metadata: { template: "press_kit_chapter", theme: "press-kit", presskit: path(hubUrl) }
    });
  }
  var import_press_kit_default_default = {
    preprocess: ({ document }) => {
      transform4("preprocess", document.body, { document });
      document.querySelectorAll('article.press_kit a.media-cart-action.download[href], article.press_kit a[data-action="download"][href]').forEach((a) => {
        if (!a.textContent.trim()) a.textContent = "Download";
      });
      document.querySelectorAll("article.press_kit .entry-content").forEach(markQuotes);
      document.querySelectorAll("article.press_kit .entry-content").forEach(markFootnotes);
    },
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      const template = templateFor(document, params.originalURL);
      transform("beforeTransform", main, payload);
      const article = main.querySelector("article.press_kit");
      const body = article.querySelector(".entry-content");
      body.querySelectorAll(".search-results.search-results-gallery").forEach((group) => parse4(group, payload));
      body.querySelectorAll(".search-results-items").forEach((grid) => parse4(grid, payload));
      const faq = /\/frequently-asked-questions\/?$/.test(new URL(params.originalURL).pathname);
      parse3(body, { document, faq });
      body.querySelectorAll("p[data-skoda-quote]").forEach((p) => parse5(p, payload));
      body.querySelectorAll("figure").forEach((figure) => parseFigure(figure, payload));
      body.querySelectorAll("p[data-skoda-footnote]").forEach((p) => parse6(p, payload));
      main.querySelectorAll("[data-skoda-footnote]").forEach((p) => p.removeAttribute("data-skoda-footnote"));
      article.querySelectorAll("section.images.sa-media-kit-preview").forEach((section) => parse(section, payload));
      article.querySelectorAll("section.tags").forEach((section) => parse2(section, payload));
      const mediaBox = article.querySelector(".search-results.media-box");
      if (mediaBox) parse4(mediaBox, payload);
      transform("afterTransform", main, payload);
      transform2("afterTransform", main, __spreadProps(__spreadValues({}, payload), { template }));
      WebImporter.rules.transformBackgroundImages(main, document);
      normalizeImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      transform3("afterTransform", main, payload);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      return [{
        element: main,
        path: WebImporter.FileUtils.sanitizePath(rawPath || "/index"),
        report: { title: document.title, template: TEMPLATE.name }
      }];
    }
  };
  return __toCommonJS(import_press_kit_default_exports);
})();
