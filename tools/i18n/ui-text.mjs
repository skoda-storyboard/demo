#!/usr/bin/env node
/*
 * ui-text.mjs: the site's UI text per locale (SKODA-1003).
 *
 * The English master list is the code's own: every module keeps its UI text in an object of
 * English defaults, read from the page locale's placeholders sheet under a key prefix
 * (scripts/placeholders.js `localize`). REGISTRY names those objects; this tool imports them
 * and lists every sheet key with its English text. Each locale's text is
 * tools/i18n/ui-text/{locale}.json: `{ "key": { "text": "…", "source": "live" | "draft" } }`,
 * `live` copied from the source site, `draft` written here for a native reviewer (a name or
 * tooltip the source has no counterpart for).
 *
 * Usage:
 *   node tools/i18n/ui-text.mjs --list                     the master list (key, English, module)
 *   node tools/i18n/ui-text.mjs --check [--origin <url>]   each locale's published or previewed
 *       sheet against the master list: missing keys (they show English), keys no code reads,
 *       and translations whose {tokens} differ from the English (default origin: main preview)
 *   node tools/i18n/ui-text.mjs --sheets <dir>             write each locale's sheet as DA JSON
 *   node tools/i18n/ui-text.mjs --push [--locales cs,de]   upload the sheets to DA, then preview
 *       them (credentials are injected by the environment; publishing is a separate step)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const LOCALES = ['en', 'cs', 'de', 'sk', 'sr', 'sl'];
const ORG = 'skoda-storyboard';
const SITE = 'demo';

/**
 * The modules' English label objects: [module, export, sheet-key prefix]; a prefix of `null`
 * means the module maps its keys itself, through the export named in the fourth column.
 */
export const REGISTRY = [
  ['blocks/listing/listing.js', 'SHARED_LABELS', ''],
  ['blocks/listing/listing.js', 'LISTING_LABELS', 'listing'],
  ['blocks/listing/listing.js', 'FACET_LABELS', 'listingFacet'],
  ['blocks/stories/stories.js', 'SHARED_LABELS', ''],
  ['blocks/stories/stories.js', 'STORIES_LABELS', 'stories'],
  ['blocks/search/search.js', 'SEARCH_LABELS', 'search'],
  ['blocks/downloads/downloads.js', 'DOWNLOADS_LABELS', 'downloads'],
  ['blocks/downloads/downloads.js', 'TOGGLE_LABELS', ''],
  ['blocks/gallery/gallery.js', 'GALLERY_LABELS', 'gallery'],
  ['blocks/carousel/carousel.js', 'CAROUSEL_LABELS', 'carousel'],
  ['blocks/cards/cards-social.js', 'SOCIAL_CARD_LABELS', 'cardsSocial'],
  ['blocks/story-rail/story-rail.js', 'STORY_RAIL_LABELS', 'storyRail'],
  ['blocks/header/header.js', 'HEADER_LABELS', 'header'],
  ['blocks/footer/footer-sections.js', 'FOOTER_LABELS', 'footer'],
  ['blocks/embed/embed.js', 'EMBED_LABELS', 'embed'],
  ['blocks/embed/clip-player.js', 'CLIP_LABELS', 'clip'],
  ['blocks/newsletter-stub/newsletter-stub.js', 'NEWSLETTER_LABELS', 'newsletter'],
  ['blocks/promo-box/promo-box.js', 'PROMO_LABELS', 'promo'],
  ['blocks/float-dock/float-dock.js', 'DOCK_LABELS', 'dock'],
  ['scripts/lightbox.js', 'LIGHTBOX_LABELS', 'lightbox'],
  ['scripts/lightbox.js', 'LIGHTBOX_VIDEO_LABELS', 'lightboxVideo'],
  ['scripts/media-panel.js', 'MEDIA_PANEL_LABELS', 'mediaPanel'],
  ['scripts/search-suggest.js', 'SUGGEST_LABELS', 'suggest'],
  ['scripts/card-teaser.js', 'DATE_LABELS', ''],
  ['scripts/scripts.js', 'SKIP_LINK_LABELS', ''],
  ['scripts/media-card.js', 'DEFAULT_LABELS', null, 'PLACEHOLDER_KEYS'],
  ['scripts/media-cart-ui.js', 'DEFAULT_LABELS', 'mediaCart'],
  ['templates/skoda-model/skoda-model.js', 'MODEL_LABELS', 'model'],
  ['templates/press-kit/press-kit.js', 'PRESS_KIT_LABELS', 'pressKit'],
  ['templates/press-release/press-release.js', 'PRESS_RELEASE_LABELS', 'pressRelease'],
];

const sheetKey = (prefix, key) => (prefix ? `${prefix}${key[0].toUpperCase()}${key.slice(1)}` : key);

