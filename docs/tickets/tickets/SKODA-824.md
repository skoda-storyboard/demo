# SKODA-824, In-column highlight panel (story dark box + press-release grey callout)
- **Epic:** E08, Editorial at Scale
- **Type:** import + block variant
- **Phase:** A/B · **Milestone:** M1 (demo-visible)
- **Estimate:** 3 SP · AI-assisted 1d / manual 2–3d *(planning estimate, not a quote)*
- **Status (2026-09-25):** 🔵 TODO

## Origin
Demo URL/block sweep, 2026-09-25 ([`SKODA-DEMO-SWEEP-REPORT.md`](../../reviews/SKODA-DEMO-SWEEP-REPORT.md) §5). The same root cause was raised
independently by 4 story groups and the press-release group; it was consolidated into this one ticket after the gap check.

## Problem (measured, rendered CSS)
- **Stories, dark box:** a SiteOrigin row with a background (`.panel-row-style`, bg `rgb(14,58,47)`) holds
  h3 + text + optional image, sometimes a nested slider or a 2-cell row. At 1440 it's **839px wide inside the
  content column** (x=96), `padding-top 32px`, 15px inner inset, white text 16/24, h3 24px/300/27.6
  (strong 600), images at the 789 inner width. At 390 the box goes full-bleed with a 15px inner margin. Consecutive rows
  join (row 2 `margin-top -40px`). Measured on 12 of 21 story URLs, for example Epiq 839×771, plates 839×258, Octavia 839×688,
  graffiti 839×675, Kylaq 839×212/308/747, charging 839×397 + 839×1004.
- **EDS today:** `story-flatten.js cellsOf()` unwraps the row. The content renders as plain ink paragraphs
  (`rgb(22,23,24)`, h3 26px/300/29.9) with no background.
- **Press release, grey callout:** Klaus Zellmer PR FAQ panel, `div[style]` bg `rgb(243,243,243)`, padding 25px, 812×302
  (390: 370×374), a direct child of `.entry-content`, static (no toggle). EDS flattens it.

## Scope
- Importer: detect a background-styled SiteOrigin row (stories) or a `div[style*=background]` panel (PR) and emit
  it as a highlight region instead of unwrapping it. Keep nested Gallery (slider) and Columns inside.
- Runtime: a body-column-scoped highlight treatment with `dark` (story) and `grey` (callout) variants. It must **not**
  use the full-bleed `body.story .section.dark` rule. Note: the vendored `decorateSections` doesn't apply Section
  Metadata `Style` (see `decorateStorySections`), so use a block variant or extend that hook.

## Acceptance Criteria
- [ ] 1440: dark box 839 wide at the column edge, bg `rgb(14,58,47)`, pad-top 32, text white 16/24, h3 24/300/27.6 (±2px).
- [ ] 390: full-bleed box, 15px inner margin, h3 20/23.
- [ ] Grey callout: bg `rgb(243,243,243)`, padding 25px, 812 wide at 1440 on the Zellmer PR.
- [ ] Nested slider/columns render inside the box; consecutive rows join as on the source.
- [ ] Verified on Epiq, Octavia, charging and the Zellmer PR; lint + tests green.

## Dependencies
SKODA-801 (flatten), SKODA-814 (M2 generic SiteOrigin rule, related), SKODA-218 (dark styling), SKODA-819 (nested slider), SKODA-225 (columns split).
