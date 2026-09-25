# SKODA-815, Story flatten: `ys-milestones` timeline widget (content-loss fix)
- **Epic:** E08, Editorial at Scale
- **Type:** block / import
- **Phase:** B · **Milestone:** M2 (go-live) — *content-loss, prioritise within M2*
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 3–5d *(planning estimate, not a quote)*
- **Status (2026-09-24):** 🟢 **Option 1 (flatten-to-content) SHIPPED** in SKODA-801
  (`milestonesNodes`) — `ys-milestones` no longer dropped; each entry → `<h3>` "YEAR — Title"
  + its image. Verified on the steering-wheel story: **0 → 11 dated entries, +11 images**.
  Remaining (optional, M2): the dedicated **timeline block (Option 2)** if the client wants the
  source timeline visual — otherwise this ticket can close.

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
- [x] `ys-milestones` no longer dropped; the 11-entry steering-wheel story recovers its years + images
      (**verified: 0 → 11 dated entries, +11 images**; 11 unique milestone `<h3>`, scaffolding stripped).
      *(Overall page completeness rose 62.4% → 67.0% — the residual gap is the separately-deferred
      colorbox galleries, not milestones; the timeline content is now fully captured.)*
- [x] Content-driven detection only (no URL/positional assumptions).
- [x] Unit test in `story-flatten.test.mjs`: a synthetic milestones widget → N dated entries + N images.
- [x] `npm run lint` + `npm test` green (152 tests); re-imported the milestones story and diffed vs source.
- [ ] **(Optional, M2, only if timeline visual wanted)** `blocks/timeline` + `docs/ui-specs/timeline.md` + pixel-perfect ACs.

## Dependencies
- Upstream: SKODA-801 (the flatten parser this extends). Related review: D2 (figure/infobox,
  fixed in SKODA-801) and the E-caveat below.

## Related from the same review (tracked here, not all in scope)
- **D2 (FIXED in SKODA-801, 2026-09-24):** `skoda-captioned-image` now lifts the native
  `<figure>`/`<figcaption>`; `skoda-image-box` remapped from the image path to an infobox/callout
  emitter (text + optional image preserved). Verified: the infobox story recovered 88.2% → 95.3%.
- **D4 (FIXED 2026-09-24):** over-encoded hrefs (`%2525…`) normalised to single valid encoding in
  the shared `skoda-page-cleanup.js` (fixes all templates; 5 unit tests). No empty-text anchors
  existed in any story body, so no anchor-unwrap was added.
- **Large-tree AC still unproven on real content:** the census's 208-widget outlier URL
  (`…/electricity-cng-or-perhaps-hydrogen-judge-for-yourselves/`) now **404s on the live site**.
  Re-pick a live large-tree story from the dataset to satisfy the "robust to 200+ widgets" AC
  (only the synthetic 293-grid unit test covers it today).

## Risks / Flags
- `ys-milestones` DOM shape `[RUNTIME-UNCONFIRMED]` beyond the one inspected story — confirm
  selectors on 2–3 of the 9 stories before finalising.
