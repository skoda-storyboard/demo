import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

// #307 review: the flying copy of a Media Box thumbnail keeps the thumbnail's rendered box, its
// clip and corners, and the image's rendered size, offset and crop. Measured at the copy's first
// frame (its animations paused at 0), against the source thumbnail, in a real browser.
const origin = process.env.EDS_ORIGIN || 'http://localhost:3000';
const kit = '/en/press-kits/skoda-peaq-first-glimpse-of-skodas-new-electric-flagship';

async function firstFlight(browser, width) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(`${origin}${kit}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  const card = page.locator('main .media-box .downloads-item').filter({ has: page.locator('.downloads-thumb img') }).first();
  await card.scrollIntoViewIfNeeded();
  await page.evaluate(() => document.fonts.ready);
  // the thumbnail is lazy: added once it shows, as a visitor would
  await card.locator('.downloads-thumb img').evaluate((img) => (img.complete && img.currentSrc
    ? null : new Promise((resolve) => { img.addEventListener('load', resolve, { once: true }); })));
  // record the copy the moment it is appended, and freeze it at its first frame
  await page.evaluate(() => {
    window.flightProbe = new Promise((resolve) => {
      const observer = new MutationObserver(() => {
        const copy = document.querySelector('body > .media-cart-flying');
        if (!copy) return;
        observer.disconnect();
        queueMicrotask(() => {
          copy.getAnimations({ subtree: true }).forEach((a) => { a.pause(); a.currentTime = 0; });
          const rect = (el) => {
            const r = el.getBoundingClientRect();
            return {
              x: r.x, y: r.y, width: r.width, height: r.height,
            };
          };
          const img = copy.querySelector('img');
          const s = getComputedStyle(copy);
          const i = getComputedStyle(img);
          resolve({
            box: rect(copy),
            overflow: s.overflow,
            radius: s.borderTopLeftRadius,
            img: rect(img),
            fit: i.objectFit,
            position: i.objectPosition,
            src: img.currentSrc,
          });
        });
      });
      observer.observe(document.body, { childList: true });
    });
  });
  // the thumbnail as it renders before the add
  const source = await card.evaluate((item) => {
    const thumb = item.querySelector('.downloads-thumb');
    const img = thumb.querySelector('img');
    const rect = (el) => {
      const r = el.getBoundingClientRect();
      return {
        x: r.x, y: r.y, width: r.width, height: r.height,
      };
    };
    const t = getComputedStyle(thumb);
    const i = getComputedStyle(img);
    return {
      box: rect(thumb),
      overflow: t.overflow,
      radius: t.borderTopLeftRadius,
      img: rect(img),
      fit: i.objectFit,
      position: i.objectPosition,
      src: img.currentSrc,
    };
  });
  await card.locator('.downloads-add-toggle').click();
  await card.locator('.downloads-add-size[data-href]').click();
  const flying = await page.evaluate(() => window.flightProbe);
  await page.close();
  return { source, flying };
}

const near = (a, b, label) => assert.ok(Math.abs(a - b) < 0.5, `${label}: ${a} vs ${b}`);

test('the flying copy keeps the Media Box thumbnail box, clip and crop (390, 768, 1440)', async () => {
  const browser = await chromium.launch({ channel: 'chrome', executablePath: process.env.CHROME_PATH });
  try {
    for (const width of [390, 768, 1440]) {
      // eslint-disable-next-line no-await-in-loop
      const { source, flying } = await firstFlight(browser, width);
      const at = `@${width}`;
      ['x', 'y', 'width', 'height'].forEach((k) => {
        near(flying.box[k], source.box[k], `${at} box ${k}`);
        near(flying.img[k], source.img[k], `${at} image ${k}`);
      });
      assert.equal(flying.overflow, 'hidden', `${at} the copy clips`);
      assert.equal(flying.radius, source.radius, `${at} corners`);
      assert.equal(flying.fit, source.fit, `${at} object-fit`);
      assert.equal(flying.position, source.position, `${at} object-position`);
      assert.equal(flying.src, source.src, `${at} the rendered source: ${flying.src} vs ${source.src}`);
      assert.ok(flying.img.width <= flying.box.width + 4 && flying.img.height <= flying.box.height + 4, `${at} the image stays inside its box`);
    }
  } finally {
    await browser.close();
  }
});
