# SKODA-509, `skoda-images.js` doesn't use the transformer hook signature
- **Epic:** E05, Media Pipeline
- **Type:** import tooling
- **Phase:** A · **Milestone:** M2 (no content impact; friction on every edit)
- **GitHub issue:** [#182](https://github.com/skoda-storyboard/demo/issues/182)
- **Estimate:** 0.5 SP · AI-assisted 0.25d / manual 0.25–0.5d *(planning estimate, not a quote)*
- **Status (2026-10-23):** 🟡 In review (branch `skoda-509-images-hook`). Was 🔵 TODO (2026-09-25).

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
- [x] The validator hook passes on an edit to the file ("Success. Transformer ran without errors", model-page / Elroq).
- [x] Importer output is byte-identical before and after: **32 / 32 pages** (the SKODA-508 page types, widened to
      all 11 importers), and the `[image-import]` alt warnings are identical per importer.

## Built (2026-10-23)
Scope measured first: **11 importers / 12 calls**, not 7 (home-sto, images-listing, model-page, newsletter-card,
press-kit-default ×2 incl. the Images-chapter fragment path, press-kit-hub, press-release, series-directory,
series-hub, story-detail, videos-listing). Only `skoda-images.test.mjs` imports the module now.
- **`transformers/skoda-images.js`:** `export default function transform(hookName, element, payload)`. It acts on
  `afterTransform` only, with `payload.document`, falling back to `element.ownerDocument`. `normalizeImages` and
  `linkedImageAlt` became module-private; the bodies are unchanged.
  - **The default export is the file's only export.** The validator loads a transformer as a classic `<script>`,
    rewriting only `export default`. Any other `export` (or an `import`) is then a syntax error and it reports
    "Transformer did not export a function". So the helpers can't stay named exports, and moving them to a
    shared module would need an `import`, which breaks the same way.
- **Importers:** each call becomes `normalizeImages('afterTransform', main, payload)` **at the same position**:
  after the shared transformers and `rules.transformBackgroundImages`, before `rules.adjustImageUrls`. It is not
  added to the `transformers` list, which would run it earlier. The import name is kept, so each importer changes
  by one line (press-kit-default by two). `payload.document` is the same `document` at every site.
- **Tests:** the existing 13 run through the hook. New:
  - other hooks leave the page untouched;
  - `payload.document` is used, with the `ownerDocument` fallback, and a second run is a no-op;
  - the file's only export is the hook, and it has no imports.
- **Bundles:** the 11 rebuilt from `tools/importer` (the committed bundles' module comments are relative to it).
  Against a fresh build of `main`, each bundle changes by 6 lines: the hook function and the call. In press-kit-default
  esbuild also renames the next transformers (`transform3` → `transform4`, …); the call order is unchanged.
  - Three committed bundles on `main` had drifted from their sources: path comments and a rename in press-release and
    videos-listing, and 2 stray lines in images-listing. Rebuilding drops that drift.

## Verified (2026-10-23)
- **Before / after:** `run-bulk-import.js` over one URL list per importer, run twice from the live source: with
  bundles built from `main` and with the branch's (`.migration/skoda-509/`, untracked).
  - 10 press releases (the 5 SKODA-508 caption releases + 5), `/en`, 5 stories (2 Epiq, olive oil, Peaq, summer
    accessories), 2 series hubs, the series directory, 2 model pages (Elroq, Enyaq), Images / Videos, 2 newsletter cards
    (en / cs), 4 press-kit pages (2 chapters, an Images chapter, its `?fragment=exterior` document) and 3 press-kit hubs.
  - **32 / 32 `.plain.html` byte-identical; alt warnings identical** (1 / 0 / 16 / 2 / 3 / 3 / 10 / 26 / 26 / 21 / 0).
  - The Epiq press-kit hub fails on `main` too ("Press-kit tile row 1 has an unsupported layout", the importer's own
    guard), so 125 years of motorsport and Elroq stand in for it. Unrelated to this ticket.
- `npm run lint` clean; `npm test` (see the PR).

## Dependencies
SKODA-508. Collides with any open ticket that edits the importers (serialize). **2026-10-23:** #457 rebuilds 9 of the
11 bundles; #414 and #373 edit `import-story-detail.js`. Decision: proceed with the minimal diff (one line per
importer); a bundle conflict is resolved by rebuilding, by whichever PR merges second.
