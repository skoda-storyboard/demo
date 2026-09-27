# SKODA-512, Media taxonomy in AEM Assets (the 15 facets as AEM tags)
- **Epic:** E05, Media Pipeline
- **Type:** taxonomy / migration
- **Phase:** B · **Milestone:** M2 (go-live)
- **Estimate:** 2 SP · AI-assisted 0.5–1d / manual 1.5–2d *(planning estimate, not a quote)*
- **Status (2026-09-27):** 🔵 TODO

## Origin
SKODA-608 decision (2026-09-27, [`SKODA-MEDIA-ITEMS-OPTIONS.md`](../../architecture/SKODA-MEDIA-ITEMS-OPTIONS.md)),
answer 2: the 15 facets (model, bodywork, derivative, view, years, …) are **not** AEM tags on the assets yet.

## Scope
- Create the tag namespaces in AEM Assets for the 15 index facets (`query-index-config.yaml`), with the source term
  slugs as tag names and the source labels as titles (the M1 generator already reads both from the source filter
  form, `facetOptions`). English terms only: skip non-EN leaks such as `model-peaq-sk`. Years are named by year,
  not by the source's numeric term id.
- Apply the tags to assets at ingest (SKODA-504), mapped from the source attachment's taxonomy classes.
- Authors tag new assets in AEM Assets with the same namespaces; the sync (SKODA-511) maps tags → feed facet columns.

## Acceptance Criteria
- [ ] All 15 namespaces exist; the migrated assets carry their source terms as tags.
- [ ] The SKODA-511 feed built from AEM Assets gives the same facet values as the M1 feed for the demo items.
- [ ] The listing facets narrow the same way as on the M1 demo.

## Dependencies
SKODA-504 (DAM ingest), SKODA-401 (facet schema). Feeds SKODA-511.
