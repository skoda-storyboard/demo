# SKODA-216, Story gallery variant (`sb-gallery`) and lightbox

- **Epic:** E02, Core Blocks
- **Type:** block variant
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (15 Oct demo capability; story assembly via SKODA-604)
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 2–4d *(planning estimate, not a quote)*
- **Status (2026-09-29):** 🟡 IN REVIEW. `Gallery (story)` is built in `blocks/gallery` (story branch
  only) plus an opt-in `story` option on the shared `scripts/lightbox.js`; the default, `preview`,
  `slider` and media-rail paths are unchanged. It is QA'd on
  `/drafts/skoda-216-story-gallery` against the live Favorit gallery.

## UI Specification
**Story reference:** [`docs/ui-specs/gallery-lightbox.md`](../../ui-specs/gallery-lightbox.md),
the `.sb-gallery` anatomy/measurements; article assembly in
[`story-detail.md`](../../ui-specs/story-detail.md). Validate against
`https://www.skoda-storyboard.com/en/emobility/an-icon-in-modern-form-the-electrifying-favorit/`.
The spec also describes the **different** Peaq press-release `#colorbox` gallery; its right-side
media-kit preview and bottom-right white navigation remain the target for SKODA-203 / SKODA-607,
not for this ticket.

## Summary
Add a **story** variant of the reusable Gallery block for in-body Storyboard articles such as the
Favorit story: a large lead image with a horizontal four-across thumbnail strip **below** it and
a full-screen lightbox with green side navigation. Keep the Peaq press-release presentation from
SKODA-203 unchanged. Reuse its image optimization, lightbox state, and accessible keyboard/focus
behavior rather than building a second viewer.

## Description
The live Favorit story uses `.sb-gallery` inside the article's content column, not the press
release's `.images.sa-media-kit-preview` sidebar. Measured in Chromium (2026-09-23/24):

| Viewport | On-page source | Open story lightbox |
|---|---|---|
| 1280px | Gallery/main image ~819px wide; strip below ~839px wide, four ~210px thumbnails across | `.sb-gallery-overlay` `rgba(0,0,0,.95)`; `1/5` counter at bottom-right; green `#419468` prev/next discs at the image sides (~67px, 10px viewport inset) |
| 500px | Gallery/main image ~480px wide; strip below ~490px wide, four ~123px thumbnails across | Opaque ink backdrop; content remains navigable; source also has an overview mode, intentionally omitted from the EDS target per the SKODA-203 stakeholder decision |

The story's top title/description and image captions are plain editorial content, not the
Media-Room file metadata/download detail panel. SKODA-203 provides the shared gallery/lightbox
foundation; this ticket owns the **story-specific composition and visual chrome**, not the
press-release template or a new modal implementation.

## Requirements / Spec
- Support an explicit DA `Gallery (story)` block variant (or equivalent authored block-variant
  metadata), selected by content, **not** by URL or page-type guessing; retain the existing
  row-per-image model and authored `alt`/caption.
- On-page story layout: lead image above the strip at all viewports; four equal-width thumbnails
  across with ~20px desktop / ~10px mobile effective spacing, preserving source order and ratios.
  No desktop side rail for this variant. Images and captions still meet SKODA-203's shared
  authoring and accessibility requirements.
- Lightbox: reuse the shared accessible viewer and its within-block gallery grouping, but
  present the story treatment: contain-fit image, green `--gallery-accent` previous/next discs
  at the sides, `N / total` counter at bottom-right, readable title/caption, and the source
  desktop/mobile backdrop distinction. Opening a lead image or thumbnail must allow navigating
  its five-image set.
- Keep one accessible lightbox at all widths; `role="dialog"`/`aria-modal`, labeled controls,
  Tab/Shift+Tab containment **including authored links**, Escape, arrow keys, `aria-live` position,
  focus return, and reduced-motion handling are shared SKODA-203 gates.
- Reuse existing gallery tokens and component-scoped styles; follow
  [`css-guidelines.md`](../../guardrails/css-guidelines.md) and validate `npm run lint`.
- **Out of scope:** the source's "Show all images"/overview toggle (removed by stakeholder
  decision), gallery social sharing (SKODA-215), media-cart state/wiring (SKODA-505a/505b),
  and importing/publishing the Favorit page itself (SKODA-604/801).

## Acceptance Criteria
- [ ] Explicitly authored story variant renders its lead image **above** a horizontal
      four-across strip at 1280/1024/768/500px; the default press-release gallery presentation
      remains unchanged on the existing PR #103 preview.
- [ ] At 1280px, the strip spans the story content column (~819px before thumbnail padding),
      not a ~320px desktop sidebar; effective thumbnail gap ~20px (mobile ~10px).
- [ ] At 1280px, open lightbox uses a `rgba(0,0,0,.95)` backdrop, green `#419468` side
      controls (about 10px from the viewport edge), and a bottom-right `N / total` counter;
      mobile uses opaque ink and all content/actions remain reachable.
- [ ] Opening the lead image or thumbnail opens the correct image **within the navigable
      story set**; the counter and buttons update, and galleries on the same page do not mix.
- [ ] Authored captions/`alt` survive, screen-reader labels and focus including authored links
      meet the SKODA-203 a11y gate; close/Escape restores focus to the triggering control.
- [ ] Browser comparison against the Favorit gallery at 1280/1024/768/500px documents
      geometry, open state and interaction differences; image-independent visual diff
      <= 2% per pixel for the agreed story variant; `npm run lint` passes.

