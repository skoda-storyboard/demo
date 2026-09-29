# SKODA-829, Story intro → body / aside vertical spacing parity
- **Epic:** E08, Editorial at Scale
- **Type:** styling
- **Phase:** A · **Milestone:** M1 (demo story fidelity)
- **GitHub issue:** *(draft on disk; issue to be opened with [PR #207](https://github.com/skoda-storyboard/demo/pull/207))*
- **Estimate:** 1 SP · AI-assisted 0.25d / manual 0.5d *(planning estimate, not a quote)*
- **Status (2026-09-29):** 🟡 In review in [PR #207](https://github.com/skoda-storyboard/demo/pull/207) (branch
  `SKODA-821-fix`), which was retitled from SKODA-821 after the review found the horizontal ACs already met on `main`.

## Origin
Review of PR #207 (larsauffarth). The PR's width rules were no-ops on `main`, and its vertical edits put the body
column 8px *above* the aside, where the source has it 32px *below*. `main` itself had the wrong gap: the rules keyed
on `.section.story-intro`, but none of the 59 published stories has that section. They all carry the intro (perex,
date, tag) in the Hero Image caption, so the global 40px section margins applied instead: 80px at ≥768, 40px below.

## Measured (live Epiq story, computed boxes, offsets from the bottom of the hero caption)

| Width | Source aside box | Source `.content` box | Source first `p` | `main` first `p` | Fix first `p` |
|---|---|---|---|---|---|
| 1440 / 1080 / 768 | +0 (padding-top 32) | +32 (margin-top 32) | +42 (cell padding 10) | +80 | +42 |
| 500 / 375 | below the body | +0 | +10 | +40 | +10 |

The source text is 10px inside the column (`.panel-grid-cell { padding: 10px }` inside `.panel-layout { margin: 0 -10px }`).

## Scope
`styles/styles.css`, story-scoped (`body.story`), keyed on the hero section (`main > .section:first-of-type`), so
both intro variants are covered (Hero Image caption or `.story-intro`):
- The hero section drops its bottom margin; the body column carries the gap (`--story-body-gap`: 0 / 32px ≥768)
  plus `padding-top: var(--story-inset)` (10px).
- At ≥768 the aside starts at the intro edge with `padding-top: var(--story-aside-inset-top)` (32px), the same line
  as the body column's box.
- No new breakpoint; the 32px override sits in the existing 768 grid block.

## Acceptance Criteria
- [x] Epiq, 1440/1080/768: aside box +0, body box +32, first paragraph +42; 500/375: body box +0, first paragraph +10
      (±1px, source vs local preview).
- [x] Horizontal geometry unchanged: text x/w 106/818.7, 10/706.7, 10/498.7, 10/480, 10/355; slider 96/839, 0/727,
      0/519, 0/500, 0/375.
- [x] All 59 published stories render the same box gaps (32 / 0 / aside 0 at 1440, body 0 at 375). Six stories were
      compared against their source pages at 1440 and 375; five match exactly.
- [x] `npm run lint:css` and `npm test` are clean.
- [ ] Branch preview check: `https://skoda-821-fix--demo--skoda-storyboard.aem.page/en/emobility/skoda-epiq-will-win-you-over-in-just-a-few-seconds`

## Known exceptions (not template spacing)
- `/en/simply-clever/park-your-skoda-using-your-mobile-phone-well-show-you-how-how`: the source's first widget has a
  per-page style (`panel-widget-style-for-406133-0-0-0`) with `margin-top: -40px`, so its text starts at +2 (≥768) /
  −30 (<768). EDS uses the template value (+42 / +10).
- The EDS hero caption ends 3px lower than the source (tag pill line box). That is hero parity, owned by
  [SKODA-828](SKODA-828.md).
- The source aside's first item is a newsletter sign-up; EDS has none yet ([SKODA-823](../OVERVIEW.md)).

## Dependencies
SKODA-801 layout (on `main`); SKODA-821 (horizontal, met on `main`); SKODA-828 (hero caption height, neighbour).
