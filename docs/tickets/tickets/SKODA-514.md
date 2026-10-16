# SKODA-514, Mask clipped Media Box thumbnails behind Show more

- **Epic:** E05, Media Pipeline
- **Type:** shared Downloads UI follow-up
- **Milestone:** M1 (demo, 2026-10-15)
- **Priority:** P1 (planning priority, not a failed-download claim)
- **Source:** supplemental user observation `WIRELESS-03`, measured 2026-10-07; not a #266 workbook record.
- **Implementation references:** closed #259 / SKODA-830 D2 and #173 / SKODA-510; coordinate shared-surface work with #127 / SKODA-801a without changing its importer scope.
- **GitHub issue:** [#295](https://github.com/skoda-storyboard/demo/issues/295)
- **Status (2026-10-15, from GitHub):** 🟡 M1, in QA: PR #335 merged 2026-10-15; QA (jkondalu) posted 6 new observations the same day (title crop at 768, h3 headings, Media Box dates).

## Summary and M1 boundary

Restore the opaque, full-width disclosure-control row in the collapsed Media Box so chopped thumbnail fragments do not paint above/beside the Show-more pill.
Seven assets are present and expansion works; this is a bounded visible layout defect, not a missing-image or failed-download diagnosis.
It materially breaks the image/control-row composition at 375/768 and belongs in the rough M1 demo.

This is a **new standalone follow-up**. Existing implementation issues are references only: do not reopen them, append acceptance criteria, or fold this case into their active/review/completed scope.

## Environment and reproduction

- Origin: https://www.skoda-storyboard.com/en/lifestyle/skodas-smarter-wireless-charging-goes-beyond-phones/
- Demo: https://main--demo--skoda-storyboard.aem.live/en/lifestyle/skodas-smarter-wireless-charging-goes-beyond-phones
- Evidence: serial Chrome DevTools DOM/computed-style/box inspection on **2026-10-07**, 375/768/992/1080/1280 x 900, DPR 1; mobile/touch at 375. No screenshots.

1. Freshly initialize each page at 375 or 768 and inspect the collapsed Media Box.
2. On origin, keep the clipped wrapper's `scrollTop=0`; scroll the document rather than programmatically scrolling the hidden-overflow wrapper. Dismiss only the reviewer's own source overlay if it obscures inspection.
3. Compare the third-row thumbnail and disclosure surface. Origin covers the fragment with `.search-results.media-box .togglebox-opener`; demo `.downloads.downloads-collapsed .downloads-more` overlays only a pill.
4. Expand the demo: all seven full thumbnails appear, clipped controls become interactive, `aria-expanded`/Show-less update and focus remains on the control.

| Measurement | Origin 375 | Demo 375 | Origin 768 | Demo 768 |
|---|---:|---:|---:|---:|
| Third-row thumbnail width x height | 355 x 200.563 | 355 x 200.563 | 236 x 133.625 | 236 x 133.625 |
| Thumbnail height inside geometric clip | 57.992 | 58 | 58 | 58 |
| Opaque control row width x height | **355 x 64** | **absent** | **748 x 64** | **absent** |
| Green pill width x height | 137.578 x 44 | 137.578 x 44 | 137.578 x 44 | 137.578 x 44 |
| Control row/pill top minus third-thumbnail top | -6.008 (row) | +14 (pill) | -6 (row) | +14 (pill) |

The origin row is opaque `rgb(14,58,47)`, opacity 1, and masks the entire approximately 58px fragment.
Demo's fragment remains visible even though its tile is inert and has `pointer-events: none`: inertness does not prevent painting.
At 375 a 14px image strip remains above the pill; at 768 the final tile lies entirely to the left of it.

The origin/demo band heights already match: **1016.117/1016.125px at 375** and **882.25/882.25px at 768**.
Demo's raw list box includes 4px focus-ring room cancelled by negative outer margins. Do not remove that protection or force raw list-height equality.
At 992/1080/1280 all seven thumbnails are fully visible without a toggle.

#259 D2's historical "row-3 peek" description must be reconciled with the source's opaque-row occlusion; geometric clipping alone is not evidence that painted chopped thumbnails are intended.

## Acceptance criteria

- [ ] Fresh origin-versus-preview inspection at 375/768 shows no clipped thumbnail pixels exposed in the disclosure-control row. Match the full-width opaque surface and measured 64px row behavior, not only the pill.
- [ ] Preserve the 137.578 x 44px green pill, Show-more/Show-less labels/state and all seven assets in source order. Expanded state reveals complete thumbnails and restores clipped controls to interaction/accessibility.
- [ ] Preserve native button semantics, `aria-controls`, `aria-expanded`, inert/fallback handling, keyboard activation and focus on expand/collapse.
- [ ] Preserve the 4px focus-ring room, matching band geometry and already-correct **36px** Media Box-to-Related Stories separator.
- [ ] At 992/1080/1280 retain complete thumbnails without an unnecessary toggle for the seven-asset case; cover transition edges and an asset set above eight.
- [ ] Regression-check other story/release/press-kit Media Boxes sharing Downloads, including file tiles, rendition menus, lightbox links and cart overlays. Do not distort subjects or permanently hide assets.
- [ ] Use component-owned tokens/fluid/intrinsic layout; no page-specific spacer, global override or overflow workaround that hides controls/focus.
- [ ] Run appropriate targeted repository checks, including CSS lint for CSS changes, and obtain independent numerical origin-versus-preview QA at 375/768/992/1080/1280 and affected transition edges. No screenshots as review evidence.

## Dependencies, collisions and exclusions

No new block or re-import is needed for the observed seven-asset case.
Coordinate with #127's remaining story integration/disclosure work, but leave its scope and status unchanged.
Serialize edits to Downloads CSS/JS, disclosure layout, focus clipping and cart scrims.
The new M2 bulk-add motion follow-up [#294 / SKODA-515](https://github.com/skoda-storyboard/demo/issues/294) is blocked by this M1 layout correction; different milestones do not make shared-surface work independent.

This issue does not own typography, Related Stories spacing, missing downloads, importer-validity work or production cart services.
Any separately reproduced broken existing download/add flow remains M1 under its own owner.

## Supporting context

- [Downloads spec](https://github.com/skoda-storyboard/demo/blob/main/docs/ui-specs/downloads.md)
- [Story assembly](https://github.com/skoda-storyboard/demo/blob/main/docs/ui-specs/story-detail.md)
- [CSS guardrails](https://github.com/skoda-storyboard/demo/blob/main/docs/guardrails/css-guidelines.md)
- [Team operating model](https://github.com/skoda-storyboard/demo/blob/main/AGENTS-TEAM.md)

Only `WIRELESS-03` is published here; the original 129 workbook records and other unpublished #266 drafts remain unchanged.
