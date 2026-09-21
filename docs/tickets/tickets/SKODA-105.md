# SKODA-105 — Sidekick v7 setup + preview/publish workflow
- **Epic:** E01 — Foundation & Setup
- **Type:** setup
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (15 Oct demo)
- **Estimate:** 1 SP · AI-assisted 0.5d / manual 1d *(planning estimate, not a quote)*

## Summary
Configure Sidekick v7 and the per-doc preview → publish workflow (with bulk publish via Bulk Operations).

## Description
Gives authors and the migration pipeline the preview/publish tooling, per `SKODA-EDS-DA-ARCHITECTURE.md` §2 (Sidekick v7) and §10 (Bulk Operations / Traverse for en-masse publish + URL-list generation). Preview mirrors `localhost`/`*.aem.page`; publish promotes to `*.aem.live`. Underpins SKODA-602's bulk preview/publish and SKODA-603's pilot validation.

## Requirements / Spec
- Add Sidekick v7 config (`/docs/sidekick`, `/developer/sidekick-v7-migration`) to the project.
- Confirm preview → publish per doc works from DA/EW (`/docs/ew/authoring/publishing`, `/docs/publishing-from-authoring`).
- Confirm **Bulk Operations** (`/docs/ew/authoring/bulk-operations`) for en-masse preview/publish and URL-list/Traverse generation.
- Include the Sidekick library entry for reusing block/section snippets.

## Acceptance Criteria
- [ ] Sidekick v7 loads on the project and shows preview/publish/library.
- [ ] A doc can be previewed (`*.aem.page`) then published (`*.aem.live`) via Sidekick.
- [ ] Bulk Operations can preview/publish a small set and emit a URL list.

## Dependencies
- Upstream: SKODA-101
- Downstream: SKODA-602 (bulk preview/publish), SKODA-603 (pilot validation)

## Risks / Flags
- Publishing/Git-adjacent actions are managed via the Console/Sidekick UI, never agent `git` commands.
- Bulk publish is powerful — validate into a drafts scope first (EW import is flagged destructive; see SKODA-601/602).
