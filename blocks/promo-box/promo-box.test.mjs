import { test } from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = {
  location: { href: 'https://example.com/en/', hostname: 'example.com', pathname: '/en/', search: '' },
  origin: 'https://example.com',
  hlx: { codeBasePath: '' },
};

const {
  default: decorate, parseSource, selectPromoRows, validateCuratedRows, enablePromoRotation,
} = await import('./promo-box.js');
const { optimizeImages } = await import('../../scripts/card-teaser.js');

function configBlock(settings) {
  return {
    children: Object.entries(settings).map(([key, value]) => ({
      children: [
        { textContent: key },
        { textContent: value, querySelector: () => null },
      ],
    })),
  };
}

test('three authored rows are kept in author order without inspecting images', () => {
  const rows = [{ children: [] }, { children: [] }, { children: [] }];
  assert.deepEqual(parseSource({ children: rows }), { mode: 'curated', rows });
});

test('index mode parses facet lists and defaults to three items', () => {
  const { mode, config } = parseSource(configBlock({
    template: 'story', category: 'emobility, skoda-world', tags: 'elroq, enyaq',
  }));
  assert.equal(mode, 'indexed');
  assert.equal(config.limit, 3);
  assert.deepEqual(config.category, ['emobility', 'skoda-world']);
  assert.deepEqual(config.tags, ['elroq', 'enyaq']);
  assert.equal(parseSource(configBlock({ sort: 'Newest' })).config.sort, 'newest');
});

test('mixed modes, duplicate settings and invalid values are explicit errors', () => {
  const mixed = configBlock({ template: 'story' });
  mixed.children.push({ children: [{ textContent: 'Title' }] });
  assert.throws(() => parseSource(mixed), /Mixing authored/);
  const duplicate = configBlock({ limit: '3' });
  duplicate.children.push(configBlock({ limit: '2' }).children[0]);
  assert.throws(() => parseSource(duplicate), /Duplicate/);
  ['0', '-1', '3.5', 'NaN', ''].forEach((limit) => {
    assert.throws(() => parseSource(configBlock({ limit })), /positive whole number/);
  });
  assert.throws(() => parseSource(configBlock({ sort: 'random' })), /newest or oldest/);
});

test('curated cards require three linked stories rather than silently hiding rows', () => {
  const linked = { querySelector: () => ({ href: '/en/story' }) };
  const unlinked = { querySelector: () => null };
  assert.throws(() => validateCuratedRows([linked, linked]), /exactly three/);
  assert.throws(() => validateCuratedRows([linked, linked, linked, linked]), /exactly three/);
  assert.throws(() => validateCuratedRows([linked, unlinked, linked]), /story link/);
  assert.doesNotThrow(() => validateCuratedRows([linked, linked, linked]));
});

test('index selection scopes, OR-filters facets, sorts and limits without mutating', () => {
  const rows = [
    { path: '/en/b', title: 'B', template: 'story', category: 'emobility', tags: 'elroq', publisheddate: '2026-01-02' },
    { path: '/en/a', title: 'A', template: 'story', category: 'emobility', tags: 'enyaq', publisheddate: '2026-02-03' },
    { path: '/en/c', title: 'C', template: 'story', category: 'lifestyle', tags: 'elroq', publisheddate: '2026-03-04' },
    { path: '/fr/d', title: 'D', template: 'story', category: 'emobility', tags: 'elroq', publisheddate: '2026-04-05' },
    { path: '/en/e', title: 'E', template: 'page', category: 'emobility', tags: 'elroq', publisheddate: '2026-05-06' },
    { path: 'javascript:alert(1)', title: 'Unsafe', template: 'story', category: 'emobility', tags: 'elroq', publisheddate: '2026-06-07' },
  ];
  const chosen = selectPromoRows(rows, {
    path: '/en/', category: ['emobility'], tags: ['elroq', 'enyaq'], limit: 2, sort: 'newest',
  });
  assert.deepEqual(chosen.map((r) => r.title), ['A', 'B']);
  assert.equal(rows[0].title, 'B');
});

test('a malformed curated block shows an error only in preview and preserves authored rows', async () => {
  const oldDocument = globalThis.document;
  const oldError = console.error;
  const oldFetch = globalThis.fetch;
  const oldLocation = globalThis.window.location;
  const logged = [];
  const rows = [{ children: [] }, { children: [] }];
  const block = {
    children: rows.slice(),
    prepend(status) { this.status = status; },
  };
  globalThis.document = {
    createElement: () => ({
      setAttribute(name, value) { this[name] = value; },
    }),
  };
  globalThis.window.location = { ...oldLocation, hostname: 'branch--repo.aem.page' };
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ data: [] }) });
  console.error = (...args) => logged.push(args);
  try {
    await decorate(block);
    assert.match(block.status.textContent, /exactly three authored cards/);
    assert.equal(block.status.role, undefined);
    assert.deepEqual(block.children, rows);
    assert.equal(logged.length, 1);
  } finally {
    globalThis.document = oldDocument;
    console.error = oldError;
    globalThis.fetch = oldFetch;
    globalThis.window.location = oldLocation;
  }
});

