# SKODA-221, Cards `tiles` / mosaic variant (series hubs + press-kit hubs)
- **Epic:** E02, Core Blocks
- **Type:** block variant
- **Phase:** A · **Milestone:** M1 (demo-visible)
- **GitHub issue:** [#141](https://github.com/skoda-storyboard/demo/issues/141)
- **Estimate:** 3 SP · AI-assisted 1d / manual 2–3d *(planning estimate, not a quote)*
- **Status (2026-09-28):** 🟡 Renderer implemented and measured locally; independent QA and press-kit shape-3 re-import pending.

## Origin
Demo URL/block sweep, 2026-09-25 (report §5). The series and press-kit groups raised the same root cause; build it once.

## Problem (measured)
- **Series hubs (5):** curated mosaic on a 12-column track at 1248. Tile sizes: `sq` 604×604, `sq-small` 292×292, `wide`
  604×292 and `third` 396×188, with a 20px gap. Title h2 16px/18px/500 white, no text-shadow, no date/label/excerpt, no hover change.
  Tile counts 14 / 10 / 8 / 5 / 12.
- **Press-kit hubs (3):** rows of 2:1 feature tiles 479×230 + 1:1 squares 230×230 (pitch 250, gap 20). The Motorsport
  row 5 is 4 × 292×292.
- **≤780:** one-up, but authored square/wide ratios remain at 768–780. **≤767:** every tile becomes 16:9
  (370×208 at 390), 20px gap, 10px side inset. Measured directly at 767/768/780/781.
- **EDS preview before this change:** at 1440 series tiles are four 289×236 cards with 24px gap,
  printed size tokens, 14/400 title links and image scale 1.02 on hover. At 390, the card
  box is 370×265 rather than the source's 370×208 (though its image is already 370×208).

## Scope
- `Cards (overlay, tiles)`: consume the first-cell size token, keep the source row breaks, use
  a 12-column series track and a 20-column press-kit track, 20px gap, 16/18/500 overlaid
  title with no shadow/hover zoom, the source's two-gradient scrim rather than the
  stronger generic-card text scrim, and the measured 781-column/768-ratio transitions.
- **Accessibility-driven deviation:** the measured source scrim alone leaves 634/2,280
  title-area background samples under 4.5:1 at 1440 and 698/2,271 at 390
  (worst ~1.39:1). A tiles-only 56% black backdrop directly under each linked
  title line guarantees at least ~4.9:1 against even an otherwise white image,
  while leaving the rest of the image on the source's two-gradient scrim. This
  visible deviation is intentional; do not add text-shadow or darken ordinary cards.
- The 207 importer already emits the variant and all shape-2 series tokens for 15 hubs.
  805a must emit the shape-3 press-kit tokens `feature` (8/20), `press-square` (4/20)
  and `press-quarter` (5/20) without sorting or dropping tiles. The three existing DA
  press-kit previews still contain ambiguous `feature`/`sq` tokens (Motorsport: only
  `sq`); both the renderer and the import gate explicitly hold these pages until a
  shape-3 re-import can safely display them.

## Acceptance Criteria
- [ ] 1440 tile rects match the source per hub (±2px), 20px gap.
- [ ] 390: 1-up 370×208, 20px gap, x=10.
- [ ] Title 16/18/500, no text-shadow, no hover zoom; other cards variants unchanged.
- [ ] Tile scrim has only the source's 25% horizontal and 10% vertical gradients;
      non-tiles retain their original three-layer scrim.
- [ ] The linked title's scoped backdrop keeps white text contrast ≥4.5:1;
      remeasure title line wraps and focus after applying it.
- [ ] At 768/780, tiles are one-up but retain their authored ratios; at 767 all are 16:9.
      Validate short `end` rows, all 15 series hubs, and the three press-kit counts 13/13/24.

## Dependencies
SKODA-201 (cards), SKODA-207 (series hub importer: static curated rows), SKODA-805a (press-kit hub importer).

## Import contract (SKODA-603)
Contract `cards-tiles` in [`SKODA-PENDING-BLOCK-CONTRACTS.md`](../../planning/SKODA-PENDING-BLOCK-CONTRACTS.md),
shape 3: `Cards (overlay, tiles)`, one row per tile `[size token, picture, title link]`.
Shape 2 series rows remain valid; shape 3 adds explicit press-kit fifth/quarter tokens.
If the press importer needs a different DA shape, change both contract representations
and bump `shape` in the same PR.
