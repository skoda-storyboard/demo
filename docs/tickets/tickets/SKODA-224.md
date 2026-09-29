# SKODA-224, Story Rail `press` variant (Related Press Releases band)
- **Epic:** E02, Core Blocks
- **Type:** block variant
- **Phase:** A · **Milestone:** M1 (demo-visible on 4 of 5 M1 press releases)
- **GitHub issue:** [#172](https://github.com/skoda-storyboard/demo/issues/172) (sub-issue of #47)
- **Estimate:** 1 SP · AI-assisted 0.5d / manual 1d *(planning estimate, not a quote)*
- **Status (2026-09-29):** 🟡 IN REVIEW. The `Story Rail (press)` variant is built in `story-rail.css`
  only. It is QA'd on `/drafts/skoda-224-story-rail-press` and on the 4 M1 releases. AC 2 (click / drag)
  is **blocked on SKODA-212a**: the shared carousel bug, which the story band has too.

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

## Build notes (2026-09-29, live DevTools on the Zellmer release)
- **Corrections to the Problem section:**
  - The card title is **18px / 21.6 / 400** at every width, not 26px/32.5/600.
  - The date is 11px / 600 / line-height 11px with 1.1px letter-spacing.
  - Both have `text-shadow: 0 1px 1px rgb(0 0 0 / 50%)`.
  - The fixed 90 / 30 / 22.5% ladder lives in `blocks/carousel/carousel.css`, not in story-rail.css.
- **Ladder:** 90% below 768, 45% from 768 to 991, 30% from 992, capped by the 1248px band.
  This is the SKODA-820 story related-band ladder, so the variant shares those rules through
  plain selector lists (press selector first) rather than copying the values. Each selector keeps
  its own specificity: the press rules stay at (0,2,0), and the story band's selectors are
  unchanged from `main`.

  | Viewport | Cell pitch | Card |
  |---|---|---|
  | 1280 | 374.4 | 354.4×199.3 |
  | 1024 | 307.2 | 287.2×161.5 |
  | 768 | 345.6 | 325.6×183.1 |
  | 500 | 450 | 430×241.9 |

  EDS matches all of these, plus 992/991, 767 and 390.
- **Press-only rules:**
  - The rail bleeds out of the press-release section wrapper's 10px inset, like the source Flickity viewport.
  - Dual scrim only (`--scrim-h`, `--scrim-v`), without the bottom text gradient.
  - The date line sits 13px above the title; this cancels the dark-band `p` margin.
  - The title is clamped to **1 line** with "…", as on the source at every width (PR #206 review).
    Title top 161.8 / 123.9 / 145.5 / 204.3 at 1280 / 1024 / 768 / 500, the same as the source.
- **Arrows:** 32px and vertically centred on the card. Prev is at the first card edge; next is 10px
  from the band's right edge. Both are hidden when disabled; Board (1 card) has both hidden.
  Each click pages 3 / 3 / 2 / 1 cells at 1280 / 1024 / 768 / 500. This matches the source on every
  page except the last one (see the differences below).
- **No layout shift:** the mount reserve equals the built height (199.3px at 1280).
- **"All" end card (added on request, press variant only):** the source ends a *full* band (its
  10-release limit, with more matches) with an `.item-all` cell. Only Zellmer has one; National
  Theatre (5), Board (1) and Peaq (6) don't.
  - **Where it comes from:** `story-rail.js` appends the card after the carousel builds, linking to
    the band's "All" header link, so no contract or re-import change is needed.
  - **When:** the curated rows reach 10, or in index mode more rows match than the limit (the
    selection fetches one extra row to tell).
  - **Look:** card-sized 16:9 cell with a 1px white outline and square corners, "All" 16/600
    centred, and a CSS chevron in a 16px cell 16px after the text. On hover the chevron nudges
    8px (0.6s ease-in-out, infinite); this is off under reduced motion.
  - **Arrows:** "next" disables only once the end card is reached.
  - **Measured at 1280:** 354.4×199.3 at the 374.4 pitch, with "All" 151.5px into the card
    (source 151.8).
- **Deliberate differences:**
  - **Ellipsis position:** the source shortens titles with JS (dotdotdot) at a word boundary for
    the current width. EDS clamps to one line with CSS, so the "…" can fall at a different
    character. Line count and positions match.
  - **Last page stop position (shared carousel, deferred to SKODA-212a):** Flickity runs without
    `contain`, so the source aligns the last group to the left and leaves the rest of the band
    empty. The EDS carousel clamps to the scroll end, so a partial card shows at the left edge.
    At 1280 on Zellmer after the last "next": the source shows cell 9 at x=10 and the All card at
    x=384.3; EDS shows cell 8 at x=135.1 (card 7 cut off) and the All card at x=883.9. It happens
    at every width. The fix belongs in `blocks/carousel/carousel.js`, not this variant.
- **"All" pill (added on request, press-release template):** the band's "All" link now renders as the
  source ghost pill. It is white with a 2px `#464748` border and text, 36px tall with 8/32 padding,
  16/600 text with 1px tracking, and fills `#f1f1f1` on hover. It sits on the heading row, right-aligned
  and vertically centred on the heading and subheading.
  - Pill positions, measured from the heading top: x 1163.6 / y 14.3 at 1280, x 667.6 / y 14.3 at 768,
    x 289.6 / y 30.3 at 390. These are the same as the source.
  - The first card now starts 84.5px below the heading at ≥768 and 116.5px below 768, as on the source.
  - **Why it was broken:** `decorateButtons` only buttonizes bold or italic links, and it outputs
    `button-wrapper` while the template expected `button-container`. The template now marks the plain
    "All" link itself (`decorateRelatedLinks`).
- **Blocked:** card click and drag do nothing, because `carousel.js` captures the pointer on
  `pointerdown`. The Epiq story band, which this ticket doesn't change, behaves the same. This is
  SKODA-212a, and this ticket doesn't touch carousel code.

## Dependencies
SKODA-212 (rail), SKODA-212a (pointer fix), SKODA-820 (curated-mode fix, PR #157: rebase on it), SKODA-607 (emits
the shape), SKODA-612 (folded into 607 + this ticket).

## Import contract (SKODA-603)
Contract `story-rail-press` (**pinned 2026-09-27**, fallback **readable**: default carousel cards) in
[`SKODA-PENDING-BLOCK-CONTRACTS.md`](../../planning/SKODA-PENDING-BLOCK-CONTRACTS.md). Shape: header
`Story Rail (press)`, then one curated row per card `[<picture>, <p>date</p><h3><a href>Title</a></h3>]`. No config
rows (curated rows and config rows can't mix). Emitted by `transformers/skoda-press-release-layout.js`.
