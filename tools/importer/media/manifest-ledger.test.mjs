/*
 * The media manifest ledger (SKODA-518): shards by logical id, a journal per run compacted once,
 * the old JSON format still readable, a damaged ledger refused, and git merges without conflicts.
 * Run: node --test tools/importer/media/manifest-ledger.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import nodeFs, {
  mkdtempSync, readFileSync, writeFileSync, existsSync, readdirSync, copyFileSync,
} from 'node:fs';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SHARD_COUNT, JOURNAL, shardName, shardText, readLedger, loadManifest, writeManifest,
  openManifest, foldBranch,
} from './manifest-ledger.mjs';

const REPO = fileURLToPath(new URL('../../../', import.meta.url));
const tmp = () => mkdtempSync(path.join(os.tmpdir(), 'ledger-'));
const row = (n, extra = {}) => ({
  logical_id: `${String(n).padStart(8, '0')}__img-${n}.jpg`,
  source_url: `https://cdn.skoda-storyboard.com/2025/01/img-${n}.jpg`,
  seen_urls: [`https://cdn.skoda-storyboard.com/2025/01/img-${n}.jpg`],
  status: 'done',
  ...extra,
});
const rowsOf = (list) => Object.fromEntries(list.map((r) => [r.logical_id, r]));
const range = (from, to) => Array.from({ length: to - from }, (_, i) => row(from + i));

// an fs that counts the writes per file name
function countingFs() {
  const writes = new Map();
  const count = (file) => {
    const name = path.basename(String(file)).replace(/\.tmp$/, '');
    writes.set(name, (writes.get(name) || 0) + 1);
  };
  const fs = {
    ...nodeFs,
    writeFileSync: (file, ...rest) => { count(file); return nodeFs.writeFileSync(file, ...rest); },
    appendFileSync: (file, ...rest) => {
      count(file);
      return nodeFs.appendFileSync(file, ...rest);
    },
  };
  return { fs, writes };
}

test('shardName: one of 64 stable shards; shardText: sorted, one row per line', () => {
  const names = new Set(range(0, 2000).map((r) => shardName(r.logical_id)));
  assert.equal(names.size, SHARD_COUNT);
  assert.ok([...names].every((n) => /^[0-9a-f]{2}\.jsonl$/.test(n)));
  assert.equal(shardName('abc__x.png'), shardName('abc__x.png'));
  const text = shardText([row(2), row(1)]);
  assert.deepEqual(text.trim().split('\n').map((l) => JSON.parse(l).logical_id), [row(1).logical_id, row(2).logical_id]);
  assert.ok(text.endsWith('}\n'));
});

test('writeManifest + loadManifest: the old manifest round-trips, row for row', () => {
  const dir = tmp();
  const rows = rowsOf(range(0, 300));
  writeManifest(dir, { generatedAt: null, rows });
  assert.deepEqual(loadManifest(dir), { generatedAt: null, rows });
  readdirSync(dir).forEach((file) => {
    readFileSync(path.join(dir, file), 'utf8').trim().split('\n')
      .forEach((line) => assert.equal(shardName(JSON.parse(line).logical_id), file));
  });
  // an unchanged rewrite touches no file
  assert.equal(writeManifest(dir, { rows }), 0);
  // a missing ledger is an empty manifest
  assert.deepEqual(loadManifest(path.join(dir, 'none')), { generatedAt: null, rows: {} });
});

test('a 1,000-row run: one journal line per row, each touched shard written once at the end', () => {
  const dir = tmp();
  writeManifest(dir, { rows: rowsOf(range(0, 500)) });
  const { fs, writes } = countingFs();
  const store = openManifest(dir, { fs });
  range(500, 1500).forEach((r) => {
    store.rows[r.logical_id] = r;
    store.record(r.logical_id);
  });
  assert.equal(writes.get(JOURNAL), 1000, 'appended, never rewritten');
  assert.ok([...writes.keys()].every((name) => name === JOURNAL), 'no shard written before compact');
  const written = store.compact();
  const shardWrites = [...writes].filter(([name]) => name !== JOURNAL);
  assert.equal(written, SHARD_COUNT);
  assert.ok(shardWrites.every(([, n]) => n === 1), JSON.stringify(shardWrites));
  assert.ok(!existsSync(path.join(dir, JOURNAL)), 'the journal goes after compaction');
  assert.equal(Object.keys(loadManifest(dir).rows).length, 1500);
});

test('an interrupted run: its journal is read by the next load and compacted by the next run', () => {
  const dir = tmp();
  writeManifest(dir, { rows: rowsOf(range(0, 10)) });
  const first = openManifest(dir);
  first.rows[row(3).logical_id] = row(3, { status: 'failed' });
  first.record(row(3).logical_id);
  first.rows[row(42).logical_id] = row(42);
  first.record(row(42).logical_id);
  // no compact(): the run stopped
  const seen = loadManifest(dir).rows;
  assert.equal(seen[row(3).logical_id].status, 'failed');
  assert.ok(seen[row(42).logical_id]);
  const second = openManifest(dir);
  assert.ok(second.compact() >= 1);
  assert.ok(!existsSync(path.join(dir, JOURNAL)));
  assert.equal(loadManifest(dir).rows[row(3).logical_id].status, 'failed');
});

test('a removed row: recorded as a removal; an emptied shard is deleted', () => {
  const dir = tmp();
  const only = row(7);
  writeManifest(dir, { rows: rowsOf([only]) });
  const store = openManifest(dir);
  delete store.rows[only.logical_id];
  store.record(only.logical_id);
  store.compact();
  assert.deepEqual(loadManifest(dir).rows, {});
  assert.deepEqual(readdirSync(dir), []);
});

test('a damaged ledger is refused, with the place to fix', () => {
  const cases = {
    twice: (dir, file, line) => writeFileSync(path.join(dir, file), `${line}\n${line}\n`),
    'belongs in': (dir, file, line) => {
      const other = file === '00.jsonl' ? '01.jsonl' : '00.jsonl';
      writeFileSync(path.join(dir, other), `${line}\n`);
      nodeFs.unlinkSync(path.join(dir, file));
    },
    'Invalid ledger line': (dir, file) => writeFileSync(path.join(dir, file), '{"logical_id": \n'),
    'without a logical_id': (dir, file) => writeFileSync(path.join(dir, file), '{"source_url":"x"}\n'),
  };
  Object.entries(cases).forEach(([message, damage]) => {
    const dir = tmp();
    const r = row(1);
    writeManifest(dir, { rows: rowsOf([r]) });
    damage(dir, shardName(r.logical_id), JSON.stringify(r));
    assert.throws(() => loadManifest(dir), new RegExp(message), message);
  });
  // readLedger reports the problems without failing (the integrity test lists them all)
  const dir = tmp();
  const line = JSON.stringify(row(1));
  writeFileSync(path.join(dir, shardName(row(1).logical_id)), `${line}\n${line}\n`);
  assert.equal(readLedger(dir).problems.length, 1);
});

test('a .json location keeps the old format: read and written as one object', () => {
  const dir = tmp();
  const file = path.join(dir, 'media-manifest.json');
  assert.deepEqual(loadManifest(file), { generatedAt: null, rows: {} });
  const store = openManifest(file);
  store.rows[row(1).logical_id] = row(1);
  store.record(row(1).logical_id);
  assert.deepEqual(JSON.parse(readFileSync(file, 'utf8')).rows, rowsOf([row(1)]));
  writeFileSync(file, '{"rows": null}');
  assert.throws(() => loadManifest(file), /Invalid media manifest/);
});

test('dryRun: record and compact write nothing', () => {
  const dir = tmp();
  writeManifest(dir, { rows: rowsOf([row(1)]) });
  const before = readdirSync(dir).map((f) => readFileSync(path.join(dir, f), 'utf8'));
  const store = openManifest(dir, { dryRun: true });
  store.rows[row(2).logical_id] = row(2);
  store.record(row(2).logical_id);
  assert.equal(store.compact(), 0);
  assert.deepEqual(readdirSync(dir).map((f) => readFileSync(path.join(dir, f), 'utf8')), before);
});

test('foldBranch: only the rows a branch changed since its base; both sides changed is a conflict', () => {
  const base = { rows: rowsOf([row(1), row(2), row(3), row(4)]) };
  const branch = { rows: rowsOf([row(1, { status: 'failed' }), row(2), row(4, { alt: 'theirs' }), row(5)]) };
  const ledger = { rows: rowsOf([row(1), row(2, { alt: 'main' }), row(3), row(4, { alt: 'main' })]) };
  const { applied, conflicts } = foldBranch(ledger, branch, base);
  const expected = [row(1).logical_id, row(3).logical_id, row(5).logical_id];
  assert.deepEqual(applied.sort(), expected.sort());
  assert.deepEqual(conflicts, [row(4).logical_id]);
  assert.equal(ledger.rows[row(1).logical_id].status, 'failed', 'the branch change');
  assert.equal(ledger.rows[row(2).logical_id].alt, 'main', 'untouched by the branch: main stays');
  assert.equal(ledger.rows[row(3).logical_id], undefined, 'removed by the branch');
  assert.equal(ledger.rows[row(4).logical_id].alt, 'main', 'a conflict stays as in the ledger');
  assert.ok(ledger.rows[row(5).logical_id]);
});

// --- git: the repository's .gitattributes on the shards ----------------------------------------
const git = (cwd, ...args) => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args], {
  cwd, encoding: 'utf8', stdio: 'pipe',
});
function fixtureRepo(rows) {
  const repo = tmp();
  git(repo, 'init', '-q', '-b', 'main');
  copyFileSync(path.join(REPO, '.gitattributes'), path.join(repo, '.gitattributes'));
  writeManifest(path.join(repo, 'tools/importer/media/manifest'), { rows: rowsOf(rows) });
  git(repo, 'add', '-A');
  git(repo, 'commit', '-q', '-m', 'base');
  return repo;
}
function onBranch(repo, name, change) {
  git(repo, 'checkout', '-q', '-b', name, 'main');
  const store = openManifest(path.join(repo, 'tools/importer/media/manifest'));
  change(store);
  store.compact();
  git(repo, 'add', '-A');
  git(repo, 'commit', '-q', '-m', name);
}

test('git: two branches adding rows for different pages merge without a conflict', () => {
  const repo = fixtureRepo(range(0, 200));
  const add = (list) => (store) => list.forEach((r) => {
    store.rows[r.logical_id] = r;
    store.record(r.logical_id);
  });
  onBranch(repo, 'a', add(range(1000, 1100)));
  onBranch(repo, 'b', add(range(2000, 2100)));
  git(repo, 'checkout', '-q', 'a');
  git(repo, 'merge', '-q', '--no-edit', 'b'); // throws on a conflict
  const { rows } = loadManifest(path.join(repo, 'tools/importer/media/manifest'));
  assert.equal(Object.keys(rows).length, 400);
});

test('git: two branches changing the same row merge, and the ledger then refuses the two copies', () => {
  const repo = fixtureRepo(range(0, 50));
  const id = row(10).logical_id;
  const set = (alt) => (store) => {
    store.rows[id] = { ...store.rows[id], alt };
    store.record(id);
  };
  onBranch(repo, 'a', set('one'));
  onBranch(repo, 'b', set('two'));
  git(repo, 'checkout', '-q', 'a');
  git(repo, 'merge', '-q', '--no-edit', 'b');
  assert.throws(() => loadManifest(path.join(repo, 'tools/importer/media/manifest')), /twice/);
});
