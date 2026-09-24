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
  function parse(element, { document: document2 }) {
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
    const table = WebImporter.DOMUtils.createTable(cells, document2);
    element.replaceWith(table);
  }

  // tools/importer/parsers/tags.js
  function parse2(element, { document: document2 }) {
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

  // tools/importer/parsers/downloads.js
  function isBinaryHref(href) {
    return /\.(pdf|mp4|zip|docx?|pptx?|xlsx?)(\?|#|$)/i.test(href || "");
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
    let emitted = 0;
    items.forEach((item) => {
      const dlAnchor = item.querySelector('a[data-action="download"]') || item.querySelector('a[href*="direct-download"]') || item.querySelector("a.colorbox[href], a.file-type[href]");
      const href = dlAnchor && dlAnchor.getAttribute("href");
      if (!href || href === "#") return;
      const img = item.querySelector("img");
      const captionEl = item.querySelector("[data-caption]");
      const filename = href.split("/").pop().split(/[?#]/)[0];
      const title = captionEl && captionEl.getAttribute("data-caption") || (dlAnchor.getAttribute("title") || "").replace(/^Download\s+/i, "").trim() || img && img.getAttribute("alt") || filename;
      const link = document2.createElement("a");
      link.setAttribute("href", href);
      link.textContent = title;
      const addAction = item.querySelector('a[data-action="add"][data-id]');
      const dataId = addAction && addAction.getAttribute("data-id") || dlAnchor.getAttribute("data-id") || "";
      if (dataId) link.setAttribute("data-id", dataId);
      link.setAttribute("data-action", isBinaryHref(href) ? "link" : "download");
      const sizeAction = item.querySelector('a[title*="Original" i], a[data-size]');
      const dataSize = sizeAction && sizeAction.getAttribute("data-size") || "original";
      if (!isBinaryHref(href)) link.setAttribute("data-size", dataSize || "original");
      const linkPara = document2.createElement("p");
      linkPara.append(link);
      const linkCell = [linkPara];
      const label = isBinaryHref(href) ? href.split(".").pop().split(/[?#]/)[0].toUpperCase() : "Original";
      if (label) {
        const labelPara = document2.createElement("p");
        labelPara.textContent = label;
        linkCell.push(labelPara);
      }
      cells.push([img || "", linkCell]);
      emitted += 1;
    });
    if (emitted === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const table = WebImporter.DOMUtils.createTable(cells, document2);
    element.replaceWith(table);
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
        ".embed-controller-wrapper",
        // verified: Buzzsprout AI-audio embed (→ SKODA-204)
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
        ".social-share",
        ".media-cart-flyout",
        ".share-bar",
        // Chrome resource elements (external stylesheet link). script/style not present.
        'link[rel="stylesheet"]',
        "link"
      ]);
      element.querySelectorAll("section > ul.menu, section > .menu").forEach((menu) => {
        const section = menu.closest("section");
        if (section) section.remove();
      });
    }
    if (hookName === TransformHook.afterTransform) {
      element.querySelectorAll('a[href*="#s_aid="], a[href*="#s_cid="]').forEach((a) => {
        a.setAttribute("href", a.getAttribute("href").split("#s_aid=")[0].split("#s_cid=")[0]);
      });
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
    [/\bpage-template\b|\btemplate-media-room-page\b/, "page"]
  ];
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
  function extractTagsAndFacets(document2) {
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
    const title = overrides.title || metaContent(document2, 'meta[property="og:title"]') || (document2.querySelector("title") ? document2.querySelector("title").textContent.trim() : "");
    const description = overrides.description || metaContent(document2, 'meta[property="og:description"]') || metaContent(document2, 'meta[name="description"]') || "";
    const imageSrc = overrides.image || metaContent(document2, 'meta[property="og:image"]') || "";
    const publisheddate = overrides.publisheddate || extractDate(document2);
    const template = overrides.template || extractTemplate(document2);
    const category = overrides.category || extractCategory(pageUrl);
    const { tags: derivedTags, byFacet } = extractTagsAndFacets(document2);
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

  // tools/importer/import-press-release.js
  var parsers = {
    gallery: parse,
    tags: parse2,
    downloads: parse3
  };
  var PAGE_TEMPLATE = {
    name: "press-release",
    description: "\u0160koda press release detail (press_release CPT). No hero: header (date + title) -> primary column default content -> Gallery -> Tags -> full-bleed dark Media Box parsed as Downloads. AI-audio embed + widgets removed by cleanup. Content-driven detection only.",
    urls: [
      "https://www.skoda-storyboard.com/en/press-releases/skoda-superb-25-years-of-comfort-space-and-technical-excellence/"
    ],
    blocks: [
      { name: "gallery", instances: ["section.images.sa-media-kit-preview"] },
      { name: "tags", instances: ["section.tags"] },
      {
        name: "downloads",
        instances: [".cover-box.dark .search-results.media-box, .search-results.media-box"]
      }
    ],
    sections: [
      {
        id: "section-1",
        name: "Article",
        selector: ["article.press_release > .container, article.press_release"],
        style: null,
        blocks: ["gallery", "tags"],
        defaultContent: [
          "header .entry-published",
          "header .entry-title",
          ".column-primary .article-teaser",
          ".column-primary .bullet-points",
          ".column-primary .entry-summary",
          ".column-primary .entry-content"
        ]
      },
      {
        id: "section-2",
        name: "Related Media",
        selector: [".cover-box.dark"],
        style: "dark, full-width",
        blocks: ["downloads"],
        defaultContent: []
      }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : [],
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
  var import_press_release_default = {
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
  return __toCommonJS(import_press_release_exports);
})();
