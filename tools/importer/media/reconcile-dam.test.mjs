/*
 * media:reconcile (SKODA-518): the ledger against the author DAM, with a fake QueryBuilder.
 * Run: node --test tools/importer/media/reconcile-dam.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
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
  assert.deepEqual(report.needsBackfill, [row(5).logical_id]);
  assert.equal(report.unexplained, 4);
  // the source URL may be the row's master, its original or its source
  const r7 = row(7);
  const viaSource = reconcile(
    { [r7.logical_id]: r7 },
    new Map([[r7.dam_asset_path, asset(r7, { sourceUrl: r7.source_url })]]),
  );
  assert.equal(viaSource.unexplained, 0);
});

test('reconcile: two rows sharing one asset (a CDN row and its alias) claim it once', () => {
  const alias = row(1, { logical_id: 'ffffffff__img-1.jpg' });
  const report = reconcile(
    { [row(1).logical_id]: row(1), [alias.logical_id]: alias },
    new Map([[row(1).dam_asset_path, asset(row(1), { logicalId: '' })]]),
  );
  assert.equal(report.notInLedger.length, 0);
  assert.equal(report.unexplained, 0);
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
  assert.match(first.get('p.properties'), /jcr:content\/metadata\/skoda:sha256/);
  assert.equal(new URL(calls[1][0]).searchParams.get('p.offset'), '2');
  assert.deepEqual([...assets.keys()], [`${DAM}/a.jpg`, `${DAM}/b.jpg`, `${DAM}/c.pdf`]);
  assert.deepEqual(assets.get(`${DAM}/a.jpg`), { sourceUrl: 'https://cdn/a.jpg', sha256: 'f'.repeat(64), logicalId: '' });
  assert.equal(assets.get(`${DAM}/b.jpg`).logicalId, 'id-b');
  await assert.rejects(damAssets({
    base: BASE, token: 't', fetchImpl: async () => ({ ok: false, status: 401 }),
  }), /QueryBuilder returned 401/);
});

test('backfill: hashes the author original, checks its size, writes the asset and the row', async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'reconcile-'));
  const ok = row(1);
  const wrongSize = row(2, { bytes: 99 });
  writeManifest(dir, { rows: { [ok.logical_id]: ok, [wrongSize.logical_id]: wrongSize } });
  const store = openManifest(dir);
  const writes = [];
  const fetchImpl = async (url, opts) => {
    assert.equal(opts.headers.authorization, 'Bearer t0k');
    assert.ok(url.startsWith(`${BASE}${DAM}/en/story/`));
    return new Response('ORIGINAL', { status: 200, headers: { 'content-length': '8' } });
  };
  const metadataImpl = async (args) => { writes.push(args); return { ok: true, status: 200 }; };
  const { done, failed } = await backfill(store, [ok.logical_id, wrongSize.logical_id], {
    base: BASE, token: 't0k', fetchImpl, metadataImpl,
  });
  assert.deepEqual(done, [ok.logical_id]);
  assert.match(failed[0], /size 8 ≠ the row's 99/);
  assert.deepEqual(writes.map((w) => w.metadata), [{ sha256: sha256Of(Buffer.from('ORIGINAL')), logicalId: ok.logical_id }]);
  const { rows } = loadManifest(dir);
  assert.equal(rows[ok.logical_id].sha256, sha256Of(Buffer.from('ORIGINAL')));
  assert.equal(rows[wrongSize.logical_id].sha256, undefined);
});
