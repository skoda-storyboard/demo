# Component Spec: Downloads (static media box)

Status: **CAPTURED** (measured 2026-09-15 via Chrome DevTools MCP; source CSS `media-room-515d2d102b.css`).
Foundations: [`_FOUNDATIONS.md`](_FOUNDATIONS.md). Method: [`_CAPTURE-PROTOCOL.md`](_CAPTURE-PROTOCOL.md).

## 1. Identity

- **Component:** Downloads, the **static** per-image download gallery ("Media Box" / "Images" section)
  under a press release or story. Per-image download links + pixel-size options. **No cart, no
  signed-URL, no server state** (that is the Media Cart, [`media-cart.md`](media-cart.md) / SKODA-505).
- **EDS block:** `downloads` (new). No existing block.
- **Client PDF IDs:** COM-13; MR-PR04 / MR-PR07 (press-release media); MR-I04 (image download).
- **Ticket:** SKODA-502.
- **Source reference:**
  `https://www.skoda-storyboard.com/en/press-releases/skoda-octavia-turns-30-three-decades-of-a-brand-icon/`
  (the "Images" / "Media Box" section).
- **API context:** `mediakit/v1/mediabox/post/{id}/{lang}` ->
  `{ images: [{ imageUrl, link, translated, title }] }`.
- **Top-level selectors:** `.items` (the thumbnail grid), `article.gallery-item.media-cart-item`
  (a download tile), `.entry-thumbnail.media-cart-image > a.colorbox.file-type` (thumb + lightbox),
  `.ratio-container.ratio-16x9` (aspect box), `a.media-cart-action.download` (download link),
  `a.media-cart-action.link` (copy/permalink).

## 2. Source anatomy

The Octavia press release actually carries **two distinct galleries** (corrected 2026-09-15):
1. an inline **"Images"** grid `div.items` of `~169px` colorbox-only thumbnails (`a.colorbox` grouped by
   `rel="info-images"`), **no per-tile download buttons** (lightbox only);
2. the **"Media Box"** `div.search-results.media-box`, the actual **download** grid (colorbox `rel="media-box-1"`),
   `~292px` cards **with** the add-to-cart + download toolbar. The download tile below is a Media Box tile.

```
h3/h4 "Media Box"                            section heading (the download grid)
div.search-results.media-box (4-col @1280)   the download GRID (separate from the inline "Images" .items grid)
└── article.article-teaser.gallery-item.media-cart-item   a download tile (292px wide; mixed image + video)
    │   data-post-id, data-content-type="Media"
    ├── .article-teaser-media
    │   └── .entry-thumbnail.media-cart-image
    │       └── a.colorbox.file-type[href=<full jpg>][rel="media-box-1"]   opens lightbox (colorbox, rel group)
    │           └── .image-holder.ratio-container.ratio-16x9.cover-width > img   (290×163 rendered)
    └── (toolbar) .media-cart-action-multi (add-to-cart) + .media-cart-action-multi.download (download)
        each a round 40×40 pill with a .media-cart-action-multi-container size dropdown:
            → a "Original" (data-size="")   a "1920px" (data-size="giant")
        download rows are DIRECT-DOWNLOAD links: href=/direct-download/{yyyy}/{mm}/{file}.jpg (Original) and
            …-1920x1920.jpg (1920px); a video tile downloads a single …-1080p….mp4. No a.media-cart-action.link
            copy/permalink button was present per-tile (only one on the whole page).
```

The tile **reuses the card-teaser** (`.article-teaser`). The download action is
`a.media-cart-action` with `[data-action=download]`; the size choice ("Original" / "1920px") comes
from the `.media-cart-action-multi-container` dropdown. This is a **grid of thumbnails**, not a text
list.

**Libraries to retire:** colorbox (jQuery lightbox), replace with the EDS `gallery-lightbox` block;
jQuery; the icon-font glyphs (`\e012` download, `\e01b` link), replace with SVG icons.

## 3. Measured visual spec

All rows: `measured (source-url · selector · viewport) -> token`. Source URL for §3 = the Octavia
press release above.

### Grid (the "Media Box" download grid, corrected 2026-09-15)
- The **download** grid is `div.search-results.media-box`, `display:flex; flex-wrap:wrap`, **4 columns @1280**
  (measured per-row [4,2] for 6 tiles) (· `.search-results.media-box` · 1280). The separate inline **"Images"**
  grid `div.items` (`flex-wrap`, `~169px` colorbox-only thumbs, thumb `169×95` 16:9) has **no download buttons**;
  the old §3 `.items` / `169px` figures described that lightbox grid, not the download grid. The dedicated
  `/images/` listing uses a 4-col grid at `>=992` (`.images .items .item:nth-child(4n+1){clear:left}`).

