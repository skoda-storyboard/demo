# Component Spec: Series (directory + hub)

Status: **CAPTURED** (measured 2026-09-15 via Chrome DevTools MCP on page id 1; source CSS
cross-checked against `media-room-515d2d102b.css`; reference screenshots saved).
Foundations: [`_FOUNDATIONS.md`](_FOUNDATIONS.md). Method: [`_CAPTURE-PROTOCOL.md`](_CAPTURE-PROTOCOL.md).

## 1. Identity

- **Component:** Series, two surfaces. (a) The **series directory**, a grid of series cards; (b) a
  **series hub**, an overlay hero + a grid of the stories in that series. Both are almost entirely
  **reuse**: [`card-teaser.md`](card-teaser.md) (the card unit) + [`hero.md`](hero.md) (the hub hero).
  This spec captures only the series-specific deltas (grid columns, card fields, image ratio, ordering).
- **EDS block(s):** reuse `cards-overlay` (overlaid title + excerpt) inside a listing grid; hub hero =
  `hero-image` (overlay variant). A thin `series` listing wrapper (index-driven, like `stories`) drives
  both grids. No series-only block is needed.
- **Client PDF IDs:** STO-S01 (Series hero), STO-S03 (Series card), STO-H07 (homepage series rail);
  MR references via the cards family.
- **Ticket:** SKODA-207.
- **Source references + selectors:**
  - Directory: `https://www.skoda-storyboard.com/en/series-2/` · `body.page-template-template-tiles`;
    grid `.panel-grid > .panel-grid-cell`; card `article.article-teaser.has-excerpt`.
  - Hub: `https://www.skoda-storyboard.com/en/series/125-years-of-motorsport/` ·
    `body.single-skoda_series`; hub hero `.hero-image`; story grid `.panel-grid > .panel-grid-cell`.

## 2. Source anatomy

```
DIRECTORY  body.page-template-template-tiles  (SiteOrigin panels)
.panel-grid  (flex row, 1248 wide)
└── .panel-grid-cell   (2 per row = 2 columns; 624px each @1280)
    └── .so-widget-ys-so-widget-post-teaser
        └── article.article-teaser.has-excerpt[data-content-type="Series"][data-publish-date=…]
            ├── a[href="/en/series/{slug}/"]
            │   ├── .image-stretch.ratio-container.round.cover-width.ratio-2x1 > img   (2:1, radius 8px)
            │   ├── .article-teaser-overlay
            │   └── h2.heading                       overlaid white title
            └── .article-teaser-excerpt-wrapper > .article-teaser-excerpt.ddd-truncated   excerpt below

HUB  body.single-skoda_series
├── .hero-image (overlay hero, 61.8vh, white 48px/300 title + .perex)   → see hero.md Variant C
└── .panel-grid > .panel-grid-cell (2 per row) 
    └── article.article-teaser[data-content-type="Story"]   story cards (square 1:1 image, no date)
```

**Two deltas from `card-teaser.md`:** (1) the series **directory card carries a visible excerpt**
(`.article-teaser-excerpt`, absent from the homepage overlay cards); (2) the image ratio is **2:1**
(directory) / **1:1** (hub story cards), not the 16:9 of the standard teaser.

**Re-verified 2026-09-15:** directory container `ratio-2x1` (box `2.07`), hub container `ratio-1x1`
(box `1.00`), 25 series in the directory, 8 stories on the motorsport hub. Read the ratio at the
**`.ratio-container`**, the raw `<img>` reports `~1.5` because it overflows via `object-fit:cover`. This
`page-template-template-tiles` shell is **shared with the press-kit hub** (see `_TEMPLATES.md`).

**Ordering signal (confirmed):** the hub story grid is sorted **newest-first by publish date**
(measured `data-publish-date` descending: `2026-08-27`, `07-21`, `06-18`, `06-11`, `04-23`, `04-10` ·
hub · 1280). The directory order is editorial (SiteOrigin-authored tiles).

**No date on cards (STO-H07 confirmed):** neither the directory card nor the hub story card renders a
visible date. `data-publish-date` exists as an attribute only (`hasDate:false` measured on both).

**Libraries / patterns to retire:** SiteOrigin Panels (`panel-grid` / `panel-grid-cell` / `so-widget-*`)
→ a real CSS grid listing; `dotdotdot` (`.ddd-truncated` JS clamp) → CSS `line-clamp`; `object-fit:fill`
→ `cover`; the `ratio-container` padding-bottom hack → `aspect-ratio`; jQuery.

