# SKODA-227, Related Stories heading-to-card spacing parity

- **Epic:** E02, Core Blocks
- **Type:** shared story-rail spacing follow-up
- **Milestone:** M2 (go-live, 2027-01-02)
- **Priority:** P2 (planning priority, not a severity rating)
- **Source:** supplemental user observation `WIRELESS-04`, measured 2026-10-07; not a #266 workbook record.
- **Implementation reference:** closed #123 / SKODA-820, reference only.
- **GitHub issue:** [#293](https://github.com/skoda-storyboard/demo/issues/293)
- **Status (2026-10-15, from GitHub):** 🔵 TODO (M2), no owner.

## Summary and M2 boundary

Restore the **20px heading-to-first-thumbnail gap** in the story's bottom Related Stories band.
The missing space is below the heading, not between the two green bands: the Media Box-to-Related Stories separator already matches at **36px**.
Content and navigation remain present; this is M2 spacing parity under the rough-M1 cut line.
Lost cards, unreadable overlap or an actual accessibility failure would promote its affected case to M1.

This is a **new standalone follow-up**. Do not reopen/extend completed #123 or broaden other in-progress/review/done tickets.
This observation is extracted from the unpublished `QA266-M2-03` draft; its 27 workbook records remain with that draft, not this issue.

## Environment and reproduction

- Origin: https://www.skoda-storyboard.com/en/lifestyle/skodas-smarter-wireless-charging-goes-beyond-phones/
- Demo: https://main--demo--skoda-storyboard.aem.live/en/lifestyle/skodas-smarter-wireless-charging-goes-beyond-phones
- Evidence: serial Chrome DevTools inspection on **2026-10-07**, 375/768/992/1080/1280 x 900, DPR 1; mobile/touch at 375. No screenshots.

1. Locate the full-width Related Stories band after Media Box.
2. Measure origin heading bottom to `.related-stories .article-teaser-media`, the visible thumbnail container, **not** the cover-scaled inner image.
3. Measure demo `#related-stories` heading bottom to the rail's `.card-teaser-image`.
4. Separately measure Media Box band bottom to Related Stories band top to confirm the already-correct separator.

| Measurement | Origin | Demo | Bands |
|---|---:|---:|---|
| Heading bottom to first visible thumbnail top | **20px** | **0px** | 375/768/992/1080/1280 |
| Media Box bottom to Related Stories band top | **36px** | **36px** | 375/768/992/1080/1280 |
| Related Stories band height at 1280 | 375.844px | 355.844px | 1280 |
| Related Stories band height at 375 | 347.594px | 327.594px | 375 |

Origin `.related-stories .search-results-header` has a 20px bottom margin.
The missing internal gap accounts for the band-height difference; preserve the existing bottom inset and band separator.

## Acceptance criteria

- [ ] Match the measured **20px** heading-to-visible-thumbnail-container gap at 375/768/992/1080/1280. Verify actual box geometry, not an oversized cover-scaled inner image.
- [ ] Preserve the **36px** Media Box-to-Related Stories separator, full-width green band and existing bottom inset; the internal gap explains the expected 20px band-height increase.
- [ ] Diagnose and use shared story-band/rail ownership; no replacement Related Stories block, spacer element, compensating global section margin or page-specific CSS.
- [ ] Preserve semantic headings, card content/order/destinations, rail navigation, keyboard/focus behavior and reduced-motion behavior.
- [ ] Regression-check other bottom story rails, sidebar related lists and Related Press Releases variants. Apply the spacing only where the measured shared layout requires it; do not change correctly spaced variants.
- [ ] Use existing semantic/component spacing tokens and fluid/intrinsic layout, with behavioral transitions only where justified.
- [ ] Run appropriate targeted repository checks, including CSS lint for CSS changes, and obtain independent numerical origin-versus-preview QA at all five bands and affected transition edges. No screenshots as review evidence.

## Dependencies, collisions and exclusions

No open prerequisite is inferred from closed #123.
Serialize edits affecting shared story-band headings, story-rail/card geometry and Related Press Releases variants.
Coordinate with the unpublished `QA266-M2-03` rail-polish group and any running shared-rail work, but do not duplicate this observation's ownership or amend active/completed issues.

This issue does not own arrow glyphs, hover/tag parity, date collisions, Models ordering, profile typography, Media Box masking or cart feedback.
The original workbook rows and their M1/M2 allocations remain unchanged.

## Supporting context

- [Story assembly](https://github.com/skoda-storyboard/demo/blob/main/docs/ui-specs/story-detail.md)
- [Rails spec](https://github.com/skoda-storyboard/demo/blob/main/docs/ui-specs/carousel-rails.md)
- [Card teaser geometry](https://github.com/skoda-storyboard/demo/blob/main/docs/ui-specs/card-teaser.md)
- [CSS guardrails](https://github.com/skoda-storyboard/demo/blob/main/docs/guardrails/css-guidelines.md)
- [Team operating model](https://github.com/skoda-storyboard/demo/blob/main/AGENTS-TEAM.md)
