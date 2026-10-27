/* global globalThis */
/*
 * Unit tests for skoda-company-assets (SKODA-810b): the company logo's rows as `brand-assets`
 * sections (headings, `Brand Asset` tile blocks, the framed last row), the media-services app
 * body as one `App Promo` block, and the people pages left to skoda-company-people.
 * Fixtures: test/fixtures/company-pages/*.html, the live articles with their layout CSS
 * (test/* is .hlxignore'd).
 * Run: node --test tools/importer/transformers/skoda-company-assets.test.mjs
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

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

const table = (doc, rows) => {
  const t = doc.createElement('table');
  rows.forEach((cols) => {
    const tr = t.insertRow();
    cols.forEach((c) => {
      const td = tr.insertCell();
      [c].flat().forEach((n) => td.append(n));
    });
  });
  return t;
};
globalThis.WebImporter = {
  Blocks: { createBlock: (doc, { name, cells }) => table(doc, [[name], ...Object.entries(cells)]) },
  DOMUtils: { createTable: (rows, doc) => table(doc, rows) },
};
const pageRows = JSDOM ? (await import('./skoda-page-rows.js')).default : null;
const assets = JSDOM ? (await import('./skoda-company-assets.js')).default : null;
const people = JSDOM ? (await import('./skoda-company-people.js')).default : null;

const fixture = (name) => readFileSync(new URL(`../../../test/fixtures/company-pages/${name}.html`, import.meta.url), 'utf8');

// the company importer's order (the cleanup drops <style> after preprocess)
function run(html, wrap = (h) => h) {
  const { document } = new JSDOM(`<html><head></head><body><main>${wrap(html)}</main></body></html>`).window;
  document.querySelectorAll('main style').forEach((s) => document.head.append(s));
  [pageRows, people, assets].forEach((t) => t('preprocess', document.body, { document }));
  document.querySelectorAll('style').forEach((s) => s.remove());
  [pageRows, assets, people].forEach((t) => t('beforeTransform', document.body, { document }));
  pageRows('afterTransform', document.body, { document });
  return document;
}
const blocks = (doc, name) => [...doc.querySelectorAll('table')].filter((t) => t.rows[0].cells[0].textContent === name);
const styles = (doc) => blocks(doc, 'Section Metadata').map((t) => t.rows[1].cells[1].textContent);

test('company logo: a brand-assets section per row, 6 Brand Asset blocks of 3 tiles, the last framed', { skip }, () => {
  const doc = run(fixture('company-logo'));
  assert.deepEqual(styles(doc), [
    'brand-assets', 'brand-assets', 'brand-assets', 'brand-assets', 'brand-assets', 'brand-assets',
    'brand-assets', 'brand-assets', 'brand-assets, framed',
  ]);
  const tiles = blocks(doc, 'Brand Asset');
  assert.equal(tiles.length, 6);
  const cells = tiles.flatMap((t) => [...t.rows].slice(1).map((tr) => tr.cells[0]));
  assert.equal(cells.length, 18, 'the 18 assets');
  cells.forEach((cell) => {
    assert.equal(cell.querySelectorAll('img').length, 1);
    const links = [...cell.querySelectorAll('a')].filter((a) => /download/i.test(a.textContent));
    assert.deepEqual(links.map((a) => a.textContent.trim()), ['PDF download', 'PNG download']);
  });
  assert.equal(blocks(doc, 'Contact Directory').length, 0, 'logo tiles are not person cards');
  assert.deepEqual([...doc.querySelectorAll('h3')].map((h) => h.textContent.trim()), [
    'Current logo of Škoda Auto I Standard', 'Current logo of Škoda Auto I Wordmark Spacing 130',
    'Current logo of Škoda Auto I Wordmark Spacing 160',
  ]);
  assert.equal(doc.querySelectorAll('[data-skoda-page-body], [data-skoda-framed]').length, 0, 'no marks left');
});

test('media-services app: one App Promo block of the five parts, the trailing spacer its own section', { skip }, () => {
  const doc = run(fixture('skoda-media-services-application'));
  const [promo, ...more] = blocks(doc, 'App Promo');
  assert.equal(more.length, 0);
  const rows = [...promo.rows].slice(1).map((tr) => [...tr.cells]);
  assert.deepEqual(rows.map((cells) => cells.length), [2, 1, 2, 1, 3]);
  const [intro, mockup, split, heading, store] = rows;
  assert.ok(intro[0].querySelector('img') && !intro[0].textContent.trim(), 'the icon');
  assert.match(intro[1].textContent, /^Škoda Media Room, the app/);
  assert.ok(mockup[0].querySelector('img[src*="MediaRoom_mockup"]'));
  assert.ok(split[0].querySelector('img[src*="App_02"]') && split[1].querySelector('img[src*="App_01"]'));
  assert.match(heading[0].textContent, /Download the Škoda Media Room app here/);
  // the leading blank line is kept (skoda-nbsp's placeholder)
  assert.ok(heading[0].textContent.startsWith('\u{F00A0}'));
  assert.ok(store[0].querySelector('img[src*="QR_"]'));
  assert.match(store[1].querySelector('a').getAttribute('href'), /^https:\/\/apps\.apple\.com\//);
  assert.match(store[2].querySelector('a').getAttribute('href'), /^https:\/\/play\.google\.com\//);
  assert.equal(blocks(doc, 'Spacer').length, 1, 'the trailing spacer row');
  assert.deepEqual(styles(doc), ['page-body', 'page-body']);
});

test('people pages are left to skoda-company-people', { skip }, () => {
  const doc = run(fixture('contacts'), (h) => `<article class="page">${h}</article>`);
  assert.equal(blocks(doc, 'Brand Asset').length + blocks(doc, 'App Promo').length, 0);
  assert.equal(blocks(doc, 'Contact Directory').length, 8);
});