### Tile + thumbnail (Media Box)
- tile `article.article-teaser.gallery-item.media-cart-item` width **`~292px`** (· 1280).
- thumbnail box `.ratio-container.ratio-16x9` -> `padding-bottom:56.25%` (**16:9**) (· source CSS);
  `.cover-width`. Rendered **`290 × 163px`** (· 1280) (not `169×112`; `169×95` is the inline Images thumb).
- `<img>` object-fit **`fill`**, border-radius `0`, border `1px solid hsl(0 0% 85% / .133)` on
  `.search-results.media-box .media-cart-image` (faint hairline). **Deviation to fix:** use
  `object-fit:cover` on a `16/9` box (same fix as card-teaser).

### Download button (`a.media-cart-action.download`)
- display inline-flex; box-sizing content-box; icon area `16x16` + padding `10px` + border `2px` =
  **`40 x 40`** rendered (· 1280).
- border-radius `50px` -> `--pill-radius` (round icon button); background `#fff` -> `--skoda-white`;
  border `2px solid #161718` -> `--skoda-ink`; color `#161718` -> `--skoda-ink`.
- icon: `::after` content `"\e012"`, font-family `skoda-bnr-icons` (download glyph) -> replace with SVG.
- `.disabled`: background `#c4c6c7`, `display:none` (hidden when unavailable).

### Link/permalink button (`a.media-cart-action.link`)
- padding `.375em`; `::after` content `"\e01b"`, font-size `1.5em` (copy-link glyph). **Note (2026-09-15):**
  this `.link` button was **not present per-tile** on the cited Octavia Media Box (only one `.media-cart-action.link`
  found on the whole page); each Media Box tile ships an add-to-cart pill + a download pill, no per-tile permalink.

### Size options (`.media-cart-action-multi-container`)
- absolute dropdown; background `#fff`; box-shadow `0 3px 8px rgb(0 0 0 /.15)`; z-index `15`;
  top `45px`; hidden until `.is-active`. Rows: **"Original"** (`data-size=""`) and **"1920px"**
  (`data-size="giant"`) (· measured). Each row `a.media-cart-action` padding `.75em`, bg `#fff`,
  hover bg `#f1f1f1`, no radius, left-aligned.
- **No KB/MB filesize and no MIME label in source**, the only size labels are the pixel labels
  "Original" and "1920px". Flag: if the client wants a filesize/type label (COM-13), it must come from
  the API/index (not present today).

## 4. Responsive behavior

- Thumbnail grid is `flex-wrap` and tile-width-driven, so it reflows fluidly (more tiles per row as
  width grows); no explicit per-breakpoint tile restyle in the inline press-release box.
- The dedicated image listing (`/images/`) applies the listing grid ladder: `1` col (<768) ->
  `2` (`>=768`) -> `4` (`>=992`) (· `.images .items .item` @media · source CSS). For a press-release
  Downloads block, recommend the same ladder capped by a `columns` option.
- Aspect ratio stays **16:9** (`padding-bottom:56.25%`) at every band.

## 5. Interaction states

- **Thumbnail hover:** shares the card-teaser `.article-teaser-media:after` icon fade (see
  card-teaser.md); clicking the thumb opens the colorbox lightbox (rebuild -> `gallery-lightbox`).
- **Download button hover/focus/active:** background `#f1f1f1` (· `a.media-cart-action:hover` ·)
  (matches `--dropdown-hover-bg` candidate `#f1f1f1`).
- **Size dropdown:** `.media-cart-action-multi` toggles `.is-active` -> container `display:block`;
  option rows hover bg `#f1f1f1`.
- **Download action:** each size row is a **direct-download link** (verified live 2026-09-15):
  `href=/direct-download/{yyyy}/{mm}/{file}.jpg` for "Original" and `…-1920x1920.jpg` for "1920px"
  (`data-action="download"`); a video tile downloads a single `…-1080p….mp4`. Rebuild as a static
  `<a download>` per size (no server round-trip, no signed URL).

## 6. Accessibility

- Each download `<a>` needs an accessible name: `aria-label="Download {title} (Original)"` /
  `"… (1920px)"`, icon-only buttons must not ship label-less (source uses `title="…"` only).
- Thumbnail link: real `<a>` with `alt` from `title`/`translated`; avoid duplicate tab stops (thumb +
  download), group per tile.
- Size dropdown: `<button aria-expanded aria-controls>` + a `role=menu`/list; keyboard operable;
  `Esc` closes.
