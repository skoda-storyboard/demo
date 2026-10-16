/*
 * Every file a stylesheet loads with url() exists in the repo. A missing mask image isn't a
 * visible error: the browser just doesn't paint the masked layer (the blank rail arrows, #361).
 * Run: node --test scripts/css-assets.test.mjs
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile, access } from 'node:fs/promises';
import {
  dirname, join, relative, resolve,
} from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const cssFiles = async (dir) => {
  const entries = await readdir(join(ROOT, dir), { withFileTypes: true, recursive: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith('.css'))
    .map((e) => join(e.parentPath ?? e.path, e.name));
};

test('every local url() in blocks, templates and styles CSS resolves to a file (#361)', async () => {
  const files = (await Promise.all(['blocks', 'templates', 'styles'].map(cssFiles))).flat();
  const missing = [];
  await Promise.all(files.map(async (file) => {
    const css = (await readFile(file, 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '');
    const urls = [...css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)].map((m) => m[1].trim())
      .filter((u) => !/^(data:|https?:|#)/.test(u));
    await Promise.all(urls.map(async (u) => {
      const path = u.replace(/[?#].*$/, '');
      const target = path.startsWith('/') ? join(ROOT, path) : resolve(dirname(file), path);
      try { await access(target); } catch { missing.push(`${relative(ROOT, file)} → ${u}`); }
    }));
  }));
  assert.ok(files.length > 10, 'found the stylesheets');
  assert.deepEqual(missing.sort(), []);
});
