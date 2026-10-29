/*
 * Linked technical values on the page (scripts/tech-values.js, SKODA-852).
 * Run: node --test scripts/tech-values.test.mjs
 */
/* global globalThis */
/* eslint-disable import/no-extraneous-dependencies */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><main></main>', { url: 'https://main--demo--skoda-storyboard.aem.page/en/skoda-model/peaq' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const { default: decorateTechValues } = await import('./tech-values.js');
const { decorateStats } = await import('../blocks/columns/columns.js');

const main = (html) => {
  const el = document.createElement('main');
  el.innerHTML = html;
  return el;
};

test('a linked stat value stays a bare <strong> with its key, so Columns (stats) splits value and unit (review P2 #4)', () => {
  const root = main('<div class="columns stats"><div><div><p><strong><a href="/data/tech-data.json#peaq.range">459 – 647 km</a></strong></p><p>Range</p></div></div></div>');
  decorateTechValues(root);
  const strong = root.querySelector('strong');
  assert.equal(root.querySelector('a'), null);
  assert.equal(strong.className, 'tech-value');
  assert.equal(strong.dataset.techData, 'peaq.range');
  assert.equal(strong.innerHTML, '459 – 647 km');
  decorateStats(root.querySelector('.columns'));
  assert.equal(strong.querySelector('.columns-stat-value').textContent, '459 – 647');
  assert.equal(strong.querySelector('.columns-stat-unit').textContent, 'km');
  assert.equal(strong.dataset.techData, 'peaq.range', 'the key survives the split');
});

test('a linked value inside a sentence becomes a span with its key; markup inside is kept', () => {
  const root = main('<p>A WLTP range of up to <a href="/data/tech-data.json#peaq-90.range"><em>647</em> km</a>.</p>');
  decorateTechValues(root);
  assert.equal(root.querySelector('a'), null);
  const span = root.querySelector('p > span.tech-value');
  assert.equal(span.dataset.techData, 'peaq-90.range');
  assert.equal(span.innerHTML, '<em>647</em> km');
  assert.equal(root.querySelector('p').textContent, 'A WLTP range of up to 647 km.');
});

test('bold text around a link is not taken over: the link becomes a span inside it', () => {
  const root = main('<p><strong>Range <a href="/data/tech-data.json#peaq.range">459 – 647 km</a></strong></p>');
  decorateTechValues(root);
  assert.equal(root.querySelector('strong').className, '');
  assert.equal(root.querySelector('strong > span.tech-value').textContent, '459 – 647 km');
});

test('absolute preview links count; other links, a missing key and look-alike paths stay links', () => {
  const root = main([
    '<a href="https://main--demo--skoda-storyboard.aem.page/data/tech-data.json#peaq-90.range">647 km</a>',
    '<a href="/en/skoda-model/peaq">Peaq</a>',
    '<a href="/data/tech-data.json#">no key</a>',
    '<a href="/x/data/tech-data.json#peaq.range">elsewhere</a>',
  ].join(' '));
  decorateTechValues(root);
  assert.equal(root.querySelectorAll('span.tech-value').length, 1);
  assert.equal(root.querySelectorAll('a').length, 3);
});

test('no links, nothing to do', () => {
  const root = main('<p>The Peaq 90 has a WLTP range of up to 647 km.</p>');
  decorateTechValues(root);
  assert.equal(root.innerHTML, '<p>The Peaq 90 has a WLTP range of up to 647 km.</p>');
});
