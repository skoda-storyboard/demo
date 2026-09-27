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

  // tools/importer/import-model-page.js
  var import_model_page_exports = {};
  __export(import_model_page_exports, {
    default: () => import_model_page_default
  });

  // tools/importer/parsers/hero.js
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

  // tools/importer/parsers/in-page-nav.js
  var clean = (text) => String(text || "").replace(/\s+/g, " ").trim();
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

  // tools/importer/parsers/key-facts.js
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

  // tools/importer/parsers/spec-table.js
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

  // tools/importer/parsers/story-rail.js
  var RAILS = {
    derivatives: { template: "skoda_model", heading: "Bodywork / Derivatives" },
    news: { template: "press_release", heading: "News" },
    "press-kits": { template: "press_kit", heading: "Press Kits" },
    stories: { template: "story", heading: "Stories" },
    images: { template: "image", heading: "Images", limit: "20" },
    videos: { template: "video", heading: "Videos", limit: "20" }
  };
  var FACET_KEYS = ["model", "bodywork", "derivative"];
  var clean2 = (text) => String(text || "").replace(/\s+/g, " ").trim();
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
      rows.push(["path", segs.length > 1 ? `/en/skoda-model/${segs[0]}` : `/en/skoda-model/${segs[0]}/`]);
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
    const h2 = document2.createElement("h2");
    h2.textContent = headingText;
    h2.setAttribute("data-model-key", railId);
    const out = [h2];
    if (subText) {
      const p = document2.createElement("p");
      p.textContent = subText;
      out.push(p);
    }
    out.push(WebImporter.DOMUtils.createTable(rows, document2));
    element.replaceWith(...out);
  }

  // tools/importer/transformers/skoda-model-cleanup.js
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

  // tools/importer/transformers/skoda-metadata.js
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
    FACETS.forEach((f) => {
      const merged = [.../* @__PURE__ */ new Set([...byFacet[f] || [], ...splitList(overrides[f])])];
      if (merged.length) meta[f] = merged.join(", ");
    });
    const block = WebImporter.Blocks.getMetadataBlock(document2, meta);
    element.append(block);
  }

  // tools/importer/transformers/skoda-links.js
  var TransformHook3 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var SOURCE_ORIGIN = "https://www.skoda-storyboard.com";
  var SOURCE_HOST = /^(?:https?:)?\/\/(?:www\.)?skoda-storyboard\.com(?=[/?#]|$)/i;
  var DEMO_PATHS = [
    "/en",
    "/en/06a-115-1x",
    "/en/07-s-37a-992-junior",
    "/en/09-728s-exponat",
    "/en/10-724a",
    "/en/11-733",
    "/en/22-781-sport",
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
    "/en/emobility/skoda-epiq-will-win-you-over-in-just-a-few-seconds/attachment/050-skoda-epiq-a13b0a2b-bf605016",
    "/en/emobility/skoda-epiq-will-win-you-over-in-just-a-few-seconds/attachment/092-skoda-epiq-3b448906-cb578496",
    "/en/emobility/skoda-epiq-will-win-you-over-in-just-a-few-seconds/attachment/093-skoda-epiq-88fc035a-e098c289",
    "/en/emobility/skoda-peaq-unparalleled-space-and-comfort",
    "/en/emobility/spacious-comfortable-and-striking-five-reasons-to-want-the-skoda-peaq",
    "/en/emobility/sunset-over-the-mountains-the-story-behind-the-camouflage-for-the-skoda-peaq",
    "/en/feature-maxova-5",
    "/en/images",
    "/en/lifestyle/13-countries-over-19000-kilometers-the-kylaq-traveled-from-pune-to-prague",
    "/en/lifestyle/an-epic-start-to-the-tour-de-france-skoda-got-barcelona-moving",
    "/en/lifestyle/chainsaws-and-sparklers-discover-the-traditions-of-rally-fans",
    "/en/lifestyle/from-unwanted-graffiti-to-bold-support-for-womens-cycling",
    "/en/lifestyle/la-dolce-vita-explore-the-surroundings-of-lake-como",
    "/en/lifestyle/ouninpohja-finlands-roller-coaster-stage",
    "/en/lifestyle/rs-four-ways-which-one-will-you-choose",
    "/en/lifestyle/skodas-smarter-wireless-charging-goes-beyond-phones",
    "/en/models/skoda-elroq-through-designers-eyes",
    "/en/press-kits/125-years-of-skoda-motorsport-press-kit",
    "/en/press-kits/new-skoda-enyaq-press-kit-2",
    "/en/press-kits/skoda-elroq-press-kit",
    "/en/press-kits/skoda-elroq-press-kit-2",
    "/en/press-kits/skoda-epiq-city-suv-crossover-preview-of-skodas-most-affordable-all-electric-car",
    "/en/press-kits/skoda-epiq-press-kit-2",
    "/en/press-kits/skoda-epiq-press-kit-2/videos/attachment/footage-innsbruck-epiq-uhd-d6cfe9d1",
    "/en/press-kits/skoda-fabia-130-special-edition-celebrates-skoda-autos-anniversary-and-motorsport-heritage",
    "/en/press-kits/skoda-peaq-first-glimpse-of-skodas-new-electric-flagship",
    "/en/press-kits/skoda-peaq-press-kit",
    "/en/press-kits/skoda-peaq-press-kit-2",
    "/en/press-kits/skoda-vision-o-press-kit",
    "/en/press-kits/the-all-electric-skoda-elroq-breaking-new-ground-in-the-compactsuv-segment-with-a-covered-design",
    "/en/press-kits/the-all-new-skoda-kodiaq-press-kit",
    "/en/press-kits/the-all-new-skoda-superb-press-kit",
    "/en/press-releases/936-km-without-recharging-skoda-peaq-sets-range-record-for-seven-seater-electric-suvs",
    "/en/press-releases/production-milestone-skoda-auto-builds-its-one-millionth-karoq",
    "/en/press-releases/skoda-auto-achieves-strong-financial-results-record-ev-deliveries-and-second-place-in-europe-in-h1-2026",
    "/en/press-releases/skoda-auto-and-national-theatre-extend-partnership-until-at-least-2029",
    "/en/press-releases/skoda-auto-announces-changes-to-its-board-of-management",
    "/en/press-releases/skoda-auto-klaus-zellmer-to-leave-the-company",
    "/en/press-releases/skoda-auto-launches-production-of-the-new-peaq-in-mlada-boleslav",
    "/en/press-releases/skoda-auto-marks-23-years-as-tour-de-france-main-partner-new-skoda-peaq-to-serve-as-red-car",
    "/en/press-releases/skoda-octavia-turns-30-three-decades-of-a-brand-icon",
    "/en/press-releases/skoda-peaq-comprehensive-testing-in-extreme-conditions",
    "/en/press-releases/skoda-superb-25-years-of-comfort-space-and-technical-excellence",
    "/en/press-releases/skodas-electric-bestsellers-elroq-and-enyaq-receive-model-year-updates",
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
    "/en/skoda-geneva-strube-interview-mp4",
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
    "/en/skoda-octavia-combi-rs-4x4-2",
    "/en/skoda-octavia-rs230-mpeg-4-1080p-2",
    "/en/skoda-peaq-simply-clever-part-1-1080p-1-a3e05a13",
    "/en/skoda-peaq-simply-clever-part-2-1080p-1-583a6637",
    "/en/skoda-peaq-simply-clever-part-2-with-subtitles-1080p-1-529affa6",
    "/en/skoda-world/a-kodiaq-made-of-paper-the-modeler-spent-700-hours-developing-and-building-it",
    "/en/skoda-world/a-record-year-for-skoda-electrified-models-also-contribute",
    "/en/skoda-world/come-cheer-and-sing-along-meet-the-karaoke-car",
    "/en/skoda-world/explore-the-new-skoda-models-in-mixed-reality",
    "/en/skoda-world/how-the-skoda-octavia-reached-365-km-h",
    "/en/skoda-world/legend-chris-froome-takes-you-behind-the-scenes-of-the-tour-de-france",
    "/en/skoda-world/quiz-can-you-recognise-skoda-models-by-their-details",
    "/en/skoda-world/the-new-skoda-slavia-features-a-refreshed-look-and-an-exclusive-colour",
    "/en/skoda-world/the-skoda-elroq-reveals-its-sustainable-interior",
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
    "/en/tiger-on-ice-test",
    "/en/videos",
    "/en/wrc-rally-test"
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
    let target2 = edsPath(cut === -1 ? rest : rest.slice(0, cut));
    target2 = DEMO_ALIASES[target2] || target2;
    return ALLOWED.has(target2) ? `${target2}${tail}` : null;
  }
  function transform4(hookName, element, payload) {
    if (hookName !== TransformHook3.afterTransform) return;
    element.querySelectorAll("a[href]").forEach((a) => {
      let href = a.getAttribute("href");
      if (/#s_[ac]id=/.test(href)) href = href.split("#s_aid=")[0].split("#s_cid=")[0];
      if (href.startsWith("/direct-download/")) href = `${SOURCE_ORIGIN}${href}`;
      else href = rewriteHref(href) || href;
      if (href !== a.getAttribute("href")) a.setAttribute("href", href);
    });
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
      const target2 = linkedImage ? link : img;
      const marker = document2.createComment("image");
      target2.replaceWith(marker);
      const imageNode = imageContainer(img, document2, linkedImage ? link : null);
      marker.replaceWith(withCaption(imageNode, caption, document2));
    });
  }

  // tools/importer/import-model-page.js
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
    transform: (payload) => {
      const { document: document2, url, params } = payload;
      const main = document2.body;
      const template = __spreadProps(__spreadValues({}, PAGE_TEMPLATE), { metadata: metadataOverrides(pageFacets(document2)) });
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
  return __toCommonJS(import_model_page_exports);
})();
