# SKODA-209, Category / Tag archive template
- **Epic:** E02, Core Blocks
- **Type:** template / import
- **Phase:** B  ·  **Pilot:** No · **Milestone:** M2 (go-live)
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 2–4d *(planning estimate, not a quote)*

## UI Specification
**Build-ready measured spec: [`docs/ui-specs/template-category-archive.md`](../../ui-specs/template-category-archive.md)** (captured via Chrome DevTools on the live eMobility category + Octavia tag). Read it before implementing. Template map: [`docs/ui-specs/_TEMPLATES.md`](../../ui-specs/_TEMPLATES.md).

Key facts from capture (2026-09-15) that create this ticket:
- One WordPress `archive` template serves both `/en/category/<x>/` and `/en/tag/<taxonomy>/<x>/` (Storyboard side). Resolves the stale "category template not yet assembled" note.
- **No facet panel** (unlike the MR `template-search-results` engine): it is a short term hero (`240px` desktop / `184px` mobile, title = term name; tag shows parent+term e.g. "Models Octavia") + a `.search-results-items` card grid reflowing **3 → 2 → 1** columns (1280/768/500), `16:9` cards.
- **Pagination not in static DOM**, verify live (likely a JS "Load more" or infinite scroll).

## Summary
Assemble the Storyboard category/tag archive: a term hero + a responsive card grid driven by the query-index, with accessible pagination. Distinct from the MR faceted listing (no facet panel).

## Description
Confirmed live. This ticket delivers:
- **Term hero:** short banner titled by the taxonomy term (category term; tag = parent + term).
- **Card grid:** `.search-results-items` reusing `card-teaser`; responsive 3/2/1 columns; newest-first (confirm).
- **Pagination:** accessible "Load more" over the query-index (default; confirm vs source mechanism).
- **Parser/retrieval:** query-index filtered by the term; Metadata carries template=category|tag + term.

## Requirements / Spec
- Reuse `hero` banner + `card-teaser` grid + query-index retrieval (as `story-rail`/`faceted-listing`).
- No facet panel; STO chrome; content cap 1248.
- Pagination = Load more button (or the confirmed source mechanism) with focus/aria-live on new results.

## Acceptance Criteria
Measurable gates live in [`template-category-archive.md` §10](../../ui-specs/template-category-archive.md); summary:
- [ ] STO shell; single `h1` = term name (category term; tag = parent + term).
- [ ] Hero banner ~`240px` desktop / `184px` mobile; term title from `hero.md` scale.
- [ ] Card grid flex-wrap **3-up 1280 / 2-up 768 / 1-up 500**; cards `16:9`; **no facet panel**.
- [ ] Pagination via accessible "Load more" (or confirmed source mechanism); new results announced, focus managed.
- [ ] Content cap `1248`, gutter `~16px`.
- [ ] Visual diff vs source at 1280/768/500 ≤ 2% per-pixel (hero + grid).

## Dependencies
- Upstream: SKODA-201 (cards), SKODA-202 (hero), SKODA-402 (query-index retrieval), SKODA-601 (import infra)
- Downstream: SKODA-1001 (per-locale trees)

## Risks / Flags
- **Pagination mechanism (🟡):** no static control; verify Load more vs infinite scroll live before locking.
- **Grid columns (🟡):** category rendered 3-up while the tag archive rendered 2-up at the same width, confirm whether tag archives use a narrower grid.
- Ordering (newest-first assumed) to confirm.
