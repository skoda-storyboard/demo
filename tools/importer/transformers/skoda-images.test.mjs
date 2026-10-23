import { test } from 'node:test';
import assert from 'node:assert/strict';
// eslint-disable-next-line import/no-extraneous-dependencies
import { JSDOM } from 'jsdom';
import transform from './skoda-images.js';
import flattenStory from '../parsers/story-flatten.js';

// the importers' call (SKODA-509): the transformer hook on `afterTransform`
const normalizeImages = (root, document) => transform('afterTransform', root, document ? { document } : {});

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

// SKODA-703: a lone linked image with an empty alt leaves its link unnamed (the Classic Days
// chapters' Columns cells and body photos, also on the source)
test('backfills the alt of a lone linked image: caption, title, nearest heading, page h1; never the file name', () => {
  const titled = normalize('<p><a href="/a.jpg" title="Škoda 110 R Coupé"><img src="12_skoda-110-r.jpg" alt=""></a></p>');
  assert.equal(titled.querySelector('img').getAttribute('alt'), 'Škoda 110 R Coupé', 'a non-blank link title');
  const captioned = normalize('<p><a href="/a.jpg" title=" "><img src="a.jpg" alt="" data-caption="The 110 R at Classic Days"></a></p>');
  assert.equal(captioned.querySelector('img').getAttribute('alt'), 'The 110 R at Classic Days', 'the editorial caption first');
  const underHeading = normalize('<h2>Škoda Felicia (1959–1964)</h2><p>Text.</p><table><tr><td><a href="/b.jpg" title=" "><img src="19_felicia.jpg" alt=""></a></td></tr></table>');
  assert.equal(underHeading.querySelector('img').getAttribute('alt'), 'Škoda Felicia (1959–1964)', 'the nearest heading before it, also in a block cell');
  const pageOnly = normalize('<h1>Classic Days 2026</h1><div><a href="/c.jpg"><img src="koda-rapid_yellow.jpg" alt=""></a></div>');
  assert.equal(pageOnly.querySelector('img').getAttribute('alt'), 'Classic Days 2026');
  [titled, captioned, underHeading, pageOnly].forEach((root) => assert.doesNotMatch(root.querySelector('img').getAttribute('alt'), /\.jpe?g|_/, 'never the file name'));
});