/** The `{name}` tokens of a text, sorted (a translation must keep the English ones). */
export const tokensOf = (text) => [...new Set([...String(text).matchAll(/\{(\w+)\}|%([dq])/g)]
  .map((m) => m[1] || `%${m[2]}`))].sort();

/** A browser-like global scope, so the modules import in Node (they read window at load). */
async function installBrowserGlobals() {
  if (globalThis.window?.document) return;
  const { JSDOM } = await import('jsdom');
  // a page with one section: scripts.js (imported by some blocks) boots it on import
  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body><header></header><main><div><p>x</p></div></main><footer></footer></body></html>', { url: 'https://demo.example/en/' });
  const { window } = dom;
  window.matchMedia = window.matchMedia || (() => ({
    matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {},
  }));
  ['window', 'document', 'navigator', 'HTMLElement', 'Element', 'Node', 'MutationObserver', 'CustomEvent', 'Event', 'getComputedStyle', 'requestAnimationFrame', 'sessionStorage', 'localStorage']
    .forEach((name) => {
      // Node has its own Event classes, which the window's dispatchEvent rejects
      if (globalThis[name] === undefined || name.endsWith('Event')) {
        const value = name === 'window' ? window : window[name];
        try {
          Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
        } catch (e) { /* a getter-only global (navigator): leave Node's */ }
      }
    });
  globalThis.requestAnimationFrame ||= (fn) => setTimeout(fn, 0);
  // the boot's page-relative requests (nav, footer, the sheet) fail quietly; --check's go out
  const nodeFetch = globalThis.fetch;
  globalThis.fetch = async (url, ...rest) => (nodeFetch && /^https?:/.test(String(url))
    ? nodeFetch(url, ...rest) : { ok: false, status: 404, json: async () => ({}), text: async () => '' });
}

/**
 * The English master list: every sheet key the code reads, its English text and module.
 * @returns {Promise<Array<{key: string, text: string, module: string}>>} sorted by key
 */
export async function masterList(root = ROOT) {
  await installBrowserGlobals();
  // the page boot that scripts.js starts on import is not this tool's concern: its rejections
  // are ignored while the modules load, and only then
  const ignore = () => {};
  process.on('unhandledRejection', ignore);
  const rows = new Map();
  try {
    await collect(root, rows);
    // the boot's promise chains settle within a few turns of the event loop
    await new Promise((resolve) => { setTimeout(resolve, 50); });
  } finally {
    process.off('unhandledRejection', ignore);
  }
  return [...rows.values()].sort((a, b) => a.key.localeCompare(b.key));
}

/** Each REGISTRY object's keys into `rows` (sheet key → English text and module). */
async function collect(root, rows) {
  for (const [file, name, prefix, keysName] of REGISTRY) {
    // eslint-disable-next-line no-await-in-loop
    const mod = await import(pathToFileURL(path.join(root, file)).href);
    const labels = mod[name];
    if (!labels || typeof labels !== 'object') throw new Error(`${file}: no ${name} export`);
    const keys = prefix === null ? mod[keysName] : null;
    Object.entries(labels).forEach(([key, text]) => {
      if (typeof text !== 'string') throw new Error(`${file} ${name}.${key}: not a string`);
      const sheet = keys ? keys[key] : sheetKey(prefix, key);
      if (!sheet) throw new Error(`${file} ${name}.${key}: no sheet key`);
      const seen = rows.get(sheet);
      // a shared key (loadMore) must read the same English everywhere
      if (seen && seen.text !== text) throw new Error(`${sheet}: "${seen.text}" (${seen.module}) vs "${text}" (${file})`);
      if (!seen) rows.set(sheet, { key: sheet, text, module: file });
    });
  }
}

/** A locale's translations file ({} for English or a missing file). */
export function readTranslations(locale, root = ROOT) {
  const file = path.join(root, 'tools/i18n/ui-text', `${locale}.json`);
  return locale === 'en' || !existsSync(file) ? {} : JSON.parse(readFileSync(file, 'utf8'));
}

/**
 * Problems in a locale's text against the master list.
 * @param {Array<{key: string, text: string}>} master
 * @param {Record<string, string>} sheet key → text (a translations file's texts, or a sheet's)
 * @returns {{missing: string[], unknown: string[], tokens: string[]}}
 */
export function compare(master, sheet) {
  const english = new Map(master.map((r) => [r.key, r.text]));
  const missing = master.map((r) => r.key).filter((k) => !String(sheet[k] ?? '').trim());
  // a counted text's other plural forms are the locale's own (`moreLabelFew` next to `…One`)
  const pluralForm = (k) => {
    const m = k.match(/^(.+)(Zero|Two|Few|Many)$/);
    return !!m && english.has(`${m[1]}One`);
  };
  const unknown = Object.keys(sheet).filter((k) => !english.has(k) && !pluralForm(k));
  const base = (k) => (english.has(k) ? k : `${k.replace(/(Zero|Two|Few|Many)$/, '')}One`);
  const tokens = Object.entries(sheet)
    .filter(([k, v]) => english.has(base(k)) && String(v).trim()
      && tokensOf(v).join() !== tokensOf(english.get(base(k))).join())
    .map(([k]) => k);
  return { missing, unknown, tokens };
}

