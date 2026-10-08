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

  // tools/importer/import-locale-nav.js
  var import_locale_nav_exports = {};
  __export(import_locale_nav_exports, {
    default: () => import_locale_nav_default
  });

  // tools/importer/locale-chrome.js
  var LIVE_HOST = /^(?:www\.)?skoda-storyboard\.com$/i;
  var LOCALE_ROW = [["en", "EN"], ["cs", "CZ"], ["de", "DE"], ["sk", "SK"], ["sr", "SR"], ["sl", "SL"]];
  var text = (el) => el ? el.textContent.replace(/\s+/g, " ").trim() : "";
  function localeOfUrl(url) {
    return (new URL(url).pathname.split("/")[1] || "en").toLowerCase();
  }
  function authoredHref(href) {
    if (!href) return "";
    if (href.startsWith("#")) return href;
    try {
      const url = new URL(href, "https://www.skoda-storyboard.com");
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
  function menuList(document, source, { keepHeading, newsletter }) {
    const ul = document.createElement("ul");
    [...source.querySelectorAll(":scope > li")].forEach((li) => {
      const top = li.querySelector(":scope > a");
      if (!top) return;
      const item = document.createElement("li");
      const href = top.getAttribute("href") || "";
      if (/^#/.test(href) || /newsletter/i.test(href)) {
        if (!newsletter) return;
        item.append(para(document, link(document, "#newsletter", text(top))));
        ul.append(item);
        return;
      }
      item.append(para(document, link(document, href, text(top))));
      const subs = [];
      li.querySelectorAll(":scope > ul > li > a, :scope > div ul > li > a").forEach((a) => {
        const sub = { href: authoredHref(a.getAttribute("href")), label: text(a), heading: a.parentElement.classList.contains("heading") };
        const prev = subs[subs.length - 1];
        if (prev && prev.href === sub.href && prev.label === sub.label) return;
        subs.push(sub);
      });
      const kept = subs.filter((s, i) => keepHeading || !(s.heading || i === 0 && s.href === authoredHref(href)));
      if (subs.length > 1 && kept.length) {
        const subList = document.createElement("ul");
        kept.forEach((s) => {
          const subItem = document.createElement("li");
          subItem.append(link(document, s.href, s.label));
          subList.append(subItem);
        });
        item.append(subList);
      }
      ul.append(item);
    });
    return ul;
  }
  function buildNav(document, locale) {
    const root = document.createElement("div");
    const topbar = document.querySelector(".topbar");
    const switcher = document.createElement("ul");
    [...topbar ? topbar.querySelectorAll("a") : []].filter((a) => !a.closest(".lang-links") && !a.classList.contains("topbar__newsletter") && !a.closest(".topbar__dropdown")).slice(0, 2).forEach((a) => {
      const li = document.createElement("li");
      li.append(link(document, a.getAttribute("href"), text(a)));
      switcher.append(li);
    });
    const subscribe = document.querySelector(".topbar__newsletter");
    const locales = document.createElement("p");
    LOCALE_ROW.forEach(([code, label2], i) => {
      if (i) locales.append(" ");
      if (code === locale) {
        const strong = document.createElement("strong");
        strong.textContent = label2;
        locales.append(strong);
      } else {
        locales.append(link(document, `/${code}/`, label2));
      }
    });
    root.append(switcher, para(document, link(document, "#subscribe", text(subscribe))), locales);
    root.append(document.createElement("hr"));
    const logo = document.querySelector("header a.logo");
    root.append(para(document, link(document, logo ? logo.getAttribute("href") : `/${locale}/`, "\u0160koda Storyboard", "\u0160koda Storyboard")));
    root.append(document.createElement("hr"));
    const menu = document.querySelector("nav.topnav > ul, nav.topnav ul");
    if (menu) root.append(menuList(document, menu, { keepHeading: true, newsletter: true }));
    root.append(document.createElement("hr"));
    const form = document.querySelector(".search-bar form.search-form");
    const label = (document.querySelector('.search-bar input[type="search"]') || {}).placeholder || "Search";
    root.append(para(document, link(document, form ? form.getAttribute("action") : `/${locale}/search`, label, label)));
    return root;
  }

  // tools/importer/import-locale-nav.js
  var import_locale_nav_default = {
    transform: ({ document, params }) => {
      const locale = localeOfUrl(params.originalURL);
      const element = buildNav(document, locale);
      return [{ element, path: `/${locale}/nav`, report: { locale, fragment: "nav" } }];
    }
  };
  return __toCommonJS(import_locale_nav_exports);
})();
