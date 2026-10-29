# SKODA-518, Media manifest as a sharded ledger; AEM Assets metadata as the record of identity

- **Epic:** E05, Media Pipeline
- **Type:** tooling / data
- **Phase:** B · **Milestone:** M2 (go-live, 2027-01-02)
- **Estimate:** 2 SP · AI-assisted 1–1.5d / manual 2–3d *(planning estimate, not a quote)*
- **GitHub issue:** [#376](https://github.com/skoda-storyboard/demo/issues/376) (created 2026-10-16)
- **Status (2026-10-29):** 🟡 Built on branch `skoda-518-manifest-ledger` (see "Implementation, 2026-10-29").
  Open: `media:reconcile` against author (developer machine, DAM token). Prerequisite for the SKODA-504a bulk ingest. Design in
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
- [x] All existing media tests pass against the ledger. `media:cart-index --check`, `media:apply --dry-run` and the
      `import:push` gate give the same results as on the old file (diff recorded). See "Parity".
- [x] A 1,000-row build writes each shard O(1) times per run (journal + compaction), measured.
- [x] Two branches that add rows for different pages merge without a conflict in a test fixture.
- [ ] `media:reconcile` runs against author with the DAM token on a developer machine and reports 0 unexplained
      differences for the current rows. *(Built and tested with a fake QueryBuilder; not run against author.)*
- [x] The ledger is not served (`curl` on the code bus path returns 404). *(2026-10-29 on the branch preview: shards
      `00.jsonl` / `3f.jsonl` 404, `manifest-ledger.mjs` 200 after code sync.)*

## Dependencies
SKODA-504 ✅, SKODA-503 ✅. Feeds SKODA-504a, 511, 519.

## Implementation, 2026-10-29
- **Ledger** (`tools/importer/media/manifest-ledger.mjs`, re-exported by `media-lib.mjs`):
  - `manifest/NN.jsonl`: 64 shards by a sha1 of `logical_id`, one row per line, sorted;
  - `loadManifest()` keeps the `{ generatedAt, rows }` API; `openManifest()` adds `record(id)` (one journal line)
    and `compact()` (each touched shard written once, then the journal is removed);
  - a journal left by an interrupted run is replayed on load and compacted by the next run;
  - a `.json` location is still read and written as one object (test fixtures, old branches).
- **Migration:** the 7,001 rows of `media-manifest.json` (11.5 MB, 2026-10-29), not 3,609 as in the census. Row
  for row identical in the ledger (8.9 MB); the old file is removed.
- **Tools switched:** `media:build` and `media:publish-images` journal each row and compact at the end, also
  after a failure; `media:apply`, `media:cart-index`, `media:audit`, `media:validate-binaries`, the post-import
  hook, `media-items:build` and the `import:push` gate read the ledger.
- **Merging:** `.gitattributes` `merge=union` on the shards. In the fixture, the same two-branch merge conflicts
  in 38 of 64 shards without it and in none with it. A row changed on both branches becomes two lines, and every
  tool refuses the ledger with the row's two places. GitHub's web conflict editor may not apply the rule: merge
  `main` into a branch locally.
- **Integrity** (`media-manifest-integrity.test.mjs`): no duplicate row, no row without an id or in the wrong
  shard, no committed journal; the `seen_urls` stem check now covers every row, not only PDF/MP4 (0 offenders).
- **Provenance:** `setDamMetadata` writes `skoda:sha256` and `skoda:logicalId`. The sha256 is computed while the
  original downloads (`fetchBinaryToFile`, per attempt) or from the image buffer, and kept in the row.
- **`media:reconcile`** (`reconcile-dam.mjs`): QueryBuilder on author, paged; unexplained (exit 1) = a row whose
  asset is gone, an asset with migration provenance and no row, a row and asset that disagree on source, logical
  id or sha256. Explained: assets without sha256 / logical id (uploaded before this ticket; `--backfill` adds
  them for an approved batch) and assets without migration provenance. Read-only without `--backfill`.
- **`npm run media:ledger -- --check | --compact | --fold <branch.json> --base <merge-base.json>`.** `--fold`
  applies only the rows an old-format branch changed since its merge base; a row changed on both sides is listed
  and left as it is. #540 (SKODA-814) changes `media-manifest.json`: it folds its rows in this way after this merges.
- **Measured** on the real ledger: a 1,000-row run takes 0.35 s and 64 shard writes. The old flush rewrote the
  11.7 MB file after every row: ~110 ms per row, ~110 s and ~11.7 GB written for 1,000 rows.

### Parity (main's tools on `media-manifest.json` vs the branch on the ledger)
362 imported pages (two local content stores), `media:apply --dry-run`, `media:cart-index --check`, and the
`import:push` dry run (DA read only) on 36 of them:
- **`media:cart-index --check`:** identical output.
- **Row order made two lookups non-deterministic.** A URL two rows claim resolved to whichever row came last in
  the file; sorted shards change that order. Both lookups now decide by content:
  - **images (`media:apply`):** the row the URL is the logical id of wins. 27 URLs are claimed twice (`x.JPG.jpg`
    and `x.jpg` rows of one file); main's order picked that row for 20 of them. The other **7 now get the master
    instead of a 768px rendition**, on 5 pages (Classic Days Felicia, the Octavia powertrain release, the Asturias
    road trip, the car-photo story, number of the month 140);
  - **PDF/MP4 (`binaryLookups`):** the verified row wins over an unverified alias. The Fabia 130 press kit's 4
    "unverified" links on main are verified on the branch.
- **`import:push` gate:** the same decision on 35 of 36 pages. The Fabia 130 press kit is blocked on both: main
  says "unverified video link", the branch "imported binary link missing" for its unverified duplicate rows.

### Found, not changed here (notes, not tickets)
- **Failing on `main` too, unchanged here:**
  - `media-manifest-integrity.test.mjs` "no two PDF/MP4 rows claim the same source URL with different
    verification states": 4 PDFs (Škoda 440, Peaq technical data, Škoda 1100 MBX, Octavia 1960) have a `partial`
    duplicate row beside the `done` one. The rows need merging (data, not code);
  - `push-to-da.test.mjs` "--approve-hold publishes a wave-gate-approved broken fallback": an unmocked request for
    `/en/fragments/newsletter-card.plain.html`.
- `scripts/media-cart-index.json` is stale against the manifest on `main` (`media:cart-index --check` exits 1 on
  both sides).
