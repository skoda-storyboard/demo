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

  // a second accordion on the page: its own items, ids and quote, the first one untouched
  const second = document.createElement('div');
  second.className = 'accordion';
  second.innerHTML = '<div><div><h2>Two</h2></div><div><table><tr><td>Quote</td></tr>'
    + '<tr><td><p>Other.</p></td><td></td></tr></table></div></div>';
  section.append(second);
  console.error = () => {};
  try {
    decorate(second);
    await new Promise((resolve) => { setTimeout(resolve, 200); });
  } finally {
    console.error = error;
  }
  const ids = [...document.querySelectorAll('.accordion-panel')].map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length, 'unique panel ids across instances');
  assert.equal(second.querySelectorAll('div.quote').length, 1);
  assert.equal(panel.querySelectorAll('div.quote').length, 2, 'the first accordion keeps its own quotes');
  block.querySelector('button').click();
  second.querySelector('button').click();
  second.querySelector('button').click();
  assert.equal(panel.hidden, false, 'toggling the second accordion leaves the first one open');
  assert.equal(second.querySelector('.accordion-panel').hidden, true);
  delete globalThis.window;
});

// --- FAQ variant (SKODA-807): FAQPage structured data -------------------------------------
const faqDom = (html) => {
  const dom = new JSDOM(`<!DOCTYPE html><html><head></head><body><main>${html}</main></body></html>`, { url: 'https://example.com/en/press-kits/kit/frequently-asked-questions' });
  globalThis.document = dom.window.document;
  return dom.window.document;
};
const faqScripts = (doc) => [...doc.head.querySelectorAll('script[type="application/ld+json"]')];

test('Accordion (faq) emits one FAQPage JSON-LD with every complete Q/A, whitespace normalised', { skip: !JSDOM }, () => {
  const doc = faqDom(`<div class="accordion faq">
    <div><div><h2 class="row-title"><span>What is the  Škoda Peaq?</span></h2></div><div><p>The new
      <strong>flagship</strong>.</p><p>Seven seats.</p></div></div>
    <div><div><h2>How far does it go?</h2></div><div><ul><li>Up to 600 km</li></ul></div></div>
    <div><div>Incomplete row</div></div>
  </div>`);
  decorate(doc.querySelector('.accordion'));
  const scripts = faqScripts(doc);
  assert.equal(scripts.length, 1);
  const data = JSON.parse(scripts[0].textContent);
  assert.equal(data['@context'], 'https://schema.org');
  assert.equal(data['@type'], 'FAQPage');
  assert.deepEqual(data.mainEntity, [
    { '@type': 'Question', name: 'What is the Škoda Peaq?', acceptedAnswer: { '@type': 'Answer', text: 'The new flagship. Seven seats.' } },
    { '@type': 'Question', name: 'How far does it go?', acceptedAnswer: { '@type': 'Answer', text: 'Up to 600 km' } },
  ]);
  // the accordion itself behaves as the default variant
  assert.equal(doc.querySelectorAll('.accordion button[aria-expanded="false"]').length, 2);
  assert.match(doc.querySelector('.accordion').textContent, /Incomplete row/);
});

test('FAQ answer text keeps table cells and rows apart (PR #263 review)', { skip: !JSDOM }, () => {
  const doc = faqDom(`<div class="accordion faq">
    <div><div><h2>What is the range?</h2></div><div><p>It depends on the battery:</p><table>
      <thead><tr><th>Variant</th><th>Range</th></tr></thead>
      <tbody><tr><td>Peaq 60</td><td>450 km</td></tr><tr><td>Peaq 90</td><td>640 km</td></tr></tbody>
    </table></div></div>
  </div>`);
  decorate(doc.querySelector('.accordion'));
  const [entry] = JSON.parse(faqScripts(doc)[0].textContent).mainEntity;
  assert.equal(entry.acceptedAnswer.text, 'It depends on the battery: Variant Range Peaq 60 450 km Peaq 90 640 km');
});

test('two FAQ accordions share one FAQPage; a plain accordion adds nothing', { skip: !JSDOM }, () => {
  const doc = faqDom(`<div class="accordion faq"><div><div><h2>Q1</h2></div><div><p>A1</p></div></div></div>
    <div class="accordion"><div><div><h2>Not FAQ</h2></div><div><p>Topical toggle</p></div></div></div>
    <div class="accordion faq"><div><div><h2>Q2</h2></div><div><p>A2</p></div></div></div>`);
  doc.querySelectorAll('.accordion').forEach((block) => decorate(block));
  const scripts = faqScripts(doc);
  assert.equal(scripts.length, 1);
  assert.deepEqual(JSON.parse(scripts[0].textContent).mainEntity.map((q) => q.name), ['Q1', 'Q2']);
});

