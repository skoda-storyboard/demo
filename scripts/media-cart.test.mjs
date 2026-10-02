/*
 * Unit tests for the media cart store + control binding (SKODA-505a): add / remove / dedupe /
 * persist / clear, caps, device id, corrupt + unavailable storage, cross-tab sync, analytics,
 * and the existing add controls it binds.
 * Run: node --test scripts/media-cart.test.mjs
 */
/* global globalThis */
/* eslint-disable import/no-extraneous-dependencies */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<main></main>', { url: 'https://example.com/en/images' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const {
  createCart, STORAGE_KEY, REASONS, SWEEP_CONCURRENCY,
} = await import('./media-cart.js');

const HOST = 'https://publish-p220607-e2281243.adobeaemcloud.com';
const asset = (name, bytes = 100, mime = 'image/jpeg') => ({
  id: `/content/dam/storyboard/en/${name}`,
  url: `${HOST}/content/dam/storyboard/en/${name}`,
  filename: name,
  bytes,
  mime,
  kind: mime.split('/')[0] === 'video' ? 'video' : 'image',
});
const src = (name) => `https://cdn.skoda-storyboard.com/2026/08/${name}`;
const KNOWN = {
  [src('a.jpg')]: asset('a.jpg', 100),
  'https://www.skoda-storyboard.com/direct-download/2026/08/a.jpg': asset('a.jpg', 100),
  [src('b.jpg')]: asset('b.jpg', 200),
  [src('c.jpg')]: asset('c.jpg', 300),
  [src('big.mp4')]: asset('big.mp4', 900, 'video/mp4'),
};

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
  };
}

function make(o = {}) {
  const storage = 'storage' in o ? o.storage : memoryStorage();
  const resolved = [];
  const cart = createCart({
    win: window,
    storage,
    resolve: async (href) => {
      resolved.push(href);
      return KNOWN[href] ? { ...KNOWN[href] } : null;
    },
    loadIndex: async () => {},
    now: () => new Date('2026-09-30T09:00:00Z'),
    uuid: () => 'device-1',
    ...o,
  });
  return { cart, storage, resolved };
}

const events = (type) => {
  const seen = [];
  const on = (e) => seen.push(e.detail);
  window.addEventListener(type, on);
  return { seen, off: () => window.removeEventListener(type, on) };
};

test('a fresh cart is empty; nothing is stored and no device id exists before the first add', () => {
  const { cart, storage } = make();
  assert.deepEqual(cart.getCart(), {
    deviceId: null, items: [], count: 0, bytes: 0, limits: { items: 80, bytes: 1024 ** 3 },
  });
  assert.equal(storage.data.size, 0);
});

test('add: resolves the link, persists the item, mints the device id, emits change + analytics', async () => {
  const { cart, storage } = make();
  const change = events('media-cart:change');
  const analytics = events('media-cart:analytics');
  const res = await cart.add({ href: src('a.jpg'), title: ' Elroq front ' });
  change.off();
  analytics.off();
  assert.equal(res.ok, true);
  assert.deepEqual(res.item, {
    ...asset('a.jpg'),
    title: 'Elroq front',
    sourceHref: src('a.jpg'),
    sourceKeys: ['2026/08/a.jpg'],
    page: '/en/images',
    addedAt: '2026-09-30T09:00:00.000Z',
  });
  const stored = JSON.parse(storage.data.get(STORAGE_KEY));
  assert.deepEqual([stored.v, stored.deviceId, stored.items.length], [1, 'device-1', 1]);
  assert.deepEqual([change.seen.length, change.seen[0].count, change.seen[0].bytes], [1, 1, 100]);
  assert.deepEqual(analytics.seen, [{ category: 'MediaCart', action: 'add', label: asset('a.jpg').id }]);
  assert.equal(window.dataLayer, undefined, 'no dataLayer is created before consent');
});

test('analytics go to an existing dataLayer', async () => {
  window.dataLayer = [];
  try {
    const { cart } = make();
    await cart.add({ href: src('a.jpg') });
    cart.remove(src('a.jpg'));
    assert.deepEqual(window.dataLayer.map((e) => [e.event, e.eventCategory, e.eventAction]), [
      ['trackEvent', 'MediaCart', 'add'], ['trackEvent', 'MediaCart', 'remove'],
    ]);
  } finally {
    delete window.dataLayer;
  }
});

