# SKODA-225, Columns: unequal split + intrinsic portrait (story 2-cell rows)
- **Epic:** E02, Core Blocks
- **Type:** block variant + import
- **Phase:** A/B · **Milestone:** M1 (cosmetic) / M2
- **GitHub issue:** [#142](https://github.com/skoda-storyboard/demo/issues/142)
- **Estimate:** 1 SP · AI-assisted 0.5d / manual 1d *(planning estimate, not a quote)*
- **Status (2026-09-25):** 🔵 TODO

## Origin
Demo URL/block sweep, 2026-09-25 (report §5; eMobility-B + Lifestyle groups).

## Problem (measured)
- 2-cell SiteOrigin rows (text | portrait card): the source cells are **518 | 320** on an 839 row (charging 629 | 210), top-aligned.
  The portrait shows at its **intrinsic size** (235×235; 150×224 in charging) centred, with the name 13px/600/19.5 and role
  13.33px/20 centred beneath. At 390 the cells stack and the portrait stays 235 wide, centred.
- EDS `columns`: 356 | 356 (flex:1), `align-items: center`, and the portrait is stretched to 356 wide (`.columns img { width:100% }`). At 390 it's
  342 wide at x=24.
- Measured on graffiti, Kylaq, charging (Lifestyle) and Peaq comfort (eMobility).

## Scope
- The importer (`story-flatten.js`) carries the source cell-width ratio into the Columns block (e.g. `Columns (split-62)` or a
  width hint).
- A Columns variant (scoped, so other templates keep the boilerplate): unequal widths, top alignment, portrait at its
  intrinsic size, centred caption.

## Acceptance Criteria
- [ ] 1440: cells 518/320 (±4px), top-aligned; portrait 235×235 centred in its cell.
- [ ] 390: stacked, portrait 235 centred.
- [ ] Default Columns rendering elsewhere unchanged.

## Dependencies
SKODA-801 (flatten), SKODA-824 (rows inside the highlight panel).
