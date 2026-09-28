# SKODA-223, Gallery `preview` variant (press-release sidebar media-kit preview)
- **Epic:** E02, Core Blocks
- **Type:** block variant
- **Phase:** A · **Milestone:** M1 (demo-visible on every press release)
- **GitHub issue:** [#171](https://github.com/skoda-storyboard/demo/issues/171) (sub-issue of #47)
- **Estimate:** 1.5 SP · AI-assisted 0.5d / manual 1–1.5d *(planning estimate, not a quote)*
- **Status (2026-09-28):** 🟡 In review (Developer → QA), [PR #201](https://github.com/skoda-storyboard/demo/pull/201)

## Implementation (2026-09-28)
- `blocks/gallery/gallery.js`: `Gallery (preview)` → `buildPreview()`. A `<ul>` of up to 4 `<button>` thumbs
  (`Open image N: <alt>`). With more images, the 4th cell also holds a `+N` button (`Show N more images`) that
  opens the lightbox at image 5. The lightbox is the shared `buildLightbox` over **all** rows (counter `5 / 6`),
  opened in single mode (no prev/next) when there is only one image. Captions stay off-page. `previewPlan()` is
  exported and unit-tested.
- `blocks/gallery/gallery.css`: `.gallery.preview` grid, 1-up, then 2-up at the page's 768 two-column transition
  (a viewport query on purpose: the 1-up column is wider than the 2-up one, so a container width can't express it).
  Each cell has a 1px inset (the source's 1px white `.item` border). The thumb is 16:9 `cover`, 8px radius, no
  shadow. The image rests at `scale(1.02)`, centred and clipped (172.4 wide in the 169 thumb @1280). On hover it
  adds `scale: 1.02` over `0.5s cubic-bezier(0.165, 0.85, 0.45, 1)` (175.8 wide). The zoom only applies under
  `(hover: hover) and (prefers-reduced-motion: no-preference)`.
- `+N` pill, measured on the source press kit that has one (`/en/press-kits/skoda-peaq-first-glimpse-of-skodas-new-electric-flagship/`,
  `a.more.btn-ghost-icon` "+51"): white, 2px ink ring, 50px radius, 10px padding, 16/16/700 with 1px tracking,
  5px off the thumb's bottom-right corner, 51.9×40 for "+51". On hover it turns `--skoda-grey-50` (#f1f1f1); ink
  and ring stay. The source's dim `::after` stays at `opacity:0`, so there is no overlay.
- QA round 1 (PR #201, 2026-09-28): added the resting 2% crop, the thumb hover zoom and the pill hover. My first
  hover probe drove a synthetic mouse and saw no change, so the hover states were wrongly recorded as absent.
- `templates/press-release/press-release.css`: when a sidebar `h3` ends its default content, it labels the next
  block, so the 15px group gap now comes after the block instead of between them. Source: 0px Images → thumbs and
  Tags → chips. EDS was 15px, which pushed Images and Tags 15px low.

## Verification (2026-09-28, DevTools-protocol measurements, source vs local branch)
- 5 M1 releases × 1280/1024/768/500, plus 767/1079/1080. Every cell and thumb rect equals the source to 0.1px:
  cell 171×97.1 and thumb 169×95.1 @1280, 160.7×91.3 @1024, 118×67.3 @768, 480×270.9 @500 (1-up), 169.8×96.4 @1079,
  143×81.3 @1080. The 2px gutter and the "Images" h3 → grid (0px) and grid → Tags (15px) gaps also match.
- Injected 6 and 55 rows: 4 thumbs, then `+2` / `+51`. The pill rect equals the source (1196.1, 51.9×40 @1280;
  700.1 @768; 432.1 @500). Pill → `5 / N`; thumb 4 (outside the pill) → `4 / N`.
- Real keyboard: Enter on a thumb opens the lightbox with focus on Close, Tab stays trapped, and Esc closes and
  returns focus to the thumb or pill. Every thumb on Superb opens its own index.
- Regression: default Gallery (`/en/emobility/meet-the-peaq-comfort-just-like-at-home`, 2 blocks) and `slider`
  (Epiq, 3 blocks) have the same geometry on `main` and the branch at 1280/500.
- Not this block: absolute y offsets come from content above the sidebar (stacked body column <768; Peaq's
  Additional-info block at 1280 is 32.5px shorter than the source). Separately, the Tags chips block is 69px tall
  (source list 48px). Both belong to SKODA-607 / SKODA-205.

## Origin
SKODA-607 phase split (2026-09-27). 607 delivers the press-release import + template and emits this variant's
final shape now; the block change is its own ticket (block extensions are ticketed separately, not built in 607).

## Problem (measured, source DevTools 2026-09-27, 5 M1 press releases)
- The source sidebar `section.images.sa-media-kit-preview` ("Images") is a **thumbnail-only preview**: no main
  stage, 2 columns of 16:9 thumbs, **172×97 at 1280** (content column 342 wide), **118×67 at 768**, **1 column at
  500** (488 wide). Each thumb opens the image in a lightbox. The 5 M1 releases carry 1, 3, 4, 2 and 3 thumbs.
- The ticket amendment (607, 2026-09-25) adds a **"+N" pill** once a release has more images than the preview shows
  (after 4). None of the 5 M1 releases hits it; corpus releases can.
- `blocks/gallery` has one layout only: a main image plus a 3/4/5-column thumbnail rail (gallery.js:82-173). In the
  342px sidebar that renders an oversized main stage, so the sidebar doesn't match the source.

## Scope
- `blocks/gallery`: add the `preview` variant (`Gallery (preview)`):
  - no main stage; 2-up 16:9 thumbnail grid that fills the column; 1 column below 768;
  - show at most 4 thumbs; with more, the 4th carries a "+N" pill (N = hidden count) that opens the lightbox at
    the 5th image;
  - every thumb opens the existing lightbox (`buildLightbox`), keyboard operable, labelled;
  - captions stay available to the lightbox, not shown under the thumbs.
- No change to the default Gallery or to `slider` (SKODA-819). Coordinate with 819: same block, don't run in parallel.

## Acceptance Criteria
- [x] On the 5 M1 press releases (branch preview), the sidebar Images preview matches the source at 1280/1024/768/500:
      thumb 172×97 ±2px at 1280, 2 columns ≥768, 1 column <768, gap as measured. *(cell 171×97.1, thumb 169×95.1,
      equal to the source rects; see Verification)*
- [x] "+N" pill appears only when there are more than 4 images (unit test with 6 rows → 4 thumbs, "+2").
- [x] Lightbox opens from every thumb and from the pill; Esc closes; focus returns (a11y as SKODA-203).
- [x] Default Gallery and story pages unchanged (regression check on 1 story).
- [x] lint + tests green; no re-import needed (contract shape 1).

## Dependencies
SKODA-203 (gallery + lightbox), SKODA-607 (emits the shape), SKODA-819 (same block, serialize).
Consumers: SKODA-607, SKODA-805c.

## Import contract (SKODA-603)
Contract `gallery-preview` (**pinned 2026-09-27**, fallback **readable**: the normal Gallery) in
[`SKODA-PENDING-BLOCK-CONTRACTS.md`](../../planning/SKODA-PENDING-BLOCK-CONTRACTS.md). Shape: header
`Gallery (preview)`, then one row per image `[<picture>, caption paragraph or empty]`, identical to `Gallery`.
Emitted by `transformers/skoda-press-release-layout.js`.
