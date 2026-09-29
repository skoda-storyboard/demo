# Component Spec: Series (directory + hub)

Status: **RE-MEASURED** against live source DOM and computed styles via Chrome DevTools (no
screenshots used as measurement evidence). Foundations: [`_FOUNDATIONS.md`](_FOUNDATIONS.md).
Method: [`_CAPTURE-PROTOCOL.md`](_CAPTURE-PROTOCOL.md). Ticket: [SKODA-207](../tickets/tickets/SKODA-207.md).

**Delivery split:** the five hubs listed in §2 are M1; `/en/series-2/` is M2. This specifies both
levels now, not 25 new hub imports in M1. Older two-column/newest-first/index-driven hub descriptions
are superseded by the live URL-to-block [sweep](../reviews/SKODA-M1-URL-BLOCK-SWEEP.md) and the
direct measurements below. The series hub importer now emits the authored tiles for
15 preview-only hubs (SKODA-207); the SKODA-221 renderer needs measured QA before publish.

## 1. Identity

- **Component:** Series, two surfaces: M2 directory of series cards with excerpts, and M1
  editorial hubs of linked Story/Press Kits tiles. Reuse the existing `cards` block and shared
  [`card-teaser.md`](card-teaser.md) primitive, plus `hero-image` ([`hero.md`](hero.md)).
  The mosaic size-token variant is owned by [SKODA-221](../tickets/tickets/SKODA-221.md);
  the series directory needs its own excerpt-below-image treatment. No index-driven `series`
  block or faceted `listing` is needed for the authored grids.
- **Client PDF IDs:** STO-S01 (Series hero), STO-S03 (Series card), STO-H07 (homepage series rail);
  MR references via the cards family.
- **Ticket:** SKODA-207.
- **Source references + selectors:** directory
  `https://www.skoda-storyboard.com/en/series-2/` (`body.page-template-template-tiles`);
  hubs `https://www.skoda-storyboard.com/en/series/125-years-of-motorsport/`,
  `https://www.skoda-storyboard.com/en/series/130-years/`,
  `https://www.skoda-storyboard.com/en/series/roads-places/`,
  `https://www.skoda-storyboard.com/en/series/unexpected-jobs/` and
  `https://www.skoda-storyboard.com/en/series/minutes-from-car-production/`
  (`body.single-skoda_series`). In both: `div.hero` contains `.hero-image` and
  `.hero-caption`; `.panel-layout > .panel-grid > .panel-grid-cell` contains
  `article.article-teaser` with `data-content-type` and a linked image/title.

## 2. Source anatomy

```
DIRECTORY body.page-template-template-tiles
├── div.hero > .hero-image + .hero-caption h1
└── .panel-layout > .panel-grid (13 authored rows)
    └── .panel-grid-cell (2 per row, except last)
        └── article.article-teaser.has-excerpt[data-content-type="Series"]
            ├── a > .ratio-container.ratio-2x1 img + h2.heading (overlay)
            └── .article-teaser-excerpt-wrapper > .article-teaser-excerpt (below image)

HUB body.single-skoda_series
├── div.hero > .hero-image + .hero-caption (h1, SERIES badge, p.perex)
└── .panel-layout > .panel-grid (authored 2/3-cell rows)
    └── .panel-grid-cell > article.article-teaser[data-content-type]
        └── a > .ratio-container.ratio-1x1|ratio-2x1 img + h2.heading (overlay)
```

**Authoring is the ordering signal.** The directory contains 25 series cards in 13 rows, in source
order; the five M1 hubs have 8 / 14 / 10 / 5 / 12 tiles, respectively (live
`.panel-layout article.article-teaser` at 1280). On `/130-years/`, the first three `data-publish-date` values
are 2025-12-17, 2025-11-21, **2025-12-09**: sorting would move tile 3 before tile 2.
It also contains a `data-content-type="Press Kits"` tile (the other 13 are Stories).
Never infer membership from `tags`, sort by date, or filter to Stories; keep the explicit
DOM order and destination of **every** tile. No tile has a visible date. Retire SiteOrigin
panels and dotdotdot without losing the authored rows.

Source row shapes at 1280×900 (live `.panel-layout > .panel-grid >
.panel-grid-cell` for each URL in §1), expressed with the pinned `cards-tiles`
size tokens: `sq` = 604×604 card, `sq-small` = 292×292, `wide` = 604×292,
`third` = 396×188. These are card sizes after the 10px inset on each cell;
row boundaries must survive import.

