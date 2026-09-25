# SKODA-608, Image & video item index rows for listings and model media rails

- **Epic:** E06, Import Pilot Content
- **Type:** import / index
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (15 Oct demo)
- **Estimate:** 3 SP · AI-assisted 1–1.5d / manual 2–3d *(planning estimate, not a quote)*
- **GitHub issue:** [#117](https://github.com/skoda-storyboard/demo/issues/117)
- **Discovered in:** M1 gap review, 2026-09-24

## Summary
Several surfaces read `template=image` / `template=video` rows from the query-index:
- `/en/images/` and `/en/videos/` (both in the 43-URL M1 set)
- the **Images** and **Videos** rails on all 5 in-scope model pages

**No importer on origin/main produces those rows.** `import-images-listing.js` and `import-videos-listing.js` import
only the listing *shell*. The live index on `main` currently holds 3 rows, none of them images or videos. As a
result, both listings and 10 model rails render empty.

[`SKODA-RAIL-FEED-MAP.md`](../../planning/SKODA-RAIL-FEED-MAP.md) §6 sizes the floor at **≥18 items each**, and
[`skoda-rail-feed-corpus.txt`](../../planning/skoda-rail-feed-corpus.txt) already lists 18 image and 18 video
attachment pages, HTTP-verified.

## Requirements / Spec
- **Approach.** Recommended: **one lightweight EDS page per attachment item** at the source path, with template
  `image` / `video`. This lets the existing `listing` and `story-rail` blocks and the query-index work unchanged.
  - Alternative: a generated DA sheet feed. Only choose this if the listing block gains a feed source; record the
    decision in the PR.
- **Metadata per item:**
  - `title`, `description`/caption, `image` (a masters-only thumbnail, per SKODA-501)
  - `date`, `template`
  - `tags`, `model` and the facet fields listed in `query-index-config.yaml`
  - for **download**: the Original URL and the 1920px rendition (images), or the MP4 source URL (videos). The MP4 URL
    is recorded as metadata only; SKODA-503 routing is not required for this ticket.
- **Model rails.** Items must carry the `model-*` tags that the rails need. Minimum: the Peaq and Epiq rails reach
  ≥12. For Octavia, Superb and Fabia the rails will be empty. **Hide-empty is implemented in SKODA-208**
  (`blocks/story-rail`); this ticket only supplies the rows.
- **Faceting.** Tag enough items to prove facet narrowing on both listings: ≥18 per listing, so that one facet
  still leaves a load-more.
- **Repeatability.** Import through the SKODA-602 pipeline, reindex, and record the rows in the SKODA-603 tracker.

## Acceptance Criteria
- [ ] `/en/query-index.json` contains ≥18 `image` rows and ≥18 `video` rows with populated thumbnails, dates and tags.
- [ ] `/en/images/` and `/en/videos/` render 12 items. Load more appends 12, and at least 2 facets narrow the result
      set and deep-link.
- [ ] Peaq and Epiq model pages show populated Images and Videos rails. Rails with no rows are hidden and leave no
      empty heading.
- [ ] Lightbox, download and add-to-cart affordances on items follow SKODA-203 and SKODA-505a, once they land.
- [ ] **Amendment (2026-09-25, sweep reconciliation):**
  - Rows: JPG Original + 1920, MP4, Vimeo ID/poster, date, and the 15 facets. Model-media rows keep the
    model/bodywork facets. An empty listing shell is not acceptable.
  - **Listing media-card cell:** date, filename, the add/download toolbar and the lightbox detail panel (parallel
    sweep §5).
  - Listing layout: columns 1/3/4/4, facets collapsed until "Advanced filter (0)" (the 402 listing QA fix).

## Dependencies
- Upstream: SKODA-601, SKODA-602, SKODA-401/104 (index config), SKODA-501/503.
- Downstream: SKODA-208 (model rails), SKODA-402 QA on real content, SKODA-603 tracker, SKODA-707 dry run.
