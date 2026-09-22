# SKODA-504 — Map existing S3 images → AEM Assets (mapping manifest)
- **Epic:** E05 — Media Pipeline
- **Type:** import
- **Phase:** A (demo subset) · scale-out **M2** · **Pilot:** Yes (demo subset) · **Milestone:** M1 (15 Oct demo)
- **Estimate:** 3 SP (demo subset) · AI-assisted 1–2d / manual 2–3d *(M2 scale-out is a separate, larger workstream — see note)* *(planning estimate, not a quote)*

## Summary
Map existing Storyboard images (served from S3/CloudFront) to **AEM Assets** references — the client-confirmed approved-asset source — via a re-runnable **mapping manifest** the import parsers consume when rewriting `<img src>`.

## Description
**Prior question — is there an AEM Assets instance at all?** The deck (§9) makes this a demo-critical, unconfirmed decision: (a) **Škoda's own instance** (procurement lead time), (b) **a shared group instance** (faster if it exists, but tenancy/permissions/governance), or (c) **none in time** → for the demo, serve approved images from the content pipeline and cut over later. This gates everything below and must be answered **before demo build start**.

Assuming an instance: there is **no shared join key** between S3 images and AEM Assets: WordPress filenames are hash-suffixed (`…_1135a898.jpg`), no EXIF/IPTC IDs, no CORS on the CDN (`SKODA-MEDIA-DEEP-DIVE.md`, `SKODA-ASSET-MAPPING.md`). Approach depends on **Scenario A** (images already in Assets → *match*) vs **Scenario B** (Storyboard holds originals → *ingest + reference*); client signals a **mix**, so support both + an unmatched fallback. **M1:** only the demo pages' images (dozens) — trivial. **M2:** all in-use approved images (~28,300 logical, order-of-magnitude) — a real workstream whose cost is **rights + dedup + unmatched decisions**, not the upload.

## Requirements / Spec
- **Manifest** (sheet/CSV): `s3_url → aem_assets_ref` + `match_method` (filename | phash | manual | ingest) + `confidence`.
- **Match path (Scenario A):** filename/base-name match (strip WP hash suffix) → perceptual-hash match (server-side; CDN has no CORS) → manual/AI-assisted for low-confidence or demo subset. Confidence threshold; low-confidence → manual review (no auto-swap on weak matches).
- **Ingest path (Scenario B):** upload S3 **masters only** to AEM Assets (drop the derivative ladder — Assets/EDS regenerate), capture original S3 path + filename as metadata; manifest is a by-product.
- **Consume:** import parsers (SKODA-601/801) look up the manifest when rewriting `<img src>`; **unmatched → fallback** (reference-in-place on S3, or flag for ingest).
- **Dedup:** key on the logical image (42,275 pages → ~28,300 logical; ~33% cross-locale dupes) — don't ingest duplicates.
- **Approval filter (M2):** only map assets flagged "approved" in AEM Assets (folder/tag/metadata — TBD).

## Acceptance Criteria
- [ ] Demo-set images resolve to AEM Assets references (ingested or matched) and render on the pilot pages.
- [ ] A manifest exists (`s3_url → aem_assets_ref`, method, confidence) and is consumed by the import rewrite.
- [ ] Unmatched images fall back gracefully (reference-in-place) and are logged — no broken images.
- [ ] Low-confidence matches are flagged for manual review, not auto-applied.
- [ ] Masters-only (no derivative ladder ingested); logical-image dedup applied.

## Dependencies
- Upstream: SKODA-501 (masters-only ingest), SKODA-601 (import infra: the rewrite hook)
- Downstream: SKODA-603 (pilot pages), SKODA-803 (bulk import — M2 scale-out), SKODA-801 (story image refs)

## Risks / Flags
- **🟠 Instance existence unconfirmed (demo-critical, deck §9):** whether Škoda has an AEM Assets instance at all — own vs. a shared group instance vs. provision one — is open and gates this ticket. Fallback if none in time: serve approved demo images from the content pipeline, cut over later.
- **Scenario A/B unconfirmed** — the gating decision (once an instance exists); likely mixed. **AEM Assets contents/metadata not verified** (no access) → filename-match viability unknown until inspected.
- **M2 cost is rights + dedup + unmatched**, not upload — schedule driver needs stakeholder input (ties to D5 = AEM Assets, now resolved as the DAM).
- Perceptual-hash false-match rate → confidence threshold + manual review required.
- No-CORS CDN → hashing must run server-side / in the import job, not the browser.
- `[RUNTIME-UNCONFIRMED]`: rendered fidelity of Assets-delivered vs original renditions — verify in browser.

## Implemented (2026-09-21)
Manifest-driven ingest pipeline built + tested: **[`tools/importer/media/`](../../../tools/importer/media/README.md)** (Scenario B, masters-only, AEMaaCS 3-step direct-binary-upload, **page-mirrored** `/content/dam/storyboard/<page-path>/<file>`, per-step status, resumable). Details + findings in [`docs/media/SKODA-ASSET-MAPPING.md` §9](../../media/SKODA-ASSET-MAPPING.md). Demo-subset ACs met on the Elroq set (mock-DAM verified end-to-end; live run gated on the custom IMS token). Cart-original resolver (Mechanism B) emits `content/media-index.json` for SKODA-505.
