/* global globalThis */
/*
 * Unit tests for the SiteOrigin story-flatten parser (SKODA-801).
 * Run: node --test tools/importer/parsers/story-flatten.test.mjs
 *
 * Two layers, matching the repo convention (pure logic unit-tested; DOM glue validated
 * live by the import-validator hook + the browser preview):
 *   1. classifyWidget — the 17-type census mapping — tested zero-dependency with a tiny
 *      element stub. Always runs (CI-safe).
 *   2. Full tree-walk / emit / large-tree robustness — needs a DOM. jsdom is NOT a repo
 *      dependency (devDependencies-only, no DOM lib), so these resolve jsdom from the
 *      import-validator toolchain when present and SKIP cleanly when it is not, so
 *      `npm test` stays green everywhere.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

// Optional jsdom (not a repo dep). Try the import-validator toolchain, then a bare
// resolve; skip DOM tests if neither is available.
let JSDOM = null;
try {
  const req = createRequire('/home/node/.excat-marketplaces/excat-marketplace/excat/hooks/import-validator/');
  // eslint-disable-next-line import/no-unresolved
  ({ JSDOM } = req('jsdom'));
} catch {
  try {
    const req = createRequire(import.meta.url);
    // eslint-disable-next-line import/no-unresolved
    ({ JSDOM } = req('jsdom'));
  } catch { /* jsdom unavailable — DOM tests skip */ }
}
const domSkip = JSDOM ? false : 'jsdom not installed (repo has no DOM lib) — DOM tests skip';

// Minimal createTable stub — plain-array cells only (the helix-importer contract): a
// header row (<th> block name), then one <tr> per row.
function createTable(cells, document) {
  const table = document.createElement('table');
  const [[blockName]] = cells;
  table.dataset.block = blockName;
  const head = document.createElement('tr');
  head.appendChild(document.createElement('th')).textContent = blockName;
  table.appendChild(head);
  cells.slice(1).forEach((row) => {
    const tr = document.createElement('tr');
    row.forEach((col) => {
      const td = document.createElement('td');
      (Array.isArray(col) ? col : [col]).forEach((v) => {
        if (v == null) return;
        if (typeof v === 'string') td.append(document.createTextNode(v));
        else td.appendChild(v);
      });
      tr.appendChild(td);
    });
    table.appendChild(tr);
  });
  return table;
}
globalThis.WebImporter = {
  DOMUtils: {
    createTable,
    remove(el, sels) { sels.forEach((s) => el.querySelectorAll(s).forEach((n) => n.remove())); },
  },
  Blocks: {
    createBlock(document, { name, cells }) {
      return createTable([[name], ...Object.entries(cells)], document);
    },
  },
};

const { default: parse, __test } = await import('./story-flatten.js');
const { classifyWidget } = __test;

function domDoc(html) { return new JSDOM(html).window.document; }

// A zero-dependency stand-in for a `.so-panel` element: classifyWidget only reads
// `.className` and `.querySelector('[class*="so-widget-"]')`. Encoding the signal in
// the panel class (as the source markup does on `.so-panel.widget_<type>`) lets us test
// the full 17-type census mapping without a DOM.
function fakePanel(className) {
  return { className, querySelector: () => null };
}

// ---- widget classification (all 17 canonical census types; zero-dependency) --
const CASES = [
  ['so-panel widget widget_sow-editor', 'editor'],
  ['so-panel widget widget_skoda-offset', 'offset'],
  ['so-panel widget widget_skoda-carousel-widget', 'carousel'],
  ['so-panel widget widget_sow-slider', 'slider'],
  ['so-panel widget widget_skoda-quote', 'quote'],
  ['so-panel widget widget_skoda-captioned-image', 'captioned-image'],
  ['so-panel widget widget_sow-button', 'button'],
  ['so-panel widget widget_skoda-image-box', 'image-box'],
  ['so-panel widget widget_sow-image', 'image'],
  ['so-panel widget widget_skoda-newsletter-widget', 'newsletter'],
  ['so-panel so-widget-ys-milestones', 'milestones'],
  ['so-panel ys-embed-share', 'share'],
  ['so-panel ys-so-widget-highlights', 'highlights'],
  ['so-panel so-widget-k2tools-charge-map', 'defer-charge-map'],
  ['so-panel so-widget-k2tools-charging-calculator', 'defer-calculator'],
  ['so-panel siteorigin-panels-builder', 'nested-builder'],
  ['so-panel widget widget_totally-unknown-xyz', 'unknown'],
];

CASES.forEach(([cls, expected]) => {
  test(`classifyWidget: ${cls.split(' ').pop()} → ${expected}`, () => {
    assert.equal(classifyWidget(fakePanel(cls)), expected);
  });
});

// ---- detection / linear-story fallback ------------------------------------
test('no SiteOrigin tree → parser no-ops (linear-story fallback)', { skip: domSkip }, () => {
  const d = domDoc('<div class="entry-content"><h2>Title</h2><p>Body</p></div>');
  const content = d.querySelector('.entry-content');
  const before = content.innerHTML;
  parse(content, { document: d });
  assert.equal(content.innerHTML, before, 'linear content left untouched');
});

// ---- rich text flatten -----------------------------------------------------
test('sow-editor rich text flattens to default content, builder stripped', { skip: domSkip }, () => {
  const d = domDoc(`
    <div class="entry-content"><div class="panel-layout">
      <div class="panel-grid"><div class="panel-grid-cell">
        <div class="so-panel widget widget_sow-editor">
          <div class="panel-widget-style">
            <div class="so-widget-sow-editor so-widget-sow-editor-base">
              <div class="siteorigin-widget-tinymce textwidget"><h2>Heading</h2><p>Body text</p></div>
            </div>
          </div>
        </div>
      </div></div>
    </div></div>`);
  const content = d.querySelector('.entry-content');
  parse(content, { document: d });
  assert.equal(content.querySelectorAll('.panel-grid, .so-panel, [class*="so-widget"]').length, 0, 'no builder markup left');
  assert.equal(content.querySelectorAll('h2').length, 1);
  assert.equal(content.querySelector('h2').textContent, 'Heading');
  assert.equal(content.querySelectorAll('p').length, 1);
});

// ---- spacer dropped --------------------------------------------------------
test('skoda-offset spacer → a Spacer block with its height (1em = 24px at the widget\'s 24px font)', { skip: domSkip }, () => {
  const d = domDoc(`
    <div class="entry-content"><div class="panel-layout">
      <div class="panel-grid"><div class="panel-grid-cell">
        <div class="so-panel widget widget_skoda-offset"><div class="so-widget-skoda-offset"><div style="padding-top:1em"></div></div></div>
      </div></div>
    </div></div>`);
  const content = d.querySelector('.entry-content');
  parse(content, { document: d });
  const table = content.querySelector('table');
  assert.equal(table?.dataset.block, 'Spacer');
  assert.equal(table.querySelector('tr:nth-child(2) td').textContent, '24px');
});

// ---- carousel routed BY CONTENT: link-free images → Gallery (slider) --------
// source item shape (live Octavia / Epiq carousels, measured 2026-09-28): an
// image holder, then an optional description div with inline presentation styles
const carouselItem = (src, alt, desc) => `<div class="search-results-item">
  <div class="image-holder ratio-16x9"><img src="${src}" alt="${alt}" data-caption=""></div>
  ${desc == null ? '' : `<div class="search-results-item-description" style="color: #161718">
    <p style="text-align: center;"><span style="font-size: 10pt;">${desc}</span></p></div>`}
</div>`;
const carouselDoc = (items) => domDoc(`
  <div class="entry-content"><div class="panel-layout">
    <div class="panel-grid"><div class="panel-grid-cell">
      <div class="so-panel widget widget_skoda-carousel-widget">
        <div class="so-widget-skoda-carousel-widget">${items.join('')}</div>
      </div>
    </div></div>
  </div></div>`);
const sliderRows = (d) => {
  const content = d.querySelector('.entry-content');
  parse(content, { document: d });
  const table = content.querySelector('table[data-block="Gallery (slider)"]');
  return { content, table, rows: table ? [...table.querySelectorAll('tr')].filter((tr) => tr.querySelector('td')) : [] };
};

test('link-free skoda-carousel-widget → Gallery (slider) block, one row per image', { skip: domSkip }, () => {
  const { content, table, rows } = sliderRows(carouselDoc([
    carouselItem('a.jpg', 'Alt A'), carouselItem('b.jpg', 'Alt B'),
  ]));
  // SKODA-819: rendered like the source — one image per view, not the lead+thumbnails gallery
  assert.ok(table, 'Gallery (slider) block emitted for a link-free image carousel');
  assert.equal(content.querySelector('table[data-block="Gallery"]'), null, 'not the default Gallery variant');
  assert.equal(content.querySelector('table[data-block="Cards"]'), null, 'no Cards block for an image carousel');
  assert.equal(rows.length, 2, 'two image rows');
  assert.ok(table.querySelector('img[src="a.jpg"]'));
});

test('slider caption = the item description (Octavia), text only, source order', { skip: domSkip }, () => {
  const { rows } = sliderRows(carouselDoc([
    carouselItem('a.jpg', 'Alt A', 'Škoda Octavia Combi Laurin &amp; Klement'),
    carouselItem('b.jpg', 'Alt B', 'Škoda Octavia Long'),
  ]));
  const captions = rows.map((tr) => tr.children[1]);
  assert.deepEqual(captions.map((td) => td.textContent.trim()), ['Škoda Octavia Combi Laurin & Klement', 'Škoda Octavia Long']);
  captions.forEach((td) => {
    assert.equal(td.querySelectorAll('p').length, 1, 'one paragraph per description paragraph');
    assert.equal(td.querySelector('[style], span'), null, 'inline presentation styles dropped');
  });
});

