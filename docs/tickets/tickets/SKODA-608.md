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

> **Update (2026-09-27, phase 1: import + index).**
>
> - **Scope:** import, index and content only; block work is ticketed: **SKODA-402a** (listing 1/3/4/4 + collapsed
>   facets), **SKODA-406** (listing media card), **SKODA-208** amendment (hide the whole empty rail section).
> - **Item pages** live at `/en/images/<slug>` / `/en/videos/<slug>` (the listing's path scope), built by
>   `tools/importer/media-items/build-media-items.mjs` from the **source listing cards** (the only source covering
>   items whose attachment page 404s; `ajax_search_results_<type>=N` renders N cards). Contract `media-item` shape 2.
> - **Corpus expanded** from the 18+18 attachment list (which couldn't meet the ACs: images carried no model tags)
>   to Peaq/Epiq-tagged items: **74 images** (Peaq 41, Epiq 30, 12 interior) and **27 videos** (Peaq 8, Epiq 6).
> - **Rail AC amended:** Peaq and Epiq Images ≥12; Videos show **every playable** source video for the model:
>   Peaq 8, Epiq 6. Five source videos (451655/57/58, 452405, 436546) are Vimeo domain-restricted to
>   skoda-storyboard.com (oEmbed `domain_status_code 403`): they can't play on the demo and have no poster, so
>   they are not imported. The source rails show 13 / 9 including them.
> - **Download fields** are stable CDN URLs (`/direct-download/` redirects to an expiring presigned S3 URL).
> - **Facets:** the listing parser now uses the index column keys (`years`, `happening`; was `year`, `event`) and
>   adds `bodywork` + `view` on the media listings; Videos is 4 columns like the source.

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

## Import contract (SKODA-603)
Contract(s) `media-item` in [`SKODA-PENDING-BLOCK-CONTRACTS.md`](../../planning/SKODA-PENDING-BLOCK-CONTRACTS.md). An index-row contract, not a block (`template` = image/video + title, description, image, date, tags, model, facets, download fields). `?attachment_id=` corpus URLs need a path mapping (the tracker lists them as unmapped). If this ticket needs a different DA shape, change the contract (and bump `shape`) in the same PR.