test('dedupe: the same asset via another link, its DAM id or URL is one item', async () => {
  const { cart, storage } = make();
  await cart.add({ href: src('a.jpg') });
  const again = await cart.add({ href: src('a.jpg') });
  assert.deepEqual([again.ok, again.reason], [false, REASONS.duplicate]);
  const other = await cart.add({ href: 'https://www.skoda-storyboard.com/direct-download/2026/08/a.jpg' });
  assert.equal(other.reason, REASONS.duplicate);
  assert.equal(cart.getCart().count, 1);
  assert.ok(cart.has('https://www.skoda-storyboard.com/direct-download/2026/08/a.jpg'), 'the new link is remembered');
  assert.ok(JSON.parse(storage.data.get(STORAGE_KEY)).items[0].sourceKeys.length === 1, 'same key, not repeated');
  assert.ok(cart.has(asset('a.jpg').id));
  assert.ok(cart.has(asset('a.jpg').url));
  assert.equal(cart.has(src('b.jpg')), false);
});

test('unresolvable links are refused and change nothing (no device id either)', async () => {
  const { cart, storage } = make();
  assert.deepEqual(await cart.add({ href: src('unknown.jpg') }), { ok: false, reason: REASONS.unresolved });
  assert.deepEqual(await cart.add({}), { ok: false, reason: REASONS.unresolved });
  assert.equal(storage.data.size, 0);
  assert.equal(cart.getCart().deviceId, null);
});

test('caps: item count and total bytes', async () => {
  const { cart, resolved } = make({ limits: { items: 2, bytes: 1000 } });
  await cart.add({ href: src('a.jpg') });
  await cart.add({ href: src('b.jpg') });
  const n = resolved.length;
  assert.deepEqual(await cart.add({ href: src('c.jpg') }), { ok: false, reason: REASONS.limitItems });
  assert.equal(resolved.length, n, 'a full cart does not even resolve');
  const bytesCart = make({ limits: { items: 80, bytes: 1000 } }).cart;
  await bytesCart.add({ href: src('c.jpg') });
  assert.deepEqual(await bytesCart.add({ href: src('big.mp4') }), { ok: false, reason: REASONS.limitBytes });
  assert.equal((await bytesCart.add({ href: src('b.jpg') })).ok, true, 'a smaller one still fits');
});

test('parallel adds cannot overshoot the item cap', async () => {
  const { cart } = make({ limits: { items: 1, bytes: 1e9 } });
  const res = await Promise.all([cart.add({ href: src('a.jpg') }), cart.add({ href: src('b.jpg') })]);
  assert.deepEqual(res.map((r) => r.ok), [true, false]);
  assert.equal(cart.getCart().count, 1);
});

test('addMany fills up to the caps in order and reports what was skipped (one change event)', async () => {
  const { cart } = make({ limits: { items: 3, bytes: 1e9 } });
  await cart.add({ href: src('a.jpg') });
  const change = events('media-cart:change');
  const res = await cart.addMany([
    { href: src('a.jpg') }, { href: src('unknown.jpg') }, { href: src('b.jpg') }, { href: src('c.jpg') },
    { href: src('big.mp4') },
  ]);
  change.off();
  assert.deepEqual(res.added.map((it) => it.filename), ['b.jpg', 'c.jpg']);
  assert.deepEqual(res.skipped, [
    { href: src('a.jpg'), reason: 'duplicate' },
    { href: src('unknown.jpg'), reason: 'unresolved' },
    { href: src('big.mp4'), reason: 'limit-items' },
  ]);
  assert.equal(change.seen.length, 1);
  assert.deepEqual(await cart.addMany([]), { added: [], skipped: [] });
});

test('remove (by link or id) and clear', async () => {
  const { cart } = make();
  await cart.addMany([{ href: src('a.jpg') }, { href: src('b.jpg') }, { href: src('c.jpg') }]);
  assert.equal(cart.remove(src('a.jpg')), true);
  assert.equal(cart.remove(asset('b.jpg').id), true);
  assert.equal(cart.remove(src('a.jpg')), false);
  assert.deepEqual(cart.getCart().items.map((it) => it.filename), ['c.jpg']);
  cart.clear();
  assert.equal(cart.getCart().count, 0);
  assert.equal(cart.getCart().deviceId, 'device-1', 'the device keeps its id');
});

