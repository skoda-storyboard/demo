# Component Spec: Carousel / Rails

Status: **CAPTURED** (measured 2026-09-15 via Chrome DevTools MCP + source CSS
`media-room-515d2d102b.css`; screenshots saved). **Re-verified live 2026-09-15 via Playwright** at
500/768/1024/1280: cells-per-view ladders, both `data-flickity` configs (promo-box autoPlay 10000 /
watchCSS + `cellAlign:left, groupCells:true, pageDots:false` rails), promo-box static-mosaic-vs-1up
modes, cover-box `opacity:.3` fade, 32px transparent arrows, and the MR-home `pauseAutoPlayOnHover:false`
variance all hold. No corrections.
Foundations: [`_FOUNDATIONS.md`](_FOUNDATIONS.md). Method: [`_CAPTURE-PROTOCOL.md`](_CAPTURE-PROTOCOL.md).
Card unit reused here: [`card-teaser.md`](card-teaser.md).

## 1. Identity

- **Component:** Horizontal teaser rail / slider (a scroll track of cards with prev/next controls,
  drag, and optional dots). The "rail" wraps the [card-teaser](card-teaser.md) unit.
- **EDS block(s):** `carousel` (`blocks/carousel/*`), driven by `story-rail` (`blocks/story-rail/*`),
  which builds a real `carousel` via `buildBlock`.
- **Client PDF IDs:** COM-10 (Slider/Carousel); STO-H01, STO-H03–H08 (homepage category rails +
  models slider); MR-H02–H07 (Media Room rails: Latest news / Images / Videos / Models / Press kits).
- **Ticket:** SKODA-201 (rails part) + `stories` / `story-rail`.
- **Source reference:** `https://www.skoda-storyboard.com/en/` (category rails + models slider +
  featured promo slider) and `https://www.skoda-storyboard.com/en/media-room/` (Flickity rails).
- **Top-level selectors:** `.items.flickity-enabled` / `.search-results-items.flickity-enabled` (the
  track), `.item` / `.search-results-item` (a cell), `.flickity-prev-next-button` (arrows),
  `.flickity-page-dots > .dot` (dots), `.promo-box .items` / `.cover-box .flickity-enabled` (the
  featured hero slider).

## 2. Source anatomy

```
section
├── header  (heading h2 + optional a.link-all "view all")
└── .items[data-flickity]  ->  .items.flickity-enabled.is-draggable   (Flickity boots it)
    ├── .flickity-viewport            (overflow:hidden; touch-action:pan-y)
    │   └── .flickity-slider          (absolute track that Flickity translates)
    │       ├── .item / .search-results-item   (a cell; wraps one .article-teaser card)
    │       └── .item.item-all         ("show all" tail cell; display:block only when enabled)
    ├── button.flickity-prev-next-button.previous   (icon-font arrow \e00b)
    ├── button.flickity-prev-next-button.next       (icon-font arrow \e00c)
    └── .flickity-page-dots > .dot                   (only rendered on some rail types)
```

**Libraries actually running (verified live):** `window.Flickity` is defined and every rail on
`/en/` renders as `.flickity-enabled.is-draggable` (7 rails · `/en/` · 1280). `window.jQuery.fn.owlCarousel`
**is loaded but not used** to render these rails (owl DOM count = 0 · `/en/` · 1280); Owl survives only
as a dependency other legacy widgets pull in. No `skoda-carousel` / `.skoda-slider` nodes exist
(count = 0 · `/en/`). jQuery underpins all of it.

**Libraries to retire (do not port):** Flickity, Owl Carousel, `skoda-carousel`, jQuery. Replace with
the existing vanilla `carousel` block: native `overflow-x` scroll track + CSS `scroll-snap` +
pointer-drag + rAF-gated arrow state (see `blocks/carousel/carousel.js`). No JS animation loop.

**Two source card styles inside a rail** (already handled by `carousel.js`): dated POST rails render
the title overlaid white on the image (like `cards-overlay`); TAXONOMY rails (Models / Series) render
a bold title below a wide letterbox image, no date. `carousel.js` detects the date paragraph and tags
`.carousel-overlay` / `.carousel-caption`.

## 3. Measured visual spec

All values `measured (source-url · selector · viewport) -> token`. `HP` = `https://www.skoda-storyboard.com/en/`,
`MR` = `https://www.skoda-storyboard.com/en/media-room/`.

### Track / cell sizing (the core "items-per-view")
Cells are sized by percentage width; the gutter is a container `margin: 0 -10px` with `padding: 0 10px`
per cell = a **20px effective gap** (· `.items` / `.item` · MR source CSS).

Standard rails (`.images / .models / .videos .items.flickity-enabled .item`, and the homepage
`.search-results-items` rails, which measure identically):

