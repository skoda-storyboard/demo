#!/usr/bin/env node
/**
 * The media manifest as a sharded ledger (SKODA-518,
 * docs/architecture/SKODA-ASSET-INGESTION-M2.md §3A).
 *
 * The manifest was one JSON object (`media-manifest.json`, 7,001 rows, 11.5 MB on 2026-10-29),
 * rewritten in full after every row and merged by hand when two branches added rows. Now:
 *   - **Shards:** `manifest/NN.jsonl`, 64 files by a hash of `logical_id`, one row per line,
 *     sorted.
 *     A branch touches only the shards of the rows it changed; `.gitattributes` merges them as a
 *     union, so two branches adding different rows merge without a conflict. Two versions of one
 *     row are then two lines, and loading fails on the duplicate instead of keeping the last copy.
 *   - **Journal:** a run appends each changed row to `manifest/journal.jsonl` (O(1) per row) and
 *     compacts it into the touched shards at the end. A journal left by an interrupted run is
 *     replayed on the next load, so no row is lost. The journal is not committed.
 *   - **API:** `loadManifest()` returns `{ generatedAt, rows }` as before; `openManifest()` adds
 *     `record(id)` and `compact()` for writers. A location ending in `.json` is still read and
 *     written as one JSON object (test fixtures, an old branch's file).
 *
 *   node tools/importer/media/manifest-ledger.mjs --check
 *   node tools/importer/media/manifest-ledger.mjs --compact
 *   node tools/importer/media/manifest-ledger.mjs --fold <branch.json> --base <merge-base.json>
 *   node tools/importer/media/manifest-ledger.mjs --migrate <media-manifest.json>
 */
import { createHash } from 'node:crypto';
import nodeFs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const LEDGER_DIR = fileURLToPath(new URL('./manifest/', import.meta.url));
export const SHARD_COUNT = 64;
export const JOURNAL = 'journal.jsonl';
const SHARD_FILE = /^[0-9a-f]{2}\.jsonl$/;

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

function parseLines(text, file) {
  return String(text).split('\n').map((line, i) => [line, i + 1]).filter(([line]) => line.trim())
    .map(([line, n]) => {
      try {
        return { value: JSON.parse(line), at: `${file}:${n}` };
      } catch (error) {
        throw new Error(`Invalid ledger line ${file}:${n}: ${error.message}`, { cause: error });
      }
    });
}

/**
 * Reads a ledger directory without failing: the rows, the journal entries and every problem.
 * @param {string} dir the ledger directory
 * @param {{fs?: typeof nodeFs}} [options]
 * @returns {{rows: Record<string, object>, journal: Array<{id: string, row?: object}>,
 *   problems: string[]}} duplicates, rows without an id and rows in the wrong shard are problems
 */
export function readLedger(dir = LEDGER_DIR, { fs = nodeFs } = {}) {
  const rows = {};
  const at = new Map();
  const problems = [];
  const files = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((f) => SHARD_FILE.test(f)).sort() : [];
  files.forEach((file) => {
    const lines = parseLines(fs.readFileSync(path.join(dir, file), 'utf8'), file);
    lines.forEach(({ value: row, at: where }) => {
      const id = row?.logical_id;
      if (typeof id !== 'string' || !id) {
        problems.push(`${where}: a row without a logical_id`);
        return;
      }
      if (at.has(id)) problems.push(`${id}: twice (${at.get(id)} and ${where}); merge the copies`);
      else if (shardName(id) !== file) problems.push(`${where}: ${id} belongs in ${shardName(id)}`);
      at.set(id, where);
      rows[id] = row;
    });
  });
  const journalFile = path.join(dir, JOURNAL);
  const journal = fs.existsSync(journalFile)
    ? parseLines(fs.readFileSync(journalFile, 'utf8'), JOURNAL).map(({ value }) => value) : [];
  journal.forEach((entry) => {
    if (typeof entry?.id !== 'string' || !entry.id) return;
    if (entry.row) rows[entry.id] = entry.row;
    else delete rows[entry.id];
  });
  return { rows, journal, problems };
}

