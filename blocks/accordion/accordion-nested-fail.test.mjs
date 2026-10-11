import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

/* global globalThis */
let JSDOM;
try {
  ({ JSDOM } = createRequire(import.meta.url)('jsdom'));
} catch { /* importer validator may have no test dependencies */ }

const decorate = JSDOM ? (await import('./accordion.js')).default : null;

// Its own file (process): aem.js is never given a page window here, so loading the nested
// quote fails, as it would if the module could not be fetched.
test('a nested quote whose loader fails leaves the answer readable and logs the error', { skip: !JSDOM }, async () => {
  const dom = new JSDOM(`<div class="accordion">
    <div><div><h2>Design</h2></div><div>
      <p>Before.</p>
      <table><tr><td>Quote</td></tr><tr><td><p>“Centred.”</p></td><td><p><strong>Oliver Stefani</strong></p></td></tr></table>
    </div></div>
  </div>`, { url: 'https://example.com/en/x' });
  globalThis.document = dom.window.document;
  const block = document.querySelector('.accordion');
  const errors = [];
  const { error } = console;
  console.error = (...args) => errors.push(args);
  try {
    decorate(block);
    await new Promise((resolve) => { setTimeout(resolve, 100); });
  } finally {
    console.error = error;
  }
  const button = block.querySelector('button');
  const panel = block.querySelector('.accordion-panel');
  assert.ok(errors.some(([message]) => message === 'accordion: nested quote not loaded'), 'the failure is reported');
  assert.match(panel.textContent, /Before\.[\s\S]*Centred[\s\S]*Oliver Stefani/, 'every word stays readable');
  assert.equal(panel.querySelector('div.quote').dataset.blockName, undefined, 'not decorated');
  button.click();
  assert.equal(panel.hidden, false, 'the accordion still works');
  assert.equal(button.getAttribute('aria-expanded'), 'true');
});
