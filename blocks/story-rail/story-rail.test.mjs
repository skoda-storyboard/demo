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
    dataset: {},
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
  // the media panel's label text nodes (it relabels them when the locale sheet loads)
  createTextNode: (data) => ({
    nodeType: 3, nodeValue: String(data), children: [], get textContent() { return this.nodeValue; },
  }),
  querySelector: () => null,
  addEventListener: () => {},
};

const {
  parseConfig, selectRows, rowToCells, isConfigTable, curatedRows, collapseRail, railLayout, safeViewAll,
  TAXONOMY_TEMPLATES, orderPaths, railHeadingTag, CONFIG_KEYS, blockStylesReady, sectionHeadingText,
} = await import('./story-rail.js');
const { feedLightboxItem } = await import('../../scripts/media-lightbox.js');

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

// a script-URL scheme, assembled so no literal javascript: URL sits in the source
const JS = ['java', 'script:'].join('');

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

test('press releases select the wider news layout without changing standard rails', () => {
  assert.equal(parseConfig(cfgBlock([['template', 'press_release']])).layout, 'news');
  assert.equal(parseConfig(cfgBlock([['template', 'skoda_model']])).layout, 'standard');
  assert.equal(parseConfig(cfgBlock([['template', 'story']])).layout, 'standard');
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

test('selectRows: `categories` + a facet pick the newsletters of one plant (SKODA-845)', () => {
  const plant = [
    { path: '/en/press-releases/kvasiny-newsletter-3', title: 'K3', template: 'press_release', date: '2026-09-25', categories: 'newsletter', company: 'kvasiny' },
    { path: '/en/press-releases/vrchlabi-newsletter-3', title: 'V3', template: 'press_release', date: '2026-09-25', categories: 'newsletter', company: 'vrchlabi' },
    { path: '/en/press-releases/kvasiny-newsletter-2', title: 'K2', template: 'press_release', date: '2026-06-12', categories: 'newsletter', company: 'kvasiny' },
    // the same plant, not a newsletter (the source's Octavia production release)
    { path: '/en/press-releases/octavia-in-kvasiny', title: 'Octavia', template: 'press_release', date: '2026-10-01', categories: '', company: 'kvasiny, production' },
    // a story in the same category never joins a press_release rail
    { path: '/en/stories/kvasiny-story', title: 'Story', template: 'story', date: '2026-10-02', categories: 'newsletter', company: 'kvasiny' },
  ];
  const cfg = parseConfig(cfgBlock([['template', 'press_release'], ['categories', 'newsletter'], ['company', 'kvasiny']]));
  assert.deepEqual(cfg.categories, ['newsletter']);
  assert.deepEqual(selectRows(plant, cfg).map((r) => r.title), ['K3', 'K2']);
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

test('rowToCells: a media feed row gets the cart + download toolbar cell (media-item contract)', () => {
  const image = rowToCells({
    path: 'https://cdn.example/a.jpg', title: 'A', image: 'https://cdn.example/a-768x512.jpg', date: '2026-08-27',
    template: 'image', id: '450812', original: 'https://cdn.example/a.jpg', mp4: '',
  });
  assert.equal(image.length, 3, 'image, body, toolbar');
  const [cart, download] = image[2].elems.map((p) => p.children[0]);
  assert.equal(image[2].elems.every((p) => p.tagName === 'P'), true, 'p > a, the card-teaser toolbar shape');
  assert.equal(cart.className, 'media-cart-action add');
  assert.equal(cart.dataset.id, '450812', 'carries the source key');
  assert.equal(cart.dataset.href, 'https://cdn.example/a.jpg', 'adds the original (SKODA-505a)');
  assert.equal(cart.dataset.title, 'A');
  assert.equal(cart.dataset.thumb, 'https://cdn.example/a-768x512.jpg', 'the card image, for the cart page (505b)');
  assert.equal(cart.getAttribute('aria-disabled'), 'true', 'inert until the built rail binds it');
  assert.equal(cart.getAttribute('aria-label'), 'Add to media cart');
  assert.equal(download.className, 'media-cart-action download');
  assert.equal(download.href, 'https://cdn.example/a.jpg', 'downloads the original');

  const video = rowToCells({
    path: 'https://vimeo.com/1', title: 'V', image: 'https://i.vimeocdn.com/v.jpg', date: '2025-06-23',
    template: 'video', id: '410179', mp4: 'https://cdn.example/v.mp4',
  });
  assert.equal(video[2].elems[1].children[0].href, 'https://cdn.example/v.mp4', 'a video downloads its MP4');
  assert.equal(video[2].elems[0].children[0].dataset.href, 'https://cdn.example/v.mp4', 'and adds the MP4');
  const noFile = rowToCells({ title: 'N', image: 'https://x/n.jpg', template: 'video', id: '9' });
  assert.equal(noFile[2].elems.length, 1, 'no download button without a file');
  assert.equal(noFile[2].elems[0].children[0].dataset.href, undefined, 'nothing to add: stays inert');
  assert.equal(rowToCells({ path: '/en/s', title: 'S', image: 'https://x/s.jpg', template: 'story' }).length, 2, 'stories get no toolbar');
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

// --- press variant (SKODA-224): CSS-only, opt-in via `Story Rail (press)` ---------
// The variant must not leak into other rails (AC: story/home rails unchanged unless they
// opt in), and it shares the SKODA-820 related-band ladder rather than forking its values.
const { readFile } = await import('node:fs/promises');
const railCss = await readFile(new URL('./story-rail.css', import.meta.url), 'utf8');
// split a selector list on top-level commas only (not the ones inside :is(...))
const selectorList = (sel) => {
  const out = [];
  let depth = 0;
  let cur = '';
  [...sel].forEach((ch) => {
    if (ch === '(') depth += 1;
    if (ch === ')') depth -= 1;
    if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += ch;
  });
  if (cur.trim()) out.push(cur.trim());
  return out;
};
const STORY_BAND = 'body.story .section.dark.story-rail-container .story-rail';
const PRESS = '.story-rail.press';
// the opt-in scopes: the press variant alone, or the band it shares with the story rail
const optIn = (s) => s.startsWith(PRESS) || s.startsWith(STORY_BAND)
  || s.startsWith(`:is(${STORY_BAND}, ${PRESS})`);
const cssRules = railCss
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .split('}')
  .map((chunk) => chunk.split('{'))
  // a rule nested in @media splits into [media, selector, body]: keep the last two
  .filter((parts) => parts.length >= 2)
  .map((parts) => ({ selector: parts[parts.length - 2].trim(), body: parts[parts.length - 1].trim() }));

test('press variant: every press selector is scoped to .story-rail.press', () => {
  const pressSelectors = cssRules
    .flatMap(({ selector }) => selectorList(selector))
    // the `.press` variant class, not the `body.press-release` template (SKODA-212a clamp)
    .filter((s) => /\.press(?![\w-])/.test(s));
  assert.ok(pressSelectors.length > 0, 'press rules exist');
  pressSelectors.forEach((s) => assert.ok(optIn(s), s));
});

test('press variant shares the related-band 90 / 45 / 30% cell ladder', () => {
  const ladder = cssRules
    .filter(({ selector }) => selectorList(selector).some((s) => s === PRESS || s === `:is(${STORY_BAND}, ${PRESS})`))
    .map(({ body }) => body.match(/--carousel-cell-width:\s*([^;]+);/)?.[1])
    .filter(Boolean);
  assert.deepEqual(ladder, [
    'calc(90cqw - var(--carousel-gap))',
    'calc(45cqw - var(--carousel-gap))',
    'calc(30cqw - var(--carousel-gap))',
  ]);
});

test('press variant: default rails keep the carousel ladder (no unscoped cell width)', () => {
  cssRules
    .filter(({ body }) => body.includes('--carousel-cell-width'))
    .forEach(({ selector }) => selectorList(selector).forEach((s) => {
      assert.ok(optIn(s), `cell width set outside an opt-in scope: ${s}`);
    }));
});

// --- rail arrows + card title hover (#296, #361, SKODA-228) ---------------------------------
const rulesOf = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '').split('}')
  .map((chunk) => chunk.split('{')).filter((parts) => parts.length >= 2)
  .map((parts) => ({ selector: parts[parts.length - 2].trim(), body: parts[parts.length - 1] }));

test('every rail draws the carousel\'s source arrow glyph: no rail or template overrides it (#361)', async () => {
  const carousel = rulesOf(await readFile(new URL('../carousel/carousel.css', import.meta.url), 'utf8'));
  const glyph = (sel) => carousel.find(({ selector }) => selector === sel)?.body || '';
  assert.match(glyph('.carousel-arrow::after'), /content:\s*"\\e00b"\s*\/\s*""/, 'prev glyph');
  assert.match(glyph('.carousel-arrow::after'), /font-family:\s*var\(--carousel-arrow-font\)/);
  assert.match(glyph('.carousel-next::after'), /content:\s*"\\e00c"\s*\/\s*""/, 'next glyph');
  // the home / story bands (story-rail.css) and the press-release Related band (#274) once laid an
  // SVG mask over it; the files went with #284, so the arrow layer stopped painting (404)
  const prUrl = new URL('../../templates/press-release/press-release.css', import.meta.url);
  const pressRelease = rulesOf(await readFile(prUrl, 'utf8'));
  [...cssRules, ...pressRelease].forEach(({ selector }) => selectorList(selector).forEach((s) => {
    assert.doesNotMatch(s, /\.carousel-(arrow|prev|next)::(after|before)$/, `arrow layer overridden: ${s}`);
  }));
});

test('card titles keep their colour on hover: one rule in the shared card primitive (SKODA-228)', async () => {
  const teaserCss = await readFile(new URL('../../styles/card-teaser.css', import.meta.url), 'utf8');
  const shared = teaserCss.replace(/\/\*[\s\S]*?\*\//g, '').match(/\.card-teaser-title a:hover\s*\{([^}]*)\}/);
  assert.ok(shared, 'the shared rule exists');
  assert.match(shared[1], /color:\s*inherit/);
  assert.match(shared[1], /text-decoration:\s*none/);
  // #306's home-only copy is gone: the shared rule covers every rail and card grid
  assert.equal(cssRules.filter(({ selector }) => selector.includes('card-teaser-title a:hover')).length, 0);
});

// --- press "All" end card (SKODA-224): only a full band gets it ----------------------
const { PRESS_BAND_SIZE, pressBandIsFull, pressAllLink } = await import('./story-rail.js');

test('press band is full at the source band size (10 cards) or when the index has more', () => {
  assert.equal(PRESS_BAND_SIZE, 10);
  assert.equal(pressBandIsFull(10), true, 'Zellmer: 10 curated cards → All card');
  assert.equal(pressBandIsFull(6), false, 'Peaq: 6 cards → none');
  assert.equal(pressBandIsFull(1), false, 'Board: 1 card → none');
  assert.equal(pressBandIsFull(4, true), true, 'index mode with more matches than the limit');
});

// a paragraph stub: its only child is a link unless extra text is given
function para(linkText, href, extraText = '') {
  const link = href ? { textContent: linkText, getAttribute: () => href } : null;
  return {
    children: link ? [link] : [],
    textContent: `${linkText}${extraText}`,
    querySelector: () => link,
  };
}

test('pressAllLink finds the band header link, skipping text paragraphs and inline links', () => {
  const allHref = 'https://www.skoda-storyboard.com/en/news/?filter';
  const paragraphs = [
    para('Based on tags: 2026, board members', null),
    para('Read more', '/x', ' about the release'),
    para('All', allHref),
  ];
  const block = { closest: () => ({ querySelectorAll: () => paragraphs }) };
  assert.equal(pressAllLink(block).getAttribute('href'), allHref);
  assert.equal(pressAllLink({ closest: () => ({ querySelectorAll: () => paragraphs.slice(0, 2) }) }), null);
  assert.equal(pressAllLink({ closest: () => null }), null, 'no section → no card');
});

test('feedLightboxItem: the source colorbox panel from a media feed row (shape 5)', () => {
  const item = feedLightboxItem({
    template: 'image',
    title: 'Škoda Octavia turns 30', description: 'Caption', date: '2026-08-27', id: '450812',
    original: 'https://cdn.example/a.jpg', 'rendition-1920': 'https://cdn.example/a-1920x1280.jpg',
    filetype: 'JPG', filesize: '10 MB', dimensions: '8256 × 5504 px', labels: '2026, Octavia',
    related: '/en/press-releases/octavia-30', 'related-title': 'Octavia turns 30',
  });
  assert.equal(item.full, 'https://cdn.example/a-1920x1280.jpg', 'the stage shows the 1920 rendition');
  assert.equal(item.download, 'https://cdn.example/a.jpg', 'download is the original');
  assert.equal(item.cartId, '450812');
  assert.equal(item.cartHref, 'https://cdn.example/a.jpg', 'the add button adds the original (SKODA-505a)');
  assert.equal(item.thumb, '', 'no listing image: the cart page shows a type tile, not the original');
  assert.equal(feedLightboxItem({ title: 'T', image: '/media_x.jpg', original: 'https://cdn.example/x.jpg' }).thumb, '/media_x.jpg');
  const paras = item.caption.children;
  const text = (node) => (node.children.length ? node.children.map((c) => (typeof c === 'string' ? c : text(c))).join('') : node.textContent);
  assert.deepEqual(paras.map(text), [
    'Škoda Octavia turns 30', 'Caption',
    'File type: JPGFile size: 10 MBDimensions: 8256 × 5504 pxPublished: 27. 8. 2026',
    '2026 · Octavia', 'Related article: Octavia turns 30',
  ]);
  assert.equal(item.actions, true, 'image rows keep the cart / download / link buttons');
  const bare = feedLightboxItem({ title: 'T', original: 'https://cdn.example/b.jpg', date: '' });
  assert.equal(bare.caption.children.length, 1, 'no empty metadata, tags or related lines');
  assert.equal(bare.full, 'https://cdn.example/b.jpg');
  const drawing = feedLightboxItem({
    template: 'asset', title: 'Technical drawings limo', date: '2024-03-22', original: 'https://cdn.example/limo.jpg',
    filetype: 'JPG', filesize: '599 KB', dimensions: '3151 × 1847 px',
  });
  assert.equal(drawing.actions, false, 'content images have no action buttons (source)');
  assert.equal(drawing.caption.children.length, 2, 'title + file details');
});

test('feedLightboxItem: a video row plays the Vimeo player; its panel adds length / bitrate / audio', () => {
  const item = feedLightboxItem({
    template: 'video', title: "Let's Explore Albania | Footage", date: '2025-06-23', id: '410179',
    'vimeo-id': '1095073143', mp4: 'https://cdn.example/f.mp4', poster: 'https://i.vimeocdn.com/p.jpg',
    filetype: 'MP4', filesize: '3 GB', length: '14:05', bitrate: '29994kb/s', audioformat: 'quicktime',
    dimensions: '3840 × 2160 px',
  });
  assert.equal(item.video, 'https://player.vimeo.com/video/1095073143?dnt=1&autoplay=1&muted=1');
  assert.equal(item.src, 'https://i.vimeocdn.com/p.jpg', 'the poster stands in for the image');
  assert.equal(item.download, 'https://cdn.example/f.mp4');
  assert.equal(item.actions, true);
  const text = (node) => (node.children.length ? node.children.map((c) => (typeof c === 'string' ? c : text(c))).join('') : node.textContent);
  assert.equal(text(item.caption.children[1]), 'File type: MP4File size: 3 GBLength: 14:05Bitrate: 29994kb/sAudio format: quicktimeDimensions: 3840 × 2160 pxPublished: 23. 6. 2025');
  const fileOnly = feedLightboxItem({ template: 'video', title: 'V', mp4: 'https://cdn.example/v.mp4' });
  assert.equal(fileOnly.video, 'https://cdn.example/v.mp4', 'no Vimeo id: the MP4 plays');
});

// --- Storyboard home bands (SKODA-611b) ---------------------------------------------------
const home = {
  press: false, curated: false, landing: true, homeBand: true, layout: 'standard',
};

test('railLayout: every home-band index rail is wide; Models keeps its ladder; taxonomy rails caption', () => {
  assert.deepEqual(railLayout({ ...home, template: 'story' }).classes, ['story-rail-wide', 'story-rail-home']);
  assert.deepEqual(railLayout({ ...home, template: 'skoda_model' }).classes, [
    'story-rail-wide', 'story-rail-home', 'story-rail-models', 'story-rail-caption',
  ]);
  assert.deepEqual(railLayout({ ...home, template: 'skoda_series' }).classes, [
    'story-rail-wide', 'story-rail-home', 'story-rail-caption',
  ]);
  assert.deepEqual(railLayout({ ...home, template: 'press_release', layout: 'news' }).classes, [
    'story-rail-wide', 'story-rail-home',
  ]);
  assert.deepEqual(railLayout({ ...home, template: 'story' }).carousel, [], 'post rails keep the overlay card');
});

test('railLayout: Media Room Images / Videos bands take the model ladder and the media card', () => {
  ['image', 'video'].forEach((template) => {
    const { classes, carousel, endCard } = railLayout({ ...home, template, viewAll: '/en/images' });
    assert.deepEqual(classes, ['story-rail-wide', 'story-rail-home', 'story-rail-media'], template);
    assert.deepEqual(carousel, ['media', 'caption', template], template);
    assert.equal(endCard, true, `${template}: the source rail ends with its "All" card`);
  });
  // outside a home band (a model page's Images rail) the template script owns the card
  const modelPage = railLayout({ ...home, homeBand: false, landing: false, template: 'image' });
  assert.deepEqual(modelPage.classes, []);
  assert.deepEqual(modelPage.carousel, []);
});

test('railLayout: other rails keep their layouts (non-home bands, press band, curated, non-landing)', () => {
  const off = { ...home, homeBand: false };
  assert.deepEqual(railLayout({ ...off, template: 'story' }).classes, [], 'e.g. a model page rail');
  // a landing-page news rail outside a home band (the Media Room News rail) stays wide
  assert.deepEqual(railLayout({ ...off, template: 'press_release', layout: 'news' }).classes, ['story-rail-wide']);
  assert.deepEqual(railLayout({ ...home, press: true, template: 'press_release' }).classes, []);
  assert.deepEqual(railLayout({ ...home, curated: true, template: 'story' }).classes, []);
  assert.deepEqual(railLayout({ ...home, landing: false, template: 'story' }).classes, []);
});

test('railLayout: the "All" end card is for home-band post rails with a viewall link only', () => {
  const all = '/en/category/emobility';
  assert.equal(railLayout({ ...home, template: 'story', viewAll: all }).endCard, true);
  assert.equal(railLayout({ ...home, template: 'press_release', layout: 'news', viewAll: '/en/news' }).endCard, true);
  assert.equal(railLayout({ ...home, template: 'story', viewAll: '' }).endCard, false, 'no link, no card');
  assert.equal(railLayout({ ...home, template: 'skoda_series', viewAll: '/en/series-2' }).endCard, false, 'series shows all');
  assert.equal(railLayout({ ...home, template: 'skoda_model', viewAll: all }).endCard, false);
  assert.equal(railLayout({ ...home, homeBand: false, template: 'story', viewAll: all }).endCard, false);
  assert.equal(railLayout({ ...home, press: true, template: 'story', viewAll: all }).endCard, false, 'press has its own');
  assert.equal(railLayout({ ...home, landing: false, template: 'story', viewAll: all }).endCard, false, 'not wide, not sized');
});

test('railLayout: the Media Room Press Kits rail (compact home band) is wide with an end card, like live', () => {
  const pk = railLayout({ ...home, template: 'press_kit', viewAll: '/en/press-kits' });
  assert.deepEqual(pk.classes, ['story-rail-wide', 'story-rail-home']);
  assert.equal(pk.endCard, true);
});

test('wide cells are set only on the wide layout (no unscoped --wide-cell-width)', () => {
  const setters = cssRules.filter(({ body }) => /--wide-cell-width\s*:/.test(body));
  assert.ok(setters.length >= 5, 'the wide + model ladders');
  setters.forEach(({ selector }) => selectorList(selector).forEach((s) => {
    assert.ok(/\.story-rail\.story-rail-wide/.test(s), `wide cell width set outside .story-rail-wide: ${s}`);
  }));
});

test('rowToCells: model and series rows carry no date, so they render as caption cards', () => {
  assert.ok(TAXONOMY_TEMPLATES.has('skoda_model') && TAXONOMY_TEMPLATES.has('skoda_series'));
  const [, model] = rowToCells({
    path: '/en/skoda-model/elroq', title: 'Elroq', image: 'https://x/e.jpg', template: 'skoda_model', date: '2026-05-01',
  });
  assert.equal(model.elems.length, 1, 'title only');
  assert.equal(model.elems[0].tagName, 'H3');
  const [, story] = rowToCells({
    path: '/en/s', title: 'S', image: 'https://x/s.jpg', template: 'story', date: '2026-05-01',
  });
  assert.equal(story.elems.length, 2, 'stories keep their date (overlay card)');
});

// --- malformed authored / index input (SKODA-611b pre-PR review; the #231 failure class) ----
test('safeViewAll keeps only a real http(s) link that leaves the page', () => {
  assert.equal(safeViewAll('http://localhost/en/', 'http://localhost/en'), '', 'the page itself, trailing slash or not');
  const base = 'http://localhost/en/';
  assert.equal(safeViewAll('http://localhost/en/category/emobility', base), 'http://localhost/en/category/emobility');
  assert.equal(safeViewAll('/en/news', base), 'http://localhost/en/news', 'root-relative text is a path');
  assert.equal(safeViewAll('https://www.skoda-storyboard.com/en/series-2/', base), 'https://www.skoda-storyboard.com/en/series-2/');
  assert.equal(safeViewAll(['http://localhost/a', 'http://localhost/b'], base), 'http://localhost/a', 'first of several links');
  ['', undefined, 'https://', `${JS}alert(1)`, `Java${JS.slice(4)}alert(1)`, 'data:text/html,x', 'All', 'en/x', '//evil.example/x',
    'mailto:a@b.c', 'http://localhost/en/', 'http://localhost/en/#', 'http://localhost/en/#top', '/\\evil.example/x'].forEach((v) => {
    assert.equal(safeViewAll(v, base), '', `rejected: ${v}`);
  });
});

test('parseConfig: a malformed "All" link gives no viewall; the template is normalised', () => {
  assert.equal(parseConfig(cfgBlock([['viewall', `${JS}alert(1)`]])).viewAll, '');
  assert.equal(parseConfig(cfgBlock([['viewall', 'https://']])).viewAll, '');
  assert.equal(parseConfig(cfgBlock([['template', ' Skoda_Model ']])).template, 'skoda_model');
  assert.equal(parseConfig(cfgBlock([['template', '  ']])).template, 'story');
  assert.equal(parseConfig(cfgBlock([['template', ' Press_Release ']])).layout, 'news', 'layout follows the normalised template');
});

test('rowToCells: an invalid image url drops the image, not the card (the rail survives)', (t) => {
  t.mock.method(console, 'warn', () => {});
  ['https://', 'http:', '//'].forEach((image) => {
    const cells = rowToCells({ path: '/en/s', title: 'S', image, template: 'story', date: '2026-05-01' });
    assert.equal(cells.length, 1, `${image}: body only`);
    assert.equal(cells[0].elems.at(-1).tagName, 'H3');
  });
  assert.equal(console.warn.mock.callCount(), 3);
});

// --- #272: the home's hand-picked Models band (`order`) and the h3 home headings ------------

// the index rows of the Storyboard home's Models band: the model tag pages are `page` rows
const tagRows = ['elroq', 'kodiaq', 'enyaq', 'peaq'].map((m, i) => ({
  path: `/en/tag/model/${m}`, title: m, template: 'page', date: '', image: `/m/${m}.jpg`, n: i,
}));
const modelRows = [{ path: '/en/skoda-model/elroq/elroq-rs', title: 'Elroq RS', template: 'skoda_model', date: '2026-09-01' }];

test('orderPaths: a comma list of paths or links, without host, trailing slash or .html', () => {
  assert.deepEqual(orderPaths('/en/tag/model/elroq, /en/tag/model/kodiaq/'), ['/en/tag/model/elroq', '/en/tag/model/kodiaq']);
  assert.deepEqual(orderPaths(['https://www.skoda-storyboard.com/en/tag/model/peaq/', '/en/x.html']), ['/en/tag/model/peaq', '/en/x']);
  assert.deepEqual(orderPaths(''), []);
  assert.deepEqual(orderPaths(undefined), []);
});

test('selectRows with an order: those pages in that order, whatever their template; missing ones skipped', () => {
  const cfg = parseConfig(cfgBlock([
    ['heading', 'Models'], ['template', 'skoda_model'],
    ['order', '/en/tag/model/kodiaq, /en/tag/model/elroq, /en/tag/model/missing, /en/tag/model/peaq'],
  ]));
  const picked = selectRows([...modelRows, ...tagRows], cfg);
  assert.deepEqual(picked.map((r) => r.path), ['/en/tag/model/kodiaq', '/en/tag/model/elroq', '/en/tag/model/peaq']);
  assert.equal(cfg.template, 'skoda_model', 'the template still sets the caption card style');
});

test('an order shows every listed page (no default limit of 10); an authored limit still caps it', () => {
  const eleven = Array.from({ length: 11 }, (_, i) => `/en/tag/model/m${i}`).join(', ');
  assert.equal(parseConfig(cfgBlock([['order', eleven]])).limit, 11);
  assert.equal(parseConfig(cfgBlock([['order', eleven], ['limit', '4']])).limit, 4);
  assert.equal(parseConfig(cfgBlock([['category', 'emobility']])).limit, 10, 'rails without an order keep 10');
});

test('rails without an order are unchanged: scope, sort and limit as before', () => {
  const cfg = parseConfig(cfgBlock([['template', 'skoda_model']]));
  assert.deepEqual(cfg.order, []);
  assert.deepEqual(selectRows([...modelRows, ...tagRows], cfg).map((r) => r.path), ['/en/skoda-model/elroq/elroq-rs']);
});

test('isConfigTable: an order row keeps the Models band a config table (not curated cards)', () => {
  assert.equal(isConfigTable(railBlock([
    [['heading'], ['Models']], [['template'], ['skoda_model']], [['order'], ['/en/tag/model/elroq']],
  ])), true);
});

test('railHeadingTag: the home bands get the source h3, every other rail keeps h2', () => {
  assert.equal(railHeadingTag(railLayout({ ...home, template: 'story' }).classes), 'h3');
  assert.equal(railHeadingTag(railLayout({ ...home, template: 'skoda_model' }).classes), 'h3');
  const news = railLayout({
    ...home, homeBand: false, template: 'press_release', layout: 'news',
  });
  assert.equal(railHeadingTag(news.classes), 'h2', 'a news rail outside a home band');
  assert.equal(railHeadingTag(railLayout({ ...home, press: true, template: 'press_release' }).classes), 'h2', 'the press band');
  assert.equal(railHeadingTag(railLayout({ ...home, landing: false, template: 'story' }).classes), 'h2', 'a model page rail');
  assert.equal(railHeadingTag(railLayout({ ...home, curated: true, template: 'story' }).classes), 'h2', 'a curated rail');
});

// The publication gate (validate-blocks / import:push checkPage) only lets a config key through
// when the registry lists it: a key the block reads but the registry omits holds every page that
// uses it (PR #306 review: `order` was read here but unregistered, so the home could not publish).
test('every config key story-rail reads is registered in the publication contract, and vice versa', async () => {
  const { readFileSync } = await import('node:fs');
  const registry = new URL('../../tools/importer/push/block-contracts.json', import.meta.url);
  const contracts = JSON.parse(readFileSync(registry, 'utf8'));
  const registered = new Set(contracts.main['story-rail'].configKeys);
  assert.deepEqual([...CONFIG_KEYS].filter((key) => !registered.has(key)), [], 'read by the block, missing from the registry');
  assert.deepEqual([...registered].filter((key) => !CONFIG_KEYS.has(key)), [], 'registered, not read by the block');
  assert.ok(registered.has('order'));
});

// --- #332: the Media Room News rail skips what the promo box shows --------------------------------

const {
  shownPaths, promoShownPaths, skipsPromo, PROMO_WAIT_MS,
} = await import('./story-rail.js');

// a promo-box block as the rail sees it: its status and its cards' stretched links
function fakePromo(hrefs, status = 'loaded') {
  return {
    dataset: { blockStatus: status },
    querySelectorAll: (sel) => (sel === '.card-teaser-link[href]'
      ? hrefs.map((href) => ({ getAttribute: (k) => (k === 'href' ? href : null) })) : []),
  };
}
const pageWith = (promo) => ({ querySelector: (sel) => (sel === 'main .promo-box' ? promo : null) });

test('#332: shownPaths reads the promo cards as index paths, in order, without repeats', () => {
  const promo = fakePromo([
    'https://main--demo--skoda-storyboard.aem.page/en/press-releases/elroq',
    '/en/press-releases/enyaq/',
    '/en/press-kits/peaq.html',
    '/en/press-releases/elroq',
  ]);
  assert.deepEqual(shownPaths(promo), ['/en/press-releases/elroq', '/en/press-releases/enyaq', '/en/press-kits/peaq']);
  assert.deepEqual(shownPaths(null), []);
});

test('#332: selectRows skips the shown pages by whole path, then fills the limit', () => {
  const cfg = parseConfig(cfgBlock([['template', 'press_release'], ['limit', '2']]));
  assert.deepEqual(selectRows(rows, cfg).map((r) => r.title), ['Elroq', 'Enyaq'], 'without a promo');
  const out = selectRows(rows, { ...cfg, shown: ['/en/press-releases/elroq'] });
  // the newest is in the promo: the rail starts with the next one and still shows two
  assert.deepEqual(out.map((r) => r.title), ['Enyaq', 'Octavia']);
  // a path that only contains a shown one is not shown
  const partial = selectRows(rows, { ...cfg, shown: ['/en/press-releases/elr'] });
  assert.deepEqual(partial.map((r) => r.title), ['Elroq', 'Enyaq']);
});

test('#332: only an index News rail skips the promo', () => {
  const news = parseConfig(cfgBlock([['template', 'press_release']]));
  assert.equal(skipsPromo(news), true);
  assert.equal(skipsPromo(news, { press: true }), false, 'a Related Press Releases band');
  assert.equal(skipsPromo(news, { curated: true }), false, 'a hand-picked rail');
  assert.equal(skipsPromo({ ...news, order: ['/en/press-releases/elroq'] }), false, 'an ordered rail');
  ['story', 'press_kit', 'image', 'video', 'skoda_model'].forEach((template) => {
    assert.equal(skipsPromo(parseConfig(cfgBlock([['template', template]]))), false, template);
  });
});

test('#332: promoShownPaths reads a loaded promo, and shows nothing without one', async () => {
  assert.deepEqual(await promoShownPaths(pageWith(null)), []);
  const promo = fakePromo(['/en/press-releases/elroq']);
  assert.deepEqual(await promoShownPaths(pageWith(promo)), ['/en/press-releases/elroq']);
  assert.ok(PROMO_WAIT_MS > 0);
});

test('#332: promoShownPaths waits for the promo to load, and gives up after the timeout', async () => {
  const observers = [];
  class FakeObserver {
    constructor(cb) { this.cb = cb; this.connected = false; observers.push(this); }

    observe() { this.connected = true; }

    disconnect() { this.connected = false; }
  }
  const saved = { global: globalThis.MutationObserver, window: globalThis.window.MutationObserver };
  globalThis.MutationObserver = FakeObserver;
  globalThis.window.MutationObserver = FakeObserver;
  try {
    const promo = fakePromo(['/en/press-releases/enyaq'], 'loading');
    const pending = promoShownPaths(pageWith(promo), 1000);
    promo.dataset.blockStatus = 'loaded';
    observers[0].cb();
    assert.deepEqual(await pending, ['/en/press-releases/enyaq']);
    assert.equal(observers[0].connected, false, 'stops watching once loaded');

    // a promo that never loads: the rail builds with nothing skipped
    const stuck = fakePromo(['/en/press-releases/enyaq'], 'loading');
    assert.deepEqual(await promoShownPaths(pageWith(stuck), 5), []);
    assert.equal(observers[1].connected, false, 'stops watching on timeout');
  } finally {
    globalThis.MutationObserver = saved.global;
    globalThis.window.MutationObserver = saved.window;
  }
});

// SKODA-841: a rail's `tag` matches the `tags` column or a facet column
test('selectRows: a `tag` rail reaches pages that set the facet only', () => {
  const pages = [
    { path: '/en/x', title: 'Tagged', template: 'story', tags: 'kodiaq', date: '2026-01-02' },
    { path: '/en/y', title: 'Facet only', template: 'story', model: 'kodiaq', date: '2026-01-01' },
    { path: '/en/z', title: 'Other', template: 'story', model: 'karoq', date: '2026-01-03' },
  ];
  const cfg = parseConfig(cfgBlock([['template', 'story'], ['tag', 'kodiaq'], ['limit', '10']]));
  assert.deepEqual(selectRows(pages, cfg).map((r) => r.title), ['Tagged', 'Facet only']);
});
