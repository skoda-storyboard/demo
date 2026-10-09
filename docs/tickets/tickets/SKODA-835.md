# SKODA-835, Press-kit hub: size a lone download banner like its origin tile

- **Epic:** E08, Editorial at Scale
- **Type:** styling (`templates/press-kit/press-kit.css`)
- **GitHub issue:** [#279](https://github.com/skoda-storyboard/demo/issues/279)
- **Phase:** A · **Milestone:** M1
- **Origin:** SKODA-832 QA (2026-10-07, defect D2), deferred by the user when PR for SKODA-832 was opened as is
- **Status (2026-10-08):** 🟢 QA PASS (Architect-run, 2026-10-08); PR open. CSS only: the 9 published hubs pick it up on merge, no re-push.

## Problem
`.section.press-kit-banners` lays its banners out with `repeat(auto-fit, minmax(min(100%, 25rem), 1fr))`, so a hub
with a single download banner stretches it across the whole content width. Measured against origin (SKODA-832 QA,
evidence `.migration/qa-832/compare.txt`):

| Hub(s) | Viewport | Origin | EDS |
|---|---|---|---|
| skoda-octavia-rs-and-octavia-scout, 4x4-winter-experience, skoda-rs-experience | 1440 | 292×292 | 1228×1228 |
| same | 992 | 228×228 | 972×972 |
| skoda-octavia-press-kit-2, press-kit-skoda-at-the-iaa-2019 | 1440 | 307×307 | 1228×1228 |
| skoda-octavia-press-kit (4:1 banner) | 1440 | 634×159 | 1228×307 |

On origin the download banner is a tile of the hub grid: a square takes a quarter column, a 4:1 banner a half.

## Scope
- CSS only: size a lone banner like its origin tile (square → one tile column of the 4-up hub grid, 4:1 → half),
  keyed on the banner's aspect, not on the page. Two-banner hubs (Albania, RS Driving Experience, Media Launch)
  already match origin and must not change.
- Banner gap to the tile grid: origin 20px, EDS 40px (SKODA-832 QA D7).
- No re-import or re-push: the content is already in DA (SKODA-832).

## QA result (2026-10-08, head df63618 + main merge)
Run by the Architect directly. Branch code was served locally against main's content and compared with main's code on
`.aem.live`; origin values are from the developer's table and the SKODA-832 QA.

| Hub | Width | Main (before) | Branch | Origin |
|---|---|---|---|---|
| RS Experience, Scout, IAA 2019 (square) | 1440 / 992 / 375 | 1228 / 972 / 355 | **292 / 228 / 355** | 292 (IAA 307) / 228 (IAA 243) / 355 |
| Octavia (4:1 strip) | 1440 / 992 / 375 | 1228×307 / 972×243 / 355×89 | **604×151 / 476×119 / 355×89** | 634×159 / 506×127 / 385×96 |
| Albania, Media Launch (2 banners) | 1440 / 992 / 375 | 602×301 ×2 / 474×237 ×2 / 355×178 | unchanged | = |
| Superb (2:1), Vision O (4) | all | unchanged | unchanged | (M2, not in scope) |
| Tiles → banner gap | all | 40 | **20** | 20 (varies 10–44 by hub) |

- **Aspect detection:** the `width`/`height` attributes are the banner images' real pixel sizes, set at media
  ingest: 800×800 squares, 1920×480 strip, 1600×800 for 2:1. They change only if an image is replaced, and a
  replaced image falls back to today's full-row layout. **Accepted.**
- **Checks:**
  - No horizontal overflow at any measured width.
  - The banner is still a link (`<a>` wraps the picture) and the centre click hits the link.
  - The image keeps its width/height attributes, so no layout shift.
- **Tests:** stylelint and `npm run lint` clean; press-kit template tests 8/8.

### Accepted differences (user, 2026-10-08)
- A square banner starts the row (x 106 / 10); origin places it in column 2.
- On the three "307" hubs, the banner follows our tile grid (292) instead of origin's 307 cells.
- The gap is 20px on every hub (origin varies 10–44).
- Hub tile approximations from SKODA-832 QA D3/D4: 5-across resource tiles, the Scout half-width 4:1 intro tile,
  the 4x4 1/3 squares shown as quarters.

## Acceptance Criteria
- [~] The 6 single-banner hubs match origin banner geometry (±2px) at 1440 / 992 / 768 / 375: size matches on the
  four 292-grid hubs at every width; see "Deviations" for the column (x) and the three 307-grid hubs.
- [x] The 3 two-banner hubs and the 8 other hubs keep their banner sizes and x (measured); only the gap moved (below).
- [x] `npm run lint:css` passes; the guardrail self-check is done.

## Dependencies
SKODA-832 (hub content in DA). SKODA-805 (hub template).

## Implementation (2026-10-07, Developer)
`templates/press-kit/press-kit.css`, CSS only:
- **Gap.** `body.press-kit main > .section:has(+ .section.press-kit-banners)` ends on `--grid-gutter` (20px) instead
  of the section's 40px: the banners sit one tile gutter under the tiles, as on the source.
- **Lone banner.** From 781px (the width where blocks/cards un-stacks `.tiles-press`, and where the source's
  SiteOrigin cells un-stack too, measured at 780/781) a banners wrapper whose only banner is a square or a 4:1 strip
  becomes the tiles' grid, `repeat(4, minmax(0, 1fr))` with `--grid-gutter`: the square takes one column, the 4:1
  strip spans two. Below 781 the banner keeps the full width, like the stacked tiles.
- CSS can't read an image's aspect ratio, so the aspect is keyed on the banner image's `width`/`height` attributes:
  `800×800` (all 5 square banners) and `1920×480` (the Octavia strip). An intrinsic rule (`width: auto` under a
  half-row `max-width` and a one-column `max-height`) was tried and rejected: Chrome lays out a not-yet-loaded
  `width: auto` image at 0×0 (layout shift), and it would also have resized the lone 2:1 banners this ticket keeps.
  Any other lone banner (the 2:1 Superb/Kodiaq ones) keeps the full row.

### Origin rule (measured 2026-10-07, iframes on the live origin, 17 hubs)
The source hub is a stack of SiteOrigin panel rows (`.panel-grid`, flex; cells pad 10px, so a cell's content is its
weight × 1248 less 20). The banner is a widget in one of those cells, and the cell sets its width:
square → a ¼ cell (292 at 1440, 228 at 992, 175 at 781); 4:1 → a ½ cell; two 2:1 → ½ each; Vision O's four 2:1 → ¼
each (292×146); Enyaq's three 4:3 → ⅓ each (396×297; hidden from 992 down). The 307 hubs (Octavia press kit 2,
IAA 2019, Octavia press kit) use a different panel layout: cells 327 wide on a row pulled 15px past the container
(tiles and banner 307 at 1440, 243 at 992, 190 at 781; 778/790/385 at x −5 when stacked, i.e. 5px past the
viewport). The cell is the author's choice: the square banners sit in the *second* column (x 418 at 1440).

