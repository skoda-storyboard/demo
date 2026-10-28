#!/usr/bin/env node
/*
 * check-siteorigin-body.mjs (SKODA-814): does an imported page carry its SiteOrigin Page-Builder
 * body as the contract in docs/ui-specs/siteorigin-body.md §9 says? Per page, the source's
 * rich-text widgets (`.siteorigin-widget-tinymce`, `.textwidget`) are compared with the preview
 * (or local) `.plain.html`:
 *   - text:     every source paragraph, list item, heading and table cell is in the output;
 *   - headings: each source body heading is in the output at the source's level (SKODA-814 keeps
 *               the author's levels, it does not re-derive them);
 *   - residue:  no SiteOrigin class (`panel-grid`, `so-panel`, `siteorigin-*`, `so-widget-*`);
 *   - h1:       exactly one h1.
 * It also lists the body's widget kinds; a kind outside WIDGET_KINDS is reported, not failed
 * (a new widget for the census, the story flatten's map in parsers/story-flatten.js).
 * Exit 1 when a page fails text, headings, residue or h1. A page whose source does not load
 * (a demo-only page) is skipped; a page without a Page-Builder body is still checked for
 * residue and its h1.
 *
 * `--census` reads the sources only: per page the rows, the side-by-side rows, the widget kinds and
 * whether the source's own heading outline skips a level (siteorigin-body.md §2).
 *
 *   node tools/importer/check-siteorigin-body.mjs [--base=https://main--demo--skoda-storyboard.aem.page]
 *     [--local=content] [--census] <url-file>...
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

// the body widget kinds the importers handle (story flatten census + model/page widgets)
export const WIDGET_KINDS = [
  'sow-editor', 'skoda-offset', 'skoda-carousel-widget', 'skoda-quote', 'skoda-captioned-image',
  'skoda-image-box', 'skoda-newsletter', 'sow-slider', 'sow-button', 'sow-image', 'ys-milestones',
  'ys-embed-share', 'ys-so-widget-highlights', 'highlights', 'ys-so-widget-techdata',
  'k2tools-charge-map', 'k2tools-charging-calculator', 'siteorigin-panels-builder',
];

const EDITORS = '.siteorigin-widget-tinymce, .textwidget';
const LEAVES = 'p, li, h1, h2, h3, h4, h5, h6, td, th';
const RESIDUE = /\b(?:panel-grid|panel-row-style|so-panel|siteorigin-[\w-]+|so-widget-[\w-]+)\b/g;

/**
 * Whitespace, nbsp (and skoda-nbsp's U+F00A0 placeholder in a local, not yet pushed file), the
 * word joiner and typographic quotes folded, so text compares by content.
 */
export const norm = (s) => s.replace(/[\s\u00a0\u2060\u{F00A0}]+/gu, ' ').replace(/[\u201c\u201d\u201e]/g, '"').replace(/[\u2018\u2019]/g, "'").trim();

/** A `<br>` is a line break, not nothing: textContent would glue the lines together. */
function breaksAsSpaces(root) {
  root.querySelectorAll('br').forEach((br) => br.replaceWith(' '));
}

/** The page's Page-Builder body (the article's, else the first on the page), or null. */
export function sourceBody(doc) {
  return doc.querySelector('article .panel-layout') || doc.querySelector('.panel-layout');
}

/** The body's widget kinds with their counts, from the `widget_*` class of each `.so-panel`. */
export function widgetKinds(body) {
  const kinds = {};
  if (!body) return kinds;
  body.querySelectorAll('.so-panel').forEach((panel) => {
    const kind = [...panel.classList].find((c) => c.startsWith('widget_'));
    const key = kind ? kind.slice('widget_'.length) : '(none)';
    kinds[key] = (kinds[key] || 0) + 1;
  });
  return kinds;
}

