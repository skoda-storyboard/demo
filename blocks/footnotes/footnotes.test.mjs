import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

/* global globalThis */
let JSDOM;
try {
  ({ JSDOM } = createRequire(import.meta.url)('jsdom'));
} catch { /* importer validator may have no test dependencies */ }

const decorate = JSDOM ? (await import('./footnotes.js')).default : null;
// the node-type constants the block reads (the same in every window)
if (JSDOM) globalThis.Node = new JSDOM('').window.Node;

test('each row becomes a plain paragraph; links, line breaks and markers are kept', { skip: !JSDOM }, () => {
  const dom = new JSDOM(`<div class="footnotes">
    <div><div><p>¹ The availability … <a href="https://www.moon-power.com/">HERE</a><br>² All 85, 85x, or RS …</p></div></div>
    <div><div><p><sup>7</sup> The maximum power …</p></div></div>
  </div>`);
  globalThis.document = dom.window.document;
  const block = document.querySelector('.footnotes');
  const link = block.querySelector('a');
  decorate(block);
  assert.deepEqual([...block.children].map((el) => el.tagName), ['P', 'P']);
  assert.equal(block.querySelector('a'), link, 'authored nodes are moved, not copied');
  assert.equal(block.querySelectorAll('br').length, 1);
  assert.equal(block.querySelector('sup').textContent, '7');
  assert.equal(block.querySelectorAll(':scope > div').length, 0, 'no row/cell wrappers left');
});

test('malformed rows: bare text is wrapped, lists kept, empty rows and extra empty cells dropped', { skip: !JSDOM }, () => {
  const dom = new JSDOM(`<div class="footnotes">
    <div><div>³ Typed straight into the cell, <a href="/x">with a link</a></div></div>
    <div><div> </div></div>
    <div><div><ul><li>⁴ A list item</li></ul></div><div></div></div>
    <div></div>
    <div><div><p></p><p>⁵ After an empty paragraph</p></div></div>
  </div>`);
  globalThis.document = dom.window.document;
  const block = document.querySelector('.footnotes');
  decorate(block);
  assert.deepEqual([...block.children].map((el) => `${el.tagName} ${el.textContent.trim()}`), [
    'P ³ Typed straight into the cell, with a link', 'UL ⁴ A list item', 'P ⁵ After an empty paragraph']);
  assert.equal(block.querySelector('p a').getAttribute('href'), '/x');
});

test('nothing authored is lost: loose text around paragraphs and images are kept', { skip: !JSDOM }, () => {
  const dom = new JSDOM(`<div class="footnotes">
    <div><div>Loose lead text <p>² A paragraph</p> trailing <!-- a comment --></div></div>
    <div><div><p><picture><img src="logo.png" alt="Logo"></picture></p><p>¹ Text</p></div></div>
  </div>`);
  globalThis.document = dom.window.document;
  const block = document.querySelector('.footnotes');
  const img = block.querySelector('img');
  decorate(block);
  assert.deepEqual([...block.children].map((el) => el.textContent.trim()), ['Loose lead text', '² A paragraph', 'trailing', '', '¹ Text']);
  assert.ok([...block.children].every((el) => el.matches('p')));
  assert.equal(block.querySelector('img'), img, 'the image is kept, moved not copied');
  assert.equal(block.innerHTML.includes('<!--'), false, 'comments are not rendered');
});

test('an empty block renders nothing and two blocks on a page stay independent', { skip: !JSDOM }, () => {
  const dom = new JSDOM('<div class="footnotes"><div><div></div></div></div><div class="footnotes"><div><div><p>¹ One</p></div></div></div>');
  globalThis.document = dom.window.document;
  const [empty, other] = document.querySelectorAll('.footnotes');
  decorate(empty);
  decorate(other);
  assert.equal(empty.children.length, 0);
  assert.equal(other.textContent.trim(), '¹ One');
});
