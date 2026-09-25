/*
 * Normalize images after block parsing and before WebImporter serializes the page.
 * Block-table cells become divs in DA; default-content images must already be
 * direct div children for the media bus to create responsive pictures.
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

export default function normalizeImages(root, document = root.ownerDocument) {
  root.querySelectorAll('img').forEach((img) => {
    if (!img.hasAttribute('alt') || !img.getAttribute('alt').trim()) {
      const type = img.hasAttribute('alt') ? 'empty' : 'missing';
      // eslint-disable-next-line no-console
      console.warn(`[image-import] ${type} alt: ${img.getAttribute('src') || '(no src)'}`);
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
