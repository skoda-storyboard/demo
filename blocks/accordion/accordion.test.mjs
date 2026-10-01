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

test('a Quote table in an answer (blocks can’t nest in DA) becomes a quote block; other tables stay', { skip: !JSDOM }, async () => {
  const dom = new JSDOM(`<div class="accordion">
    <div><div><h2>Modern Solid design</h2></div><div>
      <p>Before.</p>
      <table><tr><td>Quote</td></tr><tr><td><p>“Centred.”</p></td><td><p><strong>Oliver Stefani</strong></p></td></tr></table>
      <table><thead><tr><th>Quote (Left, Wide)</th></tr></thead><tbody><tr><td><p>Left.</p></td><td></td></tr></tbody></table>
      <table><tr><td>Specs</td></tr><tr><td>Range</td><td>560 km</td></tr></table>
      <table><tr><td>Quote</td><td>two cells</td></tr><tr><td>Not a block head</td></tr></table>
      <table><tr><td>Quote</td></tr></table>
      <table><tr><td>Quoted figures</td></tr><tr><td>x</td></tr></table>
      <table><tr><td>Data</td></tr><tr><td><table><tr><td>Quote</td></tr><tr><td>In a cell</td></tr></table></td></tr></table>
      <p>After.</p>
    </div></div>
  </div>`, { url: 'https://example.com/en/x' });
  // the page globals aem.js reads, so the nested quote is decorated as on the page
  Object.assign(globalThis, { window: dom.window, document: dom.window.document });
  const section = document.createElement('div');
  section.className = 'section accordion-container';
  const wrapper = document.createElement('div');
  wrapper.className = 'accordion-wrapper';
  const block = document.querySelector('.accordion');
  block.replaceWith(section);
  section.append(wrapper);
  wrapper.append(block);
  const { error } = console;
  console.error = () => {}; // the quote's own module can't be fetched here
  try {
    decorate(block);
    await new Promise((resolve) => { setTimeout(resolve, 200); });
  } finally {
    console.error = error;
  }
  const panel = block.querySelector('.accordion-panel');
  const quotes = [...panel.querySelectorAll('div.quote')];
  assert.deepEqual(quotes.map((q) => [...q.classList].filter((c) => c !== 'block')), [['quote'], ['quote', 'left', 'wide']]);
  assert.ok(quotes.every((q) => q.dataset.blockName === 'quote'), 'decorated as a block');
  assert.ok(quotes.every((q) => q.parentElement.matches('.quote-wrapper') && q.parentElement.parentElement === panel));
  assert.equal(section.className, 'section accordion-container', 'the section keeps its own classes');
  // loaded: the quote block's own decoration ran (its stylesheet can't load here)
  const [centred, left] = quotes;
  assert.equal(centred.querySelector('figure > blockquote.quote-text > p').textContent, '“Centred.”');
  assert.equal(centred.querySelector('figure > figcaption.quote-attribution strong').textContent, 'Oliver Stefani');
  assert.equal(left.querySelectorAll('figure').length, 1, 'the head row is not content');
  assert.equal(left.querySelector('figcaption'), null, 'an empty attribution cell renders no caption');
  assert.equal(panel.querySelectorAll(':scope > table').length, 5, 'non-Quote and malformed tables are left as authored');
  assert.equal(panel.querySelectorAll('table table').length, 1, 'a Quote inside a table cell is left as authored');
  assert.match(panel.textContent, /Before\.[\s\S]*Centred[\s\S]*Left\.[\s\S]*Specs[\s\S]*After\./, 'source order kept');
  delete globalThis.window;
});
