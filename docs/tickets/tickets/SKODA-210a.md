# SKODA-210a, Event-gallery download tiles (media-card tiles with media-cart add + download on the day pages)

- **Epic:** E02, Core Blocks
- **Type:** block reuse / import
- **Phase:** B · **Milestone:** M2 (go-live, 2027-01-02)
- **Estimate:** 2–3 SP · AI-assisted 1d / manual 2d, the 210 amendment's 5–6 SP less SKODA-210's 3 SP; the image
  ingestion stays in 517 / 520 *(planning estimate, not a quote)*
- **GitHub issue:** to create
- **Parent:** SKODA-210
- **Status (2026-10-22):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-E-01 (High, confirmed).

## Why
- **Event-gallery day pages are media-cart download galleries, not plain colorbox galleries** (G-E-01). On a
  sampled day page (`/en/skoda-elroq-covered-drive-28-6/`) every tile is a media-cart item: 82 tiles, 83 attachment
  ids, 166 add-to-cart actions and 164 download links (a `/direct-download/` original and a 1920px download).
- SKODA-210's Description and Requirements cover only `siteorigin-body` + `gallery` + `card-teaser`, so the plain
  `gallery` tile would drop the downloads (G-E-01).
- **They are current.** The newest hub (Epiq Covered Drive, 9 day pages) is dated Jan–Mar 2026: these are photo
  services for journalists (G-E-01).
- **Image volume.** About 111 day pages at 60–83 images each, roughly 7–9k images. SKODA-517 and SKODA-520 do not
  count them today (G-E-01).

## Scope
- **Tiles:** event-gallery tiles carry the media-cart add and download actions. Reuse the press-kit media card /
  SKODA-406 media card and the SKODA-505 cart, not the plain `gallery` tile (G-E-01).
- **Downloads:** each tile offers the original and the 1920px download, resolving to migrated assets (with
  SKODA-520), not the source CDN or `/direct-download/`.
- **Day pages in scope:** the event-gallery day pages that SKODA-210's migrate / fold / drop decision and its
  event-date cutoff keep.
- **Ingestion volume:** add the event-gallery image count to the SKODA-517 / SKODA-520 ingestion volume (G-E-01).

## Not in scope
- The migrate / fold / drop decision, the event-date cutoff, the full-bleed shell, the campaign pages and the plain
  galleries: SKODA-210.
- The image ingestion itself: SKODA-517 / SKODA-520.
- The Q-5 correction in the decision register (~240 pages across 3 templates, not ~150).

## Acceptance criteria
- [ ] Every migrated event-gallery tile offers add-to-cart and download (original + 1920px), matching the source
      tile; a sampled day page keeps its tile count (e.g. 82 on `/en/skoda-elroq-covered-drive-28-6/`) (G-E-01).
- [ ] Downloads resolve to migrated assets, not the source CDN or `/direct-download/` (G-E-01, with SKODA-520).
- [ ] The event-gallery image count is recorded in the SKODA-517 / SKODA-520 ingestion volume (G-E-01).

## Dependencies
SKODA-210 (scope decision, cutoff, full-bleed shell), SKODA-406 (media card), SKODA-505 (cart), SKODA-517 /
SKODA-520 (ingestion, migrated assets). Parent: SKODA-210.
