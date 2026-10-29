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
 *     [--dam-folder /content/dam/storyboard] [--token-file <file>] [--out report.json]
 *   npm run media:reconcile -- … --backfill [--limit 100]
 *
 * `--backfill` downloads each listed original from author, hashes it, checks its size against
 * the row and writes `skoda:sha256` + `skoda:logicalId` on the asset and `sha256` in the row.
 * It writes to the DAM: run it only for an approved batch.
 */
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  fetchBinaryToFile, openManifest, resolveDamToken, setDamMetadata, LEDGER_DIR,
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
 * The ledger's DAM rows against the assets. Pure.
 * @param {Record<string, object>} rows the ledger rows
 * @param {Map<string, {sourceUrl: string, sha256: string, logicalId: string}>} assets by DAM path
 * @param {{folder?: string}} [options] assets outside the folder are not compared
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
  const inDam = Object.values(rows)
    .filter((row) => row.steps?.dam === 'done' && row.dam_asset_path?.startsWith(`${folder}/`));
  const claimed = new Set();
  inDam.forEach((row) => {
    const asset = assets.get(row.dam_asset_path);
    claimed.add(row.dam_asset_path);
    if (!asset) {
      report.missingInDam.push(`${row.logical_id}: ${row.dam_asset_path}`);
      return;
    }
    const sources = [row.dam_original_url, row.master_url, row.source_url].filter(Boolean);
    const differences = [
      asset.sourceUrl && !sources.includes(asset.sourceUrl) && `sourceUrl ${asset.sourceUrl}`,
      asset.logicalId && asset.logicalId !== row.logical_id && `logicalId ${asset.logicalId}`,
      asset.sha256 && row.sha256 && asset.sha256 !== row.sha256
        && `sha256 ${asset.sha256} ≠ ${row.sha256}`,
    ].filter(Boolean);
    if (differences.length) report.mismatched.push(`${row.logical_id}: ${differences.join('; ')}`);
    else report.matched += 1;
    if (!asset.sha256 || !asset.logicalId) report.needsBackfill.push(row.logical_id);
  });
  // two rows may share one asset (a CDN row and its alias): the path is claimed once
  [...assets].filter(([assetPath]) => assetPath.startsWith(`${folder}/`) && !claimed.has(assetPath))
    .forEach(([assetPath, asset]) => {
      if (asset.sourceUrl) report.notInLedger.push(`${assetPath} (from ${asset.sourceUrl})`);
      else report.notMigrated.push(assetPath);
    });
  report.unexplained = report.missingInDam.length + report.notInLedger.length
    + report.mismatched.length;
  return report;
}

/**
 * Adds sha256 + logical id to assets uploaded before SKODA-518: download the original from
 * author, hash it, check its size, write the asset metadata and the row.
 * @returns {Promise<{done: string[], failed: string[]}>}
 */
export async function backfill(store, ids, {
  base, token, fetchImpl = fetch, metadataImpl = setDamMetadata,
}) {
  const done = [];
  const failed = [];
  const authed = (url, opts = {}) => fetchImpl(url, {
    ...opts, headers: { ...opts.headers, authorization: `Bearer ${token}` },
  });
  for (const id of ids) {
    const row = store.rows[id];
    const dir = mkdtempSync(path.join(tmpdir(), 'skoda-reconcile-'));
    try {
      const url = `${base.replace(/\/$/, '')}${row.dam_asset_path.split('/').map(encodeURIComponent).join('/')}`;
      // eslint-disable-next-line no-await-in-loop
      const got = await fetchBinaryToFile(url, { filePath: path.join(dir, 'original'), fetchImpl: authed });
      if (Number.isSafeInteger(row.bytes) && row.bytes > 0 && got.bytes !== row.bytes) {
        throw new Error(`size ${got.bytes} ≠ the row's ${row.bytes}`);
      }
      // eslint-disable-next-line no-await-in-loop
      const result = await metadataImpl({
        damConfig: { baseUrl: base },
        damPath: row.dam_asset_path,
        token,
        metadata: { sha256: got.sha256, logicalId: id },
      });
      if (!result.ok) throw new Error(`metadata ${result.status}`);
      row.sha256 = got.sha256;
      store.record(id);
      done.push(id);
    } catch (error) {
      failed.push(`${id}: ${error.message}`);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }
  store.compact();
  return { done, failed };
}

async function main(args = process.argv.slice(2)) {
  const opt = (name) => {
    const i = args.indexOf(name);
    return i >= 0 ? args[i + 1] : null;
  };
  const base = opt('--dam-base');
  if (!base) throw new Error('--dam-base <author origin> is required');
  const folder = opt('--dam-folder') || '/content/dam/storyboard';
  const token = resolveDamToken({ tokenFile: opt('--token-file') || undefined });
  if (!token) throw new Error('No DAM token available (README, "Auth")');
  const store = openManifest(opt('--manifest') ? path.resolve(opt('--manifest')) : LEDGER_DIR);
  const report = reconcile(store.rows, await damAssets({ base, token, folder }), { folder });
  const lines = [
    `[reconcile] ${report.matched} row(s) match their asset`,
    `  missing in the DAM: ${report.missingInDam.length}`,
    `  in the DAM with migration provenance, no row: ${report.notInLedger.length}`,
    `  row and asset disagree: ${report.mismatched.length}`,
    `  explained: ${report.needsBackfill.length} need sha256 / logical id (--backfill), ${report.notMigrated.length} not from the migration`,
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
