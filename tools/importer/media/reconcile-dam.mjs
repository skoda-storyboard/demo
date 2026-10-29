#!/usr/bin/env node
/**
 * media:reconcile (SKODA-518): the manifest ledger against the AEM Assets author, read-only.
 * Runs on a developer machine with the DAM token (see README, "Auth"); never in a chat session.
 *
 * QueryBuilder on author (publish blocks it) lists every asset under the DAM folder with its
 * provenance (`skoda:sourceUrl`, `skoda:sha256`, `skoda:logicalId`, written by setDamMetadata).
 * Each ledger row whose original is in the DAM (`steps.dam: done`) is matched by its DAM path:
 *   - **unexplained** (exit 1): a row whose asset is missing; an asset with migration provenance
 *     but no row; a row and its asset that disagree on the source URL, the logical id or sha256;
 *   - **explained** (listed): an asset uploaded before SKODA-518 without sha256 / logical id
 *     (`--backfill` adds them), an asset without migration provenance (authored in the DAM).
 *
 *   npm run media:reconcile -- --dam-base https://author-p220607-e2281243.adobeaemcloud.com \
 *     [--dam-folder /content/dam/storyboard] [--token-file <file>] [--manifest <ledger dir>]
 *     [--out report.json]
 *   npm run media:reconcile -- … --backfill [--limit 100]
 *
 * `--backfill` takes each matched asset without sha256 / logical id (rows sharing it counted
 * once), downloads its original from author, hashes it, checks it against the rows (an
 * original's size, a sha256 they already hold) and writes `skoda:sha256` + `skoda:logicalId` on
 * the asset and `sha256` in the rows. A mismatched asset is never backfilled. It writes to the
 * DAM: run it only for an approved batch.
 */
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  fetchBinaryToFile, loadManifest, openManifest, resolveDamToken, setDamMetadata, LEDGER_DIR,
} from './media-lib.mjs';

const PROPS = ['skoda:sourceUrl', 'skoda:sha256', 'skoda:logicalId'];

// a hit's metadata property: `p.hits=selective` returns it under its relative path; the nested
// shape (`p.hits=full`) is read too
const metaOf = (hit, key) => String(hit?.[`jcr:content/metadata/${key}`]
  ?? hit?.['jcr:content']?.metadata?.[key] ?? '');

/**
 * Every asset under a DAM folder on author with its provenance, paged through QueryBuilder.
 * @param {{base: string, token: string, folder?: string, pageSize?: number,
 *   fetchImpl?: typeof fetch}} options
 * @returns {Promise<Map<string, {sourceUrl: string, sha256: string, logicalId: string}>>} by path
 */
