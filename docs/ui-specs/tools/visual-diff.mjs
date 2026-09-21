#!/usr/bin/env node
// visual-diff.mjs - screenshot a source URL and an EDS target URL at each
// breakpoint (or a specific element on both), pixel-diff them, and report the
// mismatch %. This is the enforceable side of the spec library's "<= 2%" gate.
//
// Usage:
//   node visual-diff.mjs \
//     --source https://www.skoda-storyboard.com/en/press-releases/<slug>/ \
//     --target https://<branch>--<repo>--<owner>.aem.page/<path> \
//     [--selector ".column-primary"]  (element-scoped diff on both pages) \
//     [--full]                        (full-page instead of viewport clip) \
//     [--viewports 500,768,1024,1280] [--height 900] \
//     [--threshold 2]                 (max % pixels allowed to differ) \
//     [--pmthreshold 0.1]             (pixelmatch per-pixel color tolerance) \
//     [--out out/diff]
//
// Exit code 1 if any viewport exceeds --threshold, so CI can gate on it.
// Writes <out>/<viewport>-{source,target,diff}.png for every viewport.

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import {
  DEFAULT_HEIGHT, viewports as parseViewports, prepare,
} from './lib.mjs';

const { values: a } = parseArgs({
  options: {
    source: { type: 'string' },
    target: { type: 'string' },
    selector: { type: 'string' },
    full: { type: 'boolean', default: false },
    viewports: { type: 'string' },
    height: { type: 'string' },
    threshold: { type: 'string' },
    pmthreshold: { type: 'string' },
    out: { type: 'string', default: 'out/diff' },
  },
});

if (!a.source || !a.target) {
  console.error('need --source and --target URLs');
  process.exit(2);
}

const height = Number(a.height) || DEFAULT_HEIGHT;
const gate = a.threshold != null ? Number(a.threshold) : 2;
const pmThreshold = a.pmthreshold != null ? Number(a.pmthreshold) : 0.1;
const vps = parseViewports(a.viewports);
mkdirSync(a.out, { recursive: true });

// One screenshot: element-scoped if --selector, else full page or viewport clip.
async function shoot(page, width) {
  if (a.selector) {
    const el = page.locator(a.selector).first();
    await el.scrollIntoViewIfNeeded({ timeout: 5000 });
    return el.screenshot();
  }
  if (a.full) return page.screenshot({ fullPage: true });
  return page.screenshot({ clip: { x: 0, y: 0, width, height } });
}

// Pad a PNG onto a fresh W x H canvas (top-left), white background, so two
// differently-sized shots can still be diffed. Returns the padded PNG.
function padTo(png, W, H) {
  if (png.width === W && png.height === H) return png;
  const out = new PNG({ width: W, height: H });
  out.data.fill(0xff); // opaque white
  PNG.bitblt(png, out, 0, 0, Math.min(png.width, W), Math.min(png.height, H), 0, 0);
  return out;
}

const browser = await chromium.launch();
const rows = [];
let failed = false;

try {
  const ctx = await browser.newContext({ deviceScaleFactor: 1 });
  const srcPage = await ctx.newPage();
  const tgtPage = await ctx.newPage();

  for (const w of vps) {
    // eslint-disable-next-line no-await-in-loop
    await prepare(srcPage, a.source, w, height, { extraMs: 600 });
    // eslint-disable-next-line no-await-in-loop
    await prepare(tgtPage, a.target, w, height, { extraMs: 600 });

    // eslint-disable-next-line no-await-in-loop
    const [srcBuf, tgtBuf] = await Promise.all([shoot(srcPage, w), shoot(tgtPage, w)]);
    const src = PNG.sync.read(srcBuf);
    const tgt = PNG.sync.read(tgtBuf);

    const W = Math.max(src.width, tgt.width);
    const H = Math.max(src.height, tgt.height);
    const dimsDiffer = src.width !== tgt.width || src.height !== tgt.height;
    const A = padTo(src, W, H);
    const B = padTo(tgt, W, H);

    const diff = new PNG({ width: W, height: H });
    const mismatched = pixelmatch(A.data, B.data, diff.data, W, H, {
      threshold: pmThreshold, includeAA: false,
    });
    const pct = (mismatched / (W * H)) * 100;
    const over = pct > gate;
    if (over) failed = true;

    writeFileSync(join(a.out, `${w}-source.png`), PNG.sync.write(A));
    writeFileSync(join(a.out, `${w}-target.png`), PNG.sync.write(B));
    writeFileSync(join(a.out, `${w}-diff.png`), PNG.sync.write(diff));

    rows.push({
      w, pct, over,
      note: dimsDiffer ? `dims differ src ${src.width}x${src.height} vs tgt ${tgt.width}x${tgt.height}` : '',
    });
  }
} finally {
  await browser.close();
}

console.log(`\nvisual diff  gate=${gate}%  ${a.selector ? `selector=${a.selector}` : (a.full ? 'full-page' : 'viewport-clip')}`);
console.log(`source ${a.source}`);
console.log(`target ${a.target}\n`);
for (const r of rows) {
  const flag = r.over ? 'FAIL' : 'ok';
  console.log(`  [${String(r.w).padStart(4)}]  ${r.pct.toFixed(2).padStart(6)}%  ${flag}${r.note ? `   ${r.note}` : ''}`);
}
console.log(`\nartifacts -> ${a.out}/<viewport>-{source,target,diff}.png`);
if (failed) { console.log('\nresult: FAIL (a viewport exceeded the gate)'); process.exit(1); }
console.log('\nresult: PASS');
