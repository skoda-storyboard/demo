import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

/* global globalThis */
let JSDOM;
try {
  ({ JSDOM } = createRequire(import.meta.url)('jsdom'));
} catch { /* importer validator may have no test dependencies */ }

const decorate = JSDOM ? (await import('./quote.js')).default : null;

test('renders each row as a figure with its quote and attribution', { skip: !JSDOM }, () => {
  const dom = new JSDOM(`<div class="quote">
    <div><div>“Bare quote text”</div><div><p><strong>Klaus Zellmer</strong>, CEO</p></div></div>
    <div><div><p>First <em>paragraph</em></p><p>Second</p></div><div></div></div>
    <div><div> </div></div>
  </div>`);
  globalThis.document = dom.window.document;
  const block = document.querySelector('.quote');
  decorate(block);
  const figures = [...block.children];
  assert.equal(figures.length, 2, 'an empty authored row is dropped');
  assert.ok(figures.every((figure) => figure.matches('figure')));
  assert.equal(figures[0].querySelector('blockquote.quote-text').textContent, '“Bare quote text”');
  assert.equal(figures[0].querySelector('figcaption.quote-attribution strong').textContent, 'Klaus Zellmer');
  assert.equal(figures[1].querySelectorAll('blockquote p').length, 2, 'rich quote content is kept');
  assert.equal(figures[1].querySelector('figcaption'), null, 'an empty attribution cell renders no caption');
  assert.equal(block.querySelector('hr'), null);
});
