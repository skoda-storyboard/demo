# Image import mechanism (`tools/importer/media/`)

Reusable, re-runnable tooling to ingest source-site images into the project's
media layer and re-point imported content at them. Not Elroq-specific.

Implements the media half of **SKODA-501** (masters-only ingest), **SKODA-504**
(mapping manifest, page-mirrored DAM foldering), **SKODA-505** (media-cart
resolver seam), **SKODA-506** (pre-condition oversized masters before publish).
Grounded in `docs/media/SKODA-MEDIA-DEEP-DIVE.md` + `docs/media/SKODA-ASSET-MAPPING.md`.

## Two mechanisms

**A) Delivery — content `<img>` → EDS media bus.** `apply` rewrites each image's
`<img src>` to an absolute `delivery_url` and removes its legacy `srcset`.
EDS auto-ingests the delivery URL into its media bus at publish
(self-hosted `./media_<hash>`, webp, responsive).
For migrated pages the `delivery_url` is the master or a publish-safe sized
rendition; DAM and the optional DA archive receive the **full original**. In
production, authors add images with the **native AEM Assets sidekick picker**,
which pastes a plain image that also lands in the media bus — same delivery path.

**B) Media-cart "download original" — DAM asset path is the join key.** The cart
needs the *original* (not the optimized media-bus copy). The manifest records
each image's `dam_asset_path` (`/content/dam/storyboard/<page-path>/<file>`);
`apply` emits `content/media-index.json` — the **cart resolver seam** — mapping
`logical_id → { dam_asset_path, original_download_url, alt }`. The `media-cart`
block (SKODA-505) reads this to resolve "download original".

> **Demo-only limitation (accepted for M1):** this route surfaces DAM paths for
> *migrated* pages only. Production authors picking **new** assets via the native
> picker do NOT get a DAM path onto the page on a standard instance — the native
> way to carry DAM identity for any picked asset is **Dynamic Media with OpenAPI**
> ("copy reference URL" mode), which is not enabled here. The production model is
> a **post-M1-demo decision**. The resolver is a single seam, so switching its
> source to DM/OpenAPI later is a config change, not a cart rebuild.

## What `build-media-manifest.mjs` does (per distinct logical image)

1. **Dedup — path-qualified logical id** (F3): `<pathhash8>__<master-basename>`,
   so same-basename images in different folders don't collide.
2. **Pick the delivery rendition** (F4): the master, or — if it is over
   ~10 MB — the largest ladder derivative under threshold. If none is safe, the
   row is `partial`/`skipped` (never silently ships an oversized master; the DAM
   still gets the full original).
3. **Fetch server-side** (no CORS; retry + backoff on 429/5xx).
4. **Upload the ORIGINAL master to the AEM DAM** via the AEMaaCS 3-step
   direct-binary-upload, into the **page-mirrored folder**
   `/content/dam/storyboard/<page-path>/<file>` (first page to reference an image
   owns its folder; shared images reuse it). Sets provenance metadata.
5. **(optional `--da-archive`)** self-host the original in DA (CDN-independence);
   becomes the M1 cart `original_download_url`.
6. **Record a manifest row** with per-step status (`deliver`/`dam`/`da`); a row is
   `done` only when every required step passed. Manifest is flushed per row
   (resumable); non-zero exit if failures remain. Delivery-only `done` rows
   resume just the DAM/DA steps when those are requested later (no blanket
   `--force` upload). Missing/empty alts are logged per imported occurrence.

The original is uploaded even when a safe inline delivery rendition is unavailable;
the row remains `partial` until SKODA-506 resolves that separate publish issue.
Original fetches must return non-empty image bytes, and the direct-upload response
must provide enough parts to cover every byte before any part is sent. A missing
original is never replaced by a derivative under the original's DAM path.

Then **`apply-media-manifest.mjs`** rewrites content `<img src>` →
`delivery_url`, removes the old WordPress `srcset` ladder so EDS builds its own,
and emits `content/media-index.json` (the cart resolver). A missing page or
unresolved image fails the entire requested apply before changing any page;
the sole exception is a manifest `partial` row explicitly marked
`no safe delivery rendition`, whose original reference stays intact and is
logged for the mandatory `import:push` strip-or-block gate;
an asset appears in the cart index only when the DAM upload and deliverable
original-download URL have both succeeded. `--dry-run` does not modify pages,
the manifest, or the cart index.

The M1 importers call the shared `skoda-images.js` normalizer after parsing:
default-content images (including inline paragraphs and native figures) become
direct children of `<div>`, and `data-caption` becomes a visible `<figcaption>`
without replacing an existing native caption. Table-cell images remain in their
authored block shape; DA serializes those cells as `<div>`. Original alt values
are preserved and missing/empty values are logged for editorial backfill.

## Usage

