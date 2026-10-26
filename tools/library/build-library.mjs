/* eslint-disable no-console */
/*
 * SKODA-842: build the DA block library from library-spec.mjs and the published pages.
 *
 *   npm run library:build -- [--out content/library] [--refs .migration/library-refs] [--refresh]
 *
 * 1. Caches every published page's .plain.html (the live query index + the hubs) in --refs
 *    (fetched when the folder is empty or with --refresh), and counts block + variant usage.
 * 2. Writes <out>/blocks/<block>.plain.html: one section per variant (default first), holding the
 *    smallest live instance of that block and variant (images -> the placeholders, file links ->
 *    neutral samples, repeats trimmed) or a synthesized sample, plus a library-metadata name +
 *    description. Section Metadata gets one section per Style token.
 * 3. Writes <out>/blocks.json (the Blocks sheet) and refreshes blocks/<block>/metadata.json.
 * 4. Writes <out>/templates/<key>.plain.html (templates-spec.mjs), <out>/templates.json and the
 *    author note <out>/README.plain.html.
 *
 * Upload <out>/blocks/ and <out>/templates/ to DA and POST the two sheets to the Source API;
 * README.md has the steps. library-check.mjs fails when the spec misses a block or variant.
 */
import {
  readFileSync, writeFileSync, readdirSync, mkdirSync, copyFileSync, existsSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SPEC, SECTION_STYLES } from './library-spec.mjs';
import { TEMPLATES, README } from './templates-spec.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const HOST = 'https://main--demo--skoda-storyboard.aem.live';
const DA_LIBRARY = 'https://content.da.live/skoda-storyboard/demo/library';
const DA_BLOCKS = `${DA_LIBRARY}/blocks`;
const PLACEHOLDERS = ['placeholder-16x9.png', 'placeholder-4x3.png'];
const EXTRA_PATHS = ['/en', '/en/media-room', '/en/news', '/en/images', '/en/videos', '/en/press-kits',
  '/en/search', '/en/media-cart', '/en/series-2', '/nav', '/footer', '/media-room/nav',
  '/media-room/footer', '/nav-newsletter'];

const WIDE = new Set(['hero-image', 'gallery']);
// SKODA-810b: every App Promo row is its own part (intro, mockup, columns, heading, store
// strip), so a sample with fewer loses them; a logo row is three tiles
const MAX_ROWS = {
  downloads: 2, gallery: 3, cards: 3, accordion: 2, tags: 3, 'promo-box': 3, 'app-promo': 5, 'brand-asset': 3,
};

export const title = (s) => s.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const sortedKey = (cls) => cls.split(' ').filter(Boolean).sort().join(' ');

/** The balanced `<div class="name …">…</div>` instances of a block in a .plain.html page. */
export function instances(html, name) {
  const out = [];
  const re = new RegExp(`<div class="(${name}(?: [a-z0-9-]+)*)">`, 'g');
  let m = re.exec(html);
  while (m) {
    const tag = /<\/?div\b[^>]*>/g;
    tag.lastIndex = m.index;
    let depth = 0;
    let end = html.length;
    let t = tag.exec(html);
    while (t) {
      depth += t[0].startsWith('</') ? -1 : 1;
      if (depth === 0) { end = tag.lastIndex; break; }
      t = tag.exec(html);
    }
    out.push({ classes: sortedKey(m[1].split(' ').slice(1).join(' ')), html: html.slice(m.index, end) });
    m = re.exec(html);
  }
  return out;
}

/** A block's row strings (the direct child divs). */
export function rows(blockHtml) {
  const inner = blockHtml.replace(/^<div class="[^"]*">/, '').replace(/<\/div>$/, '');
  const out = [];
  const tag = /<\/?div\b[^>]*>/g;
  let depth = 0;
  let start = -1;
  let t = tag.exec(inner);
  while (t) {
    if (!t[0].startsWith('</')) {
      if (depth === 0) start = t.index;
      depth += 1;
    } else {
      depth -= 1;
      if (depth === 0) out.push(inner.slice(start, tag.lastIndex));
    }
    t = tag.exec(inner);
  }
  return out;
}

