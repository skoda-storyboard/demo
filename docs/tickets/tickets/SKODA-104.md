# SKODA-104 — helix-query.yaml skeleton (per-locale index defs)
- **Epic:** E01 — Foundation & Setup
- **Type:** setup
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (15 Oct demo)
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 2–3d *(planning estimate, not a quote)*

## Summary
Author the `helix-query.yaml` skeleton with per-locale index definitions — the DA-mandated replacement for spreadsheet indexing that all listings/search depend on.

## Description
This is the single biggest DA-vs-AEM design difference (`SKODA-EDS-DA-ARCHITECTURE.md` §1, §6, R-A1): **spreadsheet-based indexing is NOT supported in DA**, so the query index is built via `helix-query.yaml` CSS-selector indexing over published HTML, output at `/{locale}/query-index.json`. This ticket lays the skeleton (structure, per-locale index definitions, output paths); the full 15-facet selector schema is fleshed out in SKODA-401. Index design sits on the critical path for E04.

## Requirements / Spec
- Create `helix-query.yaml` at repo root.
- Define **per-locale indexes** using the indexing reference default-and-override pattern (`/developer/indexing`, `/docs/indexing-reference`): a base definition + per-locale include globs mapping to `/en/`, `/de/`, `/cs/`, `/sk/`, `/sr/`, `/sl/`. Pilot enables `/en/`; other locales stubbed for E10.
- Output: `/{locale}/query-index.json`.
- Skeleton column set (selector-extracted; full facet expansion in SKODA-401):
  `path, title, description, image, template, date, category, model, tags`.
- Multi-value facet columns to be comma-joined for client `includes()` filtering (documented as a placeholder for the 15 facets).
- Include/exclude globs scope the index to pilot content; no spreadsheet/sheet references.

## Acceptance Criteria
- [ ] `helix-query.yaml` validates and Code Sync accepts it.
- [ ] `/en/query-index.json` generates for published pilot pages with the skeleton columns.
- [ ] Per-locale definition pattern is present (EN active, others stubbed).
- [ ] No spreadsheet-based index is used anywhere.

## Dependencies
- Upstream: SKODA-102
- Downstream: SKODA-401 (full 15-facet schema), SKODA-402/403 (listing/search), SKODA-1001 (per-locale indexes)

## Risks / Flags
- R-A1 (High): listings/search entirely depend on selector indexing over published HTML — selectors must extract facet columns reliably; index design is on the critical path.
- Index only reflects **published** HTML — preview-only content won't appear; account for this in pilot validation.
