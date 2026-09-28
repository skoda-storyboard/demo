# SKODA-402a, Listing layout QA fix: 1/3/4/4 grid + facets collapsed behind "Advanced filter (n)"
- **Epic:** E04, Listings & Search
- **Type:** block fix (follow-up to SKODA-402, not a reopen)
- **Phase:** A · **Milestone:** M1 (demo-visible on /en/images, /en/videos and every listing)
- **GitHub issue:** [#175](https://github.com/skoda-storyboard/demo/issues/175) (sub-issue of #117)
- **Estimate:** 1 SP · AI-assisted 0.5d / manual 1d *(planning estimate, not a quote)*
- **Status (2026-09-27):** 🔵 TODO

## Origin
SKODA-608 phase split (2026-09-27): 608 delivers the image/video rows and publishes the two media listings; the
listing layout itself is block work. Sweep finding V10 (`SKODA-DEMO-SWEEP-REPORT.md`), recorded as a sweep
correction in `docs/ui-specs/faceted-listing.md`.

## Problem (measured, source DevTools 2026-09-27)
- The source listing grid is flex: **1 column <576, 2 at 576–767, 3 at 768–991, 4 at ≥992** (1/3/4/4 at
  500/768/1024/1280). 12 per page, "Load more" appends 12.
- The 15 facets are **collapsed at every width** behind an "Advanced filter (n)" toggle (n = active filters).
- `blocks/listing` on main: 1 / 2 (≥768) / 3 (≥992) columns, 4 only with `columns-4` at ≥992
  (`listing.css:308-329`); the facet bar is hidden only below 768 and the toggle is `display:none` on desktop
  (`listing.css:204, 331-351`).

## Scope
- `blocks/listing`: the 1/3/4/4 column ladder (576/768/992) for `columns 4` listings; the facet panel collapsed
  by default at every width behind "Advanced filter (n)" (a button with `aria-expanded`), open state kept while
  filtering, n = active facet count.
- No change to the row/scope/facet logic (`listing-logic.mjs`).

## Acceptance Criteria
- [ ] /en/images and /en/videos at 1280/1024/768/500: 4/4/3/1 columns, card widths as the source ±2px.
- [ ] Facets hidden until "Advanced filter (0)" is opened; the count updates; deep links (`?filter[model][]=peaq`)
      open with the panel showing "(1)".
- [ ] News/search listings unchanged apart from the collapsed facets; lint + tests green.

## Dependencies
SKODA-402 (listing), SKODA-608 (rows + published listings). Related: SKODA-406 (media card).
