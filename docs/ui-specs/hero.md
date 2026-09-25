# Component Spec: Hero

Status: **CAPTURED** (measured 2026-09-15 via Chrome DevTools MCP on page id 1; source CSS
cross-checked against `media-room-515d2d102b.css`; reference screenshots saved). **Re-verified live
2026-09-15 via Playwright** at 500/768/1024/1280: all four variants hold (story `40px/44px/600/#161718`
center, order-swap + `28px` at `≤768`, box 970×546 / 748×421 16:9; series overlay `61.8vh` + white
`48px/300` H1 + scrim, no CTA; archive `160/200/240` static no-scrim; press-release no hero,
`h1.entry-title 26px/32.5px/600/#0a0a0a`). Only the story master `width/height` attr changed (now
`1920×1080`) and the size-drop breakpoint refined to `≤768`.
Foundations: [`_FOUNDATIONS.md`](_FOUNDATIONS.md). Method: [`_CAPTURE-PROTOCOL.md`](_CAPTURE-PROTOCOL.md).

## 1. Identity

- **Component:** Hero (the page-top banner). Four measured shapes: story-detail hero, category/archive
  banner, landing/series/press-kit overlay hero, and press-release (no hero).
- **EDS block(s):** `hero-image` (active; `hero-image.js` sets `fetchpriority`). `hero` is a stub
  (`hero.js` is empty, `hero.css` duplicates `hero-image.css`), fold into `hero-image` or keep `hero`
  as a text-only variant.
- **Client PDF IDs:** COM-09; STO-C01 / S01 / M01 / D01; MR-M01; MR-PR01.
- **Ticket:** SKODA-202.
- **Source references + selectors:**
  - Story detail: `https://www.skoda-storyboard.com/en/emobility/skoda-epiq-will-win-you-over-in-just-a-few-seconds/`
    · `.hero` > `.hero-heading .heading` + `.hero-image.ratio-container.ratio-16x9` + `.hero-caption`.
  - Category/archive banner: `https://www.skoda-storyboard.com/en/category/emobility/` · `body.archive .hero-image`.
  - Landing/tiles/series/press-kit overlay hero: `https://www.skoda-storyboard.com/en/series-2/`
    · `.hero-image.ratio-container.ratio-16x9.cover-width.snap-center` + `.hero-caption--page`.
  - Press release (no hero): `https://www.skoda-storyboard.com/en/press-releases/skoda-superb-25-years-of-comfort-space-and-technical-excellence/`
    · `h1.entry-title` + inline `article img`.

## 2. Source anatomy

The source hero is a **real `<img>`**, never a CSS background. Container height is driven either by a
`ratio-container ratio-16x9` padding-bottom box (story / landing / series) or by fixed pixel heights
(`body.archive`). The image is `object-fit: fill` (distorts) and, on the ratio variants, is wider than
its container (`cover-width`, clipped by `overflow:hidden`).

```
.hero  (flex column; position relative)
├── .hero-heading                order:2 on <=1079, default(1st) on desktop
│   └── .heading                 the title (h1); ink on story, white on overlay heroes
├── .hero-wrapper / .image-wrapper   order:1 on <=1079 (image moves to top on tablet/mobile)
│   └── .hero-image.ratio-container.ratio-16x9.cover-width  (position relative)
│       ├── <img>                real img, object-fit:fill, fetchpriority=high, loading=eager,
│       │                        width/height attrs present, NOT wrapped in <picture>
│       └── .hero-image:after    dual-gradient scrim (absent on body.archive)
└── .hero-caption               order:3; story: relative, ink; overlay heroes: absolute bottom, white
    ├── .category (.label tags)  see tags.md
    ├── .perex                   subtitle / standfirst
    └── .published              date
```

**Libraries / patterns to retire:** the `ratio-container` padding-bottom hack (replace with
`aspect-ratio`), `object-fit:fill` (replace with `cover`), the `-webkit-gradient` scrim fallbacks,
jQuery-driven `snap-top`/`snap-center` positioning, and the WordPress `attachment-giant` sizing
classes. The `body.archive` `transform: translate(-50%,-50%)` image centering becomes `object-position`.

## 3. Measured visual spec

All rows: `measured (source-url · selector · viewport) -> token`. Story URL abbreviated `…/skoda-epiq…/`,
archive `…/category/emobility/`, series `…/series-2/`, press `…/superb-25-years…/`.

