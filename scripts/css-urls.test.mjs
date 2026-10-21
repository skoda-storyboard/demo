/*
 * Every relative url() in the site CSS points at a file in the repo (#361): #284 deleted
 * icons/rail-arrow-*.svg while story-rail.css still masked the rail arrows with them, so the
 * arrow layer 404'd and stopped painting on four templates. A missing mask, icon, font or
 * image file fails here instead of in QA.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const cssFiles = (dir) => readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((e) => {
  const path = join(dir, e.name);
  if (e.isDirectory()) return cssFiles(path);
  return e.name.endsWith('.css') ? [path] : [];
});

// url(...) targets that are files of this site: not data: / absolute / root-relative / fragments
const localRefs = (css) => [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g)]
  .map((m) => m[2].trim())
  .filter((u) => !/^(data:|[a-z][a-z\d+.-]*:|\/|#|var\()/i.test(u))
  .map((u) => u.split(/[?#]/)[0]);

test('every relative url() in blocks/, templates/ and styles/ CSS resolves to a file', () => {
  const files = ['blocks', 'templates', 'styles'].flatMap(cssFiles);
  assert.ok(files.length > 20, 'CSS files found');
  const missing = files.flatMap((file) => localRefs(readFileSync(join(ROOT, file), 'utf8'))
    .filter((ref) => !existsSync(join(ROOT, dirname(file), ref)))
    .map((ref) => `${file}: ${ref} → ${relative(ROOT, join(ROOT, dirname(file), ref))}`));
  assert.deepEqual(missing, []);
});