const isConfigRow = (r) => /^<div><div>[a-z-]+<\/div><div>/.test(r.replace(/\s+/g, ''));

/** Neutralise a live row: placeholder images, sample file links, no heading ids, short text. */
export function clean(name, row) {
  const ratio = WIDE.has(name) ? '16x9' : '4x3';
  return row
    .replace(/<source[^>]*>/g, '')
    .replace(/(<h[1-6]) id="[^"]*"/g, '$1')
    .replace(/>\s+</g, '><')
    .replace(/<img [^>]*?alt="([^"]*)"[^>]*>/g, (all, alt) => `<img src="./images/placeholder-${ratio}.png" alt="${alt || 'Sample image'}">`)
    .replace(/<img (?![^>]*placeholder-)[^>]*>/g, `<img src="./images/placeholder-${ratio}.png" alt="Sample image">`)
    .replace(/href="[^"]+\.(pdf|mp4|zip)(\?[^"]*)?"/gi, (a, ext) => `href="/library/samples/sample.${ext.toLowerCase()}"`)
    .replace(/href="https?:\/\/[^"]*(?:direct-download|cdn\.skoda-storyboard\.com|adobeaemcloud\.com)[^"]*"/g, 'href="/library/samples/original.jpg"')
    .replace(/>([^<]{180,})</g, (a, text) => `>${text.slice(0, 170).replace(/\s+\S*$/, '')} …<`);
}

/** The sample for one block + variant from the cached pages, or null when no page has the block. */
export function sampleFor(pages, name, cls) {
  const all = pages.flatMap((h) => instances(h, name));
  const exact = all.filter((x) => x.classes === sortedKey(cls));
  const base = exact.length ? exact : all.filter((x) => x.classes === '');
  const pool = base.length ? base : all;
  if (!pool.length) return null;
  // the smallest instance that still shows the repeat (MAX_ROWS content rows, or as many as exist)
  const max = MAX_ROWS[name] || 2;
  const count = (x) => rows(x.html).filter((r) => !isConfigRow(r)).length;
  const want = Math.min(max, Math.max(...pool.map(count)));
  const pick = pool.filter((x) => count(x) >= want)
    .sort((a, b) => a.html.length - b.html.length)[0];
  const rs = rows(pick.html);
  const content = [...rs.filter(isConfigRow), ...rs.filter((r) => !isConfigRow(r)).slice(0, max)];
  return {
    from: exact.length ? 'live instance' : 'default rows',
    html: `<div class="${[name, ...cls.split(' ').filter(Boolean)].join(' ')}">${content.map((r) => clean(name, r)).join('')}</div>`,
  };
}

// Variants no live page uses yet, or whose default rows don't show the variant's contract
const img = (r) => `<picture><img src="./images/placeholder-${r}.png" alt="Sample image"></picture>`;
const chips = '<div><div><p><strong><a href="/en/tag/years/2026">2026</a></strong> <a href="/en/tag/model/elroq">Elroq</a> <a href="/en/tag/model/peaq">Peaq</a></p></div></div>';
export const SYNTH = {
  embed: '<div class="embed"><div><div>url</div><div><a href="https://www.youtube.com/watch?v=d1xYSMyyWWA">https://www.youtube.com/watch?v=d1xYSMyyWWA</a></div></div><div><div>title</div><div>Oliver Solberg tests the Škoda Octavia RS</div></div></div>',
  fragment: '<div class="fragment"><div><div><p><a href="/en/fragments/sample-fragment">/en/fragments/sample-fragment</a></p></div></div></div>',
  'cards toolbar': `<div class="cards toolbar">${[1, 2].map((n) => `<div><div>${img('4x3')}</div><div><p><a href="/en/sample-story-${n}">Sample story ${n}</a></p></div><div><p><a href="/library/samples/original.jpg">Download</a></p><p><a href="/en/media-cart">Add to Media Cart</a></p></div></div>`).join('')}</div>`,
  'columns stats': '<div class="columns stats"><div><div><p><strong>85 – 110 kW</strong></p><p>Power</p></div><div><p><strong>560 km</strong></p><p>Range (WLTP)</p></div><div><p><strong>28 min</strong></p><p>Charging 10–80 %</p></div></div></div>',
  'gallery story': `<div class="gallery story">${Array.from({ length: 5 }, (_, i) => `<div><div>${img('16x9')}</div><div>Caption for image ${i + 1}</div></div>`).join('')}</div>`,
  'tags chips': `<div class="tags chips">${chips}</div>`,
  'tags chips outline': `<div class="tags chips outline">${chips}</div>`,
};

