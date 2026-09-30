# SKODA-222, Stories: featured model card on model tag archives (UI)
- **Epic:** E02, Core Blocks
- **Type:** block feature + visual
- **Phase:** A · **Milestone:** M1 Should (demo-visible on 11 model tag pages)
- **GitHub issue:** [#167](https://github.com/skoda-storyboard/demo/issues/167)
- **Estimate:** 2 SP · AI-assisted 0.5–1d / manual 1–2d *(planning estimate, not a quote)*
- **Status (2026-09-30):** 🟡 In review. Branch `skoda-222-featured-model` is pushed (19b6909, 88f35ea); no PR yet.
  The content was already imported: 11 archives carry the card in DA. No re-import is needed.

## Origin
SKODA-209 M1 slice (2026-09-26). It's split out because it spans two areas (stakeholder decision): the
**import** (done, SKODA-209) and the **UI representation** (this ticket: `stories` block + CSS).

## Source (measured 2026-09-26, `/en/tag/model/epiq/`)
- **Where:** 11 of the 13 model tag archives show `.featured-model` in the archive grid: Elroq, Enyaq, Epiq,
  Fabia, Kamiq, Karoq, Kodiaq, Octavia, Peaq, Scala, Superb. Kylaq and Slavia have none, and non-model tags have none.
- **Content:** an `h2.toggle` "Explore the <Model>", a model-specific image (1440 wide, not the model page hero),
  then a `ul` of CTAs. The primary `a.btn` "Discover the highlights" goes to the model page. The secondary
  `a.btn-secondary` "Images" and "Videos" go to the media listings, pre-filtered by model (some also by bodywork).
- **Placement is responsive.** In the DOM the card is the first grid child.
  - 1440: the **3rd visual slot** (right column, first row), **416×465**, about 2 story-card rows tall
    (story cards are 416×223). The item boxes include the source's 10px cell padding: the card itself is 396×465 at
    x938 and a story card is 396×223 (re-measured 2026-09-30).
  - 768: **first, full width**, 768×161, collapsed.
  - 390: **first, full width**, 390×201, collapsed. `h2.toggle` is the expand/collapse control.
  - The desktop/collapsed switch is at **992**, not 1024 (source `max-width: 991.98px`, re-measured 2026-09-30).
- **Page size:** the first page is **4 stories + the card** (`ajax_model_search`, offset 4). Each Load more adds 6.
- Full measurements: [`template-category-archive.md` §10a](../../ui-specs/template-category-archive.md).

## DA shape (already imported, contract `stories-feature` v1)
One extra row in the page's `Stories` table: `[feature, <cell>]`. The cell holds a `<picture>`, an `<h3>` title,
and one `<p>` per CTA. The primary CTA is wrapped in `<strong>`. The CTA hrefs are site-relative (SKODA-605).
Their targets go live with SKODA-208 (model pages) and SKODA-608 (Images/Videos listings); until then they 404, by
stakeholder decision (2026-09-26).

## Scope
- `blocks/stories`: read the `feature` row (it's cleared today with the other config rows) and render the card in
  the grid. Measure the placement and styling from the source with DevTools: the desktop slot/span, the
  mobile/tablet first-and-collapsible behaviour, image ratio, title, and button styles. Reuse the existing button
  tokens.
- Accessibility: the collapsible title is a real `<button aria-expanded>` (or `<details>`), and the CTAs are links.
- Load more keeps working. **Decision (2026-09-30): the card takes two story slots on the first page, as on the
  source** (6 → 4 stories + the card, then +6). This replaces "the card doesn't count toward `initial`", which would
  leave a gap under the card in row 3.
- Contract: move `feature` from `pending` to `stories.configKeys` on `main` in the same PR.
- Unit tests for the config read. Browser QA against the source at 1440 / 1024 / 768 / 390.

## Acceptance Criteria
- [x] On the 11 archives, the card renders where the source shows it at 1440, 768 and 390 (±4px geometry), with
      the same content and CTAs. *(Also checked at 1280 / 1250 / 1200 / 1121 / 1120 / 1024 / 992 / 991 / 320.)*
- [x] Below 992 the card starts collapsed and the title toggles it (keyboard + screen reader). *(The switch is at
      992, as on the source; the AC used to say 1024.)*
- [x] Archives without a `feature` row are unchanged, as are the other `stories` uses (home feed). *(One deliberate
      change: at ≥1248 every stories grid, home feed included, is 20px wider, to match the source; see Implementation.)*
- [x] No re-import needed (shape v1); the 11 pages re-QA'd.
- [x] The first page shows 4 stories + the card, and Load more adds 6 (decision 2026-09-30).

## Implementation (2026-09-30, branch `skoda-222-featured-model`)
- **Where:**
  - `blocks/stories/stories.{js,css}`: `readFeature` / `buildFeature`, `FEATURE_SLOTS = 2`.
  - `icons/chevron-down-green.svg` (new).
  - `tools/importer/push/block-contracts.json`: `feature` moves from pending into `stories.configKeys`.
  - `blocks/stories/stories-feature.test.mjs` (new, jsdom).
  - `.hlxignore`: block test files are no longer served.
- **Markup:** `li.stories-feature` is the grid's first cell. It holds:
  - `h2.stories-feature-title`, containing a `button.stories-feature-toggle[aria-expanded][aria-controls]` and the
    plain `span.stories-feature-text`. CSS shows one or the other, so the layout needs no JS; JS only keeps focus in the card when the width crosses 992. The title is an
    h4 when the feed has an authored heading (h3).
  - `div.stories-feature-panel`, holding `picture.stories-feature-image` (480px rendition, authored width/height
    kept so the lazy image reserves its space) and `ul.stories-feature-ctas`.
- **Primary CTA:** read from `<strong>` or from `a.button.primary`. `decorateButtons` (scripts.js) replaces the
  `<strong>` before blocks run. If nothing is marked, the first link is primary.
- **External links:** `http(s)` links off the site (the "Configure your <Model>" configurator, 7 of 11 archives) open
  in a new tab with `rel="noopener noreferrer"`, as on the source.
- **Rendering order:** the card paints before the index loads and stays if the index fails. Load more and Back
  re-render only the story cells, so the card keeps its open state. Focus after Load more goes to the first new
  story (the source drops it to `<body>`).
- **≥ 992:** the grid becomes CSS grid (3 × `minmax(0,1fr)`), and the card is `grid-area: 1 / 3 / span 2`.
- **< 992:** the card is a full-width flex cell. The panel uses the source's `max-height 0 → 400px` over 0.2s
  ease-in-out, and `visibility` hides it from Tab and screen readers while collapsed. Reduced motion: no transition.
- **Steps:** the source's 410 / 1120 / 1260 viewport steps are container queries on the grid (`stories-grid`, whose
  width is the viewport less 20px). Stylelint allows only the project breakpoints.
- **Found on the way, fixed here:** the stories wrapper was capped at 1228 instead of 1248, so at ≥1248 every
  stories grid (home feed + archives) sat 10px in and the cards were narrower. At 1440 the cards were 389 wide at
  x116; the source has 396 at x106. The home feed now measures 604 / 604 / 396 ×3 from x106, the same as the source.

## Verification (2026-09-30, live vs local, measured)
- **Desktop (Octavia):** at 1440 / 1280 / 1250 / 1200 / 1121 / 1120 / 1024 / 992, the card's x and width match the
  source exactly (1440: 938 / 396; 1024: 692.7 / 321.3; 992: 671.3 / 310.7). So do the padding (40/20/28, and
  10/20/15 ≤ 1120) and the border, background and radius.
  - The title, image and CTAs sit at the source's offsets inside the card: title +41, image +85.8, first CTA
    +224.8 at 1440. Their type matches: 32/36.8/600 black, or 24/27.6 ≤ 1260; CTAs 250×30, 14/14/600, ls 1px,
    radius 28.
  - The story cards and the rows Load more adds sit at the source's positions (rows at 0 / 243 / 486 / 728 at
    1440; 0 / 201 / 401 / 602 at 1024). The page goes 4 → 10 stories with `?offset=10`.