test('no description (Epiq) → empty caption cell: alt / data-caption never become a caption', { skip: domSkip }, () => {
  const d = carouselDoc([
    carouselItem('a.jpg', 'Škoda Epiq Will Win You Over in 60 Seconds'),
    carouselItem('b.jpg', 'Alt B', '   '),
  ]);
  d.querySelector('img').setAttribute('data-caption', 'Colorbox caption');
  const { rows } = sliderRows(d);
  rows.forEach((tr) => assert.equal((tr.children[1]?.textContent || '').trim(), '', 'empty caption cell'));
});

// ---- sow-slider keeps the default Gallery (SKODA-819 scope: only the carousel) --
test('sow-slider → default Gallery block (not the slider variant)', { skip: domSkip }, () => {
  const d = domDoc(`
    <div class="entry-content"><div class="panel-layout">
      <div class="panel-grid"><div class="panel-grid-cell">
        <div class="so-panel widget widget_sow-slider">
          <div class="so-widget-sow-slider"><img src="s1.jpg" alt="S1"><img src="s2.jpg" alt="S2"></div>
        </div>
      </div></div>
    </div></div>`);
  const content = d.querySelector('.entry-content');
  parse(content, { document: d });
  assert.ok(content.querySelector('table[data-block="Gallery"]'), 'sow-slider → default Gallery');
  assert.equal(content.querySelector('table[data-block="Gallery (slider)"]'), null, 'slider variant is only for the carousel widget');
});

// ---- carousel routed BY CONTENT: linked items → Cards (related teasers) ------
test('link-bearing skoda-carousel-widget → Cards block with linked titles', { skip: domSkip }, () => {
  const d = domDoc(`
    <div class="entry-content"><div class="panel-layout">
      <div class="panel-grid"><div class="panel-grid-cell">
        <div class="so-panel widget widget_skoda-carousel-widget">
          <div class="so-widget-skoda-carousel-widget">
            <div class="search-results-item"><a href="/en/story-a/"><img src="a.jpg" alt="Story A"></a></div>
            <div class="search-results-item"><a href="/en/story-b/"><img src="b.jpg" alt="Story B"></a></div>
          </div>
        </div>
      </div></div>
    </div></div>`);
  const content = d.querySelector('.entry-content');
  parse(content, { document: d });
  const table = content.querySelector('table[data-block="Cards"]');
  assert.ok(table, 'Cards block emitted for a teaser carousel (majority items linked)');
  assert.equal(content.querySelector('table[data-block="Gallery"]'), null, 'no Gallery block for a teaser carousel');
  assert.ok(table.querySelector('a[href="/en/story-a/"]'), 'teaser link preserved');
  assert.match(table.textContent, /Story A/, 'title text present');
});

// ---- captioned image → figure with data-caption ----------------------------
test('skoda-captioned-image → figure carrying data-caption + alt', { skip: domSkip }, () => {
  const d = domDoc(`
    <div class="entry-content"><div class="panel-layout">
      <div class="panel-grid"><div class="panel-grid-cell">
        <div class="so-panel widget widget_skoda-captioned-image">
          <div class="so-widget-skoda-captioned-image"><img src="c.jpg" alt="Alt" data-caption="A caption"></div>
        </div>
      </div></div>
    </div></div>`);
  const content = d.querySelector('.entry-content');
  parse(content, { document: d });
  const fig = content.querySelector('figure');
  assert.ok(fig, 'figure emitted');
  assert.equal(fig.querySelector('img').getAttribute('alt'), 'Alt');
  assert.equal(fig.querySelector('figcaption').textContent, 'A caption');
});

// D2: captioned-image with a NATIVE <figure>/<figcaption> (the real source shape) —
// the caption must be lifted from the native figcaption, not only from data-caption.
test('skoda-captioned-image lifts a native figcaption', { skip: domSkip }, () => {
  const d = domDoc(`
    <div class="entry-content"><div class="panel-layout">
      <div class="panel-grid"><div class="panel-grid-cell">
        <div class="so-panel widget widget_skoda-captioned-image">
          <div class="so-widget-skoda-captioned-image">
            <figure class="figure"><img src="c.jpg" alt="Alt"><figcaption>Native caption text</figcaption></figure>
          </div>
        </div>
      </div></div>
    </div></div>`);
  const content = d.querySelector('.entry-content');
  parse(content, { document: d });
  const fig = content.querySelector('figure');
  assert.ok(fig, 'figure emitted');
  assert.equal(fig.querySelector('figcaption').textContent, 'Native caption text');
});

// D2: skoda-image-box is an infobox/definition callout — its TEXT must survive (it was
// dropped when routed through the image path, which requires an <img> that may be absent).
test('skoda-image-box (infobox, no image) keeps its definition text', { skip: domSkip }, () => {
  const d = domDoc(`
    <div class="entry-content"><div class="panel-layout">
      <div class="panel-grid"><div class="panel-grid-cell">
        <div class="so-panel widget widget_skoda-image-box">
          <div class="so-widget-skoda-image-box">
            <abbr class="infobox"><abbr class="infobox-content"><p><strong>Up-cycling</strong> - transformation of waste into value.</p></abbr></abbr>
          </div>
        </div>
      </div></div>
    </div></div>`);
  const content = d.querySelector('.entry-content');
  parse(content, { document: d });
  assert.match(content.textContent, /Up-cycling/, 'infobox definition text preserved');
  assert.match(content.textContent, /transformation of waste/, 'infobox body preserved');
});

// D2: skoda-image-box WITH an image keeps both the image and the text.
test('skoda-image-box with an image keeps both image and text', { skip: domSkip }, () => {
  const d = domDoc(`
    <div class="entry-content"><div class="panel-layout">
      <div class="panel-grid"><div class="panel-grid-cell">
        <div class="so-panel widget widget_skoda-image-box">
          <div class="so-widget-skoda-image-box">
            <abbr class="infobox"><abbr class="infobox-content"><img src="d.jpg" alt="D"><p>Recharging - four charging options.</p></abbr></abbr>
          </div>
        </div>
      </div></div>
    </div></div>`);
  const content = d.querySelector('.entry-content');
  parse(content, { document: d });
  assert.ok(content.querySelector('img[src="d.jpg"]'), 'image kept');
  assert.match(content.textContent, /Recharging/, 'text kept');
});

// D1 (SKODA-815): ys-milestones is a dated timeline — its entries + images must
// survive (previously it was in the DROPPED set → silent content loss).
test('ys-milestones flattens each entry to an h3 + image (not dropped)', { skip: domSkip }, () => {
  const d = domDoc(`
    <div class="entry-content"><div class="panel-layout">
      <div class="panel-grid"><div class="panel-grid-cell">
        <div class="so-panel widget widget_ys-milestones">
          <div class="so-widget-ys-milestones"><section class="milestones"><ul>
            <li><div class="year">1905</div><div class="title">Voiturette A</div><img src="y1905.jpg"></li>
            <li><div class="year">1925</div><div class="title">ŠKODA 110</div><img src="y1925.jpg"></li>
            <li><div class="year">2017</div><div class="title">Octavia RS</div><img src="y2017.jpg"></li>
          </ul></section></div>
        </div>
      </div></div>
    </div></div>`);
  const content = d.querySelector('.entry-content');
  parse(content, { document: d });
  const h3 = [...content.querySelectorAll('h3')].map((h) => h.textContent);
  assert.equal(h3.length, 3, 'one h3 per milestone');
  assert.match(h3[0], /1905/); assert.match(h3[0], /Voiturette A/);
  assert.match(h3[2], /2017/);
  assert.equal(content.querySelectorAll('img').length, 3, 'each milestone image kept');
  assert.equal(content.querySelectorAll('.milestones, section').length, 0, 'timeline scaffolding stripped');
});

// ---- deferred widgets skipped + never crash -------------------------------
test('deferred interactive widgets are skipped, no crash, no output', { skip: domSkip }, () => {
  const d = domDoc(`
    <div class="entry-content"><div class="panel-layout">
      <div class="panel-grid"><div class="panel-grid-cell">
        <div class="so-panel widget widget_k2tools-charge-map"><div class="so-widget-k2tools-charge-map">MAP</div></div>
      </div></div>
    </div></div>`);
  const content = d.querySelector('.entry-content');
  assert.doesNotThrow(() => parse(content, { document: d }));
  assert.equal(content.querySelectorAll('.panel-grid').length, 0);
  assert.equal(content.textContent.trim(), '');
});

// ---- multi-column grid → Columns block ------------------------------------
test('a panel-grid with >1 non-empty cell → Columns block', { skip: domSkip }, () => {
  const d = domDoc(`
    <div class="entry-content"><div class="panel-layout">
      <div class="panel-grid">
        <div class="panel-grid-cell"><div class="so-panel widget widget_sow-editor"><div class="siteorigin-widget-tinymce textwidget"><p>Left</p></div></div></div>
        <div class="panel-grid-cell"><div class="so-panel widget widget_sow-editor"><div class="siteorigin-widget-tinymce textwidget"><p>Right</p></div></div></div>
      </div>
    </div></div>`);
  const content = d.querySelector('.entry-content');
  parse(content, { document: d });
  assert.ok(content.querySelector('table[data-block="Columns"]'), 'Columns block emitted for a genuine 2-cell row');
});

// ---- large-tree robustness (208-widget / 293-grid census outlier) ---------
test('large tree (293 grids) flattens without failure', { skip: domSkip }, () => {
  const d = domDoc('<div class="entry-content"><div class="panel-layout"></div></div>');
  const layout = d.querySelector('.panel-layout');
  for (let i = 0; i < 293; i += 1) {
    const g = d.createElement('div'); g.className = 'panel-grid';
    const cell = d.createElement('div'); cell.className = 'panel-grid-cell';
    const p = d.createElement('div'); p.className = 'so-panel widget widget_sow-editor';
    const t = d.createElement('div'); t.className = 'siteorigin-widget-tinymce textwidget';
    t.innerHTML = `<p>para ${i}</p>`;
    p.appendChild(t); cell.appendChild(p); g.appendChild(cell); layout.appendChild(g);
  }
  const content = d.querySelector('.entry-content');
  assert.doesNotThrow(() => parse(content, { document: d }));
  assert.equal(content.querySelectorAll('.panel-grid, .so-panel').length, 0);
  assert.equal(content.querySelectorAll('p').length, 293);
});

