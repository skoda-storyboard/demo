/*
 * Unit tests for check-siteorigin-body (SKODA-814): the SiteOrigin body contract check.
 * Fixtures are trimmed from live source markup and main-preview `.plain.html` (2026-10-28).
 * Run: node --test tools/importer/check-siteorigin-body.test.mjs
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import {
  norm, sourceBody, widgetKinds, editorParts, headings, headingMismatches, residue, checkPage,
  rowShape, outline, skipsLevel, WIDGET_KINDS,
} from './check-siteorigin-body.mjs';

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
  } catch { /* jsdom unavailable — skip */ }
}
const skip = JSDOM ? false : 'jsdom not installed — DOM tests skip';

const editor = (inner, kind = 'sow-editor') => `<div class="so-panel widget widget_${kind}"><div class="panel-widget-style">
  <div class="so-widget-${kind} so-widget-${kind}-base"><div class="siteorigin-widget-tinymce textwidget">${inner}</div></div></div></div>`;
const page = (cells) => `<html><body><main><article class="post"><h1>Title</h1>
  <div class="panel-layout"><div class="panel-grid panel-no-style">${cells.map((c) => `<div class="panel-grid-cell">${c}</div>`).join('')}</div></div>
  </article></main></body></html>`;
const doc = (html) => new JSDOM(html).window.document;
const run = (src, plain) => checkPage(doc(src), plain, doc(`<body>${plain}</body>`));

test('norm folds whitespace, nbsp, the word joiner and typographic quotes', () => {
  assert.equal(norm('a\u{F00A0}roomy'), 'a roomy', 'skoda-nbsp placeholder in a local file');
  assert.equal(norm('  “Hi”  it’s⁠ \n ok '), '"Hi" it\'s ok');
});

test('residue lists each SiteOrigin class once, nothing for clean markup', { skip }, () => {
  const leftover = '<div class="panel-grid"><div class="so-panel widget"><div class="so-widget-sow-editor siteorigin-widget-tinymce"></div></div></div>';
  assert.deepEqual(residue(leftover), ['panel-grid', 'so-panel', 'so-widget-sow-editor', 'siteorigin-widget-tinymce']);
  assert.deepEqual(residue('<div class="columns split-75"><div><p>Panel text</p></div></div>'), []);
});

test('widgetKinds counts each panel by its widget_ class', { skip }, () => {
  const body = sourceBody(doc(page([editor('<p>a</p>') + editor('<div style="padding-top:1em"></div>', 'skoda-offset'), editor('<p>b</p>')])));
  assert.deepEqual(widgetKinds(body), { 'sow-editor': 2, 'skoda-offset': 1 });
  assert.ok(WIDGET_KINDS.includes('sow-editor') && WIDGET_KINDS.includes('skoda-offset'));
});

test('editorParts takes the innermost text blocks, a <p> in a <li> once', { skip }, () => {
  const body = sourceBody(doc(page([editor('<h3>Head</h3><p>One</p><ul><li><p>Item one</p></li><li>Item two</li></ul><p> </p>')])));
  assert.deepEqual(editorParts(body), ['Head', 'One', 'Item one', 'Item two']);
});

test('a page whose output carries the body passes', { skip }, () => {
  const src = page([editor('<h2>Section</h2><p>Body line one<br>line two</p>')]);
  const r = run(src, '<div><h1>Title</h1><h2 id="section">Section</h2><p>Body line one<br>line two</p></div>');
  assert.equal(r.ok, true, JSON.stringify(r));
  assert.equal(r.parts, 2);
});

test('a <br> counts as a space on both sides, not glued words', { skip }, () => {
  // the source's "…motorways.<br>And all…" must match the output's own line break
  const r = run(page([editor('<p>more on motorways.<br>And all that</p>')]), '<div><h1>Title</h1><p>more on motorways.<br>And all that</p></div>');
  assert.deepEqual(r.missing, []);
});

