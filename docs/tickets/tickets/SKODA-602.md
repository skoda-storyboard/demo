# SKODA-602 — DA source-API push + bulk-op preview/publish
- **Epic:** E06 — Import Pilot Content
- **Type:** integration
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (15 Oct demo)
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 2–3d *(planning estimate, not a quote)*

## Summary
Push generated DA documents to the DA source API and use EW Bulk Operations to preview/publish them en masse (drafts-first), including generating URL lists.

## Description
With clean DA HTML produced by the parsers/transformers (SKODA-601), each doc is pushed to the DA source with `POST https://admin.da.live/source/{org}/{repo}/{path}.html`. Credentials are injected by the harness — **never a token in chat or repo**. Content lands in a drafts location first for validation (EW native Import is flagged destructive), then EW Bulk Operations previews/publishes en masse and generates URL lists / Traverse output for downstream validation.

## Requirements / Spec
- `POST` each generated doc to `https://admin.da.live/source/{org}/{repo}/{path}.html`; credentials injected by harness (no secrets in code/chat).
- Push to a drafts folder/location first; validate before publish.
- Use **EW Bulk Operations** to preview then publish, and to generate/collect URL lists.
- Idempotent/re-runnable push (safe to re-import after parser fixes).
- No Git operations (per project rules).

## Acceptance Criteria
- [ ] Generated docs are pushed to DA via the source API with harness-injected credentials (no token exposed).
- [ ] Docs land in drafts first, then preview/publish via EW Bulk Operations.
- [ ] Bulk Operations produces a URL list usable by SKODA-603 validation.
- [ ] Re-running the push after a parser change updates docs without manual cleanup.
- [ ] `npm run lint` clean.

## Dependencies
- Upstream: SKODA-601 (parsers/transformers). / Downstream: SKODA-603 (pilot import + validation); SKODA-803 (Phase B bulk automation builds on this).

## Risks / Flags
- EW native Import is destructive — always validate in drafts before publish.
- DA source-API contract is project-established (not doc-cited in the aem.live index); treat specifics as project convention. (`SKODA-EDS-DA-ARCHITECTURE.md` §13 doc-gap note)
