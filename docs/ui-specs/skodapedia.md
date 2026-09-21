# Component Spec: Škodapedia (glossary directory + term detail)

Status: **CAPTURED** (measured 2026-09-15 via Chrome DevTools MCP on page id 1; source CSS
cross-checked against `media-room-515d2d102b.css`; term-detail panel opened live + term API confirmed;
reference screenshots saved).
Foundations: [`_FOUNDATIONS.md`](_FOUNDATIONS.md). Method: [`_CAPTURE-PROTOCOL.md`](_CAPTURE-PROTOCOL.md).

## 1. Identity

- **Component:** Škodapedia, an A-Z glossary. Three parts: a filterable **directory** (A-Z jump nav +
  letter-grouped term list), a **filter bar** (text search + advanced model/category facets), and a
  **term-detail panel** that opens in place over the directory (image + "Belongs to" tags + rich text).
- **EDS block(s):** **NEW** `skodapedia` block (directory + filter + A-Z nav) plus a reused accessible
  **modal** for the term detail. No existing block. Cross-references: [`tags.md`](tags.md) (the
  "Belongs to" chips), [`card-teaser.md`](card-teaser.md) (the term-detail teaser image reuses
  `.article-teaser`), [`gallery-lightbox.md`](gallery-lightbox.md) (the teaser image's colorbox link).
- **Client PDF IDs / ticket:** SKODA-206.
- **Side (verified live 2026-09-15):** renders on the **Media Room** side (header shows the MR nav, News/
  Press Kits present; section switcher = Media Room), even though Škodapedia is linked from both nav sets.
  Use the MR chrome (`footer-mediaroom`). `body.post-type-archive-skodapedia`.
- **Source reference:** `https://www.skoda-storyboard.com/en/skodapedia/` (212 terms).
- **Top-level selectors:** `.sp__row` (12-col flex row), `.sp__list-nav` (A-Z nav) inside
  `.sp__list-nav-holder`, `.sp__list-content` (directory), `.sp__list-directory__item` (a term row) +
  `.sp__list-directory__item--name` (a letter heading), `.sp__filter` / `.sp__filter-input--search` /
  `.sp__filter--advanced` (filter bar), `.sp__term-detail` (the detail panel) + `.sp__term-detail__close`.

## 2. Source anatomy

```
body.post-type-archive-skodapedia
├── .sp__filter                                     the filter bar (padding-top:25px)
│   ├── .sp__row  ["Search" label + input]
│   │   ├── .sp__filter-label > span "Search"        flex 12.5%, 700 (hidden-ish on mobile)
│   │   └── .sp__filter-input-holder                 flex 87.5%
│   │       ├── .sp__search-label:after \e02d        magnifier icon
│   │       └── input.sp__filter-input--search       placeholder "Search in Škodapedia"
│   ├── .sp__filter-button-holder
│   │   ├── .sp__copy-button  (\e01b, is-visible/is-copied)   copy-permalink
│   │   └── .sp__filter-button "Advanced filter" (\e015)      toggles ↓
│   └── .sp__filter--advanced   (height:0 → animates open, transition min-height .25s)
│       ├── .sp__row.sp__filter--models      "Models" + 16 checkboxes (Enyaq, Kodiaq, …)
│       └── .sp__row.sp__filter--categories  "Categories" + 7 checkboxes (Connectivity, Design, …)
└── .sp__row  (the list)
    ├── .sp__list-nav-holder                 A-Z jump nav (order swaps by viewport, see §4)
    │   └── .sp__list-nav > a[href="#sp-a"]…  27 circular letter links (a-z + '#'); is-active / is-deactivated
    └── .sp__list-content                    the directory (JS-laid single column)
        ├── .sp__list-directory__item--name#sp-a  "a"   letter heading (anchor target), 23 of them
        └── .sp__list-directory__item.sp-a.kamiq.karoq.…  a term row (212 of them)
            └── a[href][data-term-id][data-term-path]  the green underlined term link
   ── on click (JS): fetch /wp-json/skodapedia/v1/term/{id}?lang=en_GB → {content:"<html>"} ──
   .sp__term-detail.is-active   (absolute panel injected over .sp__list-content, right side)
   ├── .sp__term-detail__close  (SPAN; \e010; NOT a button, no aria)
   └── .sp__term-detail__data   (scroll region)
       ├── h3.sp__term-detail__data__headline          term title
       ├── .sp__term-detail__data__teaser-media         reuses .article-teaser + a.colorbox image
       ├── .sp__term-detail__data__categories           "Belongs to" + ol.entry-tags.tag-list .tag (outlined chips)
       └── .sp__term-detail__data__content              rich HTML
```

**Filter mechanism (confirmed client-side, no fetch):** each term row carries its letter class
(`sp-a`) plus one class per model (`kamiq`, `octavia`, …) and per category (`technology`,
`driver-assistance-systems`, …). Ticking a model/category checkbox and typing in the search box filter
the list **by toggling CSS classes / matching text in the DOM**, with **no network request** (verified:
no XHR fired on filter; only the term-detail click fetches). The A-Z nav links are pure in-page anchors
(`#sp-a`), and empty letters get `.is-deactivated`.

**Directory layout (JS-driven):** the 212 items are absolutely positioned (inline `left:10px; top:Npx`)
in a **single column** (measured: every item `left:10px`; list-content box `1092×7893` at 1280). This
is a JS masonry/stack used for filter re-flow animation, **not** a multi-column grid; the item link is
merely capped to `max-width: calc(50% - 10px)` at `≥992`.

**Term detail transport (confirmed live):** clicking a term calls
`GET /wp-json/skodapedia/v1/term/121817?lang=en_GB` → `{ "content": "<h3 …>…</h3>…" }` (ready-baked
HTML), injected into `.sp__term-detail`, `.is-active` added, and the URL `pushState`-d to
`/skodapedia/{slug}` (the directory stays mounted; it is an in-page panel, not a page navigation).

**Libraries / patterns to retire:** jQuery, the WP `skodapedia/v1/term` REST endpoint, the JS
absolute-position masonry, colorbox (teaser image lightbox), the icon-font glyphs (`\e02d` search,
`\e015` filter, `\e01b`/`\e00d` copy, `\e010` close), and the `float`/`clear` tag layout.

## 3. Measured visual spec

All rows: `measured (source-url · selector · viewport) → token`. Source URL for §3 is
`https://www.skoda-storyboard.com/en/skodapedia/` (abbreviated `…/skodapedia/`); term panel values from
the open "Active Cylinder Technology (ACT)" term.

### Directory row + list (`.sp__row`, `.sp__list-content`)
- `.sp__row`: `display:flex; flex-wrap:wrap; margin: 0 -10px` (10px gutter) (· `.sp__row` · 1280).
- `.sp__list-content`: `flex: 0 0 87.5%` (`≥992` with `order:2`) / `0 0 88.888%` (`≥576`) / `0 0 83.333%`
  (`<576`, `order:1`) (· `.sp__list-content` · 1280 vs 500). Single-column term stack (see §2).

### Letter headings (`.sp__list-directory__item--name`)
- `font-size:24px; line-height:36px; font-weight:700; text-transform:uppercase; margin:10px 0 5px`
  (· `.sp__list-directory__item--name` · 1280) → `24px` no exact token (between `--heading-font-size-m 22px`
  and `-l 26px`), weight → `--weight-bold`. `id="sp-a"` = the A-Z anchor target.

### Term link (`.sp__list-directory__item > a`)
- `display:inline-block; padding:4px; text-decoration:underline; border-radius:2px` → `--tag-radius: 2px`.
- `color: rgb(65,148,104)` = **`#419468`** → **`--gallery-accent`** (the same mid-green already flagged in
  `gallery-lightbox.md`; reuse, do not add a new token) (· `.sp__list-directory__item a` · all).
- `font-size:16px` → `--body-font-size-m`; `max-width: calc(50% - 10px)` at `≥992`, `none` below.
- carries `data-term-id` (`121817`) + `data-term-path` (`active-cylinder-technology-act`).
- `.is-active > a`: `background-color:#419468; color:#fff; text-decoration:none` (the currently-open term).

### A-Z nav (`.sp__list-nav a`)
- circular button: `border-radius:50%; font-weight:500; text-align:center`, sized in **`vh`** units
  (`width/height:2vh; font-size:2vh` at `≥992` ≈ `22×22` measured; `2.75vh` at tablet;
  `4.45vh` in landscape) (· `.sp__list-nav a` · 1280). The `vh` sizing has no token → recommend a fixed
  `--az-nav-size: 24px` in the rebuild (vh sizing is fragile).
- `.is-active`: `color:#fff; background-color:#419468` (→ `--gallery-accent`).
- `.is-deactivated`: `color:#c4c6c7; pointer-events:none` + smaller (letter has no terms) (· source CSS).
- `href="#sp-{letter}"` (in-page anchor to the matching letter heading).

### Filter bar (`.sp__filter`)
- `.sp__filter`: `display:block; width:100%; padding-top:25px`.
- Search `.sp__filter-input--search`: `flex 0 0 71.43%` (`≥720`) / `100%` (`<720`);
  `padding:1rem .75rem 1rem 3rem`; `border-bottom:1px solid #5a5b5c` (→ candidate `--gallery-divider`
  `#5a5b5c` reuse from gallery); `color:#161718` → `--skoda-ink`; placeholder `#5a5b5c`, text
  "Search in Škodapedia"; leading magnifier `\e02d`.
- Label `.sp__filter-label`: `flex 0 0 12.5%; font-size:1.15rem (18.4px); font-weight:700` → `--weight-bold`.
- "Advanced filter" `.sp__filter-button`: `color:#419468; cursor:pointer; :after content:"\e015"`; hover
  `#59bc87` (→ candidate `--gallery-accent-hover: #59bc87`). Toggles `.sp__filter--advanced`
  (`overflow:hidden; height:0` → animates via `min-height` `transition:.25s ease`).
- Checkboxes `.sp__filter-input--checkbox` (16 models + 7 categories): custom box via `label:before`
  (`1.125rem` square, `border:2px solid #464748`, `border-radius:3px`); `:checked` → `\e00d` check,
  `background:#419468`. Layout `flex 0 0 50%` (`<720`) / `25%` (`≥720`) / `14.28%` (`≥1080`).
- Copy `.sp__copy-button`: `visibility:hidden` until `.is-visible`; `:after \e01b`; `.is-copied` swaps to
  `\e00d` check (copy-to-clipboard permalink, transition `.25s ease`).

### Term-detail panel (`.sp__term-detail`)
- `position:absolute; top:0; right:-10px; z-index:10; background:#fff; overflow:hidden;
  min-height:250px; box-shadow:0 0 10px 0 #c4c6c7` (→ candidate `--modal-shadow: 0 0 10px 0 #c4c6c7`);
  `transition:all .25s ease`.
- width: `calc(43.75% - 10px)` = **~527px** at 1280 (· `.sp__term-detail` · 1280) / `calc(100% - 10px)`
  = **~470px** (near-full-width) at 500 (· 500). So the panel is a **right-hand side panel** on desktop
  and an **almost-full-width overlay** on mobile.
- `:after`: a bottom white fade `linear-gradient(0deg,#fff,transparent)` `height:3rem` (scroll hint).
- `.sp__term-detail__data`: `overflow:auto; max-height: calc(100vh - 20px)` (`95vh` at `≥992`);
  `padding: calc(1.5rem + 30px) calc(1rem + 17px) 3rem 1rem` (top clears the close button).
- `.loading` → shows a green `.loader`, dims `.sp__term-detail__data` to `opacity:0`.

### Term-detail contents
- Headline `h3.sp__term-detail__data__headline`: `font-size:24px; line-height:27.6px; font-weight:700`
  (· 1280) → weight `--weight-bold`.
- Teaser media: reuses `.article-teaser` with a `a.colorbox` `ratio-16x9` image (see
  [`card-teaser.md`](card-teaser.md) / [`gallery-lightbox.md`](gallery-lightbox.md)).
- Categories `.sp__term-detail__data__categories`: an `h4.headline` "Belongs to" (`text-align:right;
  font-size:1rem`) + `ol.entry-tags.tag-list` of **outlined** `.tag` chips (`font-size:.75rem;
  border:1px solid gray; background:transparent; color:inherit; cursor:default`), right-floated, this
  is the **outlined-chip variant** documented in [`tags.md`](tags.md) §5, non-interactive here.
- Content `.sp__term-detail__data__content`: default rich text (p/links).

### Close control (`.sp__term-detail__close`)
- `SPAN; position:absolute; right:1rem; top:1rem; z-index:100; cursor:pointer`; `:before content:"\e010"`
  `font-size:30px` (measured box `30×37`); hover `color:#419468` (· 1280).
- **No `role`, no `aria-label`, no `tabindex`** (· measured) → **not keyboard-focusable, not a button**
  (a11y gap, see §6).

## 4. Responsive behavior

Breakpoints are the source ladder (`_FOUNDATIONS` §1) plus the secondary `576 / 720`:
- **A-Z nav position swaps.** At `≥992` the nav-holder is `order:1` (left of the list) at `flex 12.5%`;
  below `992` it moves to `order:2` (right of the list), `flex 11.11%` at `≥576`, `16.67%` at `<576`.
  The list-content mirrors (`order:2`/`87.5%` desktop → `order:1`/`83.33%` mobile) (· measured 1280 vs 500).
- **Filter columns.** Search input `71.43%` (`≥720`) → `100%` (`<720`); checkboxes `14.28%` (`≥1080`) →
  `25%` (`≥720`) → `50%` (`<720`).
- **Term panel width.** `calc(43.75% - 10px)` (~527px) desktop → `calc(100% - 10px)` (~470px) mobile;
  `max-height` `95vh` (`≥992`) → `calc(100vh - 20px)` (mobile).
- **A-Z nav sizing** is `vh`-based (`2vh`→`2.75vh`→landscape `4.45vh`), which is viewport-height-relative
  rather than breakpoint-driven, a fragility to replace with a fixed size on rebuild.

## 5. Interaction states

- **Filter (client-side):** typing in search / ticking model+category checkboxes filters the visible term
  list live, no fetch; the JS re-stacks the remaining items (animated). A-Z letters with zero visible
  terms flip to `.is-deactivated`.
- **A-Z jump:** clicking a nav letter scrolls to `#sp-{letter}`; the active letter gets `.is-active`
  (`#419468` fill).
- **Open term:** click a term link → panel `.is-active` (`display:block`), `.loading` while the
  `wp-json/skodapedia/v1/term/{id}` fetch resolves (green loader), then content fades in
  (`opacity 0→1`, `.25s`). URL `pushState`-d to the term slug; the open term link gets `.is-active`
  (green fill).
- **Close:** click `.sp__term-detail__close` (`\e010`) → panel hides; browser Back also closes (popstate).
- **Copy link:** `.sp__copy-button` copies the permalink; icon animates `\e01b` → `\e00d` (`.is-copied`,
  `.25s`).
- **Advanced filter toggle:** `.sp__filter-button` expands `.sp__filter--advanced` (`min-height` `.25s`).

## 6. Accessibility (HARD GATE for the term panel)

The source panel is a `<span>`-driven in-page overlay with **no dialog semantics**. The rebuild MUST:
- Render the term detail as `role="dialog" aria-modal="true"` with `aria-labelledby` (the term headline).
- **Focus trap** while open; **Escape** closes; **focus returns** to the term link that opened it.
- Close is a real `<button aria-label="Close">`, keyboard-focusable with a visible `:focus-visible`
  ring (source close is a non-focusable `<span>`).
- A-Z nav links are real links with discernible text; `.is-deactivated` letters get
  `aria-disabled="true"` (not just `pointer-events:none`).
- Filter checkboxes keep real `<input type=checkbox>` + `<label>` associations; the search input has a
  `<label>`/`aria-label` ("Search in Škodapedia"). Announce result counts via `aria-live` after filtering.
- The term list is a real list (`<ul>/<li>`); letter groups use headings so AT can navigate by heading.
- "Belongs to" chips are non-interactive here, mark `aria-hidden`/plain text, not links (source uses
  `cursor:default` chips).
- Contrast: green `#419468` link text on white ≈ 3.6:1 for 16px, **below 4.5:1**; keep the underline
  (already present) and/or darken to `--skoda-green` for AA (open decision §8).

## 7. EDS target

**NEW `skodapedia` block** for the directory + filter + A-Z nav, plus a shared accessible modal for the
term detail. Recommended data model: an **index-driven** directory (a `skodapedia` query-index sheet:
`title, slug, letter, models[], categories[]`) rendered client-side (like `stories`), and each term's
detail **pre-baked to a fully static fragment** under `/modals/skodapedia/{slug}` (retire the WP
`wp-json` endpoint). Follow repo conventions (`_FOUNDATIONS` §7): tokens-only CSS scoped to `.skodapedia`,
Trusted-Types-safe injection of the fetched fragment, `optimizeImageInPlace`/`createOptimizedPicture`
on the teaser image.

### DA authoring model

`Skodapedia` (config table; the term rows come from the index, details from `/modals/`):
| key | example | meaning |
|---|---|---|
| `skodapedia` | | block name (row 1) |
| `index` | `/skodapedia/query-index.json` | term source sheet |
| `models` | `Enyaq, Kodiaq, …` | model facet values |
| `categories` | `Technology, Design, …` | category facet values |
| `modals` | `/modals/skodapedia/` | pre-baked term-detail fragment folder |

### decorate() outline (new block)

1. `readConfig(block)` → `{ index, models[], categories[], modals }`; `loadQueryIndex(index)` (memoized,
   `_FOUNDATIONS` §7).
2. Build the **filter bar**: a labeled search `<input>`, an "Advanced filter" `<button aria-expanded>`
   revealing model + category checkbox `<fieldset>`s.
3. Build the **A-Z nav**: for each present letter a `<a href="#sp-{letter}">`; letters absent from the
   index get `aria-disabled`. Fixed circular size (`--az-nav-size`), `--gallery-accent` active fill.
4. Render the **directory** as `<ul>` grouped by letter (`<h2 id="sp-a">`); each `<li><a data-slug …>`.
   Filtering = show/hide by matching `data-letter` / `data-models` / `data-categories` / title text
   **in JS, no fetch**; update an `aria-live` count and re-evaluate `.is-deactivated` letters.
5. **Term modal:** on term click, `fetch('/modals/skodapedia/'+slug+'.plain.html')`, inject into a
   reused `role="dialog"` overlay (focus-trap util, Escape, focus return, real `<button>` close),
   `pushState` the slug, `optimizeImageInPlace` the teaser, decorate the "Belongs to" chips via the
   `tags` block (outlined variant). Degrade gracefully if the fragment 404s.
6. CSS scoped to `.skodapedia`; A-Z nav left at `≥992`, right below; panel = side panel desktop /
   full-width sheet mobile.

## 8. Open decisions + recommended default

- **Term-detail transport:** recommend **pre-baking each term to a static `/modals/` fragment** over
  keeping a runtime `wp-json` endpoint (fully static, cacheable, no WP), assumption to confirm.
- **Directory layout:** recommend a real CSS multi-column list (`columns: 2` at `≥768`, `3` at `≥1080`)
  instead of the JS absolute-position single-column masonry (the source visually reads as a wide list;
  CSS columns give the same look without JS), assumption to confirm.
- **A-Z nav sizing:** replace the `vh`-based sizing with a fixed `--az-nav-size: 24px`, assumption to confirm.
- **Filter:** keep it **fully client-side** (index + class/text match, no fetch), matches source; confirm
  the facet list (16 models, 7 categories) is authoritative.
- **Contrast:** darken term-link/active green from `#419468` to `--skoda-green` for AA, or keep the green
  with the existing underline, assumption to confirm.
- **New/reused tokens:** reuse `--gallery-accent: #419468`, `--gallery-divider: #5a5b5c`, `--tag-radius: 2px`;
  add `--gallery-accent-hover: #59bc87`, `--az-nav-size: 24px`, `--modal-shadow: 0 0 10px 0 #c4c6c7`.

## 9. Pixel-perfect acceptance criteria

Compare EDS render to source at each viewport. Format: WHAT / WHERE / viewport / expected / actual.

- [ ] Directory: `.skodapedia` list / all / letter-grouped A-Z; letter heading `24px / 700 / uppercase`;
      212 terms render (index-driven count matches).
- [ ] Term link: `.skodapedia li a` / all / green `#419468`, underlined, `16px`, radius `2px`; open term
      gets green fill + white text.
- [ ] A-Z nav: `.skodapedia` nav / **left at ≥992**, **right at <992**; circular; active letter `#419468`
      fill/white; empty letters deactivated (greyed, non-interactive).
- [ ] Search: input placeholder "Search in Škodapedia", magnifier icon, `border-bottom 1px #5a5b5c`;
      typing filters the list **with no network request**.
- [ ] Advanced filter: "Advanced filter" toggles a panel of 16 model + 7 category checkboxes; ticking a
      box filters by class **client-side (no fetch)**; checked box `#419468` fill + check.
- [ ] Term detail transport: opening a term loads pre-baked HTML (no `wp-json`); URL updates to the slug.
- [ ] Panel geometry: `.skodapedia-modal` / 1280 / right-hand side panel `~43.75%` width; / <768 /
      near-full-width sheet; scrollable, `max-height ~95vh`; box-shadow `0 0 10px #c4c6c7`.
- [ ] Panel content: headline `24px / 700`; teaser image `16:9`; "Belongs to" outlined chips
      (`tags` outlined variant); rich text body.
- [ ] **A11y GATE:** term panel is `role=dialog aria-modal`; focus trapped; Escape closes; focus returns
      to the invoking term; close is a labeled `<button>` with `:focus-visible`; search + checkboxes
      labeled; `aria-live` result count; deactivated letters `aria-disabled`. (Blocking.)
- [ ] Visual diff vs source at 1280/1024/768/mobile ≤ 2% per-pixel (excluding image content).

## 10. Reference screenshots

`assets/skodapedia/`: `term-detail-1280.png` (directory + A-Z nav + open right-hand term panel with
"Belongs to" chips), `term-detail-mobile-500.png` (near-full-width term sheet). `sp-snapshot.txt` = the
captured a11y tree (term link uids). Clean directory + advanced-filter-open captures pending.
