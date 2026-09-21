# Component Spec: Company / About Pages (5 sub-types)

Status: **CAPTURED** (measured 2026-09-15 via Chrome DevTools MCP on page id 1; source CSS
`media-room-515d2d102b.css` confirmed by curl; screenshots at 1280 saved per sub-type).
Foundations: [`_FOUNDATIONS.md`](_FOUNDATIONS.md). Method: [`_CAPTURE-PROTOCOL.md`](_CAPTURE-PROTOCOL.md).
Cross-refs (reused, not re-measured): [`card-teaser.md`](card-teaser.md), [`downloads.md`](downloads.md),
[`footer.md`](footer.md) (app-store badges + social), [`faq-accordion.md`](faq-accordion.md)
(accordion a11y pattern), [`hero.md`](hero.md).

This is **one file covering five net-new blocks**. The top block (§1–§10) is the shared Identity +
foundations that all five sub-types inherit; below it are five clearly-delimited **per-sub-type
sub-specs** (A–E), each with its own source anatomy, per-viewport measurements, interaction/a11y, EDS
target + DA table, and acceptance criteria.

---

# PART 1, Shared Identity + Foundations

## 1. Identity

- **Component:** the five "Company" / "About" utility pages of Storyboard, reached from the footer
  **Company** column and the top-nav Company/Media-Room area. All five are authored today as WordPress
  **SiteOrigin Page Builder** documents (`.panel-layout > .panel-grid.panel-no-style >
  .panel-grid-cell`), and all reuse two shared source primitives: the **card-teaser**
  (`.article-teaser`, see `card-teaser.md`) and, on the board page, the **row-toggle accordion**
  (`.widget_ys-row-toggle`, see `faq-accordion.md`).
- **EDS blocks (5 net-new):** `exec-bio` (board), `download-list` (annual reports),
  `brand-asset` (company logo), `app-promo` (media-services app), `contact-directory` (contacts).
- **Client PDF IDs / requirements:** SKODA-810 (Company/About page set); **MR-H10** (contacts /
  press contacts directory). Board + contacts also relate to COM-08 card and the media-cart
  (SKODA-505) for the save/download affordance.
- **Ticket:** SKODA-810 (may split per sub-type, see §8 effort note).
- **Source references (URLs used, all live + captured):**
  1. Board of Management, `https://www.skoda-storyboard.com/en/board-of-management/`
  2. Annual Reports, `https://www.skoda-storyboard.com/en/annual-reports/`
  3. Company Logo, `https://www.skoda-storyboard.com/en/company-logo/`
  4. Media-Services App, `https://www.skoda-storyboard.com/en/skoda-media-services-application/`
  5. Contacts, `https://www.skoda-storyboard.com/en/contacts/`
- **Source CSS:** `https://cdn.skoda-storyboard.com/dist/26.8.1/skoda-bnr-web/dist/styles/media-room-515d2d102b.css`
  (breakpoint + pseudo rules cited below).

## 2. Source anatomy (shared)

Every page shares the WordPress + SiteOrigin scaffold:

```
article.post-<id>.page > .container > .entry-content > .panel-layout
└── .panel-grid.panel-no-style        one visual ROW (display:flex; flex-wrap:nowrap)
    └── .panel-grid-cell              a COLUMN (padding:0 10px)
        └── .so-panel.widget…         a widget:
            ├── .widget_sow-editor    rich text (name/title/prose/logo image/links)
            ├── .widget_ys-row-toggle "show more" accordion trigger (h2.row-title)  [board only]
            └── .widget_siteorigin-panels-builder  nested panel = accordion answer / gallery
```

**Two-column card rows** (board, contacts, app screenshots) are a `.panel-grid` with **two
`.panel-grid-cell` at `614px` each** (half of the `1228px` inner width at 1280). They stack to a
single column below the SiteOrigin mobile width (measured: 2-up at 1280, stacked `flex-direction:column`
at 500).

**Card/gallery rows** (annual reports, board "show more" gallery) reuse the card-teaser
`article.article-teaser.gallery-item.media-cart-item` inside a `.search-results-items` flex-wrap grid
(`.ratio-container` aspect box, `.article-teaser-toolbar` action row), identical primitive to
`downloads.md`.

**Libraries / patterns to retire (do not port):** WordPress + SiteOrigin Page Builder scaffolding
(`.panel-grid`, `.so-panel`, `.widget_*`), the SiteOrigin `ys-row-toggle` accordion + its jQuery
toggle, the icon-font `skoda-bnr-icons` glyphs (accordion `\e027`, media-cart download/add glyphs),
`dotdotdot` JS line-clamp (annual-report titles carry `data-dotdotdot`), jQuery, colorbox lightbox,
and the media-cart jQuery. Inline `style="font-size:18pt"` on names must become tokened headings.

