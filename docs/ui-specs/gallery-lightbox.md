# Component Spec: Gallery / Lightbox

Status: **CAPTURED** (measured 2026-09-15 via Chrome DevTools MCP + source CSS
`media-room-515d2d102b.css`; lightbox opened live; screenshot saved).
Foundations: [`_FOUNDATIONS.md`](_FOUNDATIONS.md). Method: [`_CAPTURE-PROTOCOL.md`](_CAPTURE-PROTOCOL.md).

## 1. Identity

- **Component:** Image gallery grid + full-screen lightbox (thumbnail grid -> click -> overlay viewer
  with prev/next/close/counter/caption + a thumbnail "overview" grid).
- **EDS block(s):** **NEW** `gallery` block (no block exists yet). Card unit is not reused; this is a
  dedicated media viewer.
- **Client PDF IDs:** STO-D04 (Story image gallery); MR-H09 (Media Room gallery rail);
  MR-I03 (Image detail / download gallery).
- **Ticket:** SKODA-203.
- **Variant split (2026-09-24):** SKODA-203 / SKODA-607 use the Peaq press-release
  `.images.sa-media-kit-preview` and desktop `#colorbox` as their presentation reference:
  image previews on the right and bottom-right white counter/arrows. The Favorit story's
  `.sb-gallery` is a *different in-body variant*, tracked by
  [`SKODA-216`](../tickets/tickets/SKODA-216.md): a lead image with thumbnails below and
  green side navigation. Do not apply this document's mixed visual measurements as a
  single universal layout; SKODA-203's common accessibility contract applies to both.
- **Source reference:** press-release galleries, e.g.
  `https://www.skoda-storyboard.com/en/press-releases/936-km-without-recharging-skoda-peaq-sets-range-record-for-seven-seater-electric-suvs/`
  (24-image gallery); plus the custom `sb-gallery-lightbox` styles in the shared CSS bundle.
- **Top-level selectors:** `article.gallery-item` (a thumbnail card), `a.colorbox` (thumbnail link,
  `data-id`, `data-caption`), `#colorbox` (the live desktop press-release lightbox), and the custom
  `.sb-gallery` / `.sb-gallery-overlay` / `.sb-gallery-lightbox-*` (the story lightbox, also
  observed opening on desktop Favorit).

## 2. Source anatomy

The source ships **two overlapping lightbox systems**; the EDS rebuild retires both into one:

**(A) jQuery colorbox** (what actually opens on desktop press-release/image galleries, verified live):
```
.images .items (flickity) / grid
└── article.article-teaser.gallery-item.image
    └── a.colorbox.cboxElement[href=fullsize.jpg][rel=media-box-1][data-id]  (thumbnail link)
... on click, jQuery injects:
#cboxOverlay          (fixed backdrop, background #161718)
#colorbox > #cboxWrapper
    ├── #cboxLoadedContent > img   (the full image)
    ├── #cboxTitle                 (the caption, from data-caption)
    ├── #cboxCurrent               (counter, e.g. "24")
    ├── #cboxPrevious / #cboxNext  (arrows)
    ├── #cboxSlideshow             (hidden)
    └── #cboxClose
```

