import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

// PR #335 review: an open rendition menu (Original / 1920px) on the last visible row-2 tile of a
// collapsed downloads block stays clickable over the Show more bar. Hit-tested at each link's centre
// in a real browser, after the lazy images have settled the rows (the menu then reaches 17px into
// the 64px gallery bar). The gallery bar is layer 2 under the open tile (3); the Media Box pill is
// layer 3, and its tiles' menu (15) still paints over it.
const origin = process.env.EDS_ORIGIN || 'http://localhost:3000';
const CASES = [
  ['gallery', '/en/press-kits/skoda-peaq-press-kit-2/images', '.downloads.gallery.downloads-collapsed'],
  ['Media Box', '/en/lifestyle/skodas-smarter-wireless-charging-goes-beyond-phones', '.downloads.downloads-media-box.downloads-collapsed'],
];

async function menuHits(browser, path, selector, width) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
  try {
    await page.goto(`${origin}${path}`, { waitUntil: 'networkidle' });
    await page.evaluate(async (sel) => {
      document.querySelectorAll('img[loading="lazy"]').forEach((img) => { img.loading = 'eager'; });
      await Promise.all([...document.images].map((img) => (img.complete ? null
        : new Promise((res) => { img.addEventListener('load', res); img.addEventListener('error', res); }))));
      document.querySelector(sel)?.scrollIntoView({ block: 'end' });
    }, selector);
    await page.waitForTimeout(800);
    const menuId = await page.evaluate((sel) => {
      const block = document.querySelector(sel);
      if (!block) return null;
      const tiles = [...block.querySelectorAll('.downloads-item')].filter((t) => !t.hasAttribute('inert'));
      const top = (t) => Math.round(t.getBoundingClientRect().top + window.scrollY);
      const rows = [...new Set(tiles.map(top))].sort((a, b) => a - b);
      const tile = tiles.filter((t) => top(t) === rows[1]).pop();
      const button = tile?.querySelector('button[aria-haspopup][aria-controls]');
      if (!button) return null;
      button.dataset.hitProbe = '';
      return button.getAttribute('aria-controls');
    }, selector);
    assert.ok(menuId, `${path} @${width}: a collapsed block with a row-2 menu button`);
    await page.locator('[data-hit-probe]').click();
    await page.evaluate((id) => {
      const b = document.getElementById(id).getBoundingClientRect();
      if (b.bottom > window.innerHeight - 8) window.scrollBy(0, b.bottom - window.innerHeight + 40);
    }, menuId);
    return await page.evaluate((id) => [...document.getElementById(id).querySelectorAll('.downloads-size')]
      .map((link) => {
        const r = link.getBoundingClientRect();
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return { label: link.textContent.trim(), ok: !!hit && (hit === link || link.contains(hit)), hit: hit?.className || '' };
      }), menuId);
  } finally {
    await page.close();
  }
}

test('collapsed downloads: an open row-2 rendition menu wins over the Show more bar', async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  try {
    for (const [name, path, selector] of CASES) {
      for (const width of [375, 768]) {
        // eslint-disable-next-line no-await-in-loop
        const hits = await menuHits(browser, path, selector, width);
        assert.equal(hits.length, 2, `${name} @${width}: Original + 1920px`);
        hits.forEach(({ label, ok, hit }) => assert.ok(ok, `${name} @${width}: ${label} is covered by "${hit}"`));
      }
    }
  } finally {
    await browser.close();
  }
});
