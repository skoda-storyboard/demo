/*
 * DOM tests for the media rails' lightbox binding (#343 review): a click on an asset card opens
 * the lightbox at that card, while the "All" end card keeps its link and opens nothing.
 * Run: node --test blocks/story-rail/story-rail-lightbox.test.mjs
 */
/* global globalThis */
/* eslint-disable import/no-extraneous-dependencies */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<main></main>', { url: 'https://example.com/en/media-room', pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Node = dom.window.Node;
window.hlx = { codeBasePath: '' };
window.matchMedia = () => ({ matches: false, addEventListener() {} });

const { wireMediaLightbox } = await import('./story-rail.js');

const rows = [1, 2].map((n) => ({ title: `Image ${n}`, original: `https://cdn.example/${n}.jpg` }));

function mediaRail() {
  document.body.querySelectorAll('.gallery-overlay').forEach((o) => o.remove());
  const main = document.querySelector('main');
  main.innerHTML = `<div class="carousel"><ul class="carousel-track">
    <li><a class="card-teaser-link" href="https://cdn.example/1.jpg">1</a></li>
    <li><a class="card-teaser-link" href="https://cdn.example/2.jpg">2</a></li>
    <li class="story-rail-all"><a class="story-rail-all-link" href="/en/images">All</a></li>
  </ul></div>`;
  const carousel = main.querySelector('.carousel');
  wireMediaLightbox(carousel, rows);
  return carousel;
}

function click(target) {
  const event = new window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
  target.dispatchEvent(event);
  return event;
}

const overlay = () => document.querySelector('.gallery-overlay');

test('an asset card opens the lightbox at that card', () => {
  const carousel = mediaRail();
  const event = click(carousel.querySelectorAll('.card-teaser-link')[1]);
  assert.equal(event.defaultPrevented, true, 'the file link does not navigate');
  assert.equal(overlay().hidden, false, 'the lightbox is open');
});

test('the "All" end card navigates and opens no lightbox', () => {
  const carousel = mediaRail();
  const event = click(carousel.querySelector('.story-rail-all-link'));
  assert.equal(event.defaultPrevented, false, 'the All link keeps its navigation');
  assert.equal(overlay().hidden, true, 'the lightbox stays closed');
});
