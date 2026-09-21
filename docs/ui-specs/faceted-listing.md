# Component Spec: Faceted Listing

Status: **CAPTURED** (measured 2026-09-15 via Chrome DevTools MCP; source CSS `media-room-515d2d102b.css`).
Foundations: [`_FOUNDATIONS.md`](_FOUNDATIONS.md). Method: [`_CAPTURE-PROTOCOL.md`](_CAPTURE-PROTOCOL.md).

## 1. Identity

- **Component:** Faceted Listing (the News / Images / Videos result index with taxonomy facets,
  sort, result count and load-more). The current backlog omits the **facet UI visual design**, this
  spec is that missing piece.
- **EDS block:** `listing` (new; index-driven, follows the `stories` / `story-rail` pattern). No
  existing block.
- **Client PDF IDs:** COM-06 / COM-07 / COM-11; MR-L01–06 (result list); MR-I01–02 (image listing);
  MR-V01–02 (video listing).
- **Ticket:** SKODA-402.
- **Source references:** `https://www.skoda-storyboard.com/en/news/`,
  `https://www.skoda-storyboard.com/en/images/`, `https://www.skoda-storyboard.com/en/videos/`.
- **Top-level selectors:** `form.search-filter` (the facet bar), `.filter-label` (a facet pill),
  `.filter-input-options` (the open option panel), `.search-filter-selected` (applied-filter chips),
  `.sort-options` (sort + advanced-filter toggle), `.search-results-pagination` (count),
  `.search-results-items` (result grid), `.search-results-item` (a result cell),
  `button.ajax-loader-button` (load more).

## 2. Source anatomy

Source stack: WordPress **Search & Filter Pro** over **ElasticPress**. Load-more is a POST to
`admin-ajax.php` (`action=ys_ajax_loader`, `posts_per_page:6`, `offset`, then `history.pushState`).

```
form.search-filter                         facet bar (TOP, full width — not a sidebar)
├── .filter (×15)  display:inline-flex column
│   ├── input.expand-state[type=checkbox]  (hidden toggle)
│   ├── label.filter-label                 the pill (Model, Derivative, …)
│   │   └── em                             per-facet selected-count badge (green circle)
│   └── ul.filter-input-options            option panel (column-width:160px), hidden until .active
│       └── li > input[type=checkbox] + label   one option ("Citigoᵉ iV" …)
├── .filter.filter-reset / .filter-separator  display:none
.search-filter-selected                    applied-filter chips (bordered pill + ✕, reset)
.sort-options > ul.sort-options-list
├── li.sort-options-advanced (soa-*)       "Advanced filter (N)" toggle + caret
├── li > span.active                       "Newest" (active)
└── li > a[data-sort=oldest]               "Oldest"
.search-results-header > .stats            result meta ("N results")
.search-results-pagination                 .current " / " .total   → "6 / 1651"
.search-results-items  (flex wrap)         the result grid
└── .search-results-item (.article-list)   a result cell → holds an .article-teaser (see card-teaser.md)
button.ajax-loader-button                  "Load more"
#filter-btn-handler (mobile) / <script id=skoda-search-filter-module-js>  mobile facet toggle + template
```

**Libraries to retire (do not port):** Search & Filter Pro + ElasticPress (replace with an EDS
index query over `query-index.json` + client-side facet filtering, or an EDS search endpoint),
`ys_ajax_loader` admin-ajax (replace with `ffetch` paging over the index), jQuery, Isotope. Result
cells reuse the **card-teaser** (`.article-teaser`), build them with the `cards` family, not a fork.

## 3. Measured visual spec

All rows: `measured (source-url · selector · viewport) -> token`. Source URL for §3 =
`https://www.skoda-storyboard.com/en/news/`.

### Facet bar layout
- **Top full-width pill bar** (NOT a sidebar). `form.search-filter` renders 15 facet pills inline,
  wrapping. `.filter` is `inline-flex; flex-direction:column; margin:0 1em .5em 0` (· `.search-filter .filter` · 1280).
- **Facet order (measured, 15):** Model, Derivative, Concept, Bodywork, Equipment, Year, Company,
  Event, History, Motorsport, Sponsorship, People, Interior/Exterior, Technology, Environment
  (· `.filter-label` textContent · 1280). (Backlog list = model/bodywork/derivative/motorsport/
  equipment/technology/years/view/company/concept/environment/happening/history/sponsorship/vip;
  the live order + labels above supersede it, "view"→"Interior/Exterior", "years"→"Year",
  "happening"→"Event", "vip"→"People".)

