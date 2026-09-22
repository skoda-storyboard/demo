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

  // tools/importer/import-model-page.js
  var import_model_page_exports = {};
  __export(import_model_page_exports, {
    default: () => import_model_page_default
  });

  // tools/importer/parsers/hero.js
  function parse(element, { document: document2 }) {
    const img = element.querySelector(".image-wrapper img, img.media-cart-image, img");
    const chip = element.querySelector(".entry-meta .label, span.label-secondary, .label");
    const heading = element.querySelector("h1.entry-title, h1");
    const teaser = element.querySelector(".entry-summary p, .entry-summary");
    if (!img && !heading) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const contentCell = [];
    if (chip) {
      const chipText = (chip.textContent || "").trim();
      if (chipText) {
        const p = document2.createElement("p");
        p.textContent = chipText;
        contentCell.push(p);
      }
    }
    if (heading) contentCell.push(heading);
    if (teaser) contentCell.push(teaser);
    const cells = [
      ["Hero"],
      [img || ""],
      [contentCell]
    ];
    const table = WebImporter.DOMUtils.createTable(cells, document2);
    element.replaceWith(table);
  }

  // tools/importer/parsers/in-page-nav.js
  function parse2(element, { document: document2 }) {
    const anchors = Array.from(
      element.querySelectorAll('ul.nav > li > a[href], .model-nav-content a[href], a[href^="#"]')
    );
    const seen = /* @__PURE__ */ new Set();
    const cleanAnchors = [];
    anchors.forEach((a) => {
      const href = a.getAttribute("href") || "";
      const label = (a.textContent || "").trim();
      if (!href || !label) return;
      const key = `${href}::${label}`;
      if (seen.has(key)) return;
      seen.add(key);
      const link = document2.createElement("a");
      link.setAttribute("href", href);
      link.textContent = label;
      cleanAnchors.push(link);
    });
    if (cleanAnchors.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [["In-Page Nav"]];
    cleanAnchors.forEach((a) => cells.push([a]));
    const table = WebImporter.DOMUtils.createTable(cells, document2);
    element.replaceWith(table);
  }

  // tools/importer/parsers/key-facts.js
  function parse3(element, { document: document2 }) {
    const heading = element.querySelector("h2");
    const items = Array.from(element.querySelectorAll(":scope > .items > .item, .items > .item"));
    if (items.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [["Cards (key-facts)"]];
    items.forEach((item) => {
      const img = item.querySelector("img");
      const title = item.querySelector(".item-text .item-title, .item-text h3, .item-title, h3");
      const paras = Array.from(item.querySelectorAll(".item-text p, p"));
      const bodyCell = [];
      if (title) {
        bodyCell.push(title.cloneNode(true));
      }
      paras.forEach((p) => bodyCell.push(p));
      cells.push([img || "", bodyCell]);
    });
    const table = WebImporter.DOMUtils.createTable(cells, document2);
    if (heading) {
      element.replaceWith(heading, table);
    } else {
      element.replaceWith(table);
    }
  }

  // tools/importer/parsers/spec-table.js
  function parse4(element, { document: document2 }) {
    const heading = element.querySelector("h2");
    const items = Array.from(element.querySelectorAll(":scope > .items > .item, .items > .item"));
    if (items.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [["Spec Table"]];
    items.forEach((item) => {
      var _a, _b, _c;
      const value = (((_a = item.querySelector(".item-value")) == null ? void 0 : _a.textContent) || "").trim();
      const unit = (((_b = item.querySelector(".item-unit")) == null ? void 0 : _b.textContent) || "").trim();
      const title = (((_c = item.querySelector(".item-title")) == null ? void 0 : _c.textContent) || "").trim();
      const valueText = [value, unit].filter(Boolean).join(" ");
      cells.push([title, valueText]);
    });
    const pdfLink = element.querySelector(".buttons a[href], a.btn[href]");
    if (pdfLink) {
      const a = document2.createElement("a");
      a.setAttribute("href", pdfLink.getAttribute("href"));
      a.textContent = (pdfLink.textContent || "Download PDF").trim();
      cells.push([a, ""]);
    }
    const table = WebImporter.DOMUtils.createTable(cells, document2);
    if (heading) {
      element.replaceWith(heading, table);
    } else {
      element.replaceWith(table);
    }
  }

  // tools/importer/parsers/story-rail.js
  var RAIL_CONFIG = {
    derivatives: { template: "skoda_model", heading: "Bodywork / Derivatives", tagRail: false },
    news: { template: "press_release", heading: "News", tagRail: true },
    "press-kits": { template: "press_kit", heading: "Press Kits", tagRail: true },
    stories: { template: "story", heading: "Stories", tagRail: true },
    images: { template: "image", heading: "Images", tagRail: true },
    videos: { template: "video", heading: "Videos", tagRail: true }
  };
  function parse5(element, { document: document2 }) {
    let node = element;
    let railId = null;
    while (node && node !== document2.documentElement) {
      const id = node.id;
      if (id && Object.prototype.hasOwnProperty.call(RAIL_CONFIG, id)) {
        railId = id;
        break;
      }
      node = node.parentElement;
    }
    if (!railId) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const config = RAIL_CONFIG[railId];
    const headingEl = element.querySelector(".search-results-heading, h2, h3");
    let headingText = config.heading;
    if (headingEl) {
      const clone = headingEl.cloneNode(true);
      clone.querySelectorAll(".subheading").forEach((s) => s.remove());
      const t = (clone.textContent || "").trim();
      if (t) headingText = t;
    }
    const cells = [
      ["Story Rail"],
      ["heading", headingText],
      ["template", config.template],
      ["tags", "elroq"]
    ];
    if (config.tagRail) {
      cells.push(["subheading", "Based on tags: Elroq"]);
    }
    const table = WebImporter.DOMUtils.createTable(cells, document2);
    element.replaceWith(table);
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

  // tools/importer/transformers/skoda-model-metadata.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var FALLBACK = {
    title: "Elroq",
    description: "Model Description The Elroq is \u0160koda's first production model to feature the innovative design language it calls Modern Solid. This car \u2026",
    image: "https://cdn.skoda-storyboard.com/2024/10/hero_car_timiano_ext_front_1f67abb3.png",
    publisheddate: "2024-10-15",
    template: "skoda_model",
    model: "elroq",
    tags: "elroq"
  };
  function metaContent(document2, selector) {
    const el = document2.querySelector(selector);
    const val = el && el.getAttribute("content");
    return val && val.trim() ? val.trim() : null;
  }
  function jsonLdPublishedDate(document2) {
    const scripts = document2.querySelectorAll('script[type="application/ld+json"]');
    for (const s of scripts) {
      try {
        const data = JSON.parse(s.textContent);
        const graph = data["@graph"] || (Array.isArray(data) ? data : [data]);
        for (const node of graph) {
          if (node && node.datePublished) {
            return String(node.datePublished).slice(0, 10);
          }
        }
      } catch (e) {
      }
    }
    return null;
  }
  function hasMetadataBlock(element) {
    const tables = element.querySelectorAll("table");
    for (const t of tables) {
      const firstCell = t.querySelector("tr th, tr td");
      if (firstCell && firstCell.textContent.trim().toLowerCase() === "metadata") {
        return true;
      }
    }
    return false;
  }
  function transform2(hookName, element, payload) {
    if (hookName !== TransformHook2.afterTransform) return;
    if (hasMetadataBlock(element)) return;
    const { document: document2 } = payload;
    const title = metaContent(document2, 'meta[property="og:title"]') || FALLBACK.title;
    const description = metaContent(document2, 'meta[property="og:description"]') || metaContent(document2, 'meta[name="description"]') || FALLBACK.description;
    const imageSrc = metaContent(document2, 'meta[property="og:image"]') || FALLBACK.image;
    const publisheddate = jsonLdPublishedDate(document2) || FALLBACK.publisheddate;
    const img = document2.createElement("img");
    img.src = imageSrc;
    const meta = {
      Title: title,
      Description: description,
      Image: img,
      publisheddate,
      // JSON-LD datePublished → 2024-10-15
      template: FALLBACK.template,
      // fixed: skoda_model CPT
      model: FALLBACK.model,
      // fixed: this page's model slug
      tags: FALLBACK.tags
      // fixed: model-tag rails key
    };
    const block = WebImporter.Blocks.getMetadataBlock(document2, meta);
    element.append(block);
  }

  // tools/importer/transformers/skoda-model-tags.js
  var TransformHook3 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var TAGS = [
    { label: "2026", href: "/en/news/?filter[years][]=2026" },
    { label: "eMobility", href: "/en/news/?filter[technology][]=emobility" },
    { label: "Elroq", href: "/en/news/?filter[model][]=elroq", selected: true }
  ];
  function hasTagsBlock(element) {
    const tables = element.querySelectorAll("table");
    for (const t of tables) {
      const firstCell = t.querySelector("tr th, tr td");
      if (firstCell && firstCell.textContent.trim().toLowerCase().startsWith("tags")) {
        return true;
      }
    }
    return false;
  }
  function tagRow(document2, markSelected) {
    return TAGS.map((tag) => {
      const a = document2.createElement("a");
      a.href = tag.href;
      a.textContent = tag.label;
      if (markSelected && tag.selected) {
        const strong = document2.createElement("strong");
        strong.append(a);
        return strong;
      }
      return a;
    });
  }
  function transform4(hookName, element, payload) {
    if (hookName !== TransformHook3.afterTransform) return;
    if (hasTagsBlock(element)) return;
    const { document: document2 } = payload;
    const metaTable = [...element.querySelectorAll("table")].find((t) => {
      const c = t.querySelector("tr th, tr td");
      return c && c.textContent.trim().toLowerCase() === "metadata";
    });
    const anchor = metaTable || null;
    const insert = (node) => {
      if (anchor) anchor.before(node);
      else element.append(node);
    };
    insert(document2.createElement("hr"));
    insert(WebImporter.DOMUtils.createTable([["Tags"], tagRow(document2, false)], document2));
    insert(document2.createElement("hr"));
    insert(WebImporter.DOMUtils.createTable([["Tags (chips)"], tagRow(document2, true)], document2));
    insert(document2.createElement("hr"));
    insert(WebImporter.DOMUtils.createTable([["Tags (chips, outline)"], tagRow(document2, true)], document2));
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
  function transform3(hookName, element, payload) {
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

  // tools/importer/import-model-page.js
  var PAGE_TEMPLATE = {
    name: "model-page",
    description: "\u0160koda model page (skoda_model CPT, Media Room side). SKODA-208.",
    urls: [
      "https://www.skoda-storyboard.com/en/skoda-model/elroq/"
    ],
    blocks: [
      { name: "hero", instances: ["article.skoda_model > .carousel"] },
      { name: "in-page-nav", instances: ["nav.model-nav", ".model-nav"] },
      { name: "key-facts", instances: ["#keyfacts .so-widget-ys-so-widget-highlights"] },
      { name: "spec-table", instances: ["#techdata .so-widget-ys-so-widget-techdata"] },
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
      }
    ],
    sections: [
      { id: "section-1", name: "Hero", selector: ["article.skoda_model > .carousel"], style: null, blocks: ["hero"], defaultContent: [] },
      { id: "section-2", name: "In-page nav", selector: [".model-nav"], style: null, blocks: ["in-page-nav"], defaultContent: [] },
      { id: "section-3", name: "Model Description", selector: ["#intro"], style: null, blocks: [], defaultContent: ["#intro h2", "#intro p"] },
      { id: "section-4", name: "Key Facts", selector: ["#keyfacts"], style: null, blocks: ["key-facts"], defaultContent: [] },
      { id: "section-5", name: "Technical Data", selector: ["#techdata"], style: null, blocks: ["spec-table"], defaultContent: [] },
      { id: "section-6", name: "Bodywork / Derivatives", selector: ["#derivatives"], style: null, blocks: ["story-rail"], defaultContent: [] },
      { id: "section-7", name: "News", selector: ["#news"], style: null, blocks: ["story-rail"], defaultContent: [] },
      { id: "section-8", name: "Press Kits", selector: ["#press-kits"], style: null, blocks: ["story-rail"], defaultContent: [] },
      { id: "section-9", name: "Stories", selector: ["#stories"], style: null, blocks: ["story-rail"], defaultContent: [] },
      { id: "section-10", name: "Images", selector: ["#images"], style: null, blocks: ["story-rail"], defaultContent: [] },
      { id: "section-11", name: "Videos", selector: ["#videos"], style: null, blocks: ["story-rail"], defaultContent: [] }
    ]
  };
  var parsers = {
    hero: parse,
    "in-page-nav": parse2,
    "key-facts": parse3,
    "spec-table": parse4,
    "story-rail": parse5
  };
  var transformers = [
    transform,
    transform2,
    transform4,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform3] : []
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
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_model_page_default = {
    transform: (payload) => {
      const {
        document: document2,
        url,
        html,
        params
      } = payload;
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
  return __toCommonJS(import_model_page_exports);
})();
