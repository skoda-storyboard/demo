/* SKODA-1003: the UI text master list and the per-locale translation files stay in step with
 * the code. Run: node --test tools/i18n/ui-text.test.mjs */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  REGISTRY, LOCALES, masterList, readTranslations, compare, buildSheet, tokensOf,
} from './ui-text.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
// label objects that reach the sheet through another module's (the header passes its own)
const FOLDED = { 'blocks/header/header-locales.js LOCALE_LIST_LABELS': ['blocks/header/header.js', 'HEADER_LABELS'] };

const sources = (dir) => readdirSync(path.join(ROOT, dir), { recursive: true })
  .filter((f) => f.endsWith('.js') && !f.includes('.test.'))
  .map((f) => path.join(dir, f).split(path.sep).join('/'));

const master = await masterList(ROOT);
const english = new Map(master.map((r) => [r.key, r.text]));

test('the registry names every exported label object', async () => {
  const exported = ['blocks', 'scripts', 'templates'].flatMap(sources).flatMap((file) => [
    ...readFileSync(path.join(ROOT, file), 'utf8').matchAll(/^export const (\w*LABELS) =/gm),
  ].map((m) => `${file} ${m[1]}`));
  const registered = new Set(REGISTRY.map(([file, name]) => `${file} ${name}`));
  const missing = exported.filter((id) => !registered.has(id) && !FOLDED[id]);
  assert.deepEqual(missing, [], 'add these to REGISTRY in tools/i18n/ui-text.mjs');
  await Promise.all(Object.entries(FOLDED).map(async ([id, [file, name]]) => {
    const [own, ownName] = id.split(' ');
    const from = (await import(path.join(ROOT, own)))[ownName];
    const into = (await import(path.join(ROOT, file)))[name];
    Object.entries(from).forEach(([key, text]) => assert.equal(into[key], text, `${id}.${key}`));
  }));
});

test('the master list has unique sheet keys with English text', () => {
  assert.ok(master.length > 200);
  assert.equal(new Set(master.map((r) => r.key)).size, master.length);
  master.forEach(({ key, text }) => {
    assert.match(key, /^[a-z][A-Za-z0-9]*$/, key);
    assert.ok(text.trim(), `${key}: empty English`);
  });
});

test('the English sheet is the master list', () => {
  const { data } = buildSheet(master, 'en');
  assert.deepEqual(data.map((r) => [r.Key, r.Text]), master.map((r) => [r.key, r.text]));
});

LOCALES.filter((l) => l !== 'en').forEach((locale) => {
  test(`${locale}: every key translated, no unknown keys, the English {tokens}`, () => {
    const own = readTranslations(locale, ROOT);
    const texts = Object.fromEntries(Object.entries(own).map(([k, v]) => [k, v.text]));
    assert.deepEqual(compare(master, texts), { missing: [], unknown: [], tokens: [] });
    Object.entries(own).forEach(([key, v]) => assert.ok(['live', 'draft'].includes(v.source), `${key}: source`));
  });

  test(`${locale}: a counted {n} text has the locale's integer plural forms`, () => {
    const own = readTranslations(locale, ROOT);
    const rules = new Intl.PluralRules(locale);
    const forms = new Set(Array.from({ length: 200 }, (_, n) => rules.select(n)));
    const names = {
      zero: 'Zero', two: 'Two', few: 'Few', many: 'Many',
    };
    master.filter(({ key, text }) => key.endsWith('One') && tokensOf(text).includes('n'))
      .forEach(({ key }) => {
        const base = key.slice(0, -3);
        [...forms].filter((f) => names[f]).forEach((f) => {
          assert.ok(own[`${base}${names[f]}`]?.text, `${locale}: ${base}${names[f]} (${f})`);
        });
      });
  });

  test(`${locale}: the sheet keeps every master key, then the plural forms`, () => {
    const { data } = buildSheet(master, locale, readTranslations(locale, ROOT));
    assert.deepEqual(data.slice(0, master.length).map((r) => r.Key), master.map((r) => r.key));
    data.forEach((r) => assert.notEqual(r.Source, 'english', `${locale}: ${r.Key} falls back to English`));
    data.slice(master.length).forEach((r) => assert.ok(!english.has(r.Key) && /(Two|Few|Many|Zero)$/.test(r.Key)));
  });
});
