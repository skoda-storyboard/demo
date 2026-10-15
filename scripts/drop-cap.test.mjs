/*
 * Story drop cap (scripts/drop-cap.js): the Section Metadata rows, the wrapped letters, the
 * accessible name of the first word, and invalid values.
 * Run: node --test scripts/drop-cap.test.mjs
 */
/* eslint-disable import/no-extraneous-dependencies */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const { window } = new JSDOM('<main></main>');
const { document } = window;
const { readDropCapRow, decorateDropCap } = await import('./drop-cap.js');

const section = (html, classes = 'section body-column drop-cap') => {
  const el = document.createElement('div');
  el.className = classes;
  el.innerHTML = html;
  document.querySelector('main').replaceChildren(el);
  return el;
};

test('the first letter of the first paragraph: a decorative cap + an inline spoken copy', () => {
  const el = section('<div class="default-content-wrapper"><p></p><p>Sitting at the wheel</p><p>More</p></div>');
  const cap = decorateDropCap(el);
  const p = el.querySelectorAll('p')[1];
  assert.equal(cap.textContent, 'S');
  assert.equal(cap.getAttribute('aria-hidden'), 'true');
  assert.equal(p.innerHTML, '<span class="drop-cap-letter" aria-hidden="true">S</span><span class="drop-cap-spoken">S</span>itting at the wheel');
  const spoken = [...p.childNodes].filter((n) => !(n.nodeType === 1 && n.getAttribute('aria-hidden') === 'true'))
    .map((n) => n.textContent).join('');
  assert.equal(spoken, 'Sitting at the wheel', 'read out as one word');
  assert.equal(decorateDropCap(el), null, 'decorates once');
});

test('rows: the authored letters (an opening quote) and colours; delivered data attributes too', () => {
  const el = section('<p>“The KAROQ stays</p>');
  [['drop-cap-text', '“T'], ['drop-cap-color', '#a2c415'], ['drop-cap-background', 'black'],
    ['drop-cap-margin-bottom', '20px'], ['style', 'x']].forEach(([k, v]) => readDropCapRow(el, k, v));
  decorateDropCap(el);
  assert.equal(el.querySelector('.drop-cap-letter').textContent, '“T');
  assert.equal(el.style.getPropertyValue('--drop-cap-color'), '#a2c415');
  assert.equal(el.style.getPropertyValue('--drop-cap-background'), 'black');
  assert.equal(el.style.getPropertyValue('--drop-cap-margin-bottom'), '20px');

  const delivered = section('<p>Hockey</p>');
  delivered.dataset.dropCapColor = '#4ba82e';
  decorateDropCap(delivered);
  assert.equal(delivered.style.getPropertyValue('--drop-cap-color'), '#4ba82e');
});

test('malformed rows are ignored: the CSS defaults stay; letters that do not open the text fall back', () => {
  const el = section('<p>Sitting</p>');
  readDropCapRow(el, 'drop-cap-color', 'red; background: url(x)');
  readDropCapRow(el, 'drop-cap-margin-bottom', '-20px');
  readDropCapRow(el, 'drop-cap-text', 'Q');
  decorateDropCap(el);
  assert.equal(el.querySelector('.drop-cap-letter').textContent, 'S', 'the first letter, not the unmatched Q');
  assert.equal(el.style.getPropertyValue('--drop-cap-color'), '');
  assert.equal(el.style.getPropertyValue('--drop-cap-margin-bottom'), '');
});

test('no drop-cap class, or no text: nothing changes', () => {
  const plain = section('<p>Sitting</p>', 'section body-column');
  assert.equal(decorateDropCap(plain), null);
  assert.equal(plain.innerHTML, '<p>Sitting</p>');
  const empty = section('<p><picture><img src="a.jpg" alt=""></picture></p>');
  assert.equal(decorateDropCap(empty), null);
});
