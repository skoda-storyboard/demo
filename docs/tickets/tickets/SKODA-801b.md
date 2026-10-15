# SKODA-801b, Story corpus run: every EN story through the flatten, REST-enumerated (follow-up to SKODA-801)
- **Epic:** E08, Editorial at Scale (follow-up to SKODA-801, #48, closed 2026-09-24)
- **Type:** import · **Phase:** B · **Milestone:** M2 (go-live 02 Jan 2027)
- **GitHub issue:** [#368](https://github.com/skoda-storyboard/demo/issues/368) (created 2026-10-15 from the M2 readiness review)
- **Estimate:** 3–5 SP *(planning estimate, not a quote)*
- **Status (2026-10-15):** 🔵 TODO (M2), no owner.

## Why
SKODA-801 shipped the flatten (17-widget map, two-column body + aside) and closed on M1 scope. The M2 work it left is the
**full corpus**: 69 of 1,303 EN stories are live. The rare-layout stories (the ~36 outside the simple widget map) were
never run.

## Scope
- Enumerate from REST (`/wp-json/wp/v2/posts?lang=en`), not from the sitemaps. `post-sitemap[1-4]` stops at 4 × 1,000
  URLs (newest `lastmod` 2025-08-12) and misses **193** EN stories, including every 2026 Peaq / Epiq story
  ([coverage matrix §1](../../planning/SKODA-PAGE-COVERAGE-MATRIX.md)).
- Run `import-story-detail` over the whole list in checkpointed batches, through the 803 automation once it exists.
- Report for each batch: unmapped widgets, empty bodies, dropped Media Box / gallery / embeds, link-allow-list misses.
- The rare layouts get a mapping or a logged degrade-to-readable rule. Nothing may silently drop content.

## Acceptance criteria
- [ ] 1,303 / 1,303 EN stories imported to DA, or each exception listed with a reason.
- [ ] 0 stories with an empty body. Each rare layout is either mapped or degrades to readable content, with the drop logged.
- [ ] A 5% sample is visually checked against the source (coherent resemblance, per the 704 criterion).
- [ ] Publishing stays with a person (separate go-ahead), as for every bulk push.

## Dependencies
801 ✅, 814 (SiteOrigin body contract), 803 (bulk automation), D7 (content cutoff: if the client cuts the archive, the run
shrinks).

## Collision scope
`tools/importer/import-story-detail*`, `story-flatten.js`, the shared `skoda-*` transformers. Serialize with 509 and 814.