### Variant A, Story-detail hero (`single-post`)
- Image element: real `<img width="1920" height="1080">` (current master; the `width`/`height` attrs
  track the authored asset, earlier capture was `744`), `object-fit: fill`, `position: absolute`,
  `fetchpriority="high"`, `loading="eager"`, **not** in `<picture>` (· `…/skoda-epiq…/` · `.hero-image img`
  · 1280, verified live 2026-09-15).
- Box ratio: `ratio-container ratio-16x9` → rendered box **16:9** at every band (· `.hero-image` · all).
  Desktop container is capped by `.hero .hero-wrapper .container{max-width:990px}` → box ≈ **970×546**
  at 1280 and 1024; full-width below the cap → **748×421** at 768, **480×270** at 500.
- Scrim: `.hero-image:after` = `linear-gradient(270deg, transparent, rgb(0 0 0 /.25)),
  linear-gradient(180deg, transparent, rgb(0 0 0 /.1))` (· `.hero-image::after` · 1280) -> candidate
  `--scrim-h` / `--scrim-v` (same pair already flagged in `card-teaser.md`).
- Title `.hero-heading .heading`: `40px / 44px / weight 600 / #161718` (· `.hero .hero-heading .heading` · 1280)
  -> color `--skoda-ink`, weight `--weight-semibold`; `40px` (`2.5em`) has **no token** -> candidate
  `--heading-font-size-hero-story: 40px`. Desktop `text-align: center`, `margin: 16px 0 32px`
  (`16px` -> `--spacing-m`). The title is a **separate block above the image on desktop** (default order),
  and **below the image on tablet/mobile** (order swap, see §4). Never overlaid on the image.
- Caption `.hero-caption` (single-post): `position: relative; background: transparent; color: #161718`
  (· `.hero-caption` · 1280) -> `--skoda-ink`. Holds `.perex` (subtitle) + `.published` + `.category`
  (`.label` tags, see [`tags.md`](tags.md)). `.perex`: `1.25rem / weight 600` (source CSS
  `.hero-caption .perex`); `.published`: `0.75em / weight 300`.

### Variant B, Category / archive banner (`body.archive`)
- `.hero-image`: `position: static`, fixed heights **160px** (base <576) / **200px** (≥576) / **240px**
  (≥768) (· `body.archive .hero-image` · confirmed in source CSS `@media (min-width:576/768)`); measured
  `height: 240px` at 1280 (· `…/category/emobility/` · `.hero-image` · 1280).
- Image: real `<img width="1920" height="369">`, `object-fit: fill`, absolute, centered via
  `transform: translate(-50%,-50%)`, `fetchpriority="high"`, `loading="eager"`, not in `<picture>`.
- **No scrim** (`body.archive .hero-image:after{background:none}`; measured `::after background-image: none`).
- **No overlaid title, no CTA**, this variant is an image-only band; the page `<h1>` sits in the
  content column below.

### Variant C, Landing / tiles / series / press-kit overlay hero
- `.hero-image.ratio-container.ratio-16x9.cover-width.snap-center`: `height: 61.8vh` (· `…/series-2/`
  · `.hero-image` · 1280 → measured 556px at 900px viewport height = `900 × 0.618`). `61.8vh` has **no
  token** -> candidate `--hero-vh: 61.8vh`.
- Scrim **present** (`linear-gradient(270deg, transparent, rgb(0 0 0 /.25))…`, · `.hero-image::after`).
- Title **overlaid, white**: `48px / weight 300 / #fff` (· `.hero .hero-heading .heading` (`--page`) · 1280)
  -> color `--skoda-white`; `48px` -> candidate `--heading-font-size-hero: 48px`; weight `300` has **no
  token** (`--weight-regular` is the lightest = 400) -> candidate `--weight-light: 300` (also needed by
  `cards-media` social handle).
- **No CTA** (`.hero a.btn/.button/.entry-buttons a` = empty; · `…/series-2/` · `.hero` · 1280).
  Confirms the "model/landing hero has no CTA" note.

### Variant D, Press release (no full-bleed hero), FINDING
- **`.hero-image` does not exist** on `body.single-press_release` (· `…/superb-25-years…/` ·
  `.hero-image` · 1280 → `null`). The page opens with `h1.entry-title`: `26px / 32.5px / weight 600 /
  #0a0a0a` (· `h1.entry-title` · 1280) -> `26px` = `--heading-font-size-l`; `#0a0a0a` is a near-black
  with **no token** (≈ `--skoda-ink`, map to it). The lead image is a normal inline `article img`
  (measured `828×586`, **not** in `<picture>`), not a hero.
