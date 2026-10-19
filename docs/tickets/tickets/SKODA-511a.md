# SKODA-511a, App Builder orchestration for the media feed sync: events, sweep, reconcile
- **Epic:** E05, Media Pipeline
- **Type:** integration / service
- **Phase:** B · **Milestone:** M2 (go-live)
- **GitHub issue:** [#382](https://github.com/skoda-storyboard/demo/issues/382) (created 2026-10-16)
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 2–4d *(planning estimate, not a quote)*
- **Status (2026-10-16):** 🔵 TODO (M2), no owner. Blocked by SKODA-521. Design:
  [`SKODA-APP-BUILDER-INTEGRATION.md`](../../architecture/SKODA-APP-BUILDER-INTEGRATION.md) §3.

## Why
The row builder (SKODA-511) must run when AEM Assets changes. Events alone can't drive it:
- `metadata_updated` and `deleted` don't fire for Touch UI edits;
- Touch UI moves and deletes send no `unpublished`;
- AEM events have no SLA.

So events shorten the delay, while a watermark sweep and a nightly reconcile make the feed correct.

## Scope
In the `skoda-storyboard/asset-sync` App Builder app (set up by SKODA-521):
- **`on-asset-event`** (non-web, `require-adobe-auth: false`):
  - de-duplicates on the event `id`;
  - writes `dirty:<assetId>` = `{ path, type, ts }` to State (region `emea`, TTL 7 days);
  - returns 200 within 60 s;
  - never calls AEM or DA.
- **`sweep`** (alarm, every 15 min, non-blocking, `limits.timeout` up to 1 h):
  - takes a lock in State, so a run that finds the lock skips;
  - reads the dirty set and the watermark;
  - calls `delta(watermark, dirtyIds)` + `rebuild()` from SKODA-511;
  - on success advances the watermark and clears the processed ids;
  - on failure leaves both as they were.
- **`reconcile`** (alarm, nightly 02:00 UTC, non-blocking, up to 3 h): takes the lock and calls `full()` +
  `rebuildAll()`, which drops removed and unpublished assets. The watermark is reset to the run's start.
- **Stage vs Production:** Stage writes a preview-only `/drafts/media-feed-stage/` and never publishes; Production
  writes `/en/media-feed/`.
- **Limits:** no action returns data (1 MB result cap). A bulk publish of thousands of assets lands as dirty keys
  and one sweep, not thousands of activations.

## Acceptance Criteria
- [ ] On Stage: a publish, a retag in **Assets View** and an unpublish each show in the Stage feed within one sweep
      (≤15 min); the same retag in the **Touch UI** shows within one sweep (watermark).
- [ ] A **Touch UI delete** is gone from the feed after the next reconcile.
- [ ] A bulk publish of 1,000 assets is absorbed with no throttled activations (≤100 concurrent) and no event
      delivery marked failed in Debug Tracing.
- [ ] Two overlapping alarm runs never write at the same time (lock test); a duplicate event is processed once.
- [ ] A failed sweep keeps the watermark and the dirty ids, so the next run retries them.
- [ ] A week on Stage beside the M1 generator, compared daily (SKODA-511 parity mode), before the Production
      cutover. After cutover the source-listing generator is retired.

## Dependencies
**SKODA-521** (project, credentials, V1–V6), SKODA-511 (row builder), SKODA-517 (shapes). Monitored by SKODA-511b.
