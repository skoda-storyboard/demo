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
  by default at every width behind "Advanced filter (n)" (a button with `aria-expanded`), n = active facet count.
  After a selection the panel collapses, as on live (decision 2026-09-30; it originally said "open state kept while
  filtering", see "Motion + selection behaviour" below).
- No change to the row/scope/facet logic (`listing-logic.mjs`).

## Acceptance Criteria
- [ ] /en/images and /en/videos at 1280/1024/768/500: 4/4/3/1 columns, card widths as the source ±2px.
- [ ] Facets hidden until "Advanced filter (0)" is opened; the count updates; deep links (`?filter[model][]=peaq`)
      open with the panel showing "(1)".
- [ ] News/search listings unchanged apart from the collapsed facets; lint + tests green.

## Implementation notes (2026-09-29, branch `skoda-402a-listing-layout`, ready for QA)
- **Where:** `blocks/listing/listing.{js,css}`, `styles/brand.css` (`--facet-toggle-color`; `--listing-loading-veil` from
  2026-09-30), `icons/caret-up.svg`. `listing-logic.mjs` is unchanged.
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
  - The facets are hidden until the toggle opens them. (A selection now collapses them again, as on live; see
    "Motion + selection behaviour".)
  - Esc closes one layer at a time: an open option list first (focus returns to its pill), then the panel (focus
    returns to the toggle). Collapsing the panel keeps the open option list (see "QA round 2026-09-30").
  - An Esc that an inner control has already handled (`defaultPrevented`) is left alone. For example, closing a
    media card's size menu (SKODA-406, PR #217) doesn't also close the filter panel.
  - The mobile focus trap is gone, because the panel is now an inline disclosure, not a drawer.
- **Decision (2026-09-29):** a deep link that already filters (`?filter[model][]=peaq`) opens the panel showing
  "(1)", per this ticket's acceptance criteria. The source keeps the panel closed and only shows the count.

## Review fixes (2026-09-30, measured against live /en/news and /en/images at 1280 and 390)
- **Panel above the sort row, as on live.** Live opens `form.search-filter` above `.sort-options`, 16px below where
  the sort row sits when closed and 24px above it. The branch had put the panel under the sort row. The DOM order is
  now facets → chips → sort row (since superseded: the chips moved inside the panel, see "QA round"), so the visual
  order and the focus order match. The toggle stays last in the sort
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
  - filtering updates the count (since 2026-09-30, then collapses the panel);
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

## Filter panel look & feel (2026-09-30, QA feedback: "not matching live")
Measured on live `form.search-filter` (/en/images, 1280 / 390) and matched:
- **Structure:** a row of pills (`.facet-pills`), then the open pill's options full width under the whole row
  (`.facet-options`). Before, each list was a small bordered dropdown under its own pill.
- **Pills:**
  - Size and spacing: 35px tall, padding `0 21px`, margin `0 14px 7px 0`, `#f6f6f6`, 5px radius, `--facet-shadow`.
    The first pill is 100.9×35 at x26 and the next starts at x140.9, as on live.
  - **Caret:** 14px, 5px after the label (`icons/caret-up.svg`, ink 14×8 vs live 13×8). It points down, and up while
    its options are open.
  - **Open pill:** green `#419468`, white text.
  - **A pill with selections:** stays grey and shows a green 24px count badge (3px border, `0 7px` margin). Before,
    the whole pill went green with a ✓.
- **Options:**
  - Layout: 160px columns with a 16px gap (1280: x 34 / 212 / 389 / 567; 390: x 18 / 211, as on live). Rows are
    24px, with an 8px indent, starting 23px under the last pill row.
  - Checkbox: an 18×18, 3px-radius box with a 2px inset `--skoda-grey-300` outline; checked it is green with a
    white ✓. The native checkbox stays focusable, with a focus ring on the box.
  - Names only, title-cased from the index slug (`valueLabel`: "enyaq-coupe" → "Enyaq Coupe"), in name order, with
    no "(n)" count. Chips use the name too.
- **Toggle caret:** down when closed, up when open (`icon-caret-up` on live); ink 16×9 vs live 15×10.
- **Deep link:** besides opening the panel, it opens the first filtered facet's options, as live shows them.
- **Deliberate deviation:** option labels are `--skoda-grey-500`. Live's `#a1a1a1` (`--skoda-grey-400`) is 2.6:1
  on white, as with the sort links.
- **Tests:** 3 more jsdom tests (19 in the file): the pill row + options area with one list open at a time;
  names-only labels and `valueLabel`; a deep link opening the filtered facet's options.

## Motion + selection behaviour (2026-09-30, QA: "not smooth as live", "selection collapses")
Measured on live `/en/images`, frame by frame:
- **Panel open / close:** jQuery `show(400)` animates height, margins and opacity from 0. Ours animates
  `grid-template-rows 0fr → 1fr`, margins and opacity over `0.4s ease-in-out`, with no JS animation. The panel
  stays `visibility: hidden` (so unfocusable) when closed. Live also grows the width from 0, which reflows the
  pills mid-animation; ours keeps the width.
- **Option list:** fades in with `opacity 0.2s ease-in-out`, the same as live's `.filter-input-options`
  (`@starting-style`).
- **After a selection (AC change, decision 2026-09-30: "collapse like live").** The earlier AC said the panel
  stays open while filtering. Live instead:
  - waits ~0.9s after the change (quick picks batch);
  - fades a translucent veil (`rgb(247 247 247 / 50%)`, 0.2s) over the whole listing, `#search-filter-results
    .overlay`;
  - shows the new results;
  - collapses the panel, leaving "Advanced filter (n)" + the chip.

  Ours does the same:
  - `FILTER_SETTLE_MS` 900 and `VEIL_MS` 200 time it;
  - `.listing.is-loading::before` is the veil, and `aria-busy` is set on the block while it shows;
  - the panel collapses with its 0.4s animation, and focus moves from the now hidden checkbox to the toggle.
  - Measured: the veil starts at ~955ms (live 917ms), reaches full opacity 0.2s later, then the results update,
    the veil fades out and the panel closes. Live holds the veil for its server round-trip (~2.7s); ours clears
    after 0.2s, because the index is already loaded.
- **Reduced motion:** no panel, list or veil animation.
- **Tests:** the filtering test now drives the flow with `mock.timers`:
  - the tick is immediate, and a second quick pick restarts the settle;
  - the veil and `aria-busy` are set, then cleared;
  - the count and chips update, the panel and list collapse, and focus lands on the toggle.

- **Code review (2026-09-30) fixes:**
  - **Closing no longer drops the open option list first,** so the list collapses with the panel instead of the
    content jumping ~90px. Since the QA round below, the list is not closed at all when the panel collapses.
  - **A pick still settling is handled** by sort (cancelled; its render includes the pick), Load more (shown first,
    so paging counts its rows) and back/forward (dropped). None of these gets a late veil or collapse. A chip
    removal restarts the flow at once instead (see "QA round (chip removal)"), so it gets one veil and one collapse.
  - **Both timers are tracked,** so a second pick under the veil restarts once: one veil, one collapse.
  - **Option rows are `min-block-size` 24px:** long or translated names wrap, and the box stays on the first line.
  - **Pill margins and label padding use logical properties** (RTL), and the box uses `--checkbox-border-color`.
  - **Deep-link values match index values case-insensitively** (`?filter[model][]=Peaq` ticks "peaq"; no duplicate
    chip).
  - **Tests:** 24 in `listing.test.mjs`.
- **For product review (WCAG 3.2.2 On Input):** collapsing the panel after a checkbox change or a chip removal,
  and moving focus to the toggle, is a change of context caused by input. It follows the "collapse like live"
  decision. Keyboard and screen-reader users must reopen the panel for each further pick; the open pill list is
  kept, so they don't have to reopen the pill.

## QA round 2026-09-30 (two findings, both measured on live /en/images)
- **Chips live inside the panel.** Live's `.search-filter-selected` is in `form.search-filter`, under the
  options, so the "Model: Peaq" chips hide when the panel collapses and show when it expands. Ours sat outside the
  panel and stayed visible. `.listing-chips` now moves into `.facet-inner`, after the options. Geometry, as live:
  - options → chips: 24px (the options area's own bottom margin);
  - chips: 35px tall, `0 14px` padding, `0 7px 7px 0` margin, 2px `--chip-border`, 14/600;
  - sort row right after the chips' 7px, or 24px after the options with no chips;
  - panel top: 16px below where the sort row sat;
  - checked at 1280 and 390 — pills 0–42, options from 58, chips 24px under the options.
- **The open pill list survives a collapse.** Live keeps the open list across collapse and expand (Model stays
  open; switch to Bodywork and that one stays). A reload after a selection shows the selected facet open on expand.
  Ours closed the list when the panel closed. Now only Esc or its pill closes a list. The list shrinks away inside
  the panel and is open again on expand.
- **The sort row's own 1em top margin is dropped under the open panel,** as on live, and animated with the reveal.
  Opening and closing move the grid 164px over ~44 frames, at most 12px per frame.
- **Tests:** 24 in `listing.test.mjs`, including:
  - chips inside the panel;
  - collapse + expand keeping the open list;
  - a selection → collapse → expand showing the list still open.

## QA round 2026-09-30 (chip removal)
- **Clicking a chip ("Model: Peaq") now veils, updates and collapses like live.** Before, it only re-rendered.
  - Live: the veil fades in straight away (0.2s, no settle, because the chip is a link), the results reload, the
    panel collapses, and the veil fades out.
  - Ours runs the same flow as a pick, with `applyFilterChange(0)`:
    - measured veil at once;
    - chip removed at full veil;
    - veil out and a smooth panel collapse (148px → 0);
    - focus on the toggle.
- **Focus fix:** focus is checked before the re-render, which removes the clicked chip; before, focus fell to
  `<body>`.
- **Test:** chip removal → immediate veil → update, collapse and focus (25 in `listing.test.mjs`).

## Code review 2 (2026-09-30, before commit)
- **Esc on the toggle** now closes the panel and keeps focus on the toggle. Before, with a list still open (it now
  persists), Esc closed the list and moved focus forward to its pill.
- **The panel reveal timing** (`--facet-reveal`) moved to `.listing`, so the sort row's margin transition reads
  it instead of a copied 0.4s. Chip sizes are tokens (`--chip-pad-inline`, `--chip-gap`, `--chip-icon`,
  `--chip-icon-gap`).
- **Open pill:** its count badge is hidden while its list is open, and shows on the grey pill with selections, as
  on live (open Model pill 101px wide = live). The chip's × has live's 14px icon box ("Model: Peaq" 128px vs live
  131px). The badge change is CSS only, checked in the browser.
- **Tests (28):** the test data gained a second facet (bodywork), so the "another pill" branches now run. New tests:
  - chip removal while a pick is settling runs one flow;
  - chip removal keeps the open list;
  - Esc on the toggle.
- **Mobile, 320 / 390 / 767, live vs ours** (touch, deep link with 2 filters):
  - option columns match (x 18 / 211; 18 / 209 / 400 / 590);
  - chips → sort row is 42px;
  - the toggle is 35px under the sort row;
  - there is no horizontal scroll;
  - a tap on an option runs the settle, veil and collapse; a tap on a chip veils at once, then collapses;
  - reopening keeps the list, and focus lands on the toggle.

## QA round 2026-09-30 (sort + Load more)
Measured on live /en/images:
- **Newest / Oldest** is an AJAX link (not a navigation). The veil fades in at once (0.2s); about 1s later the
  results swap and the active sort switches (it stays on the old one under the veil); an open panel collapses; the
  veil fades out; the URL gets `sortby`.
  - Ours: a sort click runs `applyFilterChange(0)`, the same flow as a chip removal. `aria-pressed` switches in
    the update render (`syncSortButtons` in `rerender`), not on click, and a click on the active sort is inert.
  - Measured, 1280 and 390 touch: veil at once → pressed state and first card switch at full veil (~0.28s) → panel
    collapses → veil out; URL `?sortby=oldest`; focus stays on the sort button.
- **Load more:** no veil. The button gets `.loading` and swaps its label for a 4-dot ellipsis loader (60×12, 12px
  dots, 0.5s cycle) until the next 12 items append (~1s of server time).
  - Ours: `.is-loading` + `aria-busy`, the label hidden (the button keeps 178×44, so nothing moves; live shrinks
    to 166×42), and the same 4 dots at 6 / 6 / 24 / 42 in a 60px box.
  - After `LOAD_MORE_MS` (500, one dot cycle) the page appends and focus moves to its first card.
  - A second click while loading is ignored. A filter, sort or back/forward change cancels a pending Load more.
- **Reduced motion:** no dot animation, and no Load more wait.
- **Tests:** 30 in `listing.test.mjs` (sort flow and inert active sort, sort during a settle, Load more loader →
  append → focus).

## Code review 3 (2026-09-30, sort + Load more)
- **Load more after a flush:** when it applies a pick still settling, focus follows to the re-rendered button, or
  to the first card if the pick left nothing more to load. Before, focus fell to `<body>`.
- **Loading state:** the label is hidden with `opacity: 0`, not `visibility`, so the button keeps its accessible
  name ("Load more") while loading. A cancelled Load more stops its loader at once.
- **The loader is decorative and direction-free:** it uses physical `left` / `translateX`, so it doesn't sit
  off-centre or run backwards in RTL.
- **Reduced motion:** `animation-name: none` on the dots. `--listing-loader-cycle` (0.5s) is cross-referenced
  with `LOAD_MORE_MS`.
- **Tests:** 33 in the file:
  - Load more during a settle, with and without rows left (focus);
  - a sort during a pending Load more (no old page, the loader stops);
  - reduced motion (no veil or Load more wait).
- **Kept for source parity:** the active sort is inert (plain text on live), while its button keeps
  `aria-pressed="true"`.
- **Out of scope, noted:** the SKODA-406 media-card menu centring (`inset-inline-start: 50%` + `translateX(-50%)` at
  1080) has the same RTL drift.

## Dependencies
SKODA-402 (listing), SKODA-608 (rows + published listings). Related: SKODA-406 (media card).
