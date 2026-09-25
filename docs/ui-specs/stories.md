# Component Spec: Stories feed (Load-more pager)

Status: **CAPTURED** (measured 2026-09-23 via Chrome DevTools MCP on `https://www.skoda-storyboard.com/en/`,
the first `.cover-box` "Latest Stories" feed, at 1280 / 1024 / 992 / 991 / 768 / 767 / 500).
Foundations: [`_FOUNDATIONS.md`](_FOUNDATIONS.md). Template context: [`template-home.md`](template-home.md).
Card unit: [`card-teaser.md`](card-teaser.md). Reuse target: [`faceted-listing.md`](faceted-listing.md) (SKODA-402).
Method: [`_CAPTURE-PROTOCOL.md`](_CAPTURE-PROTOCOL.md).

This is the vertical "Latest Stories" list that leads the Storyboard home: a fixed first slice of
`card-teaser` cards plus an accessible **Load more** `<button>` that appends the next batch. It is a
**distinct block from the horizontal rails** (`carousel-rails.md` / SKODA-212) and the promo-box
(SKODA-213). Delivered by **SKODA-214** (GitHub issue #97), reusing SKODA-402's `scripts/query-index.js`
loader + `listing-logic` `paginate`/`sortRows` without forking that engine.

## 1. Identity

- **Component:** Stories feed (Load-more pager), the STO home "Latest Stories" `.cover-box`.
- **EDS block:** `stories` (new; index-driven, facet-less sibling of `faceted-listing`'s `listing`).
- **Client component IDs:** STO-H02 "Latest Stories" (also underpins the `stories(promo)` featured usage
  noted in the README client map).
- **Ticket:** SKODA-214 (issue #97). Depends on SKODA-201 (`card-teaser`), **SKODA-402**
  (query-index loader + `paginate`/`sortRows`, the reuse target), SKODA-401 (index schema), SKODA-106 (tokens).
- **Source URL + selector:** `https://www.skoda-storyboard.com/en/` ·
  `.cover-box .search-results.latest-articles` (heading "Latest Stories").
- **Scope note (measured correction):** the Load-more feed is confirmed **only** on the STO home.
  The Media Room home (`/en/media-room/`) "News" `.cover-box` was measured 2026-09-23 as a
  press-release grid/rail (`.search-results.type-press_release`) with **no** `ajax-loader-button`
  (see §8). Earlier `template-home.md` copy that paired "News" with the Load-more feed is corrected here.

## 2. Source anatomy

WordPress **Search & Filter Pro** / **ElasticPress** AJAX loader (`ys_ajax_loader`), same engine family
as `faceted-listing.md` but **facet-less** (no `form.search-filter`).

```
div.cover-box                                        light section band (white bg)
└── div.search-results.latest-articles
    └── div.search-results-container                 max-width 1248px; padding 0 10px
        ├── header.search-results-header
        │   └── h3.search-results-heading            "Latest Stories"
        ├── div.search-results-items                 flex-wrap grid; margin 0 -10px (negative gutter)
        │   [data-ys-ajax-loader-container]          id=search-results-items-<hash>
        │   └── div.search-results-item              flex cell; padding 0 10px; margin-bottom 20px
        │       └── article.article-teaser           the card-teaser unit (see card-teaser.md)
        └── div.ajax-loader-button-wrapper           flex; justify-content center; padding 16px 0
            └── button.ajax-loader-button            "Load more" (ghost pill)
```

**Libraries to retire:** Search & Filter Pro + ElasticPress AJAX (`ys_ajax_loader` POST). Replaced by the
EDS `stories` block over `scripts/query-index.js` (chunk-aware memoized loader) + `listing-logic.mjs`
`paginate`/`sortRows`. No jQuery, no second index fetcher.

**Pager contract (read from `button.ajax-loader-button[data-ys-ajax-loader]`, · 1280):**
- Initial render = **5 cards** (`query_vars.offset: 5`); each Load more appends **6**
  (`query_vars.posts_per_page: 6`). `button_placement: "after"`, `button_label: "Load more"`,
  `dom_target: "#search-results-items-<hash>"`, `ajax_loader_id: "ajax_hp_articles"`,
  `post_type: "post"`, `exclude_carousel_posts: "homepage"` (the promo-box hero posts are excluded so the
  feed never repeats the featured items). Ordering newest-first (first card `data-publish-date`
  `2026-09-10`, descending). This **resolves `template-home.md` §9 open decision**: page size = **first 5,
  then +6 per Load more** (source-confirmed, not infinite scroll).

## 3. Measured visual spec (per band)

Values `getComputedStyle`, cited `(selector · viewport)`. Source URL `https://www.skoda-storyboard.com/en/`
throughout. Card box (radius/shadow/image) is `card-teaser.md`'s; only the **feed grid + Load-more** are
measured here.

**Section band**
- `.cover-box` padding `12px 0`, background `#fff` → `--background-color`; `max-width 1440px` on the
  outer band, inner content capped by the container (· `.cover-box` · 1280/768/500).
- Dark sibling bands use `--section-dark-bg: #0e3a2f`; the Stories feed sits on a **light** band.

**Feed container / grid**
- `.search-results-container` `max-width 1248px` → `--content-max-width`; `padding 0 10px`
  (· 1280/1024/768/500).
- `.search-results-items` `display:flex; flex-wrap:wrap; margin:0 -10px` (negative gutter).
- `.search-results-item` `padding:0 10px`, `margin:0 0 20px` → effective **20px column gutter + 20px row
  gap** → candidate `--grid-gutter: 20px` (shared with `faceted-listing.md`). `box-sizing:border-box`.

**Grid column ladder (measured; flex-basis per cell)**
| Band | `flex-basis` pattern | Layout |
|---|---|---|
| **≥ 992** (1280, 1024, 992) | first 2 cells `50%`, rest `33.3333%` | **featured**: 2-up hero row + 3-up rows |
| **768–991** (768, 991) | all `50%` | uniform **2-col** |
| **< 768** (767, 500) | all `100%` | **1-col** |

- The featured split is **`:nth-child`-driven**, not a modifier class (all `.search-results-item` share
  one class; first two get `50%`). At 1280 that is 2×`624px` + 3×`416px`; at 1024, 2×`512px` + 3×`341px`
  (· `.search-results-item` · per band).
- Breakpoints match the source ladder `768 / 992` (`_FOUNDATIONS.md` §1). No secondary step fires in the feed.

**Heading**
- `h3.search-results-heading` `26px / 32.5 / 600`, color `#161718` (· 1280/768/500) → `--heading-font-size-l`
  (26) + `--weight-semibold`; equals the `--section-heading` template token. Family `SKODA Next` →
  `--heading-font-family`.

**Load-more button** (`button.ajax-loader-button`, invariant across all bands)
- `display:flex`; `padding 8px 48px`; `height 44px` (`min-height 24px`); intrinsic `width ~178px`.
- Font `16px / 24 / 600` → `--body-font-size-m` + `--weight-semibold`, `SKODA Next`; `text-transform:none`;
  `letter-spacing:normal`; color `#161718` → `--skoda-ink`.
- Background `#fff`; border `2px solid #161718`; `border-radius 50px` → `--pill-radius` (shared ghost pill,
  `card-teaser.md` / `faceted-listing.md`). `cursor:pointer`.
- Wrapper `.ajax-loader-button-wrapper` `display:flex; justify-content:center; padding 16px 0`
  (`--spacing-m` top/bottom) (· 1280/1024/768/500).

## 4. Responsive behavior

- **≥ 992px:** featured 5-up (2 large `50%` + 3 small `33.33%`); appended Load-more cards continue the
  `33.33%` 3-up rows (only the first two cells are large).
- **768–991px:** uniform 2-col (`50%`).
- **< 768px:** single column (`100%`), cards full-bleed within the `0 10px` container padding.
- Load-more button geometry is **constant** across bands (pill, `8px 48px`, `height 44px`, centered).
- Gutter/row-gap constant at 20px (negative-margin + cell padding) across bands.

## 5. Interaction states

- **Load more (click):** POST fetch of the next 6 posts, append into `.search-results-items`, advance
  offset. In EDS this is the SKODA-402 `paginate` slice + append, **not** a network POST.
- **Button hover:** background fills `#fff → #f1f1f1` (subtle light grey; **not** a dark fill), border and
  text unchanged; `transition: background-color 0.25s` (measured via real hover · 1280). `#f1f1f1` maps to
  the `--dropdown-hover-bg` candidate token (`_FOUNDATIONS.md` §8).
- **Button `:focus-visible`:** follow the repo's shared button focus ring (no bespoke source ring measured);
  do not remove the outline.
- **Card hover:** owned by `card-teaser.md` (image zoom / toolbar reveal), unchanged here.
- **End state:** when no more results remain, the source removes the button; the EDS block must drop the
  button (not disable-and-leave) when the slice is exhausted.

## 6. Accessibility

- **Heading order:** the feed heading is an `h3` under the page's `h1`; keep it a real heading, not styled text.
- **Announce appended results:** wrap the grid (or a status node) in `aria-live="polite"` so screen readers
  hear the new count / "6 more loaded" after each Load more (source grid is not live; **fix in EDS**).
- **Focus management:** on Load more, move focus to the **first newly-appended card** (or the status node)
  so keyboard users land on the new content, not back at the top.
- **Button:** a real `<button>` (source already uses one), labelled "Load more"; keyboard-activatable;
  visible focus. When removed at end-of-list, return focus to the last card.
- **Contrast:** ghost pill `#161718` on `#fff` and the `26px/600` ink heading on the light band both clear
  4.5:1.

## 7. EDS target

- **Block:** `blocks/stories/stories.{js,css}`, `export default function decorate(block)`; CSS scoped to
  `.stories`. Config via a key/value table (`readConfig`), the pattern `_FOUNDATIONS.md` §7 names for
  index-driven blocks (`stories`, `story-rail`).
- **Reuse (hard requirement):** consume `scripts/query-index.js` (memoized chunk-aware loader) and
  `listing-logic.mjs` `paginate` / `sortRows` from **SKODA-402**. If a facet-less path needs a small
  extract, add it **in** `listing-logic` and depend on it, do **not** duplicate the fetch/paginate logic.
  Verified by grep/import: a single index loader across `stories` + `listing`.
- **DA authoring table (worked example):**

  | stories | |
  |---|---|
  | index | `/en/query-index.json` |
  | template | `story` |
  | offset | `3` |
  | perpage | `6` |
  | initial | `5` |
  | sort | `-publishDate` |
  | columns | `featured` |

  `offset` (3) skips the promo-box's three newest stories after the feed's filters and date sort,
  before pagination; it defaults to 0 when omitted. This is separate from the `offset` URL
  parameter, which records the number of **feed** cards revealed by Load more. With `offset`,
  featured-flag exclusion defaults off to avoid skipping the promo twice (set
  `excludefeatured: true` explicitly to combine them). `initial` (5)
  seeds the first slice; `perpage` (6) sizes each Load more; `columns: featured` selects the
  2-large-then-3-up grid (vs a plain 3-up). Authors omit/add cells → decorate defensively (fall through to
  sensible defaults; never assume a cell exists).
- **`decorate()` outline:** `readConfig(block)` → `{ index, template, offset, initial, perpage, sort, columns }`;
  load rows via `scripts/query-index.js`; `sortRows` (newest-first); render first `initial` `card-teaser`
  cards (first image `createOptimizedPicture` + `fetchpriority="high"`, rest lazy); append a centered
  `<button>` "Load more"; on click `paginate` the next `perpage`, append, move focus to the first new card,
  update the `aria-live` count; `history.pushState` the offset (`offset=<n>`, preserve unrelated params, per
  SKODA-402's URL scheme); `popstate` restores the paged state; remove the button when exhausted.
- **Empty state:** defensive empty message when the filtered set is 0 rows (no cards, no button).

## 8. Open decisions + recommended EDS-native default

- **Page size (RESOLVED):** first **5**, then **+6** per Load more (source `offset:5` / `posts_per_page:6`).
  Recommend `initial: 5`, `perpage: 6` defaults, author-overridable.
- **Featured split (assumption to confirm):** source makes the first two cells `50%` via `:nth-child`.
  Recommend a `columns: featured` variant that does the same in `.stories` CSS; a plain `columns: 3` (no
  large lead) is the fallback if the client prefers a uniform grid. Confirm at build.
- **MR "News" (RESOLVED, measured):** the Media Room home "News" band is a **press-release grid/rail with no
  Load-more button** (measured 2026-09-23), so it is **not** an instance of this block, build it as a rail
  (`carousel-rails.md` / SKODA-212), not the `stories` feed. Only STO `/en/` "Latest Stories" needs `stories`.
- **`exclude_carousel_posts` parity:** source excludes the promo-box hero posts from the feed. In EDS,
  filter out the featured/promo entries (by path or a `featured` flag in the index) so the feed doesn't
  duplicate the promo-box. Confirm the index carries that signal (SKODA-401).

## 9. Pixel-perfect acceptance criteria

WHAT / WHERE / viewport / expected / actual.

- [ ] **Grid columns** / `.stories .search-results-items` (or block grid) / **1280** / featured: cells 1–2
      at `50%`, cells 3+ at `33.33%`; 20px gutter + 20px row gap / ____.
- [ ] **Grid columns** / same / **768** / uniform 2-col (`50%`) / ____.
- [ ] **Grid columns** / same / **500** / single column (`100%`) / ____.
- [ ] **Heading** / `.stories h3` (heading) / 1280 / `26px / 32.5 / 600`, `#161718` / ____.
- [ ] **Load more button** / `.stories button` / all / pill `border-radius 50px`, bg `#fff`, border
      `2px #161718`, `16px/24/600` ink, `padding 8px 48px`, `height 44px`, centered, wrapper `padding 16px 0`
      / ____.
- [ ] **Button hover** / same / 1280 / bg `#fff → #f1f1f1`, `transition background-color .25s`, border/text
      unchanged / ____.
- [ ] **Pager** / block behavior / all / first **5** cards, Load more appends **6**, offset deep-linked via
      `pushState`, `popstate` restores, button removed when exhausted / ____.
- [ ] **a11y** / block / all / appended results announced (`aria-live="polite"`), focus moved to first new
      card, real `<button>`, visible focus / ____.
- [ ] **Reuse** / repo / n/a / single `scripts/query-index.js` loader shared with `listing` (grep/import);
      no forked fetch/paginate / ____.
- [ ] **Visual diff** vs source (STO `/en/` "Latest Stories") at **1280 / 768 / 500** ≤ **2%** per-pixel
      (initial slice + one Load-more append) / ____.

## 10. Reference screenshots

- `assets/stories/1280.png` (featured: 2 large + 3-up, Load more centered) ·
  `assets/stories/768.png` (uniform 2-col) · `assets/stories/500.png` (single column).
