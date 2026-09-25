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
  registryProblems,
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
});

test('classifyBlock: pending variant of a main block (cards tiles, gallery slider, columns split)', () => {
  const tiles = classifyBlock(one(block('cards overlay tiles', row('sq', 'x'))), CONTRACTS, CODE);
  assert.equal(tiles.status, 'pending');
  assert.equal(tiles.id, 'cards-tiles');
  assert.equal(classifyBlock(one(block('gallery slider', row('x'))), CONTRACTS, CODE).id, 'gallery-slider');
  assert.equal(classifyBlock(one(block('columns split-62', row('a', 'b'))), CONTRACTS, CODE).id, 'columns-split');
});

test('classifyBlock: pending block without code (quote, in-page-nav)', () => {
  const code = new Set([...CODE].filter((b) => b !== 'quote'));
  const q = classifyBlock(one(block('quote', row('Q', 'A'))), CONTRACTS, code);
  assert.equal(q.status, 'pending');
  assert.equal(q.ticket, 'SKODA-220');
  assert.equal(classifyBlock(one(block('in-page-nav', row('<a href="#x">X</a>'))), CONTRACTS, code).id, 'in-page-nav');
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
  assert.match(promo.problems[0], /emit promo-box instead/);
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

test('classifyBlock: pending contract with its own config keys (promo-box index mode)', () => {
  const code = new Set([...CODE]);
  const ok = classifyBlock(one(block('promo-box', row('template', 'story'), row('limit', '3'))), CONTRACTS, code);
  assert.equal(ok.status, 'pending');
  const bad = classifyBlock(one(block('promo-box', row('template', 'story'), row('rotate', '10'))), CONTRACTS, code);
  assert.equal(bad.status, 'error');
});

// ---- page -----------------------------------------------------------------------------

test('checkPage: pending ids de-duplicated; broken fallback holds publish', () => {
  const html = page(
    block('quote', row('Q1', 'A1')),
    block('quote', row('Q2', 'A2')),
    block('metadata', row('template', 'press-release')),
  );
  const r = checkPage(html, CONTRACTS, CODE);
  assert.deepEqual(r.pending, [{ id: 'quote', ticket: 'SKODA-220', fallback: 'readable' }]);
  assert.equal(r.publishable, true);
  const promo = checkPage(page(block('promo-box', row('<a href="/en/a"><img src="a.jpg"></a>', '<a href="/en/a">A</a>'))), CONTRACTS, CODE);
  assert.equal(promo.errors.length, 0);
  assert.equal(promo.publishable, false);
});

// ---- registry ---------------------------------------------------------------------------

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
