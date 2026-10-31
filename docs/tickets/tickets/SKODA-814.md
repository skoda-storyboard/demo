# SKODA-814, SiteOrigin body flatten contract (Page-Builder rich-text region)
- **Epic:** E08, Editorial at Scale
- **Type:** block / import
- **Phase:** B  ·  **Pilot:** No · **Milestone:** M2 (go-live)
- **Estimate:** 5 SP · AI-assisted 2–3d / manual 4–6d *(planning estimate, not a quote)*
- **GitHub issue:** [#75](https://github.com/skoda-storyboard/demo/issues/75)
- **Status (2026-10-28):** 🟡 Built on branch `skoda-814-siteorigin-flatten`: the measured contract (spec
  `siteorigin-body.md`) plus the check that proves it (`tools/importer/check-siteorigin-body.mjs`). No importer
  change was needed. The flatten exists per template, and the body is equal to origin on 51 / 51 checked pages. See
  "Verification (2026-10-28)".

## UI Specification
**Build-ready measured spec: [`docs/ui-specs/siteorigin-body.md`](../../ui-specs/siteorigin-body.md)** (structure + core type measured via Chrome DevTools on a live story). Read it before implementing. Block-universe evidence: [`docs/analysis/SKODA-BLOCK-RECOUNT.md`](../../analysis/SKODA-BLOCK-RECOUNT.md) §3/§6.

Key facts from the block recount (2026-09-15) that create this ticket:
- The SiteOrigin body is the **most-rendered content region with no dedicated spec: 1,614 pages** (1,568 STO / 46 MR). It is the generic authored body behind the story flatten.
- Structure = nested `.panel-grid > .panel-grid-cell > .so-panel > .siteorigin-widget-tinymce` (rich text) + `.sow-headline` (heading widget) + image widgets, in author-defined 1/2/3-column rows.
- Heading levels are **author-chosen and often invalid** (sample uses `<h3>` with no `<h2>`), so the flatten must re-derive a correct hierarchy.

## Summary
Define and build the parser contract that flattens the SiteOrigin Page-Builder body into clean EDS sections + default content, with a `columns` block only for genuine side-by-side columns.

**Reconciled 2026-09-24:** SKODA-801 did NOT wait on this ticket — it shipped a working SiteOrigin flatten for the story corpus (`tools/importer/parsers/story-flatten.js`: 17-widget census map, genuine multi-column → `columns` block, large-tree robustness, linear-story fallback). So this ticket is no longer "the reusable flatten 801 depends on." It now owns **generalizing that flatten to the other SiteOrigin-bodied regions at M2** — the model-page description and generic Pages (1,614 pages total) — plus the measured `siteorigin-body.md` contract and the heading-hierarchy re-derivation for author-invalid levels. Where the story parser already solves a case, lift/share it rather than re-implement.

## Description
The SiteOrigin panel tree carries no semantic value, its `panel-grid`/`cell`/`panel`/`so-widget` wrappers are pure layout. This ticket owns the **measured contract + flatten rules** for that region:
- Walk the SiteOrigin tree, emit EDS default content (unwrap tinymce widgets to `<p>`/`<ul>`/`<a>`, keep inline media).
- Multi-column rows -> a `columns` block (or section columns) only where both cells have substantive content; single-column rows -> plain flow.
- Headline widgets -> headings at a **re-derived** correct level; exactly one page `<h1>` from the title.
- Route inline images/galleries/embeds through `optimizeImageInPlace` / the `gallery` + `embed` handling.
- Drop all SiteOrigin classes + empty wrapper `<div>`s.

## Requirements / Spec
- Body text preserved at `16px / 24px / 400` `#161718`, paragraph `margin-bottom 20px` (per spec §3).
- Column split: a source 2-col row (`.so-panel` ≈ 50/50) -> `columns` at `>=768`, stacked `<768`.
- Valid, gap-free heading order; no SiteOrigin residue in output.
- Section boundaries derived on band/background change, not per SiteOrigin row.

## Acceptance Criteria
Measurable gates live in [`siteorigin-body.md` §9](../../ui-specs/siteorigin-body.md); summary:
- [x] Flattened body renders `16/24/400` `#161718`, para `margin-bottom 20px`. It is equal to origin at 375 / 768 / 780 / 781 / 992 / 1080 / 1280 on a story, a model description and a generic Page.
- [x] A source 2-col row -> `columns` block, side by side from 781 and stacked at ≤ 780 (SiteOrigin's edge, measured; the old text said 768). Cell widths equal origin within 0.2px. 1-col rows are plain default content.
- [x] Exactly one `<h1>` (title). ~~Body headings re-ordered~~: **decision 2026-10-28, the source levels are kept** (the outline must equal origin's), for a human to confirm in the PR. Every body heading is at its source level on 51 / 51 pages.
- [x] Output has no `panel-grid`/`so-panel`/`siteorigin-widget-*` classes (51 / 51 + 129 / 129 stories).
- [ ] Inline media keeps its `.ratio-container` ratio and routes through `gallery` / `embed` handling. Owned by SKODA-216 / 204; not re-measured here.
- [ ] Visual diff vs source at 1280/768/mobile ≤ 2% per-pixel (excluding image content). Not run; the measured boxes are equal, except the model inset at 781–991 (#538).

## Dependencies
- Upstream: SKODA-601 (import infra), SKODA-203 (gallery), SKODA-204 (embeds), **SKODA-801** (shipped the story-corpus flatten this ticket generalizes — reuse `story-flatten.js` rather than re-implement)
- Downstream: SKODA-208 (model description reuses it), SKODA-813 (generic Page base), SKODA-1001 (per-locale trees)

## Risks / Flags
- **Column heuristic (🟡):** deciding when a 2-col SiteOrigin row is a real `columns` block vs an authoring accident, verify against a sample of multi-col stories before locking.
- **Heading re-derivation (🟡):** author-chosen levels are inconsistent; the re-order logic needs a spot-check corpus.
- Volume: 1,614 pages. The story corpus run (SKODA-801b) carries the volume; `check-siteorigin-body.mjs` is its gate for instance-level variety (tables, blockquotes, nested widgets).

## Verification (2026-10-28)

**What the repo already does (it contradicts the 2026-09-24 summary):** the flatten exists per template.
- **Stories:** `parsers/story-flatten.js` (SKODA-801).
- **Model description:** default content in `import-model-page.js` (SKODA-208).
- **Generic Page body:** `import-page-base.js` + `skoda-page-rows.js` (SKODA-813, #409 merged 2026-10-23; SKODA-843).
- The model and Page bodies hold only editor and spacer widgets, so moving them onto the story flatten would
  change no output. They were measured and checked instead; no importer was refactored (decision 2026-10-28).

**Widget census** (`check-siteorigin-body.mjs --census`, 53 source pages): see spec §2.
- No `sow-headline` widget anywhere.
- Side-by-side rows only in stories (2 of 12) and Sustainable Offices.
- Author-skipped heading levels on 7 of 12 stories and on the consent page.

**Measured** (spec §3): origin vs `main`, 7 widths, three instances. Body text, headings, lists, rhythm and the
two-column split are equal. One difference, the model description inset at 781–991 (10 vs 20px), is filed as
#538 (the model template).

**Contract check** (`tools/importer/check-siteorigin-body.mjs`, 13 unit tests), on `main`:

| Set | Pass | Failures |
|---|---:|---|
| 23 model pages (`urls-model-page.txt`) | 23 / 23 | – |
| 17 generic Pages (`urls-page-base.txt`) | 17 / 17 | – |
| 11 stories (`urls-story-detail.txt`) | 11 / 11 | – |
| 133 stories in the preview index | 129 / 132 (1 skipped: `/en/test/listing-demo` has no source) | #536 (2 pages): the bold name after a portrait is dropped. #537 (1 page): dash lines become a list with literal `\` |

**Review draft:** `/drafts/skoda-814-siteorigin-body` is the spec's first sample story (Women's Day, not
previewed before) as `import-story-detail` writes it, with `noindex`. Locally its check passes 7 / 7 text blocks,
with 1 Columns and 1 h1.

**Filed, out of scope:** #536 and #537 (story importer, SKODA-801 / 801b), #538 (model template, SKODA-208).
