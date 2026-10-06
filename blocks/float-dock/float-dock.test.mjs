import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const initialDom = new JSDOM('', {
  url: 'https://demo.example/en/story',
  pretendToBeVisual: true,
});
const originalGlobals = new Map(['window', 'document', 'fetch'].map((key) => [
  key,
  Object.getOwnPropertyDescriptor(globalThis, key),
]));

function restoreGlobals() {
  originalGlobals.forEach((descriptor, key) => {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else delete globalThis[key];
  });
}

globalThis.window = initialDom.window;
globalThis.document = initialDom.window.document;
globalThis.fetch = async () => ({ ok: false });
window.hlx = { codeBasePath: '' };
window.matchMedia = () => ({ matches: false, addEventListener() {} });

const { default: decorate } = await import('./float-dock.js');

after(() => {
  initialDom.window.close();
  restoreGlobals();
});

function setup(t) {
  const previousGlobals = new Map(['window', 'document', 'fetch'].map((key) => [
    key,
    Object.getOwnPropertyDescriptor(globalThis, key),
  ]));
  const dom = new JSDOM('<main><div class="float-dock block"></div></main>', {
    url: 'https://demo.example/en/story',
    pretendToBeVisual: true,
  });
  let scrollY = 0;
  Object.defineProperty(dom.window, 'scrollY', { configurable: true, get: () => scrollY });
  dom.window.hlx = { codeBasePath: '' };
  dom.window.matchMedia = () => ({ matches: false, addEventListener() {} });
  dom.window.requestAnimationFrame = (callback) => callback();
  dom.window.scrollTo = () => {};
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.fetch = async () => ({ ok: false });
  t.after(() => {
    dom.window.close();
    previousGlobals.forEach((descriptor, key) => {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    });
  });

  return {
    block: document.querySelector('.float-dock'),
    setScrollY(value) { scrollY = value; },
  };
}

test('share disclosure is labelled, keyboard dismissible, and restores focus', async (t) => {
  const { block } = setup(t);
  await decorate(block);

  const trigger = block.querySelector('.float-dock-trigger');
  const list = block.querySelector('.float-dock-share-list');
  assert.equal(trigger.getAttribute('aria-label'), 'Share this page');
  assert.equal(trigger.getAttribute('aria-controls'), list.id);
  assert.equal(trigger.getAttribute('aria-expanded'), 'false');
  assert.equal(list.inert, true);

  trigger.click();
  assert.equal(trigger.getAttribute('aria-expanded'), 'true');
  assert.equal(list.inert, false);
  list.querySelector('a').focus();
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' }));

  assert.equal(trigger.getAttribute('aria-expanded'), 'false');
  assert.equal(list.inert, true);
  assert.equal(document.activeElement, trigger);
});

test('scroll-to-top appears past the threshold and returns focus before hiding', async (t) => {
  const { block, setScrollY } = setup(t);
  await decorate(block);

  const top = block.querySelector('.float-dock-top');
  const trigger = block.querySelector('.float-dock-trigger');
  assert.equal(top.inert, true);

  setScrollY(300);
  window.dispatchEvent(new window.Event('scroll'));
  assert.equal(block.classList.contains('scrolled'), false);

  setScrollY(301);
  window.dispatchEvent(new window.Event('scroll'));
  assert.equal(block.classList.contains('scrolled'), true);
  assert.equal(top.inert, false);

  top.focus();
  setScrollY(0);
  window.dispatchEvent(new window.Event('scroll'));
  assert.equal(block.classList.contains('scrolled'), false);
  assert.equal(top.inert, true);
  assert.equal(document.activeElement, trigger);
});