test('an FAQ decorated in a detached fragment counts, mounted or not, alongside the page FAQ (PR #263 review)', { skip: !JSDOM }, () => {
  const doc = faqDom('<div class="accordion faq"><div><div><h2>Page Q</h2></div><div><p>Page A</p></div></div></div>');
  const faqData = () => JSON.parse(faqScripts(doc)[0].textContent).mainEntity.map((q) => q.name);
  decorate(doc.querySelector('.accordion'));
  // blocks/fragment: decorateMain + loadSections run on a detached <main>, then its children move in
  const fragment = doc.createElement('main');
  fragment.innerHTML = '<div class="section"><div class="accordion-wrapper"><div class="accordion faq">'
    + '<div><div><h2>Fragment Q</h2></div><div><p>Fragment A</p></div></div></div></div></div>';
  decorate(fragment.querySelector('.accordion'));
  assert.equal(fragment.isConnected, false);
  assert.deepEqual(faqData(), ['Page Q', 'Fragment Q'], 'the detached fragment FAQ is kept');
  doc.querySelector('main').append(...fragment.childNodes);
  // a later FAQ on the page re-renders the data: the now-mounted fragment block stays in
  const later = doc.createElement('div');
  later.className = 'accordion faq';
  later.innerHTML = '<div><div><h2>Later Q</h2></div><div><p>Later A</p></div></div>';
  doc.querySelector('main').append(later);
  decorate(later);
  assert.deepEqual(faqData(), ['Page Q', 'Fragment Q', 'Later Q']);
  assert.equal(faqScripts(doc).length, 1);
});

test('an FAQ that was on the page and is removed drops out on the next FAQ decoration', { skip: !JSDOM }, () => {
  const doc = faqDom(`<div class="accordion faq" id="gone"><div><div><h2>Gone Q</h2></div><div><p>A</p></div></div></div>
    <div class="accordion faq" id="kept"><div><div><h2>Kept Q</h2></div><div><p>A</p></div></div></div>`);
  decorate(doc.getElementById('gone'));
  decorate(doc.getElementById('kept'));
  doc.getElementById('gone').remove();
  const next = doc.createElement('div');
  next.className = 'accordion faq';
  next.innerHTML = '<div><div><h2>Next Q</h2></div><div><p>A</p></div></div>';
  doc.querySelector('main').append(next);
  decorate(next);
  assert.deepEqual(JSON.parse(faqScripts(doc)[0].textContent).mainEntity.map((q) => q.name), ['Kept Q', 'Next Q']);
});

test('a page with only plain accordions, or an FAQ with no complete row, gets no JSON-LD', { skip: !JSDOM }, () => {
  const plain = faqDom('<div class="accordion"><div><div><h2>Q</h2></div><div><p>A</p></div></div></div>');
  decorate(plain.querySelector('.accordion'));
  assert.equal(faqScripts(plain).length, 0);
  const empty = faqDom('<div class="accordion faq"><div><div>Only a summary</div></div></div>');
  decorate(empty.querySelector('.accordion'));
  assert.equal(faqScripts(empty).length, 0);
});

test('CSS: answer starts 10px under its question at full width; the plus sits in a 32px round box', async () => {
  const { readFile } = await import('node:fs/promises');
  const css = await readFile(new URL('./accordion.css', import.meta.url), 'utf8');
  const rule = (selector) => css.match(new RegExp(`(?:^|\\n)${selector.replace(/[.[\]="]/g, '\\$&')} \\{([^}]+)\\}`))?.[1] || '';
  assert.match(rule('.accordion .accordion-panel'), /padding: var\(--accordion-panel-inset\) 0;/);
  assert.match(rule('.accordion'), /--accordion-panel-inset: var\(--page-gutter\);/);
  assert.match(rule('.accordion'), /--accordion-icon-box: calc\(var\(--accordion-icon-size\) \+ 2 \* var\(--accordion-icon-pad\)\);/);
  assert.match(rule('.accordion .accordion-icon'), /padding: var\(--accordion-icon-pad\);/);
  assert.match(rule('.accordion .accordion-icon'), /border-radius: 50%;/);
  assert.match(rule('.accordion .accordion-heading button[aria-expanded="true"] .accordion-icon'), /transform: rotate\(45deg\);/);
  // answer lists as on the source (PR #263 review): 16px after each item, no list margin, a dash
  assert.match(rule('.accordion .accordion-panel ul'), /margin-block-end: 0;[\s\S]*list-style: none;/);
  assert.match(rule('.accordion .accordion-panel ul > li'), /margin-block-end: var\(--accordion-list-item-gap\);/);
  assert.match(rule('.accordion'), /--accordion-list-item-gap: var\(--spacing-m\);/);
  assert.match(rule('.accordion .accordion-panel ul > li::before'), /border-block-end: var\(--accordion-bullet-weight\) solid var\(--skoda-black\);/);
});

