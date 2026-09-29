#!/usr/bin/env node
/*
 * check-nbsp-parity.mjs (SKODA-208, PR 200 review): does a delivered page keep the source's
 * glued non-breaking spaces (U+00A0 between two visible characters, `a&nbsp;roomy`)? Compares
 * the source's authored copy (model-page editor / highlights / tech-data widgets) with the
 * preview `.plain.html`, per page. The importer keeps them (transformers/skoda-nbsp.js), so a
 * gap means the page was imported before the fix or not re-pushed. Exit 1 on any gap.
 *
 *   node tools/importer/check-nbsp-parity.mjs [tools/importer/urls-model-page.txt]
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

function loadJSDOM() {
  for (const base of ['/home/node/.excat-marketplaces/excat-marketplace/excat/hooks/import-validator/', import.meta.url]) {
    try {
      // eslint-disable-next-line import/no-unresolved
      return createRequire(base)('jsdom').JSDOM;
    } catch (e) { /* next */ }
  }
  throw new Error('jsdom not found');
}

const JSDOM = loadJSDOM();
const PREVIEW = 'https://main--demo--skoda-storyboard.aem.page';
const UA = { 'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) Chrome/128 Safari/537.36' };
const GLUED = /(?<=[^\s])\u00a0+(?=[^\s])/g;
const count = (text) => (text.match(GLUED) || []).join('').length;

const list = process.argv[2] || 'tools/importer/urls-model-page.txt';
const urls = readFileSync(list, 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));

let bad = 0;
for (const url of urls) {
  const path = new URL(url).pathname.replace(/\/$/, '');
  // eslint-disable-next-line no-await-in-loop
  const src = new JSDOM(await (await fetch(url, { headers: UA })).text()).window.document;
  const copy = [...src.querySelectorAll('main .so-panel .so-widget-sow-editor, main .widget_ys-so-widget-highlights, main .widget_ys-so-widget-techdata')]
    .map((el) => el.textContent).join('\n');
  // eslint-disable-next-line no-await-in-loop
  const prevHtml = await (await fetch(`${PREVIEW}${path}.plain.html`)).text();
  const prev = new JSDOM(`<body>${prevHtml}</body>`).window.document;
  prev.querySelectorAll('.metadata').forEach((m) => m.remove());
  const s = count(copy);
  const p = count(prev.body.textContent);
  if (p < s) bad += 1;
  console.log(`${p >= s ? 'ok ' : 'GAP'} ${path.padEnd(48)} source=${String(s).padStart(3)} preview=${String(p).padStart(3)}`);
}
console.log(`\n${urls.length - bad}/${urls.length} pages keep the source's glued non-breaking spaces`);
process.exitCode = bad ? 1 : 0;
