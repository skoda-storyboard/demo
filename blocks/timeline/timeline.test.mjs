import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

/* global globalThis */
let JSDOM;
try {
  ({ JSDOM } = createRequire(import.meta.url)('jsdom'));
} catch { /* importer validator may have no test dependencies */ }

const decorate = JSDOM ? (await import('./timeline.js')).default : null;

function blockFrom(html) {
  const dom = new JSDOM(`<div class="timeline">${html}</div>`);
  globalThis.document = dom.window.document;
  return dom.window.document.querySelector('.timeline');
}

const row = (year, title, image, description) => `<div>
  <div>${year}</div><div>${title}</div><div>${image}</div><div>${description}</div></div>`;
const picture = (src) => `<picture><source srcset="${src}"><img src="${src}" alt=""></picture>`;

test('each row becomes one entry: year pill, title, image and description, in order', { skip: !JSDOM }, () => {
  const block = blockFrom(row(
    '1905',
    '<p>Laurin &amp; Klement<br><strong>VOITURETTE A</strong><br>(vehicle on display: 1905)</p>',
    picture('a.jpg'),
    '<p>The first car, with a <a href="/en/x">link</a>.</p>',
  )
    + row('1925', '<p><strong>ŠKODA 110</strong></p>', picture('b.jpg'), '<p>A third pedal.</p>'));
  decorate(block);
  const list = block.querySelector(':scope > ol.timeline-list');
  assert.ok(list, 'an ordered list');
  const entries = [...list.children];
  assert.equal(entries.length, 2);
  const [first] = entries;
  assert.deepEqual(
    [...first.children].map((c) => c.className),
    ['timeline-year', 'timeline-title', 'timeline-media', 'timeline-text'],
  );
  assert.equal(first.querySelector('.timeline-year').textContent, '1905');
  const title = first.querySelector('div.timeline-title');
  assert.equal(block.querySelectorAll('h1, h2, h3, h4, h5, h6').length, 0, 'titles are paragraphs, as the source widget');
  assert.equal(title.querySelectorAll(':scope > p').length, 1);
  assert.equal(title.querySelector('strong').textContent, 'VOITURETTE A');
  assert.equal(title.querySelectorAll('br').length, 2, 'the title lines kept');
  assert.equal(first.querySelector('.timeline-media img').getAttribute('loading'), 'lazy');
  assert.equal(first.querySelector('.timeline-text a').getAttribute('href'), '/en/x', 'description links kept');
  assert.equal(entries[1].querySelector('.timeline-year').textContent, '1925');
});

test('a title of several paragraphs keeps them, each with its role (maker, model, note)', { skip: !JSDOM }, () => {
  const block = blockFrom(row('1905', '<p>LAURIN &amp; KLEMENT</p><p><strong>VOITURETTE A</strong></p><p>(vehicle on display: 1905)</p>', '', '<p>Text.</p>'));
  decorate(block);
  const paragraphs = [...block.querySelectorAll('.timeline-title > p')];
  assert.deepEqual(paragraphs.map((p) => p.textContent), ['LAURIN & KLEMENT', 'VOITURETTE A', '(vehicle on display: 1905)']);
  assert.deepEqual(paragraphs.map((p) => p.className), ['', 'timeline-title-model', 'timeline-title-note']);
  assert.equal(block.querySelector('h3'), null);
});

test('authors may omit cells: no image, no year, an empty row', { skip: !JSDOM }, () => {
  const block = blockFrom(`
    <div><div>1932</div><div><p><strong>ŠKODA 860</strong></p></div><div><p>Levers appeared.</p></div></div>
    <div><div><p>A milestone without a year, its title in the first cell</p></div><div><p>Its description.</p></div></div>
    <div><div></div><div> </div></div>`);
  decorate(block);
  const entries = [...block.querySelectorAll('.timeline-entry')];
  assert.equal(entries.length, 2, 'the empty row is dropped');
  assert.equal(entries[0].querySelector('.timeline-media'), null, 'no image, no media');
  assert.equal(entries[0].querySelector('.timeline-text').textContent, 'Levers appeared.');
  assert.equal(entries[1].querySelector('.timeline-year'), null, 'no year, no pill');
  assert.match(entries[1].querySelector('.timeline-title').textContent, /without a year/);
  assert.equal(entries[1].querySelector('.timeline-text').textContent, 'Its description.');
});

test('the image cell is found by content wherever it sits', { skip: !JSDOM }, () => {
  const block = blockFrom(`<div><div>1959</div><div>${picture('c.jpg')}</div><div><p>ŠKODA 450</p></div><div><p>The horn again.</p></div></div>`);
  decorate(block);
  const entry = block.querySelector('.timeline-entry');
  assert.equal(entry.querySelector('.timeline-media img').getAttribute('src'), 'c.jpg');
  assert.equal(entry.querySelector('.timeline-title').textContent, 'ŠKODA 450');
  assert.equal(entry.querySelector('.timeline-text').textContent, 'The horn again.');
});

