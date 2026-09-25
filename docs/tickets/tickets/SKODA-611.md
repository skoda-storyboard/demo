# SKODA-611, Storyboard home composition (/en cover-box stack)
- **Epic:** E06, Import Pilot Content
- **Type:** import + section styling
- **Phase:** A · **Milestone:** M1 (demo-visible: the first page shown)
- **Estimate:** 3 SP → **2.5 SP** after re-verification (parent; the work is in the slices) *(planning estimate, not a quote)*
- **Status (2026-09-25):** 🔵 TODO, **parent**. Split per sweep-reconciliation decision D2 (same pattern as 805 / 805a–c):

  | Slice | Scope | Tier | Size |
  |---|---|---|---|
  | [SKODA-611a](SKODA-611a.md) | 9-section structure, dark bands, social strip; keep the authored feed `offset` | **Must** | 1 SP |
  | [SKODA-611b](SKODA-611b.md) | Band spacing to the measured pitch (67px gap, 320px rail pitch) | Should | 1.5 SP |

  **Re-verified 2026-09-25 on main after #110** (CDP, 1440): the promo exclusion **already works**. `/en` shows 3
  promo posts and Latest Stories starts at Epiq (15. 9. 2026) with **0 overlap**, via the authored `offset` in
  `stories.js` (0304613, `excludeFeatured` off when an offset is set). That removes 0.5 SP from the original Must
  scope. `/en` is **still one section** (`promo-box-container stories-container story-rail-container
  carousel-container`, 13 blocks).

## Origin
Demo URL/block sweep, 2026-09-25 (report §5). SKODA-212/213/214 name SKODA-604 as the owner of home composition, but 604 was
re-pointed to hero-story fidelity, so nobody owns the `template-home.md` AC "STO home renders the 9-section stack".

## Problem (measured)
- `/en` on EDS is **one section** (`.promo-box-container.stories-container…`). The source is a stack of cover-box bands.
  Social media and Series sit in dark bands.
- The Lifestyle heading at y=3536 touches the eMobility track end at 3537 (0px gap; source 67px). The source cover-box pad is
  12px 0, plus a search-results margin of 24px 0 16px, giving a 320px rail pitch at 1440.
- The Social media strip (3 profile tiles 220×176 on `rgb(14,58,47)`) is dropped (`home-rail.js` unwraps `.socials-static`).
- **Latest Stories starts with the 3 promo-box posts** (24.9, 22.9, 17.9). The source's first card is Epiq (15. 9. 2026),
  because the source excludes the carousel posts. `stories.js isFeatured()` reads a column that doesn't exist in the index.

## Scope
- `import-home-sto.js`: one section per source cover-box, with Section Metadata Style (`cover-box` / `cover-box dark`).
  Emit the social strip as the Cards (social) rows (SKODA-217). Extend the Style hook beyond `body.story` (SKODA-218).
- `stories`: an `offset` or exclude-by-href option so the feed skips the promo-box posts (serialize with SKODA-213).
- Section spacing to the measured pitch.

## Acceptance Criteria
- [ ] `/en` renders the 9 sections in source order; Social + Series in dark bands.
- [ ] 1440: 67px heading-to-previous-track gap as on the source; 320px rail pitch (±4px).
- [ ] Latest Stories' first card = the 4th newest story (the promo posts are excluded).

## Dependencies
SKODA-213 (promo-box, PR #110), SKODA-214 (stories), SKODA-217 (social cards), SKODA-218 (dark sections), SKODA-212 (rails), SKODA-603.
