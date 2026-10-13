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

  // tools/importer/import-locale-newsletter.js
  var import_locale_newsletter_exports = {};
  __export(import_locale_newsletter_exports, {
    default: () => import_locale_newsletter_default
  });

  // tools/importer/locale-chrome.js
  var LIVE_HOST = /^(?:www\.)?skoda-storyboard\.com$/i;
  var NEWSLETTER_LANGUAGE = { cs: "cs_CZ", de: "de_DE", sk: "sk_SK", sr: "sr_RS", sl: "sl_SI" };
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
  function buildNewsletter(document, locale, { message } = {}) {
    const form = document.querySelector(".topbar__dropdown__newsletter form");
    const root = document.createElement("div");
    if (!form) return root;
    const consentLabel = form.querySelector(".terms label");
    const consent = document.createElement("div");
    if (consentLabel) {
      const copy = consentLabel.cloneNode(true);
      copy.querySelectorAll(".manage-subscription-link, input").forEach((el) => el.remove());
      copy.querySelectorAll("a").forEach((a) => {
        a.setAttribute("href", authoredHref(a.getAttribute("href")));
        ["class", "target", "rel"].forEach((attr) => a.removeAttribute(attr));
      });
      consent.innerHTML = copy.innerHTML.replace(/\s+/g, " ").trim();
    }
    const manageSource = form.querySelector(".manage-subscription-link a");
    const manage = manageSource ? link(document, manageSource.getAttribute("href"), text(manageSource)) : "";
    const value = (sel) => (form.querySelector(sel) || {}).value || "";
    const cells = [
      ["Newsletter Stub (topbar)"],
      ["label", text(form.querySelector("label[for]"))],
      ["placeholder", (form.querySelector('input[type="email"]') || {}).placeholder || ""],
      ["button", text(form.querySelector(".topbar__dropdown__newsletter-form button"))],
      ["consent", consent],
      ["manage", manage],
      ["message", message || ""],
      ["list", value('input[name="list"]')],
      ["language", value('input[name="language"]') || NEWSLETTER_LANGUAGE[locale] || ""]
    ];
    root.append(WebImporter.DOMUtils.createTable(cells, document));
    return root;
  }

  // tools/importer/import-locale-newsletter.js
  var MESSAGE = "Thank you for your interest. Newsletter sign-up will be available soon.";
  var import_locale_newsletter_default = {
    transform: ({ document, params }) => {
      const locale = localeOfUrl(params.originalURL);
      const element = buildNewsletter(document, locale, { message: MESSAGE });
      return [{ element, path: `/${locale}/nav-newsletter`, report: { locale, fragment: "nav-newsletter" } }];
    }
  };
  return __toCommonJS(import_locale_newsletter_exports);
})();
