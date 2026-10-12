#!/usr/bin/env node
/*
 * SKODA-702: calibrate a fallback family's size-adjust on the real pages. For each candidate
 * value, the page is rendered with the web fonts blocked and the family's regular/bold face
 * overridden (a later @font-face with the same descriptors wins); the score is how much the
 * first sections' heights differ from the SKODA Next render (the reflow at swap time).
 *   [FONTCONFIG_FILE=...] node fallback-sweep.mjs   (from docs/ui-specs/tools) <origin> <paths-file> <family> <src-regular> <src-bold> <width> <part> <fixed> <values>
 *   part = bold | regular; fixed = the other face's size-adjust (%); values = comma list (%)
 */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const req = createRequire(new URL('./package.json', import.meta.url));
const { chromium } = req('playwright');
const [origin, list, family, srcRegular, srcBold, width, part, fixed, values] = process.argv.slice(2);
const paths = readFileSync(list, 'utf8').trim().split('\n').map((l) => l.trim().split(' ')[1]);
const env = { ...process.env };
if (!env.FONTCONFIG_FILE) delete env.FONTCONFIG_FILE;
const browser = await chromium.launch({ env });

async function heights(path, css) {
  const p = await browser.newPage({ viewport: { width: Number(width), height: 823 } });
  if (css !== null) await p.route(/\.woff2?(\?|$)/, (r) => r.abort());
  if (css) await p.addInitScript((c) => { document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = c; document.head.append(s); }); }, css);
  await p.goto(`${origin}${path}`, { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {});
  await p.waitForTimeout(1500);
  const h = await p.evaluate(() => [...document.querySelectorAll('main > .section')].slice(0, 4).map((s) => Math.round(s.getBoundingClientRect().height)));
  await p.close();
  return h;
}

const face = (weight, adjust, src) => `@font-face { font-family: ${family}; font-weight: ${weight}; size-adjust: ${adjust}%; src: ${src}; }`;
const target = {};
for (const path of paths) target[path] = await heights(path, null); // with SKODA Next
for (const v of values.split(',')) {
  const reg = part === 'regular' ? v : fixed;
  const bold = part === 'bold' ? v : fixed;
  const css = face('100 500', reg, srcRegular) + face('600 900', bold, srcBold);
  let header = 0;
  let total = 0;
  for (const path of paths) {
    const h = await heights(path, css);
    const t = target[path];
    header += Math.abs((h[0] ?? 0) - (t[0] ?? 0)) + Math.abs((h[1] ?? 0) - (t[1] ?? 0)) * (part === 'bold' ? 0 : 0);
    total += h.reduce((s, x, i) => s + Math.abs(x - (t[i] ?? x)), 0);
    if (part === 'bold') header += 0;
  }
  console.log(`${family} ${part}=${v}% (other ${fixed}%)  first-section Σ|Δh| ${header}  all-sections Σ|Δh| ${total}`);
}
await browser.close();