// ---- real story samples: 0 builder markup left -----------------------------
['story.html', 'story-live.html'].forEach((sample) => {
  test(`real sample ${sample}: flattens with 0 builder markup remaining`, { skip: domSkip }, () => {
    let html;
    try {
      html = readFileSync(new URL(`../../../.migration/work/samples/${sample}`, import.meta.url), 'utf8');
    } catch {
      return; // samples are working artifacts, not always present
    }
    const d = new JSDOM(html).window.document;
    const content = d.querySelector('.columns > .content') || d.querySelector('article .content') || d.querySelector('.entry-content');
    assert.ok(content, 'content column found');
    parse(content, { document: d });
    assert.equal(content.querySelectorAll('.panel-grid, .so-panel, [class*="so-widget"], .panel-layout').length, 0);
  });
});

// ---- highlight rows (SKODA-824, contract highlight v2) --------------------------
// Live shape (Epiq, Kylaq, charging … 2026-09-28): the row colour is only in the
// SiteOrigin head CSS, keyed by the grid id; the row itself carries no inline style.
const { markHighlights } = await import('./story-flatten.js');

const editorRow = (id, html, rowStyle = '') => `<div id="${id}" class="panel-grid panel-has-style">
  <div class="panel-row-style panel-row-style-for-${id.slice(3)}"${rowStyle ? ` style="${rowStyle}"` : ''}>
    <div class="panel-grid-cell"><div class="so-panel widget widget_sow-editor">
      <div class="so-widget-sow-editor"><div class="siteorigin-widget-tinymce textwidget">${html}</div></div>
    </div></div>
  </div></div>`;
const storyDoc = (css, rows, after = '') => domDoc(`<html><head><style id="siteorigin-panels-layouts-head">${css}</style></head>
  <body><div class="columns"><div class="content"><div class="panel-layout">${rows.join('')}</div>${after}</div></div></body></html>`);
/** The flattened body as [kind, text] pairs: hr, a Section Metadata style, or element text. */
function flow(d) {
  const content = d.querySelector('.content');
  parse(content, { document: d });
  return [...content.children].map((n) => {
    if (n.tagName === 'HR') return ['hr'];
    if (n.dataset.block === 'Section Metadata') return ['meta', n.querySelector('tr > td:last-child').textContent];
    if (n.tagName === 'TABLE') return ['block', n.dataset.block];
    return [n.tagName.toLowerCase(), n.textContent.trim()];
  });
}

test('markHighlights: head-CSS row colours (incl. grouped selectors) and inline styles', { skip: domSkip }, () => {
  const d = storyDoc(
    '#pl-1 .so-panel { margin-bottom:0px } #pg-1-1> .panel-row-style { background-color:#0e3a2f }'
      + ' #pg-1-2> .panel-row-style, #pg-1-4 > .panel-row-style { background-color: rgb(243, 243, 243) }'
      + ' #pg-1-3> .panel-row-style { background-color:#ffffff }',
    ['pg-1-0', 'pg-1-1', 'pg-1-2', 'pg-1-3', 'pg-1-4'].map((id) => editorRow(id, `<p>${id}</p>`))
      .concat(editorRow('pg-1-5', '<p>inline</p>', 'background-color: #0e3a2f; padding: 0 15px')),
  );
  assert.equal(markHighlights(d), 4);
  assert.deepEqual(
    [...d.querySelectorAll('.panel-grid')].map((g) => g.getAttribute('data-highlight')),
    [null, 'dark', 'grey', null, 'grey', 'dark'],
    'white is not a panel',
  );
});

test('a highlight row becomes its own body-column, highlight-dark section; the body resumes after it', { skip: domSkip }, () => {
  const d = storyDoc('#pg-2-1> .panel-row-style { background-color:#0e3a2f }', [
    editorRow('pg-2-0', '<p>Intro</p>'),
    editorRow('pg-2-1', '<h3>What Else Will Epiq Win You Over With?</h3><p>Panel</p>'),
    editorRow('pg-2-2', '<p>Outro</p>'),
  ]);
  markHighlights(d);
  assert.deepEqual(flow(d), [
    ['p', 'Intro'],
    ['hr'], ['h3', 'What Else Will Epiq Win You Over With?'], ['p', 'Panel'], ['meta', 'body-column, highlight-dark'],
    ['hr'], ['meta', 'body-column'], ['p', 'Outro'],
  ]);
});

test('consecutive highlight rows are one section each; a trailing row leaves no empty body', { skip: domSkip }, () => {
  const d = storyDoc('#pg-3-1> .panel-row-style, #pg-3-2> .panel-row-style { background-color:#0e3a2f }', [
    editorRow('pg-3-0', '<p>Intro</p>'), editorRow('pg-3-1', '<p>One</p>'), editorRow('pg-3-2', '<p>Two</p>'),
  ]);
  markHighlights(d);
  assert.deepEqual(flow(d), [
    ['p', 'Intro'],
    ['hr'], ['p', 'One'], ['meta', 'body-column, highlight-dark'],
    ['hr'], ['p', 'Two'], ['meta', 'body-column, highlight-dark'],
  ]);
  // …but content after the builder tree still gets its body section back
  const tail = storyDoc('#pg-4-1> .panel-row-style { background-color:#0e3a2f }', [
    editorRow('pg-4-0', '<p>Intro</p>'), editorRow('pg-4-1', '<p>Panel</p>'),
  ], '<p>After the builder</p>');
  markHighlights(tail);
  assert.deepEqual(flow(tail).slice(-4), [['meta', 'body-column, highlight-dark'], ['hr'], ['meta', 'body-column'], ['p', 'After the builder']]);
});

test('nested blocks stay inside the highlight section (2-cell row → Columns, carousel → Gallery (slider))', { skip: domSkip }, () => {
  const twoCells = `<div id="pg-5-1" class="panel-grid panel-has-style"><div class="panel-row-style">
    <div class="panel-grid-cell"><div class="so-panel widget widget_sow-editor"><div class="so-widget-sow-editor">
      <div class="siteorigin-widget-tinymce textwidget"><h3>Five questions for Michal Zajíc</h3></div></div></div></div>
    <div class="panel-grid-cell"><div class="so-panel widget widget_sow-image"><div class="so-widget-sow-image"><img src="zajic.jpg" alt="Michal Zajíc"></div></div></div>
  </div></div>`;
  const carousel = `<div id="pg-5-2" class="panel-grid panel-has-style"><div class="panel-row-style"><div class="panel-grid-cell">
    <div class="so-panel widget widget_skoda-carousel-widget"><div class="so-widget-skoda-carousel-widget">
      ${carouselItem('a.jpg', 'A')}${carouselItem('b.jpg', 'B')}</div></div></div></div></div>`;
  const d = storyDoc('#pg-5-1> .panel-row-style, #pg-5-2> .panel-row-style { background-color:#0e3a2f }', [
    editorRow('pg-5-0', '<p>Intro</p>'), twoCells, carousel,
  ]);
  markHighlights(d);
  assert.deepEqual(flow(d), [
    ['p', 'Intro'],
    ['hr'], ['block', 'Columns'], ['meta', 'body-column, highlight-dark'],
    ['hr'], ['block', 'Gallery (slider)'], ['meta', 'body-column, highlight-dark'],
  ]);
});

// PO 2026-10-13: the panel inset as the source. Live shape: the cruise-control layout gives its
// text widgets `margin:0px 0px 0px 20px` (30 / 10px in); the theme default is `0 15px`, and
// `15px` all round up to 780px.
const panelRow = (id, widgets, cells = 1) => `<div id="${id}" class="panel-grid panel-has-style"><div class="panel-row-style">
  ${Array.from({ length: cells }, (_, c) => `<div class="panel-grid-cell">${widgets.map(([kind, n, html]) => `<div id="panel-${id.slice(3)}-${c}-${n}" class="so-panel widget widget_${kind}">
    <div class="panel-widget-style"><div class="so-widget-${kind}"><div class="siteorigin-widget-tinymce textwidget">${html}</div></div></div></div>`).join('')}</div>`).join('')}
  </div></div>`;
const geometryRows = (table) => [...table.querySelectorAll('tr')].slice(2).map((tr) => [...tr.children].map((td) => td.textContent));