| Viewport | cell width (CSS) | measured cell px | items-per-view (measured) |
|---|---|---|---|
| 1280 (>=992) | `22.5%` | `281px` (railW 1248) | **4.44** (~4 + peek) (· HP · 1280) |
| 768 (768–991) | `30%` | `230px` (railW 768) | **3.33** (· HP · 768) |
| <768 (≈500 floor) | `90%` | `450px` (railW 500) | **1.11** (1 + peek next) (· HP · 500) |

Content-heavy rails (`.attachments / .news .items.flickity-enabled .item`): `90%` (<768) / `45%`
(>=768, ~2.2/view) / `30%` (>=992, ~3.3/view) (· MR source CSS).

Featured hero slider = the **`.promo-box`** at the top of `/en/` and `/en/media-room/` (impression
context "Media Room - Promo box"), plus `.cover-box .flickity-enabled`. **This is NOT the ad-server
banner** (`.side-banner` / `promo-banner.md`); it is a featured-story showcase built from
[card-teaser](card-teaser.md) `article-teaser` cards. **It behaves differently per breakpoint (this is
the key, easily-missed behavior, verified live 2026-09-15):**
- **`>= 768` (desktop/tablet): a STATIC mosaic grid, no carousel, no rotation.** `watchCSS:true` keeps
  Flickity un-booted here (`@media (min-width:768px){ .promo-box .items:after{content:""} }`), so it lays
  out as a float grid: first item `66.66%` (measured promo cell `832px` at 1280, `entry-title 1.85em/400`,
  summary shown), items 2 and 3 `33.33%` stacked on the right (`16:9`). No autoplay, no arrows, no dots.
- **`< 768` (mobile): Flickity boots into a 1-up auto-rotating carousel.** Default rule
  `.promo-box .items:after{content:"flickity"}` activates it; below 768 only the first item shows until
  boot (`.item+.item{display:none}` @ `max-width:767px`), then `.flickity-enabled .item+.item{display:block}`.
  **Auto-rotation config (inline `data-flickity`, not in CSS, so a CSS-only capture misses it):**
  `{ autoPlay: 10000, pauseAutoPlayOnHover: true, prevNextButtons: false, watchCSS: true }`
  (also `data-rotate="10000" data-pause="hover"`). So: **advances every `10s`, pauses while hovered/touched,
  no prev/next arrows (dots only), one slide per view.**
- Non-selected slides in the `.cover-box` variant fade to `opacity:.3` with `transition:opacity .5s
  ease-in-out` (· `.cover-box .flickity-enabled .item` · MR source CSS).
`.cover-box.dark` band background `#0e3a2f` -> `--skoda-green`.

### Arrows (`.flickity-prev-next-button`)
- Base Flickity: `44px × 44px`, `top:50%`, `translateY(-50%)`, `.previous{left:10px}` /
  `.next{right:10px}` (· base CSS lines 33–37).
- Škoda theme override: `width/height: 2em` = **`32px × 32px`** (measured · HP · 1280),
  `border-radius: 50%`, background `transparent`, icon-font glyphs `content:"\e00b"` (prev) /
  `"\e00c"` (next) on a `#161718` disc (`transform:scale(.95)`), `transition: opacity .3s ease-in-out`
  (· MR source CSS lines 783–797).
- **State:** `:disabled{opacity:0}` (arrow hides at the track ends). `:hover` background stays
  transparent (`.flickity-button,.flickity-button:hover{background:transparent}`). No token for the
  32px control size or the icon disc -> **candidate** `--carousel-arrow-size: 32px`.
- No token: EDS block currently uses `40px` with a `background-color` disc + box-shadow
  `0 1px 6px rgb(0 0 0 / 20%)` (`carousel.css`). Divergence from source (32px, transparent, ink disc);
  reconcile (see §8).

### Dots (`.flickity-page-dots .dot`)
- `10px × 10px`, `border-radius:50%`, `margin: 0 8px`, background `#d8d8d8`, `.is-selected` background
  `#686868`, container `bottom:-2em` (· MR source CSS lines 799–807). `.dot:only-child{display:none}`.
- Colors have no token -> **candidate** `--carousel-dot: #d8d8d8`, `--carousel-dot-active: #686868`.
- Live: the homepage category rails render **no** dots (`hasDots:false` · HP · 1280); dots appear on
  the Media Room single-slide / cover-box contexts. Treat dots as an optional variant, not default.

### Card image aspect inside a rail
Overlay (dated) cards: card box ~16:9. Taxonomy (Models) cards: wide letterbox; EDS uses
`aspect-ratio: 383 / 150` (≈2.55) in light sections, default `3/2` in dark (Series) (· `carousel.css`).
Card radius `8px` -> `--card-radius`. See [`card-teaser.md`](card-teaser.md) §3 for the card interior.

## 4. Responsive behavior

