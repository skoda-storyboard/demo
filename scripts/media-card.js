/*
 * media-card.js — the media asset card's actions (SKODA-406), built from a media feed row
 * (/en/media-feed.json, contract media-item): "add to media cart" and "download", plus the
 * video play badge. Lives in /scripts/ because it is cross-block shared code (AGENTS.md);
 * the listing uses it on /en/images and /en/videos. The model-page rails (story-rail) keep
 * their own single-button toolbar for now; they move onto this once SKODA-224 (PR #206),
 * which also edits story-rail.js, has landed.
 *
 * Source (.article-teaser-toolbar, measured 2026-09-29): 40px ink-ringed round buttons.
 *   - image: both buttons open a size menu (Original / 1920px) on click;
 *   - video: one add button and one MP4 download link, no menu.
 * The add actions carry the source cart key (`data-id`, `data-size`). The original's add
 * (image "Original" row, the video button) is a media-cart toggle (SKODA-505a) for the
 * original file; the 1920px row stays inert (`aria-disabled`, its click cancelled here):
 * the cart collects DAM originals only.
 *
 * i18n: the control text comes from the caller's labels (`mediaLabels(placeholders)`, the
 * per-locale placeholders sheet), with the English defaults below. `{size}` is replaced
 * with the size row's label; the card title follows the add / download names.
 */

export const DEFAULT_LABELS = {
  add: 'Add to media cart',
  download: 'Download',
  // menu rows + the single links, the source's link titles
  addSize: 'Add/remove {size} version',
  downloadSize: 'Download {size} version',
  addVideo: 'Add/remove this',
  downloadVideo: 'Download this',
  // the size rows' visible text
  sizeOriginal: 'Original',
  size1920: '1920px',
};

// placeholders sheet keys (camelCased by fetchPlaceholders) → label keys
const PLACEHOLDER_KEYS = {
  add: 'mediaAddToCart',
  download: 'mediaDownload',
  addSize: 'mediaAddSize',
  downloadSize: 'mediaDownloadSize',
  addVideo: 'mediaAddVideo',
  downloadVideo: 'mediaDownloadVideo',
  sizeOriginal: 'mediaSizeOriginal',
  size1920: 'mediaSize1920',
};

/**
 * The media card labels from a placeholders map, falling back to English per key.
 * @param {Record<string,string>} [ph] from fetchPlaceholders()
 * @returns {typeof DEFAULT_LABELS}
 */
export function mediaLabels(ph = {}) {
  return Object.fromEntries(Object.entries(DEFAULT_LABELS)
    .map(([key, text]) => [key, ph[PLACEHOLDER_KEYS[key]] || text]));
}

const named = (label, title) => (title ? `${label}: ${title}` : label);
const sized = (label, size) => label.replace('{size}', size);

// the source cart's size keys: '' = the original file, 'giant' = the 1920px rendition
const IMAGE_SIZES = [
  { labelKey: 'sizeOriginal', field: 'original', size: '' },
  { labelKey: 'size1920', field: 'rendition-1920', size: 'giant' },
];

// one size menu is open at a time (the source closes the other on open)
let openMenu = null;
let menuSeq = 0;

function closeOpenMenu(focusToggle = false) {
  if (!openMenu) return;
  const { toggle, menu, wrap } = openMenu;
  menu.hidden = true;
  toggle.setAttribute('aria-expanded', 'false');
  wrap.classList.remove('is-active');
  openMenu = null;
  if (focusToggle) toggle.focus();
}

let documentWired = false;
function wireDocument() {
  if (documentWired) return;
  documentWired = true;
  document.addEventListener('click', (e) => {
    if (openMenu && !openMenu.wrap.contains(e.target)) closeOpenMenu();
  });
}

/**
 * A cart action: a `#` link carrying the source cart key. The original's add is bound to the
 * media cart for `original` (the file's link); the others stay inert. While disabled, its
 * click is cancelled here, so no consumer (listing, rails) jumps to the top of the page.
 */
function cartAction(el, row, size, original = '', title = '') {
  el.href = '#';
  el.dataset.action = 'add';
  el.dataset.id = row.id;
  el.dataset.size = size;
  el.setAttribute('role', el.getAttribute('role') || 'button');
  el.setAttribute('aria-disabled', 'true');
  el.addEventListener('click', (e) => {
    if (el.getAttribute('aria-disabled') === 'true') e.preventDefault();
  });
  // the cart module loads only where an add control renders; until then it stays disabled
  if (original) {
    const thumb = row.image || row.poster || '';
    import('./media-cart.js')
      .then(({ bindCartControl }) => bindCartControl(el, { href: original, title, thumb }))
      .catch((e) => {
        // the control stays disabled (set above)
        // eslint-disable-next-line no-console
        console.warn('media card: the media cart did not load', e);
      });
  }
  return el;
}

function downloadAction(el, href) {
  el.href = href;
  el.dataset.action = 'download';
  el.setAttribute('download', '');
  el.target = '_blank';
  return el;
}

