# Component Spec: Press Kit Template (header + structured narrative)

Status: **CAPTURED** (measured 2026-09-15 via Chrome DevTools MCP on page id 1; source CSS
cross-checked against `media-room-515d2d102b.css`; reference screenshots saved).
Foundations: [`_FOUNDATIONS.md`](_FOUNDATIONS.md). Method: [`_CAPTURE-PROTOCOL.md`](_CAPTURE-PROTOCOL.md).

This is a **template / assembly** spec. It measures the press-kit shell (overlay hero header + the
ordered chapter set + the chapter sub-nav) and delegates the per-chapter internals to atomic specs:
grouped media → [`press-kit-media.md`](press-kit-media.md); FAQ → [`faq-accordion.md`](faq-accordion.md);
variant subsection → [`press-kit-variant.md`](press-kit-variant.md); rich text → [`story-detail.md`](story-detail.md);
hero → [`hero.md`](hero.md); tiles → [`card-teaser.md`](card-teaser.md).

## 1. Identity

- **Component:** Press Kit detail template, the structured, more-controlled page type behind a model
  launch. On the live source it is a **tiles landing page** (overlay hero + a grid of chapter tiles),
  where each chapter tile links to its own sub-page (`press_kit-template-default`, a story-detail-style
  two-column article). The chapters follow a fixed narrative sequence.
- **EDS block(s):** page = `hero-image` (overlay Variant C) + a chapter **tile grid** (`cards-overlay`)
  + stacked default-content narrative sections + a sticky **chapter-nav** (new). Sub-parts reuse
  `downloads`/`media-cart` (media groups), an `accordion` block (FAQ), `tags`, `carousel`/`story-rail`.
- **Client PDF IDs:** MR-PK01 (Press-Kit Header), MR-PK02 (Structured Narrative); requirements §11.8.
- **Ticket:** SKODA-805 (composes SKODA-806/807/808; parser feeds SKODA-803).
- **CPT nuance (verified live 2026-09-15):** the rendered pages are a real `press_kit` post type,
  `body.single-press_kit`, hub = `press_kit-template-template-tiles`, sub-pages = `press_kit-template-default`.
  The oft-repeated "press_kit is not a CPT" is **REST-API-only** (`wp/v2/press_kit` 404); for the page
  template / import, treat it as its own type. The chapter tiles + sub-pages (incl. the media groups) are
  **separate URLs**, verified: Introduction/Exterior/Interior/Battery/Safety/Connectivity + Sportline
  variant + FAQ + Texts + Infographics + Technical data + Images + Videos (13 tiles).
- **Source references (URLs used):**
  - Listing: `https://www.skoda-storyboard.com/en/press-kits/`
  - Kit landing (tiles): `https://www.skoda-storyboard.com/en/press-kits/skoda-peaq-press-kit/`
  - Narrative sub-page (Introduction): `https://www.skoda-storyboard.com/en/press-kits/skoda-peaq-press-kit/the-skoda-peaq-skodas-new-flagship-expanding-the-brands-electric-portfolio/`
- **Top-level selectors:** `article.press_kit > .hero` (overlay header), `article.press_kit > .content`
  (the tile grid), `.panel-grid.panel-no-style` (a tile row), `article.article-teaser` (a chapter tile),
  `.columns > .column-primary`/`.column-secondary` (sub-page article shell), `.chapter-nav` (chapter
  sub-nav).

## 2. Source anatomy

The kit **landing** page (`body.press_kit-template-template-tiles`, `postid-445836`) is an overview of
tiles, not the prose itself:

```
article.press_kit  (facet classes: model-peaq bodywork-suv category-press-kits technology-* years-*)
├── .hero                                        the header (overlay hero, hero.md Variant C)
│   ├── .hero-image.ratio-container.ratio-16x9.cover-width.snap-center > img   real <img>, scrim ::after
│   └── .hero-caption   (absolute, white)        h1.heading (title) + .perex (standfirst) [+ date/model]
└── .content
    └── .panel-grid.panel-no-style (flex, width 1248, justify space-between)   a ROW of chapter tiles
        └── .so-panel.widget_ys-so-widget-post-teaser
            └── article.article-teaser  (a chapter TILE = cards-overlay card linking to a sub-page)
                ├── .ratio-container.ratio-2x1 | .ratio-1x1 > img   tile image (mixed aspect)
                └── .article-teaser-overlay > h2.heading            white overlay title
```

