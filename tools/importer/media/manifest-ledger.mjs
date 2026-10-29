#!/usr/bin/env node
/**
 * The media manifest as a sharded ledger (SKODA-518,
 * docs/architecture/SKODA-ASSET-INGESTION-M2.md §3A).
 *
 * The manifest was one JSON object (`media-manifest.json`, 7,001 rows, 11.5 MB on 2026-10-29),
 * rewritten in full after every row and merged by hand when two branches added rows. Now:
 *   - **Shards:** `manifest/NN.jsonl`, 64 files by a hash of `logical_id`, one row per line,
 *     sorted. A branch touches only the shards of the rows it changed.
 *   - **Merging:** `.gitattributes` names the `media-ledger` merge driver (`npm ci` installs it):
 *     a shard is merged row by row against the merge base, so two branches that change or add
 *     different rows merge cleanly, even next to each other. A row changed on both sides is a
 *     conflict, marked in the shard; every tool refuses the ledger until it is resolved. Without
 *     the driver git marks text conflicts; `--resolve` settles them the same way.
 *   - **Writing:** one writer at a time (`manifest/.lock`, taken at a run's first recorded row;
 *     a lock whose process is gone is taken over). A run appends each recorded row to
 *     `manifest/journal.jsonl` (O(1) per row) and, at the end, writes each touched shard once:
 *     the recorded rows over the shard as it is on disk. Ctrl-C / SIGTERM compact too. A journal
 *     left by a killed run is replayed on the next load (with a warning) and adopted by the next
 *     writer; a torn last line (the kill mid-write) is dropped.
 *   - **API:** `loadManifest()` returns `{ generatedAt, rows }` as before; `openManifest()` adds
 *     `record(id)` and `compact()`. A location ending in `.json` is still read and written as one
 *     JSON object (test fixtures, an old branch's file).
 *
 *   node tools/importer/media/manifest-ledger.mjs --check | --compact | --resolve
 *   node tools/importer/media/manifest-ledger.mjs --fold <branch.json> --base <merge-base.json>
 *   node tools/importer/media/manifest-ledger.mjs --migrate <media-manifest.json>
 *   node tools/importer/media/manifest-ledger.mjs --install-merge-driver   (run by `npm ci`)
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import nodeFs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const LEDGER_DIR = fileURLToPath(new URL('./manifest/', import.meta.url));
export const SHARD_COUNT = 64;
export const JOURNAL = 'journal.jsonl';
export const LOCK = '.lock';
const SHARD_FILE = /^[0-9a-f]{2}\.jsonl$/;
const CONFLICT_MARK = /^(?:<{7}|={7}|>{7})(?: |$)/;
// the single-file manifest this ledger replaced
const OLD_MANIFEST = path.join(path.dirname(LEDGER_DIR), 'media-manifest.json');

const isJsonFile = (location) => /\.json$/i.test(location);

/** The shard file (`NN.jsonl`) of a logical id. */
export function shardName(id) {
  const n = createHash('sha1').update(String(id)).digest().readUInt32BE(0) % SHARD_COUNT;
  return `${n.toString(16).padStart(2, '0')}.jsonl`;
}

/** Orders rows by logical id (a stable order, whatever order they were read in). */
export const byLogicalId = (a, b) => {
  if (a.logical_id === b.logical_id) return 0;
  return a.logical_id < b.logical_id ? -1 : 1;
};

/** One shard's text: its rows sorted by logical id, one JSON object per line. */
export function shardText(rows) {
  return [...rows].sort(byLogicalId).map((row) => `${JSON.stringify(row)}\n`).join('');
}

// rows compared by content, whatever their key order
const canonical = (value) => JSON.stringify(value ?? null, (key, v) => (
  v && typeof v === 'object' && !Array.isArray(v)
    ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, v[k]])) : v));
const same = (a, b) => canonical(a) === canonical(b);

/** A shard's rows with their place; throws on a malformed line or an unresolved conflict. */
function parseShard(text, file) {
  return String(text).split('\n').map((line, i) => [line, i + 1]).filter(([line]) => line.trim())
    .map(([line, n]) => {
      if (CONFLICT_MARK.test(line)) {
        throw new Error(`Unresolved merge conflict in ${file}:${n}: keep one version of the row (README, "Merging")`);
      }
      try {
        return { row: JSON.parse(line), at: `${file}:${n}` };
      } catch (error) {
        throw new Error(`Invalid ledger line ${file}:${n}: ${error.message}`, { cause: error });
      }
    });
}

