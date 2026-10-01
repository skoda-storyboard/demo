/*
 * media-cart — the cart page (SKODA-505b; the source `/en/media-cart/`, `body.media-cart`).
 * Authored as a page, `/{lang}/media-cart`: an h1 ("Your downloads") and an empty `Media Cart`
 * block. Authored cells are ignored: the block renders the device's cart (SKODA-505a store).
 *
 *   div.media-cart-actions   "Download package" (Cancel while zipping) · "Empty package" · count
 *   div.media-cart-limit     the package limit (shared banner, /scripts/media-cart-ui.js)
 *   div.media-cart-progress  status line (role=status), progress bar, files that failed
 *   section.media-cart-group per kind (Images, Videos, Documents, Other files): h2 + ul of cards
 *   p.media-cart-empty       "No downloads"
 *
 * Cards are kept per item id, so a re-render never reloads their thumbnails. Labels come from
 * the placeholders sheet (`mediaCart*`, see media-cart-ui.js).
 */

import { createOptimizedPicture } from '../../scripts/aem.js';
import { fetchPlaceholders } from '../../scripts/placeholders.js';
import * as store from '../../scripts/media-cart.js';
import {
  DEFAULT_LABELS, cartLabels, format, formatBytes, limitBanner, plural,
} from '../../scripts/media-cart-ui.js';

const KINDS = [
  ['image', 'kindImage'],
  ['video', 'kindVideo'],
  ['document', 'kindDocument'],
  ['other', 'kindOther'],
];

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
};

const kindOf = (item) => (KINDS.some(([k]) => k === item.kind) ? item.kind : 'other');

/** "JPG" from `photo.final.jpg`; '' when the name has no extension. */
export function fileType(filename = '') {
  const dot = filename.lastIndexOf('.');
  return dot > 0 && dot < filename.length - 1 ? filename.slice(dot + 1).toUpperCase() : '';
}

function thumbOf(item, picture) {
  const box = el('div', 'media-cart-thumb');
  const { thumb } = item;
  if (thumb?.startsWith('/')) {
    box.append(picture(thumb, '', false, [{ width: '600' }]));
  } else if (thumb?.startsWith('https://')) {
    const img = el('img');
    img.src = thumb;
    img.alt = '';
    img.loading = 'lazy';
    box.append(img);
  } else {
    box.classList.add('media-cart-thumb-empty');
    box.append(el('span', 'media-cart-thumb-type', fileType(item.filename)));
  }
  return box;
}

function buildCard(item, labels, picture) {
  const li = el('li', 'media-cart-item');
  li.dataset.id = item.id;
  const meta = [fileType(item.filename), formatBytes(item.bytes)].filter(Boolean).join(' · ');
  const remove = el('button', 'media-cart-remove');
  remove.type = 'button';
  remove.dataset.id = item.id;
  // the visible "Original" leads the name (label in name); the rest says what it does
  remove.append(
    el('span', 'media-cart-remove-label', labels.sizeOriginal),
    el('span', 'media-cart-visually-hidden', `, ${format(labels.remove, { title: item.title })}`),
  );
  li.append(
    thumbOf(item, picture),
    el('p', 'media-cart-meta', meta),
    el('p', 'media-cart-title', item.title),
    remove,
  );
  return li;
}

function actionButton(className, label) {
  const button = el('button', `media-cart-button ${className}`);
  button.type = 'button';
  button.append(el('span', 'media-cart-button-label', label));
  return button;
}

/**
 * Render the cart page into `block` and keep it in sync with the cart.
 * @param {Element} block
 * @param {object} [o]
 * @param {object} [o.cart] the store (getCart, remove, clear, onChange, download)
 * @param {typeof DEFAULT_LABELS} [o.labels]
 * @param {function} [o.picture] createOptimizedPicture
 * @returns {{refresh: function(): void}}
 */
