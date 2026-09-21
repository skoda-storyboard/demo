# SKODA-603 — Pilot page set (PR article + PR listing + reps) imported + validated
- **Epic:** E06 — Import Pilot Content
- **Type:** import
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (15 Oct demo)
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 2–3d *(planning estimate, not a quote)*

## Summary
Run the import pipeline end-to-end on the pilot page set — a press-release article, the PR listing, and a couple of representative pages — and validate the result against the source.

## Description
This is the pilot integration point that proves the static architecture end-to-end: it exercises the parsers/transformers (SKODA-601), the DA push + bulk publish (SKODA-602), the core blocks (cards/teaser, hero, gallery, embeds, tags), and the media pipeline (masters-only images + static Downloads). The pilot page set is a press-release article + the PR listing + a couple of representative pages — deliberately **not** a story page (SiteOrigin flattening deferred to Phase B). Validation compares imported content, blocks, media, and metadata against the source.

## Requirements / Spec
- Import the pilot set: one press-release article, the PR listing, and a couple of representative pages.
- Verify each renders correctly in preview: sections, blocks (cards/teaser, hero, gallery+modal, embeds, tags), listing over query-index, static Downloads, masters-only images with `<picture>` + captions.
- Validate content completeness vs source (text, headings, media, metadata, links).
- No story/SiteOrigin page in the pilot set.
- All 🟠 services stay deferred (plain download links; no cart/banner/newsletter; index-only search).

## Acceptance Criteria
- [ ] Pilot set imported and published (via SKODA-602 pipeline).
- [ ] Each pilot page renders with correct sections/blocks/media/metadata in preview.
- [ ] Listing page filters/sorts/pages over the query-index; Downloads render as static links.
- [ ] Content validated against source with no material loss (captions, alts, metadata intact).
- [ ] `npm run lint` clean.

## Dependencies
- Upstream: SKODA-601, SKODA-602, SKODA-201, SKODA-202, SKODA-203, SKODA-204, SKODA-205, SKODA-206, SKODA-501, SKODA-502. / Downstream: SKODA-702, SKODA-703 (perf + a11y run against the imported pilot); SKODA-804 (consent/analytics wiring); SKODA-801/802 (Phase B scale); SKODA-1001 (per-locale trees).

## Risks / Flags
- This ticket has the widest dependency fan-in (blocks + media + import infra) — a slip in any upstream item blocks it.
- Some validation items (LCP/CLS, modal/lightbox behavior) are `[RUNTIME-UNCONFIRMED]` and are formally cleared in E07.
