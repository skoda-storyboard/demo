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
// createElement returns a node that tracks tag/children/attributes so the
// synthesized body cell (rowToCells) can be inspected.
function el(tag) {
  const node = {
    tagName: String(tag).toUpperCase(),
    className: '',
    children: [],
    attributes: {},
    _text: '',
    classList: { add() {}, contains() { return false; } },
    setAttribute(k, v) { this.attributes[k] = String(v); },
    getAttribute(k) { return this.attributes[k] ?? null; },
    set href(v) { this.attributes.href = String(v); },
    get href() { return this.attributes.href ?? ''; },
    set textContent(v) { this._text = String(v); },
    get textContent() { return this._text; },
    append(...kids) { this.children.push(...kids); },
    appendChild(kid) { this.children.push(kid); return kid; },
  };
  return node;
}
globalThis.document = {
  currentScript: { src: 'http://localhost/scripts/scripts.js' },
  createElement: (tag) => el(tag),
  querySelector: () => null,
  addEventListener: () => {},
};

const { parseConfig, selectRows, rowToCells } = await import('./story-rail.js');

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

// --- P1: default template scopes to stories (no cross-type bleed) -----------

const mixed = [
  { path: '/en/stories/a', title: 'StoryA', template: 'story', category: 'emobility', date: '2026-03-01' },
  { path: '/en/press-releases/b', title: 'PressB', template: 'press_release', category: 'emobility', date: '2026-04-01' },
  { path: '/en/stories/c', title: 'StoryC', template: 'story', category: 'emobility', date: '2026-05-01' },
];

test('selectRows defaults template to story: a category-only rail excludes press releases (P1)', () => {
  // no `template` key → parseConfig defaults to 'story'
  const cfg = parseConfig(cfgBlock([['category', 'emobility'], ['limit', '10']]));
  assert.equal(cfg.template, 'story');
  const out = selectRows(mixed, cfg);
  assert.deepEqual(out.map((r) => r.title), ['StoryC', 'StoryA']); // no PressB
});

test('selectRows: an author can still widen scope by setting template explicitly', () => {
  const cfg = parseConfig(cfgBlock([['template', 'press_release'], ['category', 'emobility'], ['limit', '10']]));
  const out = selectRows(mixed, cfg);
  assert.deepEqual(out.map((r) => r.title), ['PressB']);
});

// --- P2: image-less row synthesizes ONE (body-only) cell --------------------

test('rowToCells: a row with an image yields [imageCell, body] (2 cells)', () => {
  const cells = rowToCells({
    path: '/en/x', title: 'X', image: 'https://cdn.example/x.jpg', date: '2026-09-10',
  });
  assert.equal(cells.length, 2);
  // second cell is the body object ({ elems: [...] })
  assert.ok(Array.isArray(cells[1].elems));
});

test('rowToCells: an image-less row yields ONE body-only cell (no empty div → no double body) (P2)', () => {
  const cells = rowToCells({ path: '/en/y', title: 'Y', date: '2026-08-01' });
  assert.equal(cells.length, 1, 'only the body cell — no empty image placeholder');
  const body = cells[0];
  assert.ok(Array.isArray(body.elems), 'the single cell is the { elems } body');
  // body carries date <p> + title <h3>
  const tags = body.elems.map((e) => e.tagName);
  assert.deepEqual(tags, ['P', 'H3']);
});
