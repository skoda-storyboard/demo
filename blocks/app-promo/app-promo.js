/*
 * App Promo (SKODA-810b, docs/ui-specs/company-pages.md, sub-spec D): the media-services app
 * page's body, its SiteOrigin rows as block rows. Each row's part is read from its shape:
 *   - intro:   [picture, text]          the app icon beside the bold intro (17.5% / 82.5%)
 *   - image:   [picture]                the full-width mockup
 *   - split:   [cell, cell]             two equal columns of text and screenshots
 *   - heading: [text]                   the download panel's centred heading
 *   - store:   [picture, picture, …]    the QR code and the store badges (20% / 29% / 29%)
 * A heading row and the store row after it share the download panel (the source's emerald
 * builder). Images keep their own size up to the cell's width, centred; links stay as authored.
 * Rows without content drop.
 */

const isBlank = (node) => node.nodeType === 3 && !node.textContent.trim();
const hasPicture = (cell) => !!cell.querySelector('picture, img');
const isPictureOnly = (cell) => hasPicture(cell) && !cell.textContent.trim();

/** The row's part, from its cells. */
export function partOf(cells) {
  if (cells.length === 1) return isPictureOnly(cells[0]) ? 'image' : 'heading';
  if (cells.length === 2 && isPictureOnly(cells[0]) && !isPictureOnly(cells[1])) return 'intro';
  if (cells.length > 2 && cells.every(isPictureOnly)) return 'store';
  return 'split';
}

/** A cell's content as paragraphs: a one-paragraph cell arrives as bare inline content. */
function paragraphs(cell) {
  const nodes = [...cell.childNodes].filter((n) => !isBlank(n));
  if (nodes.some((n) => n.nodeType === 1 && n.matches('p, ul, ol, h2, h3, h4, h5, h6'))) return;
  const p = document.createElement('p');
  p.append(...cell.childNodes);
  cell.replaceChildren(p);
}

/**
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [];
  [...block.children].forEach((source) => {
    const cells = [...source.children].filter((c) => c.textContent.trim() || hasPicture(c));
    if (!cells.length) return;
    const row = document.createElement('div');
    const part = partOf(cells);
    row.className = `app-promo-row app-promo-${part}`;
    cells.forEach((cell) => {
      paragraphs(cell);
      cell.className = 'app-promo-cell';
      cell.querySelectorAll('p').forEach((p) => {
        if (isPictureOnly(p)) p.classList.add('app-promo-picture');
      });
      row.append(cell);
    });
    rows.push(row);
  });
  // the download panel: a heading row with the store row after it
  const out = [];
  rows.forEach((row, i) => {
    const prev = out[out.length - 1];
    if (row.classList.contains('app-promo-store') && prev?.classList.contains('app-promo-panel')) {
      prev.append(row);
      return;
    }
    if (row.classList.contains('app-promo-heading') && rows[i + 1]?.classList.contains('app-promo-store')) {
      const panel = document.createElement('div');
      panel.className = 'app-promo-panel';
      panel.append(row);
      out.push(panel);
      return;
    }
    out.push(row);
  });
  block.replaceChildren(...out);
}
