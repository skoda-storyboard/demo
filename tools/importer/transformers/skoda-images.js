/*
 * Normalize images after block parsing and before WebImporter serializes the page.
 * Block-table cells become divs in DA; default-content images must already be
 * direct div children for the media bus to create responsive pictures.
 *
 * A transformer like the others (`transform(hookName, element, payload)`, SKODA-509), but
 * the importers call it themselves at the end of `afterTransform`, after the shared
 * transformers and `rules.transformBackgroundImages` and before `rules.adjustImageUrls`,
 * not from their `transformers` list: it must see the page every other step has built.
 * The default export is the file's only export: the transformer validator loads it as a classic
 * script, where any other `export` is a syntax error.
 */
function hasContent(node) {
  return [...node.childNodes].some((child) => child.nodeType === 1
    || (child.textContent || '').trim());
}

function withCaption(node, caption, document) {
  if (!caption) return node;
  const figure = document.createElement('figure');
  const figcaption = document.createElement('figcaption');
  figcaption.textContent = caption;
  figure.append(node, figcaption);
  return figure;
}

// Teaser and card thumbnails carry the linked article's excerpt in data-caption
// (mirrored in data-video_title). That is card copy, not an editorial caption.
function editorialCaption(node) {
  if (!node) return '';
  const caption = (node.getAttribute('data-caption') || '').trim();
  if (!caption || node.closest('.article-teaser, .media-cart-image')) return '';
  return caption === (node.getAttribute('data-video_title') || '').trim() ? '' : caption;
}

function imageContainer(img, document, link = null) {
  const div = document.createElement('div');
  div.append(img);
  if (!link) return div;
  link.append(div);
  return link;
}

function splitParagraph(img, paragraph, caption, document) {
  const link = img.closest('a');
  const linkedImage = link && paragraph.contains(link)
    && link.querySelectorAll('img').length === 1 && !(link.textContent || '').trim();
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

const text = (value) => (value || '').replace(/\s+/g, ' ').trim();

/**
 * The text alternative of an image that is a link's only content. An empty alt there leaves the
 * link with no accessible name (WCAG 1.1.1 / 2.4.4, axe link-name; SKODA-703, the source's own
 * Classic Days chapters), so it is backfilled from what the source shows: the image's editorial
 * caption, a non-blank link or image title, then the nearest heading before it, then the page h1.
 * Never the file name. Other empty alts stay empty (a decorative image next to its own text).
 * @returns {string} the alt, or '' when the image isn't a lone linked image or nothing fits
 */
function linkedImageAlt(img, root) {
  const link = img.closest('a');
  if (!link || link.querySelectorAll('img').length !== 1 || text(link.textContent)) return '';
  const caption = editorialCaption(img) || editorialCaption(img.closest('[data-caption]'));
  const titled = [link.getAttribute('title'), img.getAttribute('title')].map(text).find(Boolean);
  const heading = [...root.querySelectorAll('h1, h2, h3, h4, h5, h6')]
    // eslint-disable-next-line no-bitwise
    .filter((h) => h.compareDocumentPosition(img) & 4 /* Node.DOCUMENT_POSITION_FOLLOWING */)
    .map((h) => text(h.textContent)).filter(Boolean).pop();
  return text(caption) || titled || heading || text(root.ownerDocument.querySelector('h1')?.textContent);
}

function normalizeImages(root, document = root.ownerDocument) {
  root.querySelectorAll('img').forEach((img) => {
    if (!img.hasAttribute('alt') || !img.getAttribute('alt').trim()) {
      const backfill = linkedImageAlt(img, root);
      if (backfill) {
        img.setAttribute('alt', backfill);
      } else {
        const type = img.hasAttribute('alt') ? 'empty' : 'missing';
        // eslint-disable-next-line no-console
        console.warn(`[image-import] ${type} alt: ${img.getAttribute('src') || '(no src)'}`);
      }
    }

    // A block cell is serialized as a div by DA; its parser owns the caption
    // cell. Moving it into a figure would change the block's authored shape.
    if (img.closest('table, picture')) return;

    const figure = img.closest('figure');
    const wrapper = img.closest('[data-caption]');
    const wrapperCaption = wrapper?.querySelectorAll('img').length === 1
      ? editorialCaption(wrapper) : '';
    const caption = (img.hasAttribute('data-caption')
      ? editorialCaption(img) : '') || wrapperCaption;
    if (figure) {
      if (img.parentElement.tagName !== 'DIV') {
        const div = document.createElement('div');
        img.replaceWith(div);
        div.append(img);
      }
      if (caption && !figure.querySelector('figcaption')) {
        const figcaption = document.createElement('figcaption');
        figcaption.textContent = caption;
        figure.append(figcaption);
      }
      return;
    }

    const paragraph = img.closest('p');
    if (paragraph) {
      splitParagraph(img, paragraph, caption, document);
      return;
    }

    if (img.parentElement.tagName === 'DIV') {
      if (caption) {
        const div = img.parentElement;
        if (div.childElementCount === 1 && !(div.textContent || '').trim()) {
          const marker = document.createComment('image');
          div.replaceWith(marker);
          marker.replaceWith(withCaption(div, caption, document));
        } else {
          const marker = document.createComment('image');
          img.replaceWith(marker);
          marker.replaceWith(withCaption(imageContainer(img, document), caption, document));
        }
      }
      return;
    }

    const link = img.closest('a');
    const linkedImage = link && link.querySelectorAll('img').length === 1
      && !(link.textContent || '').trim();
    const target = linkedImage ? link : img;
    const marker = document.createComment('image');
    target.replaceWith(marker);
    const imageNode = imageContainer(img, document, linkedImage ? link : null);
    marker.replaceWith(withCaption(imageNode, caption, document));
  });
}

/**
 * The transformer hook: normalizes the page's images on `afterTransform`; other hooks are a no-op.
 * @param {string} hookName the import stage
 * @param {Element} element the page root (`main`)
 * @param {{document?: Document}} payload the importer payload
 */
export default function transform(hookName, element, payload) {
  if (typeof hookName !== 'string') {
    throw new TypeError("skoda-images: expected a string hookName; use imagesTransformer('afterTransform', main, payload).");
  }
  if (hookName !== 'afterTransform') return;
  normalizeImages(element, payload?.document || element.ownerDocument);
}
