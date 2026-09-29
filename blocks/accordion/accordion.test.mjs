import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

/* global globalThis */
let JSDOM;
try {
  ({ JSDOM } = createRequire(import.meta.url)('jsdom'));
} catch { /* importer validator may have no test dependencies */ }

const decorate = JSDOM ? (await import('./accordion.js')).default : null;

test('preserves rich content and heading level, is multi-open, closed and keyboard-operable', { skip: !JSDOM }, () => {
  const dom = new JSDOM(`<div class="accordion">
    <div><div><h2>Heading <em>one</em></h2></div><div><p>Rich <strong>answer</strong></p><div><img src="one.jpg" alt="One"></div></div></div>
    <div><div><h3>Heading two</h3></div><div><p>Second answer</p></div></div>
    <div><div>Incomplete summary</div></div>
  </div>`, { url: 'https://example.com/' });
  globalThis.document = dom.window.document;
  const block = document.querySelector('.accordion');
  const authoredImage = block.querySelector('img');
  decorate(block);
  const buttons = [...block.querySelectorAll('button')];
  const panels = [...block.querySelectorAll('[role="region"]')];
  assert.equal(buttons.length, 2);
  assert.equal(block.querySelectorAll('.accordion-item h2 button').length, 1);
  assert.equal(block.querySelectorAll('.accordion-item h3 button').length, 1);
  assert.equal(panels[0].querySelector('img'), authoredImage, 'do not replace authored media nodes');
  assert.ok(panels.every((panel) => panel.hidden));
  buttons.forEach((button, i) => {
    assert.equal(button.getAttribute('aria-expanded'), 'false');
    assert.equal(button.getAttribute('aria-controls'), panels[i].id);
    assert.equal(panels[i].getAttribute('aria-labelledby'), button.id);
    assert.equal(button.querySelector('.accordion-icon').getAttribute('aria-hidden'), 'true');
  });
  buttons[0].click();
  buttons[1].click();
  assert.ok(panels.every((panel) => !panel.hidden), 'opening a second must not close the first');
  buttons[0].click();
  assert.equal(panels[0].hidden, true);
  assert.equal(panels[1].hidden, false);
  assert.equal(block.querySelectorAll('button').length, 2);
  assert.match(block.textContent, /Incomplete summary/, 'malformed authored row remains readable');
});

test('an h1 summary becomes h2, and non-heading summaries keep only phrasing content in the button', { skip: !JSDOM }, () => {
  const dom = new JSDOM(`<div class="accordion">
    <div><div><h1 class="row-title"><span>Top level</span></h1><p>Teaser line</p></div><div><p>Answer one</p></div></div>
    <div><div><p>Plain <strong>summary</strong></p></div><div><p>Answer two</p></div></div>
  </div>`, { url: 'https://example.com/' });
  globalThis.document = dom.window.document;
  const block = document.querySelector('.accordion');
  decorate(block);
  const [first, second] = [...block.querySelectorAll('.accordion-item')];
  assert.equal(first.querySelector('.accordion-heading').tagName, 'H2');
  assert.equal(block.querySelectorAll('h1').length, 0);
  assert.equal(first.querySelector('button').textContent.trim(), 'Top level');
  assert.match(first.querySelector('.accordion-panel').textContent, /Teaser line[\s\S]*Answer one/, 'extra summary content is kept');
  assert.equal(second.querySelector('.accordion-heading').tagName, 'H3');
  assert.equal(block.querySelectorAll('button p, button div, button h1, button h2, button h3').length, 0);
  assert.equal(second.querySelector('button strong').textContent, 'summary');
});
