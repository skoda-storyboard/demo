# SKODA-206a, Škodapedia term modal + standalone term page at the public path

- **Epic:** E02, Core Blocks
- **Type:** block
- **Phase:** A · **Milestone:** M2 (go-live, 2027-01-02)
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 2.5–3.5d, half of the 206 amendment's 6 SP *(planning estimate,
  not a quote)*
- **GitHub issue:** [#472](https://github.com/skoda-storyboard/demo/issues/472) (created 2026-10-22, sub-issue of #20)
- **Parent:** SKODA-206
- **Status (2026-10-22):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) §7.2 row "802 / 206": G-C-03 (Medium,
  CONFIRMED, browser-checked).

## Why
- **Term URLs are indexed today** (G-C-03). Every `/{loc}/skodapedia/{slug}/` term URL returns 200. The source opens
  the term panel through `wp-json/skodapedia/v1/term/{id}`, also on a direct load, and keeps the archive's title and
  canonical.
- **Terms move to their public path** (G-C-03, SKODA-802a). Terms are generated at `/{loc}/skodapedia/{slug}`, not
  `/modals/skodapedia/{slug}`, so the modal and the direct load both read that doc.
- **The source panel is not accessible** (SKODA-206 UI spec): the close is a non-focusable `<span>`, with no
  `role=dialog`, `aria-modal` or focus trap.

## Scope
- **Term modal.** The modal fetches the term's `.plain.html` at `/{loc}/skodapedia/{slug}`; that replaces the
  `wp-json/skodapedia/v1/term/{id}` call. Dialog role, focus trap, Escape, return focus to the trigger.
- **URL update.** Opening a term sets the URL to the slash-less term path, as the source's `replaceState` does.
- **Standalone term page.** A direct load serves the term doc on its own with a self-canonical (the source keeps the
  archive's title and canonical).

## Not in scope
- The directory and filters from the index sheet, the `?f=` state, the `LIVE_ONLY` change, the counts and the D8
  scope fix: SKODA-206.
- Generating the term docs, the index sheet and the category archives: SKODA-802a.
- The in-body glossary spans (G-C-01): SKODA-849a.

## Acceptance criteria
- [ ] A term opens from `/{loc}/skodapedia/{slug}.plain.html` with no `wp-json` call, and the URL shows the slash-less
      term path; a direct load of that URL renders the term with a self-canonical (G-C-03).
- [ ] The term modal has `role=dialog`, traps focus, closes on Escape and returns focus to the trigger (SKODA-206
      acceptance criteria; modal focus behaviour verified in a browser under SKODA-703).

## Dependencies
SKODA-206 (directory, term links); SKODA-802a (term docs at public paths) upstream; SKODA-849a (in-body links to the
term pages) downstream; SKODA-703 (a11y audit, glossary modal). Parent: SKODA-206.
