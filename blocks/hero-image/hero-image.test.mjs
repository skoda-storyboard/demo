import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const testWindow = new JSDOM('', { url: 'https://example.com/en/story' }).window;
globalThis.window = testWindow;
globalThis.document = testWindow.document;
globalThis.Node = testWindow.Node;
const { default: decorate } = await import('./hero-image.js');

function block(variant = '', rows = `
  <div><div><picture><img src="/hero.png" alt="Epiq" width="1920" height="1080"></picture></div></div>
  <div><div><h1>Epiq title</h1></div></div>
  <div><div><p>The perex.</p></div></div>
  <div><div><p class="hero-image-meta"><time datetime="2026-09-15">15. 9. 2026</time><a href="/en/category/emobility/">eMobility</a></p></div></div>
`) {
  const { window } = new JSDOM(`<div class="hero-image block ${variant}">${rows}</div>`, {
    url: 'https://example.com/en/story',
  });
  globalThis.document = window.document;
  globalThis.Node = window.Node;
  globalThis.window = window;
  return window.document.querySelector('.hero-image');
}

test('story separates heading, image and caption; date and category remain together', () => {
  const hero = block();
  const img = hero.querySelector('img');
  decorate(hero);
  assert.deepEqual([...hero.children].map((el) => el.className), [
    'hero-image-content', 'hero-image-media', 'hero-image-caption',
  ]);
  assert.equal(hero.querySelector('.hero-image-content h1').textContent, 'Epiq title');
  assert.equal(hero.querySelector('.hero-image-media img'), img, 'keep existing picture editable');
  assert.equal(img.getAttribute('fetchpriority'), 'high');
  assert.equal(img.getAttribute('loading'), 'eager');
  assert.equal(img.getAttribute('width'), '1920');
  assert.deepEqual([...hero.querySelector('.hero-image-caption').children]
    .map((el) => el.className), ['hero-image-perex', 'hero-image-meta']);
  const meta = hero.querySelector('.hero-image-meta');
  assert.equal(meta.querySelector('time').getAttribute('datetime'), '2026-09-15');
  assert.equal(meta.querySelector('a').getAttribute('href'), '/en/category/emobility/');
});

test('story accepts missing heading and date-only or category-only caption', () => {
  const hero = block('', `
    <div><div><picture><img src="/hero.png" alt=""></picture></div></div>
    <div><div><p class="hero-image-meta"><time datetime="2026-09-15">15. 9. 2026</time></p></div></div>
  `);
  decorate(hero);
  assert.deepEqual([...hero.children].map((el) => el.className), [
    'hero-image-media', 'hero-image-caption',
  ]);
  assert.equal(hero.querySelector('.hero-image-meta time').textContent, '15. 9. 2026');

  const category = block('', `
    <div><div><h1>Title</h1></div></div>
    <div><div><p><a href="/en/category/">Category</a></p></div></div>
  `);
  decorate(category);
  assert.equal(category.querySelector('.hero-image-caption .hero-image-meta a').textContent, 'Category');
});

test('story normalizes DA-stripped date markup without duplicating the date or link', () => {
  const hero = block('', `
    <div><div><h1>Title</h1></div></div>
    <div><div><p>15. 9. 2026 <a href="/en/category/">Category</a></p></div></div>
  `);
  decorate(hero);
  const meta = hero.querySelector('.hero-image-meta');
  assert.equal(meta.querySelector('.hero-image-date').textContent, '15. 9. 2026');
  assert.equal(meta.querySelector('a').getAttribute('href'), '/en/category/');
  assert.equal(meta.textContent, '15. 9. 2026Category');
});

test('overlay keeps one content layer after the media and marks the perex', () => {
  const overlay = block('overlay');
  decorate(overlay);
  assert.deepEqual([...overlay.children].map((el) => el.className), [
    'hero-image-media', 'hero-image-content',
  ]);
  assert.equal(overlay.querySelector('.hero-image-content h1').textContent, 'Epiq title');
  assert.equal(overlay.querySelector('.hero-image-perex').textContent, 'The perex.');

  // a template's own classes win: the series badge and the model chip stay as they are
  const series = block('overlay', `
    <div><div><picture><img src="/hero.png" alt=""></picture></div></div>
    <div><div><p class="hero-image-badge">Series</p><h1>130 years</h1><p>Standfirst</p></div></div>
  `);
  decorate(series);
  assert.deepEqual([...series.querySelectorAll('.hero-image-content p')].map((p) => p.className), [
    'hero-image-badge', 'hero-image-perex',
  ]);
});

test('archive renders the band and turns the h1 lines into label chips', () => {
  const archive = block('archive', `
    <div><div><picture><img src="/banner.jpg" alt="" width="1920" height="369"></picture></div></div>
    <div><div><h1>Models<br>Peaq</h1></div></div>
  `);
  decorate(archive);
  assert.deepEqual([...archive.children].map((el) => el.className), [
    'hero-image-media', 'hero-image-content',
  ]);
  const img = archive.querySelector('.hero-image-media img');
  assert.equal(img.getAttribute('fetchpriority'), 'high');
  assert.equal(img.getAttribute('loading'), 'eager');
  const h1 = archive.querySelector('.hero-image-content h1');
  assert.deepEqual([...h1.querySelectorAll('.hero-image-label')].map((l) => l.textContent), ['Models', 'Peaq']);
  assert.equal(h1.textContent, 'Models Peaq', 'the accessible name keeps a space between labels');
  assert.equal(h1.querySelector('br'), null);
});

test('archive link lines become link chips; the accessible name keeps the space', () => {
  const archive = block('archive', `
    <div><div><picture><img src="/banner.jpg" alt=""></picture></div></div>
    <div><div><h1><a href="/en/category/lifestyle">Lifestyle</a><br><a href="/en/category/lifestyle/people">People</a></h1></div></div>
  `);
  decorate(archive);
  const h1 = archive.querySelector('h1');
  const chips = [...h1.querySelectorAll('.hero-image-label')];
  assert.deepEqual(chips.map((c) => [c.tagName, c.textContent, c.getAttribute('href')]), [
    ['A', 'Lifestyle', '/en/category/lifestyle'],
    ['A', 'People', '/en/category/lifestyle/people'],
  ]);
  assert.equal(h1.textContent, 'Lifestyle People');
  assert.equal(h1.querySelector('span'), null, 'a link line is not wrapped again');
});

test('archive without a banner keeps an empty band; an h1 without breaks is one chip', () => {
  const archive = block('archive', `
    <div><div></div></div>
    <div><div><h1>Design &amp; Engineering</h1></div></div>
  `);
  decorate(archive);
  const media = archive.querySelector('.hero-image-media');
  assert.ok(media, 'the band renders without an image');
  assert.equal(media.children.length, 0);
  assert.deepEqual([...archive.querySelectorAll('.hero-image-label')].map((l) => l.textContent), [
    'Design & Engineering',
  ]);

  const imageOnly = block('archive', '<div><div><picture><img src="/banner.jpg" alt=""></picture></div></div>');
  decorate(imageOnly);
  assert.deepEqual([...imageOnly.children].map((el) => el.className), ['hero-image-media']);
});