## 3. Measured visual spec (shared foundations)

All rows: `measured (source-url · selector · viewport) -> token`. Per-viewport detail lives in each
sub-spec; the shared building blocks measured once here:

- **Two-column card row:** `.panel-grid.panel-no-style` `display:flex` (· board/contacts · 1280);
  two `.panel-grid-cell` `614px` each; cell padding `0 10px` (gutter). Stacks to
  `flex-direction:column`, cells full width, below the SiteOrigin mobile width (~780px; measured
  stacked at 500). Maps to a **2-up grid** in EDS, 1-up on mobile.
- **Landscape portrait** (board + contacts): `<img>` natural `574×322` (≈**16:9**, `1.783`), rendered
  `574×323` at 1280, `object-fit:fill`, `border-radius:0` (· `.panel-grid-cell img` · 1280). These are
  **landscape 16:9 press photos, not square headshots.** -> reuse the card `16:9` box; **deviation to
  fix:** `object-fit:cover` (source `fill` distorts non-16:9 masters), same fix as card-teaser.
- **Name heading:** `<strong>` `24px` / line-height `36px` / weight `600` / `#161718`
  (· board + contacts name · 1280), authored as inline `font-size:18pt`. No exact token
  (`--heading-font-size-l` is 26px, `-m` is 22px). -> **candidate** `--heading-font-size-person: 24px`
  or round to `--heading-font-size-m` (22px). Weight -> `--weight-semibold`; color -> `--skoda-ink`.
- **Title / meta line:** `<strong>` `16px` / `24px` / weight `600` / `#161718`
  (· title + appointment date · 1280) -> `--body-font-size-m`, `--weight-semibold`, `--skoda-ink`.
- **Action / contact links:** `color:rgb(65 148 104)` = `#419468` (· all five pages · 1280),
  `16px`, weight `400` (plain) or `600` (emphasised: press-release, LinkedIn, PDF/PNG download),
  `text-decoration:none`, `display:inline`. `#419468` = the existing candidate token
  **`--gallery-accent: #419468`** (`_FOUNDATIONS` §8, shared with faceted `--facet-active`). Reuse it
  as the company-page link colour.
- **Card / thumbnail radius:** `.ratio-container` / card `border-radius:8px` (· annual reports ·
  1280) -> `--card-radius`.

## 4. Responsive behavior (shared)

- **Primary ladder** follows `_FOUNDATIONS` §1: `768 / 992 / 1080`. Card/gallery grids use the source
  secondary step `576` too (see annual-reports ladder). Content caps at `1248px`
  (`--content-max-width`); inner width measured `1228–1248px` at 1280.
- **Two-column card rows** (board, contacts): 2-up above the SiteOrigin mobile width, 1-up (stacked
  `flex-direction:column`) below it. Rebuild: 2-up `>=768`, 1-up `<768`.
- **Card-grid rows** (annual reports, logo, board gallery): flex-wrap column ladders, per sub-spec.
- `@media (max-width:400px){.panel-grid .panel-grid-cell{padding:0}}` (· source CSS), cell gutter
  collapses on the smallest phones.

## 5. Interaction states (shared)

- **Text/action links:** emerald `#419468`; source sets no underline and no visible focus ring
  (a11y regression). Rebuild: add `:focus-visible` ring; keep emerald, add hover underline or
  darken (`--gallery-accent-hover: #59bc87` candidate).
- **"show more" accordion** (board): identical to `faq-accordion.md`, `h2.row-title`
  `display:flex; justify-content:space-between; cursor:pointer; padding:24px; border-top:1px solid
  #e4e4e4`; icon `span::after` icon-font glyph that **translates/rotates on open** with
  `transition:transform .2s ease-in` (measured open matrix `translateY(-16px)` / `.active` class on
  the wrapper). Reuse the accordion block's a11y pattern.
- **Card toolbar save/download** (annual reports, board gallery): media-cart round action
  `40×40`, `border-radius:50px`, bg `#fff`, border `2px solid #161718`, icon-font glyph `::after`
  (· `.media-cart-action.add` / `.download` · 1280), same control as `downloads.md`. Hover bg
  `#f1f1f1` (`--dropdown-hover-bg`). Demo-stub the "save/heart" (no server state).

## 6. Accessibility (shared, source gaps to fix)

- **Landscape portraits** carry `alt` from the person's name; enforce non-empty `alt`.
- **Names authored as `<strong>` inside `<p>`** with inline `font-size:18pt`, no heading semantics.
  Rebuild: real `<h3>`/`<h4>` per person/asset so the page has a proper outline.