**(B) custom `sb-gallery-lightbox`** (JS-built; source gates activation to `width() <= 767`, mobile):
```
.sb-gallery
├── .sb-gallery-image-main > .sb-gallery-link > img   (+ .sb-gallery-show-more overlay)
├── .sb-gallery-thumbnails > .sb-gallery-image.sb-gallery-thumbnail (flex:0 0 25%)
└── .sb-gallery-bottom (share)
body.storyboard-gallery-lightbox-active -> .sb-gallery-overlay{display:block}
.sb-gallery-overlay (fixed, z-index 99999)
├── .sb-gallery-lightbox-top-wrapper > .sb-gallery-lightbox-top
│      ├── .sb-gallery-lightbox-title h3
│      └── .sb-gallery-lightbox-top-right (overview link, close)
├── .sb-gallery-lightbox-main
│      ├── .sb-gallery-lightbox-above-image > img
│      ├── .sb-gallery-lightbox-image > img
│      ├── .sb-gallery-lightbox-prev / -next  (green disc)
│      ├── .sb-gallery-lightbox-count         (e.g. "3 / 24")
│      └── .sb-gallery-lightbox-info > .sb-gallery-description-toggle (+ description)
└── .sb-gallery-lightbox-overview-wrapper (body.…-overview-active)
       └── .sb-gallery-lightbox-overview[--cols-4|--cols-5]
              └── .sb-gallery-lightbox-overview-item (flex 33.33% | 25% | 20%)
```

**Gallery grouping by `rel` (verified live 2026-09-15):** colorbox scopes each gallery by the
thumbnail link's `rel` attribute, so **one page can run several independent lightbox groups**. On a
Superb press-kit chapter the same page carried `rel="media-box-1"` (21 images), `rel="info-images"`
(4), plus 2 ungrouped links. `#cboxCurrent` reads the **per-group** position, verified `1` + `<span
class="total">21</span>` = image 1 of 21 for the `media-box-1` group, NOT the page's total image
count. The EDS rebuild must preserve this scoping: each authored gallery block is its own lightbox
set; prev/next and the counter stay within that set.

**`#cboxTitle` is a full media-detail panel on MR galleries (verified live), not a plain caption:**
on Media-Room image galleries the colorbox title region carries the image title **plus** two download
renditions (`Original` + `1920px`), file metadata (`File type: JPG`, `File size: 5 MB`, `Dimensions:
5095 × 3397 px`, `Published: 1. 7. 2019`), taxonomy tags (year / view / model), and **Related
article** links. So the lightbox doubles as the MR image-detail view. In EDS this maps to a caption +
a detail panel (download links + metadata + related links), not a single `<figcaption>` string. On
Storyboard story galleries the same region is just the plain `data-caption`.

**Column algorithm (confirmed in source CSS):** the overview grid picks its column count by image
count. `.sb-gallery-lightbox-overview .…-overview-item{flex:0 0 33.3333%}` (**3 cols**, default);
`.sb-gallery-lightbox-overview--cols-4 …{flex:0 0 25%}` (**4 cols**); `--cols-5 …{flex:0 0 20%}`
(**5 cols**). The JS assigns the modifier: **>19 images -> 5 cols, >9 -> 4 cols, else -> 3 cols**
(matches the source `sb-gallery-lightbox.js` thresholds).

**Libraries to retire (do not port):** jQuery colorbox, the custom `sb-gallery-lightbox.js` + its
share dropdown, Flickity (the press-release thumbnail strip is a Flickity slider), jQuery. Rebuild as
one accessible vanilla lightbox.

## 3. Measured visual spec

`PR` = the Peaq press-release URL above. Values `measured (source · selector · viewport) -> token`.

### Thumbnail grid (`.sb-gallery-image.sb-gallery-thumbnail`)
- `flex: 0 0 25%` = **4 across** at every width (· source CSS). Padding `0 5px` (<768) / `0 10px`
  (>=768); container `.sb-gallery-thumbnails` margin `10px -5px 0` (<768) / `20px -10px 0` (>=768) ->
  effective gap 10px / 20px. `-> --spacing-xs`/`--spacing-m` families.
- On press releases the images row is instead a **Flickity slider** (`.images .items.flickity-enabled
  .item` = 90% / 30% / 22.5% per view) — see [`carousel-rails.md`](carousel-rails.md) §3. The static
  4-across `sb-gallery` grid is the non-slider layout.
- Thumbnail cursor `pointer`; hover scales the inner image `scale:1.02` `transition .5s`
  (shared `.items article:hover … img` rule).

