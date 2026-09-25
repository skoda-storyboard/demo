# SKODA-819, Story in-body image carousel: render as a slider (Gallery `slider` variant)
- **Epic:** E08, Editorial at Scale
- **Type:** block variant + import
- **Phase:** A/B · **Milestone:** M1 (demo story fidelity)
- **GitHub issue:** [#122](https://github.com/skoda-storyboard/demo/issues/122)
- **Estimate:** 3 SP · AI-assisted 1d / manual 2–3d *(planning estimate, not a quote)*
- **Status (2026-09-24):** 🔵 TODO · **Decision (2026-09-24, stakeholder):** render like the source
  (single-image slider), not as the lead-image + thumbnail gallery.
- **Supersedes:** [SKODA-219](SKODA-219.md), which is the same widget. It had been specced as a `carousel` block
  variant in the M1 gap review. Its Must SP moves to this ticket (review §15).

## Origin
Side-by-side QA of `/en/emobility/skoda-epiq-will-win-you-over-in-just-a-few-seconds/` (2026-09-24).
The story has 3 of these carousels (5, 8 and 4 images).

## Problem
The link-free `skoda-carousel-widget` (Flickity, `data-flickity='{"cellAlign":"left","groupCells":true,
"pageDots":true,"autoPlay":3000,"wrapAround":true}'`) is routed by `story-flatten.js` to a
**Gallery** block. That renders a 499×333 lead image, a 68×46 thumbnail grid, an "Images" h3 and
the image alt repeated as an h3 caption on every carousel. The source shows one full-width image
at a time with arrows and dots.

## Source measurements (`.carousel-widget`, Epiq story)
| | 1440 | 768 | 500 |
|---|---|---|---|
| Content column | 819 | 499 | 480 |
| Slider viewport (bleeds 10px each side of the column) | 839×472 | 519×292 | 500×281 |
- 16:9 box (`padding-bottom: 56.25%`), **one slide per view**, image covers the box, no radius,
  no visible caption (the `data-caption` is empty; alt is the gallery title).
- Arrows (`.flickity-prev-next-button`): 32×32, transparent bg, round, `#333` SVG chevron,
  10px inside the viewport edges, vertically centred.
- Dots (`.flickity-page-dot`): 10×10 round, `margin: 0 8px`, `rgb(51 51 51 / 25%)`; selected
  `#333`. Centred row, `bottom: -32px` (about 21px below the image).
- Behaviour: autoplay 3s, wrap-around, drag/swipe.

## Scope
- **Block:** a `slider` variant of the existing `blocks/gallery` (authored `Gallery (slider)`),
  not a new block. It reuses the gallery's image optimisation. Native scroll-snap track, prev/next
  buttons, dots, wrap-around, and autoplay that pauses on hover/focus and is disabled under
  `prefers-reduced-motion`. No thumbnail strip, no "Images" heading, no caption h3.
- **Importer:** `story-flatten.js` emits `Gallery (slider)` for link-free `skoda-carousel-widget`.
  Link-bearing carousels keep routing to Cards. Leave `sow-slider` and `.sb-gallery` (SKODA-216)
  as they are unless measured otherwise.
- Evaluate reusing the SKODA-212 `carousel` rail mechanics (arrow state, dots, drag) instead of
  forking them. The rail is card-teaser-based, so reuse is at the logic level, not the markup.

## Acceptance Criteria
- [ ] 1440/768/500: slider box matches the table above (±2px), 16:9, one image per view.
- [ ] Arrows + dots positioned and coloured as measured; the selected dot tracks the current slide.
- [ ] Autoplay advances every 3s and wraps; it pauses on hover/focus and is off under reduced motion.
- [ ] Arrows and dots are labelled `<button>`s; the track is keyboard-scrollable.
- [ ] Existing Gallery variants (default / story) unchanged; lint + tests green.

## Dependencies
SKODA-203 (gallery), SKODA-212 (rail mechanics), SKODA-216 (story `sb-gallery`, a different
widget), SKODA-801 (flatten routing).