- Add a visible `:focus-visible` ring (source relies on browser default).

## 7. EDS target

Block `downloads` (new). Two authoring modes: (a) **API/index-driven**, one config cell with the
post id + lang, fetch `mediabox/post/{id}/{lang}`, render tiles from `images[]`; (b) **authored**, a
row per image (picture + title + file link). Reuse `createOptimizedPicture` for synthesized tiles /
`optimizeImageInPlace` for authored ones. Reuse the card-teaser markup for each tile and the
`gallery-lightbox` block for the enlarged view.

### `Downloads` block config table (DA authoring)

| key | example | meaning |
|---|---|---|
| `downloads` | | block name (row 1) |
| `source` | `mediabox` | `mediabox` (API) or `authored` |
| `postid` | `450950` | media-box post id (API mode) |
| `lang` | `en` | language (API mode) |
| `columns` | `4` | grid columns at `>=992` (default 4 for images) |
| `sizes` | `Original, 1920px` | offered download sizes (labels + query) |

Authored mode (one image per row):

| (image cell) | (title cell) | (file link cell) |
|---|---|---|
| ![](./octavia-1.jpg) | Škoda Octavia front | [Original](https://cdn…/octavia-1.jpg) |

### `decorate()` outline

1. `readConfig(block)` -> `{ source, postid, lang, columns, sizes[] }`.
2. If `source=mediabox`: `fetch('/mediakit/v1/mediabox/post/'+postid+'/'+lang)`; for each `images[]`
   entry build a tile (`createOptimizedPicture(imageUrl, title)`, a `<a download href=link>` per size).
   Degrade gracefully to nothing on fetch failure (per `stories`).
3. If `source=authored`: each row -> tile from the authored `<picture>` + title + link cells
   (content-sniff cells per `_FOUNDATIONS` §7b).
4. Render `<ul.downloads-items>` (flex-wrap grid), each tile: 16:9 `object-fit:cover` picture (lightbox
   trigger) + round download button(s) (SVG icon) + size dropdown if >1 size.
5. CSS scoped to `.downloads`; tokens only; grid ladder `768 / 992`.

## 8. Open decisions + recommended default

- **Filesize/type label:** source shows none (only pixel labels). Recommend surfacing filesize + MIME
  if the API/index carries it; otherwise keep the pixel-size labels only (assumption to confirm, COM-13).
- **Sizes offered:** default `Original` + `1920px` (measured). Confirm whether "Giant"/other sizes
  apply per asset type.
- **Lightbox:** reuse `gallery-lightbox` (assumption to confirm).
- **Image fit:** `object-fit:cover` on `16/9` (source uses `fill`, distorts).
- **Tokens:** reuse `--pill-radius: 50px`, `--dropdown-hover-bg: #f1f1f1`, `--dropdown-shadow`
  (`0 3px 8px rgb(0 0 0 /.15)`); new `--thumb-hairline: hsl(0 0% 85% / .133)`.

## 9. Pixel-perfect acceptance criteria

Compare EDS `/en/…` Downloads block to source at each viewport. WHAT / WHERE / viewport / expected /
actual.

- [ ] Layout: `.downloads-items` / all / **grid of thumbnails** (flex-wrap), not a text list.
- [ ] Thumbnail: `.downloads-items img` / all / **16:9** box (`padding-bottom:56.25%`),
      `object-fit:cover`, faint `1px` hairline border.
- [ ] Columns: image mode / mobile `1` / 768 `2` / 992+ `4` (configurable).
- [ ] Download button: `a.download` / all / round `40x40`, radius `50px`, bg `#fff`, border
      `2px #161718`, download icon (SVG).
- [ ] Download hover: `a.download:hover` / all / bg `#f1f1f1`.
- [ ] Size options: dropdown / all / "Original" + "1920px" rows; bg `#fff`; shadow
      `0 3px 8px rgb(0 0 0 /.15)`; hover row bg `#f1f1f1`.
- [ ] No-cart: no add-to-cart affordance, no badge, no server state in this block.
- [ ] A11y: every download `<a>` has `aria-label="Download {title} ({size})"`; thumb `alt` present;
      dropdown `aria-expanded`; `:focus-visible` ring; keyboard operable.
- [ ] Visual diff vs source at 1280/1024/768/mobile <= 2% per-pixel (excluding image content).

## 10. Reference screenshots

`assets/downloads/`: `1280-mediabox.png` (the "Images"/"Media Box" thumbnail grid with per-tile
download + link buttons and the Original/1920px size options). 1024/768/mobile captures pending.
