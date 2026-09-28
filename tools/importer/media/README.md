# Image import mechanism (`tools/importer/media/`)

Reusable, re-runnable tooling to ingest source-site images into the project's
media layer and re-point imported content at them. Not Elroq-specific.

## PDF/MP4 links (SKODA-503)

PDFs and self-hosted MP4s are **not images**: they are recorded as `document`
and `video` rows in the same manifest, uploaded as originals to AEM Assets,
and rewritten only in `<a href>` attributes. Embedded Vimeo/YouTube/audio
URLs are not binaries. A private author DAM path is never used as an anonymous
page link. The public AEM Assets delivery contract for this tenant is **not yet
established**; upload **only one rights-approved original** against a reviewed
candidate public URL to prove anonymous access, original MIME type and byte
count. Do not expand the batch or rewrite page links until that proof succeeds.
A redirect to an expiring signed URL is not a suitable link.
An anonymous HEAD on an **existing image** under
`publish-p220607-e2281243.adobeaemcloud.com/content/dam/storyboard/` returned
200 on 2026-09-27. This suggests a candidate publish host, **not proof that
new PDF/MP4 originals are automatically published or anonymously accessible**.
On 2026-09-28, a single approved Elroq PDF was uploaded and processed on the
author DAM (`/content/dam/storyboard/en/skoda-model/elroq/TD-Elroq-en_new_7a3c9a44.pdf`):
authenticated HEAD returned `application/pdf`, 537,385 bytes. Anonymous HEAD
at the matching publish path returned **404** after the upload. The isolated
manifest under `.migration/secrets/skoda-503-sample-manifest.json` retains the
successful DAM upload as `partial`, without a verified public URL. Do not
repeat the upload, expand the batch, rewrite links, or mark the ticket done.
Determine the tenant's Assets activation/public delivery contract first;
activation or site publication needs separate approval.

Before the first approved sample upload, create a **reviewed, local JSON map**
whose keys are intended DAM paths and whose values are candidate public Assets
URLs; the builder verifies actual public delivery **after** uploading:

```json
{
  "/content/dam/storyboard/en/press-releases/example/release.pdf": "https://PUBLIC-ASSETS-HOST/content/dam/storyboard/en/press-releases/example/release.pdf"
}
```

The hostname above is a **placeholder, not a known working endpoint**. Keep
the mapping out of commits until the tenant-specific delivery contract has
been established. Restrict the first upload to one rights-approved original
using an ID list and review the dry run first:

```bash
npm run media:build -- --pages content/en/press-releases/example.plain.html
npm run media:build -- --from-manifest --ids-file /path/to/approved-binary-ids.txt \
  --dam-base https://author-p220607-e2281243.adobeaemcloud.com \
  --public-urls /path/to/public-urls.json --dry-run
# With credentials, upload the approved single sample without --dry-run.
# The builder fails closed if the sample does not deliver publicly; investigate
# activation/publication requirements before adding any more IDs.
npm run media:apply -- --pages content/en/press-releases/example.plain.html
npm run media:validate-binaries -- --pages content/en/press-releases/example.plain.html
npm run import:push -- --paths /path/to/approved-page-paths.txt --dry-run
# Only with separate DA approval: default import:push stage is push + preview, NOT publish.
```

The Assets builder requires a public URL mapping **before** uploading any
selected binary. It verifies anonymous `HEAD` access, exact PDF/MP4 MIME,
original byte length, and no redirect after upload. A source
`/direct-download/…mp4` redirect is followed only to fetch the bytes; neither
that redirect nor its signed S3 target becomes the destination link. The source
link must be a stable URL without a query string; query-bearing binaries block
ingest rather than guessing whether dropping parameters changes the file.
Analytics hash fragments may be stripped by the existing link transformer. The source
may return `application/octet-stream` for MP4s, so verified MP4 signatures
are uploaded with `video/mp4` MIME. Binary uploads are serial to bound memory
usage (a measured M1 MP4 is about 101 MB). A signed MP4 route may reject HEAD
but accept a one-byte ranged GET; the dry-run preflight handles that. Failures
remain `partial` in the manifest and block rewriting. The standalone
`media:validate-binaries` check is **offline** and emits per-page JSON results
with a nonzero exit for missing, unrehosted or misclassified links. `import:push`
applies the same gate per page before DA writes and again before preview/live;
an invalid page is reported as `blocked-binary` while other pages can proceed.
The gate checks the stored public proof but does not crawl preview/live URLs.
No automatic publish or `--force` overwrite is part of this procedure.

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

