# SKODA-601 — Import infra: per-template parsers + transformers
- **Epic:** E06 — Import Pilot Content
- **Type:** import
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (15 Oct demo)
- **Estimate:** 5 SP · AI-assisted 2–3d / manual 4–6d *(planning estimate, not a quote)*

## Summary
Build the import infrastructure — per-template parsers and transformers (this repo's `tools/importer/` pattern) — that converts source-site HTML into clean DA HTML for the pilot templates, using content-driven detection only.

## Description
The scripted DA-source-API import path relies on per-template parsers/transformers that map source DOM to DA sections + blocks + metadata. This ticket covers the pilot templates: the press-release article, the PR listing, and a couple of representative pages. Detection must be purely content-driven — derived from the DOM elements encountered (block selectors, section CSS classes), never from URL matching, template type, section order/count, or positional assumptions. The **story / SiteOrigin Page-Builder flattening parser is explicitly out of scope** — it is the hardest parser work and is deferred to Phase B (SKODA-801).

## Requirements / Spec
- Per-template parsers/transformers under `tools/importer/` following the repo's established pattern (bundled importer, content-driven `BLOCK_REGISTRY`-style detection + section transformer).
- Press-release parser: sections + hero/lead, body default content, `Gallery`, `Downloads` (SKODA-502), `Tags`, `Metadata` (date, category, model taxonomy, hreflang).
- PR-listing parser: emits a doc with the faceted-listing block over the query-index.
- Representative-page parser(s): default content + core blocks.
- Section styles/blocks detected from source CSS classes/DOM structure only; no URL/order/positional logic.
- Carry media correctly: `<img>`-out-of-`<p>`, `alt` + `data-caption` (per SKODA-501); PDFs/MP4 as link/DAM (SKODA-503).
- Explicitly **exclude** story/SiteOrigin flattening (Phase B, SKODA-801).

## Acceptance Criteria
- [ ] Parsers/transformers exist for press-release, PR-listing, and representative page templates.
- [ ] Detection is content-driven only — a page with a novel arrangement of known sections/blocks imports without parser changes.
- [ ] Generated DA HTML is clean: correct sections (`---`), block tables, and trailing Metadata table.
- [ ] Media handling integrated (img-out-of-`<p>`, alt+data-caption, PDF/MP4 as links).
- [ ] Story/SiteOrigin flattening is not attempted (deferred to SKODA-801).
- [ ] `npm run lint` clean.

## Dependencies
- Upstream: SKODA-102 (boilerplate scaffold). / Downstream: SKODA-602 (DA push + bulk publish), SKODA-603 (pilot import + validation), SKODA-801 (Phase B story parser builds on this).

## Risks / Flags
- Story Page-Builder flattening is novel, high-risk parser work — deliberately deferred to Phase B; do not pull into pilot scope. (R-A2)
- Content-driven detection discipline is essential — positional/URL assumptions will break on unseen page arrangements.
