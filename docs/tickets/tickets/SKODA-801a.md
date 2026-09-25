# SKODA-801a, M1 story import fidelity slice (21 in-scope stories)

- **Epic:** E08, Phase B migration (M1 slice of SKODA-801)
- **Type:** import / transformer
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (15 Oct demo)
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 3–4d *(planning estimate, not a quote)*
- **Parent:** SKODA-801 (#48) · **GitHub issue:** *not yet created* (proposed in [`SKODA-M1-GAP-REVIEW.md`](../../reviews/SKODA-M1-GAP-REVIEW.md))
- **Discovered in:** M1 gap review, 2026-09-24

## Summary
The origin/main story importer flattens a story to default content only. `import-story-detail.js` +
`transformers/skoda-story-cleanup.js` deliberately **drop** the following, and log the loss as "deferred to
SKODA-801/814/604":
- the Media Box (`.search-results.media-box`)
- `.sb-gallery` / `a.colorbox`
- embeds (`.embed-controller-wrapper`, `.page-embed`)

It also never maps the `skoda-carousel-widget`.

The 21 story URLs in the 43-URL M1 set (20 unique pages; one is the mixed-reality alias, see SKODA-609), checked
live on 2026-09-24, all contain:
- **21/21** an in-body `skoda-carousel-widget` image carousel (→ SKODA-219)
- **21/21** a Media Box with downloadable originals (→ SKODA-502 `downloads`, cart seam 505a)
- **2/21** Vimeo embeds (`peaq-enters-production-…`, `explore-the-new-skoda-models-in-mixed-reality`) (→ SKODA-204)
- **21/21** sidebar tags plus a CS `hreflang` alternate

If nothing changes, the demo shows 21 text-only stories. This ticket is the **M1 reduced-fidelity-plus** slice:
reconstruct the media that exists in all 21 stories, and keep the rest of SKODA-801/814 (long tail, rare widgets,
1,614-page corpus) in M2.

## Requirements / Spec
- **Carousel.** Map each `widget_skoda-carousel-widget` to the SKODA-219 carousel variant, in body order.
- **Media Box.** Map `.search-results.media-box` to the `downloads` block, using the SKODA-502 contract:
  - Original + 1920px renditions per image
  - asset count taken from the mediabox API, not the DOM count, which is roughly 2× because it includes rendition
    rows
- **Embeds.** Map `.embed-controller-wrapper` / `.page-embed` (Vimeo) to the `embed` block (SKODA-204). Keep
  `dnt=1` and lazy loading.
- **Tags.** Keep the visible tags block. The tags must be derived before the sidebar is stripped, as today.
- **Sidebar.** For M1, drop the sidebar, share cluster and newsletter. The STO-D07 sidebar is M2, and newsletter 904
  is ruled out. The minimum "Explore more" is served by the SKODA-212 related rail if content allows.
- **Media prep.** Masters-only images and the pre-conditioning gate follow SKODA-501 and SKODA-506.
- **Cleanup changes.** Update `skoda-story-cleanup.js` so these selectors are no longer in the drop list. Log only
  what stays deferred.

## Acceptance Criteria
- [ ] All 21 in-scope stories import with the carousel, Media Box → downloads, and embeds in source order. A
      per-URL checklist in the SKODA-603 tracker shows 0 unexpected drops.
- [ ] Spot-check 3 stories (one per category) against the source: component presence and order, captions and alt
      text, download link counts.
- [ ] No `skoda-storyboard.com` absolute links remain (SKODA-605) and no consent residue remains (SKODA-606).
- [ ] Importer unit or fixture tests cover the three new mappings. `npm run lint` is clean.

## Dependencies
- Upstream: SKODA-601 (importer), SKODA-219, SKODA-502 (#111), SKODA-204 (#109), SKODA-501/506.
- Downstream: SKODA-603 (43-URL import), SKODA-604 (full-fidelity hero stories), SKODA-704 visual sign-off.
