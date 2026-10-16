# SKODA-511, AEM Assets → media feed sync job
- **Epic:** E05, Media Pipeline
- **Type:** integration / backend job
- **Phase:** B · **Milestone:** M2 (go-live)
- **GitHub issue:** [#178](https://github.com/skoda-storyboard/demo/issues/178) (sub-issue of #117)
- **Estimate:** 4 SP · AI-assisted 1.5–2.5d / manual 3–5d *(planning estimate, not a quote)*
- **Status (2026-10-16):** 🔵 TODO. Output shapes moved to SKODA-517 by the 2026-10-16 asset-ingestion review
  ([`SKODA-ASSET-INGESTION-M2.md`](../../architecture/SKODA-ASSET-INGESTION-M2.md) §3F).

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
- A job that reads **published** Media Room assets (answer 1: publish status decides) with their metadata and tags,
  and writes the feed in the shape-3 row format:
  - `image` = the asset's published delivery URL (answer 3: the AEM native CDN / Media Bus). Verify it accepts the
    card params (`?width=…&format=webply&optimize=medium`, from `createOptimizedPicture`), or add a small adapter in
    the shared card-image path.
  - facets from AEM tags (SKODA-512); `id` = the asset id (the cart key, SKODA-505a); download fields from renditions.
- **Sharding:** write the SKODA-517 shapes (facet slices, head shards, facet index + detail shards, keyed shards,
  registry). At today's 40 columns one sheet holds at most ~12,500 rows. Readers pick shards through 517's loader.
- **Source query:** QueryBuilder on **author** (publish blocks it) over `/content/dam/storyboard`, incremental on
  `cq:lastReplicated`. Identity from the SKODA-518 metadata (`skoda:sourceUrl`, `skoda:sha256`, `skoda:logicalId`).
- **Atomic publish:** shards under the build id, the registry published last. A failed run leaves the previous
  registry live.
- **Cart keys:** write the legacy source keys and `bytes` / `mime` that SKODA-519 needs.
- Upload to DA, preview and publish the sheet(s) (the `--push` path of the M1 generator is the reference).
- **Open (after the demo, answer 4):** trigger (AEM Assets events vs a schedule), runtime (App Builder action vs
  GitHub Action) and owner. **Decided 2026-10-16: App Builder**, see
  [`SKODA-ASSET-INGESTION-M2.md`](../../architecture/SKODA-ASSET-INGESTION-M2.md) §3F:
  - an event action on `aem.assets.asset.published` / `.unpublished` / `.deleted` / `.metadata_updated` records
    asset ids and paths in App Builder State;
  - a sweep action every 15 min rebuilds the touched shards: the dirty set plus assets modified or replicated since
    the watermark (non-blocking, ≤3 h). The watermark catches Touch UI edits, which send no event;
  - a nightly full reconcile runs from author QueryBuilder and drops rows for removed or unpublished assets. It is
    required because `metadata_updated` and `deleted` don't fire for Touch UI or `/api/assets` actions, and AEM
    events have no SLA;
  - limits to design for: 1 MB payload/result, 100 concurrent activations per namespace.

  Needs the App Builder entitlement, the workspace OAuth S2S credential (events), AEM service credentials (JWT,
  QueryBuilder read), a site admin API key (`publish`) and DA write for a machine identity (**to verify**). Set-up
  and checks: [`SKODA-APP-BUILDER-INTEGRATION.md`](../../architecture/SKODA-APP-BUILDER-INTEGRATION.md). Fallback if the entitlement is late: the same reconcile as a scheduled GitHub
  Action. Check whether a config-service custom header can shorten the registry's `max-age` (today 7200).

## Acceptance Criteria
- [ ] Publishing / unpublishing / retagging an asset in AEM Assets is reflected in the feed within the agreed
      latency; no EDS page is created per asset.
- [ ] Rows validate against contract `media-item` shape 3; the listings and rails render unchanged.
- [ ] Thumbnails load resized on the card (no full-size masters).
- [ ] Runs idempotently; failures don't publish a partial feed.
- [ ] A bulk publish of 1,000 assets is absorbed in batched alarm runs (no throttled activations), and a retag made
      in the Touch UI reaches the feed by the next reconcile.
- [ ] No source-CDN URL in any column it writes (SKODA-520 census gate).

## Dependencies
SKODA-504 (DAM ingest / mapping), SKODA-504a, SKODA-512 (taxonomy), SKODA-517 (output shapes), SKODA-518 (identity
metadata), SKODA-608 (feed contract), SKODA-505a (cart key).
