# SKODA-207, Series template (2-level: directory + hub)
- **Epic:** E02, Core Blocks
- **Type:** template / import
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (demo)
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 2–4d *(planning estimate, not a quote)*
- **GitHub issue:** [#21](https://github.com/skoda-storyboard/demo/issues/21)
- **Scope split:** five curated hubs in M1; the 25-card `/en/series-2/` directory in M2

## UI Specification
**Authoritative, DevTools-measured spec:** [`docs/ui-specs/series.md`](../../ui-specs/series.md).
Page-type context: [`_TEMPLATES.md`](../../ui-specs/_TEMPLATES.md). The spec cites live
source URL + selector + viewport for bounding boxes and computed styles, not screenshots.
The older uniform, newest-first and index-driven hub design is **superseded**: source hubs
are authored mosaics whose tiles must retain size, order and mixed content types.

## Summary
Specify and implement a real **two-level Series template**, not the 301 redirect once
assumed in the master doc. Level 1 is the 25-card editorial directory (`/en/series-2/`,
M2); level 2 is five named hubs (`/en/series/<slug>/`, M1), each with an authored
Story/Press Kits tile mosaic. Reuse `hero-image`, `cards` and the shared
`card-teaser` primitive. SKODA-221 owns the reusable `Cards (overlay, tiles)`
mosaic variant; this ticket owns Series import/authoring and its M2 directory
excerpt treatment. Both levels are described here, but the M1 URL set does not
acquire the directory.

**Hub corpus (M1, in source order of URLs below):**

| Source URL suffix under `/en/series/` | Authored tile count | Special case |
|---|---:|---|
| `125-years-of-motorsport/` | 8 | 2-cell, 3-cell, 3-cell mosaic rows |
| `130-years/` | 14 | 13 Stories + **1 Press Kits**; date inversion among tiles 1–3 |
| `roads-places/` | 10 | Mixed 2- and 3-cell mosaic rows |
| `unexpected-jobs/` | 5 | One 2-cell and one 3-cell row |
| `minutes-from-car-production/` | 12 | Mixed 2- and 3-cell mosaic rows |

Source: each URL's `.panel-layout > .panel-grid article.article-teaser` at
1280×900 in Chrome DevTools. The directory has **25 cards in 13 authored
rows** (source `/en/series-2/`, same selector/viewport). Index tags are not
the membership/order authority for either page type. An unpublished linked
Story must not silently disappear from its hub; out-of-demo destinations
follow SKODA-609 instead.

## Description
**Measured target** (more measurements and element selectors in `series.md` §3):
- **Hero:** at 1280×900, `.hero .hero-image` is 1280×556.2 (=61.8vh);
  H1 white 48/52.8/300; hub SERIES badge plus white 20/30/600 standfirst.
  At 375×812 the image is 375×210.9 (16:9), followed by dark
  48/52.8/300 H1, grey SERIES badge and dark 20/30/600 standfirst.
  The badge itself is x=18/y=459.5, 63.6×21 at 375, white 11/11/600
  uppercase on `#7c7d7e`, padding 5px 10px (existing tag tokens).
  Transition is at **768px**; do not shrink the mobile title.
- **Hub tiles:** at 1280, the track is 1248px wide and card edges are 20px
  apart. The motorsport rows yield 604×604 square, 292×292 small square,
  604×292 wide, and 396×188 third tiles; over-image title is white
  16/18/500, no date/excerpt. At 375, all tiles are 1-up 16:9
  (first x=10/w=355/h=199.7). Ratio/hero transition is 767/768;
  SiteOrigin's cell stacking changes separately at **780/781**.
- **Directory cards:** two columns from 781, one below (at 1280, first
  x=26/w=604; media 604×292; at 375 media 355×199.7). Eight-pixel
  media radius, white 16/18/500 title **over image**, 16/24/400
  two-line excerpt **below** it, 64px card bottom margin, no date.

## Requirements / Spec
- **Source recognition:** keep `page-templates.json`'s Series selectors (`div.hero`,
  `.panel-layout`); detect the directory via `data-content-type="Series"` cards,
  the hub via `single-skoda_series` DOM with possible **mixed** `Story`/`Press Kits`
  cards. Do not classify a hub by first card type, by slug, or by a presumed
  two-column grid. Preserve source `.panel-grid` row boundaries and each
  article's original position, `data-content-type`, link, title, media, alt and
  inferred size (ratio class + actual row/cell width).
- **Hub authoring:** emit `Hero Image (overlay)` plus one **authored** `Cards
  (overlay, tiles)` table in source order with pinned `cards-tiles` v1 rows
  `[size token, picture, linked title]`. Tokens are `sq`, `sq-small`, `wide`,
  `third`, `feature` (e.g. motorsport rows: `[sq,sq]`,
  `[sq-small,wide,sq-small]`, `[third,third,third]`). Verify that token sequence
  retains all row breaks/partial rows for all five hubs; if it cannot,
  version the DA shape in both `SKODA-PENDING-BLOCK-CONTRACTS.md` and
  `tools/importer/push/block-contracts.json` **in the implementation PR**.
  Tiles carry no date, excerpt, faceted filters, sort or load-more.
- **Directory authoring (M2):** hero plus 25 rows of a proposed `Cards
  (overlay, series-directory)` variant, `[picture, linked title + excerpt]`.
  Pin this variant's DA shape in the same two contract files before importing
  M2. The excerpt must render below, not inside the absolute card overlay;
  image and title remain one card link. Keep all 25 source cards in authored
  order; the directory must not depend on an index of only the five M1 hubs.
