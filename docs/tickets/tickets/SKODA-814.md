# SKODA-814, SiteOrigin body flatten contract (Page-Builder rich-text region)
- **Epic:** E08, Editorial at Scale
- **Type:** block / import
- **Phase:** B  ·  **Pilot:** No · **Milestone:** M2 (go-live)
- **Estimate:** 5 SP · AI-assisted 2–3d / manual 4–6d *(planning estimate, not a quote)*

## UI Specification
**Build-ready measured spec: [`docs/ui-specs/siteorigin-body.md`](../../ui-specs/siteorigin-body.md)** (structure + core type measured via Chrome DevTools on a live story). Read it before implementing. Block-universe evidence: [`docs/analysis/SKODA-BLOCK-RECOUNT.md`](../../analysis/SKODA-BLOCK-RECOUNT.md) §3/§6.

Key facts from the block recount (2026-09-15) that create this ticket:
- The SiteOrigin body is the **most-rendered content region with no dedicated spec: 1,614 pages** (1,568 STO / 46 MR). It is the generic authored body behind the story flatten.
- Structure = nested `.panel-grid > .panel-grid-cell > .so-panel > .siteorigin-widget-tinymce` (rich text) + `.sow-headline` (heading widget) + image widgets, in author-defined 1/2/3-column rows.
- Heading levels are **author-chosen and often invalid** (sample uses `<h3>` with no `<h2>`), so the flatten must re-derive a correct hierarchy.

## Summary
Define and build the parser contract that flattens the SiteOrigin Page-Builder body into clean EDS sections + default content, with a `columns` block only for genuine side-by-side columns. This is the reusable flatten SKODA-801 (story corpus) depends on; it also serves the model description and generic Pages.

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
- [ ] Flattened body renders `16/24/400` `#161718`, para `margin-bottom 20px`.
- [ ] A source 2-col row -> `columns` block matching the `~50/50` split at `>=768`, stacked `<768`; 1-col rows are plain default content.
- [ ] Exactly one `<h1>` (title); body headings form a valid order (fixes source `<h3>`-without-`<h2>`).
- [ ] Output has no `panel-grid`/`so-panel`/`siteorigin-widget-*` classes or empty wrapper `<div>`s.
- [ ] Inline media keeps its `.ratio-container` ratio and routes through `gallery` / `embed` handling.
- [ ] Visual diff vs source at 1280/768/mobile ≤ 2% per-pixel (excluding image content).

## Dependencies
- Upstream: SKODA-601 (import infra), SKODA-203 (gallery), SKODA-204 (embeds)
- Downstream: **SKODA-801** (story-corpus flatten consumes this contract), SKODA-208 (model description reuses it), SKODA-813 (generic Page base), SKODA-1001 (per-locale trees)

## Risks / Flags
- **Column heuristic (🟡):** deciding when a 2-col SiteOrigin row is a real `columns` block vs an authoring accident, verify against a sample of multi-col stories before locking.
- **Heading re-derivation (🟡):** author-chosen levels are inconsistent; the re-order logic needs a spot-check corpus.
- Volume: 1,614 pages, this is the long pole of SKODA-801; instance-level variety (tables, blockquotes, nested widgets) may surface more cases.