### Lightbox overlay (`.sb-gallery-overlay`)
- `position:fixed; inset:0; z-index:99999; width/height:100%` (· source CSS).
- Background `#161718` (<768, opaque ink) -> `--skoda-ink`; `rgba(0,0,0,.95)` (>=768).
- Shown via `body.storyboard-gallery-lightbox-active .sb-gallery-overlay{display:block}`; body is
  locked `position:fixed; height:100vh; width:100vw` (scroll-lock) and its scrollbar hidden.
- Text color `#fff` -> `--skoda-white`; `user-select:none` on chrome, `user-select:text` on caption.

### Live colorbox chrome (measured · PR · 500-wide)
- `#cboxOverlay`: `position:fixed`, background `#161718` (rgb 22,23,24), full-screen.
- `#cboxCurrent` (counter): `24px`, color `#fefefe`, box `97×60`, text e.g. `"24"` (total count).
- `#cboxPrevious` / `#cboxNext`: `61×60`, white, `24px`.
- `#cboxClose`: `60×60`, white.
- `#cboxTitle` (caption from `data-caption`): white; `display:none` on the mobile width (caption
  hidden on small colorbox, a gap the rebuild fixes by always showing the caption).

### `sb-gallery-lightbox` chrome (source CSS)
- Stage `.sb-gallery-lightbox-image`: `height: calc(100vh - 93px - 56px)` (top bar 93 + info bar 56);
  `display:flex; align-items:center; justify-content:center`; `img{max-height:100%; width:auto}`
  (contain, never crop).
- Prev/next (`.sb-gallery-lightbox-prev/-next`): `position:fixed`, `top:calc(50% + 46.5px)`,
  background **`#419468`** (green disc), `padding:1em`, `box-shadow:1px 1px 6px 3px rgb(0 0 0 /.15)`,
  svg `35×35`; `.prev{left:10px}` / `.next{right:10px}` (`left/right:30px` at `>=1690`). `#419468`
  has no token -> **candidate** `--gallery-accent: #419468` (a mid green, distinct from `--skoda-green`).
- Close (`.sb-gallery-lightbox-close`): icon-font `content:"\e010"`; `font-size:2em` (<768) /
  `1.5em` + `padding:.75em` (>=768); transparent, `border:0`, `outline:0` (a11y gap: no focus ring).
- Counter (`.sb-gallery-lightbox-count`): `position:absolute; bottom:0; right:10px` (`30px` @>=1690).
- Title (`.sb-gallery-lightbox-title h3`): `font-size:1em` (<768) / `1.5em` (>=768), weight `400`.
- Top bar border `.sb-gallery-lightbox-top-wrapper{border-bottom:1px solid #5a5b5c}` (no token ->
  candidate `--gallery-divider: #5a5b5c`).
- Info bar (`.sb-gallery-lightbox-info`): `background:rgba(0,0,0,.6)`, absolute bottom, description
  toggle rotates its chevron `transition:all .2s ease-in-out`.
- Overview grid: 3 / 4 / 5 cols by count (see §2); wrapper `max-height:calc(100vh - 93px)`, scrolls;
  item `padding:10px`, `cursor:pointer`; hover reveals per-item share icons.

### Caption source
`data-caption` on the thumbnail link -> colorbox `#cboxTitle` / lightbox description + title. In EDS,
`data-caption` -> `<figcaption>` under the thumbnail and the lightbox caption region. **MR image
galleries extend this:** `#cboxTitle` also renders the per-image download renditions + file metadata +
taxonomy + related-article links (see §2), so on the MR side the lightbox caption region is a detail
panel, not a one-line caption.

## 4. Responsive behavior

- **Thumbnail grid:** `4 across` at all widths (`flex:0 0 25%`); gap `10px` (<768) / `20px` (>=768).
- **Overlay backdrop:** opaque `#161718` (<768) vs `rgba(0,0,0,.95)` (>=768).
- **Lightbox share row:** `.sb-gallery-lightbox-share` `display:none` (<768) -> `display:flex`
  (>=768); on mobile a bottom-anchored `media-share` is used instead.