/**
 * The journal's entries; a torn last line (a run killed mid-write: no newline after it) is
 * dropped and reported, any other malformed line throws.
 */
function parseJournal(text) {
  const lines = String(text).split('\n');
  const unterminated = !String(text).endsWith('\n') && lines.at(-1).trim() !== '';
  const entries = [];
  let dropped = false;
  lines.forEach((line, i) => {
    if (!line.trim()) return;
    try {
      entries.push(JSON.parse(line));
    } catch (error) {
      if (unterminated && i === lines.length - 1) {
        dropped = true;
        return;
      }
      throw new Error(`Invalid ledger line ${JOURNAL}:${i + 1}: ${error.message}`, { cause: error });
    }
  });
  return { entries, dropped, unterminated };
}

/**
 * Reads a ledger directory without failing on its content: the rows (in logical-id order), the
 * journal entries and every problem.
 * @param {string} dir the ledger directory
 * @param {{fs?: typeof nodeFs}} [options]
 * @returns {{rows: Record<string, object>, journal: Array<{id: string, row?: object}>,
 *   problems: string[], warnings: string[]}} duplicates, rows without an id and rows in the
 *   wrong shard are problems; a dropped torn journal line is a warning
 */
export function readLedger(dir = LEDGER_DIR, { fs = nodeFs } = {}) {
  const found = new Map();
  const at = new Map();
  const problems = [];
  const warnings = [];
  const files = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((f) => SHARD_FILE.test(f)).sort() : [];
  files.forEach((file) => {
    let lines;
    try {
      lines = parseShard(fs.readFileSync(path.join(dir, file), 'utf8'), file);
    } catch (error) {
      problems.push(error.message);
      return;
    }
    lines.forEach(({ row, at: where }) => {
      const id = row?.logical_id;
      if (typeof id !== 'string' || !id) {
        problems.push(`${where}: a row without a logical_id`);
        return;
      }
      if (at.has(id)) problems.push(`${id}: twice (${at.get(id)} and ${where}); merge the copies`);
      else if (shardName(id) !== file) problems.push(`${where}: ${id} belongs in ${shardName(id)}`);
      at.set(id, where);
      found.set(id, row);
    });
  });
  const journalFile = path.join(dir, JOURNAL);
  const { entries: journal, dropped } = fs.existsSync(journalFile)
    ? parseJournal(fs.readFileSync(journalFile, 'utf8')) : { entries: [], dropped: false };
  if (dropped) warnings.push(`${JOURNAL}: dropped a torn last line (a run killed mid-write)`);
  journal.forEach((entry) => {
    if (typeof entry?.id !== 'string' || !entry.id) return;
    if (entry.row) found.set(entry.id, entry.row);
    else found.delete(entry.id);
  });
  const rows = {};
  [...found.keys()].sort().forEach((id) => { rows[id] = found.get(id); });
  return {
    rows, journal, problems, warnings,
  };
}

function loadWithJournal(location, fs, { mustExist = false } = {}) {
  if (!fs.existsSync(location)) {
    if (path.resolve(location) === OLD_MANIFEST) {
      throw new Error(`The media manifest is the ledger ${LEDGER_DIR} now (SKODA-518), not ${location}`);
    }
    if (mustExist) throw new Error(`Manifest not found: ${location}`);
    return { manifest: { generatedAt: null, rows: {} }, journal: [] };
  }
  if (isJsonFile(location)) {
    const manifest = JSON.parse(fs.readFileSync(location, 'utf8'));
    if (!manifest?.rows || typeof manifest.rows !== 'object') {
      throw new Error(`Invalid media manifest: ${location}`);
    }
    return { manifest, journal: [] };
  }
  const {
    rows, journal, problems, warnings,
  } = readLedger(location, { fs });
  if (problems.length) {
    throw new Error(`Media manifest ledger ${location} is damaged:\n  ${problems.join('\n  ')}`);
  }
  if (journal.length) {
    // a run still going, or one that died: its rows are read, not yet in the shards (nor in git)
    warnings.push(`${journal.length} journal row(s) of an unfinished media run are included; if none is running, \`npm run media:ledger -- --compact\` writes them`);
  }
  // eslint-disable-next-line no-console
  warnings.forEach((w) => console.warn(`[ledger] ${w}`));
  return { manifest: { generatedAt: null, rows }, journal };
}

