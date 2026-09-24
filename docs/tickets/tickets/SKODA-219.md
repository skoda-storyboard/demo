# SKODA-219, In-body story image carousel (`skoda-carousel-widget`)

> **⛔ Superseded (2026-09-24) by [SKODA-819](SKODA-819.md).** The stakeholder decided to render this widget as a
> Gallery `slider` variant, not as a `carousel` block variant. Its GitHub issue exists only for disk↔board parity and is closed as not planned (2026-09-25 sync). The Must
> SP moves 1:1 to 819. See [`SKODA-M1-GAP-REVIEW.md`](../../reviews/SKODA-M1-GAP-REVIEW.md) §15. The text below is
> kept for its source census (21/21 in-set stories).

- **Epic:** E02, Core Blocks
- **Type:** block variant + importer mapping
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (15 Oct demo)
- **Estimate:** 3 SP · AI-assisted 1–1.5d / manual 2–3d *(planning estimate, not a quote)*
- **GitHub issue:** [#116](https://github.com/skoda-storyboard/demo/issues/116) (closed as not planned; superseded by SKODA-819 [#122](https://github.com/skoda-storyboard/demo/issues/122))
- **Discovered in:** M1 gap review, 2026-09-24 (43-URL census)

## UI Specification
No spec exists yet. Measure one in-scope reference first and add it as
`docs/ui-specs/story-image-carousel.md`:
`https://www.skoda-storyboard.com/en/skoda-world/how-the-skoda-octavia-reached-365-km-h/`
(5 autoplay instances on that page). Story assembly context: [`story-detail.md`](../../ui-specs/story-detail.md).

## Summary
**All 21 in-scope story URLs** have one or more SiteOrigin `skoda-carousel-widget` instances in the article body.
The live markup, verified on 2026-09-24, is an **image gallery carousel, not a teaser rail**:

```
.so-widget-skoda-carousel-widget > .search-results.carousel-widget
  > .search-results-items[data-flickity='{"cellAlign":"left","groupCells":true,
      "pageDots":true,"autoPlay":3000,"wrapAround":true}']
    > .search-results-item
        > .image-holder.ratio-16x9 > img.media-cart-image (srcset 272…2560w, alt)
        > .search-results-item-description > p (caption)
```

A page-level override sets `.widget_skoda-carousel-widget .ratio-16x9 { aspect-ratio: 4 / 2.667 }`.

Today the widget is mis-described in three places:
- SKODA-801 §SiteOrigin mapping calls it "related-content teasers".
- `carousel-rails.md` says no instances exist.
- The origin/main story importer does not map it at all.

So every imported story loses its in-body images.

This is **not** `.sb-gallery` (SKODA-216, Favorit lead image + thumbnails) and **not** the teaser `story-rail`
(SKODA-212).

## Requirements / Spec
- **Rendering.** Render the widget as an authored image carousel, preferably a `Carousel (images)` variant of the
  existing `blocks/carousel` so no new block is added:
  - one slide per image, with caption
  - wrap-around
  - page dots
  - previous/next controls
  - swipe on touch devices
- **Autoplay.** The source autoplays every 3 s. Autoplay must respect `prefers-reduced-motion` and pause on hover and
  focus. WCAG 2.2.2 requires a visible pause control, or no autoplay at all; record the choice in the spec.
- **Images.** Use `<picture>` with EDS optimisation and masters-only, following SKODA-501.
  - Preserve the source `alt` text and caption.
  - Keep the aspect ratio at 3:2 (the `4/2.667` override) unless the measured spec says otherwise.
- **Media cart.** Each slide exposes the same add-to-cart / download seam as the gallery (`media-cart-image`), per the
  SKODA-505a contract. The hook can be inert until 505a lands.
- **Importer.** In `import-story-detail.js`, map every `widget_skoda-carousel-widget` into the variant **in body
  order**. `skoda-story-cleanup.js` must stop discarding it. This mapping is delivered together with SKODA-801a.
- **Defensive authoring.** Support 1 to n slides. With a single slide, render a static figure with no controls.
- **CSS.** Scope all CSS to the block and use tokens, per [`css-guidelines.md`](../../guardrails/css-guidelines.md).

## Acceptance Criteria
- [ ] On 3 in-scope stories, every source carousel instance appears in the same body position with the same slide
      count, order, captions and alt text.
- [ ] Keyboard navigation, visible focus and screen-reader naming work (`aria-roledescription="carousel"`, slide
      labels). Autoplay is either off under reduced motion or pausable.
- [ ] 375/768/1280 browser comparison against the source passes: diff ≤2%, or deviations are documented.
- [ ] Lint and a focused block test pass. The carousel adds no CLS and does not affect LCP.

## Dependencies
- Upstream: SKODA-212 (`blocks/carousel`), SKODA-501 (media), SKODA-106 (tokens).
- Integration: SKODA-801a (story importer mapping), SKODA-505a (cart hook), SKODA-603 (43-URL import).