/** The body's rows, and those with more than one cell (side by side from 781px on the source). */
export function rowShape(body) {
  if (!body) return { rows: 0, sideBySide: 0 };
  const grids = [...body.querySelectorAll('.panel-grid')];
  const cells = (g) => g.querySelectorAll(':scope > .panel-grid-cell, :scope > .panel-row-style > .panel-grid-cell').length;
  return { rows: grids.length, sideBySide: grids.filter((g) => cells(g) > 1).length };
}

/** The page's heading levels in order, outside the chrome, the sidebar and the rails. */
export function outline(doc) {
  const scope = doc.querySelector('main') || doc.body;
  return [...scope.querySelectorAll('h1, h2, h3, h4, h5, h6')]
    .filter((h) => !h.closest('header, footer, nav, aside, .search-results-container, #onetrust-consent-sdk'))
    .map((h) => Number(h.tagName[1]));
}

/** True when a heading is more than one level below the one before it (h1 → h3). */
export function skipsLevel(levels) {
  return levels.some((level, i) => i > 0 && level > levels[i - 1] + 1);
}

/** The text of the editors' innermost blocks (a `<p>` in a `<li>` counts once). */
export function editorParts(body) {
  if (!body) return [];
  return [...body.querySelectorAll(EDITORS)]
    .flatMap((ed) => [...ed.querySelectorAll(LEAVES)])
    .filter((el) => !el.querySelector(LEAVES))
    .map((el) => norm(el.textContent))
    .filter((t) => t.length > 2);
}

/** `{ level, text }` for each h1–h6 under root (inside the editors only, when editors is set). */
export function headings(root, editors = false) {
  if (!root) return [];
  const scope = editors ? [...root.querySelectorAll(EDITORS)] : [root];
  return scope.flatMap((el) => [...el.querySelectorAll('h1, h2, h3, h4, h5, h6')])
    .map((h) => ({ level: Number(h.tagName[1]), text: norm(h.textContent) }))
    .filter((h) => h.text);
}

/**
 * The source headings missing from the output at their level. Each output heading is used
 * once; a same-text heading at the same level wins over one at another level (the page h1
 * from the title may repeat a body heading).
 */
export function headingMismatches(source, output) {
  const pool = [...output];
  return source.flatMap((s) => {
    let i = pool.findIndex((o) => o.text === s.text && o.level === s.level);
    if (i < 0) i = pool.findIndex((o) => o.text === s.text);
    const hit = i >= 0 ? pool.splice(i, 1)[0] : null;
    if (hit && hit.level === s.level) return [];
    return [{ text: s.text, source: s.level, output: hit ? hit.level : null }];
  });
}

/** The SiteOrigin class names left in the output markup. */
export function residue(html) {
  return [...new Set(html.match(RESIDUE) || [])];
}

/** One page's result: the source document against the output `.plain.html` markup. */
export function checkPage(srcDoc, plainHtml, outDoc) {
  breaksAsSpaces(srcDoc);
  breaksAsSpaces(outDoc);
  const body = sourceBody(srcDoc);
  const text = norm(outDoc.body.textContent);
  const parts = editorParts(body);
  const missing = parts.filter((t) => !text.includes(t));
  const levels = headingMismatches(headings(body, true), headings(outDoc.body));
  const left = residue(plainHtml);
  const h1 = outDoc.querySelectorAll('h1').length;
  const kinds = widgetKinds(body);
  const unknown = Object.keys(kinds).filter((k) => k !== '(none)' && !WIDGET_KINDS.includes(k));
  return {
    body: !!body,
    parts: parts.length,
    missing,
    levels,
    residue: left,
    h1,
    kinds,
    unknown,
    ok: !missing.length && !levels.length && !left.length && h1 === 1,
  };
}

function loadJSDOM() {
  for (const base of ['/home/node/.excat-marketplaces/excat-marketplace/excat/hooks/import-validator/', import.meta.url]) {
    try {
      // eslint-disable-next-line import/no-unresolved
      return createRequire(base)('jsdom').JSDOM;
    } catch (e) { /* next */ }
  }
  throw new Error('jsdom not found');
}

