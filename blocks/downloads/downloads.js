/*
 * Downloads block (SKODA-502) — the static "Media Box" download grid.
 *
 * A thumbnail grid where each tile is one downloadable asset: a 16:9 image
 * (opens the lightbox via the gallery-lightbox convention) plus a round
 * download control offering the authored size(s) (e.g. Original / 1920px).
 * No server state, no signed-URL service (SKODA-902). Spec: docs/ui-specs/downloads.md.
 *
 * Media cart (SKODA-505b, media-cart.md §3): every tile with a download also gets a round
 * "add to media cart" toggle for its original (the size labelled Original, else the first),
 * bound to /scripts/media-cart.js; in a Media Box a group toggle on the section's stats line
 * adds (or removes) all of them at once, as on the source.
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
  download: (title, size) => `Download ${title || size || 'file'}${title && size ? ` (${size})` : ''}`,
  // aria-label for the size-menu toggle
  sizes: (title) => `Download sizes for ${title}`,
  open: 'View image',
  videoPoster: 'View video poster',
  more: 'Show more',
  less: 'Show less',
  // aria-label for a tile's add-to-cart toggle and the Media Box group toggle (until the
  // cart's placeholders labels replace it)
  add: (title) => (title ? `Add to media cart: ${title}` : 'Add to media cart'),
  addAll: 'Add all files to the media cart',
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

function fileIcon() {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 48 48');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('aria-hidden', 'true');
  const page = document.createElementNS(NS, 'path');
  page.setAttribute('d', 'M10 3h19l9 9v33H10z M29 3v10h9 M16 25h16 M16 31h16 M16 37h11');
  svg.append(page);
  return svg;
}

function playIcon() {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  const triangle = document.createElementNS(NS, 'path');
  triangle.setAttribute('d', 'M8 5v14l11-7z');
  triangle.setAttribute('fill', 'currentColor');
  svg.append(triangle);
  return svg;
}

/**
 * Read an optional leading config block into settings. The config block is a
 * set of single-row key/value pairs (spec §7 table): `source`, `postid`,
 * `lang`, `columns`, `sizes`, `collapse`. A key/value row has exactly two cells; anything
 * else (an image/title/link asset row) is left untouched. Returns the parsed
 * config and removes only the rows it consumed.
 * @param {Element} block
 * @returns {{source: string, postid: string, lang: string, columns: string|null,
 *   sizes: string[], collapse: string|null}}
 */
function readConfig(block) {
  const cfg = {
    source: 'authored', postid: '', lang: 'en', columns: null, sizes: [], collapse: null,
  };
  const keys = new Set(['source', 'postid', 'lang', 'columns', 'sizes', 'collapse']);
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
let disclosureSeq = 0;

// controls a clipped tile takes out of the tab order where native `inert` is missing
const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]';

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

/** The link the cart adds for a tile: its original (the source adds originals only). */
export function cartSize(sizes = []) {
  return sizes.find(({ label }) => /original/i.test(label)) || sizes[0] || null;
}

/** The tile image as the cart keeps it: root-relative on this site, else the absolute URL. */
export function cartThumb(src = '') {
  if (!src) return '';
  try {
    const u = new URL(src, window.location.href);
    return u.origin === window.location.origin ? `${u.pathname}${u.search}` : u.href;
  } catch {
    return '';
  }
}

/**
 * The tile's add-to-media-cart toggle: inert (`aria-disabled`) until the cart binds it, which
 * the block does once for all tiles (bindCart).
 * @param {{title: string, alt?: string, src?: string, sizes: Array<{label,href}>}} asset
 * @returns {HTMLButtonElement}
 */
function buildAdd(asset) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'downloads-add';
  const title = asset.title || asset.alt || '';
  btn.setAttribute('aria-label', LABELS.add(title));
  btn.setAttribute('aria-disabled', 'true');
  btn.dataset.href = cartSize(asset.sizes)?.href || '';
  if (title) btn.dataset.title = title;
  const thumb = cartThumb(asset.src);
  if (thumb) btn.dataset.thumb = thumb;
  return btn;
}