test('lost text is reported: the bold name after a portrait (#536)', { skip }, () => {
  const src = page([editor('<p style="text-align: center;"><span style="font-size: 10pt;"><strong><img src="https://cdn.skoda-storyboard.com/2024/08/Milos-Vrba_cc2fbedf.jpg" width="200" height="200"> Miloš Vrba</strong></span><br><span style="font-size: 10pt;">Škoda Motorsport</span></p>')]);
  const plain = '<div><h1>Title</h1><div class="columns centered portrait-200 text-small"><div><div><picture><img src="./media_1.jpg" alt="Milos-Vrba_cc2fbedf"></picture><br>Škoda Motorsport</div></div></div></div>';
  const r = run(src, plain);
  assert.equal(r.ok, false);
  assert.deepEqual(r.missing, ['Miloš Vrba Škoda Motorsport']);
});

test('headings keep the source level: an h3 written as h2 fails, the h1 from the title is not a match', { skip }, () => {
  const src = page([editor('<h3>Subhead</h3><p>Text</p>')]);
  const r = run(src, '<div><h1>Title</h1><h2>Subhead</h2><p>Text</p></div>');
  assert.deepEqual(r.levels, [{ text: 'Subhead', source: 3, output: 2 }]);
  // the source's author-chosen h1 → h3 gap stays (SKODA-814: no re-derivation)
  assert.equal(run(src, '<div><h1>Title</h1><h3>Subhead</h3><p>Text</p></div>').ok, true);
});

test('headingMismatches uses each output heading once, the same level first', () => {
  // the body repeats the title as an h2: the page h1 and the body h2 both exist
  const source = [{ level: 2, text: 'Consent' }];
  assert.deepEqual(headingMismatches(source, [{ level: 1, text: 'Consent' }, { level: 2, text: 'Consent' }]), []);
  assert.deepEqual(headingMismatches(source, [{ level: 1, text: 'Consent' }]), [{ text: 'Consent', source: 2, output: 1 }]);
  assert.deepEqual(headings(null), []);
  assert.deepEqual(headingMismatches([{ level: 3, text: 'Gone' }], []), [{ text: 'Gone', source: 3, output: null }]);
});

test('residue and the h1 count fail a page', { skip }, () => {
  const src = page([editor('<p>Text</p>')]);
  assert.deepEqual(run(src, '<div class="panel-grid"><h1>Title</h1><p>Text</p></div>').residue, ['panel-grid']);
  assert.equal(run(src, '<div><p>Text</p></div>').h1, 0);
  assert.equal(run(src, '<div><h1>Title</h1><h1>Again</h1><p>Text</p></div>').ok, false);
});

test('a page without a Page-Builder body is checked for residue and its h1 only', { skip }, () => {
  const r = run('<html><body><main><article class="page"><h1>Impressum</h1><p>Plain WP content</p></article></main></body></html>', '<div><h1>Impressum</h1><p>Plain WP content</p></div>');
  assert.equal(r.body, false);
  assert.equal(r.parts, 0);
  assert.equal(r.ok, true);
});

test('a widget outside the map is reported, not failed', { skip }, () => {
  // a headline widget is not an editor: its text is the census's to map, the check flags it
  const headline = '<div class="so-panel widget widget_sow-headline"><div class="so-widget-sow-headline"><div class="sow-headline-container"><h3 class="sow-headline">Headline</h3></div></div></div>';
  const src = page([editor('<p>Text</p>') + headline]);
  const r = run(src, '<div><h1>Title</h1><p>Text</p></div>');
  assert.deepEqual(r.unknown, ['sow-headline']);
  assert.equal(r.ok, true);
});

test('census: rows, side-by-side rows and the source outline', { skip }, () => {
  const html = `<html><body><header><h2>Menu</h2></header><main><article class="post"><h1>Title</h1>
    <div class="panel-layout">
      <div class="panel-grid"><div class="panel-grid-cell"><h3>Sub</h3></div></div>
      <div class="panel-grid"><div class="panel-row-style"><div class="panel-grid-cell">a</div><div class="panel-grid-cell">b</div></div></div>
    </div></article><aside><h3>Explore more</h3></aside></main></body></html>`;
  const d = doc(html);
  assert.deepEqual(rowShape(sourceBody(d)), { rows: 2, sideBySide: 1 });
  assert.deepEqual(outline(d), [1, 3]);
  assert.equal(skipsLevel(outline(d)), true);
  assert.equal(skipsLevel([1, 2, 3, 2, 2]), false);
  assert.deepEqual(rowShape(null), { rows: 0, sideBySide: 0 });
});
