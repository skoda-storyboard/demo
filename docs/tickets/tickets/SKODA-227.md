# SKODA-227, Related Stories heading-to-card spacing parity

- **Epic:** E02, Core Blocks
- **Type:** shared story-rail spacing follow-up
- **Milestone:** M2 (go-live, 2027-01-02)
- **Priority:** P2 (planning priority, not a severity rating)
- **Source:** supplemental user observation `WIRELESS-04`, measured 2026-10-07; not a #266 workbook record.
- **Implementation reference:** closed #123 / SKODA-820, reference only.
- **GitHub issue:** [#293](https://github.com/skoda-storyboard/demo/issues/293)
- **Status (2026-10-21):** 🟡 Related gap verified fixed on `main` (#388, #296). Page-wide charging-story parity built on branch `skoda-227-charging-parity`; see the last section. Earlier: no code change for the gap: #296 (`c770d4d`, merged
  2026-10-13) gave the related band's heading block the 20px bottom margin. See "Verification (2026-10-19)".

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

## Verification (2026-10-19, `main` preview vs origin, live DOM geometry, no screenshots)
**Fixed by #296** (`c770d4d`, `styles/styles.css`): the shared story related band's
`.default-content-wrapper` (title, plus "Based on tags: …" when there is one) carries the
`--paragraph-gap` bottom margin, as origin's `.search-results-header` 20px margin. Shared story-band ownership,
no spacer, no page-specific CSS. Nothing in this ticket needed a further change.

| Measurement | Origin | `main` | Bands |
|---|---:|---:|---|
| Heading block bottom → first visible thumbnail (`.article-teaser-media` / `.card-teaser-image`) | 20px | 20px | 375 / 768 / 992 / 1080 / 1280 |
| Media Box bottom → Related Stories band top | 36px | 36px | all five |
| Related Stories band height (charging story) | 347.6 / 352.1 / 332.6 / 347.5 / 375.8 | the same | 375 → 1280 |
| Drawn green band (pixels) | full width ≤ 1440, 1440 centred above | the same (`::before`, 100vw capped 1440) | 1280 / 1440 / 1920 |
| Title type | 20/25 600 white ≤ 768, 26/32.5 above | the same | all five |
| "Based on tags" line | 16/32 600 `rgb(196,198,199)`, 25 / 33px under the title top | the same | 375 / 1280 |
| First card | 318×179 … 354×199, same x | the same | all five |

Pages: the charging story (no tags line), the Peaq "win you over" story and Epiq Sportline (tags line), and the
Related Press Releases band of two releases (20px gap, 16px separator, equal band heights at all five bands).
The aside's "Explore more" cards keep their size, position and 32px pitch (no change in this ticket).

**Found, not in this ticket's scope (heading outline):** the band title is `h3` on origin. New imports write `h3`;
older ones still have `h2`: **46 stories and 23 press releases** on preview (e.g. the charging story, the 936 km
release). Same look (both levels are styled), so only the heading outline differs. The fix is a re-import of
those pages, best after #380 merges (the 46 stories would also take its importer changes).

## Charging story, page-wide parity (2026-10-21, after #380 merged)
The PO asked for the whole charging story to match origin, not only the related band. Measured at 375 / 768 /
992 / 1080 / 1280 against origin, on the new `main` code:

| Area | Before | After |
|---|---|---|
| "Five questions for Michal Zajíc" dark panel | outer section padding only; h2 had a top margin; portrait column too wide | origin's per-cell padding / margin as Section Metadata (`highlight-cell-*`); a cell's first heading has no top margin. Panel box, padding, h2 type and place, column widths, portrait size, bottom inset: equal at 375 / 768 / 1280 |
| Panel after it | 40px lower than origin | pulled up 40px (`--highlight-pull-up`), as origin's next row: equal |
| Gaps above / below headings, 16 paired body blocks | 8 to 27px extra over a cell's first heading | equal |
| Media Box | no dates | the date above each title (11/11 wt600 rgb 196,198,199; 17px under the image, 14px over the title), 7 of 7 cards, as origin |
| Body images | some imported as thumbnails (e.g. 768px) | the largest source file (≥ 1600px kept; slider slides always upgraded) |
| Horizontal scroll | page scrolled sideways | none (#380's `overflow-x: clip`) |

The hero is equal too: origin shows a 3:2 picture centred in a 16:9 frame (970 × 546 at 1280, clipped), ours
the same 16:9 centred crop at the same 1.02 scale.

**Re-import (131 stories, `main`'s importer vs this one):** 4 identical; 127 differ only by the intended changes
(127 Media Box dates, 65 of them also full-size images, 1 the panel's cell rows). Media manifest unchanged.
Pushed to preview (not published): 125. Left: `rs-four-ways-which-one-will-you-choose` (edited in DA since the
last push, not overwritten) and `enyaq-and-elroq-…-gaming-consoles…` (its video isn't on AEM Assets yet).

**Band titles h2 → h3 (as origin):** the re-import also writes origin's h3 for the Related band (and the Media Box
heading) on the older pages: stories 44 → 2 with h2, press releases 23 → 1 (22 re-imported and pushed with the
unchanged press-release importer; text, images and blocks otherwise as before, the related releases as origin
lists them today). The 3 left are the DA-edited and held pages above, and
`30-years-since-the-foundation-stone-was-laid-…` (edited in DA).

**Pre-existing, not fixed here:** slider caption line height 24 vs origin 20 (museum, King of space, Clever
luggage); the 40px intro line of "King of space" renders at 16px.