Source ladder (matches `_FOUNDATIONS` §1: `768 / 992`):
- **<768:** cells `90%` (1 + peek), content rails `90%`; promo slider shows first item only until boot;
  arrows still present (measured visible at 500). 20px gap.
- **768–991:** cells `30%` (3.3/view); content rails `45%` (2.2/view).
- **>=992:** cells `22.5%` (4.4/view); content rails `30%` (3.3/view). Content caps at `1248px`
  (`--content-max-width`).

> **Parity mismatch to fix.** `blocks/carousel/carousel.css` breaks at `900px` and `600px` with
> `4 -> 2 -> 1.3` cells and a `24px` gap. The source breaks at `768 / 992` with `~4.4 -> 3.3 -> 1.1`
> cells and a `20px` gap. Adopt the source ladder + `20px` gap for parity (see `_FOUNDATIONS` §1).

## 5. Interaction states

- **Drag / swipe:** `.flickity-enabled.is-draggable .flickity-viewport{cursor:grab}` ->
  `.is-pointer-down{cursor:grabbing}` (· base CSS 11–15). EDS reproduces with pointer-capture drag +
  `cursor:grab/grabbing` and suppresses the post-drag click (`carousel.js` `enableDrag`).
- **Touch:** `touch-action: pan-y` on the viewport (vertical page scroll preserved, horizontal owned
  by the track). EDS matches (`.carousel-track{touch-action:pan-y}`).
