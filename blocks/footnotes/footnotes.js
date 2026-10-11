const BLOCK_LEVEL = 'p, ul, ol';

const hasContent = (el) => el.textContent.trim() || el.querySelector('a[href], img, picture');

// One cell → its paragraphs. Authored paragraphs and lists are kept as they are; each run of
// bare inline content around them (text an author typed straight into the cell, an image)
// becomes a paragraph, so nothing authored is lost. Empty paragraphs are dropped.
function cellParagraphs(cell) {
  const out = [];
  let run = null;
  [...cell.childNodes].forEach((node) => {
    if (node.nodeType === Node.COMMENT_NODE) return;
    if (node.nodeType === Node.ELEMENT_NODE && node.matches(BLOCK_LEVEL)) {
      run = null;
      out.push(node);
      return;
    }
    if (!run) {
      if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) return;
      run = document.createElement('p');
      out.push(run);
    }
    run.append(node);
  });
  return out.filter(hasContent);
}

/**
 * Footnotes (SKODA-805d, contract `footnotes` v1): the press-kit small print. Each row is one
 * paragraph of footnotes (several lines may share it, split by line breaks); the block renders
 * them as plain paragraphs and sets the small type. Empty rows and cells are dropped.
 * @param {Element} block
 */
export default function decorate(block) {
  const paragraphs = [...block.children]
    .flatMap((row) => [...row.children])
    .flatMap(cellParagraphs);
  block.replaceChildren(...paragraphs);
}