### Measurements (banner x, w×h, gap = banner top − last tile bottom; origin / before (main) / after)
Single-banner hubs:

| Hub | Width | Origin | Before | After |
|---|---|---|---|---|
| 4x4-winter-experience, skoda-octavia-rs-and-octavia-scout | 1440 | x418 292×292 g34 | x106 1228×1228 g40 | x106 292×292 g20 |
| same | 992 | x258 228×228 g34 | x10 972×972 g41 | x10 228×228 g21 |
| same | 781 | x205 175×175 g34–35 | – | x10 175×175 g20 |
| same | 780 | x10 760×760 g34 | – | x10 760×760 g20 |
| same | 768 | x10 748×748 g34 | x10 748×748 g40 | x10 748×748 g20 |
| same | 375 | x10 355×355 g10 | x10 355×355 g40 | x10 355×355 g20 |
| skoda-rs-experience | 1440 | x418 292×292 g24 | x106 1228×1228 g40 | x106 292×292 g20 |
| same | 992 | x258 228×228 g24 | x10 972×972 g41 | x10 228×228 g21 |
| same | 768 | x10 748×748 g24 | x10 748×748 g40 | x10 748×748 g20 |
| same | 375 | x10 355×355 g0 | x10 355×355 g40 | x10 355×355 g20 |
| skoda-octavia-press-kit-2, press-kit-skoda-at-the-iaa-2019 | 1440 | x418 307×307 g20 | x106 1228×1228 g40 | x106 292×292 g20 |
| same | 992 | x258 243×243 g20 | x10 972×972 g41 | x10 228×228 g21 |
| same | 781 | x205 190×190 g20 | – | x10 175×175 g20 |
| same | 768 | x−5 778×778 g20 | x10 748×748 g40 | x10 748×748 g20 |
| same | 375 | x−5 385×385 g19–20 | x10 355×355 g39–40 | x10 355×355 g19–20 |
| skoda-octavia-press-kit (4:1) | 1440 | x91 634×159 g20 | x106 1228×307 g40 | x106 604×151 g20 |
| same | 992 | x−5 506×127 g20 | x10 972×243 g40 | x10 476×119 g20 |
| same | 781 | x−5 401×100 g20 | – | x10 371×93 g20 |
| same | 768 | x−5 778×195 g20 | x10 748×187 g40 | x10 748×187 g20 |
| same | 375 | x−5 385×96 g20 | x10 355×89 g39 | x10 355×89 g19 |