| Hub slug | Authored row shape, top to bottom |
|---|---|
| `125-years-of-motorsport` | `sq sq` / `sq-small wide sq-small` / `third third third` |
| `130-years` | `third third third` / `sq-small wide sq-small` / `sq sq` / `third third third` / `sq-small wide sq-small` |
| `roads-places` | `sq-small wide sq-small` / `sq sq` / `third third third` / `wide wide` |
| `unexpected-jobs` | `wide wide` / `third third third` |
| `minutes-from-car-production` | `wide wide` / `sq-small sq-small wide` / `wide wide` / `wide sq-small sq-small` / `wide wide` |

## 3. Measured visual spec

Measurements below use `getBoundingClientRect()` and `getComputedStyle()` on the named live selector.
`DIR` is the directory URL in §1; `HUB` is the motorsport URL unless otherwise named. Boxes include
their x-position and size, not just a guessed image ratio. Map design values to the existing tokens
`--content-max-width`, `--card-radius`, `--body-font-size-m`, `--weight-medium`, `--skoda-white`,
`--skoda-ink`, `--skoda-grey-500`, `--tag-padding`, `--tag-font-size`,
`--spacing-xxl`, `--grid-gutter` (20px),
`--hero-vh` and `--heading-font-size-hero`.

| Source · selector · viewport | Measured behavior |
|---|---|
| DIR · `.hero .hero-image`, `.hero h1` · 1280×900 | Image 1280×556.2 (`61.8vh`), white H1 48/52.8/300; grid begins y=688.2 after hero and 24px margin. |
| DIR · `.panel-layout`, first `.panel-grid-cell`, `.ratio-container` · 1280×900 | Track x=16/w=1248, two 624px cells; inset card x=26/w=604, image 604×292 (~2:1) with 8px radius; next card x=650 (20px card gap). |
| DIR · first `.heading`, `.article-teaser-excerpt` · 1280×900 | White over-image title 16px/18px/500, 16px inset; excerpt starts below image at y=990.2, 16px/24px/400 ink, 8px padding, 2-line clamp; card margin-bottom 64px. No visible date. |
| DIR · first `.panel-grid-cell`, `.ratio-container` · 992×900 | Two 496px cells with 476×228 image boxes. |
| DIR · first `.panel-grid-cell` · 780×900 / 781×900 | 780: two stacked 780px cells; 781: two side-by-side ~391px cells. |
| DIR · `.hero .hero-image`, first `.ratio-container` · 375×812 | Image 375×210.9; dark 48/52.8/300 H1 below at x=10/w=355. Card x=10/w=355 with 355×199.7 16:9 media, excerpt below; rows stack. |
| HUB · `.hero .hero-image`, `h1`, `.perex` · 1280×900 | Image 1280×556.2 (`61.8vh`); white H1 x=26/w=1228, 48/52.8/300; white perex 20/30/600; SERIES label present. |
| HUB · `.panel-layout > .panel-grid` · 1280×900 | Track x=16/w=1248. Motorsport rows: `624×624 + 624×624`; `312×312 + 624×312 + 312×312`; `416×208 × 3`. Corresponding inset tile boxes: 604×604, 292×292, 604×292, 396×188 (20px between cards). |
| HUB · first card `.ratio-container`, `.heading` · 1280×900 | Square 604×604, 8px radius; over-image title 16/18/500 white, 16px inset; no excerpt/date. Wide and third tiles are ~2:1. |
| HUB · `.hero`, first `.ratio-container` · 375×812 | Image 375×210.9 (16:9), then dark H1 x=10/w=355 at 48/52.8/300, grey SERIES badge and dark perex 20/30/600. First tile x=10/w=355/h=199.7 (16:9); all tiles 1-up with 20px vertical separation. |
| HUB · `.hero .category .label` · 375×812 | SERIES badge x=18/y=459.5, 63.6×21; white 11px/11px/600 uppercase on `#7c7d7e`, padding 5px 10px (`--tag-font-size`, `--tag-padding`, `--skoda-grey-500`). |
| HUB · `.hero .hero-image`, first `.ratio-container` · 767×900 / 768×900 | At 767 the image and dark caption are stacked, and tiles use 16:9. At 768 the image is 61.8vh with white overlay; tiles stack but retain square/wide ratios (first tile 748×748). |

## 4. Responsive behavior