function loadWithJournal(location, fs) {
  if (isJsonFile(location)) {
    if (!fs.existsSync(location)) return { manifest: { generatedAt: null, rows: {} }, journal: [] };
    const manifest = JSON.parse(fs.readFileSync(location, 'utf8'));
    if (!manifest?.rows || typeof manifest.rows !== 'object') {
      throw new Error(`Invalid media manifest: ${location}`);
    }
    return { manifest, journal: [] };
  }
  const { rows, journal, problems } = readLedger(location, { fs });
  if (problems.length) {
    throw new Error(`Media manifest ledger ${location} is damaged:\n  ${problems.join('\n  ')}`);
  }
  return { manifest: { generatedAt: null, rows }, journal };
}

/**
 * Loads the manifest: `{ generatedAt, rows }`, rows keyed by logical id, an interrupted run's
 * journal replayed. Fails on a damaged ledger (a duplicate row, a row without an id or in the
 * wrong shard): picking one copy is how rows used to be lost.
 * @param {string} [location] the ledger directory, or a `.json` manifest file
 * @param {{fs?: typeof nodeFs}} [options]
 */
export function loadManifest(location = LEDGER_DIR, { fs = nodeFs } = {}) {
  return loadWithJournal(location, fs).manifest;
}

function writeAtomic(fs, file, text) {
  const temp = `${file}.tmp`;
  fs.writeFileSync(temp, text);
  fs.renameSync(temp, file);
}

/** Rewrites the given shards of `dir` from `rows` (all shards when `names` is omitted). */
function writeShards(fs, dir, rows, names) {
  const byShard = new Map();
  Object.values(rows).forEach((row) => {
    const name = shardName(row.logical_id);
    if (!names || names.has(name)) byShard.set(name, [...(byShard.get(name) || []), row]);
  });
  const targets = names || new Set([...byShard.keys(),
    ...(fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => SHARD_FILE.test(f)) : [])]);
  fs.mkdirSync(dir, { recursive: true });
  let written = 0;
  targets.forEach((name) => {
    const file = path.join(dir, name);
    const list = byShard.get(name) || [];
    const old = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
    if (!list.length) {
      if (old !== null) { fs.unlinkSync(file); written += 1; }
      return;
    }
    const text = shardText(list);
    if (text === old) return;
    writeAtomic(fs, file, text);
    written += 1;
  });
  return written;
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
  const rows = Object.fromEntries(Object.entries(manifest.rows)
    .map(([id, row]) => [id, { ...row, logical_id: row.logical_id || id }]));
  return writeShards(fs, location, rows);
}

/**
 * Opens the manifest for a run that changes rows.
 *   - `record(id)` keeps `rows[id]` (or its removal): one journal line, nothing rewritten;
 *   - `compact()` writes the touched shards once and drops the journal.
 * With a `.json` location, `record` rewrites the file as before (fixtures, small runs).
 * @param {string} [location] the ledger directory, or a `.json` manifest file
 * @param {{fs?: typeof nodeFs, dryRun?: boolean}} [options] dryRun: record and compact write
 *   nothing
 */
export function openManifest(location = LEDGER_DIR, { fs = nodeFs, dryRun = false } = {}) {
  const { manifest, journal } = loadWithJournal(location, fs);
  const json = isJsonFile(location);
  // an interrupted run's journal is compacted with this run's rows
  const touched = new Set(journal.map((entry) => entry?.id).filter(Boolean));
  const journalFile = path.join(location, JOURNAL);
  return {
    ...manifest,
    location,
    record(id) {
      if (dryRun) return;
      if (json) {
        writeManifest(location, manifest, { fs });
        return;
      }
      const row = manifest.rows[id];
      if (row && row.logical_id !== id) throw new Error(`Row ${id} carries logical_id ${row.logical_id}`);
      fs.mkdirSync(location, { recursive: true });
      fs.appendFileSync(journalFile, `${JSON.stringify(row ? { id, row } : { id })}\n`);
      touched.add(id);
    },
    compact() {
      if (dryRun) return 0;
      if (json) return writeManifest(location, manifest, { fs });
      if (!touched.size) return 0;
      const shards = new Set([...touched].map(shardName));
      const written = writeShards(fs, location, manifest.rows, shards);
      if (fs.existsSync(journalFile)) fs.unlinkSync(journalFile);
      touched.clear();
      return written;
    },
  };
}

