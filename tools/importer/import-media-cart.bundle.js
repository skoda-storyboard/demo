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

  // tools/importer/import-media-cart.js
  var import_media_cart_exports = {};
  __export(import_media_cart_exports, {
    default: () => import_media_cart_default
  });

  // tools/importer/transformers/skoda-listing-cleanup.js
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
        // Secondary widgets / banners (defensive — not on this sample)
        ".newsletter-subscribe-widget",
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
        // Chrome resource elements
        'link[rel="stylesheet"]',
        "link"
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
    }
  }

  // tools/importer/transformers/skoda-media-cart.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform2(hookName, element, payload) {
    if (hookName !== TransformHook2.afterTransform) return;
    const document = element.ownerDocument || payload.document;
    const cart = element.querySelector(".mr-media-cart, .media-cart-items");
    if (!cart) {
      console.warn("[media-cart] no .mr-media-cart on the page; left as is");
      return;
    }
    const sourceTitle = element.querySelector(".page-header h1, h1");
    const h1 = document.createElement("h1");
    h1.textContent = (sourceTitle && sourceTitle.textContent || "").trim() || "Your downloads";
    const nodes = [
      h1,
      WebImporter.Blocks.createBlock(document, { name: "Section Metadata", cells: { Style: "page-header" } }),
      document.createElement("hr"),
      WebImporter.DOMUtils.createTable([["Media Cart"], [""]], document)
    ];
    element.replaceChildren(...nodes);
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
  var ALTERNATE_LOCALES = ["en", "cs", "de", "sk", "sr", "sl"];
  function extractAlternates(document, pageUrl) {
    let own = "";
    try {
      own = new URL(pageUrl).pathname.split("/")[1].toLowerCase();
    } catch (e) {
    }
    const found = /* @__PURE__ */ new Map();
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((link) => {
      const code = String(link.getAttribute("hreflang") || "").trim().toLowerCase().split("-")[0];
      if (!ALTERNATE_LOCALES.includes(code) || code === own || found.has(code)) return;
      let url;
      try {
        url = new URL(link.getAttribute("href"));
      } catch (e) {
        return;
      }
      if (!/^https?:$/.test(url.protocol)) return;
      if ((url.pathname.split("/")[1] || "").toLowerCase() !== code) return;
      found.set(code, url.href);
    });
    return ALTERNATE_LOCALES.filter((c) => found.has(c)).map((c) => `${c}: ${found.get(c)}`).join(", ");
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
    const categories = template === "story" ? extractCategories(document) : [];
    if (categories.length) meta.categories = categories.join(", ");
    const alternates = extractAlternates(document, pageUrl);
    if (alternates) meta.alternates = alternates;
    const allTags = [.../* @__PURE__ */ new Set([...derivedTags, ...splitList(overrides.tags)])];
    if (allTags.length) meta.tags = allTags.join(", ");
    FACETS.forEach((f) => {
      const merged = [.../* @__PURE__ */ new Set([...byFacet[f] || [], ...splitList(overrides[f])])];
      if (merged.length) meta[f] = merged.join(", ");
    });
    const block = WebImporter.Blocks.getMetadataBlock(document, meta);
    element.append(block);
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

  // tools/importer/import-media-cart.js
  var PAGE_TEMPLATE = {
    name: "media-cart",
    description: "\u0160koda media cart page (body.media-cart). Emits a dark h1 section + an empty Media Cart block (blocks/media-cart, SKODA-505b); the cart widget and package history are client-side and not ported. Metadata template=page.",
    urls: ["https://www.skoda-storyboard.com/en/media-cart/"],
    metadata: { template: "page" },
    blocks: [],
    sections: []
  };
  var transformers = [
    transform,
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
  var import_media_cart_default = {
    // keep the source's glued non-breaking spaces (html2md would turn them into spaces)
    preprocess: ({ document }) => transform4("preprocess", document.body, { document }),
    transform: (payload) => {
      const { document, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      executeTransformers("afterTransform", main, payload);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: ["media-cart"]
        }
      }];
    }
  };
  return __toCommonJS(import_media_cart_exports);
})();
