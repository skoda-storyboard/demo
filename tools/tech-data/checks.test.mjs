import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  applyFromSheet, fieldForLabel, findGridCells, findLinkedValues, findUnlabelledRanges,
  findWltpFigures, runChecks,
} from './checks.js';
import { readSheet } from './tech-data.js';

const sheet = readSheet(JSON.parse(fs.readFileSync(new URL('./tech-data.seed.json', import.meta.url), 'utf8')));
const PEAQ = '/en/skoda-model/peaq';
const RELEASE = '/en/press-releases/936-km-without-recharging-skoda-peaq-sets-range-record-for-seven-seater-electric-suvs';

const cell = (value, label) => `<div><p><strong>${value}</strong></p><p>${label}</p></div>`;
// the Peaq model page's Technical Data as DA stores it (2026-10-28)
const PEAQ_GRID = `<h2 id="technical-data">Technical Data</h2><div class="columns"><div>${cell('150 - 220 kW', 'Maximum performance')}${cell('27 - 28 min', 'Charging time (DC, 10 – 80%)')}${cell('160 - 180 km/h', 'Maximum speed')}</div><div>${cell('6.7 - 8.4 s', 'Acceleration 0 – 100 km/h')}${cell('935 l', 'Boot capacity')}${cell('458 - 646 km', 'Range')}</div></div>`;
const METADATA = '<div class="metadata"><div><div><p>Description</p></div><div><p>A WLTP range of 999 km</p></div></div></div>';
const doc = (main) => `<body><header></header><main><div>${main}</div>${METADATA}</main><footer></footer></body>`;
const byId = (results) => Object.fromEntries(results.map((r) => [r.id, r]));

test('fieldForLabel maps grid labels to sheet fields', () => {
  assert.equal(fieldForLabel('Range'), 'range');
  assert.equal(fieldForLabel('Range (WLTP)'), 'range');
  assert.equal(fieldForLabel('Charging time (DC, 10 – 80%)'), 'dcCharging');
  assert.equal(fieldForLabel('Fuel consumption (combined)'), 'consumption');
  assert.equal(fieldForLabel('Colour'), null);
});

test('findGridCells reads the stat grid and notices linked cells', () => {
  const cells = findGridCells(PEAQ_GRID);
  assert.equal(cells.length, 6);
  assert.deepEqual(cells[5], {
    label: 'Range', field: 'range', text: '458 - 646 km', linked: null,
  });
  const linked = findGridCells(cell('<a href="/data/tech-data.json#peaq.range">459 – 647 km</a>', 'Range'));
  assert.equal(linked[0].linked.key, 'peaq.range');
});

test('the Peaq page: the Range cell is an Issue with the official figure; the rest are linkable', () => {
  const r = byId(runChecks({ html: doc(PEAQ_GRID), path: PEAQ, sheet }));
  assert.equal(r.grid.status, 'fail');
  assert.equal(r.grid.fixable, 1);
  assert.match(r.grid.details[0], /Range: "458 - 646 km" → "459 – 647 km" \(TD-Peaq-en_8fa4f649\.pdf, 21\. 9\. 2026\)/);
  assert.equal(r.linkable.status, 'warn');
  assert.equal(r.linkable.linkable, 5);
  assert.equal(r['wltp-label'].status, 'warn');
  assert.equal(r.links.status, 'pass');
});

test('update links the differing cell to its row; then the grid passes', () => {
  const { html, changes } = applyFromSheet({
    html: doc(PEAQ_GRID), path: PEAQ, sheet, mode: 'update',
  });
  assert.deepEqual(changes, [{ what: 'Range', from: '458 - 646 km', to: '459 – 647 km' }]);
  assert.ok(html.includes('<strong><a href="/data/tech-data.json#peaq.range">459 – 647 km</a></strong>'));
  const r = byId(runChecks({ html, path: PEAQ, sheet }));
  assert.equal(r.grid.status, 'pass');
  assert.equal(r.links.status, 'pass');
  assert.equal(r.links.summary, 'The linked value matches the sheet');
});

test('link turns the matching cells into links and leaves the rest of the document alone', () => {
  const input = doc(PEAQ_GRID);
  const { html, changes } = applyFromSheet({
    html: input, path: PEAQ, sheet, mode: 'link',
  });
  assert.equal(changes.length, 5);
  assert.equal(findLinkedValues(html).length, 5);
  assert.ok(html.includes('458 - 646 km'), 'the differing cell is for update, not link');
  assert.ok(html.endsWith(`${METADATA}</main><footer></footer></body>`));
  assert.equal(input, doc(PEAQ_GRID), 'input not mutated');
});

test('a stale linked value is an Issue and update rewrites only its text', () => {
  const html = doc('<p>Range: <a href="/data/tech-data.json#peaq-90.range" title="x">646 km</a> WLTP.</p>');
  const r = byId(runChecks({ html, path: PEAQ, sheet }));
  assert.equal(r.links.status, 'fail');
  assert.equal(r.links.fixable, 1);
  const fixed = applyFromSheet({
    html, path: PEAQ, sheet, mode: 'update',
  });
  assert.ok(fixed.html.includes('<a href="/data/tech-data.json#peaq-90.range" title="x">647 km</a>'));
});

