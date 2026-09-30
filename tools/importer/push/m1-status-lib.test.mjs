/*
 * Unit tests for the SKODA-603 status-tracker helpers (pure; no network, no fs except
 * reading the committed URL lists).
 * Run: node --test tools/importer/push/m1-status-lib.test.mjs
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  familyOf, edsPath, parseSectionedList, mergeLists, templateOf, blocksCell, buildRow,
  summarizeRows, renderTracker, statusSheet, titleFromPath,
} from './m1-status-lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLANNING = path.resolve(HERE, '..', '..', '..', 'docs', 'planning');

test('familyOf reads only the section title, not the feed notes', () => {
  assert.equal(familyOf('HOME (1)'), 'home');
  assert.equal(familyOf('MEDIA LISTINGS (2), items via SKODA-608'), 'listings');
  assert.equal(familyOf('MODELS (11) — skoda_model CPT; feeds Models rails (STO + MR home)'), 'models');
  assert.equal(familyOf('STORIES tagged PEAQ (13) — feeds model Stories rail'), 'stories');
  assert.equal(familyOf('PRESS KITS (4), tiles hubs SKODA-805a'), 'press-kits');
  assert.equal(familyOf('SERIES HUBS (5), SKODA-207 (hub level only)'), 'series');
  assert.equal(familyOf('IMAGES (18) — attachment posts'), 'images');
  assert.equal(familyOf('SOMETHING'), 'other');
});

test('parseSectionedList: families, de-duplication, alias → next entry', () => {
  const rows = parseSectionedList([
    '# ===== HOME (1) =====',
    'https://www.skoda-storyboard.com/en/',
    '# ===== STORIES (3) =====',
    '# ALIAS of the next line (redirect, do not import twice):',
    'https://www.skoda-storyboard.com/en/skoda-world/innovation-and-technology/x/',
    'https://www.skoda-storyboard.com/en/skoda-world/x/',
    'https://www.skoda-storyboard.com/en/skoda-world/x/',
  ].join('\n'));
  assert.deepEqual(rows, [
    { path: '/en', family: 'home' },
    { path: '/en/skoda-world/innovation-and-technology/x', family: 'stories', alias: '/en/skoda-world/x' },
    { path: '/en/skoda-world/x', family: 'stories' },
  ]);
});

test('the committed M1 set parses to 93 entries, 92 pages + 1 alias (D-1 = A adds 49 press-kit children)', () => {
  const set = parseSectionedList(readFileSync(path.join(PLANNING, 'skoda-m1-url-set.txt'), 'utf8'));
  assert.equal(set.length, 93);
  assert.equal(set.filter((r) => r.alias).length, 1);
  const count = (f) => set.filter((r) => r.family === f && !r.alias).length;
  assert.deepEqual(
    ['home', 'listings', 'press-releases', 'press-kits', 'models', 'series', 'stories', 'other'].map(count),
    [1, 2, 5, 54, 5, 5, 20, 0],
  );
});

test('the committed corpus parses into its families; media items are feed rows, not pages', () => {
  const corpus = parseSectionedList(readFileSync(path.join(PLANNING, 'skoda-rail-feed-corpus.txt'), 'utf8'));
  const fams = new Set(corpus.map((r) => r.family));
  ['models', 'series', 'press-releases', 'press-kits', 'stories'].forEach((f) => assert.ok(fams.has(f), f));
  assert.ok(!fams.has('other'));
  assert.ok(!fams.has('home'));
  // SKODA-608 (option B): images/videos live in /en/media-feed.json, so the page corpus has none.
  assert.ok(!fams.has('images') && !fams.has('videos'));
  assert.ok(!corpus.some((r) => r.unmapped), 'no unmapped ?attachment_id= rows');
  assert.ok(!corpus.some((r) => r.path === '/index'));
});

test('edsPath + attachment ids: importer-safe paths, unmapped items keyed by id', () => {
  assert.equal(edsPath('/en/06a-115_1x'), '/en/06a-115-1x');
  assert.equal(edsPath('/en/Skoda_Peaq___Part_1'), '/en/skoda-peaq-part-1');
  const [row] = parseSectionedList('# ===== IMAGES (1) =====\nhttps://www.skoda-storyboard.com/?attachment_id=454117');
  assert.deepEqual(row, { path: '?attachment_id=454117', family: 'images', unmapped: true });
  const built = buildRow({ ...row, source: 'corpus' }, {});
  assert.equal(built.previewed, '–');
  assert.match(built.note, /SKODA-608/);
});

test('mergeLists marks overlap as set+corpus and keeps the set family', () => {
  const merged = mergeLists(
    [{ path: '/en/skoda-model/epiq', family: 'models' }],
    [{ path: '/en/skoda-model/epiq', family: 'models' }, { path: '/en/skoda-model/scala', family: 'models' }],
  );
  assert.deepEqual(merged.map((r) => `${r.path}:${r.source}`), ['/en/skoda-model/epiq:set+corpus', '/en/skoda-model/scala:corpus']);
});

test('templateOf maps families to importer templates', () => {
  assert.equal(templateOf({ family: 'listings', path: '/en/videos' }), 'videos-listing');
  assert.equal(templateOf({ family: 'listings', path: '/en/images' }), 'images-listing');
  assert.equal(templateOf({ family: 'stories', path: '/en/x' }), 'story-detail');
  assert.equal(templateOf({ family: 'images', path: '/en/x' }), 'media-item');
});

test('blocksCell summarises the block check', () => {
  assert.equal(blocksCell(null), '·');
  assert.equal(blocksCell({ errors: [], pending: [] }), '✅');
  assert.equal(blocksCell({ errors: [], pending: [{ id: 'quote', fallback: 'readable' }, { id: 'promo-box', fallback: 'broken' }] }), 'quote, promo-box ⚠');
  assert.equal(blocksCell({ errors: ['hero: x', 'story-rail: y', 'hero: z'], pending: [] }), '❌ hero, story-rail');
});

test('buildRow + summarizeRows: statuses, aliases excluded from counts', () => {
  const rows = [
    buildRow({ path: '/en/a', family: 'stories', source: 'set' }, {
      local: true, da: true, preview: 200, live: 200, indexed: true, qa: 'pass', check: { errors: [], pending: [] },
    }),
    buildRow({ path: '/en/b', family: 'stories', source: 'corpus' }, { local: false, preview: 404, live: 404 }),
    buildRow({
      path: '/en/x/a', family: 'stories', source: 'set', alias: '/en/a',
    }, {}),
  ];
  assert.equal(rows[0].previewed, '✅');
  assert.equal(rows[1].published, '·');
  assert.equal(rows[2].indexed, '–');
  assert.match(rows[2].note, /alias → \/en\/a/);
  const { by, total } = summarizeRows(rows);
  assert.equal(total.pages, 2);
  assert.equal(by.stories.published, 1);
  assert.equal(by.stories.qa, 1);
});

test('renderTracker writes summary + family tables and escapes pipes', () => {
  const rows = [buildRow({ path: '/en/a', family: 'home', source: 'set' }, { local: true, note: 'a | b' })];
  const md = renderTracker(rows, {
    generated: '2026-09-25', ref: 'main', mode: 'offline', families: { home: { label: 'Home', gate: 'SKODA-609' } }, index: { rows: 3, expected: 1, present: 0 },
  });
  assert.match(md, /^# Škoda M1: per-URL status tracker/);
  assert.match(md, /\| Home \| SKODA-609 \| 1 \| 1 \|/);
  assert.match(md, /0 of 1 expected pages/);
  assert.match(md, /a \\\| b/);
});

test('statusSheet: plain-language rows, redirects and held pages explained', () => {
  const rows = [
    buildRow({ path: '/en', family: 'home', source: 'set' }, { preview: 200, live: 200, indexed: true }),
    buildRow({ path: '/en/press-kits/kit-2/images', family: 'press-kits', source: 'set' }, { preview: 404, live: 404 }),
    buildRow({ path: '/en/press-kits/old-kit', family: 'press-kits', source: 'corpus' }, { preview: 200, live: 200 }),
    buildRow({
      path: '/en/x/alias', family: 'stories', source: 'set', alias: '/en/x',
    }, {}),
    buildRow({ path: '/en/series/road-trip', family: 'series', source: 'set' }, { preview: 200, live: 404 }),
  ];
  const sheet = statusSheet(rows, {
    families: { home: { label: 'Home' }, 'press-kits': { label: 'Press kits' } },
    titles: { '/en': 'Škoda Storyboard', '/en/press-kits/kit-2': 'Kit 2 – Press Kit', '/en/x': 'X story' },
    redirects: { '/en/press-kits/old-kit/': '/en/press-kits/kit-2' },
    publicNotes: { '/en/press-kits/kit-2/images': 'Not published: 230 images, over the 200 limit.' },
    demo: new Set(['/en', '/en/press-kits/old-kit', '/en/x/alias', '/en/series/road-trip']),
    checked: '2026-09-30 13:21 UTC',
  });
  assert.deepEqual(sheet.map((r) => [r.Title, r.Status]), [
    ['Škoda Storyboard', 'live'], ['Kit 2 – Press Kit › Images', 'held'], ['Kit 2 – Press Kit', 'redirect'],
    ['X story', 'redirect'],
    ['Road trip', 'preview'],
  ]);
  assert.equal(sheet[0].Source, 'https://www.skoda-storyboard.com/en/');
  assert.equal(sheet[0].Migrated, 'https://main--demo--skoda-storyboard.aem.live/en');
  assert.equal(sheet[1].Type, 'Press kits');
  assert.equal(sheet[1].Note, 'Not published: 230 images, over the 200 limit.');
  assert.equal(sheet[2].Note, 'Redirects to /en/press-kits/kit-2');
  assert.equal(sheet[3].Note, 'Redirects to /en/x');
  assert.deepEqual(sheet.map((r) => r.Kind), ['page', 'page', 'page', 'alias', 'page']);
  assert.deepEqual(sheet.map((r) => r.Demo), ['yes', '', 'yes', '', 'yes'], 'demo pages only, never an alias');
  assert.ok(sheet.every((r) => r.Checked === '2026-09-30 13:21 UTC'));
});

test('titleFromPath reads the last segment as words', () => {
  assert.equal(titleFromPath('/en/series/road-trip'), 'Road trip');
  assert.equal(titleFromPath('/en'), 'En');
});
