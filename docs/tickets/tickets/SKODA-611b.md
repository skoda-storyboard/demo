# SKODA-611b, Storyboard home: band spacing (Should slice of SKODA-611)
- **Epic:** E06, Import Pilot Content
- **Parent:** [SKODA-611](SKODA-611.md) (home composition)
- **Type:** section styling (CSS)
- **Phase:** A · **Milestone:** M1 · **Tier:** Should (§11.2 cut line; builds on 611a)
- **Estimate:** 1.5 SP · AI-assisted 0.5d / manual 1–1.5d *(planning estimate, not a quote)*
- **Status (2026-09-25):** 🔵 TODO

## Origin
Split from SKODA-611 (sweep-reconciliation decision D2, [`SKODA-M1-URL-BLOCK-SWEEP.md`](../../reviews/SKODA-M1-URL-BLOCK-SWEEP.md) §11).

## Problem (measured)
- The Lifestyle heading at y=3536 touches the eMobility track end at 3537 (0px gap; source 67px).
- Source cover-box pad is 12px 0, plus a search-results margin of 24px 0 16px, giving a 320px rail pitch at 1440.

## Scope
- Section spacing for `cover-box` / `cover-box dark` to the measured pitch, via tokens, following
  `docs/guardrails/css-guidelines.md` (fluid first; no new breakpoint without a layout reason).

## Acceptance Criteria
- [ ] 1440: 67px heading-to-previous-track gap as on the source; 320px rail pitch (±4px).
- [ ] 768 / 375: band spacing follows the source within the sweep thresholds (±2px or ±2%).
- [ ] `npm run lint:css` passes; story pages (which share the section styles) are unchanged.
- [ ] Preview link on the PR: `{branch}--demo--skoda-storyboard.aem.page/en`.

## Dependencies
SKODA-611a (section structure), SKODA-218 (dark sections).
