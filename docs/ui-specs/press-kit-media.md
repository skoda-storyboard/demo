# Component Spec: Press Kit Media (grouped download areas + whole-kit ZIP)

Status: **CAPTURED** (measured 2026-09-15 via Chrome DevTools MCP on page id 1; source CSS
cross-checked against `media-room-515d2d102b.css`; reference screenshot saved).
Foundations: [`_FOUNDATIONS.md`](_FOUNDATIONS.md). Method: [`_CAPTURE-PROTOCOL.md`](_CAPTURE-PROTOCOL.md).

Reuses [`downloads.md`](downloads.md) for per-item rendering and [`media-cart.md`](media-cart.md) for the
ZIP / packaging path (server-side reduction, per D2). This spec measures the **grouping** of the five
areas on the live Peaq kit and resolves the tabs-vs-accordion-vs-stacked decision.

## 1. Identity

- **Component:** Press-Kit grouped supporting-content, the five ordered download areas on a kit, 
  **Texts, Infographics, Technical data, Images, Videos**, plus the whole-kit ZIP.
- **EDS block(s):** `press-kit-media` (a grouped-downloads wrapper) composing the `downloads` block per
  group + the `media-cart` download-package path for the ZIP. No existing block.
- **Client PDF IDs:** MR-PK04 (grouped media), MR-PK06 (individual asset download), MR-PK07 (whole-kit
  ZIP); requirements §11.11–12.
- **Ticket:** SKODA-806 (reuses SKODA-502 downloads + SKODA-505/902 packaging).
- **Source references (URLs used):**
  - Kit landing (group tiles): `https://www.skoda-storyboard.com/en/press-kits/skoda-peaq-press-kit/`
  - Images group page: `https://www.skoda-storyboard.com/en/press-kits/skoda-peaq-press-kit/images/`
  - (siblings: `/texts/`, `/infographics/`, `/technical-data/`, `/videos/`)
- **Top-level selectors:** on the landing, each group is `article.article-teaser` (a tile linking to
  the group sub-page); on a group page, `.search-results-item > article.article-teaser.gallery-item.attachment`
  (a download tile), `a.media-cart-action.download` (download), `.media-cart-action-multi-container`
  (Original / 1920px size dropdown), `a.media-cart-icon.media-cart-count` (the floating cart badge, in
  the fixed `.sticky-buttons` bar, see [`media-cart.md`](media-cart.md), not the header).

## 2. Source anatomy

The five groups are **five sequential named areas** (confirmed §11.11). On the live source each is a
**separate sub-page** reached from a tile on the kit landing and from the persistent chapter-nav:

```
KIT LANDING  .content .panel-grid          (chapter tiles, press-kit-template.md)
├── article.article-teaser "Texts"          → /skoda-peaq-press-kit/texts/
├── article.article-teaser "Infographics"   → …/infographics/
├── article.article-teaser "Technical data" → …/technical-data/
├── article.article-teaser "Images"         → …/images/
└── article.article-teaser "Videos"         → …/videos/

GROUP SUB-PAGE  (body.press_kit-template-default, e.g. Images postid-445913)
.chapter-nav ("Chapters")                    persistent sub-nav (press-kit-template.md §3)
.columns > .column-primary
└── .search-results-item                     one wrapper per asset
    └── article.article-teaser.gallery-item.attachment.media-cart-item   a DOWNLOAD tile (188×106)
        ├── .article-teaser-media > .entry-thumbnail.media-cart-image
        │   └── a.colorbox.file-type > .ratio-container.ratio-16x9 > img   16:9 thumb (downloads.md)
        └── .article-teaser-toolbar (188×60)
            └── .entry-buttons (88×40, flex)                two round 40×40 buttons side by side
                ├── .media-cart-action-multi (add-to-cart) + -container   Original(add,data-size="")/
                │                                                           1920px(add,data-size="giant")
                └── .media-cart-action-multi.download + -container         Original(download,href
                        /direct-download/{path}.jpg) / 1920px(download,href …-1920x1920.jpg)
```
(corrected 2026-09-15: the tile toolbar is `.article-teaser-toolbar > .entry-buttons` holding an **add-to-cart
multi button** + a **download multi button**, both round `40×40`; there is **no** `a.media-cart-action.link`
copy/permalink button on these press-kit tiles. Both multi buttons carry the Original/1920px size dropdown;
the download dropdown rows are **direct-download hrefs** `/direct-download/{path}.jpg` and `…-1920x1920.jpg`.)

- **Images** group: download tiles with the **Original / 1920px** dual-rendition dropdown (measured:
  `data-size=""` → "Original", `data-size="giant"` → "1920px"), identical to [`downloads.md`](downloads.md) §3.
- **Infographics** group: the preview-image → PDF pattern (a thumbnail whose download link is a PDF),
  same as MR-PR05 (per §11.11; documented in downloads.md as the file-type link variant).
- **Texts / Technical data:** downloadable document items (title + file link); Technical data is the
  structured spec content for the model/variant.