test('an index fetch failure reports an error in preview without losing config rows', async () => {
  const oldDocument = globalThis.document;
  const oldFetch = globalThis.fetch;
  const oldError = console.error;
  const oldLocation = globalThis.window.location;
  const block = configBlock({ template: 'story' });
  block.prepend = (status) => { block.status = status; };
  globalThis.document = {
    createElement: () => ({
      setAttribute(name, value) { this[name] = value; },
    }),
  };
  globalThis.window.location = { ...oldLocation, hostname: 'branch--repo.aem.page' };
  globalThis.fetch = async (url) => {
    if (String(url).includes('placeholders.json')) return { ok: true, json: async () => ({ data: [] }) };
    throw new Error('Index failed');
  };
  console.error = () => {};
  try {
    await decorate(block);
    assert.match(block.status.textContent, /Index failed/);
    assert.equal(block.children.length, 1);
  } finally {
    globalThis.document = oldDocument;
    globalThis.fetch = oldFetch;
    console.error = oldError;
    globalThis.window.location = oldLocation;
  }
});

test('published errors hide raw config and log diagnostics without exposing technical messages', async () => {
  const oldError = console.error;
  const oldFetch = globalThis.fetch;
  const oldLocation = globalThis.window.location;
  const block = configBlock({ limit: 'bad' });
  block.replaceChildren = () => { block.children = []; };
  const errors = [];
  console.error = (...args) => errors.push(args);
  globalThis.window.location = { ...oldLocation, hostname: 'branch--repo.aem.live' };
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ data: [] }) });
  try {
    await decorate(block);
    assert.equal(block.hidden, true);
    assert.deepEqual(block.children, []);
    assert.equal(errors.length, 1);
  } finally {
    console.error = oldError;
    globalThis.fetch = oldFetch;
    globalThis.window.location = oldLocation;
  }
});

test('authored DA image keeps its img while replacing default 2000px sources', () => {
  const oldDocument = globalThis.document;
  function node(tag) {
    const el = {
      tagName: tag.toUpperCase(), children: [], attributes: {}, parentElement: null,
      setAttribute(key, value) { this.attributes[key] = String(value); },
      getAttribute(key) { return this.attributes[key] ?? null; },
      appendChild(child) { this.insertBefore(child, null); },
      insertBefore(child, before) {
        if (child.parentElement) child.remove();
        const index = before ? this.children.indexOf(before) : this.children.length;
        this.children.splice(index, 0, child);
        child.parentElement = this;
      },
      remove() {
        if (this.parentElement) {
          this.parentElement.children.splice(this.parentElement.children.indexOf(this), 1);
          this.parentElement = null;
        }
      },
      closest(selector) {
        let current = this.parentElement;
        while (current && current.tagName !== selector.toUpperCase()) current = current.parentElement;
        return current;
      },
      querySelectorAll(selector) {
        if (selector === ':scope > source') return this.children.filter((child) => child.tagName === 'SOURCE');
        if (selector === 'source') return this.children.filter((child) => child.tagName === 'SOURCE');
        return [];
      },
      querySelector(selector) { return this.children.find((child) => child.tagName === selector.toUpperCase()); },
    };
    Object.defineProperty(el, 'src', {
      get() { return new URL(this.getAttribute('src'), globalThis.window.location.href).href; },
      set(value) { this.setAttribute('src', value); },
    });
    return el;
  }
  const picture = node('picture');
  const source = node('source');
  source.setAttribute('srcset', 'https://example.com/image.jpg?width=2000');
  const img = node('img');
  img.src = 'https://example.com/image.jpg?width=2000';
  img.alt = 'Story image';
  picture.appendChild(source);
  picture.appendChild(img);
  const scope = { querySelectorAll: () => [img] };
  globalThis.document = { createElement: node };
  try {
    optimizeImages(scope);
    assert.equal(picture.children.at(-1), img);
    assert.equal(img.getAttribute('src').includes('width=500'), true);
    assert.equal(picture.querySelectorAll('source').length, 3);
    assert.deepEqual(
      picture.querySelectorAll('source').map((el) => new URL(el.getAttribute('srcset')).searchParams.get('width')),
      ['750', '500', '750'],
    );
    assert.equal(img.getAttribute('loading'), 'lazy');
    optimizeImages(scope, { eager: true, desktopWidth: '1200', mobileWidth: '750' });
    assert.equal(picture.children.at(-1), img);
    assert.equal(picture.querySelectorAll('source').length, 3, 're-optimization does not accumulate sources');
    assert.equal(picture.querySelectorAll('source')[0].getAttribute('srcset').includes('width=1200'), true);
    assert.equal(img.getAttribute('src').includes('width=750'), true);
    assert.equal(img.getAttribute('fetchpriority'), 'high');
  } finally {
    globalThis.document = oldDocument;
  }
});