/**
 * The block's stats line ("1 video, 3 images, 1 PDF"): the last paragraph of the default content
 * right before this block, when it is plain text (no link or image) and no other block has taken
 * it. Intro copy elsewhere in the section, or a second block's line, is never used.
 * @returns {HTMLParagraphElement|null}
 */
export function statsLine(block) {
  const wrapper = block.parentElement?.classList.contains('downloads-wrapper') ? block.parentElement : block;
  const before = wrapper.previousElementSibling;
  if (!before?.classList.contains('default-content-wrapper')) return null;
  const p = before.lastElementChild;
  if (p?.tagName !== 'P' || !p.textContent.trim() || p.classList.contains('downloads-stats')
    || p.querySelector('a, img, picture')) return null;
  return p;
}

/**
 * The Media Box group toggle (source .search-results-stats .entry-buttons): adds every tile's
 * original that isn't in the cart yet, or removes them all once every one is in. Right-aligned
 * on the block's stats line (statsLine) when there is one, else above the grid. Returns the
 * button (inert until wired).
 */
function buildAddAll(block) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'downloads-add downloads-add-all';
  btn.setAttribute('aria-label', LABELS.addAll);
  btn.setAttribute('aria-disabled', 'true');
  const stats = statsLine(block);
  if (stats) {
    stats.classList.add('downloads-stats');
    stats.append(btn);
  } else {
    const bar = document.createElement('div');
    bar.className = 'downloads-toolbar';
    bar.append(btn);
    block.prepend(bar);
  }
  return btn;
}

/**
 * Bind the tiles' add toggles to the media cart (loaded here, only where a tile has one) and
 * wire the Media Box group toggle.
 * @param {Element} block
 * @param {HTMLButtonElement|null} addAll
 * @param {function(): Promise<object>} [load] the cart + its UI (injectable for tests)
 */
export async function bindCart(block, addAll, load = () => Promise.all([
  import('../../scripts/media-cart.js'),
  import('../../scripts/media-cart-ui.js'),
  import('../../scripts/placeholders.js'),
])) {
  const tiles = [...block.querySelectorAll('.downloads-add:not(.downloads-add-all)')];
  if (!tiles.length) return;
  const [cart, ui, { fetchPlaceholders }] = await load();
  tiles.forEach((btn) => cart.bindCartControl(btn));
  if (!addAll) return;
  // the notice's styles before a partial add can show it (no unstyled flash)
  const [ph] = await Promise.all([fetchPlaceholders(), ui.loadCartStyles()]);
  const labels = ui.cartLabels(ph);
  const live = () => tiles.filter((t) => t.getAttribute('aria-disabled') !== 'true' && t.dataset.href);
  const sync = () => {
    const open = live();
    const full = open.length > 0 && open.every((t) => cart.has(t.dataset.href));
    addAll.toggleAttribute('data-in-cart', full);
    // a toggle keeps its name; pressed says everything is in (a click then removes it all)
    addAll.setAttribute('aria-pressed', String(full));
    addAll.setAttribute('aria-label', labels.addAll);
    if (open.length) addAll.removeAttribute('aria-disabled');
    else addAll.setAttribute('aria-disabled', 'true');
  };
  addAll.addEventListener('click', async () => {
    if (addAll.getAttribute('aria-disabled') === 'true' || addAll.getAttribute('aria-busy') === 'true') return;
    const open = live();
    if (addAll.hasAttribute('data-in-cart')) {
      open.forEach((t) => cart.remove(t.dataset.href));
      return;
    }
    const entries = open.filter((t) => !cart.has(t.dataset.href)).map((t) => ({
      href: t.dataset.href, title: t.dataset.title, thumb: t.dataset.thumb,
    }));
    addAll.setAttribute('aria-busy', 'true');
    try {
      const { added, skipped } = await cart.addMany(entries);
      const refused = skipped.filter((s) => s.reason !== 'duplicate');
      if (!refused.length) return;
      // name the first reason that matters most: a full package beats a network hiccup
      const order = ['limit-items', 'limit-bytes', 'storage', 'network', 'unresolved'];
      const reason = order.find((r) => refused.some((s) => s.reason === r));
      const count = refused.filter((s) => s.reason === reason).length;
      const text = [
        ui.format(labels.addedSome, { added: added.length, total: entries.length }),
        ui.refusalMessage(reason, labels, undefined, count),
      ].filter(Boolean).join(' ');
      ui.showNotice(text, labels);
    } finally {
      addAll.removeAttribute('aria-busy');
      sync();
    }
  });
  cart.onChange(sync);
  addAll.dataset.wired = '';
  sync();
}