- **EDS consequence:** press releases must author with a heading + regular image/text, **not** the
  `hero-image` block. Do not force a hero here.

## 4. Responsive behavior

Breakpoints are the source ladder (`_FOUNDATIONS` §1): the real hero switches at **1080** and **768**,
with archive heights also stepping at **576**.
- **≤1079 (`@media max-width:1079px`)**, story hero swaps flex order: `.hero-wrapper` (image) → `order:1`
  (top), `.hero-heading` → `order:2` (below image). Title also flips `text-align: center → left` and
  `margin: 16px 0 32px → 16px 0 0` (· `.hero .hero-heading .heading` · measured center@1280, left@1024).
- **≤768 (tablet→mobile)**, story title drops `40px → 28px` (`30.8px` line-height) (· measured
  28px@768 and @500; 40px still at 1024, so the size step is `max-width:768`, i.e. the drop hits at
  `≤768`, not `≤767`). Archive banner height `240 → 200` (≥576) → `160` (base).
- **Ratio box** stays 16:9 at every band on story/landing/series; desktop story box is width-capped at
  ~970px by the `.container{max-width:990px}` wrapper.
- Capture note: DevTools floored at ~500px; the <768 state was captured at 500. A true 375 check needs
  device emulation (follow-up).

## 5. Interaction states

- The hero image/title are **not interactive** on story/archive/series heroes (no link, no CTA, no hover).
- The scrim is static (no transition).
- Category `.label` tags inside the caption have their own states, see [`tags.md`](tags.md) §5.
- **A11y upgrade:** if a future hero adds a CTA, give it a visible `:focus-visible` ring (source pattern
  uses `outline:0` on buttons, a regression to reverse).

## 6. Accessibility

- Hero image needs meaningful `alt` (source stuffs the title into `alt` with literal `<span>` markup,
  e.g. `alt="&lt;span&gt;e&lt;/span&gt;Mobility…"`, strip the tags; use plain text or empty for a
  decorative banner).
- One `<h1>` per page: the hero title is the page `<h1>` on story/series; on archive the `<h1>` lives in
  the content column, so the archive banner must **not** introduce a second `<h1>`.
- Scrim must keep overlaid white text at contrast ≥ 4.5:1 (series overlay). On story/archive the title is
  on a solid background, so contrast is inherent.
- Preserve the `fetchpriority="high"` + `loading="eager"` LCP hints the source already sets.

## 7. EDS target

Block: `hero-image` (variants via class: default = story/landing overlay; `archive` = fixed-height band;
optional `hero` text-only). Follow repo conventions (`_FOUNDATIONS` §7): authored image →
`optimizeImageInPlace` (keeps the `<picture>` editable in DA Layout mode), LCP image gets
`fetchpriority="high"`, section `Style` metadata drives dark/light.

### DA authoring table (worked examples)

For `single-post` story heroes (SKODA-816), author **one** `Hero Image`
table with four optional rows in order: image, H1, perex, then a paragraph
containing a date and the linked category. Keep the caption *inside* that
block: separate default paragraphs/Tags blocks become separate section
wrappers and cannot be visually recomposed into the source caption. The
aside's independent Tags block is unaffected. On 2026-09-25, Chrome CSS/DOM
extraction (no screenshots) measured the Epiq source image as 970×545.6 at
1440/1024, 748×420.8 at 768, and 480×270 at 500, with 10px caption and
mobile gutters. The H1/image gap at 1440 is 32px (EDS pre-fix 48px), and
the perex is 20px/30px/600. Date 12px/18px/300 and grey category link
share one metadata row. Verify source versus branch EDS with computed CSS
and bounding boxes at these widths and 1079/1080.

`Hero-image` (story / overlay, image + heading):
| (image cell)              | (heading cell)                          |
|---------------------------|-----------------------------------------|
| ![](./header.jpg)         | # eMobility and servicing: convenient   |

`Hero-image (archive)` (image-only band, no heading cell):
| (image cell)              |
|---------------------------|
| ![](./category-banner.jpg)|

### decorate() outline (must match/upgrade `hero-image.js`)

