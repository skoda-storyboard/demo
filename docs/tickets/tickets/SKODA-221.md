# SKODA-221, Cards `tiles` / mosaic variant (series hubs + press-kit hubs)
- **Epic:** E02, Core Blocks
- **Type:** block variant
- **Phase:** A · **Milestone:** M1 (demo-visible)
- **Estimate:** 3 SP · AI-assisted 1d / manual 2–3d *(planning estimate, not a quote)*
- **Status (2026-09-25):** 🔵 TODO

## Origin
Demo URL/block sweep, 2026-09-25 (report §5). The series and press-kit groups raised the same root cause; build it once.

## Problem (measured)
- **Series hubs (5):** curated mosaic on a 12-column track at 1248. Tile sizes: `sq` 604×604, `sq-small` 292×292, `wide`
  604×292 and `third` 396×188, with a 20px gap. Title h2 16px/18px/500 white, no text-shadow, no date/label/excerpt, no hover change.
  Tile counts 14 / 10 / 8 / 5 / 12.
- **Press-kit hubs (3):** rows of 2:1 feature tiles 479×230 + 1:1 squares 230×230 (pitch 250, gap 20). The Motorsport
  row 5 is 4 × 292×292.
- **≤767 / ≤781:** every tile becomes 1-up 16:9 (370×208 at 390), 20px gap, 10px side inset.
- **EDS `cards` (overlay) today:** uniform 4 × 294×165 16:9, gap 24, title 18/400/21.6 with text-shadow, and the image
  scales to 1.02 on hover. At 390: 342×192 at x=24, gap 24.

## Scope
- `Cards (overlay, tiles)`: a per-card size token read from the row (e.g. a first cell `sq | sq-small | wide | third |
  feature`), the 12-column track, 20px gap, the 16/18/500 title with no shadow and no hover zoom, and the 1-up 16:9 mobile layout.
- The 805a (press-kit hub) and 207 (series hub) importers emit the variant plus size tokens (the source marks feature tiles
  `ratio-2x1`).

## Acceptance Criteria
- [ ] 1440 tile rects match the source per hub (±2px), 20px gap.
- [ ] 390: 1-up 370×208, 20px gap, x=10.
- [ ] Title 16/18/500, no text-shadow, no hover zoom; other cards variants unchanged.

## Dependencies
SKODA-201 (cards), SKODA-207 (series hub importer: static curated rows), SKODA-805a (press-kit hub importer).

## Import contract (SKODA-603)
Contract(s) `cards-tiles` in [`SKODA-PENDING-BLOCK-CONTRACTS.md`](../../planning/SKODA-PENDING-BLOCK-CONTRACTS.md). Pinned shape: `Cards (overlay, tiles)`, one row per tile `[size token, picture, title link]`, with tokens `sq`/`sq-small`/`wide`/`third`/`feature`. If this ticket needs a different DA shape, change the contract (and bump `shape`) in the same PR.