test('persists across page loads (a new instance reads the same storage)', async () => {
  const { cart, storage } = make();
  await cart.add({ href: src('a.jpg'), title: 'A' });
  const next = make({ storage, uuid: () => 'other' }).cart;
  assert.deepEqual(next.getCart().items.map((it) => [it.id, it.title]), [[asset('a.jpg').id, 'A']]);
  assert.equal(next.getCart().deviceId, 'device-1');
  assert.ok(next.has(src('a.jpg')));
});

test('corrupt or tampered storage: reset, and only DAM originals survive', () => {
  assert.equal(make({ storage: memoryStorage({ [STORAGE_KEY]: '{nope' }) }).cart.getCart().count, 0);
  assert.equal(make({ storage: memoryStorage({ [STORAGE_KEY]: '{"v":9,"items":[]}' }) }).cart.getCart().count, 0);
  const good = { ...asset('a.jpg'), sourceKeys: [] };
  const items = [
    good,
    { ...good }, // repeated id
    { ...asset('b.jpg'), url: 'https://evil.example.com/b.jpg' },
    { ...asset('c.jpg'), id: '/etc/passwd', url: `${HOST}/etc/passwd` },
    { ...asset('d.jpg'), bytes: 'x' },
    null,
  ];
  const { cart } = make({ storage: memoryStorage({ [STORAGE_KEY]: JSON.stringify({ v: 1, deviceId: 'd', items }) }) });
  assert.deepEqual(cart.getCart().items.map((it) => it.id), [good.id]);
});

test('no storage (private mode, blocked): works in memory', async () => {
  const { cart } = make({ storage: null });
  assert.equal((await cart.add({ href: src('a.jpg') })).ok, true);
  assert.equal(cart.getCart().count, 1);
});

test('storage full: the add is refused and the cart unchanged', async () => {
  const storage = memoryStorage();
  const { cart } = make({ storage });
  await cart.add({ href: src('a.jpg') });
  storage.setItem = () => { throw new Error('QuotaExceededError'); };
  assert.deepEqual(await cart.add({ href: src('b.jpg') }), { ok: false, reason: REASONS.storage });
  assert.equal(cart.getCart().count, 1);
});

test('another tab changing the cart updates this one (storage event)', async () => {
  const storage = memoryStorage();
  const here = make({ storage }).cart;
  const there = make({ storage }).cart;
  const seen = [];
  const off = here.onChange((c) => seen.push(c.count));
  await there.add({ href: src('a.jpg') });
  window.dispatchEvent(new window.StorageEvent('storage', { key: STORAGE_KEY }));
  window.dispatchEvent(new window.StorageEvent('storage', { key: 'unrelated' }));
  assert.ok(here.has(src('a.jpg')));
  assert.deepEqual(seen.slice(-1), [1]);
  off();
  await there.add({ href: src('b.jpg') });
  window.dispatchEvent(new window.StorageEvent('storage', { key: STORAGE_KEY }));
  assert.deepEqual(seen.slice(-1), [1], 'unsubscribed');
});

test('download hands the items to the download module (lazy) and tracks it', async () => {
  const calls = [];
  const { cart } = make({
    loadDownloader: async () => ({
      downloadItems: async (items, opts) => {
        calls.push([items.map((it) => it.filename), opts.tag]);
        return items.length === 1 ? { mode: 'single', filename: items[0].filename, failed: [] }
          : { mode: 'zip', filename: 'z.zip', failed: [{ item: items[1] }] };
      },
    }),
  });
  assert.deepEqual(await cart.download(), { mode: 'none', filename: null, failed: [] });
  await cart.addMany([{ href: src('a.jpg') }, { href: src('b.jpg') }, { href: src('c.jpg') }]);
  const analytics = events('media-cart:analytics');
  await cart.download({ tag: 't' });
  await cart.downloadItems([cart.getCart().items[0], { id: 'x', url: 'https://evil.example.com/x' }]);
  cart.trackView();
  analytics.off();
  assert.deepEqual(calls, [[['a.jpg', 'b.jpg', 'c.jpg'], 't'], [['a.jpg'], undefined]]);
  assert.deepEqual(analytics.seen.map((e) => [e.category, e.action, e.label]), [
    ['Download', 'bulk-download', '2'], ['Download', 'download', asset('a.jpg').id], ['MediaCart', 'view', '3'],
  ]);
});

