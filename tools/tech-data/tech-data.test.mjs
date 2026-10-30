import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  hasDecimalComma, modelsForPage, modelsForPath, normalizePath, pageTags, parseFigure,
  parseTechDataHref, readMetadata, readSheet, sameFigure, techDataHref, textOf, valuesOfModels,
} from './tech-data.js';

const seed = JSON.parse(fs.readFileSync(new URL('./tech-data.seed.json', import.meta.url), 'utf8'));

test('parseTechDataHref reads relative and absolute sheet links', () => {
  assert.deepEqual(parseTechDataHref('/data/tech-data.json#peaq-90.range'), { key: 'peaq-90.range', model: 'peaq-90', field: 'range' });
  assert.equal(parseTechDataHref('https://main--demo--skoda-storyboard.aem.page/data/tech-data.json#peaq.range').key, 'peaq.range');
  assert.equal(parseTechDataHref('/data/tech-data.json#peaq-90.range&amp;x'), null);
});

test('parseTechDataHref rejects other links and malformed keys', () => {
  ['/en/skoda-model/peaq', '/data/tech-data.json', '/data/other.json#peaq.range', '/data/tech-data.json#Peaq.range',
    '/data/tech-data.json#peaq', '/data/tech-data.json#%E0%A4%A', '', undefined, null, 42]
    .forEach((href) => assert.equal(parseTechDataHref(href), null, String(href)));
});

test('techDataHref round-trips', () => {
  assert.equal(parseTechDataHref(techDataHref('enyaq-coupe-85x.range')).key, 'enyaq-coupe-85x.range');
});

test('parseFigure splits numbers and unit, however the range is typeset', () => {
  assert.deepEqual(parseFigure('458 - 646 km'), { numbers: [458, 646], unit: 'km' });
  assert.deepEqual(parseFigure('408–453 km'), { numbers: [408, 453], unit: 'km' });
  assert.deepEqual(parseFigure('5,4 s'), { numbers: [5.4], unit: 's' });
  assert.deepEqual(parseFigure('2,965 mm'), { numbers: [2965], unit: 'mm' });
  assert.deepEqual(parseFigure('15.0 kWh/100km'), { numbers: [15], unit: 'kWh/100 km' });
  assert.equal(parseFigure('Range'), null);
  assert.equal(parseFigure(''), null);
});

test('sameFigure compares numbers and unit, not punctuation', () => {
  assert.ok(sameFigure('459 - 647 km', '459 – 647 km'));
  assert.ok(sameFigure('5,4 s', '5.4 s'));
  assert.ok(!sameFigure('458 - 646 km', '459 – 647 km'));
  assert.ok(!sameFigure('647 km', '647 kWh'));
  assert.ok(!sameFigure('647 km', '459 – 647 km'));
  assert.ok(!sameFigure('n/a', 'n/a'));
});

test('hasDecimalComma tells a decimal comma from a thousands separator', () => {
  assert.ok(hasDecimalComma('5,4 s'));
  assert.ok(!hasDecimalComma('2,965 mm'));
  assert.ok(!hasDecimalComma('5.4 s'));
});

test('textOf strips tags and decodes entities', () => {
  assert.equal(textOf('<strong>459&nbsp;&ndash; 647&#160;km</strong>'), '459 – 647 km');
});

test('readSheet builds display values and skips invalid rows', () => {
  const sheet = readSheet({
    values: {
      data: [
        { key: 'peaq-90.range', value: '647', unit: 'km' },
        { key: 'bad key', value: '1' },
        { key: 'peaq.boot', value: '' },
      ],
    },
    models: { data: [{ code: 'peaq', pages: '/en/skoda-model/peaq, /en/x' }, { code: '' }] },
  });
  assert.equal(sheet.values.get('peaq-90.range').display, '647 km');
  assert.equal(sheet.values.get('peaq-90.range').model, 'peaq-90');
  assert.equal(sheet.values.size, 1);
  assert.deepEqual(sheet.models[0].pages, ['/en/skoda-model/peaq', '/en/x']);
  assert.equal(sheet.skipped, 3);
  assert.deepEqual(readSheet(null), {
    values: new Map(), models: [], records: [], skipped: 0,
  });
});

test('the seed sheet: every row is valid, every model has pages, version rows group under their model', () => {
  const sheet = readSheet(seed);
  assert.equal(sheet.skipped, 0);
  assert.equal(sheet.values.size, seed.values.data.length);
  sheet.models.forEach((m) => {
    assert.ok(m.pages.length, m.code);
    assert.ok(sheet.values.get(`${m.code}.range`), `${m.code}.range`);
  });
  assert.equal(sheet.values.get('peaq-90.range').display, '647 km');
  assert.equal(sheet.values.get('peaq-90.range').model, 'peaq');
  assert.equal(sheet.values.get('peaq.range').display, '459 – 647 km');
  assert.ok(valuesOfModels(sheet.values, ['peaq']).some((v) => v.key === 'peaq-90x.range'));
});

test('readMetadata reads DA and imported metadata blocks; pageTags joins model, derivative and tags', () => {
  const da = '<main><div><p>x</p></div><div class="metadata"><div><div><p>Tags</p></div><div><p>elroq</p><p>rs</p></div></div><div><div><p>model</p></div><div><p>elroq</p></div></div></div></main>';
  assert.equal(readMetadata(da).get('tags'), 'elroq, rs');
  const imported = '<div class="metadata"><div><div>tags</div><div>elroq, rs</div></div><div><div>derivative</div><div>rs</div></div><div><div>Image</div><div><picture><img src="x.png"></picture></div></div></div>';
  assert.deepEqual(pageTags(imported), ['rs', 'elroq', 'rs']);
  assert.deepEqual([...readMetadata('<p>no block</p>')], []);
});

test('modelsForPage: listed path first, then the most specific tag match, excluded tags respected', () => {
  const { models } = readSheet(seed);
  const codes = (page) => modelsForPage(models, page).map((m) => m.code);
  assert.deepEqual(codes({ path: '/en/skoda-model/elroq/elroq-rs', tags: ['peaq'] }), ['elroq-rs'], 'path wins');
  assert.deepEqual(codes({ path: '/drafts/a', tags: ['elroq', 'rs'] }), ['elroq-rs']);
  assert.deepEqual(codes({ path: '/drafts/a', tags: ['enyaq', 'coupe-en'] }), ['enyaq-coupe']);
  assert.deepEqual(codes({ path: '/drafts/a', tags: ['enyaq', 'suv', 'sportline'] }), []);
  assert.deepEqual(codes({ path: '/drafts/a', tags: ['2026', 'peaq', 'emobility'] }), ['peaq']);
  assert.deepEqual(codes({ path: '/drafts/a' }), []);
});

test('modelsForPath matches with or without extension and trailing slash', () => {
  const { models } = readSheet(seed);
  assert.equal(modelsForPath(models, '/en/skoda-model/peaq/')[0].code, 'peaq');
  assert.equal(modelsForPath(models, '/en/skoda-model/peaq.plain.html')[0].code, 'peaq');
  assert.equal(modelsForPath(models, '/en/skoda-model/elroq/elroq-rs')[0].code, 'elroq-rs');
  assert.deepEqual(modelsForPath(models, '/en/skoda-model/elroq/elroq-sportline'), []);
  assert.equal(normalizePath('/'), '/');
});
