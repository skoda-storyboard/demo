# SKODA-518, Media manifest as a sharded ledger; AEM Assets metadata as the record of identity

- **Epic:** E05, Media Pipeline
- **Type:** tooling / data
- **Phase:** B · **Milestone:** M2 (go-live, 2027-01-02)
- **Estimate:** 2 SP · AI-assisted 1–1.5d / manual 2–3d *(planning estimate, not a quote)*
- **GitHub issue:** not created yet
- **Status (2026-10-16):** 🔵 TODO (M2), no owner. Prerequisite for the SKODA-504a bulk ingest. Proposed in
  [`SKODA-ASSET-INGESTION-M2.md`](../../architecture/SKODA-ASSET-INGESTION-M2.md) §3A.

## Why
- `tools/importer/media/media-manifest.json` is one 7 MB JSON object (3,609 rows). At M2 volume (~28,300 logical
  images) it is ~58 MB.
- `build-media-manifest.mjs` rewrites the whole file after every row. The cost grows with the square of the row count.
- Contention: 92 commits since 2026-09-01, 25 of them merges, several "merged row by row". It has had duplicate JSON
  keys and last-wins `seen_urls` hijacks.
- It is not in `.hlxignore`; the code bus answers 413 for it.
- It is the only inventory of the DAM, but the DAM already holds `skoda:sourceUrl` / `skoda:sourcePage` per asset.

## Scope
- **Provenance on the asset:** `setDamMetadata` also writes `skoda:sha256` (of the original) and `skoda:logicalId`.
  Backfill them for assets already uploaded.
- **Ledger format:**
  - JSONL rows sharded by a hash of `logical_id` (e.g. 64 files under `tools/importer/media/manifest/`);
  - an append-only journal during a run, compacted at the end;
  - one loader/writer in `media-lib.mjs` behind the current API, so the 9 tools change only their import;
  - a one-off migration from the current file, which then becomes read-only and is removed.
- **Integrity:**
  - a test fails on a duplicate `logical_id`;
  - a test fails on a `seen_urls` stem that doesn't match its row's source stem;
  - the existing `media-manifest-integrity` checks are carried over.
- **Reconcile:** `media:reconcile` queries author (QueryBuilder on `skoda:sourceUrl` / `skoda:sha256`) and reports
  rows missing on either side. Read-only.
- `.hlxignore` the ledger.

## Acceptance criteria
- [ ] All existing media tests pass against the ledger. `media:cart-index --check`, `media:apply --dry-run` and the
      `import:push` gate give the same results as on the old file (diff recorded).
- [ ] A 1,000-row build writes each shard O(1) times per run (journal + compaction), measured.
- [ ] Two branches that add rows for different pages merge without a conflict in a test fixture.
- [ ] `media:reconcile` runs against author with the DAM token on a developer machine and reports 0 unexplained
      differences for the current rows.
- [ ] The ledger is not served (`curl` on the code bus path returns 404).

## Dependencies
SKODA-504 ✅, SKODA-503 ✅. Feeds SKODA-504a, 511, 519.