test('desktop mosaic cycles card nodes; pauses and mobile mode retain their behavior', () => {
  const oldWindow = globalThis.window;
  const oldDocument = globalThis.document;
  const oldComputedStyle = globalThis.getComputedStyle;
  const intervals = new Map();
  let nextTimer = 0;

  function element() {
    const listeners = new Map();
    return {
      children: [],
      attributes: new Map(),
      scrollLeft: 0,
      get firstElementChild() { return this.children[0]; },
      append(...children) {
        children.forEach((child) => {
          if (child.parentElement) {
            const siblings = child.parentElement.children;
            siblings.splice(siblings.indexOf(child), 1);
          }
          this.children.push(child);
          child.parentElement = this;
        });
      },
      contains(child) { return this === child || this.children.some((el) => el.contains(child)); },
      setAttribute(name, value) { this.attributes.set(name, value); },
      removeAttribute(name) { this.attributes.delete(name); },
      hasAttribute(name) { return this.attributes.has(name); },
      querySelector(selector) {
        if (selector === '.promo-box-pause') {
          return this.children.find((child) => child.className === 'promo-box-pause') || null;
        }
        return null;
      },
      addEventListener(name, listener) {
        if (!listeners.has(name)) listeners.set(name, []);
        listeners.get(name).push(listener);
      },
      dispatch(name, event = {}) { (listeners.get(name) || []).forEach((listener) => listener(event)); },
      getBoundingClientRect() { return { left: 0, right: 500 }; },
      scrollTo({ left }) { this.scrollLeft = left; },
    };
  }

  const desktop = { matches: false, addEventListener(name, listener) { this.change = listener; } };
  const reduced = { matches: false, addEventListener(name, listener) { this.change = listener; } };
  const track = element();
  const cards = Array.from({ length: 3 }, () => element());
  cards.forEach((card) => {
    card.getBoundingClientRect = () => {
      const left = track.children.indexOf(card) * 500 - track.scrollLeft;
      return { left, right: left + 500 };
    };
    track.append(card);
  });
  const block = element();
  block.append(track);
  globalThis.window = {
    ...oldWindow,
    matchMedia: (query) => (query.includes('max-width') ? desktop : reduced),
    setInterval: (callback, delay) => {
      const id = ++nextTimer;
      intervals.set(id, { callback, delay });
      return id;
    },
    clearInterval: (id) => intervals.delete(id),
    setTimeout: (callback) => callback(),
  };
  globalThis.document = {
    activeElement: null, hidden: false, createElement: element, addEventListener() {},
  };
  globalThis.getComputedStyle = () => ({ direction: 'ltr' });
  try {
    enablePromoRotation(block, track);
    assert.equal([...intervals.values()][0].delay, 10000);
    const pause = block.children[1].children[1];
    assert.equal(pause.textContent, 'Pause rotation');
    pause.dispatch('click');
    assert.equal(pause.textContent, 'Resume rotation');
    assert.equal(intervals.size, 0);
    globalThis.document.activeElement = pause;
    pause.dispatch('click');
    assert.equal(intervals.size, 1, 'explicit resume works even while the button retains focus');
    globalThis.document.activeElement = null;
    [...intervals.values()][0].callback();
    assert.deepEqual(track.children.map((card) => cards.indexOf(card)), [1, 2, 0]);

    block.dispatch('pointerenter', { pointerType: 'touch' });
    assert.equal(intervals.size, 1, 'touch compatibility hover does not stop rotation');
    block.dispatch('pointerenter', { pointerType: 'mouse' });
    assert.equal(intervals.size, 0);
    block.dispatch('pointerleave', { pointerType: 'mouse' });
    assert.equal(intervals.size, 1);
    reduced.matches = true;
    reduced.change();
    assert.equal(intervals.size, 0);
    assert.equal(pause.hidden, true);
    reduced.matches = false;
    reduced.change();
    assert.equal(pause.hidden, false);

    desktop.matches = true;
    desktop.change();
    assert.equal(block.attributes.get('aria-roledescription'), 'carousel');
    [...intervals.values()][0].callback();
    assert.equal(track.scrollLeft, 500);
    assert.equal(block.children[1].children[0].children[1].attributes.get('aria-current'), 'true');
    assert.deepEqual(track.children.map((card) => cards.indexOf(card)), [1, 2, 0]);

    desktop.matches = false;
    desktop.change();
    assert.equal(track.scrollLeft, 0);
    assert.equal(block.attributes.has('aria-roledescription'), false);
    globalThis.document.activeElement = track.children[0];
    block.dispatch('focusin');
    assert.equal(intervals.size, 0);
  } finally {
    globalThis.window = oldWindow;
    globalThis.document = oldDocument;
    globalThis.getComputedStyle = oldComputedStyle;
  }
});