test('downloadItems: one item goes direct at any size; a zip stays within the caps (in order)', async () => {
  const calls = [];
  const { cart } = make({
    limits: { items: 2, bytes: 250 },
    loadDownloader: async () => ({
      downloadItems: async (items) => {
        calls.push(items.map((it) => it.filename));
        return items.length === 1 ? { mode: 'single', filename: items[0].filename, failed: [] }
          : { mode: 'zip', filename: 'z.zip', failed: [] };
      },
    }),
  });
  const item = (name, bytes) => ({ ...asset(name, bytes), title: name, sourceKeys: [] });
  const huge = item('huge.mp4', 5 * 1024 ** 3);
  assert.equal((await cart.downloadItems([huge])).mode, 'single', 'no zip, no memory: no cap');
  const res = await cart.downloadItems([
    item('a.jpg', 100), huge, item('unsized.jpg', 0), item('b.jpg', 100), item('c.jpg', 10),
  ]);
  assert.deepEqual(calls, [['huge.mp4'], ['a.jpg', 'b.jpg']]);
  assert.deepEqual(res.failed.map((f) => [f.item.filename, f.reason]), [
    ['huge.mp4', 'limit-bytes'], ['unsized.jpg', 'limit-bytes'], ['c.jpg', 'limit-items'],
  ]);
  const none = await cart.downloadItems([huge, item('huge2.mp4', 5 * 1024 ** 3)]);
  assert.deepEqual([none.mode, none.failed.length, calls.length], ['none', 2, 2], 'nothing fits: nothing saved');
});

/* ---------- bound controls ---------- */

const mount = (...els) => { document.querySelector('main').replaceChildren(...els); return els; };
const link = (attrs = {}) => {
  const a = document.createElement('a');
  a.href = '#';
  a.setAttribute('role', 'button');
  a.setAttribute('aria-disabled', 'true');
  Object.entries(attrs).forEach(([k, v]) => a.setAttribute(k, v));
  return a;
};
const click = (el) => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
const settle = () => new Promise((r) => { setTimeout(r, 0); });

test('bind: an inert add control becomes a cart toggle (aria-pressed + data-in-cart)', async () => {
  const { cart } = make();
  const [a, twin] = mount(link(), link());
  cart.bind(a, { href: src('a.jpg'), title: 'A' });
  cart.bind(twin, { href: src('a.jpg') });
  assert.deepEqual([a.hasAttribute('aria-disabled'), a.getAttribute('aria-pressed'), a.dataset.href], [false, 'false', src('a.jpg')]);
  assert.equal(click(a), false, 'the # link never navigates');
  await settle();
  assert.equal(a.getAttribute('aria-pressed'), 'true');
  assert.ok(a.hasAttribute('data-in-cart'));
  assert.equal(twin.getAttribute('aria-pressed'), 'true', 'every control for that asset follows');
  assert.equal(cart.getCart().items[0].title, 'A');
  click(twin);
  await settle();
  assert.equal(cart.getCart().count, 0);
  assert.deepEqual([a.getAttribute('aria-pressed'), a.hasAttribute('data-in-cart')], ['false', false]);
  // binding twice doesn't double-toggle
  cart.bind(a);
  click(a);
  await settle();
  assert.equal(cart.getCart().count, 1);
});

test('bind: menu rows become menuitemcheckbox with aria-checked', async () => {
  const { cart } = make();
  const [row] = mount(link({ role: 'menuitem' }));
  cart.bind(row, { href: src('b.jpg') });
  assert.deepEqual([row.getAttribute('role'), row.getAttribute('aria-checked'), row.hasAttribute('aria-pressed')], ['menuitemcheckbox', 'false', false]);
  click(row);
  await settle();
  assert.equal(row.getAttribute('aria-checked'), 'true');
});

test('bind: a control without a usable link stays disabled and still cancels its click', () => {
  const { cart } = make();
  const [x, y] = mount(link(), link());
  cart.bind(x, { href: 'https://example.com/a.jpg' });
  cart.bind(y, {});
  assert.equal(x.getAttribute('aria-disabled'), 'true');
  assert.equal(y.getAttribute('aria-disabled'), 'true');
  assert.equal(click(x), false);
  assert.equal(cart.getCart().count, 0);
});

