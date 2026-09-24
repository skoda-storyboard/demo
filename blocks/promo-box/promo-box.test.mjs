import { test } from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = {
  location: { href: 'https://example.com/en/', pathname: '/en/', search: '' },
  origin: 'https://example.com',
  hlx: { codeBasePath: '' },
};

const {
  default: decorate, parseSource, selectPromoRows, validateCuratedRows, enablePromoRotation,
} = await import('./promo-box.js');

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

test('a malformed curated block shows a visible error and preserves authored rows', async () => {
  const oldDocument = globalThis.document;
  const oldError = console.error;
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
  console.error = (...args) => logged.push(args);
  try {
    await decorate(block);
    assert.match(block.status.textContent, /exactly three authored cards/);
    assert.equal(block.status.role, 'alert');
    assert.deepEqual(block.children, rows);
    assert.equal(logged.length, 1);
  } finally {
    globalThis.document = oldDocument;
    console.error = oldError;
  }
});

test('an index fetch failure reports an error without losing config rows', async () => {
  const oldDocument = globalThis.document;
  const oldFetch = globalThis.fetch;
  const oldError = console.error;
  const block = configBlock({ template: 'story' });
  block.prepend = (status) => { block.status = status; };
  globalThis.document = {
    createElement: () => ({
      setAttribute(name, value) { this[name] = value; },
    }),
  };
  globalThis.fetch = async () => { throw new Error('Index failed'); };
  console.error = () => {};
  try {
    await decorate(block);
    assert.match(block.status.textContent, /Index failed/);
    assert.equal(block.children.length, 1);
  } finally {
    globalThis.document = oldDocument;
    globalThis.fetch = oldFetch;
    console.error = oldError;
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
      append(child) {
        if (child.parentElement) {
          const siblings = child.parentElement.children;
          siblings.splice(siblings.indexOf(child), 1);
        }
        this.children.push(child);
        child.parentElement = this;
      },
      contains(child) { return this === child || this.children.some((el) => el.contains(child)); },
      setAttribute(name, value) { this.attributes.set(name, value); },
      removeAttribute(name) { this.attributes.delete(name); },
      hasAttribute(name) { return this.attributes.has(name); },
      addEventListener(name, listener) {
        if (!listeners.has(name)) listeners.set(name, []);
        listeners.get(name).push(listener);
      },
      dispatch(name) { (listeners.get(name) || []).forEach((listener) => listener()); },
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
    [...intervals.values()][0].callback();
    assert.deepEqual(track.children.map((card) => cards.indexOf(card)), [1, 2, 0]);

    block.dispatch('mouseenter');
    assert.equal(intervals.size, 0);
    block.dispatch('mouseleave');
    assert.equal(intervals.size, 1);
    reduced.matches = true;
    reduced.change();
    assert.equal(intervals.size, 0);
    reduced.matches = false;
    reduced.change();

    desktop.matches = true;
    desktop.change();
    assert.equal(block.attributes.get('aria-roledescription'), 'carousel');
    [...intervals.values()][0].callback();
    assert.equal(track.scrollLeft, 500);
    assert.equal(block.children[1].children[1].attributes.get('aria-current'), 'true');
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
