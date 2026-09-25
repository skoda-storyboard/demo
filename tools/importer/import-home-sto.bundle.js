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

  // tools/importer/import-home-sto.js
  var import_home_sto_exports = {};
  __export(import_home_sto_exports, {
    default: () => import_home_sto_default
  });

  // tools/importer/parsers/promo-box.js
  function parse(element, { document: document2 }) {
    const items = Array.from(element.querySelectorAll("article.promo-box-item, .item article, .items > .item")).filter((el, i, arr) => arr.indexOf(el) === i);
    if (items.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [["Cards (promo)"]];
    let emitted = 0;
    items.forEach((item) => {
      const img = item.querySelector("img");
      const anchor = item.querySelector("a[href]");
      const href = anchor ? anchor.getAttribute("href") : "";
      const titleEl = item.querySelector(".article-teaser-title, h2, h3");
      const title = titleEl && (titleEl.textContent || "").trim() || img && img.getAttribute("alt") || "";
      if (!img && !title) return;
      const titleCell = [];
      if (href && title) {
        const link = document2.createElement("a");
        link.setAttribute("href", href);
        link.textContent = title;
        titleCell.push(link);
      } else if (title) {
        const p = document2.createElement("p");
        p.textContent = title;
        titleCell.push(p);
      }
      cells.push([img || "", titleCell]);
      emitted += 1;
    });
    if (emitted === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const table = WebImporter.DOMUtils.createTable(cells, document2);
    element.replaceWith(table);
  }

  // tools/importer/parsers/home-rail.js
  function queryFromHref(href) {
    if (!href) return null;
    let m = href.match(/\/category\/([a-z0-9-]+)\/?/i);
    if (m) return { key: "category", value: m[1].toLowerCase() };
    if (/\/news\/?($|[?#])/i.test(href)) return { key: "template", value: "press_release" };
    if (/\/images\/?($|[?#])/i.test(href)) return { key: "template", value: "image" };
    if (/\/videos\/?($|[?#])/i.test(href)) return { key: "template", value: "video" };
    if (/\/series-2\/?($|[?#])/i.test(href)) return { key: "template", value: "skoda_series" };
    return null;
  }
  function templateFromTypeClass(element, headingText) {
    const cls = element.className || "";
    if (/\btype-skoda_model\b/.test(cls)) return "skoda_model";
    if (/\btype-skoda_series\b/.test(cls)) return "skoda_series";
    if (/\btype-press_release\b/.test(cls)) return "press_release";
    if (/\btype-press_kit\b/.test(cls)) return "press_kit";
    if (/\btype-post\b/.test(cls)) return "story";
    if (/\btype-attachment\b/.test(cls)) {
      return /video/i.test(headingText) ? "video" : "image";
    }
    return null;
  }
  function parse2(element, { document: document2 }) {
    if (/\btype-social\b/.test(element.className || "") || element.closest(".socials-static")) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const headingEl = element.querySelector(".search-results-heading, h2, h3");
    const heading = headingEl ? (headingEl.textContent || "").trim() : "";
    const allLink = element.querySelector(".search-results-header-link[href]");
    const href = allLink ? allLink.getAttribute("href") : "";
    const q = queryFromHref(href);
    const cells = [["Story Rail"]];
    if (heading) cells.push(["heading", heading]);
    if (q) {
      cells.push([q.key, q.value]);
    } else {
      const template = templateFromTypeClass(element, heading);
      if (!template) {
        element.replaceWith(...element.childNodes);
        return;
      }
      cells.push(["template", template]);
    }
    const table = WebImporter.DOMUtils.createTable(cells, document2);
    element.replaceWith(table);
  }

  // tools/importer/parsers/social-cards.js
  function parse3(element, { document: document2 }) {
    const seen = /* @__PURE__ */ new Set();
    const links = [...element.querySelectorAll(
      ".search-results-item a[href], .search-results-items a[href]"
    )].filter((a) => {
      const href = a.getAttribute("href") || "";
      if (!/^https?:/i.test(href) || seen.has(href)) return false;
      seen.add(href);
      return true;
    });
    const rows = links.map((a) => {
      const handleEl = a.querySelector(".entry-title, h2, h3, h4");
      const handle = (handleEl && handleEl.textContent || a.textContent || "").trim();
      if (!handle) return null;
      const link = document2.createElement("a");
      link.setAttribute("href", a.getAttribute("href"));
      link.textContent = handle;
      return [link];
    }).filter(Boolean);
    if (!rows.length) return;
    const out = [document2.createElement("hr")];
    const headingEl = element.querySelector(".search-results-heading, .search-results-header h2, .search-results-header h3");
    const headingText = headingEl && headingEl.textContent.trim();
    if (headingText) {
      const h2 = document2.createElement("h2");
      h2.textContent = headingText;
      out.push(h2);
    }
    out.push(WebImporter.DOMUtils.createTable([["Cards (social)"], ...rows], document2));
    out.push(WebImporter.DOMUtils.createTable([["Section Metadata"], ["Style", "dark"]], document2));
    out.push(document2.createElement("hr"));
    element.replaceWith(...out);
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

  // tools/importer/import-home-sto.js
  var parsers = {
    "promo-box": parse,
    "home-rail": parse2
  };
  var PAGE_TEMPLATE = {
    name: "home-sto",
    description: "\u0160koda Storyboard home (template-homepage). Curated promo-box cards + index-driven Story Rails (home-rail) + the Social media band as Cards (social) (social-cards). Metadata template=page. Content-driven detection only.",
    urls: ["https://www.skoda-storyboard.com/en/"],
    metadata: { template: "page" },
    blocks: [
      { name: "promo-box", instances: ["section.promo-box"] },
      { name: "home-rail", instances: ['.cover-box .search-results[class*="type-"]'] }
    ],
    sections: []
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
  var import_home_sto_default = {
    transform: (payload) => {
      const { document: document2, url, params } = payload;
      const main = document2.body;
      document2.querySelectorAll(".socials-static").forEach((el) => {
        try {
          parse3(el, { document: document2, url, params });
        } catch (e) {
          console.error("Failed to parse social-cards (.socials-static):", e);
        }
      });
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
  return __toCommonJS(import_home_sto_exports);
})();
