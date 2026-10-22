# SKODA-511, AEM Assets → media feed: the row builder (sync core)
- **Epic:** E05, Media Pipeline
- **Type:** integration / backend job
- **Phase:** B · **Milestone:** M2 (go-live)
- **GitHub issue:** [#178](https://github.com/skoda-storyboard/demo/issues/178) (sub-issue of #117)
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 2–4d *(planning estimate, not a quote)*. Was 4 SP for the whole job
  before the 2026-10-16 split.
- **Status (2026-10-16):** 🔵 TODO. Split by the App Builder review
  ([`SKODA-APP-BUILDER-INTEGRATION.md`](../../architecture/SKODA-APP-BUILDER-INTEGRATION.md)):
  - **511** (this ticket): the row builder, independent of the runtime;
  - **[511a](SKODA-511a.md)**: App Builder orchestration (events, sweep, reconcile);
  - **[511b](SKODA-511b.md)**: operations and handover.

## Origin
SKODA-608 decision (2026-09-27, [`SKODA-MEDIA-ITEMS-OPTIONS.md`](../../architecture/SKODA-MEDIA-ITEMS-OPTIONS.md),
option B): AEM Assets is the single source of truth for images and videos; authors never maintain a page per asset.
The M1 demo feed is generated from the source listing; this ticket replaces that source with AEM Assets.

## Problem
- `/en/media-feed.json` (a DA sheet, contract `media-item` shape 3) feeds `/en/images`, `/en/videos`, the model-page
  Images/Videos rails and later the Media Room home rails.
- In M1 it's built once by `tools/importer/media-items/build-media-items.mjs` from the source site. In production the
  rows must follow AEM Assets: an asset appears when published, updates when its metadata changes and disappears when
  unpublished.

## Scope
A Node module with a CLI that turns AEM Assets into the feed. It knows nothing about App Builder: 511a calls it from
Runtime actions, and the same CLI is the scheduled GitHub Action fallback.

- **Read:** published Media Room assets under `/content/dam/storyboard` through author QueryBuilder (publish blocks
  it). Two entry points:
  - `full()`: every published asset;
  - `delta(sinceTimestamp, extraIds)`: assets with `jcr:lastModified` or `cq:lastReplicated` after the timestamp,
    plus given ids.

  Identity comes from the SKODA-518 metadata (`skoda:sourceUrl`, `skoda:sha256`, `skoda:logicalId`). Credentials
  are passed in (AEM service credentials); none are stored.
- **Map** each asset to a shape-3 row:
  - `image` = the published DAM URL of the original (the Media Bus derives every size, SKODA-ASSET-INGESTION-M2 §3B).
    Verify the card params (`?width=…&format=webply&optimize=medium`) work on it;
  - facets from AEM tags (SKODA-512); `id` = the asset id (cart key, SKODA-505a);
  - download fields from renditions; `bytes` / `mime` and the legacy source keys that SKODA-519 needs.

  An asset missing required metadata (title, date, a model or type tag) is **not** written. It goes to the run
  report instead.
- **Write** the SKODA-517 shapes with 517's shard writer:
  - `rebuild(touchedIds)` rebuilds only the shards those assets touch;
  - `rebuildAll()` rebuilds every shard under a new build id.

  Shards go to DA, then preview and publish (bulk); the registry is published **last**. A failed run leaves the
  previous registry live.
- **Report:** counts (read, written, skipped with reason, removed), duration and build id, written next to the
  registry for 511b's monitor.
- **Parity:** a comparison mode that diffs the rows against the M1 generator's output for the same assets.

## Acceptance Criteria
- [ ] `full()` + `rebuildAll()` on author produce rows that validate against contract `media-item` shape 3. The
      listings and rails render unchanged. A row-by-row diff against the M1 generator is recorded, with every
      difference explained.
- [ ] `delta()` + `rebuild()` change only the shards the touched assets belong to (asserted in tests).
- [ ] An unpublished or deleted asset is absent after `rebuildAll()`.
- [ ] Thumbnails load resized on the card (no full-size masters).
- [ ] Runs idempotently; an interrupted run doesn't publish a partial feed (the registry still points at the previous
      build).
- [ ] Assets with missing required metadata are listed in the run report, and no broken row is written.
- [ ] No source-CDN URL in any column it writes (SKODA-520 census gate).
- [ ] The CLI runs on a developer machine with the service credential from the environment, no credential in the repo.

## Note for the client (not a team task)
New uploads become good rows only if they carry the required metadata. The DAM team needs a rule for it: a metadata
schema or required fields on the Media Room folders.

## Dependencies
SKODA-517 (output shapes + shard writer), SKODA-518 (identity metadata), SKODA-512 (taxonomy), SKODA-504 / 504a (DAM
ingest), SKODA-608 (feed contract), SKODA-505a (cart key). AEM service credentials from **SKODA-521** for runs
against author. Used by SKODA-511a; monitored by SKODA-511b.

## Amendment (2026-10-22, M2 gap review §7.2)
Source: [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) §7.2, row "608 / 511": G-KO-04
(Low, not re-verified; measured in the browser follow-up) and the browser note on stale feed items
(`browser-impact.md`, area D). The client question (C4) and the team task (T6) are in SKODA-523; this ticket builds
T6's switch in the row builder. SKODA-608's amendment records the M1 side.

**Added scope:**
- **Restricted Vimeo ids** (G-KO-04). 6 of 30 distinct media-library Vimeo ids play only on skoda-storyboard.com
  (403 on aem.live): 1234323108, 1222100797, 1222101957, 1222101958, 1222103279 and 1175982542. The M1 generator
  drops them (oEmbed `domain_status_code: 403`), which would drop them from production too. The row builder writes
  them on the production build and leaves them out on QA builds, with the reason in the run report; once C4
  allow-lists `*.aem.page` and `*.aem.live`, it writes them everywhere.
- **Parity mode** (G-KO-04). The diff against the M1 generator explains the 6 ids as an expected difference.
- **Stale feed items** (browser note). The M1 feed misses source items 460448 (Vimeo 1237158593, plays on EDS),
  459429 (restricted) and 459448 (a card whose link is a logo PNG, with no video). `full()` reads every published
  asset, so the first two appear once their assets are published in AEM Assets. 459448 has no video, so it goes to
  the run report as missing required metadata, not into the feed as a broken video row.

**Added acceptance criteria:**
- [ ] A production-build run writes rows for the 6 restricted ids; a QA-build run lists them in the run report as
      skipped (domain-restricted), or writes them after C4 (G-KO-04).
- [ ] The parity diff lists the 6 restricted ids and 460448, 459429 and 459448, each with its reason (G-KO-04,
      browser note).
- [ ] After `full()` + `rebuildAll()`, once their assets are published, 460448 has a row and 459429 has one on the
      production build; 459448 is in the run report with no row (browser note).

**Estimate after the amendment:** 3 SP (unchanged) · AI-assisted 1–2d / manual 2–4d *(planning estimate, not a
quote)*. The production switch (under 0.5 SP in the review) is counted in SKODA-523's shared scope (T6); the stale
items are test cases for the existing parity criterion.

**Added dependencies:** SKODA-523 (C4, T6).