export function renderCart(block, {
  cart = store, labels = DEFAULT_LABELS, picture = createOptimizedPicture,
} = {}) {
  const actions = el('div', 'media-cart-actions');
  const downloadButton = actionButton('media-cart-download', labels.downloadPackage);
  const emptyButton = actionButton('media-cart-clear', labels.emptyPackage);
  const count = el('p', 'media-cart-count');
  actions.append(downloadButton, emptyButton, count);

  const progress = el('div', 'media-cart-progress');
  const status = el('p', 'media-cart-status');
  status.setAttribute('role', 'status');
  const bar = el('progress', 'media-cart-bar');
  bar.hidden = true;
  const failedList = el('ul', 'media-cart-failed');
  failedList.hidden = true;
  progress.append(status, bar, failedList);

  const groups = el('div', 'media-cart-groups');
  const empty = el('p', 'media-cart-empty', labels.emptyMessage);
  empty.tabIndex = -1;

  block.replaceChildren(actions, limitBanner(labels), progress, groups, empty);

  const cards = new Map();
  let controller = null;

  function syncButtons() {
    const n = cart.getCart().items.length;
    downloadButton.disabled = !n && !controller;
    emptyButton.disabled = !n || !!controller;
  }

  function refresh() {
    const { items, bytes, limits } = cart.getCart();
    const ids = new Set(items.map((it) => it.id));
    [...cards.keys()].filter((id) => !ids.has(id)).forEach((id) => cards.delete(id));
    // re-grouping moves the cards: a focused one that stays gets its focus back
    const { activeElement } = document;
    const focused = groups.contains(activeElement) ? activeElement : null;
    const sections = KINDS.map(([kind, key]) => {
      const list = items.filter((it) => kindOf(it) === kind);
      if (!list.length) return null;
      const section = el('section', `media-cart-group media-cart-group-${kind}`);
      const heading = el('h2', 'media-cart-group-title', labels[key]);
      heading.id = `media-cart-${kind}`;
      section.setAttribute('aria-labelledby', heading.id);
      const ul = el('ul', 'media-cart-list');
      ul.append(...list.map((it) => {
        if (!cards.has(it.id)) cards.set(it.id, buildCard(it, labels, picture));
        return cards.get(it.id);
      }));
      section.append(heading, ul);
      return section;
    }).filter(Boolean);
    groups.replaceChildren(...sections);
    if (focused?.isConnected && document.activeElement !== focused) {
      focused.focus({ preventScroll: true });
    }
    count.textContent = format(labels.count, {
      n: items.length, max: limits.items, size: formatBytes(bytes),
    });
    empty.hidden = items.length > 0;
    syncButtons();
  }

  function showFailed(failed) {
    failedList.replaceChildren(...failed
      .map(({ item }) => el('li', '', item?.title || item?.filename || '')));
    failedList.hidden = !failed.length;
  }

  function setBusy(busy) {
    downloadButton.querySelector('.media-cart-button-label').textContent = busy
      ? labels.cancel : labels.downloadPackage;
    downloadButton.classList.toggle('is-busy', busy);
    bar.hidden = !busy;
    if (busy) bar.removeAttribute('value');
    syncButtons();
  }

  async function startDownload() {
    controller = new AbortController();
    const { signal } = controller;
    showFailed([]);
    setBusy(true);
    let lastDone = -1;
    try {
      const res = await cart.download({
        signal,
        onProgress: ({
          done, total, loaded, totalBytes,
        }) => {
          if (totalBytes > 0) {
            bar.max = totalBytes;
            bar.value = Math.min(loaded, totalBytes);
          }
          // announce per file, not per chunk
          if (done === lastDone) return;
          lastDone = done;
          status.textContent = format(labels.preparing, { done, total });
        },
      });
      const ok = res.mode === 'single' || (res.mode === 'zip' && !!res.filename);
      const failedText = res.failed.length
        ? ` ${plural(labels, 'failedFiles', res.failed.length)}` : '';
      if (ok) status.textContent = `${labels.downloaded}${failedText}`;
      else if (res.failed.length) status.textContent = `${labels.downloadFailed}${failedText}`;
      else status.textContent = '';
      showFailed(res.failed);
    } catch (e) {
      status.textContent = e?.name === 'AbortError' ? labels.cancelled : labels.downloadFailed;
    } finally {
      controller = null;
      setBusy(false);
    }
  }

  downloadButton.addEventListener('click', () => {
    if (controller) controller.abort();
    else startDownload();
  });

  emptyButton.addEventListener('click', () => {
    cart.clear();
    refresh();
    status.textContent = '';
    showFailed([]);
    empty.focus();
  });

  groups.addEventListener('click', (e) => {
    const button = e.target.closest('.media-cart-remove');
    if (!button) return;
    const index = [...groups.querySelectorAll('.media-cart-remove')].indexOf(button);
    cart.remove(button.dataset.id);
    refresh();
    // keep the keyboard where it was: the next card's remove, else the previous one, else
    // the empty message
    const rest = [...groups.querySelectorAll('.media-cart-remove')];
    (rest[Math.min(index, rest.length - 1)] || empty).focus();
  });

  cart.onChange(refresh);
  refresh();
  return { refresh };
}

export default async function decorate(block) {
  let placeholders = {};
  try {
    placeholders = await fetchPlaceholders();
  } catch {
    // English defaults
  }
  renderCart(block, { labels: cartLabels(placeholders) });
  store.trackView();
}