test('a panel with its own layout geometry carries it as Section Metadata rows; the theme default carries none', { skip: domSkip }, () => {
  const css = '#pg-7-1> .panel-row-style, #pg-7-2> .panel-row-style, #pg-7-3> .panel-row-style, #pg-7-4> .panel-row-style, #pg-7-5> .panel-row-style { background-color:#0e3a2f }'
    + ' #pl-7 #panel-7-1-0-0 , #pl-7 #panel-7-1-0-1 { margin:0px 0px 0px 20px }'
    + ' #pl-7 #panel-7-2-0-0 { margin:0px 15px 0px 15px }'
    + ' #pg-7-3> .panel-row-style { padding:0px 15px 0px 15px } #pl-7 #panel-7-3-0-0 { margin:15px 0px 15px 0px }'
    + ' #pl-7 #panel-7-4-0-0 { margin:0px 15px 0px 15px } #pl-7 #panel-7-4-0-1 { margin:0px 15px 0px 15px }'
    + ' #pl-7 #panel-7-5-0-0 { margin:0px 0px 0px 15px }'
    + ' @media (max-width:780px){ #pl-7 #panel-7-2-0-0 { margin:15px 15px 15px 15px } #pg-7-3> .panel-row-style { padding:15px } #pl-7 #panel-7-3-0-0 { margin:15px 15px 15px 15px } #pl-7 #panel-7-4-0-0 { margin:15px 15px 15px 15px } #pl-7 #panel-7-4-0-1 { margin:15px 15px 15px 15px } }';
  const d = storyDoc(css, [
    editorRow('pg-7-0', '<p>Intro</p>'),
    panelRow('pg-7-1', [['sow-editor', 0, '<h3>Cruise control</h3>'], ['sow-editor', 1, '<p>Stop and Go</p>']]),
    panelRow('pg-7-2', [['sow-editor', 0, '<p>Default</p>']]),
    panelRow('pg-7-3', [['sow-editor', 0, '<p>Padded</p>']]),
    panelRow('pg-7-4', [['sow-editor', 0, '<p>With a gallery</p>'], ['skoda-carousel-widget', 1, carouselItem('a.jpg', 'A') + carouselItem('b.jpg', 'B')]]),
    panelRow('pg-7-5', [['sow-editor', 0, '<p>Two cells</p>']], 2),
  ]);
  markHighlights(d);
  const marked = (id) => [...d.querySelector(`#${id}`).attributes].filter((a) => a.name.startsWith('data-highlight-')).length;
  assert.deepEqual(['pg-7-1', 'pg-7-2', 'pg-7-3', 'pg-7-4', 'pg-7-5'].map(marked), [2, 0, 4, 2, 0]);
  const content = d.querySelector('.content');
  parse(content, { document: d });
  const metas = [...content.children].filter((n) => n.dataset.block === 'Section Metadata' && /highlight/.test(n.textContent));
  assert.equal(metas.length, 5);
  assert.deepEqual(metas.map(geometryRows), [
    [['highlight-margin', '0px 0px 0px 20px'], ['highlight-margin-mobile', '0px 0px 0px 20px']],
    [],
    [['highlight-padding', '0px 15px 0px 15px'], ['highlight-padding-mobile', '15px 15px 15px 15px'],
      ['highlight-margin', '15px 0px 15px 0px'], ['highlight-margin-mobile', '15px 15px 15px 15px']],
    [['highlight-gallery-margin', '0px 15px 0px 15px'], ['highlight-gallery-margin-mobile', '15px 15px 15px 15px']],
    [],
  ], 'cruise (no mobile rule: the desktop one), default, row padding, a gallery with a margin, a 2-cell row (per-cell margins: none)');
});

test('a panel whose text widget has no margin at all is 0, desktop and mobile', { skip: domSkip }, () => {
  const d = storyDoc('#pg-8-1> .panel-row-style { background-color:#0e3a2f }', [panelRow('pg-8-1', [['sow-editor', 0, '<p>Camouflage</p>']])]);
  markHighlights(d);
  assert.equal(d.querySelector('#pg-8-1').getAttribute('data-highlight-margin'), '0px 0px 0px 0px');
  assert.equal(d.querySelector('#pg-8-1').getAttribute('data-highlight-margin-mobile'), '0px 0px 0px 0px');
});

test('without markHighlights (no preprocess) rows still linearize into the one body section', { skip: domSkip }, () => {
  const d = storyDoc('#pg-6-1> .panel-row-style { background-color:#0e3a2f }', [
    editorRow('pg-6-0', '<p>Intro</p>'), editorRow('pg-6-1', '<p>Panel</p>'),
  ]);
  assert.deepEqual(flow(d), [['p', 'Intro'], ['p', 'Panel']]);
});

test('a spacer-only row after the last highlight does not resume an empty body (Kylaq)', { skip: domSkip }, () => {
  const spacer = `<div id="pg-7-2" class="panel-grid panel-no-style"><div class="panel-grid-cell">
    <div class="so-panel widget widget_skoda-offset"><div class="so-widget-skoda-offset"><div style="padding-top:1em"></div></div></div>
  </div></div>`;
  const d = storyDoc('#pg-7-1> .panel-row-style { background-color:#0e3a2f }', [
    editorRow('pg-7-0', '<p>Intro</p>'), editorRow('pg-7-1', '<p>Škoda Kylaq</p>'), spacer,
  ]);
  markHighlights(d);
  assert.deepEqual(flow(d), [['p', 'Intro'], ['hr'], ['p', 'Škoda Kylaq'], ['meta', 'body-column, highlight-dark']]);
});

// The full story pipeline around the parser: skoda-model-sections opens the body section
// (break + `body-column` Section Metadata), then import-story-detail runs dropEmptySections.
const { dropEmptySections } = await import('./story-flatten.js');
const { default: sectionsTransformer } = await import('../transformers/skoda-model-sections.js');
const SECTIONS = {
  template: {
    sections: [
      { id: 'section-1', selector: ['div.hero'], style: null },
      { id: 'section-2', selector: ['.columns > .content'], style: 'body-column' },
    ],
  },
};
function pipeline(css, rows, before = '') {
  const d = domDoc(`<html><head><style>${css}</style></head><body><div class="hero"><h1>Hero</h1></div>
    <div class="columns"><div class="content">${before}<div class="panel-layout">${rows.join('')}</div></div></div></body></html>`);
  markHighlights(d);
  globalThis.document = d; // skoda-model-sections creates its breaks on the global document
  try {
    sectionsTransformer('beforeTransform', d.body, SECTIONS);
    parse(d.querySelector('.content'), { document: d });
    sectionsTransformer('afterTransform', d.body, SECTIONS);
  } finally {
    delete globalThis.document;
  }
  const dropped = dropEmptySections(d.body);
  const items = [...d.body.querySelectorAll('hr, table, h1, h3, p')].filter((n) => !n.parentElement.closest('table'));
  return {
    dropped,
    flow: items.map((n) => {
      if (n.tagName === 'HR') return ['hr'];
      if (n.dataset.block === 'Section Metadata') return ['meta', n.querySelector('tr > td:last-child').textContent];
      return [n.tagName.toLowerCase(), n.textContent.trim()];
    }),
  };
}

test('dropEmptySections: a section left with only a Spacer goes, with its Spacer; text keeps its own', { skip: domSkip }, () => {
  const d = domDoc('<html><body></body></html>');
  const meta = (style) => createTable([['Section Metadata'], ['style', style]], d);
  const p = (text) => Object.assign(d.createElement('p'), { textContent: text });
  // panel | (its gallery moved to the Media Box) a lone Spacer | panel | text with a Spacer line
  d.body.append(
    d.createElement('hr'), p('Panel one'), meta('body-column, highlight-grey'),
    d.createElement('hr'), createTable([['Spacer'], ['24px']], d), meta('body-column'),
    d.createElement('hr'), p('Panel two'), meta('body-column, highlight-grey'),
    d.createElement('hr'), p('Before'), createTable([['Spacer (line)'], ['44px']], d), p('After'), meta('body-column'),
  );
  assert.equal(dropEmptySections(d.body), 1);
  assert.equal(d.body.querySelectorAll('hr').length, 3);
  assert.deepEqual([...d.body.querySelectorAll('table')].map((t) => t.dataset.block), [
    'Section Metadata', 'Section Metadata', 'Spacer (line)', 'Section Metadata',
  ]);
});

test('a leading highlight row leaves no empty body section before the panel', { skip: domSkip }, () => {
  const { dropped, flow: out } = pipeline('#pg-8-0> .panel-row-style { background-color:#0e3a2f }', [
    editorRow('pg-8-0', '<p>Panel</p>'), editorRow('pg-8-1', '<p>Outro</p>'),
  ]);
  assert.equal(dropped, 1);
  assert.deepEqual(out, [
    ['h1', 'Hero'],
    ['hr'], ['p', 'Panel'], ['meta', 'body-column, highlight-dark'],
    ['hr'], ['meta', 'body-column'], ['p', 'Outro'],
  ]);
});

test('a leading highlight row keeps the body section when body content precedes it', { skip: domSkip }, () => {
  const { dropped, flow: out } = pipeline('#pg-9-0> .panel-row-style { background-color:#0e3a2f }', [
    editorRow('pg-9-0', '<p>Panel</p>'),
  ], '<p>Lead</p>');
  assert.equal(dropped, 0);
  assert.deepEqual(out, [
    ['h1', 'Hero'],
    ['hr'], ['meta', 'body-column'], ['p', 'Lead'],
    ['hr'], ['p', 'Panel'], ['meta', 'body-column, highlight-dark'],
  ]);
});

test('a leading highlight row after a body row keeps the body section intact', { skip: domSkip }, () => {
  const { dropped, flow: out } = pipeline('#pg-10-1> .panel-row-style { background-color:#0e3a2f }', [
    editorRow('pg-10-0', '<p>Intro</p>'), editorRow('pg-10-1', '<p>Panel</p>'),
  ]);
  assert.equal(dropped, 0);
  assert.deepEqual(out.slice(1, 4), [['hr'], ['meta', 'body-column'], ['p', 'Intro']]);
});

test('a widget inside a .panel-cell-style wrapper is not dropped (charging portrait cell)', { skip: domSkip }, () => {
  const d = domDoc(`<div class="entry-content"><div class="panel-layout"><div class="panel-grid"><div class="panel-row-style">
    <div class="panel-grid-cell"><div class="so-panel widget widget_sow-editor"><div class="so-widget-sow-editor">
      <div class="siteorigin-widget-tinymce textwidget"><h3>Five questions for Michal Zajíc</h3></div></div></div></div>
    <div class="panel-grid-cell"><div class="panel-cell-style panel-cell-style-for-447920-1-1">
      <div class="so-panel widget widget_sow-image"><div class="so-widget-sow-image"><img src="portrait.png" alt=""></div></div>
    </div></div>
  </div></div></div></div>`);
  const content = d.querySelector('.entry-content');
  parse(content, { document: d });
  const columns = content.querySelector('table[data-block="Columns"]');
  assert.ok(columns, 'two non-empty cells → Columns');
  assert.ok(columns.querySelector('img[src="portrait.png"]'), 'portrait kept');
});