## 3. Measured visual spec

All rows: `measured (source-url · selector · viewport) → token`. `DIR` = `…/series-2/`,
`HUB` = `…/series/125-years-of-motorsport/`.

### Directory grid (`.panel-grid` / `.panel-grid-cell`)
- `.panel-grid`: `display:flex; width:1248px` (`--content-max-width`) (· DIR · 1280).
- `.panel-grid-cell`: **2 columns** at `≥781` (`624px` each; SiteOrigin's mobile breakpoint is `781px`,
  confirmed by `@media (min-width:781px)` in source CSS) → **1 column** (full width) below `781`
  (measured: cells stack, `768×768` at 768) (· `.panel-grid-cell` · 1280 vs 768).
- 13 rows / 25 series cards; card margin-bottom `64px` → `--spacing-xxl` (· `.article-teaser` · 1280).

### Directory card (`article.article-teaser.has-excerpt`)
- image `.ratio-container.round.ratio-2x1`: **2:1** box, `border-radius:8px` → `--card-radius`,
  `object-fit:fill` (**fix to `cover`**), rendered `604×292` (· DIR · 1280).
- title `h2.heading` (overlaid, in `.article-teaser-overlay`): `font-size:16px; line-height:18px;
  font-weight:500; color:#fff` (· DIR · 1280) → `16px` = `--body-font-size-m` (note: smaller than the
  homepage overlay title `18px`), weight → `--weight-medium`, color → `--skoda-white`.
- excerpt `.article-teaser-excerpt`: `font-size:16px; line-height:24px; font-weight:400; color:#161718`
  (→ `--skoda-ink`), `padding:.5rem; max-height:4rem; overflow:hidden` (2-line clamp via dotdotdot)
  (· `.article-teaser-excerpt` · 1280). Positioned **below** the image (`.article-teaser-excerpt-wrapper`).
- **No date, no toolbar/cart** on the series card (· DIR · 1280).

### Hub hero (`.hero-image`)
- Overlay hero, height **`~633px`** at 1024 viewport-height (= `61.8vh`; matches
  [`hero.md`](hero.md) Variant C) (· HUB · 1280). Real `<img 1920×1281>`, `object-fit:fill`.
- title `.heading`: `font-size:48px; font-weight:300; color:#fff; text-align:start` (· HUB · 1280) →
  reuse `--heading-font-size-hero: 48px`, `--weight-light: 300`, `--skoda-white` (all from `hero.md`).
- `.perex` present (series standfirst).

### Hub story grid (`.panel-grid-cell`)
- Same SiteOrigin **2-col** grid (`≥781`) / 1-col (`<781`) as the directory (· HUB · 1280).
- story card image `.ratio-container.round.cover-height.ratio-1x1`: **1:1** (square), `radius 8px` (· HUB).
- `data-content-type="Story"`; no visible date; ordered newest-first (see §2).

## 4. Responsive behavior

- **Columns:** directory + hub grids are **2-up at `≥781px`**, **1-up below `781px`** (SiteOrigin's
  built-in mobile breakpoint). This is off the canonical ladder (`768 / 992 / 1080`); the rebuild should
  standardize to the source ladder (recommend `1 / 2 / 3` across `768 / 1080`, see §8).
- **Card fields** are fixed size (title `16px`, excerpt `16px`) at every band; the excerpt keeps its
  2-line clamp.
- **Hub hero** follows `hero.md` Variant C responsive rules (61.8vh; title `48px` → smaller on mobile;
  overlaid white).

## 5. Interaction states

- **Card:** whole card is a link to `/en/series/{slug}/` (directory) or the story (hub). Reuse
  `card-teaser.md` §5 states (media hover icon, `:focus-visible` upgrade). No cart/toolbar on series cards.
- **Hero:** non-interactive (no CTA), per `hero.md` §5.

## 6. Accessibility

- One tab stop per card (the card is a single link) with the title as the accessible name; add
  `:focus-visible` (reuse `card-teaser.md` §6).
- Overlaid white title over the image must keep contrast ≥ 4.5:1 (scrim/overlay); confirm on light
  series imagery.
- Grid is a real list (`<ul>/<li>`); the hub `<h1>` is the hero title (one `<h1>` per page, per `hero.md`).
- Excerpt text must not be the only accessible name; keep the title as the link text.