Current `hero-image.js` only adds `fetchpriority`. Rebuild to:
1. `const img = block.querySelector('img');`, if the authored `<img>` sits inside a `<p>` (EDS
   image-in-`<p>` pattern), unwrap it (`img.closest('p')?.replaceWith(...)`).
2. `optimizeImageInPlace(img, true /* eager */, [{ width: '1920' }])` (preserve the original node,
   set responsive sources; see `scripts/optimized-picture.js`), then `img.setAttribute('fetchpriority','high')`
   and `img.setAttribute('loading','eager')`.
3. Ensure the `<img>` keeps `width`/`height` attributes for CLS (source sets `1920×744`).
4. Classify cells: single-child cell with `<picture>` = image layer; a heading (`h1`/`h2`) cell = title;
   remaining text = caption/perex. Wrap image in `.hero-image-media`, apply the scrim via CSS `::after`.
5. `block.classList.add('archive')` when authored as `Hero-image (archive)` → fixed-height band, no scrim.
6. Scope CSS to `.hero-image`; use `aspect-ratio: 16/9` + `object-fit: cover` (fixes the source
   `object-fit:fill` distortion) and the source breakpoints `768/1080` (replace the hardcoded `900px` in
   the current CSS).

**Parity fixes vs current block:** current CSS uses `min-height:300px` + `padding:40px 24px` +
absolute `<picture>` and a `900px` breakpoint, none match the source. Adopt the 16:9 ratio box,
`61.8vh` overlay variant, and `160/200/240` archive heights.

## 8. Open decisions + recommended default

- **Image fit:** recommend `object-fit: cover` on `aspect-ratio: 16/9` (assumption to confirm; source
  uses `fill`, which distorts non-16:9 masters). No visual regression on 16:9 sources.
- **`hero` vs `hero-image`:** recommend folding the empty `hero` stub into `hero-image` and using a
  text-only variant flag rather than a second block (assumption to confirm).
- **Overlay-hero height:** recommend `min(61.8vh, 640px)` to avoid over-tall heroes on short-wide
  desktops (assumption to confirm; source is a raw `61.8vh`).
- **New tokens** (assumption to confirm): `--heading-font-size-hero: 48px`,
  `--heading-font-size-hero-story: 40px`, `--weight-light: 300`, `--hero-vh: 61.8vh`,
  `--hero-archive-h-base/-sm/-md: 160/200/240px`, scrim gradients (`--scrim-h`, `--scrim-v`), plus define
  the missing `--skoda-grey-500`.

## 9. Pixel-perfect acceptance criteria

Compare EDS render to source at each viewport. Format: WHAT / WHERE / viewport / expected / actual.

- [ ] Real `<img>`: hero uses an `<img>`/`<picture>`, never a CSS background · `.hero-image img` · all.
- [ ] Story box: `.hero-image` rendered box = **16:9 ±1px** · all; desktop width-capped ≈ 970px
      (546px tall) at 1280/1024; 748×421 at 768; 480×270 at 500.
- [ ] Archive band: `body.archive .hero-image` height = **160 / 200 / 240px** at <576 / ≥576 / ≥768.
- [ ] Overlay hero: `.hero-image` height = **61.8vh**; scrim present; title white `48px / weight 300`.
- [ ] Story title: `.hero-heading .heading` = `40px / 44px / weight 600 / #161718` at ≥1080 center;
      `28px / 30.8px` left at ≤767; image-above-title order at ≤1079.
- [ ] Story scrim: dual gradient (270deg→`rgb(0 0 0 /.25)`, 180deg→`.1`); **absent** on archive.
- [ ] CTA: none present in any hero (regression guard) · `.hero .button` · all / expected 0.
- [ ] Press release: **no** `hero-image` block; `h1.entry-title` `26px / weight 600` + inline image.
- [ ] LCP hints: hero `<img>` has `fetchpriority="high"` + `loading="eager"` + `width`/`height`.
- [ ] A11y: single `<h1>`; meaningful `alt` (no literal `<span>` markup); overlay title contrast ≥ 4.5:1.
- [ ] Visual diff vs source at 1280/1024/768/mobile ≤ 2% per-pixel (excluding image content).

## 10. Reference screenshots

`assets/hero/`: `story-desktop-1280.png`, `story-mobile-500.png` (title-above vs image-above order),
`archive-banner-1280.png` (fixed-height band, no scrim), `series-overlay-1280.png` (61.8vh overlaid
white title, no CTA), `press-release-no-hero-1280.png` (h1 + inline image, no hero).
