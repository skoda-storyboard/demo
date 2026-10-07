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

  // tools/importer/import-press-release.js
  var import_press_release_exports = {};
  __export(import_press_release_exports, {
    default: () => import_press_release_default
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
      const text4 = (a.textContent || "").trim();
      if (!href || !text4) return;
      const link2 = document.createElement("a");
      link2.setAttribute("href", href);
      link2.textContent = text4;
      cell.push(link2);
    });
    if (cell.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const table = WebImporter.DOMUtils.createTable([["Tags"], [cell]], document);
    element.replaceWith(table);
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
  function sizeLinks(item, document) {
    const links = [];
    const add = (raw, label) => {
      if (!raw || raw === "#") return;
      const href = serialiseMp4(raw);
      if (links.some((l) => l.getAttribute("href") === href)) return;
      const a = document.createElement("a");
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
  function parse3(element, { document }) {
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
      const links = sizeLinks(item, document);
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
        const p = document.createElement("p");
        p.append(a);
        return p;
      });
      cells.push([img || "", title, linkCell]);
    });
    if (cells.length === 1) {
      element.replaceWith(...element.childNodes);
      return;
    }
    element.replaceWith(WebImporter.DOMUtils.createTable(cells, document));
  }

  // tools/importer/parsers/quote.js
  var QUOTE = "data-skoda-quote";
  var BY = "data-skoda-quote-by";
  var text2 = (node) => ((node == null ? void 0 : node.textContent) || "").replace(/\s+/g, " ").trim();
  var centred = (p) => /text-align:\s*center/i.test(p.getAttribute("style") || "") || p.classList.contains("has-text-align-center");
  function isQuote(p) {
    if (!(p == null ? void 0 : p.matches("p")) || !centred(p)) return false;
    const nodes = [...p.childNodes].filter((n) => n.nodeType === 1 || text2(n));
    return nodes.some((n) => {
      var _a;
      return ((_a = n.matches) == null ? void 0 : _a.call(n, "em, i")) && text2(n);
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
    const edge = (n) => n && (n.nodeType === 1 && n.matches("br") || n.nodeType === 3 && !text2(n));
    while (edge(p.lastChild)) p.lastChild.remove();
    while (edge(p.firstChild)) p.firstChild.remove();
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
  function parse4(element, { document }) {
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

  // tools/importer/transformers/skoda-press-release-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        // Site header / nav / mega-menu / language switcher / search overlay chrome
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
        // Secondary-column widgets that are NOT press-release article content
        ".newsletter-subscribe-widget",
        // verified: mailguide subscribe form widget
        ".side-banner",
        // verified: SiteOrigin banner slot
        ".sa-bnr",
        // verified: banner injection (also inline in body)
        // Cookie / consent (defensive — no OneTrust SDK on this sample)
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
        // Floating affordances — verified: .scroll-top. Others are defensive no-ops.
        ".scroll-top",
        ".sticky-buttons",
        // verified: share + cart floating dock (→ SKODA-215)
        ".skoda-anniversary-background",
        // verified: decorative page background
        ".social-share",
        ".media-cart-flyout",
        ".share-bar",
        // Chrome resource elements (external stylesheet link). script/style not present.
        'link[rel="stylesheet"]',
        "link"
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      element.querySelectorAll('a[href*="#s_aid="], a[href*="#s_cid="]').forEach((a) => {
        a.setAttribute("href", a.getAttribute("href").split("#s_aid=")[0].split("#s_cid=")[0]);
      });
    }
  }

  // tools/importer/transformers/skoda-press-release-layout.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var MARKER = "data-pr-section";
  var LAYOUT_ATTR = "data-pr-layout";
  var SECTION_STYLES = {
    body: "body-column",
    // Background panels in the body (Zellmer grey FAQ, SKODA-824, contract highlight v2).
    "highlight-grey": "body-column, highlight-grey",
    "highlight-dark": "body-column, highlight-dark",
    sidebar: "sidebar",
    "media-box": "dark, full-width, media-box",
    related: "dark, full-width, related"
  };
  var text3 = (el) => el ? (el.textContent || "").replace(/\s+/g, " ").trim() : "";
  function make(document, tag, content) {
    const el = document.createElement(tag);
    if (typeof content === "string") el.textContent = content;
    else if (content) el.append(...[].concat(content));
    return el;
  }
  function marker(document, id) {
    const hr = document.createElement("hr");
    hr.setAttribute(MARKER, id);
    return hr;
  }
  function link(document, href, label) {
    const a = document.createElement("a");
    a.setAttribute("href", href);
    a.textContent = label;
    return a;
  }
  function urlParagraph(document, url) {
    return make(document, "p", link(document, url, url));
  }
  function titleText(h1) {
    const clone = h1.cloneNode(true);
    clone.querySelectorAll("br").forEach((br) => br.replaceWith(" "));
    return text3(clone);
  }
  function isEmptyParagraph(p) {
    return !text3(p) && !p.querySelector("img, picture, a[href], iframe");
  }
  function leadImage(document, primary) {
    const img = primary.querySelector(".article-teaser img");
    if (!img) return null;
    ["data-caption", "data-video_title", "data-video_src", "srcset", "sizes", "itemprop"].forEach((a) => img.removeAttribute(a));
    const alt = (img.getAttribute("alt") || "").replace(/<br\s*\/?>/gi, " ").replace(/\s+/g, " ").trim();
    img.setAttribute("alt", alt);
    return make(document, "p", img);
  }
  var BULLET = /^\s*(?:›|&rsaquo;)/;
  var continues = (html) => new RegExp("^\\p{Ll}", "u").test(html.replace(/<[^>]*>|&[a-z]+;|&#\d+;/gi, " ").trim());
  function bulletList(document, primary) {
    const box = primary.querySelector(".bullet-points");
    if (!box) return null;
    const lines = [];
    const lis = box.querySelectorAll("li");
    if (lis.length) {
      lis.forEach((li) => lines.push(li.innerHTML));
    } else {
      box.querySelectorAll("p").forEach((p) => {
        const parts = p.innerHTML.split(/<br\s*\/?>/i).filter((line) => line.replace(/&nbsp;/g, " ").trim());
        const marked = parts.some((line) => BULLET.test(line));
        parts.forEach((line, i) => {
          if (marked && i > 0 && !BULLET.test(line) && continues(line)) lines[lines.length - 1] = `${lines[lines.length - 1].trimEnd()} ${line.trim()}`;
          else lines.push(line);
        });
      });
    }
    const ul = document.createElement("ul");
    lines.forEach((html) => {
      const li = document.createElement("li");
      li.innerHTML = html.replace(/^\s*(?:›|&rsaquo;)\s*/, "").trim();
      if (text3(li)) ul.append(li);
    });
    return ul.children.length ? ul : null;
  }
  function perex(document, primary) {
    const out = [];
    const summary = primary.querySelector(".entry-summary");
    if (!summary) return out;
    summary.querySelectorAll("p").forEach((p) => {
      if (isEmptyParagraph(p)) return;
      const strong = document.createElement("strong");
      strong.append(...p.childNodes);
      out.push(make(document, "p", strong));
    });
    return out;
  }
  function panelVariant(style) {
    const value = ((style || "").match(/background(?:-color)?\s*:\s*([^;]+)/i) || [])[1];
    const hex = (value || "").trim().toLowerCase().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
    const rgb = (value || "").match(/rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/);
    let channels = null;
    if (hex) {
      const h = hex[1].length === 3 ? hex[1].replace(/./g, "$&$&") : hex[1];
      channels = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
    } else if (rgb) channels = rgb.slice(1, 4).map(Number);
    if (!channels) return null;
    const luminance = (0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]) / 255;
    if (luminance > 0.98) return null;
    return luminance < 0.5 ? "dark" : "grey";
  }
  function bodyContent(document, primary) {
    const content = primary.querySelector(".entry-content");
    if (!content) return [];
    content.querySelectorAll(".sa-bnr").forEach((n) => n.remove());
    content.querySelectorAll(".embed-controller-wrapper").forEach((wrap) => {
      const iframe = wrap.querySelector("iframe");
      const url = iframe && (iframe.getAttribute("data-src") || iframe.getAttribute("src"));
      wrap.replaceWith(...url ? [urlParagraph(document, url)] : []);
    });
    content.querySelectorAll("lite-youtube").forEach((el) => {
      const id = (el.getAttribute("videoid") || "").trim();
      const wrap = el.closest(".video-container, .ratio-container");
      const box = wrap && wrap !== content && content.contains(wrap) ? wrap : el;
      const p = box.closest("p");
      const replacement = /^[\w-]{6,}$/.test(id) ? [urlParagraph(document, `https://www.youtube.com/watch?v=${id}`)] : [];
      if (p && text3(p) === text3(box)) p.replaceWith(...replacement);
      else box.replaceWith(...replacement);
    });
    content.querySelectorAll(".page-embed.yt-embed-cookie").forEach((n) => n.remove());
    content.querySelectorAll(".media-cart-item.attachment, .video-container").forEach((wrap) => {
      if (!wrap.parentNode) return;
      const iframe = wrap.querySelector("iframe[src], iframe[data-src]");
      const url = iframe && (iframe.getAttribute("src") || iframe.getAttribute("data-src"));
      wrap.replaceWith(...url ? [urlParagraph(document, url)] : []);
    });
    content.querySelectorAll(".media-cart-actions").forEach((n) => n.remove());
    content.querySelectorAll("iframe").forEach((iframe) => {
      const url = iframe.getAttribute("src") || iframe.getAttribute("data-src");
      const p = iframe.closest("p");
      const replacement = url && /^https?:/.test(url) ? urlParagraph(document, url) : null;
      if (p && text3(p) === "") p.replaceWith(...replacement ? [replacement] : []);
      else iframe.replaceWith(...replacement ? [replacement] : []);
    });
    content.querySelectorAll("hr").forEach((hr) => hr.remove());
    content.querySelectorAll(":scope > div[style]").forEach((div) => {
      const variant = panelVariant(div.getAttribute("style"));
      if (variant && text3(div)) {
        div.replaceWith(marker(document, `highlight-${variant}`), ...div.childNodes, marker(document, "body"));
      }
    });
    content.querySelectorAll("div[style]").forEach((div) => div.replaceWith(...div.childNodes));
    content.querySelectorAll("p").forEach((p) => {
      if (isEmptyParagraph(p)) p.remove();
    });
    dataTables(document, content);
    return [...content.childNodes].filter((n) => n.nodeType === 1 || text3(n));
  }
  function dataTables(document, content) {
    content.querySelectorAll("table").forEach((table) => {
      const rows = [...table.rows].filter((row) => text3(row));
      const filled = (row) => [...row.cells].filter((cell) => text3(cell));
      if (rows.filter((row) => filled(row).length >= 2).length < 2) return;
      const [head, ...body] = rows;
      const labels = [...head.cells].map((cell) => text3(cell));
      const out = [];
      if (labels[0]) out.push(make(document, "p", labels[0]));
      const list = document.createElement("ul");
      body.forEach((row) => {
        const [first, ...cells] = [...row.cells];
        const li = document.createElement("li");
        const label = document.createElement("strong");
        label.append(...[...first.childNodes].map((node) => node.cloneNode(true)));
        label.querySelectorAll("strong, b").forEach((inner) => inner.replaceWith(...inner.childNodes));
        const values = cells.map((cell, i) => [text3(cell) && labels[i + 1], text3(cell)]).filter(([, value]) => value).map((pair) => pair.filter(Boolean).join(": "));
        if (text3(label)) li.append(label, values.length ? `: ${values.join(" \xB7 ")}` : "");
        else li.append(values.join(" \xB7 "));
        list.append(li);
      });
      out.push(list);
      table.replaceWith(...out);
    });
  }
  function dropEmptyBodies(nodes) {
    const isMarker = (n) => n && n.nodeType === 1 && n.hasAttribute(MARKER);
    const nextElement = (i) => nodes.slice(i + 1).find((n) => n.nodeType === 1);
    return nodes.filter((n, i) => !(isMarker(n) && n.getAttribute(MARKER) === "body" && (!nextElement(i) || isMarker(nextElement(i)))));
  }
  function sidebarContent(document, secondary, hasMediaBox) {
    const out = [];
    if (!secondary) return out;
    secondary.querySelectorAll(":scope > section").forEach((section) => {
      const heading = section.querySelector("h2, h3, .heading");
      const headingText = text3(heading);
      if (section.matches(".images, .sa-media-kit-preview")) {
        if (heading) heading.remove();
        out.push(make(document, "h3", headingText || "Images"), section);
        return;
      }
      if (section.matches(".tags") || section.querySelector(".entry-tags")) {
        if (heading) heading.remove();
        out.push(make(document, "h3", headingText || "Tags"), section);
        return;
      }
      const menu = section.querySelector("ul.menu, .menu");
      if (!menu) return;
      const ul = document.createElement("ul");
      menu.querySelectorAll(":scope > li").forEach((li) => {
        const a = li.querySelector('a[href]:not([href="#"])');
        if (a && text3(a)) {
          ul.append(make(document, "li", link(document, a.getAttribute("href"), text3(a))));
          return;
        }
        const label = text3(li.querySelector("span")) || text3(li);
        if (label && hasMediaBox) ul.append(make(document, "li", link(document, "#media-box", label)));
      });
      if (!ul.children.length) return;
      out.push(make(document, "h3", headingText || "Additional info"), ul);
    });
    return out;
  }
  function mediaBoxContent(document, band) {
    const box = band.querySelector(".search-results.media-box");
    if (!box) return [];
    const heading = text3(box.querySelector(".search-results-heading")) || "Media Box";
    const stats = text3(box.querySelector(".search-results-stats .stats, .stats"));
    box.querySelectorAll(".search-results-header, .search-results-stats, .togglebox-opener").forEach((n) => n.remove());
    const out = [make(document, "h2", heading)];
    if (stats) out.push(make(document, "p", stats));
    out.push(box);
    return out;
  }
  function relatedContent(document, band) {
    const results = band.querySelector(".search-results");
    if (!results) return [];
    const rows = [["Story Rail (press)"]];
    results.querySelectorAll("article.article-teaser").forEach((card) => {
      const titleLink = card.querySelector(".entry-title a[href]");
      const href = titleLink && titleLink.getAttribute("href");
      if (!href || !text3(titleLink)) return;
      const img = card.querySelector(".article-teaser-media img");
      if (img) ["data-caption", "data-video_title", "data-video_src", "srcset", "sizes", "itemprop"].forEach((a) => img.removeAttribute(a));
      const body = [];
      const date = text3(card.querySelector(".entry-published"));
      if (date) body.push(make(document, "p", date));
      body.push(make(document, "h3", link(document, href, text3(titleLink))));
      rows.push([img || "", body]);
    });
    if (rows.length === 1) return [];
    const headingEl = results.querySelector(".search-results-heading");
    const sub = text3(headingEl && headingEl.querySelector(".subheading"));
    let heading = "Related Press Releases";
    if (headingEl) {
      const clone = headingEl.cloneNode(true);
      clone.querySelectorAll(".subheading").forEach((s) => s.remove());
      heading = text3(clone) || heading;
    }
    const out = [make(document, "h2", heading)];
    if (sub) out.push(make(document, "p", sub));
    const all = results.querySelector("a.search-results-header-link[href], .search-results-header a[href]");
    if (all && all.getAttribute("href")) out.push(make(document, "p", link(document, all.getAttribute("href"), text3(all) || "All")));
    out.push(WebImporter.DOMUtils.createTable(rows, document));
    return out;
  }
  function rebuild(element, document) {
    const article = [...element.querySelectorAll("article.press_release, article.type-press_release")].find((a) => a.querySelector(".column-primary"));
    if (!article) return;
    const container = article.querySelector(":scope > .container") || article;
    const primary = container.querySelector(".column-primary");
    const header = container.querySelector(":scope > header") || container;
    const date = text3(header.querySelector(".entry-published"));
    const h1 = header.querySelector("h1");
    const secondary = container.querySelector(".column-secondary");
    const bands = [...article.querySelectorAll(".cover-box.dark")];
    const mediaBand = bands.find((b) => b.querySelector(".search-results.media-box"));
    const relatedBand = bands.find((b) => b !== mediaBand && b.querySelector("article.article-teaser"));
    const out = [];
    if (date) out.push(make(document, "p", date));
    if (h1) out.push(make(document, "h1", titleText(h1)));
    out.push(marker(document, "body"));
    [
      leadImage(document, primary),
      bulletList(document, primary),
      ...perex(document, primary),
      ...bodyContent(document, primary)
    ].forEach((n) => {
      if (n) out.push(n);
    });
    const media = mediaBand ? mediaBoxContent(document, mediaBand) : [];
    const side = sidebarContent(document, secondary, media.length > 0);
    if (side.length) out.push(marker(document, "sidebar"), ...side);
    if (media.length) out.push(marker(document, "media-box"), ...media);
    const related = relatedBand ? relatedContent(document, relatedBand) : [];
    if (related.length) out.push(marker(document, "related"), ...related);
    article.replaceChildren(...dropEmptyBodies(out));
    article.setAttribute(LAYOUT_ATTR, "");
  }
  function finish(element, document) {
    const article = element.querySelector(`[${LAYOUT_ATTR}]`);
    if (!article) return;
    article.removeAttribute(LAYOUT_ATTR);
    const sidebar = element.querySelector(`hr[${MARKER}="sidebar"]`);
    if (sidebar) {
      let n = sidebar.nextElementSibling;
      while (n && !n.hasAttribute(MARKER)) {
        const cell = n.matches("table") && n.querySelector("tr > th, tr > td");
        if (cell && text3(cell).toLowerCase() === "gallery") cell.textContent = "Gallery (preview)";
        n = n.nextElementSibling;
      }
    }
    element.querySelectorAll(`hr[${MARKER}]`).forEach((hr) => {
      const style = SECTION_STYLES[hr.getAttribute(MARKER)];
      let end = hr.nextElementSibling;
      let last = hr;
      while (end && !end.hasAttribute(MARKER)) {
        last = end;
        end = end.nextElementSibling;
      }
      if (style) {
        last.after(WebImporter.Blocks.createBlock(document, { name: "Section Metadata", cells: { style } }));
      }
      hr.removeAttribute(MARKER);
    });
    article.querySelectorAll('a[href=""], a:not([href])').forEach((a) => a.replaceWith(...a.childNodes));
    article.querySelectorAll("a[href]").forEach((a) => {
      const img = a.querySelector("img");
      const alt = ((img == null ? void 0 : img.getAttribute("alt")) || "").trim();
      if (!alt || text3(a) || a.title || !/\.(?:pdf|mp4)(?:$|[?#])/i.test(a.getAttribute("href"))) return;
      a.title = alt;
    });
  }
  function transform2(hookName, element, payload) {
    const document = element.ownerDocument || typeof window !== "undefined" && window.document;
    if (hookName === TransformHook2.beforeTransform) rebuild(element, document);
    if (hookName === TransformHook2.afterTransform) finish(element, document);
  }

  // tools/importer/transformers/skoda-metadata.js
  var TransformHook3 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
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
  function transform3(hookName, element, payload) {
    if (hookName !== TransformHook3.afterTransform) return;
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
    const allTags = [.../* @__PURE__ */ new Set([...derivedTags, ...splitList(overrides.tags)])];
    if (allTags.length) meta.tags = allTags.join(", ");
    FACETS.forEach((f) => {
      const merged = [.../* @__PURE__ */ new Set([...byFacet[f] || [], ...splitList(overrides[f])])];
      if (merged.length) meta[f] = merged.join(", ");
    });
    const block = WebImporter.Blocks.getMetadataBlock(document, meta);
    element.append(block);
  }

  // tools/importer/transformers/skoda-links.js
  var TransformHook4 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
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
  function transform4(hookName, element, payload) {
    if (hookName !== TransformHook4.afterTransform) return;
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
  function transform5(hookName, element, payload) {
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
  function imageContainer(img, document, link2 = null) {
    const div = document.createElement("div");
    div.append(img);
    if (!link2) return div;
    link2.append(div);
    return link2;
  }
  function splitParagraph(img, paragraph, caption, document) {
    const link2 = img.closest("a");
    const linkedImage = link2 && paragraph.contains(link2) && link2.querySelectorAll("img").length === 1 && !(link2.textContent || "").trim();
    const target = linkedImage ? link2 : img;
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
    const imageNode = imageContainer(img, document, linkedImage ? link2 : null);
    const image = withCaption(imageNode, caption, document);
    paragraph.replaceWith(...[before, image, after].filter(hasContent));
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
      const link2 = img.closest("a");
      const linkedImage = link2 && link2.querySelectorAll("img").length === 1 && !(link2.textContent || "").trim();
      const target = linkedImage ? link2 : img;
      const marker2 = document.createComment("image");
      target.replaceWith(marker2);
      const imageNode = imageContainer(img, document, linkedImage ? link2 : null);
      marker2.replaceWith(withCaption(imageNode, caption, document));
    });
  }

  // tools/importer/import-press-release.js
  var parsers = {
    gallery: parse,
    tags: parse2,
    downloads: parse3,
    quote: parse4
  };
  var PAGE_TEMPLATE = {
    name: "press-release",
    description: "\u0160koda press release detail (press_release CPT), SKODA-607. No hero: header (date + title) -> body-column (lead image, bullets, perex, Buzzsprout, body, Vimeo) -> sidebar (Additional info, Gallery (preview), Tags) -> dark Media Box band (Downloads) -> optional dark Related Press Releases band (Story Rail (press)). Sections are built by skoda-press-release-layout. Content-driven detection only.",
    urls: [
      "https://www.skoda-storyboard.com/en/press-releases/skoda-superb-25-years-of-comfort-space-and-technical-excellence/"
    ],
    blocks: [
      { name: "gallery", instances: ["section.images.sa-media-kit-preview"] },
      { name: "tags", instances: ["section.tags"] },
      { name: "downloads", instances: [".search-results.media-box"] },
      // Pull-quotes (SKODA-220): marked in `preprocess`, while their decorative <hr> exists.
      { name: "quote", instances: ["article p[data-skoda-quote]"] }
    ],
    // Documentation of the emitted section model; skoda-press-release-layout builds it.
    sections: [
      { id: "header", name: "Header", style: null, defaultContent: ["header .entry-published", "header .entry-title"] },
      {
        id: "body",
        name: "Body column",
        style: "body-column",
        defaultContent: [".column-primary .article-teaser img", ".column-primary .bullet-points", ".column-primary .entry-summary", ".column-primary .entry-content"]
      },
      { id: "sidebar", name: "Sidebar", style: "sidebar", blocks: ["gallery", "tags"], defaultContent: [".column-secondary section > .menu"] },
      { id: "media-box", name: "Media Box", style: "dark, full-width, media-box", blocks: ["downloads"], defaultContent: [".search-results-heading", ".search-results-stats .stats"] },
      { id: "related", name: "Related Press Releases", style: "dark, full-width, related", blocks: ["story-rail"], defaultContent: [".search-results.type-press_release .search-results-header"] }
    ]
  };
  var transformers = [
    transform,
    transform2,
    transform3,
    transform4
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
  function findBlocksOnPage(document, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
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
  var import_press_release_default = {
    /**
     * Runs on the untouched DOM, before helix-importer's preProcess drops every empty
     * inline element. The Media Box's single download links (video MP4, PDF) are icon-only
     * `<a><i class="icon"></i></a>`, so they'd vanish before the downloads parser runs;
     * give them a text label so they survive (the parser labels them by file type).
     * preProcess also drops every <hr>, so the pull-quotes are marked by their rule here.
     */
    preprocess: ({ document }) => {
      transform5("preprocess", document.body, { document });
      document.querySelectorAll(".search-results.media-box a.media-cart-action.download[href]").forEach((a) => {
        if (!(a.textContent || "").trim()) a.textContent = "Download";
      });
      document.querySelectorAll("article.press_release .entry-content").forEach(markQuotes);
    },
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      WebImporter.rules.transformBackgroundImages(main, document);
      normalizeImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_press_release_exports);
})();