## 7. EDS target

Reuse, don't build new. Directory = a `cards-overlay` listing with the excerpt sub-field; hub = a
`hero-image` (overlay variant) + a `cards-overlay` story grid. A thin index-driven `series` wrapper
(like `stories`, `_FOUNDATIONS` §7) supplies rows: directory reads a `series` index (editorial order);
hub reads the `stories` index filtered by `series == {slug}`, sorted `publisheddate` desc.

### DA authoring model

Directory (`Cards (overlay)` listing, one row per series, excerpt in the body cell):
| (image cell)              | (body cell)                                    |
|---------------------------|------------------------------------------------|
| ![](./motorsport.jpg)     | ## 125 years of Motorsport \n Škoda Motorsport… |

Hub page: a `Hero-image` block (image + `# {series title}` + perex) followed by a `Series` (or
`Story rail`/`Cards`) block:
| Series |             |
|--------|-------------|
| slug   | 125-years-of-motorsport |
| order  | newest      |

### decorate() outline

- **Card:** reuse `cards-overlay.js` (overlay title). Add an **excerpt** pass: a trailing paragraph in
  the body cell → `.cards-overlay-excerpt` below the image with a CSS `line-clamp: 2` (retire dotdotdot).
- **Image ratio:** apply `aspect-ratio: 2 / 1` (directory) / `1 / 1` (hub cards) + `object-fit: cover`
  (fixes the source `fill`); `optimizeImageInPlace` on authored `<picture>`.
- **Grid:** `series` wrapper renders `<ul>` with `grid-template-columns` stepping `1 / 2 / 3` at
  `768 / 1080`; **no visible date** (drop any date paragraph, STO-H07).
- **Hub:** `hero-image` overlay variant (61.8vh, white `48px/300` title) + the story grid sorted newest-first.
- CSS scoped to `.cards-overlay` / `.series`; tokens only.

## 8. Open decisions + recommended default

- **Grid columns:** source is a rigid SiteOrigin `2 / 1` (break at `781`). Recommend a real responsive
  `1 / 2 / 3` across `768 / 1080` for the directory (more use of desktop width) and `1 / 2` for the hub,
  or match source `2 / 1` exactly for pixel parity, assumption to confirm with design.
- **Excerpt:** keep the directory card excerpt (2-line CSS clamp); hub story cards have **no** excerpt
  and **no** date (STO-H07), confirm.
- **Ordering:** hub stories newest-first (measured); directory editorial order (authored), confirm the
  directory isn't meant to be alphabetical.
- **Image ratio:** `2:1` directory, `1:1` hub cards, `object-fit:cover`, assumption to confirm (source
  uses `fill`, which distorts non-native ratios).
- **Tokens:** all reused (`--card-radius`, `--body-font-size-m`, `--weight-medium`, `--skoda-ink`,
  `--skoda-white`, `--spacing-xxl`, `--heading-font-size-hero`, `--weight-light`). No new tokens.

## 9. Pixel-perfect acceptance criteria

Compare EDS render to source at each viewport. Format: WHAT / WHERE / viewport / expected / actual.

- [ ] Directory columns: `.series` grid / **≥781 → 2 cols**, / **<781 → 1 col** (or agreed `1/2/3`).
- [ ] Directory card: image `2:1`, `radius 8px`, `object-fit:cover`; overlaid title `16px / 500 / #fff`;
      excerpt below `16px / 24px / #161718`, 2-line clamp; **no date**.
- [ ] Card margin: `.article-teaser` bottom margin `64px` (`--spacing-xxl`).
- [ ] Hub hero: `.hero-image` overlay `61.8vh`; title white `48px / 300`; perex present (per `hero.md`).
- [ ] Hub story grid: same 2-col grid; story image `1:1`; **no date**; ordered newest-first
      (`publisheddate` desc).
- [ ] Card link: one tab stop per card, title = accessible name; `:focus-visible` ring.
- [ ] A11y: grid is `<ul>/<li>`; single `<h1>` (hub hero title); overlay title contrast ≥ 4.5:1.
- [ ] Visual diff vs source at 1280/1024/768/mobile ≤ 2% per-pixel (excluding image content).

## 10. Reference screenshots

`assets/series/`: `directory-1280.png` (2-col series grid, overlaid titles + excerpts, no dates),
`hub-1280.png` (overlay hero + 2-col story grid). 768/mobile 1-col captures pending.