- **Arrows:** fade `opacity .3s` (source) / `.2s` (EDS); `disabled` -> `opacity:0` at ends.
- **Scroll-snap:** EDS adds `scroll-snap-type:x mandatory` + `scroll-snap-align:start` (source relies
  on Flickity's JS snap; the CSS-snap rebuild is the intended replacement).
- **Autoplay (corrected 2026-09-15):** the standard category/listing rails do **not** autoplay
  (verified: their `data-flickity` has no `autoPlay`, they use arrows). **BUT the `.promo-box` featured
  slider DOES auto-rotate** on mobile: inline `data-flickity={autoPlay:10000, pauseAutoPlayOnHover:<varies>,
  prevNextButtons:false, watchCSS:true}` (+ `data-rotate="10000" data-pause="hover"`). It advances every
  `10s`, has no arrows (dots only), and only runs `< 768` where `watchCSS` boots Flickity (at `>= 768` the
  promo-box is a static mosaic, see §3). The earlier "none observed" was a CSS-only-capture miss (autoplay
  lives in the inline attribute, not the stylesheet). EDS: the rebuilt `promo-box`/featured block needs a
  `setInterval` rotation (`10s`) with pause-on-hover/focus and `prefers-reduced-motion` respected, active
  only in the mobile 1-up mode.
  - **Per-home variance (verified live 2026-09-15):** the Storyboard-home promo-box sets
    `pauseAutoPlayOnHover:true`; the **Media-Room-home promo-box sets `pauseAutoPlayOnHover:false`** (does
    not pause on hover). The EDS build should still **pause on hover/focus** (a11y/reduced-motion), treat
    the source `false` as an inconsistency to normalize, not to replicate.
- **`.cover-box` rails config (verified live 2026-09-15):** the home category/news/models/stories rails
  use `data-flickity={cellAlign:"left", groupCells:true, pageDots:false}` = grouped-cell paging, arrows,
  **no dots, no autoplay**. Only the promo-box auto-rotates. (The featured `.cover-box .flickity-enabled`
  variant still fades non-selected cells to `opacity:.3`, see §3.)

## 6. Accessibility

- Arrows are real `<button type="button">` with `aria-label` ("Previous" / "Next"), EDS already does
  this; source uses Flickity buttons with SVG icon (acceptable, keep labels).
- Track should expose `role="region"` + `aria-label` (the rail heading) and be keyboard-scrollable;
  add `aria-roledescription="carousel"` optional. Focusable cards must remain reachable in DOM order.
- Dots (when present) must be `<button>` with `aria-label="Go to slide N"` and reflect selection with
  `aria-current`. Source uses `text-indent:-9999px` labels (screen-reader-hostile), a gap to fix.
- Drag must not trap keyboard users: arrows + native focus scrolling cover keyboard nav.
- Respect `prefers-reduced-motion`: keep `behavior:smooth` scroll but skip any decorative fade.

## 7. EDS target

Block: `carousel` (static authored rail) and `story-rail` (index-driven rail that builds a `carousel`).
Follow repo conventions (`_FOUNDATIONS` §7): one card per row; cells classified by content sniffing
(image cell = single child with `<picture>`; else body); `optimizeImageInPlace` on authored images;
`createOptimizedPicture` for index-synthesized ones; tokens-only CSS scoped to `.carousel`.

### DA authoring tables (worked examples)

Static `Carousel` (one row per card; overlay style auto-detected when a date paragraph is present):
| (image cell)          | (body cell)                         |
|-----------------------|-------------------------------------|
| ![](./media_1.jpg)    | 3. 9. 2026 \n ### Story one title    |
| ![](./media_2.jpg)    | 1. 9. 2026 \n ### Story two title    |

Taxonomy `Carousel` (no date -> `.carousel-caption`, bold title below wide image):
| ![](./enyaq.jpg)      | ### Enyaq |
| ![](./elroq.jpg)      | ### Elroq |

`Story rail` (index-driven, key/value config; builds a `carousel`):
| Story rail |             |
|------------|-------------|
| category   | emobility   |
| limit      | 10          |
| exclude    | teaser      |

### decorate() outline
- `carousel.js`: rows -> `<ul>/<li>`; classify cells; detect date -> `carousel-overlay` else
  `carousel-caption`; build `viewport > [prev, track(ul), next]`; `enableDrag`; rAF-gated
  `updateArrows` via `scroll` + `ResizeObserver`; `optimizeImageInPlace`.
- `story-rail.js`: `readConfig` (index/category/limit/exclude) -> `loadQueryIndex` (memoized) ->
  filter by template=story + category, drop slugs already shown above (featured promo + `stories`
  grid), sort by `publisheddate` desc, slice; **defer** the `buildBlock('carousel', rows)` +
  `decorateBlock` + `loadBlock` behind an `IntersectionObserver` (`rootMargin:'600px 0px'`) so the
  4+ rails don't all build on load; degrade silently on any failure. Reserve `min-height:190px` to
  avoid CLS until built.

## 8. Open decisions + recommended default

- **Arrow size / style:** source is `32px`, transparent, ink icon-disc; EDS ships `40px` white disc +
  shadow. **Recommend** aligning EDS to `32px` and adding `--carousel-arrow-size: 32px`,
  `--carousel-arrow-shadow` (assumption to confirm, the white-disc EDS variant may read better on
  photographic rails; pick one and tokenize).
- **Gap + breakpoints:** adopt source `20px` gap and `768 / 992` ladder over the current
  `24px` + `900 / 600` (assumption to confirm; needed for pixel parity).
- **Dots:** default off (homepage rails have none); expose a `carousel (dots)` variant with tokens
  `--carousel-dot`/`--carousel-dot-active`.
- **Autoplay:** default off (no source evidence). Confirm with client.
- **New tokens:** `--carousel-arrow-size: 32px`, `--carousel-dot: #d8d8d8`,
  `--carousel-dot-active: #686868`, `--carousel-gap: 20px`.

## 9. Pixel-perfect acceptance criteria

Compare EDS `/en` render to source at each viewport. WHAT / WHERE / viewport / expected / actual.

- [ ] Items-per-view: `.carousel li` / 1280 / **~4.4** visible (cell ≈`22.5%`, `281px` @1248 track).
- [ ] Items-per-view: `.carousel li` / 768 / **~3.3** visible (cell `30%`, `230px`).
- [ ] Items-per-view: `.carousel li` / <768 / **~1.1** visible with next peeking (cell `90%`).
- [ ] Gap: `.carousel ul` / all / effective inter-card gap = **`20px`**.
- [ ] Arrow: `.carousel-arrow` / all / `32×32`, `border-radius:50%`, at track edges; `opacity:0` when
      disabled (start disables prev, end disables next).
- [ ] Dots (dots variant only): `10×10`, `#d8d8d8`, selected `#686868`; hidden when single page.
- [ ] Drag: track scrolls on pointer-drag; post-drag click on a card is suppressed (no navigation).
- [ ] Touch: `touch-action:pan-y`, vertical page scroll unaffected while swiping horizontally.
- [ ] Taxonomy rail: `.carousel-caption` img aspect `383/150` in light sections; title below, bold.
- [ ] story-rail: builds a `.carousel`, defers build until near viewport, no repeat of stories shown
      in the featured promo / `stories` grid; reserves height (no CLS).
- [ ] Promo-box mode: `.promo-box` / `>=768` / **static mosaic** (1 big `66.66%` + 2 small `33.33%`,
      no rotation, no arrows); / `<768` / **1-up auto-rotating carousel** advancing every `10s`, pausing
      on hover/touch, dots only (no arrows), respecting `prefers-reduced-motion`.
- [ ] A11y: arrows are labeled `<button>`; track keyboard-scrollable; dots (if any) `aria-current`;
      promo-box autoplay pausable and reduced-motion-safe.
- [ ] Visual diff vs source at 1280/768/mobile <= 2% per-pixel (excluding image content).

## 10. Reference screenshots

`assets/carousel-rails/`: `homepage-1280.png` (full page, all rails), `homepage-rail-mobile-500.png`
(1-card-peek mobile state). Mid-scroll + dots-variant captures pending.
