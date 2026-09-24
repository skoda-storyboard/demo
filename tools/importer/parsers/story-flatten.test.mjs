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

// Minimal createTable stub — plain-array cells only (the helix-importer contract).
globalThis.WebImporter = {
  DOMUtils: {
    createTable(cells, document) {
      const table = document.createElement('table');
      const [[blockName]] = cells;
      table.dataset.block = blockName;
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
    },
    remove(el, sels) { sels.forEach((s) => el.querySelectorAll(s).forEach((n) => n.remove())); },
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

// ---- carousel routed BY CONTENT: link-free images → Gallery -----------------
test('link-free skoda-carousel-widget → Gallery block, one row per image + caption', { skip: domSkip }, () => {
  const d = domDoc(`
    <div class="entry-content"><div class="panel-layout">
      <div class="panel-grid"><div class="panel-grid-cell">
        <div class="so-panel widget widget_skoda-carousel-widget">
          <div class="so-widget-skoda-carousel-widget">
            <div class="search-results-item"><img src="a.jpg" alt="Alt A" data-caption="Cap A"></div>
            <div class="search-results-item"><img src="b.jpg" alt="Alt B"></div>
          </div>
        </div>
      </div></div>
    </div></div>`);
  const content = d.querySelector('.entry-content');
  parse(content, { document: d });
  const table = content.querySelector('table[data-block="Gallery"]');
  assert.ok(table, 'Gallery block emitted for a link-free image carousel');
  assert.equal(content.querySelector('table[data-block="Cards"]'), null, 'no Cards block for an image carousel');
  assert.equal(table.querySelectorAll('tr').length, 2, 'two image rows');
  assert.ok(table.querySelector('img[src="a.jpg"]'));
  assert.match(table.textContent, /Cap A/, 'data-caption carried');
  assert.match(table.textContent, /Alt B/, 'alt fallback used when no data-caption');
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