```bash
# 1. Prepare delivery-only media (no external DAM or DA upload).
npm run media:build -- --pages content/en/skoda-model/elroq.plain.html

# 2. After rights/access approval, ingest originals to the DAM (needs a DAM token).
npm run media:build -- \
  --pages content/en/skoda-model/elroq.plain.html \
  --dam-base https://author-p220607-e2281243.adobeaemcloud.com \
  --dam-folder /content/dam/storyboard \
  --concurrency 4 --dry-run

# After reviewing the dry run, repeat without --dry-run. Add --da-archive
# only when the separate original-download archive has been approved.

# 3. Rewrite imported content; fails if required image mappings are missing.
npm run media:apply -- --pages content/en/skoda-model/elroq.plain.html

# Reconcile the canonical 43 URLs / 42 unique pages once the generated
# content store is available. Non-zero exit for missing pages or image defects.
npm run media:audit -- --contentRoot content --out /path/to/m1-media-audit.json

# 4. import:push runs the mandatory SKODA-506 gate before DA push/preview,
#    and rechecks before live publish. Dry-run reports changes without
#    writing content or DA.
npm run import:push -- --urls tools/importer/urls-<name>.txt --dry-run
npm run import:push -- --urls tools/importer/urls-<name>.txt
# Review preview, then run the separate publish stage; this re-previews
# conditioned DA content and never implicitly overwrites an author edit.
npm run import:push -- --urls tools/importer/urls-<name>.txt --stage publish

# Tests (no live DAM needed — mock server + pure-fn unit tests):
npm run test:media
npm test
```

Without `--dam-base` the tool runs **delivery-only** (no DAM ingest) — useful for
the media-bus rewrite alone.
The audit reports per-page image counts, missing/empty alt, missing captions,
misplaced images, unverified delivery, and pending DAM originals; it exits
nonzero while any in-scope original is missing from DAM. It skips the
alias annotated in `skoda-m1-url-set.txt`; it does not publish content or
replace SKODA-506's gate in `import:push`. A checkout without `content/`
correctly reports 42 missing pages rather than claiming media QA passed.

### Mandatory inline-image gate (`import:push`, SKODA-506)

`import:push` probes every inline `<img>` and `<picture>` reference against a
default **10 MiB** limit; `--max-image-bytes <positive integer>` overrides it.
The media builder's stored byte count is not proof of current safety. An
oversized image is replaced with a verified `delivery_url` from the manifest
or a verified source-CDN `-WxH` rendition. Obsolete oversized `srcset` and
`<source>` candidates are removed; `alt`, `data-caption`, and surrounding
content are retained. If no safe rendition exists, only noncritical body
imagery is removed, retaining/promoting its caption. Unclassified, hero,
card, or art-directed imagery instead blocks the page; unreachable or
unmeasurable media never passes as safe. Stripped alt/caption values remain
in the per-image report. DAM originals, the cart index, and Metadata
`image`/`og:image` references are not changed.

The gate runs before DA writes/preview and rechecks before publish.
Publish-only requires DA to match the conditioned local document and a
successful explicit preview of that exact content hash (`previewedHash` in
the push manifest); it refreshes that preview before live publish.
With `--publish-fragments`, a non-live fragment's DA source must also pass
the byte gate unchanged; an oversized fragment blocks its publish rather
than being rewritten behind the author's back.
For mismatches, run the explicit push + preview stage first (a DA author-edit
conflict still requires separate review, never an implicit overwrite).
Changes and errors appear in console output and the per-page `media`/`error`
fields of `tools/importer/reports/push/<stamp>.json`; the report also includes
`args.maxImageBytes`. `--dry-run` writes only its report, never the imported
page, DA source, or a bulk preview/live job.

### `--from-manifest` (re-ingest without the page file)

The imported `.plain.html` lives in the separate content store (`content/` is a
symlink), so it is **not** in a code-repo checkout. To run the DAM ingest from a
clean checkout, re-ingest straight from the source URLs already recorded in the
committed `media-manifest.json` — no page file needed. For an approved batch,
provide a plain-text file containing **one reviewed `logical_id` per line**:

```bash
npm run media:build -- --from-manifest \
  --ids-file /path/to/approved-original-ids.txt \
  --dam-base https://author-p220607-e2281243.adobeaemcloud.com \
  --dam-folder /content/dam/storyboard --dry-run
# After approval and review, repeat without --dry-run.
```

Each row's own `dam_page_path`/`alt` are reused, so page-mirrored foldering is
unchanged. The builder resumes only missing steps on delivery-only rows;
`--force` is reserved for deliberately rebuilding completed rows. An unscoped
`--from-manifest` run processes **every** row, including images another import
may have added since a prior approval; use `--ids-file` to freeze the intended
upload set. Unknown, repeated, or empty ID lists fail rather than expanding
the scope. With `--dam-base`, `--dry-run` also HEAD-checks pending original
masters and reports inaccessible ones without fetching bytes or uploading.