// ---- unequal 2-cell rows (SKODA-225, contract columns-split v2) ---------------
const { markCellWidths } = await import('./story-flatten.js');
const { splitVariant, portraitVariant } = __test;

// A SiteOrigin row with two cells sized in the head CSS, as on the live stories.
function splitStory({ css, portrait }) {
  return domDoc(`<html><head><style>${css}</style></head><body><div class="entry-content"><div class="panel-layout">
    <div id="pg-1-2" class="panel-grid panel-no-style">
      <div id="pgc-1-2-0" class="panel-grid-cell"><div class="so-panel widget widget_sow-editor"><div class="so-widget-sow-editor">
        <div class="siteorigin-widget-tinymce textwidget"><p>Quote text.</p></div></div></div></div>
      <div id="pgc-1-2-1" class="panel-grid-cell">
        <div class="so-panel widget widget_skoda-offset"><div class="so-widget-skoda-offset"><div style="padding-top:1em;"></div></div></div>
        <div class="so-panel widget widget_sow-editor"><div class="so-widget-sow-editor"><div class="siteorigin-widget-tinymce textwidget">
          ${portrait}</div></div></div></div>
    </div></div></div></body></html>`);
}
const PORTRAIT_235 = '<p style="text-align: center;"><img class="alignnone wp-image-413573 aligncenter" src="kelly.png" width="235" height="235"><strong>Meredith Kelly</strong><span>Global Head of Marketing</span></p>';

test('markCellWidths: reads plain and calc() % widths from the head CSS', { skip: domSkip }, () => {
  const d = splitStory({ css: '#pgc-1-2-0{ width:61.8% } #pgc-1-2-1 { width:calc(38.2% - ( 0 * 30px ) ) }', portrait: PORTRAIT_235 });
  assert.equal(markCellWidths(d), 2);
  assert.equal(d.getElementById('pgc-1-2-0').getAttribute('data-cell-width'), '61.8');
  assert.equal(d.getElementById('pgc-1-2-1').getAttribute('data-cell-width'), '38.2');
});

test('splitVariant: the first cell share, rounded; equal, unknown or 3 cells give none', { skip: domSkip }, () => {
  const cell = (w) => { const el = domDoc('<div></div>').querySelector('div'); if (w) el.setAttribute('data-cell-width', String(w)); return el; };
  assert.equal(splitVariant([cell(61.8), cell(38.2)]), 'split-62');
  assert.equal(splitVariant([cell(75), cell(25)]), 'split-75');
  assert.equal(splitVariant([cell(50), cell(50)]), null, 'equal cells stay plain Columns');
  assert.equal(splitVariant([cell(50.5), cell(49.5)]), null, 'nearly equal too');
  assert.equal(splitVariant([cell(61.8), cell()]), null, 'unknown width');
  assert.equal(splitVariant([cell(40), cell(30), cell(30)]), null, 'three cells');
});

test('portraitVariant: an authored width smaller than the file; a file-size image gives none', { skip: domSkip }, () => {
  const cells = (html) => [domDoc(`<div>${html}</div>`).querySelector('div')];
  assert.equal(portraitVariant(cells('<img src="a.png" width="235" height="235">')), 'portrait-235');
  assert.equal(portraitVariant(cells('<img src="a.png" width="235" srcset="a.png 500w, a-300.png 300w">')), 'portrait-235');
  assert.equal(portraitVariant(cells('<img src="b.png" width="1366" srcset="b.png 1366w, b-256.png 256w">')), null, 'sow-image at file size fills');
  assert.equal(portraitVariant(cells('<img src="c.png">')), null, 'no width');
  assert.equal(portraitVariant(cells('<img src="a.png" width="235"><img src="d.png" width="100">')), null, 'two images');
});

test('parse: an unequal row with an authored portrait → Columns (split-62, portrait-235)', { skip: domSkip }, () => {
  const d = splitStory({ css: '#pgc-1-2-0{ width:61.8% } #pgc-1-2-1{ width:38.2% }', portrait: PORTRAIT_235 });
  markCellWidths(d);
  const content = d.querySelector('.entry-content');
  parse(content, { document: d });
  const table = content.querySelector('table');
  assert.equal(table.dataset.block, 'Columns (split-62, portrait-235, offset-0-24)', 'the portrait cell\'s leading 1em spacer as offset-0-24');
  const cells = table.querySelectorAll('tr:nth-child(2) > td');
  assert.equal(cells.length, 2, 'normal columns row, one cell per source cell');
  assert.ok(cells[1].querySelector('img[src="kelly.png"]'), 'portrait kept');
  assert.match(cells[1].textContent, /Meredith Kelly/);
});

test('parse: an unequal row whose image fills its cell → Columns (split-75), no portrait token', { skip: domSkip }, () => {
  const d = splitStory({
    css: '#pgc-1-2-0{ width:75% } #pgc-1-2-1{ width:25% }',
    portrait: '<p><img src="charging.png" width="1366" height="2048" srcset="charging.png 1366w, charging-256.png 256w"></p>',
  });
  markCellWidths(d);
  const content = d.querySelector('.entry-content');
  parse(content, { document: d });
  assert.equal(content.querySelector('table').dataset.block, 'Columns (split-75, offset-0-24)');
});

test('parse: equal or unmeasured rows stay plain Columns', { skip: domSkip }, () => {
  const equal = splitStory({ css: '#pgc-1-2-0{ width:50% } #pgc-1-2-1{ width:50% }', portrait: PORTRAIT_235 });
  markCellWidths(equal);
  parse(equal.querySelector('.entry-content'), { document: equal });
  assert.equal(equal.querySelector('table').dataset.block, 'Columns (offset-0-24)', 'no split / centred token; the spacer offset stays');
  const none = splitStory({ css: '', portrait: PORTRAIT_235 });
  parse(none.querySelector('.entry-content'), { document: none });
  assert.equal(none.querySelector('table').dataset.block, 'Columns (offset-0-24)', 'without markCellWidths');
});

// ---- centred images (the source's aligncenter: Columns (centered), centered-images) ----------
const { markCentredImages, applyCentredImages } = await import('./story-flatten.js');
const { centredVariants } = __test;

// the Miss Peaches rider profiles: an equal row, each cell a caption figure + an Instagram icon
const profileCell = (id, portrait, icon) => `<div id="${id}" class="panel-grid-cell">
  <div class="so-panel widget widget_sow-editor"><div class="so-widget-sow-editor"><div class="siteorigin-widget-tinymce textwidget">
    <figure style="width: ${portrait.width}px" class="wp-caption aligncenter"><img class="size-medium" src="${portrait.src}" alt="" width="${portrait.width}" height="${portrait.width}" srcset="${portrait.src} 384w, small.png 150w"><figcaption class="wp-caption-text"><strong>Name</strong></figcaption></figure>
    <p><img class="aligncenter" src="instagram.png" alt="Instagram-icon" width="${icon}" height="${icon}" srcset="instagram.png 150w"></p>
    <p style="text-align: center;"><strong>instagram:</strong></p></div></div></div></div>`;
function profileStory({ css = '#pgc-1-4-0 , #pgc-1-4-1 { width:50%;width:calc(50% - ( 0.5 * 30px ) ) }', portrait = 384, body = '' } = {}) {
  return domDoc(`<html><head><style>${css}</style></head><body><div class="entry-content"><div class="panel-layout">
    <div id="pg-1-3" class="panel-grid panel-no-style"><div id="pgc-1-3-0" class="panel-grid-cell"><div class="so-panel widget widget_sow-editor"><div class="so-widget-sow-editor"><div class="siteorigin-widget-tinymce textwidget">
      <p>Body text.</p>${body}</div></div></div></div></div>
    <div id="pg-1-4" class="panel-grid panel-has-style"><div class="panel-row-style">
      ${profileCell('pgc-1-4-0', { src: 'laura.png', width: portrait }, 116)}${profileCell('pgc-1-4-1', { src: 'nina.png', width: portrait }, 122)}
    </div></div></div></div></body></html>`);
}
const importStory = (d) => {
  markCellWidths(d);
  markCentredImages(d);
  const main = d.body;
  const content = d.querySelector('.entry-content');
  content.before(createTable([['Section Metadata'], ['style', 'body-column']], d));
  parse(content, { document: d });
  applyCentredImages(main);
  return main;
};
const bodyStyle = (main) => [...main.querySelectorAll('table')]
  .filter((t) => t.querySelector('tr').textContent.trim() === 'Section Metadata')
  .map((t) => t.querySelectorAll('tr')[1].children[1].textContent);

test('markCentredImages: aligncenter, a centred caption figure or paragraph; not a plain image', { skip: domSkip }, () => {
  const d = domDoc(`<div class="textwidget"><p><img id="a" class="aligncenter" src="a.png"></p>
    <figure class="wp-caption aligncenter"><img id="b" src="b.png"></figure><p style="text-align: center;"><img id="c" src="c.png"></p>
    <p><img id="d" class="alignnone" src="d.png"></p><p style="text-align: left;"><img id="e" src="e.png"></p>
    <div class="search-results search-results-gallery"><img id="g" class="media-cart-image" src="g.jpg"></div><div class="sb-gallery"><img id="h" src="h.jpg"></div></div>
    <p><img id="f" class="aligncenter" src="f.png"></p>`);
  assert.equal(markCentredImages(d), 3);
  const marks = [...d.querySelectorAll('img')].map((img) => `${img.id}:${img.getAttribute('data-skoda-align')}`);
  assert.deepEqual(marks, ['a:center', 'b:center', 'c:center', 'd:left', 'e:left', 'g:null', 'h:null', 'f:null'], 'only the editor text images');
});