/** The DA sheet JSON of a locale: every master key, its text, and where the text comes from. */
export function buildSheet(master, locale, translations = {}) {
  const data = master.map(({ key, text }) => {
    if (locale === 'en') return { Key: key, Text: text, Source: 'code' };
    const own = translations[key];
    return own?.text ? { Key: key, Text: own.text, Source: own.source || 'draft' } : { Key: key, Text: text, Source: 'english' };
  });
  // the locale's extra plural forms (`…Few`, `…Many`), each right after its `…One` row
  const keys = new Set(master.map((r) => r.key));
  Object.entries(translations)
    .filter(([key]) => !keys.has(key) && /(Zero|Two|Few|Many)$/.test(key))
    .forEach(([key, own]) => {
      const one = `${key.replace(/(Zero|Two|Few|Many)$/, '')}One`;
      let at = data.findIndex((r) => r.Key === one);
      while (at >= 0 && at + 1 < data.length && data[at + 1].Key.startsWith(one.slice(0, -3))
        && /(Zero|Two|Few|Many)$/.test(data[at + 1].Key)) at += 1;
      const row = { Key: key, Text: own.text, Source: own.source || 'draft' };
      if (at < 0) data.push(row);
      else data.splice(at + 1, 0, row);
    });
  return {
    total: data.length, offset: 0, limit: data.length, data, ':type': 'sheet',
  };
}

const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : null;
};

async function adminFetch(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`${options?.method || 'GET'} ${url}: ${res.status} ${(await res.text()).slice(0, 200)}`);
  return res;
}

async function main() {
  const master = await masterList();
  if (process.argv.includes('--list')) {
    master.forEach((r) => console.log(`${r.key.padEnd(34)} ${r.text}  (${r.module})`));
    console.log(`${master.length} keys`);
    return;
  }
  if (process.argv.includes('--check')) {
    const origin = arg('origin') || 'https://main--demo--skoda-storyboard.aem.page';
    let problems = 0;
    for (const locale of LOCALES) {
      // eslint-disable-next-line no-await-in-loop
      const res = await fetch(`${origin}/${locale}/placeholders.json?limit=1000`);
      // eslint-disable-next-line no-await-in-loop
      const rows = res.ok ? (await res.json()).data || [] : [];
      const sheet = Object.fromEntries(rows.filter((r) => r.Key).map((r) => [r.Key, r.Text || '']));
      const { missing, unknown, tokens } = compare(master, sheet);
      problems += missing.length + tokens.length;
      console.log(`${locale}: ${res.ok ? `${rows.length} rows` : `no sheet (${res.status})`} | missing ${missing.length}`
        + ` | not read by the code ${unknown.length} | token mismatches ${tokens.length}`);
      if (tokens.length) console.log(`   tokens: ${tokens.join(', ')}`);
      if (unknown.length) console.log(`   unread: ${unknown.slice(0, 12).join(', ')}${unknown.length > 12 ? ', …' : ''}`);
    }
    process.exitCode = problems ? 1 : 0;
    return;
  }
  const sheets = Object.fromEntries(LOCALES.map((l) => [l, buildSheet(master, l, readTranslations(l))]));
  const dir = arg('sheets');
  if (dir) {
    mkdirSync(dir, { recursive: true });
    Object.entries(sheets).forEach(([l, sheet]) => writeFileSync(path.join(dir, `${l}-placeholders.json`), `${JSON.stringify(sheet, null, 2)}\n`));
    console.log(`${dir}: ${LOCALES.length} sheets of ${master.length} keys`);
  }
  if (process.argv.includes('--push')) {
    const only = (arg('locales') || LOCALES.join(',')).split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    // nothing is uploaded unless every requested locale is one of ours
    const unknown = only.filter((l) => !sheets[l]);
    if (unknown.length) throw new Error(`--locales: unknown ${unknown.join(', ')} (use ${LOCALES.join(', ')})`);
    for (const locale of only) {
      const file = `${locale}/placeholders.json`;
      const form = new FormData();
      form.append('data', new Blob([JSON.stringify(sheets[locale])], { type: 'application/json' }), 'placeholders.json');
      // eslint-disable-next-line no-await-in-loop
      await adminFetch(`https://admin.da.live/source/${ORG}/${SITE}/${file}`, { method: 'POST', body: form });
      // eslint-disable-next-line no-await-in-loop
      await adminFetch(`https://admin.hlx.page/preview/${ORG}/${SITE}/main/${file}`, { method: 'POST' });
      console.log(`${file}: uploaded and previewed (${sheets[locale].data.length} rows)`);
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e.message); process.exitCode = 1; });
}