- **Hero/metadata:** `parsers/hero-banner.js` currently emits `Hero`, a
  boilerplate stub; change the Series output to `Hero Image (overlay)` (picture
  then H1 + optional SERIES badge/perex) without regressing other templates.
  The shared `skoda-metadata.js` emits canonical `template=skoda_series` for
  hubs and `template=page` for directory, plus title, description and image
  where present. Hub index metadata feeds the homepage Series rail, **not**
  the hub mosaic. Verify the hero is a single H1 and includes the source
  badge/standfirst, not merely an image/title.
- **Runtime/UI ownership:** reuse `blocks/hero-image/`, `blocks/cards/` and
  `scripts/card-teaser.js`; SKODA-221 implements shared mosaic size tokens and
  grid styling. Current `blocks/cards/cards.js` does **not** consume a leading
  size cell: it would render the token as body text. The "readable fallback"
  in the pending contract is not proven. For source parity, gate publishing on
  SKODA-221 or a verified readable fallback with zero visible tokens.
  A scoped tiles/Series hero treatment must move the H1/badge/perex below
  the image on mobile without changing unrelated story/archive heroes.
  Keep CSS component-scoped/tokenized, preserve card focus and image
  editability, and coordinate SKODA-221/805a shared-card edits serially.
- **Import pipeline:** update `import-series-hub.js`,
  `import-series-directory.js`, their `page-templates.json` descriptions,
  the `parsers/series-grid.js` output and `urls-series-hub.txt` (currently
  **one** URL), then regenerate `.bundle.js` artifacts. Keep shared cleanup,
  sections, metadata, image and link transformers; do not hand-write `content/`.
  Today's `series-grid.js` emits `Listing` with `tags=<slug>` while
  `blocks/listing/listing.js` does not read `tags` and always sorts; this is
  an invalid contract, not a fallback to reuse. Build/apply media from the
  source cards; preserve master images, links and alt text. Gate preview and
  publish on SKODA-506 media checks, SKODA-603 block/metadata validation,
  SKODA-602 DA push/conflict protection, approval and index verification.
- **Link containment:** SKODA-605 rewrites only allowed URLs. Check every
  Story/Press Kits destination on hubs (including the 130-years kit); SKODA-609
  owns external-to-live behavior until the target is imported, and 0 in-site
  404s. For M2, 25 directory links must not silently point to only five
  EDS hubs. Add newly imported target URLs to the allow-list and regenerate it.

## Acceptance Criteria
Measurable per-viewport gates are in [`series.md` §9](../../ui-specs/series.md).
The M1 gates apply to all five hubs; directory gates apply when M2 is built.
- [ ] Import fixtures for each hub and the directory assert correct Hero Image,
      metadata, sections and exact curated Cards rows; no `Hero`, `Listing tags`,
      missing SERIES badge, printed size token, or source-chrome leak. Bundle
      outputs reflect the changed source importers.
- [ ] Five M1 hubs have **8/14/10/5/12** tiles in source order, matching
      title, image, alt and href, with 130-years retaining the Press Kits
      card and its date inversion. Directory M2 has all **25** source cards,
      excerpts below the overlaid titles and valid links.
- [ ] At 375/767/768/780/781/992/1280, QA uses Chrome DevTools on **both**
      source and rendered EDS: `getBoundingClientRect()` box edges/sizes within
      ±2px or ±2%, exact typography/colors and correct row/column/ratio
      transitions. Hero image 61.8vh at 1280 vs image-first 16:9 at 375;
      mobile H1 remains 48/300. No screenshot-based per-pixel percentage
      substituted for actual geometry.
- [ ] Keyboard focus, one link/tab stop per card, single H1, white-on-image
      contrast ≥4.5:1, no block JS/media failures. Metadata validation,
      `import:validate-blocks`, link crawl (0 in-site 404s), preview QA,
      explicit publish gate and live/reindex QA pass. Architect → Developer
      → independent QA; measured failures reopen the work.

## Dependencies
- Upstream: SKODA-201 (card primitive), SKODA-202 (`hero-image`),
  SKODA-221 (mosaic variant for source fidelity), SKODA-601 (import infra),
  SKODA-501/506 (media and preview/publish gate), SKODA-602/603
  (DA/content waves), SKODA-605/609 (links).
- Related: SKODA-826 (global 10px gutter), SKODA-805a (shares the
  mosaic variant), SKODA-402 (listing used elsewhere, **not** hub membership).
- Downstream: SKODA-1001 (per-locale trees). Directory remains M2 and
  must not be included in the M1 43-URL set by this ticket.

## Risks / Flags
- **Authored row boundaries:** the pending size tokens encode tile widths,
  but need a proof for every 2/3-cell row and final partial row; synchronize
  any necessary shape/version update before importing content.
- **221 availability:** W3 previously allowed plain cards because 221 was
  Could. Source-fidelity acceptance requires SKODA-221 or an explicitly
  measured readable fallback, not an unreviewed publication of raw tokens.
- **Destination coverage:** static cards preserve counts even when target
  pages are outside the indexed/demo corpus, but do not make their links
  local. Audit every tile under SKODA-609.

## Import contract (SKODA-603)
Contract(s) `cards-tiles`, `hero` in
[`SKODA-PENDING-BLOCK-CONTRACTS.md`](../../planning/SKODA-PENDING-BLOCK-CONTRACTS.md).
Only the **hub** table shape is pinned (`Cards (overlay, tiles)` v1); the
directory excerpt variant proposed above must be pinned in Markdown **and**
JSON before M2 import. Do not change the machine-readable contract in a
documentation-only revision. A hub shape change requires a same-PR
`shape` bump and re-import/re-QA of affected pages (SKODA-603 rules).
