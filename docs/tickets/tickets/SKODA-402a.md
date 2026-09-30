# SKODA-402a, Listing layout QA fix: 1/3/4/4 grid + facets collapsed behind "Advanced filter (n)"
- **Epic:** E04, Listings & Search
- **Type:** block fix (follow-up to SKODA-402, not a reopen)
- **Phase:** A · **Milestone:** M1 (demo-visible on /en/images, /en/videos and every listing)
- **GitHub issue:** [#175](https://github.com/skoda-storyboard/demo/issues/175) (sub-issue of #117)
- **Estimate:** 1 SP · AI-assisted 0.5d / manual 1d *(planning estimate, not a quote)*
- **Status (2026-09-30):** 🟡 In review (branch `skoda-402a-listing-layout`; review fixes of 2026-09-30 are local and
  uncommitted, awaiting approval)

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
- **Decision (2026-09-29):** a deep link that already filters (`?filter[model][]=peaq`) opens the panel showing
  "(1)", per this ticket's acceptance criteria. The source keeps the panel closed and only shows the count.

## Review fixes (2026-09-30, measured against live /en/news and /en/images at 1280 and 390)
- **Panel above the sort row, as on live.** Live opens `form.search-filter` above `.sort-options`, 16px below where
  the sort row sits when closed and 24px above it. The branch had put the panel under the sort row. The DOM order is
  now facets → chips → sort row, so the visual order and the focus order match. The toggle stays last in the sort
  row: below 768 it is its own row under the sort options; from 768 CSS `order` moves it left.
- **Count under the grid.** Live puts `.search-results-pagination` after the grid (16px below it) and 32px above Load
  more. It had been above the grid, pushing the results 53px down. It now follows the grid, Load more gets the
  source's 16px padding, and the grid sits 24px under the sort row.
- **Sort links:**
  - The 35px-tall, 14px-padded boxes with no gap now match live exactly: Newest 77×35 at x1107, Oldest 71×35 at x1183
    at 1280.
  - This also fixes the mobile toggle, which sat 10px high. Its row is now 35px below the sort row, like live.
  - **The inactive colour stays `--skoda-grey-500`, on purpose.** Live's `#ccc` is 1.6:1 on white.
- **Esc scope.** Esc acts only when focus is on the toggle or in the panel. Before, Esc on a result card or Load more
  closed the panel and moved focus up to the toggle.
- **Tokens:** `--listing-sort-height: 35px` replaces the literal on the toggle.
- **Tests:** 6 new jsdom tests in `blocks/listing/listing.test.mjs`:
  - source order;
  - collapsed default and "(0)";
  - filtering updates the count, and the panel stays open;
  - a deep link opens the panel with "(1)";
  - Esc layers, and Esc on a card is ignored;
  - an Esc already handled by an inner control is left alone.

  Each of the 6 behaviours was removed in turn, and every removal fails a test.
- **Verified (local build of this branch + main):**
  - The grid still matches live exactly at 1280 / 1024 / 992 / 991 / 768 / 767 / 576 / 575 / 500 / 390.
  - The closed sort row, toggle and grid → count → Load more gaps match live at 1280 / 390.
  - The open panel's 16 / 24px gaps match live at 1280 / 767 / 390.
  - 274 block/script tests pass; ESLint and Stylelint are clean.
- **Not in scope:**
  - Live's Images page has a media-cart notice above the grid (SKODA-505a).
  - Live's open panel holds 15 facets; DA authored 6 (spec §1).

## Dependencies
SKODA-402 (listing), SKODA-608 (rows + published listings). Related: SKODA-406 (media card).
