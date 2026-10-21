/*
 * The story's boxed text (scripts/section-box.js): rows and delivered data attributes become
 * custom properties; broken values are ignored.
 * Run: node --test scripts/section-box.test.mjs
 */
/* eslint-disable import/no-extraneous-dependencies */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const { document } = new JSDOM('<main></main>').window;
const { readBoxRow, decorateBox } = await import('./section-box.js');

const section = (classes = 'section body-column text-box') => {
  const el = document.createElement('div');
  el.className = classes;
  return el;
};

test('box rows → custom properties (the 4×4 box: #cccccc, 50px)', () => {
  const el = section();
  [['box-background', '#cccccc'], ['box-padding', '50px'], ['box-shadow', '0 0 5px 3px #000000'], ['box-color', '#000000'], ['style', 'x']]
    .forEach(([k, v]) => readBoxRow(el, k, v));
  assert.equal(decorateBox(el), 4);
  assert.equal(el.style.getPropertyValue('--box-background'), '#cccccc');
  assert.equal(el.style.getPropertyValue('--box-padding'), '50px');
  assert.equal(el.style.getPropertyValue('--box-shadow'), '0 0 5px 3px #000000');
  assert.equal(el.style.getPropertyValue('--box-color'), '#000000');
});

test('delivered pages: the data attributes; broken values and other sections are ignored', () => {
  const el = section();
  el.dataset.boxBackground = '#39a0e7';
  el.dataset.boxPadding = '10px 15px';
  el.dataset.boxColor = 'red; background: url(x)';
  el.dataset.boxShadow = 'inset 0 0 5px url(x)';
  assert.equal(decorateBox(el), 2);
  assert.equal(el.style.getPropertyValue('--box-padding'), '10px 15px');
  assert.equal(el.style.getPropertyValue('--box-color'), '');
  assert.equal(el.style.getPropertyValue('--box-shadow'), '');
  const plain = section('section body-column');
  plain.dataset.boxBackground = '#cccccc';
  assert.equal(decorateBox(plain), 0);
});

test('run-together or unknown values are ignored, so the box keeps its default padding and colours', () => {
  const saved = globalThis.CSS;
  globalThis.CSS = { supports: (property, value) => !(property === 'background-color' && value === 'abc') };
  try {
    const el = section();
    el.dataset.boxPadding = '10px10px';
    el.dataset.boxBackground = 'abc';
    el.dataset.boxColor = '#ffffff';
    assert.equal(decorateBox(el), 1);
    assert.equal(el.style.getPropertyValue('--box-padding'), '');
    assert.equal(el.style.getPropertyValue('--box-background'), '');
    assert.equal(el.style.getPropertyValue('--box-color'), '#ffffff');
  } finally {
    globalThis.CSS = saved;
  }
});
