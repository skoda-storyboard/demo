# SKODA-845, Media Room Newsletter page: press-release carousels by plant (`template-carousel-listing`)
- **Epic:** E08, Editorial at Scale
- **Type:** template / import · **Phase:** B · **Milestone:** M2 (go-live 02 Jan 2027)
- **GitHub issue:** [#365](https://github.com/skoda-storyboard/demo/issues/365) (created 2026-10-15 from the M2 readiness review)
- **Estimate:** 1–2 SP *(planning estimate, not a quote)*
- **Status (2026-10-22):** 🟡 Built on branch `skoda-845-newsletter`, stacked on `skoda-813-page-shell` (#409: the
  page band). Local only: nothing committed, pushed or previewed yet. See "Implementation (2026-10-22)".

## Why
`/en/newsletter/` is linked from the Media Room nav **Company** menu. It is the only page on
`template-carousel-listing`: a hero, then 2 carousels with 30 press-release teasers in total. These are the plant
newsletters, grouped by plant (Kvasiny, Vrchlabí, …).

The 24 Sep import plan routed it to page base, which would lose the carousels.

## Scope
- Reuse Story Rail `press` (SKODA-224), one rail per plant, fed from the query index (press releases whose title or tag
  names the plant). No new block.
- Page metadata on the MR side (nav, footer).

## Acceptance criteria
- [ ] Same rails, same order, same newest items as the source at QA time. Each card links to a live press release or
      to the source (link allow-list).
- [ ] New plant newsletters appear without editing the page (index-driven).

## Dependencies
224 ✅, 401 ✅, 309 ✅. Find out how the source groups the items (tag vs title) before building.

## Implementation (2026-10-22)
**How the source groups the items** (the ticket's open question): by WordPress taxonomy, not title. Each teaser
is a press release in the `newsletter` category (`category-newsletter`) and a plant's company term
(`company-kvasiny`, `company-vrchlabi`). The category holds 6 English press releases, all shown: 3 per plant,
newest first (25.9., 12.6., 27.3.2026). `company` alone isn't enough: `company: kvasiny` also matches the Octavia
production release.

**Built**
- Index: press releases carry `categories` too (`skoda-metadata.js` + `skoda-metadata-extract.mjs`, the
  SKODA-831 reader, gated on story / press_release); a plant newsletter gets `categories: newsletter`. The 19
  importer bundles that embed the metadata step carry the change.
- `story-rail`: a `categories` config key (index column, any-of), as the `stories` block reads it; registered in
  `block-contracts.json`.
- `parsers/carousel-listing.js` + `import-carousel-listing.js`: the band (`Hero Image (page)`, SKODA-813), then
  per source carousel a section with its h3 and a `Story Rail` (`template: press_release`, `categories`,
  `company`: the one term per key every teaser shares, read from their classes; a carousel with two, or with
  term ids only, is dropped rather than ORed), `Style: carousel-listing`. New plant newsletters appear without
  editing the page.
- `styles.css` `carousel-listing`: h3 24px under the band, 48px between rails and before the footer, cards
  20px under the h3, no list-item margin under the cards. The rail itself is the existing wide news rail.
- The Media Room nav / footer: the bulk metadata sheet already has `/en/newsletter`. Nothing to add.
- Library entry, contract (`carousel-listing`, `story-rail` `categories`), metadata schema, template map,
  tests (the parser: 3; story-rail `categories`; the categories gate).

**Imported locally** (not pushed): `/en/newsletter` and the 6 newsletters; 2 of them (`…-plant-1-2026`, both
plants) are not on preview yet, and the 4 that are have no `categories` there until re-pushed.

**Measured, the source vs the local import** (local code, the import rendered as delivered, the index with the
6 local newsletter rows; 390 / 768 / 992 / 1280 / 1440)

| | Result |
|---|---|
| Band 240px, title 48/52.8/300 white | equal |
| Plant h3 26/32.5/600 ink, x and y (24px under the band, 48px under the rail before) | equal |
| Cards: 331 / 325.6 / 277.6 / 354.4px (90 / 45 / 30%), 20px apart, 8px radius, shadow; heading → cards 20px | equal |
| Card title 18/21.6 white, 2 lines then "…", 16px from the bottom; date 11/11/600 white | equal (date 1.5px lower, below) |
| Arrows 32px on the cards' middle; disabled at 1280+ (3 cards fit); at 390 Next / Previous move one card | equal (the end position, below) |
| Last rail → footer 48px; page height | equal (992: below) |
| Heading outline: H1 Newsletter → H3 plant → H3 × 3 card titles, twice | equal |
| Card click | opens our press release (its h1) |
| axe (WCAG 2.1 A/AA) at 390 and 1280 | 0 violations (the source: link-name on the card "more" links, footer links) |
| Pixel diff, band + body, 1280 / 500 | band 0.07% / 0.02%; body 22% / 33%, all inside the card photos (the image zoom, below) |

**Found, not in this ticket** (shared code; the same on the Media Room home's News rail)
- **Card image zoom:** the source draws each teaser image 2% larger than its card (361.5 × 241 in 354.4 × 199.3,
  centred); ours covers the card exactly, so every photo is shifted by a few pixels (`styles/card-teaser.css`).
- **Card date:** 1.5px lower than the source's (our block date on an 11px line vs the source's inline span).
- **Carousel end:** on the last Next the source scrolls the last card to the left edge (x10 at 390), leaving
  space on the right; ours stops with it at the right edge (x49).
- **Short pages:** at 992 × 900 the page is shorter than the window; our footer sits at the window's bottom
  (900), the source's right after the content (885).
- **The press-release importer bundle drops the Tags block** (since 412396c, 2026-10-15, on `main`): the bundle
  was edited by hand and declares `text4` but reads `text5`, so the Tags parser throws on every press release.
  The 22 press releases re-imported for #414 are on preview without their sidebar Tags (live still has them).
  Fixed on this branch (the bundle now equals a fresh build of its sources); `main` / #414 still need it.
- `import-press-release`, `import-images-listing` and `import-videos-listing` were built from another folder (their
  source-path comments differ from a fresh build; `import-images-listing` also keeps one unused variable). Only this
  ticket's lines were changed in them.

**Still open:** push the 6 newsletters (2 new) and `/en/newsletter` to preview, check the branch preview against
the source, then the PR.
