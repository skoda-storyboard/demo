# SKODA-817, Story aside: duplicated "Explore more" teasers + sidebar visual parity
- **Epic:** E08, Editorial at Scale
- **Type:** import + styling
- **Phase:** A/B · **Milestone:** M1 (demo story fidelity)
- **GitHub issue:** [#120](https://github.com/skoda-storyboard/demo/issues/120)
- **Estimate:** 2 SP · AI-assisted 0.5–1d / manual 1–2d *(planning estimate, not a quote)*
- **Status (2026-09-25):** 🟡 importer merged in PR #113; sidebar CSS implemented, independent QA pending.

## Origin
Side-by-side QA of the Epiq story (1440px, 2026-09-24).

## Problem (measured)
- **Content bug (fixed in PR #113):** the sidebar initially showed **6 cards for 3 teasers**:
  one image-less row and one image row per story. Published Epiq content now has
  3 image-bearing rows and both "Explore more" and "Tags" headings.
- **Visual (remeasured with Chrome DevTools, 2026-09-25):** source headings are
  16px/600/45px above 768px and 20px/600/45px at and below 768px; EDS rendered
  34px/600/42.5px at every width. Source teaser titles are 16px/500/20px versus
  EDS 18px/400/21.6px. Source cards measure 345×194 at 1440px, 185×104 at 768px
  and 355×200 at 375px; EDS measured 328×185, 200×113 and 327×184 respectively.
  **Both already overlay their titles and have an 8px radius and shadow**. The source
  uses a 64px start/0 end inset in the two-column sidebar and 10px on each side
  when stacked; EDS used 40px/40px at 1440px and 24px/24px below 992px.

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
- Scope sidebar insets and responsive headings to `body.story .section.sidebar`,
  and teaser-title typography and the single-column card grid to the story sidebar
  in `blocks/cards/cards.css`. Preserve the existing overlay, 8px radius and shadow.
- Newsletter sign-up widget → SKODA-823. Side banner (`.side-banner .sa-bnr`) → SKODA-903 (banner
  platform); both stay dropped by this importer until then.

## Acceptance Criteria
- [x] Exactly 3 teaser rows, each with an image and a linked title (published Epiq markup).
- [ ] At 1440, "Explore more" and "Tags" are 16px/600/45px in `rgb(53,53,53)`;
      cards are ~345×194 with white 16px/500/20px titles over the image, the existing
      8px radius/shadow, no toolbar, and a 32px gap above "Tags".
- [ ] At 768 and 375, headings are 20px/600/45px and cards match the source widths (~185px and ~355px); the body
      and aside still stack below 768px, with 3 full-width teasers in one column at 767px.
- [x] Unit/regression check on the transformer (nested teaser markup gives N rows, not 2N).

## Dependencies
SKODA-801 (aside rebuild), SKODA-201 (cards/card-teaser overlay style).
