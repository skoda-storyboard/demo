/*
 * Columns block tests: the `split-NN` / `portrait-NNN` variant (SKODA-225) and that the
 * default and other variants decorate as before.
 * Run: node --test blocks/columns/columns.test.mjs
 */
/* global globalThis */
/* eslint-disable import/no-extraneous-dependencies */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<main></main>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const { default: decorate, decorateSplit } = await import('./columns.js');

// the imported story row: the quote text | the portrait card (picture, name, role)
const PORTRAIT_ROW = `<div>
  <div>“Škoda started as a bicycle brand.”</div>
  <div><p><picture><img src="kelly.png" alt="" width="500" height="500"></picture></p>
    <p><strong>Meredith Kelly</strong></p><p>Global Head of Marketing at Škoda</p></div>
</div>`;
const block = (classes, rows = PORTRAIT_ROW) => {
  const el = document.createElement('div');
  el.className = `columns ${classes}`.trim();
  el.innerHTML = rows;
  document.querySelector('main').replaceChildren(el);
  return el;
};

test('split-62 + portrait-235: the split and portrait classes and custom properties', () => {
  const el = block('split-62 portrait-235');
  decorate(el);
  assert.ok(el.classList.contains('split'));
  assert.ok(el.classList.contains('portrait'));
  assert.equal(el.style.getPropertyValue('--columns-split'), '62%');
  assert.equal(el.style.getPropertyValue('--columns-portrait'), '235px');
  const [text, card] = el.querySelectorAll(':scope > div > div');
  assert.equal(text.classList.contains('columns-portrait'), false);
  assert.ok(card.classList.contains('columns-portrait'));
  assert.ok(el.classList.contains('columns-2-cols'), 'the base decoration still runs');
});

test('split-75 without a portrait token: the image fills its cell (no portrait class)', () => {
  const el = block('split-75', '<div><div><h2>Five questions</h2><p>Text</p></div><div><p><picture><img src="c.png" alt=""></picture></p></div></div>');
  decorate(el);
  assert.equal(el.style.getPropertyValue('--columns-split'), '75%');
  assert.equal(el.classList.contains('portrait'), false);
  assert.equal(el.style.getPropertyValue('--columns-portrait'), '');
  assert.ok(el.querySelector(':scope > div > div:last-child').classList.contains('columns-portrait'));
});

test('malformed or missing split values keep the default rendering', () => {
  ['split-5', 'split-100', 'split-x', 'portrait-235', ''].forEach((cls) => {
    const el = block(cls);
    assert.equal(decorateSplit(el), false, cls || '(none)');
    assert.equal(el.classList.contains('split'), false);
    assert.equal(el.style.getPropertyValue('--columns-split'), '');
    assert.equal(el.querySelector('.columns-portrait'), null);
  });
  // a malformed portrait next to a valid split is ignored on its own
  const el = block('split-62 portrait-0');
  decorateSplit(el);
  assert.equal(el.classList.contains('portrait'), false);
});

test('default Columns and the other variants decorate as before', () => {
  const plain = block('');
  decorate(plain);
  assert.equal(plain.className, 'columns columns-2-cols');
  assert.equal(plain.getAttribute('style'), null);

  const banners = block('banners', '<div><div><p><picture><img src="a.png" alt=""></picture></p></div><div><p><picture><img src="b.png" alt=""></picture></p></div></div>');
  decorate(banners);
  assert.equal(banners.className, 'columns banners columns-2-cols');
  assert.equal(banners.querySelectorAll('.columns-img-col').length, 2);

  const stats = block('stats', '<div><div><p><strong>85 – 110 kW</strong></p><p>Power</p></div></div>');
  decorate(stats);
  assert.equal(stats.querySelector('.columns-stat-unit').textContent, 'kW');
  assert.equal(stats.classList.contains('split'), false);
});

test('two split blocks on one page stay independent', () => {
  const main = document.querySelector('main');
  const a = document.createElement('div');
  a.className = 'columns split-62 portrait-235';
  a.innerHTML = PORTRAIT_ROW;
  const b = document.createElement('div');
  b.className = 'columns split-75';
  b.innerHTML = PORTRAIT_ROW;
  main.replaceChildren(a, b);
  decorate(a);
  decorate(b);
  assert.equal(a.style.getPropertyValue('--columns-split'), '62%');
  assert.equal(b.style.getPropertyValue('--columns-split'), '75%');
  assert.equal(b.classList.contains('portrait'), false);
});
