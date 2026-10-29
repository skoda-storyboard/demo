import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { binarySource } from './binary-media.mjs';
import { readLedger } from './manifest-ledger.mjs';

// Guards on the committed manifest ledger itself (SKODA-518). Each failure is silent at
// runtime: a duplicate row used to be dropped by JSON.parse (last copy wins), and the lookups
// key every URL of a row, so a foreign URL in seen_urls re-points another file at that row.
const dir = process.env.MEDIA_MANIFEST
  || fileURLToPath(new URL('./manifest/', import.meta.url));
const { rows, journal, problems } = readLedger(dir);

// File name without the WordPress rendition suffix (-WxH, -scaled), lower-cased.
const stem = (url) => decodeURIComponent(new URL(url).pathname.split('/').pop())
  .toLowerCase().replace(/-(?:\d+x\d+|scaled)(?=\.[a-z0-9]+$)/, '');

test('the ledger has no duplicate row, no row without an id and none in the wrong shard', () => {
  assert.deepEqual(problems, [], 'merge the copies (union page_refs, keep the meaningful alt)');
  assert.ok(Object.keys(rows).length > 0, `no rows in ${dir}`);
});

test('no journal is committed: a run compacts it into the shards', () => {
  assert.equal(journal.length, 0, 'run node tools/importer/media/manifest-ledger.mjs --compact');
});

test('every row lists only its own file in seen_urls (else the binary gate and the apply step re-point links)', () => {
  const foreign = Object.values(rows)
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