## Build notes (2026-09-29, live DevTools on the Favorit story)
- **Corrections to the Description:**
  - The prev/next controls are **squares** (`border-radius: 0`), not discs: 67×67, 16px padding,
    a 35px chevron and `box-shadow: 1px 1px 6px 3px rgb(0 0 0 / 15%)`.
  - The counter reads `1/5` (no spaces), 16/24 white, 10px from the right, 16px from the bottom.
  - The strip holds the images **after** the lead (2–5); the lead isn't repeated, so thumb *k*
    opens image *k + 1*. Navigation wraps (5 → 1).
  - The lightbox title is the **story title** (source `data-title`), the same for every image.
  - Below 768 the source shows its overview grid (removed) instead of a viewer, so the EDS mobile
    viewer can't be pixel-compared (see the differences below).
- **On-page, measured and matched:**

  | Viewport | Lead (16:9 cover) | Thumb | Gap / strip top / block bottom | Badge |
  |---|---|---|---|---|
  | 1280 | 818.7×460.5 | 189.7×106.7 | 20 | 75×44 at 20/20 |
  | 1024 | 669.3×376.5 | 152.3×85.7 | 20 | 75×44 at 20/20 |
  | 768 | 498.7×280.5 | 109.7×61.7 | 20 | 75×44 at 20/20 |
  | 767 | 747×420.2 | 179.3×100.8 | 10 | 57×38 at 10/10 |
  | 500 | 480×270 | 112.5×63.3 | 10 | 57×38 at 10/10 |

  The source's 25% cells with 10px padding and a −10px margin are a 4-column grid with a 20px gap
  here. The badge is `rgb(0 0 0 / 60%)`, a 28px icon 6px before the total, 16/24 from 768 and 12/18
  below. The 768 step is viewport-driven (the 767 column is wider than the 768 one yet keeps 10px).
- **"View N photos" button (added on request):** the source bottom bar (`.sb-gallery-bottom`,
  flex, space-between) sits 20px under the strip (10px below 768) and starts with a green
  `--gallery-accent` button in the badge's box: a 28px icon 6px before "View 5 photos", 8/16
  padding and 16/24 text from 768 (167.2×44), 4.8/8 and 12/18 below (125.9×37.6). No hover change.
  Measured and matched at 1280 / 768 / 500. It opens the set at image 1, as the source does from
  768; below 768 the source opens its removed overview grid, so EDS opens the viewer there too.
- **Lightbox, measured and matched at 1280 and 768 (900 high):**
  - Backdrop `rgb(0 0 0 / 95%)`.
  - Top bar 93px with a 1px `--gallery-divider` rule and 16px padding.
  - Title 24/27.6/400 from 769 (20/23 at 768 and below).
  - Close 60×60.
  - Image box 1280×751 from y=93, contain-fit, leaving the 56px bottom band.
  - Squares at x=10 / right 10, y=461.4 (source `top: calc(50% + 46.5px)`, `translateY(-50%)`, a
    1.6px lift).
- **Story-only lightbox behaviour** (an opt-in `{ story, title }` option on the shared
  `scripts/lightbox.js`, which SKODA-208 moved the gallery lightbox into; without the option
  the gallery, `preview` and media-rail lightboxes are unchanged):
  - No media-cart actions or tag chips.
  - The dialog is labelled by the title.
  - Ids stay unique per overlay (the shared lightbox numbers them), so two galleries never share one.
  - The focus trap includes authored caption links (close → link → prev → next → close).
  - An authored caption shows on one line in the bottom band, left of the counter.
- **Tokens (brand.css):** `--gallery-story-backdrop`, `--gallery-story-badge`,
  `--gallery-story-placeholder`, `--gallery-story-arrow-shadow`.
- **Deliberate differences:**
  - **Mobile viewer (< 768):** ink backdrop, 49px top bar (8px padding, 20px title), 32px close,
    44px green squares (8px padding, 28px chevron) 10px from the edges. The source has no viewer to
    match here.
  - **1690+ inset:** the source moves the squares and counter to 30px at 1690, a step outside the
    breakpoint allowlist; EDS keeps 10px.
  - **"Share gallery":** the bar's right-hand share control is SKODA-215 and isn't rendered; the
    bar's layout leaves its place at the right end.
  - **Focus trap outside the story:** the default, `preview` and media-rail lightboxes keep a
    buttons-only trap. This ticket only changes the story path; widening it for the others would
    change SKODA-203/208/223 behaviour.
- **Import:** the pending contract `gallery-story` is registered. Nothing emits it yet:
  `skoda-story-cleanup.js` still drops `.sb-gallery` (SKODA-604/801).

## Dependencies
- Upstream: SKODA-203 (shared Gallery block + accessible lightbox), SKODA-106 (design tokens).
- Integration: SKODA-604 (1–2 full-fidelity demo stories); SKODA-801 (story importer at scale).
- Related: SKODA-215 (story gallery sharing; independently scoped), SKODA-607 (Peaq
  press-release composition; must not regress).

## Risks / Flags
- The current `gallery-lightbox.md` combines Colorbox press-release values and `sb-gallery`
  story values in one checklist. Use the **story-specific** source measurements above for this
  variant; do not impose green side controls or a below-image strip on SKODA-203's Peaq target.
- The source overview mode may open on mobile, but its removal is intentional; compare only
  agreed viewer states, not the removed toggle.
