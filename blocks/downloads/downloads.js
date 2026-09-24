/*
 * Downloads block (SKODA-502) — the static "Media Box" download grid.
 *
 * A thumbnail grid where each tile is one downloadable asset: a 16:9 image
 * (opens the lightbox via the gallery-lightbox convention) plus a round
 * download control offering the authored size(s) (e.g. Original / 1920px).
 * This is the STATIC per-page download list — no cart, no server state, no
 * signed-URL service (that is the Media Cart, SKODA-505/902). Spec:
 * docs/ui-specs/downloads.md.
 *
 * Authored as one row per asset (content-sniffed, never by position):
 *
 *   | Downloads                                        |
 *   | ![](1.jpg) | Škoda Octavia front | [Original](o.jpg) [1920px](o-1920.jpg) |
 *
 *   - image cell = a cell whose only child wraps a <picture>
 *   - links cell = a cell whose links are the download sizes (link text = size label)
 *   - any remaining text cell = the tile title
 *
 * i18n: user-facing control text lives in LABELS (single translation point).
 * Decoration is defensive: authors omit/add cells, so every lookup is guarded.
 */

import { createOptimizedPicture } from '../../scripts/aem.js';

const LABELS = {
  // aria-label for a download link, e.g. "Download Škoda Octavia front (Original)"
  download: (title, size) => `Download ${title}${size ? ` (${size})` : ''}`,
  // aria-label for the size-menu toggle
  sizes: (title) => `Download sizes for ${title}`,
  open: 'Open image',
};

/**
 * Inline SVG download icon (Trusted-Types safe: createElementNS, no innerHTML).
 * Replaces the source icon-font glyph (\e012). Filled house-style, currentColor.
 * @returns {SVGElement}
 */
function downloadIcon() {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('fill', 'currentColor');
  svg.setAttribute('aria-hidden', 'true');
  // tray + down arrow (matches the project house-style)
  const d = 'M12,3c0.6,0,1,0.4,1,1v9.6l2.9-2.9c0.4-0.4,1-0.4,1.4,0c0.4,0.4,0.4,1,0,1.4l-4.6,4.6c-0.4,0.4-1,0.4-1.4,0l-4.6-4.6c-0.4-0.4-0.4-1,0-1.4c0.4-0.4,1-0.4,1.4,0l2.9,2.9V4C11,3.4,11.4,3,12,3z M4,15c0.6,0,1,0.4,1,1v3h14v-3c0-0.6,0.4-1,1-1s1,0.4,1,1v4c0,0.6-0.4,1-1,1H4c-0.6,0-1-0.4-1-1v-4C3,15.4,3.4,15,4,15z';
  const p = document.createElementNS(NS, 'path');
  p.setAttribute('d', d);
  svg.append(p);
  return svg;
}

/** A cell is an image cell when it contains an <img> (bare or wrapped). */
function isImageCell(cell) {
  return !!cell.querySelector('img');
}

/** A cell is a links cell when it has links and no image. */
function isLinksCell(cell) {
  const links = cell.querySelectorAll('a[href]');
  return links.length > 0 && !cell.querySelector('img');
}

/**
 * Read one authored row into an asset descriptor by content-sniffing its cells.
 * @param {Element} row
 * @returns {{img: HTMLImageElement|null, title: string, sizes: Array<{label,href}>}}
 */
function readAsset(row) {
  const cells = [...row.children];
  let img = null;
  let title = '';
  const sizes = [];

  cells.forEach((cell) => {
    if (isImageCell(cell)) {
      img = cell.querySelector('img');
    } else if (isLinksCell(cell)) {
      cell.querySelectorAll('a[href]').forEach((a) => {
        sizes.push({ label: a.textContent.trim(), href: a.getAttribute('href') });
      });
    } else if (cell.textContent.trim()) {
      title = cell.textContent.trim();
    }
  });

  return { img, title, sizes };
}

/**
 * Build the round download control for a tile. With one size it is a single
 * download <a>; with several it is a toggle button revealing a size menu, each
 * row a direct-download <a> (no server round-trip, no signed URL).
 * @param {{title: string, sizes: Array<{label,href}>}} asset
 * @returns {Element|null}
 */
function buildDownload(asset) {
  const { title, sizes } = asset;
  if (!sizes.length) return null;

  const wrap = document.createElement('div');
  wrap.className = 'downloads-action';

  // single size → one round download link, no menu
  if (sizes.length === 1) {
    const { label, href } = sizes[0];
    const a = document.createElement('a');
    a.className = 'downloads-download';
    a.href = href;
    a.setAttribute('download', '');
    a.setAttribute('aria-label', LABELS.download(title, label));
    a.append(downloadIcon());
    wrap.append(a);
    return wrap;
  }

  // multiple sizes → toggle button + menu of direct-download links
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'downloads-download';
  toggle.setAttribute('aria-label', LABELS.sizes(title));
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-haspopup', 'true');
  toggle.append(downloadIcon());

  const menu = document.createElement('ul');
  menu.className = 'downloads-sizes';
  menu.hidden = true;
  sizes.forEach(({ label, href }) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.className = 'downloads-size';
    a.href = href;
    a.setAttribute('download', '');
    a.setAttribute('aria-label', LABELS.download(title, label));
    a.textContent = label;
    li.append(a);
    menu.append(li);
  });

  const setOpen = (on) => {
    menu.hidden = !on;
    toggle.setAttribute('aria-expanded', on ? 'true' : 'false');
  };
  toggle.addEventListener('click', () => setOpen(menu.hidden));
  // close on outside click / Escape
  toggle.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  menu.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { setOpen(false); toggle.focus(); }
  });
  document.addEventListener('click', (e) => {
    if (!wrap.contains(e.target)) setOpen(false);
  });

  wrap.append(toggle, menu);
  return wrap;
}

/**
 * @param {Element} block the downloads block element
 */
export default function decorate(block) {
  // optional columns config: a leading single-cell row holding just a number
  // (authored galleries usually omit it — CSS falls back to --dl-cols default)
  let columns = null;
  const firstRow = block.firstElementChild;
  if (firstRow && firstRow.children.length === 1 && /^\d+$/.test(firstRow.textContent.trim())) {
    columns = firstRow.textContent.trim();
    firstRow.remove();
  }

  const list = document.createElement('ul');
  list.className = 'downloads-items';
  // set the desktop (>=992) column count only, so the mobile→tablet ladder
  // (1 → 2) still applies; CSS defaults --dl-cols-lg to 4
  if (columns) list.style.setProperty('--dl-cols-lg', columns);

  [...block.children].forEach((row) => {
    const asset = readAsset(row);
    if (!asset.img) return; // skip rows without an image

    const li = document.createElement('li');
    li.className = 'downloads-item';

    const figure = document.createElement('figure');
    figure.className = 'downloads-figure';

    // 16:9 thumbnail that opens the lightbox (button, so it is keyboard-operable)
    const thumb = document.createElement('button');
    thumb.type = 'button';
    thumb.className = 'downloads-thumb';
    thumb.setAttribute('aria-label', `${LABELS.open} ${asset.title}`.trim());
    thumb.append(createOptimizedPicture(asset.img.src, asset.img.alt || asset.title, false, [
      { media: '(min-width: 768px)', width: '750' },
      { width: '500' },
    ]));
    figure.append(thumb);

    if (asset.title) {
      const cap = document.createElement('figcaption');
      cap.className = 'downloads-title';
      cap.textContent = asset.title;
      figure.append(cap);
    }

    const action = buildDownload(asset);
    if (action) figure.append(action);

    li.append(figure);
    list.append(li);
  });

  block.replaceChildren(list);
}
