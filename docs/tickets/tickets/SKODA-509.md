# SKODA-509, `skoda-images.js` doesn't use the transformer hook signature
- **Epic:** E05, Media Pipeline
- **Type:** import tooling
- **Phase:** A · **Milestone:** M2 (no content impact; friction on every edit)
- **Estimate:** 0.5 SP · AI-assisted 0.25d / manual 0.25–0.5d *(planning estimate, not a quote)*
- **Status (2026-09-25):** 🔵 TODO

## Origin
Found in SKODA-508 on 2026-09-25.

## Problem (measured)
- Every other file in `tools/importer/transformers/` exports `transform(hookName, element, payload)`.
  `skoda-images.js` exports `normalizeImages(root, document)`, which the 7 importers call directly after parsing
  (e.g. `import-press-release.js:156`).
- The excat transformer-validator hook runs on every Write/Edit in `transformers/` and rejects the file: "Transformer
  must use signature: export default function transform(hookName, element, payload)". `main`'s version fails the
  same way, so the failure is not a regression.

## Scope
- Export `transform(hookName, element, payload)` (act on `afterTransform`, `payload.document`). Update the 7
  importer call sites and the tests (`skoda-images.test.mjs`, `parsers/story-flatten.test.mjs`).
- Or move the helper out of `transformers/` into an `.mjs` module, if the bundler accepts it.
- Rebuild the 7 bundles.

## Acceptance Criteria
- [ ] The validator hook passes on an edit to the file.
- [ ] Importer output is byte-identical before and after on the SKODA-508 QA set (18 pages).

## Dependencies
SKODA-508. Collides with any open ticket that edits the 7 importers (serialize).