test('a link to a row the sheet does not have is an Issue and is not "fixed"', () => {
  const html = doc('<p><a href="/data/tech-data.json#peaq-95.range">700 km</a> WLTP</p>');
  const r = byId(runChecks({ html, path: PEAQ, sheet }));
  assert.equal(r.links.status, 'fail');
  assert.equal(r.links.fixable, 0);
  assert.match(r.links.details[0], /peaq-95\.range, which isn't in the sheet/);
  assert.equal(applyFromSheet({
    html, path: PEAQ, sheet, mode: 'update',
  }).changes.length, 0);
});

test('the record guard: 936 km passes as a record, fails once it is labelled WLTP', () => {
  const release = doc('<p>The Škoda Peaq 90 has a homologated WLTP range of up to 647 km, based on the full range of driving conditions prescribed by legislation. The seven-seater Peaq’s record range of 936 km exceeded this figure by 289 km, or almost 45%.</p>');
  const ok = byId(runChecks({ html: release, path: RELEASE, sheet }));
  assert.equal(ok['wltp-figures'].status, 'pass');
  assert.equal(ok['wltp-label'].status, 'pass');
  assert.equal(ok.linkable.linkable, 1);

  const wrong = doc('<p>The Peaq has a WLTP range of 936 km.</p>');
  const bad = byId(runChecks({ html: wrong, path: RELEASE, sheet }));
  assert.equal(bad['wltp-figures'].status, 'fail');
  assert.match(bad['wltp-figures'].details[0], /"936 km" is labelled WLTP but isn't an official figure; official: 459 – 647 km \(Peaq\)/);
});

test('a rounded WLTP figure is a Review, not an Issue', () => {
  const html = doc('<p>The largest battery provides a range of more than 560 km in WLTP mode.</p>');
  const r = byId(runChecks({ html, path: '/en/skoda-model/elroq', sheet }));
  assert.equal(r['wltp-figures'].status, 'warn');
});

test('WLTP figures inside metadata and inside linked values are not scanned twice', () => {
  const html = doc('<p>A WLTP range of <a href="/data/tech-data.json#peaq-90.range">647 km</a>.</p>');
  assert.deepEqual(findWltpFigures(html), []);
  const r = byId(runChecks({ html, path: PEAQ, sheet }));
  assert.equal(r['wltp-figures'].status, 'pass');
  assert.equal(r.links.status, 'pass');
});

test('linking prose: an official WLTP figure becomes a link, other numbers stay text', () => {
  const html = doc('<p>The Škoda Peaq 90 has a homologated WLTP range of up to 647 km. Its record is 936 km.</p>');
  const { html: out, changes } = applyFromSheet({
    html, path: RELEASE, sheet, mode: 'link',
  });
  assert.deepEqual(changes, [{ what: 'peaq-90.range', from: '647 km', to: '647 km' }]);
  assert.ok(out.includes('up to <a href="/data/tech-data.json#peaq-90.range">647 km</a>.'));
  assert.ok(out.includes('Its record is 936 km.'));
});

test('range figures in prose without WLTP are found, drive and record sentences are not', () => {
  const html = doc('<p>The 90 variant has a maximum driving range of more than 640 km.</p><p>The record drive covered a range of 936 km.</p>');
  assert.deepEqual(findUnlabelledRanges(html).map((f) => f.text), ['640 km']);
});

test('a page the sheet does not list: grid values are not checked, WLTP claims are checked against every model', () => {
  const html = doc(`${cell('5.3 – 6.6 l/100 km', 'Fuel consumption (combined)')}<p>A WLTP range of 1000 km.</p>`);
  const r = byId(runChecks({ html, path: '/en/skoda-model/new-kodiaq', sheet }));
  assert.equal(r.grid.status, 'warn');
  assert.match(r.grid.summary, /isn't listed for a model/);
  assert.equal(r['wltp-figures'].status, 'fail');
  assert.match(r['wltp-figures'].details[0], /for any model in the sheet/);
});

test('empty and malformed documents pass without throwing', () => {
  [null, '', '<p>', '<div class="metadata"><div>', 'plain text 647 km WLTP'].forEach((html) => {
    const results = runChecks({ html, path: PEAQ, sheet });
    assert.equal(results.length, 5);
  });
  assert.throws(() => applyFromSheet({
    html: '', path: PEAQ, sheet, mode: 'nope',
  }), /unknown mode/);
});

test('details are capped and the rest counted', () => {
  const many = Array.from({ length: 15 }, () => '<p>A WLTP range of 1 km.</p>').join('');
  const r = byId(runChecks({ html: doc(many), path: PEAQ, sheet }));
  assert.equal(r['wltp-figures'].details.length, 12);
  assert.equal(r['wltp-figures'].more, 3);
});
