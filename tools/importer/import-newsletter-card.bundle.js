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

  // import-newsletter-card.js
  var import_newsletter_card_exports = {};
  __export(import_newsletter_card_exports, {
    default: () => import_newsletter_card_default
  });

  // transformers/skoda-story-aside.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var NEWSLETTER_BLOCK = "Newsletter Stub (card)";
  var NEWSLETTER_DEFAULTS = {
    label: "Email address",
    message: "Newsletter signup is not available yet",
    error: "Please enter a valid e-mail address.",
    "consent-error": "Please accept the terms before continuing."
  };
  var squash = (s) => (s || "").replace(/[ \t\r\n]+/g, " ").trim();
  function inlineNodes(source, document2) {
    const nodes = [];
    source.childNodes.forEach((n) => {
      if (n.nodeType === 3) {
        const t = n.nodeValue.replace(/[ \t\r\n]+/g, " ");
        if (t) nodes.push(document2.createTextNode(t));
      } else if (n.nodeName === "BR") {
        nodes.push(document2.createElement("br"));
      } else if (n.nodeName === "A" && n.getAttribute("href")) {
        const a = document2.createElement("a");
        a.setAttribute("href", n.getAttribute("href"));
        a.textContent = squash(n.textContent);
        if (a.textContent) nodes.push(a);
      } else if (n.nodeType === 1) {
        const t = squash(n.textContent);
        if (t) nodes.push(document2.createTextNode(t));
      }
    });
    const edge = (i, re) => {
      while (nodes.length && nodes[i()].nodeType === 3) {
        const n = nodes[i()];
        n.nodeValue = n.nodeValue.replace(re, "");
        if (n.nodeValue) break;
        nodes.splice(i(), 1);
      }
    };
    edge(() => 0, /^[ \u00a0]+/);
    edge(() => nodes.length - 1, /[ \u00a0]+$/);
    return nodes.filter((n) => n.nodeType !== 3 || n.nodeValue);
  }
  function newsletterCard(widget, document2) {
    const rows = [[NEWSLETTER_BLOCK]];
    const add = (key, value2) => {
      if (Array.isArray(value2) ? value2.length : value2) rows.push([key, value2]);
    };
    const value = (sel, attr) => {
      const el = widget.querySelector(sel);
      if (!el) return "";
      return squash(attr ? el.getAttribute(attr) : el.textContent);
    };
    const src = widget.querySelector("header img");
    if (src && src.getAttribute("src")) {
      const img = document2.createElement("img");
      img.setAttribute("src", src.getAttribute("src"));
      img.setAttribute("alt", "");
      add("image", [img]);
    }
    const heading = widget.querySelector("header h1, header h2, header h3, header h4");
    if (heading) add("heading", inlineNodes(heading, document2));
    add("label", NEWSLETTER_DEFAULTS.label);
    add("placeholder", value('input[type="email"], input.email', "placeholder"));
    add("button", value('button[type="submit"], button'));
    const terms = widget.querySelector(".terms label, label[for]");
    if (terms) {
      const label = terms.cloneNode(true);
      label.querySelectorAll(".manage-subscription-link").forEach((n) => n.remove());
      add("consent", inlineNodes(label, document2));
    }
    const manage = widget.querySelector(".manage-subscription-link a[href]");
    if (manage && squash(manage.textContent)) {
      const a = document2.createElement("a");
      a.setAttribute("href", manage.getAttribute("href"));
      a.textContent = squash(manage.textContent);
      add("manage", [a]);
    }
    add("message", NEWSLETTER_DEFAULTS.message);
    add("error", NEWSLETTER_DEFAULTS.error);
    add("consent-error", value(".checkbox-error") || NEWSLETTER_DEFAULTS["consent-error"]);
    add("list", value('input[name="list"]', "value"));
    add("language", value('input[name="language"]', "value"));
    return rows.some(([k]) => k === "heading" || k === "button") ? rows : null;
  }
  function relatedCards(sidebar, document2) {
    const matched = [...sidebar.querySelectorAll(".related .article-teaser, .related article")];
    const teasers = matched.filter((el, i, arr) => arr.indexOf(el) === i).filter((el) => !matched.some((other) => other !== el && other.contains(el)));
    if (!teasers.length) return null;
    const cells = [["Cards (overlay)"]];
    let emitted = 0;
    teasers.forEach((t) => {
      const img = t.querySelector("img");
      const link = t.querySelector("a[href]");
      const titleEl = t.querySelector(".title, h2, h3, h4");
      const title = titleEl && titleEl.textContent.trim() || img && img.getAttribute("alt") || link && link.textContent.trim() || "";
      if (!link && !img) return;
      const content = [];
      if (title) {
        const h = document2.createElement("h3");
        if (link) {
          const a = document2.createElement("a");
          a.setAttribute("href", link.getAttribute("href"));
          a.textContent = title;
          h.appendChild(a);
        } else {
          h.textContent = title;
        }
        content.push(h);
      }
      cells.push([img || "", content]);
      emitted += 1;
    });
    return emitted ? cells : null;
  }
  function tagsCell(sidebar, document2) {
    const anchors = [...sidebar.querySelectorAll(".tags a.label[href], section.tags a[href], ol.entry-tags a[href]")].filter((el, i, arr) => arr.indexOf(el) === i);
    if (!anchors.length) return null;
    const cell = [];
    anchors.forEach((a) => {
      const href = a.getAttribute("href");
      const text2 = (a.textContent || "").trim();
      if (!href || !text2) return;
      if (href === "#" || a.classList.contains("show-hidden-terms")) return;
      const link = document2.createElement("a");
      link.setAttribute("href", href);
      link.textContent = text2;
      cell.push(link);
    });
    return cell.length ? [["Tags"], [cell]] : null;
  }
  function transform(hookName, element, payload) {
    const widgets = () => element.querySelectorAll(".sidebar .newsletter-subscribe-widget");
    if (hookName === "newsletter-card") {
      const doc = element.ownerDocument || payload && payload.document;
      widgets().forEach((widget) => {
        const rows = newsletterCard(widget, doc);
        if (rows) widget.replaceWith(WebImporter.DOMUtils.createTable(rows, doc));
        else widget.remove();
      });
      return;
    }
    if (hookName === "preprocess") {
      widgets().forEach((widget) => {
        const sidebar2 = widget.closest(".sidebar");
        if (sidebar2 && newsletterCard(widget, element.ownerDocument)) sidebar2.setAttribute("data-newsletter-card", "shared");
        widget.remove();
      });
      return;
    }
    if (hookName !== TransformHook.afterTransform) return;
    const sidebar = element.querySelector(".sidebar");
    if (!sidebar) return;
    const cards = relatedCards(sidebar, document);
    const tags = tagsCell(sidebar, document);
    const newsletter = sidebar.getAttribute("data-newsletter-card") === "shared";
    const frag = document.createElement("div");
    const hr = document.createElement("hr");
    frag.appendChild(hr);
    const aside = document.createElement("aside");
    const heading = sidebar.querySelector(".related .heading, .related h2, .related h3");
    if (heading) {
      const h = document.createElement("h3");
      h.textContent = (heading.textContent || "Explore more").trim();
      aside.appendChild(h);
    }
    if (cards) aside.appendChild(WebImporter.DOMUtils.createTable(cards, document));
    if (tags) {
      const tagsHeading = sidebar.querySelector("section.tags .heading, section.tags h2, section.tags h3");
      if (tagsHeading && (tagsHeading.textContent || "").trim()) {
        const h = document.createElement("h3");
        h.textContent = tagsHeading.textContent.trim();
        aside.appendChild(h);
      }
      aside.appendChild(WebImporter.DOMUtils.createTable(tags, document));
    }
    if (newsletter && !cards && !tags) {
      const source = payload && payload.params && payload.params.originalURL || "";
      let locale = "en";
      try {
        const first = new URL(source).pathname.split("/")[1] || "";
        if (/^[a-z]{2}$/.test(first)) locale = first;
      } catch (e) {
      }
      const link = document.createElement("a");
      link.setAttribute("href", `/${locale}/fragments/newsletter-card`);
      link.textContent = link.getAttribute("href");
      aside.appendChild(WebImporter.DOMUtils.createTable([["Fragment"], [[link]]], document));
    }
    frag.appendChild(aside);
    const metadataBlock = WebImporter.Blocks.createBlock(document, {
      name: "Section Metadata",
      cells: { Style: "sidebar" }
    });
    frag.appendChild(metadataBlock);
    if (!cards && !tags && !newsletter) {
      sidebar.remove();
      return;
    }
    sidebar.replaceWith(...frag.childNodes);
  }

  // transformers/skoda-nbsp.js
  var NBSP_PLACEHOLDER = "\u{F00A0}";
  var GLUED_NBSP = new RegExp("(?<=[^\\s])\\u00a0+(?=[^\\s])", "g");
  function transform2(hookName, element, payload) {
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

  // transformers/skoda-images.js
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
  function editorialCaption(node) {
    if (!node) return "";
    const caption = (node.getAttribute("data-caption") || "").trim();
    if (!caption || node.closest(".article-teaser, .media-cart-image")) return "";
    return caption === (node.getAttribute("data-video_title") || "").trim() ? "" : caption;
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
  var text = (value) => (value || "").replace(/\s+/g, " ").trim();
  function linkedImageAlt(img, root) {
    var _a;
    const link = img.closest("a");
    if (!link || link.querySelectorAll("img").length !== 1 || text(link.textContent)) return "";
    const caption = editorialCaption(img) || editorialCaption(img.closest("[data-caption]"));
    const titled = [link.getAttribute("title"), img.getAttribute("title")].map(text).find(Boolean);
    const heading = [...root.querySelectorAll("h1, h2, h3, h4, h5, h6")].filter(
      (h) => h.compareDocumentPosition(img) & 4
      /* Node.DOCUMENT_POSITION_FOLLOWING */
    ).map((h) => text(h.textContent)).filter(Boolean).pop();
    return text(caption) || titled || heading || text((_a = root.ownerDocument.querySelector("h1")) == null ? void 0 : _a.textContent);
  }
  function normalizeImages(root, document2 = root.ownerDocument) {
    root.querySelectorAll("img").forEach((img) => {
      if (!img.hasAttribute("alt") || !img.getAttribute("alt").trim()) {
        const backfill = linkedImageAlt(img, root);
        if (backfill) {
          img.setAttribute("alt", backfill);
        } else {
          const type = img.hasAttribute("alt") ? "empty" : "missing";
          console.warn(`[image-import] ${type} alt: ${img.getAttribute("src") || "(no src)"}`);
        }
      }
      if (img.closest("table, picture")) return;
      const figure = img.closest("figure");
      const wrapper = img.closest("[data-caption]");
      const wrapperCaption = (wrapper == null ? void 0 : wrapper.querySelectorAll("img").length) === 1 ? editorialCaption(wrapper) : "";
      const caption = (img.hasAttribute("data-caption") ? editorialCaption(img) : "") || wrapperCaption;
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
  function transform3(hookName, element, payload) {
    if (hookName !== "afterTransform") return;
    normalizeImages(element, (payload == null ? void 0 : payload.document) || element.ownerDocument);
  }

  // import-newsletter-card.js
  var NEWSLETTER_BLOCK2 = "Newsletter Stub (card)";
  var PAGE_TEMPLATE = {
    name: "newsletter-card",
    description: "\u0160koda story sidebar newsletter widget \u2192 the shared Newsletter Stub (card) fragment (/{locale}/fragments/newsletter-card). One source story per locale; no Metadata (a fragment).",
    urls: ["https://www.skoda-storyboard.com/en/emobility/skoda-epiq-will-win-you-over-in-just-a-few-seconds/"],
    blocks: [],
    sections: []
  };
  var isCard = (table) => {
    const cell = table.querySelector("tr > th, tr > td");
    return !!cell && (cell.textContent || "").replace(/\s+/g, " ").trim() === NEWSLETTER_BLOCK2;
  };
  function localeOf(url) {
    const first = new URL(url).pathname.split("/")[1] || "";
    return /^[a-z]{2}$/.test(first) ? first : "en";
  }
  var import_newsletter_card_default = {
    // before helix-importer's preProcess drops the widget's empty inputs (see skoda-story-aside)
    preprocess: ({ document: document2 }) => {
      transform2("preprocess", document2.body, { document: document2 });
      transform("newsletter-card", document2.body, { document: document2 });
    },
    transform: (payload) => {
      const { document: document2, url, params } = payload;
      const card = [...document2.querySelectorAll("table")].find(isCard);
      if (!card) throw new Error(`no sidebar newsletter widget on ${params.originalURL}`);
      const main = document2.createElement("div");
      main.append(card);
      transform3("afterTransform", main, payload);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      return [{
        element: main,
        path: `/${localeOf(params.originalURL)}/fragments/newsletter-card`,
        report: { title: "Newsletter card", template: PAGE_TEMPLATE.name, blocks: [NEWSLETTER_BLOCK2] }
      }];
    }
  };
  return __toCommonJS(import_newsletter_card_exports);
})();
