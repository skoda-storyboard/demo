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

// the imported Miss Peaches profile row: two cards (portrait, name, role, Instagram icon, handle)
const PROFILE_CELL = (name) => `<div><p><picture><img src="${name}.png" alt="" width="384" height="384"></picture></p>
  <p><strong>${name}</strong></p><p>biker</p><p><picture><img src="instagram.png" alt="Instagram-icon" width="150" height="150"></picture></p>
  <p><strong>instagram:</strong> <a href="https://www.instagram.com/x/">@x</a></p></div>`;
const PROFILE_ROW = `<div>${PROFILE_CELL('laura')}${PROFILE_CELL('nina')}</div>`;

test('centered: both image cards centred, no split; portrait-NNN marks each card\'s first image', () => {
  const el = block('centered portrait-300', PROFILE_ROW);
  decorate(el);
  assert.equal(el.classList.contains('split'), false);
  assert.equal(el.style.getPropertyValue('--columns-split'), '');
  assert.ok(el.classList.contains('portrait'));
  assert.equal(el.style.getPropertyValue('--columns-portrait'), '300px');
  const cards = el.querySelectorAll(':scope > div > div');
  assert.equal([...cards].filter((c) => c.classList.contains('columns-portrait')).length, 2);
  assert.deepEqual([...el.querySelectorAll('.columns-portrait-img')].map((img) => img.getAttribute('src')), ['laura.png', 'nina.png'], 'not the icons');

  const own = block('centered', PROFILE_ROW);
  decorate(own);
  assert.equal(own.classList.contains('portrait'), false, 'images at their own size');
  assert.equal(own.querySelectorAll('.columns-portrait').length, 2);
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

test('offset-A-B: each cell gets its leading spacer offset; a 0 sets none; malformed tokens are ignored', () => {
  const el = block('centered offset-48-24', PROFILE_ROW);
  decorate(el);
  const [a, b] = el.querySelectorAll(':scope > div > div');
  assert.ok(el.classList.contains('offset'));
  assert.equal(a.style.getPropertyValue('--columns-offset'), '48px');
  assert.equal(b.style.getPropertyValue('--columns-offset'), '24px');
  const zero = block('split-62 offset-0-24');
  decorate(zero);
  assert.equal(zero.querySelector(':scope > div > div').style.getPropertyValue('--columns-offset'), '');
  ['offset-', 'offset-x-2', 'offset-1000-2'].forEach((cls) => {
    const bad = block(cls);
    decorate(bad);
    assert.equal(bad.classList.contains('offset'), false, cls);
  });
});