- **Videos:** downloadable/embeddable video items.
- The **floating cart badge** (`a.media-cart-icon.media-cart-count`, in the fixed `.sticky-buttons`
  bar) is present on every group page →
  the media-cart affordance is pervasive (per-item add + Original/1920px), see [`media-cart.md`](media-cart.md).

**Libraries / patterns to retire:** SiteOrigin sub-page tree, jQuery, colorbox, icon-font glyphs
(`\e012` download, `\e01b` link), the WP `attachment` sub-page-per-asset model. Replace with grouped
`downloads` blocks + the media-cart download service.

## 3. Measured visual spec

All rows: `measured (source-url · selector · viewport) → token`. `IMG` = the Images group page.

### Grouping presentation, **STACKED / separate areas**
- On the source the five groups are **separate sequential pages** (each a tile on the landing + a
  chapter-nav entry), rendered one after another, never as tabs and never as an accordion
  (· LANDING/IMG · confirmed: no `role=tab`, no `row-toggle` on group pages; groups are distinct
  `postid-*` sub-pages). Verdict: the source presentation is **stacked** (see §8).

### Download tile, reuse [`downloads.md`](downloads.md) §3 (identical values)
- Tile `article.article-teaser.gallery-item.attachment`: width ~**188px**, box `188×106` (16:9)
  (· IMG · `article.gallery-item` · 1280).
- Thumbnail `.ratio-container.ratio-16x9`: `padding-bottom:56.25%` (16:9); `<img>` `object-fit:fill`
  (deviation → rebuild `cover`), faint hairline (· IMG · 1280).
- Download button `.media-cart-action-multi.download`: rendered **`40×40`** (icon `16×16` + `padding 10px` +
  `border 2px`, `box-sizing:content-box`), `border-radius:50px` → `--pill-radius`, `border 2px solid #161718`
  → `--skoda-ink`, `background #fff` → `--skoda-white`, `color #161718` (· IMG · `.media-cart-action-multi.download`
  · 1280), **identical to [`downloads.md`](downloads.md) §3, not `115×48`** (corrected 2026-09-15; the old
  `115×48` was wrong). The sibling add-to-cart button `.media-cart-action-multi` is the same `40×40` pill.
- Size dropdown `.media-cart-action-multi-container`: `position:absolute; top:45px; z-index:15; display:none`
  until active; rows **"Original"** (`data-size=""`) + **"1920px"** (`data-size="giant"`) (· IMG · measured).
  The download button's dropdown rows are **direct-download links** (`data-action="download"`,
  `href=/direct-download/{path}.jpg` and `…-1920x1920.jpg`); the add button's rows are add-to-cart at size
  (`data-action="add"`). Reuse downloads.md §3 (bg `#fff`, shadow `0 3px 8px rgb(0 0 0 /.15)`, hover row `#f1f1f1`).

### Group heading / layout
- Group items flow in the `.column-primary` reading column (`66.66%`, story-detail.md shell); tiles
  wrap fluidly (flex, tile-width driven), reuse downloads.md §4 grid ladder `1 / 2 / 4` across `768 / 992`
  for the rebuild.

### Whole-kit ZIP (MR-PK07)
- **Not present in the static DOM.** No "download all" / ZIP / "download complete press kit" control was
  found on the kit landing or the Images group page (· LANDING/IMG · `[data-action], a[href*=download|zip]`
  filtered for download/package/all/zip · 1280 → only app-store badges + the floating cart icon). The ZIP is
  a **dynamic/scripted control** (or delivered via the media-cart "Download package" path), consistent with
  §11.12. Mechanism to confirm with the technical team; it rides on the D2 server-side reduction approach,
  see [`media-cart.md`](media-cart.md) §3 (`a.mr-media-cart-button[data-action=downloadAll]` → "Download package").

## 4. Responsive behavior

- Download tiles reflow fluidly (flex-wrap, tile-width driven), reuse downloads.md §4: `1` col (<768) →
  `2` (≥768) → `4` (≥992) for the rebuilt image group; documents/videos may use fewer columns.
- Thumbnail aspect stays 16:9 (`padding-bottom:56.25%`) at every band.
- The group areas stack vertically at every viewport (they are sequential sections/pages in source).

## 5. Interaction states

- **Per-item download / size dropdown / permalink:** reuse [`downloads.md`](downloads.md) §5 (download
  hover bg `#f1f1f1`; dropdown `.is-active` → `display:block`).
- **Add-to-cart (per item):** reuse [`media-cart.md`](media-cart.md) §5 (`.in-cart` scrim glyph, header
  badge increment).
- **Whole-kit ZIP:** the "Download package" action calls the packaging/reduction endpoint
  (`media-cart.md` §7); show progress + a downloadable result; no client-side zip.
- **Group nav:** each group reachable via the sticky chapter-nav (press-kit-template.md §3).

## 6. Accessibility

- Each group is a labeled region: `<section aria-labelledby>` with an `<h2>` group heading; the group
  list is a real `<ul>`.
- Per-item download `<a>` needs an accessible name: `aria-label="Download {title} ({size})"`; size
  dropdown is `<button aria-expanded aria-controls>` + list, `Esc` closes (per downloads.md §6).