const libraryMeta = (n, d) => `<div class="library-metadata"><div><div>name</div><div>${esc(n)}</div></div><div><div>description</div><div>${esc(d)}</div></div></div>`;

/** The sample document per block (name -> { html, report[] }) from the cached pages. */
export function buildDocuments(pages) {
  const docs = {};
  Object.entries(SPEC).forEach(([name, s]) => {
    const report = [];
    const sections = [{ class: '', label: '', description: s.description }, ...s.variants].map((v) => {
      const synth = SYNTH[[name, v.class].filter(Boolean).join(' ')];
      const sample = synth ? { from: 'synthesized', html: synth } : sampleFor(pages, name, v.class);
      const display = v.class ? `${title(name)} (${v.label})` : title(name);
      if (!sample) { report.push(`⚠️ ${display}: no source, skipped`); return null; }
      report.push(`${display.padEnd(36)} ${sample.from}`);
      return `<div>${sample.html}${libraryMeta(display, v.description)}</div>`;
    }).filter(Boolean);
    docs[name] = { html: `${sections.join('\n')}\n`, report };
  });
  const sm = SECTION_STYLES.map(([style, d]) => `<div><p>Section content …</p><div class="section-metadata"><div><div>style</div><div>${esc(style)}</div></div></div>${libraryMeta(`Section Metadata (${style})`, d)}</div>`);
  docs['section-metadata'] = { html: `${sm.join('\n')}\n`, report: [`Section Metadata: ${SECTION_STYLES.length} styles`] };
  return docs;
}

