# SKODA-837, Press-kit import validity fixes (audit F6)

- **Epic:** E08, Editorial at Scale
- **Type:** import / transformer (+ one press-kit template CSS rule)
- **Phase:** A · **Milestone:** M1
- **GitHub issue:** [#297](https://github.com/skoda-storyboard/demo/issues/297)
- **Fixes:** [`SKODA-IMPORT-VALIDITY-2026-10-05.md`](../../reviews/SKODA-IMPORT-VALIDITY-2026-10-05.md) §5 / §8 F6 (approved 2026-10-05; user asked for it 2026-10-08)
- **Branch:** `skoda-837-press-kit-validity`
- **Status (2026-10-08):** 🟡 6 pages pushed to DA (5 previewed; Peaq 2 Images DA-only, see below). Not published.

## Problems and fixes
1. **Stray lead image on the Images children** (125 years, Epiq 2, Peaq 2).
   - `skoda-press-kit-default-layout.js` took `.column-primary .article-teaser-media img` as the lead. On the
     Images children that selector matches the first Media Box tile, because every tile is an
     `article.article-teaser` inside `.search-results`.
   - The lead is now the article's own teaser only (`!img.closest('.search-results')`).
2. **`.pdff` links** (Peaq infographics + exterior, Felicia Kit Car).
   - The source typo 404s, while the same path ending `.pdf` is the published AEM Assets original.
   - `fixPdfTypos()` corrects it before the links are named, so the banner reads "Download PDF" and the media step
     resolves it to AEM Assets.
3. **Regulatory gallery captions** (user decision 2026-10-06, "Keep it, visible", SKODA-830 D5).
   - `parsers/press-kit-media.js`, Images-child gallery groups only: each distinct WLTP / consumption + CO₂
     `data-caption` is kept once, as a note under its group.
   - Epiq 2: 9 groups, 2 distinct texts. Peaq 2: 10 groups, 3 distinct texts.
   - Plain lightbox captions stay dropped, including the 44 long 125-years captions, per the same decision.
4. **Spacing (template CSS).** Text right after a Downloads grid on a press-kit body column sits 32px below it, as on
   the source. Before it touched the grid (0px). This affects the 125-years "For more photos" lines and the new
   notes.

## Validation
- **Old vs new bundle, all 55 press-kit-default pages:** 49 byte-identical. Exactly the 6 target pages change, only
  in the intended ways.
- **Conditioned push documents vs current DA** (`.migration/f6/condition.mjs`, the push's own binary rewrite + media
  gate + `wrapPage`): only the intended changes.
  - Peaq exterior additionally moves 79 inline images from `-1440x961`-style renditions to the masters the current
    media manifest delivers; the media gate passed them.
- **Rendered with branch code, 1280:**
  - Epiq notes 16/24 ink, 32px under the gallery's Show more pill.
  - 125-years "For more photos" 32px under the grid (origin 32, main 0).
  - Felicia PDF banner points to AEM Assets and is named "Download PDF".
- **Live / preview checks:** both corrected PDF targets return 200 `application/pdf`; no stray lead before
  "Introduction" on preview.
- **Tests:** 3 new importer tests. Press-kit importer + template tests 37 pass, 1 skipped. `npm test`: 1095 pass, only
  the known `media-cart-download` (fflate) failure. Lint and stylelint clean.

## DA
- **Push:** 5 × update, preview 200. 0 conflicts.
- **`skoda-peaq-press-kit-2/images`:** pushed to DA only (`--stage push`). It has 247 images, over the 200-image
  html2md limit, so it stays held from preview as before.
- **Publish:** needs a separate go-ahead.

## Acceptance Criteria
- [x] No stray lead image on the 3 Images children; real article teasers still lead
- [x] No `.pdff` link; the 3 links resolve to the AEM Assets PDFs
- [x] Regulatory captions visible once per gallery group; other lightbox captions stay dropped
- [x] Only the 6 target pages change (old/new bundle diff); DA diff = intended changes
- [ ] Publish the 5 previewed pages (separate go-ahead)
