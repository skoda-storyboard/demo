# SKODA-602 — DA source-API push + bulk-op preview/publish
- **Epic:** E06 — Import Pilot Content
- **Type:** integration
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (15 Oct demo)
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 2–3d *(planning estimate, not a quote)*
- **Status (2026-09-25):** 🟢 **BUILT + PILOTED** — `tools/importer/push-to-da.mjs` (branch
  `skoda-602-da-push`), awaiting review/merge. The "human gate: needs DA credentials" from the M1 gap
  review is **resolved**: the environment injects the credentials for `admin.da.live` and
  `admin.hlx.page` (curl and Node `fetch` both work, no token anywhere).

## Summary
Push generated DA documents to the DA source API and use bulk operations to preview/publish them en masse (drafts-first), including generating URL lists.

## Description
With clean DA HTML produced by the parsers/transformers (SKODA-601), each doc is pushed to the DA source with `POST https://admin.da.live/source/{org}/{repo}/{path}.html`. Credentials are injected by the harness — **never a token in chat or repo**. Content lands as a draft first for validation (EW native Import is flagged destructive), then bulk operations preview/publish en masse and produce URL lists for downstream validation.

## Decisions (2026-09-25, stakeholder)
1. **"Drafts first" = final path, preview only.** Pages are pushed to their real path and previewed; the
   previewed-but-unpublished page on `.aem.page` is the draft. Publishing is a separate, explicit stage
   that only publishes pages that passed validation. (Rejected: a `/drafts/` folder + copy — doubles the
   uploads, and rails/links behave differently at the drafts path.)
2. **Bulk operations are scripted** against the admin.hlx.page bulk jobs (`POST /preview|/live/{org}/{site}/{ref}/*`
   with `{paths}` → 202 + job; poll `/job/…/details` until `state: stopped`; per-path `status`/`error` in
   `data.resources`) — the API behind EW Bulk Operations. Verified on a live job 2026-09-25.

## What was built
`npm run import:push -- --urls <file> [--dry-run] [--stage push,preview|publish|all] [--force] [--publish-fragments]`
(full reference: [`IMPORT-PIPELINE.md` §2/§3](../../architecture/IMPORT-PIPELINE.md)).
- `tools/importer/push-to-da.mjs` — CLI: read local + DA → decide → push → bulk preview → validate →
  fragment check → bulk publish → index poll → report. Throttled below the 10 req/s admin limit, batches
  of 100 paths per job.
- `tools/importer/push/push-lib.mjs` — pure helpers (path mapping, list parsing, wrapping, normalised
  content hash, the decision rules, job parsing, fragment paths, image check); 18 unit tests in
  `push-lib.test.mjs`.
- `tools/importer/push/push-manifest.json` — committed push state (path → content hash at last push).
- Reports (untracked): `tools/importer/reports/push/<stamp>.json` + `<stamp>-urls.txt`.

**Overwrite protection:** per page `new` / `unchanged` / `update` / **`conflict`** / `overwrite`. A
conflict (DA edited since our last push, or a DA doc we have no record of) is **never overwritten without
`--force`**. Comparison uses the `<main>` content only, so wrapper whitespace from older uploads doesn't
register as an edit (a real case: the Zellmer press release was uploaded with `<body>\n<header>…`).

**Shared fragments:** before publishing, `/nav`, `/footer` and any `nav`/`footer` metadata overrides
must be live. This came from the 2026-09-25 incident: `/footer` was previewed but never published, so
**every `.aem.live` page had an empty footer** while `.aem.page` looked fine (fixed by publishing
`/footer`; guard ticket SKODA-307).

## Requirements / Spec
- `POST` each generated doc to `https://admin.da.live/source/{org}/{repo}/{path}.html`; credentials injected by harness (no secrets in code/chat).
- Push as a draft first (preview only); validate before publish.
- Use **bulk operations** (scripted admin bulk jobs) to preview then publish, and to generate/collect URL lists.
- Idempotent/re-runnable push (safe to re-import after parser fixes).
- No Git operations in the tool.

## Acceptance Criteria
- [x] Generated docs are pushed to DA via the source API with harness-injected credentials (no token exposed).
      *`uploadToDA` (media-lib) + plain `fetch`; no token handling anywhere.*
- [x] Docs land as drafts first (preview only), then preview/publish via bulk operations.
      *Default stage `push,preview`; `--stage publish` re-validates, then runs a bulk publish job.*
- [x] Bulk operations produce a URL list usable by SKODA-603 validation. *`reports/push/<stamp>-urls.txt`.*
- [x] Re-running the push after a parser change updates docs without manual cleanup.
      *`update` path; unchanged pages skipped; author edits protected (`conflict`).*
- [x] `npm run lint` clean (new files). `npm test` green: 187/187, incl. 18 new.
- [x] *(added)* Published pages have their shared fragments published (fragment check + live smoke test).

## Pilot evidence (2026-09-25)
| Run | Result |
|---|---|
| Dry run, 11 Epiq-set stories | 11 `unchanged`, 0 conflicts, fragments live |
| Real push + preview, same 11 | 0 DA writes; 11 × preview 200; images on the media bus (e.g. 22/22, 35/35); adopted into the manifest; URL list written |
| Conflict test (`/drafts/skoda-602-conflict-test`, deleted afterwards) | push `new` → author edit in DA → re-run = **`conflict`, exit 1, author's text kept**; `--force` = `overwrite` |
| `--stage all`, Zellmer press release | first run: false `conflict` (wrapper whitespace) → fixed by `<main>` normalisation → `unchanged`, preview 200, 13/13 images, live 200, **indexed** |
| QA on `.aem.live`, 12 pilot pages | footer present on all 12 (after the `/footer` publish); two-column story layout live (816/408) |

## Follow-ups found (not in this ticket)
- **SKODA-307** — `footer.js` / `header.js` throw when their fragment is missing (null guard).
- **Story rail broken on `.aem.live`:** PR #113 merged `skoda-801-story-flatten` *before* commit `5aed689`
  (story-rail `model`/`years` facet keys). The published Related Stories rails now use those keys, so
  `main` renders their settings rows as cards. Merge the remaining commit (SKODA-820).
- Index titles carry " - Škoda Storyboard" (shared metadata transformer; needs a re-import).
- `push-query-config.sh` reads `$SKODA_ADMIN_TOKEN`; switch to injected credentials.
- SKODA-219 and SKODA-819 describe the same in-body carousel slider; merge one into the other.
- Blocks referenced by published content are missing on `main`: `promo-box`, `in-page-nav`,
  `spec-table`, `downloads`, `version` (404s in the live sweep).

## Dependencies
- Upstream: SKODA-601 (parsers/transformers). / Downstream: SKODA-603 (pilot import + validation); SKODA-803 (Phase B bulk automation builds on this).

## Risks / Flags
- EW native Import is destructive — always validate the preview before publish.
- The index only sees **published** pages: rails/listings can only be validated after publish (two-pass validation in SKODA-603).
- Oversized masters 409 on publish until SKODA-506; the tool reports them per URL.
- DA source-API contract is project-established (not doc-cited in the aem.live index); the admin bulk-job contract is documented at aem.live/docs/admin.html and was verified live.
