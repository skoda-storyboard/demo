# SKODA-223, Gallery `preview` variant (press-release sidebar media-kit preview)
- **Epic:** E02, Core Blocks
- **Type:** block variant
- **Phase:** A · **Milestone:** M1 (demo-visible on every press release)
- **Estimate:** 1.5 SP · AI-assisted 0.5d / manual 1–1.5d *(planning estimate, not a quote)*
- **Status (2026-09-27):** 🔵 TODO

## Origin
SKODA-607 phase split (2026-09-27). 607 delivers the press-release import + template and emits this variant's
final shape now; the block change is its own ticket (block extensions are ticketed separately, not built in 607).

## Problem (measured, source DevTools 2026-09-27, 5 M1 press releases)
- The source sidebar `section.images.sa-media-kit-preview` ("Images") is a **thumbnail-only preview**: no main
  stage, 2 columns of 16:9 thumbs, **172×97 at 1280** (content column 342 wide), **118×67 at 768**, **1 column at
  500** (488 wide). Each thumb opens the image in a lightbox. The 5 M1 releases carry 1, 3, 4, 2 and 3 thumbs.
- The ticket amendment (607, 2026-09-25) adds a **"+N" pill** once a release has more images than the preview shows
  (after 4). None of the 5 M1 releases hits it; corpus releases can.
- `blocks/gallery` has one layout only: a main image plus a 3/4/5-column thumbnail rail (gallery.js:82-173). In the
  342px sidebar that renders an oversized main stage, so the sidebar doesn't match the source.

## Scope
- `blocks/gallery`: add the `preview` variant (`Gallery (preview)`):
  - no main stage; 2-up 16:9 thumbnail grid that fills the column; 1 column below 768;
  - show at most 4 thumbs; with more, the 4th carries a "+N" pill (N = hidden count) that opens the lightbox at
    the 5th image;
  - every thumb opens the existing lightbox (`buildLightbox`), keyboard operable, labelled;
  - captions stay available to the lightbox, not shown under the thumbs.
- No change to the default Gallery or to `slider` (SKODA-819). Coordinate with 819: same block, don't run in parallel.

## Acceptance Criteria
- [ ] On the 5 M1 press releases (branch preview), the sidebar Images preview matches the source at 1280/1024/768/500:
      thumb 172×97 ±2px at 1280, 2 columns ≥768, 1 column <768, gap as measured.
- [ ] "+N" pill appears only when there are more than 4 images (unit test with 6 rows → 4 thumbs, "+2").
- [ ] Lightbox opens from every thumb and from the pill; Esc closes; focus returns (a11y as SKODA-203).
- [ ] Default Gallery and story pages unchanged (regression check on 1 story).
- [ ] lint + tests green; no re-import needed (contract shape 1).

## Dependencies
SKODA-203 (gallery + lightbox), SKODA-607 (emits the shape), SKODA-819 (same block, serialize).
Consumers: SKODA-607, SKODA-805c.

## Import contract (SKODA-603)
Contract `gallery-preview` (**pinned 2026-09-27**, fallback **readable**: the normal Gallery) in
[`SKODA-PENDING-BLOCK-CONTRACTS.md`](../../planning/SKODA-PENDING-BLOCK-CONTRACTS.md). Shape: header
`Gallery (preview)`, then one row per image `[<picture>, caption paragraph or empty]`, identical to `Gallery`.
Emitted by `transformers/skoda-press-release-layout.js`.