/**
 * A round toggle button with a size menu of links (the Downloads block's size-menu
 * pattern): aria-expanded/controls, Escape closes and returns focus, ArrowUp/Down move
 * between the rows, a click outside or focus leaving closes it.
 * @param {string} action 'add' | 'download'
 * @param {string} label the toggle's accessible name
 * @param {Array<{label: string, build: function(HTMLAnchorElement): HTMLAnchorElement}>} items
 * @returns {HTMLDivElement}
 */
function sizeMenu(action, label, items) {
  wireDocument();
  menuSeq += 1;
  const wrap = document.createElement('div');
  wrap.className = `media-card-action ${action}`;
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = `media-card-button ${action}`;
  toggle.setAttribute('aria-label', label);
  toggle.setAttribute('aria-haspopup', 'true');
  toggle.setAttribute('aria-expanded', 'false');
  const menu = document.createElement('ul');
  menu.className = 'media-card-menu';
  menu.id = `media-card-menu-${menuSeq}`;
  menu.setAttribute('role', 'menu');
  menu.hidden = true;
  toggle.setAttribute('aria-controls', menu.id);
  items.forEach((item) => {
    const li = document.createElement('li');
    li.setAttribute('role', 'none');
    const a = document.createElement('a');
    a.className = 'media-card-size';
    a.setAttribute('role', 'menuitem');
    a.textContent = item.label;
    li.append(item.build(a));
    menu.append(li);
  });
  const rows = () => [...menu.querySelectorAll('a')];
  const state = { toggle, menu, wrap };

  toggle.addEventListener('click', () => {
    if (openMenu === state) { closeOpenMenu(); return; }
    closeOpenMenu();
    menu.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    wrap.classList.add('is-active');
    openMenu = state;
  });
  wrap.addEventListener('keydown', (e) => {
    if (openMenu !== state) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeOpenMenu(true);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const all = rows();
      const at = all.indexOf(document.activeElement);
      const step = e.key === 'ArrowDown' ? 1 : -1;
      all[(at + step + all.length) % all.length]?.focus();
    }
  });
  wrap.addEventListener('focusout', (e) => {
    if (openMenu === state && e.relatedTarget && !wrap.contains(e.relatedTarget)) closeOpenMenu();
  });
  wrap.append(toggle, menu);
  return wrap;
}

/** A single round action link (videos, or an image with only one size). */
function singleAction(action, label, title, build) {
  const wrap = document.createElement('div');
  wrap.className = `media-card-action ${action}`;
  const a = document.createElement('a');
  a.className = `media-card-button ${action}`;
  a.setAttribute('aria-label', label);
  a.title = title;
  wrap.append(build(a));
  return wrap;
}

/**
 * The media card's action row for a feed row: add to media cart + download. Returns null
 * for rows that are neither images nor videos, or that have nothing to offer.
 * @param {object} row media feed row (template, id, title, original, rendition-1920, mp4)
 * @param {string} [title] the card title, for the controls' accessible names
 * @param {typeof DEFAULT_LABELS} [labels] the control text (`mediaLabels(placeholders)`)
 * @returns {HTMLDivElement|null}
 */
export function mediaActions(row, title = '', labels = DEFAULT_LABELS) {
  const L = { ...DEFAULT_LABELS, ...labels };
  if (row.template !== 'image' && row.template !== 'video') return null;
  const actions = document.createElement('div');
  actions.className = 'media-card-actions';

  if (row.template === 'video') {
    if (row.id) {
      actions.append(singleAction('add', named(L.add, title), L.addVideo, (a) => cartAction(a, row, '', row.mp4, title)));
    }
    if (row.mp4) {
      actions.append(singleAction('download', named(L.download, title), L.downloadVideo, (a) => downloadAction(a, row.mp4)));
    }
  } else {
    const sizes = IMAGE_SIZES.filter(({ field }) => row[field]);
    if (row.id && sizes.length) {
      actions.append(sizeMenu('add', named(L.add, title), sizes.map((s) => ({
        label: L[s.labelKey],
        build: (a) => {
          a.title = sized(L.addSize, L[s.labelKey]);
          return cartAction(a, row, s.size, s.size === '' ? row[s.field] : '', title);
        },
      }))));
    }
    if (sizes.length > 1) {
      actions.append(sizeMenu('download', named(L.download, title), sizes.map((s) => ({
        label: L[s.labelKey],
        build: (a) => {
          a.title = sized(L.downloadSize, L[s.labelKey]);
          return downloadAction(a, row[s.field]);
        },
      }))));
    } else if (sizes.length === 1) {
      const [s] = sizes;
      actions.append(singleAction('download', named(L.download, title), sized(L.downloadSize, L[s.labelKey]), (a) => downloadAction(a, row[s.field])));
    }
  }
  return actions.children.length ? actions : null;
}

/** The decorative video play badge, centred on the thumbnail by CSS. */
export function playBadge() {
  const badge = document.createElement('span');
  badge.className = 'media-card-play';
  badge.setAttribute('aria-hidden', 'true');
  return badge;
}
