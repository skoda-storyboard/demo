/*
 * DOM tests for story-rail's focus hand-off when a rail collapses (SKODA-611b review): focus in a
 * removed rail moves to the next visible, enabled control, never to a hidden one or to <body>.
 * jsdom has no layout, so getClientRects is stubbed: hidden elements report no boxes.
 * Run: node --test blocks/story-rail/story-rail-focus.test.mjs
 */
/* global globalThis */
/* eslint-disable import/no-extraneous-dependencies */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<main></main>', { url: 'https://example.com/en', pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.Node = dom.window.Node;
window.hlx = { codeBasePath: '' };
window.matchMedia = () => ({ matches: false, addEventListener() {} });
// boxes for everything except elements marked as not rendered
window.Element.prototype.getClientRects = function rects() {
  return this.closest('[data-unrendered]') ? [] : [{ width: 1, height: 1 }];
};

const { keepFocusPast } = await import('./story-rail.js');

function page(html) {
  document.querySelector('main').innerHTML = html;
  return document.querySelector('main');
}

test('focus in a removed rail moves to the next visible control after it', () => {
  const main = page(`<a href="/before">before</a>
    <div class="section rail"><a class="pill" href="/en/news">All</a></div>
    <a href="/hidden" hidden>hidden</a>
    <a href="/unrendered" data-unrendered>unrendered</a>
    <button disabled>disabled</button>
    <input type="hidden" value="x">
    <a class="next" href="/next">next</a>`);
  main.querySelector('.pill').focus();
  const rail = main.querySelector('.rail');
  keepFocusPast(rail);
  assert.equal(document.activeElement, main.querySelector('.next'));
});

test('focus outside the removed rail is left alone', () => {
  const main = page('<a class="other" href="/o">o</a><div class="rail"><a href="/x">x</a></div><a href="/n">n</a>');
  main.querySelector('.other').focus();
  keepFocusPast(main.querySelector('.rail'));
  assert.equal(document.activeElement, main.querySelector('.other'));
});

test('a rail at the end of the page with nothing focusable after it leaves focus where it was', () => {
  const main = page('<a href="/a">a</a><div class="rail"><a class="pill" href="/x">x</a></div>');
  main.querySelector('.pill').focus();
  assert.doesNotThrow(() => keepFocusPast(main.querySelector('.rail')));
});
