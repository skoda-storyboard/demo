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
  open: 'View image',
};

/**
 * Inline SVG download icon (Trusted-Types safe: createElementNS, no innerHTML).
 * Reproduces the source icon-font glyph (\e012, `skoda-bnr-icons`): a thin
 * line-style down arrow (vertical stem + chevron head) over a separate tray
 * baseline. Stroked (not filled) to match the source weight; currentColor.
 * @returns {SVGElement}
 */
function downloadIcon() {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'square');
  svg.setAttribute('stroke-linejoin', 'miter');
  svg.setAttribute('aria-hidden', 'true');
  // vertical stem + chevron arrowhead, then a detached tray baseline underneath
  const arrow = document.createElementNS(NS, 'path');
  arrow.setAttribute('d', 'M12 3 V15 M6.5 10 L12 15.5 L17.5 10');
  const base = document.createElementNS(NS, 'path');
  base.setAttribute('d', 'M4 20 H20');
  svg.append(arrow, base);
  return svg;
}

/**
 * Read an optional leading config block into settings. The config block is a
 * set of single-row key/value pairs (spec §7 table): `source`, `postid`,
 * `lang`, `columns`, `sizes`. A key/value row has exactly two cells; anything
 * else (an image/title/link asset row) is left untouched. Returns the parsed
 * config and removes only the rows it consumed.
 * @param {Element} block
 * @returns {{source: string, postid: string, lang: string, columns: string|null, sizes: string[]}}
 */
function readConfig(block) {
  const cfg = {
    source: 'authored', postid: '', lang: 'en', columns: null, sizes: [],
  };
  const keys = new Set(['source', 'postid', 'lang', 'columns', 'sizes']);
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length !== 2 || cells[0].querySelector('img, a')) return;
    const key = cells[0].textContent.trim().toLowerCase();
    if (!keys.has(key)) return;
    const value = cells[1].textContent.trim();
    if (key === 'sizes') cfg.sizes = value.split(',').map((s) => s.trim()).filter(Boolean);
    else cfg[key] = value;
    row.remove(); // consume the config row
  });
  return cfg;
}

/**
 * Fetch the source mediabox for a post and map it to asset descriptors. Each
 * `images[]` entry becomes one tile with the configured download sizes derived
 * from the base image URL. Degrades to an empty list on any failure (per the
 * repo's self-contained-fetch convention). No cart, no signed URL.
 * @param {{postid: string, lang: string, sizes: string[]}} cfg
 * @returns {Promise<Array<{src: string, title: string, sizes: Array<{label, href}>}>>}
 */
async function fetchMediabox(cfg) {
  const sizes = cfg.sizes.length ? cfg.sizes : ['Original', '1920px'];
  try {
    const res = await fetch(`/mediakit/v1/mediabox/post/${cfg.postid}/${cfg.lang}`);
    if (!res.ok) throw new Error(`mediabox ${res.status}`);
    const data = await res.json();
    return (data.images || []).map((im) => {
      const base = (im.link || im.imageUrl || '').split('?')[0];
      const title = im.title || im.translated || '';
      const assetSizes = base ? sizes.map((label) => ({
        label,
        // "Original" = base file; a pixel label (e.g. "1920px") → width query
        href: /original/i.test(label) ? base : `${base}?width=${parseInt(label, 10) || 1920}&format=jpg`,
      })) : [];
      return { src: im.imageUrl || base, title, sizes: assetSizes };
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('downloads: mediabox fetch failed', e);
    return [];
  }
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
 * @returns {{src: string, alt: string, title: string, sizes: Array<{label,href}>}}
 */
function readAsset(row) {
  const cells = [...row.children];
  let src = '';
  let alt = '';
  let title = '';
  const sizes = [];

  cells.forEach((cell) => {
    if (isImageCell(cell)) {
      const img = cell.querySelector('img');
      src = img.src;
      alt = img.getAttribute('alt') || '';
    } else if (isLinksCell(cell)) {
      cell.querySelectorAll('a[href]').forEach((a) => {
        sizes.push({ label: a.textContent.trim(), href: a.getAttribute('href') });
      });
    } else if (cell.textContent.trim()) {
      title = cell.textContent.trim();
    }
  });

  return {
    src, alt, title, sizes,
  };
}

// per-page counter → unique size-menu ids when >1 dropdown on a page (so the
// toggle's aria-controls references its own menu). Mirrors listing.js.
let menuSeq = 0;

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
  menuSeq += 1;
  const menuId = `downloads-sizes-${menuSeq}`;
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'downloads-download';
  toggle.setAttribute('aria-label', LABELS.sizes(title));
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-haspopup', 'true');
  toggle.setAttribute('aria-controls', menuId);
  toggle.append(downloadIcon());

  const menu = document.createElement('ul');
  menu.className = 'downloads-sizes';
  menu.id = menuId;
  menu.setAttribute('role', 'menu');
  menu.hidden = true;
  sizes.forEach(({ label, href }) => {
    const li = document.createElement('li');
    li.setAttribute('role', 'none');
    const a = document.createElement('a');
    a.className = 'downloads-size';
    a.href = href;
    a.setAttribute('role', 'menuitem');
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
 * Build one download tile (<li>) from a normalized asset descriptor. Shared by
 * both the authored and mediabox-API paths.
 * @param {{src: string, alt?: string, title: string, sizes: Array<{label,href}>}} asset
 * @returns {HTMLLIElement|null} null if the asset has no image
 */
function buildTile(asset) {
  if (!asset.src) return null;

  const li = document.createElement('li');
  li.className = 'downloads-item';

  const figure = document.createElement('figure');
  figure.className = 'downloads-figure';

  // 16:9 thumbnail linking to the full-size image. A real <a> gives a working,
  // keyboard-operable affordance without a cross-block dependency; the live
  // colorbox-style modal is deferred to the shared gallery-lightbox util
  // (SKODA-203 ships it inside blocks/gallery; AGENTS.md forbids cross-block
  // import, so reuse waits on a /scripts/ extraction — tracked separately).
  const thumb = document.createElement('a');
  thumb.className = 'downloads-thumb';
  [thumb.href] = asset.src.split('?');
  thumb.setAttribute('aria-label', `${LABELS.open} ${asset.title}`.trim());
  thumb.append(createOptimizedPicture(asset.src, asset.alt || asset.title, false, [
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
  return li;
}

/**
 * @param {Element} block the downloads block element
 */
export default async function decorate(block) {
  // read + consume any leading config rows (source / postid / lang / columns / sizes)
  const cfg = readConfig(block);

  const list = document.createElement('ul');
  list.className = 'downloads-items';
  // set the desktop (>=992) column count only, so the mobile→tablet ladder
  // (1 → 2) still applies; CSS defaults --dl-cols-lg to 4
  if (cfg.columns && /^\d+$/.test(cfg.columns)) {
    list.style.setProperty('--dl-cols-lg', cfg.columns);
  }

  // gather assets: from the mediabox API (source=mediabox) or authored rows
  let assets;
  if (cfg.source === 'mediabox' && cfg.postid) {
    assets = await fetchMediabox(cfg);
  } else {
    assets = [...block.children].map(readAsset);
  }

  assets.forEach((asset) => {
    const tile = buildTile(asset);
    if (tile) list.append(tile);
  });

  block.replaceChildren(list);
}
