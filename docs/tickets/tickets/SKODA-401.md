# SKODA-401 — Query-index schema + selectors + metadata-normalization (15 facets)
- **Epic:** E04 — Listings & Search
- **Type:** setup
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (15 Oct demo)
- **Estimate:** ~~5 SP~~ → **8 SP** (re-scoped 2026-09-10 — adds a metadata-normalization layer) · AI-assisted 3–5d / manual 5–8d *(planning estimate, not a quote)*

> **Build-confirmed re-scope (2026-09-10).** Two corrections from the shipped EN slice: **(1) config surface** — the selector config is **submitted to the admin config service** (`PUT admin.hlx.page/config/{org}/sites/{site}/content/query.yaml`), **not** a repo `helix-query.yaml` (retired); keep a repo copy for the record only (we did: `tools/importer/query-index-config.yaml`). **(2) fields aren't clean selectors** — the most-needed fields were **not reliably in usable meta tags**: `category` had to be **derived from the source URL path segment**, and press-release **publish dates** needed a **4-way fallback** (`article:published_time` → `data-publish-date` attr → JSON-LD `datePublished` → visible `.entry-published` span). So this ticket is **as much a per-field extraction/normalization layer in the importer as it is index config**. Also confirmed: the indexer **only sees published pages** — an ordered upload→preview→publish→reindex step precedes any index read.

## Summary
Define the per-locale query-index: CSS-selector config (submitted to the admin config service) over published HTML that emits `/{locale}/query-index.json` with the full column schema, **plus the importer-side metadata-normalization needed to populate fields the source markup doesn't expose cleanly** (category, date, the 15 taxonomy facets).

## Description
DA does **not** support spreadsheet-based indexing, so listings and search are backed by **CSS-selector indexing applied to published HTML** (`/developer/indexing`), output per-locale at `/{locale}/query-index.json`. **The config is a `query.yaml` PUT to the admin config service, not a repo `helix-query.yaml`** (build-confirmed). This ticket builds on the SKODA-104 skeleton to define the selectors + column schema **and** the importer normalization that derives fields the source doesn't emit as clean meta (category-from-URL, multi-source date fallback, per-facet extraction). This index is on the critical path — re-characterized as **field-mapping + publish ordering** (risk R-A0), not "can we index."

## Requirements / Spec
- Per-locale index definitions (the indexing-reference default-and-override pattern maps to `/en`, `/de`, …) → served at `/{locale}/query-index.json`.
- **Column schema:** `path, title, description, image, template, date` + the **15 taxonomy facets** + `tags`, where template ∈ (post | press_release | press_kit | …).
- **The 15 facets:** `model, bodywork, derivative, motorsport, equipment, technology, years, view, company, concept, environment, happening, history, sponsorship, vip`.
- **Multi-value facets stored comma-joined** so the client can filter with `includes()`.
- Selectors extract from published HTML where fields are cleanly present; **where they are not, a normalization layer in the importer derives them** — build-confirmed cases: `category` from the URL path segment; publish `date` via 4-way fallback (`article:published_time` → `data-publish-date` → JSON-LD `datePublished` → `.entry-published`). Per-facet extraction likewise treated as normalization, not assumed-selectable.
- **Config delivery:** submit `query.yaml` to `PUT admin.hlx.page/config/{org}/sites/{site}/content/query.yaml` (Content-Type `text/yaml`; 201 create / 404 unset / 400 wrong resource); keep an in-repo source-of-truth copy.
- **Publish ordering:** index reads assume live-published pages — pipeline runs upload → preview → **publish (live)** → reindex before any listing renders.
- Index is a cacheable single JSON GET per locale (chunked if large).

## Acceptance Criteria
- [ ] A per-locale index config (`query.yaml`) is **submitted to the admin config service** and emits `/{locale}/query-index.json`; a source-of-truth copy is kept in-repo.
- [ ] Emitted rows contain all base columns: `path, title, description, image, template, date, tags`.
- [ ] `category` and `date` are **populated for every row**, using the importer normalization fallbacks where source meta is absent (category-from-URL; 4-way date fallback) — verified on both a post and a press release.
- [ ] All 15 taxonomy facet columns are present and populated (selector where available, normalization where not).
- [ ] Multi-value facet cells are comma-joined (client-`includes()` friendly).
- [ ] `template` values distinguish post / press_release / press_kit (and others encountered).
- [ ] Index validated against representative pilot pages **after live publish + reindex** (a press-release article + a listing page); confirm previewed-only pages are correctly absent until published.

## Dependencies
- Upstream: SKODA-104 (helix-query.yaml skeleton / per-locale index defs) / Downstream: SKODA-402 (faceted listing), SKODA-403 (search), SKODA-901 (hosted body-search, Phase C), SKODA-1001 (per-locale index rollout, Phase D)

## Risks / Flags
- 🟠 R-A0 (re-characterized 2026-09-10): the critical-path risk is **field-mapping + publish ordering**, not "index design." The static-index model itself is build-confirmed; the cost is per-field normalization + the publish→reindex sequence.
- Facet count is **15** (corrected from an earlier "14" in prior docs).
- Selectors depend on stable published-HTML structure; **and several key fields aren't in the HTML as clean meta at all** — treat category/date/facets as a normalization layer, prefer semantic/class-based extraction, and keep the "derive from URL / fallback chain" pattern for missing fields.
- Config is an **admin config-service `query.yaml` PUT**, not a repo `helix-query.yaml` (retired) — update any runbook that still references the repo file.
- Scope note: consider building only the **demo-critical facet subset first** (open decision D12) since each facet carries real normalization cost.
