# SKODA-815, Story flatten: `ys-milestones` timeline widget (content-loss fix)
- **Epic:** E08, Editorial at Scale
- **Type:** block / import
- **Phase:** B · **Milestone:** M2 (go-live) — *content-loss, prioritise within M2*
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 3–5d *(planning estimate, not a quote)*

## Origin
Surfaced by the SKODA-801 flatten coverage review (`docs/reviews/SKODA-801-FLATTEN-COVERAGE-REVIEW.md`,
2026-09-24, defect **D1**). The review imported a stratified random sample of 16 EN stories and
found that `ys-milestones` is **silently dropped** — genuine editorial content lost, not chrome.

## Problem
`ys-milestones` is in the flatten parser's `DROPPED` set (`tools/importer/parsers/story-flatten.js`),
mapped as "timeline → omit for demo". On a real story
(`/en/skoda-world/steering-wheel-decades-of-changes/`) the widget carries **11 dated milestone
entries + 11 images** (1905 Laurin & Klement VOITURETTE, 1925, 1932, 1940, 1952, …). The flattened
output contains **0 of those years and 0 of those 11 images** — the story scored 62.4% content
completeness. The widget appears in **~9 EN stories** (census `SKODA-STORY-WIDGET-DATASET.csv`,
`rare` = `ys-milestones`).

## Scope
Stop dropping `ys-milestones`; preserve its content. Two acceptable outputs (pick per authoring +
design review):
1. **Flatten-to-content (minimum, M2-cheap):** each milestone → an image + a dated heading/label +
   its description text, emitted as default content in source order. No new runtime block. Zero
   content loss; visually plainer than the source timeline.
2. **Timeline block (fuller):** a new `blocks/timeline` that renders the dated entries as the
   source vertical timeline (spec would need a `docs/ui-specs/timeline.md` capture). More work;
   only justified if the client wants the timeline visual for M2.

Recommend **(1) for correctness now**, upgrade to (2) if the timeline visual is required.

## Requirements / Spec
- Remove `ys-milestones` from the flatten `DROPPED` set; add a `milestones` emitter.
- Content-driven: read each milestone entry's image + date/label + text from the widget DOM
  (verify selectors against a live story; the review used steering-wheel-decades-of-changes).
- Preserve order; carry `alt` + any `data-caption`; lift `<img>` to a direct child (EDS `<picture>`).
- Works in both single-column and multi-column (`emitMultiColumn`) contexts.
- If the widget is empty/odd, skip + log (never crash) — keep the safety net.

## Acceptance Criteria
- [ ] `ys-milestones` no longer dropped; the 11-entry steering-wheel story recovers its years + images
      (0 → 11 dated entries, 0 → 11 images) and clears the ~90% completeness gate.
- [ ] Content-driven detection only (no URL/positional assumptions).
- [ ] Unit test in `story-flatten.test.mjs`: a synthetic milestones widget → N dated entries + N images.
- [ ] `npm run lint` + `npm test` green; re-import a milestones story and diff vs source.
- [ ] (If block route) `blocks/timeline` + `docs/ui-specs/timeline.md` + pixel-perfect ACs.

## Dependencies
- Upstream: SKODA-801 (the flatten parser this extends). Related review: D2 (figure/infobox,
  fixed in SKODA-801) and the E-caveat below.

## Related from the same review (tracked here, not all in scope)
- **D2 (FIXED in SKODA-801, 2026-09-24):** `skoda-captioned-image` now lifts the native
  `<figure>`/`<figcaption>`; `skoda-image-box` remapped from the image path to an infobox/callout
  emitter (text + optional image preserved). Verified: the infobox story recovered 88.2% → 95.3%.
- **D4 (low, editor hygiene):** inline `<a>` in `sow-editor` content pass through with empty text
  + over-encoded hrefs (`%2525…`). Optional cleanup in `editorNodes` (a11y + link-rot). Not a block.
- **Large-tree AC still unproven on real content:** the census's 208-widget outlier URL
  (`…/electricity-cng-or-perhaps-hydrogen-judge-for-yourselves/`) now **404s on the live site**.
  Re-pick a live large-tree story from the dataset to satisfy the "robust to 200+ widgets" AC
  (only the synthetic 293-grid unit test covers it today).

## Risks / Flags
- `ys-milestones` DOM shape `[RUNTIME-UNCONFIRMED]` beyond the one inspected story — confirm
  selectors on 2–3 of the 9 stories before finalising.