- **Source has two distinct transitions.** At **768px** the hero changes from 16:9 image followed by
  dark caption to 61.8vh image with white overlay; mosaic tile ratios switch from all 16:9 to each
  authored square/wide/third shape. At **781px** SiteOrigin grid cells switch from stacked to
  side-by-side; preserve the row's 2/3-cell composition. Test 767/768 and 780/781, as well as
  375/992/1280. A full-width stacked square at 768 is source behavior, not a measurement mistake.
- Hero title stays **48px/300 even at 375**; standfirst is 20px/30px/600. Directory cards have
  16px/18px/500 titles, 16px/24px excerpts under images, and no dates.

## 5. Interaction states

- **Card:** one usable link per card to the authored hub or Story/Press Kits destination. Preserve
  the href and source order; use the existing `card-teaser` keyboard/focus contract, with no cart,
  load-more, facets, or sort UI. Out-of-scope URLs must follow SKODA-609 rather than become EDS 404s.
- **Hero:** non-interactive (no CTA), per `hero.md` §5. Do not turn the SERIES label into a
  broken archive link.

## 6. Accessibility

- One tab stop per card, title as accessible link name and visible `:focus-visible` ring; retain
  sensible image alt text without inventing it for decorative source images.
- White over-image tile title contrast ≥4.5:1 with a scoped title-line backdrop;
  the source's two gradients alone measure as low as ~1.39:1 behind tile
  titles on the M1 Motorsport hub. The title-only contrast upgrade is an
  intentional fidelity deviation; dark-on-light mobile H1/perex also clear.
- Real list (`<ul>/<li>`); one H1 in the hero per page; excerpt must not replace the link title.

## 7. EDS target

**Reuse authored blocks, not an index lookup for page tiles.** Both pages have a `Hero Image
(overlay)` with image, H1 and optional caption; hubs additionally have the SERIES label and
standfirst. The source's hub mosaic is `Cards (overlay, tiles)` (pinned SKODA-603 contract, UI
variant SKODA-221). The M2 directory needs `Cards (overlay, series-directory)` or an equivalent
explicit variant for an excerpt **below** a title-over-image card, not a standard overlay summary.
Choose/pin that new shape in the future implementation PR in **both** the Markdown and
`tools/importer/push/block-contracts.json` (bump `shape` if changing an existing contract). The
query index continues to supply the homepage Series rail from page metadata, not these grids.

### DA authoring model

Hub, **pinned** `cards-tiles` shape 3 (`SKODA-PENDING-BLOCK-CONTRACTS.md`), one row per source tile in
DOM order, including non-Story tiles:

| Header | First cell | Second cell | Third cell |
|---|---|---|---|
| `Cards (overlay, tiles)` | `sq` / `sq-small` / `wide` / `third` / `feature` | `<picture>` with source alt | `<a href="/en/…">Title</a>` |

E.g. motorsport row 1 = `sq, sq`; row 2 = `sq-small, wide, sq-small`; row 3 =
`third, third, third`. **Order/row boundaries matter**: a row fills 12/12
or ends explicitly with `end` on its last tile (`wide end` for a short row).
The series importer proves all 15 hub row compositions in `series-hub.test.mjs`;
the renderer must reject overfilled/unterminated rows rather than guess.
Card width tokens are **not** rendered card text. The SKODA-221 renderer consumes them
and makes the linked title an H2; QA of all previewed series hubs is still required
before publication.

Directory, **proposed, not pinned**: `Cards (overlay, series-directory)`, one row per series
`[<picture>, <a href="/en/series/…">Title</a> + <p>excerpt</p>]` (two cells, same base
cards shape). The variant must place only the title on the image, with the excerpt *outside*
the clipped image area; this likely needs variant-specific decoration/layout using
`scripts/card-teaser.js`, not just a summary in today's absolute overlay body. Preserve all
25 authored rows, their order, image/alt, excerpt, and links. Retain `template=page` on the
directory, `template=skoda_series` on hubs via `skoda-metadata.js`; Metadata also needs
title, description and image, and hub metadata must stay indexable for the homepage rail.

### Importer + runtime handoff (series hubs preview-only; M2 directory still pending)

1. `page-templates.json`, `import-series-hub.js`/`import-series-directory.js` and their bundles:
   expand the five-hub URL list; locate `.hero` and `.panel-layout` by source DOM, recognize
   directory vs hub from `data-content-type="Series"` vs a hub with mixed `Story`/`Press Kits`,
   never from a presumed first-card type or location alone. Preserve rows/tokens/links before
   SiteOrigin wrappers are discarded. Keep the shared cleanup, sections, metadata, links, and
   image normalization stages. Do **not** emit a `Listing` with `tags`: `listing.js` does not
   read that key and always sorts; `series-grid.js` currently emits exactly this invalid shape.
