/*
 * Unit tests for the SKODA-603 pending-block contract check (pure; no network, no fs
 * except reading the committed registry + doc).
 * Run: node --test tools/importer/push/block-check.test.mjs
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  textOf, normKey, blockLabel, parseBlocks, configProblems, classifyBlock, checkPage,
  registryProblems, sectionStyles,
} from './block-check.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..', '..');
const CONTRACTS = JSON.parse(readFileSync(path.join(HERE, 'block-contracts.json'), 'utf8'));
const CODE = new Set(Object.keys(CONTRACTS.main));

const row = (...cells) => `<div>${cells.map((c) => `<div>${c}</div>`).join('')}</div>`;
const block = (cls, ...rows) => `<div class="${cls}">${rows.join('')}</div>`;
const page = (...sections) => sections.map((s) => `<div>${s}</div>`).join('\n');
const one = (html) => parseBlocks(page(html))[0];

// ---- parsing ----------------------------------------------------------------

test('textOf / normKey / blockLabel', () => {
  assert.equal(textOf('<p>View&nbsp;all <b>x</b></p>'), 'View all x');
  assert.equal(normKey('View all'), 'view-all');
  assert.equal(normKey(' Template '), 'template');
  assert.equal(blockLabel('cards', ['overlay', 'tiles']), 'cards (overlay, tiles)');
  assert.equal(blockLabel('quote'), 'quote');
});

test('parseBlocks reads section > block > row > cell, skips default content', () => {
  const html = page(
    '<h2>Intro</h2><p>text</p>',
    block('cards overlay', row('<picture><img src="a.jpg"></picture>', '<p><a href="/en/x">X</a></p>')),
    block('metadata', row('template', 'story')),
  );
  const blocks = parseBlocks(html);
  assert.deepEqual(blocks.map((b) => b.name), ['cards', 'metadata']);
  assert.deepEqual(blocks[0].variants, ['overlay']);
  const [img, body] = blocks[0].rows[0].cells;
  assert.equal(img.media, true);
  assert.equal(body.link, true);
  assert.equal(body.text, 'X');
});

test('parseBlocks keeps nested divs inside a cell in that cell', () => {
  const b = one(block('spec-table', row('<div><div>Power</div></div>', '85 kW')));
  assert.equal(b.rows.length, 1);
  assert.equal(b.rows[0].cells.length, 2);
  assert.equal(b.rows[0].cells[0].text, 'Power');
});

// ---- config rows -----------------------------------------------------------------

test('configProblems: pure config table with an unknown key (the 208 subheading bug)', () => {
  const b = one(block('story-rail', row('heading', 'News'), row('subheading', 'Based on tags'), row('template', 'press-release')));
  assert.deepEqual(configProblems(b, CONTRACTS.main['story-rail'].configKeys), ['unknown config key "subheading"']);
});

test('configProblems: curated rails and clean config tables pass', () => {
  const curated = one(block('story-rail', row('<picture><img src="a.jpg"></picture>', '<a href="/en/a">A</a>')));
  assert.deepEqual(configProblems(curated, CONTRACTS.main['story-rail'].configKeys), []);
  const cfg = one(block('story-rail', row('template', 'story'), row('View all', '<a href="/en/x">x</a>'), row('model', 'peaq')));
  assert.deepEqual(configProblems(cfg, CONTRACTS.main['story-rail'].configKeys), []);
});

test('configProblems: mixing config and curated rows is flagged', () => {
  const b = one(block('story-rail', row('template', 'story'), row('<picture><img src="a.jpg"></picture>', 'A')));
  assert.deepEqual(configProblems(b, CONTRACTS.main['story-rail'].configKeys), ['mixes config rows with curated rows']);
});

test('configProblems mode "only": listing rejects keys its code does not read', () => {
  const b = one(block('listing', row('template', 'story'), row('tags', 'roads-places')));
  assert.deepEqual(configProblems(b, CONTRACTS.main.listing.configKeys, 'only'), ['unknown config key "tags"']);
});

// ---- classification -----------------------------------------------------------------

test('classifyBlock: main block with supported variant', () => {
  const r = classifyBlock(one(block('cards overlay', row('a', 'b'))), CONTRACTS, CODE);
  assert.equal(r.status, 'main');
  assert.deepEqual(r.problems, []);
  const downloads = classifyBlock(one(block('downloads media-box', row('', 'PDF', '<a href="/file.pdf">PDF</a>'))), CONTRACTS, CODE);
  assert.equal(downloads.status, 'main');
  assert.deepEqual(downloads.problems, []);
});

test('classifyBlock: tiles are on main; gallery slider and columns split remain pending', () => {
  const tiles = classifyBlock(one(block('cards overlay tiles', row('sq', 'x'))), CONTRACTS, CODE);
  assert.equal(tiles.status, 'main');
  assert.equal(classifyBlock(one(block('gallery slider', row('x'))), CONTRACTS, CODE).id, 'gallery-slider');
  assert.equal(classifyBlock(one(block('columns split-62', row('a', 'b'))), CONTRACTS, CODE).id, 'columns-split');
  // shape 2 (SKODA-225): the authored portrait width travels as a second variant
  const portrait = classifyBlock(one(block('columns split-62 portrait-235', row('a', 'b'))), CONTRACTS, CODE);
  assert.equal(portrait.id, 'columns-split');
  assert.deepEqual(portrait.problems, []);
  assert.equal(classifyBlock(one(block('columns split-62 portrait-2350', row('a', 'b'))), CONTRACTS, CODE).status, 'error', 'portrait over 999px');
});

// A pinned block with no code yet. Quote (SKODA-220) and Accordion (SKODA-805c) were the
// real ones until their blocks landed; the path still needs covering.
const FUTURE = {
  id: 'future-block', block: 'future-block', status: 'pinned', ticket: 'SKODA-000', fallback: 'readable', shape: 1, emittedBy: [],
};
const WITH_FUTURE = { ...CONTRACTS, pending: [...CONTRACTS.pending, FUTURE] };

test('classifyBlock: pending block without code; quote, accordion and banner columns are on main', () => {
  const f = classifyBlock(one(block('future-block', row('Q', 'A'))), WITH_FUTURE, CODE);
  assert.equal(f.status, 'pending');
  assert.equal(f.ticket, 'SKODA-000');
  assert.equal(classifyBlock(one(block('in-page-nav', row('<a href="#x">X</a>'))), CONTRACTS, CODE).id, 'in-page-nav');
  for (const cls of ['quote', 'accordion', 'columns banners']) {
    const r = classifyBlock(one(block(cls, row('a', 'b'))), CONTRACTS, CODE);
    assert.equal(r.status, 'main', cls);
    assert.deepEqual(r.problems, [], cls);
  }
});

test('classifyBlock: unknown block / unknown variant are errors', () => {
  const u = classifyBlock(one(block('mystery', row('x'))), CONTRACTS, CODE);
  assert.equal(u.status, 'error');
  assert.match(u.problems[0], /not in the pending registry/);
  const v = classifyBlock(one(block('cards wobbly', row('x'))), CONTRACTS, CODE);
  assert.equal(v.status, 'error');
  assert.match(v.problems[0], /wobbly/);
});

test('classifyBlock: superseded shapes point at their contract', () => {
  const promo = classifyBlock(one(block('cards promo', row('a', 'b'))), CONTRACTS, CODE);
  assert.equal(promo.status, 'error');
  assert.match(promo.problems[0], /emit promo-box instead \(on main\)/);
  const version = classifyBlock(one(block('version', row('Power', '85'))), CONTRACTS, CODE);
  assert.match(version.problems[0], /spec-table \(versions\)/);
});

test('classifyBlock: resolve + out-of-scope contracts block the import', () => {
  const hero = classifyBlock(one(block('hero', row('<picture><img src="a.jpg"></picture>'))), CONTRACTS, CODE);
  assert.equal(hero.status, 'error');
  assert.match(hero.problems[0], /Hero Image \(overlay\)/);
  const sp = classifyBlock(one(block('skodapedia', row('x'))), CONTRACTS, CODE);
  assert.match(sp.problems[0], /out of M1 scope/);
});

test('classifyBlock: promo-box is on main (PR #110) with its own config keys', () => {
  const ok = classifyBlock(one(block('promo-box', row('template', 'story'), row('limit', '3'))), CONTRACTS, CODE);
  assert.equal(ok.status, 'main');
  const bad = classifyBlock(one(block('promo-box', row('template', 'story'), row('rotate', '10'))), CONTRACTS, CODE);
  assert.equal(bad.status, 'error');
});

test('classifyBlock: a pending config key (story-rail subheading, 208) is pending, not an error', () => {
  const r = classifyBlock(one(block('story-rail', row('heading', 'News'), row('subheading', 'Based on tags'), row('template', 'press_release'))), CONTRACTS, CODE);
  assert.equal(r.status, 'main');
  assert.deepEqual(r.problems, []);
  assert.equal(r.pendingKeys[0].id, 'story-rail-subheading');
  const bad = classifyBlock(one(block('story-rail', row('heading', 'News'), row('wobble', 'x'), row('template', 'story'))), CONTRACTS, CODE);
  assert.equal(bad.status, 'error');
});

// ---- page -----------------------------------------------------------------------------

test('checkPage: pending ids de-duplicated; a pending BLOCK (no code) holds publish', () => {
  const html = page(
    block('future-block', row('Q1', 'A1')),
    block('future-block', row('Q2', 'A2')),
    block('metadata', row('template', 'press-release')),
  );
  const r = checkPage(html, WITH_FUTURE, CODE);
  assert.deepEqual(r.pending, [{
    id: 'future-block', ticket: 'SKODA-000', fallback: 'readable', missingCode: true,
  }]);
  assert.equal(r.errors.length, 0);
  assert.equal(r.publishable, false); // future-block.js would 404
  const quotes = checkPage(page(block('quote', row('Q', 'A'))), CONTRACTS, CODE);
  assert.equal(quotes.publishable, true, 'blocks/quote exists (SKODA-220)');
});

test('checkPage: implemented tiles may publish; broken pending config still holds', () => {
  const tiles = checkPage(page(block(
    'cards overlay tiles',
    row('sq', '<picture><img src="a.jpg"></picture>', '<a href="/en/a">A</a>'),
    row('sq', '<picture><img src="b.jpg"></picture>', '<a href="/en/b">B</a>'),
  )), CONTRACTS, CODE);
  assert.equal(tiles.errors.length, 0);
  assert.equal(tiles.publishable, true);
  const sub = checkPage(page(block('story-rail', row('heading', 'News'), row('subheading', 'x'), row('template', 'story'))), CONTRACTS, CODE);
  assert.equal(sub.errors.length, 0);
  assert.deepEqual(sub.pending.map((p) => p.id), ['story-rail-subheading']);
  assert.equal(sub.publishable, false); // broken until 208: settings render as cards
  const promo = checkPage(page(block('promo-box', row('<a href="/en/a"><img src="a.jpg"></a>', '<a href="/en/a">A</a>'))), CONTRACTS, CODE);
  assert.equal(promo.errors.length, 0);
  assert.equal(promo.publishable, true);
});

test('checkPage: press-kit legacy tokens block publication until shape-3 re-import', () => {
  const legacy = page(block(
    'cards overlay tiles',
    row('feature', '<picture><img src="a.jpg"></picture>', '<a href="/en/a">A</a>'),
    row('sq', '<picture><img src="b.jpg"></picture>', '<a href="/en/b">B</a>'),
  ));
  const result = checkPage(legacy, CONTRACTS, CODE, '/en/press-kits/epiq');
  assert.equal(result.publishable, false);
  assert.match(result.errors.join(' '), /re-import press-kit tiles with shape-3 size tokens/);

  const motorsport = page(block(
    'cards overlay tiles',
    ...Array.from({ length: 24 }, (_, i) => row('sq', '<picture><img src="a.jpg"></picture>', `<a href="/en/${i}">${i}</a>`)),
  ));
  assert.equal(checkPage(motorsport, CONTRACTS, CODE, '/en/press-kits/motorsport').publishable, false);

  const updated = page(block(
    'cards overlay tiles',
    row('feature', '<picture><img src="a.jpg"></picture>', '<a href="/en/a">A</a>'),
    row('feature', '<picture><img src="b.jpg"></picture>', '<a href="/en/b">B</a>'),
    row('press-square', '<picture><img src="c.jpg"></picture>', '<a href="/en/c">C</a>'),
  ));
  assert.equal(checkPage(updated, CONTRACTS, CODE, '/en/press-kits/epiq').publishable, true);
});

test('checkPage: tiles reject unknown sizes, overfilled rows and missing overlay', () => {
  const invalid = page(block(
    'cards overlay tiles',
    row('sq', '<picture><img src="a.jpg"></picture>', '<a href="/en/a">A</a>'),
    row('mystery', '<picture><img src="b.jpg"></picture>', '<a href="/en/b">B</a>'),
  ));
  assert.match(checkPage(invalid, CONTRACTS, CODE).errors.join(' '), /invalid size token/);
  const overfill = page(block(
    'cards overlay tiles',
    row('sq', '<picture><img src="a.jpg"></picture>', '<a href="/en/a">A</a>'),
    row('third', '<picture><img src="b.jpg"></picture>', '<a href="/en/b">B</a>'),
    row('third', '<picture><img src="c.jpg"></picture>', '<a href="/en/c">C</a>'),
  ));
  assert.match(checkPage(overfill, CONTRACTS, CODE).errors.join(' '), /overfills/);
  const noOverlay = page(block(
    'cards tiles',
    row('sq', '<picture><img src="a.jpg"></picture>', '<a href="/en/a">A</a>'),
    row('sq', '<picture><img src="b.jpg"></picture>', '<a href="/en/b">B</a>'),
  ));
  assert.match(checkPage(noOverlay, CONTRACTS, CODE).errors.join(' '), /requires the overlay/);
  const missingImage = page(block(
    'cards overlay tiles',
    row('sq', '', '<a href="/en/a">A</a>'),
    row('sq', '<picture><img src="b.jpg"></picture>', '<a href="/en/b">B</a>'),
  ));
  assert.match(checkPage(missingImage, CONTRACTS, CODE).errors.join(' '), /expected \[size, picture, linked title\]/);
});

test('checkPage: tiles reject titles that the renderer cannot decorate', () => {
  const invalidTitles = [
    '<a href="/en/a"></a>',
    '<a href="">A</a>',
    '<a href="  ">A</a>',
    '<a href="&#32;">A</a>',
    '<a href="&#x20;">A</a>',
    '<a href="&nbsp;">A</a>',
    '<a>A</a>',
    '<a data-href="/en/a">A</a>',
    '<a href="/en/a">&nbsp;</a>',
    '<a href="/en/a">A</a><a href="/en/b">B</a>',
    '<p>Extra <a href="/en/a">A</a></p>',
  ];
  invalidTitles.forEach((title) => {
    const html = page(block(
      'cards overlay tiles',
      row('sq', '<picture><img src="a.jpg"></picture>', title),
      row('sq', '<picture><img src="b.jpg"></picture>', '<a href="/en/b">B</a>'),
    ));
    const result = checkPage(html, CONTRACTS, CODE);
    assert.equal(result.publishable, false, title);
    assert.match(result.errors.join(' '), /expected \[size, picture, linked title\]/, title);
  });
  const valid = page(block(
    'cards overlay tiles',
    row('sq', '<picture><img src="a.jpg"></picture>', '<p><a href="/en/a"><span>A &amp; B</span></a></p>'),
    row('sq', '<picture><img src="b.jpg"></picture>', '<a href="/en/b">B</a>'),
  ));
  assert.equal(checkPage(valid, CONTRACTS, CODE).publishable, true);
});

// ---- registry ---------------------------------------------------------------------------

test('sectionStyles reads each Section Metadata style row as normalised tokens', () => {
  const html = page(
    `<p>Body</p>${block('section-metadata', row('Style', 'body-column'))}`,
    `<p>Panel</p>${block('section-metadata', row('style', '<p>Body-Column, Highlight-Dark</p>'))}`,
    block('section-metadata', row('background', 'x')),
  );
  assert.deepEqual(sectionStyles(html), [['body-column'], ['body-column', 'highlight-dark']]);
});

test('checkPage: a highlight section style is the SKODA-824 contract and publishes (runtime landed)', () => {
  const body = `<p>Intro</p>${block('section-metadata', row('style', 'body-column'))}`;
  const panel = (variant) => `<h3>Panel</h3>${block('section-metadata', row('style', `body-column, highlight-${variant}`))}`;
  const r = checkPage(page(body, panel('dark'), panel('grey')), CONTRACTS, CODE);
  assert.deepEqual(r.pending, [{
    id: 'highlight', ticket: 'SKODA-824', fallback: 'readable', missingCode: false,
  }]);
  assert.equal(r.errors.length, 0);
  assert.equal(r.publishable, true);
  const plain = checkPage(page(body, block('section-metadata', row('style', 'dark, full-width'))), CONTRACTS, CODE);
  assert.deepEqual(plain.pending, [], 'unrelated section styles are not the highlight contract');
  assert.equal(plain.publishable, true);
});

test('checkPage: a section-style contract with a broken fallback holds publish', () => {
  // the hold mechanism the highlight contract used until its runtime landed (SKODA-824)
  const held = {
    ...CONTRACTS,
    pending: CONTRACTS.pending.map((c) => (c.id === 'highlight' ? { ...c, fallback: 'broken' } : c)),
  };
  const panel = `<h3>Panel</h3>${block('section-metadata', row('style', 'body-column, highlight-dark'))}`;
  const r = checkPage(page(panel), held, CODE);
  assert.deepEqual(r.pending, [{
    id: 'highlight', ticket: 'SKODA-824', fallback: 'broken', missingCode: false,
  }]);
  assert.equal(r.errors.length, 0);
  assert.equal(r.publishable, false);
});

test('committed registry is self-consistent and fully documented', () => {
  const doc = readFileSync(path.join(ROOT, CONTRACTS.doc), 'utf8');
  assert.deepEqual(registryProblems(CONTRACTS, doc), []);
});

test('registryProblems flags duplicate ids and undocumented entries', () => {
  const c = {
    pending: [{
      id: 'a', ticket: 'T', fallback: 'readable', shape: 1,
    }, {
      id: 'a', ticket: 'T', fallback: 'nope', shape: 1,
    }],
  };
  const p = registryProblems(c, '### a\n');
  assert.ok(p.includes('duplicate id a'));
  assert.ok(p.some((x) => /fallback/.test(x)));
  assert.ok(registryProblems(c, '').some((x) => /no "### a"/.test(x)));
});
