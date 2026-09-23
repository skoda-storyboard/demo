/*
 * Unit tests for the Story rail (SKODA-212).
 *
 * The build path is DOM-coupled (buildBlock/decorateBlock/loadBlock behind an
 * IntersectionObserver), so these tests pin the PURE logic the block exports:
 * config parsing (parseConfig, via a readBlockConfig-shaped block) and the row
 * selection pipeline (selectRows), which MUST delegate to the shared
 * listing-logic (the "no fork" reuse gate) and to the shared index shape. The
 * deferred build + CLS reserve are confirmed in-browser.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

// Minimal window/document shim so aem.js imports at load (mirrors stories test).
globalThis.window = {
  location: { search: '', pathname: '/en/', href: 'http://localhost/en/' },
  origin: 'http://localhost',
  performance: { now: () => 0 },
  hlx: { codeBasePath: '' },
  addEventListener: () => {},
};
globalThis.document = {
  currentScript: { src: 'http://localhost/scripts/scripts.js' },
  createElement: () => ({
    className: '', children: [], attributes: {},
    classList: { add() {}, contains() { return false; } },
    setAttribute() {}, append() {},
  }),
  querySelector: () => null,
  addEventListener: () => {},
};

const { parseConfig, selectRows } = await import('./story-rail.js');

/*
 * A tiny block shim matching what readBlockConfig walks: block.querySelectorAll
 * (':scope > div') → rows; each row.children = [keyCell, valueCell] with
 * textContent. Enough to drive parseConfig without a real DOM.
 */
function cfgBlock(pairs) {
  const rows = pairs.map(([k, v]) => ({
    children: [{ textContent: k, querySelector: () => null, querySelectorAll: () => [] },
      {
        textContent: v, querySelector: () => null, querySelectorAll: () => [],
      }],
  }));
  return {
    querySelector: () => null, // no picture/img → config table
    querySelectorAll: (sel) => (sel === ':scope > div' ? rows : []),
  };
}

const rows = [
  {
    path: '/en/press-releases/enyaq', title: 'Enyaq', template: 'press_release', category: 'emobility', date: '2026-03-01',
  },
  {
    path: '/en/press-releases/elroq', title: 'Elroq', template: 'press_release', category: 'emobility', date: '2026-05-01',
  },
  {
    path: '/en/press-releases/octavia', title: 'Octavia', template: 'press_release', category: 'models', date: '2026-02-01',
  },
  {
    path: '/en/models/kodiaq', title: 'Kodiaq', template: 'model', category: 'models', date: '2026-04-01',
  },
];

// --- parseConfig -----------------------------------------------------------

test('parseConfig reads keys and applies defaults', () => {
  const cfg = parseConfig(cfgBlock([
    ['category', 'emobility'], ['limit', '5'], ['heading', 'Latest e-mobility'],
  ]));
  assert.deepEqual(cfg.category, ['emobility']);
  assert.equal(cfg.limit, 5);
  assert.equal(cfg.heading, 'Latest e-mobility');
  assert.equal(cfg.sort, 'newest'); // default
  assert.deepEqual(cfg.exclude, []);
  assert.equal(cfg.dots, false);
});

test('parseConfig tokenizes comma lists and floors limit to >=1', () => {
  const cfg = parseConfig(cfgBlock([['tag', 'enyaq, 2026'], ['limit', '-5'], ['exclude', 'teaser, promo']]));
  assert.deepEqual(cfg.tag, ['enyaq', '2026']);
  assert.equal(cfg.limit, 1); // negative floored to 1
  assert.deepEqual(cfg.exclude, ['teaser', 'promo']);
});

test('parseConfig treats limit 0 / non-numeric as unset (default 10)', () => {
  assert.equal(parseConfig(cfgBlock([['limit', '0']])).limit, 10);
  assert.equal(parseConfig(cfgBlock([['limit', 'abc']])).limit, 10);
});

test('parseConfig sort: oldest recognised, anything else → newest', () => {
  assert.equal(parseConfig(cfgBlock([['sort', 'oldest']])).sort, 'oldest');
  assert.equal(parseConfig(cfgBlock([['sort', '-publishdate']])).sort, 'newest');
});

// --- selectRows: scope → filter → exclude → sort → slice -------------------

test('selectRows filters by category and sorts newest-first', () => {
  const cfg = parseConfig(cfgBlock([['template', 'press_release'], ['category', 'emobility'], ['limit', '10']]));
  const out = selectRows(rows, cfg);
  assert.deepEqual(out.map((r) => r.title), ['Elroq', 'Enyaq']); // newest first
});

test('selectRows honours limit (slice)', () => {
  const cfg = parseConfig(cfgBlock([['template', 'press_release'], ['limit', '1']]));
  const out = selectRows(rows, cfg);
  assert.equal(out.length, 1);
  assert.equal(out[0].title, 'Elroq'); // newest press_release
});

test('selectRows excludes already-shown slugs', () => {
  const cfg = parseConfig(cfgBlock([['template', 'press_release'], ['exclude', 'elroq'], ['limit', '10']]));
  const out = selectRows(rows, cfg);
  assert.ok(out.every((r) => !r.path.includes('elroq')));
  assert.deepEqual(out.map((r) => r.title), ['Enyaq', 'Octavia']);
});

test('selectRows sort oldest reverses order', () => {
  const cfg = parseConfig(cfgBlock([['template', 'press_release'], ['sort', 'oldest'], ['limit', '10']]));
  const out = selectRows(rows, cfg);
  assert.deepEqual(out.map((r) => r.title), ['Octavia', 'Enyaq', 'Elroq']);
});

test('selectRows scopes by template (drops non-matching rows)', () => {
  const cfg = parseConfig(cfgBlock([['template', 'model'], ['limit', '10']]));
  const out = selectRows(rows, cfg);
  assert.deepEqual(out.map((r) => r.title), ['Kodiaq']);
});
