/*
 * media:reconcile (SKODA-518): the ledger against the author DAM, with a fake QueryBuilder.
 * Run: node --test tools/importer/media/reconcile-dam.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { damAssets, reconcile, backfill } from './reconcile-dam.mjs';
import {
  openManifest, writeManifest, loadManifest, sha256Of,
} from './media-lib.mjs';

const BASE = 'https://author-p1-e2.adobeaemcloud.com';
const DAM = '/content/dam/storyboard';
const row = (n, extra = {}) => ({
  logical_id: `0000000${n}__img-${n}.jpg`,
  source_url: `https://cdn.skoda-storyboard.com/2025/01/img-${n}-768x432.jpg`,
  master_url: `https://cdn.skoda-storyboard.com/2025/01/img-${n}.jpg`,
  dam_original_url: `https://cdn.skoda-storyboard.com/2025/01/img-${n}.jpg`,
  dam_asset_path: `${DAM}/en/story/img-${n}.jpg`,
  steps: { dam: 'done' },
  bytes: 8,
  ...extra,
});
const asset = (r, extra = {}) => ({
  sourceUrl: r.master_url, sha256: 'a'.repeat(64), logicalId: r.logical_id, ...extra,
});

test('reconcile: matched rows, the three unexplained differences and the explained ones', () => {
  const rows = Object.fromEntries([
    row(1, { sha256: 'a'.repeat(64) }), // matches
    row(2), // its asset is gone
    row(3), // asset says another source
    row(4, { sha256: 'b'.repeat(64) }), // sha256 differs
    row(5), // uploaded before 518: no provenance yet
    row(6, { steps: { dam: 'n/a' } }), // never ingested: not compared
  ].map((r) => [r.logical_id, r]));
  const assets = new Map([
    [row(1).dam_asset_path, asset(row(1))],
    [row(3).dam_asset_path, asset(row(3), { sourceUrl: 'https://cdn.skoda-storyboard.com/other.jpg' })],
    [row(4).dam_asset_path, asset(row(4))],
    [row(5).dam_asset_path, asset(row(5), { sha256: '', logicalId: '' })],
    [`${DAM}/en/lost.jpg`, { sourceUrl: 'https://cdn.skoda-storyboard.com/lost.jpg', sha256: '', logicalId: '' }],
    [`${DAM}/brand/logo.png`, { sourceUrl: '', sha256: '', logicalId: '' }],
    ['/content/dam/other/x.jpg', { sourceUrl: 'https://x', sha256: '', logicalId: '' }],
  ]);
  const report = reconcile(rows, assets);
  assert.equal(report.matched, 2, 'rows 1 and 5');
  assert.deepEqual(report.missingInDam, [`${row(2).logical_id}: ${row(2).dam_asset_path}`]);
  assert.equal(report.mismatched.length, 2);
  assert.match(report.mismatched[0], /sourceUrl https:\/\/cdn\.skoda-storyboard\.com\/other\.jpg/);
  assert.match(report.mismatched[1], /sha256 a+ ≠ b+/);
  assert.deepEqual(report.notInLedger, [`${DAM}/en/lost.jpg (from https://cdn.skoda-storyboard.com/lost.jpg)`]);
  assert.deepEqual(report.notMigrated, [`${DAM}/brand/logo.png`], 'authored in the DAM: explained');
  const r5 = row(5);
  assert.deepEqual(report.needsBackfill, [{
    path: r5.dam_asset_path, ids: [r5.logical_id], logicalId: r5.logical_id,
  }]);
  assert.equal(report.unexplained, 4);
  // the source URL may be the row's master, its original or its source
  const r7 = row(7);
  const viaSource = reconcile(
    { [r7.logical_id]: r7 },
    new Map([[r7.dam_asset_path, asset(r7, { sourceUrl: r7.source_url })]]),
  );
  assert.equal(viaSource.unexplained, 0);
});

test('reconcile: rows sharing one asset (a CDN row and its alias) are one group (#547 review)', () => {
  // the alias has its own source URL (/direct-download/) and id; the asset records the CDN row's
  const cdn = row(1);
  const alias = row(1, {
    logical_id: 'ffffffff__img-1.jpg',
    source_url: 'https://www.skoda-storyboard.com/direct-download/2025/01/img-1.jpg',
    master_url: 'https://www.skoda-storyboard.com/direct-download/2025/01/img-1.jpg',
    dam_original_url: 'https://www.skoda-storyboard.com/direct-download/2025/01/img-1.jpg',
  });
  const rows = { [cdn.logical_id]: cdn, [alias.logical_id]: alias };
  const stamped = reconcile(rows, new Map([[cdn.dam_asset_path, asset(cdn)]]));
  assert.equal(stamped.unexplained, 0, 'the other row\'s source and id match the group');
  assert.equal(stamped.matched, 2);
  const bareAsset = asset(cdn, { logicalId: '', sha256: '' });
  const bare = reconcile(rows, new Map([[cdn.dam_asset_path, bareAsset]]));
  assert.deepEqual(bare.needsBackfill, [{
    path: cdn.dam_asset_path,
    ids: [cdn.logical_id, alias.logical_id].sort(),
    logicalId: cdn.logical_id,
  }], 'one backfill per asset, one logical id for it');
  // the asset's own logical id stays the one written
  const own = reconcile(rows, new Map([[cdn.dam_asset_path, asset(cdn, { logicalId: alias.logical_id, sha256: '' })]]));
  assert.equal(own.needsBackfill[0].logicalId, alias.logical_id);
});

test('reconcile: a mismatched asset is never backfilled; rows disagreeing on sha256 are a mismatch', () => {
  const r = row(1);
  const other = reconcile({ [r.logical_id]: r }, new Map([[r.dam_asset_path, asset(r, { sourceUrl: 'https://cdn/x.jpg', sha256: '', logicalId: '' })]]));
  assert.equal(other.mismatched.length, 1);
  assert.deepEqual(other.needsBackfill, []);
  const twin = row(1, { logical_id: 'ffffffff__img-1.jpg', sha256: 'c'.repeat(64) });
  const split = reconcile(
    { [r.logical_id]: { ...r, sha256: 'b'.repeat(64) }, [twin.logical_id]: twin },
    new Map([[r.dam_asset_path, asset(r, { sha256: '' })]]),
  );
  assert.match(split.mismatched[0], /the rows disagree on sha256/);
  assert.deepEqual(split.needsBackfill, []);
});

test('damAssets: pages through QueryBuilder on author with the token, both hit shapes', async () => {
  const calls = [];
  const pages = [
    {
      total: 3,
      more: true,
      hits: [
        { 'jcr:path': `${DAM}/a.jpg`, 'jcr:content/metadata/skoda:sourceUrl': 'https://cdn/a.jpg', 'jcr:content/metadata/skoda:sha256': 'f'.repeat(64) },
        { 'jcr:path': `${DAM}/b.jpg`, 'jcr:content': { metadata: { 'skoda:sourceUrl': 'https://cdn/b.jpg', 'skoda:logicalId': 'id-b' } } },
      ],
    },
    { total: 3, more: false, hits: [{ 'jcr:path': `${DAM}/c.pdf` }, { title: 'no path: skipped' }] },
  ];
  const fetchImpl = async (url, opts) => {
    calls.push([url, opts.headers.authorization]);
    const offset = Number(new URL(url).searchParams.get('p.offset'));
    return { ok: true, status: 200, json: async () => pages[offset === 0 ? 0 : 1] };
  };
  const assets = await damAssets({
    base: `${BASE}/`, token: 't0k', pageSize: 2, fetchImpl,
  });
  assert.equal(calls.length, 2);
  assert.ok(calls.every(([url, auth]) => url.startsWith(`${BASE}/bin/querybuilder.json?`) && auth === 'Bearer t0k'));
  const first = new URL(calls[0][0]).searchParams;
  assert.equal(first.get('path'), DAM);
  assert.equal(first.get('type'), 'dam:Asset');
  assert.equal(first.get('orderby'), 'path', 'a stable order for offset paging');
  assert.match(first.get('p.properties'), /jcr:content\/metadata\/skoda:sha256/);
  assert.equal(new URL(calls[1][0]).searchParams.get('p.offset'), '2');
  assert.deepEqual([...assets.keys()], [`${DAM}/a.jpg`, `${DAM}/b.jpg`, `${DAM}/c.pdf`]);
  assert.deepEqual(assets.get(`${DAM}/a.jpg`), { sourceUrl: 'https://cdn/a.jpg', sha256: 'f'.repeat(64), logicalId: '' });
  assert.equal(assets.get(`${DAM}/b.jpg`).logicalId, 'id-b');
  await assert.rejects(damAssets({
    base: BASE, token: 't', fetchImpl: async () => ({ ok: false, status: 401 }),
  }), /QueryBuilder returned 401/);
});

test('backfill: per asset, checks the original against the rows, writes the asset once and the rows', async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'reconcile-'));
  const sha = sha256Of(Buffer.from('ORIGINAL'));
  const ok = row(1);
  const okAlias = row(1, { logical_id: 'ffffffff__img-1.jpg' });
  const wrongSize = row(2, { kind: 'document', bytes: 99 });
  // an image delivered as a 768px rendition records the rendition's bytes: not the original's
  const rendition = row(3, { bytes: 99, delivery_url: 'https://cdn.skoda-storyboard.com/2025/01/img-3-768x432.jpg' });
  const knownHash = row(4, { sha256: 'd'.repeat(64) });
  const all = [ok, okAlias, wrongSize, rendition, knownHash];
  writeManifest(dir, { rows: Object.fromEntries(all.map((r) => [r.logical_id, r])) });
  const store = openManifest(dir);
  const writes = [];
  const fetchImpl = async (url, opts) => {
    assert.equal(opts.headers.authorization, 'Bearer t0k');
    assert.ok(url.startsWith(`${BASE}${DAM}/en/story/`));
    return new Response('ORIGINAL', { status: 200, headers: { 'content-length': '8' } });
  };
  const metadataImpl = async (args) => { writes.push(args); return { ok: true, status: 200 }; };
  const entry = (rows, logicalId = rows[0].logical_id) => ({
    path: rows[0].dam_asset_path, ids: rows.map((r) => r.logical_id), logicalId,
  });
  const { done, failed } = await backfill(store, [
    entry([ok, okAlias]), entry([wrongSize]), entry([rendition]), entry([knownHash]),
  ], {
    base: BASE, token: 't0k', fetchImpl, metadataImpl,
  });
  assert.deepEqual(done, [ok.dam_asset_path, rendition.dam_asset_path]);
  assert.match(failed[0], /size 8 ≠ .*'s 99/);
  assert.match(failed[1], /sha256 .* ≠ .*'s d+/, 'an existing sha256 is not overwritten');
  assert.deepEqual(writes.map((w) => [w.damPath, w.metadata]), [
    [ok.dam_asset_path, { sha256: sha, logicalId: ok.logical_id }],
    [rendition.dam_asset_path, { sha256: sha, logicalId: rendition.logical_id }],
  ], 'one write per asset');
  const { rows } = loadManifest(dir);
  assert.deepEqual([ok, okAlias, rendition].map((r) => rows[r.logical_id].sha256), [sha, sha, sha]);
  assert.equal(rows[wrongSize.logical_id].sha256, undefined);
  assert.equal(rows[knownHash.logical_id].sha256, 'd'.repeat(64));
  assert.ok(!existsSync(path.join(dir, '.lock')), 'the lock was released');
  openManifest(dir).compact();
});

test('media:reconcile refuses a non-https --dam-base before any token is used', () => {
  const cli = new URL('./reconcile-dam.mjs', import.meta.url).pathname;
  ['http://author.example.com', 'not a url', ''].forEach((base) => {
    const out = spawnSync(process.execPath, [cli, '--dam-base', base], { encoding: 'utf8', env: { ...process.env, AEM_DAM_TOKEN: '' } });
    assert.equal(out.status, 1);
    assert.match(out.stderr, /https author origin/);
  });
});
