# SKODA-611a, Storyboard home: section structure (Must slice of SKODA-611)
- **Epic:** E06, Import Pilot Content
- **Parent:** [SKODA-611](SKODA-611.md) (home composition, [#147](https://github.com/skoda-storyboard/demo/issues/147))
- **Type:** import + section metadata
- **Phase:** A · **Milestone:** M1 (demo-visible: the first page shown) · **Tier:** Must (§11.2 cut line)
- **GitHub issue:** [#151](https://github.com/skoda-storyboard/demo/issues/151)
- **Estimate:** 1 SP · AI-assisted 0.5d / manual 1d *(planning estimate, not a quote)*
- **Status (2026-09-28):** 🟡 In review, branch `skoda-611a-home-sections`. Code + importer are done and verified
  on a local render of the importer-shaped `/en`. **The DA `/en` update is pending a human author** (agent DA writes
  need authorization): split the rails section into one section per band and add `Style: cover-box` to the light
  ones (see *Implementation*). Apply it after the PR merges, then preview.

## Origin
Split from SKODA-611 (sweep-reconciliation decision D2, [`SKODA-M1-URL-BLOCK-SWEEP.md`](../../reviews/SKODA-M1-URL-BLOCK-SWEEP.md) §11).
Re-sized from 1.5 to 1 SP after the 2026-09-25 re-check on main: the promo exclusion shipped with #110.

## Problem (measured, main after #110, 1440)
- `/en` is **one section** holding all 13 blocks (`promo-box`, `stories`, then alternating `story-rail` /
  `carousel`). The source is a stack of 9 cover-box bands; Social media and Series sit in dark bands.
- The Social media strip (3 profile tiles 220×176 on `rgb(14,58,47)`) is dropped: `home-rail.js` unwraps
  `.socials-static`.
- ✅ Already fixed: Latest Stories starts at Epiq (15. 9. 2026), 0 overlap with the 3 promo posts (authored `offset`).

## Scope
- `import-home-sto.js`: one section per source cover-box, with Section Metadata Style (`cover-box` /
  `cover-box dark`).
- Emit the social strip as Cards (social) rows (SKODA-217). The dark Style hook beyond `body.story` is SKODA-218.
- Keep the authored `offset` on the stories feed in the re-import (regression guard).

## Acceptance Criteria
- [ ] `/en` renders the 9 sections in source order; Social + Series in dark bands (`.section.dark`).
- [ ] The social strip renders 3 profile tiles.
- [ ] Latest Stories' first card is still Epiq / the 4th newest story, 0 overlap with the promo box (regression).
- [ ] 0 block JS 404s and 0 console errors on `/en`.
- [ ] Preview link on the PR: `{branch}--demo--skoda-storyboard.aem.page/en`.

## Dependencies
SKODA-213 (promo-box, #110 ✅ merged), SKODA-214 (stories), SKODA-217 (social cards), SKODA-218 (dark sections),
SKODA-603 (re-import). Spacing is SKODA-611b.

## Implementation (2026-09-28)
Re-checked on main after #188 (217) and #194 (218): Social media and Series already were their own
`cover-box, dark` sections. What remained was the light bands, and the Stories feed on re-import.

- **Importer.** `transformers/skoda-dark-bands.js` takes an opt-in `PAGE_TEMPLATE.lightBandStyle`. When it is
  set, every light `.cover-box` becomes its own section with that Style, too. `import-home-sto.js` sets it to
  `cover-box`. Neighbouring bands (and the social parser's own breaks) share one `<hr>`, so no empty sections.
  The Media Room home doesn't set it and is unchanged.
- **Stories on re-import.** The new `parsers/home-stories.js` turns `.search-results.latest-articles` into
  `Stories` (`heading` / `template story` / `path /en/` / `offset 3`). Before, the main importer left the SSR
  posts as plain text.
- **CSS.** `main > .section.cover-box` is now only the 1440px cap (live caps light bands too: x240 w1440 at
  1920). The dark band's inner padding, its margin, the neighbour-margin rules and the rail-card margin reset
  are keyed on `.cover-box.dark`. Without that, every light band would take the dark band's 66/60 padding and
  zero its neighbours' margins. Light bands keep the default 40px section rhythm. Their measured pitch is
  SKODA-611b.
- **DA `/en` target** (9 sections): promo-box (no style) · Stories `cover-box` · Social media `cover-box, dark`
  · Models · eMobility · Lifestyle · Škoda World (each `cover-box`) · Series `cover-box, dark` · Latest News
  `cover-box` (+ Metadata). The promo and Stories configs stay as authored.

## Verification (Chrome DevTools, 2026-09-28, local code + the target `/en` markup)
- **Origin, 1440:** `section.promo-box` y124, then 8 `.cover-box` bands: Latest Stories y623, Social (dark)
  y1438, Models y1834, eMobility y2142, Lifestyle y2462, Škoda World y2781, Series (dark) y3136, Latest News
  y3585. At 1920 the promo is full-bleed and every band is x240 w1440.
- **EDS, 1440:** 9 sections in that order. Social and Series are `.section.dark` on `rgb(14,58,47)`, headings
  white. The social strip is 3 tiles, each 220×176. The first story is Epiq (15. 9. 2026), with 0 overlap with
  the 3 promo posts.
- **EDS, 1920:** the promo is full-bleed and all 8 bands are x240 w1440, as on the origin.
- **768 / 375:** 9 sections, no horizontal overflow, 3 social tiles. 0 console errors, and 0 failed
  script/style/fetch requests.
- **Geometry vs main:** the promo, Stories, Social and Series bands are unchanged (same y/h). Between light
  rails, the heading-to-previous-track gap goes from 0 to 40px (origin 65/67px; SKODA-611b).