2. `hero-banner.js` currently emits `Hero` (boilerplate stub). Series pages need `Hero Image
   (overlay)` and the source SERIES badge + standfirst in the content cell. Avoid changing the
   shape of other banners without testing their consumers. The existing `hero-image.overlay`
   CSS overlays white text on mobile, so it needs a scoped series/tiles mobile treatment to
   position dark title/badge/perex below the image without regressing unrelated heroes.
3. SKODA-221 owns `Cards (overlay, tiles)` rendering in `blocks/cards/` and the shared
   `scripts/card-teaser.js`/CSS. SKODA-207 owns the series importer and directory-specific
   variant, coordinating shared edits rather than concurrently changing the same files.
   Style component CSS per [`css-guidelines.md`](../guardrails/css-guidelines.md): reuse tokens,
   intrinsic sizing first, breakpoints only for measured behavior, retain focus and image
   editability. Keep mobile media `object-fit: cover` and 16:9 while matching measured boxes.
4. Import → regenerate bundles → media build/apply → metadata and pending-block validation →
   SKODA-506 media gate → SKODA-602 push/preview → QA → explicit publish approval/reindex via
   SKODA-603. SKODA-605 rewrites only allow-listed demo destinations; SKODA-609 governs other
   story, press-kit and M2 directory links. Do not point the directory's other 20 hubs to EDS
   404 pages if they remain unimported. Never hand-author `content/` pages.

## 8. Open decisions + recommended default

- **Decided:** source fidelity, editorial ordering and curated membership at both levels;
  directory M2, five hubs M1; no redesign to 1/2/3 columns or newest-first ordering.
- **Implementation decisions to verify against real imported output:** can the pinned size
  tokens alone retain every row boundary (including mixed `sq`/`wide` rows), or does the
  `cards-tiles` shape need an explicit row signal? If so, change and version both contract
  representations together before import; do not invent silent runtime heuristics. Validate
  the directory excerpt placement and all missing hub destinations under SKODA-609.
- **Tokens:** reuse the current hero/card/spacing tokens; introduce a semantic token only
  when an unmatched reusable dimension truly requires it. No source CSS copied wholesale.

## 9. Pixel-perfect acceptance criteria

- [ ] Importer fixtures for `/en/series-2/` and **each of the five** hubs emit
      `Hero Image (overlay)` + exactly one curated Cards table, Metadata and correct
      section breaks; no `Hero`/`Listing tags`, no dropped mixed-type tile, no visible
      size token. `import:validate-blocks` and metadata validation pass.
- [ ] Source-card census vs EDS: directory 25 links, hubs **8/14/10/5/12** in
      exact authored order, with matching title, destination, media, alt and card
      type; 130-years contains its Press Kits tile. No sort/load-more/facets or
      visible date. Dead-link crawl finds 0 in-site 404s.
- [ ] Layout measured with DevTools at **375, 767, 768, 780, 781, 992 and 1280**
      (900px high except the 375×812 mobile sample): compare source and EDS
      `getBoundingClientRect()` positions/sizes within **±2px or ±2%**, and
      exact column state, font size/weight/line-height and color. Investigate
      every discrepancy in the shared 221/826 layers before a local workaround.
- [ ] Directory: 2-up from 781, 1-up below; desktop 2:1 card media
      604×292 at 1280, mobile 355×199.7 at 375, white 16/18/500
      title over image, excerpt **below** at 16/24/400 and two-line clamp,
      8px radius, 20px card gap; no date.
- [ ] Hubs: at 1280 the hero image is **556.2px at 900px viewport height**
      (61.8vh), white 48/52.8/300 H1, SERIES badge, 20/30/600 perex.
      At 375 image 16:9 with same-size dark H1/standfirst below and badge
      visible. The per-hub square/wide/third mosaics match row shapes in §2/§3
      (20px gap), stacked 16:9 at 375. No 221 token text or broken fallback.
- [ ] Each tile exposes one accessible link and visible keyboard focus;
      single H1, readable overlay contrast ≥4.5:1, no missing media or block
      script. QA compares **rendered** EDS to live source after publish/reindex;
      Architect reopens discrepancies and Developer fixes before QA accepts.

## 10. Reference screenshots

Prior captures under `assets/series/` are visual aids only. The acceptance oracle above is
the live DOM, computed styles, authored card census and rendered EDS measurements; do not
infer box dimensions or a per-pixel percentage from screenshots.
