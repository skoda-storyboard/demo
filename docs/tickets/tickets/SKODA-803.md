# SKODA-803 — Bulk import automation (sitemaps/REST → DA at scale)
- **Epic:** E08 — Editorial at Scale
- **Type:** import
- **Phase:** B  ·  **Pilot:** No · **Milestone:** M2 (go-live)
- **Estimate:** 8 SP · AI-assisted 3–5d / manual 6–10d *(planning estimate, not a quote)*

## Summary
Scale the pilot's manual per-page import into an automated pipeline: discover the full EN URL set, parse per template, push to DA via the source API, and preview/publish en masse with Bulk Operations.

## Description
The pilot proved single-page and small-set imports (SKODA-602/603). This ticket industrializes it for the full EN corpus (~3,500 URLs across press-release, story, Škodapedia, press-kit, page templates). The pipeline: **discover URLs** (sitemaps / WordPress REST, per prior reports) → **route each URL to its template parser** (from SKODA-801/802 + pilot parsers) → **`POST` generated docs to `admin.da.live/source/{org}/{repo}/{path}.html`** (credentials injected by the harness; never in code) into a drafts area first → **validate** → **Bulk Operations / Traverse** to preview and publish at scale, and to generate URL lists.

Also handles the media bulk-load coordination (masters-only ingest, `<img>` rewrite to DA/Assets refs, `alt` + `data-caption` carried) and seeds the redirects sheet (legacy + cross-locale redirects; audit known dead / redirect-loop URLs).

## Requirements / Spec
- URL discovery from sitemaps and/or WP REST, deduplicated, template-classified.
- Template routing driven by content/DOM detection (no per-URL hardcoding), delegating to the SKODA-801/802 and pilot parsers.
- Batched DA source-API push into a drafts folder first (destructive-safe), with retry/error logging per doc.
- Bulk Operations / Traverse integration for mass preview → publish and URL-list generation.
- Redirects sheet seeded (Source/Destination) with legacy + cross-locale entries; flag dead/loop URLs.
- Idempotent re-runs (re-importing a URL overwrites cleanly, does not duplicate).

## Acceptance Criteria
- [ ] A full EN URL list is discovered and template-classified automatically.
- [ ] Batch import pushes generated docs to DA drafts with per-doc success/error reporting; failures do not halt the batch.
- [ ] Bulk Operations previews and publishes a batch, and can regenerate a URL list of published docs.
- [ ] Redirects sheet is populated; known dead/redirect-loop URLs are flagged for review.
- [ ] Re-running the import for the same URLs is idempotent (no duplicates).

## Dependencies
- Upstream: SKODA-602 (DA source-API push + bulk-op preview/publish), SKODA-801 (story parser) / Downstream: SKODA-1002 (Translation projects consume the published EN set)

## Risks / Flags
- Scale/throughput and DA source-API rate limits at ~3,500 docs — batch sizing and retry needed.
- Per-language totals are inferred, not enumerated for all 6 (adversarial C8/downgrade) — EN scope here is confirmed; locale scale is Phase D.
- No-CORS legacy CDN limits reference-in-place for cross-origin canvas use — a reason to ingest media into the pipeline for production.

## M2 readiness review (2026-10-15)
- **Don't enumerate from the sitemaps.** `post-sitemap[1-4]` is capped at 4 × 1,000 URLs (newest `lastmod` 2025-08-12) and misses **193** EN stories. `press_release-sitemap[1-6]` misses **72** releases (newest `lastmod` 2026-01-15). The press-kit sitemaps miss ≥ 95 pages. Use REST for posts / press releases / pages / Škodapedia, and the `/en/press-kits/` listing for press kits.
- **EN volume to plan for:** 1,303 stories, 1,580 press releases, ≥ 790 press-kit pages, 333 pages, 190 Škodapedia, 378 taxonomy archives. 313 are live today.
- The corpus runs are split out: SKODA-801b (stories) and SKODA-847 (press kits).
- Census: [coverage matrix](../../planning/SKODA-PAGE-COVERAGE-MATRIX.md) §1–2.
