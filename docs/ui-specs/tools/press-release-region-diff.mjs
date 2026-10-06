#!/usr/bin/env node
/*
 * SKODA-607a per-pixel visual diff, per page region (template-press-release.md §10: article +
 * secondary + bands), source vs EDS, at each width. docs/ui-specs/tools/visual-diff.mjs takes
 * one selector for both pages; the source and EDS DOMs differ, so each region is cropped from
 * a full-page shot by its own selector on each side. Same pixelmatch settings as the harness
 * (threshold 0.1, includeAA false); the % is mismatched pixels / padded region area.
 *
 *   node press-release-region-diff.mjs <slug> [widths] [edsPrefix] [outDir]
 */
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const tools = new URL('./', import.meta.url);
const req = createRequire(new URL('package.json', tools));
const { chromium } = req('playwright');
const { PNG } = req('pngjs');
const pixelmatch = (await import(new URL('node_modules/pixelmatch/index.js', tools))).default;
const { prepare, dismissConsent } = await import(new URL('lib.mjs', tools));

const [slug, widthArg = '1280,1024,768,500', edsPrefix = 'http://localhost:3000/drafts/skoda-607a/', outRoot = 'out/press-release'] = process.argv.slice(2);
const SRC = `https://www.skoda-storyboard.com/en/press-releases/${slug}/`;
const EDS = `${edsPrefix}${slug}`;
const out = join(outRoot, slug.slice(0, 40));
const VIEW_H = 900;
mkdirSync(out, { recursive: true });

function regions(isSource) {
  const rect = (els) => {
    const rs = els.filter(Boolean).map((e) => e.getBoundingClientRect()).filter((r) => r.height > 0);
    if (!rs.length) return null;
    const x = Math.min(...rs.map((r) => r.left));
    const y = Math.min(...rs.map((r) => r.top)) + scrollY;
    return {
      x: Math.round(x),
      y: Math.round(y),
      w: Math.round(Math.max(...rs.map((r) => r.right)) - x),
      h: Math.round(Math.max(...rs.map((r) => r.bottom)) + scrollY - y),
    };
  };
  const q = (s) => document.querySelector(s);
  const doc = { x: 0, y: 0, w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight };
  // full-width strips for the header and the full-bleed bands: the EDS section box is capped
  // at the content width and bleeds its colour with a box-shadow
  const strip = (r) => (r ? { ...r, x: 0, w: doc.w } : null);
  if (isSource) {
    const bands = [...document.querySelectorAll('.cover-box.dark')];
    return {
      header: strip(rect([q('article .container > header')])),
      article: rect([q('.column-primary')]),
      sidebar: rect([q('.column-secondary')]),
      mediaBox: strip(rect([bands[0]])),
      related: strip(rect([bands[1]])),
      page: doc,
    };
  }
  return {
    header: strip(rect([q('main > .section.press-release-header')])),
    article: rect([...document.querySelectorAll('main > .section.body-column')]),
    sidebar: rect([q('main > .section.sidebar')]),
    mediaBox: strip(rect([q('main > .section.media-box')])),
    related: strip(rect([q('main > .section.related')])),
    page: doc,
  };
}

function crop(png, r, w, h) {
  const outPng = new PNG({ width: w, height: h });
  outPng.data.fill(0xff);
  const cw = Math.max(0, Math.min(r.w, png.width - r.x, w));
  const ch = Math.max(0, Math.min(r.h, png.height - r.y, h));
  if (cw && ch) PNG.bitblt(png, outPng, r.x, r.y, cw, ch, 0, 0);
  return outPng;
}

