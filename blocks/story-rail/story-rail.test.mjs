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

const {
  parseConfig, selectRows, rowToCells, isConfigTable, curatedRows, collapseRail,
} = await import('./story-rail.js');

/*
 * A block whose `children` are rows, each row's `children` are cells. cells are
 * { textContent, querySelector(sel) } — querySelector returns a truthy stub only
 * when the cell was declared to hold an image. Drives isConfigTable (row shape +
 * config-key detection) without a real DOM.
 */
function railBlock(rows) {
  const cell = (text, hasImg = false) => ({
    textContent: text,
    querySelector: (sel) => ((hasImg && /picture|img/.test(sel)) ? {} : null),
  });
  return {
    children: rows.map((cells) => ({
      children: cells.map(([text, hasImg]) => cell(text, hasImg)),
    })),
  };
}

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

// --- SKODA-820: index facet columns as config keys (AND across keys) ---------

const tagged = [
  { path: '/en/emobility/a', title: 'EpiqThisYear', template: 'story', model: 'epiq', years: '2026', date: '2026-08-13' },
  { path: '/en/lifestyle/b', title: 'EpiqPeaqThisYear', template: 'story', model: 'epiq, peaq', years: '2026', date: '2026-07-07' },
  { path: '/en/emobility/c', title: 'PeaqThisYear', template: 'story', model: 'peaq', years: '2026', date: '2026-09-22' },
  { path: '/en/emobility/d', title: 'EpiqLastYear', template: 'story', model: 'epiq', years: '2025', date: '2025-11-01' },
  { path: '/en/emobility/self', title: 'Self', template: 'story', model: 'epiq', years: '2026', date: '2026-09-15' },
];

test('parseConfig reads index facet columns (model, years) as facets', () => {
  const cfg = parseConfig(cfgBlock([['model', 'epiq'], ['years', '2026'], ['tags', '']]));
  assert.deepEqual(cfg.facets, { model: ['epiq'], years: ['2026'] });
  assert.deepEqual(cfg.tag, []);
});

test('selectRows ANDs across facet keys: model=epiq AND years=2026, self excluded, newest first', () => {
  const cfg = parseConfig(cfgBlock([['model', 'epiq'], ['years', '2026'], ['exclude', 'self'], ['limit', '10']]));
  const out = selectRows(tagged, cfg);
  assert.deepEqual(out.map((r) => r.title), ['EpiqThisYear', 'EpiqPeaqThisYear']);
});

test('related rail shows ten distinct indexed stories, or only available matches', () => {
  const cfg = parseConfig(cfgBlock([
    ['template', 'story'], ['model', 'epiq'], ['years', '2026'],
    ['exclude', 'epiq-self'], ['limit', '10'],
  ]));
  const matching = Array.from({ length: 10 }, (_, i) => ({
    path: `/en/emobility/related-${i}`,
    title: `Related ${i}`,
    template: 'story',
    model: 'epiq',
    years: '2026',
    date: `2026-08-${String(i + 1).padStart(2, '0')}`,
  }));
  const excluded = { ...matching[0], path: '/en/emobility/epiq-self' };
  const otherYear = { ...matching[0], path: '/en/emobility/epiq-2025', years: '2025' };
  const otherTemplate = { ...matching[0], path: '/en/press-releases/epiq', template: 'press_release' };
  const all = [excluded, otherYear, otherTemplate, ...matching];
  const paths = selectRows(all, cfg).map((row) => row.path);
  assert.equal(paths.length, 10);
  assert.equal(new Set(paths).size, 10);
  assert.ok(paths.every((path) => path.startsWith('/en/emobility/related-')));
  assert.equal(selectRows(all.slice(0, 5), cfg).length, 2);
});

test('empty related rail removes its dark section; other rails keep their section', () => {
  let removedSection = false;
  const section = { remove: () => { removedSection = true; } };
  const mount = { remove: () => { throw new Error('related mount should not be removed alone'); } };
  const header = { children: [] };
  collapseRail({ closest: () => section }, mount, header);
  assert.equal(removedSection, true);

  let removedMount = false;
  let removedHeader = false;
  collapseRail(
    { closest: () => null },
    { remove: () => { removedMount = true; } },
    { children: [], remove: () => { removedHeader = true; } },
  );
  assert.equal(removedMount, true);
  assert.equal(removedHeader, true);
});

test('selectRows still ORs values within one facet key', () => {
  const cfg = parseConfig(cfgBlock([['model', 'epiq, peaq'], ['years', '2026'], ['exclude', 'self']]));
  const out = selectRows(tagged, cfg);
  assert.deepEqual(out.map((r) => r.title), ['PeaqThisYear', 'EpiqThisYear', 'EpiqPeaqThisYear']);
});

test('isConfigTable accepts facet-column keys (not mistaken for curated cards)', () => {
  const block = railBlock([[['template'], ['story']], [['model'], ['epiq']], [['years'], ['2026']]]);
  assert.equal(isConfigTable(block), true);
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

test('rowToCells removes the legacy site suffix from indexed teaser titles', () => {
  const [body] = rowToCells({
    path: '/en/epiq',
    title: 'What’s behind Epiq design? - Škoda Storyboard',
    date: '2026-05-27',
  });
  assert.equal(body.elems[1].children[0].textContent, 'What’s behind Epiq design?');
});

// --- isConfigTable: detect by row shape/keys, not image presence (P2) -------

test('isConfigTable: a key/value config table is detected', () => {
  const block = railBlock([
    [['category'], ['emobility']],
    [['limit'], ['10']],
    [['heading'], ['Latest e-mobility']],
  ]);
  assert.equal(isConfigTable(block), true);
});

test('isConfigTable: an all-text curated rail (no images) is NOT a config table (P2)', () => {
  // Reported bug: a curated rail whose authors omit images used to be sniffed as
  // config (no <img> present) and replaced by an index rail. Its first cells are
  // NOT config keys, so row-shape detection correctly keeps it curated.
  const block = railBlock([
    [['Škoda Elroq RS revealed'], ['15. 9. 2026']],
    [['Enyaq model-year update'], ['1. 8. 2026']],
  ]);
  assert.equal(isConfigTable(block), false);
});

test('isConfigTable: a curated rail with images is not a config table', () => {
  const block = railBlock([
    [['', true], ['### Enyaq']], // first cell holds a picture
    [['', true], ['### Elroq']],
  ]);
  assert.equal(isConfigTable(block), false);
});

test('isConfigTable: an empty block defaults to config', () => {
  assert.equal(isConfigTable(railBlock([])), true);
});

test('isConfigTable: a 3-cell row is not a config table (curated shape)', () => {
  const block = railBlock([[['category'], ['x'], ['extra']]]);
  assert.equal(isConfigTable(block), false);
});

test('curatedRows passes the authored cell contents without nesting their wrappers', () => {
  const picture = el('picture');
  const date = el('p');
  const title = el('h3');
  const block = {
    children: [{
      children: [
        { childNodes: [picture] },
        { childNodes: [date, title] },
      ],
    }],
  };
  assert.deepEqual(curatedRows(block), [[
    { elems: [picture] },
    { elems: [date, title] },
  ]]);
});
