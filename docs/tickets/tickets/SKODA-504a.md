# SKODA-504a, AEM Assets scale-out: the full media set, with rights, dedup and approval (follow-up to SKODA-504)
- **Epic:** E05, Media Pipeline (follow-up to SKODA-504, #49, closed 2026-09-22)
- **Type:** media / integration · **Phase:** B · **Milestone:** M2 (go-live 02 Jan 2027)
- **GitHub issue:** [#371](https://github.com/skoda-storyboard/demo/issues/371) (created 2026-10-15 from the M2 readiness review)
- **Estimate:** 3–5 SP *(planning estimate, not a quote)*
- **Status (2026-10-16):** 🔵 TODO (M2), no owner. Gated on decisions. Scope refined by the 2026-10-16 asset-ingestion
  review ([`SKODA-ASSET-INGESTION-M2.md`](../../architecture/SKODA-ASSET-INGESTION-M2.md) §3B, §3E); runs on the
  SKODA-518 ledger.

## Why
SKODA-504 mapped the **demo subset** of S3 images to AEM Assets. Go-live needs the media behind every migrated page:
~28,300 logical items, ~34 GB of masters. That requires rules the demo didn't need: usage rights, duplicate handling,
unmatched items and an approval filter.

## Scope
- Masters-only ingest at scale (SKODA-501 / 506 rules), batched and resumable, from a developer machine.
- Dedup by content hash across posts / press releases / press kits. Unmatched-item report.
- Rights / approval metadata: which assets may be published (client rule, D5 follow-up).
- Feeds SKODA-511 (feed sync) and SKODA-512 (taxonomy).

### Added by the 2026-10-16 review
- **DA source carries DAM URLs.** Today `media:apply` writes the source-CDN master into the DA `<img src>`:
  - Elroq has 9 of 9 images on `cdn.skoda-storyboard.com`;
  - the local import store has 8,683 source-CDN references vs 439 DAM links in 358 pages;
  - only the delivered HTML is on the Media Bus.

  Once a row is published with public proof, write its AEM publish URL instead. Oversized masters (SKODA-506) point
  at a DAM processing-profile rendition (Media Bus input ≤10 MiB; renditions are Media Bus, D5 2026-10-16), never a
  source-CDN ladder file. The cutover itself is tracked, phased and gated in **SKODA-520** (P1).
- **Check first:**
  - what the DA Assets picker (#62) writes into DA source, so that migrated and new images share one shape;
  - whether the Media Bus keeps serving an already-ingested hash on re-preview once its source host is gone.
- **Dedup before upload** on `skoda:sha256` (SKODA-518).
- **Batches** run from the ledger journal. Images upload in parallel; PDF/MP4 stay serial (SKODA-503).
- **Bulk runs skip the per-page post-import `media:build` hook** (the rerun traps). One `media:apply --dry-run`
  per batch; read its "blocked" lines before the real apply.
- **Sweep:** a per-page count of source-CDN references in DA source, attached at each batch.

## Acceptance criteria
- [ ] Every image referenced by an imported EN page resolves to an AEM Assets delivery URL (0 source-CDN references).
- [ ] The dedup and unmatched reports have been reviewed by the client.
- [ ] Only approved assets are published.
- [ ] DA source of every migrated EN page has 0 `cdn.skoda-storyboard.com` / `/direct-download/` references
      (sweep attached), and delivered pages still render their images from the Media Bus.

## Dependencies
504 ✅, 506 ✅, SKODA-518 (ledger + DAM provenance), #219 (WebP activation 404), D5 (instance, rendition scheme, rights rule), D7 (cutoff sets the volume).
