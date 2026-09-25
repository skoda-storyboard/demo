# SKODA-508, `skoda-images` turns card-image `data-caption` excerpts into body paragraphs
- **Epic:** E05, Media Pipeline
- **Type:** import bug
- **Phase:** A · **Milestone:** M1 (it blocks re-importing press releases: SKODA-610, SKODA-603 W1)
- **Estimate:** 1 SP · AI-assisted 0.25–0.5d / manual 0.5–1d *(planning estimate, not a quote)*
- **Status (2026-09-25):** 🔵 TODO

## Origin
Found while re-importing for SKODA-610 on 2026-09-25. It isn't caused by 610: with the previous bundle, the
importer output differs from the new bundle's only in the Metadata Title.

## Problem (measured)
- The source's teaser and related-card images carry the article **excerpt** in `data-caption` / `data-video_title`
  (e.g. `<img … data-caption="Mladá Boleslav, 2. September 2026 – Škoda Auto today announced …">`).
- `transformers/skoda-images.js` (SKODA-501) renders any `data-caption` as a caption paragraph. For images inside a
  link it emits `<p><a href="…">excerpt…</a></p>`. On the Zellmer press release the lead image's link points at
  the logo PNG, and the related-card links have an empty `href=""`.
- **Effect:** re-importing the press releases adds 3–33 junk lines per page (Zellmer: the perex duplicated as a
  link plus 10 excerpt paragraphs). The same effect changes image captions on 2 stories (`whats-behind-epiq-design`,
  `this-is-epiq-…`). The published pages were imported before 501 and don't have it.

## Scope
- In `skoda-images.js` (and its test), take the caption from `data-caption` only for real figure images, not for
  teaser/card images: skip images inside `article.article-teaser`, `.media-cart-image` card thumbnails, and
  anything where `data-caption` equals the card excerpt / `data-video_title`. Never emit an empty-`href` link.
- Rebuild the affected bundles.

## Acceptance Criteria
- [ ] Re-importing the 10 SKODA-610 press releases differs from the published DA version only in the Metadata Title.
- [ ] Real image captions are unchanged (Epiq story, 501 caption fixtures).
- [ ] Unit test in `skoda-images.test.mjs`.

## Dependencies
SKODA-501. Downstream: SKODA-610 (press-release republish), SKODA-603 W1.
