/* eslint-disable import/no-extraneous-dependencies */
/* global globalThis */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<main></main>', { url: 'https://example.com/en/press-kits/kit' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const {
  fitBox, flyToCart, flyingCopy, installFlyToCart,
} = await import('./media-cart-fly.js');

const box = (el, left, top, width, height) => {
  el.getBoundingClientRect = () => ({
    left, top, width, height, right: left + width, bottom: top + height,
  });
  return el;
};

test('fitBox fits a picture into the 100px square, keeping its aspect (the source rounds down)', () => {
  assert.deepEqual(fitBox(292, 165.125), { width: 100, height: 56 });
  assert.deepEqual(fitBox(165, 292), { width: 56, height: 100 });
  assert.deepEqual(fitBox(50, 50), { width: 100, height: 100 });
  assert.deepEqual(fitBox(0, 100), { width: 0, height: 0 });
  assert.deepEqual(fitBox(Number.NaN, 100), { width: 0, height: 0 });
});

test('no flight when the picture or the cart badge is off screen, or under reduced motion', async () => {
  const picture = document.createElement('a');
  const target = document.createElement('a');
  document.body.append(picture, target);
  await flyToCart(picture, target); // both 0×0 in jsdom
  assert.equal(document.querySelector('.media-cart-flying'), null);
  box(picture, 106, 300, 292, 165);
  await flyToCart(picture, null);
  assert.equal(document.querySelector('.media-cart-flying'), null, 'no badge (no dock): no flight');
  box(target, 1300, 830, 58, 58);
  window.matchMedia = () => ({ matches: true });
  await flyToCart(picture, target);
  assert.equal(document.querySelector('.media-cart-flying'), null, 'reduced motion');
  delete window.matchMedia;
});

test('a flight: an inert, hidden copy at the picture lands on the badge centre, then goes', async () => {
  const picture = box(document.createElement('a'), 106, 300, 292, 165);
  picture.id = 'thumb';
  picture.innerHTML = '<img id="img" alt="Peaq">';
  const target = box(document.createElement('a'), 1300, 830, 58, 58);
  target.innerHTML = '<span class="float-dock-cart-count">1</span>';
  document.body.append(picture, target);
  const frames = [];
  window.HTMLElement.prototype.animate = function animate(keyframes, options) {
    frames.push({ el: this, keyframes, options });
    return { finished: Promise.resolve() };
  };
  window.setTimeout = (fn) => fn();
  window.requestAnimationFrame = (fn) => fn();
  const flight = flyToCart(picture, target);
  const copy = document.querySelector('.media-cart-flying');
  assert.ok(copy, 'the copy is on the page while it flies');
  assert.equal(copy.getAttribute('aria-hidden'), 'true');
  assert.equal(copy.inert, true);
  assert.equal(copy.querySelector('[id]'), null, 'no duplicate ids');
  assert.equal(copy.id, '', 'the box is not the picture (no copied id)');
  assert.deepEqual([copy.style.position, copy.style.top, copy.style.left, copy.style.opacity], ['fixed', '300px', '106px', '0.7']);
  assert.equal(copy.style.overflow, 'hidden', 'it clips like the thumbnail');
  await flight;
  assert.equal(document.querySelector('.media-cart-flying'), null, 'removed after the fade');
  const [move, fade] = frames;
  // top-left corner to the badge centre (1329, 859), scaled to the 100px fit
  assert.match(move.keyframes[1].transform, /^translate\(1223px, 559px\) scale\(0\.342/);
  assert.deepEqual([move.options.duration, fade.options.duration], [700, 400]);
  assert.equal(fade.keyframes[1].opacity, 0);
  assert.ok(target.querySelector('.float-dock-cart-count').classList.contains('is-wobbling'), 'the count bubble wobbles');
  assert.equal(target.classList.contains('is-wobbling'), false, 'not the whole badge');
});

test('installFlyToCart: an added control inside a card flies that card\'s picture; others don\'t', async () => {
  document.body.innerHTML = `<ul><li class="downloads-item"><figure><a class="downloads-thumb"></a>
    <button class="downloads-add-size">Original</button></figure></li>
    <li class="downloads-item"><figure><div class="downloads-file"></div><button class="downloads-add">PDF</button></figure></li></ul>
    <a class="float-dock-cart"></a>`;
  box(document.querySelector('.downloads-thumb'), 0, 0, 200, 100);
  box(document.querySelector('.float-dock-cart'), 900, 600, 58, 58);
  const flown = [];
  window.HTMLElement.prototype.animate = function animate() {
    flown.push(this.className);
    return { finished: Promise.resolve() };
  };
  installFlyToCart(document);
  installFlyToCart(document); // once
  const added = (el) => el.dispatchEvent(new window.CustomEvent('media-cart:added', { bubbles: true }));
  added(document.querySelector('.downloads-add-size'));
  added(document.querySelector('.downloads-add'));
  await new Promise((r) => { setImmediate(r); });
  assert.deepEqual(flown, ['downloads-thumb media-cart-flying', 'downloads-thumb media-cart-flying'], 'one flight (move + fade), from the picture tile only (no image: copied as it is)');
});

test('flyingCopy keeps the thumbnail: its box and corners, and the image\'s rendered size, offset and crop (#307 review)', () => {
  // the first Media Box card at 390: a 370 × 209 clipped holder, its 368 × 207 cover image 1px in
  const picture = box(document.createElement('a'), 10, 400, 370, 209);
  picture.className = 'downloads-thumb';
  picture.style.borderRadius = '8px';
  picture.innerHTML = '<picture><source srcset="/a-500.webp 500w"><img id="i" src="/a-500.jpg" alt="Peaq" width="500" height="333" style="object-fit: cover; object-position: 50% 0%"></picture>';
  const img = box(picture.querySelector('img'), 11, 401, 368, 207);
  Object.defineProperty(img, 'currentSrc', { value: 'https://example.com/a-750.webp' });
  document.body.append(picture);
  const copy = flyingCopy(picture, picture.getBoundingClientRect());
  assert.equal(copy.className, 'media-cart-flying');
  assert.deepEqual(
    [copy.style.position, copy.style.left, copy.style.top, copy.style.width, copy.style.height, copy.style.overflow, copy.style.borderRadius],
    ['fixed', '10px', '400px', '370px', '209px', 'hidden', '8px'],
    'the picture\'s box, clipped, with its corners',
  );
  assert.deepEqual([copy.getAttribute('aria-hidden'), copy.inert], ['true', true]);
  const shots = copy.querySelectorAll('img');
  assert.equal(shots.length, 1, 'one image, no <source> to pick another candidate');
  const [shot] = shots;
  assert.deepEqual(
    [shot.getAttribute('src'), shot.alt, shot.id, shot.hasAttribute('srcset'), shot.hasAttribute('width')],
    ['https://example.com/a-750.webp', '', '', false, false],
    'the rendered source; decorative; no intrinsic size attributes',
  );
  assert.deepEqual(
    [shot.style.position, shot.style.left, shot.style.top, shot.style.width, shot.style.height, shot.style.maxWidth],
    ['absolute', '1px', '1px', '368px', '207px', 'none'],
    'the image at its rendered size and offset, not its 500 × 333 intrinsic size',
  );
  assert.deepEqual([shot.style.objectFit, shot.style.objectPosition], ['cover', '50% 0%'], 'the crop is kept');
  picture.remove();
});