test('centredVariants: an equal row of centred images; the shared first-image width as portrait-NNN', { skip: domSkip }, () => {
  const cellsOfStory = (d) => [...d.querySelectorAll('#pg-1-4 .panel-grid-cell')];
  const d = profileStory();
  markCellWidths(d); markCentredImages(d);
  assert.deepEqual(centredVariants(cellsOfStory(d)), ['centered', 'captioned'], '384px portraits are their file size');
  const small = profileStory({ portrait: 300 });
  markCellWidths(small); markCentredImages(small);
  assert.deepEqual(centredVariants(cellsOfStory(small)), ['centered', 'portrait-300', 'captioned'], '300px of a 384px file');
  const plain = profileStory();
  plain.querySelectorAll('figcaption').forEach((fc) => fc.remove());
  markCellWidths(plain); markCentredImages(plain);
  assert.deepEqual(centredVariants(cellsOfStory(plain)), ['centered'], 'a portrait without a caption');
  const unequal = profileStory({ css: '#pgc-1-4-0 { width:61.8% } #pgc-1-4-1 { width:38.2% }' });
  markCellWidths(unequal); markCentredImages(unequal);
  assert.deepEqual(centredVariants(cellsOfStory(unequal)), [], 'an unequal row is split-NN');
  const left = profileStory();
  left.querySelector('img.aligncenter').classList.remove('aligncenter');
  markCellWidths(left); markCentredImages(left);
  assert.deepEqual(centredVariants(cellsOfStory(left)), [], 'one left image → default Columns');
  const unmeasured = profileStory({ css: '' });
  markCentredImages(unmeasured);
  assert.deepEqual(centredVariants(cellsOfStory(unmeasured)), [], 'unknown widths');
});

test('import: the profile row → Columns (centered, …); the marks never reach the output', { skip: domSkip }, () => {
  const main = importStory(profileStory({ portrait: 300 }));
  const blocks = [...main.querySelectorAll('table')].map((t) => t.dataset.block);
  assert.deepEqual(blocks, ['Section Metadata', 'Columns (centered, portrait-300, captioned)']);
  assert.equal(main.querySelector('[data-skoda-align]'), null);
  assert.equal(main.ownerDocument.documentElement.hasAttribute('data-skoda-centred-images'), false);
});

test('import: the body centres images only when every narrower one is centred', { skip: domSkip }, () => {
  const centred = importStory(profileStory({ body: '<p><img class="aligncenter" src="p.jpg" width="800" height="500"></p><p><img class="alignnone" src="w.jpg" width="1400" height="126"></p>' }));
  assert.deepEqual(bodyStyle(centred), ['body-column, centered-images'], 'the 1400px image fills the column either way');
  const mixed = importStory(profileStory({ body: '<p><img class="aligncenter" src="p.jpg" width="800"></p><p><img src="q.jpg" width="600"></p>' }));
  assert.deepEqual(bodyStyle(mixed), ['body-column'], 'a left image keeps the default');
  const none = importStory(profileStory());
  assert.deepEqual(bodyStyle(none), ['body-column'], 'images in a Columns row do not count');
  const media = importStory(profileStory({ body: '<p><img class="aligncenter" src="p.jpg" width="800"></p><div class="search-results search-results-gallery"><img src="m.jpg" width="768"></div>' }));
  assert.deepEqual(bodyStyle(media), ['body-column, centered-images'], 'nor does a gallery shortcode in the editor (the media box)');
});

test('applyCentredImages: every body section, once; other sections untouched', { skip: domSkip }, () => {
  const d = domDoc('<body></body>');
  const meta = (style) => createTable([['Section Metadata'], ['style', style]], d);
  d.body.append(meta('body-column'), meta('body-column, highlight-dark'), meta('story-intro'), meta('body-column, centered-images'));
  d.documentElement.setAttribute('data-skoda-centred-images', '');
  assert.equal(applyCentredImages(d.body), 2);
  assert.deepEqual(bodyStyle(d.body), ['body-column, centered-images', 'body-column, highlight-dark, centered-images', 'story-intro', 'body-column, centered-images']);
  assert.equal(applyCentredImages(d.body), 0, 'the flag is cleared');
});

// --- bold headings (#296 review: Slavia's "Technical improvements" is not bold on origin) ---------
const { markBoldHeadings, restoreBoldHeadings, isBoldHeading } = await import('./story-flatten.js');

test('bold headings: only wholly bold source headings get their <strong> back', { skip: domSkip }, () => {
  const d = domDoc(`<article><div class="entry-content">
    <h3><strong>Škoda Kylaq sets out on its journey from its home country of India</strong></h3>
    <h3>Technical improvements</h3>
    <h3><b>During the travels</b>, <strong>Kylaq</strong> also visited Nepal</h3>
    <h3> <strong>Careful</strong> <strong>Planning</strong> </h3>
    <h2>Completely Different Traffic Conditions</h2>
  </div></article>`);
  const [kylaq, slavia, partly, split] = d.querySelectorAll('h3');
  const h2 = d.querySelector('h2');
  assert.equal(isBoldHeading(kylaq), true);
  assert.equal(isBoldHeading(slavia), false, 'Slavia: unbolded on origin');
  assert.equal(isBoldHeading(partly), false, 'a partly bold heading is not a bold heading');
  assert.equal(isBoldHeading(split), true, 'every word bold, in two runs');
  assert.equal(isBoldHeading(h2), false);
  assert.equal(markBoldHeadings(d.querySelector('.entry-content')), 2);
  // helix-importer's preProcess (DOMUtils.reviewHeadings) then strips the headings' bold tags
  d.querySelectorAll('strong, b').forEach((el) => el.replaceWith(...el.childNodes));
  assert.equal(restoreBoldHeadings(d.body), 2);
  assert.equal(kylaq.innerHTML, '<strong>Škoda Kylaq sets out on its journey from its home country of India</strong>');
  assert.equal(slavia.querySelector('strong'), null, 'Slavia stays plain (300)');
  assert.equal(partly.querySelector('strong'), null);
  assert.equal(split.querySelector('strong').textContent.trim(), 'Careful Planning');
  assert.equal(d.querySelectorAll('[data-skoda-bold]').length, 0, 'no mark reaches DA');
});

// ---- nested layout builder (SKODA-516: the Miss Peaches stories keep their body in one) ----
const editor = (text) => `<div class="so-panel widget widget_sow-editor"><div class="siteorigin-widget-tinymce textwidget"><p>${text}</p></div></div>`;
const cell = (inner) => `<div class="panel-grid-cell">${inner}</div>`;
const row = (...cells) => `<div class="panel-grid">${cells.join('')}</div>`;
const builder = (...rows) => `<div class="so-panel widget widget_siteorigin-panels-builder"><div class="panel-layout">${rows.join('')}</div></div>`;

test('a nested layout builder flattens its rows in order; a 2-cell row inside it → Columns', { skip: domSkip }, () => {
  const d = domDoc(`<div class="entry-content"><div class="panel-layout">
    ${row(cell(builder(row(cell(editor('First'))), row(cell(editor('Second') + editor('Third'))), row(cell(editor('Left')), cell(editor('Right'))), row(cell(editor('Last'))))))}
  </div></div>`);
  const content = d.querySelector('.entry-content');
  parse(content, { document: d });
  const paras = [...content.querySelectorAll(':scope > p')].map((p) => p.textContent);
  assert.deepEqual(paras, ['First', 'Second', 'Third', 'Last'], 'every row, in order (was: none, deferred)');
  const columns = content.querySelector('table[data-block="Columns"]');
  assert.ok(columns, 'the genuine 2-cell row');
  assert.deepEqual([...columns.querySelectorAll('td')].map((td) => td.textContent), ['Left', 'Right']);
});

test('a nested builder inside a Columns cell linearizes (blocks do not nest)', { skip: domSkip }, () => {
  const d = domDoc(`<div class="entry-content"><div class="panel-layout">
    ${row(cell(editor('Side')), cell(builder(row(cell(editor('A')), cell(editor('B'))))))}
  </div></div>`);
  const content = d.querySelector('.entry-content');
  parse(content, { document: d });
  const tables = content.querySelectorAll('table');
  assert.equal(tables.length, 1, 'one Columns, no table inside it');
  assert.equal(tables[0].querySelectorAll('table').length, 0);
  assert.match(tables[0].textContent, /Side[\s\S]*A[\s\S]*B/);
});

test('classifyWidget: a nested builder whose first widget is a text editor is still a nested builder', { skip: domSkip }, () => {
  const d = domDoc(`<div class="so-panel widget widget_siteorigin-panels-builder"><div class="panel-layout"><div class="panel-grid"><div class="panel-grid-cell">
    <div class="so-panel widget widget_sow-editor"><div class="so-widget-sow-editor"><div class="siteorigin-widget-tinymce textwidget"><p>First</p></div></div></div>
  </div></div></div></div>`);
  assert.equal(classifyWidget(d.querySelector('.so-panel')), 'nested-builder');
});

// #516 review: a row holding only a nested builder stands for that builder's rows
const builderRow = (id, inner) => `<div id="${id}" class="panel-grid panel-no-style"><div class="panel-grid-cell">
  <div class="so-panel widget widget_siteorigin-panels-builder"><div class="panel-layout">${inner.join('')}</div></div></div></div>`;

test('a highlight row inside a body-only nested builder keeps its highlight section (#516 review)', { skip: domSkip }, () => {
  const d = storyDoc('#pg-3-1> .panel-row-style { background-color:#0e3a2f }', [
    builderRow('pg-1-0', [
      editorRow('pg-3-0', '<p>Intro</p>'),
      editorRow('pg-3-1', '<h3>Panel title</h3><p>Panel</p>'),
      editorRow('pg-3-2', '<p>Outro</p>'),
    ]),
  ]);
  markHighlights(d);
  assert.deepEqual(flow(d), [
    ['p', 'Intro'],
    ['hr'], ['h3', 'Panel title'], ['p', 'Panel'], ['meta', 'body-column, highlight-dark'],
    ['hr'], ['meta', 'body-column'], ['p', 'Outro'],
  ]);
});

