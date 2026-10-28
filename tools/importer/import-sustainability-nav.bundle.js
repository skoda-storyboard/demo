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

  // tools/importer/import-sustainability-nav.js
  var import_sustainability_nav_exports = {};
  __export(import_sustainability_nav_exports, {
    default: () => import_sustainability_nav_default
  });

  // tools/importer/locale-chrome.js
  var LIVE_HOST = /^(?:www\.)?skoda-storyboard\.com$/i;
  var text = (el) => el ? el.textContent.replace(/\s+/g, " ").trim() : "";
  function authoredHref(href) {
    if (!href) return "";
    if (href.startsWith("#")) return href;
    try {
      const url = new URL(href, "https://www.skoda-storyboard.com");
      if (/^#s_[ac]id=/.test(url.hash)) url.hash = "";
      if (LIVE_HOST.test(url.hostname)) return `${url.pathname}${url.search}${url.hash}`;
      return url.href;
    } catch (e) {
      return href;
    }
  }
  function link(document, href, label, title) {
    const a = document.createElement("a");
    a.href = authoredHref(href);
    a.textContent = label;
    if (title) a.title = title;
    return a;
  }
  function para(document, ...children) {
    const p = document.createElement("p");
    children.forEach((c, i) => {
      if (i) p.append(" ");
      p.append(c);
    });
    return p;
  }
  function buildSectionNav(document, page) {
    const root = document.createElement("div");
    const pageHref = (href) => /[?&]page_id=/.test(href || "") ? page : href;
    const switcher = document.createElement("ul");
    document.querySelectorAll(".topbar .section-nav a").forEach((a) => {
      const li = document.createElement("li");
      li.append(link(document, pageHref(a.getAttribute("href")), text(a)));
      switcher.append(li);
    });
    if (!switcher.children.length) throw new Error("buildSectionNav: the source topbar has no section tabs");
    root.append(switcher);
    const lang = document.querySelector(".topbar .lang-links");
    if (lang) {
      const locales = document.createElement("p");
      if (![...lang.children].some((el) => !el.matches("a"))) {
        const strong = document.createElement("strong");
        strong.textContent = (page.split("/")[1] || "en").toUpperCase();
        locales.append(strong);
      }
      [...lang.children].forEach((el) => {
        if (locales.childNodes.length) locales.append(" ");
        if (el.matches("a")) {
          locales.append(link(document, el.getAttribute("href"), text(el).toUpperCase()));
        } else {
          const strong = document.createElement("strong");
          strong.textContent = text(el).toUpperCase();
          locales.append(strong);
        }
      });
      root.append(locales);
    }
    root.append(document.createElement("hr"));
    const logo = document.querySelector("header a.logo");
    root.append(para(document, link(document, pageHref(logo ? logo.getAttribute("href") : page), "\u0160koda Storyboard", (logo == null ? void 0 : logo.getAttribute("title")) || "\u0160koda Storyboard")));
    root.append(document.createElement("hr"));
    const form = document.querySelector(".search-bar form.search-form");
    const label = (document.querySelector('.search-bar input[type="search"]') || {}).placeholder || "Search";
    root.append(para(document, link(document, form ? form.getAttribute("action") : "/en/search", label, label)));
    return root;
  }

  // tools/importer/import-sustainability-nav.js
  var import_sustainability_nav_default = {
    transform: ({ document, params }) => {
      const page = new URL(params.originalURL).pathname;
      const element = buildSectionNav(document, page);
      return [{ element, path: "/sustainability/nav", report: { fragment: "nav", page } }];
    }
  };
  return __toCommonJS(import_sustainability_nav_exports);
})();