export async function damAssets({
  base, token, folder = '/content/dam/storyboard', pageSize = 1000, fetchImpl = fetch,
}) {
  const assets = new Map();
  for (let offset = 0; ;) {
    const query = new URLSearchParams({
      path: folder,
      type: 'dam:Asset',
      'p.limit': String(pageSize),
      'p.offset': String(offset),
      orderby: 'path', // a stable order for offset paging
      'p.hits': 'selective',
      'p.properties': ['jcr:path', ...PROPS.map((p) => `jcr:content/metadata/${p}`)].join(' '),
    });
    // eslint-disable-next-line no-await-in-loop
    const res = await fetchImpl(`${base.replace(/\/$/, '')}/bin/querybuilder.json?${query}`, {
      headers: { authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(120000),
    });
    if (!res.ok) throw new Error(`QueryBuilder returned ${res.status} at offset ${offset}`);
    // eslint-disable-next-line no-await-in-loop
    const page = await res.json();
    const hits = Array.isArray(page?.hits) ? page.hits : [];
    hits.forEach((hit) => {
      if (typeof hit?.['jcr:path'] !== 'string') return;
      assets.set(hit['jcr:path'], {
        sourceUrl: metaOf(hit, 'skoda:sourceUrl'),
        sha256: metaOf(hit, 'skoda:sha256'),
        logicalId: metaOf(hit, 'skoda:logicalId'),
      });
    });
    offset += hits.length;
    const total = Number(page?.total);
    if (!hits.length || page?.more === false || (Number.isFinite(total) && offset >= total)) break;
  }
  return assets;
}

/**
 * The ledger's DAM rows against the assets, per asset: the rows that share one DAM path (a CDN
 * row and its `/direct-download/` alias) are one group, and any of their ids and sources match.
 * Pure.
 * @param {Record<string, object>} rows the ledger rows
 * @param {Map<string, {sourceUrl: string, sha256: string, logicalId: string}>} assets by DAM path
 * @param {{folder?: string}} [options] assets outside the folder are not compared
 * @returns {{matched: number, missingInDam: string[], notInLedger: string[], mismatched: string[],
 *   needsBackfill: Array<{path: string, ids: string[], logicalId: string}>,
 *   notMigrated: string[], unexplained: number}} matched counts rows; needsBackfill lists the
 *   matched assets without sha256 / logical id, with the logical id to write (the asset's own,
 *   else the group's first)
 */
export function reconcile(rows, assets, { folder = '/content/dam/storyboard' } = {}) {
  const report = {
    matched: 0,
    missingInDam: [],
    notInLedger: [],
    mismatched: [],
    needsBackfill: [],
    notMigrated: [],
  };
  const groups = new Map();
  Object.values(rows)
    .filter((row) => row.steps?.dam === 'done' && row.dam_asset_path?.startsWith(`${folder}/`))
    .forEach((row) => {
      const key = row.dam_asset_path;
      groups.set(key, [...(groups.get(key) || []), row]);
    });
  [...groups.keys()].sort().forEach((assetPath) => {
    const list = groups.get(assetPath);
    const ids = list.map((row) => row.logical_id).sort();
    const asset = assets.get(assetPath);
    if (!asset) {
      ids.forEach((id) => report.missingInDam.push(`${id}: ${assetPath}`));
      return;
    }
    const sources = new Set(list
      .flatMap((row) => [row.dam_original_url, row.master_url, row.source_url]).filter(Boolean));
    const hashes = [...new Set(list.map((row) => row.sha256).filter(Boolean))];
    const differences = [
      asset.sourceUrl && !sources.has(asset.sourceUrl) && `sourceUrl ${asset.sourceUrl}`,
      asset.logicalId && !ids.includes(asset.logicalId) && `logicalId ${asset.logicalId}`,
      asset.sha256 && hashes.some((h) => h !== asset.sha256) && `sha256 ${asset.sha256} ≠ ${hashes.join(', ')}`,
      !asset.sha256 && hashes.length > 1 && `the rows disagree on sha256 (${hashes.join(', ')})`,
    ].filter(Boolean);
    if (differences.length) {
      report.mismatched.push(`${ids.join(' + ')} (${assetPath}): ${differences.join('; ')}`);
      return;
    }
    report.matched += list.length;
    if (!asset.sha256 || !asset.logicalId) {
      report.needsBackfill.push({ path: assetPath, ids, logicalId: asset.logicalId || ids[0] });
    }
  });
  [...assets].filter(([assetPath]) => assetPath.startsWith(`${folder}/`) && !groups.has(assetPath))
    .forEach(([assetPath, asset]) => {
      if (asset.sourceUrl) report.notInLedger.push(`${assetPath} (from ${asset.sourceUrl})`);
      else report.notMigrated.push(assetPath);
    });
  report.unexplained = report.missingInDam.length + report.notInLedger.length
    + report.mismatched.length;
  return report;
}

// a row's `bytes` are its original's for PDF/MP4 and for an image delivered as its master; an
// image delivered as a smaller rendition records that rendition's size
const bytesOfOriginal = (row) => (row.kind === 'document' || row.kind === 'video'
  || !row.delivery_url || row.delivery_url === row.master_url ? row.bytes : null);

/**
 * Adds sha256 + logical id to assets uploaded before SKODA-518, per asset (reconcile()'s
 * needsBackfill): download the original from author, hash it, check it against what the rows
 * know (their original's size, a sha256 they already hold), then write the asset metadata and
 * the rows' sha256. A check that fails leaves the asset and the rows as they were.
 * @param {ReturnType<typeof openManifest>} store the opened ledger (recorded and compacted here)
 * @param {Array<{path: string, ids: string[], logicalId: string}>} entries
 * @returns {Promise<{done: string[], failed: string[]}>} by DAM path
 */
export async function backfill(store, entries, {
  base, token, fetchImpl = fetch, metadataImpl = setDamMetadata,
}) {
  const done = [];
  const failed = [];
  const authed = (url, opts = {}) => fetchImpl(url, {
    ...opts, headers: { ...opts.headers, authorization: `Bearer ${token}` },
  });
  try {
    for (const entry of entries) {
      const rows = entry.ids.map((id) => store.rows[id]).filter(Boolean);
      const dir = mkdtempSync(path.join(tmpdir(), 'skoda-reconcile-'));
      try {
        const url = `${base.replace(/\/$/, '')}${entry.path.split('/').map(encodeURIComponent).join('/')}`;
        // eslint-disable-next-line no-await-in-loop
        const got = await fetchBinaryToFile(url, { filePath: path.join(dir, 'original'), fetchImpl: authed });
        rows.forEach((row) => {
          const bytes = bytesOfOriginal(row);
          if (Number.isSafeInteger(bytes) && bytes > 0 && got.bytes !== bytes) {
            throw new Error(`size ${got.bytes} ≠ ${row.logical_id}'s ${bytes}`);
          }
          if (row.sha256 && row.sha256 !== got.sha256) {
            throw new Error(`sha256 ${got.sha256} ≠ ${row.logical_id}'s ${row.sha256}`);
          }
        });
        // eslint-disable-next-line no-await-in-loop
        const result = await metadataImpl({
          damConfig: { baseUrl: base },
          damPath: entry.path,
          token,
          metadata: { sha256: got.sha256, logicalId: entry.logicalId },
        });
        if (!result.ok) throw new Error(`metadata ${result.status}`);
        rows.forEach((row) => {
          row.sha256 = got.sha256; // eslint-disable-line no-param-reassign
          store.record(row.logical_id);
        });
        done.push(entry.path);
      } catch (error) {
        failed.push(`${entry.path}: ${error.message}`);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    }
  } finally {
    store.compact();
  }
  return { done, failed };
}

async function main(args = process.argv.slice(2)) {
  const opt = (name) => {
    const i = args.indexOf(name);
    return i >= 0 ? args[i + 1] : null;
  };
  const base = opt('--dam-base');
  // the token goes to this host: an https author origin only
  if (!base || !/^https:$/.test(URL.canParse(base) ? new URL(base).protocol : '')) {
    throw new Error('--dam-base <https author origin> is required');
  }
  const folder = opt('--dam-folder') || '/content/dam/storyboard';
  const token = resolveDamToken({ tokenFile: opt('--token-file') || undefined });
  if (!token) throw new Error('No DAM token available (README, "Auth")');
  const location = opt('--manifest') ? path.resolve(opt('--manifest')) : LEDGER_DIR;
  // read-only unless --backfill, which takes the writer lock (and records the rows' sha256)
  const store = args.includes('--backfill')
    ? openManifest(location) : loadManifest(location, { mustExist: true });
  let report;
  try {
    report = reconcile(store.rows, await damAssets({ base, token, folder }), { folder });
  } catch (error) {
    store.compact?.();
    throw error;
  }
  const lines = [
    `[reconcile] ${report.matched} row(s) match their asset`,
    `  missing in the DAM: ${report.missingInDam.length}`,
    `  in the DAM with migration provenance, no row: ${report.notInLedger.length}`,
    `  row and asset disagree: ${report.mismatched.length}`,
    `  explained: ${report.needsBackfill.length} asset(s) need sha256 / logical id (--backfill), ${report.notMigrated.length} not from the migration`,
  ];
  console.log(lines.join('\n'));
  [...report.missingInDam, ...report.notInLedger, ...report.mismatched].slice(0, 50)
    .forEach((line) => console.error(`  ✗ ${line}`));
  if (opt('--out')) writeFileSync(path.resolve(opt('--out')), `${JSON.stringify(report, null, 2)}\n`);
  if (args.includes('--backfill')) {
    const limit = Number(opt('--limit') || Infinity);
    if (!(limit === Infinity || (Number.isInteger(limit) && limit > 0))) {
      throw new Error('--limit must be a positive integer');
    }
    const batch = report.needsBackfill.slice(0, limit);
    const { done, failed } = await backfill(store, batch, { base, token });
    console.log(`[reconcile] backfilled ${done.length}, failed ${failed.length}`);
    failed.forEach((line) => console.error(`  ✗ ${line}`));
    if (failed.length) process.exitCode = 1;
  }
  if (report.unexplained) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(`media:reconcile: ${error.message}`); process.exitCode = 1; });
}