async function capture(page, url, width, isSource) {
  await prepare(page, url, width, VIEW_H, { renavigate: true, extraMs: 800 });
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => { setTimeout(r, 120); });
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(2500);
  // OneTrust shows its centred banner late (after prepare's dismissal): accept it now, and
  // hide its layer in case it is still fading out
  await dismissConsent(page);
  await page.addStyleTag({ content: '#onetrust-consent-sdk { display: none !important; }' });
  // fixed/sticky page chrome (the source sticky share buttons + consent badge, the sticky
  // headers, the EDS float dock) belongs to other tickets and would sit over scrolled tiles
  await page.evaluate(() => {
    document.querySelectorAll('body *').forEach((e) => {
      if (['fixed', 'sticky'].includes(getComputedStyle(e).position)) e.style.setProperty('visibility', 'hidden', 'important');
    });
  });
  await page.waitForTimeout(300);
  // No full-page shot: Chromium's capture-beyond-viewport and a tall viewport both make one
  // of the two pages re-lay out (lazy media on the source, vh-sized chrome on EDS). Each
  // region is shot in viewport tiles while scrolling, measured right before it is shot.
  const shots = {};
  const names = Object.keys(await page.evaluate(regions, isSource));
  for (const name of names) {
    // eslint-disable-next-line no-await-in-loop
    const r = (await page.evaluate(regions, isSource))[name];
    if (!r) { shots[name] = null; continue; } // eslint-disable-line no-continue
    const canvas = new PNG({ width: r.w, height: r.h });
    canvas.data.fill(0xff);
    for (let off = 0; off < r.h; off += VIEW_H) {
      // eslint-disable-next-line no-await-in-loop
      const scrolled = await page.evaluate((y) => { window.scrollTo(0, y); return window.scrollY; }, r.y + off);
      // eslint-disable-next-line no-await-in-loop
      await page.waitForTimeout(350);
      const top = r.y + off - scrolled; // > 0 when the scroll was clamped at the page end
      const h = Math.min(VIEW_H - top, r.h - off);
      if (h <= 0) break;
      // eslint-disable-next-line no-await-in-loop
      const tile = PNG.sync.read(await page.screenshot({ clip: { x: r.x, y: top, width: r.w, height: h } }));
      PNG.bitblt(tile, canvas, 0, 0, Math.min(tile.width, r.w), Math.min(tile.height, h), 0, off);
    }
    shots[name] = { rect: r, png: canvas };
  }
  return shots;
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ deviceScaleFactor: 1 });
const results = [];
try {
  for (const width of widthArg.split(',').map(Number)) {
    const [sp, tp] = [await ctx.newPage(), await ctx.newPage()];
    // eslint-disable-next-line no-await-in-loop
    const [s, t] = await Promise.all([capture(sp, SRC, width, true), capture(tp, EDS, width, false)]);
    await sp.close();
    await tp.close();
    Object.keys(s).forEach((name) => {
      const a = s[name]?.rect;
      const b = t[name]?.rect;
      if (!a && !b) return;
      if (!a || !b) {
        results.push({ width, name, pct: 100, note: `${a ? 'EDS' : 'source'} has no ${name}` });
        return;
      }
      // the source sidebar column stretches to the row; compare the same height on both
      const H = name === 'sidebar' ? Math.min(a.h, Math.max(b.h, 1)) : Math.max(a.h, b.h);
      const W = Math.max(a.w, b.w);
      const at = { x: 0, y: 0, w: a.w, h: a.h };
      const bt = { x: 0, y: 0, w: b.w, h: b.h };
      const A = crop(s[name].png, at, W, H);
      const B = crop(t[name].png, bt, W, H);
      const diff = new PNG({ width: W, height: H });
      const n = pixelmatch(A.data, B.data, diff.data, W, H, { threshold: 0.1, includeAA: false });
      writeFileSync(join(out, `${width}-${name}-source.png`), PNG.sync.write(A));
      writeFileSync(join(out, `${width}-${name}-target.png`), PNG.sync.write(B));
      writeFileSync(join(out, `${width}-${name}-diff.png`), PNG.sync.write(diff));
      results.push({
        width, name, pct: (n / (W * H)) * 100, note: `src ${a.x},${a.y} ${a.w}x${a.h} · eds ${b.x},${b.y} ${b.w}x${b.h}`,
      });
    });
  }
} finally {
  await browser.close();
}
console.log(`\n${slug.slice(0, 60)}`);
results.forEach((r) => console.log(`  ${String(r.width).padStart(4)} ${r.name.padEnd(9)} ${r.pct.toFixed(2).padStart(6)}%  ${r.pct <= 2 ? 'ok  ' : 'FAIL'}  ${r.note}`));
writeFileSync(join(out, 'results.json'), JSON.stringify(results, null, 1));