### Facet pill (`.filter-label`, default)
- display `flex`, align/justify center; height `2.5em` = `35px` (· `.filter-label` · 1280).
- border-radius `5px` (no token -> **candidate** `--facet-radius: 5px`).
- background `#f6f6f6` (· 1280) -> **candidate** `--facet-pill-bg: #f6f6f6` (distinct from
  `--skoda-grey-100 #f5f5f5`).
- color `#161718` -> `--skoda-ink`; font-size `.875em` = `14px` -> `--body-font-size-s`; weight `600`
  -> `--weight-semibold`; padding `0 1.5em` (`0 21px`).
- box-shadow `0 2px 1px -1px rgb(0 0 0 /.1), 0 1px 1px 0 rgb(0 0 0 /.05), 0 1px 3px 0 rgb(0 0 0 /.05)`
  (no token -> **candidate** `--facet-shadow`).
- transition `background-color .15s ease-in-out`.

### Facet option panel (`.filter-input-options.active`)
- display `block`; opacity `0 -> 1`; transition `opacity .2s ease-in-out`;
  **`column-width:160px`** (multi-column checkbox list) (· `.filter-input-options` · 1280).
- option `li` width `10em` (standalone) / `12em` inside `.search-filter .filter`; each `li` = a native
  `input[type=checkbox]` + `label` (e.g. "Citigoᵉ iV"). 16 Model options measured.
- Option checkbox visual is the browser default here (the `sp__filter` advanced photo-search uses a
  custom `1.125rem` box with a `#419468` checked fill + `\e00d` tick, reuse that for the rebuild).

### Applied-filter chips (`.search-filter-selected a` / `.option-reset`)
- inline-flex; border `2px solid #d4d4d4` (**candidate** `--chip-border: #d4d4d4`); border-radius
  `5px`; background `#fff`; color `#000`; height `2.5em`; padding `0 1em`; weight `600`.
- `:before` content `"\e010"` (✕) in `#419468` (remove glyph, icon-font).

### Sort row (`.sort-options`)
- flex; justify-content `flex-end`. Items: `Advanced filter (N)` toggle (uppercase, color `#333`,
  caret icon) + `Newest` (active, color `#000`) + `Oldest` (`<a data-sort=oldest>`, inactive color
  `#ccc`) (· `.sort-options a, .sort-options span` · 1280). Active color `#000`, inactive `#ccc`.

### Result count (`.search-results-pagination`)
- margin `1em 0`; border-bottom `1px solid #c9cdd3` (**candidate** `--pagination-border: #c9cdd3`);
  padding `.5em 0`. `.current` + `.total` weight `500`, color `#aeaeae`; `.total:before` content `"/"`.
  Rendered: **"6 / 1651"** (results shown / total matches) (· `.search-results-pagination` · 1280).
- Result meta `.search-results-header .stats` font `1rem`, line-height `2`, weight `600`, color
  `#c4c6c7`.

### Result grid (`.search-results-items` / `.search-results-item.article-list`)
- container `display:flex; flex-wrap:wrap; width:1248px` -> `--content-max-width`.
- cell `.search-results-item` box-sizing border-box, padding `0 10px`, margin-bottom `20px`
  -> `--spacing-l` (24) is close; source uses `20px` (**candidate** `--grid-gutter: 20px`).
- **columns:** `1` (<768) -> `50%` at `@media (min-width:768px)` -> `33.333%` at
  `@media (min-width:992px)` (· `.search-results-items.article-list>*` @media · source CSS).
  Measured cell widths: `396px` (1280, 3-col), `331px` (992, 3-col), `384px` (768, 2-col),
  `~100%`/`500px` (mobile, 1-col). Image listings additionally go 4-col at `>=992`
  (`.images .items .item:nth-child(4n+1){clear:left}`).
- Each cell holds an `.article-teaser`, see [`card-teaser.md`](card-teaser.md).

### Load-more (`button.ajax-loader-button`)
- text "Load more"; display flex; border-radius `50px` -> `--pill-radius`; background `#fff`
  -> `--skoda-white`; color `#161718` -> `--skoda-ink`; border `2px solid #161718`; padding
  `8px 48px`; font-size `16px` -> `--body-font-size-m`; weight `600`; width `~178px`
  (· `.ajax-loader-button` · 1280). This is the shared "ghost" pill (`.btn-ghost` family).

## 4. Responsive behavior

