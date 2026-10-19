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

test('each row becomes one entry: year pill, title heading, image and description, in order', { skip: !JSDOM }, () => {
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
  const title = first.querySelector('h3.timeline-title');
  assert.equal(title.querySelector('strong').textContent, 'VOITURETTE A');
  assert.equal(title.querySelectorAll('br').length, 2, 'the title lines kept');
  assert.equal(first.querySelector('.timeline-media img').getAttribute('loading'), 'lazy');
  assert.equal(first.querySelector('.timeline-text a').getAttribute('href'), '/en/x', 'description links kept');
  assert.equal(entries[1].querySelector('.timeline-year').textContent, '1925');
});

test('a title of several paragraphs is one heading, its paragraphs as lines', { skip: !JSDOM }, () => {
  const block = blockFrom(row('2000', '<p>Handsfree</p><p>(2000)</p>', '', '<p>Text.</p>'));
  decorate(block);
  const title = block.querySelector('.timeline-title');
  assert.equal(title.querySelectorAll('p').length, 0);
  assert.equal(title.querySelectorAll('br').length, 1);
  assert.equal(title.textContent, 'Handsfree (2000)', 'the lines apart in the accessible name');
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

test('the title lines keep a space before each break, for the accessible name', { skip: !JSDOM }, () => {
  const block = blockFrom(row('1905', '<p>Laurin &amp; Klement<br><strong>VOITURETTE A</strong><br>(vehicle on display: 1905)</p>', '', '<p>Text.</p>'));
  decorate(block);
  const title = block.querySelector('.timeline-title');
  assert.equal(title.textContent.replace(/\s+/g, ' '), 'Laurin & Klement VOITURETTE A (vehicle on display: 1905)');
  assert.equal(title.querySelectorAll('br').length, 2, 'the breaks stay');
  assert.equal(title.querySelector('strong').textContent, 'VOITURETTE A', 'the model stays bold');
});