test('a builder without the so-panel class is walked once, not twice (#516 review)', { skip: domSkip }, () => {
  const d = domDoc(`<div class="entry-content"><div class="panel-layout">
    ${row(cell(editor('Lead')), cell(`<div class="widget widget_siteorigin-panels-builder"><div class="panel-layout">${row(cell(editor('Inside')))}</div></div>`))}
  </div></div>`);
  const content = d.querySelector('.entry-content');
  parse(content, { document: d });
  assert.equal(content.textContent.match(/Inside/g)?.length, 1);
});

test('a builder with its rows set straight in the widget flattens them; one with no rows is logged (#516 review)', { skip: domSkip }, () => {
  const d = domDoc(`<div class="entry-content"><div class="panel-layout">
    ${row(cell(editor('Before') + `<div class="so-panel widget widget_siteorigin-panels-builder">${row(cell(editor('Direct row')))}</div>`))}
    ${row(cell(editor('After') + '<div class="so-panel widget widget_siteorigin-panels-builder"><p>no rows</p></div>'))}
  </div></div>`);
  const content = d.querySelector('.entry-content');
  const warned = [];
  const realWarn = console.warn;
  console.warn = (...args) => warned.push(args.join(' '));
  try { parse(content, { document: d }); } finally { console.warn = realWarn; }
  assert.deepEqual([...content.querySelectorAll(':scope > p')].map((p) => p.textContent), ['Before', 'Direct row', 'After']);
  assert.match(warned.join('\n'), /deferred\/unknown widgets: .*"unknown":\["nested builder without rows: so-panel widget widget_siteorigin-panels-builder"\]/);
});

test('classifyWidget: the bare siteorigin-panels-builder class wins over its first editor too (#516 review)', { skip: domSkip }, () => {
  const d = domDoc(`<div class="so-panel siteorigin-panels-builder"><div class="panel-layout"><div class="panel-grid"><div class="panel-grid-cell">
    <div class="so-panel widget widget_sow-editor"><div class="so-widget-sow-editor"><p>x</p></div></div></div></div></div></div>`);
  assert.equal(classifyWidget(d.querySelector('.so-panel')), 'nested-builder');
});

test('a line break closing a bold run moves after it (Miss Peaches "instagram:<br>")', { skip: domSkip }, () => {
  const d = domDoc(`<div class="entry-content"><div class="panel-layout"><div class="panel-grid"><div class="panel-grid-cell">
    ${editor('<strong>instagram:<br /></strong><a href="https://www.instagram.com/x/">@x</a><br />followers')}</div></div></div></div>`);
  const content = d.querySelector('.entry-content');
  parse(content, { document: d });
  assert.equal(content.querySelector('p').innerHTML, '<strong>instagram:</strong><br><a href="https://www.instagram.com/x/">@x</a><br>followers');
});

// --- the editor text's inline styles (#516 PO: centred captions, 10pt text, the 4×4 box) ------
const { markTextStyles, splitTextRuns } = await import('./story-flatten.js');

// a one-cell body row holding the given editor html (no Columns), with the cell widths marked
const textStory = (html) => domDoc(`<html><head><style></style></head><body><div class="entry-content"><div class="panel-layout">
  <div id="pg-9-0" class="panel-grid panel-no-style"><div id="pgc-9-0-0" class="panel-grid-cell"><div class="so-panel widget widget_sow-editor"><div class="so-widget-sow-editor">
  <div class="siteorigin-widget-tinymce textwidget">${html}</div></div></div></div></div></div></div></body></html>`);
const sections = (main) => {
  // the body as [style, text …] per section, split at the top-level <hr>s
  const out = [{ style: '(first)', text: [] }];
  [...main.querySelectorAll('.entry-content > *')].forEach((n) => {
    if (n.tagName === 'HR') { out.push({ style: '', text: [] }); return; }
    if (n.tagName === 'TABLE' && n.dataset.block === 'Section Metadata') { out[out.length - 1].style = n.querySelectorAll('tr')[1].children[1].textContent; return; }
    out[out.length - 1].text.push(n.tagName === 'TABLE' ? `[${n.dataset.block}]` : n.textContent.trim().slice(0, 12));
  });
  return out.filter((s) => s.text.length).map((s) => `${s.style}: ${s.text.join(' | ')}`);
};
const importText = (html) => {
  const d = textStory(html);
  markCellWidths(d); markCentredImages(d); markTextStyles(d);
  const content = d.querySelector('.entry-content');
  parse(content, { document: d });
  applyCentredImages(d.body);
  return d;
};

test('markTextStyles: centred, a uniform 10 / 14 / 16 / 18pt size, a box; mixed sizes give none', { skip: domSkip }, () => {
  const d = textStory(`<p id="a" style="text-align: center;"><img class="aligncenter" src="a.jpg" width="800"><br><span style="font-size: 10pt;">Caption</span></p>
    <p id="b"><span style="font-size: 16pt;"><strong>Big</strong> title</span></p>
    <p id="c">Plain <span style="font-size: 10pt;">and small</span></p>
    <div id="d" style="text-align: center; padding: 50px; background: #cccccc;"><span style="font-size: 14pt; color: #000000;">Box</span></div>
    <p id="e" style="text-align: left;">Left</p>`);
  assert.equal(markTextStyles(d), 3);
  const marks = ['a', 'b', 'c', 'd', 'e'].map((id) => d.getElementById(id).getAttribute('data-skoda-text'));
  assert.deepEqual(marks, ['center text-small', 'text-large', null, 'center text-medium box', null]);
  assert.deepEqual(JSON.parse(d.getElementById('d').getAttribute('data-skoda-box')), {
    background: '#cccccc', padding: '50px', shadow: '', color: '#000000',
  });
});

test('a run of centred / small paragraphs is its own body section; the body resumes after it', { skip: domSkip }, () => {
  const d = importText(`<p>Intro text</p>
    <p style="text-align: center;"><img class="aligncenter" src="a.jpg" width="800"><br><span style="font-size: 10pt;">First caption</span></p>
    <p style="text-align: center;"><img class="aligncenter" src="b.jpg" width="800"><br><span style="font-size: 10pt;">Second caption</span></p>
    <p style="text-align: center;"><strong>A centred quote</strong></p>
    <p>More text</p>`);
  assert.deepEqual(sections(d), [
    '(first): Intro text',
    'body-column, text-center, text-small, centered-images: First captio | Second capti',
    'body-column, text-center, centered-images: A centred qu',
    'body-column, centered-images: More text',
  ], 'every body section also centres its narrower photos (centered-images)');
  assert.equal(d.querySelector('[data-skoda-text], [data-skoda-box]'), null, 'no marks in the output');
});

test('a padded box: its own section, `text-box` with its rows; its inline content as a paragraph', { skip: domSkip }, () => {
  const d = importText(`<p>Before</p><div style="text-align: center; padding: 50px; background: #cccccc;"><span style="font-size: 14pt;"><strong>Press releases are in the <a href="https://x.test/kit">press kit</a>.</strong></span><br><img class="aligncenter" src="kit.jpg" width="2000"></div>`);
  const meta = [...d.querySelectorAll('table')].find((t) => /text-box/.test(t.textContent));
  const rows = [...meta.querySelectorAll('tr')].slice(1).map((tr) => [...tr.children].map((td) => td.textContent));
  assert.deepEqual(rows, [['style', 'body-column, text-center, text-medium, text-box'], ['box-background', '#cccccc'], ['box-padding', '50px']]);
  const p = meta.previousElementSibling;
  assert.equal(p.tagName, 'P');
  assert.ok(p.querySelector('a[href="https://x.test/kit"]') && p.querySelector('img'), 'the text, its link and the image');
});

test('a body caption figure shown narrower than its file → a one-card Columns (centered, portrait-NNN, captioned)', { skip: domSkip }, () => {
  const d = importText(`<p>Text</p><figure style="width: 200px" class="wp-caption aligncenter"><img src="a-384x384.png" width="200" height="200" srcset="a-384x384.png 384w, a-150.png 150w"><figcaption class="wp-caption-text"><strong>Alžběta Šťastná</strong><p>Spokesperson</p></figcaption></figure>`);
  const table = [...d.querySelectorAll('table')].find((t) => /^Columns/.test(t.dataset.block));
  assert.equal(table?.dataset.block, 'Columns (centered, portrait-200, captioned)');
  assert.match(table.textContent, /Alžběta Šťastná/);
  // a file-size figure stays as it is
  const plain = importText('<figure class="wp-caption aligncenter"><img src="b.png" width="384" srcset="b.png 384w"><figcaption>Name</figcaption></figure>');
  assert.equal([...plain.querySelectorAll('table')].some((t) => /^Columns/.test(t.dataset.block)), false);
});

test('centredVariants: a centred row whose text is centred too gets text-center', { skip: domSkip }, () => {
  const d = profileStory({ portrait: 300 });
  d.querySelectorAll('#pg-1-4 .textwidget > p').forEach((p) => p.setAttribute('style', 'text-align: center;'));
  markCellWidths(d); markCentredImages(d); markTextStyles(d);
  assert.deepEqual(centredVariants([...d.querySelectorAll('#pg-1-4 .panel-grid-cell')]), ['centered', 'portrait-300', 'captioned', 'text-center']);
  const left = profileStory({ portrait: 300 });
  left.querySelectorAll('#pg-1-4 .textwidget > p[style]').forEach((p) => p.removeAttribute('style'));
  markCellWidths(left); markCentredImages(left); markTextStyles(left);
  assert.deepEqual(centredVariants([...left.querySelectorAll('#pg-1-4 .panel-grid-cell')]), ['centered', 'portrait-300', 'captioned'], 'left text: no token');
});

test('splitTextRuns leaves unstyled nodes as they are', { skip: domSkip }, () => {
  const d = domDoc('<div><p>a</p><h2>b</h2></div>');
  const nodes = [...d.querySelector('div').children];
  assert.deepEqual(splitTextRuns(nodes, d), nodes);
});

