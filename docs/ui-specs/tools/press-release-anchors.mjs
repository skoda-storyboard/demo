#!/usr/bin/env node
/*
 * SKODA-607a: press-release page-level anchors, source vs EDS, for one press release at several widths.
 * Measured with getBoundingClientRect after a full scroll (lazy media loaded), no screenshots.
 *
 *   node press-release-anchors.mjs <slug> [widths] [edsPrefix] [outJson]
 *   edsPrefix default http://localhost:3000/drafts/skoda-607a/ (local code, previewed drafts)
 */
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';

const req = createRequire(new URL('./package.json', import.meta.url));
const { chromium } = req('playwright');
const [slug, widthArg = '1280,1024,768,500', edsPrefix = 'http://localhost:3000/drafts/skoda-607a/', outJson] = process.argv.slice(2);
const SRC = `https://www.skoda-storyboard.com/en/press-releases/${slug}/`;
const EDS = `${edsPrefix}${slug}`;
const executablePath = process.env.CHROME_PATH || undefined;
const browser = await chromium.launch({ executablePath });

async function measure(url, width, isSource) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {});
  await page.evaluate(() => document.querySelector('#onetrust-reject-all-handler')?.click());
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => { setTimeout(r, 100); });
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(2000);
  const result = await page.evaluate((src) => {
    const r1 = (n) => Math.round(n * 10) / 10;
    const top = (e) => (e ? r1(e.getBoundingClientRect().top + scrollY) : null);
    const h = (e) => (e ? r1(e.getBoundingClientRect().height) : null);
    const bottom = (e) => (e ? r1(e.getBoundingClientRect().bottom + scrollY) : null);
    const q = (s) => document.querySelector(s);
    if (src) {
      const content = q('.column-primary .entry-content');
      const last = [...content.children].filter((e) => e.getBoundingClientRect().height > 0).at(-1);
      const bands = document.querySelectorAll('.cover-box.dark');
      const panel = q('.entry-content > div[style*="background"]');
      return {
        h1: top(q('h1')),
        lead: top(q('.column-primary .article-teaser img')),
        podcast: top(q('.entry-content .embed-controller-wrapper')),
        panel: panel ? [top(panel), h(panel)] : null,
        articleEnd: bottom(last),
        sidebar: [top(q('.column-secondary')), h(q('.column-secondary'))],
        mediaBox: bands[0] ? [top(bands[0]), h(bands[0])] : null,
        related: bands[1] ? [top(bands[1]), h(bands[1])] : null,
        footer: top(q('footer')),
      };
    }
    const parts = [...document.querySelectorAll('main > .section.body-column')];
    const lastPart = parts.at(-1);
    const lastWrap = lastPart && [...lastPart.children].at(-1);
    const lastEl = lastPart && (lastPart.matches('.highlight-grey, .highlight-dark')
      ? lastPart : (lastWrap?.matches('.default-content-wrapper') ? [...lastWrap.children].at(-1) : lastWrap));
    const panel = q('main > .section.body-column:is(.highlight-grey, .highlight-dark)');
    return {
      h1: top(q('main h1')),
      lead: top(q('main .press-release-lead img')),
      podcast: top(q('main .embed-buzzsprout')),
      panel: panel ? [top(panel), h(panel)] : null,
      articleEnd: bottom(lastEl),
      sidebar: [top(q('main > .section.sidebar')), h(q('main > .section.sidebar'))],
      mediaBox: q('main > .section.media-box') ? [top(q('main > .section.media-box')), h(q('main > .section.media-box'))] : null,
      related: q('main > .section.related') ? [top(q('main > .section.related')), h(q('main > .section.related'))] : null,
      footer: top(q('footer')),
    };
  }, isSource);
  await page.close();
  return result;
}

const fmt = (v) => (Array.isArray(v) ? `${v[0]} (h ${v[1]})` : String(v));
const delta = (a, b) => {
  if (a == null || b == null) return '';
  const d = Array.isArray(a) ? [b[0] - a[0], b[1] - a[1]] : [b - a];
  return d.map((x) => (Math.abs(x) < 0.05 ? '0' : (x > 0 ? `+${x.toFixed(1)}` : x.toFixed(1)))).join(' / h ');
};
const out = {};
for (const width of widthArg.split(',').map(Number)) {
  const [s, e] = await Promise.all([measure(SRC, width, true), measure(EDS, width, false)]);
  out[width] = { source: s, eds: e };
  console.log(`\n${slug.slice(0, 48)} @ ${width}`);
  Object.keys(s).forEach((k) => {
    console.log(`  ${k.padEnd(11)} ${fmt(s[k]).padEnd(20)} → ${fmt(e[k]).padEnd(20)} Δ ${delta(s[k], e[k])}`);
  });
}
if (outJson) writeFileSync(outJson, JSON.stringify(out, null, 1));
await browser.close();
