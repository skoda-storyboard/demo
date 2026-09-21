# SKODA-1001 — Per-locale content trees + per-locale query-index
- **Epic:** E10 — Localization
- **Type:** localization
- **Phase:** D  ·  **Pilot:** No · **Milestone:** M2 (go-live)
- **Estimate:** 5 SP · AI-assisted 2–3d / manual 4–6d *(planning estimate, not a quote)*

## Summary
Stand up the six per-locale content trees (`/en/ /de/ /cs/ /sk/ /sr/ /sl/`) and per-locale query-indexes via `helix-query.yaml`, mirroring the source's locale-prefix IA.

## Description
The source uses a region-first `/xx/` IA and everything is locale-scoped (banners, subscribers, mediaboxes, search). This ticket establishes the EDS equivalent: a content tree per locale and a **per-locale query-index** defined in `helix-query.yaml` using the docs' default-and-override pattern (each locale maps to `/en`, `/de`, …), output at `/{locale}/query-index.json`.

Translation coverage is **uneven per-item** — a story living in 4 of 6 languages is simply 4 docs, which the per-locale-docs model handles natively (no uniform 6× assumption). This ticket sets up the trees and indexes; the actual translation rollout is SKODA-1002.

## Requirements / Spec
- Six locale content-tree roots under `/en/ /de/ /cs/ /sk/ /sr/ /sl/`.
- `helix-query.yaml` per-locale index definitions (default + per-locale override), each emitting `/{locale}/query-index.json` with the 15-facet schema.
- `hreflang` metadata wired per locale; uneven coverage tolerated (missing locales simply absent).
- Faceted-listing and search blocks read the correct locale index from the URL prefix.

## Acceptance Criteria
- [ ] Each of the six locales resolves its own content tree and `/{locale}/query-index.json`.
- [ ] Listing/search blocks pick the locale index from the URL prefix.
- [ ] `hreflang` is correct per locale and tolerates items missing in some locales.
- [ ] Index facet schema matches the EN Phase A index across all locales.

## Dependencies
- Upstream: SKODA-401 (query-index schema + helix-query selectors), SKODA-603 (pilot content validated) / Downstream: SKODA-1002 (Translation rollout), SKODA-1003 (root routing + placeholders)

## Risks / Flags
- Per-language content totals were never enumerated for all 6 (adversarial C8 / downgrade) — scope per locale is an estimate until content-ops maps actual coverage.
- Which locales are actively maintained vs. stale is unconfirmed — confirm before full rollout.
