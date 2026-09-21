# SKODA-606 — Strip stray consent/UI text nodes from imported content
- **Epic:** E06 — Import Pilot Content
- **Type:** import / transformer
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (demo)
- **Estimate:** 1 SP · AI-assisted 0.5d / manual 0.5–1d *(planning estimate, not a quote)*

## Summary
A stray paragraph reading **"Manage Cookies"** renders at the foot of the Latest News section on the imported homepage — a consent-widget control that landed as plain body text during import. Strip such leftover consent/UI text nodes in the cleanup transformer. Surfaced by QA finding **F2** (2026-09-14 homepage QA pass).

## Description
Confirmed in `content/en/index.plain.html` (1 occurrence). On the source it's a cookie-consent control, not article copy; the importer captured its text. Consent is OUT of Adobe delivery scope (D10), so the control is not reproduced — but its stray text must not appear as content. **Content-layer fix:** transformer + re-import, not a hand-edit of `content/`.

## Requirements / Spec
- In `skoda-cleanup.js` (or the landing cleanup path), drop known consent/UI control text nodes ("Manage Cookies" and any sibling consent-widget leftovers) during import.
- Prefer removing by the source's consent-widget container/selector rather than a brittle text match, if the class survives into the scrape.
- Re-import; validate the stray text is gone and no real content was removed.

## Acceptance Criteria
- [ ] "Manage Cookies" (and any similar stray consent text) no longer renders in imported pages.
- [ ] No legitimate content removed (diff the section before/after).
- [ ] Transformer rule is generic enough to catch the same leftover on other imported pages.

## Dependencies
- Upstream: SKODA-601 (transformer), SKODA-602 (re-import)
- Blocked-by (end-to-end verify): DA publish/reindex cycle.

## Risks / Flags
- 🟢 Low-risk; import-layer only.
- Verification needs a re-import (codeable now; publish-gated to confirm on the live/published page).

## Status (2026-09-14, agent-team cycle 1)
- **IMPLEMENTED** in `tools/importer/transformers/skoda-cleanup.js` (`after` hook): removes consent-widget hooks (`.ot-sdk-show-settings`, `#ot-sdk-btn`, `.optanon-toggle-display`) and drops a leaf text node whose text is exactly "Manage Cookies". `node --check` passes.
- **QA-BLOCKED — not DONE.** Same reason as SKODA-605: the validation fixture is the drifted Peaq snapshot, which lacks the stray node, so behavior on the real homepage is unverified. Needs a clean `/en/` re-import + publish to close.
