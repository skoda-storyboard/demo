# SKODA-224, Story Rail `press` variant (Related Press Releases band)
- **Epic:** E02, Core Blocks
- **Type:** block variant
- **Phase:** A · **Milestone:** M1 (demo-visible on 4 of 5 M1 press releases)
- **Estimate:** 1 SP · AI-assisted 0.5d / manual 1d *(planning estimate, not a quote)*
- **Status (2026-09-27):** 🔵 TODO

## Origin
SKODA-607 phase split (2026-09-27); absorbs the block half of SKODA-612 (the importer half ships in 607).

## Problem (measured, source DevTools 2026-09-27)
- The source second `.cover-box.dark` is "Related Press Releases" (`.search-results.type-press_release`): a Flickity
  carousel `{"cellAlign":"left","groupCells":true,"pageDots":false}`: no autoplay, no wrap, prev/next arrows
  (disabled when everything fits, e.g. the Board release with 1 card).
- Cells are **374 wide at 1280** (card **354×199**, 16:9 image), 346 at 768, 450 at 500. The card overlays a date
  (11px/600 white) and a title (**26px/32.5/600 white**, clipped with "…") on the image; the whole card is a link.
- Card counts on the M1 set: Zellmer 10 (+ an "All" cell), National Theatre 5, Board 1, Peaq 6; Superb has no band.
- `blocks/story-rail` renders curated rows through the carousel, but with fixed 90/30/22.5% cells and the default
  card-teaser sizes (story-rail.css:294-308). There's no variant hook for press cards.

## Scope
- `blocks/story-rail` (+ the carousel card styles it uses): add the `press` variant (`Story Rail (press)`):
  - 374px cell pitch at 1280 / 346 at 768 / 450 at 500 (or the fluid equivalent); card 16:9 with overlay date + title
    at the measured sizes; title clipped to its lines;
  - arrows as the source, no dots, no autoplay; arrows disabled when all cards fit;
  - works in curated mode (rows `[<picture>, <p>date</p><h3><a>Title</a></h3>]`) and in index mode
    (`template: press_release`).
- The band heading, "Based on tags: …" line and "All" link stay default content in the section (authored before the
  block); style them in the press-release template (SKODA-607), not here.

## Acceptance Criteria
- [ ] On Zellmer, National Theatre, Board and Peaq (branch preview), card and cell geometry match the source at
      1280/1024/768/500 (±2px); arrows behave as the source (Board: both disabled).
- [ ] Card click navigates, drag scrolls (SKODA-212a behaviour); no `href=""` anywhere.
- [ ] Story related rails (SKODA-820) unchanged unless they opt into the variant.
- [ ] lint + tests green; no re-import needed (contract shape 1).

## Dependencies
SKODA-212 (rail), SKODA-212a (pointer fix), SKODA-820 (curated-mode fix, PR #157: rebase on it), SKODA-607 (emits
the shape), SKODA-612 (folded into 607 + this ticket).

## Import contract (SKODA-603)
Contract `story-rail-press` (**pinned 2026-09-27**, fallback **readable**: default carousel cards) in
[`SKODA-PENDING-BLOCK-CONTRACTS.md`](../../planning/SKODA-PENDING-BLOCK-CONTRACTS.md). Shape: header
`Story Rail (press)`, then one curated row per card `[<picture>, <p>date</p><h3><a href>Title</a></h3>]`. No config
rows (curated rows and config rows can't mix). Emitted by `transformers/skoda-press-release-layout.js`.