test('bind: a refused add disables unresolvable links and reports the reason', async () => {
  const { cart } = make({ limits: { items: 1, bytes: 1e9 } });
  const [gone, a, b] = mount(link(), link(), link());
  cart.bind(gone, { href: src('unpublished.mp4') });
  cart.bind(a, { href: src('a.jpg') });
  cart.bind(b, { href: src('b.jpg') });
  const refused = [];
  document.addEventListener('media-cart:refused', (e) => refused.push([e.target, e.detail.reason]));
  click(gone);
  await settle();
  assert.equal(gone.getAttribute('aria-disabled'), 'true');
  click(a);
  await settle();
  click(b);
  await settle();
  assert.deepEqual(refused, [[gone, 'unresolved'], [b, 'limit-items']]);
  assert.equal(b.getAttribute('aria-pressed'), 'false');
  assert.equal(b.hasAttribute('aria-busy'), false);
});

test('addMany: the controls of links that don\'t resolve are disabled, as after a click', async () => {
  const { cart } = make();
  const [gone, a] = mount(link(), link());
  cart.bind(gone, { href: src('unpublished.mp4') });
  cart.bind(a, { href: src('a.jpg') });
  const res = await cart.addMany([{ href: src('a.jpg') }, { href: src('unpublished.mp4') }]);
  assert.deepEqual(res.skipped, [{ href: src('unpublished.mp4'), reason: 'unresolved' }]);
  assert.equal(gone.getAttribute('aria-disabled'), 'true');
  assert.equal(a.getAttribute('aria-pressed'), 'true');
  cart.bind(gone, { href: src('unpublished.mp4') });
  assert.equal(gone.getAttribute('aria-disabled'), 'true', 'stays disabled when re-bound');
});

test('bind: a network failure refuses the add but keeps the control usable', async () => {
  let down = true;
  const { cart } = make({
    resolve: async (href) => {
      if (down) throw new TypeError('Failed to fetch');
      return KNOWN[href] ? { ...KNOWN[href] } : null;
    },
  });
  const [a] = mount(link());
  cart.bind(a, { href: src('a.jpg') });
  const refused = [];
  const on = (e) => refused.push(e.detail.reason);
  document.addEventListener('media-cart:refused', on);
  a.dispatchEvent(new window.Event('focus'));
  await settle();
  assert.equal(a.hasAttribute('aria-disabled'), false, 'the sweep does not judge a link it could not check');
  click(a);
  await settle();
  document.removeEventListener('media-cart:refused', on);
  assert.deepEqual(refused, ['network']);
  assert.deepEqual([a.hasAttribute('aria-disabled'), cart.getCart().count], [false, 0]);
  down = false;
  click(a);
  await settle();
  assert.deepEqual([a.getAttribute('aria-pressed'), cart.getCart().count], ['true', 1]);
});

test('bind: a link known to be unresolvable stays disabled when re-bound (lightbox reopen)', async () => {
  const { cart } = make();
  const [btn] = mount(document.createElement('button'));
  cart.bind(btn, { href: src('unpublished.mp4') });
  click(btn);
  await settle();
  assert.equal(btn.getAttribute('aria-disabled'), 'true');
  cart.bind(btn, { href: src('a.jpg') });
  assert.equal(btn.hasAttribute('aria-disabled'), false);
  cart.bind(btn, { href: src('unpublished.mp4') });
  assert.equal(btn.getAttribute('aria-disabled'), 'true', 'no second trip to find out');
  // also a miss found by the hover sweep
  const [x] = mount(document.createElement('button'));
  cart.bind(x, { href: src('gone.jpg') });
  x.dispatchEvent(new window.Event('pointerenter'));
  await settle();
  cart.bind(x, { href: src('gone.jpg') });
  assert.equal(x.getAttribute('aria-disabled'), 'true');
});

test('bind: re-binding one button to another item (the lightbox) updates link, title and state', async () => {
  const { cart } = make();
  await cart.add({ href: src('a.jpg') });
  const [btn] = mount(document.createElement('button'));
  cart.bind(btn, { href: src('a.jpg'), title: 'A' });
  assert.equal(btn.getAttribute('aria-pressed'), 'true');
  cart.bind(btn, { href: src('b.jpg'), title: '' });
  assert.deepEqual([btn.getAttribute('aria-pressed'), btn.dataset.title], ['false', undefined]);
  cart.bind(btn, { href: '' });
  assert.deepEqual([btn.getAttribute('aria-disabled'), btn.hasAttribute('aria-pressed')], ['true', false]);
  cart.bind(btn, { href: src('b.jpg') });
  assert.equal(btn.hasAttribute('aria-disabled'), false);
});

