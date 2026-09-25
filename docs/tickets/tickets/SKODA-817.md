# SKODA-817, Story aside: duplicated "Explore more" teasers + sidebar visual parity
- **Epic:** E08, Editorial at Scale
- **Type:** import + styling
- **Phase:** A/B · **Milestone:** M1 (demo story fidelity)
- **GitHub issue:** [#120](https://github.com/skoda-storyboard/demo/issues/120)
- **Estimate:** 2 SP · AI-assisted 0.5–1d / manual 1–2d *(planning estimate, not a quote)*
- **Status (2026-09-24):** 🔵 TODO · **Update (late 2026-09-24):** 🟡 importer half merged in PR #113 (commit
  `e763378`: only the outermost teaser match is kept, and a "Tags" heading is added). Open (≈ 1 SP): the sidebar
  visual-parity CSS in the `body.story` section of `styles/styles.css`.

## Origin
Side-by-side QA of the Epiq story (1440px, 2026-09-24).

## Problem (measured)
- **Content bug:** the sidebar shows **6 cards for 3 teasers**. Each story appears twice: one
  card with no image, then one with the image.
- **Visual:** source `h3.sidebar-heading` "Explore more" is 16px/600/45px; EDS renders a 34px/600 h2.
  Source teasers (345×194) are image cards with the white title (16px/500) **overlaid** bottom-left,
  square corners. EDS cards have an 8px radius, a shadow, and the title below the image. The source
  also has a "Tags" heading (16px/600) above the tag labels, which EDS lacks.

## Cause
`tools/importer/transformers/skoda-story-aside.js` `relatedCards()` selects
`.related .article-teaser, .related article`. On the source each teaser is
`div.article-teaser > article`, so both nodes match. The dedupe only removes identical nodes, so
3 teasers become 6 rows. Both rows reference the same `<img>`, and `createTable` moves it into the
second row, which leaves the first row image-less.

## Scope
- Keep only the outermost matched teaser (drop matches nested inside another match).
- Emit the "Tags" heading before the Tags block. Keep using the existing **Tags block (SKODA-205)**
  for the tag labels. It already renders correctly (`2026`, `EPIQ` chips), so no new tag markup or CSS.
- Sidebar styling (scoped `body.story .section.sidebar`): 16px/600 section headings; teaser cards
  in the overlay style (image with the white title overlaid, no radius, no shadow).
- Newsletter sign-up widget → SKODA-823. Side banner (`.side-banner .sa-bnr`) → SKODA-903 (banner
  platform); both stay dropped by this importer until then.

## Acceptance Criteria
- [ ] Exactly 3 teaser rows, each with an image and a linked title.
- [ ] 1440: "Explore more" and "Tags" headings are 16px/600/45 `rgb(53,53,53)` (20px at 390). Teasers show the title
      over the image at 345×194, **with the source corner radius**. *Corrected 2026-09-25: the source cards do have
      a radius, so "square corners" was wrong (parallel sweep V6).* No toolbar on the Explore-more cards. A 32px gap
      above the Tags heading.
- [ ] Unit/regression check on the transformer (nested teaser markup gives N rows, not 2N).

## Dependencies
SKODA-801 (aside rebuild), SKODA-201 (cards/card-teaser overlay style).