The delivery rendition for an oversized master steps down the `-WxH` ladder but
never below **768 px on the long edge** (`--min-image-edge <px>` overrides it):
a `-272x182` thumbnail in a gallery or card slot is a silent downgrade. Rows that
earlier delivered a stepped-down thumbnail are re-picked on the next build, no
`--force` needed; a page's own small reference (e.g. a portrait `-631x768`) is
kept. The original is uploaded even when a safe inline delivery rendition is
unavailable; the row remains `partial` until SKODA-506 resolves that separate
publish issue.
Original fetches must return non-empty image bytes, and the direct-upload response
must provide enough parts to cover every byte before any part is sent. A missing
original is never replaced by a derivative under the original's DAM path.

Then **`apply-media-manifest.mjs`** rewrites content `<img src>` →
`delivery_url`, removes the old WordPress `srcset` ladder so EDS builds its own,
and rewrites verified PDF/MP4 anchors to their public Assets URLs,
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
replace SKODA-506's gate in `import:push`. It also reports PDF/MP4 count and
unverified binary links; a private DAM-only PDF does not count as delivered.
A checkout without `content/`
correctly reports 42 missing pages rather than claiming media QA passed.

### Mandatory inline-image gate (`import:push`, SKODA-506)

`import:push` probes every inline `<img>` and `<picture>` reference against a
default **10 MiB** limit; `--max-image-bytes <positive integer>` overrides it.
The media builder's stored byte count is not proof of current safety. An
oversized image is replaced with a verified `delivery_url` from the manifest
or a verified source-CDN `-WxH` rendition at least **768 px** on the long edge
(`--min-image-edge <px>` overrides it, as in the media builder; a `-272x182`
thumbnail in a body slot is worse than a logged strip). The source CDN answers **403** for a missing
rendition, so 403 and 404 both mean "absent". Extension-less URLs (e.g. Vimeo
thumbnails) pass on an `image/*` content-type. Obsolete oversized `srcset` and
`<source>` candidates are removed; `alt`, `data-caption`, and surrounding
content are retained. If no safe rendition exists, only noncritical body
imagery is removed, retaining/promoting its caption. Unclassified, hero,
card, or art-directed imagery instead blocks the page; unreachable or
unmeasurable media never passes as safe. Stripped alt/caption values remain
in the per-image report, with `belowMinEdge` listing any existing
rendition rejected for width. DAM originals, the cart index, and Metadata
`image`/`og:image` references are not changed. A blocked page is skipped on its
own (`blocked-media`, exit code 1); the rest of the batch still pushes.

The gate runs before DA writes/preview and rechecks before publish.
Publish-only requires DA to match the conditioned local document and a
successful explicit preview of that exact content hash (`previewedHash` in
the push manifest); it refreshes that preview before live publish. Pages
previewed before the gate existed have no `previewedHash`, so run one
`--stage push,preview` before their first publish-only run. Each image is
probed once per run; the preview/publish rechecks reuse that measurement.
With `--publish-fragments`, a non-live fragment's DA source must also pass
the byte gate unchanged; an oversized fragment blocks its publish rather
than being rewritten behind the author's back.
For mismatches, run the explicit push + preview stage first (a DA author-edit
conflict still requires separate review, never an implicit overwrite).
Changes and errors appear in console output and the per-page `media`/`error`
fields of `tools/importer/reports/push/<stamp>.json`; the report also includes
`args.maxImageBytes` and `args.minImageEdge`. `--dry-run` writes only its report, never the imported
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
the scope. With `--dam-base`, `--dry-run` HEAD-checks pending image originals and
HEAD/range-probes pending PDF/MP4 originals (requesting one byte, then
canceling the response body), reporting inaccessible sources without uploading.

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
