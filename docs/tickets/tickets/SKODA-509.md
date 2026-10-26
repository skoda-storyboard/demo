# SKODA-509, `skoda-images.js` doesn't use the transformer hook signature
- **Epic:** E05, Media Pipeline
- **Type:** import tooling
- **Phase:** A · **Milestone:** M2 (hook refactor; friction on every edit)
- **GitHub issue:** [#182](https://github.com/skoda-storyboard/demo/issues/182)
- **Estimate:** 0.5 SP · AI-assisted 0.25d / manual 0.25–0.5d *(planning estimate, not a quote)*
- **Status (2026-10-26):** 🟡 In review (branch `skoda-509-images-hook`, PR #484). Review fixes passed focused QA;
  full acceptance gates remain open.

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
- Export `transform(hookName, element, payload)` (act on `afterTransform`, `payload.document`). Update the 11
  importer call sites and the tests (`skoda-images.test.mjs`, `parsers/story-flatten.test.mjs`).
- Or move the helper out of `transformers/` into an `.mjs` module, if the bundler accepts it.
- Rebuild the 11 bundles (12 call sites; the original estimate counted 7 importers).

## Acceptance Criteria
- [x] The validator hook passes on an edit to the file ("Success. Transformer ran without errors", model-page / Elroq).
- [ ] Importer output is byte-identical before and after against the **committed base bundles**, and the
      `[image-import]` alt warnings are identical per importer. **Original sign-off withdrawn:** the 32-page
      comparison used bundles freshly built from `main`'s sources, not its committed bundles. The original PR
      restored the press-release Tags block by fixing a stale bundle's `text5` ReferenceError. That content
      difference is now independently fixed on `main` by #414 (`fbf72fc`), already merged into this branch.
      The full committed-bundle comparison must be revalidated against the current baseline before QA acceptance.

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
- **Importers:** each call becomes `imagesTransformer('afterTransform', main, payload)` **at the same position**:
  after the shared transformers and `rules.transformBackgroundImages`, before `rules.adjustImageUrls`. It is not
  added to the `transformers` list, which would run it earlier. The binding was renamed from `normalizeImages`
  during review to distinguish the hook from its private helper. `payload.document` is the same `document`
  at every site.
- **Tests:** the existing 13 run through the hook. New:
  - other string hook names leave the page untouched;
  - `payload.document` is used, with the `ownerDocument` fallback, and a second run is a no-op;
  - the file's only export is the hook, and it has no imports.
- **Bundles:** the 11 rebuilt from `tools/importer` (the committed bundles' module comments are relative to it).
  Against a fresh build of `main`, each bundle changes by 6 lines: the hook function and the call. In press-kit-default
  esbuild also renames the next transformers (`transform3` → `transform4`, …); the call order is unchanged.
  - Three original committed bundles on `main` had drifted from their sources: path comments in press-release and
    videos-listing, 2 stray lines in images-listing, and a **functional Tags-parser bug in press-release**: it
    declared `text4` but read `text5`. Rebuilding fixed the ReferenceError and restored the Tags block; this was
    not merely a rename or a content-neutral rebuild.

## Verified (2026-10-23)
- **Before / after:** `run-bulk-import.js` over one URL list per importer, run twice from the live source: with
  bundles built from `main` and with the branch's (`.migration/skoda-509/`, untracked).
  - 10 press releases (the 5 SKODA-508 caption releases + 5), `/en`, 5 stories (2 Epiq, olive oil, Peaq, summer
    accessories), 2 series hubs, the series directory, 2 model pages (Elroq, Enyaq), Images / Videos, 2 newsletter cards
    (en / cs), 4 press-kit pages (2 chapters, an Images chapter, its `?fragment=exterior` document) and 3 press-kit hubs.
  - **32 / 32 `.plain.html` byte-identical against fresh builds of `main`'s sources**; alt warnings identical
    (1 / 0 / 16 / 2 / 3 / 3 / 10 / 26 / 26 / 21 / 0). This does **not** establish parity with the original
    committed bundles; see the corrected acceptance criterion above.
  - The Epiq press-kit hub fails on `main` too ("Press-kit tile row 1 has an unsupported layout", the importer's own
    guard), so 125 years of motorsport and Elroq stand in for it. Unrelated to this ticket.
- `npm run lint` clean; `npm test` (see the PR).

## Review fixes (2026-10-26)
- **Legacy calls fail explicitly:** a non-string `hookName`, including `normalizeImages(main, document)`, throws a
  `TypeError` with the expected `imagesTransformer('afterTransform', main, payload)` call. The check precedes
  hook filtering and DOM mutation. Regression tests cover the old call, other non-string values, and successful
  alt backfill/image wrapping with the correct hook; valid non-`afterTransform` hooks remain no-ops.
- **Naming:** all 11 importer bindings / 12 calls now use `imagesTransformer`; the call order is unchanged.
- **Artifacts:** rebuilt the 11 bundles, retaining each bundle's existing module-comment path convention
  (repo root for story-detail after the upstream merge, `tools/importer` for the other 10).
- **Tags regression coverage:** the committed press-release bundle must match source output on all five M1
  release fixtures, including the Zellmer release, and each must contain a Tags block.
- **Baseline reproduced:** all five M1 release fixtures lose Tags with the original committed base bundle
  (`aafc630^`) and log `text5 is not defined`. With current committed `main` (`7b3701a`) and the review-fix bundle,
  all five have Tags; their full transformed DOM output and warnings are identical. This fixture/stub comparison
  is not a new 32-page bulk-import or `.plain.html` parity claim.
- **Content approval / merge order:** no agent approval of the original Tags output change is implied.
  #414 merged first on 2026-10-26 with the separate Tags fix (`fbf72fc`); #373 and #457 also merged before this
  PR. Merge `89c893b` already includes those changes. This PR adds no Tags-parser change against current `main`.
  No content is regenerated, uploaded or published by these review fixes.
- External transformer-validator execution and full regenerated-content visual QA are not rerun by these
  review fixes; QA acceptance remains open.

## Review-fix validation (2026-10-26)
- Independent focused QA: **279 tests, 276 passed, 3 skipped, 0 failed** across image normalization, story flatten,
  listing/model parsers, story validity, press releases, press kits, homepage, series and story transformers.
  The exact `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test ...` command is recorded in PR #484.
  Skips cover an optional model corpus and two opt-in live checks.
- `npm run lint`: passed. `git diff --check`: passed.
- All **11 / 11 bundles** byte-match esbuild output; all 11 bindings / 12 calls are at their prior positions
  with no obsolete caller. Five-release source/bundle Tags parity passes.
- JavaScript guardrail self-check: explicit hook input contract and failure before mutation; private image
  normalization and document fallback unchanged; no new dependencies, imports, exports, lifecycle or UI changes.
  This is bounded review-fix QA, not full ticket acceptance.

## Dependencies
SKODA-508. Collides with any open ticket that edits the importers (serialize). The original overlaps with
#457, #414 and #373 are now merged into this branch. Resolve any future source conflict using the hook signature,
then rebuild the affected bundle; a leftover old-style call must fail rather than silently skip normalization.
