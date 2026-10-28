import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><main></main>', { url: 'https://main--demo--skoda-storyboard.aem.page/en/skoda-model/peaq' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const { default: decorateTechValues } = await import('./tech-values.js');

const main = (html) => {
  const el = document.createElement('main');
  el.innerHTML = html;
  return el;
};

test('a linked value becomes a span with its key, the text and markup inside are kept', () => {
  const root = main('<p><strong><a href="/data/tech-data.json#peaq.range">459 – <em>647</em> km</a></strong></p><p>Range</p>');
  decorateTechValues(root);
  assert.equal(root.querySelector('a'), null);
  const span = root.querySelector('strong > span.tech-value');
  assert.equal(span.dataset.techData, 'peaq.range');
  assert.equal(span.innerHTML, '459 – <em>647</em> km');
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