const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/**
 * Folds an old-format branch manifest into the ledger: only the rows the branch changed against
 * its merge base. A row the ledger also changed since the base is a conflict and stays as it is.
 * @param {{rows: Record<string, object>}} ledger the loaded ledger (rows are updated in place)
 * @param {{rows: Record<string, object>}} branch the branch's `media-manifest.json`
 * @param {{rows: Record<string, object>}} base the same file at the merge base
 * @returns {{applied: string[], conflicts: string[]}}
 */
export function foldBranch(ledger, branch, base) {
  const applied = [];
  const conflicts = [];
  const ids = new Set([...Object.keys(branch.rows), ...Object.keys(base.rows)]);
  ids.forEach((id) => {
    const theirs = branch.rows[id];
    const was = base.rows[id];
    if (same(theirs, was)) return;
    const ours = ledger.rows[id];
    if (!same(ours, was) && !same(ours, theirs)) {
      conflicts.push(id);
      return;
    }
    if (theirs) ledger.rows[id] = { ...theirs, logical_id: theirs.logical_id || id };
    else delete ledger.rows[id];
    applied.push(id);
  });
  return { applied, conflicts };
}

function main(args = process.argv.slice(2)) {
  const opt = (name) => {
    const i = args.indexOf(name);
    return i >= 0 ? args[i + 1] : null;
  };
  const dir = opt('--ledger') ? path.resolve(opt('--ledger')) : LEDGER_DIR;
  if (opt('--migrate')) {
    const existing = readLedger(dir);
    if (existing.journal.length || Object.keys(existing.rows).length) {
      throw new Error(`${dir} already holds rows; use --fold for a branch's manifest`);
    }
    const source = loadManifest(path.resolve(opt('--migrate')));
    const files = writeManifest(dir, source);
    console.log(`[ledger] migrated ${Object.keys(source.rows).length} rows into ${files} shards`);
  } else if (opt('--fold')) {
    if (!opt('--base')) throw new Error('--fold needs --base <the manifest at the merge base>');
    const store = openManifest(dir);
    const branch = loadManifest(path.resolve(opt('--fold')));
    const base = loadManifest(path.resolve(opt('--base')));
    const { applied, conflicts } = foldBranch(store, branch, base);
    applied.forEach((id) => store.record(id));
    store.compact();
    console.log(`[ledger] folded ${applied.length} changed row(s)`);
    if (conflicts.length) {
      console.error(`[ledger] ${conflicts.length} row(s) changed on both sides, left as in the ledger:\n  ${conflicts.join('\n  ')}`);
      process.exitCode = 1;
    }
  } else if (args.includes('--compact')) {
    const store = openManifest(dir);
    console.log(`[ledger] compacted: ${store.compact()} shard(s) written`);
  } else if (args.includes('--check')) {
    const { rows, journal, problems } = readLedger(dir);
    console.log(`[ledger] ${Object.keys(rows).length} rows${journal.length ? `, ${journal.length} journal entries (run --compact)` : ''}`);
    problems.forEach((p) => console.error(`  ✗ ${p}`));
    process.exitCode = problems.length || journal.length ? 1 : 0;
  } else {
    throw new Error('Use --check, --compact, --fold <file> --base <file> or --migrate <file>');
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(`manifest-ledger: ${error.message}`); process.exitCode = 1; }
}
