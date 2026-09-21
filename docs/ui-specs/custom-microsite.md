# Template Spec: Custom Microsite (full-width event-gallery / campaign)

Status: **DRAFT+MEASURED** (structure + core layout measured live 2026-09-15 via Chrome DevTools;
full per-breakpoint sweep + a second campaign instance pending).
Foundations: [`_FOUNDATIONS.md`](_FOUNDATIONS.md). Map: [`_TEMPLATES.md`](_TEMPLATES.md).

Surfaced by the 2026-09-15 block recount ([`../analysis/SKODA-BLOCK-RECOUNT.md`](../analysis/SKODA-BLOCK-RECOUNT.md)
§2/§6/§8): **201 pages (5.8% of the site)**, a whole STO page family with **no prior spec, ticket, or
`_TEMPLATES` entry**. These are dated event-gallery + campaign microsites (world-premiere galleries,
`womens-day/*`), gallery-heavy, on a full-bleed shell.

## 1. Identity

- **Template:** full-width campaign / event-gallery microsite. WP body class
  `page-template-template-custom-full-width` on the `page` CPT + `siteorigin-panels`; STO side.
- **EDS target:** a full-bleed page template (`Metadata template = custom-microsite` or reuse the
  generic Page shell with a full-width Section Metadata style), composing existing blocks; no new block
  needed beyond the gallery.
- **Client PDF IDs:** none specific (a campaign page family, not in the requirements PDF); migration
  scope decision open (see §8 and recount §8).
- **Ticket:** **SKODA-210** (new).
- **Source references:**
  - `https://www.skoda-storyboard.com/en/skoda-peaq-world-premiere-event-gallery/` (page-id 444544)
  - `https://www.skoda-storyboard.com/en/skoda-epiq-press-kit-event-gallery/`
  - `https://www.skoda-storyboard.com/en/womens-day/lounge/`, `.../womens-day/coffee-break/`
- **Top-level selectors:** `body.page-template-template-custom-full-width`, `.content > .panel-grid`
  (full-bleed SiteOrigin body), `article.gallery-item` (colorbox tile) inside `.search-results-item`.

## 2. Page anatomy

```
HEADER (STO chrome)  = same shell as every STO page
.content                               (full-width, no 1248 content cap)
└── .panel-grid  (max-width:none, full-bleed)
    ├── SiteOrigin body: intro copy in a centered ~856px text column
    │      → siteorigin-body.md
    └── large image gallery: a .search-results grid of article.gallery-item (colorbox) tiles
           measured 264 tiles on the Peaq world-premiere page
           → gallery-lightbox.md (colorbox, rel-grouped) + the media-box grid
FOOTER (STO)
```

The defining trait: a **full-bleed layout** (the SiteOrigin panel-grid has `max-width:none`, unlike the
1248-capped content of stories/pages) fronting a **big colorbox photo gallery** with a short intro.

## 3. Composed components

- [`siteorigin-body.md`](siteorigin-body.md), the intro/copy region (SKODA-814).
- [`gallery-lightbox.md`](gallery-lightbox.md), the photo grid + colorbox viewer (SKODA-203). The tiles
  reuse the `.search-results` / media-box grid used by press-kit media + downloads.
- [`card-teaser.md`](card-teaser.md), where the microsite ends with related cards.
- Shared header/footer (STO), see [`_TEMPLATES.md`](_TEMPLATES.md).

## 4. Template-specific structure

- **Full-bleed content**: `.panel-grid` `max-width:none`, content spans the viewport, not the 1248 cap.
- **Gallery volume**: these pages carry very large galleries (264 colorbox images measured on one),
  so lazy-loading + the colorbox `rel`-group scoping (one gallery set per page, [`gallery-lightbox.md`](gallery-lightbox.md)
  §2) matter more here than anywhere else.

## 5. Measured visual base

`PW` = the Peaq world-premiere gallery page. Values `measured (url · selector · viewport) -> token`.

- **Content wrapper** `.content > .panel-grid`: width `1280` at 1280, `max-width:none`, `padding:0`
  (full-bleed) (· PW · 1280). This is the key difference from the capped Page shell.
- **Intro text column** (`.siteorigin-widget-tinymce` / `.sow-editor`): `856px` wide, centered, body
  `16px / 24px / 400` `#161718` (· PW · 1280). So copy is centered/constrained even though the shell is
  full-bleed.
- **Gallery tile** (`article.gallery-item` inside `.search-results-item`): `199 x 112` (≈ 16:9), tile
  wrapper `219px`, colorbox link per tile (· PW · 1280). Grid columns per breakpoint: capture pending
  (reuses the media-box grid, ~4-col desktop).

> Pending: gallery grid column counts + gutters at 500/768/1024/1280, the intro column width at each
> band, and a second (womens-day) instance to separate template from per-page authoring.

## 6. Interaction/behavior

- Gallery: colorbox open/prev/next/close, scoped to the page's `rel` group; see [`gallery-lightbox.md`](gallery-lightbox.md)
  §5. Given the tile volume, thumbnails should lazy-load.

## 7. Accessibility

- Single page `<h1>` (title); gallery tiles are labeled links/buttons; the lightbox is a real dialog
  with focus trap + Escape + arrows (the a11y gate in [`gallery-lightbox.md`](gallery-lightbox.md) §6).
- Large image sets need meaningful `alt` and a keyboard-navigable grid.

## 8. Open decisions + recommended default

- **Migrate / fold / drop (the real question, recount §8):** 201 pages, mostly dated campaign/event
  microsites. Recommend: **do not build a bespoke template.** Migrate the still-relevant ones as generic
  Pages ([`template-page-base.md`](template-page-base.md)) with a full-width Section Metadata style + the
  `gallery` block, and **archive/drop the expired campaigns** (agree a cutoff date with the client).
  A dedicated `custom-microsite` template is only worth it if new event galleries are an ongoing need.
  (Assumption to confirm with the client.)
- **Full-bleed mechanism:** a Section Metadata `Style: full-width` on the generic Page shell, rather
  than a new template, keeps the block count down.

## 9. Pixel-perfect acceptance criteria

- [ ] Full-bleed: the gallery/content region spans the viewport (no 1248 cap) while the intro copy stays
      in its centered `~856px` column.
- [ ] Gallery: tiles render `≈16:9`, open the lightbox scoped to this page's set; large sets lazy-load.
- [ ] Composes cleanly from `siteorigin-body` + `gallery` + `card-teaser` (no bespoke one-off CSS).
- [ ] A11y gate inherited from `gallery-lightbox.md` §6 (dialog, focus trap, Escape, arrows, alts).
- [ ] Visual diff vs source at 1280/768/mobile <= 2% per-pixel (excluding image content), for any page
      chosen to migrate.

## 10. Reference screenshots

`assets/custom-microsite/`: capture pending (Peaq world-premiere gallery at 1280/768/mobile + a
womens-day instance).
