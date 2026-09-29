import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { binarySource } from './binary-media.mjs';

// Guards on the committed manifest itself. Both failures are silent at runtime:
// JSON.parse keeps the last copy of a duplicated key, and binaryLookups() keys every URL of a
// row into one Map, so a foreign URL in seen_urls re-points another file at that row.
const file = process.env.MEDIA_MANIFEST
  || fileURLToPath(new URL('./media-manifest.json', import.meta.url));
const text = readFileSync(file, 'utf8');
const { rows } = JSON.parse(text);

// File name without the WordPress rendition suffix (-WxH), lower-cased.
const stem = (url) => decodeURIComponent(new URL(url).pathname.split('/').pop())
  .toLowerCase().replace(/-\d+x\d+(?=\.[a-z0-9]+$)/, '');

test('media-manifest.json has no duplicate row keys (a rewrite would drop the first copy)', () => {
  const keys = [...text.matchAll(/^ {4}"([^"]+)": \{$/gm)].map((m) => m[1]);
  const seen = new Set();
  const duplicated = keys.filter((key) => (seen.has(key) ? true : (seen.add(key), false)));
  assert.deepEqual(duplicated, [], 'merge the copies (union page_refs, keep the meaningful alt)');
  assert.equal(keys.length, Object.keys(rows).length, 'every row key is on its own 4-space-indented line');
});

test('PDF/MP4 rows list only their own file in seen_urls (else the binary gate re-points links)', () => {
  const foreign = Object.values(rows)
    .filter((row) => row.kind === 'document' || row.kind === 'video')
    .flatMap((row) => (row.seen_urls || [])
      .filter((url) => stem(url) !== stem(row.source_url))
      .map((url) => `${row.logical_id} lists ${url}`));
  assert.deepEqual(foreign, []);
});

test('no two PDF/MP4 rows claim the same source URL with different verification states', () => {
  const owners = new Map();
  Object.values(rows).filter((row) => row.kind === 'document' || row.kind === 'video').forEach((row) => {
    [row.source_url, ...(row.seen_urls || [])].filter(Boolean).forEach((url) => {
      const key = binarySource(url);
      owners.set(key, [...(owners.get(key) || []), row]);
    });
  });
  const conflicts = [...owners]
    .filter(([, list]) => new Set(list.map((row) => row.status)).size > 1)
    .map(([url, list]) => `${url}: ${list.map((row) => `${row.logical_id} (${row.status})`).join(', ')}`);
  assert.deepEqual(conflicts, []);
});