Each chapter **sub-page** (`body.press_kit-template-default`, e.g. `postid-445847`) is a story-detail
clone:

```
.chapter-nav.affix-top   ("Chapters" toggle nav; lists all chapters; affixes on scroll; 44px tall)
main > article > .columns  (display:flex; flex-wrap:wrap; width 1248)
├── .column-primary   (66.6667% → 832px @1280)   h1.entry-title + rich text + inline media-box
└── .column-secondary (33.3333% → 416px @1280)   subscribe / tags / related (story-detail.md sidebar)
```

**Fixed narrative sequence (measured tile + heading order on the Peaq landing):**
Introduction → Exterior → Interior → Battery and powertrain variants → Safety and assistance systems →
Connectivity → **[variant]** Škoda Peaq Sportline → **[FAQ]** Frequently Asked Questions →
**[media]** Texts → Infographics → Technical data → Images → Videos.

**Libraries / patterns to retire:** SiteOrigin Panels (`.panel-grid`/`.so-panel`/`widget_ys-so-widget-post-teaser`),
the WordPress `press_kit-template-template-tiles` PHP template + per-chapter WP sub-pages, jQuery, the
`.hero-image` `ratio-container`/`object-fit:fill`/`cover-width` hacks, the icon-font chapter-nav toggle,
the `attachment-giant` sizing classes.

## 3. Measured visual spec

All rows: `measured (source-url · selector · viewport) → token`. `LANDING` = the kit landing URL,
`SUB` = the Introduction sub-page URL.

### Header / overlay hero (`.hero`), reuse [`hero.md`](hero.md) Variant C
- `.hero-image.ratio-16x9.cover-width.snap-center`: **height is band-dependent (re-verified live 2026-09-15).**
  At `≥768` it's **`61.8vh`** (measured `632.828px` @1280×1024 and `632.828px` @768×1024, both = `0.618 × 1024`)
  → reuse `--hero-vh: 61.8vh`. At `≤767` the `vh` override drops and it falls back to the true **16:9 box**
  (`padding-bottom:56.25%` of width): measured `431.438px` @767 and `281.25px` @500 (= `0.5625 × width`, not `61.8vh`)
  (· LANDING · `.hero-image` · 1280/768/767/500). `position:relative`. Breakpoint = **768** (same as the title
  drop, below). The earlier single `281px @500 = 61.8vh` reading was wrong; @500 the box is 16:9, not `61.8vh`.
- Scrim: `.hero-image::after` dual gradient (per hero.md) → `--scrim-h`/`--scrim-v`.
- Title `.hero-caption .heading`: `48px / 52.8px / weight 300 / #fff` @1280 (· LANDING · 1280) →
  `--heading-font-size-hero: 48px`, `--weight-light: 300`, `--skoda-white`. Drops to **`28px`** @768/500.
- Caption `.hero-caption`: `position:absolute; color:#fff; background:transparent; text-align:start`
  (· LANDING · 1280), overlaid bottom-left.
- Perex `.hero-caption .perex`: `20px / weight 600 / #fff` (· LANDING · 1280) → `--body-font-size-*`
  (20px has no token; between `-m 16` and headings) → candidate `--perex-font-size: 20px`,
  `--weight-semibold`.
- Date / model / category: the Peaq header caption carries only title + perex; the `data-publish-date`,
  `model-*`, `bodywork-*`, `category-*` live as **classes/attributes on `article.press_kit`** (see §internal
  categorization, [`press-kit-variant.md`](press-kit-variant.md) §3), surfaced in listing cards, not printed
  in the header. Header prints title + perex only (· LANDING · `.hero-caption` · 1280).

### Chapter tile grid (`.content .panel-grid`), reuse [`card-teaser.md`](card-teaser.md) cards-overlay
- Grid row `.panel-grid.panel-no-style`: `display:flex; justify-content:space-between; width:1248px`
  (· LANDING · `.panel-grid` · 1280) → `--content-max-width: 1248px`.