- **Collapsed (Epiq):**
  - 991 / 768 / 390 / 320: the bar is 931×120 / 708×120 / 330×160 / 260×184, with 24/24/600 mint on
    `#0e3a2f` and 48px padding.
  - The 40px chevron circle sits 38px in from the top and right, or under the title ≤ 410.
  - The open card is 305 / 345 / 369 tall. The CTAs start 24px under the bar at a 48px pitch, 692 / 314 / 250
    wide.
  - The open animation matches (93px of 144 after 80ms on both), and so do the hover colours (#a8ffcc / #5a5b5c).
- **All 13 model archives:**
  - The 11 carry the card with the right title and CTAs, the image loads at 480px, and there are no console
    errors or asset 404s.
  - Kylaq and Slavia have no card.
  - Fewer stories than the source on some archives (Fabia 1, Scala 1, Kamiq 2, Karoq 2, Superb 3) is migration
    coverage, not this block.
- **Accessibility:**
  - Collapsed, the card reads as a heading (level 2) containing a button, "Explore the Epiq". Tab skips the
    hidden CTAs; Enter/Space toggle.
  - At ≥ 992 it reads as a heading plus the 3 links, with no dead button.
  - Focus rings are 2px.
- **Checks:** ESLint + Stylelint clean; the stories tests and the contract tests (55) pass (see Code review 2).

## Code review 2 (2026-09-30, a11y / keyboard / mobile)
- **Contrast, computed:** mint on `#0e3a2f` 9.66:1; black on mint 16.1:1; white on `#464748` 9.31:1 (hover
  `#5a5b5c` 6.82:1). The `#419468` focus ring is ≥ 3.28:1 on every background it sits on.
- **Fixed, title under the chevron (411–460):** the title is now centred in the room left of the 40px icon,
  as the source's floated icon does. Measured equal to the source: text 82–289 at 411, 91–299 at 430, 106–314 at
  460, 260–468 at 768. Before, "Explore the Kodiaq" ran 6px under the icon at 411, and the title sat 20px right of
  the source from 411 to 991. At ≤ 410 the stacked bar keeps its symmetric padding.
- **Fixed, focus when the width crosses 992** (a rotated tablet, a zoomed window):
  - A focused toggle hands focus to the first CTA when it is hidden.
  - A focused CTA of a collapsed card reopens the panel.
  - Measured by resizing 900 → 1200 → 800.
- **Fixed, new-tab links:** the configurator CTA is named "Configure your <Model> (opens in a new tab)", the
  cards-social convention (placeholder `newTab`).
- **Tidied:** removed the dead `list-style` and `pointer-events` rules; `initial` became `firstPage` in
  decorate; the contract doc says "on main once SKODA-222 merges".
- **Keyboard walk, measured:**
  - 390 collapsed: toggle → stories → Load more.
  - 390 open: toggle → the 4 CTAs → stories.
  - 1440: the 4 CTAs → stories.
  - Every stop shows the 2px ring; there's no trap. At 320–991 there's no horizontal overflow.
- **Tests:** 47 stories tests (18 new), including the resize-focus case and the new-tab name.

## Deliberate deviations
- **Tab order at ≥ 992:** the card's CTAs come before story 1, although the card sits top right. The DOM order
  is the source's, and on mobile the card is visually first.
- **List count:** the card is an `li` of the story list, so screen readers count it in the list ("11 items"
  when 10 stories show).
- **992–1247, 4+ stories:** the card is exactly two story rows tall (e.g. 381 at 1024, 447 at 1200) instead of
  the source's 415 / 465. The source card overlaps the first loaded story by 14px there; ours doesn't
  (decision 2026-09-30).
  - With 3 stories or fewer (nothing below the card) it keeps the source minimum. There the second row grows a
    little: Superb at 1024 has row 2 at +218 against +201.
- **1248–1260:** the title is 32px and the image 240 wide 12px early. The source steps at 1260. Our grid stops
  growing at 1248, so a container query can't tell that band apart.
- **Focus after Load more:** it moves to the first new story. On the source it is lost.
- **Page offset:** the card sits lower on the page than on the source (y481 vs 372 at 1440) only because the hero
  above it is taller. That is SKODA-828's hero parity, not this block.

## Dependencies
SKODA-209 (archives + import), SKODA-214 (`stories` block). The CTA targets come with SKODA-208 / SKODA-608.
