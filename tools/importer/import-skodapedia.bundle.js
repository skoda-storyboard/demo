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

  // tools/importer/import-skodapedia.js
  var import_skodapedia_exports = {};
  __export(import_skodapedia_exports, {
    default: () => import_skodapedia_default
  });

  // tools/importer/parsers/skodapedia.js
  function parse(element, { document }) {
    const rows = Array.from(element.querySelectorAll(".sp__list-directory__item"));
    if (rows.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [["Skodapedia"]];
    let emitted = 0;
    rows.forEach((row) => {
      const a = row.querySelector("a[href]");
      if (!a) return;
      const title = (a.textContent || "").trim();
      const href = a.getAttribute("href");
      if (!title || !href) return;
      const cls = row.className || "";
      const m = cls.match(/\bsp-([a-z0-9]+)\b/i);
      const letter = m ? m[1].toLowerCase() : "";
      const link = document.createElement("a");
      link.setAttribute("href", href);
      link.textContent = title;
      cells.push([letter, link]);
      emitted += 1;
    });
    if (emitted === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const table = WebImporter.DOMUtils.createTable(cells, document);
    element.replaceWith(table);
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
  function extractTagsAndFacets(document) {
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
      if (/\bsingle-skoda_series\b|\bskoda_series-template\b/.test(cls)) {
        const canonical = document.querySelector('link[rel="canonical"]');
        const href = canonical && canonical.getAttribute("href") || "";
        const m = href.match(/\/series\/([a-z0-9-]+)\/?/i);
        if (m) add("series", m[1].toLowerCase());
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
  function transform2(hookName, element, payload) {
    if (hookName !== TransformHook2.afterTransform) return;
    if (hasMetadataBlock(element)) return;
    const { document, url, params } = payload;
    const canonical = document.querySelector('link[rel="canonical"]');
    const pageUrl = params && params.originalURL || url || canonical && canonical.href || "";
    const overrides = payload.template && payload.template.metadata || {};
    const title = overrides.title || metaContent(document, 'meta[property="og:title"]') || (document.querySelector("title") ? document.querySelector("title").textContent.trim() : "");
    const description = overrides.description || metaContent(document, 'meta[property="og:description"]') || metaContent(document, 'meta[name="description"]') || "";
    const imageSrc = overrides.image || metaContent(document, 'meta[property="og:image"]') || "";
    const publisheddate = overrides.publisheddate || extractDate(document);
    const template = overrides.template || extractTemplate(document);
    const category = overrides.category || extractCategory(pageUrl);
    const { tags: derivedTags, byFacet } = extractTagsAndFacets(document);
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

  // tools/importer/import-skodapedia.js
  var parsers = {
    skodapedia: parse
  };
  var PAGE_TEMPLATE = {
    name: "skodapedia",
    description: "\u0160koda \u0160kodapedia glossary directory (post-type-archive-skodapedia). One Skodapedia block (term index); term-detail prebake \u2192 SKODA-802. Metadata template=page. Content-driven detection only.",
    urls: ["https://www.skoda-storyboard.com/en/skodapedia/"],
    metadata: { template: "page" },
    blocks: [
      { name: "skodapedia", instances: [".sp__list-content"] }
    ],
    sections: []
  };
  var transformers = [
    transform,
    transform2
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
  var import_skodapedia_default = {
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
  return __toCommonJS(import_skodapedia_exports);
})();
