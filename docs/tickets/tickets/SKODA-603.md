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

## Update (2026-09-24, M1 gap review): re-scoped to the 43-URL M1 set
Source: [`SKODA-M1-GAP-REVIEW.md`](../../reviews/SKODA-M1-GAP-REVIEW.md).

**Scope.** The pilot set is replaced by:
- the canonical **[`skoda-m1-url-set.txt`](../../planning/skoda-m1-url-set.txt)**: 43 URLs, 42 unique pages, because the
  mixed-reality nested URL is an alias → redirect per SKODA-609
- **plus** the rail-feed corpus [`skoda-rail-feed-corpus.txt`](../../planning/skoda-rail-feed-corpus.txt): ≈90–100
  tagged items, including the 18 image and 18 video items from SKODA-608
- **plus** any series-linked stories needed so the 5 series hubs are not empty (SKODA-207)

The "no story page" rule no longer applies, because 21 of the 43 are stories.

**Estimate:** 3 → **5 SP**. This ticket becomes the M1 content fan-in.

**Additional acceptance criteria:**
- [ ] A per-URL status tracker is committed alongside the URL set. Columns: imported / previewed / published /
      indexed / QA pass.
- [ ] `/en/query-index.json` holds every row from the set plus the corpus. On 2026-09-24 it held **3 rows**.
- [ ] The SKODA-609 crawl shows 0 in-site 404s.
- [ ] Preview and publish run through SKODA-602 (the DA credentials are a human gate). Content is never hand-edited.

**Order:**
1. home + listings + stories
2. PRs + models
3. series + press kits (after 805a/805c)

## Risks / Flags
- This ticket has the widest dependency fan-in (blocks + media + import infra) — a slip in any upstream item blocks it.
- Some validation items (LCP/CLS, modal/lightbox behavior) are `[RUNTIME-UNCONFIRMED]` and are formally cleared in E07.
