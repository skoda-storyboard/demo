# SKODA-839, Home Models rail: each card shows the source model card image

- **Epic:** E08, Editorial at Scale
- **Type:** import (category-archive importer + re-import of the 11 model tag pages)
- **Phase:** A · **Milestone:** M1
- **GitHub issue:** [#310](https://github.com/skoda-storyboard/demo/issues/310)
- **Origin:** user question 2026-10-09 ("why do the model cards on /en have a different image than on origin?")
- **Depends on:** #306 (#272: Models rail order and card set, model tag pages as cards)
- **Branch:** `skoda-839-model-card-image`
- **Status (2026-10-10):** 🟢 11 tag pages **published** (user go-ahead): live index `image` = card image, 11/11.
  With #306's code, the Models rail shows the source card images. The rail goes live when #306 merges. Open:
  card frame aspect (see "Measured").

## Problem
Measured 2026-10-09 on `/en`, origin vs live:

| | Origin | EDS (main) |
|---|---|---|
| Card image | the model's featured image, the header banner (768w rendition, e.g. `elroq_header_fede6794-768x300.jpg`) | the page's index `image` |
| On `main` | | model pages → their `og:image`, the source's cut-out PNG (e.g. `hero_car_timiano_ext_front`) |
| With #306 | | model tag pages → no metadata image, so the first page image: the tag-page banner (e.g. `Elroq_banner_2500_480`) |

- The source card image appears only on the source home. The tag page doesn't carry it.
- The source sets no `og:image` on tag pages.
- The tag page's featured-model card uses yet another image (Epiq: `m90-design-02` vs card `m70-01`).

## Fix
- **`import-category-archive.js`:** `MODEL_CARD_IMAGES` maps the 11 home-card models to the masters of their source
  card renditions (measured on `/en/`, 2026-10-10; all 11 masters return 200).
  - `templateFor(originalURL)` passes the matching master as the metadata `image` override for `/en/tag/model/<slug>/`.
  - Other archives keep the shared template: the source og:image or none. So do Kylaq and Slavia, which have no home
    card.
  - Model pages keep their source `og:image`, so social sharing is unchanged.
- **Test:** `tools/importer/category-archive.test.mjs` (4 tests) runs the importer itself. It covers a model tag page
  → its card image (which also wins over an og:image), a tag page without a card → none, and other archives → their
  og:image or none.

## Validation
- **Bundle:** rebuilt. The diff holds only the map and `templateFor`.
- **Import:** 11/11 model tag pages.
- **Media:**
  - All 11 card images already had `done` manifest rows (the model page heroes).
  - Delivery-only `media:build` on the Epiq and Peaq tag pages added their new 2026/10 hero banners (origin drift):
    `Skoda_Epiq_header_siroky` (a 2560w rendition, because the 13.8 MB master is over 10 MB) and
    `Peaq_siroky_header`. Both are `done`.
  - The Epiq `m70-01` row gained its page ref. The `""→null` caption noise was reverted.
  - `media:apply`: 0 unresolved.
- **DA diff (push conditioning vs current DA):**
  - 9 pages: +8 lines, only the metadata Image row.
  - Epiq and Peaq: also the new origin hero banner.
- **Push:** dry-run, then `--stage push,preview`: 11 updates, 0 conflicts.
- **Preview `og:image`:** 11/11 are the card image, with the source card proportions (768×300, 768×292, 768×291,
  768×438, 768×432). Elroq and Octavia resolve to the same media as their model page heroes.

## Publish (2026-10-10, user go-ahead)
- `--stage publish`: 11/11 (bulk preview + live), 0 conflicts.
- **Live:** the `og:image` and the live query-index `image` match on 11/11 tag pages.

## Measured: origin vs #306 + this content (780px viewport)
- **Rail on #306's draft home** (`fix-272-home-qa--…/drafts/issue-272-home`): 11 cards in source order, linking to
  `/en/tag/model/<slug>`. Each image is the source card image (e.g. Elroq = `elroq_header_fede6794` media).
- **Card image frame:**
  - Origin `article.type-skoda_model img`: 314×123 (2.55:1), `object-fit: fill`, so the full banner shows.
  - #306 `.story-rail` card image: 214×120 (1.78:1), `object-fit: cover`, so the banner's sides are cropped.
  - This is rail card sizing (#306 / SKODA-611b model ladder), not content; reported on #306.

## Acceptance Criteria
- [x] The 11 model tag pages carry their source home card image as the page image
- [x] Other archives unchanged (the source og:image or none)
- [x] Importer test + bundle; lint clean
- [x] 11 pages pushed + previewed (0 conflicts)
- [x] 11 pages published (2026-10-10, user go-ahead); the live index `image` = the card image, 11/11
- [x] With #306's code: the Models cards show the source card images (measured on its draft home)
- [ ] Card frame aspect matches the origin (2.55:1, uncropped); owned by #306