- Tile `article.article-teaser`: overlay card (media layer + `.article-teaser-overlay` white title). The row
  is a **`flex; justify-content:space-between; flex-wrap:wrap`** run, **not a fixed N-per-row grid**
  (corrected 2026-09-15). Tile widths are **mixed by aspect**: the two `ratio-2x1` feature tiles are `479px`
  wide, the eleven `ratio-1x1` square tiles are `230px` wide (· LANDING · 1280). Because widths differ, the
  measured per-row layout @1280 is **3 / 5 / 5**: row 1 = 2 feature + 1 square (Introduction, Exterior,
  Interior), rows 2-3 = 5 squares each. Same 3/5/5 pattern holds @1024 (feature `390`, square `185`),
  @900 (`340`), @800 (`300`). The old "3 tiles per row / tile 479px" reading only described row 1.
- Tile image aspect is **mixed**: Introduction + Exterior = `ratio-container.ratio-2x1` (2:1 wide,
  feature tiles); all other chapters = `ratio-1x1` (1:1 square) (· LANDING · `.ratio-container` · 1280).
- Tile title `.article-teaser-overlay .heading`: `16px / 18px / weight 500 / #fff`, `position:absolute`
  (· LANDING · `.heading` · 1280) → `--heading-font-size-xs: 16px`, `--weight-medium: 500`, cards-overlay.

### Chapter sub-nav (`.chapter-nav`), NEW
- `.chapter-nav.affix-top`: `position:relative; top:0; z-index:5; width:1280; height:44px`
  (· SUB · `.chapter-nav` · 1280); gains `.affix-top` → sticky/affixed on scroll (source `affix` plugin).
- Header `.chapter-nav-header`: `padding:0 10px; font-size:16px; weight 400; height:44px`; a
  `a.link-chapters.toggle` labelled **"Chapters"** expands `.chapter-nav-body` listing every chapter
  link (Introduction … Videos) (· SUB · 1280). 44px reuses `--nav-main-height` idiom (candidate
  `--chapter-nav-height: 44px`).

### Narrative sub-page shell (`.columns`), reuse [`story-detail.md`](story-detail.md)
- `.columns`: `display:flex; flex-wrap:wrap; width 1248` (· SUB · 1280).
- `.column-primary`: `66.6667%` → **832px** @1280 (· SUB · 1280) → wide reading column.
- `.column-secondary`: `33.3333%` → **416px** @1280 (· SUB · 1280).
- Sub-page title `h1.entry-title`: `26px / 32.5px / weight 600 / #0a0a0a` (· SUB · 1280) →
  `--heading-font-size-l: 26px`, `--weight-semibold`, `#0a0a0a ≈ --skoda-ink` (press-release heading,
  same as [`hero.md`](hero.md) Variant D, **sub-pages have no overlay hero**).
- Rich text `p`: `16px / 24px / weight 400 / #161718; margin-bottom 20px` (· SUB · `.textwidget p` · 1280)
  → **identical to [`story-detail.md`](story-detail.md) §3, no delta** (`--body-font-size-m`, `--skoda-ink`,
  `--weight-regular`, candidate `--prose-paragraph-gap: 20px`). Headings, lists, figures, blockquote,
  in-body media all reuse story-detail.md (delegated).

## 4. Responsive behavior

- **Hero:** `61.8vh` box at `≥768`; at `≤767` it collapses to a true **16:9 width box** (`56.25%` of width,
  `431px` @767, `281px` @500), **not** `61.8vh` (corrected 2026-09-15). Title `48px → 28px` at **≤767**
  (measured 48px @768, 28px @767 and @500). Both switch at the **768** breakpoint.
- **Tile grid:** multi-column **flex-wrap** (3/5/5 rows, mixed feature/square widths) holds down to `≥800`;
  it collapses to **1 across (full-width)** at **`≤780`** (the SiteOrigin Panels mobile breakpoint), **not
  992** (corrected 2026-09-15: measured `perRow` = [3,5,5] @1280/1024/900/800, all-1 @780/768/500; tile
  `748px` @768/780, `480px` @500). For the rebuild adopt the card-teaser grid ladder (`768 / 992`) rather
  than porting the SiteOrigin `~780` literal.