test('bind: the first hover loads the index and disables links that resolve nowhere', async () => {
  let loads = 0;
  const { cart } = make({ loadIndex: async () => { loads += 1; } });
  const [ok, gone] = mount(link(), link());
  cart.bind(ok, { href: src('a.jpg') });
  cart.bind(gone, { href: src('unpublished.mp4') });
  ok.dispatchEvent(new window.Event('pointerenter'));
  await settle();
  assert.equal(loads, 1);
  assert.equal(ok.hasAttribute('aria-disabled'), false);
  assert.equal(gone.getAttribute('aria-disabled'), 'true');
});

test('bind: the hover sweep checks a few links at a time, each link once', async () => {
  let inFlight = 0;
  let peak = 0;
  const seen = [];
  const { cart } = make({
    resolve: async (href) => {
      seen.push(href);
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await new Promise((r) => { setTimeout(r, 5); });
      inFlight -= 1;
      return null;
    },
  });
  const els = mount(...Array.from({ length: 10 }, () => link()));
  els.forEach((el, i) => cart.bind(el, { href: src(`gone-${i}.jpg`) }));
  els[0].dispatchEvent(new window.Event('pointerenter'));
  // a control bound while that sweep runs starts another; it must not re-check the queue
  const late = link();
  document.querySelector('main').append(late);
  cart.bind(late, { href: src('gone-late.jpg') });
  await new Promise((r) => { setTimeout(r, 120); });
  assert.equal(peak, SWEEP_CONCURRENCY, 'never more than SWEEP_CONCURRENCY at once');
  assert.equal(seen.length, 11, 'each link once');
  assert.equal(new Set(seen).size, 11);
  assert.ok([...els, late].every((el) => el.getAttribute('aria-disabled') === 'true'));
});

test('bind: once warmed, a re-pointed or newly bound link is checked as it is bound', async () => {
  const { cart } = make();
  const [btn] = mount(document.createElement('button'));
  cart.bind(btn, { href: src('a.jpg') });
  btn.dispatchEvent(new window.Event('focus'));
  await settle();
  // the lightbox re-points the same button: its once-only warm listener is spent
  cart.bind(btn, { href: src('unpublished.jpg') });
  await settle();
  assert.equal(btn.getAttribute('aria-disabled'), 'true');
  const [later] = mount(link());
  cart.bind(later, { href: src('also-unpublished.jpg') });
  await settle();
  assert.equal(later.getAttribute('aria-disabled'), 'true');
});

test('thumb (505b): kept only when root-relative or https, from add, bind and storage', async () => {
  const { cart, storage } = make();
  await cart.add({ href: src('a.jpg'), title: 'A', thumb: '/en/press/media_1.jpg?width=750' });
  await cart.add({ href: src('b.jpg'), thumb: 'javascript:alert(1)' });
  await cart.add({ href: src('c.jpg'), thumb: '//evil.example/x.jpg' });
  assert.deepEqual(cart.getCart().items.map((it) => it.thumb), [
    '/en/press/media_1.jpg?width=750', undefined, undefined,
  ]);

  const [a, b] = mount(link(), link());
  cart.bind(a, { href: src('big.mp4'), thumb: 'https://cdn.skoda-storyboard.com/p.jpg' });
  cart.bind(b, { href: src('big.mp4'), thumb: 'http://cdn.skoda-storyboard.com/p.jpg' });
  assert.equal(a.dataset.thumb, 'https://cdn.skoda-storyboard.com/p.jpg');
  assert.equal('thumb' in b.dataset, false, 'plain http is dropped');
  click(a);
  await settle();
  assert.equal(cart.getCart().items.at(-1).thumb, 'https://cdn.skoda-storyboard.com/p.jpg');

  const stored = JSON.parse(storage.getItem(STORAGE_KEY));
  stored.items[0].thumb = 'data:image/svg+xml,<svg onload=alert(1)>';
  const again = make({ storage: memoryStorage({ [STORAGE_KEY]: JSON.stringify(stored) }) });
  assert.equal(again.cart.getCart().items[0].thumb, undefined, 'a tampered thumb is dropped');
  assert.equal(again.cart.getCart().items.at(-1).thumb, 'https://cdn.skoda-storyboard.com/p.jpg');
});