test('leaves a decorative empty alt alone when the image is not a lone linked image', () => {
  const card = normalize('<h2>Peaq</h2><p><a href="/en/peaq"><img src="p.jpg" alt=""> Peaq first glimpse</a></p>');
  assert.equal(card.querySelector('img').getAttribute('alt'), '', 'the link has its own text');
  const plain = normalize('<h2>Peaq</h2><p><img src="p.jpg" alt=""></p>');
  assert.equal(plain.querySelector('img').getAttribute('alt'), '', 'not a link: decorative stays decorative');
  const authored = normalize('<h2>Peaq</h2><p><a href="/p.jpg"><img src="p.jpg" alt="Authored"></a></p>');
  assert.equal(authored.querySelector('img').getAttribute('alt'), 'Authored');
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

// SKODA-508: press-release teaser/card thumbnails carry the article excerpt, not a caption.
const EXCERPT = 'Mladá Boleslav, 2. September 2026 – Škoda Auto today announced changes';

test('does not caption the lead teaser image with the perex (div.article-teaser)', () => {
  const root = normalize(`<div class="article-teaser promo-box-item"><div class="article-teaser-media">
    <div class="entry-thumbnail media-cart-image"><a class="colorbox" href="https://cdn.example/logo.png">
      <div class="image-holder"><img src="logo-1440x810.png" alt="Lead" class="media-cart-image"
        data-caption="${EXCERPT}" data-video_title="${EXCERPT}"></div></a></div></div></div>`);
  assert.equal(root.querySelectorAll('figure, figcaption').length, 0);
  assert.doesNotMatch(root.textContent, /Mladá Boleslav/);
  assert.equal(root.querySelector('a[href="https://cdn.example/logo.png"] img').getAttribute('alt'), 'Lead');
});

test('does not emit excerpt paragraphs for related cards and keeps the image-only link as is', () => {
  const root = normalize(`<div class="search-results type-press_release"><article class="article-teaser press_release">
    <div class="article-teaser-media"><div class="entry-thumbnail media-cart-image"><a class="colorbox" href="">
      <div class="image-holder"><img src="card-768x493.jpg" alt="Card" class="media-cart-image"
        data-caption="${EXCERPT}" data-video_title="${EXCERPT}"></div></a></div></div>
    <h3 class="entry-title"><a href="/en/press-releases/card">Card title</a></h3></article></div>`);
  assert.equal(root.querySelectorAll('figcaption').length, 0);
  assert.doesNotMatch(root.textContent, /Mladá Boleslav/);
  assert.equal(root.querySelector('a[href=""] img').getAttribute('alt'), 'Card');
  assert.equal(root.querySelector('h3 a').textContent, 'Card title');
});

test('ignores a data-caption that only mirrors data-video_title outside a card', () => {
  const root = normalize(`<p><img src="a.jpg" alt="A" data-caption="${EXCERPT}" data-video_title="${EXCERPT}"></p>`
    + `<div data-caption="${EXCERPT}" data-video_title="${EXCERPT}"><img src="b.jpg" alt="B"></div>`);
  assert.equal(root.querySelectorAll('figcaption').length, 0);
  assert.doesNotMatch(root.textContent, /Mladá Boleslav/);
});

test('keeps an editorial caption that differs from data-video_title', () => {
  const root = normalize('<p><img src="a.jpg" alt="A" data-caption="Head of Design at the premiere" data-video_title="Epiq premiere"></p>');
  assert.equal(root.querySelector('figure figcaption').textContent, 'Head of Design at the premiere');
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

// --- the transformer hook signature (SKODA-509) ----------------------------------------------
test('the hook acts on afterTransform only: other hooks leave the page untouched', () => {
  const html = '<p>Before <img src="a.jpg" alt="A" data-caption="Caption"> after</p>';
  ['beforeTransform', 'preprocess', 'transform', undefined].forEach((hook) => {
    const doc = new JSDOM(`<main>${html}</main>`).window.document;
    const main = doc.querySelector('main');
    transform(hook, main, { document: doc });
    assert.equal(main.innerHTML, html, `${hook}: no change`);
  });
  const doc = new JSDOM(`<main>${html}</main>`).window.document;
  transform('afterTransform', doc.querySelector('main'), { document: doc });
  assert.ok(doc.querySelector('main > figure > div > img'), 'afterTransform: the image is lifted into a figure');
});

test('the hook builds with payload.document, or the element\'s own document without one', () => {
  const html = '<p>Before <img src="a.jpg" alt="A" data-caption="Caption"> after</p>';
  const doc = new JSDOM(`<main>${html}</main>`).window.document;
  const created = [];
  const payloadDoc = new Proxy(doc, {
    get(target, key) {
      const value = Reflect.get(target, key);
      if (key === 'createElement') return (tag) => { created.push(tag); return target.createElement(tag); };
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
  transform('afterTransform', doc.querySelector('main'), { document: payloadDoc });
  assert.ok(created.includes('figure'), 'the figure is created through payload.document');
  const own = new JSDOM(`<main>${html}</main>`).window.document;
  transform('afterTransform', own.querySelector('main'), {});
  transform('afterTransform', own.querySelector('main')); // no payload at all
  assert.equal(own.querySelectorAll('main figure').length, 1, 'ownerDocument fallback, idempotent on a second run');
});

test('skoda-images.js exports only the hook, as the transformer validator requires', async () => {
  const { readFile } = await import('node:fs/promises');
  const src = (await readFile(new URL('./skoda-images.js', import.meta.url), 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '');
  assert.match(src, /^export default function transform\(hookName, element, payload\)/m);
  assert.deepEqual(src.match(/^[ \t]*export\b.*$/gm), ['export default function transform(hookName, element, payload) {']);
  assert.doesNotMatch(src, /^[ \t]*import\b/m, 'no imports either: a classic script can\'t have them');
});