async function main() {
  const JSDOM = loadJSDOM();
  const args = process.argv.slice(2);
  const opt = (name) => (args.find((a) => a.startsWith(`--${name}=`)) || '').split('=').slice(1).join('=');
  const base = (opt('base') || 'https://main--demo--skoda-storyboard.aem.page').replace(/\/$/, '');
  const local = opt('local');
  const census = args.includes('--census');
  const lists = args.filter((a) => !a.startsWith('--'));
  if (!lists.length) lists.push('tools/importer/urls-page-base.txt');
  const urls = lists.flatMap((f) => readFileSync(f, 'utf8').split('\n'))
    .map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  const UA = { 'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) Chrome/128 Safari/537.36' };

  let bad = 0;
  let skipped = 0;
  const unknown = {};
  for (const url of urls) {
    const path = new URL(url).pathname.replace(/\/$/, '') || '/index';
    // serial on purpose: the source host and the preview are fetched one page at a time
    // eslint-disable-next-line no-await-in-loop
    const src = await fetch(url, { headers: UA });
    if (!src.ok) {
      // a demo-only page (or a removed source): nothing to compare against
      skipped += 1;
      console.log(`skip  ${path.padEnd(60)} source HTTP ${src.status}`);
      // eslint-disable-next-line no-continue
      continue;
    }
    // eslint-disable-next-line no-await-in-loop
    const srcHtml = await src.text();
    if (census) {
      const srcDoc = new JSDOM(srcHtml).window.document;
      const body = sourceBody(srcDoc);
      const { rows, sideBySide } = rowShape(body);
      const levels = outline(srcDoc);
      const kinds = Object.entries(widgetKinds(body)).map(([k, n]) => `${k} ${n}`).join(', ');
      console.log(`${path.padEnd(60)} rows ${rows} side-by-side ${sideBySide} h1 × ${levels.filter((l) => l === 1).length}${skipsLevel(levels) ? ' skips a level' : ''}  ${kinds}`);
      // eslint-disable-next-line no-continue
      continue;
    }
    let plain;
    if (local) {
      try { plain = readFileSync(`${local}${path}.plain.html`, 'utf8'); } catch (e) { plain = null; }
    } else {
      // eslint-disable-next-line no-await-in-loop
      const res = await fetch(`${base}${path}.plain.html`);
      plain = res.ok ? await res.text() : null; // eslint-disable-line no-await-in-loop
    }
    if (plain === null) {
      bad += 1;
      console.log(`MISSING  ${path}`);
      // eslint-disable-next-line no-continue
      continue;
    }
    const r = checkPage(new JSDOM(srcHtml).window.document, plain, new JSDOM(`<body>${plain}</body>`).window.document);
    if (!r.ok) bad += 1;
    r.unknown.forEach((k) => { unknown[k] = (unknown[k] || 0) + 1; });
    const notes = [
      r.missing.length && `text ${r.missing.length}/${r.parts} missing ("${r.missing[0].slice(0, 60)}…")`,
      r.levels.length && `headings ${r.levels.map((l) => `h${l.source}→${l.output ? `h${l.output}` : 'none'} "${l.text.slice(0, 30)}"`).join(', ')}`,
      r.residue.length && `residue ${r.residue.join(' ')}`,
      r.h1 !== 1 && `h1 × ${r.h1}`,
      r.unknown.length && `new widget ${r.unknown.join(' ')}`,
    ].filter(Boolean);
    const text = r.body ? `text ${r.parts - r.missing.length}/${r.parts}` : 'no Page-Builder body';
    console.log(`${r.ok ? 'ok  ' : 'FAIL'}  ${path.padEnd(60)} ${text}${notes.length ? `  ${notes.join('; ')}` : ''}`);
  }
  if (census) return;
  const extra = Object.entries(unknown).map(([k, n]) => `${k} (${n})`).join(', ');
  const checked = urls.length - skipped;
  console.log(`\n${checked - bad}/${checked} pages carry their SiteOrigin body${skipped ? ` (${skipped} skipped, no source)` : ''}${extra ? `; widgets not in the map: ${extra}` : ''}`);
  process.exitCode = bad ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) main();