- **Prev/next inset:** `10px` -> `30px` at `>=1690` (secondary breakpoint; source uses `1690`, above
  the canonical ladder, treat as a max-content inset, not a new token).
- **Activation gate:** the custom `sb-gallery-lightbox` JS binds only at `width() <= 767`; desktop
  press-release galleries fall through to colorbox. **The EDS rebuild removes this split**, one
  lightbox at every viewport.

## 5. Interaction states

- **Open:** click a thumbnail -> overlay `display:block`, body scroll-locked
  (`storyboard-gallery-lightbox-active`). Verified live: colorbox opens with the clicked image and a
  `"24"` counter.
- **Prev / next:** cycle images; counter updates; image swaps (colorbox cross-fades; sb-lightbox
  swaps). 
- **Overview toggle:** `body.storyboard-gallery-lightbox-overview-active` hides the single-image chrome
  and shows the thumbnail overview grid; click a tile -> back to that image.
- **Description toggle:** `.sb-gallery-description-toggle` expands/collapses the caption, chevron
  rotates `.2s`.
- **Close:** `#cboxClose` / `.sb-gallery-lightbox-close` / Escape (colorbox default) / backdrop click.
- **Hover:** overview item hover reveals share icons; thumbnail hover scales image `1.02`.

## 6. Accessibility (HARD GATE)

Source has real gaps (`outline:0` on close, `text-indent` labels, mobile caption hidden, focus not
managed). The rebuild MUST:
- Render the overlay as `role="dialog" aria-modal="true"` with an `aria-label` (gallery title).
- **Focus trap:** Tab/Shift+Tab cycle only within the open lightbox; nothing behind is reachable.
- **Escape** closes the lightbox.
- **Arrow keys** (Left/Right) move prev/next; Home/End jump to first/last (nice-to-have).
- **Focus return:** on close, focus returns to the thumbnail that opened the lightbox.
- Prev/next/close are `<button>` with `aria-label` ("Previous image" / "Next image" / "Close
  gallery"); visible `:focus-visible` ring on all controls.
- Counter exposed via `aria-live="polite"` (e.g. "Image 3 of 24") so screen-reader users hear position.
- Each image has meaningful `alt`; the caption (`data-caption`) is always shown (fix the mobile-hidden
  colorbox caption) and associated via `aria-describedby`.
- Respect `prefers-reduced-motion` (no cross-fade / transform animation).

## 7. EDS target

**New block `gallery`.** DA authoring: one row per image; cell 1 = image, cell 2 = caption.

### DA authoring table (worked example)
| ![](./img1.jpg) | Mladá Boleslav, 2 September 2026 – the record attempt begins. |
| ![](./img2.jpg) | The Peaq covered 936 km without recharging.                   |
| ![](./img3.jpg) | Average consumption of just 9.2 kWh/100 km.                   |

Variants (authored `Gallery (variant)`): default press-release gallery (SKODA-203),
`gallery (story)` for the in-body Favorit composition (SKODA-216). A masonry variant would
require a separately justified use case.

### decorate() outline (repo conventions, `_FOUNDATIONS` §7)
- Rows -> `<ul class="gallery-grid">/<li>`; per row: image cell -> `<button class="gallery-item">` (a
  real button, keyboard-openable) wrapping the thumbnail `<picture>`; caption cell -> `<figcaption>`.
- `optimizeImageInPlace` on authored `<picture>>img`; request a small thumb rendition and a large
  lightbox rendition (`[{width:'2000'}]`).
- The source's **overview grid** thresholds (`>19 -> 5`, `>9 -> 4`, `else 3`) describe a
  stakeholder-removed mode, not either on-page variant. Do not implement it for this scope.
  SKODA-216 retains the Favorit story's four-across on-page rail at all measured widths.
- Build the lightbox lazily on first open (or `IntersectionObserver`): one overlay reused for all
  images; `role="dialog"`, focus-trap util, Escape + arrow handlers, `aria-live` counter, focus
  return. Any `innerHTML` must be Trusted-Types-safe (`_FOUNDATIONS` §7).
- CSS scoped to `.gallery`; tokens for backdrop (`--skoda-ink`), accent (`--gallery-accent`), divider
  (`--gallery-divider`), radius (`--card-radius`).

## 8. Variant decisions

- The stakeholder removed the source's "Show all images" overview toggle. Its item-count
  thresholds above remain source documentation, not acceptance criteria.
- One accessible viewer at all widths; source presentation varies by authored variant:
  Peaq press release uses an opaque ink backdrop with bottom-right white controls
  (SKODA-203); Favorit story uses `rgba(0,0,0,.95)` desktop / opaque ink mobile, green
  `--gallery-accent` side navigation, and a separate bottom-right counter (SKODA-216).
- On-page Peaq press-release previews appear two across in a right media-kit column
  (template assembly in SKODA-607). Favorit story has a large lead image and four
  thumbnails below it, including mobile (SKODA-216).
- **New tokens:** `--gallery-accent: #419468`, `--gallery-divider: #5a5b5c`, plus reuse `--skoda-ink`,
  `--skoda-white`, `--card-radius`.

## 9. Pixel-perfect acceptance criteria

WHAT / WHERE / viewport / expected / actual.

- [ ] Authored variant layout: press-release previews two across in Peaq's media-kit
      sidebar; story lead image above four thumbnails across at 1280/1024/768/500px.
- [ ] Story thumbnail spacing: ~20px effective desktop / ~10px mobile (SKODA-216).
- [ ] Thumbnail hover: image scales to `1.02` over ~`.5s`; cursor `pointer`.
- [ ] Open: click thumbnail -> overlay `position:fixed; z-index:99999`; body scroll-locked; clicked
      image shown; counter shows `"N / total"`.
- [ ] Grouping: prev/next + counter stay within the clicked image's gallery set only (source scopes by
      colorbox `rel`); a page with multiple galleries keeps them independent (verified `1 / 21` for the
      `media-box-1` group on a shared page).
