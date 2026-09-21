# SKODA-901 — Search: hosted body-relevance search fed by index (decision-gated)
- **Epic:** E09 — Dynamic Services
- **Type:** service
- **Phase:** C  ·  **Pilot:** No · **Milestone:** M2 (go-live)
- **Estimate:** 8 SP · AI-assisted 3–5d / manual 6–10d *(planning estimate, not a quote)*

## Summary
Add a hosted search service (Algolia / Elastic / Adobe) fed by the query-index, for full-text body search, fuzzy/typo tolerance, and relevance ranking beyond what the static index provides. Decision-gated: only build if index-only recall is judged insufficient at go-live.

## Description
The Phase A pilot ships **index-only** search: title/summary/tag matching + the 15 taxonomy facets + sort + deep-link paging, all client-side over `/{locale}/query-index.json` (no server round-trip). It does **not** replicate ElasticPress's full-text **body** search, fuzzy/typo tolerance, or relevance ranking.

This ticket closes that gap *if the business requires it* — a hosted search SaaS indexes the same published content (fed from the query-index or a crawl) and the Search block queries the hosted API instead of the static JSON. The decision gate is explicit: index-only may be acceptable for launch (reduced recall), in which case this ticket is deferred or dropped.

## Requirements / Spec
- Decision record: confirm body-relevance search is required at go-live (else defer/drop).
- Select and provision a hosted search provider; ingest pipeline fed by the query-index (per-locale).
- Search block queries the hosted API; graceful fallback to index-only if the service is unavailable.
- Preserve the 15-facet + type filtering behavior alongside relevance ranking.
- Consent/analytics: search interactions emit the appropriate `skoda-analytics` events (coordinate with SKODA-905).

## Acceptance Criteria
- [ ] A documented go/no-go decision on hosted search exists before build.
- [ ] If built: full-text body queries return relevance-ranked results with fuzzy/typo tolerance across all locales.
- [ ] Facet + type filtering still work in combination with relevance search.
- [ ] Search block degrades gracefully to index-only when the hosted service is unreachable.
- [ ] Search events feed the dataLayer per the analytics contract.

## Dependencies
- Upstream: SKODA-401 (query-index schema + helix-query selectors) / Downstream: none

## Risks / Flags
- **Decision-gated:** may be dropped if index-only recall is acceptable at launch.
- Hosted-search procurement/cost + per-locale ingest are unquantified backends (Med).
- Provider choice (Algolia/Elastic/Adobe) affects cost, ingest model, and lock-in — stakeholder decision.
