# SKODA-611a, Storyboard home: section structure (Must slice of SKODA-611)
- **Epic:** E06, Import Pilot Content
- **Parent:** [SKODA-611](SKODA-611.md) (home composition)
- **Type:** import + section metadata
- **Phase:** A · **Milestone:** M1 (demo-visible: the first page shown) · **Tier:** Must (§11.2 cut line)
- **Estimate:** 1 SP · AI-assisted 0.5d / manual 1d *(planning estimate, not a quote)*
- **Status (2026-09-25):** 🔵 TODO

## Origin
Split from SKODA-611 (sweep-reconciliation decision D2, [`SKODA-M1-URL-BLOCK-SWEEP.md`](../../reviews/SKODA-M1-URL-BLOCK-SWEEP.md) §11).
Re-sized from 1.5 to 1 SP after the 2026-09-25 re-check on main: the promo exclusion shipped with #110.

## Problem (measured, main after #110, 1440)
- `/en` is **one section** holding all 13 blocks (`promo-box`, `stories`, then alternating `story-rail` /
  `carousel`). The source is a stack of 9 cover-box bands; Social media and Series sit in dark bands.
- The Social media strip (3 profile tiles 220×176 on `rgb(14,58,47)`) is dropped: `home-rail.js` unwraps
  `.socials-static`.
- ✅ Already fixed: Latest Stories starts at Epiq (15. 9. 2026), 0 overlap with the 3 promo posts (authored `offset`).

## Scope
- `import-home-sto.js`: one section per source cover-box, with Section Metadata Style (`cover-box` /
  `cover-box dark`).
- Emit the social strip as Cards (social) rows (SKODA-217). The dark Style hook beyond `body.story` is SKODA-218.
- Keep the authored `offset` on the stories feed in the re-import (regression guard).

## Acceptance Criteria
- [ ] `/en` renders the 9 sections in source order; Social + Series in dark bands (`.section.dark`).
- [ ] The social strip renders 3 profile tiles.
- [ ] Latest Stories' first card is still Epiq / the 4th newest story, 0 overlap with the promo box (regression).
- [ ] 0 block JS 404s and 0 console errors on `/en`.
- [ ] Preview link on the PR: `{branch}--demo--skoda-storyboard.aem.page/en`.

## Dependencies
SKODA-213 (promo-box, #110 ✅ merged), SKODA-214 (stories), SKODA-217 (social cards), SKODA-218 (dark sections),
SKODA-603 (re-import). Spacing is SKODA-611b.