- **Sub-page shell:** two-column `66.66 / 33.33` at `≥768`, stacked below content at `<768` (per
  story-detail.md §4).
- **Chapter-nav:** full-width 44px bar; affixes to top on scroll (both landing and sub-pages).

## 5. Interaction states

- **Tiles:** whole card is a link to the chapter sub-page; hover/focus per [`card-teaser.md`](card-teaser.md) §5
  (media `:after` icon fade). Add a `:focus-visible` ring (source relies on browser default).
- **Chapter-nav "Chapters" toggle:** click expands/collapses the chapter list; affixes on scroll.
- **Hero:** static (no CTA, no hover), per hero.md Variant C.
- Rich-text, FAQ, media, variant states → delegated to the atomic specs.

## 6. Accessibility

- One `<h1>` per page: kit landing `<h1>` = hero title; each sub-page `<h1>` = `entry-title`. Body
  chapter headings start at `<h2>` and nest correctly.
- Chapter tiles: one accessible link name per tile (the chapter title); one tab stop per tile; visible
  `:focus-visible`; non-empty `alt` (source ships `alt=""` on tile images, an a11y gap to fix).
- Chapter-nav: real `<nav aria-label="Chapters">` with a `<button aria-expanded aria-controls>` toggle;
  anchor links move focus to the target section heading; keyboard operable.
- Overlay hero title must clear 4.5:1 contrast on the scrim (per hero.md).
- Preserve `fetchpriority="high"` + `loading="eager"` on the hero `<img>` (LCP).

## 7. EDS target

**One press-kit page per kit** (EDS-native): section metadata `template=press-kit`. Structure:
`hero-image` (overlay) → optional chapter **overview tile grid** (`cards-overlay`, links to in-page
anchors) → the ordered narrative sections as **default-content** (heading + rich text + inline media) →
variant subsection(s) ([`press-kit-variant.md`](press-kit-variant.md)) → FAQ (`accordion`,
[`faq-accordion.md`](faq-accordion.md)) → grouped media ([`press-kit-media.md`](press-kit-media.md)) → a
sticky **chapter-nav** built from the section headings. The **press-kit parser** (SKODA-803 feed) detects
`press_kit` source pages, pulls each chapter sub-page's prose into a keyed section, drops SiteOrigin
chrome, and emits one Metadata block (`template, model, bodywork, category, date`).

### DA authoring model (worked example)

Page = default-content sections keyed by `##` headings, in the fixed order; each optional. A `Metadata`
block carries the facets. A `Section Metadata` `Style: press-kit-chapter` marks a chapter anchor.

```
# Škoda Peaq – Press Kit            ← hero-image (overlay) heading cell + image
## Introduction                     ← default section (rich text)
## Exterior
## Interior
## Battery and powertrain variants  ← omit on a combustion kit (degrades cleanly)
## Safety and assistance systems
## Connectivity
[ Press Kit Variant ]               ← block, press-kit-variant.md
[ Accordion (faq) ]                 ← block, faq-accordion.md
[ Press Kit Media ]                 ← block, press-kit-media.md
| Metadata |                        |
| template | press-kit             |
| model    | Peaq | bodywork | SUV | category | Press kits | date | 2026-06-23 |
```

### `decorate()` / build outline (repo conventions, `_FOUNDATIONS` §7)

1. `hero-image` decorates the overlay header (`optimizeImageInPlace`, `fetchpriority`); Variant C class.
2. Optional `cards-overlay` overview grid: synthesize one card per `## chapter` heading → anchor link
   (`createOptimizedPicture` for tile thumbs); mixed `ratio-2x1`/`ratio-1x1` via a `feature` class on
   the first two.
3. Narrative sections render as default section content; a small `chapter-nav.js` collects the
   `h2` headings into a sticky `<nav>` with a "Chapters" toggle (anchor links + `:target`/scroll-spy).
4. Compose the variant / FAQ / media blocks in source order; omitted chapters simply absent (no empty
   heading, AC below).