- Whole-kit ZIP is a real `<button>` with an accessible label + an `aria-live` progress announcement.
- If the rebuild chooses tabs or accordion for grouping, add full tab/accordion ARIA (see §8), the
  **stacked default needs none**, which is the a11y argument for it.
- Visible `:focus-visible` ring on every control (source relies on browser default).

## 7. EDS target

Block `press-kit-media`: **N ordered named groups**, each rendering a `downloads` block (API/index or
authored). Populated at import from `mediakit/v1/mediabox` (per SKODA-502). The whole-kit ZIP wires to
the shared media-cart download-reduction service (SKODA-505 demo / SKODA-902 prod), **no second bespoke
zip path**.

### DA authoring table (config)

| key | example | meaning |
|---|---|---|
| `press-kit-media` | | block name (row 1) |
| `presentation` | `stacked` | `stacked` (default) / `tabs` / `accordion` |
| `groups` | `Texts, Infographics, Technical data, Images, Videos` | ordered group names |
| `zip` | `/mediakit/v1/download?kit=445836` | whole-kit package endpoint (MR-PK07) |

Each group then holds a `Downloads` block (per [`downloads.md`](downloads.md) config: `source=mediabox`,
`postid`, `lang`, `columns`, `sizes`). Infographics group sets a `file-type=pdf` preview mode; Images
group sets `sizes = Original, 1920px`.

### `decorate()` outline

1. `readConfig(block)` → `{ presentation, groups[], zip }`.
2. For each group name, render `<section class="press-kit-media-group">` with an `<h2>` + a decorated
   `downloads` block; preserve source order.
3. If `presentation=stacked` (default): sections stacked, each with a heading (no extra ARIA).
   If `tabs`/`accordion`: wrap in the shared tablist/accordion util (ARIA per §6), reuse the
   `accordion` block from [`faq-accordion.md`](faq-accordion.md) for the accordion variant.
4. Render a "Download complete press kit" `<button>` calling `zip` via the media-cart service; degrade to
   hidden if no endpoint.
5. CSS scoped to `.press-kit-media`; tokens only; reuse downloads.md grid + button tokens.

## 8. Open decisions + recommended default

- **Tabs vs accordion vs stacked, RESOLVED → stacked (EDS-native default).** Evidence: the source
  renders the five groups as **separate sequential sub-pages / sections** with no tab or accordion
  chrome (no `role=tab`, no `row-toggle` on the group pages); the only cross-group control is the sticky
  chapter-nav. Stacked is therefore the faithful and simplest option, needs no extra ARIA, and works with
  the EDS default-content model. Offer `tabs`/`accordion` as opt-in variants (`presentation` config) if
  the client wants them, those add tab/accordion ARIA + focus management. (Assumption to confirm in design,
  but stacked is what the source does.)
- **Whole-kit ZIP:** not in the static DOM → dynamic. Recommend wiring MR-PK07 to the **media-cart
  server-side reduction/packaging** service (D2), not a bespoke client zip. Confirm the endpoint with the
  technical team.
- **Rendition set:** default `Original` + `1920px` (measured); Infographics = preview-image → PDF. Confirm
  per asset type (ties to Dynamic Media / D5).
- **Tokens:** reuse `--pill-radius: 50px`, `--dropdown-hover-bg: #f1f1f1`, `--dropdown-shadow: 0 3px 8px
  rgb(0 0 0 /.15)`, `--skoda-ink`, `--skoda-white`, `--skoda-green-emerald` (cart button hover), plus the
  downloads.md `--thumb-hairline`.

## 9. Pixel-perfect acceptance criteria

Compare EDS render to source at each viewport. WHAT / WHERE / viewport / expected / actual.

- [ ] Groups: five ordered named areas render **Texts → Infographics → Technical data → Images → Videos**,
      stacked by default.
- [ ] Images group: download tiles = **16:9** thumb (`object-fit:cover`), per-item download button round
      `radius 50px`, border `2px #161718`, bg `#fff`; **Original + 1920px** size dropdown.
- [ ] Infographics group: each item = preview image linking to a downloadable **PDF**.
- [ ] Grid: image group / mobile `1` / 768 `2` / 992+ `4` columns (configurable).
- [ ] Whole-kit ZIP: "Download complete press kit" produces **one package via the shared reduction service**
      (no bespoke zip); accessible `<button>` + progress.
- [ ] Presentation variant: `stacked` default; `tabs`/`accordion` opt-in are keyboard + ARIA correct.
- [ ] A11y: each group `<section>` labeled by its `<h2>`; per-item `aria-label="Download {title} ({size})"`;
      dropdown `aria-expanded`; ZIP `aria-live`; `:focus-visible` throughout.
- [ ] Visual diff vs source at 1280/1024/768/mobile ≤ 2% per-pixel (excluding image content).

## 10. Reference screenshots

`assets/press-kit-media/`: `images-1280.png` (the Images group page: 16:9 download tiles with per-item
download + link buttons and the Original/1920px size dropdown, chapter-nav above). Texts / Infographics /
Technical data / Videos group captures and the ZIP control (dynamic) pending.