- [ ] MR image lightbox: caption region shows the detail panel (Original + 1920px download links, file
      metadata, taxonomy, related-article links); STO story lightbox shows the plain caption.
- [ ] Backdrop: opaque ink for press releases; `rgba(0,0,0,.95)` for desktop stories,
      opaque ink for mobile stories.
- [ ] Image fit: lightbox `<img>` / all / `max-height:100%; width:auto` (contain, never cropped);
      stage height `calc(100vh - topbar - infobar)`.
- [ ] Controls: prev/next/close are labeled `<button>`; Peaq desktop groups white arrows
      and counter bottom-right; Favorit story uses green `#419468` side discs and
      a separate bottom-right counter.
- [ ] Counter: updates on prev/next; `aria-live` announces "Image X of N".
- [ ] Caption: `data-caption` shown as `<figcaption>` on grid AND in lightbox at every viewport.
- [ ] No "Show all images" overview toggle (stakeholder-approved removal).
- [ ] **A11y GATE:** `role=dialog aria-modal`; focus trapped; Escape closes; Left/Right navigate;
      focus returns to the invoking thumbnail; visible `:focus-visible` on all controls; every image
      has `alt`. (Blocking, fails the ticket if any item fails.)
- [ ] Visual diff vs source at 1280/768/mobile <= 2% per-pixel (excluding image content).

## 10. Reference screenshots

`assets/gallery-lightbox/`: `lightbox-open-colorbox-390.png` (live open state, counter "24",
prev/next/close). Press-release and story layouts require separate desktop comparisons;
the Favorit custom story lightbox was also observed opening on desktop.
