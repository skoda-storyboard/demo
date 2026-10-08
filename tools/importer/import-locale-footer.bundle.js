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

  // tools/importer/import-locale-footer.js
  var import_locale_footer_exports = {};
  __export(import_locale_footer_exports, {
    default: () => import_locale_footer_default
  });

  // tools/importer/locale-chrome.js
  var LIVE_HOST = /^(?:www\.)?skoda-storyboard\.com$/i;
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
  function buildFooter(document) {
    const footer = document.querySelector("footer");
    const root = document.createElement("div");
    if (!footer) return root;
    const iconLink = (href, name) => {
      const a = document.createElement("a");
      a.href = authoredHref(href);
      a.title = name;
      a.textContent = `:${name}:`;
      return a;
    };
    const badges = [...footer.querySelectorAll(".app-download-buttons a")].map((a) => iconLink(
      a.getAttribute("href"),
      /apple/i.test(a.getAttribute("href") || "") ? "appstore" : "googleplay"
    ));
    const socials = [...footer.querySelectorAll(".social-links a")].map((a) => iconLink(
      a.getAttribute("href"),
      ((a.className.match(/icon-([a-z]+)/) || [])[1] || text(a)).toLowerCase()
    ));
    root.append(para(document, ...badges), para(document, ...socials));
    root.append(document.createElement("hr"));
    const menu = footer.querySelector(".footer-nav ul.menu");
    if (menu) root.append(menuList(document, menu, { keepHeading: false, newsletter: false }));
    root.append(document.createElement("hr"));
    const notice = footer.querySelector(".copyright-text p");
    if (notice) {
      const p = document.createElement("p");
      p.innerHTML = notice.innerHTML.replace(/\s+/g, " ").replace(/\s+([,.])/g, "$1").trim();
      p.querySelectorAll("a").forEach((a) => {
        a.setAttribute("href", authoredHref(a.getAttribute("href")));
        ["class", "target", "rel"].forEach((attr) => a.removeAttribute(attr));
      });
      root.append(p);
    }
    root.append(para(document, text(footer.querySelector(".copyright-notice"))));
    const feeds = [...footer.querySelectorAll(".feed-links a")].map((a) => link(document, a.getAttribute("href"), text(a)));
    if (feeds.length) root.append(para(document, ...feeds));
    return root;
  }

  // tools/importer/import-locale-footer.js
  var import_locale_footer_default = {
    transform: ({ document, params }) => {
      const locale = localeOfUrl(params.originalURL);
      const element = buildFooter(document, locale);
      return [{ element, path: `/${locale}/footer`, report: { locale, fragment: "footer" } }];
    }
  };
  return __toCommonJS(import_locale_footer_exports);
})();
