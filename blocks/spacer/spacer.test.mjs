/*
 * Spacer block: the height from its one cell; decorative; a bad value takes no space.
 * Run: node --test blocks/spacer/spacer.test.mjs
 */
/* eslint-disable import/no-extraneous-dependencies */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const { window } = new JSDOM('<main></main>');
globalThis.document = window.document;
const { default: decorate } = await import('./spacer.js');

const spacer = (value) => {
  const el = document.createElement('div');
  el.className = 'spacer';
  el.innerHTML = `<div><div>${value}</div></div>`;
  return el;
};

test('the height in px (with or without the unit); hidden from assistive tech; no content left', () => {
  ['48px', '48'].forEach((v) => {
    const el = spacer(v);
    decorate(el);
    assert.equal(el.style.getPropertyValue('--spacer-height'), '48px', v);
    assert.equal(el.getAttribute('aria-hidden'), 'true');
    assert.equal(el.children.length, 0);
  });
});

test('a missing or malformed height takes no space', () => {
  ['', '2em', '-24px', '1000px', 'tall'].forEach((v) => {
    const el = spacer(v);
    decorate(el);
    assert.equal(el.style.getPropertyValue('--spacer-height'), '', v || '(empty)');
  });
});
