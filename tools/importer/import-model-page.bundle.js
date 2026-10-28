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
  var __export = (target2, all) => {
    for (var name in all)
      __defProp(target2, name, { get: all[name], enumerable: true });
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

  // import-model-page.js
  var import_model_page_exports = {};
  __export(import_model_page_exports, {
    default: () => import_model_page_default
  });

  // parsers/hero.js
  function parse(element, { document: document2 }) {
    const img = element.querySelector(".item.active .image-wrapper img, .image-wrapper img, img");
    const heading = element.querySelector("h1.entry-title, h1");
    if (!img && !heading) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const content = [];
    const chip = element.querySelector(".entry-meta .label, span.label-secondary, .label");
    const chipText = chip ? (chip.textContent || "").replace(/\s+/g, " ").trim() : "";
    if (chipText) {
      const p = document2.createElement("p");
      p.textContent = chipText;
      content.push(p);
    }
    if (heading) {
      const h1 = document2.createElement("h1");
      h1.textContent = (heading.textContent || "").replace(/\s+/g, " ").trim();
      content.push(h1);
    }
    const cells = [["Hero Image (overlay)"]];
    if (img) cells.push([img]);
    if (content.length) cells.push([content]);
    element.replaceWith(WebImporter.DOMUtils.createTable(cells, document2));
  }

  // parsers/in-page-nav.js
  var clean = (text2) => String(text2 || "").replace(/\s+/g, " ").trim();
  var STRIP = /[^\p{L}\p{M}\p{N}\p{Pc} -]/gu;
  function headingIds(document2) {
    const ids = /* @__PURE__ */ new Map();
    const seen = /* @__PURE__ */ new Map();
    document2.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((h) => {
      const base = (h.textContent || "").toLowerCase().replace(STRIP, "").replace(/ /g, "-");
      let id = base;
      let n = seen.get(base) || 0;
      while (seen.has(id)) {
        n += 1;
        id = `${base}-${n}`;
      }
      seen.set(base, n);
      seen.set(id, 0);
      ids.set(h, id);
    });
    return ids;
  }
  function target(document2, key) {
    const tagged = document2.querySelector(`[data-model-key="${key}"]`);
    if (tagged) return tagged;
    if (key === "intro") {
      return document2.querySelector(".so-widget-sow-editor h2, .widget_sow-editor h2");
    }
    return null;
  }
  function parse2(element, { document: document2 }) {
    const links = Array.from(element.querySelectorAll('ul.nav > li > a[href^="#"], a[href^="#"]'));
    const ids = headingIds(document2);
    const ul = document2.createElement("ul");
    const used = /* @__PURE__ */ new Set();
    links.forEach((a) => {
      const key = (a.getAttribute("href") || "").slice(1);
      const label = clean(a.textContent);
      if (!key || !label || used.has(key)) return;
      const heading = target(document2, key);
      const id = heading && ids.get(heading);
      if (!id) return;
      used.add(key);
      const li = document2.createElement("li");
      const link = document2.createElement("a");
      link.setAttribute("href", `#${id}`);
      link.textContent = label;
      li.append(link);
      ul.append(li);
    });
    if (!ul.children.length) {
      element.remove();
      return;
    }
    element.replaceWith(ul);
  }

  // parsers/key-facts.js
  function parse3(element, { document: document2 }) {
    const items = Array.from(element.querySelectorAll(".items > .item"));
    if (items.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [["Cards (key-facts)"]];
    items.forEach((item) => {
      const img = item.querySelector(".item-image img, img");
      const title = item.querySelector(".item-text .item-title, .item-text h3, .item-title, h3");
      const body = [];
      const titleText = title ? (title.textContent || "").replace(/\s+/g, " ").trim() : "";
      if (titleText) {
        const h3 = document2.createElement("h3");
        h3.textContent = titleText;
        body.push(h3);
      }
      const textRoot = item.querySelector(".item-text") || item;
      textRoot.querySelectorAll("p").forEach((p) => {
        if ((p.textContent || "").trim()) body.push(p);
      });
      if (!img && body.length === 0) return;
      cells.push([img || "", body]);
    });
    const out = [];
    const heading = element.querySelector("h2");
    const headingText = heading ? (heading.textContent || "").replace(/\s+/g, " ").trim() : "";
    if (headingText) {
      const h2 = document2.createElement("h2");
      h2.textContent = headingText;
      h2.setAttribute("data-model-key", "keyfacts");
      out.push(h2);
    }
    out.push(WebImporter.DOMUtils.createTable(cells, document2));
    element.replaceWith(...out);
  }

  // parsers/spec-table.js
  var PER_ROW = 3;
  function parse4(element, { document: document2 }) {
    const items = Array.from(element.querySelectorAll(".items > .item"));
    if (items.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const clean3 = (node) => node ? (node.textContent || "").replace(/\s+/g, " ").trim() : "";
    const stats = items.map((item) => {
      const value = [clean3(item.querySelector(".item-value")), clean3(item.querySelector(".item-unit"))].filter(Boolean).join(" ");
      const label = clean3(item.querySelector(".item-title"));
      const cell = [];
      if (value) {
        const p = document2.createElement("p");
        const strong = document2.createElement("strong");
        strong.textContent = value;
        p.append(strong);
        cell.push(p);
      }
      if (label) {
        const p = document2.createElement("p");
        p.textContent = label;
        cell.push(p);
      }
      return cell;
    }).filter((cell) => cell.length);
    const out = [];
    const bgImg = element.querySelector(".bg-image img");
    if (bgImg) {
      const p = document2.createElement("p");
      p.append(bgImg);
      out.push(p);
    }
    const headingText = clean3(element.querySelector("h2"));
    if (headingText) {
      const h2 = document2.createElement("h2");
      h2.textContent = headingText;
      h2.setAttribute("data-model-key", "techdata");
      out.push(h2);
    }
    if (stats.length) {
      const cells = [["Columns"]];
      for (let i = 0; i < stats.length; i += PER_ROW) {
        const row = stats.slice(i, i + PER_ROW);
        while (row.length < Math.min(PER_ROW, stats.length)) row.push("");
        cells.push(row);
      }
      out.push(WebImporter.DOMUtils.createTable(cells, document2));
    }
    const pdf = element.querySelector(".buttons a[href], a.btn[href]");
    if (pdf) {
      const p = document2.createElement("p");
      const a = document2.createElement("a");
      a.setAttribute("href", pdf.getAttribute("href"));
      a.textContent = clean3(pdf) || "Download PDF";
      p.append(a);
      out.push(p);
    }
    element.replaceWith(...out);
  }

  // ../../scripts/locale-paths.js
  var LOCALE_PATHS = {
    en: {
      home: "/en",
      mediaRoom: "/en/media-room",
      news: "/en/news",
      pressKits: "/en/press-kits",
      images: "/en/images",
      videos: "/en/videos",
      search: "/en/search",
      mediaCart: "/en/media-cart",
      series: "/en/series-2",
      contacts: "/en/contacts",
      newsletter: "/en/newsletter"
    },
    cs: {
      home: "/cs",
      mediaRoom: "/cs/media-room",
      news: "/cs/tiskove-zpravy",
      pressKits: "/cs/tiskove-mapy",
      images: "/cs/foto",
      videos: "/cs/video",
      search: "/cs/hledat",
      mediaCart: "/cs/kontakty/kosik",
      series: "/cs/serialy",
      contacts: "/cs/kontakty",
      newsletter: "/cs/newsletter"
    },
    de: {
      home: "/de",
      mediaRoom: "/de/media-room",
      news: "/de/pressemitteilungen",
      pressKits: "/de/pressemappen",
      images: "/de/fotos",
      videos: "/de/videos",
      search: "/de/suche",
      mediaCart: "/de/media-kart",
      contacts: "/de/kontakte"
    },
    sk: {
      home: "/sk",
      mediaRoom: "/sk/media-room",
      news: "/sk/tlacove-spravy",
      pressKits: "/sk/tlacove-mapy",
      images: "/sk/fotografie",
      videos: "/sk/video",
      search: "/sk/hladat",
      mediaCart: "/sk/kosik",
      series: "/sk/serialy",
      contacts: "/sk/kontakty"
    },
    sr: {
      home: "/sr",
      mediaRoom: "/sr/media-room",
      news: "/sr/news",
      pressKits: "/sr/press-kits",
      images: "/sr/fotografije",
      videos: "/sr/video",
      search: "/sr/pretraga",
      mediaCart: "/sr/media-package",
      series: "/sr/serije",
      contacts: "/sr/kontakti"
    },
    sl: {
      home: "/sl",
      mediaRoom: "/sl/media-room",
      images: "/sl/slike",
      videos: "/sl/videoposnetki",
      search: "/sl/isci",
      mediaCart: "/sl/medijski-paket",
      series: "/sl/serije",
      contacts: "/sl/kontakti"
    }
  };
  var CONTENT_PREFIXES = {
    press_release: {
      en: "/en/press-releases",
      cs: "/cs/tiskove-zpravy-archiv",
      de: "/de/pressemitteilungen-archive",
      sk: "/sk/tlacova-sprava",
      sr: "/sr/press-release",
      sl: "/sl/press-release"
    },
    press_kit: {
      en: "/en/press-kits",
      cs: "/cs/tiskove-mapy",
      de: "/de/pressemappe",
      sk: "/sk/press-kit",
      sr: "/sr/press-kit"
    },
    skoda_model: {
      en: "/en/skoda-model",
      cs: "/cs/skoda-model",
      de: "/de/skoda-model",
      sk: "/sk/skoda-model"
    }
  };
  var BUILT = {
    mediaFeed: ["en"],
    fragments404: ["en"],
    mediaCart: ["en"]
  };
  function contentPrefix(template, locale) {
    const prefixes = CONTENT_PREFIXES[template];
    return (prefixes == null ? void 0 : prefixes[locale]) || (prefixes == null ? void 0 : prefixes.en);
  }

  // locale.js
  function sourceLocale(url) {
    let pathname = String(url || "");
    try {
      pathname = new URL(pathname, "https://www.skoda-storyboard.com").pathname;
    } catch (e) {
    }
    const m = pathname.match(/^\/([a-z]{2})(?:\/|$)/i);
    const locale = m ? m[1].toLowerCase() : "en";
    return Object.prototype.hasOwnProperty.call(LOCALE_PATHS, locale) ? locale : "en";
  }
  var mediaFeedUrl = (locale) => `/${BUILT.mediaFeed.includes(locale) ? locale : "en"}/media-feed.json`;

  // parsers/story-rail.js
  var RAILS = {
    derivatives: { template: "skoda_model", heading: "Bodywork / Derivatives" },
    news: { template: "press_release", heading: "News" },
    "press-kits": { template: "press_kit", heading: "Press Kits" },
    stories: { template: "story", heading: "Stories" },
    // Image/video rows live in the generated media feed, not the page index (SKODA-608,
    // docs/architecture/SKODA-MEDIA-ITEMS-OPTIONS.md: AEM Assets is the source of truth).
    images: {
      template: "image",
      heading: "Images",
      limit: "20",
      feed: true
    },
    videos: {
      template: "video",
      heading: "Videos",
      limit: "20",
      feed: true
    }
  };
  var FACET_KEYS = ["model", "bodywork", "derivative"];
  var clean2 = (text2) => String(text2 || "").replace(/\s+/g, " ").trim();
  function facetsFromHref(href) {
    const out = {};
    let query = "";
    try {
      query = new URL(href, "https://www.skoda-storyboard.com").search;
    } catch (e) {
      return out;
    }
    new URLSearchParams(query).forEach((value, key) => {
      const m = key.match(/^filter\[([a-z0-9_-]+)\](?:\[\d*\])?$/i);
      if (!m || !value) return;
      const facet = m[1].toLowerCase();
      if (!FACET_KEYS.includes(facet)) return;
      out[facet] = out[facet] || [];
      const slug = value.toLowerCase();
      if (!out[facet].includes(slug)) out[facet].push(slug);
    });
    return out;
  }
  function allLink(root) {
    return root.querySelector('a.search-results-header-link[href*="filter"]');
  }
  function modelSegments(document2, url) {
    const canonical = document2.querySelector('link[rel="canonical"]');
    const href = url || canonical && canonical.getAttribute("href") || "";
    const m = String(href).match(/\/skoda-model\/([a-z0-9/-]+)/i);
    return m ? m[1].toLowerCase().split("/").filter(Boolean) : [];
  }
  function parse5(element, { document: document2, url, params }) {
    const locale = sourceLocale(params && params.originalURL || url);
    let node = element;
    let railId = null;
    while (node && node !== document2.documentElement) {
      if (node.id && Object.prototype.hasOwnProperty.call(RAILS, node.id)) {
        railId = node.id;
        break;
      }
      node = node.parentElement;
    }
    if (!railId) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const rail = RAILS[railId];
    const headingEl = element.querySelector(".search-results-heading, h2, h3");
    let headingText = rail.heading;
    let subText = "";
    if (headingEl) {
      const sub = headingEl.querySelector(".subheading");
      subText = sub ? clean2(sub.textContent) : "";
      const clone = headingEl.cloneNode(true);
      clone.querySelectorAll(".subheading").forEach((s) => s.remove());
      headingText = clean2(clone.textContent) || headingText;
    }
    const rows = [["Story Rail"], ["template", rail.template]];
    let viewAll = null;
    if (railId === "derivatives") {
      const segs = modelSegments(document2, params && params.originalURL || url);
      if (!segs.length) {
        console.warn("[story-rail] derivatives rail: no /skoda-model/<slug> in the page URL; dropped");
        element.remove();
        return;
      }
      const models = contentPrefix("skoda_model", locale);
      rows.push(["path", segs.length > 1 ? `${models}/${segs[0]}` : `${models}/${segs[0]}/`]);
    } else {
      const own = allLink(element);
      const link = own || allLink(document2);
      const facets = link ? facetsFromHref(link.getAttribute("href")) : {};
      FACET_KEYS.forEach((f) => {
        if (facets[f]) rows.push([f, facets[f].join(", ")]);
      });
      if (rows.length === 2) {
        console.warn(`[story-rail] ${railId}: no model filter on the page; dropped`);
        element.remove();
        return;
      }
      if (rail.feed) rows.splice(1, 0, ["index", mediaFeedUrl(locale)]);
      if (rail.limit) rows.push(["limit", rail.limit]);
      if (own) {
        const target2 = new URL(own.getAttribute("href"), "https://www.skoda-storyboard.com");
        const qs = new URLSearchParams();
        FACET_KEYS.forEach((f) => (facets[f] || []).forEach((v) => qs.append(`filter[${f}][]`, v)));
        viewAll = document2.createElement("a");
        viewAll.setAttribute("href", `${target2.origin}${target2.pathname}?${qs.toString().replace(/%5B/g, "[").replace(/%5D/g, "]")}`);
        viewAll.textContent = clean2(own.textContent) || "All";
        rows.push(["viewall", viewAll]);
      }
    }
    const h3 = document2.createElement("h3");
    h3.textContent = headingText;
    h3.setAttribute("data-model-key", railId);
    const out = [h3];
    if (subText) {
      const p = document2.createElement("p");
      p.textContent = subText;
      out.push(p);
    }
    out.push(WebImporter.DOMUtils.createTable(rows, document2));
    element.replaceWith(...out);
  }

  // transformers/skoda-model-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        // Site header / nav / mega-menu / language switcher / search overlay chrome
        "header.header",
        ".site-header",
        ".mega-menu",
        ".megamenu",
        ".language-switcher",
        ".lang-switch",
        ".search-form-wrap",
        // verified: global search bar wrapper
        ".search-form",
        // Footer chrome (also carries the .social / .social-container / .social-links strip)
        "footer.footer",
        ".site-footer",
        ".footer-mediaroom",
        // Cookie / consent (OneTrust) — verified ids/classes + defensive patterns
        "#onetrust-consent-sdk",
        "#onetrust-banner-sdk",
        "#onetrust-pc-sdk",
        ".onetrust-pc-dark-filter",
        ".ot-sdk-container",
        "#ot-sdk-btn",
        // verified: floating "Manage Cookies" settings button
        ".ot-sdk-show-settings",
        ".optanon-show-settings",
        '[id*="cookie" i]',
        '[class*="cookie" i]',
        '[class*="consent" i]',
        // Floating affordances — verified: .scroll-top (scroll-to-top). The
        // .social-share/.media-cart-flyout/.share-bar names do not exist here but
        // are kept as harmless defensive no-ops for reuse on sibling model pages.
        ".scroll-top",
        // SiteOrigin spacer widget (Peaq/Epiq: an empty padding div before the description)
        ".so-panel.widget_skoda-offset",
        ".social-share",
        ".media-cart-flyout",
        ".share-bar",
        // Chrome resource elements (svg sprite/defs, external stylesheet link).
        // NOTE: script/style/noscript = 0 on this page; svg = 0. Left as defensive
        // no-ops. `iframe`/`link` are NOT blanket-removed here — Vimeo iframes are
        // video-rail content; only the cookie CSS <link> is dropped.
        "svg symbol",
        "svg defs",
        'link[rel="stylesheet"]',
        "link"
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
    }
  }

  // transformers/skoda-model-sections.js
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
  function transform2(hookName, element, payload) {
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

  // transformers/skoda-metadata.js
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
  var CATEGORY_TEMPLATES = /* @__PURE__ */ new Set(["story", "press_release"]);
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
        if (FACETS.includes(taxonomy) && slug && !/^\d+$/.test(slug)) add(taxonomy, slug);
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
    if (hookName !== TransformHook2.afterTransform) return;
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
    if (overrides.presskit) meta.presskit = overrides.presskit;
    if (category) meta.category = category;
    const categories = CATEGORY_TEMPLATES.has(template) ? extractCategories(document2) : [];
    if (categories.length) meta.categories = categories.join(", ");
    const allTags = [.../* @__PURE__ */ new Set([...derivedTags, ...splitList(overrides.tags)])];
    if (allTags.length) meta.tags = allTags.join(", ");
    FACETS.forEach((f) => {
      const merged = [.../* @__PURE__ */ new Set([...byFacet[f] || [], ...splitList(overrides[f])])];
      if (merged.length) meta[f] = merged.join(", ");
    });
    const block = WebImporter.Blocks.getMetadataBlock(document2, meta);
    element.append(block);
  }

  // transformers/skoda-links.js
  var TransformHook3 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var SOURCE_ORIGIN = "https://www.skoda-storyboard.com";
  var SOURCE_HOST = /^(?:https?:)?\/\/(?:www\.)?skoda-storyboard\.com(?=[/?#]|$)/i;
  var DEMO_PATHS = [
    "/cs/category/e-mobilita-cs",
    "/cs/e-mobilita-cs/poznejte-peaq-snadne-a-pohodlne-ovladani",
    "/cs/e-mobilita-cs/skoda-epiq-nove-obleka-efektni-soupravu-sportline",
    "/cs/e-mobilita-cs/skoda-epiq-si-vas-ziska-za-par-sekund",
    "/cs/e-mobilita-cs/skoda-peaq-si-vas-ziska-behem-chvilky",
    "/cs/tiskove-zpravy",
    "/de/emobilitat-de/skoda-epiq-will-win-you-over-in-just-a-few-seconds",
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
    "/en/emobility/before-an-electric-car-starts-up-for-the-first-time",
    "/en/emobility/big-possibilities-in-a-small-package-the-new-skoda-epiq",
    "/en/emobility/camouflage-to-get-you-hooked",
    "/en/emobility/coffee-on-electric-wheels-elroq-and-enyaq-serving-coffee",
    "/en/emobility/come-and-play-skoda-is-heading-to-milan",
    "/en/emobility/designers-on-the-peaq-its-modern-durable-and-practical",
    "/en/emobility/discover-the-countryside-around-zell-am-see",
    "/en/emobility/electrifying-the-bear-driving-the-skoda-kodiaq-iv",
    "/en/emobility/elroq-rs-in-a-robe-unveiling-the-secret-of-matte-paint",
    "/en/emobility/enyaq-and-elroq-now-double-as-gaming-consoles-and-thats-not-all",
    "/en/emobility/enyaq-coupe-respectline-a-celebration-of-uniqueness",
    "/en/emobility/enyaq-rs-race-rally-technology-plus-sustainability",
    "/en/emobility/even-opening-the-door-is-an-experience-says-the-designer-of-the-peaq-suv",
    "/en/emobility/how-the-versatile-skoda-peaq-conquered-a-mountain-peak",
    "/en/emobility/how-was-the-elroq-made-not-in-the-usual-way",
    "/en/emobility/make-use-of-the-frunk-unlock-with-your-phone-new-enhancements-for-elroq-and-enyaq",
    "/en/emobility/meet-peaq-safe-and-comfortable",
    "/en/emobility/meet-the-peaq-a-large-suv-with-outstanding-aerodynamics",
    "/en/emobility/meet-the-peaq-comfort-just-like-at-home",
    "/en/emobility/meet-the-peaq-intuitive-and-comfortable-controls",
    "/en/emobility/meet-the-peaq-spacious-inside-and-out",
    "/en/emobility/modelling-clay-yoga-simply-epiq-skoda-returns-to-milan",
    "/en/emobility/peaq-enters-production-sharing-the-line-with-the-octavia",
    "/en/emobility/peaq-sets-a-record-from-the-heart-of-europe-to-the-sea-without-recharging",
    "/en/emobility/practical-fun-stylish-5-reasons-to-choose-the-epiq",
    "/en/emobility/skoda-elroq-and-a-happy-family",
    "/en/emobility/skoda-elroq-premiere-light-cube-camera-action",
    "/en/emobility/skoda-enyaq-coupe-iv-will-get-you-in-60-seconds",
    "/en/emobility/skoda-epiq-now-dresses-up-in-striking-sportline-trim",
    "/en/emobility/skoda-epiq-will-win-you-over-in-just-a-few-seconds",
    "/en/emobility/skoda-peaq-unparalleled-space-and-comfort",
    "/en/emobility/spacious-comfortable-and-striking-five-reasons-to-want-the-skoda-peaq",
    "/en/emobility/sunset-over-the-mountains-the-story-behind-the-camouflage-for-the-skoda-peaq",
    "/en/emobility/teaser",
    "/en/emobility/the-little-prince-van-gogh-and-lavender-scent",
    "/en/emobility/the-skoda-peaq-will-win-you-over-fast",
    "/en/emobility/this-is-epiq-a-behind-the-scenes-look-at-the-premiere",
    "/en/emobility/watch-the-world-premiere-of-the-skoda-epiq-ev-live",
    "/en/emobility/whats-behind-epiq-design",
    "/en/images",
    "/en/lifestyle/13-countries-over-19000-kilometers-the-kylaq-traveled-from-pune-to-prague",
    "/en/lifestyle/a-journey-you-will-never-forget-the-monumental-route-napoleon",
    "/en/lifestyle/an-epic-start-to-the-tour-de-france-skoda-got-barcelona-moving",
    "/en/lifestyle/chainsaws-and-sparklers-discover-the-traditions-of-rally-fans",
    "/en/lifestyle/exploring-the-magnificent-alps-in-rs-models",
    "/en/lifestyle/feeling-the-heat-skoda-cars-keep-both-passengers-and-their-snacks-cool",
    "/en/lifestyle/from-unwanted-graffiti-to-bold-support-for-womens-cycling",
    "/en/lifestyle/how-to-take-the-best-picture-of-a-car-follow-a-pros-advice",
    "/en/lifestyle/into-the-freezing-water-with-the-iceman",
    "/en/lifestyle/la-dolce-vita-explore-the-surroundings-of-lake-como",
    "/en/lifestyle/ouninpohja-finlands-roller-coaster-stage",
    "/en/lifestyle/people/the-story-of-olive-oil-from-andalusia-to-the-czech-republic",
    "/en/lifestyle/road-trip-in-asturias-from-beaches-to-high-peaks",
    "/en/lifestyle/rs-four-ways-which-one-will-you-choose",
    "/en/lifestyle/skodas-smarter-wireless-charging-goes-beyond-phones",
    "/en/lifestyle/sports/cycling/miss-peaches-on-the-road-enduro-in-barcelona",
    "/en/lifestyle/sports/cycling/miss-peaches-on-the-road-skatepark-tricks-in-marseille",
    "/en/lifestyle/sports/cycling/miss-peaches-on-the-road-whitewater-in-switzerland",
    "/en/lifestyle/sports/hockey/this-years-skoda-ice-hockey-team-line-up",
    "/en/lifestyle/sports/miss-peaches-on-the-road-downhill-biking-in-champery-switzerland",
    "/en/lifestyle/sports/miss-peaches-on-the-road-surfing-in-san-sebastian",
    "/en/lifestyle/the-best-of-storyboard-pucks-wheels-seconds",
    "/en/lifestyle/this-years-skoda-auto-hockey-team-line-up",
    "/en/lifestyle/what-you-learn-on-the-circuit-can-save-you-on-the-road",
    "/en/media-cart",
    "/en/media-room",
    "/en/models/discovering-the-full-power-of-a-skoda-4x4",
    "/en/models/enyaq-rs-race-an-electric-coupe-on-steroids",
    "/en/models/first-glimpse-of-skodas-new-suv",
    "/en/models/kamiq/first-sketches-of-the-skoda-kamiq",
    "/en/models/kamiq/skodas-new-suv-christened-the-kamiq",
    "/en/models/kamiq/the-skoda-kamiq-your-travel-buddy-for-urban-adventuring",
    "/en/models/karoq/first-sketches-of-the-new-skoda-karoq",
    "/en/models/meet-the-skoda-kodiaq-sportline",
    "/en/models/millionth-skoda-suv",
    "/en/models/number-of-the-month-140",
    "/en/models/scala/number-of-the-month-40",
    "/en/models/scala/welcome-the-skoda-scala",
    "/en/models/skoda-4x4-your-best-bet-in-the-snow",
    "/en/models/skoda-elroq-through-designers-eyes",
    "/en/models/skoda-world-premieres-in-geneva",
    "/en/models/sporty-and-stylish-the-kodiaq-gets-the-rs-treatment",
    "/en/models/superb/sporty-flair-for-every-day-the-superb-sportline-will-get-you",
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
    "/en/press-kits/design-and-technology-update-for-the-skoda-fabia",
    "/en/press-kits/enyaq-world-premiere",
    "/en/press-kits/lets-explore-albania-press-kit",
    "/en/press-kits/new-skoda-enyaq-press-kit-2",
    "/en/press-kits/press-kit-skoda-at-the-iaa-2019",
    "/en/press-kits/skoda-at-the-2018-geneva-motor-show",
    "/en/press-kits/skoda-at-the-2018-paris-motor-show",
    "/en/press-kits/skoda-auto-at-auto-shanghai-2019-press-kit",
    "/en/press-kits/skoda-citigo-iv-skoda-superb-iv-press-kit",
    "/en/press-kits/skoda-elroq-press-kit",
    "/en/press-kits/skoda-elroq-press-kit-2",
    "/en/press-kits/skoda-enyaq-iv-press-kit-2",
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
    "/en/press-kits/skoda-fabia-covered-drive-press-kit",
    "/en/press-kits/skoda-fabia-monte-carlo-press-kit",
    "/en/press-kits/skoda-fabia-press-kit",
    "/en/press-kits/skoda-iv-press-kit",
    "/en/press-kits/skoda-kamiq-gt-press-kit",
    "/en/press-kits/skoda-kamiq-press-kit",
    "/en/press-kits/skoda-karoq-media-launch-press-kit",
    "/en/press-kits/skoda-kodiaq-press-kit",
    "/en/press-kits/skoda-kodiaq-rs-press-kit",
    "/en/press-kits/skoda-octavia-media-launch-press-kit",
    "/en/press-kits/skoda-octavia-press-kit",
    "/en/press-kits/skoda-octavia-press-kit-2",
    "/en/press-kits/skoda-octavia-rs-245-sporty-spacious-practical-family-sportster-delivers-245-ps",
    "/en/press-kits/skoda-octavia-rs-and-octavia-scout-press-kit",
    "/en/press-kits/skoda-octavia-rs-skoda-octavia-combi-rs-press-kit",
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
    "/en/press-kits/skoda-scala",
    "/en/press-kits/skoda-scala-and-skoda-kamiq-media-launch-press-kit",
    "/en/press-kits/skoda-scala-and-skoda-kamiq-press-kit",
    "/en/press-kits/skoda-superb-press-kit",
    "/en/press-kits/skoda-vision-o-press-kit",
    "/en/press-kits/the-all-electric-skoda-elroq-breaking-new-ground-in-the-compactsuv-segment-with-a-covered-design",
    "/en/press-kits/the-all-new-skoda-kodiaq-press-kit",
    "/en/press-kits/the-all-new-skoda-superb-press-kit",
    "/en/press-kits/the-all-skoda-superb-press-kit-2",
    "/en/press-kits/the-enyaq-rs-race-a-new-motorsport-concept-with-sustainable-ideas-for-production-models",
    "/en/press-kits/the-new-skoda-enyaq-coupe-iv-covered-drive-press-kit",
    "/en/press-kits/the-new-skoda-enyaq-coupe-iv-media-launch-press-kit",
    "/en/press-kits/the-new-skoda-enyaq-coupe-iv-world-premiere-press-kit",
    "/en/press-kits/the-new-skoda-enyaq-rs-iv-media-launch-press-kit",
    "/en/press-kits/the-new-skoda-fabia-media-launch-press-kit",
    "/en/press-kits/the-new-skoda-karoq-world-premiere-press-kit",
    "/en/press-kits/the-new-skoda-kodiaq-dynamic-press-launch-press-kit",
    "/en/press-kits/the-new-skoda-kodiaq-press-kit",
    "/en/press-releases/2026-iihf-ice-hockey-world-championship-roman-josi-wins-most-valuable-player-trophy-created-by-skoda-design",
    "/en/press-releases/30-years-since-the-foundation-stone-was-laid-m13-a-key-pillar-of-skodas-production",
    "/en/press-releases/936-km-without-recharging-skoda-peaq-sets-range-record-for-seven-seater-electric-suvs",
    "/en/press-releases/camp-mode-in-the-myskoda-app-comfortable-overnight-stays-in-electric-vehicles",
    "/en/press-releases/lorena-wiebes-receives-skoda-design-trophy-after-winning-tour-de-france-femmes-avec-zwift-points-classification",
    "/en/press-releases/newsletter-for-employees-and-residents-living-near-the-skoda-auto-kvasiny-plant-1-2026",
    "/en/press-releases/newsletter-for-employees-and-residents-living-near-the-skoda-auto-kvasiny-plant-3-2026",
    "/en/press-releases/newsletter-for-employees-and-residents-living-near-the-skoda-auto-vrchlabi-plant-1-2026",
    "/en/press-releases/newsletter-for-employees-and-residents-living-near-the-skoda-auto-vrchlabi-plant-3-2026",
    "/en/press-releases/paris-motor-show-2018-two-skoda-presentations-live-online",
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
    "/en/press-releases/world-premiere-of-the-all-new-skoda-superb-pictures-on-the-skoda-storyboard",
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
    "/en/simply-clever/do-you-have-a-qr-code-in-your-boot-it-will-show-you-all-the-smart-features",
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
    "/en/skoda-world/can-you-recognise-skoda-models-from-their-silhouettes",
    "/en/skoda-world/cars-that-are-safe-for-pedestrians-as-well",
    "/en/skoda-world/children-painted-cars-for-medical-clowns",
    "/en/skoda-world/clever-luggage-solutions-for-your-boot",
    "/en/skoda-world/coca-cola-and-skoda-more-than-30-years-together",
    "/en/skoda-world/come-cheer-and-sing-along-meet-the-karaoke-car",
    "/en/skoda-world/drive-like-a-champion-on-tarmac-gravel-or-snow",
    "/en/skoda-world/enhanced-superb-iv-delivers-200-kw-of-power",
    "/en/skoda-world/enter-the-world-of-skoda-in-frankfurt",
    "/en/skoda-world/explore-the-new-skoda-models-in-mixed-reality",
    "/en/skoda-world/first-sketches-of-the-new-kodiaq",
    "/en/skoda-world/get-your-car-ready-for-summer-with-skoda-accessories",
    "/en/skoda-world/here-it-comes-the-skoda-elroq-a-compact-electric-suv",
    "/en/skoda-world/how-the-skoda-octavia-reached-365-km-h",
    "/en/skoda-world/how-to-get-a-kodiaq-into-a-metro-station",
    "/en/skoda-world/innovation-and-technology/enyaq-rs-race-an-electric-drive-with-motorsport-dna",
    "/en/skoda-world/kamiq-karoq-kodiaq-great-choices-for-the-city-and-countryside",
    "/en/skoda-world/king-of-space-and-long-distance-travel-skoda-superb-celebrates-25-years",
    "/en/skoda-world/klaus-drives-on-the-ice-with-a-rally-champion",
    "/en/skoda-world/legend-chris-froome-takes-you-behind-the-scenes-of-the-tour-de-france",
    "/en/skoda-world/life-with-a-plug-in-hybrid-a-versatile-companion",
    "/en/skoda-world/making-driving-easier-how-cruise-control-works",
    "/en/skoda-world/octavia-arrives-with-a-new-full-hybrid-powertrain",
    "/en/skoda-world/oliver-solberg-behind-the-wheel-of-the-new-octavia-rs",
    "/en/skoda-world/peaq-inside-a-designblok",
    "/en/skoda-world/quiz-can-you-recognise-skoda-models-by-their-details",
    "/en/skoda-world/rally-champion-and-the-unique-skoda-fabia-motorsport-edition",
    "/en/skoda-world/rally-champion-fuel-efficiency-record-holder",
    "/en/skoda-world/rally-champion-presents-the-rs-family",
    "/en/skoda-world/rs-models-skodas-true-sporting-spirit",
    "/en/skoda-world/skoda-classic-tour-through-the-eyes-of-a-spectator",
    "/en/skoda-world/skoda-kodiaq-will-get-you-in-60-seconds",
    "/en/skoda-world/skoda-octavia-rs-how-it-has-evolved",
    "/en/skoda-world/sliding-into-the-record-books",
    "/en/skoda-world/sportline-models-dynamic-elegance-for-every-day",
    "/en/skoda-world/the-approach-of-the-keyless-age",
    "/en/skoda-world/the-immortal-octavia-see-what-it-looks-like-after-one-million-kilometres",
    "/en/skoda-world/the-new-skoda-octavia-seen-through-its-designers-eyes",
    "/en/skoda-world/the-new-skoda-slavia-features-a-refreshed-look-and-an-exclusive-colour",
    "/en/skoda-world/the-skoda-stand-in-paris-360-tour",
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
    "/en/videos",
    "/sk/emobilita-sk/skoda-epiq-si-vas-ziska-za-par-sekund",
    "/sr/emobilnost-sr/skoda-epiq-will-win-you-over-in-just-a-few-seconds"
  ];
  var DEMO_ALIASES = {
    "/en/skoda-world/innovation-and-technology/explore-the-new-skoda-models-in-mixed-reality": "/en/skoda-world/explore-the-new-skoda-models-in-mixed-reality"
  };
  var LIVE_ONLY_PATHS = [
    "/cs/category/e-mobilita-cs",
    "/cs/e-mobilita-cs/poznejte-peaq-snadne-a-pohodlne-ovladani",
    "/cs/e-mobilita-cs/skoda-epiq-nove-obleka-efektni-soupravu-sportline",
    "/cs/e-mobilita-cs/skoda-epiq-si-vas-ziska-za-par-sekund",
    "/cs/e-mobilita-cs/skoda-peaq-si-vas-ziska-behem-chvilky",
    "/cs/tiskove-zpravy",
    "/de/emobilitat-de/skoda-epiq-will-win-you-over-in-just-a-few-seconds",
    "/en/emobility/a-true-czech-from-spain",
    "/en/emobility/before-an-electric-car-starts-up-for-the-first-time",
    "/en/emobility/big-possibilities-in-a-small-package-the-new-skoda-epiq",
    "/en/emobility/come-and-play-skoda-is-heading-to-milan",
    "/en/emobility/discover-the-countryside-around-zell-am-see",
    "/en/emobility/electrifying-the-bear-driving-the-skoda-kodiaq-iv",
    "/en/emobility/enyaq-coupe-respectline-a-celebration-of-uniqueness",
    "/en/emobility/enyaq-rs-race-rally-technology-plus-sustainability",
    "/en/emobility/meet-peaq-safe-and-comfortable",
    "/en/emobility/meet-the-peaq-a-large-suv-with-outstanding-aerodynamics",
    "/en/emobility/meet-the-peaq-intuitive-and-comfortable-controls",
    "/en/emobility/modelling-clay-yoga-simply-epiq-skoda-returns-to-milan",
    "/en/emobility/skoda-enyaq-coupe-iv-will-get-you-in-60-seconds",
    "/en/emobility/teaser",
    "/en/emobility/the-little-prince-van-gogh-and-lavender-scent",
    "/en/emobility/the-skoda-peaq-will-win-you-over-fast",
    "/en/emobility/this-is-epiq-a-behind-the-scenes-look-at-the-premiere",
    "/en/emobility/watch-the-world-premiere-of-the-skoda-epiq-ev-live",
    "/en/emobility/whats-behind-epiq-design",
    "/en/lifestyle/a-journey-you-will-never-forget-the-monumental-route-napoleon",
    "/en/lifestyle/exploring-the-magnificent-alps-in-rs-models",
    "/en/lifestyle/feeling-the-heat-skoda-cars-keep-both-passengers-and-their-snacks-cool",
    "/en/lifestyle/how-to-take-the-best-picture-of-a-car-follow-a-pros-advice",
    "/en/lifestyle/into-the-freezing-water-with-the-iceman",
    "/en/lifestyle/people/the-story-of-olive-oil-from-andalusia-to-the-czech-republic",
    "/en/lifestyle/road-trip-in-asturias-from-beaches-to-high-peaks",
    "/en/lifestyle/sports/cycling/miss-peaches-on-the-road-enduro-in-barcelona",
    "/en/lifestyle/sports/cycling/miss-peaches-on-the-road-skatepark-tricks-in-marseille",
    "/en/lifestyle/sports/cycling/miss-peaches-on-the-road-whitewater-in-switzerland",
    "/en/lifestyle/sports/hockey/this-years-skoda-ice-hockey-team-line-up",
    "/en/lifestyle/sports/miss-peaches-on-the-road-downhill-biking-in-champery-switzerland",
    "/en/lifestyle/sports/miss-peaches-on-the-road-surfing-in-san-sebastian",
    "/en/lifestyle/the-best-of-storyboard-pucks-wheels-seconds",
    "/en/lifestyle/this-years-skoda-auto-hockey-team-line-up",
    "/en/media-cart",
    "/en/media-room",
    "/en/models/discovering-the-full-power-of-a-skoda-4x4",
    "/en/models/enyaq-rs-race-an-electric-coupe-on-steroids",
    "/en/models/first-glimpse-of-skodas-new-suv",
    "/en/models/kamiq/first-sketches-of-the-skoda-kamiq",
    "/en/models/kamiq/skodas-new-suv-christened-the-kamiq",
    "/en/models/kamiq/the-skoda-kamiq-your-travel-buddy-for-urban-adventuring",
    "/en/models/karoq/first-sketches-of-the-new-skoda-karoq",
    "/en/models/meet-the-skoda-kodiaq-sportline",
    "/en/models/millionth-skoda-suv",
    "/en/models/number-of-the-month-140",
    "/en/models/scala/number-of-the-month-40",
    "/en/models/scala/welcome-the-skoda-scala",
    "/en/models/skoda-4x4-your-best-bet-in-the-snow",
    "/en/models/skoda-world-premieres-in-geneva",
    "/en/models/sporty-and-stylish-the-kodiaq-gets-the-rs-treatment",
    "/en/models/superb/sporty-flair-for-every-day-the-superb-sportline-will-get-you",
    "/en/news",
    "/en/press-kits",
    "/en/press-kits/design-and-technology-update-for-the-skoda-fabia",
    "/en/press-kits/enyaq-world-premiere",
    "/en/press-kits/skoda-at-the-2018-geneva-motor-show",
    "/en/press-kits/skoda-at-the-2018-paris-motor-show",
    "/en/press-kits/skoda-auto-at-auto-shanghai-2019-press-kit",
    "/en/press-kits/skoda-citigo-iv-skoda-superb-iv-press-kit",
    "/en/press-kits/skoda-enyaq-iv-press-kit-2",
    "/en/press-kits/skoda-fabia-covered-drive-press-kit",
    "/en/press-kits/skoda-fabia-monte-carlo-press-kit",
    "/en/press-kits/skoda-fabia-press-kit",
    "/en/press-kits/skoda-iv-press-kit",
    "/en/press-kits/skoda-kamiq-gt-press-kit",
    "/en/press-kits/skoda-kamiq-press-kit",
    "/en/press-kits/skoda-karoq-media-launch-press-kit",
    "/en/press-kits/skoda-kodiaq-press-kit",
    "/en/press-kits/skoda-kodiaq-rs-press-kit",
    "/en/press-kits/skoda-octavia-rs-skoda-octavia-combi-rs-press-kit",
    "/en/press-kits/skoda-scala",
    "/en/press-kits/skoda-scala-and-skoda-kamiq-media-launch-press-kit",
    "/en/press-kits/skoda-scala-and-skoda-kamiq-press-kit",
    "/en/press-kits/skoda-superb-press-kit",
    "/en/press-kits/the-all-skoda-superb-press-kit-2",
    "/en/press-kits/the-new-skoda-enyaq-coupe-iv-covered-drive-press-kit",
    "/en/press-kits/the-new-skoda-enyaq-coupe-iv-media-launch-press-kit",
    "/en/press-kits/the-new-skoda-enyaq-coupe-iv-world-premiere-press-kit",
    "/en/press-kits/the-new-skoda-enyaq-rs-iv-media-launch-press-kit",
    "/en/press-kits/the-new-skoda-fabia-media-launch-press-kit",
    "/en/press-kits/the-new-skoda-karoq-world-premiere-press-kit",
    "/en/press-kits/the-new-skoda-kodiaq-dynamic-press-launch-press-kit",
    "/en/press-kits/the-new-skoda-kodiaq-press-kit",
    "/en/press-releases/2026-iihf-ice-hockey-world-championship-roman-josi-wins-most-valuable-player-trophy-created-by-skoda-design",
    "/en/press-releases/camp-mode-in-the-myskoda-app-comfortable-overnight-stays-in-electric-vehicles",
    "/en/press-releases/lorena-wiebes-receives-skoda-design-trophy-after-winning-tour-de-france-femmes-avec-zwift-points-classification",
    "/en/press-releases/newsletter-for-employees-and-residents-living-near-the-skoda-auto-kvasiny-plant-1-2026",
    "/en/press-releases/newsletter-for-employees-and-residents-living-near-the-skoda-auto-kvasiny-plant-3-2026",
    "/en/press-releases/newsletter-for-employees-and-residents-living-near-the-skoda-auto-vrchlabi-plant-1-2026",
    "/en/press-releases/newsletter-for-employees-and-residents-living-near-the-skoda-auto-vrchlabi-plant-3-2026",
    "/en/press-releases/paris-motor-show-2018-two-skoda-presentations-live-online",
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
    "/en/press-releases/world-premiere-of-the-all-new-skoda-superb-pictures-on-the-skoda-storyboard",
    "/en/search",
    "/en/series-2",
    "/en/simply-clever/do-you-have-a-qr-code-in-your-boot-it-will-show-you-all-the-smart-features",
    "/en/skoda-model/enyaq-iv-2/enyaq-coupe-iv",
    "/en/skoda-world/125-years-of-racing-history-in-one-place-come-visit-the-museum",
    "/en/skoda-world/can-you-recognise-skoda-models-from-their-silhouettes",
    "/en/skoda-world/cars-that-are-safe-for-pedestrians-as-well",
    "/en/skoda-world/children-painted-cars-for-medical-clowns",
    "/en/skoda-world/clever-luggage-solutions-for-your-boot",
    "/en/skoda-world/coca-cola-and-skoda-more-than-30-years-together",
    "/en/skoda-world/drive-like-a-champion-on-tarmac-gravel-or-snow",
    "/en/skoda-world/enhanced-superb-iv-delivers-200-kw-of-power",
    "/en/skoda-world/enter-the-world-of-skoda-in-frankfurt",
    "/en/skoda-world/first-sketches-of-the-new-kodiaq",
    "/en/skoda-world/get-your-car-ready-for-summer-with-skoda-accessories",
    "/en/skoda-world/here-it-comes-the-skoda-elroq-a-compact-electric-suv",
    "/en/skoda-world/how-to-get-a-kodiaq-into-a-metro-station",
    "/en/skoda-world/innovation-and-technology/enyaq-rs-race-an-electric-drive-with-motorsport-dna",
    "/en/skoda-world/kamiq-karoq-kodiaq-great-choices-for-the-city-and-countryside",
    "/en/skoda-world/king-of-space-and-long-distance-travel-skoda-superb-celebrates-25-years",
    "/en/skoda-world/klaus-drives-on-the-ice-with-a-rally-champion",
    "/en/skoda-world/life-with-a-plug-in-hybrid-a-versatile-companion",
    "/en/skoda-world/octavia-arrives-with-a-new-full-hybrid-powertrain",
    "/en/skoda-world/peaq-inside-a-designblok",
    "/en/skoda-world/rally-champion-and-the-unique-skoda-fabia-motorsport-edition",
    "/en/skoda-world/rally-champion-fuel-efficiency-record-holder",
    "/en/skoda-world/rally-champion-presents-the-rs-family",
    "/en/skoda-world/rs-models-skodas-true-sporting-spirit",
    "/en/skoda-world/skoda-classic-tour-through-the-eyes-of-a-spectator",
    "/en/skoda-world/skoda-kodiaq-will-get-you-in-60-seconds",
    "/en/skoda-world/skoda-octavia-rs-how-it-has-evolved",
    "/en/skoda-world/sliding-into-the-record-books",
    "/en/skoda-world/the-approach-of-the-keyless-age",
    "/en/skoda-world/the-new-skoda-octavia-seen-through-its-designers-eyes",
    "/en/skoda-world/the-skoda-stand-in-paris-360-tour",
    "/en/skoda-world/what-was-racing-like-half-a-century-ago-skoda-120-s-rallye-delights-a-champion",
    "/sk/emobilita-sk/skoda-epiq-si-vas-ziska-za-par-sekund",
    "/sr/emobilnost-sr/skoda-epiq-will-win-you-over-in-just-a-few-seconds"
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
    let target2 = edsPath(cut === -1 ? rest : rest.slice(0, cut));
    target2 = DEMO_ALIASES[target2] || target2;
    if (LIVE_ONLY.has(target2) && /[?&]filter(?:\[|%5B)(?!search(?:\]|%5D))/i.test(tail.split("#")[0])) {
      return null;
    }
    return ALLOWED.has(target2) ? `${target2}${tail}` : null;
  }
  var NEWS_LISTINGS = {
    en: "news",
    cs: "tiskove-zpravy",
    de: "pressemitteilungen",
    sk: "tlacove-spravy",
    sr: "news"
  };
  var TAG_FILTER = new RegExp("^(?:(?:https?:)?//(?:www\\.)?skoda-storyboard\\.com)?/([a-z]{2})/([a-z0-9-]+)/?\\?filter(?:\\[|%5B)([a-z0-9-]+)(?:\\]|%5D)(?:\\[\\]|%5B%5D)=([^&#]+)$", "i");
  function tagPageHref(href) {
    const m = href.match(TAG_FILTER);
    if (!m) return null;
    const locale = m[1].toLowerCase();
    if (NEWS_LISTINGS[locale] !== m[2].toLowerCase()) return null;
    const slug = edsPath(`/${m[4]}`).slice(1);
    const exact = `/${locale}/tag/${m[3].toLowerCase()}/${slug}`;
    if (ALLOWED.has(exact)) return exact;
    const bySlug = DEMO_PATHS.filter((p) => p.startsWith(`/${locale}/tag/`) && p.endsWith(`/${slug}`) && p.split("/").length === 5);
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
  function transform4(hookName, element, payload) {
    if (hookName !== TransformHook3.afterTransform) return;
    element.querySelectorAll("a[href]").forEach((a) => {
      let href = a.getAttribute("href").replace(/(?:\s|%20)+$/i, "");
      if (/#s_[ac]id=/.test(href)) href = href.split("#s_aid=")[0].split("#s_cid=")[0];
      href = schemelessSource(href);
      if (href.startsWith("/direct-download/")) href = `${SOURCE_ORIGIN}${href}`;
      else href = !isRailViewAll(a) && tagPageHref(href) || rewriteHref(href) || href;
      if (href !== a.getAttribute("href")) a.setAttribute("href", href);
    });
  }

  // transformers/skoda-nbsp.js
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

  // transformers/skoda-images.js
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
    const target2 = linkedImage ? link : img;
    const afterRange = document2.createRange();
    afterRange.setStartAfter(target2);
    afterRange.setEnd(paragraph, paragraph.childNodes.length);
    const after = paragraph.cloneNode(false);
    after.append(afterRange.extractContents());
    const beforeRange = document2.createRange();
    beforeRange.selectNodeContents(paragraph);
    beforeRange.setEndBefore(target2);
    const before = paragraph.cloneNode(false);
    before.append(beforeRange.extractContents());
    const imageNode = imageContainer(img, document2, linkedImage ? link : null);
    const image = withCaption(imageNode, caption, document2);
    paragraph.replaceWith(...[before, image, after].filter(hasContent));
  }
  var text = (value) => (value || "").replace(/\s+/g, " ").trim();
  function linkedImageAlt(img, root) {
    var _a;
    const link = img.closest("a");
    if (!link || link.querySelectorAll("img").length !== 1 || text(link.textContent)) return "";
    const caption = editorialCaption(img) || editorialCaption(img.closest("[data-caption]"));
    const titled = [link.getAttribute("title"), img.getAttribute("title")].map(text).find(Boolean);
    const heading = [...root.querySelectorAll("h1, h2, h3, h4, h5, h6")].filter(
      (h) => h.compareDocumentPosition(img) & 4
      /* Node.DOCUMENT_POSITION_FOLLOWING */
    ).map((h) => text(h.textContent)).filter(Boolean).pop();
    return text(caption) || titled || heading || text((_a = root.ownerDocument.querySelector("h1")) == null ? void 0 : _a.textContent);
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
      const target2 = linkedImage ? link : img;
      const marker = document2.createComment("image");
      target2.replaceWith(marker);
      const imageNode = imageContainer(img, document2, linkedImage ? link : null);
      marker.replaceWith(withCaption(imageNode, caption, document2));
    });
  }
  function transform6(hookName, element, payload) {
    if (typeof hookName !== "string") {
      throw new TypeError("skoda-images: expected a string hookName; use imagesTransformer('afterTransform', main, payload).");
    }
    if (hookName !== "afterTransform") return;
    normalizeImages(element, (payload == null ? void 0 : payload.document) || element.ownerDocument);
  }

  // import-model-page.js
  var parsers = {
    hero: parse,
    "key-facts": parse3,
    "spec-table": parse4,
    "story-rail": parse5,
    "in-page-nav": parse2
  };
  var PAGE_TEMPLATE = {
    name: "model-page",
    description: "\u0160koda model page (skoda_model CPT, 22 EN pages incl. derivatives). Hero Image (overlay) + section-link list + Model Description + Cards (key-facts) + Technical Data (Columns + PDF) + up to 6 index-driven Story Rails. Widgets located by class (ids are missing on some pages).",
    urls: ["https://www.skoda-storyboard.com/en/skoda-model/new-kodiaq/"],
    blocks: [
      { name: "hero", instances: ["article.skoda_model > .carousel"] },
      { name: "key-facts", instances: [".so-widget-ys-so-widget-highlights"] },
      { name: "spec-table", instances: [".so-widget-ys-so-widget-techdata"] },
      {
        name: "story-rail",
        instances: [
          "#derivatives .search-results-container",
          "#news .search-results-container",
          "#press-kits .search-results-container",
          "#stories .search-results-container",
          "#images .search-results-container",
          "#videos .search-results-container"
        ]
      },
      { name: "in-page-nav", instances: [".model-nav"] }
    ],
    sections: [
      { id: "section-1", name: "Hero", selector: ["article.skoda_model > .carousel"], style: null, blocks: ["hero"], defaultContent: [] },
      { id: "section-2", name: "Section nav", selector: [".model-nav"], style: null, blocks: ["in-page-nav"], defaultContent: [] },
      { id: "section-3", name: "Model Description", selector: [".so-panel.widget_sow-editor"], style: null, blocks: [], defaultContent: [".so-widget-sow-editor"] },
      { id: "section-4", name: "Key Facts", selector: [".so-panel.widget_ys-so-widget-highlights"], style: null, blocks: ["key-facts"], defaultContent: [] },
      { id: "section-5", name: "Technical Data", selector: [".so-panel.widget_ys-so-widget-techdata"], style: null, blocks: ["spec-table"], defaultContent: [] },
      { id: "section-6", name: "Bodywork / Derivatives", selector: ["#derivatives"], style: null, blocks: ["story-rail"], defaultContent: [] },
      { id: "section-7", name: "News", selector: ["#news"], style: null, blocks: ["story-rail"], defaultContent: [] },
      { id: "section-8", name: "Press Kits", selector: ["#press-kits"], style: null, blocks: ["story-rail"], defaultContent: [] },
      { id: "section-9", name: "Stories", selector: ["#stories"], style: null, blocks: ["story-rail"], defaultContent: [] },
      { id: "section-10", name: "Images", selector: ["#images"], style: null, blocks: ["story-rail"], defaultContent: [] },
      { id: "section-11", name: "Videos", selector: ["#videos"], style: null, blocks: ["story-rail"], defaultContent: [] }
    ]
  };
  var FACET_KEYS2 = ["model", "bodywork", "derivative"];
  function pageFacets(document2) {
    const link = document2.querySelector('a.search-results-header-link[href*="filter"]');
    const out = {};
    if (!link) return out;
    let query = "";
    try {
      query = new URL(link.getAttribute("href"), "https://www.skoda-storyboard.com").search;
    } catch (e) {
      return out;
    }
    new URLSearchParams(query).forEach((value, key) => {
      const m = key.match(/^filter\[([a-z0-9_-]+)\](?:\[\d*\])?$/i);
      const facet = m && m[1].toLowerCase();
      if (!facet || !FACET_KEYS2.includes(facet) || !value) return;
      out[facet] = [.../* @__PURE__ */ new Set([...out[facet] || [], value.toLowerCase()])];
    });
    return out;
  }
  var MODEL_CARD_IMAGES = {
    "new-superb": "https://cdn.skoda-storyboard.com/2023/12/header_superb_d05c278a.jpg",
    octavia: "https://cdn.skoda-storyboard.com/2024/03/octaviaFL-header_e0f394a0.jpg",
    epiq: "https://cdn.skoda-storyboard.com/2026/05/skoda-epiq-m70-01_1135a598.jpg",
    peaq: "https://cdn.skoda-storyboard.com/2026/06/Navrh-bez-nazvu-21_ec34da00.png",
    "new-fabia": "https://cdn.skoda-storyboard.com/2021/05/Header_New_FABIA.jpg",
    scala: "https://cdn.skoda-storyboard.com/2023/09/scala_header_34ad5f38.jpg",
    kamiq: "https://cdn.skoda-storyboard.com/2023/09/kamiq-header_d6fedb2b.jpg",
    "karoq-6": "https://cdn.skoda-storyboard.com/2017/07/33_SKODA_KAROQ.jpg",
    "enyaq-iv-2": "https://cdn.skoda-storyboard.com/2025/01/enyaq_fl_header_eb9109f9.jpg",
    "new-kodiaq": "https://cdn.skoda-storyboard.com/2023/11/Skoda_Kodiaq_header_04479753.png",
    elroq: "https://cdn.skoda-storyboard.com/2024/10/elroq_header_fede6794.jpg"
  };
  function modelCardImage(originalURL) {
    const slug = (new URL(originalURL).pathname.match(/^\/en\/skoda-model\/([^/]+)\/?$/) || [])[1];
    return slug && MODEL_CARD_IMAGES[slug] || null;
  }
  function metadataOverrides(facets) {
    const meta = { template: "skoda_model" };
    const tags = [];
    FACET_KEYS2.forEach((f) => {
      if (!facets[f]) return;
      meta[f] = facets[f].join(", ");
      tags.push(...facets[f]);
    });
    if (tags.length) meta.tags = [...new Set(tags)].join(", ");
    return meta;
  }
  function executeTransformers(transformers, hookName, element, payload, template) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template });
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
  var import_model_page_default = {
    // keep the source's glued non-breaking spaces (html2md would turn them into spaces)
    preprocess: ({ document: document2 }) => transform5("preprocess", document2.body, { document: document2 }),
    transform: (payload) => {
      const { document: document2, url, params } = payload;
      const main = document2.body;
      const metadata = metadataOverrides(pageFacets(document2));
      const cardImage = modelCardImage(params.originalURL);
      if (cardImage) metadata.image = cardImage;
      const template = __spreadProps(__spreadValues({}, PAGE_TEMPLATE), { metadata });
      const transformers = [transform, transform2, transform3, transform4];
      executeTransformers(transformers, "beforeTransform", main, payload, template);
      const pageBlocks = findBlocksOnPage(document2, template);
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
      main.querySelectorAll("[data-model-key]").forEach((el) => el.removeAttribute("data-model-key"));
      executeTransformers(transformers, "afterTransform", main, payload, template);
      WebImporter.rules.transformBackgroundImages(main, document2);
      transform6("afterTransform", main, payload);
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
  return __toCommonJS(import_model_page_exports);
})();