Source ladder (matches `_FOUNDATIONS` §1 primary `768 / 992`):
- **< 768 (mobile):** result grid **1 column**. `form.search-filter` is `display:none`; facets are
  revealed via the **"Advanced filter (N)"** toggle in `.sort-options` (measured: clicking it flips
  `form.search-filter` to `display:block`, exposing the 15 pills as an expanded panel). A
  `#filter-btn-handler` button + a `<script id="skoda-search-filter-module-js">` template also exist
  for a JS-built modal variant. **This is the "mobile filter drawer".**
- **>= 768 (tablet):** result grid **2 columns** (`50%`). Facet bar still hidden inline; toggled.
- **>= 992 (small desktop) and >= 1080 (desktop):** result grid **3 columns** (`33.333%`); facet pill
  bar shown inline across the top. (Image listing: 4-col at `>=992`.)
- The facet pill sizing (`em`-based) is fluid; no per-breakpoint pill restyle measured.

## 5. Interaction states

- **Facet pill hover (not active):** background `#e4e4e4` (· `.filter-label:not(.active):hover` ·)
  (matches `--divider-color` candidate `#e4e4e4`); transition `.15s`.
- **Facet pill active (facet has >=1 selection):** background `#419468`, color `#fff`; the pill icon
  swaps to `\e00a`; the `em` count badge hides its number style and the pill itself turns green
  (measured: clicking "Model" -> `background: rgb(65,148,104)`, `color: white`, `class += active`).
  `#419468` == `--gallery-accent` candidate; promote to **`--facet-active: #419468`**.
- **Per-facet selected count:** `.filter-label > em` = green circle `24x24`, border `3px #419468`,
  bg `#419468`, white, weight `700`, shows the number of options ticked inside that facet.
- **Facet open/close:** `.filter-input-options` fades in (`opacity .2s ease-in-out`) to `display:block`
  on pill click.
- **Applied chip remove:** `.search-filter-selected a` ✕ chip drops that filter (client-side refetch).
- **Load-more:** POST `ys_ajax_loader` (posts_per_page 6, offset += 6), append 6 cells, `pushState`.
  Loading indicator: the ajax loader button state (spinner), **exact spinner markup to confirm**.
- **Sort:** "Newest"/"Oldest" swap re-queries with `?sortby=oldest`; active gets color `#000`.

## 6. Accessibility

- Facets are `<input type=checkbox>` + `<label>`, good; ensure each facet **group** is a
  `<fieldset>`/`role=group` with a `<legend>`/`aria-label` = the facet name, and the pill toggle is a
  real `<button aria-expanded>` controlling the panel (`aria-controls`).
- Result count region: `aria-live="polite"` so screen readers hear "N of 1651" after filter/load-more.
- Load-more `<button>`: move focus to the first newly-added cell (or announce "6 more loaded").
- Applied-filter chips: `<button aria-label="Remove filter: Model — Octavia">`.
- Selected-state must not rely on color alone (`#419468` green), keep the ✓ glyph + the count badge
  (dual encoding). Add a visible `:focus-visible` ring (source relies on browser default).
- Mobile drawer: trap focus while open, `Esc` closes, restore focus to the trigger.

## 7. EDS target

Block `listing` (new), index-driven like `stories` (read config rows via `readConfig`, load the
shared memoized index via `scripts/query-index.js`, filter/sort read-only, render `.article-teaser`
cells). Facet values are derived from the index rows (distinct taxonomy values) or from a small
authored facet map. Paging = slice the filtered array in batches (default 6) behind a "Load more"
`<button>` (reuse the `stories` load-more).

### `Listing` block config table (DA authoring)

| key | example value | meaning |
|---|---|---|
| `listing` | | block name (row 1) |
| `index` | `/en/query-index.json` | index URL (shared loader) |
| `path` | `/en/press-releases/` | path scope (else `template`) |
| `template` | `press_release` | index `template`/`type` filter |
| `facets` | `model, derivative, year, company, event, technology` | ordered facet keys shown as pills |
| `facetlabels` | `Model, Derivative, Year, Company, Event, Technology` | display labels (optional) |
| `sort` | `newest` | default sort (`newest`\|`oldest`) |
| `perpage` | `6` | batch size (load-more) |
| `columns` | `3` | desktop column count (default 3; images 4) |

### `decorate()` outline

1. `readConfig(block)` -> `{ index, path, template, facets[], facetLabels[], sort, perpage, columns }`
   (key/value rows, defensive, per `_FOUNDATIONS` §7b).
