/*
 * The media manifest ledger (SKODA-518): shards by logical id, one writer at a time, a journal per
 * run compacted once (also on SIGTERM, also after a kill), the old JSON format still readable, a
 * damaged ledger refused, and git merges row by row (the media-ledger merge driver).
 * Run: node --test tools/importer/media/manifest-ledger.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import nodeFs, {
  mkdtempSync, readFileSync, writeFileSync, existsSync, readdirSync, copyFileSync, appendFileSync,
} from 'node:fs';
import { execFileSync, spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SHARD_COUNT, JOURNAL, LOCK, shardName, shardText, readLedger, loadManifest, writeManifest,
  openManifest, foldBranch, mergeRows,
} from './manifest-ledger.mjs';

const REPO = fileURLToPath(new URL('../../../', import.meta.url));
const MODULE = fileURLToPath(new URL('./manifest-ledger.mjs', import.meta.url));
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
// n rows that land in one shard, sorted (neighbours in the file)
const sameShard = (n) => {
  const ids = [];
  for (let i = 0; ids.length < n; i += 1) {
    if (shardName(row(i).logical_id) === shardName(row(0).logical_id)) ids.push(row(i));
  }
  return ids;
};

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

// a writer in another process: opens the ledger, records rows, then `exit` (a kill: no
// compaction) or `wait` (holds the lock until signalled)
function childWriter(dir, rows, mode) {
  const script = `import { openManifest } from ${JSON.stringify(MODULE)};
const store = openManifest(${JSON.stringify(dir)});
for (const r of ${JSON.stringify(rows)}) { store.rows[r.logical_id] = r; store.record(r.logical_id); }
if (${JSON.stringify(mode)} === 'exit') process.exit(0);
console.log('ready');
setInterval(() => {}, 1000);`;
  const child = spawn(process.execPath, ['--input-type=module', '-e', script], { stdio: ['ignore', 'pipe', 'pipe'] });
  const ready = new Promise((resolve, reject) => {
    child.stdout.on('data', (d) => { if (String(d).includes('ready')) resolve(); });
    child.on('exit', (code, signal) => resolve({ code, signal }));
    child.on('error', reject);
  });
  const exited = new Promise((resolve) => { child.on('exit', (code, signal) => resolve({ code, signal })); });
  return { child, ready, exited };
}

test('shardName: one of 64 stable shards; shardText: sorted, one row per line', () => {
  const names = new Set(range(0, 2000).map((r) => shardName(r.logical_id)));
  assert.equal(names.size, SHARD_COUNT);
  assert.ok([...names].every((n) => /^[0-9a-f]{2}\.jsonl$/.test(n)));
  assert.equal(shardName('abc__x.png'), shardName('abc__x.png'));
  const text = shardText([row(2), row(1)]);
  const ids = text.trim().split('\n').map((l) => JSON.parse(l).logical_id);
  assert.deepEqual(ids, [row(1).logical_id, row(2).logical_id]);
  assert.ok(text.endsWith('}\n'));
});

test('writeManifest + loadManifest: the old manifest round-trips, row for row, in id order', () => {
  const dir = tmp();
  const rows = rowsOf(range(0, 300));
  writeManifest(dir, { generatedAt: null, rows });
  const loaded = loadManifest(dir);
  assert.deepEqual(loaded, { generatedAt: null, rows });
  assert.deepEqual(Object.keys(loaded.rows), Object.keys(rows).sort(), 'rows in logical-id order');
  readdirSync(dir).forEach((file) => {
    readFileSync(path.join(dir, file), 'utf8').trim().split('\n')
      .forEach((line) => assert.equal(shardName(JSON.parse(line).logical_id), file));
  });
  // an unchanged rewrite touches no file
  assert.equal(writeManifest(dir, { rows }), 0);
  // a missing ledger is an empty manifest, unless it must exist
  assert.deepEqual(loadManifest(path.join(dir, 'none')), { generatedAt: null, rows: {} });
  assert.throws(() => loadManifest(path.join(dir, 'none'), { mustExist: true }), /Manifest not found/);
});

test('the removed single-file manifest path points at the ledger', () => {
  const old = path.join(path.dirname(MODULE), 'media-manifest.json');
  assert.throws(() => loadManifest(old), /the ledger .*manifest/);
  assert.throws(() => openManifest(old), /the ledger .*manifest/);
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
  assert.ok([...writes.keys()].every((name) => name === JOURNAL || name === LOCK), 'no shard written before compact');
  const written = store.compact();
  const shardWrites = [...writes].filter(([name]) => name !== JOURNAL && name !== LOCK);
  assert.equal(written, SHARD_COUNT);
  assert.ok(shardWrites.every(([, n]) => n === 1), JSON.stringify(shardWrites));
  assert.ok(!existsSync(path.join(dir, JOURNAL)), 'the journal goes after compaction');
  assert.ok(!existsSync(path.join(dir, LOCK)), 'the lock is released');
  assert.equal(Object.keys(loadManifest(dir).rows).length, 1500);
});

test('compaction writes the recorded rows over the shard as it is on disk', () => {
  const dir = tmp();
  const [a, b, c] = sameShard(3);
  writeManifest(dir, { rows: rowsOf([a]) });
  const store = openManifest(dir);
  store.rows[b.logical_id] = b;
  store.record(b.logical_id);
  // a change made in memory but never recorded is not written
  store.rows[a.logical_id] = { ...a, status: 'half-done' };
  // a row that reached the shard since the store opened (e.g. a pulled merge) is kept
  appendFileSync(path.join(dir, shardName(c.logical_id)), `${JSON.stringify(c)}\n`);
  store.compact();
  const { rows } = loadManifest(dir);
  assert.deepEqual(Object.keys(rows), [a, b, c].map((r) => r.logical_id).sort());
  assert.equal(rows[a.logical_id].status, 'done', 'only recorded rows are written');
  assert.throws(() => store.record(a.logical_id), /was compacted/);
});

test('one writer at a time; SIGTERM compacts what was recorded and releases the lock', async () => {
  const dir = tmp();
  writeManifest(dir, { rows: rowsOf([row(1)]) });
  const writer = childWriter(dir, [row(2)], 'wait');
  try {
    await writer.ready;
    // a second writer may open (and read) but not record
    const second = openManifest(dir);
    second.rows[row(3).logical_id] = row(3);
    assert.throws(() => second.record(row(3).logical_id), /Another media run \(pid \d+.*remove .*\.lock/s);
    assert.equal(second.compact(), 0, 'it never held the lock: nothing to write');
    assert.ok(loadManifest(dir).rows[row(2).logical_id], 'readers see the journal meanwhile');
  } finally {
    writer.child.kill('SIGTERM');
  }
  const { code } = await writer.exited;
  assert.equal(code, 143);
  assert.ok(!existsSync(path.join(dir, JOURNAL)) && !existsSync(path.join(dir, LOCK)));
  const ids = (list) => list.map((r) => r.logical_id).sort();
  assert.deepEqual(Object.keys(readLedger(dir).rows).sort(), ids([row(1), row(2)]));
  // in this process too: a second store can't record while the first holds the lock
  const first = openManifest(dir);
  first.record(row(1).logical_id);
  const other = openManifest(dir);
  assert.throws(() => other.record(row(2).logical_id), /Another media run/);
  first.compact();
  other.compact();
  // a run that records nothing never locks (an early error leaves nothing behind)
  openManifest(dir);
  assert.ok(!existsSync(path.join(dir, LOCK)));
  const later = openManifest(dir);
  later.record(row(1).logical_id);
  later.compact();
});

test('a killed run: its lock is taken over, its journal read and compacted by the next writer', async () => {
  const dir = tmp();
  writeManifest(dir, { rows: rowsOf(range(0, 10)) });
  const killed = childWriter(dir, [row(3, { status: 'failed' }), row(42)], 'exit');
  await killed.exited;
  assert.ok(existsSync(path.join(dir, LOCK)) && existsSync(path.join(dir, JOURNAL)), 'left behind');
  const seen = loadManifest(dir).rows;
  assert.equal(seen[row(3).logical_id].status, 'failed');
  assert.ok(seen[row(42).logical_id]);
  // the next writer adopts it: here by compacting with nothing of its own recorded
  const next = openManifest(dir);
  assert.ok(next.compact() >= 1);
  assert.ok(!existsSync(path.join(dir, JOURNAL)) && !existsSync(path.join(dir, LOCK)));
  assert.equal(readLedger(dir).journal.length, 0);
  assert.equal(loadManifest(dir).rows[row(3).logical_id].status, 'failed');
});

test('a writer that adopts a dead run\'s journal: its rows plus the writer\'s, never a live run\'s', async () => {
  const dir = tmp();
  writeManifest(dir, { rows: rowsOf([row(1)]) });
  const killed = childWriter(dir, [row(2)], 'exit');
  await killed.exited;
  const store = openManifest(dir);
  store.rows[row(3).logical_id] = row(3);
  store.record(row(3).logical_id); // takes the dead run's lock, adopts its journal
  store.compact();
  const all = [row(1), row(2), row(3)].map((r) => r.logical_id);
  assert.deepEqual(Object.keys(loadManifest(dir).rows), all);
});

test('a torn last journal line is dropped with a warning; the next writer appends cleanly', () => {
  const dir = tmp();
  writeManifest(dir, { rows: rowsOf([row(1)]) });
  writeFileSync(path.join(dir, JOURNAL), `${JSON.stringify({ id: row(2).logical_id, row: row(2) })}\n{"id":"0000`);
  const { rows, warnings } = readLedger(dir);
  assert.ok(rows[row(2).logical_id]);
  assert.match(warnings[0], /torn last line/);
  const store = openManifest(dir);
  store.rows[row(3).logical_id] = row(3);
  store.record(row(3).logical_id);
  store.compact();
  const expected = [row(1), row(2), row(3)].map((r) => r.logical_id);
  assert.deepEqual(Object.keys(loadManifest(dir).rows), expected);
  // a malformed line in the middle is not a torn end
  writeFileSync(path.join(dir, JOURNAL), `{"id":\n${JSON.stringify({ id: 'x' })}\n`);
  assert.throws(() => readLedger(dir), /Invalid ledger line journal\.jsonl:1/);
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
    'Unresolved merge conflict': (dir, file, line) => writeFileSync(path.join(dir, file), `<<<<<<< ours\n${line}\n=======\n${line}\n>>>>>>> theirs\n`),
  };
  Object.entries(cases).forEach(([message, damage]) => {
    const dir = tmp();
    const r = row(1);
    writeManifest(dir, { rows: rowsOf([r]) });
    damage(dir, shardName(r.logical_id), JSON.stringify(r));
    assert.throws(() => loadManifest(dir), new RegExp(message), message);
    assert.throws(() => openManifest(dir), new RegExp(message), `${message}: no writer either`);
    assert.ok(!existsSync(path.join(dir, LOCK)), `${message}: a refused writer leaves no lock`);
  });
  // readLedger reports the problems without failing (the integrity test lists them all)
  const dir = tmp();
  const line = JSON.stringify(row(1));
  writeFileSync(path.join(dir, shardName(row(1).logical_id)), `${line}\n${line}\n`);
  assert.equal(readLedger(dir).problems.length, 1);
});

test('a .json location keeps the old format: read and written as one object', () => {
  const dir = tmp();
  const file = path.join(dir, 'fixture-manifest.json');
  assert.deepEqual(loadManifest(file), { generatedAt: null, rows: {} });
  const store = openManifest(file);
  store.rows[row(1).logical_id] = row(1);
  store.record(row(1).logical_id);
  assert.deepEqual(JSON.parse(readFileSync(file, 'utf8')).rows, rowsOf([row(1)]));
  writeFileSync(file, '{"rows": null}');
  assert.throws(() => loadManifest(file), /Invalid media manifest/);
});

test('dryRun: record and compact write nothing, and nothing is locked', () => {
  const dir = tmp();
  writeManifest(dir, { rows: rowsOf([row(1)]) });
  const before = readdirSync(dir).map((f) => readFileSync(path.join(dir, f), 'utf8'));
  const store = openManifest(dir, { dryRun: true });
  store.rows[row(2).logical_id] = row(2);
  store.record(row(2).logical_id);
  assert.equal(store.compact(), 0);
  assert.deepEqual(readdirSync(dir).map((f) => readFileSync(path.join(dir, f), 'utf8')), before);
});

test('mergeRows: one-sided changes merge, the same change on both sides is kept once, else a conflict', () => {
  const base = rowsOf([row(1), row(2), row(3), row(4), row(5)]);
  const ours = rowsOf([row(1, { alt: 'ours' }), row(2), row(3, { alt: 'same' }), row(4, { alt: 'ours' }), row(6)]);
  const theirs = rowsOf([row(1), row(2, { alt: 'theirs' }), row(3, { alt: 'same' }), row(4, { alt: 'theirs' }), row(5), row(7)]);
  const { rows, conflicts } = mergeRows(base, ours, theirs);
  assert.equal(rows[row(1).logical_id].alt, 'ours');
  assert.equal(rows[row(2).logical_id].alt, 'theirs');
  assert.equal(rows[row(3).logical_id].alt, 'same');
  assert.deepEqual(conflicts, [row(4).logical_id]);
  assert.equal(rows[row(4).logical_id].alt, 'ours', 'a conflict keeps ours');
  assert.equal(rows[row(5).logical_id], undefined, 'removed on our side');
  assert.ok(rows[row(6).logical_id] && rows[row(7).logical_id], 'added on either side');
  // key order is not a change
  const reordered = { [row(2).logical_id]: { status: 'done', ...row(2) } };
  assert.deepEqual(mergeRows(rowsOf([row(2)]), rowsOf([row(2)]), reordered).conflicts, []);
});

test('foldBranch: only the rows a branch changed since its base; both sides changed or a misnamed row is a conflict', () => {
  const base = { rows: rowsOf([row(1), row(2), row(3), row(4)]) };
  const branch = { rows: rowsOf([row(1, { status: 'failed' }), row(2), row(4, { alt: 'theirs' }), row(5)]) };
  branch.rows.misnamed = row(8);
  const ledger = { rows: rowsOf([row(1), row(2, { alt: 'main' }), row(3), row(4, { alt: 'main' })]) };
  const { applied, conflicts } = foldBranch(ledger, branch, base);
  const expected = [row(1).logical_id, row(3).logical_id, row(5).logical_id];
  assert.deepEqual(applied.sort(), expected.sort());
  assert.deepEqual(conflicts.sort(), [row(4).logical_id, 'misnamed'].sort());
  assert.equal(ledger.rows[row(1).logical_id].status, 'failed', 'the branch change');
  assert.equal(ledger.rows[row(2).logical_id].alt, 'main', 'untouched by the branch: main stays');
  assert.equal(ledger.rows[row(3).logical_id], undefined, 'removed by the branch');
  assert.equal(ledger.rows[row(4).logical_id].alt, 'main', 'a conflict stays as in the ledger');
  assert.ok(ledger.rows[row(5).logical_id]);
  assert.equal(ledger.rows.misnamed, undefined);
});

// --- git: the repository's .gitattributes and the media-ledger merge driver --------------------
const git = (cwd, ...args) => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args], {
  cwd, encoding: 'utf8', stdio: 'pipe',
});
const LEDGER_REL = 'tools/importer/media/manifest';
function fixtureRepo(rows, { driver = true } = {}) {
  const repo = tmp();
  git(repo, 'init', '-q', '-b', 'main');
  if (driver) git(repo, 'config', 'merge.media-ledger.driver', `node ${MODULE} --merge-driver %O %A %B %P`);
  copyFileSync(path.join(REPO, '.gitattributes'), path.join(repo, '.gitattributes'));
  writeManifest(path.join(repo, LEDGER_REL), { rows: rowsOf(rows) });
  git(repo, 'add', '-A');
  git(repo, 'commit', '-q', '-m', 'base');
  return repo;
}
function onBranch(repo, name, change) {
  git(repo, 'checkout', '-q', '-b', name, 'main');
  const store = openManifest(path.join(repo, LEDGER_REL));
  change(store);
  store.compact();
  git(repo, 'add', '-A');
  git(repo, 'commit', '-q', '-m', name);
}
const add = (list) => (store) => list.forEach((r) => {
  store.rows[r.logical_id] = r;
  store.record(r.logical_id);
});
const set = (id, alt) => (store) => {
  store.rows[id] = { ...store.rows[id], alt };
  store.record(id);
};

test('git: two branches adding rows for different pages merge without a conflict', () => {
  const repo = fixtureRepo(range(0, 200));
  onBranch(repo, 'a', add(range(1000, 1100)));
  onBranch(repo, 'b', add(range(2000, 2100)));
  git(repo, 'checkout', '-q', 'a');
  git(repo, 'merge', '-q', '--no-edit', 'b'); // throws on a conflict
  const { rows } = loadManifest(path.join(repo, LEDGER_REL));
  assert.equal(Object.keys(rows).length, 400);
});

test('git: two branches changing or adding neighbouring rows of one shard merge cleanly (#547 review)', () => {
  const [a, b, c, d] = sameShard(4);
  const repo = fixtureRepo([a, b, c, d]);
  onBranch(repo, 'one', set(b.logical_id, 'one'));
  onBranch(repo, 'two', (store) => {
    set(c.logical_id, 'two')(store);
    add([row(9999)])(store);
  });
  git(repo, 'checkout', '-q', 'one');
  git(repo, 'merge', '-q', '--no-edit', 'two');
  const { rows } = loadManifest(path.join(repo, LEDGER_REL));
  assert.equal(rows[b.logical_id].alt, 'one');
  assert.equal(rows[c.logical_id].alt, 'two');
  assert.ok(rows[row(9999).logical_id]);
  assert.equal(rows[a.logical_id].alt, undefined);
});

test('git: a row changed on both branches is a marked conflict the ledger refuses until resolved', () => {
  const [a, b] = sameShard(2);
  const repo = fixtureRepo([a, b]);
  onBranch(repo, 'one', set(b.logical_id, 'one'));
  onBranch(repo, 'two', set(b.logical_id, 'two'));
  git(repo, 'checkout', '-q', 'one');
  assert.throws(() => git(repo, 'merge', '-q', '--no-edit', 'two'));
  assert.ok(git(repo, 'ls-files', '-u').includes(shardName(b.logical_id)), 'the shard is unmerged');
  const shard = readFileSync(path.join(repo, LEDGER_REL, shardName(b.logical_id)), 'utf8');
  assert.match(shard, /^<<<<<<< ours\n.*"alt":"one".*\n=======\n.*"alt":"two".*\n>>>>>>> theirs$/m);
  assert.ok(shard.includes(JSON.stringify(a)), 'the other rows merged as usual');
  assert.throws(() => loadManifest(path.join(repo, LEDGER_REL)), /Unresolved merge conflict/);
});

test('git without the driver: text conflicts, which --resolve settles row by row', () => {
  const [a, b, c, d] = sameShard(4);
  const repo = fixtureRepo([a, b, c, d], { driver: false });
  onBranch(repo, 'one', set(b.logical_id, 'one'));
  onBranch(repo, 'two', set(c.logical_id, 'two'));
  git(repo, 'checkout', '-q', 'one');
  assert.throws(() => git(repo, 'merge', '-q', '--no-edit', 'two'), 'neighbouring lines conflict as text');
  assert.ok(git(repo, 'ls-files', '-u').includes(shardName(b.logical_id)));
  const out = execFileSync(process.execPath, [MODULE, '--resolve', '--ledger', path.join(repo, LEDGER_REL)], { encoding: 'utf8' });
  assert.match(out, /resolved/);
  const { rows } = loadManifest(path.join(repo, LEDGER_REL));
  assert.equal(rows[b.logical_id].alt, 'one');
  assert.equal(rows[c.logical_id].alt, 'two');
});