- **Phone numbers are plain text** (`t: +420 …`, **no `tel:` link**; measured `telCount:0` on
  contacts), add `<a href="tel:">`.
- **Emails** are `mailto:` links (good); add accessible names.
- **Icon-only / icon-font affordances** (accordion caret, media-cart glyphs, LinkedIn/email mini
  icons `25×25`) -> inline SVG + `aria-label`; state conveyed by `aria-expanded`, not glyph rotation.
- **"show more" accordion**: source `<h2>`-as-clickable, no `aria-expanded`, not keyboard-operable, 
  fix per `faq-accordion.md` HARD GATE (`<button aria-expanded aria-controls>` inside heading,
  `role=region` answer, Enter/Space, `:focus-visible`).
- Add visible `:focus-visible` ring throughout (source relies on browser default / `outline:0`).

## 7. EDS target (shared approach)

Five new blocks, each `blocks/<name>/<name>.{js,css}`, `export default function decorate(block)`,
CSS scoped to `.<name>`, tokens only, content-sniffing + defensive decoration per `_FOUNDATIONS` §7.
Shared reuse:

- **Card/gallery tiles** reuse the card-teaser decoration + `optimizeImageInPlace` /
  `createOptimizedPicture`; **portraits/covers** render into a fixed-ratio box (`16/9` for people,
  `1/1.4142` A4 for report covers) with `object-fit:cover`.
- **`exec-bio`** composes the `accordion` block (SKODA-807) for the "show more" panel and the
  `downloads`/gallery grid for the photo set.
- **`download-list` + `brand-asset`** reuse the `downloads` dual-download control + grid ladder.
- **`app-promo`** reuses `hero.md` for the banner and `footer.md` app-store badge handling.
- **`contact-directory`** reuses the `exec-bio` 2-up card + portrait, minus the accordion/gallery.

## 8. Open decisions + recommended default (shared)

- **Portrait fit:** `object-fit:cover` on a `16/9` box (source `fill` distorts). Assumption to confirm.
- **Name heading level/size:** author as `<h3>` at `24px/600`, add candidate
  `--heading-font-size-person: 24px` or reuse `--heading-font-size-m` (22px). Assumption to confirm.
