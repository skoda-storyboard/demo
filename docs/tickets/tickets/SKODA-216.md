# SKODA-216, Story gallery variant (`sb-gallery`) and lightbox

- **Epic:** E02, Core Blocks
- **Type:** block variant
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (15 Oct demo capability; story assembly via SKODA-604)
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 2–4d *(planning estimate, not a quote)*

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
