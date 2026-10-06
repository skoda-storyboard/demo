# SKODA-824, In-column highlight panel (story dark box + press-release grey callout)
- **Epic:** E08, Editorial at Scale
- **Type:** import + block variant
- **Phase:** A/B · **Milestone:** M1 (demo-visible)
- **GitHub issue:** [#148](https://github.com/skoda-storyboard/demo/issues/148)
- **Estimate:** 3 SP · AI-assisted 1d / manual 2–3d *(planning estimate, not a quote)*
- **Status (2026-10-05):** 🟡 IN REVIEW: runtime done on branch `skoda-824-highlight-panel` (importer: PR #209, merged). The contract fallback is back to `readable`, so pages with highlight sections publish again. Measured spec: [`highlight.md`](../../ui-specs/highlight.md). Draft QA pages: `/drafts/skoda-824-highlight` and `/drafts/skoda-824-highlight-press-release`.

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
- [x] 1440: dark box 839 wide at the column edge, bg `rgb(14,58,47)`, pad-top 32, text white 16/24, h3 24/300/27.6 (±2px). *(EDS 96/839, content 121/789, top inset 42 as on the source; 1080 / 992 / 781 / 780 / 768 identical too.)*
- [x] 390: full-bleed box, 15px inner margin, h3 20/23. *(EDS 0/390, content 25/340, h3 20/23.)*
- [x] Grey callout: bg `rgb(243,243,243)`, padding 25px, 812 wide at 1440 on the Zellmer PR. *(EDS 106/812 @1440, 10/492 @768, 10/370 @390; one line shorter, an importer `<br>` fold, see spec §5.)*
- [x] Nested slider/columns render inside the box; consecutive rows join as on the source. *(Charging: the two panels read as one band, text 30px apart against 32. The Columns cell h2 and the inner image width are the Columns block's own CSS, see `columns-split.md` §5. No M1 panel holds a slider.)*
- [ ] Verified on Epiq, Octavia, charging and the Zellmer PR; lint + tests green. *(Drafts carry the charging, Epiq and Zellmer panels; the 11 re-imported stories + Zellmer still need `import:push`. Lint green; tests: see the PR.)* *(Importer: local import emits 16 dark sections on 11 of the 19 M1 stories + the Zellmer grey section; unit tests in `story-flatten.test.mjs` / `press-release.test.mjs`. Not pushed to DA.)*

## Build notes (runtime, 2026-10-05)
- **Colours:** global, `styles/styles.css`; tokens in `brand.css`: `--skoda-grey-75` `#f3f3f3`, `--highlight-grey-color`
  black, and `--highlight-dark-link-color` `#55ad80`. That link colour is the source green lightened in hue for
  WCAG AA (4.6:1 on the panel green, against 3.4:1).
- **Story panel** (`styles/styles.css`, story section):
  - the padding comes from the source row: 32px top from 768, the 10px cell, and the widget's 15px (top/bottom
    up to 780, then inline only);
  - from 768 the panel runs `-10px` past the body track to the aside edge, and below 768 it bleeds full width;
  - body neighbours drop their section margin on the panel side;
  - joined panels drop the gap between them.
- **Press-release callout:** `templates/press-release/press-release.css`, the 10px gutter plus 25px padding.
- **Sidebar span:**
  - `scripts/split-body.js` `spanSidebar()`, called from `decorateStorySections` / `decorateTemplateSections`,
    counts the body-column run;
  - both grids span the aside over it, and the last part takes the slack (`repeat(n, auto) 1fr`);
  - pages without a split are untouched: section boxes and page height are identical to `main` on 7 pages at
    1440 / 768 / 390.
- **Contract:** `highlight` fallback is `readable` again. The broken-fallback hold for section styles stays covered
  in `block-check.test.mjs`. The push hold test now uses `story-rail-subheading`.
- **Tests:** `scripts/split-body.test.mjs` covers the counts (single, joined, leading, press release, no split)
  and adds CSS guards.
- **No block code changed** (Columns, Gallery untouched).

## Dependencies
SKODA-801 (flatten), SKODA-814 (M2 generic SiteOrigin rule, related), SKODA-218 (dark styling), SKODA-819 (nested slider), SKODA-225 (columns split).

## Import contract (SKODA-603)
Contract(s) `highlight` (**pinned 2026-09-25: section style; shape 2 on 2026-09-28: `Style` = `body-column, highlight-dark` / `body-column, highlight-grey`**) in [`SKODA-PENDING-BLOCK-CONTRACTS.md`](../../planning/SKODA-PENDING-BLOCK-CONTRACTS.md). Form (v1, superseded): a **section** with Section Metadata `Style` = `highlight, dark` / `highlight, grey` (it can contain nested sliders/columns, which a block can't), plus the `scripts.js` section hook. Until the importer emits it, pages keep the default-content fallback and are flagged `re-import on SKODA-824`. If this ticket needs a different DA shape, change the contract (and bump `shape`) in the same PR.