- **Link colour token:** reuse `--gallery-accent: #419468` for all company-page action/contact links
  (don't introduce a new one). Add `--gallery-accent-hover: #59bc87`.
- **Save/heart (annual reports):** source uses the media-cart "add" round button. Demo-stub as a
  client-side saved-list toggle (no server state) per the brief; real cart is SKODA-505.
- **Data source:** all five are authored documents today. Recommend **authored DA** blocks (not
  index-driven) for logo/app/contacts/board; annual-reports MAY later be index-driven (one row per
  year), assumption to confirm.
- **SKODA-810 effort split (flag):** **lowest effort = `contact-directory` and (base) `exec-bio`**
  (both are the shared 2-up portrait card; contacts is simplest, board adds the accordion + photo
  gallery reuse). **`download-list`** is medium (card grid + A4 ratio + save stub). **Highest effort =
  `brand-asset`** (~18–36 assets, grouped, dual PDF+PNG per tile, per-variant backgrounds baked in
  images) **and `app-promo`** (bespoke multi-section: hero + intro + 2-up screenshots + QR + image
  store badges). If the ticket runs hot, split logo + app off first.

## 9. Pixel-perfect acceptance criteria (shared gate)

Applies to all five; sub-specs add their own. WHAT / WHERE / viewport / expected / actual.

- [ ] Content width: page wrapper / all / max-width `1248px` (`--content-max-width`), centered.
- [ ] Two-up card rows: `exec-bio` / `contact-directory` / >=768 / 2 columns; <768 / 1 column stacked.
- [ ] Portrait: person `<img>` / all / `16:9` box, `object-fit:cover`, non-empty `alt`.
- [ ] Name: person heading / all / `24px` / weight `600` / `#161718`, real heading element.
- [ ] Links: action/contact links / all / emerald `#419468` (`--gallery-accent`), `:focus-visible`
      ring present.
- [ ] A11y: phones are `tel:` links; emails `mailto:`; icon-only controls have `aria-label`;
      keyboard reachable + operable.
- [ ] Visual diff vs source at 1280/1024/768/mobile <= 2% per-pixel (excluding image content).

## 10. Reference screenshots (shared)

`assets/company-pages/`: `board-of-management-1280.png`, `annual-reports-1280.png`,
`company-logo-1280.png`, `skoda-media-services-application-1280.png`, `contacts-1280.png`.
1024/768/mobile captures pending.

---

# PART 2, Per-sub-type sub-specs

---

## Sub-spec A, Board of Management -> `exec-bio`

**Source URL:** `https://www.skoda-storyboard.com/en/board-of-management/` (page title "Management").

### A.1 Source anatomy

Two H2 groups, **"Board of Management"** (4 members) and **"Chief Officers"** (3 members), each
followed by 2-up `.panel-grid` rows. Each member occupies one `.panel-grid-cell` (`614px`) holding a
`.widget_sow-editor` (portrait + name + title + appointment date), then a `.widget_ys-row-toggle`
("show more" trigger), then a `.widget_siteorigin-panels-builder` whose content is a **card-teaser
photo gallery** (`search-results-gallery` of `article.article-teaser.gallery-item.vip-board-members`),
plus the CV / photo-set / press-release / LinkedIn links.

```
h2 "Board of Management"                     group heading
.panel-grid (2-up)                           two members side by side
└── .panel-grid-cell (614px)                 ONE member
    ├── .widget_sow-editor .textwidget
    │   ├── img                              landscape portrait 574×322 (16:9)
    │   └── p > strong (name 24px) / strong (title+date 16px)
    ├── .widget_ys-row-toggle > h2.row-title "show more"   accordion trigger (\e027 icon)
    ├── .widget_siteorigin-panels-builder    ANSWER panel (display:none until .active)
    │   └── .search-results-gallery .gallery-item ×10   photo set (16:9 thumbs, ~159px)
    └── (links) a "Download cv" / "Download set of photos" /
        "More details in the press release" / "LinkedIn"   emerald #419468
```

### A.2 Measured visual spec (per viewport)

| Property | Measured (selector · viewport) | Token |
|---|---|---|
| Row layout | `.panel-grid` `flex`; 2 × `614px` cells (· 1280) / stacked column (· 500) | 2-up grid |
| Portrait | `574×322` natural, `object-fit:fill`, radius `0` (· cell img · 1280) | 16:9, fix to `cover` |
| Name | `<strong>` `24px / 36px / 600 / #161718` (· 1280) | `--heading-font-size-person` cand. |
| Title + date | `<strong>` `16px / 24px / 600 / #161718` (· 1280) | `--body-font-size-m`, `--weight-semibold` |
| Links | `16px`, weight `400` (cv/photos) or `600` (press-release/LinkedIn), `#419468` (· 1280) | `--gallery-accent` |
| "show more" trigger | `h2.row-title` `flex; space-between; padding:24px; border-top:1px solid #e4e4e4; cursor:pointer; 16px/600` (· 1280) | reuse `accordion` |
| Trigger icon | `span::after` icon-font `\e027`; open transform `translateY(-16px)` + rotate; `transition:transform .2s ease-in` (· open item) | SVG + `.2s ease-in` |
| Gallery (open) | `.search-results-items` `flex; flex-wrap`, 10 tiles, `~159px` wide, `16:9` thumbs (`162×91`), `object-fit:fill`, `ratio-16x9` (`padding-bottom:56.25%`) (· open · 1280) | reuse `downloads` grid |

Responsive: 2-up `>=768`, 1-up stacked `<768` (SiteOrigin mobile width ~780). Gallery reflows by
tile width (more per row as width grows). Values fixed (rem/px) across bands.

### A.3 Interaction / a11y

- Expand: click `h2.row-title` -> wrapper `.active`, gallery panel `display:block`, icon rotates over
  `.2s ease-in`; **multiple members can be open at once** (independent toggles). Reuse
  `faq-accordion.md` a11y HARD GATE: `<button aria-expanded aria-controls>` inside the heading,
  `role=region` panel, Enter/Space, `:focus-visible`, `aria-hidden` icon, `prefers-reduced-motion`.
- Gallery thumbs open the enlarged photo (source colorbox -> `gallery-lightbox`); download links are
  static `<a download>`. Names -> real `<h3>`; portrait `alt` = name.

### A.4 EDS target + DA table

**Block `exec-bio`** (composes `accordion` + `downloads`/gallery). One row per member; the block
groups members under authored group headings. `decorate()`: per row, sniff image cell (portrait) +
body cell (name/title/date) + toolbar/links cell; build `<h3>` name, meta line, an `accordion`
trigger+panel for the photo set, and an emerald link row.

`Exec bio` (DA authoring, one member per row; group via section heading rows):

| (portrait) | (identity) | (links + photo set) |
|---|---|---|
| ![](./zellmer.jpg) | ### Klaus Zellmer \n **Chairman of the Board of Management** \n (since 1 July 2022) | [Download cv](…pdf) · [Download set of photos](…zip) · **[More details in the press release](…)** · **[LinkedIn](…)** \n :gallery: img1 img2 … |

Variant: `Exec bio (chief-officers)` for the second group (or author two blocks under two headings).

### A.5 Acceptance criteria

- [ ] Groups: two labelled groups (Board / Chief Officers), 2-up cards `>=768`, 1-up `<768`.
- [ ] Portrait `16:9` `object-fit:cover`; name `<h3>` `24px/600`; title+date `16px/600`.
- [ ] "show more": accordion `<button aria-expanded>`, `padding:24px`, `border-top 1px #e4e4e4`,
      icon rotates over `.2s ease-in`, multi-open; a11y GATE passes.
- [ ] Photo set: on expand, `16:9` thumb grid (`object-fit:cover`), lightbox on click.
- [ ] Links: cv / photo-set / press-release / LinkedIn, emerald `#419468`, `:focus-visible`.
- [ ] Visual diff <= 2% at 1280/1024/768/mobile.

---

## Sub-spec B, Annual Reports -> `download-list`

**Source URL:** `https://www.skoda-storyboard.com/en/annual-reports/`.

### B.1 Source anatomy

A single reverse-chronological **card grid** (`2025 → 2000`, 26 tiles measured) of card-teaser
attachment tiles inside `.search-results.search-results-annual-reports > .search-results-items`.

```
.search-results.search-results-annual-reports
└── .search-results-items (flex; flex-wrap)
    └── .search-results-item (flex 0 0 20% @>=992)          one report
        └── article.article-teaser.category-annual-reports.media-cart-item
            ├── h3.entry-title > a "Annual Report 2025"      title/year (data-dotdotdot)
            ├── .article-teaser-media
            │   └── .ratio-container.ratio-1x1-4142.cover-width > img   A4 PDF cover (543×768)
            └── .article-teaser-toolbar > .entry-buttons
                └── a.media-cart-action.add                  save/cart round button (\eXX icon)
            (PDF link = the tile href / download action)
```

### B.2 Measured visual spec (per viewport)

| Property | Measured (selector · viewport) | Token |
|---|---|---|
| Grid | `.search-results-items` `flex; flex-wrap`; width `1248px` (· 1280) | `--content-max-width` |
| Columns | base `50%` (2) · `576px→33.33%` (3) · `768px→25%` (4) · `992px→20%` (5) (· source CSS `.search-results-annual-reports .search-results-item`) | ladder 2/3/4/5 |
| Item box | flex `0 0 20%`, padding `0 10px`, margin-bottom `20px` (· 1280) | gutter `--grid-gutter: 20px` |
| Tile | `230×421` (· 1280) |, |
| Cover thumb | `.ratio-1x1-4142` = `padding-bottom:141.42%` (**A4 √2 portrait**), radius `8px`, rendered `230×325`, img `543×768` `object-fit:fill` (· 1280) | `--card-radius`; **cand.** `--ratio-a4: 141.42%` |
| Title | `h3.entry-title` `15px / 18px / weight 400 / #161718`, left-aligned (· 1280) | ~`--body-font-size-s` (14px) |
| Toolbar | `.article-teaser-toolbar` `flex; space-between; bg transparent; padding 10px 0` (· 1280) |, |
| Save button | `.media-cart-action.add` `40×40`, radius `50px`, bg `#fff`, border `2px solid #161718`, icon `::after` (· 1280) | `--pill-radius: 50px`, `--skoda-ink` |

Responsive: column ladder above (2/3/4/5); A4 aspect + radius fixed; title clamps via `dotdotdot`
(replace with CSS `line-clamp`).

### B.3 Interaction / a11y

- Tile click / title -> opens/downloads the PDF (each report links to a dated CDN PDF, e.g.
  `Skoda_Auto-Annual_Report-2025_EN_*.pdf`). Save button = media-cart "add" (demo-stub a client-side
  saved toggle; no server state). Hover states per card-teaser. Add `aria-label="Download Annual
  Report 2025 (PDF)"`, `:focus-visible`, real `<a download>`; save button `<button aria-pressed>`.

### B.4 EDS target + DA table

**Block `download-list`** (reuses `downloads`/card-teaser). Reverse-chron list; one row per year;
each row = A4 cover picture + title/year + PDF link (+ optional save stub).

| (cover) | (title) | (file) |
|---|---|---|
| ![](./ar-2025.jpg) | Annual Report 2025 | [PDF](https://cdn…/Skoda_Auto-Annual_Report-2025_EN.pdf) |
| ![](./ar-2024.jpg) | Annual Report 2024 | [PDF](…2024…pdf) |

`decorate()`: sniff cover image cell, title cell, link cell; render `<ul>` grid (ladder 2/3/4/5),
A4 (`1/1.4142`) `object-fit:cover` cover, `line-clamp` title, round save-stub button (SVG heart) in a
transparent toolbar. Optional `columns` + `source=index` config for a year-driven build later.

### B.5 Acceptance criteria

- [ ] Grid columns: mobile `2` / 576 `3` / 768 `4` / 992+ `5`.
- [ ] Cover: A4 `1:1.4142` box (`padding-bottom:141.42%`), radius `8px`, `object-fit:cover`.
- [ ] Title: `15px`, weight `400`, `#161718`, left-aligned, CSS `line-clamp` (no `dotdotdot`).
- [ ] PDF link works as `<a download>`; save button round `40×40` radius `50px` border `2px #161718`,
      client-side stub only (no server state).
- [ ] Reverse-chron order preserved (2025 → 2000).
- [ ] A11y: `aria-label` on download; save `<button aria-pressed>`; `:focus-visible`.
- [ ] Visual diff <= 2% at 1280/1024/768/mobile.

---

## Sub-spec C, Company Logo -> `brand-asset`

**Source URL:** `https://www.skoda-storyboard.com/en/company-logo/`.

### C.1 Source anatomy

Grouped brand-asset grid. Section headings (`h3`, e.g. "Current logo of Škoda Auto I Standard",
"…Wordmark Spacing 130/160") introduce rows of **3 logo variants**. Each row is a `.panel-grid` with
5 cells `[314, 218, 218, 218, 314]`, three middle logo tiles + two side gutters. Each tile = a
centered preview image (the coloured background is **baked into the PNG**, e.g.
`…Emerald_on_Electric_Green.png`) with **plain-text `PDF download` / `PNG download` links** beneath
(no button chrome). Measured 18 PDF + 20 PNG download links (≈18–20 assets; ticket estimate ~36
across the fuller taxonomy of 3 groups × 6 colour variants).

### C.2 Measured visual spec (per viewport)

| Property | Measured (selector · viewport) | Token |
|---|---|---|
| Row | `.panel-grid` 5 cells `[314,218,218,218,314]` = **3 logo tiles/row** (· 1280) | 3-col grid |
| Tile cell | `~218px`, padding `0 10px` (· 1280) |, |
| Preview img | rendered `178×58` (wordmark ≈`3.07:1`), natural `1280×420`, `object-fit:fill`, tile bg `transparent` (colour baked in PNG) (· 1280) |, |
| Download links | "PDF download" / "PNG download", `16px`, weight `600`, `#419468`, `text-decoration:none`, `display:inline` (· 1280) | `--gallery-accent` |
| Group heading | `h3` (· textwidget) | `--heading-font-size-l` |

Responsive: SiteOrigin 3-col row stacks toward 1-col below the mobile width; recommend a rebuilt
ladder of **1 (mobile) / 2 (768) / 3 (992+)** columns for the asset grid.

### C.3 Interaction / a11y

- Two static download links per asset (PDF vector + PNG raster). Source renders them as bare text
  links (emerald). **Deviation / upgrade:** in EDS render the dual-download as the `downloads.md`
  round download control (2 buttons) OR keep labelled text links, assumption to confirm. Each link
  needs `aria-label="Download {asset name} (PDF)" / "(PNG)"`; preview `alt` = asset name;
  `:focus-visible`.

### C.4 EDS target + DA table

**Block `brand-asset`** (reuses `downloads` dual-download control + grid). Grouped grid; one row per
asset; group via section-heading rows. `decorate()`: sniff preview image cell + name cell + the two
file-link cells (PDF, PNG); render a 3-up grid of tiles, each = centered preview + a dual-download
control.

| (preview) | (name) | (pdf) | (png) |
|---|---|---|---|
| ![](./logo-emerald.png) | Emerald on Electric Green | [PDF](…pdf) | [PNG](…png) |

Variant: `Brand asset (columns-3)`; group headings authored as normal headings between blocks.

### C.5 Acceptance criteria

- [ ] Grid: 3 logo tiles/row at `>=992`; 2 at `768`; 1 on mobile.
- [ ] Preview: centered, aspect preserved (`object-fit:contain`, no distortion, source `fill` is a
      bug for varied logo ratios), transparent tile (colour from asset image).
- [ ] Dual download: PDF + PNG per asset; emerald `#419468` (or `downloads` button pattern);
      `aria-label` per format.
- [ ] Group headings present and associated with their tiles.
- [ ] Visual diff <= 2% at 1280/1024/768/mobile.

---

## Sub-spec D, Media-Services App -> `app-promo`

**Source URL:** `https://www.skoda-storyboard.com/en/skoda-media-services-application/`
(title "Škoda Media Room: new mobile app").

### D.1 Source anatomy

A bespoke promo page, several SiteOrigin rows:

```
h1 "Škoda Media Room: new mobile app"
.panel-grid (1-up)     hero banner img 2575×461 rendered 1365×245 (attachment-giant, ~5.6:1)
.panel-grid (2-up 208|980)   QR code (168px) + intro prose (app description / features, 16px/24px)
.panel-grid (2-up 614|614)   two app screenshots (app_01 355×384, app_02 384×313)
h? "Download the Škoda Media Room app here"
.panel-grid (5-up 130|238|345|345|130)   QR (198px) + two store BADGE images (305×87 each)
```

Store badges here are **raster images** (`Group-11185`, `Group-11186`, `305×87`, ≈`3.5:1`) wrapped in
`apps.apple.com` / `play.google.com` links, larger than the footer's inline-SVG `135×40` badges
(`footer.md`). Two QR codes present (`~168px` and `~198px`).

### D.2 Measured visual spec (per viewport)

| Property | Measured (selector · viewport) | Token |
|---|---|---|
| Hero banner | img natural `2575×461`, rendered `1365×245` (`attachment-giant`, ~`5.6:1` strip) (· 1280) | reuse `hero.md` |
| Intro row | `.panel-grid` 2 cells `[208, 980]` = QR + prose (· 1280) |, |
| QR code | `168×168` (intro) / `198×198` (download row) (· 1280) | **cand.** `--qr-size: ~168–198px` |
| Intro prose | `p` `16px / 24px / weight 400 / #161718` (· 1280) | `--body-font-size-m` |
| Screenshots | 2-up `[614, 614]`; imgs `355×384`, `384×313` (· 1280) | 2-up grid |
| Download row | `.panel-grid` 5 cells `[130,238,345,345,130]` = QR + 2 badges (· 1280) |, |
| Store badges | raster img `305×87` each, iOS + Android links (· 1280) | **cand.** `--app-badge-img-w:305px` (vs footer SVG `135×40`) |

Responsive: multi-column rows collapse to stacked single column below the SiteOrigin mobile width;
rebuild: hero full-bleed, intro 1-up on mobile / QR beside text `>=768`, screenshots 2-up `>=768` /
stacked below, download row centers QR + badges and stacks on mobile.

### D.3 Interaction / a11y

- Store-badge links open the App Store / Google Play; reuse `footer.md` badge handling +
  `aria-label` ("Škoda Media Room on the App Store" / "…on Google Play"). QR is decorative-plus:
  give `alt="QR code to download the Škoda Media Room app"`. Hero + screenshots need `alt`.
  `:focus-visible` on all links.

### D.4 EDS target + DA table

**Block `app-promo`** (reuses `hero` for the banner + `footer` badge handling). Sections authored as
rows: hero, intro (QR + prose), screenshot gallery (2-up), download (QR + badges).

| section | content |
|---|---|
| (hero) | ![](./app-hero.png) |
| (intro) | ![](./qr.png) \n Škoda Media Room, the app for journalists… (feature prose) |
| (screens) | ![](./app-01.jpg) ![](./app-02.jpg) |
| (download) | ### Download the app here \n ![](./qr.png) [App Store](…) [Google Play](…) |

`decorate()`: sniff hero image row -> full-bleed picture; intro row -> 2-up (QR image + prose);
screenshots row -> 2-up gallery; download row -> QR + two store-badge links (SVG or `<img>`),
centered.

### D.5 Acceptance criteria

- [ ] Hero banner full-width strip, `alt` present.
- [ ] Intro: QR beside prose `>=768`, stacked `<768`; prose `16px/24px`.
- [ ] Screenshots: 2-up `>=768`, stacked `<768`, `alt` per screenshot.
- [ ] Download: QR (`~168–198px`) + two store badges; correct iOS/Android hrefs; `aria-label` each.
- [ ] A11y: all links `:focus-visible`; QR + images labelled.
- [ ] Visual diff <= 2% at 1280/1024/768/mobile.

---

## Sub-spec E, Contacts -> `contact-directory`

**Source URL:** `https://www.skoda-storyboard.com/en/contacts/` (anchors `#corporate`, `#product`).

### E.1 Source anatomy

Department-grouped directory. Two `h2` groups, **"Škoda Corporate Communications"** and **"Škoda
Product Communications"**, plus a lead contact row at the top (Head of Communications). Each entry is
one `.panel-grid-cell` in a 2-up `.panel-grid` (`614px` each): landscape portrait + name + title +
`e: email` (mailto) + `t: phone` (plain text) + LinkedIn. Same primitive as `exec-bio` minus the
accordion/gallery.

```
h1 "Contacts"
.panel-grid (2-up)                 lead contact (Head of Communications)
h2 "Škoda Corporate Communications"
.panel-grid (2-up) × n             two contacts per row
h2 "Škoda Product Communications"
.panel-grid (2-up) × n
  └── .panel-grid-cell (614px)     ONE contact
      ├── img                      portrait 574×322 (16:9)
      ├── p > strong (name 24px) / strong (title 16px)
      └── p "e: <mailto>  t: +420 … (text)"  + LinkedIn link
```

### E.2 Measured visual spec (per viewport)

| Property | Measured (selector · viewport) | Token |
|---|---|---|
| Row | `.panel-grid` 2 × `614px` (· 1280) / stacked (· 500) | 2-up grid |
| Portrait | `574×322` natural, `object-fit:fill`, radius `0` (· 1280) | 16:9, fix to `cover` |
| Name | `<strong>` `24px / 600 / #161718` (· 1280) | `--heading-font-size-person` cand. |
| Title | `<strong>` `16px / 24px / 600 / #161718` (· 1280) | `--body-font-size-m`, `--weight-semibold` |
| Email | `a[href^=mailto]` `16px / weight 400 / #419468` (· 1280) | `--gallery-accent` |
| Phone | plain text `t: +420 …` (**no `tel:` link**; `telCount:0`) (· 1280) | fix -> `tel:` |
| LinkedIn / mini icons | link + `25×25` icons (email/LinkedIn) (· 1280) | SVG |

Responsive: 2-up `>=768`, 1-up stacked `<768`; group headings full-width.

### E.3 Interaction / a11y

- Emails are `mailto:` (keep). **Phones are text -> add `tel:` links.** Mini icons -> inline SVG +
  `aria-label`. Names -> real `<h3>`. Portrait `alt` = name. `:focus-visible` on all links.
  Anchor targets (`#corporate`, `#product`) drive in-page jumps, keep as section ids.

### E.4 EDS target + DA table

**Block `contact-directory`** (reuses the `exec-bio` card, no accordion). Department groups via
section headings; one row per contact; 2-up grid.

| (portrait) | (details) |
|---|---|
| ![](./kodym.jpg) | ### Vítězslav Kodym \n **Head of Product Communication** \n [e: vitezslav.kodym@skoda-auto.cz](mailto:…) \n t: [+420 604 …](tel:+420604…) \n [LinkedIn](…) |

`decorate()`: sniff portrait cell + details cell; build `<h3>` name, title line, `mailto:` email,
`tel:` phone, LinkedIn; group under authored headings; 2-up grid (1-up `<768`).

### E.5 Acceptance criteria

- [ ] Groups: Corporate Comms + Product Comms (+ lead contact); 2-up `>=768`, 1-up `<768`.
- [ ] Portrait `16:9` `object-fit:cover`, `alt` = name; name `<h3>` `24px/600`; title `16px/600`.
- [ ] Email `mailto:` emerald `#419468`; **phone is a `tel:` link** (source gap fixed).
- [ ] LinkedIn + mini icons are inline SVG with `aria-label`; `:focus-visible`.
- [ ] Anchor ids `#corporate` / `#product` preserved for in-page nav.
- [ ] Visual diff <= 2% at 1280/1024/768/mobile.

---

## Token gaps surfaced (add when these blocks land)

- `--heading-font-size-person: 24px` (board/contacts name; or reuse `--heading-font-size-m` 22px).
- `--ratio-a4: 141.42%` (annual-report PDF cover, `.ratio-1x1-4142`).
- `--qr-size: ~168–198px` (app-promo QR codes).
- `--app-badge-img-w: 305px` / `--app-badge-img-h: 87px` (app-promo raster store badges; distinct
  from footer's SVG `135×40`).
- Reuse existing candidates: `--gallery-accent: #419468` (all company-page links),
  `--gallery-accent-hover: #59bc87`, `--grid-gutter: 20px`, `--pill-radius: 50px`,
  `--card-radius: 8px`, `--dropdown-hover-bg: #f1f1f1`.

## Open questions

- Confirm portrait `cover` vs `fill` (source distorts) and the person-name heading size/level.
- Company-logo: dual-download as text links (source) vs `downloads` round buttons (upgrade)? And is
  the full taxonomy 3 groups × 6 colour variants (~36) or the ~18 assets live today?
- Annual-reports: authored rows vs a future year-driven index build; is the "save/heart" a real
  saved-list feature (client-side) or purely demo chrome?
- App-promo store badges: reuse footer SVG badges (rescaled) or keep the source raster `305×87`?
- Are these five pages in scope for M1 demo, or M2? (affects the SKODA-810 split above).