/**
 * Loads the manifest: `{ generatedAt, rows }`, rows keyed by logical id, an interrupted run's
 * journal replayed. Fails on a damaged ledger (a duplicate row, an unresolved merge conflict, a
 * row without an id or in the wrong shard): picking one copy is how rows used to be lost.
 * @param {string} [location] the ledger directory, or a `.json` manifest file
 * @param {{fs?: typeof nodeFs, mustExist?: boolean}} [options] mustExist: a missing location
 *   throws instead of reading as an empty manifest
 */
export function loadManifest(location = LEDGER_DIR, { fs = nodeFs, mustExist = false } = {}) {
  return loadWithJournal(location, fs, { mustExist }).manifest;
}

function writeAtomic(fs, file, text) {
  const temp = `${file}.tmp`;
  fs.writeFileSync(temp, text);
  fs.renameSync(temp, file);
}

/** Writes one shard from its rows (removes it when empty); 1 when the file changed, else 0. */
function writeShard(fs, dir, name, rows) {
  const file = path.join(dir, name);
  const old = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  if (!rows.length) {
    if (old === null) return 0;
    fs.unlinkSync(file);
    return 1;
  }
  const text = shardText(rows);
  if (text === old) return 0;
  writeAtomic(fs, file, text);
  return 1;
}

/**
 * Writes a whole manifest to a location (the migration, a fixture): every shard that differs.
 * @param {string} location the ledger directory, or a `.json` file
 * @param {{rows: Record<string, object>}} manifest
 * @returns {number} the files written or removed
 */
export function writeManifest(location, manifest, { fs = nodeFs } = {}) {
  if (isJsonFile(location)) {
    writeAtomic(fs, location, `${JSON.stringify(manifest, null, 2)}\n`);
    return 1;
  }
  const byShard = new Map();
  Object.entries(manifest.rows).forEach(([id, row]) => {
    const full = { ...row, logical_id: row.logical_id || id };
    const name = shardName(full.logical_id);
    byShard.set(name, [...(byShard.get(name) || []), full]);
  });
  fs.mkdirSync(location, { recursive: true });
  const stray = fs.readdirSync(location).filter((f) => SHARD_FILE.test(f) && !byShard.has(f));
  return [...byShard].reduce((n, [name, rows]) => n + writeShard(fs, location, name, rows), 0)
    + stray.reduce((n, name) => n + writeShard(fs, location, name, []), 0);
}

const isAlive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === 'EPERM';
  }
};
// the locks this process holds, by token: an own-pid lock that isn't here is a dead store's
const heldLocks = new Set();

