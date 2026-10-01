/*
 * media-cart.js — the media cart (SKODA-505a): a device-local, login-free list of published
 * DAM originals that press users collect across pages and download in one go.
 *
 * State lives in localStorage (`skoda-media-cart`), with an in-memory fallback when storage
 * is unavailable. A random device id is minted on the first successful add; it is not sent
 * anywhere yet (reserved for SKODA-902). Tabs stay in sync through the `storage` event.
 *
 * Headless: this module owns behaviour + state only. It binds the add controls that already
 * exist (media cards, media rails, the lightbox) and reflects their state as `aria-pressed`
 * (`aria-checked` on menu rows) + `data-in-cart`; every visual is SKODA-505b.
 *
 * API (see docs/tickets/tickets/SKODA-505a.md):
 *   getCart() → { deviceId, items, count, bytes, limits }
 *   add({ href, title, thumb? }) → { ok, item?, reason? }
 *     reasons: see REASONS (`network`: try again)
 *   addMany([{ href, title, thumb? }]) → { added[], skipped[{ href, reason }] }
 *     (fills up to the caps)
 *   remove(idOrHref) · has(idOrHref) · clear() · onChange(cb) → unsubscribe
 *   download(opts) · downloadItems(items, opts) → { mode, filename, failed[] }  (zip: within caps)
 *   trackView() · bindCartControl(el, { href, title, thumb? })
 * `thumb` (SKODA-505b) is the card image the cart page shows; kept only when root-relative
 * or https.
 * Events on window: `media-cart:change` (detail = getCart()), `media-cart:analytics`.
 * A bound control that refuses an add dispatches `media-cart:refused` ({ href, reason }).
 */

import {
  resolve as defaultResolve, loadIndex as defaultLoadIndex, normalizeSource, damPath,
  DAM_HOST, DAM_ROOT,
} from './media-cart-resolver.js';

export const STORAGE_KEY = 'skoda-media-cart';
// the source cart-limit plugin's 80 items; 1 GiB keeps the zip in browser memory (and
// under the classic ZIP limits: fflate writes no ZIP64)
export const LIMITS = Object.freeze({ items: 80, bytes: 1024 ** 3 });
export const REASONS = Object.freeze({
  unresolved: 'unresolved',
  // the index or the DAM couldn't be reached: the link may still resolve later
  network: 'network',
  duplicate: 'duplicate',
  limitItems: 'limit-items',
  limitBytes: 'limit-bytes',
  storage: 'storage',
});

const emptyState = () => ({
  v: 1, deviceId: null, items: [], updatedAt: null,
});

// never trust stored items: only published DAM originals, so a tampered entry can't
// point a download anywhere else
const validItem = (it) => it && typeof it.id === 'string' && it.id.startsWith(DAM_ROOT)
  && it.url === `${DAM_HOST}${it.id}` && Number.isFinite(it.bytes) && it.bytes >= 0;

// the card image shown on the cart page (505b): root-relative (media bus) or https only
const safeThumb = (thumb) => (typeof thumb === 'string' && /^(\/(?!\/)|https:\/\/)/.test(thumb)
  ? thumb : '');

// an item as stored: sourceKeys always a list, thumb only when it is safe
function cleanItem({ thumb, ...it }) {
  const item = { ...it, sourceKeys: Array.isArray(it.sourceKeys) ? it.sourceKeys : [] };
  if (safeThumb(thumb)) item.thumb = thumb;
  return item;
}

function parseState(text) {
  if (!text) return emptyState();
  try {
    const s = JSON.parse(text);
    if (s?.v !== 1 || !Array.isArray(s.items)) return emptyState();
    const seen = new Set();
    const items = s.items.filter((it) => validItem(it) && !seen.has(it.id) && seen.add(it.id))
      .map(cleanItem);
    return {
      v: 1,
      deviceId: typeof s.deviceId === 'string' ? s.deviceId : null,
      items,
      updatedAt: s.updatedAt || null,
    };
  } catch {
    return emptyState();
  }
}

