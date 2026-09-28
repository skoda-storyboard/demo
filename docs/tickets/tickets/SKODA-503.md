# SKODA-503 — PDF/MP4 handling (link/DAM, no image pipeline)
- **Epic:** E05 — Media Pipeline
- **Type:** import
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (15 Oct demo)
- **Estimate:** 2 SP · AI-assisted 0.5–1d / manual 1–2d *(planning estimate, not a quote)*

## Summary
Route PDFs and MP4s to link/DAM references instead of the image pipeline. For the pilot these are plain links; the MP4 signed-S3 cart flow is not reproduced.

## Description
Non-image binaries must never go through EDS's image optimization pipeline. PDFs (press kits/reports, up to ~26 MB) are link/DAM references. Self-hosted MP4s are served via a tracked `/direct-download/…-1080p.mp4` route that redirects through the site to a signed, expiring S3 URL (`Content-Disposition: attachment`) — a gated download flow, not a plain CDN file. Rebuilding that signed-download service is deferred to Phase C (SKODA-902); for the pilot, MP4s are rendered as plain links (re-hosted plain asset or reference-in-place). Embedded (not self-hosted) video/audio — Vimeo/YouTube/Buzzsprout/Spotify — is handled by the Embeds block (SKODA-204), not here.

## Requirements / Spec
- Detect PDF and MP4 references during import (content-driven, by URL/type — no page-specific assumptions).
- Emit PDFs as link/DAM references; never pass them to the image pipeline or attempt optimization.
- Emit MP4s as plain download/links for the pilot; do **not** reproduce the signed-S3 `/direct-download/` flow.
- Preserve link text / titles for accessibility.
- Large binaries (10–28 MB) argue for reference-in-place or a dedicated document DAM rather than ingesting into the content bus.

## Acceptance Criteria
- [ ] PDF references render as link/DAM links, not run through the image pipeline.
- [ ] MP4 references render as plain links for the pilot (no signed-URL service).
- [ ] No PDF/MP4 is optimized or converted by the EDS image pipeline.
- [ ] Embedded video/audio is correctly left to the Embeds block, not handled here.
- [ ] `npm run lint` clean.

## Dependencies
- Upstream: SKODA-501 (masters-only image ingest). / Downstream: SKODA-603 (pilot import + validation).

## Risks / Flags
- MP4 signed-download hosting decision (re-host plain vs rebuild signed service) is unresolved — pilot uses plain links; full signed MP4 flow deferred to Phase C. (`SKODA-MEDIA-DEEP-DIVE.md` §4/§10)
- **Note (2026-09-07):** the media **cart + bulk zip-download** is **no longer blanket-deferred** — per client scope it is a mission-critical M1 demo deliverable, now built in **SKODA-505** (device-ID, client-side zip). This ticket still handles MP4/PDF as plain links for the pilot; only the *signed MP4 download service* remains a Phase C item (SKODA-902). See `SKODA-MEDIA-CART-DOWNLOAD.md`.
- MP4 rendition/resolution count and total video footprint are unquantified `[PARTIAL]` (no video sitemap).
- No-CORS legacy CDN complicates reference-in-place for production.

## Implementation checkpoint (2026-09-28; awaiting manifest update and QA)

On `skoda-503-binary-links` the manifest builder can inventory PDF/MP4 anchors,
upload approved originals to Assets, and verify a reviewed anonymous public
URL before marking a row ready. Apply rewrites verified anchors; an offline
validator and the DA push path block unmapped/private/source links per page
before external writes. Tests use a mock Assets server. **One PDF was uploaded
to the author DAM and is now publicly delivered.** The rights-approved Elroq
technical-data PDF (`TD-Elroq-en_new_7a3c9a44.pdf`) is present and processed
at `/content/dam/storyboard/en/skoda-model/elroq/` on author (authenticated
HEAD 200, `application/pdf`, 537,385 bytes). Immediately after upload the
matching anonymous publish URL returned 404. The user manually published
the asset, after which anonymous HEAD returned 200 with matching MIME/size.
With explicit approval, a single `POST /bin/replicate.json` on author with
form fields `cmd=Activate` and `path=<exact PDF DAM path>` returned 200 using
the same DAM token. Author `jcr:content` recorded a fresh
`cq:lastReplicationAction_publish: Activate`, and anonymous verification
still passes. This proves activation for **this asset on this tenant**, not
bulk publish rights or automatic publication of future uploads.

The isolated sample manifest still records `dam: done`, `status: partial`,
without a `public_url` or `public_verified` proof: updating it was separately
denied pending explicit one-row authorization. The committed manifest and
page links remain unchanged. No MP4 upload, DA push or page preview/publish
occurred. The ticket remains open until the manifest proof, sample preview
and independent QA pass. SKODA-510 owns the Downloads file-tile rendering.

Read-only probe: the candidate AEM publish hostname serves one already-uploaded
image anonymously (HEAD 200). The source Peaq MP4 is approximately 101 MB;
its signed redirect rejects HEAD (403) but a one-byte ranged GET succeeds (206).
Neither observation proves future PDF/MP4 assets will be published automatically.
Keep activation a separately approved step per asset or approved batch; verify
each public original before rewriting links or expanding the upload batch.
