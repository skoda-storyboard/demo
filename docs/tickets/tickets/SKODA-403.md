# SKODA-403 — Search block (Block Collection, index-only)
- **Epic:** E04 — Listings & Search
- **Type:** block
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (15 Oct demo)
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 2–4d *(planning estimate, not a quote)*

## Summary
Wire the Block Collection **Search** block over `/query-index.json` for the pilot — title/summary/tag matching only. Body-relevance/hosted search is deferred to Phase C.

## Description
The source search runs on ElasticPress (server-rendered `teaser` results with full-text body relevance). For the pilot the EDS target is the **Block Collection Search block over `/query-index.json`** (`/developer/block-collection/search`), which provides title/summary/tag matching against the same index built in SKODA-401. The honest boundary: the index does **not** replicate full-text body search, fuzzy/typo tolerance, or relevance ranking — that becomes an optional **hosted search service fed by the same index in Phase C (SKODA-901)**. Pilot accepts reduced recall.

## Requirements / Spec
- **Search page content model:** a DA doc containing the Block Collection `Search` block (defaults to `/query-index.json`; per-locale index for localized search).
- Copy/extend the Block Collection Search `.css`/`.js`; keep vanilla, no dependencies.
- Matches on indexed fields (title/summary/tags); renders result links to matched pages.
- Accessible: labelled search input, keyboard-operable results, results announced appropriately.
- UI strings via placeholders per i18n architecture.
- Body-relevance/fuzzy/typo/ranking explicitly **out of scope** (Phase C).

## Acceptance Criteria
- [ ] Search block reads `/query-index.json` (locale-appropriate) and returns matching results.
- [ ] Query matches title/summary/tag fields from the index.
- [ ] Search input is labelled and keyboard-accessible; results are navigable.
- [ ] Scope is index-only — no body/relevance/fuzzy search claimed or implemented.
- [ ] `npm run lint` passes.

## Dependencies
- Upstream: SKODA-401 (query-index schema) / Downstream: SKODA-901 (hosted body-relevance search, Phase C, decision-gated)

## Risks / Flags
- 🟢 Low risk for pilot (reuses Block Collection Search).
- Reduced recall vs source (no body/relevance) — a known, accepted pilot boundary; production body-search decision-gated in Phase C.
