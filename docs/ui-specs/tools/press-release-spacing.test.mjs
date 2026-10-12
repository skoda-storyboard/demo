import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const prefix = process.env.EDS_PREFIX || 'http://localhost:3000/drafts/skoda-607a/';
const peaq = '936-km-without-recharging-skoda-peaq-sets-range-record-for-seven-seater-electric-suvs';
const zellmer = 'skoda-auto-klaus-zellmer-to-leave-the-company';

async function openRelease(browser, slug, width) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(`${prefix}${slug}`, { waitUntil: 'networkidle' });
  const band = page.locator('main > .section.media-box');
  await band.scrollIntoViewIfNeeded();
  await page.locator('.media-box .downloads[data-block-status="loaded"]').waitFor();
  await page.evaluate(() => document.fonts.ready);
  return page;
}

async function spacing(page) {
  return page.evaluate(() => {
    const band = document.querySelector('main > .section.media-box');
    const block = band.querySelector('.downloads');
    const list = block.querySelector('.downloads-items');
    const toggle = block.querySelector('.downloads-more');
    const bandRect = band.getBoundingClientRect();
    const listStyle = getComputedStyle(list);
    return {
      bandHeight: bandRect.height,
      paddingBottom: Number.parseFloat(listStyle.paddingBottom),
      marginBottom: Number.parseFloat(listStyle.marginBottom),
      tileGap: Number.parseFloat(getComputedStyle(block).getPropertyValue('--dl-tile-gap')),
      toggleVisible: Boolean(toggle && !toggle.hidden),
      toggleMargin: toggle ? Number.parseFloat(getComputedStyle(toggle).marginTop) : null,
      toggleHeight: toggle ? toggle.getBoundingClientRect().height : null,
      bottomGap: toggle && !toggle.hidden
        ? bandRect.bottom - toggle.getBoundingClientRect().bottom : null,
      inertCount: block.querySelectorAll('.downloads-item[inert]').length,
    };
  });
}

test('press-release Media Box keeps the collapsed overlay and counts last-row spacing once', async () => {
  const browser = await chromium.launch({ channel: 'chrome', executablePath: process.env.CHROME_PATH });
  try {
    const page = await openRelease(browser, peaq, 500);
    const collapsed = await spacing(page);
    assert.equal(collapsed.toggleVisible, true);
    assert.equal(collapsed.inertCount, 3);
    assert.equal(collapsed.toggleMargin, -collapsed.toggleHeight);
    assert.equal(collapsed.paddingBottom, 0);
    assert.equal(collapsed.bottomGap, 60);
    assert.ok(Math.abs(collapsed.bandHeight - 1148.25) < 1, JSON.stringify(collapsed));

    await page.locator('.media-box .downloads-more').click();
    const expanded = await spacing(page);
    assert.equal(expanded.inertCount, 0);
    assert.equal(expanded.paddingBottom, 0);
    assert.equal(expanded.toggleMargin, 34);
    assert.equal(expanded.bottomGap, 60);
    await page.locator('.media-box .downloads-more').click();
    assert.equal((await spacing(page)).bandHeight, collapsed.bandHeight);

    for (const width of [768, 992, 1080, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForFunction(() => document.querySelector('.media-box .downloads-more').hidden);
      const open = await spacing(page);
      assert.equal(open.toggleVisible, false);
      assert.equal(open.inertCount, 0);
      assert.equal(open.paddingBottom, 0);
      assert.equal(open.marginBottom, open.tileGap);
    }
    await page.close();

    const shortPage = await openRelease(browser, zellmer, 1280);
    const short = await spacing(shortPage);
    assert.equal(short.toggleVisible, false);
    assert.equal(short.paddingBottom, 0);
    assert.equal(short.marginBottom, short.tileGap);
    assert.ok(Math.abs(short.bandHeight - 553.625) < 1, JSON.stringify(short));
    for (const width of [375, 768, 992, 1080, 1439, 1440, 1441, 1920]) {
      await shortPage.setViewportSize({ width, height: 900 });
      const bands = await shortPage.locator('main > .section.dark').evaluateAll((elements) => elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return { width: rect.width, x: rect.x };
      }));
      assert.equal(bands.length, 2);
      const expectedWidth = Math.min(width, 1440);
      for (const band of bands) {
        assert.ok(Math.abs(band.width - expectedWidth) < 0.05, JSON.stringify({ width, band }));
        assert.ok(Math.abs(band.x - (width - expectedWidth) / 2) < 0.05, JSON.stringify({ width, band }));
      }
    }
    await shortPage.close();
  } finally {
    await browser.close();
  }
});