## Automatic wiring (PostToolUse hook)

`.claude/settings.json` registers a **PostToolUse(Bash) hook**
(`auto-media-hook.mjs`) so the media step runs **automatically after every
content import** in this harness — no need to remember it:

- Fires **only** when the Bash command invoked `run-bulk-import.js` (otherwise a
  silent no-op).
- Reads the runner's `✅ Saved content to <path>` lines to scope itself to the
  **pages just imported**, then runs `build` + `apply`.
- **Incremental — new images only:** the manifest skips images already `done`, so
  when an import brings no new images the step fetches/rewrites nothing (a genuine
  no-op). It reports the count of new images it ingested.
- **Delivery-only by design:** the auto step does the safe, no-credential work
  (manifest + media-bus rewrite + `media-index.json`). It never auto-uploads to
  the AEM DAM — that needs the token and hits the external instance, so it stays
  an explicit `npm run media:build -- --dam-base …` (the hook prints a reminder
  when new images were ingested).
- **Never fails the originating import:** any hook error is logged to stderr
  and exits 0. This is **not** a publish gate; inspect its output, run build/apply
  explicitly in terminal/CI, and require SKODA-506 before publishing.

**Team scope — two honest limits (why the manual step below still matters):**
1. The hook is a **Claude Code** event — it fires only when the *agent* runs the
   import in a session. A direct `node run-bulk-import.js` in a plain terminal or
   CI will **not** trigger it; use the manual `media:build`/`media:apply` step there.
2. Claude Code asks each team member to **review + approve project hooks once**
   (a security gate on repo-supplied hooks). If someone declines, the hook won't
   run for them — the documented pipeline step (`IMPORT-PIPELINE.md` §4) is the
   fallback so the media step is never silently skipped.

The shared team config is `.claude/settings.json` (committed); personal overrides
go in `.claude/settings.local.json` (gitignored).

## Auth (per-host)

- **DA / `admin.hlx.page` / `admin.da.live`** — the environment's injected
  **session** IMS credential (unchanged; used for `--da-archive` + publishing).
- **AEM DAM host (`author-p…adobeaemcloud.com`)** — a **custom IMS token**, used
  only for the DAM upload. The tool reads it from (in order):
  1. `AEM_DAM_TOKEN` (or `AEM_DEV_TOKEN`) env var,
  2. `--token-file <path>` / `AEM_TOKEN_FILE`,
  3. `.migration/secrets/aem-token` (gitignored + hlxignored),
  4. `~/.aem-dev-token`.

  **Never pass a token on the command line or in chat.** A pasted secret is
  compromised — rotate it. If `--dam-base` is requested without a token,
  the builder fails before processing rather than reporting delivery-only
  success as a completed DAM ingest.

## Wiring the real DAM (contract)

The AEMaaCS 3-step direct-binary-upload (`uploadToDAM` in `media-lib.mjs`):

1. `POST {host}/content/dam/storyboard/<page-path>.initiateUpload.json`
   form: `fileName`, `fileSize` → `{ completeURI, files:[{ uploadToken, uploadURIs[], maxPartSize }] }`
2. `PUT` each part of the binary to its `uploadURI` (split by `maxPartSize`; no per-part ETags).
3. `POST {completeURI}` form: `fileName`, `mimeType`, `uploadToken`.

Auth: `Authorization: Bearer <custom IMS token>` on steps 1 and 3.
Smoke test once the token is set:

```bash
AEM_DAM_TOKEN=… npm run media:build -- --pages content/en/skoda-model/elroq.plain.html \
  --dam-base https://author-p220607-e2281243.adobeaemcloud.com --dam-folder /content/dam/storyboard --limit 1
```

## Production media-cart original — decide post-M1 demo

Candidate models for surfacing the DAM original for **new** author-picked assets:
- **Dynamic Media / OpenAPI** (recommended) — sidekick "copy reference URL" mode
  inserts a public reference URL carrying the asset identity for any picked asset.
- Content-hash reconciliation index (heavier, standard-instance).
- Author-recorded DAM path in a block field (manual).

Only the resolver seam's *source* changes; the cart block does not.

## Files

- `media-lib.mjs` — pure helpers + AEMaaCS uploader + auth loader.
- `build-media-manifest.mjs` — ingest + manifest builder.
- `apply-media-manifest.mjs` — content rewrite + cart resolver index.
- `media-lib.test.mjs` — unit + mock-DAM integration tests (`npm run test:media`).
- `media-manifest.json` — generated manifest (git-tracked; inspectable).

## Scale-out (M2)

Point `--pages` at the full imported set + tune `--concurrency`. The dedup,
pre-condition, page-mirrored foldering, incremental persistence, retry/backoff,
and per-step resume all scale. The cost driver is **rights + dedup + unmatched
decisions**, not upload (SKODA-504). Needs a refreshable technical user (a
short-lived dev token can't sustain an 11k batch).
