import { test } from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = {
  location: { href: 'https://example.com/en/', pathname: '/en/', search: '' },
  origin: 'https://example.com',
  hlx: { codeBasePath: '' },
};

const {
  default: decorate, parseSource, selectPromoRows, validateCuratedRows,
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