Two-banner hubs (Albania, RS Driving Experience, Media Launch; identical rows) and the other 8 hubs: every banner's
size and x is identical before/after at 1440 / 992 / 768 / 375; the gap drops 40 → 20 (41 → 21 at 992):

| Hub | Width | Origin | Before | After |
|---|---|---|---|---|
| two-banner hubs, Peaq, Epiq, Elroq | 1440 | x106/730 604×302 g20 | x106/732 602×301 g40 | x106/732 602×301 g20 |
| same | 992 | x10/506 476×238 g20–21 | x10/508 474×237 g40–41 | x10/508 474×237 g20–21 |
| same | 768 | x10 748×374 g20 (stacked) | x10 748×374 g40 | x10 748×374 g20 |
| same | 375 | x10 355×178 g19–20 | x10 355×178 g39–40 | x10 355×178 g19–20 |
| Superb, Kodiaq (lone 2:1) | 1440 | x106 604×302 g44 | x106 1228×614 g40 | x106 1228×614 g20 |
| same | 992 | x10 476×238 g44 | x10 972×486 g40 | x10 972×486 g20 |
| same | 768 | x10 748×374 g108 | x10 748×374 g40 | x10 748×374 g20 |
| same | 375 | x10 355×178 g84 | x10 355×178 g40 | x10 355×178 g20 |
| Vision O (4× 2:1) | 1440 | 4× 292×146 g20 | 2×2 602×301 g40 | 2×2 602×301 g20 |
| Enyaq (3× 4:3) | 1440 | 3× 396×297 g20 | 2+1 602×452 g40 | 2+1 602×452 g20 |
| 125 years of motorsport | all | no banners | – | – |

Evidence: `.migration/qa-835-dev/` (`origin-all.json`, `origin-781.json`, `eds-before.json`, `eds-after.json`,
`table.txt`, the harness `eds-call.js` / `measure-origin.js`).

### Deviations (not fixable under this ticket's constraints)
1. **Column (x).** The source drops the square banner in the 2nd column (x 418 / 258 / 205), the 4:1 strip in the
   1st. On EDS the banners are their own section after the tiles, so the banner starts the row (x 106 / 10). Getting
   the source's column would take content (the banner as a tile in the cards block), not CSS.
2. **307-grid hubs** (Octavia press kit 2, IAA 2019, Octavia press kit): their source tiles and banner are 307 / 243 /
   190 (4:1 634 / 506 / 401), on a row 15px wider than the container that overflows the viewport by 5px when
   stacked. EDS renders those hubs' tiles on the shared 292 grid (SKODA-832 QA), and the banner follows the EDS tile
   column: the square is 15px narrower at 1440 / 992 / 781 and the 4:1 strip 30px (two columns), and both are 30px
   narrower at 768 / 375, where the source's stacked banner overflows the gutters (x −5).
3. **Gap** is now the EDS tile gutter (20) on every hub. Source gaps vary by page: 20 on most, 34 (4x4, Scout) /
   24 (RS Experience) where the source's tile rows are 34 / 24 apart, 10 / 0 at 375 on those, and 44 / 108 / 84 on
   Superb and Kodiaq (their gap moved from −4 to −24 at 1440).
4. **Follow-ups for other hubs** (unchanged here, by scope): Superb/Kodiaq lone 2:1 banner is 1228×614 vs the
   source's ½ cell 604×302; Vision O's four banners 2×2 602×301 vs 4× 292×146; Enyaq's three 602×452 (2+1) vs
   3× 396×297.