test('a media cell of several images keeps them all, in order', { skip: !JSDOM }, () => {
  const block = blockFrom(row(
    '1970',
    '<p><strong>ŠKODA 110 R + ŠKODA 130 RS</strong></p>',
    `<p>${picture('r.jpg')}</p><p>${picture('rs.jpg')}</p>`,
    '<p>The coupé and the rally car.</p>',
  ));
  decorate(block);
  const media = block.querySelector('.timeline-media');
  assert.equal(media.querySelectorAll(':scope > picture').length, 2, 'both pictures, nothing nested twice');
  assert.deepEqual(
    [...media.querySelectorAll('img')].map((img) => [img.getAttribute('src'), img.getAttribute('loading')]),
    [['r.jpg', 'lazy'], ['rs.jpg', 'lazy']],
  );
});

test('a one-paragraph title keeps its line breaks and bold model; it is neither model nor note', { skip: !JSDOM }, () => {
  const block = blockFrom(row('1905', '<p>Laurin &amp; Klement<br><strong>VOITURETTE A</strong><br>(vehicle on display: 1905)</p>', '', '<p>Text.</p>'));
  decorate(block);
  const [p] = block.querySelectorAll('.timeline-title > p');
  assert.equal(p.querySelectorAll('br').length, 2, 'the breaks stay');
  assert.equal(p.querySelector('strong').textContent, 'VOITURETTE A', 'the model stays bold');
  assert.equal(p.className, '', 'a mixed line is the maker line');
});

test('the fifth cell is the space above the title, in px; anything else is ignored', { skip: !JSDOM }, () => {
  const spaced = (space) => `<div><div>1905</div><div><p>Title</p></div><div></div><div><p>Text.</p></div><div>${space}</div></div>`;
  const block = blockFrom(spaced('15') + spaced('44px') + spaced('') + spaced('a lot') + spaced('999'));
  decorate(block);
  const values = [...block.querySelectorAll('.timeline-entry')].map((li) => li.style.getPropertyValue('--timeline-title-space'));
  assert.deepEqual(values, ['15px', '44px', '', '', '200px'], 'clamped to 200px');
  assert.match(block.querySelector('.timeline-text').textContent, /Text\./, 'the fifth cell is not the description');
});

test('a full four-cell row keeps its columns: a blank image or year cell is a blank value', { skip: !JSDOM }, () => {
  const block = blockFrom(`
    <div><div>1905</div><div><p><strong>VOITURETTE A</strong></p></div><div></div><div><p>The first car, with a <a href="https://goo.gl/G1gxYm">link</a>.</p></div></div>
    <div><div> </div><div><p><strong>ŠKODA 110</strong></p></div><div>${picture('b.jpg')}</div><div><p>A third pedal, <a href="/en/x">more</a>.</p></div></div>
    <div><div></div><div><p>Only a title</p></div><div></div><div></div></div>`);
  decorate(block);
  const [blankImage, blankYear, titleOnly] = block.querySelectorAll('.timeline-entry');
  assert.equal(blankImage.querySelector('.timeline-media'), null, 'no image, no media');
  assert.match(blankImage.querySelector('.timeline-text').textContent, /The first car/, 'the description kept');
  assert.equal(blankImage.querySelector('.timeline-text a').getAttribute('href'), 'https://goo.gl/G1gxYm');
  assert.equal(blankImage.querySelector('.timeline-title').textContent.trim(), 'VOITURETTE A');
  assert.equal(blankYear.querySelector('.timeline-year'), null, 'a blank year, no pill');
  assert.equal(blankYear.querySelector('.timeline-title').textContent.trim(), 'ŠKODA 110', 'the title stays the title');
  assert.ok(blankYear.querySelector('.timeline-media img'));
  assert.match(blankYear.querySelector('.timeline-text').textContent, /A third pedal/, 'the description kept');
  assert.equal(titleOnly.querySelector('.timeline-text'), null);
  assert.equal(titleOnly.querySelector('.timeline-title').textContent, 'Only a title');
});

test('every timeline link opens in a new tab, as the source widget', { skip: !JSDOM }, () => {
  const block = blockFrom(row(
    '1905',
    '<p>Laurin &amp; Klement</p>',
    picture('a.jpg'),
    '<p><a href="https://goo.gl/G1gxYm">FAVORIT</a> and <a href="/en/x" rel="noreferrer">more</a></p>',
  ));
  decorate(block);
  const links = [...block.querySelectorAll('.timeline-text a')];
  assert.equal(links.length, 2);
  links.forEach((a) => assert.equal(a.getAttribute('target'), '_blank'));
  assert.equal(links[0].getAttribute('rel'), 'noopener', 'a non-source-host link');
  assert.deepEqual(links[1].getAttribute('rel').split(' ').sort(), ['noopener', 'noreferrer'], 'existing rel kept');
});

test('a timeline leading its section drops the prose gap above; one after content keeps it', { skip: !JSDOM }, () => {
  const dom = new JSDOM(`<main>
    <div class="section"><div class="timeline-wrapper"><div class="timeline"><div><div>1905</div><div><p>A</p></div><div></div><div><p>Text.</p></div></div></div></div></div>
    <div class="section"><div class="default-content-wrapper"><p>Prose.</p></div><div class="timeline-wrapper"><div class="timeline"><div><div>1905</div><div><p>A</p></div><div></div><div><p>Text.</p></div></div></div></div></div>
  </main>`);
  globalThis.document = dom.window.document;
  const [leading, following] = dom.window.document.querySelectorAll('.timeline');
  decorate(leading);
  decorate(following);
  assert.equal(leading.dataset.position, 'leading');
  assert.equal(following.dataset.position, undefined);
});
