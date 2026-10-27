# SKODA-226, Charging profile heading and portrait sizing parity

- **Epic:** E02, Core Blocks
- **Type:** shared profile/Columns typography and sizing follow-up
- **Milestone:** M2 (go-live, 2027-01-02)
- **Priority:** P2 (planning priority, not a severity rating)
- **Source:** supplemental user observations `WIRELESS-01` and `WIRELESS-02`, measured 2026-10-07; not #266 workbook records.
- **Implementation references:** closed #148 / SKODA-824 and #142 / SKODA-225, references only.
- **GitHub issue:** [#292](https://github.com/skoda-storyboard/demo/issues/292)
- **Status (2026-10-27):** 🟡 verified fixed on `main`, no code change in this ticket. The h2, portrait and panel now match origin at all five bands and at the transition edges: #414 / SKODA-227 (`23efa5c`) fixed it as part of its page-wide charging-story parity. See "Verification" below. Earlier (2026-10-15): 🔵 TODO (M2), no owner.

## Summary and M2 boundary

Align the charging story's "Five questions for Michal Zajíc" **h2 and portrait together**, using the shared story/highlight/unequal-Columns ownership.
The text remains readable and the composition works; the confirmed type/inset/photo-size differences are M2 under the rough-M1 cut line.
A lost-content, unreadable-overlap or actual accessibility failure would promote its affected case to M1.

This is a **new standalone follow-up**, not an extension/reopening of the completed highlight or Columns tickets.
Keep their accepted scope and the already-correct ordinary intro/strong typography intact.

## Environment and measured evidence

- Origin: https://www.skoda-storyboard.com/en/lifestyle/skodas-smarter-wireless-charging-goes-beyond-phones/
- Demo: https://main--demo--skoda-storyboard.aem.live/en/lifestyle/skodas-smarter-wireless-charging-goes-beyond-phones
- Evidence: serial Chrome DevTools inspection on **2026-10-07**, 375/768/992/1080/1280 x 900, DPR 1; mobile/touch at 375. No screenshots.
- Origin selectors: `.panel-row-style-for-447920-1 h2` and `.panel-row-style-for-447920-1 img.so-widget-image`.
- Demo selectors: `.highlight-dark .columns.split-75 h2` and `.highlight-dark .columns.split-75 img`.

The published content contains an **h2** and `Columns (split-75)`, not the h3 covered by #148's earlier figure.
Heading tuples are **font size / line-height / weight**; dimensions are CSS pixels.

| Width | Origin h2 | Demo h2 | Origin portrait width x height | Demo portrait width x height |
|---|---|---|---|---|
| 375 | 24 / 27 / 300 | 34 / 42.5 / 600 | 315 x 472.5 | 325 x 487.1 |
| 768 | 24 / 27 / 300 | 34 / 42.5 / 600 | 458.7 x 688.0 | 468.7 x 702.6 |
| 992 | 40 / 45 / 300 | 34 / 42.5 / 600 | 107.0 x 160.4 | 139.5 x 209.1 |
| 1080 | 40 / 45 / 300 | 34 / 42.5 / 600 | 121.7 x 182.4 | 154.2 x 231.1 |
| 1280 | 40 / 45 / 300 | 34 / 42.5 / 600 | 149.7 x 224.3 | 182.2 x 273.1 |

At 375/768 the origin h2 is one 27px line; demo uses two 42.5px lines, 85px total.
At 1280 source h2 margin is `0 0 16px`, demo `27.2px 0 8.5px`.
The first panel is **397px versus 424.195px** at 1280 and **1067.5px versus 1172.758px** at 375.
The portrait is about 32.5px wider in the desktop split, 10px wider when stacked.
The precise 1280 source portrait reference is **149.664 x 224.320px**.

Ordinary intro text already matches **16px / 24px / 400**, and strong weight is **600** on both.
Both load Next faces; differing family spelling or a declared fallback is not evidence that a fallback is painted.

## Acceptance criteria

- [ ] Determine the shared story-prose/highlight/Columns styling owner before editing. Reuse the existing `Columns (split-75)` contract; no duplicate profile block, global h2 reset or page-specific override.
- [ ] Match this h2's measured font size/line-height/weight, margins and wrapping at 375/768/992/1080/1280; preserve the semantic h2 level and all five questions.
- [ ] Match the report's per-band portrait dimensions, intrinsic aspect, column insets and alignment. Preserve responsive stacking and image content without distortion.
- [ ] Compare panel insets/height as well as heading/image boxes; fix the underlying type/column sizing rather than inserting a compensating spacer.
- [ ] Preserve the matching intro/strong typography, dark surface, heading readability and existing h3 behavior.
- [ ] Regression-check other unequal-split stories, dark highlights, the grey release callout, default Columns and band headings; confirm text expansion/font scaling and relevant transition edges remain usable.
- [ ] Follow the token/fluid/intrinsic CSS architecture; do not add arbitrary viewport/page exceptions.
- [ ] Run appropriate targeted repository checks, including CSS lint for CSS changes, and obtain independent numerical origin-versus-preview QA at all five bands and changed transition edges. No screenshots as review evidence.

## Dependencies and collision scope

No open prerequisite is inferred from the closed implementation references.
Serialize edits affecting story-prose h2 styles, highlight sections, unequal Columns, image insets and typography tokens.
Reassess collisions with story assembly and other profile variants before implementation.

Media Box masking, Related Stories spacing and cart feedback are separate follow-ups.
This issue does not alter completed #148/#142 or expand #127's importer scope.

## Supporting context

- [Story h2 typography and assembly](https://github.com/skoda-storyboard/demo/blob/main/docs/ui-specs/story-detail.md)
- [Existing Columns scope](https://github.com/skoda-storyboard/demo/issues/142)
- [Existing highlight scope](https://github.com/skoda-storyboard/demo/issues/148)
- [CSS guardrails](https://github.com/skoda-storyboard/demo/blob/main/docs/guardrails/css-guidelines.md)
- [Team operating model](https://github.com/skoda-storyboard/demo/blob/main/AGENTS-TEAM.md)

This grouped ticket preserves `WIRELESS-01` and `WIRELESS-02` as two observations, not two new workbook records.

## Verification (2026-10-27, `main` preview vs origin, live DOM geometry, no screenshots)

**Fixed by #414 / SKODA-227** (`23efa5c`, the charging story's page-wide parity). It uses the shared owners this ticket asked for:
- the story body-column h2 rule in `styles/styles.css` (24/27 300 at ≤ 768, 40/45 300 above, `margin: 0 0 16px`);
- the `split-NN` Columns widths in `blocks/columns/columns.css`;
- the highlight geometry from Section Metadata `highlight-cell-*`.

Nothing in this ticket needed a further change. No profile block, global h2 reset or page-specific override was added.

Playwright, viewport height 900, DPR 1, fonts loaded. Origin `.panel-row-style-for-447920-1` in its `.panel-grid`; demo `.highlight-dark .columns.split-75` in its `.section`. Offsets are from the panel's top-left.

| Width | h2 (size / line / weight, lines, margin) | Portrait w × h, origin / demo | Portrait offset | h2 offset | Panel height, origin / demo |
|---|---|---|---|---|---|
| 375 | 24 / 27 / 300, 1 line, `0 0 16px` | 315 × 472.5 / 315 × 472.3 | 25, 570 | 25, 25 | 1067.5 / 1067.3 |
| 768 | 24 / 27 / 300, 1 line | 458.7 × 688.0 / 458.7 × 687.6 | 25, 506 | 25, 57 | 1219 / 1218.6 |
| 769 | 40 / 45 / 300, 2 lines | 459.3 × 689.0 / 459.3 × 688.6 | 25, 569 | 25, 57 | 1283 / 1282.6 |
| 780 | 40 / 45 / 300, 2 lines | 466.7 × 700.0 / 466.7 × 699.6 | 25, 569 | 25, 57 | 1294 / 1293.6 |
| 781 | 40 / 45 / 300, 2 lines (split starts) | 71.8 × 107.7 / equal | 420.5, 57 | 25, 42 | 610 / 610 |
| 992 | 40 / 45 / 300, 2 lines | 107.0 × 160.3 / 107.0 × 160.4 | 526, 57 | 25, 42 | 514 / 514 |
| 1080 | 40 / 45 / 300, 1 line | 121.7 × 182.3 / 121.7 × 182.4 | 570, 57 | 25, 42 | 469 / 469 |
| 1280 | 40 / 45 / 300, 1 line | 149.7 × 224.3 / 149.7 × 224.4 | 654, 57 | 25, 42 | 397 / 397 |

Every h2 tuple, margin, line count and offset is equal on both. Portrait and panel differ by ≤ 0.4px (the image's intrinsic-ratio rounding).

**Also checked:**
- Intro and strong text are unchanged: `p` 16 / 24 / 400 white on `rgb(14, 58, 47)`, `strong` 600, on both.
- **Heading outline:** the panel's "Five questions for Michal Zajíc" is an h2 on both, after the same h1. Media Box and Related Stories are h3 on both.
- **Reflow:** at 320 and 640 (1280 at 400% / 200%), the page width equals the viewport on both. The h2 doesn't clip (`scrollWidth` = `clientWidth`), and the portrait is 260 × 390 / 580 × 870 on both.
- **Lighthouse accessibility:** 100, no failing audit.

**Found, not in this ticket's scope:** at 375 the panel *after* this one is 24px shorter on the demo (1794 vs 1818). One bold question wraps onto 3 lines instead of 4, because the source ends it with `&nbsp;</strong><br>` and the story importer drops a trailing nbsp. Filed as #509.

The 1080 page offset (the source's Storyboard header is 64px taller) is #410.
