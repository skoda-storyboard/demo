# SKODA-801a, M1 story import fidelity slice (21 in-scope stories)

- **Epic:** E08, Phase B migration (M1 slice of SKODA-801)
- **Type:** import / transformer
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (15 Oct demo)
- **Estimate:** 1.5 SP (was 3 SP; re-scoped 2026-09-24, see below) · AI-assisted 0.5–1d / manual 1.5–2d *(planning estimate, not a quote)*
- **Parent:** SKODA-801 (#48) · **GitHub issue:** [#127](https://github.com/skoda-storyboard/demo/issues/127)
- **Discovered in:** M1 gap review, 2026-09-24

> **Re-scoped (2026-09-24, review §15): 3 → 1.5 SP.** PR #113 merged SKODA-801 and parts of 816–818/820, so:
> - carousel → **SKODA-819** (Gallery `slider`; the importer already emits `Gallery`)
> - embeds → **SKODA-818** (done in #113)
> - sidebar and tags → 801 / **SKODA-817** (done in #113; the sidebar is now kept, not dropped)
>
> **What remains here:** the Media Box → `downloads` mapping on 21/21 stories (after #111), plus the 21-story batch
> run with the per-URL coverage report. The 801 code comments and SKODA-820 still say "Media Box deferred to 604".
> This ticket overrides that for the 21 in-set stories.

## Summary
The origin/main story importer flattens a story to default content only. `import-story-detail.js` +
`transformers/skoda-story-cleanup.js` deliberately **drop** the following, and log the loss as "deferred to
SKODA-801/814/604":
- the Media Box (`.search-results.media-box`)
- `.sb-gallery` / `a.colorbox`
- embeds (`.embed-controller-wrapper`, `.page-embed`)

It also never maps the `skoda-carousel-widget`. *(Historical: since #113, `story-flatten.js` routes it to Gallery
or Cards, and embeds become bare URLs via 818.)*

The 21 story URLs in the 43-URL M1 set (20 unique pages; one is the mixed-reality alias, see SKODA-609), checked
live on 2026-09-24, all contain:
- **21/21** an in-body `skoda-carousel-widget` image carousel (→ SKODA-819, formerly SKODA-219)
- **21/21** a Media Box with downloadable originals (→ SKODA-502 `downloads`, cart seam 505a)
- **2/21** Vimeo embeds (`peaq-enters-production-…`, `explore-the-new-skoda-models-in-mixed-reality`) (→ SKODA-204)
- **21/21** sidebar tags plus a CS `hreflang` alternate

If nothing changes, the demo shows 21 text-only stories. This ticket is the **M1 reduced-fidelity-plus** slice:
reconstruct the media that exists in all 21 stories, and keep the rest of SKODA-801/814 (long tail, rare widgets,
1,614-page corpus) in M2.

## Requirements / Spec
- **Carousel.** ~~Map each `widget_skoda-carousel-widget` to the SKODA-219 carousel variant, in body order.~~ Moved
  to SKODA-819: the importer emits `Gallery (slider)`.
- **Media Box.** Map `.search-results.media-box` to the `downloads` block, using the SKODA-502 contract:
  - Original + 1920px renditions per image
  - asset count taken from the mediabox API, not the DOM count, which is roughly 2× because it includes rendition
    rows
- **Embeds.** ~~Map `.embed-controller-wrapper` / `.page-embed` (Vimeo) to the `embed` block (SKODA-204).~~ Done by
  SKODA-818 in #113 (bare URL → 204 autoblock).
- **Tags.** Keep the visible tags block. The tags must be derived before the sidebar is stripped, as today.
- **Sidebar.** ~~For M1, drop the sidebar, share cluster and newsletter.~~ Superseded: 801 (#113) keeps the
  two-column aside, and SKODA-817 handles its parity. Share is 215 and the newsletter stub is 823 (Could).
- **Media prep.** Masters-only images and the pre-conditioning gate follow SKODA-501 and SKODA-506.
- **Cleanup changes.** Update `skoda-story-cleanup.js` so the Media Box selectors are no longer in the drop list.
  Log only what stays deferred.

## Acceptance Criteria
- [ ] All 21 in-scope stories import with Media Box → downloads in source order. The #113 output (Gallery, embeds,
      aside, related band) is unchanged. A per-URL checklist in the SKODA-603 tracker shows 0 unexpected drops.
- [ ] Spot-check 3 stories (one per category) against the source: component presence and order, captions and alt
      text, download link counts.
- [ ] No `skoda-storyboard.com` absolute links remain (SKODA-605) and no consent residue remains (SKODA-606).
- [ ] Importer unit or fixture tests cover the Media Box mapping. `npm run lint` is clean.

## Dependencies
- Upstream: SKODA-601 (importer), SKODA-801 (#113), SKODA-819 (was 219), SKODA-818, SKODA-502 (#111), SKODA-204 (#109), SKODA-501/506.
- Downstream: SKODA-603 (43-URL import), SKODA-604 (full-fidelity hero stories), SKODA-704 visual sign-off.

## Import contract (SKODA-603)
Contract(s) `gallery-slider`, `quote`, `columns-split`, `spec-table-versions` (proposed) in [`SKODA-PENDING-BLOCK-CONTRACTS.md`](../../planning/SKODA-PENDING-BLOCK-CONTRACTS.md). The story importer emits these pinned shapes. The raw `version` spec table (Epiq) must become `Spec Table (versions)` or text; the check fails `version`. If this ticket needs a different DA shape, change the contract (and bump `shape`) in the same PR.
