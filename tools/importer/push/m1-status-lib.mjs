/*
 * m1-status-lib.mjs — pure helpers for the SKODA-603 per-URL status tracker.
 * No network, no fs: unit-tested in m1-status-lib.test.mjs. The CLI is
 * tools/importer/m1-status.mjs (`npm run import:status`), which gathers the facts
 * (local import, push manifest, admin preview/live status, live query-index, block check)
 * and writes docs/planning/skoda-m1-url-status.md.
 */

import { pagePath } from './push-lib.mjs';

/** Family keys in tracker order, with the section-title keyword that selects them. */
export const FAMILIES = [
  ['home', /\bHOME\b/],
  ['listings', /MEDIA LISTINGS/],
  ['press-releases', /PRESS RELEASES/],
  ['press-kits', /PRESS KITS/],
  ['models', /MODEL/],
  ['series', /SERIES/],
  ['stories', /STORIES/],
  ['images', /\bIMAGES\b/],
  ['videos', /\bVIDEOS\b/],
];

/** Family of a section header; only the title before "(" / "—" / "," counts. */
export function familyOf(sectionTitle) {
  const title = String(sectionTitle || '').split(/[(—,]/)[0].toUpperCase();
  const hit = FAMILIES.find(([, re]) => re.test(title));
  return hit ? hit[0] : 'other';
}

/**
 * EDS page path as the importer writes it: lowercase, anything outside [a-z0-9-] in a
 * segment becomes `-` (source `/en/06a-115_1x/` → `/en/06a-115-1x`).
 */
export function edsPath(p) {
  return String(p || '').split('/').map((seg) => seg.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-')).join('/');
}

/**
 * Parse a sectioned URL list (`# ===== TITLE =====` headers, `#` comments). A comment
 * line starting "# ALIAS" marks the next URL as an alias of the one after it
 * (skoda-m1-url-set.txt convention: import once, redirect via SKODA-609).
 * `?attachment_id=N` item URLs (no path until SKODA-608 maps them) are kept as
 * `unmapped` rows keyed by the query.
 * @returns {{path: string, family: string, alias?: string, unmapped?: boolean}[]}
 */
export function parseSectionedList(text) {
  const out = [];
  let family = 'other';
  let aliasPending = false;
  const lines = String(text || '').split(/\r?\n/);
  lines.forEach((line) => {
    const t = line.trim();
    const header = t.match(/^#\s*=+\s*(.+?)\s*=+\s*$/);
    if (header) { family = familyOf(header[1]); return; }
    if (t.startsWith('#')) { if (/^#\s*ALIAS\b/.test(t)) aliasPending = true; return; }
    const entry = t.replace(/\s+#.*$/, '').split(/\s+/)[0];
    if (!entry) return;
    const attachment = (entry.match(/[?&]attachment_id=(\d+)/) || [])[1];
    const p = attachment ? `?attachment_id=${attachment}` : edsPath(pagePath(entry));
    if (!p || out.some((e) => e.path === p)) return;
    const row = { path: p, family };
    if (attachment) row.unmapped = true;
    if (aliasPending) { row.alias = true; aliasPending = false; }
    out.push(row);
  });
  // an alias points at the next non-alias entry
  out.forEach((row, i) => {
    if (row.alias === true) row.alias = (out.slice(i + 1).find((r) => !r.alias) || {}).path || '';
  });
  return out;
}

/**
 * Merge the M1 set and the rail corpus: unique by path, set order first; `source` is
 * set | corpus | set+corpus. The family of a set entry wins.
 */
export function mergeLists(set, corpus) {
  const rows = set.map((r) => ({ ...r, source: 'set' }));
  corpus.forEach((r) => {
    const hit = rows.find((x) => x.path === r.path);
    if (hit) hit.source = 'set+corpus';
    else rows.push({ ...r, source: 'corpus' });
  });
  return rows;
}

/** Importer template for a row (what page-templates.json calls it). */
export function templateOf(row) {
  if (row.family === 'listings') return row.path.endsWith('/videos') ? 'videos-listing' : 'images-listing';
  return {
    home: 'home-sto',
    'press-releases': 'press-release',
    'press-kits': 'press-kit',
    models: 'model-page',
    series: 'series-hub',
    stories: 'story-detail',
    images: 'media-item',
    videos: 'media-item',
  }[row.family] || '?';
}

const httpCell = (s) => {
  if (s === 200) return '✅';
  if (s == null) return '?';
  if (s === 404) return '·';
  return `❌ ${s}`;
};

/** The block-check cell: ✅ main-only · pending ids (⚠ = broken fallback) · ❌ + labels. */
export function blocksCell(check) {
  if (!check) return '·';
  if (check.errors.length) {
    const labels = [...new Set(check.errors.map((e) => e.split(':')[0]))];
    return `❌ ${labels.join(', ')}`;
  }
  if (!check.pending.length) return '✅';
  return check.pending.map((p) => `${p.id}${p.fallback === 'broken' ? ' ⚠' : ''}`).join(', ');
}

/**
 * One tracker row from the gathered facts.
 * facts: { local, da, preview, live, indexed, check, qa, note }
 */
export function buildRow(row, facts = {}) {
  const f = facts;
  let qa = f.qa || '·';
  if (qa === 'pass') qa = '✅';
  else if (qa === 'fail') qa = '❌';
  else if (qa === 'pending') qa = '⏳';
  return {
    ...row,
    template: templateOf(row),
    imported: f.local ? '✅' : '·',
    da: f.da ? '✅' : '·',
    previewed: row.unmapped ? '–' : httpCell(f.preview),
    published: row.unmapped ? '–' : httpCell(f.live),
    indexed: (() => {
      if (row.alias) return '–';
      if (f.indexed == null) return '?';
      return f.indexed ? '✅' : '·';
    })(),
    blocks: blocksCell(f.check),
    qa,
    note: [
      row.alias ? `alias → ${row.alias} (redirect, SKODA-609)` : '',
      row.unmapped ? 'no EDS path yet: SKODA-608 maps attachment ids to item paths' : '',
      f.note || '',
    ].filter(Boolean).join('; '),
    done: {
      imported: !!f.local,
      previewed: f.preview === 200,
      published: f.live === 200,
      indexed: !row.alias && !!f.indexed,
      qa: f.qa === 'pass',
      blockErrors: !!(f.check && f.check.errors.length),
    },
  };
}

/** Per-family + total counts. Aliases are listed but not counted. */
export function summarizeRows(rows) {
  const keys = ['imported', 'previewed', 'published', 'indexed', 'qa', 'blockErrors'];
  const blank = () => Object.fromEntries([['pages', 0], ...keys.map((k) => [k, 0])]);
  const by = {};
  const total = blank();
  rows.filter((r) => !r.alias).forEach((r) => {
    by[r.family] = by[r.family] || blank();
    [by[r.family], total].forEach((acc) => {
      acc.pages += 1;
      keys.forEach((k) => { if (r.done[k]) acc[k] += 1; });
    });
  });
  return { by, total };
}

const esc = (s) => String(s ?? '').replace(/\|/g, '\\|');

/**
 * Render the tracker markdown.
 * @param {object[]} rows buildRow output
 * @param {object} meta { generated, ref, mode, families: {key: {label, gate, note}},
 *   index: {rows, expected, present} }
 */
export function renderTracker(rows, meta) {
  const { by, total } = summarizeRows(rows);
  const fam = meta.families || {};
  const order = FAMILIES.map(([k]) => k).concat('other').filter((k) => rows.some((r) => r.family === k));
  const out = [];
  out.push('# Škoda M1: per-URL status tracker (SKODA-603)', '');
  out.push(`*Generated by \`npm run import:status\` on ${meta.generated} (${meta.mode}; ref \`${meta.ref}\`). Do not edit the tables by hand: QA results, gates and notes live in \`tools/importer/push/m1-status-overrides.json\`. Sources: [\`skoda-m1-url-set.txt\`](skoda-m1-url-set.txt) and [\`skoda-rail-feed-corpus.txt\`](skoda-rail-feed-corpus.txt). Block column: [pending-block contract](SKODA-PENDING-BLOCK-CONTRACTS.md).*`, '');
  out.push('**Legend:**', '');
  out.push('- ✅ done · `·` not yet · `?` unknown (offline) · ❌ error / failed · ⏳ QA pending · `–` n/a;');
  out.push('- **Blocks:** ✅ every block is on `main`; otherwise the pending contract ids (⚠ = broken fallback, so publish is held); ❌ = the block check fails;');
  out.push('- **DA:** a push record in `push-manifest.json`.', '');
  out.push('## Summary', '');
  out.push('| Family | Gate | Pages | Imported | Previewed | Published | Indexed | QA pass | Block errors |');
  out.push('|---|---|--:|--:|--:|--:|--:|--:|--:|');
  order.forEach((k) => {
    const c = by[k];
    if (!c) return;
    const f = fam[k] || {};
    out.push(`| ${esc(f.label || k)} | ${esc(f.gate || '–')} | ${c.pages} | ${c.imported} | ${c.previewed} | ${c.published} | ${c.indexed} | ${c.qa} | ${c.blockErrors} |`);
  });
  out.push(`| **Total** | | **${total.pages}** | **${total.imported}** | **${total.previewed}** | **${total.published}** | **${total.indexed}** | **${total.qa}** | **${total.blockErrors}** |`, '');
  if (meta.index) {
    out.push(`**Index:** ${meta.index.present} of ${meta.index.expected} expected pages are in \`/en/query-index.json\` (${meta.index.rows} rows in total). The AC target is ${meta.index.expected}/${meta.index.expected}; the alias is excluded.`, '');
  }
  order.forEach((k) => {
    const f = fam[k] || {};
    out.push(`## ${f.label || k}`, '');
    if (f.gate || f.note) out.push(`*Gate: ${f.gate || '–'}.${f.note ? ` ${f.note}` : ''}*`, '');
    out.push('| # | Path | Template | Source | Imported | DA | Previewed | Published | Indexed | Blocks | QA | Notes |');
    out.push('|--:|---|---|---|:-:|:-:|:-:|:-:|:-:|---|:-:|---|');
    rows.filter((r) => r.family === k).forEach((r, i) => {
      out.push(`| ${i + 1} | \`${esc(r.path)}\` | ${r.template} | ${r.source} | ${r.imported} | ${r.da} | ${r.previewed} | ${r.published} | ${r.indexed} | ${esc(r.blocks)} | ${r.qa} | ${esc(r.note)} |`);
    });
    out.push('');
  });
  return `${out.join('\n').trimEnd()}\n`;
}