5. CSS scoped to `.press-kit` / `.chapter-nav`; tokens only; grid ladder `768 / 992`.

## 8. Open decisions + recommended default

- **Fixed vs conditional sections, RESOLVED → optional/conditional (superset).** Evidence: on the live
  Peaq kit every chapter is an **independently authored tile + sub-page** (`article.article-teaser` →
  distinct `postid-*`), not a required field of one record. A combustion kit that lacks "Battery and
  powertrain variants" would simply omit that tile/section with no structural break. Recommend authoring
  the sequence as an **ordered superset of optional sections keyed by heading**; the template renders the
  ones present, in canonical order. (Assumption to confirm with business, but the source structure proves
  omission is native.)
- **Landing model:** source uses a tiles landing + per-chapter sub-pages. Recommend the EDS-native
  **single page with stacked sections + a chapter overview tile grid + sticky chapter-nav** (one URL per
  kit, anchors per chapter) rather than porting the WP sub-page tree, simpler authoring, one Metadata
  record, better for import (assumption to confirm).
- **Header metadata display:** source header prints title + perex only; model/bodywork/category/date live
  as metadata (feed facets). Recommend keeping the header visual to title + perex, exposing date/model as
  optional caption meta if the client wants it printed (assumption to confirm).
- **New/reused tokens:** reuse `--hero-vh: 61.8vh`, `--heading-font-size-hero: 48px`, `--weight-light: 300`,
  `--content-max-width: 1248px`, `--heading-font-size-l: 26px`, `--heading-font-size-xs: 16px`,
  `--weight-medium: 500`, `--body-font-size-m`, `--skoda-ink`, `--prose-paragraph-gap: 20px`; add
  candidate `--perex-font-size: 20px`, `--chapter-nav-height: 44px`.

## 9. Pixel-perfect acceptance criteria

Compare EDS render to source at each viewport. WHAT / WHERE / viewport / expected / actual.

- [ ] Header: overlay hero `.hero-image` = **`61.8vh`** box @≥768 / **16:9 width box** (`56.25%`) @≤767,
      scrim present; title `48px / weight 300 / #fff` @≥768, `28px` @≤767; perex `20px / weight 600 / #fff`.
- [ ] Section order: rendered chapters follow **Introduction → Exterior → Interior → Battery/powertrain →
      Safety → Connectivity → [variant] → [FAQ] → [Texts → Infographics → Technical data → Images → Videos]**.
- [ ] Omission: a missing chapter (e.g. Battery/powertrain) leaves **no empty heading, no layout gap**.
- [ ] Tile grid: `.press-kit-overview` / multi-column flex-wrap @≥800 (source measured 3/5/5 rows: first
      two `ratio-2x1` feature tiles, rest `1:1` squares) / `1 across` full-width @≤780; overlay title
      `16px / 18px / weight 500 / #fff`.
- [ ] Chapter-nav: full-width `44px` "Chapters" nav; affixes to top on scroll; anchor links reach each
      section; keyboard operable + `aria-expanded`.
- [ ] Sub-section rich text: `p` = `16px / 24px / weight 400 / #161718`, `margin-bottom 20px`
      (parity with story-detail.md, no delta); sub-page title `h1` `26px / weight 600`.
- [ ] Metadata: block carries `template/model/bodywork/category/date`; passes lint; surfaces the kit under
      the correct listing facets.
- [ ] A11y: single `<h1>`; h2→h3 no skips; one tab stop per tile; non-empty `alt`; chapter-nav is a labeled
      `<nav>` with a `<button aria-expanded>`; `:focus-visible` throughout; hero title contrast ≥ 4.5:1.
- [ ] Visual diff vs source at 1280/1024/768/mobile ≤ 2% per-pixel (excluding image content).

## 10. Reference screenshots

`assets/press-kit-template/`: `landing-1280.png` (overlay hero + chapter tile grid, full page),
`landing-mobile-500.png` (stacked single-column tiles, 28px hero title), `narrative-1280.png` (a chapter
sub-page: chapter-nav + two-column article shell + rich text). Sub-part captures live in the atomic specs'
`assets/` folders.
