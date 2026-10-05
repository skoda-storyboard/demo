# Image import mechanism (`tools/importer/media/`)

Reusable, re-runnable tooling to ingest source-site images into the project's
media layer and re-point imported content at them. Not Elroq-specific.

## Media feed binaries (SKODA-608 / #200 review)

The generated media feed (`/en/media-feed.json`, `npm run media-items:build`) serves image
thumbnails, 1920 renditions, originals, Vimeo posters and MP4s straight from a DA sheet. EDS does
**not** ingest sheet URLs into the media bus the way it ingests a page `<img>`, so a CDN URL in the
feed is not evidence of ingestion. Every one of them is recorded here like a page asset:

```bash
npm run media-items:build -- --out <dir>                    # writes <dir>/en/media-feed.json
npm run media:build -- --feed <dir>/en/media-feed.json      # records every feed binary
npm run media-items:build -- --offline --out <dir> --push   # publishes; refuses without coverage
```

`--feed` rows use the same path as pages: deduplicated by logical id with page assets, the
delivery rendition + bytes for images, and the SKODA-503 import-time state for MP4s (`partial`,
`steps.dam: n/a`, `steps.publish: pending`; the DAM upload runs later on a developer machine).
The feed document (`en/media-feed`) is the referencing page; the item's listing home
(`en/images`, `en/videos`, `en/assets`) owns the DAM folder unless a page already does.
`--push` fails while any feed URL has no manifest row (`feedCoverageGaps`).

**Media Bus thumbnails.** `--push` then puts the card thumbnails (`image`) on the Media Bus through
carrier documents, `/en/fragments/media-feed-images[-N]` (150 images each, under html2md's
200-image limit; `/en/fragments/**` is outside the query index). One `<img>` per thumbnail with
`alt` = its source URL; after the preview the builder reads each carrier's `.plain.html` and
rewrites `image` to `/en/fragments/media_<hash>.<ext>` (a `media_` path resolves from any folder,
on `.aem.page` and `.aem.live`). The cards' `createOptimizedPicture` params then resize it.
Don't edit or unpublish the carriers: the next push regenerates them.

**AEM Assets files.** `--push` also points `original` (the "Original" download, the lightbox
download and copy link) and `mp4` (the video download) at the published AEM Assets file: the
`public_url` of the manifest row for that master, only when `steps.dam` and `steps.publish` are
`done` and `public_verified.url` matches; otherwise it stays on the source URL and the push logs
the count. A master published by a page import under its `/direct-download/<yyyy>/<mm>/<file>` URL
is the same file as the feed's CDN URL (`cdnUrl`). The publish host sends
`content-disposition: attachment`, so a download saves the file. The 1920 rendition and video
posters stay on the source URLs (the DAM keeps originals only). The manifest gate runs on the
source URLs first.

**Library source.** `sources.json` `library: ["image"]` adds the whole source image library to
the feed, kept to the items whose original is published on AEM Assets (2026-10-01: 1,715 of 33,457).
The builder pages the listing's "load more" endpoint (`ys_ajax_loader`, `query_vars[offset]`) one
calendar year at a time, because the source search backend serves only the first 10,000 results of
a query; a year at that window fails the build. Library pages are cached as JSON
(`library_<type>_<year>-01-01_<offset>_200.json`); detail panels load 4 at a time. Source items whose
detail panel is empty on every request are recorded in `knownDetailGaps`. A rendition whose file
name defeats the master match (`X.PNG-353x768.png`) is added to its master row's `seen_urls`.

To move an already-published feed onto the Media Bus and AEM Assets without re-scraping the source:

```bash
curl -s https://admin.da.live/source/skoda-storyboard/demo/en/media-feed.json -o feed.json
npm run media-items:build -- --feed feed.json --push --out <dir>
```

## PDF/MP4 links (SKODA-503)

PDFs and self-hosted MP4s are **not images**: they are recorded as `document`
and `video` rows in the same manifest, uploaded as originals to AEM Assets,
and rewritten only in `<a href>` attributes. Embedded Vimeo/YouTube/audio
URLs are not binaries.

