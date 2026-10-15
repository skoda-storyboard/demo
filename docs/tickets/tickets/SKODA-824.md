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

## Panel inset as the source (PO, 2026-10-13; branch `bug-highlight-panel-inset`, stacked on #345)
PO: "fix the highlight panel inset too, same as live" (found on the cruise-control story in the YouTube parity round).
- **Source model:** a panel's content sits row padding + the 10px cell padding + each widget's margin in.
  - Theme defaults: no row padding, the widget margin `0 15px` from 781px and `15px` all round up to 780px (25px in), and a carousel with no margin (10px in).
  - Of 49 panels on 34 stories, 10 on 8 stories set their own in the layout CSS:

| Story | Source | Content inset (left / right) |
|---|---|---|
| Camouflage ×2, Sportline | text widget margin: none | 10 / 10 |
| What you learn on the circuit ×2 | `0 10px` (mobile: none / `0`) | 20 / 20 |
| Cruise control | `0 0 0 20px` | 30 / 10 |
| Park your Škoda | default, but no mobile rule | 25 / 25, top 9 on mobile |
| Licence plates | row `0 15px` / `15px`, widget `15px 0` | 25 / 25, top 24; mobile 40 / 40 |
| Designers on the Peaq | row `15px` | gallery 40 / 40 |
| An epic start | carousel `0 15px` | gallery 25 / 25 |

  - Every gallery inside a panel was 15px in on `main`; the source's is 10 (no margin), or its own margin.
- **How:**
  - `parsers/story-flatten.js` `markHighlights()` reads each panel's row padding, text-widget margin and gallery margin, desktop and `@media (max-width:780px)`. Non-default values go out as Section Metadata rows `highlight-padding|margin|gallery-margin[-mobile]`.
  - The pipeline delivers them as the section's `data-highlight-*` attributes. `scripts/highlight-geometry.js` sets the `--hl-*` boxes, and `styles.css` composes the panel padding from them, with the theme defaults otherwise.
  - Multi-column rows (Wireless charging) carry none: a margin per cell.
  - Contract: `SKODA-PENDING-BLOCK-CONTRACTS.md` → highlight.
- **Measured** against the source with each panel's content inset, every story at 1440 / 390 and the 8 changed ones at 1080 / 768:
  - text insets equal on every single-cell panel, all 4 sides where the content is the same;
  - gallery box insets equal on all 9 gallery panels (10 / 25 / 40);
  - by the panel-wide text measure, 52 → 63 of 98 panel widths equal at 1440 / 390. The rest are galleries (the measure counts our slide images but not the source carousel's; the gallery boxes are equal) and the content notes below.
- **Content:** the 8 stories re-imported; only the geometry rows change. The plates story also picks up a related-article teaser the source has since changed. The cruise-control import includes #345's player URL (this branch is stacked on it).
- **Notes (not changed here):**
  - Wireless charging's 2-cell panel lays out differently from the source (heading 80 vs 41 from the top at 1440).
  - Inside a panel the slider sits about 24px higher and is about 36px taller than the source's (slide sizes, SKODA-819).
  - Even-opening's first panel paragraph is styled larger on the source (36px line vs 24).
  - A one-line difference in height on 5 panels at 390 (text wrap).
  - Cruise control: the source shows the cart toolbar (+, download MP4, link) under the YouTube clip; the story import drops it.
