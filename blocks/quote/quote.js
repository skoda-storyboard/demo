// One [quote, attribution] row → figure > blockquote + figcaption. An empty attribution
// cell (the importer keeps it) renders no caption.
function figureFor(row) {
  const [quote, attribution] = [...row.children];
  const figure = document.createElement('figure');
  const text = document.createElement('blockquote');
  text.className = 'quote-text';
  text.append(...(quote?.childNodes || []));
  figure.append(text);
  if (attribution?.textContent.trim()) {
    const caption = document.createElement('figcaption');
    caption.className = 'quote-attribution';
    caption.append(...attribution.childNodes);
    figure.append(caption);
  }
  return figure;
}

/**
 * Quote (SKODA-220, contract `quote` v1): each row is the source's centred pull-quote. The
 * short rule between quote and attribution is CSS, because a bare <hr> would split the DA
 * section. `Quote (left)` is the press-kit chapters' left-aligned quote, without the rule.
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children].filter((row) => row.textContent.trim());
  block.replaceChildren(...rows.map(figureFor));
}
