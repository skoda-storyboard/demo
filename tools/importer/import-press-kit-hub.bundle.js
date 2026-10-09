/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
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

  // tools/importer/import-press-kit-hub.js
  var import_press_kit_hub_exports = {};
  __export(import_press_kit_hub_exports, {
    YEAR_TERMS: () => YEAR_TERMS,
    default: () => import_press_kit_hub_default
  });

  // tools/importer/parsers/press-kit-hub-hero.js
  function parseHero(hero, document) {
    const image = hero.querySelector(".hero-image img");
    const title = hero.querySelector(".hero-caption h1");
    if (!(image == null ? void 0 : image.getAttribute("src")) || !(title == null ? void 0 : title.textContent.trim())) {
      throw new Error("Press-kit hub requires a hero image and title");
    }
    const caption = document.createElement("div");
    const h1 = document.createElement("h1");
    h1.textContent = title.textContent.trim();
    caption.append(h1);
    const perex = hero.querySelector(".hero-caption .perex");
    if (perex == null ? void 0 : perex.textContent.trim()) {
      const p = document.createElement("p");
      p.textContent = perex.textContent.trim();
      caption.append(p);
    }
    image.removeAttribute("data-caption");
    image.removeAttribute("data-video_title");
    image.removeAttribute("srcset");
    image.removeAttribute("sizes");
    return WebImporter.DOMUtils.createTable([
      ["Hero Image (overlay)"],
      [image],
      [caption]
    ], document);
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
  function transform(hookName, element, payload) {
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
  function transform2(hookName, element, payload) {
    if (hookName !== TransformHook2.afterTransform) return;
    element.querySelectorAll("a[href]").forEach((a) => {
      let href = a.getAttribute("href");
      if (/#s_[ac]id=/.test(href)) href = href.split("#s_aid=")[0].split("#s_cid=")[0];
      if (href.startsWith("/direct-download/")) href = `${SOURCE_ORIGIN}${href}`;
      else href = tagPageHref(href) || rewriteHref(href) || href;
      if (href !== a.getAttribute("href")) a.setAttribute("href", href);
    });
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
            const marker2 = document.createComment("image");
            div.replaceWith(marker2);
            marker2.replaceWith(withCaption(div, caption, document));
          } else {
            const marker2 = document.createComment("image");
            img.replaceWith(marker2);
            marker2.replaceWith(withCaption(imageContainer(img, document), caption, document));
          }
        }
        return;
      }
      const link = img.closest("a");
      const linkedImage = link && link.querySelectorAll("img").length === 1 && !(link.textContent || "").trim();
      const target = linkedImage ? link : img;
      const marker = document.createComment("image");
      target.replaceWith(marker);
      const imageNode = imageContainer(img, document, linkedImage ? link : null);
      marker.replaceWith(withCaption(imageNode, caption, document));
    });
  }

  // tools/importer/import-press-kit-hub.js
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
  var YEAR_TERMS = /* @__PURE__ */ new Map([
    ["1572", "2016"],
    ["11039", "2017"],
    ["17169", "2018"],
    ["23835", "2019"],
    ["29912", "2020"],
    ["29936", "2021"],
    ["42472", "2022"],
    ["46476", "2023"],
    ["48727", "2024"],
    ["57053", "2025"],
    ["61572", "2026"]
  ]);
  function facetValue(facet, value) {
    if (!/^\d+$/.test(value)) return value;
    if (facet === "years" && YEAR_TERMS.has(value)) return YEAR_TERMS.get(value);
    console.warn(`press-kit hub: unknown ${facet} term id ${value}, not mapped`);
    return "";
  }
  function sourceFacets(article) {
    const result = { template: "press_kit", category: "press-kits" };
    const tags = [];
    FACETS2.forEach((facet) => {
      const values = [...new Set([...article.classList].filter((cls) => cls.startsWith(`${facet}-`)).map((cls) => facetValue(facet, cls.slice(facet.length + 1))).filter(Boolean))];
      if (values.length) {
        result[facet] = values.join(", ");
        tags.push(...values);
      }
    });
    if (tags.length) result.tags = [...new Set(tags)].join(", ");
    return result;
  }
  var SOURCE_HOSTNAME = /^(?:www\.)?skoda-storyboard\.com$/i;
  var DIRECT_DOWNLOAD_PREFIX = "/direct-download/";
  var CDN_ORIGIN = "https://cdn.skoda-storyboard.com";
  var BANNER_ZIP_CORRECTIONS = /* @__PURE__ */ new Map([
    ["https://cdn.skoda-storyboard.com/2020/04/SKODA-OCTAVIA", "https://cdn.skoda-storyboard.com/2020/04/SKODA-OCTAVIA.zip"]
  ]);
  function bannerHref(href) {
    let url;
    try {
      url = new URL(href);
    } catch (e) {
      return href;
    }
    if (url.search) return href;
    const correction = BANNER_ZIP_CORRECTIONS.get(`${url.origin}${url.pathname}`);
    if (correction) return `${correction}${url.hash}`;
    const isDirectDownloadZip = SOURCE_HOSTNAME.test(url.hostname) && url.pathname.startsWith(DIRECT_DOWNLOAD_PREFIX) && /\.zip$/i.test(url.pathname);
    if (!isDirectDownloadZip) return href;
    return `${CDN_ORIGIN}/${url.pathname.slice(DIRECT_DOWNLOAD_PREFIX.length)}${url.hash}`;
  }
  function bannerAlt(href, img) {
    if (/\.zip(?:$|[?#])/i.test(href) || /download/i.test(img.getAttribute("src").split("/").pop())) {
      return "Download the press kit ZIP";
    }
    if (/whatsapp/i.test(href)) return "Follow \u0160koda Storyboard on WhatsApp";
    if (/^https?:\/\/(?:www\.)?threads\.(?:com|net)\//i.test(href)) {
      return "\u0160koda on Threads: the latest news and updates from the world of \u0160koda";
    }
    if (/^https?:\/\/open\.spotify\.com\//i.test(href)) return "Listen to the #Explore\u0160koda Podcast on Spotify";
    if (/^https?:\/\/(?:www\.)?(?:twitter|x)\.com\/skodaautonews\/?$/i.test(href)) {
      return "Follow @skodaautonews on the X platform";
    }
    const alt = (img.getAttribute("alt") || img.getAttribute("title") || "").trim();
    if (alt) return alt;
    throw new Error(`Press-kit hub banner has no accessible name: ${href}`);
  }
  function bannerLinks(content, document) {
    return [...content.querySelectorAll(".widget_sow-editor .textwidget a[href]")].filter((a) => a.querySelector("img[src]")).map((source) => {
      const link = document.createElement("a");
      link.href = bannerHref(source.href);
      const img = source.querySelector("img").cloneNode(true);
      img.removeAttribute("srcset");
      img.removeAttribute("sizes");
      img.alt = bannerAlt(link.href, source.querySelector("img"));
      link.append(img);
      const p = document.createElement("p");
      p.append(link);
      return p;
    });
  }
  var isTimeline = (widget) => !!widget.querySelector(
    '.twitter-timeline, iframe[src*="twitter.com"], script[src*="platform.twitter.com"]'
  );
  function textWidgets(content, document) {
    const order = [...content.querySelectorAll("article.article-teaser, .widget_sow-editor .textwidget")];
    const firstTile = order.findIndex((node) => node.matches("article.article-teaser"));
    const intro = [];
    const contacts = /* @__PURE__ */ new Map();
    order.filter((node) => node.matches(".textwidget")).filter((widget) => !widget.querySelector("img") && !isTimeline(widget) && widget.textContent.trim()).forEach((widget) => {
      const children = [...widget.children].map((child) => child.cloneNode(true));
      if (firstTile < 0 || order.indexOf(widget) < firstTile) {
        intro.push(...children);
        return;
      }
      const grid = widget.closest(".panel-grid") || content;
      if (!contacts.has(grid)) contacts.set(grid, []);
      contacts.get(grid).push(children);
    });
    const outro = [...contacts.values()].flatMap((cells) => cells.length > 1 ? [WebImporter.DOMUtils.createTable([["Columns"], cells], document)] : cells[0]);
    return { intro, outro };
  }
  function leakedDescription(document, hero) {
    var _a;
    const og = document.querySelector('meta[property="og:description"]');
    if (!/^\s*Tweets by\b/i.test((og == null ? void 0 : og.content) || "")) return void 0;
    og.remove();
    return ((_a = hero.querySelector(".hero-caption .perex")) == null ? void 0 : _a.textContent.trim()) || void 0;
  }
  var import_press_kit_hub_default = {
    transform: ({ document, url, params }) => {
      const article = document.querySelector("article.press_kit");
      const hero = article == null ? void 0 : article.querySelector(":scope > .hero");
      const content = article == null ? void 0 : article.querySelector(":scope > .content");
      if (!article || !hero || !content) throw new Error("Expected a press-kit tiles hub with hero and content");
      const facets = sourceFacets(article);
      const description = leakedDescription(document, hero);
      if (description) facets.description = description;
      const heroBlock = parseHero(hero, document);
      const tilesBlock = parseTiles(content, document);
      const banners = bannerLinks(content, document);
      const { intro, outro } = textWidgets(content, document);
      const main = document.body;
      main.replaceChildren(article);
      article.replaceChildren(heroBlock);
      if (intro.length) article.append(document.createElement("hr"), ...intro);
      article.append(document.createElement("hr"), tilesBlock);
      if (banners.length) {
        article.append(document.createElement("hr"), ...banners);
        article.append(WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { Style: "press-kit-banners" }
        }));
      }
      if (outro.length) article.append(document.createElement("hr"), ...outro);
      const payload = {
        document,
        url,
        params,
        template: { metadata: facets }
      };
      transform("afterTransform", main, payload);
      transform2("afterTransform", main, payload);
      WebImporter.rules.transformBackgroundImages(main, document);
      normalizeImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const pathname = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      return [{
        element: main,
        path: WebImporter.FileUtils.sanitizePath(pathname || "/index"),
        report: { title: document.title, template: "press-kit-hub", blocks: ["hero", "tiles"] }
      }];
    }
  };
  return __toCommonJS(import_press_kit_hub_exports);
})();