2. `loadQueryIndex(index)`; filter by `template`/`path`; keep a read-only working copy.
3. Build the **facet bar**: for each `facets[]` key, derive distinct values from the rows, render a
   `<button.facet-pill aria-expanded>` + `<fieldset>` of `<input type=checkbox>` options
   (`column-width:160px`). Wire change -> recompute the active set -> re-render grid + count.
4. Render **applied chips** row from the active set; each chip removable.
5. Render **sort** control (newest/oldest) + `aria-live` **count** ("N / total").
6. Render `<ul.listing-items>` of cells; each cell = `createOptimizedPicture` + card markup shared
   with `cards-overlay` (first image `fetchpriority=high`).
7. **Load-more** `<button>`: slice next `perpage`, append, move focus, update count; remove when done.
8. Mobile: below 768 collapse the facet bar behind a "Filter (N)" `<button>` opening a focus-trapped
   drawer (mirrors source `#filter-btn-handler`).
9. CSS scoped to `.listing`; tokens only; breakpoints `768 / 992 / 1080`.

## 8. Open decisions + recommended default

- **Facet data source:** derive facet values from the index at runtime (assumption to confirm) vs. an
  authored facet map. Recommend: runtime-derived, with an authored `facets` order/label override.
- **Search backend:** source uses ElasticPress full-text. EDS has no ES. Recommend client-side facet
  filtering over the index for M1; wire a search endpoint later if free-text search is required
  (assumption to confirm with client, COM-11).
- **Columns for images/videos:** source = 4-col at `>=992` for images, 3-col for news. Recommend a
  `columns` option (default 3, images 4).
- **New tokens:** `--facet-radius: 5px`, `--facet-pill-bg: #f6f6f6`, `--facet-pill-hover: #e4e4e4`,
  `--facet-active: #419468` (== gallery-accent), `--facet-shadow`, `--chip-border: #d4d4d4`,
  `--pagination-border: #c9cdd3`, `--grid-gutter: 20px`. Reuse `--pill-radius: 50px` for load-more.
- **Loading/empty states:** capture the source spinner + no-results copy (not surfaced in this pass), 
  **to confirm**; recommend an `aria-live` "No results, clear filters" panel.

## 9. Pixel-perfect acceptance criteria

Compare EDS `/en/press-releases/` (or `/news/`) to source at each viewport. WHAT / WHERE / viewport /
expected / actual.

- [ ] Facet bar position: `.listing form` / desktop / top full-width pill bar (not sidebar).
- [ ] Facet order: pills / all / Model, Derivative, Concept, Bodywork, Equipment, Year, Company,
      Event, History, Motorsport, Sponsorship, People, Interior/Exterior, Technology, Environment.
- [ ] Facet pill: `.facet-pill` / all / height `35px`, radius `5px`, bg `#f6f6f6`, color `#161718`,
      `14px`/weight `600`, padding `0 21px`, 3-layer shadow.
- [ ] Facet hover: `.facet-pill:hover` / all / bg `#e4e4e4`.
- [ ] **Facet selected:** `.facet-pill.active` / all / bg `#419468`, color `#fff`, ✓ glyph + count
      badge (green `24px` circle, weight `700`). Dual-encoded (not color-only).
- [ ] Facet panel: `.filter-input-options` / all / `column-width:160px`, opacity fade `.2s`.
- [ ] Count: `.search-results-pagination` / all / "current / total" (`.total:before "/"`),
      weight `500`, color `#aeaeae`, border-bottom `1px #c9cdd3`.
- [ ] Grid columns: `.listing-items` / mobile `1` / 768 `2` / 992+ `3` (images `4` @992); cell padding
      `0 10px`, margin-bottom `20px`; container max `1248px`.
- [ ] Load-more: `button` / all / pill radius `50px`, bg `#fff`, border `2px #161718`, `16px`/`600`,
      padding `8px 48px`.
- [ ] Mobile drawer: <768 / facet bar hidden, revealed by "Filter (N)" toggle; focus trapped; `Esc`
      closes; 1-col results.
- [ ] A11y: facet groups are `fieldset`/`role=group` with labels; count `aria-live=polite`; chips have
      `aria-label`; `:focus-visible` ring on every control; selected state not color-only.
- [ ] Visual diff vs source at 1280/1024/768/mobile <= 2% per-pixel (excluding image content).

## 10. Reference screenshots

`assets/faceted-listing/`: `1280.png` (bar + 3-col grid), `1280-facet-open.png` (Model panel open,
`column-width:160px`), `mobile.png` (1-col, bar collapsed), `mobile-filter-drawer.png` (facets
revealed via Advanced filter toggle). Additional 1024/768 grid captures pending.
