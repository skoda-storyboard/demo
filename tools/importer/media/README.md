# Image import mechanism (`tools/importer/media/`)

Reusable, re-runnable tooling to ingest source-site images into the project's
media layer and re-point imported content at them. Not Elroq-specific.

Implements the media half of **SKODA-501** (masters-only ingest), **SKODA-504**
(mapping manifest, page-mirrored DAM foldering), **SKODA-505** (media-cart
resolver seam), **SKODA-506** (pre-condition oversized masters before publish).
Grounded in `docs/media/SKODA-MEDIA-DEEP-DIVE.md` + `docs/media/SKODA-ASSET-MAPPING.md`.

## Two mechanisms

**A) Delivery — content `<img>` → EDS media bus.** `apply` rewrites each image's
`<img src>` (and `srcset`) to an absolute `delivery_url` that EDS auto-ingests
into its media bus at publish (self-hosted `./media_<hash>`, webp, responsive).
For migrated pages the `delivery_url` is the pre-conditioned master. In
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
2. **Pick the delivery rendition** (F4/SKODA-506): the master, or — if it is over
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
   (resumable); non-zero exit if failures remain.

Then **`apply-media-manifest.mjs`** rewrites content `<img src>`/`srcset` →
`delivery_url` and emits `content/media-index.json` (the cart resolver).

## Usage

```bash
# 1. Ingest originals to the DAM + build the manifest (needs the DAM token, below)
npm run media:build -- \
  --pages content/en/skoda-model/elroq.plain.html \
  --dam-base https://author-p220607-e2281243.adobeaemcloud.com \
  --dam-folder /content/dam/storyboard \
  [--da-archive] [--concurrency 4] [--dry-run] [--force]

# 2. Rewrite content <img> → delivery url + emit the cart resolver index
npm run media:apply -- --pages content/en/skoda-model/elroq.plain.html

# 3. Re-upload + publish the page as usual; EDS ingests the delivery masters.

# Tests (no live DAM needed — mock server + pure-fn unit tests):
npm run test:media
```

Without `--dam-base` the tool runs **delivery-only** (no DAM ingest) — useful for
the media-bus rewrite alone.

### `--from-manifest` (re-ingest without the page file)

The imported `.plain.html` lives in the separate content store (`content/` is a
symlink), so it is **not** in a code-repo checkout. To run the DAM ingest from a
clean checkout, re-ingest straight from the source URLs already recorded in the
committed `media-manifest.json` — no page file needed:

```bash
npm run media:build -- --from-manifest --force \
  --dam-base https://author-p220607-e2281243.adobeaemcloud.com \
  --dam-folder /content/dam/storyboard
```

Each row's own `dam_page_path`/`alt` are reused, so page-mirrored foldering is
unchanged. `--force` re-processes rows already marked `done` (e.g. from a prior
delivery-only build).

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
- **Never fails the import:** any hook error is logged to stderr and exits 0.

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
  compromised — rotate it. If the token is absent/expired, the DAM step is
  skipped and the image falls back to reference-in-place (logged) — no crash.

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