// --- blank lines and panel colours (#516 PO) -----------------------------------------------
test('a blank editor line → Spacer (line) 44px in the body; leading a row cell it adds to the offset', { skip: domSkip }, () => {
  const d = importText('<p>Before</p><p>&nbsp;</p><p>After</p>');
  const table = [...d.querySelectorAll('table')].find((t) => t.dataset.block.startsWith('Spacer'));
  assert.equal(table?.dataset.block, 'Spacer (line)');
  assert.equal(table.querySelector('tr:nth-child(2) td').textContent, '44px');
  const row = splitStory({
    css: '#pgc-1-2-0{ width:61.8% } #pgc-1-2-1{ width:38.2% }',
    portrait: PORTRAIT_235,
  });
  row.querySelector('#pgc-1-2-0 .textwidget').insertAdjacentHTML('afterbegin', '<p>&nbsp;</p><p>&nbsp;</p>');
  markCellWidths(row);
  parse(row.querySelector('.entry-content'), { document: row });
  assert.equal(row.querySelector('table').dataset.block, 'Columns (split-62, portrait-235, offset-88-24)', 'two blank lines: 88px');
});

test('markHighlights: a panel\'s own colours as rows; the default dark panel needs none', { skip: domSkip }, () => {
  const d = storyDoc('#pg-7-1> .panel-row-style { background-color:#1ed4df } #pg-7-2> .panel-row-style { background-color:#0e3a2f }', [
    editorRow('pg-7-1', '<p><span style="color: #333333;">Dip or swim?</span> <a style="color: #333333;" href="/x">partner</a></p>'),
    editorRow('pg-7-2', '<p>White text</p>'),
  ]);
  markHighlights(d);
  const g1 = d.getElementById('pg-7-1'); const g2 = d.getElementById('pg-7-2');
  assert.equal(g1.getAttribute('data-highlight'), 'grey');
  assert.equal(g1.getAttribute('data-highlight-background'), '#1ed4df');
  assert.equal(g1.getAttribute('data-highlight-color'), '#333333');
  assert.equal(g1.getAttribute('data-highlight-link'), '#333333');
  assert.equal(g2.getAttribute('data-highlight'), 'dark');
  ['background', 'color', 'link'].forEach((k) => assert.equal(g2.hasAttribute(`data-highlight-${k}`), false, k));
});

test('markHighlights: short hex and rgb() colours become 6-digit hex rows', { skip: domSkip }, () => {
  const d = storyDoc('#pg-8-1> .panel-row-style { background-color:#ccc }', [
    editorRow('pg-8-1', '<p><span style="color: #fff;">Light text</span> <a style="color: rgb(65, 148, 104);" href="/x">link</a></p>'),
  ]);
  markHighlights(d);
  const g = d.getElementById('pg-8-1');
  assert.equal(g.getAttribute('data-highlight-background'), '#cccccc');
  assert.equal(g.getAttribute('data-highlight-color'), '#ffffff');
  assert.equal(g.getAttribute('data-highlight-link'), '#419468');
});


// --- styled text inside a panel or a box (#380 review) -------------------------------------
test('a panel whose text changes style is cut in joined parts: its caption centred and 10pt', { skip: domSkip }, () => {
  const d = storyDoc('#pg-5-1> .panel-row-style { background-color:#f1f1f1 }', [
    editorRow('pg-5-1', '<h3>Roots in motorsport</h3><p>The current RS models.</p>'
      + '<p style="text-align: center;"><span style="font-size: 10pt;">Škoda 200 RS (1974)</span></p><p>In modern history.</p>'),
  ]);
  markHighlights(d); markTextStyles(d);
  assert.deepEqual(flow(d), [
    ['hr'], ['h3', 'Roots in motorsport'], ['p', 'The current RS models.'], ['meta', 'body-column, highlight-grey'],
    ['hr'], ['p', 'Škoda 200 RS (1974)'], ['meta', 'body-column, highlight-grey, text-center, text-small, continued'],
    ['hr'], ['p', 'In modern history.'], ['meta', 'body-column, highlight-grey, continued'],
  ]);
  assert.equal(d.querySelector('[data-skoda-text]'), null, 'no marks left');
});

test('a panel in one style stays one section', { skip: domSkip }, () => {
  const d = storyDoc('#pg-5-2> .panel-row-style { background-color:#f1f1f1 }', [
    editorRow('pg-5-2', '<h3>Five stars</h3><p>Škoda takes great pride.</p>'),
  ]);
  markHighlights(d); markTextStyles(d);
  assert.deepEqual(flow(d).filter(([k]) => k === 'meta'), [['meta', 'body-column, highlight-grey']]);
});

test('a box keeps its own paragraphs and their styles: a 14pt centred title, then centred text', { skip: domSkip }, () => {
  const d = importText('<p>Before</p><div style="box-shadow: 0 0 5px 3px #000000; padding:10px 15px; background-color: #cfcfcf;">'
    + '<p style="text-align: center;"><span style="font-size: 14pt;"><strong>MQB modular architecture</strong></span></p>'
    + '<p style="text-align: center;">The abbreviation MQB stands for</p></div><p>After</p>');
  assert.deepEqual(sections(d), [
    '(first): Before',
    'body-column, text-box, text-center, text-medium: MQB modular ',
    'body-column, text-box, text-center, continued: The abbrevia',
    'body-column: After',
  ]);
  assert.equal(d.querySelector('p p'), null, 'no paragraph inside a paragraph');
  const metas = [...d.querySelectorAll('table')].filter((t) => t.dataset.block === 'Section Metadata');
  const rows = (t) => [...t.querySelectorAll('tr')].slice(2).map((tr) => tr.children[0].textContent);
  assert.deepEqual(rows(metas[0]), ['box-background', 'box-padding', 'box-shadow'], 'each part keeps the box rows');
  assert.deepEqual(rows(metas[1]), ['box-background', 'box-padding', 'box-shadow']);
});

test('a panel in parts: each part has its own text colour; an empty lead opens no part', { skip: domSkip }, () => {
  const d = storyDoc('#pg-5-3> .panel-row-style { background-color:#4ba82e }', [
    editorRow('pg-5-3', '<p> </p><p style="text-align: center;"><span style="font-size: 18pt;">Millionth SUV headed for Spain</span></p>'
      + '<p><span style="color: #ffffff;">The millionth SUV is a green KAROQ, and a long white paragraph.</span></p>'),
  ]);
  markHighlights(d); markTextStyles(d);
  const content = d.querySelector('.content');
  parse(content, { document: d });
  const metas = [...content.children].filter((n) => n.dataset.block === 'Section Metadata')
    .map((t) => [...t.querySelectorAll('tr')].slice(1).map((tr) => `${tr.children[0].textContent}=${tr.children[1].textContent}`).join(' | '));
  const geometry = 'highlight-margin=0px 0px 0px 0px | highlight-margin-mobile=0px 0px 0px 0px';
  assert.deepEqual(metas, [
    `style=body-column, highlight-grey, text-center, text-xlarge | ${geometry} | highlight-background=#4ba82e`,
    `style=body-column, highlight-grey, continued | ${geometry} | highlight-background=#4ba82e | highlight-color=#ffffff`,
  ]);
  assert.equal(content.querySelector('table').dataset.block, 'Spacer (line)', 'the blank line stays, in the first part');
});

// --- a centred / unequal row's own padding (#380 review) -----------------------------------
const { markRowPadding } = await import('./story-flatten.js');
test('a centred or unequal row keeps its own SiteOrigin padding as pad / pad-m tokens; plain rows stay as they are', { skip: domSkip }, () => {
  const css = '#pgc-1-2-0{ width:61.8% } #pgc-1-2-1{ width:38.2% } '
    + '@media (max-width:780px){ #pg-1-2> .panel-row-style { padding:15px 15px 15px 15px } } '
    + '#pg-1-2> .panel-row-style { padding:32px 0px 0px 0px }';
  const row = splitStory({ css, portrait: PORTRAIT_235 });
  markCellWidths(row); markRowPadding(row);
  parse(row.querySelector('.entry-content'), { document: row });
  assert.equal(row.querySelector('table').dataset.block, 'Columns (split-62, portrait-235, offset-0-24, pad-32-0-0-0, pad-m-15-15-15-15)');
  // the same row with equal, un-styled cells: plain Columns, no padding token
  const plain = splitStory({ css: '@media (max-width:780px){ #pg-1-2> .panel-row-style { padding:15px } }', portrait: '<p>Text</p>' });
  markCellWidths(plain); markRowPadding(plain);
  parse(plain.querySelector('.entry-content'), { document: plain });
  assert.doesNotMatch(plain.querySelector('table').dataset.block, /pad/);
});

test('a stretched row keeps only its top / bottom padding: SiteOrigin sets its sides', { skip: domSkip }, () => {
  const css = '#pgc-1-2-0{ width:61.8% } #pgc-1-2-1{ width:38.2% } '
    + '@media (max-width:780px){ #pg-1-2> .panel-row-style { padding:15px 15px 15px 15px } }';
  const row = splitStory({ css, portrait: PORTRAIT_235 });
  // the same row as a SiteOrigin full-width stretched row (the Millionth SUV rows)
  const grid = row.getElementById('pg-1-2');
  const style = row.createElement('div');
  style.className = 'panel-row-style panel-row-style-for-1-2';
  style.setAttribute('data-stretch-type', 'full');
  style.append(...grid.childNodes);
  grid.append(style);
  grid.className = 'panel-grid panel-has-style';
  markCellWidths(row); markRowPadding(row);
  parse(row.querySelector('.entry-content'), { document: row });
  assert.match(row.querySelector('table').dataset.block, /pad-32-0-0-0, pad-m-15-0-15-0\)$/, 'the theme 32px top from 781px; the sides SiteOrigin sets');
});