/** Takes the writer lock of a ledger directory; a lock whose process is gone is taken over. */
function acquireLock(fs, dir) {
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, LOCK);
  const token = `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      fs.writeFileSync(file, JSON.stringify({ pid: process.pid, token, since: new Date().toISOString() }), { flag: 'wx' });
      heldLocks.add(token);
      return { file, token };
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      let holder = {};
      try { holder = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { /* an unreadable lock is stale */ }
      const live = holder.pid === process.pid ? heldLocks.has(holder.token) : isAlive(holder.pid);
      if (holder.pid && live) {
        const busy = new Error(`Another media run (pid ${holder.pid}, since ${holder.since}) is writing ${dir}; let it finish. `
          + `If no media run is going, remove ${file}`);
        busy.code = 'LEDGER_LOCKED';
        throw busy;
      }
      fs.rmSync(file, { force: true });
    }
  }
  throw new Error(`Could not take the ledger lock ${file}`);
}

function releaseLock(fs, lock) {
  heldLocks.delete(lock.token);
  try {
    const holder = JSON.parse(fs.readFileSync(lock.file, 'utf8'));
    if (holder.token === lock.token) fs.rmSync(lock.file, { force: true });
  } catch { /* already gone */ }
}

/**
 * Opens the manifest for a run that changes rows.
 *   - `record(id)` keeps the current `rows[id]` (or its removal): one journal line. The first
 *     record takes the writer lock (another live writer: it throws); a run that records nothing
 *     never locks. Holding the lock, any journal on disk is a dead run's: its rows are adopted.
 *   - `compact()` writes each touched shard once (the recorded rows over the shard as it is on
 *     disk; a change not recorded is not written), drops the journal and releases the lock. It
 *     also runs on SIGINT / SIGTERM, and settles a dead run's journal with nothing recorded.
 * With a `.json` location, `record` rewrites the file as before (fixtures, small runs); no lock.
 * @param {string} [location] the ledger directory, or a `.json` manifest file
 * @param {{fs?: typeof nodeFs, dryRun?: boolean}} [options] dryRun: nothing is written or locked
 */
export function openManifest(location = LEDGER_DIR, { fs = nodeFs, dryRun = false } = {}) {
  const json = isJsonFile(location);
  const { manifest } = loadWithJournal(location, fs);
  const journalFile = path.join(location, JOURNAL);
  // what compaction writes: the recorded rows (null: removed)
  const recorded = new Map();
  let lock = null;
  let closed = false;
  // Ctrl-C or a timeout's SIGTERM still compacts what was recorded, then exits as killed
  let onSignal;
  const ensureLock = () => {
    if (lock) return;
    lock = acquireLock(fs, location);
    // the lock is ours: a journal on disk now is a dead run's (a live writer drops its journal
    // before releasing the lock); adopt its rows, and rewrite it if its last line is torn
    if (fs.existsSync(journalFile)) {
      let parsed;
      try {
        parsed = parseJournal(fs.readFileSync(journalFile, 'utf8'));
      } catch (error) {
        releaseLock(fs, lock);
        lock = null;
        throw error;
      }
      parsed.entries.forEach((entry) => {
        if (typeof entry?.id === 'string' && entry.id) recorded.set(entry.id, entry.row ?? null);
      });
      if (parsed.unterminated) {
        writeAtomic(fs, journalFile, parsed.entries.map((e) => `${JSON.stringify(e)}\n`).join(''));
      }
    }
    onSignal = (signal) => {
      try { store.compact(); } finally { process.exit(signal === 'SIGINT' ? 130 : 143); } // eslint-disable-line no-use-before-define
    };
    process.once('SIGINT', onSignal);
    process.once('SIGTERM', onSignal);
  };
  const release = () => {
    closed = true;
    recorded.clear();
    if (onSignal) {
      process.off('SIGINT', onSignal);
      process.off('SIGTERM', onSignal);
    }
    if (lock) releaseLock(fs, lock);
    lock = null;
  };
  const store = {
    ...manifest,
    location,
    record(id) {
      if (dryRun) return;
      if (json) {
        writeManifest(location, manifest, { fs });
        return;
      }
      if (closed) throw new Error(`The ledger ${location} was compacted; open it again`);
      const row = manifest.rows[id];
      if (row && row.logical_id !== id) throw new Error(`Row ${id} carries logical_id ${row.logical_id}`);
      ensureLock();
      const line = JSON.stringify(row ? { id, row } : { id });
      fs.appendFileSync(journalFile, `${line}\n`);
      recorded.set(id, row ? JSON.parse(line).row : null);
    },
    compact() {
      if (dryRun) return 0;
      if (json) return writeManifest(location, manifest, { fs });
      if (closed) return 0;
      let written = 0;
      try {
        if (!lock && fs.existsSync(journalFile)) {
          // a dead run's journal to settle; a live run's is that run's to compact
          try {
            ensureLock();
          } catch (error) {
            if (error.code !== 'LEDGER_LOCKED') throw error;
          }
        }
        if (!lock) return 0;
        const byShard = new Map();
        recorded.forEach((row, id) => {
          const name = shardName(id);
          byShard.set(name, [...(byShard.get(name) || []), [id, row]]);
        });
        byShard.forEach((changes, name) => {
          const file = path.join(location, name);
          const disk = new Map(fs.existsSync(file)
            ? parseShard(fs.readFileSync(file, 'utf8'), name).map(({ row }) => [row.logical_id, row]) : []);
          changes.forEach(([id, row]) => (row ? disk.set(id, row) : disk.delete(id)));
          written += writeShard(fs, location, name, [...disk.values()]);
        });
        if (fs.existsSync(journalFile)) fs.unlinkSync(journalFile);
      } finally {
        release();
      }
      return written;
    },
  };
  return store;
}

/**
 * Merges two versions of the rows against their base, row by row: a row changed on one side
 * takes that change, a row changed on both sides the same way is kept once, a row changed on
 * both sides differently is a conflict (ours is kept, the id is listed).
 * @param {Record<string, object>} base
 * @param {Record<string, object>} ours
 * @param {Record<string, object>} theirs
 * @returns {{rows: Record<string, object>, conflicts: string[]}}
 */
export function mergeRows(base, ours, theirs) {
  const rows = {};
  const conflicts = [];
  const ids = [...new Set([base, ours, theirs].flatMap((side) => Object.keys(side)))].sort();
  ids.forEach((id) => {
    const [b, o, t] = [base[id], ours[id], theirs[id]];
    let pick = o;
    if (!same(o, t)) {
      if (same(o, b)) pick = t;
      else if (!same(t, b)) conflicts.push(id);
    }
    if (pick) rows[id] = pick;
  });
  return { rows, conflicts };
}

/**
 * Folds an old-format branch manifest into the ledger: only the rows the branch changed against
 * its merge base. A row the ledger also changed since the base, or a branch row whose key and
 * `logical_id` differ, is a conflict and stays as it is.
 * @param {{rows: Record<string, object>}} ledger the loaded ledger (rows are updated in place)
 * @param {{rows: Record<string, object>}} branch the branch's `media-manifest.json`
 * @param {{rows: Record<string, object>}} base the same file at the merge base
 * @returns {{applied: string[], conflicts: string[]}}
 */
export function foldBranch(ledger, branch, base) {
  const applied = [];
  const conflicts = [];
  const ids = [...new Set([...Object.keys(branch.rows), ...Object.keys(base.rows)])].sort();
  ids.forEach((id) => {
    const theirs = branch.rows[id];
    const was = base.rows[id];
    if (same(theirs, was)) return;
    const ours = ledger.rows[id];
    const misnamed = theirs?.logical_id && theirs.logical_id !== id;
    if (misnamed || (!same(ours, was) && !same(ours, theirs))) {
      conflicts.push(id);
      return;
    }
    if (theirs) ledger.rows[id] = { ...theirs, logical_id: id };
    else delete ledger.rows[id];
    applied.push(id);
  });
  return { applied, conflicts };
}

const rowsOfShard = (text, file) => Object.fromEntries(
  parseShard(text, file).map(({ row }) => [row.logical_id, row]),
);

/** A shard's merged text, conflicting rows between git-style markers. */
function mergedShardText(merged, ours, theirs) {
  const conflicted = new Set(merged.conflicts);
  return Object.keys(merged.rows).concat(merged.conflicts.filter((id) => !merged.rows[id]))
    .sort().map((id) => (conflicted.has(id)
      ? `<<<<<<< ours\n${ours[id] ? JSON.stringify(ours[id]) : '(removed)'}\n=======\n${theirs[id] ? JSON.stringify(theirs[id]) : '(removed)'}\n>>>>>>> theirs\n`
      : `${JSON.stringify(merged.rows[id])}\n`))
    .join('');
}

/**
 * git merge driver (`%O %A %B %P`): merges a shard row by row; writes the result to %A. Exit 1
 * when a row changed on both sides (marked in the shard) or a version can't be read.
 */
function mergeDriver([basePath, oursPath, theirsPath, name = path.basename(oursPath)]) {
  const read = (file) => (file && nodeFs.existsSync(file) ? nodeFs.readFileSync(file, 'utf8') : '');
  let sides;
  try {
    sides = [basePath, oursPath, theirsPath].map((file) => rowsOfShard(read(file), name));
  } catch (error) {
    // marked, so every tool refuses the shard until it is merged by hand
    nodeFs.writeFileSync(oursPath, `<<<<<<< ledger: a version of this shard could not be read (${error.message}); merge it by hand\n${read(oursPath)}`);
    console.error(`[ledger] ${name}: ${error.message}; left for a manual merge`);
    return 1;
  }
  const [base, ours, theirs] = sides;
  const merged = mergeRows(base, ours, theirs);
  nodeFs.writeFileSync(oursPath, mergedShardText(merged, ours, theirs));
  if (merged.conflicts.length) {
    console.error(`[ledger] ${name}: ${merged.conflicts.length} row(s) changed on both sides: ${merged.conflicts.join(', ')}`);
    return 1;
  }
  return 0;
}

/** Settles shards git left conflicted (a merge without the driver), from the index stages. */
function resolve(dir) {
  const top = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: dir, encoding: 'utf8' }).trim();
  // from the top: ls-files paths and `:n:path` stages are relative to the working tree root
  const git = (...a) => execFileSync('git', a, { cwd: top, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const rel = path.relative(top, dir);
  const unmerged = [...new Set(git('ls-files', '-u', '--', rel).split('\n').filter(Boolean)
    .map((line) => line.split('\t')[1]))].filter((f) => SHARD_FILE.test(path.basename(f)));
  let open = 0;
  unmerged.forEach((file) => {
    const stage = (n) => {
      try { return git('show', `:${n}:${file}`); } catch { return ''; }
    };
    const [base, ours, theirs] = [1, 2, 3].map((n) => rowsOfShard(stage(n), file));
    const merged = mergeRows(base, ours, theirs);
    const text = mergedShardText(merged, ours, theirs);
    if (text) nodeFs.writeFileSync(path.join(top, file), text);
    else nodeFs.rmSync(path.join(top, file), { force: true }); // every row removed: `git rm` it
    open += merged.conflicts.length;
    console.log(`[ledger] ${file}: ${merged.conflicts.length ? `${merged.conflicts.length} row(s) changed on both sides, marked` : `merged${text ? '' : ' (empty: git rm it)'}`}`);
  });
  if (!unmerged.length) console.log('[ledger] no conflicted shards');
  else if (!open) console.log('[ledger] resolved: `git add` (or `git rm`) the shards and continue the merge');
  return open ? 1 : 0;
}

/** Registers the merge driver in this clone's git config (`npm ci` runs it; never fails). */
function installMergeDriver() {
  try {
    const git = (...a) => execFileSync('git', a, { stdio: ['ignore', 'pipe', 'pipe'] });
    git('config', 'merge.media-ledger.name', 'media manifest ledger, row by row (SKODA-518)');
    git('config', 'merge.media-ledger.driver', 'node tools/importer/media/manifest-ledger.mjs --merge-driver %O %A %B %P');
  } catch (error) {
    console.warn(`[ledger] merge driver not installed (${error.message.split('\n')[0]})`);
  }
}

function main(args = process.argv.slice(2)) {
  const opt = (name) => {
    const i = args.indexOf(name);
    return i >= 0 ? args[i + 1] : null;
  };
  const dir = opt('--ledger') ? path.resolve(opt('--ledger')) : LEDGER_DIR;
  if (args[0] === '--merge-driver') {
    process.exitCode = mergeDriver(args.slice(1));
  } else if (args.includes('--install-merge-driver')) {
    installMergeDriver();
  } else if (args.includes('--resolve')) {
    process.exitCode = resolve(dir);
  } else if (opt('--migrate')) {
    const existing = readLedger(dir);
    if (existing.journal.length || Object.keys(existing.rows).length) {
      throw new Error(`${dir} already holds rows; use --fold for a branch's manifest`);
    }
    const source = loadManifest(path.resolve(opt('--migrate')), { mustExist: true });
    const files = writeManifest(dir, source);
    console.log(`[ledger] migrated ${Object.keys(source.rows).length} rows into ${files} shards`);
  } else if (opt('--fold')) {
    if (!opt('--base')) throw new Error('--fold needs --base <the manifest at the merge base>');
    const branch = loadManifest(path.resolve(opt('--fold')), { mustExist: true });
    const base = loadManifest(path.resolve(opt('--base')), { mustExist: true });
    const store = openManifest(dir);
    const { applied, conflicts } = foldBranch(store, branch, base);
    applied.forEach((id) => store.record(id));
    store.compact();
    console.log(`[ledger] folded ${applied.length} changed row(s)`);
    if (conflicts.length) {
      console.error(`[ledger] ${conflicts.length} row(s) changed on both sides or misnamed, left as in the ledger:\n  ${conflicts.join('\n  ')}`);
      process.exitCode = 1;
    }
  } else if (args.includes('--compact')) {
    const store = openManifest(dir);
    console.log(`[ledger] compacted: ${store.compact()} shard(s) written`);
  } else if (args.includes('--check')) {
    const {
      rows, journal, problems, warnings,
    } = readLedger(dir);
    console.log(`[ledger] ${Object.keys(rows).length} rows${journal.length ? `, ${journal.length} journal entries (run --compact)` : ''}`);
    [...problems, ...warnings].forEach((p) => console.error(`  ✗ ${p}`));
    process.exitCode = problems.length || journal.length ? 1 : 0;
  } else {
    throw new Error('Use --check, --compact, --resolve, --fold <file> --base <file>, --migrate <file> or --install-merge-driver');
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(`manifest-ledger: ${error.message}`); process.exitCode = 1; }
}
