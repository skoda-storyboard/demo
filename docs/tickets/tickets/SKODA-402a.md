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

## Implementation notes (2026-09-29, branch `skoda-402a-listing-layout`, ready for QA)
- **Where:** `blocks/listing/listing.{js,css}`, `styles/brand.css` (`--facet-toggle-color`). `listing-logic.mjs` is
  unchanged.
- **Grid:** `columns 4` listings follow 1 / 2 (576) / 3 (768) / 4 (992); default listings keep 1 / 2 (768) / 3 (992).
  Every track is `minmax(0, 1fr)` and titles use `overflow-wrap: anywhere`, so a long unbroken title (the Images
  rows' file names) can't widen its column.
- **Measured against the source (live DevTools, /en/images + /en/videos):** first-card width and x match at
  500 / 576 / 767 / 768 / 991 / 992 / 1024 / 1280 (480 / 268 / 363.5 / 236 / 310.3 / 228 / 236 / 292; x 10, 26 at
  1280). There is no horizontal overflow.
- **Toggle:** it is always "Advanced filter (n)", with "(0)" included as on the source.
  - **From 768 (`.soa-desktop`):** it sits left of the sort options, 189.5×35 with 8px gaps and a 24px caret box.
  - **Below 768 (`.soa-mobile`):** it is a full-width centred row under the centred sort options, 29px tall with
    0.3em gaps and a 20.8px caret box.
  - Every box matches the source at 390 / 575 / 767 / 768 / 992 / 1280.
- **Behaviour:**
  - The facets are hidden until the toggle opens them, and they stay open while filtering.
  - Esc closes one layer at a time: an open option list first (focus returns to its pill), then the panel (focus
    returns to the toggle). Closing the panel also closes any open option list.
  - An Esc that an inner control has already handled (`defaultPrevented`) is left alone. For example, closing a
    media card's size menu (SKODA-406, PR #217) doesn't also close the filter panel.
  - The mobile focus trap is gone, because the panel is now an inline disclosure, not a drawer.
- **Focus order:** in the DOM the toggle comes after the sort options, and CSS `order` moves it left from 768. Tab
  therefore runs toggle → panel at every width.
- **Decision (2026-09-29):** a deep link that already filters (`?filter[model][]=peaq`) opens the panel showing
  "(1)", per this ticket's acceptance criteria. The source keeps the panel closed and only shows the count.
- **Out of scope (SKODA-402 styling), noted for follow-up:** the source sort links are 35px tall (14px/600, inactive
  #ccc), ours are 21px. As a result, our mobile toggle row sits 14px higher than the source.

## Dependencies
SKODA-402 (listing), SKODA-608 (rows + published listings). Related: SKODA-406 (media card).
