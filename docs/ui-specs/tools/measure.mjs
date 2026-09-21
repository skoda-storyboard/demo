#!/usr/bin/env node
// measure.mjs - dump real computed styles + rects + inline attributes for a set
// of selectors across breakpoints, so a spec value can be reproduced with one
// command instead of a manual DevTools pass.
//
// Usage (single target):
//   node measure.mjs --url https://www.skoda-storyboard.com/en/ \
//     --selectors ".hero, .promo-box .item:first-child" \
//     [--attrs "data-flickity,rel,data-count"] \
//     [--props "color,fontSize,width"]   (default: the spec prop set) \
//     [--viewports 500,768,1024,1280] [--height 900] \
//     [--all]        (measure every match, not just the first) \
//     [--renavigate] (reload per viewport instead of resizing) \
//     [--out out/measure.json]
//
// Usage (batch): a JSON file = array of { name, url, selectors[], attrs?[], props?[], viewports?[] }
//   node measure.mjs --config targets.json --out out/measure.json
//
// Output: JSON keyed target -> viewport -> selector -> { count, nodes:[{rect, styles, attrs}] }
// and a compact human summary on stdout.

import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { parseArgs } from 'node:util';
import {
  DEFAULT_PROPS, DEFAULT_HEIGHT, list, viewports as parseViewports, prepare, toHex,
} from './lib.mjs';

const { values: a } = parseArgs({
  options: {
    url: { type: 'string' },
    selectors: { type: 'string' },
    attrs: { type: 'string' },
    props: { type: 'string' },
    viewports: { type: 'string' },
    height: { type: 'string' },
    config: { type: 'string' },
    out: { type: 'string' },
    all: { type: 'boolean', default: false },
    renavigate: { type: 'boolean', default: false },
  },
});

// Build the target list from either --config or the single-target flags.
function loadTargets() {
  if (a.config) {
    const raw = JSON.parse(readFileSync(a.config, 'utf8'));
    const arr = Array.isArray(raw) ? raw : [raw];
    return arr.map((t, i) => ({
      name: t.name || `target-${i + 1}`,
      url: t.url,
      selectors: t.selectors || list(t.selector),
      attrs: t.attrs || [],
      props: t.props && t.props.length ? t.props : DEFAULT_PROPS,
      viewports: t.viewports && t.viewports.length ? t.viewports : parseViewports(a.viewports),
    }));
  }
  if (!a.url || !a.selectors) {
    console.error('need --url and --selectors (or --config file.json)');
    process.exit(2);
  }
  return [{
    name: 'target',
    url: a.url,
    selectors: list(a.selectors),
    attrs: list(a.attrs),
    props: list(a.props, DEFAULT_PROPS),
    viewports: parseViewports(a.viewports),
  }];
}

// Runs in the browser: read computed styles + rect + attrs for up to `cap` matches.
// Playwright passes a single argument to evaluate, so we take one array + destructure.
function readInPage([selector, props, attrs, all]) {
  const nodes = [...document.querySelectorAll(selector)];
  const cap = all ? nodes.length : Math.min(nodes.length, 1);
  const cs = (el) => {
    const s = getComputedStyle(el);
    const out = {};
    for (const p of props) out[p] = s[p];
    return out;
  };
  const pick = nodes.slice(0, cap).map((el) => {
    const r = el.getBoundingClientRect();
    const attrOut = {};
    for (const at of attrs) attrOut[at] = el.getAttribute(at);
    return {
      rect: {
        x: Math.round(r.x), y: Math.round(r.y),
        w: Math.round(r.width), h: Math.round(r.height),
      },
      styles: cs(el),
      attrs: attrOut,
    };
  });
  return { count: nodes.length, nodes: pick };
}

const height = Number(a.height) || DEFAULT_HEIGHT;
const targets = loadTargets();

const browser = await chromium.launch();
const result = {};

try {
  for (const t of targets) {
    result[t.name] = { url: t.url, viewports: {} };
    const context = await browser.newContext({ deviceScaleFactor: 1 });
    const page = await context.newPage();
    for (const w of t.viewports) {
      await prepare(page, t.url, w, height, { renavigate: a.renavigate });
      const byViewport = {};
      for (const sel of t.selectors) {
        // eslint-disable-next-line no-await-in-loop
        byViewport[sel] = await page.evaluate(readInPage, [sel, t.props, t.attrs, a.all]);
      }
      result[t.name].viewports[w] = byViewport;
    }
    await context.close();
  }
} finally {
  await browser.close();
}

// Write full JSON if asked.
if (a.out) {
  mkdirSync(dirname(a.out), { recursive: true });
  writeFileSync(a.out, JSON.stringify(result, null, 2));
}

// Compact human summary: one line per selector/viewport with the values most
// used in specs (box + key type + colors), hex-normalized.
const KEY = ['display', 'width', 'height', 'fontSize', 'lineHeight', 'fontWeight', 'color', 'backgroundColor'];
for (const [name, data] of Object.entries(result)) {
  console.log(`\n# ${name}  ${data.url}`);
  for (const [w, sels] of Object.entries(data.viewports)) {
    for (const [sel, res] of Object.entries(sels)) {
      if (!res.count) { console.log(`  [${w}] ${sel}  -> NOT FOUND`); continue; }
      const n = res.nodes[0];
      const bits = KEY.map((p) => {
        const v = n.styles[p];
        if (v == null) return null;
        if (p === 'color' || p === 'backgroundColor') return `${p}=${toHex(v) || v}`;
        return `${p}=${v}`;
      }).filter(Boolean);
      const rect = `box ${n.rect.w}x${n.rect.h}`;
      const cnt = res.count > 1 ? ` (x${res.count})` : '';
      console.log(`  [${w}] ${sel}${cnt}  ${rect}  ${bits.join('  ')}`);
      const setAttrs = Object.entries(n.attrs).filter(([, v]) => v != null);
      if (setAttrs.length) console.log(`        attrs: ${setAttrs.map(([k, v]) => `${k}=${v}`).join('  ')}`);
    }
  }
}
if (a.out) console.log(`\nfull JSON -> ${a.out}`);