/** The Blocks sheet for the generated documents, sorted by name. */
export function blocksSheet(names) {
  const data = names.map((b) => ({ name: title(b), path: `${DA_BLOCKS}/${b}` }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return {
    total: data.length, offset: 0, limit: data.length, data, ':type': 'sheet',
  };
}

/** The Templates sheet: key = the name in the Templates panel, value = the template document. */
export function templatesSheet(templates) {
  const data = Object.entries(templates)
    .map(([key, t]) => ({ key: t.name, value: `${DA_LIBRARY}/templates/${key}` }));
  return {
    total: data.length, offset: 0, limit: data.length, data, ':type': 'sheet',
  };
}

/** Block + variant usage (sorted class key -> page paths) across the cached pages. */
export function usageOf(pageMap) {
  const usage = {};
  Object.entries(pageMap).forEach(([p, h]) => {
    const seen = new Set();
    [...h.matchAll(/<div class="([a-z][a-z0-9-]*(?: [a-z0-9-]+)*)">/g)].forEach(([, cls]) => {
      const [name, ...variants] = cls.split(' ');
      const key = [name, ...variants.sort()].join(' ');
      if (seen.has(key)) return;
      seen.add(key);
      (usage[key] ||= []).push(p);
    });
  });
  return usage;
}

async function cachePages(refs) {
  const index = (await (await fetch(`${HOST}/en/query-index.json?limit=5000`)).json()).data;
  const paths = [...new Set([...index.map((r) => r.path), ...EXTRA_PATHS])];
  for (let i = 0; i < paths.length; i += 10) {
    // eslint-disable-next-line no-await-in-loop
    await Promise.all(paths.slice(i, i + 10).map(async (p) => {
      const r = await fetch(`${HOST}${p}.plain.html`);
      if (!r.ok) return;
      writeFileSync(path.join(refs, `${p.replace(/^\//, '').replace(/\//g, '__') || 'index'}.plain.html`), await r.text());
    }));
  }
}

async function main(argv) {
  const opt = (name, fallback) => {
    const i = argv.indexOf(name);
    return i >= 0 ? argv[i + 1] : fallback;
  };
  const out = path.resolve(ROOT, opt('--out', 'content/library'));
  const refs = path.resolve(ROOT, opt('--refs', '.migration/library-refs'));
  mkdirSync(refs, { recursive: true });
  if (argv.includes('--refresh') || !readdirSync(refs).length) await cachePages(refs);

  const pageMap = Object.fromEntries(readdirSync(refs).filter((f) => f.endsWith('.plain.html'))
    .map((f) => [`/${f.replace('.plain.html', '').replace(/__/g, '/')}`, readFileSync(path.join(refs, f), 'utf8')]));
  const docs = buildDocuments(Object.values(pageMap));

  const folder = (name) => {
    mkdirSync(path.join(out, name, 'images'), { recursive: true });
    PLACEHOLDERS.forEach((f) => copyFileSync(path.join(HERE, 'images', f), path.join(out, name, 'images', f)));
  };
  const sheet = (name, json) => writeFileSync(path.join(out, name), `${JSON.stringify(json, null, 2)}\n`);
  folder('blocks');
  Object.entries(docs).forEach(([name, d]) => writeFileSync(path.join(out, 'blocks', `${name}.plain.html`), d.html));
  sheet('blocks.json', blocksSheet(Object.keys(docs)));
  folder('templates');
  Object.entries(TEMPLATES).forEach(([key, t]) => writeFileSync(path.join(out, 'templates', `${key}.plain.html`), `${t.sections.join('\n')}\n`));
  sheet('templates.json', templatesSheet(TEMPLATES));
  writeFileSync(path.join(out, 'README.plain.html'), `${README.join('\n')}\n`);

  // blocks/<block>/metadata.json: refresh the inferable fields, keep created/version
  const usage = usageOf(pageMap);
  const now = new Date().toISOString();
  Object.entries(SPEC).forEach(([name, s]) => {
    const file = path.join(ROOT, 'blocks', name, 'metadata.json');
    const prev = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
    const keys = [name, ...s.variants.map((v) => [name, ...v.class.split(' ')].sort().join(' '))];
    const used = [...new Set(keys.flatMap((k) => usage[k] || []))].map((p) => p.replace(/^\//, ''));
    const meta = {
      variantName: name,
      baseBlock: name,
      version: prev.version || '1.0.0',
      created: prev.created || now,
      name: title(name),
      description: s.description,
      visualCharacteristics: { purpose: s.purpose },
      contentPattern: { structure: s.structure },
    };
    if (s.variants.length) {
      meta.options = s.variants.map((v) => ({
        class: v.class, label: v.label, description: v.description,
      }));
    }
    if (used.length) {
      // keep the old timestamp while the usage is unchanged, so a rebuild doesn't churn every file
      const same = prev.usage?.reuseCount === used.length
        && JSON.stringify(prev.usage.pagesUsing) === JSON.stringify(used.slice(0, 10));
      meta.usage = {
        pagesUsing: used.slice(0, 10),
        reuseCount: used.length,
        lastUsed: same ? prev.usage.lastUsed : now,
      };
    }
    writeFileSync(file, `${JSON.stringify(meta, null, 2)}\n`);
  });

  Object.values(docs).forEach((d) => console.log(d.report.join('\n')));
  console.log(`\n${Object.keys(docs).length} block documents, ${Object.keys(TEMPLATES).length} templates and their sheets in ${path.relative(ROOT, out)}; ${Object.keys(SPEC).length} metadata.json refreshed`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main(process.argv.slice(2));