**Tracking convention: record at import, ingest on a developer machine.**
Every PDF/MP4 link on a migrated page must have a row in the committed
`media-manifest.json`, like its images. The import-time build (no
`--dam-base`, as the post-import hook runs it) records each one as a
`partial` row with `steps.dam: "n/a"` and `steps.publish: "pending"`.
It fetches and uploads nothing. **Commit the manifest with the import.**
`content/` is not in a code checkout, so the manifest is the handoff. The DAM
upload, activation and public verification below run later **on a developer
machine** (DAM token in `AEM_DAM_TOKEN` or a gitignored token file), not in the
agent environment, using a reviewed `--ids-file` and public-URL map. For pages
migrated before a link was tracked, run the same delivery-only build over them.
An untracked link shows up in `npm run media:validate-binaries` and in the
audit's `untrackedDocuments` / `unverifiedBinaries`. A private author DAM path is never used as an anonymous
page link. The public AEM Assets delivery contract for **one PDF** is proven; every new
PDF/MP4 still requires its own published-original proof. Scope real ingest to
reviewed page/ID batches and a candidate public URL for each original. The
builder uploads, activates on AEM publish, then verifies anonymous MIME type
and original byte count before rewriting any page link.
A redirect to an expiring signed URL is not a suitable link.
An anonymous HEAD on an **existing image** under
`publish-p220607-e2281243.adobeaemcloud.com/content/dam/storyboard/` returned
200 on 2026-09-27. This suggested a candidate publish host, not automatic
publication of newly uploaded originals.
On 2026-09-28, a single approved Elroq PDF was uploaded and processed on the
author DAM (`/content/dam/storyboard/en/skoda-model/elroq/TD-Elroq-en_new_7a3c9a44.pdf`):
authenticated HEAD returned `application/pdf`, 537,385 bytes. Anonymous HEAD
at the matching publish path initially returned **404**. After the user
published the asset manually, its anonymous HEAD returned **200** with the
original MIME/byte count. With separate approval, an authenticated
`POST /bin/replicate.json` to this tenant's author host, form fields
`cmd=Activate` and `path=<exact PDF DAM path>`, returned 200 for this
already-published PDF. Author `jcr:content` recorded a fresh publish
replication action, and anonymous original delivery still passed. This
demonstrates that the token can trigger activation **for this asset**; direct
binary upload alone does not publish. The migration now automatically
activates each selected PDF/MP4 after DAM upload; restrict the batch with
reviewed pages or `--ids-file`. The isolated manifest
under `.migration/secrets/skoda-503-sample-manifest.json` was resumed with
the user's one-page execution request: its one Elroq PDF row now records
activation and anonymous MIME/byte-count proof, which was copied to the
tracked media manifest. Do not repeat the upload or expand the batch. The
bulk-import runner was denied in the execution environment and no generated
page was available in this branch for `import:push`. At the user's request,
the existing DA Elroq page was versioned, its verified PDF link updated via
DA MCP, and previewed. `main` and PR branch `.aem.page` now show the public
Assets link; `.aem.live` still shows the source URL. The push manifest was
not modified to pretend this was an importer push. Do not mark the ticket
done until a reproducible generated page and independent QA have passed;
page publication remains a separate decision.

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
# With credentials, repeat without --dry-run: DAM upload -> publish activation
# -> anonymous original verification. The first approved sample may be reused
# from the private manifest; no --force or second upload is needed.
npm run media:apply -- --pages content/en/press-releases/example.plain.html
npm run media:validate-binaries -- --pages content/en/press-releases/example.plain.html
npm run import:push -- --paths /path/to/approved-page-paths.txt --dry-run
# With separate DA approval, push + preview (NOT page publish). The push also
# rewrites verified binary links if media:apply has not already done so.
```

The Assets builder requires a public URL mapping **before** uploading any
selected binary. After DAM upload (and metadata), it sends one
`POST /bin/replicate.json` on author with `cmd=Activate` and the selected
binary's exact DAM path, using the DAM token. It waits briefly for anonymous
`HEAD` access, exact PDF/MP4 MIME, original byte length and no redirect.
`steps.publish` records activation separately from `steps.dam`; failure keeps
the row `partial` and blocks link rewriting/DA push. Retry resumes activation
or delivery verification without re-uploading the original. **This publishes
Assets binaries, not DA pages**; `import:push --stage publish` remains separate
and requires its own approval. A source
`/direct-download/…mp4` redirect is followed only to fetch the bytes; neither
that redirect nor its signed S3 target becomes the destination link. The source
link must be a stable URL without a query string; query-bearing binaries block
ingest rather than guessing whether dropping parameters changes the file.
Analytics hash fragments may be stripped by the existing link transformer. The source
may return `application/octet-stream` for MP4s, so verified MP4 signatures
are uploaded with `video/mp4` MIME. PDF/MP4 originals download into a
system temporary directory outside the served checkout, then upload as bounded
file streams through the DAM's multipart URLs; the temporary file is removed
on success or failure.
Binary uploads are serial and support multi-GB originals without a whole-file
Buffer, subject to available disk space and DAM part limits. AEM may offer more
upload URLs than needed: use the first `ceil(bytes / maxPartSize)` in order,
with a shorter final part; reject an offer with too few URLs. A signed MP4 route
may reject HEAD but accept a one-byte ranged GET; the dry-run preflight handles
that. Author folder/initiate calls have bounded deadlines and retries; the
completion POST is never automatically retried. Its pending state is saved
before the request. An uncertain completion remains `partial`: a rerun checks
the authenticated author original's exact MIME and byte count, and does not
download or re-upload while the author asset is absent or mismatched.
Successful public verification clears transient completion/retry notes;
provenance-metadata warnings remain visible. Failures block rewriting. The
standalone `media:validate-binaries` check is **offline** and emits per-page JSON results
with a nonzero exit for missing, unrehosted or misclassified links. `import:push`
rewrites verified source PDF/MP4 anchors from the manifest in memory before
its per-page offline gate and DA decision, then stores the rewritten page
locally when an allowed push occurs. `media:apply` remains the explicit
rewrite path when validating generated pages before a push. Both paths
require a completed DAM upload, publish activation and recorded anonymous
original MIME/byte-count proof; neither uploads or activates an asset during
DA push. An invalid or partly verified page is reported as `blocked-binary`
without a local or DA write, while other pages can proceed. Preview-only
cannot introduce a new rewrite into DA; use `--stage push,preview` after
reviewing `--dry-run`. Conflicts still require explicit review, not an
automatic overwrite.
The gate checks the stored public proof but does not crawl preview/live URLs.
Never use `--force` to recover a publish or delivery failure, and never run
an unreviewed `--from-manifest` batch: the binary publisher acts on every
selected PDF/MP4. When `--from-manifest` also specifies `--dam-base` and
binary rows exist, the builder requires `--ids-file` before any upload or
activation; page-based runs are scoped by their explicit `--pages` list.
`--dry-run` never activates an asset. The user authorized a scoped live
resume of the already uploaded Elroq PDF; it completed without re-upload.
Obtain explicit activation approval for each new batch before running the
non-dry command, even for already uploaded originals.

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
`apply` emits `content/media-index.json`, mapping
`logical_id → { dam_asset_path, original_download_url, alt }`. That file only lists rows
with an `original_download_url`, which only `--da-archive` sets, so it is empty for M1.

**The media cart's served index (SKODA-505a).** `npm run media:cart-index`
(`build-cart-index.mjs`) turns the manifest's *verified* published originals
(`public_url` + `public_verified`) into `scripts/media-cart-index.json`. That file is
committed and served by the code bus, and loaded on the first cart action.
- It maps every page link the manifest saw (`seen_urls`: `cdn.skoda-storyboard.com/YYYY/MM/…`,
  `/direct-download/…`) to its DAM original's path, size and type.
- The format is compact: `{ v, base, mimes, assets[[path, bytes, mime]], keys }`.
- Keys stay percent-encoded. `-WxH` / `-scaled` derivative keys are left out, because
  `scripts/media-cart-resolver.js` strips them at lookup.
- A key claimed by two different files is dropped. The same PDF filed twice maps to the
  first copy.

**Regenerate after DAM publishes or manifest changes:**
`npm run media:cart-index`. `npm run media:cart-index -- --check` exits non-zero when the
committed index is stale. It isn't part of `npm test`, so manifest PRs aren't blocked.
Links that aren't in the index (unpublished rows) show as unavailable in the cart.

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
and emits `content/media-index.json` (see mechanism B). A missing page or
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

# 4. import:push rewrites verified binary anchors if needed and runs the
#    mandatory SKODA-506 gate before DA push/preview; it rechecks before live
#    publish. Dry-run reports changes without writing content or DA.
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

On 2026-09-29, a scoped batch of 1,979 first-party image originals from the
import manifest was run against AEM Assets. The manifest records 1,947
successful DAM uploads; authenticated author HEAD responses matched the source
originals' byte counts and returned image MIME types. The other 32 originals return HTTP 403 to
both source HEAD and ranged GET, so no derivative was substituted. Another
65 external video-platform thumbnails were excluded from this batch pending
rights review. This uploads originals to DAM only: it does not activate
images on publish, rewrite DA content, or resolve separate oversized inline
delivery warnings.

To activate an approved set of **already uploaded images** on AEM publish,
provide a reviewed list of image `logical_id`s (one per line). The publisher
authenticates to author, activates one DAM original, and records a public URL,
MIME type, and byte count only after anonymous publish HEAD matches author.
It never uploads images or publishes DA pages:

```bash
npm run media:publish-images -- \
  --ids-file /path/to/approved-image-ids.txt \
  --token-file /path/to/gitignored/aem-token --concurrency 4
