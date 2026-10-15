# SKODA-848, Taxonomy archives at scale: which of the 378 EN tag / category archives exist at go-live
- **Epic:** E02, Core Blocks (scale-out of SKODA-209)
- **Type:** import / decision · **Phase:** B · **Milestone:** M2 (go-live 02 Jan 2027)
- **GitHub issue:** [#367](https://github.com/skoda-storyboard/demo/issues/367) (created 2026-10-15 from the M2 readiness review)
- **Estimate:** 2 SP *(planning estimate, not a quote)*
- **Status (2026-10-15):** 🔵 TODO (M2), no owner.

## Why
The source serves **378 EN taxonomy archives**: 77 categories, 90 `history` tags, 33 `company`, 33 `technology`,
28 `concept`, 16 `model`, 16 `derivative`, 15 `vip`, 14 `years`, and smaller sets
([coverage matrix](../../planning/SKODA-PAGE-COVERAGE-MATRIX.md) §2). 41 are live. SKODA-209 owns the template, not
the volume, and nobody has decided which of the archives must exist.

## Scope
- Proposal to the client (D12):
  - **Keep:** the archives linked from the nav, cards or tag chips (Tags block), plus every facet term that has ≥ N items.
  - **Redirect:** the rest, to the facet-filtered listing (`/en/news?filter[<facet>][]=<term>`, the 402d deep links).
- Generate the archive pages from the index (category-archive importer), not by hand.

## Acceptance criteria
- [ ] Keep / redirect rule agreed. Every tag chip and category link on a migrated page resolves (0 dead links on a
      100-page sample).
- [ ] Every kept archive is imported, and every other archive has a redirect row.

## Dependencies
209, 402d, 841 (facets entered once), D12.
