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
  querySelector: () => null,
  addEventListener: () => {},
};

const {
  parseConfig, selectRows, rowToCells, isConfigTable, curatedRows, collapseRail, railLayout, safeViewAll,
  TAXONOMY_TEMPLATES,
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
  assert.equal(cart.dataset.id, '450812', 'carries the cart key for SKODA-505');
  assert.equal(cart.getAttribute('aria-disabled'), 'true');
  assert.equal(cart.getAttribute('aria-label'), 'Add to media cart');
  assert.equal(download.className, 'media-cart-action download');
  assert.equal(download.href, 'https://cdn.example/a.jpg', 'downloads the original');

  const video = rowToCells({
    path: 'https://vimeo.com/1', title: 'V', image: 'https://i.vimeocdn.com/v.jpg', date: '2025-06-23',
    template: 'video', id: '410179', mp4: 'https://cdn.example/v.mp4',
  });
  assert.equal(video[2].elems[1].children[0].href, 'https://cdn.example/v.mp4', 'a video downloads its MP4');
  const noFile = rowToCells({ title: 'N', image: 'https://x/n.jpg', template: 'video', id: '9' });
  assert.equal(noFile[2].elems.length, 1, 'no download button without a file');
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