/**
 * Build one download tile (<li>) from a normalized asset descriptor. Shared by
 * both the authored and mediabox-API paths.
 * @param {{src: string, alt?: string, title: string, sizes: Array<{label,href}>}} asset
 * @returns {HTMLLIElement|null} null if the asset has neither image nor download
 */
function buildTile(asset) {
  if (!asset.src && !asset.sizes.length) return null;

  const li = document.createElement('li');
  li.className = 'downloads-item';

  const figure = document.createElement('figure');
  figure.className = 'downloads-figure';

  if (asset.src) {
    // Keep the existing image link and size-menu behavior for image and video rows.
    const thumb = document.createElement('a');
    thumb.className = 'downloads-thumb';
    [thumb.href] = asset.src.split('?');
    const isVideo = asset.sizes.length === 1 && /\.mp4(?:[?#]|$)/i.test(asset.sizes[0].href);
    thumb.setAttribute('aria-label', `${isVideo ? LABELS.videoPoster : LABELS.open} ${asset.title}`.trim());
    thumb.append(createOptimizedPicture(asset.src, asset.alt || asset.title, false, [
      { media: '(min-width: 768px)', width: '750' },
      { width: '500' },
    ]));
    if (isVideo) {
      const badge = document.createElement('span');
      badge.className = 'downloads-play';
      badge.setAttribute('aria-hidden', 'true');
      badge.append(playIcon());
      thumb.append(badge);
    }
    figure.append(thumb);
  } else {
    const file = document.createElement('div');
    file.className = 'downloads-file';
    file.append(fileIcon());
    const type = document.createElement('span');
    type.className = 'downloads-file-type';
    type.textContent = asset.sizes[0].label || 'File';
    file.append(type);
    figure.append(file);
  }

  if (asset.title) {
    const cap = document.createElement('figcaption');
    cap.className = 'downloads-title';
    cap.textContent = asset.title;
    figure.append(cap);
  }

  const action = buildDownload(asset);
  if (action) {
    // add to cart, then download (source order); the size menu stays anchored to its toggle
    const actions = document.createElement('div');
    actions.className = 'downloads-actions';
    actions.append(buildAdd(asset), action);
    figure.append(actions);
  }

  li.append(figure);
  return li;
}

/**
 * @param {Element} block the downloads block element
 */
export default async function decorate(block) {
  // read + consume any leading config rows
  const cfg = readConfig(block);
  const mediaBox = block.classList.contains('media-box') || !!block.closest('.section.media-box');
  if (mediaBox) block.classList.add('downloads-media-box');
  if (cfg.collapse !== null && !['auto', 'none'].includes(cfg.collapse)) {
    throw new Error('downloads: collapse must be auto or none');
  }
  if (cfg.columns !== null && (!/^[1-9]\d*$/.test(cfg.columns)
    || !Number.isSafeInteger(Number(cfg.columns)))) {
    throw new Error('downloads: columns must be a positive whole number');
  }

  const list = document.createElement('ul');
  list.className = 'downloads-items';
  // set the desktop (>=992) column count only, so the mobile→tablet ladder
  // still applies; CSS defaults --dl-cols-lg to 4
  if (cfg.columns) {
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
  const addAll = mediaBox && list.querySelector('.downloads-add') ? buildAddAll(block) : null;
  bindCart(block, addAll).catch((e) => {
    // eslint-disable-next-line no-console
    console.error('downloads: media cart unavailable', e);
  });
  // A clipped tile is `inert`. Engines without native inert (Safari < 15.5, which already has
  // ResizeObserver, so the clip applies there) get the same effect by hand: the tile leaves the
  // accessibility tree and its controls leave the tab order, and both are restored on expand
  // (an author tabindex is kept in data-dl-tabindex). Pointer clicks on the peeking row are
  // blocked in CSS via the [inert] attribute, which those engines still match.
  const nativeInert = 'inert' in window.HTMLElement.prototype;
  const setClipped = (tile, clipped) => {
    tile.toggleAttribute('inert', clipped);
    if (nativeInert) return;
    if (clipped) tile.setAttribute('aria-hidden', 'true');
    else tile.removeAttribute('aria-hidden');
    tile.querySelectorAll(FOCUSABLE).forEach((control) => {
      const { dataset } = control;
      if (clipped) {
        if (!('dlTabindex' in dataset)) dataset.dlTabindex = control.getAttribute('tabindex') ?? '';
        control.setAttribute('tabindex', '-1');
      } else if ('dlTabindex' in dataset) {
        if (dataset.dlTabindex) control.setAttribute('tabindex', dataset.dlTabindex);
        else control.removeAttribute('tabindex');
        delete dataset.dlTabindex;
      }
    });
  };
  // The source Media Box (media-room.js togglebox) clips its grid whenever the items need more
  // than two rows at the current column count: the clip is 2 rows + 34px + the 44px pill, and
  // the pill sits at its bottom, so the top of row 3 shows behind it ("Show less" once open).
  // So the threshold follows the columns: 8 assets collapse at 1 / 2 / 3 columns, not at 4
  // (SKODA-830 D2). The clipped tiles are inert (no focus, hidden from AT) until expanded.
  if ((cfg.collapse === 'auto' || (cfg.collapse === null && mediaBox)) && list.children.length > 2) {
    disclosureSeq += 1;
    list.id = `downloads-items-${disclosureSeq}`;
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'downloads-more';
    toggle.setAttribute('aria-controls', list.id);
    const compact = window.matchMedia('(min-width: 520px)');
    const medium = window.matchMedia('(min-width: 768px)');
    const wide = window.matchMedia('(min-width: 992px)');
    // the first two rows' rendered height (tallest tile bottom, so uneven rows count too); the
    // CSS adds the pill's gap and height to it. Unmeasured (not laid out yet) leaves it unset,
    // which keeps the list unclipped until the tiles' ResizeObserver reports their size.
    const measureRows = (shown) => {
      const { top } = list.getBoundingClientRect();
      const bottom = Math.max(...shown.map((tile) => tile.getBoundingClientRect().bottom));
      if (bottom > top) list.style.setProperty('--dl-rows-height', `${bottom - top}px`);
      else list.style.removeProperty('--dl-rows-height');
    };
    const syncVisibility = () => {
      let columns = 1;
      if (compact.matches && mediaBox) columns = 2;
      if (medium.matches) columns = mediaBox ? 3 : 2;
      if (wide.matches) columns = Number(cfg.columns) || 4;
      const tiles = [...list.children];
      const overflow = tiles.length > 2 * columns;
      if (!overflow) block.classList.remove('downloads-expanded');
      const expanded = block.classList.contains('downloads-expanded');
      const collapsed = overflow && !expanded;
      block.classList.toggle('downloads-collapsed', collapsed);
      tiles.forEach((tile, index) => setClipped(tile, collapsed && index >= 2 * columns));
      if (collapsed) measureRows(tiles.slice(0, 2 * columns));
      else list.style.removeProperty('--dl-rows-height');
      toggle.hidden = !overflow;
      toggle.setAttribute('aria-expanded', String(expanded));
      toggle.textContent = expanded ? LABELS.less : LABELS.more;
    };
    toggle.addEventListener('click', () => {
      const expanded = block.classList.toggle('downloads-expanded');
      syncVisibility();
      // collapsing pulls the toggle (and its focus) up past the clipped rows: keep it in view
      if (!expanded) toggle.scrollIntoView?.({ block: 'nearest' });
    });
    block.append(toggle);
    [compact, medium, wide].forEach((query) => query.addEventListener('change', syncVisibility));
    // tile heights follow the width between breakpoints too (16:9 thumbs) and are 0 until the
    // section shows: re-measure whenever a tile resizes (the clip never resizes a tile)
    if (window.ResizeObserver) {
      const observer = new window.ResizeObserver(syncVisibility);
      [...list.children].forEach((tile) => observer.observe(tile));
    }
    syncVisibility();
  }
}
