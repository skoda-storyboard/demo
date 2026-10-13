/*
 * Highlight panel geometry (PO, 2026-10-13): the source layout's own row padding / widget
 * margins become the section's --hl-* boxes.
 * Run: node --test scripts/highlight-geometry.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
// eslint-disable-next-line import/no-extraneous-dependencies
import { JSDOM } from 'jsdom';
import { applyHighlightGeometry, applyHighlightDataset } from './highlight-geometry.js';

const section = (attrs = '') => new JSDOM(`<main><div class="section highlight-dark" ${attrs}></div></main>`)
  .window.document.querySelector('.section');
const box = (el, name) => ['top', 'right', 'bottom', 'left'].map((side) => el.style.getPropertyValue(`--hl-${name}-${side}`));

test('a Section Metadata row sets its four sides, desktop or mobile (cruise control: 0 0 0 20px)', () => {
  const el = section();
  assert.equal(applyHighlightGeometry(el, 'highlight-margin', '0px 0px 0px 20px'), true);
  assert.equal(applyHighlightGeometry(el, 'Highlight-Margin-Mobile', '0 0 0 20px'), true);
  assert.deepEqual(box(el, 'margin-d'), ['0px', '0px', '0px', '20px']);
  assert.deepEqual(box(el, 'margin-m'), ['0px', '0px', '0px', '20px']);
});

test('CSS shorthand: 1, 2 and 3 values expand as in CSS; padding and gallery margin have their own boxes', () => {
  const el = section();
  applyHighlightGeometry(el, 'highlight-padding', '15px');
  applyHighlightGeometry(el, 'highlight-padding-mobile', '0px 15px');
  applyHighlightGeometry(el, 'highlight-gallery-margin', '0px 15px 5px');
  assert.deepEqual(box(el, 'pad-d'), ['15px', '15px', '15px', '15px']);
  assert.deepEqual(box(el, 'pad-m'), ['0px', '15px', '0px', '15px']);
  assert.deepEqual(box(el, 'gallery-d'), ['0px', '15px', '5px', '15px']);
});

test('anything but a 1–4 value px box, or another key, is ignored', () => {
  const el = section();
  [['highlight-margin', '1em'], ['highlight-margin', '10px 10px 10px 10px 10px'], ['highlight-margin', ''],
    ['highlight-margin', 'calc(10px)'], ['highlight-margin', '-5px'], ['highlight-colour', '10px'], ['style', '10px']]
    .forEach(([key, value]) => assert.equal(applyHighlightGeometry(el, key, value), false, `${key}: ${value}`));
  assert.equal(el.getAttribute('style'), null, 'nothing set');
});

test('a delivered section: its data-highlight-* attributes (the pipeline\'s form of the rows)', () => {
  const el = section('data-highlight-margin="0px 10px 0px 10px" data-highlight-margin-mobile="0px 0px 0px 0px" data-other="x"');
  applyHighlightDataset(el);
  assert.deepEqual(box(el, 'margin-d'), ['0px', '10px', '0px', '10px']);
  assert.deepEqual(box(el, 'margin-m'), ['0px', '0px', '0px', '0px']);
  assert.equal(el.style.length, 8, 'only the two geometry rows');
});