function uuidOf(win) {
  const c = win?.crypto;
  if (c?.randomUUID) return c.randomUUID();
  const b = new Uint8Array(16);
  c.getRandomValues(b);
  b[6] = (b[6] % 16) + 64; // version 4
  b[8] = (b[8] % 64) + 128; // RFC 4122 variant
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function storageOf(win) {
  try {
    const s = win.localStorage;
    const probe = `${STORAGE_KEY}:probe`;
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

/**
 * A cart instance. Everything is injectable for tests; the page uses the shared instance.
 * @param {object} [o]
 * @param {Window} [o.win]
 * @param {Storage|null} [o.storage] null = in-memory only
 * @param {function(string): Promise<object|null>} [o.resolve] href → DAM original
 * @param {function(): Promise} [o.loadIndex]
 * @param {function(): Promise<object>} [o.loadDownloader] the download module
 * @param {{items: number, bytes: number}} [o.limits]
 */
export function createCart({
  win = window,
  storage = storageOf(win),
  resolve = defaultResolve,
  loadIndex = defaultLoadIndex,
  loadDownloader = () => import('./media-cart-download.js'),
  limits = LIMITS,
  now = () => new Date(),
  uuid = () => uuidOf(win),
} = {}) {
  const listeners = new Set();
  let memory = null; // the state when storage is unavailable
  let state = parseState(storage ? storage.getItem(STORAGE_KEY) : null);

  const snapshot = () => ({
    deviceId: state.deviceId,
    items: state.items.map((it) => ({ ...it, sourceKeys: [...it.sourceKeys] })),
    count: state.items.length,
    bytes: state.items.reduce((sum, it) => sum + it.bytes, 0),
    limits: { ...limits },
  });

  const track = (category, action, label) => {
    const detail = { category, action, label };
    win.dispatchEvent(new win.CustomEvent('media-cart:analytics', { detail }));
    // no dataLayer bootstrap before consent (SKODA-804/905): push only when one exists
    if (Array.isArray(win.dataLayer)) {
      win.dataLayer.push({
        event: 'trackEvent', eventCategory: category, eventAction: action, eventLabel: label,
      });
    }
  };

  function find(ref) {
    if (!ref) return null;
    const dam = damPath(ref) || (String(ref).startsWith(DAM_ROOT) ? ref : null);
    const key = normalizeSource(ref);
    return state.items.find((it) => it.id === dam || it.url === ref || it.sourceHref === ref
      || (key && it.sourceKeys.includes(key))) || null;
  }

  const has = (ref) => !!find(ref);

  /* ---------- existing add controls ---------- */

  const bound = new WeakSet();
  const doc = () => win.document;

  function reflect(el, inCart) {
    const role = el.getAttribute('role');
    if (role === 'menuitem' || role === 'menuitemcheckbox') {
      el.setAttribute('role', 'menuitemcheckbox');
      el.setAttribute('aria-checked', String(inCart));
    } else el.setAttribute('aria-pressed', String(inCart));
    el.toggleAttribute('data-in-cart', inCart);
  }

  function disable(el) {
    el.setAttribute('aria-disabled', 'true');
    el.removeAttribute('aria-pressed');
    el.removeAttribute('aria-checked');
    if (el.getAttribute('role') === 'menuitemcheckbox') el.setAttribute('role', 'menuitem');
    el.removeAttribute('data-in-cart');
  }

  const controls = () => [...doc().querySelectorAll('[data-cart-control][data-href]')];

  function syncControls() {
    controls().forEach((el) => {
      if (el.getAttribute('aria-disabled') !== 'true') reflect(el, has(el.dataset.href));
    });
  }

  const emit = () => {
    const cart = snapshot();
    listeners.forEach((cb) => {
      try { cb(cart); } catch (e) { win.console?.error('media-cart: listener failed', e); }
    });
    win.dispatchEvent(new win.CustomEvent('media-cart:change', { detail: cart }));
    syncControls();
  };

  function persist(next) {
    const text = JSON.stringify(next);
    if (storage) {
      try {
        storage.setItem(STORAGE_KEY, text);
      } catch {
        return false;
      }
    } else memory = text;
    state = next;
    return true;
  }

  // links known to have no published original: their controls stay disabled, also when
  // re-bound (the lightbox re-binds its button on every render)
  const missing = new Set();
  const unavailable = (href) => {
    missing.add(href);
    controls().filter((c) => c.dataset.href === href && !has(href)).forEach(disable);
  };

  // one add without emitting (addMany emits once)
  async function addOne({ href, title = '', thumb = '' } = {}) {
    if (!href) return { ok: false, reason: REASONS.unresolved };
    const known = find(href);
    if (known) return { ok: false, reason: REASONS.duplicate, item: { ...known } };
    if (state.items.length >= limits.items) return { ok: false, reason: REASONS.limitItems };
    let resolved;
    try {
      resolved = await resolve(href);
    } catch {
      return { ok: false, reason: REASONS.network };
    }
    if (!resolved) return { ok: false, reason: REASONS.unresolved };
    const key = normalizeSource(href);
    const same = state.items.find((it) => it.id === resolved.id);
    if (same) {
      // another link to an asset already in the cart: remember it, so has(link) is true
      if (key && !same.sourceKeys.includes(key)) {
        const items = state.items.map((it) => (it === same
          ? { ...it, sourceKeys: [...it.sourceKeys, key] } : it));
        persist({ ...state, items });
      }
      return { ok: false, reason: REASONS.duplicate, item: { ...find(href) } };
    }
    // re-check after the await: parallel adds may have filled the cart meanwhile
    if (state.items.length >= limits.items) return { ok: false, reason: REASONS.limitItems };
    const bytes = state.items.reduce((sum, it) => sum + it.bytes, 0);
    if (bytes + resolved.bytes > limits.bytes) return { ok: false, reason: REASONS.limitBytes };
    const item = cleanItem({
      id: resolved.id,
      url: resolved.url,
      filename: resolved.filename,
      title: String(title || '').trim() || resolved.filename,
      bytes: resolved.bytes,
      mime: resolved.mime,
      kind: resolved.kind,
      sourceHref: href,
      sourceKeys: key ? [key] : [],
      page: win.location?.pathname || '',
      addedAt: now().toISOString(),
      thumb,
    });
    const next = {
      ...state,
      deviceId: state.deviceId || uuid(),
      items: [...state.items, item],
      updatedAt: item.addedAt,
    };
    if (!persist(next)) return { ok: false, reason: REASONS.storage };
    track('MediaCart', 'add', item.id);
    return { ok: true, item: { ...item } };
  }

  async function add(entry) {
    const res = await addOne(entry);
    if (res.ok) emit();
    else if (res.reason === REASONS.duplicate) syncControls();
    return res;
  }

  /**
   * Add several links in order, filling up to the caps (the source's group add): what
   * doesn't fit or doesn't resolve is skipped with its reason; the controls of links that
   * don't resolve are disabled, as after a refused click.
   */
  async function addMany(entries = []) {
    const added = [];
    const skipped = [];
    // sequential on purpose: order decides what fits under the caps
    for (let i = 0; i < entries.length; i += 1) {
      const entry = entries[i];
      // eslint-disable-next-line no-await-in-loop
      const res = await addOne(entry);
      if (res.ok) added.push(res.item);
      else {
        skipped.push({ href: entry?.href || '', reason: res.reason });
        if (res.reason === REASONS.unresolved && entry?.href) unavailable(entry.href);
      }
    }
    if (added.length) emit();
    return { added, skipped };
  }

  function remove(ref) {
    const item = find(ref);
    if (!item) return false;
    const items = state.items.filter((it) => it !== item);
    if (!persist({ ...state, items, updatedAt: now().toISOString() })) return false;
    track('MediaCart', 'remove', item.id);
    emit();
    return true;
  }

  function clear() {
    if (!state.items.length) return;
    if (!persist({ ...state, items: [], updatedAt: now().toISOString() })) return;
    track('MediaCart', 'clear', '');
    emit();
  }

  function onChange(cb) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  }

  /**
   * One item downloads directly, whatever its size. Several are zipped in memory, so the
   * caps apply here too (fflate writes no ZIP64): items past them, in order, are reported
   * in `failed` with their reason (e.g. a whole press kit over 1 GiB, SKODA-806).
   */
  async function downloadItems(items, opts = {}) {
    const valid = (items || []).filter(validItem);
    if (!valid.length) return { mode: 'none', filename: null, failed: [] };
    const list = [];
    const over = [];
    let bytes = 0;
    valid.forEach((item) => {
      if (valid.length === 1) list.push(item);
      else if (list.length >= limits.items) over.push({ item, reason: REASONS.limitItems });
      else if (!(item.bytes > 0) || bytes + item.bytes > limits.bytes) {
        over.push({ item, reason: REASONS.limitBytes });
      } else {
        list.push(item);
        bytes += item.bytes;
      }
    });
    if (!list.length) return { mode: 'none', filename: null, failed: over };
    const { downloadItems: run } = await loadDownloader();
    const res = await run(list, opts);
    if (res.mode === 'single') track('Download', 'download', list[0].id);
    else if (res.filename) track('Download', 'bulk-download', String(list.length - res.failed.length));
    return { ...res, failed: [...over, ...res.failed] };
  }

  const download = (opts) => downloadItems(state.items, opts);

  // the review surface (505b) reports its opening
  const trackView = () => track('MediaCart', 'view', String(state.items.length));

  // links that can't reach a published original: disable their controls (once the index
  // is there, i.e. after the first hover / focus). Each control + link is checked once;
  // a network failure leaves it enabled and unchecked.
  const checked = new WeakMap();
  function sweep() {
    return loadIndex().then(() => Promise.all(controls()
      .filter((el) => el.getAttribute('aria-disabled') !== 'true' && checked.get(el) !== el.dataset.href)
      .map(async (el) => {
        const { href } = el.dataset;
        checked.set(el, href);
        try {
          if (!has(href) && !(await resolve(href))) unavailable(href);
        } catch {
          if (checked.get(el) === href) checked.delete(el);
        }
      }))).catch(() => {});
  }

  async function onControlClick(e) {
    const el = e.currentTarget;
    e.preventDefault();
    if (el.getAttribute('aria-disabled') === 'true' || el.getAttribute('aria-busy') === 'true') return;
    const { href, title, thumb } = el.dataset;
    if (has(href)) {
      remove(href);
      return;
    }
    el.setAttribute('aria-busy', 'true');
    try {
      const res = await add({ href, title, thumb });
      if (res.ok || res.reason === REASONS.duplicate) return;
      if (res.reason === REASONS.unresolved) unavailable(href);
      el.dispatchEvent(new win.CustomEvent('media-cart:refused', {
        bubbles: true, detail: { href, reason: res.reason },
      }));
    } finally {
      el.removeAttribute('aria-busy');
    }
  }

  // after the first hover / focus, later (re-)bound links are checked as they are bound
  let warmed = false;
  const warm = () => {
    warmed = true;
    sweep();
  };

  /**
   * Make an existing add control a cart toggle for `href` (a source or DAM link to the
   * original). Re-binding updates the link (the lightbox reuses one button). A control
   * without a resolvable-looking link is disabled; its click is still cancelled.
   * @param {Element} el
   * @param {{href?: string, title?: string, thumb?: string}} [o] thumb: the card image
   * @returns {Element}
   */
  function bind(el, {
    href = el.dataset.href, title = el.dataset.title, thumb = el.dataset.thumb,
  } = {}) {
    el.setAttribute('data-cart-control', '');
    if (href) el.dataset.href = href;
    else delete el.dataset.href;
    if (title) el.dataset.title = title;
    else delete el.dataset.title;
    if (safeThumb(thumb)) el.dataset.thumb = thumb;
    else delete el.dataset.thumb;
    if (!bound.has(el)) {
      bound.add(el);
      el.addEventListener('click', onControlClick);
      el.addEventListener('pointerenter', warm, { once: true });
      el.addEventListener('focus', warm, { once: true });
    }
    if (!href || !(normalizeSource(href) || damPath(href)) || (missing.has(href) && !has(href))) {
      disable(el);
      return el;
    }
    el.removeAttribute('aria-disabled');
    reflect(el, has(href));
    if (warmed) sweep();
    return el;
  }

  win.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY && e.key !== null) return;
    state = parseState(storage ? storage.getItem(STORAGE_KEY) : memory);
    emit();
  });

  return {
    getCart: snapshot,
    add,
    addMany,
    remove,
    has,
    clear,
    onChange,
    download,
    downloadItems,
    trackView,
    bind,
  };
}

let shared = null;
const cart = () => {
  shared = shared || createCart();
  return shared;
};

export const getCart = () => cart().getCart();
export const add = (entry) => cart().add(entry);
export const addMany = (entries) => cart().addMany(entries);
export const remove = (ref) => cart().remove(ref);
export const has = (ref) => cart().has(ref);
export const clear = () => cart().clear();
export const onChange = (cb) => cart().onChange(cb);
export const download = (opts) => cart().download(opts);
export const downloadItems = (items, opts) => cart().downloadItems(items, opts);
export const trackView = () => cart().trackView();
export const bindCartControl = (el, opts) => cart().bind(el, opts);
