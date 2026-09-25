import { test } from 'node:test';
import assert from 'node:assert/strict';
// eslint-disable-next-line import/no-extraneous-dependencies
import { JSDOM } from 'jsdom';
import normalizeImages from './skoda-images.js';
import flattenStory from '../parsers/story-flatten.js';

function normalize(html) {
  const doc = new JSDOM(`<main>${html}</main>`).window.document;
  normalizeImages(doc.querySelector('main'), doc);
  return doc.querySelector('main');
}

test('lifts an inline image without losing adjacent formatted prose', () => {
  const root = normalize('<p><strong>Before</strong> <img src="a.jpg" alt="A" data-caption="Source caption"> <em>After</em></p>');
  const figure = root.querySelector('figure');
  assert.ok(figure);
  assert.equal(figure.querySelector('div > img').getAttribute('alt'), 'A');
  assert.equal(figure.querySelector('figcaption').textContent, 'Source caption');
  assert.equal(root.querySelectorAll('p').length, 2);
  assert.equal(root.querySelector('p strong').textContent, 'Before');
  assert.equal(root.querySelector('p:last-child em').textContent, 'After');
});

test('preserves an image-only link when lifting it from a paragraph', () => {
  const root = normalize('<p>Intro <a href="/en/details"><img src="a.jpg" alt="A"></a> more</p>');
  assert.equal(root.querySelector('a[href="/en/details"] > div > img').getAttribute('alt'), 'A');
  assert.match(root.textContent, /Intro\s+more/);
});

test('keeps native figure caption and adds only a missing data-caption', () => {
  const root = normalize('<figure><img src="a.jpg" data-caption="Fallback" alt="A"><figcaption>Original</figcaption></figure>'
    + '<figure><img src="b.jpg" data-caption="Other" alt="B"></figure>');
  const [first, second] = root.querySelectorAll('figure');
  assert.equal(first.querySelector('figcaption').textContent, 'Original');
  assert.equal(first.querySelectorAll('figcaption').length, 1);
  assert.equal(second.querySelector('figcaption').textContent, 'Other');
  assert.equal(first.querySelector('div > img').getAttribute('alt'), 'A');
  assert.equal(second.querySelector('div > img').getAttribute('alt'), 'B');
  normalizeImages(root);
  assert.equal(root.querySelectorAll('figcaption').length, 2);
});

test('materializes data-caption on a single-image wrapper', () => {
  const root = normalize('<div data-caption="Wrapper caption"><img src="a.jpg" alt="A"></div>');
  assert.equal(root.querySelector('figure > div > img').getAttribute('alt'), 'A');
  assert.equal(root.querySelector('figcaption').textContent, 'Wrapper caption');
});

test('merged story flatten and shared normalizer preserve inline editorial captions', () => {
  const doc = new JSDOM(`
    <div class="content"><div class="panel-layout"><div class="panel-grid">
      <div class="panel-grid-cell"><div class="so-panel widget widget_sow-editor">
        <div class="siteorigin-widget-tinymce textwidget">
          <p>Before <span data-caption="Wrapper caption"><img src="a.jpg" alt="A"></span> after</p>
        </div>
      </div></div>
    </div></div></div>`).window.document;
  const content = doc.querySelector('.content');
  flattenStory(content, { document: doc });
  normalizeImages(content, doc);
  assert.equal(content.querySelector('figure > div > img').getAttribute('alt'), 'A');
  assert.equal(content.querySelector('figcaption').textContent, 'Wrapper caption');
  assert.match(content.textContent, /Before/);
  assert.match(content.textContent, /after/);
});

test('does not change gallery cells; the block parser supplies the caption cell', () => {
  const root = normalize('<table><tr><td><img src="a.jpg" alt="A" data-caption="Caption"></td><td>Caption</td></tr></table>');
  assert.equal(root.querySelectorAll('figure').length, 0);
  assert.equal(root.querySelector('td:first-child > img').getAttribute('alt'), 'A');
});

test('reports empty and missing alt separately without fabricating either', () => {
  const seen = [];
  const { warn } = console;
  console.warn = (message) => seen.push(message);
  try {
    const root = normalize('<p><img src="a.jpg" alt=""></p><p><img src="b.jpg"></p>');
    assert.equal(root.querySelector('img[src="a.jpg"]').getAttribute('alt'), '');
    assert.equal(root.querySelector('img[src="b.jpg"]').hasAttribute('alt'), false);
  } finally {
    console.warn = warn;
  }
  assert.match(seen[0], /empty alt: a.jpg/);
  assert.match(seen[1], /missing alt: b.jpg/);
});
