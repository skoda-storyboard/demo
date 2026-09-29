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
  ['so-panel siteorigin-panels-builder', 'defer-nested-builder'],
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
test('skoda-offset spacer is dropped', { skip: domSkip }, () => {
  const d = domDoc(`
    <div class="entry-content"><div class="panel-layout">
      <div class="panel-grid"><div class="panel-grid-cell">
        <div class="so-panel widget widget_skoda-offset"><div class="so-widget-skoda-offset"><div style="padding-top:1em"></div></div></div>
      </div></div>
    </div></div>`);
  const content = d.querySelector('.entry-content');
  parse(content, { document: d });
  assert.equal(content.textContent.trim(), '', 'offset produced no output');
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