```

Rows with `steps.publish: pending` after an uncertain activation are checked
for public delivery on resume, but never reactivated automatically. Public
404 or MIME/byte mismatches leave the row unverified and require investigation.
Image `status` and `delivery_url` remain unchanged: AEM Assets publication is
separate from EDS inline-image delivery.

**Publication checkpoint (2026-09-29):** a newly restored first-party icon
was also uploaded, bringing the DAM image total to 2,297. All 2,215 non-WebP
originals have an anonymous public HEAD proof with image MIME and the exact
author-original byte count in the manifest. Four WebP originals received
successful activation responses and show `Activate` on author, but still
return HTTP 404 on publish (both HEAD and GET, even when authenticated).
They remain `steps.publish: pending`; the other 78 WebP originals were not
activated while this delivery failure is unresolved. Do not count any of
those 82 as published or reactivate the uncertain four without investigation
(tracked in [#219](https://github.com/skoda-storyboard/demo/issues/219)).
The 32 source-403 originals and 65 excluded external thumbnails are still
not uploaded to DAM. No DA pages were changed or published.

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

Only the resolver seam's *source* changes (`scripts/media-cart-resolver.js` and its
index); the cart store and controls don't.

## Files

- `media-lib.mjs` — pure helpers + AEMaaCS uploader + auth loader.
- `build-media-manifest.mjs` — ingest + manifest builder.
- `apply-media-manifest.mjs` — content rewrite + `content/media-index.json`.
- `build-cart-index.mjs` — the media cart's served index `scripts/media-cart-index.json`
  (`npm run media:cart-index [-- --check]`; test: `build-cart-index.test.mjs`).
- `media-lib.test.mjs` — unit + mock-DAM integration tests (`npm run test:media`).
- `media-manifest.json` — generated manifest (git-tracked; inspectable).

## Scale-out (M2)

Point `--pages` at the full imported set + tune `--concurrency`. The dedup,
pre-condition, page-mirrored foldering, incremental persistence, retry/backoff,
and per-step resume all scale. The cost driver is **rights + dedup + unmatched
decisions**, not upload (SKODA-504). Needs a refreshable technical user (a
short-lived dev token can't sustain an 11k batch).
